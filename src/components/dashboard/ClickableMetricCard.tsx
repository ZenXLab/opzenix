import { motion } from 'framer-motion';
import { LucideIcon, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClickableMetricCardProps {
  label: string;
  value: string | number;
  change?: { value: string; positive: boolean };
  icon: LucideIcon;
  iconColor?: string;
  onClick?: () => void;
  tooltip?: string;
  metricId?: string;
}

const ClickableMetricCard = ({ 
  label, 
  value, 
  change, 
  icon: Icon, 
  iconColor = 'text-primary',
  onClick,
  tooltip,
  metricId
}: ClickableMetricCardProps) => {
  return (
    <motion.div 
      whileHover={{ scale: onClick ? 1.02 : 1, y: onClick ? -2 : 0 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      className={cn(
        "p-3 sm:p-4 rounded-lg border border-border bg-card transition-all duration-200",
        onClick && "cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        "group relative"
      )}
      onClick={onClick}
      title={tooltip}
      data-metric-id={metricId}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {label}
            </p>
            {onClick && (
              <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-foreground">{value}</span>
            {change && (
              <span className={cn(
                "flex items-center text-xs font-medium",
                change.positive ? "text-sec-safe" : "text-sec-danger"
              )}>
                {change.positive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {change.value}
              </span>
            )}
          </div>
        </div>
        <div className={cn("p-2 rounded-lg bg-secondary/50", iconColor && iconColor.replace('text-', 'bg-').replace(/^bg-/, 'bg-') + '/10')}>
          <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", iconColor)} />
        </div>
      </div>
      
      {/* Subtle hover indicator */}
      {onClick && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg" />
      )}
    </motion.div>
  );
};

export default ClickableMetricCard;
