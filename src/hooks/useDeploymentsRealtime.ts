import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DeploymentUpdate {
  id: string;
  execution_id: string | null;
  environment: string;
  version: string;
  status: string;
  deployed_at: string;
  deployed_by: string | null;
}

/**
 * Real-time subscription for deployment status updates
 * Used for: Environment lane status updates
 */
export function useDeploymentsRealtime(
  executionId: string | null,
  onDeployUpdate: (deployment: DeploymentUpdate) => void
) {
  const memoizedCallback = useCallback(onDeployUpdate, []);

  useEffect(() => {
    if (!executionId) return;

    console.log(`[Realtime] Subscribing to deployments for execution: ${executionId}`);

    const channel = supabase
      .channel(`deployments-${executionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deployments',
          filter: `execution_id=eq.${executionId}`,
        },
        (payload) => {
          console.log('[Realtime] Deployment update:', payload);
          const dep = payload.new as any;
          if (dep) {
            memoizedCallback({
              id: dep.id,
              execution_id: dep.execution_id,
              environment: dep.environment,
              version: dep.version,
              status: dep.status,
              deployed_at: dep.deployed_at,
              deployed_by: dep.deployed_by,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Deployments channel: ${status}`);
      });

    return () => {
      console.log(`[Realtime] Unsubscribing from deployments for: ${executionId}`);
      supabase.removeChannel(channel);
    };
  }, [executionId, memoizedCallback]);
}
