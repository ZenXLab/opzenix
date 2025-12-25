import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRBACPermissions } from '@/hooks/useRBACPermissions';
import { cn } from '@/lib/utils';

interface RBACVisibilityWidgetProps {
  id: string;
  onRemove: (id: string) => void;
}

const PERMISSION_ICONS = {
  approve: CheckCircle,
  deploy: Shield,
  view: Eye,
  rollback: Lock,
  break_glass: Shield,
};

export function RBACVisibilityWidget({ id, onRemove }: RBACVisibilityWidgetProps) {
  const {
    dbRole,
    rbacRoles,
    isAdmin,
    isOperator,
    isViewer,
    canApprove,
    canDeploy,
    canView,
    canRollback,
    canBreakGlass,
    loading,
  } = useRBACPermissions();

  const environments = ['dev', 'uat', 'staging', 'preprod', 'prod'] as const;

  const getRoleBadgeColor = () => {
    if (isAdmin) return 'bg-primary text-primary-foreground';
    if (isOperator) return 'bg-sec-warning/20 text-sec-warning';
    return 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-32">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Your Permissions</span>
        </div>
        <Badge className={cn('text-xs', getRoleBadgeColor())}>
          {dbRole?.toUpperCase() || 'VIEWER'}
        </Badge>
      </div>

      {/* RBAC Roles */}
      {rbacRoles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {rbacRoles.map((role) => (
            <Badge key={role} variant="outline" className="text-[10px]">
              {role.replace('_', ' ')}
            </Badge>
          ))}
        </div>
      )}

      {/* Permissions Matrix */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">
          Environment Access
        </p>
        <div className="grid grid-cols-5 gap-1">
          {environments.map((env) => (
            <TooltipProvider key={env}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'flex flex-col items-center p-2 rounded-md border text-center transition-colors',
                      canView(env)
                        ? 'bg-sec-safe/5 border-sec-safe/30'
                        : 'bg-muted/30 border-border opacity-50'
                    )}
                  >
                    <span className="text-[10px] font-semibold uppercase">{env}</span>
                    <div className="flex gap-0.5 mt-1">
                      {canApprove(env) && (
                        <CheckCircle className="w-3 h-3 text-sec-safe" />
                      )}
                      {canDeploy(env) && (
                        <Shield className="w-3 h-3 text-primary" />
                      )}
                      {canRollback(env) && (
                        <Lock className="w-3 h-3 text-sec-warning" />
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="text-xs space-y-1">
                    <p className="font-medium">{env.toUpperCase()} Permissions</p>
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1">
                        {canView(env) ? <CheckCircle className="w-3 h-3 text-sec-safe" /> : <XCircle className="w-3 h-3 text-sec-danger" />}
                        View
                      </span>
                      <span className="flex items-center gap-1">
                        {canApprove(env) ? <CheckCircle className="w-3 h-3 text-sec-safe" /> : <XCircle className="w-3 h-3 text-sec-danger" />}
                        Approve
                      </span>
                      <span className="flex items-center gap-1">
                        {canDeploy(env) ? <CheckCircle className="w-3 h-3 text-sec-safe" /> : <XCircle className="w-3 h-3 text-sec-danger" />}
                        Deploy
                      </span>
                      <span className="flex items-center gap-1">
                        {canRollback(env) ? <CheckCircle className="w-3 h-3 text-sec-safe" /> : <XCircle className="w-3 h-3 text-sec-danger" />}
                        Rollback
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      {/* Break Glass */}
      {canBreakGlass() && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-sec-danger/10 border border-sec-danger/30">
          <Shield className="w-4 h-4 text-sec-danger" />
          <span className="text-xs text-sec-danger font-medium">Break Glass Available</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t border-border">
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-sec-safe" /> Approve
        </span>
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-primary" /> Deploy
        </span>
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-sec-warning" /> Rollback
        </span>
      </div>
    </div>
  );
}

export default RBACVisibilityWidget;
