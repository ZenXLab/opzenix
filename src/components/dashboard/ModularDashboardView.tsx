import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, TrendingUp, Activity, FileText, Terminal,
  GitBranch, Gauge, Sparkles, GripVertical, Radio,
  Database, Shield, Network, BarChart3, PieChart, Layers,
  AlertTriangle, Zap, Eye, Lock, Cloud, Settings, LineChart, Github,
  RotateCcw, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ClickableMetricCard from './ClickableMetricCard';
import DeploymentGraphWidget from './widgets/DeploymentGraphWidget';
import AuditActivityWidget from './widgets/AuditActivityWidget';
import SystemMetricsWidget from './widgets/SystemMetricsWidget';
import APIPerformanceWidget from './widgets/APIPerformanceWidget';
import PipelineStatusWidget from './widgets/PipelineStatusWidget';
import LogStreamWidget from './widgets/LogStreamWidget';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import { SystemHealthWidget } from './widgets/SystemHealthWidget';
import { ArtifactsRegistryWidget } from './widgets/ArtifactsRegistryWidget';
import EnhancedWidgetPicker from './EnhancedWidgetPicker';
import DraggableWidget from './DraggableWidget';
import { ArtifactTraceabilityPanel } from '@/components/artifacts/ArtifactTraceabilityPanel';
import { useFlowStore } from '@/stores/flowStore';
import { useWidgetMetrics } from '@/hooks/useWidgetMetrics';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ModularDashboardViewProps {
  onViewFlows: () => void;
  onOpenPipelineEditor?: () => void;
  onOpenEnvironmentManager?: () => void;
  onOpenOpzenixWizard?: () => void;
  onOpenTemplatesGallery?: () => void;
  onOpenGitHubConnection?: () => void;
  onOpenExecutionHistory?: () => void;
  onMetricClick?: (metricType: string) => void;
}

type WidgetType = 'deployments' | 'audit' | 'metrics' | 'api' | 'pipelines' | 'logs' | 'actions' | 'telemetry' | 'system-health'
  | 'model-registry' | 'training-jobs' | 'drift-monitor' | 'feature-store'
  | 'prompt-library' | 'token-usage' | 'guardrails' | 'latency-monitor'
  | 'anomaly-detection' | 'incident-prediction' | 'smart-alerts'
  | 'cloud-resources' | 'k8s-clusters' | 'terraform-state'
  | 'vulnerability-scan' | 'compliance' | 'secrets-audit'
  | 'traces' | 'build-metrics' | 'test-coverage';

const ModularDashboardView = ({ 
  onViewFlows, 
  onOpenPipelineEditor,
  onOpenEnvironmentManager,
  onOpenOpzenixWizard,
  onOpenTemplatesGallery,
  onOpenGitHubConnection,
  onOpenExecutionHistory,
  onMetricClick
}: ModularDashboardViewProps) => {
  const { executions, deployments, approvalRequests } = useFlowStore();
  const { aggregated, loading: metricsLoading } = useWidgetMetrics();
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [traceabilityArtifactId, setTraceabilityArtifactId] = useState<string | null>(null);
  
  // Use persistent dashboard layout
  const {
    widgets,
    loading: layoutLoading,
    saving,
    addWidget,
    removeWidget,
    renameWidget,
    duplicateWidget,
    moveWidget,
    resetLayout
  } = useDashboardLayout();

  // Use real-time aggregated metrics or fallback to store data
  const activeExecutions = aggregated.activeFlows || executions.filter(e => e.status === 'running').length;
  const totalDeployments = aggregated.deploymentsToday || deployments.length;
  const successRate = aggregated.successRate || (deployments.length > 0 
    ? Math.round((deployments.filter(d => d.status === 'success').length / deployments.length) * 100) 
    : 100);
  const pendingApprovals = aggregated.pendingApprovals || approvalRequests.filter(a => a.status === 'pending').length;

  const handleRemoveWidget = useCallback((id: string) => {
    removeWidget(id);
    toast.success('Widget removed');
  }, [removeWidget]);

  const handleRenameWidget = useCallback((id: string, newName: string) => {
    renameWidget(id, newName);
  }, [renameWidget]);

  const handleDuplicateWidget = useCallback((id: string) => {
    duplicateWidget(id);
    toast.success('Widget duplicated');
  }, [duplicateWidget]);

  const handleAddWidget = (type: string) => {
    const sizeMap: Record<string, 'small' | 'medium' | 'large'> = {
      'logs': 'large',
      'deployments': 'medium',
      'audit': 'medium',
      'traces': 'large',
      'system-health': 'medium',
    };
    const nameMap: Record<string, string> = {
      'deployments': 'Deployments',
      'audit': 'Audit Activity',
      'metrics': 'System Metrics',
      'api': 'API Performance',
      'pipelines': 'Pipeline Status',
      'logs': 'Log Stream',
      'actions': 'Quick Actions',
      'system-health': 'System Health',
      'model-registry': 'Model Registry',
      'k8s-clusters': 'K8s Clusters',
      'vulnerability-scan': 'Vulnerability Scan',
    };
    
    addWidget(type, nameMap[type] || type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), sizeMap[type] || 'small');
    setShowWidgetPicker(false);
    toast.success('Widget added');
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', widgetId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetIndex(index);
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = widgets.findIndex(w => w.id === draggedWidget);
    if (fromIndex !== -1 && fromIndex !== toIndex) {
      moveWidget(fromIndex, toIndex);
    }
    setDraggedWidget(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
    setDropTargetIndex(null);
  };

  const renderWidgetContent = (widget: { id: string; type: string }) => {
    const commonProps = { 
      id: widget.id, 
      onRemove: handleRemoveWidget,
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
        return <TelemetryWidgetContent />;
      case 'system-health':
        return <SystemHealthWidget onRemove={() => handleRemoveWidget(widget.id)} />;
      case 'artifacts':
        return (
          <ArtifactsRegistryWidget 
            {...commonProps}
            onViewTraceability={(id) => setTraceabilityArtifactId(id)}
          />
        );
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
        return <PlaceholderWidgetContent type={widget.type} />;
    }
  };

  const getWidgetIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'deployments': <TrendingUp className="w-4 h-4 text-ai-primary" />,
      'audit': <FileText className="w-4 h-4 text-muted-foreground" />,
      'metrics': <Gauge className="w-4 h-4 text-sec-safe" />,
      'api': <Network className="w-4 h-4 text-primary" />,
      'pipelines': <GitBranch className="w-4 h-4 text-node-running" />,
      'logs': <Terminal className="w-4 h-4 text-muted-foreground" />,
      'actions': <Zap className="w-4 h-4 text-sec-warning" />,
      'telemetry': <Radio className="w-4 h-4 text-ai-primary" />,
      'system-health': <Activity className="w-4 h-4 text-sec-safe" />,
      'artifacts': <Package className="w-4 h-4 text-primary" />,
      'training-jobs': <Zap className="w-4 h-4 text-sec-warning" />,
      'drift-monitor': <AlertTriangle className="w-4 h-4 text-sec-warning" />,
      'feature-store': <Layers className="w-4 h-4 text-ai-primary" />,
      'prompt-library': <FileText className="w-4 h-4 text-ai-primary" />,
      'token-usage': <BarChart3 className="w-4 h-4 text-sec-warning" />,
      'guardrails': <Shield className="w-4 h-4 text-sec-safe" />,
      'latency-monitor': <Activity className="w-4 h-4 text-node-running" />,
      'anomaly-detection': <Eye className="w-4 h-4 text-ai-primary" />,
      'incident-prediction': <AlertTriangle className="w-4 h-4 text-sec-danger" />,
      'smart-alerts': <Zap className="w-4 h-4 text-sec-warning" />,
      'cloud-resources': <Cloud className="w-4 h-4 text-primary" />,
      'k8s-clusters': <Settings className="w-4 h-4 text-primary" />,
      'terraform-state': <FileText className="w-4 h-4 text-ai-primary" />,
      'vulnerability-scan': <Shield className="w-4 h-4 text-sec-danger" />,
      'compliance': <Lock className="w-4 h-4 text-sec-safe" />,
      'secrets-audit': <Lock className="w-4 h-4 text-sec-warning" />,
      'traces': <LineChart className="w-4 h-4 text-ai-primary" />,
      'build-metrics': <BarChart3 className="w-4 h-4 text-sec-safe" />,
      'test-coverage': <PieChart className="w-4 h-4 text-primary" />,
    };
    return iconMap[type] || <Layers className="w-4 h-4" />;
  };

  if (layoutLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-auto bg-background"
    >
      <div className="p-3 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                <GripVertical className="w-3.5 h-3.5 inline mr-1" />
                Drag to reorder • Right-click for options • Double-click to rename
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5"
                onClick={onOpenGitHubConnection}
              >
                <Github className="w-3.5 h-3.5" />
                GitHub
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5"
                onClick={onOpenTemplatesGallery}
              >
                <Layers className="w-3.5 h-3.5" />
                Templates
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5"
                onClick={() => setShowWidgetPicker(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Widget
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1.5"
                onClick={resetLayout}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sec-safe/10 text-sec-safe text-xs font-medium">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  saving ? "bg-sec-warning animate-pulse" : "bg-sec-safe animate-pulse"
                )} />
                {saving ? 'Saving...' : metricsLoading ? 'Loading...' : 'Live'}
              </span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <ClickableMetricCard 
              label="Active Flows" 
              value={activeExecutions} 
              icon={Sparkles} 
              iconColor="text-node-running"
              onClick={() => onMetricClick?.('active-flows')}
              tooltip="Click to view running executions"
              metricId="active-flows"
            />
            <ClickableMetricCard 
              label="Deployments" 
              value={totalDeployments} 
              change={{ value: '12%', positive: true }} 
              icon={TrendingUp} 
              iconColor="text-ai-primary"
              onClick={() => onOpenExecutionHistory?.()}
              tooltip="Click to view deployment history"
              metricId="deployments"
            />
            <ClickableMetricCard 
              label="Success Rate" 
              value={`${successRate}%`} 
              icon={Activity} 
              iconColor="text-sec-safe"
              onClick={() => onOpenExecutionHistory?.()}
              tooltip="Click to view execution analytics"
              metricId="success-rate"
            />
            <ClickableMetricCard 
              label="Pending" 
              value={pendingApprovals} 
              icon={FileText} 
              iconColor="text-sec-warning"
              onClick={() => onMetricClick?.('pending')}
              tooltip="Click to view pending approvals"
              metricId="pending-approvals"
            />
          </div>

          {/* Widgets Grid with HTML5 Drag and Drop */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min">
            <AnimatePresence mode="popLayout">
              {widgets.map((widget, index) => (
                <motion.div
                  key={widget.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: draggedWidget === widget.id ? 0.5 : 1, 
                    scale: 1,
                    y: dropTargetIndex === index && draggedWidget !== widget.id ? 8 : 0
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "relative",
                    widget.size === 'large' && "md:col-span-2",
                    widget.size === 'medium' && widget.type === 'audit' && "md:row-span-2",
                    dropTargetIndex === index && draggedWidget !== widget.id && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg"
                  )}
                  draggable
                  onDragStart={(e) => handleDragStart(e as any, widget.id)}
                  onDragOver={(e) => handleDragOver(e as any, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e as any, index)}
                  onDragEnd={handleDragEnd}
                >
                  <DraggableWidget
                    id={widget.id}
                    title={widget.name || widget.type}
                    icon={getWidgetIcon(widget.type)}
                    onRemove={handleRemoveWidget}
                    onRename={handleRenameWidget}
                    onDuplicate={handleDuplicateWidget}
                    size={widget.size}
                    widgetType={widget.type}
                    executionId={widget.executionId}
                  >
                    {renderWidgetContent(widget)}
                  </DraggableWidget>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty state */}
          {widgets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                <Layers className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No widgets yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add widgets to customize your dashboard
              </p>
              <Button onClick={() => setShowWidgetPicker(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Widget
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Widget Picker */}
      <EnhancedWidgetPicker
        isOpen={showWidgetPicker}
        onClose={() => setShowWidgetPicker(false)}
        onAddWidget={handleAddWidget}
      />

      {/* Artifact Traceability Panel */}
      <ArtifactTraceabilityPanel
        open={!!traceabilityArtifactId}
        onClose={() => setTraceabilityArtifactId(null)}
        artifactId={traceabilityArtifactId || undefined}
      />
    </motion.div>
  );
};

// Simple widget content components
const TelemetryWidgetContent = () => (
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
);

const PlaceholderWidgetContent = ({ type }: { type: string }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">Status</span>
      <Badge variant="outline" className="text-[9px]">Active</Badge>
    </div>
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">Type</span>
      <span className="text-foreground font-medium">{type}</span>
    </div>
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">Last Updated</span>
      <span className="text-foreground font-medium">Just now</span>
    </div>
    <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
      Configure this widget to display real data
    </p>
  </div>
);

export default ModularDashboardView;
