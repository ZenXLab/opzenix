import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWidgetRealtime } from '@/hooks/useWidgetRealtime';
import { cn } from '@/lib/utils';

interface SLOSnapshotWidgetProps {
  id: string;
  onRemove: (id: string) => void;
}

interface SLOMetric {
  name: string;
  target: number;
  current: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export function SLOSnapshotWidget({ id, onRemove }: SLOSnapshotWidgetProps) {
  const { data, loading, refresh } = useWidgetRealtime({
    widgetType: 'slo-snapshot',
    refreshInterval: 60,
  });

  // Mock SLO data
  const slos: SLOMetric[] = [
    { name: 'Availability', target: 99.9, current: 99.97, unit: '%', trend: 'up' },
    { name: 'Latency P99', target: 200, current: 145, unit: 'ms', trend: 'down' },
    { name: 'Error Rate', target: 0.1, current: 0.05, unit: '%', trend: 'stable' },
  ];

  const getStatus = (metric: SLOMetric) => {
    const ratio = metric.name === 'Error Rate' || metric.name.includes('Latency')
      ? metric.target / metric.current
      : metric.current / metric.target;

    if (ratio >= 1) return 'green';
    if (ratio >= 0.95) return 'amber';
    return 'red';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'bg-sec-safe text-sec-safe';
      case 'amber':
        return 'bg-sec-warning text-sec-warning';
      case 'red':
        return 'bg-sec-danger text-sec-danger';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTrendIcon = (trend: SLOMetric['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-sec-safe" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-sec-danger" />;
      default:
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">SLO Snapshot</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refresh}>
          <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Status Summary */}
      <div className="flex items-center justify-center gap-2">
        {['green', 'amber', 'red'].map((status) => {
          const count = slos.filter((s) => getStatus(s) === status).length;
          return (
            <div
              key={status}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full',
                `${getStatusColor(status).split(' ')[0]}/10`
              )}
            >
              <div className={cn('w-2 h-2 rounded-full', getStatusColor(status).split(' ')[0])} />
              <span className="text-xs font-medium">{count}</span>
            </div>
          );
        })}
      </div>

      {/* SLO List */}
      <div className="space-y-2">
        {slos.map((slo, idx) => {
          const status = getStatus(slo);
          return (
            <motion.div
              key={slo.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center justify-between p-2 rounded-lg border border-border bg-card"
            >
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', getStatusColor(status).split(' ')[0])} />
                <span className="text-sm text-foreground">{slo.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {slo.current}
                  {slo.unit}
                </span>
                <span className="text-xs text-muted-foreground">/ {slo.target}{slo.unit}</span>
                {getTrendIcon(slo.trend)}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground pt-2 border-t border-border">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-sec-safe" /> Meeting Target
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-sec-warning" /> At Risk
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-sec-danger" /> Below Target
        </span>
      </div>
    </div>
  );
}

export default SLOSnapshotWidget;
