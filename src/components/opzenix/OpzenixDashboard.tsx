import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Shield,
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Lock,
  Eye,
  RefreshCw,
  Zap,
  GitBranch,
  Rocket,
  Layers,
  ArrowRight,
  BarChart3,
  Server,
  Settings2,
  Plus,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Reorder } from 'framer-motion';
import { useControlTowerRealtime } from '@/hooks/useControlTowerRealtime';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useRBACPermissions } from '@/hooks/useRBACPermissions';
import BreakGlassModal from './screens/BreakGlassModal';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// ============================================
// 🏢 OPZENIX DASHBOARD WITH DRAG & DROP
// ============================================

interface OpzenixDashboardProps {
  onNavigateToFlow: (flowType: 'ci-flow' | 'cd-flow' | 'full-flow', env: string) => void;
  currentEnvironment: string;
}

// Widget type definitions
const WIDGET_CATALOG = [
  { type: 'env-health', name: 'Environment Health', icon: Server, size: 'large' as const },
  { type: 'metrics', name: 'Key Metrics', icon: BarChart3, size: 'large' as const },
  { type: 'pipelines', name: 'Pipeline Access', icon: GitBranch, size: 'large' as const },
  { type: 'approvals', name: 'Pending Approvals', icon: FileText, size: 'medium' as const },
  { type: 'deployments', name: 'Recent Deployments', icon: Rocket, size: 'medium' as const },
  { type: 'security', name: 'Security Score', icon: Shield, size: 'small' as const },
  { type: 'audit', name: 'Audit Feed', icon: FileText, size: 'medium' as const },
];

export function OpzenixDashboard({ onNavigateToFlow, currentEnvironment }: OpzenixDashboardProps) {
  const [breakGlassOpen, setBreakGlassOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);

  const { dbRole, canBreakGlass } = useRBACPermissions();
  const {
    widgets,
    loading,
    saving,
    addWidget,
    removeWidget,
    renameWidget,
    duplicateWidget,
    reorderWidgets,
    resetLayout,
  } = useDashboardLayout();

  const {
    executions,
    activeExecutions,
    pendingApprovals,
    recentDeployments,
    isConnected,
    refetch,
  } = useControlTowerRealtime();

  // Derive metrics
  const metrics = {
    running: activeExecutions?.length || 0,
    total: executions?.length || 0,
    success: executions?.filter((e) => e.status === 'success').length || 0,
    pending: pendingApprovals?.length || 0,
  };

  const successRate = metrics.total > 0 
    ? Math.round((metrics.success / metrics.total) * 100) 
    : 100;

  const environments = [
    { id: 'dev', label: 'DEV', status: 'healthy' },
    { id: 'uat', label: 'UAT', status: 'healthy' },
    { id: 'staging', label: 'STG', status: 'deploying' },
    { id: 'preprod', label: 'PRE', status: 'healthy' },
    { id: 'prod', label: 'PROD', status: 'healthy', restricted: true },
  ];

  const handleResize = (id: string, size: 'small' | 'medium' | 'large') => {
    const newWidgets = widgets.map(w => w.id === id ? { ...w, size } : w);
    reorderWidgets(newWidgets);
  };

  const handleAddWidget = (type: string, name: string, size: 'small' | 'medium' | 'large') => {
    addWidget(type, name, size);
    setAddWidgetOpen(false);
  };

  // Render widget content based on type
  const renderWidgetContent = (widget: any) => {
    switch (widget.type) {
      case 'env-health':
        return <EnvironmentHealthWidget environments={environments} currentEnvironment={currentEnvironment} />;
      case 'metrics':
        return <MetricsWidget metrics={metrics} successRate={successRate} />;
      case 'pipelines':
        return <PipelineAccessWidget onNavigate={onNavigateToFlow} currentEnvironment={currentEnvironment} />;
      case 'approvals':
        return <ApprovalsWidget approvals={pendingApprovals || []} count={metrics.pending} />;
      case 'deployments':
        return <DeploymentsWidget deployments={recentDeployments || []} />;
      case 'security':
        return <SecurityWidget />;
      case 'audit':
        return <AuditWidget />;
      default:
        return <PlaceholderWidget type={widget.type} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Dashboard Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Control Tower</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Eye className="w-3 h-3" />
                Enterprise Operations Dashboard
                {saving && <Badge variant="secondary" className="text-[10px]">Saving...</Badge>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              Role: {dbRole?.toUpperCase() || 'VIEWER'}
            </Badge>
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
              isConnected ? 'bg-sec-safe/10 text-sec-safe' : 'bg-sec-warning/10 text-sec-warning'
            )}>
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                isConnected ? 'bg-sec-safe animate-pulse' : 'bg-sec-warning'
              )} />
              {isConnected ? 'Live' : 'Reconnecting...'}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={refetch}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh Data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              <Settings2 className="w-3.5 h-3.5" />
              {isEditMode ? 'Done' : 'Customize'}
            </Button>
            {canBreakGlass() && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => setBreakGlassOpen(true)}
              >
                <Zap className="w-3.5 h-3.5" />
                Break Glass
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Break Glass Modal */}
      <BreakGlassModal open={breakGlassOpen} onClose={() => setBreakGlassOpen(false)} environment="prod" />

      {/* Add Widget Dialog */}
      <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
            <DialogDescription>Choose a widget to add to your dashboard</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {WIDGET_CATALOG.map((w) => {
              const Icon = w.icon;
              return (
                <button
                  key={w.type}
                  onClick={() => handleAddWidget(w.type, w.name, w.size)}
                  className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 text-left transition-all"
                >
                  <Icon className="w-5 h-5 text-primary mb-2" />
                  <p className="text-sm font-medium text-foreground">{w.name}</p>
                  <Badge variant="secondary" className="text-[10px] mt-1">{w.size}</Badge>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dashboard Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {/* Edit Mode Toolbar */}
          <AnimatePresence>
            {isEditMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center justify-between p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5"
              >
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Edit Mode</span>
                  <span className="text-xs text-muted-foreground">
                    Drag widgets to reorder, click ⋮ to configure
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAddWidgetOpen(true)}>
                    <Plus className="w-3 h-3" />
                    Add Widget
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={resetLayout}>
                    <RefreshCw className="w-3 h-3" />
                    Reset
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Draggable Widget Grid */}
          <Reorder.Group
            axis="y"
            values={widgets}
            onReorder={reorderWidgets}
            className="space-y-4"
          >
            {widgets.map((widget) => (
              <Reorder.Item
                key={widget.id}
                value={widget}
                className="relative"
                whileDrag={{ scale: 1.02, zIndex: 50 }}
              >
                <div className={cn(
                  'rounded-xl border bg-card overflow-hidden transition-all',
                  isEditMode && 'ring-2 ring-primary/20 ring-dashed hover:ring-primary/40'
                )}>
                  {/* Widget Edit Header */}
                  <AnimatePresence>
                    {isEditMode && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-b border-border bg-muted/50 px-4 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <div className="w-4 h-0.5 bg-muted-foreground/50 rounded" />
                            <div className="w-4 h-0.5 bg-muted-foreground/50 rounded" />
                            <div className="w-4 h-0.5 bg-muted-foreground/50 rounded" />
                          </div>
                          <span className="text-xs font-medium text-foreground">{widget.name || widget.type}</span>
                          <Badge variant="secondary" className="text-[10px]">{widget.size}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleResize(widget.id, widget.size === 'small' ? 'medium' : widget.size === 'medium' ? 'large' : 'small')}
                          >
                            <Settings2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => duplicateWidget(widget.id)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => removeWidget(widget.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Widget Content */}
                  <div className="p-4">
                    {renderWidgetContent(widget)}
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================
// WIDGET COMPONENTS
// ============================================

function EnvironmentHealthWidget({ environments, currentEnvironment }: { environments: any[]; currentEnvironment: string }) {
  const getEnvStatus = (status: string) => {
    switch (status) {
      case 'healthy': return { icon: CheckCircle, color: 'text-sec-safe', bg: 'bg-sec-safe/10' };
      case 'deploying': return { icon: RefreshCw, color: 'text-node-running', bg: 'bg-node-running/10' };
      default: return { icon: AlertTriangle, color: 'text-muted-foreground', bg: 'bg-muted/50' };
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Server className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Environment Health</h3>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {environments.map((env) => {
          const status = getEnvStatus(env.status);
          const StatusIcon = status.icon;
          const isActive = currentEnvironment === env.id;
          return (
            <div
              key={env.id}
              className={cn(
                'p-3 rounded-lg border transition-all',
                isActive ? 'border-primary bg-primary/5' : 'border-border bg-card',
                env.restricted && 'ring-1 ring-sec-danger/20'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">{env.label}</span>
                <StatusIcon className={cn('w-4 h-4', status.color, env.status === 'deploying' && 'animate-spin')} />
              </div>
              <p className={cn('text-xs capitalize', status.color)}>{env.status}</p>
              {env.restricted && (
                <Badge variant="outline" className="mt-2 text-[10px] border-sec-danger/30 text-sec-danger">
                  <Lock className="w-2.5 h-2.5 mr-1" />
                  Restricted
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricsWidget({ metrics, successRate }: { metrics: any; successRate: number }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Key Metrics</h3>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={Activity} label="Active" value={metrics.running} color="text-node-running" />
        <MetricCard icon={FileText} label="Pending" value={metrics.pending} color="text-sec-warning" />
        <MetricCard icon={CheckCircle} label="Success" value={`${successRate}%`} color="text-sec-safe" />
        <MetricCard icon={Shield} label="Security" value="A+" color="text-primary" />
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="p-4 rounded-lg border border-border bg-muted/20">
      <Icon className={cn('w-5 h-5 mb-2', color)} />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function PipelineAccessWidget({ onNavigate, currentEnvironment }: { onNavigate: any; currentEnvironment: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Pipeline Quick Access</h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <PipelineCard title="CI Pipeline" icon={GitBranch} color="blue" onClick={() => onNavigate('ci-flow', currentEnvironment)} />
        <PipelineCard title="CD Pipeline" icon={Rocket} color="green" onClick={() => onNavigate('cd-flow', currentEnvironment)} />
        <PipelineCard title="Full Flow" icon={Layers} color="purple" onClick={() => onNavigate('full-flow', currentEnvironment)} readOnly />
      </div>
    </div>
  );
}

function PipelineCard({ title, icon: Icon, color, onClick, readOnly }: { title: string; icon: any; color: string; onClick: () => void; readOnly?: boolean }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    green: 'bg-green-500/10 text-green-500 border-green-500/30',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  };
  return (
    <button onClick={onClick} className={cn('p-4 rounded-lg border text-left transition-all hover:scale-[1.02]', colors[color])}>
      <Icon className="w-5 h-5 mb-2" />
      <p className="text-sm font-medium">{title}</p>
      {readOnly && <Badge variant="secondary" className="text-[10px] mt-1">Read-Only</Badge>}
      <div className="flex items-center text-xs mt-2 opacity-70">
        View <ArrowRight className="w-3 h-3 ml-1" />
      </div>
    </button>
  );
}

function ApprovalsWidget({ approvals, count }: { approvals: any[]; count: number }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-sec-warning" />
        <h3 className="text-sm font-semibold text-foreground">Pending Approvals</h3>
        {count > 0 && <Badge className="bg-sec-warning/20 text-sec-warning text-xs">{count}</Badge>}
      </div>
      {approvals.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No pending approvals</p>
        </div>
      ) : (
        <div className="space-y-2">
          {approvals.slice(0, 3).map((item: any) => (
            <div key={item.id} className="p-2 rounded-lg border border-border bg-muted/20">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-[10px] text-muted-foreground">{item.created_at ? formatDistanceToNow(new Date(item.created_at)) + ' ago' : 'Pending'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeploymentsWidget({ deployments }: { deployments: any[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Rocket className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Recent Deployments</h3>
      </div>
      {deployments.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground">
          <Rocket className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No recent deployments</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deployments.slice(0, 3).map((item: any) => (
            <div key={item.id} className="p-2 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.version}</p>
                <p className="text-[10px] text-muted-foreground">{item.deployed_at ? formatDistanceToNow(new Date(item.deployed_at)) + ' ago' : '-'}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">{item.environment}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SecurityWidget() {
  return (
    <div className="text-center py-4">
      <Shield className="w-8 h-8 mx-auto mb-2 text-sec-safe" />
      <p className="text-2xl font-bold text-foreground">A+</p>
      <p className="text-xs text-muted-foreground">Security Score</p>
    </div>
  );
}

function AuditWidget() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Audit Feed</h3>
        <Badge variant="outline" className="text-[10px]">Immutable</Badge>
      </div>
      <div className="py-6 text-center text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No recent audit entries</p>
      </div>
    </div>
  );
}

function PlaceholderWidget({ type }: { type: string }) {
  return (
    <div className="py-8 text-center text-muted-foreground">
      <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">Widget: {type}</p>
    </div>
  );
}

export default OpzenixDashboard;
