import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Rocket, 
  Search, 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Play,
  LayoutDashboard,
  Workflow,
  History,
  Bell,
  RotateCcw,
  FileText,
  Radio,
  GitBranch,
  Brain,
  Box,
  Database,
  AlertTriangle,
  Bookmark,
  Lock,
  Users,
  Settings,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSidebarStore, SidebarMode, MODE_CONFIG } from '@/stores/sidebarStore';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';
import { toast } from 'sonner';

interface ModeDrivenSidebarProps {
  onOpenAuditLog?: () => void;
  onOpenAlerts?: () => void;
  onOpenRollback?: () => void;
  onOpenTelemetry?: () => void;
  onOpenOpzenixWizard?: () => void;
  onOpenPipelineEditor?: () => void;
  onOpenExecutionHistory?: () => void;
  onViewDashboard?: () => void;
  onViewFlows?: () => void;
  onOpenExecutionDetail?: (executionId: string) => void;
}

const modeIcons = {
  monitor: Activity,
  build: Rocket,
  investigate: Search,
  govern: Shield,
};

const modeColors = {
  monitor: 'text-chart-1 bg-chart-1/20',
  build: 'text-sec-safe bg-sec-safe/20',
  investigate: 'text-sec-warning bg-sec-warning/20',
  govern: 'text-primary bg-primary/20',
};

export function ModeDrivenSidebar({
  onOpenAuditLog,
  onOpenAlerts,
  onOpenRollback,
  onOpenTelemetry,
  onOpenOpzenixWizard,
  onOpenPipelineEditor,
  onOpenExecutionHistory,
  onViewDashboard,
  onViewFlows,
  onOpenExecutionDetail,
}: ModeDrivenSidebarProps) {
  const { mode, setMode, collapsed, toggleCollapsed, getAllowedModes } = useSidebarStore();
  const { executions, metrics, loading } = useDashboardRealtime();
  const allowedModes = getAllowedModes();

  // Get failed executions for investigate mode
  const failedExecutions = executions.filter(e => e.status === 'failed');
  const runningExecutions = executions.filter(e => e.status === 'running');

  // Auto-switch to investigate mode on failure
  useEffect(() => {
    if (failedExecutions.length > 0 && mode !== 'investigate' && allowedModes.includes('investigate')) {
      // Show notification but don't auto-switch (let user decide)
      toast.warning('Pipeline failure detected', {
        description: 'Switch to Investigate mode to debug',
        action: {
          label: 'Investigate',
          onClick: () => setMode('investigate'),
        },
      });
    }
  }, [failedExecutions.length]);

  const getModeNavItems = () => {
    switch (mode) {
      case 'monitor':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, onClick: onViewDashboard },
          { id: 'flows', label: 'Live Flows', icon: Workflow, badge: runningExecutions.length, onClick: onViewFlows },
          { id: 'logs', label: 'Logs', icon: FileText, onClick: onOpenAuditLog },
          { id: 'alerts', label: 'Alerts', icon: Bell, badge: metrics.pendingApprovals, onClick: onOpenAlerts },
          { id: 'telemetry', label: 'OTel Signals', icon: Radio, onClick: onOpenTelemetry },
        ];
      case 'build':
        return [
          { id: 'new-pipeline', label: 'New Pipeline', icon: Sparkles, onClick: onOpenOpzenixWizard },
          { id: 'editor', label: 'Pipeline Editor', icon: Play, onClick: onOpenPipelineEditor },
          { id: 'environments', label: 'Environments', icon: Database, onClick: () => toast.info('Environments coming soon') },
          { id: 'history', label: 'Deploy History', icon: History, onClick: onOpenExecutionHistory },
        ];
      case 'investigate':
        return [
          { id: 'failed', label: 'Failed Flows', icon: XCircle, badge: failedExecutions.length, onClick: onOpenExecutionHistory },
          { id: 'logs', label: 'Scoped Logs', icon: FileText, onClick: onOpenAuditLog },
          { id: 'checkpoints', label: 'Checkpoints', icon: Bookmark, onClick: onOpenRollback },
          { id: 'rollback', label: 'Rollback', icon: RotateCcw, onClick: onOpenRollback },
        ];
      case 'govern':
        return [
          { id: 'security', label: 'Security Gates', icon: Shield, onClick: () => toast.info('Security Gates coming soon') },
          { id: 'policies', label: 'Policies', icon: Lock, onClick: () => toast.info('Policies coming soon') },
          { id: 'audit', label: 'Audit Log', icon: FileText, onClick: onOpenAuditLog },
          { id: 'access', label: 'Access Control', icon: Users, onClick: () => toast.info('Access Control coming soon') },
        ];
      default:
        return [];
    }
  };

  const quickActions = [
    { id: 'new', label: 'New Pipeline', icon: Sparkles, onClick: onOpenOpzenixWizard, primary: true },
    { id: 'editor', label: 'Open Editor', icon: Play, onClick: onOpenPipelineEditor },
    { id: 'deploy', label: 'Deploy Something', icon: Rocket, onClick: onOpenOpzenixWizard },
    { id: 'fix', label: 'Fix a Failure', icon: AlertTriangle, onClick: () => setMode('investigate'), show: failedExecutions.length > 0 },
  ].filter(a => a.show !== false);

  const navItems = getModeNavItems();

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 56 : 260 }}
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
            onClick={toggleCollapsed}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Mode Switcher */}
        <div className={cn("p-2 border-b border-border", collapsed && "px-1")}>
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-2">Mode</p>
          )}
          <div className={cn("flex gap-1", collapsed ? "flex-col" : "flex-wrap")}>
            {allowedModes.map((m) => {
              const config = MODE_CONFIG.find(c => c.id === m)!;
              const Icon = modeIcons[m];
              const isActive = mode === m;
              
              const button = (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all",
                    isActive 
                      ? cn(modeColors[m], "font-medium shadow-sm")
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    collapsed && "justify-center px-2 py-2 w-full"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {!collapsed && <span>{config.label}</span>}
                </button>
              );

              if (collapsed) {
                return (
                  <Tooltip key={m}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-medium">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return button;
            })}
          </div>
        </div>

        {/* Quick Actions */}
        {!collapsed && (
          <div className="p-2 space-y-1.5 border-b border-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2">Quick Actions</p>
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant={action.primary ? "default" : "outline"}
                size="sm"
                className={cn(
                  "w-full justify-start gap-2 text-xs",
                  action.primary && "bg-ai-primary hover:bg-ai-primary/90"
                )}
                onClick={action.onClick}
              >
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {collapsed && (
          <div className="p-1.5 space-y-1 border-b border-border">
            {quickActions.slice(0, 2).map((action) => (
              <Tooltip key={action.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={action.primary ? "default" : "outline"}
                    size="icon"
                    className={cn(
                      "w-full h-9",
                      action.primary && "bg-ai-primary hover:bg-ai-primary/90"
                    )}
                    onClick={action.onClick}
                  >
                    <action.icon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{action.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Navigation Items */}
        <ScrollArea className="flex-1">
          <div className={cn('p-2 space-y-1', collapsed && 'px-1.5')}>
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-2">
                {MODE_CONFIG.find(c => c.id === mode)?.label} Tools
              </p>
            )}
            {navItems.map((item) => {
              const button = (
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
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-sec-critical text-[9px] text-background flex items-center justify-center font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {!collapsed && <span className="text-xs">{item.label}</span>}
                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 h-4">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right">
                      {item.label}
                      {item.badge !== undefined && item.badge > 0 && ` (${item.badge})`}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return button;
            })}
          </div>

          <Separator className="my-2" />

          {/* Recent Executions */}
          {!collapsed && mode !== 'govern' && (
            <div className="p-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-2">
                Recent {mode === 'investigate' ? 'Failures' : 'Executions'}
              </p>
              <div className="space-y-1">
                {(mode === 'investigate' ? failedExecutions : executions)
                  .slice(0, 5)
                  .map((exec) => (
                    <button
                      key={exec.id}
                      onClick={() => onOpenExecutionDetail?.(exec.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 text-left"
                    >
                      {exec.status === 'running' && <Activity className="w-3 h-3 text-chart-1 animate-pulse" />}
                      {exec.status === 'success' && <CheckCircle2 className="w-3 h-3 text-sec-safe" />}
                      {exec.status === 'failed' && <XCircle className="w-3 h-3 text-sec-critical" />}
                      {exec.status === 'warning' && <AlertTriangle className="w-3 h-3 text-sec-warning" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate">{exec.name}</p>
                        <p className="text-[9px] text-muted-foreground truncate">
                          {exec.environment} • {exec.commit_hash?.slice(0, 7) || 'N/A'}
                        </p>
                      </div>
                    </button>
                  ))}
                {executions.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No executions yet
                  </p>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer - System Health */}
        {!collapsed && (
          <div className="p-3 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  metrics.failedExecutions === 0 ? 'bg-sec-safe' : 'bg-sec-critical'
                )} />
                <span>{metrics.failedExecutions === 0 ? 'All Systems OK' : `${metrics.failedExecutions} Failed`}</span>
              </div>
              <span className="text-[10px] font-mono">
                {metrics.successRate}% success
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="p-2 border-t border-border flex justify-center">
            <Tooltip>
              <TooltipTrigger>
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full animate-pulse",
                  metrics.failedExecutions === 0 ? 'bg-sec-safe' : 'bg-sec-critical'
                )} />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{metrics.failedExecutions === 0 ? 'All Systems OK' : `${metrics.failedExecutions} Failed`}</p>
                <p className="text-xs text-muted-foreground">{metrics.successRate}% success rate</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </motion.aside>
    </TooltipProvider>
  );
}

export default ModeDrivenSidebar;
