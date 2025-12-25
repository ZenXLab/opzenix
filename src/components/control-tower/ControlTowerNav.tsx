import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Play,
  Globe,
  Link2,
  CheckCircle2,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight,
  History,
  GitBranch,
  Lock,
  GitMerge,
  Clock,
  Shield,
  Layers,
  ListChecks,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ControlTowerNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenAuditLog?: () => void;
}

// Navigation Items - ORDER IS IMPORTANT per manifesto
const coreNavItems = [
  { 
    id: 'control-tower', 
    label: 'Control Tower', 
    icon: LayoutDashboard, 
    description: 'System overview and health',
    isDefault: true 
  },
  { 
    id: 'executions', 
    label: 'Executions', 
    icon: Play, 
    description: 'Active and recent flows',
    badge: 'live'
  },
  { 
    id: 'execution-builder', 
    label: 'Execution Builder', 
    icon: Play, 
    description: 'Build and configure pipelines'
  },
  { 
    id: 'deployments', 
    label: 'Deployments', 
    icon: History, 
    description: 'Deployment history per environment'
  },
];

const governanceNavItems = [
  { 
    id: 'environments', 
    label: 'Environments', 
    icon: Globe, 
    description: 'Policy-based environment config'
  },
  { 
    id: 'branch-management', 
    label: 'Branch Mapping', 
    icon: GitBranch, 
    description: 'Branch → environment rules'
  },
  { 
    id: 'environment-locks', 
    label: 'Environment Locks', 
    icon: Lock, 
    description: 'RBAC-based deployment gates'
  },
  { 
    id: 'connections', 
    label: 'Connections', 
    icon: Link2, 
    description: 'GitHub, Kubernetes, Vault'
  },
  { 
    id: 'approvals', 
    label: 'Approvals', 
    icon: CheckCircle2, 
    description: 'Pending governance gates',
    badge: 'count'
  },
];

const cdFlowNavItems = [
  {
    id: 'argo-flow',
    label: 'Argo CD Flow',
    icon: GitMerge,
    description: 'End-to-end CD flow graph'
  },
  {
    id: 'deployment-strategy',
    label: 'Deployment Strategy',
    icon: Layers,
    description: 'Rolling/Canary/Blue-Green'
  },
  {
    id: 'audit-timeline',
    label: 'Audit Timeline',
    icon: Clock,
    description: 'Immutable action timeline'
  },
  {
    id: 'rbac',
    label: 'RBAC Matrix',
    icon: Shield,
    description: 'Role-based permissions'
  },
];

const systemNavItems = [
  { 
    id: 'audit-log', 
    label: 'Audit Log', 
    icon: FileText, 
    description: 'Immutable action history'
  },
  { 
    id: 'health', 
    label: 'System Health', 
    icon: Activity, 
    description: 'Infrastructure status'
  },
  {
    id: 'mvp-checklist',
    label: 'MVP Checklist',
    icon: ListChecks,
    description: 'MVP 1.0.0 readiness'
  },
];

const ControlTowerNav = ({ 
  activeSection, 
  onSectionChange,
}: ControlTowerNavProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [activeExecutionsCount, setActiveExecutionsCount] = useState(0);

  // Fetch and subscribe to real counts
  useEffect(() => {
    const fetchCounts = async () => {
      const [approvalsResult, executionsResult] = await Promise.all([
        supabase
          .from('approval_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('executions')
          .select('id', { count: 'exact', head: true })
          .in('status', ['running', 'paused'])
      ]);

      setPendingApprovalsCount(approvalsResult.count || 0);
      setActiveExecutionsCount(executionsResult.count || 0);
    };

    fetchCounts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('nav-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approval_requests' }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'executions' }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNavClick = (id: string) => {
    onSectionChange(id);
  };

  const getBadgeContent = (badge?: string) => {
    if (badge === 'count') {
      return pendingApprovalsCount > 0 ? pendingApprovalsCount : null;
    }
    return null;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 56 : 220 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="h-full border-r border-border bg-sidebar flex flex-col overflow-hidden shrink-0"
      >
        {/* Collapse Toggle */}
        <div className={cn(
          "h-12 flex items-center border-b border-border",
          collapsed ? "justify-center px-2" : "justify-end px-3"
        )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-md hover:bg-muted" 
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {/* Core Section */}
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 mb-2 font-medium">
              Core
            </p>
          )}
          {renderNavSection(coreNavItems)}
          
          {!collapsed && <Separator className="my-2" />}
          
          {/* Governance Section */}
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 my-2 font-medium">
              Governance
            </p>
          )}
          {renderNavSection(governanceNavItems)}

          {!collapsed && <Separator className="my-2" />}

          {/* CD Flow Section */}
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 my-2 font-medium">
              CD Flow
            </p>
          )}
          {renderNavSection(cdFlowNavItems)}

          {!collapsed && <Separator className="my-2" />}

          {/* System Section */}
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 my-2 font-medium">
              System
            </p>
          )}
          {renderNavSection(systemNavItems)}
        </nav>

        {/* Version Footer */}
        {!collapsed && (
          <div className="p-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              Opzenix MVP 1.0.0
            </p>
          </div>
        )}
      </motion.aside>
    </TooltipProvider>
  );

  function renderNavSection(items: typeof coreNavItems) {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = activeSection === item.id;
      const badgeValue = getBadgeContent(item.badge);
      const showLiveDot = item.badge === 'live' && activeExecutionsCount > 0;
      
      const buttonContent = (
        <button
          onClick={() => handleNavClick(item.id)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
            isActive 
              ? 'bg-primary/10 text-primary font-medium shadow-sm border border-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
            collapsed && 'justify-center px-2'
          )}
        >
          <div className="relative">
            <Icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
            {showLiveDot && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sec-safe animate-pulse" />
            )}
          </div>
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-xs">{item.label}</span>
              {badgeValue !== null && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{badgeValue}</Badge>
              )}
            </>
          )}
        </button>
      );

      if (collapsed) {
        return (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
            <TooltipContent side="right" className="max-w-[200px]">
              <p className="font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </TooltipContent>
          </Tooltip>
        );
      }

      return <div key={item.id}>{buttonContent}</div>;
    });
  }
};

export default ControlTowerNav;