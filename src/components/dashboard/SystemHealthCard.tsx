import { motion } from 'framer-motion';
import { Activity, Shield, Cpu, Database, Wifi, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthItem {
  name: string;
  status: 'healthy' | 'degraded' | 'critical';
  latency?: string;
}

const healthItems: HealthItem[] = [
  { name: 'API Gateway', status: 'healthy', latency: '12ms' },
  { name: 'Build Runners', status: 'healthy', latency: '45ms' },
  { name: 'Database', status: 'healthy', latency: '8ms' },
  { name: 'Security Scanner', status: 'healthy', latency: '120ms' },
  { name: 'Container Registry', status: 'degraded', latency: '230ms' },
];

const statusConfig = {
  healthy: { icon: CheckCircle2, color: 'text-sec-safe', bg: 'bg-sec-safe/10', label: 'Operational' },
  degraded: { icon: AlertTriangle, color: 'text-sec-warning', bg: 'bg-sec-warning/10', label: 'Degraded' },
  critical: { icon: XCircle, color: 'text-sec-critical', bg: 'bg-sec-critical/10', label: 'Critical' },
};

const SystemHealthCard = () => {
  const overallStatus = healthItems.some(h => h.status === 'critical') 
    ? 'critical' 
    : healthItems.some(h => h.status === 'degraded') 
      ? 'degraded' 
      : 'healthy';

  const config = statusConfig[overallStatus];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card border border-border rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-ai-primary" />
          <h3 className="text-sm font-medium text-foreground">System Health</h3>
        </div>
        <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-xs', config.bg, config.color)}>
          <StatusIcon className="w-3 h-3" />
          <span>{config.label}</span>
        </div>
      </div>

      {/* Health Items */}
      <div className="p-4 space-y-3">
        {healthItems.map((item, index) => {
          const itemConfig = statusConfig[item.status];
          const ItemIcon = itemConfig.icon;
          
          return (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('w-1.5 h-1.5 rounded-full', 
                  item.status === 'healthy' && 'bg-sec-safe',
                  item.status === 'degraded' && 'bg-sec-warning animate-pulse',
                  item.status === 'critical' && 'bg-sec-critical animate-pulse'
                )} />
                <span className="text-sm text-foreground">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.latency && (
                  <span className="text-xs text-muted-foreground font-mono">{item.latency}</span>
                )}
                <ItemIcon className={cn('w-3.5 h-3.5', itemConfig.color)} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-secondary/20 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Last checked: <span className="text-foreground">Just now</span> • Uptime: <span className="text-sec-safe">99.97%</span>
        </p>
      </div>
    </motion.div>
  );
};

export default SystemHealthCard;
