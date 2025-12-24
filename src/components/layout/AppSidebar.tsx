import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  GitBranch, 
  Activity, 
  Shield, 
  Settings,
  FileText,
  Bell,
  Workflow,
  Server,
  Radio,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Brain,
  Box,
  Database,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useFlowStore, FlowType } from '@/stores/flowStore';

interface AppSidebarProps {
  onOpenAuditLog?: () => void;
  onOpenAlerts?: () => void;
  onOpenRollback?: () => void;
  onOpenOpzenixWizard?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  onClick?: () => void;
}

const flowCategories: { id: FlowType; label: string; icon: typeof GitBranch }[] = [
  { id: 'cicd', label: 'CI/CD', icon: GitBranch },
  { id: 'mlops', label: 'MLOps', icon: Brain },
  { id: 'llmops', label: 'LLMOps', icon: Box },
  { id: 'infrastructure', label: 'Infrastructure', icon: Database },
  { id: 'security', label: 'Security', icon: Shield },
];

const AppSidebar = ({ 
  onOpenAuditLog, 
  onOpenAlerts,
  onOpenRollback,
  onOpenOpzenixWizard
}: AppSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { 
    activeView, 
    setActiveView, 
    activeFlowType, 
    setActiveFlowType,
    approvalRequests,
    systemHealth
  } = useFlowStore();

  const pendingApprovals = approvalRequests.filter(a => a.status === 'pending').length;

  const mainNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'flows', label: 'Flow Canvas', icon: GitBranch },
  ];

  const toolItems: NavItem[] = [
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: pendingApprovals, onClick: onOpenAlerts },
    { id: 'rollback', label: 'Rollback', icon: RotateCcw, onClick: onOpenRollback },
    { id: 'audit', label: 'Audit Log', icon: FileText, onClick: onOpenAuditLog },
    { id: 'telemetry', label: 'OTel Signals', icon: Radio },
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
        <div className="p-3">
          <Button 
            className="w-full gap-2 bg-ai-primary hover:bg-ai-primary/90" 
            size="sm"
            onClick={onOpenOpzenixWizard}
          >
            <Sparkles className="w-4 h-4" />
            New Pipeline
          </Button>
        </div>
      )}

      {collapsed && (
        <div className="p-2">
          <Button 
            size="icon"
            className="w-full h-10 bg-ai-primary hover:bg-ai-primary/90"
            onClick={onOpenOpzenixWizard}
          >
            <Sparkles className="w-4 h-4" />
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
                onClick={() => setActiveView(item.id as 'dashboard' | 'flows')}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        <Separator className="my-2" />

        {/* Flow Categories */}
        <div className={cn('p-2 space-y-1', collapsed && 'px-1')}>
          {!collapsed && (
            <div className="px-2 py-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Flow Types</span>
            </div>
          )}
          {flowCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeFlowType === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFlowType(cat.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                  isSelected 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="text-xs">{cat.label}</span>}
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
                  'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  collapsed && 'justify-center px-2'
                )}
              >
                <div className="relative">
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-sec-critical text-[8px] text-white flex items-center justify-center">
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
            <div className="flex items-center gap-1">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse",
                systemHealth.status === 'healthy' && 'bg-sec-safe',
                systemHealth.status === 'degraded' && 'bg-sec-warning',
                systemHealth.status === 'critical' && 'bg-sec-critical'
              )} />
              <span>{systemHealth.status === 'healthy' ? 'System Healthy' : systemHealth.status}</span>
            </div>
            <span className="text-[10px]">{systemHealth.uptime}</span>
          </div>
        </div>
      )}
    </motion.aside>
  );
};

export default AppSidebar;
