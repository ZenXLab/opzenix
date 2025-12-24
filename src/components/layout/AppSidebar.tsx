import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  GitBranch, 
  Activity, 
  Shield, 
  FileText,
  Bell,
  Radio,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Brain,
  Box,
  Database,
  Sparkles,
  Workflow,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFlowStore, FlowType } from '@/stores/flowStore';
import { toast } from 'sonner';

interface AppSidebarProps {
  onOpenAuditLog?: () => void;
  onOpenAlerts?: () => void;
  onOpenRollback?: () => void;
  onOpenTelemetry?: () => void;
  onOpenOpzenixWizard?: () => void;
  onOpenPipelineEditor?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  onClick?: () => void;
}

const flowCategories: { id: FlowType; label: string; icon: typeof GitBranch; description: string }[] = [
  { id: 'cicd', label: 'CI/CD', icon: GitBranch, description: 'Continuous integration & delivery' },
  { id: 'mlops', label: 'MLOps', icon: Brain, description: 'Machine learning operations' },
  { id: 'llmops', label: 'LLMOps', icon: Box, description: 'Large language model ops' },
  { id: 'infrastructure', label: 'Infrastructure', icon: Database, description: 'Infrastructure as code' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Security scanning & compliance' },
];

const AppSidebar = ({ 
  onOpenAuditLog, 
  onOpenAlerts,
  onOpenRollback,
  onOpenTelemetry,
  onOpenOpzenixWizard,
  onOpenPipelineEditor
}: AppSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { 
    activeView, 
    setActiveView, 
    activeFlowType, 
    setActiveFlowType,
    approvalRequests,
    systemHealth,
    executions
  } = useFlowStore();

  const pendingApprovals = approvalRequests.filter(a => a.status === 'pending').length;
  const runningExecutions = executions.filter(e => e.status === 'running').length;

  // Get executions filtered by flow type
  const flowTypeExecutions = executions.filter(e => e.flowType === activeFlowType);

  const handleFlowTypeChange = (flowType: FlowType) => {
    setActiveFlowType(flowType);
    const category = flowCategories.find(c => c.id === flowType);
    toast.success(`Switched to ${category?.label} pipelines`, {
      description: `Showing ${flowTypeExecutions.length} active pipelines`,
    });
  };

  const mainNavItems: NavItem[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      onClick: () => setActiveView('dashboard')
    },
    { 
      id: 'flows', 
      label: 'Flow Canvas', 
      icon: Workflow,
      badge: runningExecutions,
      onClick: () => setActiveView('flows')
    },
  ];

  const toolItems: NavItem[] = [
    { 
      id: 'alerts', 
      label: 'Alerts', 
      icon: Bell, 
      badge: pendingApprovals, 
      onClick: () => {
        onOpenAlerts?.();
        toast.info('Opening Alerts Panel', { description: `${pendingApprovals} pending approvals` });
      }
    },
    { 
      id: 'rollback', 
      label: 'Rollback', 
      icon: RotateCcw, 
      onClick: () => {
        onOpenRollback?.();
        toast.info('Opening Checkpoint Rollback');
      }
    },
    { 
      id: 'audit', 
      label: 'Audit Log', 
      icon: FileText, 
      onClick: () => {
        onOpenAuditLog?.();
        toast.info('Opening Audit Log Viewer');
      }
    },
    { 
      id: 'telemetry', 
      label: 'OTel Signals', 
      icon: Radio,
      onClick: () => {
        onOpenTelemetry?.();
        toast.info('Opening Telemetry Panel');
      }
    },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 240 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="h-full border-r border-border bg-sidebar flex flex-col overflow-hidden shrink-0"
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-base font-semibold text-foreground tracking-tight">Opzenix</span>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("h-7 w-7", collapsed && "mx-auto")} 
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* New Pipeline CTA */}
      {!collapsed && (
        <div className="p-3 space-y-2">
          <Button 
            className="w-full gap-2 bg-ai-primary hover:bg-ai-primary/90" 
            size="sm"
            onClick={onOpenOpzenixWizard}
          >
            <Sparkles className="w-4 h-4" />
            New Pipeline
          </Button>
          <Button 
            variant="outline"
            className="w-full gap-2" 
            size="sm"
            onClick={onOpenPipelineEditor}
          >
            <Play className="w-4 h-4" />
            Open Editor
          </Button>
        </div>
      )}

      {collapsed && (
        <div className="p-2 space-y-2">
          <Button 
            size="icon"
            className="w-full h-10 bg-ai-primary hover:bg-ai-primary/90"
            onClick={onOpenOpzenixWizard}
          >
            <Sparkles className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline"
            size="icon"
            className="w-full h-10"
            onClick={onOpenPipelineEditor}
          >
            <Play className="w-4 h-4" />
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        {/* Main Navigation */}
        <div className={cn('p-2 space-y-1', collapsed && 'px-1')}>
          {!collapsed && (
            <div className="px-2 py-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Navigation</span>
            </div>
          )}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  collapsed && 'justify-center px-2'
                )}
              >
                <div className="relative">
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-node-running text-[8px] text-background flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge && item.badge > 0 && (
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <Separator className="my-2" />

        {/* Flow Categories */}
        <div className={cn('p-2 space-y-1', collapsed && 'px-1')}>
          {!collapsed && (
            <div className="px-2 py-1 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Flow Types</span>
              <Badge variant="outline" className="text-[9px] px-1">
                {flowTypeExecutions.length} active
              </Badge>
            </div>
          )}
          {flowCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeFlowType === cat.id;
            const count = executions.filter(e => e.flowType === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => handleFlowTypeChange(cat.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors group',
                  isSelected 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? `${cat.label}: ${cat.description}` : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <>
                    <div className="flex-1 text-left">
                      <span className="text-xs">{cat.label}</span>
                      {isSelected && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {cat.description}
                        </p>
                      )}
                    </div>
                    {count > 0 && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full",
                        isSelected ? "bg-primary/20" : "bg-secondary"
                      )}>
                        {count}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        <Separator className="my-2" />

        {/* Tools */}
        <div className={cn('p-2 space-y-1', collapsed && 'px-1')}>
          {!collapsed && (
            <div className="px-2 py-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Tools</span>
            </div>
          )}
          {toolItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  collapsed && 'justify-center px-2'
                )}
              >
                <div className="relative">
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-sec-critical text-[9px] text-white flex items-center justify-center font-medium">
                      {item.badge}
                    </span>
                  )}
                </div>
                {!collapsed && <span className="text-xs">{item.label}</span>}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                systemHealth.status === 'healthy' && 'bg-sec-safe',
                systemHealth.status === 'degraded' && 'bg-sec-warning',
                systemHealth.status === 'critical' && 'bg-sec-critical'
              )} />
              <span className="capitalize">{systemHealth.status}</span>
            </div>
            <span className="text-[10px] font-mono">{systemHealth.uptime}</span>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="p-2 border-t border-border flex justify-center">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full animate-pulse",
            systemHealth.status === 'healthy' && 'bg-sec-safe',
            systemHealth.status === 'degraded' && 'bg-sec-warning',
            systemHealth.status === 'critical' && 'bg-sec-critical'
          )} />
        </div>
      )}
    </motion.aside>
  );
};

export default AppSidebar;
