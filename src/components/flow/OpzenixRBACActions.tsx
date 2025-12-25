import { memo } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Lock,
  Eye,
  Rocket,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useRBACPermissions, type Environment as RBACEnvironment } from '@/hooks/useRBACPermissions';
import {
  RBAC_ACTION_MATRIX,
  RBAC_ENVIRONMENT_ACCESS,
  ENVIRONMENT_CONFIGS,
  DB_ROLE_TO_OPZENIX,
  type RBACRole,
  type RBACAction,
  type EnvironmentId,
} from '@/lib/opzenix-constants';

// ============================================
// 🔒 OPZENIX RBAC UI ENFORCEMENT (LOCKED MVP 1.0.0)
// ============================================
// UI actions enabled/disabled based on role
// Disabled buttons MUST be visible with tooltip
// No hidden permissions. No implicit actions.
// CTO override = warning + confirmation + BREAK-GLASS log
// ============================================

export type OpzenixAction = RBACAction;

interface RBACActionButtonProps {
  action: RBACAction;
  environment: RBACEnvironment;
  onAction: () => void;
  loading?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

// Action configurations (LOCKED)
const ACTION_CONFIG: Record<RBACAction, {
  icon: React.ElementType;
  label: string;
  description: string;
  requiresConfirmation: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
}> = {
  'view-ci': {
    icon: Eye,
    label: 'View CI',
    description: 'View continuous integration pipeline',
    requiresConfirmation: false,
  },
  'view-cd': {
    icon: Rocket,
    label: 'View CD',
    description: 'View continuous deployment pipeline',
    requiresConfirmation: false,
  },
  'approve': {
    icon: CheckCircle2,
    label: 'Approve',
    description: 'Approve deployment to this environment',
    requiresConfirmation: true,
    confirmationTitle: 'Confirm Approval',
    confirmationDescription: 'Are you sure you want to approve this deployment? This action will be logged with your identity, role, and timestamp.',
  },
  'deploy': {
    icon: Play,
    label: 'Deploy',
    description: 'Trigger deployment to this environment',
    requiresConfirmation: true,
    confirmationTitle: 'Confirm Deployment',
    confirmationDescription: 'Are you sure you want to deploy? This will promote the verified artifact to the target environment.',
  },
  'rollback': {
    icon: RotateCcw,
    label: 'Rollback',
    description: 'Rollback to previous version',
    requiresConfirmation: true,
    confirmationTitle: 'Confirm Rollback',
    confirmationDescription: 'Are you sure you want to rollback? This will revert to the previous deployment version.',
  },
  'break-glass': {
    icon: AlertTriangle,
    label: 'Break Glass',
    description: 'Emergency override - CTO only',
    requiresConfirmation: true,
    confirmationTitle: '⚠️ BREAK GLASS EMERGENCY OVERRIDE',
    confirmationDescription: 'This action bypasses all approval gates. Only use in genuine emergencies. This will be logged as BREAK-GLASS with full audit trail.',
  },
};

// Get user's OPZENIX roles from database role
const getOpzenixRoles = (dbRole: string | null): RBACRole[] => {
  if (!dbRole) return [];
  return DB_ROLE_TO_OPZENIX[dbRole] || [];
};

// Check if action is allowed for role in environment (using LOCKED matrix)
const checkActionPermission = (
  action: RBACAction,
  environment: EnvironmentId,
  opzenixRoles: RBACRole[]
): { allowed: boolean; reason: string; allowingRole?: RBACRole } => {
  // Check each role the user has
  for (const role of opzenixRoles) {
    const roleMatrix = RBAC_ACTION_MATRIX[role];
    if (!roleMatrix) continue;

    const actionPermission = roleMatrix[action];
    
    // If action is boolean true, allowed everywhere
    if (actionPermission === true) {
      return { allowed: true, reason: `Allowed for ${role}`, allowingRole: role };
    }
    
    // If action is array, check if environment is in it
    if (Array.isArray(actionPermission)) {
      if (actionPermission.includes(environment)) {
        return { allowed: true, reason: `Allowed for ${role} in ${environment.toUpperCase()}`, allowingRole: role };
      }
    }
  }

  // Not allowed
  const roleNames = opzenixRoles.length > 0 ? opzenixRoles.join(', ') : 'Viewer';
  const envConfig = ENVIRONMENT_CONFIGS[environment];
  const requiredRoles = envConfig?.approval.roles.join(' or ') || 'authorized personnel';
  
  return {
    allowed: false,
    reason: `Action not permitted for your role in ${environment.toUpperCase()}. Required: ${requiredRoles}`,
  };
};

// RBAC Action Button Component
export const RBACActionButton = memo(({
  action,
  environment,
  onAction,
  loading = false,
  variant = 'default',
  size = 'default',
  className,
}: RBACActionButtonProps) => {
  const { dbRole, isAdmin } = useRBACPermissions();
  const opzenixRoles = getOpzenixRoles(dbRole);
  const config = ACTION_CONFIG[action];
  const { allowed, reason, allowingRole } = checkActionPermission(action, environment as EnvironmentId, opzenixRoles);
  const Icon = config.icon;

  const buttonContent = (
    <Button
      variant={allowed ? variant : 'outline'}
      size={size}
      disabled={!allowed || loading}
      onClick={allowed && !config.requiresConfirmation ? onAction : undefined}
      className={cn(
        'gap-2',
        !allowed && 'opacity-50 cursor-not-allowed',
        action === 'break-glass' && allowed && 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
        className
      )}
    >
      {loading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      {config.label}
    </Button>
  );

  // Wrap with tooltip (ALWAYS visible for disabled state explanation)
  const buttonWithTooltip = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">{buttonContent}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            {!allowed ? (
              <div className="flex items-start gap-2">
                <Lock className="w-3 h-3 mt-0.5 text-amber-400 flex-shrink-0" />
                <span className="text-xs">{reason}</span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 mt-0.5 text-emerald-400 flex-shrink-0" />
                <span className="text-xs">{reason}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Wrap with confirmation dialog if needed and allowed
  if (allowed && config.requiresConfirmation) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          {buttonWithTooltip}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={action === 'break-glass' ? 'text-destructive' : ''}>
              {config.confirmationTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{config.confirmationDescription}</p>
              
              {/* Audit info */}
              <div className="p-3 bg-muted/50 rounded-lg border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Environment:</span>
                  <span className="font-medium text-foreground">{environment.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium text-foreground">{allowingRole || dbRole?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Action:</span>
                  <span className="font-medium text-foreground">{config.label}</span>
                </div>
              </div>

              {action === 'break-glass' && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    This action will be logged as BREAK-GLASS
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Full audit trail with identity, timestamp, and justification will be recorded.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onAction}
              className={action === 'break-glass' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              Confirm {config.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return buttonWithTooltip;
});
RBACActionButton.displayName = 'RBACActionButton';

// RBAC Actions Panel for an environment
interface RBACActionsPanelProps {
  environment: RBACEnvironment;
  onApprove?: () => void;
  onDeploy?: () => void;
  onRollback?: () => void;
  onBreakGlass?: () => void;
  loading?: { approve?: boolean; deploy?: boolean; rollback?: boolean; breakGlass?: boolean };
}

export const RBACActionsPanel = memo(({
  environment,
  onApprove,
  onDeploy,
  onRollback,
  onBreakGlass,
  loading = {},
}: RBACActionsPanelProps) => {
  const { dbRole, isAdmin } = useRBACPermissions();
  const opzenixRoles = getOpzenixRoles(dbRole);
  const envConfig = ENVIRONMENT_CONFIGS[environment as EnvironmentId];

  return (
    <div className="space-y-4">
      {/* Role & Environment Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Role:</span>
          <Badge variant="secondary" className="text-xs">
            {opzenixRoles[0] || dbRole?.toUpperCase() || 'VIEWER'}
          </Badge>
        </div>
        <Badge variant="outline" className="text-xs">
          {environment.toUpperCase()}
        </Badge>
      </div>

      {/* Environment Info */}
      {envConfig && (
        <div className="p-2 bg-muted/30 rounded-lg text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Strategy:</span>
            <span className="text-foreground capitalize">{envConfig.cd.deploymentStrategy}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Required Approvals:</span>
            <span className="text-foreground">{envConfig.approval.requiredApprovers}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Required Roles:</span>
            <span className="text-foreground">{envConfig.approval.roles.join(', ')}</span>
          </div>
        </div>
      )}

      {/* Actions Grid */}
      <div className="grid grid-cols-2 gap-2">
        {onApprove && (
          <RBACActionButton
            action="approve"
            environment={environment}
            onAction={onApprove}
            loading={loading.approve}
            variant="outline"
            size="sm"
          />
        )}
        {onDeploy && (
          <RBACActionButton
            action="deploy"
            environment={environment}
            onAction={onDeploy}
            loading={loading.deploy}
            variant="default"
            size="sm"
          />
        )}
        {onRollback && (
          <RBACActionButton
            action="rollback"
            environment={environment}
            onAction={onRollback}
            loading={loading.rollback}
            variant="outline"
            size="sm"
          />
        )}
        {onBreakGlass && isAdmin && (
          <RBACActionButton
            action="break-glass"
            environment={environment}
            onAction={onBreakGlass}
            loading={loading.breakGlass}
            variant="destructive"
            size="sm"
            className="col-span-2"
          />
        )}
      </div>

      {/* RBAC Notice */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground border-t border-border pt-2">
        <Lock className="w-3 h-3" />
        <span>Actions enforced by RBAC policy MVP 1.0.0 (LOCKED)</span>
      </div>
    </div>
  );
});
RBACActionsPanel.displayName = 'RBACActionsPanel';

// RBAC Role Matrix Display (LOCKED)
export const RBACRoleMatrix = memo(() => {
  const roles: { name: RBACRole; envs: string[]; actions: string[] }[] = [
    { name: 'Tech Lead', envs: ['Dev'], actions: ['View CI/CD', 'Approve', 'Deploy'] },
    { name: 'QA Lead', envs: ['UAT'], actions: ['View CI', 'Approve'] },
    { name: 'Architect', envs: ['Staging', 'PreProd'], actions: ['View CI/CD', 'Approve'] },
    { name: 'Platform Owner', envs: ['Prod'], actions: ['View CI/CD', 'Approve', 'Deploy', 'Rollback'] },
    { name: 'Security Head', envs: ['Prod'], actions: ['View CI', 'Approve'] },
    { name: 'CTO', envs: ['All'], actions: ['All + Break-Glass'] },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
        <Shield className="w-3 h-3" />
        RBAC Role Matrix (MVP 1.0.0 LOCKED)
      </div>
      
      <div className="space-y-2">
        {roles.map((role) => (
          <div 
            key={role.name}
            className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-xs"
          >
            <span className="font-medium text-foreground">{role.name}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {role.envs.join(', ')}
              </Badge>
              <span className="text-muted-foreground text-[10px]">
                {role.actions.length > 2 
                  ? `${role.actions.slice(0, 2).join(', ')}...` 
                  : role.actions.join(', ')}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <div className="flex items-start gap-2 text-xs">
          <Info className="w-3 h-3 mt-0.5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-amber-400 font-medium">No Hidden Permissions</p>
            <p className="text-muted-foreground">
              Disabled buttons show tooltips explaining why. No self-approval allowed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
RBACRoleMatrix.displayName = 'RBACRoleMatrix';
