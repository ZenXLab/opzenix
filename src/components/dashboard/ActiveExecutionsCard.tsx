import { motion } from 'framer-motion';
import { Play, CheckCircle2, XCircle, Pause, Clock, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFlowStore, Execution } from '@/stores/flowStore';
import { cn } from '@/lib/utils';

const statusConfig = {
  running: { icon: Zap, color: 'text-node-running', bg: 'bg-node-running/10', label: 'Running' },
  success: { icon: CheckCircle2, color: 'text-node-success', bg: 'bg-node-success/10', label: 'Success' },
  warning: { icon: Clock, color: 'text-node-warning', bg: 'bg-node-warning/10', label: 'Warning' },
  failed: { icon: XCircle, color: 'text-node-failed', bg: 'bg-node-failed/10', label: 'Failed' },
  paused: { icon: Pause, color: 'text-node-paused', bg: 'bg-node-paused/10', label: 'Paused' },
  idle: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/10', label: 'Idle' },
};

interface ActiveExecutionsCardProps {
  onViewAll?: () => void;
}

const ActiveExecutionsCard = ({ onViewAll }: ActiveExecutionsCardProps) => {
  const { executions, setSelectedExecution } = useFlowStore();
  
  const activeExecutions = executions.filter(e => 
    e.status === 'running' || e.status === 'paused'
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-card border border-border rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-ai-primary" />
          <h3 className="text-sm font-medium text-foreground">Active Executions</h3>
          <span className="text-xs text-muted-foreground">({activeExecutions.length})</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onViewAll}>
          View All
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Executions List */}
      <div className="divide-y divide-border">
        {activeExecutions.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-sec-safe mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No active executions</p>
            <p className="text-xs text-muted-foreground mt-1">All pipelines are idle</p>
          </div>
        ) : (
          activeExecutions.map((execution) => (
            <ExecutionRow 
              key={execution.id} 
              execution={execution}
              onSelect={() => setSelectedExecution(execution)}
            />
          ))
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="px-4 py-3 bg-secondary/20 border-t border-border grid grid-cols-4 gap-4">
        {Object.entries(
          executions.reduce((acc, e) => {
            acc[e.status] = (acc[e.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([status, count]) => {
          const config = statusConfig[status as keyof typeof statusConfig];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <div key={status} className="flex items-center gap-1.5">
              <Icon className={cn('w-3 h-3', config.color)} />
              <span className="text-xs text-foreground font-medium">{count}</span>
              <span className="text-xs text-muted-foreground capitalize">{status}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

interface ExecutionRowProps {
  execution: Execution;
  onSelect: () => void;
}

const ExecutionRow = ({ execution, onSelect }: ExecutionRowProps) => {
  const config = statusConfig[execution.status];
  const StatusIcon = config.icon;

  return (
    <button
      onClick={onSelect}
      className="w-full p-4 text-left hover:bg-secondary/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground truncate">{execution.name}</span>
            <span className={cn('px-1.5 py-0.5 text-[10px] rounded uppercase tracking-wider', config.bg, config.color)}>
              {execution.flowType}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">{execution.commit}</span>
            <span>{execution.branch}</span>
            <span>{execution.environment}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('w-4 h-4', config.color, execution.status === 'running' && 'animate-pulse')} />
        </div>
      </div>

      {execution.status === 'running' && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-mono text-foreground">{execution.progress}%</span>
          </div>
          <Progress value={execution.progress} className="h-1" />
        </div>
      )}
    </button>
  );
};

export default ActiveExecutionsCard;
