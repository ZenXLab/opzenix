import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFlowStore, NodeStatus, FlowType } from '@/stores/flowStore';

export interface ExecutionRecord {
  id: string;
  name: string;
  status: NodeStatus;
  progress: number;
  environment: string;
  branch: string | null;
  commit_hash: string | null;
  started_at: string;
  completed_at: string | null;
  flow_template_id: string | null;
  metadata: Record<string, any>;
  flow_type?: FlowType;
}

export interface ExecutionNode {
  id: string;
  execution_id: string;
  node_id: string;
  status: NodeStatus;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  logs: string[] | null;
  metadata: Record<string, any>;
}

export interface ExecutionLog {
  id: string;
  execution_id: string;
  node_id: string;
  message: string;
  level: 'info' | 'warn' | 'error';
  created_at: string;
}

export interface Checkpoint {
  id: string;
  execution_id: string;
  node_id: string;
  name: string;
  state: Record<string, any>;
  created_at: string;
}

export const useExecutionHistory = (flowType?: FlowType) => {
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch executions from Supabase
  const fetchExecutions = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('executions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Map to execution records with flow type inference
      const mappedExecutions: ExecutionRecord[] = (data || []).map((exec: any) => ({
        id: exec.id,
        name: exec.name,
        status: exec.status as NodeStatus,
        progress: exec.progress || 0,
        environment: exec.environment,
        branch: exec.branch,
        commit_hash: exec.commit_hash,
        started_at: exec.started_at,
        completed_at: exec.completed_at,
        flow_template_id: exec.flow_template_id,
        metadata: exec.metadata || {},
        flow_type: inferFlowType(exec.name, exec.metadata),
      }));

      // Filter by flow type if specified
      const filtered = flowType 
        ? mappedExecutions.filter(e => e.flow_type === flowType)
        : mappedExecutions;

      setExecutions(filtered);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch executions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [flowType]);

  // Fetch nodes for a specific execution
  const fetchExecutionNodes = useCallback(async (executionId: string): Promise<ExecutionNode[]> => {
    const { data, error } = await supabase
      .from('execution_nodes')
      .select('*')
      .eq('execution_id', executionId)
      .order('started_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch execution nodes:', error);
      return [];
    }

    return (data || []).map((node: any) => ({
      id: node.id,
      execution_id: node.execution_id,
      node_id: node.node_id,
      status: node.status as NodeStatus,
      started_at: node.started_at,
      completed_at: node.completed_at,
      duration_ms: node.duration_ms,
      logs: node.logs,
      metadata: node.metadata || {},
    }));
  }, []);

  // Fetch logs for a specific execution
  const fetchExecutionLogs = useCallback(async (executionId: string, nodeId?: string): Promise<ExecutionLog[]> => {
    let query = supabase
      .from('execution_logs')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true });

    if (nodeId) {
      query = query.eq('node_id', nodeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch execution logs:', error);
      return [];
    }

    return (data || []).map((log: any) => ({
      id: log.id,
      execution_id: log.execution_id,
      node_id: log.node_id,
      message: log.message,
      level: log.level as 'info' | 'warn' | 'error',
      created_at: log.created_at,
    }));
  }, []);

  // Fetch checkpoints for a specific execution
  const fetchCheckpoints = useCallback(async (executionId: string): Promise<Checkpoint[]> => {
    const { data, error } = await supabase
      .from('checkpoints')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch checkpoints:', error);
      return [];
    }

    return (data || []).map((cp: any) => ({
      id: cp.id,
      execution_id: cp.execution_id,
      node_id: cp.node_id,
      name: cp.name,
      state: cp.state || {},
      created_at: cp.created_at,
    }));
  }, []);

  // Set up realtime subscriptions
  useEffect(() => {
    fetchExecutions();

    // Subscribe to execution changes
    const executionsChannel = supabase
      .channel('executions-history')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'executions' },
        (payload) => {
          console.log('Execution change:', payload);
          if (payload.eventType === 'INSERT') {
            const newExec = payload.new as any;
            const mapped: ExecutionRecord = {
              id: newExec.id,
              name: newExec.name,
              status: newExec.status as NodeStatus,
              progress: newExec.progress || 0,
              environment: newExec.environment,
              branch: newExec.branch,
              commit_hash: newExec.commit_hash,
              started_at: newExec.started_at,
              completed_at: newExec.completed_at,
              flow_template_id: newExec.flow_template_id,
              metadata: newExec.metadata || {},
              flow_type: inferFlowType(newExec.name, newExec.metadata),
            };
            if (!flowType || mapped.flow_type === flowType) {
              setExecutions(prev => [mapped, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            setExecutions(prev => prev.map(e => 
              e.id === updated.id 
                ? {
                    ...e,
                    status: updated.status as NodeStatus,
                    progress: updated.progress || e.progress,
                    completed_at: updated.completed_at,
                  }
                : e
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(executionsChannel);
    };
  }, [fetchExecutions, flowType]);

  return {
    executions,
    loading,
    error,
    refetch: fetchExecutions,
    fetchExecutionNodes,
    fetchExecutionLogs,
    fetchCheckpoints,
  };
};

// Helper to infer flow type from execution name/metadata
function inferFlowType(name: string, metadata: Record<string, any>): FlowType {
  const nameLower = name.toLowerCase();
  if (metadata?.flow_type) return metadata.flow_type as FlowType;
  if (nameLower.includes('ml') || nameLower.includes('model') || nameLower.includes('train')) return 'mlops';
  if (nameLower.includes('llm') || nameLower.includes('prompt') || nameLower.includes('gpt')) return 'llmops';
  if (nameLower.includes('infra') || nameLower.includes('terraform') || nameLower.includes('k8s')) return 'infrastructure';
  if (nameLower.includes('security') || nameLower.includes('scan') || nameLower.includes('vuln')) return 'security';
  return 'cicd';
}
