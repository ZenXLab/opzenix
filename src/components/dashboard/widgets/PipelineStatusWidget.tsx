import { GitBranch, Play, CheckCircle2, XCircle, Clock, Pause } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import WidgetWrapper from './WidgetWrapper';
import { cn } from '@/lib/utils';

interface Pipeline {
  id: string;
  name: string;
  branch: string;
  status: 'running' | 'success' | 'failed' | 'queued' | 'paused';
  duration?: string;
  progress?: number;
  triggeredBy: string;
}

const pipelines: Pipeline[] = [
  { id: '1', name: 'api-gateway', branch: 'main', status: 'running', progress: 67, triggeredBy: 'Sarah C.' },
  { id: '2', name: 'frontend-app', branch: 'feature/auth', status: 'success', duration: '3m 42s', triggeredBy: 'Mike J.' },
  { id: '3', name: 'ml-pipeline', branch: 'develop', status: 'failed', duration: '8m 12s', triggeredBy: 'Emma W.' },
  { id: '4', name: 'data-sync', branch: 'main', status: 'queued', triggeredBy: 'David L.' },
  { id: '5', name: 'infra-deploy', branch: 'main', status: 'paused', duration: '2m 15s', triggeredBy: 'Anna P.' },
];

const statusConfig = {
  running: { icon: Play, color: 'text-node-running', bg: 'bg-node-running/10' },
  success: { icon: CheckCircle2, color: 'text-sec-safe', bg: 'bg-sec-safe/10' },
  failed: { icon: XCircle, color: 'text-sec-critical', bg: 'bg-sec-critical/10' },
  queued: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/20' },
  paused: { icon: Pause, color: 'text-node-paused', bg: 'bg-node-paused/10' },
};

interface PipelineStatusWidgetProps {
  id: string;
  onRemove?: (id: string) => void;
}

const PipelineStatusWidget = ({ id, onRemove }: PipelineStatusWidgetProps) => {
  return (
    <WidgetWrapper
      id={id}
      title="Pipeline Status"
      icon={<GitBranch className="w-3.5 h-3.5 text-ai-primary" />}
      onRemove={onRemove}
    >
      <ScrollArea className="h-[180px]">
        <div className="space-y-2">
          {pipelines.map((pipeline) => {
            const StatusIcon = statusConfig[pipeline.status].icon;
            
            return (
              <div
                key={pipeline.id}
                className="p-2 rounded border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1 rounded", statusConfig[pipeline.status].bg)}>
                      <StatusIcon className={cn("w-3 h-3", statusConfig[pipeline.status].color)} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{pipeline.name}</p>
                      <p className="text-[10px] text-muted-foreground">{pipeline.branch}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="h-4 text-[9px] px-1 capitalize">
                      {pipeline.status}
                    </Badge>
                    {pipeline.duration && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{pipeline.duration}</p>
                    )}
                  </div>
                </div>
                
                {pipeline.status === 'running' && pipeline.progress && (
                  <div className="mt-2">
                    <div className="h-1 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-node-running transition-all animate-pulse"
                        style={{ width: `${pipeline.progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{pipeline.progress}% complete</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </WidgetWrapper>
  );
};

export default PipelineStatusWidget;
