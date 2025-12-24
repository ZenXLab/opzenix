import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, TrendingUp, Activity, FileText, Terminal, GitBranch, Gauge,
  Play, Radio, Shield, Bell, RotateCcw, Database, Brain, Box, Sparkles,
  Server, Cloud, Lock, Eye, BarChart3, AlertTriangle, Workflow, 
  Layers, Clock, Zap, Settings, Network, LineChart, PieChart,
  ArrowRight, Check, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface WidgetConfig {
  type: string;
  label: string;
  description: string;
  icon: typeof TrendingUp;
  category: string;
  capabilities: string[];
  useCase: string;
}

interface EnhancedWidgetPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: string) => void;
}

const widgetCategories = [
  { id: 'cicd', label: 'CI/CD', icon: GitBranch, description: 'Build, test, deploy' },
  { id: 'mlops', label: 'MLOps', icon: Brain, description: 'ML pipelines & models' },
  { id: 'llmops', label: 'LLMOps', icon: Box, description: 'LLM operations' },
  { id: 'aiops', label: 'AIOps', icon: Sparkles, description: 'AI-driven ops' },
  { id: 'infrastructure', label: 'Infrastructure', icon: Server, description: 'Cloud & infra' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Security & compliance' },
  { id: 'observability', label: 'Observability', icon: Eye, description: 'Logs, traces, metrics' },
];

const allWidgets: WidgetConfig[] = [
  // CI/CD Widgets
  { 
    type: 'deployments', 
    label: 'Deployment Trends', 
    description: 'Track deployment frequency, success rates, and trends over time',
    icon: TrendingUp, 
    category: 'cicd',
    capabilities: ['Deployment history', 'Success rate metrics', 'Trend analysis', 'Environment comparison'],
    useCase: 'Monitor deployment health and identify patterns in deployment failures'
  },
  { 
    type: 'pipelines', 
    label: 'Pipeline Status', 
    description: 'Real-time view of all active and recent pipeline executions',
    icon: Workflow, 
    category: 'cicd',
    capabilities: ['Active pipelines', 'Stage progress', 'Failure alerts', 'Duration tracking'],
    useCase: 'Quick overview of pipeline health and identify bottlenecks'
  },
  { 
    type: 'build-metrics', 
    label: 'Build Metrics', 
    description: 'Build duration, cache hit rates, and compilation statistics',
    icon: BarChart3, 
    category: 'cicd',
    capabilities: ['Build times', 'Cache efficiency', 'Resource usage', 'Cost analysis'],
    useCase: 'Optimize build performance and reduce CI costs'
  },
  { 
    type: 'test-coverage', 
    label: 'Test Coverage', 
    description: 'Code coverage trends and test suite health',
    icon: Check, 
    category: 'cicd',
    capabilities: ['Coverage %', 'Test pass rate', 'Flaky tests', 'Coverage trends'],
    useCase: 'Maintain code quality and catch regressions early'
  },

  // MLOps Widgets
  { 
    type: 'model-registry', 
    label: 'Model Registry', 
    description: 'Track all ML models, versions, and their deployment status',
    icon: Database, 
    category: 'mlops',
    capabilities: ['Model versions', 'Stage transitions', 'A/B experiments', 'Rollback history'],
    useCase: 'Manage ML model lifecycle from training to production'
  },
  { 
    type: 'training-jobs', 
    label: 'Training Jobs', 
    description: 'Monitor active training runs with metrics and resource usage',
    icon: Zap, 
    category: 'mlops',
    capabilities: ['Training progress', 'Loss curves', 'GPU utilization', 'Hyperparameters'],
    useCase: 'Track training experiments and optimize compute resources'
  },
  { 
    type: 'drift-monitor', 
    label: 'Drift Monitor', 
    description: 'Detect data and model drift in production',
    icon: AlertTriangle, 
    category: 'mlops',
    capabilities: ['Feature drift', 'Prediction drift', 'Data quality', 'Auto-retrain triggers'],
    useCase: 'Maintain model accuracy by detecting when retraining is needed'
  },
  { 
    type: 'feature-store', 
    label: 'Feature Store', 
    description: 'Browse and monitor shared ML features',
    icon: Layers, 
    category: 'mlops',
    capabilities: ['Feature catalog', 'Freshness status', 'Usage stats', 'Lineage'],
    useCase: 'Reuse features across models and ensure consistency'
  },

  // LLMOps Widgets
  { 
    type: 'prompt-library', 
    label: 'Prompt Library', 
    description: 'Manage prompt templates and their versions',
    icon: FileText, 
    category: 'llmops',
    capabilities: ['Template versions', 'A/B variants', 'Performance metrics', 'Cost tracking'],
    useCase: 'Version control prompts and optimize for quality and cost'
  },
  { 
    type: 'token-usage', 
    label: 'Token Usage', 
    description: 'Track token consumption and LLM costs',
    icon: PieChart, 
    category: 'llmops',
    capabilities: ['Token counts', 'Cost breakdown', 'Model comparison', 'Budget alerts'],
    useCase: 'Control LLM costs and optimize token efficiency'
  },
  { 
    type: 'guardrails', 
    label: 'Guardrails Status', 
    description: 'Monitor safety filters and content moderation',
    icon: Shield, 
    category: 'llmops',
    capabilities: ['Filter triggers', 'Block rate', 'False positives', 'Policy updates'],
    useCase: 'Ensure safe and compliant LLM outputs'
  },
  { 
    type: 'latency-monitor', 
    label: 'LLM Latency', 
    description: 'Track response times across different models and prompts',
    icon: Clock, 
    category: 'llmops',
    capabilities: ['P50/P95/P99', 'Model comparison', 'Timeout tracking', 'SLA compliance'],
    useCase: 'Optimize response times and meet SLA requirements'
  },

  // AIOps Widgets
  { 
    type: 'anomaly-detection', 
    label: 'Anomaly Detection', 
    description: 'AI-powered detection of system anomalies',
    icon: Activity, 
    category: 'aiops',
    capabilities: ['Auto-detection', 'Root cause', 'Correlation', 'Predictions'],
    useCase: 'Proactively identify issues before they impact users'
  },
  { 
    type: 'incident-prediction', 
    label: 'Incident Prediction', 
    description: 'Predict potential incidents before they occur',
    icon: AlertTriangle, 
    category: 'aiops',
    capabilities: ['Risk scoring', 'Early warnings', 'Pattern matching', 'Recommendations'],
    useCase: 'Reduce MTTR by addressing issues proactively'
  },
  { 
    type: 'smart-alerts', 
    label: 'Smart Alerts', 
    description: 'AI-deduplicated and prioritized alerts',
    icon: Bell, 
    category: 'aiops',
    capabilities: ['Noise reduction', 'Priority ranking', 'Grouping', 'Auto-resolution'],
    useCase: 'Reduce alert fatigue and focus on critical issues'
  },

  // Infrastructure Widgets
  { 
    type: 'cloud-resources', 
    label: 'Cloud Resources', 
    description: 'Monitor cloud infrastructure across providers',
    icon: Cloud, 
    category: 'infrastructure',
    capabilities: ['Multi-cloud view', 'Cost tracking', 'Utilization', 'Scaling events'],
    useCase: 'Unified view of all cloud resources and costs'
  },
  { 
    type: 'k8s-clusters', 
    label: 'Kubernetes Health', 
    description: 'Monitor K8s clusters, pods, and deployments',
    icon: Network, 
    category: 'infrastructure',
    capabilities: ['Cluster health', 'Pod status', 'Resource limits', 'HPA metrics'],
    useCase: 'Ensure Kubernetes workloads are healthy and efficient'
  },
  { 
    type: 'terraform-state', 
    label: 'Terraform State', 
    description: 'Track infrastructure as code state and drift',
    icon: Settings, 
    category: 'infrastructure',
    capabilities: ['State overview', 'Drift detection', 'Change history', 'Module deps'],
    useCase: 'Maintain infrastructure consistency and prevent drift'
  },

  // Security Widgets
  { 
    type: 'vulnerability-scan', 
    label: 'Vulnerabilities', 
    description: 'Track security vulnerabilities across codebases',
    icon: Shield, 
    category: 'security',
    capabilities: ['CVE tracking', 'Severity levels', 'Fix suggestions', 'SLA tracking'],
    useCase: 'Maintain security posture and track remediation'
  },
  { 
    type: 'compliance', 
    label: 'Compliance Status', 
    description: 'Monitor compliance with security frameworks',
    icon: Lock, 
    category: 'security',
    capabilities: ['SOC2/HIPAA/PCI', 'Control status', 'Evidence', 'Audit trail'],
    useCase: 'Ensure continuous compliance with regulatory requirements'
  },
  { 
    type: 'secrets-audit', 
    label: 'Secrets Audit', 
    description: 'Track secret rotation and access patterns',
    icon: Eye, 
    category: 'security',
    capabilities: ['Rotation status', 'Access logs', 'Expiry alerts', 'Usage patterns'],
    useCase: 'Maintain secure secrets management practices'
  },

  // Observability Widgets
  { 
    type: 'logs', 
    label: 'Live Logs', 
    description: 'Real-time log streaming with intelligent filtering',
    icon: Terminal, 
    category: 'observability',
    capabilities: ['Live stream', 'Pattern search', 'Log levels', 'Correlation'],
    useCase: 'Debug issues with real-time log access'
  },
  { 
    type: 'traces', 
    label: 'Distributed Traces', 
    description: 'End-to-end request tracing across services',
    icon: Activity, 
    category: 'observability',
    capabilities: ['Trace viewer', 'Span analysis', 'Latency breakdown', 'Error traces'],
    useCase: 'Debug distributed systems and identify bottlenecks'
  },
  { 
    type: 'metrics', 
    label: 'System Metrics', 
    description: 'Core infrastructure and application metrics',
    icon: LineChart, 
    category: 'observability',
    capabilities: ['Custom dashboards', 'Alerting', 'Anomaly detection', 'SLO tracking'],
    useCase: 'Monitor system health and performance'
  },
  { 
    type: 'telemetry', 
    label: 'OTel Signals', 
    description: 'OpenTelemetry signals overview',
    icon: Radio, 
    category: 'observability',
    capabilities: ['Trace correlation', 'Metric ingestion', 'Log enrichment', 'Flow context'],
    useCase: 'Unified observability with OTel standards'
  },
  { 
    type: 'api', 
    label: 'API Performance', 
    description: 'Track API latency, errors, and throughput',
    icon: Gauge, 
    category: 'observability',
    capabilities: ['Latency P99', 'Error rates', 'RPS', 'Endpoint breakdown'],
    useCase: 'Ensure API reliability and performance'
  },
  { 
    type: 'audit', 
    label: 'Audit Activity', 
    description: 'Track all user and system actions',
    icon: FileText, 
    category: 'observability',
    capabilities: ['Action history', 'User attribution', 'Change tracking', 'Export'],
    useCase: 'Maintain audit trail for compliance and debugging'
  },
  { 
    type: 'actions', 
    label: 'Quick Actions', 
    description: 'One-click shortcuts for common operations',
    icon: Play, 
    category: 'cicd',
    capabilities: ['Pipeline triggers', 'Deployments', 'Rollbacks', 'Feature flags'],
    useCase: 'Speed up common operations with quick access buttons'
  },
  { 
    type: 'artifacts', 
    label: 'Artifact Registry', 
    description: 'Track Docker images, digests, and registry URLs',
    icon: Layers, 
    category: 'cicd',
    capabilities: ['Image tracking', 'Digest verification', 'Version history', 'Provenance chain'],
    useCase: 'Monitor and trace all build artifacts with full provenance'
  },
];

const EnhancedWidgetPicker = ({ isOpen, onClose, onAddWidget }: EnhancedWidgetPickerProps) => {
  const [selectedCategory, setSelectedCategory] = useState('cicd');
  const [selectedWidget, setSelectedWidget] = useState<WidgetConfig | null>(null);

  const filteredWidgets = allWidgets.filter(w => w.category === selectedCategory);

  const handleAddWidget = () => {
    if (selectedWidget) {
      onAddWidget(selectedWidget.type);
      setSelectedWidget(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-ai-primary" />
            Add Widget
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[65vh]">
          {/* Categories Sidebar */}
          <div className="w-52 border-r border-border p-3 space-y-1 bg-secondary/20">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-2">Categories</p>
            {widgetCategories.map((cat) => {
              const Icon = cat.icon;
              const count = allWidgets.filter(w => w.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    selectedCategory === cat.id 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left text-xs">{cat.label}</span>
                  <Badge variant="outline" className="text-[9px] px-1.5">{count}</Badge>
                </button>
              );
            })}
          </div>

          {/* Widgets Grid */}
          <div className="flex-1 flex overflow-hidden">
            <ScrollArea className={cn("flex-1 p-4", selectedWidget && "w-1/2")}>
              <div className="grid grid-cols-2 gap-3">
                {filteredWidgets.map((widget) => {
                  const Icon = widget.icon;
                  const isSelected = selectedWidget?.type === widget.type;
                  return (
                    <button
                      key={widget.type}
                      onClick={() => setSelectedWidget(widget)}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-all",
                        isSelected 
                          ? "border-primary bg-primary/5 ring-1 ring-primary" 
                          : "border-border hover:border-primary/50 hover:bg-secondary/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isSelected ? "bg-primary/10" : "bg-secondary"
                        )}>
                          <Icon className={cn(
                            "w-5 h-5",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium mb-1">{widget.label}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {widget.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Widget Details */}
            <AnimatePresence>
              {selectedWidget && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '50%', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="border-l border-border overflow-hidden"
                >
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <selectedWidget.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold">{selectedWidget.label}</h3>
                          <p className="text-xs text-muted-foreground">{selectedWidget.description}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Capabilities</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedWidget.capabilities.map((cap) => (
                              <Badge key={cap} variant="secondary" className="text-[10px]">
                                {cap}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-ai-primary shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[11px] font-medium mb-1">Use Case</p>
                              <p className="text-[11px] text-muted-foreground">{selectedWidget.useCase}</p>
                            </div>
                          </div>
                        </div>

                        <Button 
                          className="w-full gap-2" 
                          onClick={handleAddWidget}
                        >
                          Add Widget
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedWidgetPicker;
