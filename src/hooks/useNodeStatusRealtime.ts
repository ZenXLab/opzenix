import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Real-time subscription for node-level status updates
 * Used to update: React Flow node states based on execution_nodes table
 */
export function useNodeStatusRealtime(
  executionId: string | null,
  onNodeUpdate: (nodeId: string, status: string, data: any) => void
) {
  const memoizedCallback = useCallback(onNodeUpdate, []);

  useEffect(() => {
    if (!executionId) return;

    console.log(`[Realtime] Subscribing to node status for execution: ${executionId}`);

    const channel = supabase
      .channel(`nodes-${executionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'execution_nodes',
          filter: `execution_id=eq.${executionId}`,
        },
        (payload) => {
          console.log('[Realtime] Node update:', payload);
          const node = payload.new as any;
          if (node) {
            memoizedCallback(node.node_id, node.status, node);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Node status channel: ${status}`);
      });

    return () => {
      console.log(`[Realtime] Unsubscribing from nodes for execution: ${executionId}`);
      supabase.removeChannel(channel);
    };
  }, [executionId, memoizedCallback]);
}
