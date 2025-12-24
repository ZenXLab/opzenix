import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ConnectionType = 'github' | 'kubernetes' | 'registry' | 'vault' | 'otel';

interface ConnectionHealth {
  type: ConnectionType;
  status: 'healthy' | 'degraded' | 'failed' | 'unknown';
  lastChecked: string | null;
  message: string | null;
  blocksCI: boolean;
  blocksCD: boolean;
  blocksDeploy: boolean;
}

interface GatingState {
  canExecuteCI: boolean;
  canExecuteCD: boolean;
  canDeploy: boolean;
  blockingReasons: string[];
  connectionHealth: ConnectionHealth[];
  loading: boolean;
}

/**
 * MVP 1.0.0 Connection Gating Rules:
 * - GitHub fails → Block ALL executions
 * - AKS fails → Block CD only (CI allowed)
 * - ACR fails → Block deployments
 * - Vault fails → Block deployments
 * - OTel fails → Allow with "Limited Observability" warning
 */
export const useConnectionGating = () => {
  const [state, setState] = useState<GatingState>({
    canExecuteCI: true,
    canExecuteCD: true,
    canDeploy: true,
    blockingReasons: [],
    connectionHealth: [],
    loading: true,
  });

  const evaluateGating = useCallback((connections: any[]) => {
    const health: ConnectionHealth[] = [];
    const reasons: string[] = [];

    // GitHub connection check
    const githubConns = connections.filter(c => c.type === 'github');
    const githubHealthy = githubConns.some(c => c.status === 'connected' && c.validated);
    health.push({
      type: 'github',
      status: githubHealthy ? 'healthy' : (githubConns.length > 0 ? 'failed' : 'unknown'),
      lastChecked: githubConns[0]?.last_validated_at || null,
      message: githubHealthy ? 'GitHub App connected' : 'GitHub connection required',
      blocksCI: true,
      blocksCD: true,
      blocksDeploy: true,
    });

    // Kubernetes (AKS) connection check
    const k8sConns = connections.filter(c => c.type === 'kubernetes' || c.type === 'azure');
    const aksHealthy = k8sConns.some(c => 
      c.status === 'connected' && 
      c.validated && 
      c.resource_status?.aks?.status === 'ok'
    );
    health.push({
      type: 'kubernetes',
      status: aksHealthy ? 'healthy' : (k8sConns.length > 0 ? 'failed' : 'unknown'),
      lastChecked: k8sConns[0]?.last_validated_at || null,
      message: aksHealthy ? 'AKS cluster reachable' : 'AKS connection required for CD',
      blocksCI: false,
      blocksCD: true,
      blocksDeploy: true,
    });

    // Registry (ACR) connection check
    const acrHealthy = k8sConns.some(c => 
      c.status === 'connected' && 
      c.validated && 
      c.resource_status?.acr?.status === 'ok'
    );
    health.push({
      type: 'registry',
      status: acrHealthy ? 'healthy' : (k8sConns.length > 0 ? 'failed' : 'unknown'),
      lastChecked: k8sConns[0]?.last_validated_at || null,
      message: acrHealthy ? 'ACR accessible' : 'ACR connection required for deployment',
      blocksCI: false,
      blocksCD: false,
      blocksDeploy: true,
    });

    // Vault connection check
    const vaultConns = connections.filter(c => c.type === 'vault');
    const vaultHealthy = vaultConns.some(c => 
      c.status === 'connected' && 
      c.validated
    ) || k8sConns.some(c => c.resource_status?.key_vault?.status === 'ok');
    health.push({
      type: 'vault',
      status: vaultHealthy ? 'healthy' : (vaultConns.length > 0 || k8sConns.length > 0 ? 'failed' : 'unknown'),
      lastChecked: vaultConns[0]?.last_validated_at || k8sConns[0]?.last_validated_at || null,
      message: vaultHealthy ? 'Key Vault accessible' : 'Vault connection required for deployment',
      blocksCI: false,
      blocksCD: false,
      blocksDeploy: true,
    });

    // OTel connection check (non-blocking)
    const otelConns = connections.filter(c => c.type === 'otel');
    const otelHealthy = otelConns.some(c => c.status === 'connected' && c.validated);
    health.push({
      type: 'otel',
      status: otelHealthy ? 'healthy' : 'degraded',
      lastChecked: otelConns[0]?.last_validated_at || null,
      message: otelHealthy ? 'OpenTelemetry connected' : 'Limited observability mode',
      blocksCI: false,
      blocksCD: false,
      blocksDeploy: false,
    });

    // Evaluate blocking
    let canCI = true;
    let canCD = true;
    let canDeploy = true;

    for (const h of health) {
      if (h.status === 'failed' || h.status === 'unknown') {
        if (h.blocksCI) {
          canCI = false;
          reasons.push(`CI blocked: ${h.message}`);
        }
        if (h.blocksCD) {
          canCD = false;
          if (!reasons.includes(`CD blocked: ${h.message}`)) {
            reasons.push(`CD blocked: ${h.message}`);
          }
        }
        if (h.blocksDeploy) {
          canDeploy = false;
          if (!reasons.includes(`Deploy blocked: ${h.message}`)) {
            reasons.push(`Deploy blocked: ${h.message}`);
          }
        }
      }
    }

    setState({
      canExecuteCI: canCI,
      canExecuteCD: canCD,
      canDeploy: canDeploy,
      blockingReasons: [...new Set(reasons)],
      connectionHealth: health,
      loading: false,
    });
  }, []);

  useEffect(() => {
    const fetchAndEvaluate = async () => {
      try {
        const { data: connections } = await supabase
          .from('connections' as any)
          .select('*');

        evaluateGating(connections || []);
      } catch (err) {
        console.error('[useConnectionGating] Error:', err);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchAndEvaluate();

    // Subscribe to connection changes
    const channel = supabase
      .channel('connection-gating')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'connections'
      }, () => {
        fetchAndEvaluate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [evaluateGating]);

  return state;
};
