import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Execution = Tables<'executions'>;
type Deployment = Tables<'deployments'>;
type ApprovalRequest = Tables<'approval_requests'>;
type Checkpoint = Tables<'checkpoints'>;

interface ControlTowerState {
  // Executions
  executions: Execution[];
  activeExecutions: Execution[];
  
  // Deployments
  deployments: Deployment[];
  recentDeployments: Deployment[];
  failedDeployments: Deployment[];
  
  // Approvals
  approvalRequests: ApprovalRequest[];
  pendingApprovals: ApprovalRequest[];
  
  // Checkpoints
  checkpoints: Checkpoint[];
  
  // Meta
  loading: boolean;
  isConnected: boolean;
  lastUpdated: string | null;
}

export const useControlTowerRealtime = () => {
  const [state, setState] = useState<ControlTowerState>({
    executions: [],
    activeExecutions: [],
    deployments: [],
    recentDeployments: [],
    failedDeployments: [],
    approvalRequests: [],
    pendingApprovals: [],
    checkpoints: [],
    loading: true,
    isConnected: true,
    lastUpdated: null
  });

  // Fetch all data
  const fetchData = useCallback(async () => {
    console.log('[useControlTowerRealtime] Fetching data...');
    
    try {
      const [
        { data: executions },
        { data: deployments },
        { data: approvals },
        { data: checkpoints }
      ] = await Promise.all([
        supabase
          .from('executions')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(50),
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
        supabase
          .from('checkpoints')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      const executionsList = executions || [];
      const deploymentsList = deployments || [];
      const approvalsList = approvals || [];
      const checkpointsList = checkpoints || [];

      setState(prev => ({
        ...prev,
        executions: executionsList,
        activeExecutions: executionsList.filter(e => e.status === 'running' || e.status === 'paused'),
        deployments: deploymentsList,
        recentDeployments: deploymentsList.slice(0, 10),
        failedDeployments: deploymentsList.filter(d => d.status === 'failed'),
        approvalRequests: approvalsList,
        pendingApprovals: approvalsList.filter(a => a.status === 'pending'),
        checkpoints: checkpointsList,
        loading: false,
        lastUpdated: new Date().toISOString()
      }));

      console.log('[useControlTowerRealtime] Data fetched:', {
        executions: executionsList.length,
        deployments: deploymentsList.length,
        approvals: approvalsList.length,
        checkpoints: checkpointsList.length
      });
    } catch (err) {
      console.error('[useControlTowerRealtime] Fetch error:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Set up realtime subscriptions
  useEffect(() => {
    fetchData();

    // Subscribe to executions
    const executionsChannel = supabase
      .channel('executions-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'executions'
      }, (payload) => {
        console.log('[useControlTowerRealtime] Execution update:', payload);
        setState(prev => {
          let newExecutions = [...prev.executions];
          
          if (payload.eventType === 'INSERT') {
            newExecutions = [payload.new as Execution, ...newExecutions];
          } else if (payload.eventType === 'UPDATE') {
            newExecutions = newExecutions.map(e => 
              e.id === payload.new.id ? payload.new as Execution : e
            );
          } else if (payload.eventType === 'DELETE') {
            newExecutions = newExecutions.filter(e => e.id !== payload.old.id);
          }

          return {
            ...prev,
            executions: newExecutions,
            activeExecutions: newExecutions.filter(e => e.status === 'running' || e.status === 'paused'),
            lastUpdated: new Date().toISOString()
          };
        });
      })
      .subscribe((status) => {
        console.log('[useControlTowerRealtime] Executions subscription:', status);
      });

    // Subscribe to deployments
    const deploymentsChannel = supabase
      .channel('deployments-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deployments'
      }, (payload) => {
        console.log('[useControlTowerRealtime] Deployment update:', payload);
        setState(prev => {
          let newDeployments = [...prev.deployments];
          
          if (payload.eventType === 'INSERT') {
            newDeployments = [payload.new as Deployment, ...newDeployments];
          } else if (payload.eventType === 'UPDATE') {
            newDeployments = newDeployments.map(d => 
              d.id === payload.new.id ? payload.new as Deployment : d
            );
          } else if (payload.eventType === 'DELETE') {
            newDeployments = newDeployments.filter(d => d.id !== payload.old.id);
          }

          return {
            ...prev,
            deployments: newDeployments,
            recentDeployments: newDeployments.slice(0, 10),
            failedDeployments: newDeployments.filter(d => d.status === 'failed'),
            lastUpdated: new Date().toISOString()
          };
        });
      })
      .subscribe();

    // Subscribe to approval requests
    const approvalsChannel = supabase
      .channel('approvals-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'approval_requests'
      }, (payload) => {
        console.log('[useControlTowerRealtime] Approval update:', payload);
        setState(prev => {
          let newApprovals = [...prev.approvalRequests];
          
          if (payload.eventType === 'INSERT') {
            newApprovals = [payload.new as ApprovalRequest, ...newApprovals];
          } else if (payload.eventType === 'UPDATE') {
            newApprovals = newApprovals.map(a => 
              a.id === payload.new.id ? payload.new as ApprovalRequest : a
            );
          } else if (payload.eventType === 'DELETE') {
            newApprovals = newApprovals.filter(a => a.id !== payload.old.id);
          }

          return {
            ...prev,
            approvalRequests: newApprovals,
            pendingApprovals: newApprovals.filter(a => a.status === 'pending'),
            lastUpdated: new Date().toISOString()
          };
        });
      })
      .subscribe();

    // Subscribe to checkpoints
    const checkpointsChannel = supabase
      .channel('checkpoints-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'checkpoints'
      }, (payload) => {
        console.log('[useControlTowerRealtime] Checkpoint update:', payload);
        setState(prev => {
          let newCheckpoints = [...prev.checkpoints];
          
          if (payload.eventType === 'INSERT') {
            newCheckpoints = [payload.new as Checkpoint, ...newCheckpoints];
          } else if (payload.eventType === 'UPDATE') {
            newCheckpoints = newCheckpoints.map(c => 
              c.id === payload.new.id ? payload.new as Checkpoint : c
            );
          }

          return {
            ...prev,
            checkpoints: newCheckpoints,
            lastUpdated: new Date().toISOString()
          };
        });
      })
      .subscribe();

    // Connection status monitoring
    const statusInterval = setInterval(() => {
      setState(prev => ({
        ...prev,
        isConnected: executionsChannel.state === 'joined'
      }));
    }, 5000);

    return () => {
      clearInterval(statusInterval);
      supabase.removeChannel(executionsChannel);
      supabase.removeChannel(deploymentsChannel);
      supabase.removeChannel(approvalsChannel);
      supabase.removeChannel(checkpointsChannel);
    };
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData
  };
};
