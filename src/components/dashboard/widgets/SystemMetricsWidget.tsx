import { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Wifi, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import WidgetWrapper from './WidgetWrapper';
import { cn } from '@/lib/utils';

interface SystemMetricsWidgetProps {
  id: string;
  onRemove?: (id: string) => void;
}

const SystemMetricsWidget = ({ id, onRemove }: SystemMetricsWidgetProps) => {
  const [metrics, setMetrics] = useState({
    cpu: 42,
    memory: 68,
    network: 23,
    disk: 71,
    requests: 1247,
    latency: 45,
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.min(100, Math.max(10, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.min(100, Math.max(30, prev.memory + (Math.random() - 0.5) * 5)),
        network: Math.min(100, Math.max(5, prev.network + (Math.random() - 0.5) * 15)),
        disk: prev.disk,
        requests: prev.requests + Math.floor(Math.random() * 50),
        latency: Math.max(10, Math.min(200, prev.latency + (Math.random() - 0.5) * 20)),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (value: number, thresholds = { warn: 70, critical: 90 }) => {
    if (value >= thresholds.critical) return 'text-sec-critical';
    if (value >= thresholds.warn) return 'text-sec-warning';
    return 'text-sec-safe';
  };

  const getProgressColor = (value: number, thresholds = { warn: 70, critical: 90 }) => {
    if (value >= thresholds.critical) return 'bg-sec-critical';
    if (value >= thresholds.warn) return 'bg-sec-warning';
    return 'bg-sec-safe';
  };

  return (
    <WidgetWrapper
      id={id}
      title="System Metrics"
      icon={<Activity className="w-3.5 h-3.5 text-ai-primary" />}
      onRemove={onRemove}
    >
      <div className="space-y-4">
        {/* CPU */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">CPU</span>
            </div>
            <span className={cn("text-xs font-medium", getHealthColor(metrics.cpu))}>
              {metrics.cpu.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500", getProgressColor(metrics.cpu))}
              style={{ width: `${metrics.cpu}%` }}
            />
          </div>
        </div>

        {/* Memory */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Memory</span>
            </div>
            <span className={cn("text-xs font-medium", getHealthColor(metrics.memory))}>
              {metrics.memory.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500", getProgressColor(metrics.memory))}
              style={{ width: `${metrics.memory}%` }}
            />
          </div>
        </div>

        {/* Network */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Network I/O</span>
            </div>
            <span className={cn("text-xs font-medium", getHealthColor(metrics.network, { warn: 60, critical: 80 }))}>
              {metrics.network.toFixed(0)} MB/s
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500", getProgressColor(metrics.network, { warn: 60, critical: 80 }))}
              style={{ width: `${metrics.network}%` }}
            />
          </div>
        </div>

        {/* Disk */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Disk</span>
            </div>
            <span className={cn("text-xs font-medium", getHealthColor(metrics.disk, { warn: 80, critical: 95 }))}>
              {metrics.disk}%
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500", getProgressColor(metrics.disk, { warn: 80, critical: 95 }))}
              style={{ width: `${metrics.disk}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <div className="p-2 bg-secondary/30 rounded">
            <p className="text-[10px] text-muted-foreground">Requests/min</p>
            <p className="text-sm font-semibold text-foreground">{metrics.requests.toLocaleString()}</p>
          </div>
          <div className="p-2 bg-secondary/30 rounded">
            <p className="text-[10px] text-muted-foreground">Avg Latency</p>
            <p className="text-sm font-semibold text-foreground">{metrics.latency.toFixed(0)}ms</p>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default SystemMetricsWidget;
