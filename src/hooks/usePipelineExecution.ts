import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Node, Edge } from '@xyflow/react';
import { toast } from 'sonner';

export interface ExecutionState {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'warning' | 'failed' | 'paused';
  progress: number;
  startedAt: string;
  completedAt?: string;
}

export interface NodeExecutionState {
  nodeId: string;
  status: 'idle' | 'running' | 'success' | 'warning' | 'failed' | 'paused';
  logs: string[];
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

interface UsePipelineExecutionOptions {
  onNodeStatusChange?: (nodeId: string, status: string) => void;
  onExecutionComplete?: (success: boolean) => void;
}

export function usePipelineExecution(options: UsePipelineExecutionOptions = {}) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionState, setExecutionState] = useState<ExecutionState | null>(null);
  const [nodeStates, setNodeStates] = useState<Map<string, NodeExecutionState>>(new Map());
  const [error, setError] = useState<string | null>(null);

  // Subscribe to execution updates
  useEffect(() => {
    if (!executionState?.id) return;

    console.log('[usePipelineExecution] Subscribing to execution:', executionState.id);

    // Subscribe to execution record changes
    const executionChannel = supabase
      .channel(`execution-${executionState.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'executions',
          filter: `id=eq.${executionState.id}`,
        },
        (payload) => {
          console.log('[usePipelineExecution] Execution update:', payload.new);
          const newState = payload.new as any;
          setExecutionState(prev => ({
            ...prev!,
            status: newState.status,
            progress: newState.progress,
            completedAt: newState.completed_at,
          }));

          if (newState.status === 'success' || newState.status === 'failed') {
            setIsExecuting(false);
            options.onExecutionComplete?.(newState.status === 'success');
            
            if (newState.status === 'success') {
              toast.success('Pipeline completed successfully');
            } else {
              toast.error('Pipeline execution failed');
            }
          } else if (newState.status === 'paused') {
            toast.info('Pipeline paused - awaiting approval');
          }
        }
      )
      .subscribe();

    // Subscribe to node status changes
    const nodesChannel = supabase
      .channel(`execution-nodes-${executionState.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'execution_nodes',
          filter: `execution_id=eq.${executionState.id}`,
        },
        (payload) => {
          const nodeData = payload.new as any;
          console.log('[usePipelineExecution] Node update:', nodeData.node_id, nodeData.status);
          
          setNodeStates(prev => {
            const next = new Map(prev);
            next.set(nodeData.node_id, {
              nodeId: nodeData.node_id,
              status: nodeData.status,
              logs: nodeData.logs || [],
              startedAt: nodeData.started_at,
              completedAt: nodeData.completed_at,
              durationMs: nodeData.duration_ms,
            });
            return next;
          });

          options.onNodeStatusChange?.(nodeData.node_id, nodeData.status);
        }
      )
      .subscribe();

    return () => {
      console.log('[usePipelineExecution] Unsubscribing from channels');
      supabase.removeChannel(executionChannel);
      supabase.removeChannel(nodesChannel);
    };
  }, [executionState?.id, options.onNodeStatusChange, options.onExecutionComplete]);

  const startExecution = useCallback(async (
    nodes: Node[],
    edges: Edge[],
    config: {
      environment?: string;
      branch?: string;
      commitHash?: string;
      flowType?: string;
    } = {}
  ) => {
    setIsExecuting(true);
    setError(null);
    setNodeStates(new Map());

    try {
      console.log('[usePipelineExecution] Starting execution...');
      
      // Transform nodes for the edge function
      const pipelineNodes = nodes.map(node => ({
        id: node.id,
        type: node.type || 'pipelineStage',
        data: node.data as any,
        position: node.position,
      }));

      const pipelineEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      }));

      const { data, error: invokeError } = await supabase.functions.invoke('pipeline-execute', {
        body: {
          nodes: pipelineNodes,
          edges: pipelineEdges,
          environment: config.environment || 'development',
          branch: config.branch || 'main',
          commitHash: config.commitHash,
          flowType: config.flowType,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Execution failed to start');
      }

      console.log('[usePipelineExecution] Execution started:', data);
      
      setExecutionState({
        id: data.executionId,
        name: data.executionName,
        status: 'running',
        progress: 0,
        startedAt: new Date().toISOString(),
      });

      toast.success(`Pipeline execution started`, {
        description: `ID: ${data.executionId.slice(0, 8)}...`,
      });

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start execution';
      console.error('[usePipelineExecution] Error:', message);
      setError(message);
      setIsExecuting(false);
      toast.error('Failed to start pipeline', { description: message });
      return null;
    }
  }, []);

  const stopExecution = useCallback(async () => {
    if (!executionState?.id) return;

    try {
      await supabase
        .from('executions')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', executionState.id);

      setIsExecuting(false);
      toast.info('Pipeline execution stopped');
    } catch (err) {
      console.error('[usePipelineExecution] Failed to stop:', err);
    }
  }, [executionState?.id]);

  const getNodeStatus = useCallback((nodeId: string): NodeExecutionState | undefined => {
    return nodeStates.get(nodeId);
  }, [nodeStates]);

  return {
    isExecuting,
    executionState,
    nodeStates,
    error,
    startExecution,
    stopExecution,
    getNodeStatus,
  };
}
