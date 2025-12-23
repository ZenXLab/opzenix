import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  Play, CheckCircle2, AlertTriangle, XCircle, Pause, 
  GitBranch, Shield, Box, Sparkles, Database, Cloud,
  Lock, RefreshCw, Eye, Rocket, Terminal, Settings,
  Code, TestTube, Scan, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Node status type matching Opzenix design tokens
export type NodeStatus = 'idle' | 'running' | 'success' | 'warning' | 'failed' | 'paused' | 'checkpoint';

// Stage types for the pipeline
export type StageType = 
  | 'source' | 'build' | 'test' | 'security' | 'deploy' 
  | 'approval' | 'checkpoint' | 'rollback' | 'condition' | 'parallel';

interface PipelineNodeData {
  label: string;
  stageType: StageType;
  status: NodeStatus;
  description?: string;
  duration?: string;
  isEditing?: boolean;
}

const stageIcons: Record<StageType, React.ReactNode> = {
  source: <GitBranch className="w-4 h-4" />,
  build: <Box className="w-4 h-4" />,
  test: <TestTube className="w-4 h-4" />,
  security: <Scan className="w-4 h-4" />,
  deploy: <Rocket className="w-4 h-4" />,
  approval: <Shield className="w-4 h-4" />,
  checkpoint: <Database className="w-4 h-4" />,
  rollback: <RefreshCw className="w-4 h-4" />,
  condition: <GitBranch className="w-4 h-4" />,
  parallel: <ArrowRight className="w-4 h-4" />,
};

const statusIcons: Record<NodeStatus, React.ReactNode> = {
  idle: null,
  running: <Play className="w-3 h-3" />,
  success: <CheckCircle2 className="w-3 h-3" />,
  warning: <AlertTriangle className="w-3 h-3" />,
  failed: <XCircle className="w-3 h-3" />,
  paused: <Pause className="w-3 h-3" />,
  checkpoint: <Database className="w-3 h-3" />,
};

const getNodeClasses = (status: NodeStatus) => {
  const baseClasses = 'px-4 py-3 rounded-lg border-2 min-w-[160px] transition-all duration-200';
  
  switch (status) {
    case 'running':
      return cn(baseClasses, 'bg-node-running/15 border-node-running/60 shadow-[0_0_12px_hsl(var(--node-running)/0.3)]');
    case 'success':
      return cn(baseClasses, 'bg-node-success/15 border-node-success/60');
    case 'warning':
      return cn(baseClasses, 'bg-node-warning/15 border-node-warning/60');
    case 'failed':
      return cn(baseClasses, 'bg-node-failed/15 border-node-failed/60');
    case 'paused':
      return cn(baseClasses, 'bg-node-paused/15 border-node-paused/60');
    case 'checkpoint':
      return cn(baseClasses, 'bg-node-checkpoint/10 border-node-checkpoint/50 border-dashed');
    default:
      return cn(baseClasses, 'bg-secondary/50 border-border hover:border-muted-foreground/50');
  }
};

const getStatusColor = (status: NodeStatus) => {
  switch (status) {
    case 'running': return 'text-node-running';
    case 'success': return 'text-node-success';
    case 'warning': return 'text-node-warning';
    case 'failed': return 'text-node-failed';
    case 'paused': return 'text-node-paused';
    case 'checkpoint': return 'text-node-checkpoint';
    default: return 'text-muted-foreground';
  }
};

// Main Pipeline Stage Node
export const PipelineStageNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as PipelineNodeData;
  const { label, stageType, status, description, duration } = nodeData;

  return (
    <div className={cn(
      getNodeClasses(status),
      selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      status === 'running' && 'animate-pulse-subtle'
    )}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-3 !h-3 !bg-edge !border-2 !border-card"
      />
      
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-2 rounded-md',
          status === 'idle' ? 'bg-muted/50 text-muted-foreground' : 
          status === 'running' ? 'bg-node-running/20 text-node-running' :
          status === 'success' ? 'bg-node-success/20 text-node-success' :
          status === 'warning' ? 'bg-node-warning/20 text-node-warning' :
          status === 'failed' ? 'bg-node-failed/20 text-node-failed' :
          status === 'paused' ? 'bg-node-paused/20 text-node-paused' :
          'bg-node-checkpoint/20 text-node-checkpoint'
        )}>
          {stageIcons[stageType]}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{label}</span>
            {statusIcons[status] && (
              <span className={getStatusColor(status)}>
                {statusIcons[status]}
              </span>
            )}
          </div>
          
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
          )}
          
          {duration && status !== 'idle' && (
            <p className="text-xs text-muted-foreground mt-1">{duration}</p>
          )}
        </div>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-3 !h-3 !bg-edge !border-2 !border-card"
      />
    </div>
  );
});

PipelineStageNode.displayName = 'PipelineStageNode';

// Approval Gate Node
export const ApprovalGateNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as PipelineNodeData;
  const { label, status } = nodeData;

  return (
    <div className={cn(
      'px-4 py-3 rounded-lg border-2 min-w-[140px]',
      status === 'paused' ? 'bg-node-paused/15 border-node-paused/60' :
      status === 'success' ? 'bg-node-success/15 border-node-success/60' :
      'bg-sec-warning/10 border-sec-warning/40',
      selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
    )}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-3 !h-3 !bg-edge !border-2 !border-card"
      />
      
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-sec-warning/20">
          <Shield className="w-4 h-4 text-sec-warning" />
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-3 !h-3 !bg-edge !border-2 !border-card"
      />
    </div>
  );
});

ApprovalGateNode.displayName = 'ApprovalGateNode';

// Checkpoint Node
export const CheckpointNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as PipelineNodeData;
  const { label, status } = nodeData;

  return (
    <div className={cn(
      'px-4 py-3 rounded-lg border-2 border-dashed min-w-[140px]',
      'bg-node-checkpoint/10 border-node-checkpoint/50',
      selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
    )}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-3 !h-3 !bg-edge !border-2 !border-card"
      />
      
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-node-checkpoint/20">
          <Database className="w-4 h-4 text-node-checkpoint" />
        </div>
        <div>
          <span className="text-sm font-medium text-foreground block">{label}</span>
          <span className="text-xs text-muted-foreground">Restore point</span>
        </div>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-3 !h-3 !bg-edge !border-2 !border-card"
      />
    </div>
  );
});

CheckpointNode.displayName = 'CheckpointNode';

// Parallel Group Node
export const ParallelGroupNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as PipelineNodeData;
  const { label } = nodeData;

  return (
    <div className={cn(
      'px-4 py-6 rounded-lg border-2 border-dashed min-w-[200px] min-h-[100px]',
      'bg-secondary/20 border-edge',
      selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
    )}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-3 !h-3 !bg-edge !border-2 !border-card"
      />
      
      <div className="flex items-center gap-2 mb-2">
        <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      
      <div className="text-xs text-muted-foreground text-center py-4">
        Drop stages here
      </div>
      
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-3 !h-3 !bg-edge !border-2 !border-card"
      />
    </div>
  );
});

ParallelGroupNode.displayName = 'ParallelGroupNode';

// Export node types for React Flow
export const nodeTypes = {
  pipelineStage: PipelineStageNode,
  approvalGate: ApprovalGateNode,
  checkpoint: CheckpointNode,
  parallelGroup: ParallelGroupNode,
};
