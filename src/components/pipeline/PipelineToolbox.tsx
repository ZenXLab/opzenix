import { 
  GitBranch, Box, TestTube, Scan, Rocket, Shield, 
  Database, RefreshCw, Layers, GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolboxItem {
  type: string;
  stageType: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const toolboxItems: ToolboxItem[] = [
  { type: 'pipelineStage', stageType: 'source', label: 'Source', icon: <GitBranch className="w-4 h-4" />, description: 'Git checkout', color: 'text-ai-primary' },
  { type: 'pipelineStage', stageType: 'build', label: 'Build', icon: <Box className="w-4 h-4" />, description: 'Build artifacts', color: 'text-node-running' },
  { type: 'pipelineStage', stageType: 'test', label: 'Test', icon: <TestTube className="w-4 h-4" />, description: 'Run tests', color: 'text-sec-safe' },
  { type: 'pipelineStage', stageType: 'security', label: 'Security', icon: <Scan className="w-4 h-4" />, description: 'Security scan', color: 'text-sec-warning' },
  { type: 'pipelineStage', stageType: 'deploy', label: 'Deploy', icon: <Rocket className="w-4 h-4" />, description: 'Deploy to env', color: 'text-sec-critical' },
  { type: 'approvalGate', stageType: 'approval', label: 'Approval', icon: <Shield className="w-4 h-4" />, description: 'Manual gate', color: 'text-primary' },
  { type: 'checkpoint', stageType: 'checkpoint', label: 'Checkpoint', icon: <Database className="w-4 h-4" />, description: 'Save state', color: 'text-node-checkpoint' },
  { type: 'pipelineStage', stageType: 'rollback', label: 'Rollback', icon: <RefreshCw className="w-4 h-4" />, description: 'Restore previous', color: 'text-muted-foreground' },
  { type: 'parallelGroup', stageType: 'parallel', label: 'Parallel', icon: <Layers className="w-4 h-4" />, description: 'Run in parallel', color: 'text-ai-primary' },
];

interface PipelineToolboxProps {
  onDragStart: (event: React.DragEvent, item: ToolboxItem) => void;
}

const PipelineToolbox = ({ onDragStart }: PipelineToolboxProps) => {
  return (
    <div className="w-60 bg-card border-r border-border p-3 flex flex-col">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
        Pipeline Stages
      </h3>
      
      <div className="space-y-1.5 flex-1 overflow-y-auto">
        {toolboxItems.map((item) => (
          <div
            key={item.stageType}
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            className={cn(
              'flex items-center gap-2 p-2.5 rounded-lg cursor-grab active:cursor-grabbing',
              'bg-secondary/30 border border-border',
              'hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm',
              'transition-all duration-150 group'
            )}
          >
            <div className="p-1.5 rounded bg-muted/50 text-muted-foreground group-hover:text-foreground transition-colors">
              <GripVertical className="w-3 h-3 opacity-50 group-hover:opacity-100" />
            </div>
            <div className={cn("p-1.5 rounded", item.color)}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-border space-y-2">
        <p className="text-[10px] text-muted-foreground text-center">
          Drag stages onto canvas
        </p>
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[9px]">Click</kbd>
          <span>to configure</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[9px]">Double-click</kbd>
          <span>for OTel</span>
        </div>
      </div>
    </div>
  );
};

export default PipelineToolbox;
