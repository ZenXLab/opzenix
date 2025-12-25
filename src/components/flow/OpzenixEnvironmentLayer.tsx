import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  GitBranch,
  Workflow,
  Layers,
  Eye,
  Rocket,
  Shield,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useRBACPermissions } from '@/hooks/useRBACPermissions';

// ============================================
// 🔒 OPZENIX ENVIRONMENT LAYER (LOCKED MVP 1.0.0)
// ============================================
// Order is IMMUTABLE: DEV → UAT → STAGING → PREPROD → PROD
// Boxes are NOT draggable
// ============================================

export type EnvironmentId = 'dev' | 'uat' | 'staging' | 'preprod' | 'prod';
export type EnvironmentStatus = 'healthy' | 'blocked' | 'failed' | 'pending';
export type FlowViewMode = 'ci' | 'cd' | 'ci+cd';

// Arrow status for promotion readiness
export type ArrowStatus = 'not-eligible' | 'ci-passed' | 'awaiting-approval' | 'promoted' | 'blocked';

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

// LOCKED Environment Order (NON-NEGOTIABLE)
const ENVIRONMENT_ORDER: EnvironmentId[] = ['dev', 'uat', 'staging', 'preprod', 'prod'];

const ENVIRONMENT_DISPLAY_NAMES: Record<EnvironmentId, string> = {
  dev: 'DEV',
  uat: 'UAT',
  staging: 'STAGING',
  preprod: 'PREPROD',
  prod: 'PROD',
};

// Status colors (LOCKED)
const STATUS_CONFIG: Record<EnvironmentStatus, { 
  color: string; 
  bgColor: string; 
  borderColor: string;
  icon: React.ElementType;
  label: string;
}> = {
  healthy: { 
    color: '#22C55E', 
    bgColor: 'rgba(34, 197, 94, 0.1)', 
    borderColor: 'rgba(34, 197, 94, 0.3)',
    icon: CheckCircle2,
    label: 'Healthy',
  },
  blocked: { 
    color: '#F59E0B', 
    bgColor: 'rgba(245, 158, 11, 0.1)', 
    borderColor: 'rgba(245, 158, 11, 0.3)',
    icon: Lock,
    label: 'Blocked',
  },
  failed: { 
    color: '#EF4444', 
    bgColor: 'rgba(239, 68, 68, 0.1)', 
    borderColor: 'rgba(239, 68, 68, 0.3)',
    icon: XCircle,
    label: 'Failed',
  },
  pending: { 
    color: '#6B7280', 
    bgColor: 'rgba(107, 114, 128, 0.1)', 
    borderColor: 'rgba(107, 114, 128, 0.3)',
    icon: Clock,
    label: 'Pending',
  },
};

// Arrow colors based on promotion status
const ARROW_CONFIG: Record<ArrowStatus, { 
  color: string; 
  label: string;
  description: string;
}> = {
  'not-eligible': { 
    color: '#6B7280', 
    label: 'Not Eligible',
    description: 'CI has not passed or prerequisites not met',
  },
  'ci-passed': { 
    color: '#3B82F6', 
    label: 'CI Passed',
    description: 'CI passed, ready for promotion',
  },
  'awaiting-approval': { 
    color: '#F59E0B', 
    label: 'Awaiting Approval',
    description: 'Waiting for required approvals',
  },
  'promoted': { 
    color: '#22C55E', 
    label: 'Promoted',
    description: 'Successfully promoted to this environment',
  },
  'blocked': { 
    color: '#EF4444', 
    label: 'Blocked',
    description: 'Promotion blocked by policy or failure',
  },
};

interface EnvironmentBoxProps {
  environment: EnvironmentData;
  onSelectFlowMode: (env: EnvironmentId, mode: FlowViewMode) => void;
  isActive: boolean;
}

// Environment Box Component
const EnvironmentBox = memo(({ environment, onSelectFlowMode, isActive }: EnvironmentBoxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const statusConfig = STATUS_CONFIG[environment.status];
  const StatusIcon = statusConfig.icon;
  
  // RBAC checks
  const { 
    canView, 
    canDeploy, 
    canApprove, 
    canRollback, 
    isAdmin,
    dbRole,
  } = useRBACPermissions();
  
  const envForRBAC = environment.id as 'dev' | 'uat' | 'staging' | 'preprod' | 'prod';
  const canViewCI = canView(envForRBAC);
  const canViewCD = canView(envForRBAC) && canDeploy(envForRBAC);
  const canDoActions = canDeploy(envForRBAC) || canApprove(envForRBAC);

  const handleFlowSelect = (mode: FlowViewMode) => {
    setIsOpen(false);
    onSelectFlowMode(environment.id, mode);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: ENVIRONMENT_ORDER.indexOf(environment.id) * 0.1 }}
      className={cn(
        'relative min-w-[160px] rounded-lg border-2 transition-all duration-200',
        isActive && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
      style={{
        backgroundColor: '#020617',
        borderColor: statusConfig.borderColor,
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 border-b cursor-pointer"
        style={{ borderColor: statusConfig.borderColor }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-foreground">
              {environment.displayName}
            </span>
            <StatusIcon 
              className="w-4 h-4" 
              style={{ color: statusConfig.color }} 
            />
          </div>
          <Badge 
            variant="outline" 
            className="text-[10px]"
            style={{ borderColor: statusConfig.borderColor, color: statusConfig.color }}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Last Deployment */}
        {environment.lastDeployment ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Last Deploy:</span>
              <span className="font-mono text-foreground">
                {environment.lastDeployment.version}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {environment.lastDeployment.timestamp}
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">
            No deployments yet
          </div>
        )}

        {/* Flow Mode Selector */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-between gap-2"
              style={{ borderColor: statusConfig.borderColor }}
            >
              <span className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" />
                View Flow
              </span>
              <ChevronDown className={cn(
                'w-3.5 h-3.5 transition-transform',
                isOpen && 'rotate-180'
              )} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="center">
            <div className="space-y-1">
              {/* View CI Flow */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => handleFlowSelect('ci')}
                      disabled={!canViewCI}
                    >
                      <GitBranch className="w-4 h-4 text-blue-400" />
                      View CI Flow
                    </Button>
                  </TooltipTrigger>
                  {!canViewCI && (
                    <TooltipContent>
                      <p>Action not permitted for your role in this environment</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              {/* View CD Flow */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => handleFlowSelect('cd')}
                      disabled={!canViewCD}
                    >
                      <Rocket className="w-4 h-4 text-emerald-400" />
                      View CD Flow
                    </Button>
                  </TooltipTrigger>
                  {!canViewCD && (
                    <TooltipContent>
                      <p>Action not permitted for your role in this environment</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              {/* View CI + CD Flow */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => handleFlowSelect('ci+cd')}
                      disabled={!canViewCI}
                    >
                      <Layers className="w-4 h-4 text-purple-400" />
                      View CI + CD Flow
                    </Button>
                  </TooltipTrigger>
                  {!canViewCI && (
                    <TooltipContent>
                      <p>Action not permitted for your role in this environment</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </motion.div>
  );
});
EnvironmentBox.displayName = 'EnvironmentBox';

// Connectivity Arrow Component
interface ConnectivityArrowProps {
  fromEnv: EnvironmentId;
  toEnv: EnvironmentId;
  status: ArrowStatus;
  onArrowClick: (from: EnvironmentId, to: EnvironmentId) => void;
}

const ConnectivityArrow = memo(({ fromEnv, toEnv, status, onArrowClick }: ConnectivityArrowProps) => {
  const config = ARROW_CONFIG[status];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onArrowClick(fromEnv, toEnv)}
            className="flex items-center justify-center w-12 h-8 transition-all hover:scale-110"
          >
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <ArrowRight 
                className="w-6 h-6 transition-colors" 
                style={{ color: config.color }}
              />
              {status === 'awaiting-approval' && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
              )}
            </motion.div>
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <div className="font-medium" style={{ color: config.color }}>
              {ENVIRONMENT_DISPLAY_NAMES[fromEnv]} → {ENVIRONMENT_DISPLAY_NAMES[toEnv]}
            </div>
            <div className="text-xs text-muted-foreground">{config.description}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
ConnectivityArrow.displayName = 'ConnectivityArrow';

// Arrow Inspector Panel (READ-ONLY)
interface ArrowInspectorProps {
  fromEnv: EnvironmentId;
  toEnv: EnvironmentId;
  status: ArrowStatus;
  approvalStatus?: {
    required: number;
    approved: number;
    approvers?: Array<{ user: string; role: string; timestamp: string }>;
  };
  policyRef?: string;
  onClose: () => void;
}

export const ArrowInspectorPanel = memo(({ 
  fromEnv, 
  toEnv, 
  status, 
  approvalStatus,
  policyRef,
  onClose 
}: ArrowInspectorProps) => {
  const config = ARROW_CONFIG[status];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-[320px] bg-card border border-border rounded-lg shadow-xl"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" style={{ color: config.color }} />
            <div>
              <h3 className="font-semibold text-foreground">
                {ENVIRONMENT_DISPLAY_NAMES[fromEnv]} → {ENVIRONMENT_DISPLAY_NAMES[toEnv]}
              </h3>
              <p className="text-xs text-muted-foreground">Promotion Status</p>
            </div>
          </div>
          <Badge variant="outline" style={{ borderColor: config.color, color: config.color }}>
            {config.label}
          </Badge>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Why Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
            <Info className="w-3 h-3" />
            Why {status === 'promoted' ? 'Allowed' : status === 'blocked' ? 'Blocked' : 'Pending'}
          </div>
          <p className="text-sm text-foreground">{config.description}</p>
        </div>

        {/* Approval Status */}
        {approvalStatus && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
              <Shield className="w-3 h-3" />
              Approval Status
            </div>
            <div className="p-3 bg-muted/30 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Required:</span>
                <span className="text-foreground">{approvalStatus.required}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Approved:</span>
                <span className="text-foreground">{approvalStatus.approved}</span>
              </div>
              {approvalStatus.approvers && approvalStatus.approvers.length > 0 && (
                <div className="pt-2 border-t border-border space-y-1">
                  {approvalStatus.approvers.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-foreground">{a.user}</span>
                      <span className="text-muted-foreground">({a.role})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Policy Reference */}
        {policyRef && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
              <Shield className="w-3 h-3" />
              Policy Reference
            </div>
            <div className="p-2 bg-muted/30 rounded border border-border text-xs font-mono text-foreground">
              {policyRef}
            </div>
          </div>
        )}

        {/* Read-Only Notice */}
        <div className="flex items-center gap-2 p-2 bg-muted/20 rounded text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          This panel is read-only. Arrows do not trigger deployments.
        </div>
      </div>
    </motion.div>
  );
});
ArrowInspectorPanel.displayName = 'ArrowInspectorPanel';

// Main Environment Layer Component
interface OpzenixEnvironmentLayerProps {
  environments: EnvironmentData[];
  arrowStatuses: Record<string, ArrowStatus>; // key format: "dev-uat"
  activeEnvironment?: EnvironmentId;
  onSelectFlowMode: (env: EnvironmentId, mode: FlowViewMode) => void;
  onArrowClick?: (from: EnvironmentId, to: EnvironmentId) => void;
}

export const OpzenixEnvironmentLayer = memo(({
  environments,
  arrowStatuses,
  activeEnvironment,
  onSelectFlowMode,
  onArrowClick,
}: OpzenixEnvironmentLayerProps) => {
  const [selectedArrow, setSelectedArrow] = useState<{ from: EnvironmentId; to: EnvironmentId } | null>(null);
  
  // Sort environments by LOCKED order
  const sortedEnvs = [...environments].sort(
    (a, b) => ENVIRONMENT_ORDER.indexOf(a.id) - ENVIRONMENT_ORDER.indexOf(b.id)
  );

  const handleArrowClick = (from: EnvironmentId, to: EnvironmentId) => {
    setSelectedArrow({ from, to });
    onArrowClick?.(from, to);
  };

  const getArrowStatus = (from: EnvironmentId, to: EnvironmentId): ArrowStatus => {
    const key = `${from}-${to}`;
    return arrowStatuses[key] || 'not-eligible';
  };

  return (
    <div className="relative">
      {/* Environment Boxes with Arrows */}
      <div className="flex items-center gap-2 p-4 bg-background/50 backdrop-blur border border-border rounded-xl overflow-x-auto">
        {sortedEnvs.map((env, index) => (
          <div key={env.id} className="flex items-center">
            <EnvironmentBox
              environment={{ ...env, displayName: ENVIRONMENT_DISPLAY_NAMES[env.id] }}
              onSelectFlowMode={onSelectFlowMode}
              isActive={activeEnvironment === env.id}
            />
            {index < sortedEnvs.length - 1 && (
              <ConnectivityArrow
                fromEnv={env.id}
                toEnv={sortedEnvs[index + 1].id}
                status={getArrowStatus(env.id, sortedEnvs[index + 1].id)}
                onArrowClick={handleArrowClick}
              />
            )}
          </div>
        ))}
      </div>

      {/* Arrow Inspector (absolute positioned) */}
      <AnimatePresence>
        {selectedArrow && (
          <div className="absolute top-full right-0 mt-4 z-50">
            <ArrowInspectorPanel
              fromEnv={selectedArrow.from}
              toEnv={selectedArrow.to}
              status={getArrowStatus(selectedArrow.from, selectedArrow.to)}
              onClose={() => setSelectedArrow(null)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
OpzenixEnvironmentLayer.displayName = 'OpzenixEnvironmentLayer';

export { ENVIRONMENT_ORDER, ENVIRONMENT_DISPLAY_NAMES, STATUS_CONFIG, ARROW_CONFIG };
