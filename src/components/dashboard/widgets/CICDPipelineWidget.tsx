import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Timer,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface PipelineMetrics {
  successRate: number;
  avgDuration: number;
  totalRuns: number;
  failedRuns: number;
  trend: 'up' | 'down' | 'stable';
}

interface RecentRun {
  id: string;
  name: string;
  branch: string;
  status: 'success' | 'failed' | 'running' | 'pending';
  duration: string;
  timestamp: string;
  environment: string;
}

interface CICDPipelineWidgetProps {
  id?: string;
  onRemove?: (id: string) => void;
}

export const CICDPipelineWidget = ({ id, onRemove }: CICDPipelineWidgetProps) => {
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        // Fetch recent executions
        const { data: executions } = await supabase
          .from('executions')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(10);

        if (executions && executions.length > 0) {
          const successCount = executions.filter((e) => e.status === 'success').length;
          const failedCount = executions.filter((e) => e.status === 'failed').length;
          
          setMetrics({
            successRate: Math.round((successCount / executions.length) * 100),
            avgDuration: 245,
            totalRuns: executions.length,
            failedRuns: failedCount,
            trend: successCount > failedCount ? 'up' : 'down',
          });

          setRecentRuns(
            executions.slice(0, 5).map((e) => ({
              id: e.id,
              name: e.name,
              branch: e.branch || 'main',
              status: e.status as RecentRun['status'],
              duration: e.completed_at
                ? `${Math.round((new Date(e.completed_at).getTime() - new Date(e.started_at).getTime()) / 1000)}s`
                : 'Running',
              timestamp: new Date(e.started_at).toLocaleTimeString(),
              environment: e.environment,
            }))
          );
        } else {
          // Mock data
          setMetrics({
            successRate: 94,
            avgDuration: 245,
            totalRuns: 156,
            failedRuns: 9,
            trend: 'up',
          });

          setRecentRuns([
            {
              id: '1',
              name: 'Build & Deploy',
              branch: 'main',
              status: 'success',
              duration: '3m 42s',
              timestamp: '10 min ago',
              environment: 'PROD',
            },
            {
              id: '2',
              name: 'Build & Deploy',
              branch: 'feature/auth',
              status: 'running',
              duration: '1m 15s',
              timestamp: '5 min ago',
              environment: 'DEV',
            },
            {
              id: '3',
              name: 'Security Scan',
              branch: 'main',
              status: 'success',
              duration: '5m 18s',
              timestamp: '25 min ago',
              environment: 'STAGING',
            },
            {
              id: '4',
              name: 'Integration Tests',
              branch: 'bugfix/api',
              status: 'failed',
              duration: '2m 01s',
              timestamp: '1 hour ago',
              environment: 'UAT',
            },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch pipeline data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPipelineData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('executions-widget')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'executions' },
        () => {
          fetchPipelineData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusIcon = (status: RecentRun['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      case 'running':
        return <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />;
      case 'pending':
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: RecentRun['status']) => {
    const styles = {
      success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      failed: 'bg-red-500/10 text-red-500 border-red-500/30',
      running: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      pending: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    };
    return styles[status];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">CI/CD Pipeline</span>
        </div>
        <div className="flex items-center gap-1">
          {metrics?.trend === 'up' ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          )}
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/30 text-center">
            <p className="text-lg font-bold text-primary">{metrics.successRate}%</p>
            <p className="text-[9px] text-muted-foreground uppercase">Success</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border border-border text-center">
            <p className="text-lg font-bold text-foreground">{metrics.avgDuration}s</p>
            <p className="text-[9px] text-muted-foreground uppercase">Avg Time</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border border-border text-center">
            <p className="text-lg font-bold text-foreground">{metrics.totalRuns}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Total</p>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
            <p className="text-lg font-bold text-red-500">{metrics.failedRuns}</p>
            <p className="text-[9px] text-red-500/80 uppercase">Failed</p>
          </div>
        </div>
      )}

      {/* Recent Runs */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Recent Runs</p>
        {recentRuns.map((run) => (
          <motion.div
            key={run.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2.5 rounded-lg bg-muted/30 border border-border"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {getStatusIcon(run.status)}
                <span className="text-sm font-medium text-foreground">{run.name}</span>
              </div>
              <Badge variant="outline" className={cn('text-[9px]', getStatusBadge(run.status))}>
                {run.status.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  {run.branch}
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  {run.duration}
                </span>
              </div>
              <Badge variant="secondary" className="text-[9px] h-4">
                {run.environment}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CICDPipelineWidget;
