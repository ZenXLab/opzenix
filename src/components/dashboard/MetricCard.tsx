import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: {
    value: string;
    positive: boolean;
  };
  icon: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'stable';
}

const MetricCard = ({ label, value, change, icon: Icon, iconColor = 'text-ai-primary' }: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-md bg-secondary/50', iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
        {change && (
          <span className={cn(
            'text-xs font-medium px-1.5 py-0.5 rounded',
            change.positive ? 'text-sec-safe bg-sec-safe/10' : 'text-sec-critical bg-sec-critical/10'
          )}>
            {change.positive ? '+' : ''}{change.value}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-2xl font-semibold text-foreground tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
    </motion.div>
  );
};

export default MetricCard;
