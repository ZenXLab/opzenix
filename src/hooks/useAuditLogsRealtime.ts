import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type AuditLogRow = Tables<'audit_logs'>;

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

interface AuditLogsFilters {
  search?: string;
  actionFilter?: string;
  resourceFilter?: string;
  environmentFilter?: string;
  executionId?: string;
  startDate?: string;
  endDate?: string;
}

// Convert database row to our interface
const mapRowToAuditLog = (row: AuditLogRow): AuditLog => ({
  id: row.id,
  user_id: row.user_id,
  action: row.action,
  resource_type: row.resource_type,
  resource_id: row.resource_id,
  details: (row.details as Record<string, unknown>) || {},
  ip_address: row.ip_address,
  created_at: row.created_at
});

export const useAuditLogsRealtime = (filters: AuditLogsFilters = {}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch logs from database
  const fetchLogs = useCallback(async () => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(200);

      // Apply filters
      if (filters.actionFilter && filters.actionFilter !== 'all') {
        query = query.ilike('action', `%${filters.actionFilter}%`);
      }

      if (filters.resourceFilter && filters.resourceFilter !== 'all') {
        query = query.eq('resource_type', filters.resourceFilter);
      }

      if (filters.executionId) {
        query = query.eq('resource_id', filters.executionId);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('[useAuditLogsRealtime] Fetch error:', error);
        throw error;
      }

      setLogs((data || []).map(mapRowToAuditLog));
      setTotalCount(count || 0);
    } catch (err) {
      console.error('[useAuditLogsRealtime] Error:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters.actionFilter, filters.resourceFilter, filters.executionId, filters.startDate, filters.endDate]);

  // Filtered logs with search
  const filteredLogs = useMemo(() => {
    if (!filters.search) return logs;
    
    const searchLower = filters.search.toLowerCase();
    return logs.filter(log => 
      log.action.toLowerCase().includes(searchLower) ||
      log.resource_type.toLowerCase().includes(searchLower) ||
      log.resource_id?.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.details).toLowerCase().includes(searchLower)
    );
  }, [logs, filters.search]);

  // Set up realtime subscription
  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel('audit-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          console.log('[useAuditLogsRealtime] New audit log:', payload);
          // Prepend new log to the top
          const newLog = mapRowToAuditLog(payload.new as AuditLogRow);
          setLogs(prev => [newLog, ...prev.slice(0, 199)]);
          setTotalCount(prev => prev + 1);
        }
      )
      .subscribe((status) => {
        console.log('[useAuditLogsRealtime] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  // Log an action (utility function)
  const logAction = useCallback(async (
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, unknown>
  ) => {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action,
          resource_type: resourceType,
          resource_id: resourceId || null,
          details: details || {}
        } as any);

      if (error) throw error;
    } catch (err) {
      console.error('[useAuditLogsRealtime] Log error:', err);
    }
  }, []);

  return {
    logs: filteredLogs,
    allLogs: logs,
    loading,
    isConnected,
    totalCount,
    refetch: fetchLogs,
    logAction
  };
};
