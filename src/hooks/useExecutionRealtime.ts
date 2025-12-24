import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Real-time subscription for execution-level updates
 * Used to update: Flow status, Global execution state, Start/finish transitions
 */
export function useExecutionRealtime(
  executionId: string | null,
  onUpdate: (payload: any) => void
) {
  const memoizedOnUpdate = useCallback(onUpdate, []);

  useEffect(() => {
    if (!executionId) return;

    console.log(`[Realtime] Subscribing to execution: ${executionId}`);

    const channel = supabase
      .channel(`execution-${executionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'executions',
          filter: `id=eq.${executionId}`,
        },
        (payload) => {
          console.log('[Realtime] Execution update:', payload);
          memoizedOnUpdate(payload);
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Execution channel status: ${status}`);
      });

    return () => {
      console.log(`[Realtime] Unsubscribing from execution: ${executionId}`);
      supabase.removeChannel(channel);
    };
  }, [executionId, memoizedOnUpdate]);
}
