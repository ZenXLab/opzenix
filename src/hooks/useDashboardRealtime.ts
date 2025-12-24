import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FlowType } from '@/stores/flowStore';

export interface DashboardMetrics {
  totalExecutions: number;
  runningExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  pendingApprovals: number;
  activeDeployments: number;
  successRate: number;
}

export interface ExecutionRecord {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'warning' | 'failed' | 'paused';
  environment: string;
  branch: string | null;
  commit_hash: string | null;
  progress: number | null;
  started_at: string;
  completed_at: string | null;
  flow_template_id: string | null;
  metadata: Record<string, any> | null;
}

export interface DeploymentRecord {
  id: string;
  execution_id: string | null;
  environment: string;
  version: string;
  status: string;
  deployed_at: string;
  deployed_by: string | null;
}

export interface ApprovalRecord {
  id: string;
  execution_id: string;
  node_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  required_approvals: number;
  current_approvals: number;
  created_at: string;
}

export function useDashboardRealtime(flowType?: FlowType) {
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalExecutions: 0,
    runningExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    pendingApprovals: 0,
    activeDeployments: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);

  const calculateMetrics = useCallback((execs: ExecutionRecord[], deps: DeploymentRecord[], apps: ApprovalRecord[]) => {
    const total = execs.length;
    const running = execs.filter(e => e.status === 'running').length;
    const successful = execs.filter(e => e.status === 'success').length;
    const failed = execs.filter(e => e.status === 'failed').length;
    const pending = apps.filter(a => a.status === 'pending').length;
    const activeDeployments = deps.filter(d => d.status === 'running').length;
    const completed = successful + failed;
    const successRate = completed > 0 ? Math.round((successful / completed) * 100) : 0;

    setMetrics({
      totalExecutions: total,
      runningExecutions: running,
      successfulExecutions: successful,
      failedExecutions: failed,
      pendingApprovals: pending,
      activeDeployments: activeDeployments,
      successRate,
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [executionsRes, deploymentsRes, approvalsRes] = await Promise.all([
        supabase
          .from('executions')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(100),
        supabase
          .from('deployments')
          .select('*')
          .order('deployed_at', { ascending: false })
          .limit(50),
        supabase
          .from('approval_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      const execs = (executionsRes.data || []) as ExecutionRecord[];
      const deps = (deploymentsRes.data || []) as DeploymentRecord[];
      const apps = (approvalsRes.data || []) as ApprovalRecord[];

      setExecutions(execs);
      setDeployments(deps);
      setApprovals(apps);
      calculateMetrics(execs, deps, apps);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [calculateMetrics]);

  useEffect(() => {
    fetchData();

    // Subscribe to real-time updates
    const executionsChannel = supabase
      .channel('dashboard-executions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'executions'
      }, (payload) => {
        setExecutions(prev => {
          let updated: ExecutionRecord[];
          if (payload.eventType === 'INSERT') {
            updated = [payload.new as ExecutionRecord, ...prev];
          } else if (payload.eventType === 'UPDATE') {
            updated = prev.map(e => e.id === (payload.new as any).id ? payload.new as ExecutionRecord : e);
          } else if (payload.eventType === 'DELETE') {
            updated = prev.filter(e => e.id !== (payload.old as any).id);
          } else {
            updated = prev;
          }
          // Recalculate metrics
          calculateMetrics(updated, deployments, approvals);
          return updated;
        });
      })
      .subscribe();

    const deploymentsChannel = supabase
      .channel('dashboard-deployments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deployments'
      }, (payload) => {
        setDeployments(prev => {
          let updated: DeploymentRecord[];
          if (payload.eventType === 'INSERT') {
            updated = [payload.new as DeploymentRecord, ...prev];
          } else if (payload.eventType === 'UPDATE') {
            updated = prev.map(d => d.id === (payload.new as any).id ? payload.new as DeploymentRecord : d);
          } else if (payload.eventType === 'DELETE') {
            updated = prev.filter(d => d.id !== (payload.old as any).id);
          } else {
            updated = prev;
          }
          calculateMetrics(executions, updated, approvals);
          return updated;
        });
      })
      .subscribe();

    const approvalsChannel = supabase
      .channel('dashboard-approvals')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'approval_requests'
      }, (payload) => {
        setApprovals(prev => {
          let updated: ApprovalRecord[];
          if (payload.eventType === 'INSERT') {
            updated = [payload.new as ApprovalRecord, ...prev];
          } else if (payload.eventType === 'UPDATE') {
            updated = prev.map(a => a.id === (payload.new as any).id ? payload.new as ApprovalRecord : a);
          } else if (payload.eventType === 'DELETE') {
            updated = prev.filter(a => a.id !== (payload.old as any).id);
          } else {
            updated = prev;
          }
          calculateMetrics(executions, deployments, updated);
          return updated;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(executionsChannel);
      supabase.removeChannel(deploymentsChannel);
      supabase.removeChannel(approvalsChannel);
    };
  }, [fetchData, calculateMetrics, executions, deployments, approvals]);

  return {
    executions,
    deployments,
    approvals,
    metrics,
    loading,
    refetch: fetchData,
  };
}
