import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Plus, TrendingUp, Activity, FileText, Terminal,
  GitBranch, Gauge, Play, Sparkles, GripVertical, Radio,
  Database, Shield, Network, BarChart3, PieChart, Layers,
  AlertTriangle, Zap, Eye, Lock, Cloud, Settings, LineChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MetricCard from './MetricCard';
import DeploymentGraphWidget from './widgets/DeploymentGraphWidget';
import AuditActivityWidget from './widgets/AuditActivityWidget';
import SystemMetricsWidget from './widgets/SystemMetricsWidget';
import APIPerformanceWidget from './widgets/APIPerformanceWidget';
import PipelineStatusWidget from './widgets/PipelineStatusWidget';
import LogStreamWidget from './widgets/LogStreamWidget';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import EnhancedWidgetPicker from './EnhancedWidgetPicker';
import { useFlowStore } from '@/stores/flowStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ModularDashboardViewProps {
  onViewFlows: () => void;
  onOpenPipelineEditor?: () => void;
  onOpenEnvironmentManager?: () => void;
  onOpenOpzenixWizard?: () => void;
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
}

const ModularDashboardView = ({ 
  onViewFlows, 
  onOpenPipelineEditor,
  onOpenEnvironmentManager,
  onOpenOpzenixWizard
}: ModularDashboardViewProps) => {
  const { executions, deployments, approvalRequests } = useFlowStore();
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 'w1', type: 'actions', size: 'small' },
    { id: 'w2', type: 'deployments', size: 'medium' },
    { id: 'w3', type: 'metrics', size: 'small' },
    { id: 'w4', type: 'pipelines', size: 'small' },
    { id: 'w5', type: 'audit', size: 'medium' },
    { id: 'w6', type: 'api', size: 'small' },
    { id: 'w7', type: 'logs', size: 'large' },
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

  const handleAddWidget = (type: string) => {
    const sizeMap: Record<string, Widget['size']> = {
      'logs': 'large',
      'deployments': 'medium',
      'audit': 'medium',
      'traces': 'large',
    };
    setWidgets(prev => [...prev, { 
      id: `w-${Date.now()}`, 
      type: type as WidgetType, 
      size: sizeMap[type] || 'small'
    }]);
    setShowWidgetPicker(false);
    toast.success('Widget added');
  };

  const handleReorder = (newOrder: Widget[]) => {
    setWidgets(newOrder);
  };

  const renderWidget = (widget: Widget) => {
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
      // MLOps Widgets
      case 'model-registry':
        return <ModelRegistryWidget {...commonProps} />;
      case 'training-jobs':
        return <TrainingJobsWidget {...commonProps} />;
      case 'drift-monitor':
        return <DriftMonitorWidget {...commonProps} />;
      case 'feature-store':
        return <FeatureStoreWidget {...commonProps} />;
      // LLMOps Widgets
      case 'prompt-library':
        return <PromptLibraryWidget {...commonProps} />;
      case 'token-usage':
        return <TokenUsageWidget {...commonProps} />;
      case 'guardrails':
        return <GuardrailsWidget {...commonProps} />;
      case 'latency-monitor':
        return <LatencyMonitorWidget {...commonProps} />;
      // Infrastructure Widgets
      case 'cloud-resources':
        return <CloudResourcesWidget {...commonProps} />;
      case 'k8s-clusters':
        return <K8sClustersWidget {...commonProps} />;
      case 'terraform-state':
        return <TerraformStateWidget {...commonProps} />;
      // Security Widgets
      case 'vulnerability-scan':
        return <VulnerabilityScanWidget {...commonProps} />;
      case 'compliance':
        return <ComplianceWidget {...commonProps} />;
      case 'secrets-audit':
        return <SecretsAuditWidget {...commonProps} />;
      // Observability
      case 'traces':
        return <TracesWidget {...commonProps} />;
      case 'build-metrics':
        return <BuildMetricsWidget {...commonProps} />;
      case 'test-coverage':
        return <TestCoverageWidget {...commonProps} />;
      // AIOps
      case 'anomaly-detection':
        return <AnomalyDetectionWidget {...commonProps} />;
      case 'incident-prediction':
        return <IncidentPredictionWidget {...commonProps} />;
      case 'smart-alerts':
        return <SmartAlertsWidget {...commonProps} />;
      default:
        return <PlaceholderWidget {...commonProps} type={widget.type} />;
    }
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
                Drag to reorder widgets
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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
                System Healthy
              </span>
            </div>
          </div>

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
            values={widgets} 
            onReorder={handleReorder}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 auto-rows-min"
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
                whileDrag={{ scale: 1.02, zIndex: 50 }}
              >
                {renderWidget(widget)}
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

// Widget Components
interface WidgetProps {
  id: string;
  onRemove: (id: string) => void;
}

// Simple Telemetry Widget for OTel signals preview
const TelemetryWidget = ({ id, onRemove }: WidgetProps) => (
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
  </div>
);

// MLOps Widgets
const ModelRegistryWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-ai-primary" />
        <span className="text-sm font-medium text-foreground">Model Registry</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Production Models</span>
        <span className="text-foreground font-medium">12</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Staging Models</span>
        <span className="text-foreground font-medium">8</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Pending Review</span>
        <span className="text-sec-warning font-medium">3</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Last Deployed</span>
        <span className="text-foreground font-medium">2h ago</span>
      </div>
    </div>
    <div className="pt-2 border-t border-border">
      <div className="flex items-center gap-2 text-[10px]">
        <Badge variant="outline" className="text-[9px]">xgboost-v3.2</Badge>
        <Badge variant="outline" className="text-[9px] bg-sec-safe/10 text-sec-safe border-sec-safe/20">prod</Badge>
      </div>
    </div>
  </div>
);

const TrainingJobsWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-sec-warning" />
        <span className="text-sm font-medium text-foreground">Training Jobs</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-3">
      <div className="p-2 rounded bg-secondary/50 border border-border">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium">fraud-detection-v4</span>
          <Badge className="text-[9px] bg-node-running/10 text-node-running border-node-running/20">running</Badge>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-node-running rounded-full" style={{ width: '68%' }} />
        </div>
        <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
          <span>Epoch 68/100</span>
          <span>Loss: 0.0234</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">GPU Utilization</span>
        <span className="text-foreground font-medium">94%</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Queued Jobs</span>
        <span className="text-foreground font-medium">2</span>
      </div>
    </div>
  </div>
);

const DriftMonitorWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-sec-warning" />
        <span className="text-sm font-medium text-foreground">Drift Monitor</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Data Drift Score</span>
        <span className="text-sec-safe font-medium">0.12</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Prediction Drift</span>
        <span className="text-sec-warning font-medium">0.28</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Feature Anomalies</span>
        <span className="text-foreground font-medium">2</span>
      </div>
    </div>
    <div className="pt-2 border-t border-border text-[10px] text-muted-foreground">
      Next retrain suggested in 3 days
    </div>
  </div>
);

const FeatureStoreWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-ai-primary" />
        <span className="text-sm font-medium text-foreground">Feature Store</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Total Features</span>
        <span className="text-foreground font-medium">1,247</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Fresh Features</span>
        <span className="text-sec-safe font-medium">1,198</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Stale Features</span>
        <span className="text-sec-warning font-medium">49</span>
      </div>
    </div>
  </div>
);

// LLMOps Widgets
const PromptLibraryWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-ai-primary" />
        <span className="text-sm font-medium text-foreground">Prompt Library</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Active Prompts</span>
        <span className="text-foreground font-medium">34</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">A/B Tests Running</span>
        <span className="text-node-running font-medium">5</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Avg. Quality Score</span>
        <span className="text-sec-safe font-medium">4.7/5</span>
      </div>
    </div>
  </div>
);

const TokenUsageWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <PieChart className="w-4 h-4 text-ai-primary" />
        <span className="text-sm font-medium text-foreground">Token Usage</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Today's Tokens</span>
        <span className="text-foreground font-medium">2.4M</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Estimated Cost</span>
        <span className="text-foreground font-medium">$142</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Budget Used</span>
        <span className="text-sec-warning font-medium">68%</span>
      </div>
    </div>
    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-sec-safe to-sec-warning" style={{ width: '68%' }} />
    </div>
  </div>
);

const GuardrailsWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-sec-safe" />
        <span className="text-sm font-medium text-foreground">Guardrails Status</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Requests Blocked</span>
        <span className="text-sec-critical font-medium">127</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">False Positives</span>
        <span className="text-sec-warning font-medium">12</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Policy Violations</span>
        <span className="text-foreground font-medium">3</span>
      </div>
    </div>
  </div>
);

const LatencyMonitorWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Gauge className="w-4 h-4 text-ai-primary" />
        <span className="text-sm font-medium text-foreground">LLM Latency</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">P50 Latency</span>
        <span className="text-sec-safe font-medium">245ms</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">P95 Latency</span>
        <span className="text-sec-warning font-medium">890ms</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">P99 Latency</span>
        <span className="text-foreground font-medium">1.2s</span>
      </div>
    </div>
  </div>
);

// Infrastructure Widgets
const CloudResourcesWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Cloud className="w-4 h-4 text-ai-primary" />
        <span className="text-sm font-medium text-foreground">Cloud Resources</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Running Instances</span>
        <span className="text-foreground font-medium">47</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Monthly Cost</span>
        <span className="text-foreground font-medium">$12.4k</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Avg CPU Usage</span>
        <span className="text-sec-safe font-medium">62%</span>
      </div>
    </div>
    <div className="flex gap-1.5 pt-2 border-t border-border">
      <Badge variant="outline" className="text-[9px]">AWS</Badge>
      <Badge variant="outline" className="text-[9px]">GCP</Badge>
      <Badge variant="outline" className="text-[9px]">Azure</Badge>
    </div>
  </div>
);

const K8sClustersWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Network className="w-4 h-4 text-ai-primary" />
        <span className="text-sm font-medium text-foreground">Kubernetes Health</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Clusters</span>
        <span className="text-sec-safe font-medium">3 healthy</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Running Pods</span>
        <span className="text-foreground font-medium">247/250</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Pending Pods</span>
        <span className="text-sec-warning font-medium">3</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Failed Pods</span>
        <span className="text-sec-critical font-medium">0</span>
      </div>
    </div>
  </div>
);

const TerraformStateWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-ai-primary" />
        <span className="text-sm font-medium text-foreground">Terraform State</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Managed Resources</span>
        <span className="text-foreground font-medium">312</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Drift Detected</span>
        <span className="text-sec-warning font-medium">4</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Last Apply</span>
        <span className="text-foreground font-medium">4h ago</span>
      </div>
    </div>
  </div>
);

// Security Widgets
const VulnerabilityScanWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-sec-critical" />
        <span className="text-sm font-medium text-foreground">Vulnerabilities</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Critical</span>
        <span className="text-sec-critical font-medium">0</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">High</span>
        <span className="text-sec-warning font-medium">3</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Medium</span>
        <span className="text-foreground font-medium">12</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Low</span>
        <span className="text-muted-foreground font-medium">28</span>
      </div>
    </div>
    <div className="pt-2 border-t border-border text-[10px] text-muted-foreground">
      Last scan: 2 hours ago
    </div>
  </div>
);

const ComplianceWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-sec-safe" />
        <span className="text-sm font-medium text-foreground">Compliance Status</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">SOC 2</span>
        <Badge variant="outline" className="text-[9px] bg-sec-safe/10 text-sec-safe">compliant</Badge>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">HIPAA</span>
        <Badge variant="outline" className="text-[9px] bg-sec-safe/10 text-sec-safe">compliant</Badge>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">PCI DSS</span>
        <Badge variant="outline" className="text-[9px] bg-sec-warning/10 text-sec-warning">review needed</Badge>
      </div>
    </div>
  </div>
);

const SecretsAuditWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-ai-primary" />
        <span className="text-sm font-medium text-foreground">Secrets Audit</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Total Secrets</span>
        <span className="text-foreground font-medium">87</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Expiring Soon</span>
        <span className="text-sec-warning font-medium">4</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Last Rotated</span>
        <span className="text-foreground font-medium">12h ago</span>
      </div>
    </div>
  </div>
);

// Observability Widgets
const TracesWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-ai-primary" />
        <span className="text-sm font-medium text-foreground">Distributed Traces</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Traces/min</span>
        <span className="text-foreground font-medium">4.2k</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Error Rate</span>
        <span className="text-sec-safe font-medium">0.2%</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Avg Latency</span>
        <span className="text-foreground font-medium">142ms</span>
      </div>
    </div>
  </div>
);

const BuildMetricsWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-ai-primary" />
        <span className="text-sm font-medium text-foreground">Build Metrics</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Avg Build Time</span>
        <span className="text-foreground font-medium">3m 42s</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Cache Hit Rate</span>
        <span className="text-sec-safe font-medium">89%</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Builds Today</span>
        <span className="text-foreground font-medium">47</span>
      </div>
    </div>
  </div>
);

const TestCoverageWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <LineChart className="w-4 h-4 text-sec-safe" />
        <span className="text-sm font-medium text-foreground">Test Coverage</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Line Coverage</span>
        <span className="text-sec-safe font-medium">87%</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Branch Coverage</span>
        <span className="text-sec-warning font-medium">72%</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Tests Passing</span>
        <span className="text-foreground font-medium">847/851</span>
      </div>
    </div>
  </div>
);

// AIOps Widgets
const AnomalyDetectionWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-ai-primary" />
        <span className="text-sm font-medium text-foreground">Anomaly Detection</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Anomalies (24h)</span>
        <span className="text-sec-warning font-medium">7</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Auto-resolved</span>
        <span className="text-sec-safe font-medium">5</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Needs Attention</span>
        <span className="text-sec-critical font-medium">2</span>
      </div>
    </div>
  </div>
);

const IncidentPredictionWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-sec-warning" />
        <span className="text-sm font-medium text-foreground">Incident Prediction</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Risk Score</span>
        <span className="text-sec-safe font-medium">Low</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Predicted Issues</span>
        <span className="text-foreground font-medium">0</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">MTTR (avg)</span>
        <span className="text-foreground font-medium">12m</span>
      </div>
    </div>
  </div>
);

const SmartAlertsWidget = ({ id, onRemove }: WidgetProps) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-ai-primary" />
        <span className="text-sm font-medium text-foreground">Smart Alerts</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Noise Reduced</span>
        <span className="text-sec-safe font-medium">78%</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Active Alerts</span>
        <span className="text-foreground font-medium">4</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Auto-grouped</span>
        <span className="text-foreground font-medium">12</span>
      </div>
    </div>
  </div>
);

// Placeholder for any unimplemented widgets
const PlaceholderWidget = ({ id, onRemove, type }: WidgetProps & { type: string }) => (
  <div className="p-4 bg-card border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground capitalize">{type.replace(/-/g, ' ')}</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
        <span className="text-xs">×</span>
      </Button>
    </div>
    <p className="text-xs text-muted-foreground">Widget coming soon...</p>
  </div>
);

export default ModularDashboardView;
