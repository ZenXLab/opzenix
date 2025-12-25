import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
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
  Settings,
  GripVertical,
  Maximize2,
  Minimize2,
  Copy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useControlTowerRealtime } from '@/hooks/useControlTowerRealtime';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useRBACPermissions } from '@/hooks/useRBACPermissions';
import BreakGlassModal from './screens/BreakGlassModal';
import WidgetConfigPanel, { WidgetConfig } from './widgets/WidgetConfigPanel';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// ============================================
// 🏢 OPZENIX DASHBOARD WITH DRAG, RESIZE & CONFIG
// ============================================

interface OpzenixDashboardProps {
  onNavigateToFlow: (flowType: 'ci-flow' | 'cd-flow' | 'full-flow', env: string) => void;
  currentEnvironment: string;
}

const WIDGET_CATALOG = [
  { type: 'env-health', name: 'Environment Health', icon: Server, size: 'large' as const, colSpan: 4, rowSpan: 1 },
  { type: 'metrics', name: 'Key Metrics', icon: BarChart3, size: 'large' as const, colSpan: 4, rowSpan: 1 },
  { type: 'pipelines', name: 'Pipeline Access', icon: GitBranch, size: 'large' as const, colSpan: 4, rowSpan: 1 },
  { type: 'approvals', name: 'Pending Approvals', icon: FileText, size: 'medium' as const, colSpan: 2, rowSpan: 1 },
  { type: 'deployments', name: 'Recent Deployments', icon: Rocket, size: 'medium' as const, colSpan: 2, rowSpan: 1 },
  { type: 'security', name: 'Security Score', icon: Shield, size: 'small' as const, colSpan: 1, rowSpan: 1 },
  { type: 'audit', name: 'Audit Feed', icon: FileText, size: 'medium' as const, colSpan: 2, rowSpan: 1 },
];

export function OpzenixDashboard({ onNavigateToFlow, currentEnvironment }: OpzenixDashboardProps) {
  const [breakGlassOpen, setBreakGlassOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [configWidget, setConfigWidget] = useState<any>(null);
  const [widgetConfigs, setWidgetConfigs] = useState<Record<string, WidgetConfig>>({});

  const { dbRole, canBreakGlass } = useRBACPermissions();
  const {
    widgets,
    saving,
    addWidget,
    removeWidget,
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

  const metrics = {
    running: activeExecutions?.length || 0,
    total: executions?.length || 0,
    success: executions?.filter((e) => e.status === 'success').length || 0,
    pending: pendingApprovals?.length || 0,
  };

  const successRate = metrics.total > 0 ? Math.round((metrics.success / metrics.total) * 100) : 100;

  const environments = [
    { id: 'dev', label: 'DEV', status: 'healthy' },
    { id: 'uat', label: 'UAT', status: 'healthy' },
    { id: 'staging', label: 'STG', status: 'deploying' },
    { id: 'preprod', label: 'PRE', status: 'healthy' },
    { id: 'prod', label: 'PROD', status: 'healthy', restricted: true },
  ];

  const handleResize = useCallback((id: string, colSpan: number, rowSpan: number) => {
    const sizeMap: Record<number, 'small' | 'medium' | 'large'> = { 1: 'small', 2: 'medium', 3: 'large', 4: 'large' };
    const newWidgets = widgets.map(w => w.id === id ? { ...w, size: sizeMap[colSpan] || 'medium', colSpan, rowSpan } : w);
    reorderWidgets(newWidgets);
  }, [widgets, reorderWidgets]);

  const handleAddWidget = (type: string, name: string, size: 'small' | 'medium' | 'large') => {
    addWidget(type, name, size);
    setAddWidgetOpen(false);
  };

  const handleSaveConfig = (widgetId: string, config: WidgetConfig) => {
    setWidgetConfigs(prev => ({ ...prev, [widgetId]: config }));
  };

  const renderWidgetContent = (widget: any) => {
    const config = widgetConfigs[widget.id];
    switch (widget.type) {
      case 'env-health':
        return <EnvironmentHealthWidget environments={environments} currentEnvironment={currentEnvironment} config={config} />;
      case 'metrics':
        return <MetricsWidget metrics={metrics} successRate={successRate} config={config} />;
      case 'pipelines':
        return <PipelineAccessWidget onNavigate={onNavigateToFlow} currentEnvironment={currentEnvironment} config={config} />;
      case 'approvals':
        return <ApprovalsWidget approvals={pendingApprovals || []} count={metrics.pending} config={config} />;
      case 'deployments':
        return <DeploymentsWidget deployments={recentDeployments || []} config={config} />;
      case 'security':
        return <SecurityWidget config={config} />;
      case 'audit':
        return <AuditWidget config={config} />;
      default:
        return <PlaceholderWidget type={widget.type} />;
    }
  };

  const getWidgetSpan = (widget: any): number => {
    if (widget.colSpan) return widget.colSpan;
    switch (widget.size) {
      case 'small': return 1;
      case 'medium': return 2;
      case 'large': return 4;
      default: return 2;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
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
                Enterprise Dashboard
                {saving && <Badge variant="secondary" className="text-[10px]">Saving...</Badge>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">Role: {dbRole?.toUpperCase() || 'VIEWER'}</Badge>
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
              isConnected ? 'bg-sec-safe/10 text-sec-safe' : 'bg-sec-warning/10 text-sec-warning'
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-sec-safe animate-pulse' : 'bg-sec-warning')} />
              {isConnected ? 'Live' : 'Reconnecting...'}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={refetch}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant={isEditMode ? 'default' : 'outline'} size="sm" className="gap-1.5" onClick={() => setIsEditMode(!isEditMode)}>
              <Settings2 className="w-3.5 h-3.5" />
              {isEditMode ? 'Done' : 'Customize'}
            </Button>
            {canBreakGlass() && (
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setBreakGlassOpen(true)}>
                <Zap className="w-3.5 h-3.5" />
                Break Glass
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <BreakGlassModal open={breakGlassOpen} onClose={() => setBreakGlassOpen(false)} environment="prod" />
      
      {configWidget && (
        <WidgetConfigPanel
          open={!!configWidget}
          onClose={() => setConfigWidget(null)}
          widget={configWidget}
          onSave={handleSaveConfig}
        />
      )}

      <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
            <DialogDescription>Choose a widget to add</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {WIDGET_CATALOG.map((w) => {
              const Icon = w.icon;
              return (
                <button key={w.type} onClick={() => handleAddWidget(w.type, w.name, w.size)}
                  className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 text-left transition-all">
                  <Icon className="w-5 h-5 text-primary mb-2" />
                  <p className="text-sm font-medium text-foreground">{w.name}</p>
                  <Badge variant="secondary" className="text-[10px] mt-1">{w.size}</Badge>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {/* Edit Toolbar */}
          <AnimatePresence>
            {isEditMode && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="flex items-center justify-between p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Edit Mode</span>
                  <span className="text-xs text-muted-foreground">Drag to reorder • Corner resize • Click gear to configure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAddWidgetOpen(true)}>
                    <Plus className="w-3 h-3" />Add
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={resetLayout}>
                    <RefreshCw className="w-3 h-3" />Reset
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Widget Grid */}
          <Reorder.Group axis="y" values={widgets} onReorder={reorderWidgets} className="grid grid-cols-4 gap-4">
            {widgets.map((widget) => (
              <ResizableWidgetCard
                key={widget.id}
                widget={widget}
                isEditMode={isEditMode}
                colSpan={getWidgetSpan(widget)}
                onRemove={() => removeWidget(widget.id)}
                onDuplicate={() => duplicateWidget(widget.id)}
                onConfigure={() => setConfigWidget(widget)}
                onResize={(col, row) => handleResize(widget.id, col, row)}
              >
                {renderWidgetContent(widget)}
              </ResizableWidgetCard>
            ))}
          </Reorder.Group>
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================
// RESIZABLE WIDGET CARD
// ============================================

interface ResizableWidgetCardProps {
  widget: any;
  isEditMode: boolean;
  colSpan: number;
  onRemove: () => void;
  onDuplicate: () => void;
  onConfigure: () => void;
  onResize: (colSpan: number, rowSpan: number) => void;
  children: React.ReactNode;
}

function ResizableWidgetCard({
  widget,
  isEditMode,
  colSpan,
  onRemove,
  onDuplicate,
  onConfigure,
  onResize,
  children,
}: ResizableWidgetCardProps) {
  const [currentColSpan, setCurrentColSpan] = useState(colSpan);
  const [isResizing, setIsResizing] = useState(false);

  const handleCornerResize = useCallback((e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startCol = currentColSpan;
    const cellWidth = 250;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const colChange = Math.round(deltaX / cellWidth);
      const newColSpan = Math.max(1, Math.min(4, startCol + colChange));
      setCurrentColSpan(newColSpan);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      onResize(currentColSpan, 1);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isEditMode, currentColSpan, onResize]);

  return (
    <Reorder.Item
      value={widget}
      className="relative"
      style={{ gridColumn: `span ${currentColSpan}` }}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
      layout
    >
      <div className={cn(
        'h-full rounded-xl border bg-card overflow-hidden transition-all',
        isEditMode && 'ring-2 ring-primary/20 ring-dashed hover:ring-primary/40'
      )}>
        {/* Edit Header */}
        <AnimatePresence>
          {isEditMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-border bg-muted/50 px-4 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{widget.name || widget.type}</span>
                <Badge variant="secondary" className="text-[10px]">{currentColSpan} col</Badge>
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onConfigure}>
                        <Settings className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Configure</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Maximize2 className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setCurrentColSpan(1); onResize(1, 1); }}>
                      <Minimize2 className="w-3 h-3 mr-2" />Small (1 col)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setCurrentColSpan(2); onResize(2, 1); }}>
                      <Maximize2 className="w-3 h-3 mr-2" />Medium (2 col)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setCurrentColSpan(4); onResize(4, 1); }}>
                      <Maximize2 className="w-3 h-3 mr-2" />Large (4 col)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDuplicate}>
                  <Copy className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onRemove}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="p-4">{children}</div>

        {/* Corner Resize Handle */}
        {isEditMode && (
          <div
            onMouseDown={handleCornerResize}
            className={cn(
              'absolute bottom-1 right-1 w-5 h-5 cursor-nwse-resize z-20 rounded',
              'flex items-center justify-center transition-opacity',
              'opacity-30 hover:opacity-100',
              isResizing && 'opacity-100'
            )}
          >
            <div className="w-3 h-3 border-r-2 border-b-2 border-primary rounded-br" />
          </div>
        )}

        {/* Resize Preview */}
        {isResizing && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-xl pointer-events-none z-10 flex items-center justify-center">
            <div className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {currentColSpan} column{currentColSpan > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </Reorder.Item>
  );
}

// ============================================
// WIDGET COMPONENTS
// ============================================

function EnvironmentHealthWidget({ environments, currentEnvironment, config }: { environments: any[]; currentEnvironment: string; config?: WidgetConfig }) {
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
        <h3 className="text-sm font-semibold text-foreground">{config?.customTitle || 'Environment Health'}</h3>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {environments.map((env) => {
          const status = getEnvStatus(env.status);
          const StatusIcon = status.icon;
          const isActive = currentEnvironment === env.id;
          return (
            <div key={env.id} className={cn('p-3 rounded-lg border transition-all', isActive ? 'border-primary bg-primary/5' : 'border-border bg-card', env.restricted && 'ring-1 ring-sec-danger/20')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">{env.label}</span>
                <StatusIcon className={cn('w-4 h-4', status.color, env.status === 'deploying' && 'animate-spin')} />
              </div>
              <p className={cn('text-xs capitalize', status.color)}>{env.status}</p>
              {env.restricted && <Badge variant="outline" className="mt-2 text-[10px] border-sec-danger/30 text-sec-danger"><Lock className="w-2.5 h-2.5 mr-1" />Restricted</Badge>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricsWidget({ metrics, successRate, config }: { metrics: any; successRate: number; config?: WidgetConfig }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{config?.customTitle || 'Key Metrics'}</h3>
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

function PipelineAccessWidget({ onNavigate, currentEnvironment, config }: { onNavigate: any; currentEnvironment: string; config?: WidgetConfig }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{config?.customTitle || 'Pipeline Quick Access'}</h3>
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
      <div className="flex items-center text-xs mt-2 opacity-70">View <ArrowRight className="w-3 h-3 ml-1" /></div>
    </button>
  );
}

function ApprovalsWidget({ approvals, count, config }: { approvals: any[]; count: number; config?: WidgetConfig }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-sec-warning" />
        <h3 className="text-sm font-semibold text-foreground">{config?.customTitle || 'Pending Approvals'}</h3>
        {count > 0 && <Badge className="bg-sec-warning/20 text-sec-warning text-xs">{count}</Badge>}
      </div>
      {approvals.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No pending approvals</p>
        </div>
      ) : (
        <div className="space-y-2">
          {approvals.slice(0, config?.maxItems || 3).map((item: any) => (
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

function DeploymentsWidget({ deployments, config }: { deployments: any[]; config?: WidgetConfig }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Rocket className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{config?.customTitle || 'Recent Deployments'}</h3>
      </div>
      {deployments.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground">
          <Rocket className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No recent deployments</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deployments.slice(0, config?.maxItems || 3).map((item: any) => (
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

function SecurityWidget({ config }: { config?: WidgetConfig }) {
  return (
    <div className="text-center py-4">
      <Shield className="w-8 h-8 mx-auto mb-2 text-sec-safe" />
      <p className="text-2xl font-bold text-foreground">A+</p>
      <p className="text-xs text-muted-foreground">{config?.customTitle || 'Security Score'}</p>
    </div>
  );
}

function AuditWidget({ config }: { config?: WidgetConfig }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{config?.customTitle || 'Audit Feed'}</h3>
        <Badge variant="outline" className="text-[10px]">Immutable</Badge>
      </div>
      <div className="py-6 text-center text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No recent entries</p>
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
