import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Plus, TrendingUp, Activity, FileText, Terminal,
  GitBranch, Gauge, Play, Sparkles, GripVertical, Radio,
  Database, Shield, Network, BarChart3, PieChart, Layers,
  AlertTriangle, Zap, Eye, Lock, Cloud, Settings, LineChart, Github
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
import EnhancedWidgetPicker from './EnhancedWidgetPicker';
import DraggableWidget from './DraggableWidget';
import { useFlowStore } from '@/stores/flowStore';
import { useWidgetMetrics } from '@/hooks/useWidgetMetrics';
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

type WidgetType = 'deployments' | 'audit' | 'metrics' | 'api' | 'pipelines' | 'logs' | 'actions' | 'telemetry' 
  | 'model-registry' | 'training-jobs' | 'drift-monitor' | 'feature-store'
  | 'prompt-library' | 'token-usage' | 'guardrails' | 'latency-monitor'
  | 'anomaly-detection' | 'incident-prediction' | 'smart-alerts'
  | 'cloud-resources' | 'k8s-clusters' | 'terraform-state'
  | 'vulnerability-scan' | 'compliance' | 'secrets-audit'
  | 'traces' | 'build-metrics' | 'test-coverage';

interface Widget {
  id: string;
  type: WidgetType;
  size: 'small' | 'medium' | 'large';
  name?: string;
  executionId?: string;
}

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
  
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 'w1', type: 'actions', size: 'small', name: 'Quick Actions' },
    { id: 'w2', type: 'deployments', size: 'medium', name: 'Deployments' },
    { id: 'w3', type: 'metrics', size: 'small', name: 'System Metrics' },
    { id: 'w4', type: 'pipelines', size: 'small', name: 'Pipeline Status' },
    { id: 'w5', type: 'audit', size: 'medium', name: 'Audit Activity' },
    { id: 'w6', type: 'api', size: 'small', name: 'API Performance' },
    { id: 'w7', type: 'logs', size: 'large', name: 'Log Stream' },
  ]);

  // Use real-time aggregated metrics or fallback to store data
  const activeExecutions = aggregated.activeFlows || executions.filter(e => e.status === 'running').length;
  const totalDeployments = aggregated.deploymentsToday || deployments.length;
  const successRate = aggregated.successRate || (deployments.length > 0 
    ? Math.round((deployments.filter(d => d.status === 'success').length / deployments.length) * 100) 
    : 100);
  const pendingApprovals = aggregated.pendingApprovals || approvalRequests.filter(a => a.status === 'pending').length;

  const handleRemoveWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    toast.success('Widget removed');
  }, []);

  const handleRenameWidget = useCallback((id: string, newName: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, name: newName } : w
    ));
  }, []);

  const handleDuplicateWidget = useCallback((id: string) => {
    const widget = widgets.find(w => w.id === id);
    if (widget) {
      setWidgets(prev => [...prev, { 
        ...widget, 
        id: `w-${Date.now()}`,
        name: `${widget.name || widget.type} (copy)`
      }]);
    }
  }, [widgets]);

  const handleAddWidget = (type: string) => {
    const sizeMap: Record<string, Widget['size']> = {
      'logs': 'large',
      'deployments': 'medium',
      'audit': 'medium',
      'traces': 'large',
    };
    const nameMap: Record<string, string> = {
      'deployments': 'Deployments',
      'audit': 'Audit Activity',
      'metrics': 'System Metrics',
      'api': 'API Performance',
      'pipelines': 'Pipeline Status',
      'logs': 'Log Stream',
      'actions': 'Quick Actions',
      'model-registry': 'Model Registry',
      'k8s-clusters': 'K8s Clusters',
      'vulnerability-scan': 'Vulnerability Scan',
    };
    
    // Generate unique execution ID for tracking
    const executionId = `exec-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
    
    setWidgets(prev => [...prev, { 
      id: `w-${Date.now()}`, 
      type: type as WidgetType, 
      size: sizeMap[type] || 'small',
      name: nameMap[type] || type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      executionId,
    }]);
    setShowWidgetPicker(false);
    toast.success('Widget added');
  };

  const handleReorder = (newOrder: Widget[]) => {
    setWidgets(newOrder);
  };

  const renderWidgetContent = (widget: Widget) => {
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

  const getWidgetIcon = (type: WidgetType) => {
    const iconMap: Record<WidgetType, React.ReactNode> = {
      'deployments': <TrendingUp className="w-4 h-4 text-ai-primary" />,
      'audit': <FileText className="w-4 h-4 text-muted-foreground" />,
      'metrics': <Gauge className="w-4 h-4 text-sec-safe" />,
      'api': <Network className="w-4 h-4 text-primary" />,
      'pipelines': <GitBranch className="w-4 h-4 text-node-running" />,
      'logs': <Terminal className="w-4 h-4 text-muted-foreground" />,
      'actions': <Zap className="w-4 h-4 text-sec-warning" />,
      'telemetry': <Radio className="w-4 h-4 text-ai-primary" />,
      'model-registry': <Database className="w-4 h-4 text-ai-primary" />,
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
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sec-safe/10 text-sec-safe text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-sec-safe animate-pulse" />
                {metricsLoading ? 'Loading...' : 'Live'}
              </span>
            </div>
          </div>

          {/* Key Metrics - Now Clickable */}
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

          {/* Reorderable Widgets Grid with proper drag-drop */}
          <Reorder.Group 
            axis="y" 
            values={widgets} 
            onReorder={handleReorder}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min"
            style={{ touchAction: 'pan-y' }}
          >
            {widgets.map((widget) => (
              <Reorder.Item
                key={widget.id}
                value={widget}
                className={cn(
                  "cursor-grab active:cursor-grabbing",
                  widget.size === 'large' && "md:col-span-2",
                  widget.type === 'audit' && "md:row-span-2"
                )}
                whileDrag={{ 
                  scale: 1.02, 
                  zIndex: 50,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
                dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                dragElastic={0.1}
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
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      </div>

      {/* Enhanced Widget Picker */}
      <EnhancedWidgetPicker
        isOpen={showWidgetPicker}
        onClose={() => setShowWidgetPicker(false)}
        onAddWidget={handleAddWidget}
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
