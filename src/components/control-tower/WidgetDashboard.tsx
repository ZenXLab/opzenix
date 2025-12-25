import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  TrendingUp,
  Activity,
  FileText,
  Terminal,
  GitBranch,
  Gauge,
  Sparkles,
  GripVertical,
  Radio,
  Database,
  Shield,
  Network,
  BarChart3,
  PieChart,
  Layers,
  AlertTriangle,
  Zap,
  Eye,
  Lock,
  Cloud,
  Settings,
  LineChart,
  RotateCcw,
  Package,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Bell,
  Target,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ClickableMetricCard from '@/components/dashboard/ClickableMetricCard';
import DeploymentGraphWidget from '@/components/dashboard/widgets/DeploymentGraphWidget';
import AuditActivityWidget from '@/components/dashboard/widgets/AuditActivityWidget';
import SystemMetricsWidget from '@/components/dashboard/widgets/SystemMetricsWidget';
import APIPerformanceWidget from '@/components/dashboard/widgets/APIPerformanceWidget';
import PipelineStatusWidget from '@/components/dashboard/widgets/PipelineStatusWidget';
import LogStreamWidget from '@/components/dashboard/widgets/LogStreamWidget';
import QuickActionsWidget from '@/components/dashboard/widgets/QuickActionsWidget';
import { SystemHealthWidget } from '@/components/dashboard/widgets/SystemHealthWidget';
import { ArtifactsRegistryWidget } from '@/components/dashboard/widgets/ArtifactsRegistryWidget';
import KubernetesClusterWidget from '@/components/dashboard/widgets/KubernetesClusterWidget';
import TerraformStateWidget from '@/components/dashboard/widgets/TerraformStateWidget';
import ComplianceDashboardWidget from '@/components/dashboard/widgets/ComplianceDashboardWidget';
import SecretVaultWidget from '@/components/dashboard/widgets/SecretVaultWidget';
import CICDPipelineWidget from '@/components/dashboard/widgets/CICDPipelineWidget';
import IncidentManagementWidget from '@/components/dashboard/widgets/IncidentManagementWidget';
import EnhancedWidgetPicker from '@/components/dashboard/EnhancedWidgetPicker';
import DraggableWidget from '@/components/dashboard/DraggableWidget';
import { ArtifactTraceabilityPanel } from '@/components/artifacts/ArtifactTraceabilityPanel';
import { useFlowStore } from '@/stores/flowStore';
import { useWidgetMetrics } from '@/hooks/useWidgetMetrics';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================
// 🎛️ WIDGET DASHBOARD (CONTROL TOWER)
// ============================================
// Drag-and-drop widget-based dashboard for system monitoring
// ============================================

interface WidgetDashboardProps {
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
  | 'vulnerability-scan' | 'compliance' | 'secrets-audit' | 'secret-vault'
  | 'traces' | 'build-metrics' | 'test-coverage'
  | 'cpu-usage' | 'memory-usage' | 'network-io' | 'disk-usage'
  | 'active-connections' | 'request-latency' | 'error-rate'
  | 'artifacts' | 'notifications' | 'sla-monitor'
  | 'cicd-pipeline' | 'incident-management';

const WidgetDashboard = ({
  onOpenPipelineEditor,
  onOpenEnvironmentManager,
  onOpenOpzenixWizard,
  onOpenTemplatesGallery,
  onOpenGitHubConnection,
  onOpenExecutionHistory,
  onMetricClick,
}: WidgetDashboardProps) => {
  const { executions, deployments, approvalRequests } = useFlowStore();
  const { aggregated, loading: metricsLoading } = useWidgetMetrics();
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [traceabilityArtifactId, setTraceabilityArtifactId] = useState<string | null>(null);

  const {
    widgets,
    loading: layoutLoading,
    saving,
    addWidget,
    removeWidget,
    renameWidget,
    duplicateWidget,
    moveWidget,
    resetLayout,
  } = useDashboardLayout();

  const activeExecutions = aggregated.activeFlows || executions.filter((e) => e.status === 'running').length;
  const totalDeployments = aggregated.deploymentsToday || deployments.length;
  const successRate =
    aggregated.successRate ||
    (deployments.length > 0
      ? Math.round((deployments.filter((d) => d.status === 'success').length / deployments.length) * 100)
      : 100);
  const pendingApprovals = aggregated.pendingApprovals || approvalRequests.filter((a) => a.status === 'pending').length;

  const handleRemoveWidget = useCallback(
    (id: string) => {
      removeWidget(id);
      toast.success('Widget removed');
    },
    [removeWidget]
  );

  const handleRenameWidget = useCallback(
    (id: string, newName: string) => {
      renameWidget(id, newName);
    },
    [renameWidget]
  );

  const handleDuplicateWidget = useCallback(
    (id: string) => {
      duplicateWidget(id);
      toast.success('Widget duplicated');
    },
    [duplicateWidget]
  );

  const handleAddWidget = (type: string) => {
    const sizeMap: Record<string, 'small' | 'medium' | 'large'> = {
      logs: 'large',
      deployments: 'medium',
      audit: 'medium',
      traces: 'large',
      'system-health': 'medium',
    };
    const nameMap: Record<string, string> = {
      deployments: 'Deployments',
      audit: 'Audit Activity',
      metrics: 'System Metrics',
      api: 'API Performance',
      pipelines: 'Pipeline Status',
      logs: 'Log Stream',
      actions: 'Quick Actions',
      'system-health': 'System Health',
      'model-registry': 'Model Registry',
      'k8s-clusters': 'K8s Clusters',
      'vulnerability-scan': 'Vulnerability Scan',
      'cpu-usage': 'CPU Usage',
      'memory-usage': 'Memory Usage',
      'network-io': 'Network I/O',
      'disk-usage': 'Disk Usage',
      'active-connections': 'Active Connections',
      'request-latency': 'Request Latency',
      'error-rate': 'Error Rate',
      artifacts: 'Artifacts Registry',
      notifications: 'Notifications',
      'sla-monitor': 'SLA Monitor',
    };

    addWidget(type, nameMap[type] || type.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()), sizeMap[type] || 'small');
    setShowWidgetPicker(false);
    toast.success('Widget added');
  };

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
    const fromIndex = widgets.findIndex((w) => w.id === draggedWidget);
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
      case 'system-health':
        return <SystemHealthWidget onRemove={() => handleRemoveWidget(widget.id)} />;
      case 'artifacts':
        return <ArtifactsRegistryWidget {...commonProps} onViewTraceability={(id) => setTraceabilityArtifactId(id)} />;
      case 'k8s-clusters':
        return <KubernetesClusterWidget {...commonProps} />;
      case 'terraform-state':
        return <TerraformStateWidget {...commonProps} />;
      case 'compliance':
        return <ComplianceDashboardWidget {...commonProps} />;
      case 'secret-vault':
        return <SecretVaultWidget {...commonProps} />;
      case 'cicd-pipeline':
        return <CICDPipelineWidget {...commonProps} />;
      case 'incident-management':
        return <IncidentManagementWidget {...commonProps} />;
      case 'actions':
        return (
          <QuickActionsWidget
            {...commonProps}
            onOpenPipelineEditor={onOpenPipelineEditor}
            onOpenEnvironmentManager={onOpenEnvironmentManager}
            onOpenOpzenixWizard={onOpenOpzenixWizard}
          />
        );
      case 'cpu-usage':
        return <MetricPlaceholder icon={Cpu} label="CPU Usage" value="42%" trend="+2%" />;
      case 'memory-usage':
        return <MetricPlaceholder icon={HardDrive} label="Memory" value="6.2 GB" trend="-0.3 GB" />;
      case 'network-io':
        return <MetricPlaceholder icon={Wifi} label="Network I/O" value="124 MB/s" trend="+12 MB/s" />;
      case 'disk-usage':
        return <MetricPlaceholder icon={Database} label="Disk" value="78%" trend="+1%" />;
      case 'active-connections':
        return <MetricPlaceholder icon={Server} label="Connections" value="1,247" trend="+89" />;
      case 'request-latency':
        return <MetricPlaceholder icon={Timer} label="Latency" value="45ms" trend="-3ms" positive />;
      case 'error-rate':
        return <MetricPlaceholder icon={AlertTriangle} label="Error Rate" value="0.12%" trend="-0.02%" positive />;
      case 'sla-monitor':
        return <MetricPlaceholder icon={Target} label="SLA" value="99.97%" trend="+0.01%" positive />;
      case 'notifications':
        return <MetricPlaceholder icon={Bell} label="Alerts" value="3 active" trend="" />;
      default:
        return <PlaceholderWidgetContent type={widget.type} />;
    }
  };

  const getWidgetIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      deployments: <TrendingUp className="w-4 h-4 text-primary" />,
      audit: <FileText className="w-4 h-4 text-muted-foreground" />,
      metrics: <Gauge className="w-4 h-4 text-sec-safe" />,
      api: <Network className="w-4 h-4 text-primary" />,
      pipelines: <GitBranch className="w-4 h-4 text-node-running" />,
      logs: <Terminal className="w-4 h-4 text-muted-foreground" />,
      actions: <Zap className="w-4 h-4 text-sec-warning" />,
      telemetry: <Radio className="w-4 h-4 text-primary" />,
      'system-health': <Activity className="w-4 h-4 text-sec-safe" />,
      artifacts: <Package className="w-4 h-4 text-primary" />,
      'cpu-usage': <Cpu className="w-4 h-4 text-blue-500" />,
      'memory-usage': <HardDrive className="w-4 h-4 text-purple-500" />,
      'network-io': <Wifi className="w-4 h-4 text-cyan-500" />,
      'disk-usage': <Database className="w-4 h-4 text-amber-500" />,
      'active-connections': <Server className="w-4 h-4 text-green-500" />,
      'request-latency': <Timer className="w-4 h-4 text-orange-500" />,
      'error-rate': <AlertTriangle className="w-4 h-4 text-red-500" />,
      'sla-monitor': <Target className="w-4 h-4 text-emerald-500" />,
      notifications: <Bell className="w-4 h-4 text-yellow-500" />,
      'vulnerability-scan': <Shield className="w-4 h-4 text-red-500" />,
      compliance: <Lock className="w-4 h-4 text-sec-safe" />,
      'secrets-audit': <Lock className="w-4 h-4 text-sec-warning" />,
      traces: <LineChart className="w-4 h-4 text-primary" />,
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-auto bg-background">
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Control Tower</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                <GripVertical className="w-3.5 h-3.5 inline mr-1" />
                Drag to reorder • Right-click for options • Add widgets to customize
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowWidgetPicker(true)}>
                <Plus className="w-3.5 h-3.5" />
                Add Widget
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={resetLayout}>
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sec-safe/10 text-sec-safe text-xs font-medium">
                <span className={cn('w-1.5 h-1.5 rounded-full', saving ? 'bg-sec-warning animate-pulse' : 'bg-sec-safe animate-pulse')} />
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
              iconColor="text-primary"
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

          {/* Widgets Grid */}
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
                    y: dropTargetIndex === index && draggedWidget !== widget.id ? 8 : 0,
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'relative',
                    widget.size === 'large' && 'md:col-span-2',
                    widget.size === 'medium' && widget.type === 'audit' && 'md:row-span-2',
                    dropTargetIndex === index && draggedWidget !== widget.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg'
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
              <p className="text-sm text-muted-foreground mb-4">Add widgets to customize your Control Tower dashboard</p>
              <Button onClick={() => setShowWidgetPicker(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Widget
              </Button>
            </div>
          )}
        </div>
      </div>

      <EnhancedWidgetPicker isOpen={showWidgetPicker} onClose={() => setShowWidgetPicker(false)} onAddWidget={handleAddWidget} />

      <ArtifactTraceabilityPanel open={!!traceabilityArtifactId} onClose={() => setTraceabilityArtifactId(null)} artifactId={traceabilityArtifactId || undefined} />
    </motion.div>
  );
};

// Simple metric placeholder widget
const MetricPlaceholder = ({
  icon: Icon,
  label,
  value,
  trend,
  positive,
}: {
  icon: any;
  label: string;
  value: string;
  trend: string;
  positive?: boolean;
}) => (
  <div className="flex items-center justify-between p-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
    {trend && (
      <Badge variant={positive ? 'default' : 'secondary'} className="text-[10px]">
        {trend}
      </Badge>
    )}
  </div>
);

const PlaceholderWidgetContent = ({ type }: { type: string }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
      <Layers className="w-6 h-6 text-muted-foreground" />
    </div>
    <p className="text-sm font-medium text-foreground capitalize">{type.replace(/-/g, ' ')}</p>
    <p className="text-xs text-muted-foreground mt-1">Widget data loading...</p>
  </div>
);

export default WidgetDashboard;
