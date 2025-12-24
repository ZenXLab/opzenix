import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Checkpoint {
  id: string;
  execution_id: string;
  node_id: string;
  name: string;
  state: Record<string, any>;
  created_at: string;
}

/**
 * Real-time subscription for checkpoint creation
 * Used for: Flow checkpoint markers, enabling "Re-run from here"
 */
export function useCheckpointsRealtime(
  executionId: string | null,
  onCheckpoint: (checkpoint: Checkpoint) => void
) {
  const memoizedCallback = useCallback(onCheckpoint, []);

  useEffect(() => {
    if (!executionId) return;

    console.log(`[Realtime] Subscribing to checkpoints for execution: ${executionId}`);

    const channel = supabase
      .channel(`checkpoints-${executionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'checkpoints',
          filter: `execution_id=eq.${executionId}`,
        },
        (payload) => {
          console.log('[Realtime] Checkpoint created:', payload);
          const cp = payload.new as any;
          memoizedCallback({
            id: cp.id,
            execution_id: cp.execution_id,
            node_id: cp.node_id,
            name: cp.name,
            state: cp.state || {},
            created_at: cp.created_at,
          });
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Checkpoints channel: ${status}`);
      });

    return () => {
      console.log(`[Realtime] Unsubscribing from checkpoints for: ${executionId}`);
      supabase.removeChannel(channel);
    };
  }, [executionId, memoizedCallback]);
}
