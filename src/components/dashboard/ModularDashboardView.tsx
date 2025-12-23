import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Plus, TrendingUp, Activity, FileText, Terminal,
  GitBranch, Gauge, Play, Sparkles, GripVertical,
  PanelLeftClose, PanelRightClose, PanelLeft, PanelRight,
  ChevronLeft, ChevronRight, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';

interface ModularDashboardViewProps {
  onViewFlows: () => void;
  onOpenPipelineEditor?: () => void;
  onOpenEnvironmentManager?: () => void;
  onOpenOpzenixWizard?: () => void;
}

type WidgetType = 'deployments' | 'audit' | 'metrics' | 'api' | 'pipelines' | 'logs' | 'actions' | 'telemetry';
type DockSide = 'left' | 'right' | 'none';

interface Widget {
  id: string;
  type: WidgetType;
  size: 'small' | 'medium' | 'large';
  docked?: DockSide;
}

const availableWidgets: { type: WidgetType; label: string; icon: typeof TrendingUp; defaultSize: Widget['size'] }[] = [
  { type: 'deployments', label: 'Deployment Trends', icon: TrendingUp, defaultSize: 'medium' },
  { type: 'audit', label: 'Audit Activity', icon: FileText, defaultSize: 'medium' },
  { type: 'metrics', label: 'System Metrics', icon: Activity, defaultSize: 'small' },
  { type: 'api', label: 'API Performance', icon: Gauge, defaultSize: 'small' },
  { type: 'pipelines', label: 'Pipeline Status', icon: GitBranch, defaultSize: 'small' },
  { type: 'logs', label: 'Live Logs', icon: Terminal, defaultSize: 'large' },
  { type: 'actions', label: 'Quick Actions', icon: Play, defaultSize: 'small' },
  { type: 'telemetry', label: 'OTel Signals', icon: Radio, defaultSize: 'medium' },
];

const ModularDashboardView = ({ 
  onViewFlows, 
  onOpenPipelineEditor,
  onOpenEnvironmentManager,
  onOpenOpzenixWizard
}: ModularDashboardViewProps) => {
  const { executions, deployments, approvalRequests } = useFlowStore();
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 'w1', type: 'actions', size: 'small', docked: 'none' },
    { id: 'w2', type: 'deployments', size: 'medium', docked: 'none' },
    { id: 'w3', type: 'metrics', size: 'small', docked: 'left' },
    { id: 'w4', type: 'pipelines', size: 'small', docked: 'none' },
    { id: 'w5', type: 'audit', size: 'medium', docked: 'none' },
    { id: 'w6', type: 'api', size: 'small', docked: 'right' },
    { id: 'w7', type: 'logs', size: 'large', docked: 'none' },
  ]);

  const activeExecutions = executions.filter(e => e.status === 'running').length;
  const successRate = deployments.length > 0 
    ? Math.round((deployments.filter(d => d.status === 'success').length / deployments.length) * 100) 
    : 100;
  const pendingApprovals = approvalRequests.filter(a => a.status === 'pending').length;

  const handleRemoveWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    toast.success('Widget removed');
  }, []);

  const handleAddWidget = (type: WidgetType, docked: DockSide = 'none') => {
    const config = availableWidgets.find(w => w.type === type);
    setWidgets(prev => [...prev, { 
      id: `w-${Date.now()}`, 
      type, 
      size: config?.defaultSize || 'small',
      docked
    }]);
    setShowWidgetPicker(false);
    toast.success('Widget added');
  };

  const handleDockWidget = (id: string, side: DockSide) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, docked: side } : w));
    if (side === 'left') setLeftPanelOpen(true);
    if (side === 'right') setRightPanelOpen(true);
    toast.success(`Widget docked to ${side === 'none' ? 'main area' : side + ' panel'}`);
  };

  const handleReorder = (newOrder: Widget[]) => {
    setWidgets(prev => {
      const dockedWidgets = prev.filter(w => w.docked !== 'none');
      const mainWidgets = newOrder.filter(w => w.docked === 'none' || !w.docked);
      return [...mainWidgets, ...dockedWidgets];
    });
  };

  const renderWidget = (widget: Widget, showDockControls = true) => {
    const commonProps = { 
      id: widget.id, 
      onRemove: handleRemoveWidget,
      onDock: showDockControls ? handleDockWidget : undefined,
      currentDock: widget.docked
    };
    
    switch (widget.type) {
      case 'deployments':
        return <DeploymentGraphWidget {...commonProps} />;
      case 'audit':
        return <AuditActivityWidget {...commonProps} />;
      case 'metrics':
        return <SystemMetricsWidget {...commonProps} />;
      case 'api':
        return <APIPerformanceWidget {...commonProps} />;
      case 'pipelines':
        return <PipelineStatusWidget {...commonProps} />;
      case 'logs':
        return <LogStreamWidget {...commonProps} />;
      case 'telemetry':
        return <TelemetryWidget {...commonProps} />;
      case 'actions':
        return (
          <QuickActionsWidget 
            {...commonProps}
            onOpenPipelineEditor={onOpenPipelineEditor}
            onOpenEnvironmentManager={onOpenEnvironmentManager}
            onOpenOpzenixWizard={onOpenOpzenixWizard}
          />
        );
      default:
        return null;
    }
  };

  const mainWidgets = widgets.filter(w => !w.docked || w.docked === 'none');
  const leftWidgets = widgets.filter(w => w.docked === 'left');
  const rightWidgets = widgets.filter(w => w.docked === 'right');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex overflow-hidden bg-background"
    >
      {/* Left Docked Panel */}
      <AnimatePresence>
        {leftPanelOpen && leftWidgets.length > 0 && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-r border-border bg-card/50 overflow-y-auto shrink-0"
          >
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Left Panel</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setLeftPanelOpen(false)}>
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </Button>
              </div>
              {leftWidgets.map(widget => (
                <div key={widget.id}>{renderWidget(widget, true)}</div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Left Panel Toggle */}
      {!leftPanelOpen && leftWidgets.length > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-6 rounded-none border-r border-border shrink-0"
          onClick={() => setLeftPanelOpen(true)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                <GripVertical className="w-3.5 h-3.5 inline mr-1" />
                Drag to reorder • Dock widgets to left/right panels
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              >
                {leftPanelOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Left</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
              >
                {rightPanelOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRight className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Right</span>
              </Button>
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
                  <p className="text-xs font-medium text-muted-foreground mb-3">Add Widget To:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Main Area</p>
                      <div className="flex flex-wrap gap-2">
                        {availableWidgets.map((w) => {
                          const Icon = w.icon;
                          return (
                            <Button key={w.type} variant="outline" size="sm" className="gap-1" onClick={() => handleAddWidget(w.type, 'none')}>
                              <Icon className="w-3 h-3" />
                              <span className="text-[10px]">{w.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Left Panel</p>
                      <div className="flex flex-wrap gap-2">
                        {availableWidgets.slice(0, 4).map((w) => {
                          const Icon = w.icon;
                          return (
                            <Button key={w.type} variant="ghost" size="sm" className="gap-1" onClick={() => handleAddWidget(w.type, 'left')}>
                              <Icon className="w-3 h-3" />
                              <span className="text-[10px]">{w.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Right Panel</p>
                      <div className="flex flex-wrap gap-2">
                        {availableWidgets.slice(0, 4).map((w) => {
                          const Icon = w.icon;
                          return (
                            <Button key={w.type} variant="ghost" size="sm" className="gap-1" onClick={() => handleAddWidget(w.type, 'right')}>
                              <Icon className="w-3 h-3" />
                              <span className="text-[10px]">{w.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard label="Active Flows" value={activeExecutions} icon={Sparkles} iconColor="text-node-running" />
            <MetricCard label="Deployments" value={deployments.length} change={{ value: '12%', positive: true }} icon={TrendingUp} iconColor="text-ai-primary" />
            <MetricCard label="Success Rate" value={`${successRate}%`} icon={Activity} iconColor="text-sec-safe" />
            <MetricCard label="Pending" value={pendingApprovals} icon={FileText} iconColor="text-sec-warning" />
          </div>

          {/* Reorderable Widgets Grid */}
          <Reorder.Group 
            axis="y" 
            values={mainWidgets} 
            onReorder={handleReorder}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 auto-rows-min"
          >
            {mainWidgets.map((widget) => (
              <Reorder.Item
                key={widget.id}
                value={widget}
                className={cn(
                  "cursor-grab active:cursor-grabbing",
                  widget.type === 'logs' && "md:col-span-2",
                  widget.type === 'audit' && "md:row-span-2"
                )}
                whileDrag={{ scale: 1.02, zIndex: 50 }}
              >
                {renderWidget(widget, true)}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      </div>

      {/* Right Panel Toggle */}
      {!rightPanelOpen && rightWidgets.length > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-6 rounded-none border-l border-border shrink-0"
          onClick={() => setRightPanelOpen(true)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      {/* Right Docked Panel */}
      <AnimatePresence>
        {rightPanelOpen && rightWidgets.length > 0 && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-l border-border bg-card/50 overflow-y-auto shrink-0"
          >
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Right Panel</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRightPanelOpen(false)}>
                  <PanelRightClose className="w-3.5 h-3.5" />
                </Button>
              </div>
              {rightWidgets.map(widget => (
                <div key={widget.id}>{renderWidget(widget, true)}</div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Simple Telemetry Widget for OTel signals preview
const TelemetryWidget = ({ id, onRemove }: { id: string; onRemove: (id: string) => void }) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Radio className="w-4 h-4 text-ai-primary" />
        <span className="text-sm font-medium text-foreground">OTel Signals</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Traces ingested</span>
        <span className="text-foreground font-medium">12.4k/min</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Metrics collected</span>
        <span className="text-foreground font-medium">847</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Log events</span>
        <span className="text-foreground font-medium">34.2k/min</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Flow correlation</span>
        <span className="text-sec-safe font-medium">98.7%</span>
      </div>
    </div>
    <p className="text-[10px] text-muted-foreground">
      Signals correlated via opzenix.flow_id, execution_id, checkpoint_id
    </p>
  </div>
);

export default ModularDashboardView;
