import { useMemo } from 'react';
import { useUserRole } from './useUserRole';

type Environment = 'dev' | 'uat' | 'staging' | 'preprod' | 'prod';
type Permission = 'approve' | 'deploy' | 'view' | 'rollback' | 'break_glass';

// RBAC roles configuration (LOCKED as per MVP 1.0.0)
const RBAC_CONFIG = {
  roles: {
    TECH_LEAD: {
      environments: ['dev'] as Environment[],
      permissions: ['approve', 'deploy', 'view'] as Permission[],
    },
    QA_LEAD: {
      environments: ['uat'] as Environment[],
      permissions: ['approve', 'view'] as Permission[],
    },
    ARCHITECT: {
      environments: ['staging', 'preprod'] as Environment[],
      permissions: ['approve', 'view'] as Permission[],
    },
    CTO: {
      environments: ['preprod', 'prod'] as Environment[],
      permissions: ['approve', 'deploy', 'break_glass'] as Permission[],
    },
    SECURITY_HEAD: {
      environments: ['prod'] as Environment[],
      permissions: ['approve', 'view'] as Permission[],
    },
    PLATFORM_OWNER: {
      environments: ['prod'] as Environment[],
      permissions: ['approve', 'deploy', 'rollback'] as Permission[],
    },
  },
  audit: {
    mandatoryFields: [
      'user_id',
      'email',
      'role',
      'environment',
      'action',
      'artifact_sha',
      'timestamp',
      'comment',
    ],
  },
  rules: {
    noRoleStacking: true,
    noSelfApproval: true,
    prodRequiredApprovals: 3,
    breakGlassRequiresCTO: true,
  },
};

// Map database roles to RBAC capabilities
const DB_ROLE_TO_RBAC = {
  admin: ['PLATFORM_OWNER', 'CTO', 'ARCHITECT', 'TECH_LEAD'],
  operator: ['TECH_LEAD', 'QA_LEAD'],
  viewer: [],
} as const;

// Deployment strategy per environment (LOCKED)
const DEPLOYMENT_STRATEGIES = {
  dev: 'rolling',
  uat: 'rolling',
  staging: 'canary',
  preprod: 'canary',
  prod: 'blue-green',
} as const;

export function useRBACPermissions() {
  const { role: dbRole, userId, isAdmin, isOperator, isViewer, loading } = useUserRole();

  const permissions = useMemo(() => {
    // Get RBAC roles based on database role
    const rbacRoles = dbRole ? DB_ROLE_TO_RBAC[dbRole] || [] : [];
    
    // Aggregate permissions from all applicable roles
    const allPermissions = new Set<Permission>();
    const allEnvironments = new Set<Environment>();
    
    rbacRoles.forEach((roleName) => {
      const roleConfig = RBAC_CONFIG.roles[roleName as keyof typeof RBAC_CONFIG.roles];
      if (roleConfig) {
        roleConfig.permissions.forEach((p) => allPermissions.add(p));
        roleConfig.environments.forEach((e) => allEnvironments.add(e));
      }
    });

    return {
      permissions: Array.from(allPermissions),
      environments: Array.from(allEnvironments),
      rbacRoles,
    };
  }, [dbRole]);

  // Permission check functions
  const canApprove = (environment: Environment): boolean => {
    return permissions.permissions.includes('approve') && 
           permissions.environments.includes(environment);
  };

  const canDeploy = (environment: Environment): boolean => {
    return permissions.permissions.includes('deploy') && 
           permissions.environments.includes(environment);
  };

  const canView = (environment: Environment): boolean => {
    // Viewers can view everything, others need explicit permission
    if (isViewer) return true;
    return permissions.permissions.includes('view') || 
           permissions.environments.includes(environment);
  };

  const canRollback = (environment: Environment): boolean => {
    return permissions.permissions.includes('rollback') && 
           permissions.environments.includes(environment);
  };

  const canBreakGlass = (): boolean => {
    return permissions.permissions.includes('break_glass') && isAdmin;
  };

  const getDeploymentStrategy = (environment: Environment) => {
    return DEPLOYMENT_STRATEGIES[environment] || 'rolling';
  };

  const getRequiredApprovals = (environment: Environment): number => {
    if (environment === 'prod') return RBAC_CONFIG.rules.prodRequiredApprovals;
    if (environment === 'preprod') return 2;
    return 1;
  };

  // Check if user can create projects (admin or operator, or first-time user)
  const canCreateProject = (): boolean => {
    return isAdmin || isOperator;
  };

  // Check if user can manage connections
  const canManageConnections = (): boolean => {
    return isAdmin || isOperator;
  };

  // Check if user can manage environments
  const canManageEnvironments = (): boolean => {
    return isAdmin;
  };

  // Check if user can manage roles
  const canManageRoles = (): boolean => {
    return isAdmin;
  };

  // Audit log helper
  const createAuditEntry = (action: string, details: Record<string, unknown>) => {
    return {
      user_id: userId,
      action,
      environment: details.environment,
      artifact_sha: details.artifactSha,
      timestamp: new Date().toISOString(),
      comment: details.comment,
      ...details,
    };
  };

  return {
    // Role info
    dbRole,
    userId,
    loading,
    isAdmin,
    isOperator,
    isViewer,
    rbacRoles: permissions.rbacRoles,
    
    // Permission checks
    canApprove,
    canDeploy,
    canView,
    canRollback,
    canBreakGlass,
    canCreateProject,
    canManageConnections,
    canManageEnvironments,
    canManageRoles,
    
    // Deployment info
    getDeploymentStrategy,
    getRequiredApprovals,
    
    // Audit
    createAuditEntry,
    
    // Config (read-only)
    config: RBAC_CONFIG,
    deploymentStrategies: DEPLOYMENT_STRATEGIES,
  };
}

export type { Environment, Permission };
export { RBAC_CONFIG, DEPLOYMENT_STRATEGIES };
