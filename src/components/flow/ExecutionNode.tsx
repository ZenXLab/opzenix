import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { 
  GitBranch, 
  Pause, 
  RotateCcw, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Clock, 
  Zap,
  Shield,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExecutionNodeData extends Record<string, unknown> {
  label: string;
  status: 'idle' | 'running' | 'success' | 'warning' | 'failed' | 'paused';
  type: 'stage' | 'checkpoint' | 'gate';
  description?: string;
  duration?: string;
  isCheckpoint?: boolean;
}

interface ExecutionNodeProps {
  data: ExecutionNodeData;
  selected?: boolean;
}

const statusConfig = {
  idle: {
    icon: Clock,
    className: 'node-idle',
    iconClass: 'text-muted-foreground',
  },
  running: {
    icon: Zap,
    className: 'node-running animate-subtle-pulse',
    iconClass: 'text-node-running',
  },
  success: {
    icon: CheckCircle2,
    className: 'node-success',
    iconClass: 'text-node-success',
  },
  warning: {
    icon: AlertCircle,
    className: 'node-warning',
    iconClass: 'text-node-warning',
  },
  failed: {
    icon: XCircle,
    className: 'node-failed',
    iconClass: 'text-node-failed',
  },
  paused: {
    icon: Pause,
    className: 'node-paused',
    iconClass: 'text-node-paused',
  },
};

const ExecutionNode = ({ data, selected }: ExecutionNodeProps) => {
  const config = statusConfig[data.status];
  const StatusIcon = config.icon;
  const isCheckpoint = data.type === 'checkpoint';
  const isGate = data.type === 'gate';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative group cursor-pointer transition-smooth',
        'min-w-[180px] rounded-md border-2 bg-card/80 backdrop-blur-sm',
        config.className,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isCheckpoint && 'border-dashed border-node-checkpoint bg-node-checkpoint/5',
        isGate && 'border-node-paused'
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-edge !border-2 !border-card"
      />

      {/* Node Content */}
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            'flex items-center justify-center w-6 h-6 rounded',
            data.status === 'running' ? 'bg-node-running/20' : 'bg-secondary'
          )}>
            <StatusIcon className={cn('w-4 h-4', config.iconClass)} />
          </div>
          <span className="text-sm font-medium text-foreground truncate">
            {data.label}
          </span>
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {data.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {data.duration && (
            <span className="text-xs text-muted-foreground font-mono">
              {data.duration}
            </span>
          )}
          
          {/* Quick Actions - Visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isCheckpoint && (
              <>
                <button 
                  className="p-1 rounded hover:bg-secondary transition-colors"
                  title="Rollback to checkpoint"
                >
                  <RotateCcw className="w-3 h-3 text-muted-foreground" />
                </button>
                <button 
                  className="p-1 rounded hover:bg-secondary transition-colors"
                  title="Branch from checkpoint"
                >
                  <GitBranch className="w-3 h-3 text-muted-foreground" />
                </button>
              </>
            )}
            <button 
              className="p-1 rounded hover:bg-secondary transition-colors"
              title="Inspect"
            >
              <Eye className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Checkpoint Badge */}
        {isCheckpoint && (
          <div className="absolute -top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-node-checkpoint/20 text-node-checkpoint border border-node-checkpoint/40 rounded">
            Checkpoint
          </div>
        )}

        {/* Gate Badge */}
        {isGate && (
          <div className="absolute -top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-node-paused/20 text-node-paused border border-node-paused/40 rounded flex items-center gap-1">
            <Shield className="w-2.5 h-2.5" />
            Gate
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-edge !border-2 !border-card"
      />

      {/* Selection Indicator */}
      {selected && (
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full pl-2">
          <ChevronRight className="w-4 h-4 text-primary" />
        </div>
      )}
    </motion.div>
  );
};

export default memo(ExecutionNode);
