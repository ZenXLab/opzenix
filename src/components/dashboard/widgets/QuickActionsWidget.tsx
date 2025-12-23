import { 
  Rocket, GitBranch, RefreshCw, Terminal, Settings, 
  Plus, Play, Pause, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import WidgetWrapper from './WidgetWrapper';
import { toast } from 'sonner';

interface QuickActionsWidgetProps {
  id: string;
  onRemove?: (id: string) => void;
  onOpenPipelineEditor?: () => void;
  onOpenEnvironmentManager?: () => void;
}

const QuickActionsWidget = ({ 
  id, 
  onRemove,
  onOpenPipelineEditor,
  onOpenEnvironmentManager
}: QuickActionsWidgetProps) => {
  
  const actions = [
    { 
      icon: Rocket, 
      label: 'Quick Deploy', 
      color: 'text-ai-primary',
      onClick: () => toast.info('Opening deploy wizard...')
    },
    { 
      icon: Plus, 
      label: 'New Pipeline', 
      color: 'text-sec-safe',
      onClick: onOpenPipelineEditor
    },
    { 
      icon: Settings, 
      label: 'Environments', 
      color: 'text-sec-warning',
      onClick: onOpenEnvironmentManager
    },
    { 
      icon: RefreshCw, 
      label: 'Sync All', 
      color: 'text-primary',
      onClick: () => toast.success('Syncing all services...')
    },
    { 
      icon: Terminal, 
      label: 'Console', 
      color: 'text-muted-foreground',
      onClick: () => toast.info('Opening console...')
    },
    { 
      icon: RotateCcw, 
      label: 'Rollback', 
      color: 'text-sec-critical',
      onClick: () => toast.warning('Select deployment to rollback')
    },
  ];

  return (
    <WidgetWrapper
      id={id}
      title="Quick Actions"
      icon={<Play className="w-3.5 h-3.5 text-ai-primary" />}
      onRemove={onRemove}
    >
      <div className="grid grid-cols-3 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="ghost"
              className="h-16 flex-col gap-1.5 hover:bg-secondary/50"
              onClick={action.onClick}
            >
              <Icon className={`w-5 h-5 ${action.color}`} />
              <span className="text-[10px] text-muted-foreground">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </WidgetWrapper>
  );
};

export default QuickActionsWidget;
