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

// ============================================
// 🔒 OPZENIX RBAC UI ENFORCEMENT (LOCKED MVP 1.0.0)
// ============================================
// UI actions enabled/disabled based on role
// Disabled buttons MUST be visible with tooltip
// No hidden permissions. No implicit actions.
// ============================================

export type OpzenixAction = 
  | 'view-ci' 
  | 'view-cd' 
  | 'approve' 
  | 'deploy' 
  | 'rollback' 
  | 'break-glass';

interface RBACActionButtonProps {
  action: OpzenixAction;
  environment: RBACEnvironment;
  onAction: () => void;
  loading?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

// Action configurations
const ACTION_CONFIG: Record<OpzenixAction, {
  icon: React.ElementType;
  label: string;
  description: string;
  requiresConfirmation: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
}> = {
  'view-ci': {
    icon: Eye,
    label: 'View CI Flow',
    description: 'View continuous integration pipeline',
    requiresConfirmation: false,
  },
  'view-cd': {
    icon: Rocket,
    label: 'View CD Flow',
    description: 'View continuous deployment pipeline',
    requiresConfirmation: false,
  },
  'approve': {
    icon: CheckCircle2,
    label: 'Approve',
    description: 'Approve deployment to this environment',
    requiresConfirmation: true,
    confirmationTitle: 'Confirm Approval',
    confirmationDescription: 'Are you sure you want to approve this deployment? This action will be logged.',
  },
  'deploy': {
    icon: Play,
    label: 'Deploy',
    description: 'Trigger deployment to this environment',
    requiresConfirmation: true,
    confirmationTitle: 'Confirm Deployment',
    confirmationDescription: 'Are you sure you want to deploy to this environment? This action cannot be undone.',
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
    confirmationDescription: 'This action bypasses all approval gates and will be logged as BREAK-GLASS. Only use in emergency situations. Are you absolutely sure?',
  },
};

// Role-based permission check
const checkPermission = (
  action: OpzenixAction,
  environment: RBACEnvironment,
  permissions: ReturnType<typeof useRBACPermissions>
): { allowed: boolean; reason?: string } => {
  const { canView, canApprove, canDeploy, canRollback, canBreakGlass, isAdmin, dbRole } = permissions;

  switch (action) {
    case 'view-ci':
      // Everyone can view CI
      return { allowed: true };
    
    case 'view-cd':
      // Check if user can view CD for this environment
      if (canView(environment)) return { allowed: true };
      return { 
        allowed: false, 
        reason: `Your role (${dbRole || 'viewer'}) cannot view CD flows for ${environment.toUpperCase()}` 
      };
    
    case 'approve':
      if (canApprove(environment)) return { allowed: true };
      return { 
        allowed: false, 
        reason: `Your role (${dbRole || 'viewer'}) cannot approve deployments to ${environment.toUpperCase()}` 
      };
    
    case 'deploy':
      if (canDeploy(environment)) return { allowed: true };
      return { 
        allowed: false, 
        reason: `Your role (${dbRole || 'viewer'}) cannot deploy to ${environment.toUpperCase()}` 
      };
    
    case 'rollback':
      if (canRollback(environment)) return { allowed: true };
      return { 
        allowed: false, 
        reason: `Your role (${dbRole || 'viewer'}) cannot rollback in ${environment.toUpperCase()}` 
      };
    
    case 'break-glass':
      if (canBreakGlass()) return { allowed: true };
      return { 
        allowed: false, 
        reason: 'Break-Glass is only available to CTO (Super Admin)' 
      };
    
    default:
      return { allowed: false, reason: 'Unknown action' };
  }
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
  const permissions = useRBACPermissions();
  const config = ACTION_CONFIG[action];
  const { allowed, reason } = checkPermission(action, environment, permissions);
  const Icon = config.icon;

  const buttonContent = (
    <Button
      variant={allowed ? variant : 'outline'}
      size={size}
      disabled={!allowed || loading}
      onClick={allowed && !config.requiresConfirmation ? onAction : undefined}
      className={cn(
        'gap-2',
        !allowed && 'opacity-60 cursor-not-allowed',
        action === 'break-glass' && allowed && 'bg-red-600 hover:bg-red-700 text-white',
        className
      )}
    >
      <Icon className={cn('w-4 h-4', loading && 'animate-spin')} />
      {config.label}
    </Button>
  );

  // Wrap with tooltip for disabled state
  const buttonWithTooltip = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">{buttonContent}</span>
        </TooltipTrigger>
        {!allowed && reason && (
          <TooltipContent className="max-w-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3 text-muted-foreground" />
              <span>{reason}</span>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  // Wrap with confirmation dialog if needed
  if (allowed && config.requiresConfirmation) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          {buttonWithTooltip}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={action === 'break-glass' ? 'text-red-500' : ''}>
              {config.confirmationTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {config.confirmationDescription}
              {action === 'break-glass' && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-red-500 font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    This action will be logged as BREAK-GLASS
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onAction}
              className={action === 'break-glass' ? 'bg-red-600 hover:bg-red-700' : ''}
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
  const { dbRole, rbacRoles, isAdmin } = useRBACPermissions();

  return (
    <div className="space-y-4">
      {/* Role Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Your Role:</span>
          <Badge variant="secondary" className="text-xs">
            {dbRole?.toUpperCase() || 'VIEWER'}
          </Badge>
        </div>
        <Badge variant="outline" className="text-xs">
          {environment.toUpperCase()}
        </Badge>
      </div>

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

      {/* RBAC Info */}
      <div className="text-[10px] text-muted-foreground border-t border-border pt-2">
        <div className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Actions enforced by RBAC policy MVP 1.0.0
        </div>
      </div>
    </div>
  );
});
RBACActionsPanel.displayName = 'RBACActionsPanel';

// Role Matrix Display
export const RBACRoleMatrix = memo(() => {
  const roles = [
    { name: 'Tech Lead', envs: ['Dev'], actions: ['View CI/CD', 'Approve', 'Deploy'] },
    { name: 'QA Lead', envs: ['UAT'], actions: ['View CI', 'Approve'] },
    { name: 'Architect', envs: ['Staging', 'PreProd'], actions: ['View CI/CD', 'Approve'] },
    { name: 'Platform Owner', envs: ['Prod'], actions: ['View CI/CD', 'Approve', 'Deploy', 'Rollback'] },
    { name: 'Security Head', envs: ['Prod'], actions: ['View CI', 'Approve'] },
    { name: 'CTO', envs: ['All'], actions: ['All', 'Break-Glass'] },
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
              <span className="text-muted-foreground">
                {role.actions.slice(0, 2).join(', ')}{role.actions.length > 2 ? '...' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
RBACRoleMatrix.displayName = 'RBACRoleMatrix';
