import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  XCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface RiskState {
  awaitingApproval: number;
  failedExecutions: number;
  blockedDeployments: number;
  securityBlocked: number;
}

interface SystemRiskBannerProps {
  onViewApprovals?: () => void;
  onViewExecution?: (id: string) => void;
}

const SystemRiskBanner = ({ onViewApprovals, onViewExecution }: SystemRiskBannerProps) => {
  const [risks, setRisks] = useState<RiskState>({
    awaitingApproval: 0,
    failedExecutions: 0,
    blockedDeployments: 0,
    securityBlocked: 0
  });
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        // Fetch pending approvals
        const { count: approvalCount } = await supabase
          .from('approval_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Fetch failed/paused executions
        const { count: failedCount } = await supabase
          .from('executions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'failed');

        const { count: pausedCount } = await supabase
          .from('executions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'paused');

        // Fetch recent failed deployments (last 24h)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: blockedCount } = await supabase
          .from('deployments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'failed')
          .gte('deployed_at', yesterday);

        setRisks({
          awaitingApproval: approvalCount || 0,
          failedExecutions: failedCount || 0,
          blockedDeployments: blockedCount || 0,
          securityBlocked: pausedCount || 0 // Using paused as security blocked indicator
        });
      } catch (err) {
        console.error('[SystemRiskBanner] Error fetching risks:', err);
      }
    };

    fetchRisks();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('risk-banner')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approval_requests' }, fetchRisks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'executions' }, fetchRisks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deployments' }, fetchRisks)
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalRisks = risks.awaitingApproval + risks.failedExecutions + risks.blockedDeployments + risks.securityBlocked;

  // Don't show banner if no risks
  if (totalRisks === 0 && isConnected) return null;

  const riskMessages = [];

  if (risks.awaitingApproval > 0) {
    riskMessages.push({
      icon: Clock,
      message: `${risks.awaitingApproval} Execution${risks.awaitingApproval > 1 ? 's' : ''} Awaiting Approval`,
      severity: 'warning' as const,
      action: onViewApprovals
    });
  }

  if (risks.blockedDeployments > 0) {
    riskMessages.push({
      icon: XCircle,
      message: `${risks.blockedDeployments} Production Deployment${risks.blockedDeployments > 1 ? 's' : ''} Failed`,
      severity: 'error' as const
    });
  }

  if (risks.failedExecutions > 0) {
    riskMessages.push({
      icon: AlertTriangle,
      message: `${risks.failedExecutions} Execution${risks.failedExecutions > 1 ? 's' : ''} Failed`,
      severity: 'error' as const
    });
  }

  if (risks.securityBlocked > 0) {
    riskMessages.push({
      icon: ShieldAlert,
      message: `${risks.securityBlocked} Execution${risks.securityBlocked > 1 ? 's' : ''} Paused/Blocked`,
      severity: 'warning' as const
    });
  }

  if (!isConnected) {
    riskMessages.unshift({
      icon: AlertTriangle,
      message: 'Live connection lost — data may be stale',
      severity: 'error' as const
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-2"
      >
        {riskMessages.map((risk, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'flex items-center justify-between px-4 py-2.5 rounded-lg border',
              risk.severity === 'error' 
                ? 'bg-sec-critical/10 border-sec-critical/30' 
                : 'bg-sec-warning/10 border-sec-warning/30'
            )}
          >
            <div className="flex items-center gap-3">
              <risk.icon className={cn(
                'w-4 h-4',
                risk.severity === 'error' ? 'text-sec-critical' : 'text-sec-warning'
              )} />
              <span className={cn(
                'text-sm font-medium',
                risk.severity === 'error' ? 'text-sec-critical' : 'text-sec-warning'
              )}>
                {risk.message}
              </span>
            </div>
            {risk.action && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 gap-1 text-xs"
                onClick={risk.action}
              >
                View <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

export default SystemRiskBanner;
