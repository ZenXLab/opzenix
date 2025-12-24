import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  TrendingDown,
  Server,
  Gauge,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useSystemHealth } from '@/hooks/useSystemHealth';

interface SystemHealthWidgetProps {
  onRemove?: () => void;
}

export function SystemHealthWidget({ onRemove }: SystemHealthWidgetProps) {
  const { metrics, loading, refetch } = useSystemHealth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const statusConfig = {
    healthy: { 
      color: 'text-sec-safe', 
      bg: 'bg-sec-safe/20', 
      icon: CheckCircle2,
      label: 'All Systems Operational'
    },
    degraded: { 
      color: 'text-sec-warning', 
      bg: 'bg-sec-warning/20', 
      icon: AlertTriangle,
      label: 'Performance Degraded'
    },
    critical: { 
      color: 'text-sec-critical', 
      bg: 'bg-sec-critical/20', 
      icon: AlertTriangle,
      label: 'Critical Issues Detected'
    },
  };

  const status = statusConfig[metrics.status];
  const StatusIcon = status.icon;

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Server className="w-4 h-4" />
          System Health
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Status Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("p-3 rounded-lg flex items-center gap-3", status.bg)}
        >
          <StatusIcon className={cn("w-5 h-5", status.color)} />
          <div className="flex-1">
            <p className={cn("text-sm font-medium", status.color)}>{status.label}</p>
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <Badge variant="outline" className={status.color}>
            {metrics.uptime}% uptime
          </Badge>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Success Rate */}
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Success Rate</span>
              <TrendingUp className="w-3 h-3 text-sec-safe" />
            </div>
            <p className="text-lg font-semibold">{metrics.successRate}%</p>
            <Progress value={metrics.successRate} className="h-1 mt-1" />
          </div>

          {/* Error Rate */}
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Error Rate</span>
              {metrics.errorRate > 5 ? (
                <TrendingUp className="w-3 h-3 text-sec-critical" />
              ) : (
                <TrendingDown className="w-3 h-3 text-sec-safe" />
              )}
            </div>
            <p className="text-lg font-semibold">{metrics.errorRate}%</p>
            <Progress 
              value={metrics.errorRate} 
              className={cn("h-1 mt-1", metrics.errorRate > 5 && "[&>div]:bg-sec-critical")} 
            />
          </div>

          {/* Active Executions */}
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Active Flows</span>
              <Activity className="w-3 h-3 text-chart-1" />
            </div>
            <p className="text-lg font-semibold">{metrics.activeExecutions}</p>
            <p className="text-[10px] text-muted-foreground">Currently running</p>
          </div>

          {/* Deployments */}
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Deployments</span>
              <Zap className="w-3 h-3 text-chart-2" />
            </div>
            <p className="text-lg font-semibold">{metrics.deploymentsLast24h}</p>
            <p className="text-[10px] text-muted-foreground">Last 24 hours</p>
          </div>
        </div>

        {/* Latency Stats */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium">Response Latency</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-sm font-semibold">{metrics.latencyP50}ms</p>
              <p className="text-[9px] text-muted-foreground">P50</p>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="text-center">
              <p className="text-sm font-semibold">{metrics.latencyP95}ms</p>
              <p className="text-[9px] text-muted-foreground">P95</p>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="text-center">
              <p className="text-sm font-semibold">{metrics.avgDuration}ms</p>
              <p className="text-[9px] text-muted-foreground">Avg</p>
            </div>
          </div>
        </div>

        {/* Signal Summary */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sec-safe" />
              <span className="text-muted-foreground">{metrics.totalSignals - metrics.errorCount - metrics.warningCount} OK</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sec-warning" />
              <span className="text-muted-foreground">{metrics.warningCount} Warn</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sec-critical" />
              <span className="text-muted-foreground">{metrics.errorCount} Error</span>
            </span>
          </div>
          <span className="text-muted-foreground">
            <Clock className="w-3 h-3 inline mr-1" />
            24h signals: {metrics.totalSignals}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
