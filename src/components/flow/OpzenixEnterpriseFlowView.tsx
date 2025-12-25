import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Activity,
  GitBranch,
  Rocket,
  Layers,
  ArrowLeft,
  RefreshCw,
  Shield,
  Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { 
  OpzenixEnvironmentLayer, 
  type EnvironmentId, 
  type EnvironmentStatus,
  type FlowViewMode,
  type ArrowStatus,
  ENVIRONMENT_ORDER,
  ENVIRONMENT_DISPLAY_NAMES,
} from './OpzenixEnvironmentLayer';
import { OpzenixFlowMap } from './OpzenixFlowMap';
import { RBACActionsPanel, RBACRoleMatrix } from './OpzenixRBACActions';
import { useRBACPermissions, type Environment as RBACEnvironment } from '@/hooks/useRBACPermissions';

// ============================================
// 🔒 OPZENIX ENTERPRISE FLOW VIEW (LOCKED MVP 1.0.0)
// ============================================
// Renders environment-based flow maps with RBAC enforcement
// and full audit transparency.
// ============================================

interface EnvironmentData {
  id: EnvironmentId;
  name: string;
  displayName: string;
  status: EnvironmentStatus;
  lastDeployment?: {
    version: string;
    timestamp: string;
    status: 'success' | 'failed' | 'running';
    deployedBy?: string;
  };
  policyId?: string;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  ciStatus?: 'passed' | 'failed' | 'running' | 'pending';
}

interface OpzenixEnterpriseFlowViewProps {
  executionId?: string;
  onClose?: () => void;
}

export const OpzenixEnterpriseFlowView = ({ executionId, onClose }: OpzenixEnterpriseFlowViewProps) => {
  // State
  const [environments, setEnvironments] = useState<EnvironmentData[]>([]);
  const [arrowStatuses, setArrowStatuses] = useState<Record<string, ArrowStatus>>({});
  const [activeEnvironment, setActiveEnvironment] = useState<EnvironmentId | null>(null);
  const [activeFlowMode, setActiveFlowMode] = useState<FlowViewMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // RBAC
  const { dbRole, isAdmin } = useRBACPermissions();

  // Fetch environment data
  const fetchEnvironmentData = useCallback(async () => {
    try {
      // Fetch environment configs
      const { data: envConfigs } = await supabase
        .from('environment_configs')
        .select('*')
        .eq('is_active', true);

      // Fetch latest deployments per environment
      const { data: deployments } = await supabase
        .from('deployments')
        .select('*')
        .order('deployed_at', { ascending: false });

      // Fetch approval statuses
      const { data: approvals } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('status', 'pending');

      // Build environment data
      const envData: EnvironmentData[] = ENVIRONMENT_ORDER.map((envId) => {
        const config = envConfigs?.find(
          (c) => c.environment.toLowerCase() === envId || c.name.toLowerCase() === envId
        );
        const latestDeploy = deployments?.find(
          (d) => d.environment.toLowerCase() === envId
        );
        const pendingApproval = approvals?.find(
          (a) => {
            const meta = a.description as string;
            return meta?.toLowerCase().includes(envId);
          }
        );

        // Determine status
        let status: EnvironmentStatus = 'pending';
        if (latestDeploy) {
          if (latestDeploy.status === 'success') status = 'healthy';
          else if (latestDeploy.status === 'failed') status = 'failed';
          else if (latestDeploy.status === 'running') status = 'pending';
        }
        if (pendingApproval) status = 'blocked';

        return {
          id: envId,
          name: ENVIRONMENT_DISPLAY_NAMES[envId],
          displayName: ENVIRONMENT_DISPLAY_NAMES[envId],
          status,
          lastDeployment: latestDeploy ? {
            version: latestDeploy.version,
            timestamp: new Date(latestDeploy.deployed_at).toLocaleString(),
            status: latestDeploy.status as 'success' | 'failed' | 'running',
            deployedBy: latestDeploy.deployed_by || undefined,
          } : undefined,
          approvalStatus: pendingApproval ? 'pending' : 'approved',
        };
      });

      setEnvironments(envData);

      // Calculate arrow statuses based on environment states
      const arrows: Record<string, ArrowStatus> = {};
      for (let i = 0; i < ENVIRONMENT_ORDER.length - 1; i++) {
        const from = ENVIRONMENT_ORDER[i];
        const to = ENVIRONMENT_ORDER[i + 1];
        const fromEnv = envData.find(e => e.id === from);
        const toEnv = envData.find(e => e.id === to);
        
        let status: ArrowStatus = 'not-eligible';
        
        if (fromEnv?.status === 'healthy') {
          if (toEnv?.approvalStatus === 'pending') {
            status = 'awaiting-approval';
          } else if (toEnv?.status === 'healthy') {
            status = 'promoted';
          } else if (toEnv?.status === 'failed') {
            status = 'blocked';
          } else {
            status = 'ci-passed';
          }
        } else if (fromEnv?.status === 'failed') {
          status = 'blocked';
        }
        
        arrows[`${from}-${to}`] = status;
      }
      setArrowStatuses(arrows);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('[OPZENIX] Failed to fetch environment data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and realtime subscription
  useEffect(() => {
    fetchEnvironmentData();

    const channel = supabase
      .channel('opzenix-enterprise-view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'environment_configs' }, fetchEnvironmentData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deployments' }, fetchEnvironmentData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approval_requests' }, fetchEnvironmentData)
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEnvironmentData]);

  // Handle flow mode selection
  const handleSelectFlowMode = useCallback((env: EnvironmentId, mode: FlowViewMode) => {
    setActiveEnvironment(env);
    setActiveFlowMode(mode);
  }, []);

  // Handle arrow click
  const handleArrowClick = useCallback((from: EnvironmentId, to: EnvironmentId) => {
    console.log('[OPZENIX] Arrow clicked:', from, '→', to);
  }, []);

  // Clear active view
  const handleClearView = useCallback(() => {
    setActiveEnvironment(null);
    setActiveFlowMode(null);
  }, []);

  // Get flow mode icon
  const getFlowModeIcon = (mode: FlowViewMode) => {
    switch (mode) {
      case 'ci': return GitBranch;
      case 'cd': return Rocket;
      case 'ci+cd': return Layers;
    }
  };

  const FlowModeIcon = activeFlowMode ? getFlowModeIcon(activeFlowMode) : Activity;

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading OPZENIX Control Plane...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">OPZENIX Control Plane</h1>
          </div>
          
          {/* Live Indicator */}
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isLive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'
            )} />
            <span className="text-xs text-muted-foreground">
              {isLive ? 'LIVE' : 'CONNECTING'}
            </span>
          </div>

          {/* Role Badge */}
          <Badge variant="outline" className="text-xs">
            Role: {dbRole?.toUpperCase() || 'VIEWER'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-[10px] text-muted-foreground">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Badge variant="secondary" className="text-[10px]">
            MVP 1.0.0 LOCKED
          </Badge>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Environment Layer */}
      <div className="p-4 border-b border-border bg-muted/20">
        <OpzenixEnvironmentLayer
          environments={environments}
          arrowStatuses={arrowStatuses}
          activeEnvironment={activeEnvironment || undefined}
          onSelectFlowMode={handleSelectFlowMode}
          onArrowClick={handleArrowClick}
        />
      </div>

      {/* Active Flow Header (when viewing a specific flow) */}
      <AnimatePresence>
        {activeEnvironment && activeFlowMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between p-3 border-b border-border bg-primary/5"
          >
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleClearView}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <FlowModeIcon className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">
                  ENVIRONMENT: {ENVIRONMENT_DISPLAY_NAMES[activeEnvironment]}
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="font-medium text-foreground">
                  FLOW TYPE: {activeFlowMode.toUpperCase()}
                </span>
              </div>
            </div>
            
            {/* RBAC Actions */}
            <div className="flex items-center gap-2">
              <RBACActionsPanel
                environment={activeEnvironment as RBACEnvironment}
                onApprove={() => console.log('Approve', activeEnvironment)}
                onDeploy={() => console.log('Deploy', activeEnvironment)}
                onRollback={() => console.log('Rollback', activeEnvironment)}
                onBreakGlass={isAdmin ? () => console.log('Break Glass', activeEnvironment) : undefined}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeEnvironment && activeFlowMode ? (
          <OpzenixFlowMap
            executionId={executionId}
            environment={activeEnvironment}
            onNodeSelect={(nodeId, data) => {
              console.log('[OPZENIX] Node selected:', nodeId, data);
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4 max-w-lg p-8">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto">
                <Eye className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Select an Environment</h3>
              <p className="text-sm text-muted-foreground">
                Click on any environment box above and select a flow type (CI, CD, or CI+CD) to view 
                the pipeline execution details with full audit transparency.
              </p>
              <div className="pt-4">
                <RBACRoleMatrix />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpzenixEnterpriseFlowView;
