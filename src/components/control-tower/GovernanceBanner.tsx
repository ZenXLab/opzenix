import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Unlock, AlertTriangle, XCircle, Clock, CheckCircle2,
  GitBranch, Play, Shield, ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ExecutionWithGovernance {
  id: string;
  name: string;
  branch: string | null;
  commit_hash: string | null;
  environment: string;
  status: string;
  governance_status: string | null;
  blocked_reason: string | null;
  started_at: string;
}

interface PendingApproval {
  id: string;
  execution_id: string;
  title: string;
  description: string | null;
  required_approvals: number;
  current_approvals: number;
  status: string;
}

interface GovernanceBannerProps {
  onViewApprovals?: () => void;
  onViewExecution?: (executionId: string) => void;
}

export const GovernanceBanner = ({ onViewApprovals, onViewExecution }: GovernanceBannerProps) => {
  const [blockedExecutions, setBlockedExecutions] = useState<ExecutionWithGovernance[]>([]);
  const [pausedExecutions, setPausedExecutions] = useState<ExecutionWithGovernance[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);

  useEffect(() => {
    fetchGovernanceData();
    
    const channel = supabase
      .channel('governance-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'executions',
      }, fetchGovernanceData)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'approval_requests',
      }, fetchGovernanceData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGovernanceData = async () => {
    // Fetch blocked executions
    const { data: blocked } = await supabase
      .from('executions')
      .select('*')
      .eq('governance_status', 'blocked')
      .order('started_at', { ascending: false })
      .limit(5);

    // Fetch paused executions (awaiting approval)
    const { data: paused } = await supabase
      .from('executions')
      .select('*')
      .eq('governance_status', 'awaiting_approval')
      .order('started_at', { ascending: false })
      .limit(5);

    // Fetch pending approvals
    const { data: approvals } = await supabase
      .from('approval_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (blocked) setBlockedExecutions(blocked as ExecutionWithGovernance[]);
    if (paused) setPausedExecutions(paused as ExecutionWithGovernance[]);
    if (approvals) setPendingApprovals(approvals as PendingApproval[]);
  };

  const totalIssues = blockedExecutions.length + pausedExecutions.length + pendingApprovals.length;

  if (totalIssues === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-2"
      >
        {/* Blocked Executions */}
        {blockedExecutions.map((exec) => (
          <motion.div
            key={exec.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-3 rounded-lg bg-sec-critical/10 border border-sec-critical/30"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-sec-critical/20">
                <XCircle className="w-4 h-4 text-sec-critical" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sec-critical">Blocked</span>
                  <Badge variant="outline" className="text-xs">
                    <GitBranch className="w-3 h-3 mr-1" />
                    {exec.branch || 'unknown'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {exec.environment}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {exec.blocked_reason || 'Branch not allowed for this environment'}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onViewExecution?.(exec.id)}
            >
              View Details
            </Button>
          </motion.div>
        ))}

        {/* Paused Executions (Awaiting Approval) */}
        {pausedExecutions.map((exec) => (
          <motion.div
            key={exec.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-3 rounded-lg bg-sec-warning/10 border border-sec-warning/30"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-sec-warning/20 animate-pulse">
                <Lock className="w-4 h-4 text-sec-warning" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sec-warning">Deployment Locked</span>
                  <Badge variant="outline" className="text-xs">
                    {exec.environment}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {exec.blocked_reason || `Awaiting approval for ${exec.environment} deployment`}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewApprovals}
              className="border-sec-warning text-sec-warning hover:bg-sec-warning/10"
            >
              <Shield className="w-4 h-4 mr-1" />
              View Approval
            </Button>
          </motion.div>
        ))}

        {/* Pending Approvals Summary */}
        {pendingApprovals.length > 0 && pausedExecutions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="font-medium">
                  {pendingApprovals.length} Pending Approval{pendingApprovals.length !== 1 ? 's' : ''}
                </span>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {pendingApprovals[0]?.title}
                  {pendingApprovals.length > 1 && ` and ${pendingApprovals.length - 1} more`}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewApprovals}
            >
              Review All
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default GovernanceBanner;
