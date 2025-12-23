import { 
  GitBranch, Box, TestTube, Scan, Rocket, Shield, 
  Database, RefreshCw, ArrowRight, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolboxItem {
  type: string;
  stageType: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const toolboxItems: ToolboxItem[] = [
  { type: 'pipelineStage', stageType: 'source', label: 'Source', icon: <GitBranch className="w-4 h-4" />, description: 'Git checkout' },
  { type: 'pipelineStage', stageType: 'build', label: 'Build', icon: <Box className="w-4 h-4" />, description: 'Build artifacts' },
  { type: 'pipelineStage', stageType: 'test', label: 'Test', icon: <TestTube className="w-4 h-4" />, description: 'Run tests' },
  { type: 'pipelineStage', stageType: 'security', label: 'Security', icon: <Scan className="w-4 h-4" />, description: 'Security scan' },
  { type: 'pipelineStage', stageType: 'deploy', label: 'Deploy', icon: <Rocket className="w-4 h-4" />, description: 'Deploy to env' },
  { type: 'approvalGate', stageType: 'approval', label: 'Approval', icon: <Shield className="w-4 h-4" />, description: 'Manual gate' },
  { type: 'checkpoint', stageType: 'checkpoint', label: 'Checkpoint', icon: <Database className="w-4 h-4" />, description: 'Save state' },
  { type: 'pipelineStage', stageType: 'rollback', label: 'Rollback', icon: <RefreshCw className="w-4 h-4" />, description: 'Restore previous' },
  { type: 'parallelGroup', stageType: 'parallel', label: 'Parallel', icon: <Layers className="w-4 h-4" />, description: 'Run in parallel' },
];

interface PipelineToolboxProps {
  onDragStart: (event: React.DragEvent, item: ToolboxItem) => void;
}

const PipelineToolbox = ({ onDragStart }: PipelineToolboxProps) => {
  return (
    <div className="w-56 bg-card border-r border-border p-3 flex flex-col">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Pipeline Stages
      </h3>
      
      <div className="space-y-1.5 flex-1 overflow-y-auto">
        {toolboxItems.map((item) => (
          <div
            key={item.stageType}
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            className={cn(
              'flex items-center gap-2 p-2 rounded-md cursor-grab',
              'bg-secondary/30 border border-border hover:border-primary/50 hover:bg-primary/5',
              'transition-all duration-150'
            )}
          >
            <div className="p-1.5 rounded bg-muted/50 text-muted-foreground">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Drag stages onto canvas
        </p>
      </div>
    </div>
  );
};

export default PipelineToolbox;
