import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Connection {
  id: string;
  user_id: string | null;
  type: 'github' | 'azure' | 'kubernetes' | 'vault';
  name: string;
  provider: string;
  status: 'connected' | 'pending' | 'validating' | 'error' | 'invalid' | 'rate-limited';
  validated: boolean;
  validation_message: string | null;
  last_validated_at: string | null;
  resource_status: {
    acr?: { status: string; message: string; latencyMs?: number; details?: Record<string, unknown> };
    aks?: { status: string; message: string; latencyMs?: number; details?: Record<string, unknown> };
    key_vault?: { status: string; message: string; latencyMs?: number; details?: Record<string, unknown> };
    azure_ad?: { status: string; message: string; latencyMs?: number; details?: Record<string, unknown> };
  };
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface AzureValidationRequest {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  subscriptionId: string;
  acrName?: string;
  aksClusterName?: string;
  aksResourceGroup?: string;
  keyVaultName?: string;
}

export const useConnectionsRealtime = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // Fetch connections from database using raw SQL via RPC or direct fetch
  const fetchConnections = useCallback(async () => {
    try {
      // Use type assertion since connections table is new
      const { data, error } = await (supabase
        .from('connections' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (error) {
        console.error('[useConnectionsRealtime] Fetch error:', error);
        // If table doesn't exist yet, return empty array
        if (error.code === '42P01') {
          setConnections([]);
          return;
        }
        throw error;
      }

      setConnections((data as Connection[]) || []);
    } catch (err) {
      console.error('[useConnectionsRealtime] Error:', err);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new connection
  const createConnection = useCallback(async (
    type: Connection['type'],
    name: string,
    config: Record<string, unknown>
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await (supabase
        .from('connections' as any)
        .insert({
          type,
          name,
          provider: type === 'azure' || type === 'kubernetes' || type === 'vault' ? 'azure' : type,
          status: 'pending',
          validated: false,
          config,
          user_id: userData?.user?.id,
        })
        .select()
        .single() as any);

      if (error) throw error;

      toast.success(`Connection "${name}" created`);
      return data as Connection;
    } catch (err) {
      console.error('[useConnectionsRealtime] Create error:', err);
      toast.error('Failed to create connection');
      return null;
    }
  }, []);

  // Validate Azure connection (real API call)
  const validateAzureConnection = useCallback(async (
    connectionId: string,
    credentials: AzureValidationRequest
  ) => {
    setValidatingId(connectionId);

    try {
      // Update status to validating
      await (supabase
        .from('connections' as any)
        .update({ status: 'validating' })
        .eq('id', connectionId) as any);

      console.log('[useConnectionsRealtime] Starting Azure validation...');

      // Call the real azure-validate edge function
      const { data, error } = await supabase.functions.invoke('azure-validate', {
        body: credentials
      });

      if (error) {
        console.error('[useConnectionsRealtime] Validation error:', error);
        throw error;
      }

      console.log('[useConnectionsRealtime] Validation result:', data);

      // Map results to resource_status format
      const resourceStatus: Connection['resource_status'] = {};
      
      if (data.results) {
        for (const result of data.results) {
          const key = result.service.toLowerCase().replace(' ', '_');
          if (key === 'azure_ad' || key === 'azure ad') {
            resourceStatus.azure_ad = {
              status: result.status,
              message: result.message,
              latencyMs: result.latencyMs,
              details: result.details
            };
          } else if (key === 'acr') {
            resourceStatus.acr = {
              status: result.status,
              message: result.message,
              latencyMs: result.latencyMs,
              details: result.details
            };
          } else if (key === 'aks') {
            resourceStatus.aks = {
              status: result.status,
              message: result.message,
              latencyMs: result.latencyMs,
              details: result.details
            };
          } else if (key === 'key_vault' || key === 'key vault') {
            resourceStatus.key_vault = {
              status: result.status,
              message: result.message,
              latencyMs: result.latencyMs,
              details: result.details
            };
          }
        }
      }

      const isHealthy = data.summary?.overallStatus === 'healthy';

      // Update connection with validation results
      await (supabase
        .from('connections' as any)
        .update({
          status: isHealthy ? 'connected' : 'error',
          validated: isHealthy,
          validation_message: isHealthy 
            ? `Validated: ${data.summary?.successful || 0}/${data.summary?.totalServices || 0} services` 
            : `Failed: ${data.summary?.failed || 0} services`,
          last_validated_at: new Date().toISOString(),
          resource_status: resourceStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId) as any);

      // Log to audit
      await supabase
        .from('audit_logs')
        .insert({
          action: isHealthy ? 'connection.validated' : 'connection.validation_failed',
          resource_type: 'connection',
          resource_id: connectionId,
          details: { 
            summary: data.summary,
            resourceStatus
          }
        } as any);

      if (isHealthy) {
        toast.success('Azure connection validated successfully');
      } else {
        toast.error(`Validation failed: ${data.summary?.failed || 0} services unreachable`);
      }

      return data;
    } catch (err) {
      console.error('[useConnectionsRealtime] Validation error:', err);
      
      // Update connection with error
      await (supabase
        .from('connections' as any)
        .update({
          status: 'error',
          validated: false,
          validation_message: 'Validation request failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId) as any);

      toast.error('Connection validation failed');
      return null;
    } finally {
      setValidatingId(null);
    }
  }, []);

  // Delete connection
  const deleteConnection = useCallback(async (connectionId: string) => {
    try {
      const { error } = await (supabase
        .from('connections' as any)
        .delete()
        .eq('id', connectionId) as any);

      if (error) throw error;

      // Log to audit
      await supabase
        .from('audit_logs')
        .insert({
          action: 'connection.deleted',
          resource_type: 'connection',
          resource_id: connectionId,
          details: {}
        } as any);

      toast.success('Connection removed');
    } catch (err) {
      console.error('[useConnectionsRealtime] Delete error:', err);
      toast.error('Failed to delete connection');
    }
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    fetchConnections();

    const channel = supabase
      .channel('connections-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections'
        },
        (payload) => {
          console.log('[useConnectionsRealtime] Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setConnections(prev => [payload.new as Connection, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setConnections(prev => 
              prev.map(c => c.id === (payload.new as any).id ? payload.new as Connection : c)
            );
          } else if (payload.eventType === 'DELETE') {
            setConnections(prev => prev.filter(c => c.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe((status) => {
        console.log('[useConnectionsRealtime] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConnections]);

  return {
    connections,
    loading,
    validatingId,
    isConnected,
    createConnection,
    validateAzureConnection,
    deleteConnection,
    refetch: fetchConnections
  };
};
