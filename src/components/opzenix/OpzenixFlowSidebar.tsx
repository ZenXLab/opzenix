import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  GitBranch,
  Rocket,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Activity,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// 🔒 OPZENIX FLOW SIDEBAR (MVP 1.0.0 LOCKED)
// ============================================
// Dedicated left sidebar for OPZENIX flow maps
// Environment boxes: DEV → UAT → STAGING → PREPROD → PROD
// ============================================

export type EnvironmentId = 'dev' | 'uat' | 'staging' | 'preprod' | 'prod';
export type FlowViewMode = 'ci' | 'cd' | 'ci+cd';
export type EnvironmentStatus = 'healthy' | 'blocked' | 'failed' | 'pending';

export const ENVIRONMENT_ORDER: EnvironmentId[] = ['dev', 'uat', 'staging', 'preprod', 'prod'];

export const ENVIRONMENT_DISPLAY_NAMES: Record<EnvironmentId, string> = {
  dev: 'DEV',
  uat: 'UAT',
  staging: 'STAGING',
  preprod: 'PREPROD',
  prod: 'PROD',
};

export const ENVIRONMENT_COLORS: Record<EnvironmentId, string> = {
  dev: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
  uat: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
  staging: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
  preprod: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  prod: 'bg-red-500/10 border-red-500/30 text-red-500',
};

interface EnvironmentData {
  id: EnvironmentId;
  status: EnvironmentStatus;
  lastDeployment?: {
    version: string;
    timestamp: string;
    status: 'success' | 'failed' | 'running';
  };
  hasApprovalPending: boolean;
}

interface OpzenixFlowSidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  activeEnvironment?: EnvironmentId;
  activeFlowMode?: FlowViewMode;
  onSelectEnvironment?: (env: EnvironmentId, mode: FlowViewMode) => void;
  onViewRBACMatrix?: () => void;
}

export const OpzenixFlowSidebar = ({
  collapsed: controlledCollapsed,
  onCollapsedChange,
  activeEnvironment,
  activeFlowMode,
  onSelectEnvironment,
  onViewRBACMatrix,
}: OpzenixFlowSidebarProps) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  
  const [environments, setEnvironments] = useState<EnvironmentData[]>([]);
  const [expandedEnv, setExpandedEnv] = useState<EnvironmentId | null>(null);
  const [isLive, setIsLive] = useState(false);

  const handleCollapseChange = (value: boolean) => {
    setInternalCollapsed(value);
    onCollapsedChange?.(value);
  };

  // Fetch environment data
  const fetchEnvironmentData = useCallback(async () => {
    try {
      const { data: deployments } = await supabase
        .from('deployments')
        .select('*')
        .order('deployed_at', { ascending: false });

      const { data: approvals } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('status', 'pending');

      const envData: EnvironmentData[] = ENVIRONMENT_ORDER.map((envId) => {
        const latestDeploy = deployments?.find(
          (d) => d.environment.toLowerCase() === envId
        );
        const pendingApproval = approvals?.some(
          (a) => a.description?.toLowerCase().includes(envId)
        );

        let status: EnvironmentStatus = 'pending';
        if (latestDeploy) {
          if (latestDeploy.status === 'success') status = 'healthy';
          else if (latestDeploy.status === 'failed') status = 'failed';
          else if (latestDeploy.status === 'running') status = 'pending';
        }
        if (pendingApproval) status = 'blocked';

        return {
          id: envId,
          status,
          lastDeployment: latestDeploy ? {
            version: latestDeploy.version,
            timestamp: new Date(latestDeploy.deployed_at).toLocaleString(),
            status: latestDeploy.status as 'success' | 'failed' | 'running',
          } : undefined,
          hasApprovalPending: pendingApproval || false,
        };
      });

      setEnvironments(envData);
    } catch (error) {
      console.error('[OPZENIX] Failed to fetch environments:', error);
    }
  }, []);

  useEffect(() => {
    fetchEnvironmentData();

    const channel = supabase
      .channel('opzenix-flow-sidebar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deployments' }, fetchEnvironmentData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approval_requests' }, fetchEnvironmentData)
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEnvironmentData]);

  const getStatusIcon = (status: EnvironmentStatus) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'blocked': return <Lock className="w-3.5 h-3.5 text-amber-500" />;
      case 'failed': return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      case 'pending': return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const handleEnvClick = (envId: EnvironmentId) => {
    if (collapsed) {
      handleCollapseChange(false);
      setExpandedEnv(envId);
    } else {
      setExpandedEnv(expandedEnv === envId ? null : envId);
    }
  };

  const handleFlowModeSelect = (envId: EnvironmentId, mode: FlowViewMode) => {
    onSelectEnvironment?.(envId, mode);
    setExpandedEnv(null);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 56 : 260 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="h-full border-r border-border bg-sidebar flex flex-col overflow-hidden shrink-0"
      >
        {/* Header */}
        <div className={cn(
          "h-12 flex items-center border-b border-border gap-2",
          collapsed ? "justify-center px-2" : "justify-between px-3"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">OPZENIX Flow Maps</span>
            </div>
          )}
          {collapsed && <Shield className="w-4 h-4 text-primary" />}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleCollapseChange(!collapsed)}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? 'Expand' : 'Collapse'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Live Status */}
        {!collapsed && (
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center gap-2 text-xs">
              <div className={cn(
                'w-2 h-2 rounded-full',
                isLive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'
              )} />
              <span className="text-muted-foreground">{isLive ? 'Live Updates' : 'Connecting...'}</span>
              <Badge variant="outline" className="ml-auto text-[9px] h-4 px-1">MVP 1.0.0</Badge>
            </div>
          </div>
        )}

        {/* Environment Flow */}
        <ScrollArea className="flex-1 p-2">
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-2 font-medium">
              Environment Pipeline
            </p>
          )}
          
          <div className="space-y-1">
            {environments.map((env, index) => {
              const isActive = activeEnvironment === env.id;
              const isExpanded = expandedEnv === env.id;

              return (
                <div key={env.id}>
                  {/* Environment Box */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleEnvClick(env.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all border',
                          isActive
                            ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                            : ENVIRONMENT_COLORS[env.id],
                          collapsed && 'justify-center px-2'
                        )}
                      >
                        {getStatusIcon(env.status)}
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left font-medium">
                              {ENVIRONMENT_DISPLAY_NAMES[env.id]}
                            </span>
                            {env.hasApprovalPending && (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            )}
                            <ChevronRight className={cn(
                              'w-3.5 h-3.5 transition-transform',
                              isExpanded && 'rotate-90'
                            )} />
                          </>
                        )}
                      </button>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="max-w-[200px]">
                        <p className="font-medium">{ENVIRONMENT_DISPLAY_NAMES[env.id]}</p>
                        <p className="text-xs text-muted-foreground capitalize">{env.status}</p>
                        {env.lastDeployment && (
                          <p className="text-xs text-muted-foreground mt-1">
                            v{env.lastDeployment.version}
                          </p>
                        )}
                      </TooltipContent>
                    )}
                  </Tooltip>

                  {/* Flow Mode Selector (Expanded) */}
                  <AnimatePresence>
                    {!collapsed && isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-6 py-2 space-y-1"
                      >
                        <button
                          onClick={() => handleFlowModeSelect(env.id, 'ci')}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors',
                            activeEnvironment === env.id && activeFlowMode === 'ci'
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          )}
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          <span>View CI Flow</span>
                        </button>
                        <button
                          onClick={() => handleFlowModeSelect(env.id, 'cd')}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors',
                            activeEnvironment === env.id && activeFlowMode === 'cd'
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          )}
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          <span>View CD Flow</span>
                        </button>
                        <button
                          onClick={() => handleFlowModeSelect(env.id, 'ci+cd')}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors',
                            activeEnvironment === env.id && activeFlowMode === 'ci+cd'
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          )}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>View CI + CD Flow</span>
                        </button>
                        
                        {/* Deployment Info */}
                        {env.lastDeployment && (
                          <div className="mt-2 p-2 rounded-md bg-muted/30 text-[10px] text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span>Last Deploy:</span>
                              <span className="font-mono">v{env.lastDeployment.version}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span>Time:</span>
                              <span>{env.lastDeployment.timestamp}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Arrow to next environment */}
                  {index < environments.length - 1 && !collapsed && (
                    <div className="flex justify-center py-1">
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!collapsed && <Separator className="my-3" />}

          {/* RBAC & Governance */}
          {!collapsed && (
            <div className="space-y-1 px-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-2 font-medium">
                Governance
              </p>
              <button
                onClick={onViewRBACMatrix}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>RBAC Matrix</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                <Activity className="w-3.5 h-3.5" />
                <span>Audit Trail</span>
                <Badge variant="outline" className="ml-auto text-[9px] h-4 px-1">Immutable</Badge>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {!collapsed && (
          <div className="p-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              OPZENIX Control Plane
            </p>
          </div>
        )}
      </motion.aside>
    </TooltipProvider>
  );
};

export default OpzenixFlowSidebar;
