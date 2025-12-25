import { useMemo } from 'react';
import { useRBACPermissions } from './useRBACPermissions';
import { 
  RBAC_DRAG_DROP_RULES, 
  RBACDragDropPermissions,
  EnvironmentScope,
  OpzenixWidget 
} from '@/types/opzenix-widgets';

// Map database roles to RBAC widget permissions
const DB_ROLE_TO_WIDGET_RBAC = {
  admin: ['CTO', 'PLATFORM_OWNER', 'ARCHITECT', 'TECH_LEAD'],
  operator: ['TECH_LEAD', 'QA_LEAD'],
  viewer: ['QA_LEAD'],
} as const;

export function useWidgetRBAC(currentEnvironment: EnvironmentScope = 'global') {
  const { dbRole, isAdmin, isOperator, isViewer, loading } = useRBACPermissions();

  const permissions = useMemo<RBACDragDropPermissions>(() => {
    if (loading || !dbRole) {
      return {
        canReorder: false,
        canResize: false,
        canAddRemove: false,
        scope: [],
      };
    }

    // Get applicable RBAC roles
    const rbacRoles = DB_ROLE_TO_WIDGET_RBAC[dbRole] || [];
    
    // Find the best permission set for current environment
    let bestPermissions: RBACDragDropPermissions = {
      canReorder: false,
      canResize: false,
      canAddRemove: false,
      scope: [],
    };

    for (const role of rbacRoles) {
      const rolePerms = RBAC_DRAG_DROP_RULES[role as keyof typeof RBAC_DRAG_DROP_RULES];
      if (!rolePerms) continue;

      // Check if this role has permissions for current environment
      const hasScope = currentEnvironment === 'global' 
        ? rolePerms.scope.length > 0 
        : rolePerms.scope.includes(currentEnvironment);

      if (hasScope) {
        // Merge permissions (take highest privilege)
        bestPermissions = {
          canReorder: bestPermissions.canReorder || rolePerms.canReorder,
          canResize: bestPermissions.canResize || rolePerms.canResize,
          canAddRemove: bestPermissions.canAddRemove || rolePerms.canAddRemove,
          scope: [...new Set([...bestPermissions.scope, ...rolePerms.scope])],
        };
      }
    }

    return bestPermissions;
  }, [dbRole, currentEnvironment, loading]);

  // Check if widget can be dragged
  const canDragWidget = (widget: OpzenixWidget): boolean => {
    // Fixed widgets (audit) are never draggable
    if (widget.isFixed) return false;
    
    // PROD dashboard is locked for everyone except CTO
    if (widget.environment === 'prod' && !isAdmin) return false;
    
    // Check if user has reorder permission for widget's environment
    if (!permissions.canReorder) return false;
    
    return permissions.scope.includes(widget.environment) || 
           permissions.scope.includes('global') ||
           widget.environment === 'global';
  };

  // Check if widget can be resized
  const canResizeWidget = (widget: OpzenixWidget): boolean => {
    if (widget.isFixed) return false;
    if (widget.environment === 'prod' && !isAdmin) return false;
    if (!permissions.canResize) return false;
    
    return permissions.scope.includes(widget.environment) || 
           permissions.scope.includes('global') ||
           widget.environment === 'global';
  };

  // Check if user can add/remove widgets
  const canModifyWidgets = (): boolean => {
    // In MVP 1.0.0, no user can add custom widgets
    return false;
  };

  // Get restriction tooltip
  const getRestrictionTooltip = (widget: OpzenixWidget): string | null => {
    if (widget.isFixed) {
      return 'Audit widgets have fixed position for compliance';
    }
    if (widget.environment === 'prod' && !isAdmin) {
      return 'PROD dashboard layout is locked (CTO only)';
    }
    if (!permissions.canReorder) {
      return `Your role (${dbRole?.toUpperCase()}) does not have dashboard edit permissions`;
    }
    if (!permissions.scope.includes(widget.environment) && widget.environment !== 'global') {
      return `Your role cannot modify ${widget.environment.toUpperCase()} widgets`;
    }
    return null;
  };

  return {
    permissions,
    canDragWidget,
    canResizeWidget,
    canModifyWidgets,
    getRestrictionTooltip,
    loading,
    dbRole,
    isAdmin,
  };
}
