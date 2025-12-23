import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  LayoutGrid, Plus, TrendingUp, Activity, FileText, Terminal,
  GitBranch, Gauge, Play, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import MetricCard from './MetricCard';
import DeploymentGraphWidget from './widgets/DeploymentGraphWidget';
import AuditActivityWidget from './widgets/AuditActivityWidget';
import SystemMetricsWidget from './widgets/SystemMetricsWidget';
import APIPerformanceWidget from './widgets/APIPerformanceWidget';
import PipelineStatusWidget from './widgets/PipelineStatusWidget';
import LogStreamWidget from './widgets/LogStreamWidget';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import { useFlowStore } from '@/stores/flowStore';
import { cn } from '@/lib/utils';

interface ModularDashboardViewProps {
  onViewFlows: () => void;
  onOpenPipelineEditor?: () => void;
  onOpenEnvironmentManager?: () => void;
}

type WidgetType = 'deployments' | 'audit' | 'metrics' | 'api' | 'pipelines' | 'logs' | 'actions';

interface Widget {
  id: string;
  type: WidgetType;
  enabled: boolean;
}

const availableWidgets: { type: WidgetType; label: string; icon: typeof TrendingUp }[] = [
  { type: 'deployments', label: 'Deployment Trends', icon: TrendingUp },
  { type: 'audit', label: 'Audit Activity', icon: FileText },
  { type: 'metrics', label: 'System Metrics', icon: Activity },
  { type: 'api', label: 'API Performance', icon: Gauge },
  { type: 'pipelines', label: 'Pipeline Status', icon: GitBranch },
  { type: 'logs', label: 'Live Logs', icon: Terminal },
  { type: 'actions', label: 'Quick Actions', icon: Play },
];

const ModularDashboardView = ({ 
  onViewFlows, 
  onOpenPipelineEditor,
  onOpenEnvironmentManager 
}: ModularDashboardViewProps) => {
  const { executions, deployments, approvalRequests } = useFlowStore();
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 'w1', type: 'actions', enabled: true },
    { id: 'w2', type: 'deployments', enabled: true },
    { id: 'w3', type: 'metrics', enabled: true },
    { id: 'w4', type: 'pipelines', enabled: true },
    { id: 'w5', type: 'audit', enabled: true },
    { id: 'w6', type: 'api', enabled: true },
    { id: 'w7', type: 'logs', enabled: true },
  ]);

  const activeExecutions = executions.filter(e => e.status === 'running').length;
  const successRate = deployments.length > 0 
    ? Math.round((deployments.filter(d => d.status === 'success').length / deployments.length) * 100) 
    : 100;
  const pendingApprovals = approvalRequests.filter(a => a.status === 'pending').length;

  const handleRemoveWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  }, []);

  const handleAddWidget = (type: WidgetType) => {
    setWidgets(prev => [...prev, { id: `w-${Date.now()}`, type, enabled: true }]);
    setShowWidgetPicker(false);
  };

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'deployments':
        return <DeploymentGraphWidget id={widget.id} onRemove={handleRemoveWidget} />;
      case 'audit':
        return <AuditActivityWidget id={widget.id} onRemove={handleRemoveWidget} />;
      case 'metrics':
        return <SystemMetricsWidget id={widget.id} onRemove={handleRemoveWidget} />;
      case 'api':
        return <APIPerformanceWidget id={widget.id} onRemove={handleRemoveWidget} />;
      case 'pipelines':
        return <PipelineStatusWidget id={widget.id} onRemove={handleRemoveWidget} />;
      case 'logs':
        return <LogStreamWidget id={widget.id} onRemove={handleRemoveWidget} />;
      case 'actions':
        return (
          <QuickActionsWidget 
            id={widget.id} 
            onRemove={handleRemoveWidget}
            onOpenPipelineEditor={onOpenPipelineEditor}
            onOpenEnvironmentManager={onOpenEnvironmentManager}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-auto bg-background p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Drag widgets to reorder • Click + to add more
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5"
              onClick={() => setShowWidgetPicker(!showWidgetPicker)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Widget
            </Button>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sec-safe/10 text-sec-safe text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-sec-safe animate-pulse" />
              System Healthy
            </span>
          </div>
        </div>

        {/* Widget Picker */}
        <AnimatePresence>
          {showWidgetPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-card border border-border rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-3">Available Widgets</p>
                <div className="flex flex-wrap gap-2">
                  {availableWidgets.map((w) => {
                    const Icon = w.icon;
                    return (
                      <Button
                        key={w.type}
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleAddWidget(w.type)}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {w.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Active Flows" value={activeExecutions} icon={Sparkles} iconColor="text-node-running" />
          <MetricCard label="Deployments Today" value={deployments.length} change={{ value: '12%', positive: true }} icon={TrendingUp} iconColor="text-ai-primary" />
          <MetricCard label="Success Rate" value={`${successRate}%`} icon={Activity} iconColor="text-sec-safe" />
          <MetricCard label="Pending Approvals" value={pendingApprovals} icon={FileText} iconColor="text-sec-warning" />
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-3 gap-4 auto-rows-min">
          {widgets.map((widget) => (
            <div key={widget.id} className={cn(
              widget.type === 'logs' && 'col-span-2',
              widget.type === 'audit' && 'row-span-2'
            )}>
              {renderWidget(widget)}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ModularDashboardView;
