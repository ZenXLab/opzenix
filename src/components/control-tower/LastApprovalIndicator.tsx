import { useEffect, useState } from 'react';
import { CheckCircle2, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface LastApproval {
  environment: string;
  approvedBy: string;
  timestamp: string;
  timeAgo: string;
}

const LastApprovalIndicator = () => {
  const [lastApproval, setLastApproval] = useState<LastApproval | null>(null);

  useEffect(() => {
    const fetchLastApproval = async () => {
      try {
        // Get the most recent approved request
        const { data: approvalData, error } = await supabase
          .from('approval_requests')
          .select(`
            *,
            executions (environment)
          `)
          .eq('status', 'approved')
          .order('resolved_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !approvalData) {
          // Try audit logs as fallback
          const { data: auditData } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('action', 'approval.approved')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (auditData) {
            const details = auditData.details as Record<string, unknown> || {};
            setLastApproval({
              environment: (details.environment as string) || 'Unknown',
              approvedBy: auditData.user_id || 'System',
              timestamp: auditData.created_at,
              timeAgo: formatTimeAgo(new Date(auditData.created_at))
            });
          }
          return;
        }

        const execEnv = (approvalData.executions as any)?.environment || 'Unknown';
        
        setLastApproval({
          environment: execEnv,
          approvedBy: approvalData.requested_by || 'Operator',
          timestamp: approvalData.resolved_at || approvalData.created_at,
          timeAgo: formatTimeAgo(new Date(approvalData.resolved_at || approvalData.created_at))
        });
      } catch (err) {
        console.error('[LastApprovalIndicator] Error:', err);
      }
    };

    fetchLastApproval();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('last-approval')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'approval_requests',
        filter: 'status=eq.approved'
      }, fetchLastApproval)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!lastApproval) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground px-4 py-2 bg-muted/30 rounded-lg">
      <CheckCircle2 className="w-3.5 h-3.5 text-sec-safe" />
      <span>Last Approval:</span>
      <span className="text-foreground font-medium capitalize">{lastApproval.environment}</span>
      <span className="text-muted-foreground">by</span>
      <span className="text-foreground font-medium">
        {lastApproval.approvedBy.split('-')[0] || 'Operator'}
      </span>
      <span className="text-muted-foreground">({lastApproval.timeAgo})</span>
    </div>
  );
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default LastApprovalIndicator;
