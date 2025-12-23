import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFlowStore, NodeStatus } from '@/stores/flowStore';
import { useToast } from '@/hooks/use-toast';

export const useRealtimeUpdates = () => {
  const { updateExecutionStatus, addApprovalRequest } = useFlowStore();
  const { toast } = useToast();

  const handleExecutionUpdate = useCallback((payload: any) => {
    console.log('Execution update received:', payload);
    const { new: newRecord } = payload;
    
    if (newRecord) {
      updateExecutionStatus(
        newRecord.id,
        newRecord.status as NodeStatus,
        newRecord.progress || 0
      );

      // Show toast for important status changes
      if (newRecord.status === 'failed') {
        toast({
          title: 'Execution Failed',
          description: `${newRecord.name} has failed`,
          variant: 'destructive',
        });
      } else if (newRecord.status === 'success') {
        toast({
          title: 'Execution Complete',
          description: `${newRecord.name} completed successfully`,
        });
      }
    }
  }, [updateExecutionStatus, toast]);

  const handleApprovalUpdate = useCallback((payload: any) => {
    console.log('Approval update received:', payload);
    const { new: newRecord, eventType } = payload;
    
    if (eventType === 'INSERT' && newRecord) {
      addApprovalRequest({
        id: newRecord.id,
        executionId: newRecord.execution_id,
        nodeId: newRecord.node_id,
        title: newRecord.title,
        description: newRecord.description,
        status: newRecord.status,
        requiredApprovals: newRecord.required_approvals,
        currentApprovals: newRecord.current_approvals,
        createdAt: newRecord.created_at,
      });

      toast({
        title: 'Approval Required',
        description: newRecord.title,
      });
    }
  }, [addApprovalRequest, toast]);

  useEffect(() => {
    console.log('Setting up realtime subscriptions...');

    const executionsChannel = supabase
      .channel('executions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'executions',
        },
        handleExecutionUpdate
      )
      .subscribe((status) => {
        console.log('Executions channel status:', status);
      });

    const approvalsChannel = supabase
      .channel('approvals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approval_requests',
        },
        handleApprovalUpdate
      )
      .subscribe((status) => {
        console.log('Approvals channel status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(executionsChannel);
      supabase.removeChannel(approvalsChannel);
    };
  }, [handleExecutionUpdate, handleApprovalUpdate]);
};
