// ============================================
// 🔒 OPZENIX MVP 1.0.0 CONSTANTS (LOCKED)
// ============================================
// This file contains all authoritative constants
// for the OPZENIX enterprise CI/CD control plane.
// DO NOT MODIFY without formal change control.
// ============================================

// ============================================
// A. BRANCH STRATEGY (LOCKED)
// Trunk-Based Branching Model
// ============================================

export type BranchType = 'feature' | 'bugfix' | 'main';

export interface BranchPattern {
  pattern: RegExp;
  type: BranchType;
  allowsCI: boolean;
  allowsCD: boolean;
  allowsPromotion: boolean;
  description: string;
}

export const BRANCH_PATTERNS: BranchPattern[] = [
  {
    pattern: /^feature\/.+$/,
    type: 'feature',
    allowsCI: true,
    allowsCD: false,
    allowsPromotion: false,
    description: 'Feature branch - CI only, no deployment',
  },
  {
    pattern: /^bugfix\/.+$/,
    type: 'bugfix',
    allowsCI: true,
    allowsCD: false,
    allowsPromotion: false,
    description: 'Bugfix branch - CI only, no deployment',
  },
  {
    pattern: /^main$/,
    type: 'main',
    allowsCI: true,
    allowsCD: true,
    allowsPromotion: true,
    description: 'Main branch - Full CI/CD and promotion eligible',
  },
];

export const getBranchType = (branch: string): BranchPattern | null => {
  return BRANCH_PATTERNS.find(p => p.pattern.test(branch)) || null;
};

export const isPromotionEligible = (branch: string): boolean => {
  const pattern = getBranchType(branch);
  return pattern?.allowsPromotion ?? false;
};

// ============================================
// B. ENVIRONMENT ORDER (LOCKED)
// Fixed and Immutable Promotion Path
// ============================================

export type EnvironmentId = 'dev' | 'uat' | 'staging' | 'preprod' | 'prod';

// LOCKED order - no skipping, no sideways promotion
export const ENVIRONMENT_ORDER: EnvironmentId[] = ['dev', 'uat', 'staging', 'preprod', 'prod'];

export const ENVIRONMENT_DISPLAY_NAMES: Record<EnvironmentId, string> = {
  dev: 'DEV',
  uat: 'UAT',
  staging: 'STAGING',
  preprod: 'PREPROD',
  prod: 'PROD',
};

// ============================================
// C. CI/CD BEHAVIOR PER ENVIRONMENT (LOCKED)
// ============================================

export type CIBehavior = 'full' | 'verification';
export type DeploymentStrategy = 'rolling' | 'canary' | 'blue-green';

export interface EnvironmentConfig {
  id: EnvironmentId;
  displayName: string;
  ci: {
    behavior: CIBehavior;
    buildAllowed: boolean;
    testsAllowed: boolean;
  };
  cd: {
    enabled: boolean;
    autoPromote: boolean;
    deploymentStrategy: DeploymentStrategy;
  };
  approval: {
    required: boolean;
    requiredApprovers: number;
    roles: string[];
  };
  source: EnvironmentId | 'main'; // Where artifact comes from
  purpose: string;
}

export const ENVIRONMENT_CONFIGS: Record<EnvironmentId, EnvironmentConfig> = {
  dev: {
    id: 'dev',
    displayName: 'DEV',
    ci: {
      behavior: 'full',
      buildAllowed: true,
      testsAllowed: true,
    },
    cd: {
      enabled: true,
      autoPromote: true,
      deploymentStrategy: 'rolling',
    },
    approval: {
      required: false,
      requiredApprovers: 1,
      roles: ['Tech Lead'],
    },
    source: 'main',
    purpose: 'Developer validation',
  },
  uat: {
    id: 'uat',
    displayName: 'UAT',
    ci: {
      behavior: 'verification',
      buildAllowed: false,
      testsAllowed: false,
    },
    cd: {
      enabled: true,
      autoPromote: false,
      deploymentStrategy: 'rolling',
    },
    approval: {
      required: true,
      requiredApprovers: 1,
      roles: ['QA Lead'],
    },
    source: 'dev',
    purpose: 'QA & business testing',
  },
  staging: {
    id: 'staging',
    displayName: 'STAGING',
    ci: {
      behavior: 'verification',
      buildAllowed: false,
      testsAllowed: false,
    },
    cd: {
      enabled: true,
      autoPromote: false,
      deploymentStrategy: 'canary',
    },
    approval: {
      required: true,
      requiredApprovers: 1,
      roles: ['Architect'],
    },
    source: 'uat',
    purpose: 'Production-like rehearsal',
  },
  preprod: {
    id: 'preprod',
    displayName: 'PREPROD',
    ci: {
      behavior: 'verification',
      buildAllowed: false,
      testsAllowed: false,
    },
    cd: {
      enabled: true,
      autoPromote: false,
      deploymentStrategy: 'canary',
    },
    approval: {
      required: true,
      requiredApprovers: 2,
      roles: ['Architect', 'CTO'],
    },
    source: 'staging',
    purpose: 'Final risk elimination',
  },
  prod: {
    id: 'prod',
    displayName: 'PROD',
    ci: {
      behavior: 'verification',
      buildAllowed: false,
      testsAllowed: false,
    },
    cd: {
      enabled: true,
      autoPromote: false,
      deploymentStrategy: 'blue-green',
    },
    approval: {
      required: true,
      requiredApprovers: 3,
      roles: ['Platform Owner', 'Security Head', 'CTO'],
    },
    source: 'preprod',
    purpose: 'Serve live users',
  },
};

// ============================================
// D. RBAC MATRIX (LOCKED)
// Role-based UI Action Enablement
// ============================================

export type RBACRole = 
  | 'Tech Lead'
  | 'QA Lead'
  | 'Architect'
  | 'Platform Owner'
  | 'Security Head'
  | 'CTO';

export type RBACAction = 
  | 'view-ci'
  | 'view-cd'
  | 'approve'
  | 'deploy'
  | 'rollback'
  | 'break-glass';

// Map database roles to OPZENIX RBAC roles
export const DB_ROLE_TO_OPZENIX: Record<string, RBACRole[]> = {
  admin: ['CTO', 'Platform Owner', 'Architect', 'Tech Lead'],
  operator: ['Tech Lead', 'QA Lead'],
  viewer: [],
};

// Environment access matrix per role
export const RBAC_ENVIRONMENT_ACCESS: Record<RBACRole, EnvironmentId[]> = {
  'Tech Lead': ['dev'],
  'QA Lead': ['uat'],
  'Architect': ['staging', 'preprod'],
  'Platform Owner': ['prod'],
  'Security Head': ['prod'],
  'CTO': ['dev', 'uat', 'staging', 'preprod', 'prod'], // Super Admin
};

// Action permissions per role per environment
export interface ActionPermission {
  allowed: boolean;
  reason?: string;
}

export const RBAC_ACTION_MATRIX: Record<RBACRole, Record<RBACAction, EnvironmentId[] | boolean>> = {
  'Tech Lead': {
    'view-ci': ['dev', 'uat', 'staging', 'preprod', 'prod'], // Can view all
    'view-cd': ['dev'],
    'approve': ['dev'],
    'deploy': ['dev'],
    'rollback': false,
    'break-glass': false,
  },
  'QA Lead': {
    'view-ci': ['dev', 'uat', 'staging', 'preprod', 'prod'],
    'view-cd': ['uat'],
    'approve': ['uat'],
    'deploy': false,
    'rollback': false,
    'break-glass': false,
  },
  'Architect': {
    'view-ci': ['dev', 'uat', 'staging', 'preprod', 'prod'],
    'view-cd': ['staging', 'preprod'],
    'approve': ['staging', 'preprod'],
    'deploy': false,
    'rollback': false,
    'break-glass': false,
  },
  'Platform Owner': {
    'view-ci': ['dev', 'uat', 'staging', 'preprod', 'prod'],
    'view-cd': ['prod'],
    'approve': ['prod'],
    'deploy': ['prod'],
    'rollback': ['prod'],
    'break-glass': false,
  },
  'Security Head': {
    'view-ci': ['dev', 'uat', 'staging', 'preprod', 'prod'],
    'view-cd': ['prod'],
    'approve': ['prod'],
    'deploy': false,
    'rollback': false,
    'break-glass': false,
  },
  'CTO': {
    'view-ci': ['dev', 'uat', 'staging', 'preprod', 'prod'],
    'view-cd': ['dev', 'uat', 'staging', 'preprod', 'prod'],
    'approve': ['dev', 'uat', 'staging', 'preprod', 'prod'],
    'deploy': ['prod'],
    'rollback': ['prod'],
    'break-glass': true, // Only CTO
  },
};

// ============================================
// E. PROMOTION RULES (LOCKED)
// ============================================

export interface PromotionRule {
  from: EnvironmentId | 'main';
  to: EnvironmentId;
  requiresApproval: boolean;
  requiredApprovers: number;
  artifactMustMatch: boolean; // SHA must be identical
  noRebuild: boolean; // No rebuilds allowed
}

export const PROMOTION_RULES: PromotionRule[] = [
  { from: 'main', to: 'dev', requiresApproval: false, requiredApprovers: 0, artifactMustMatch: true, noRebuild: true },
  { from: 'dev', to: 'uat', requiresApproval: true, requiredApprovers: 1, artifactMustMatch: true, noRebuild: true },
  { from: 'uat', to: 'staging', requiresApproval: true, requiredApprovers: 1, artifactMustMatch: true, noRebuild: true },
  { from: 'staging', to: 'preprod', requiresApproval: true, requiredApprovers: 2, artifactMustMatch: true, noRebuild: true },
  { from: 'preprod', to: 'prod', requiresApproval: true, requiredApprovers: 3, artifactMustMatch: true, noRebuild: true },
];

// Get next environment in promotion path
export const getNextEnvironment = (current: EnvironmentId): EnvironmentId | null => {
  const currentIndex = ENVIRONMENT_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex >= ENVIRONMENT_ORDER.length - 1) {
    return null;
  }
  return ENVIRONMENT_ORDER[currentIndex + 1];
};

// Get previous environment in promotion path
export const getPreviousEnvironment = (current: EnvironmentId): EnvironmentId | null => {
  const currentIndex = ENVIRONMENT_ORDER.indexOf(current);
  if (currentIndex <= 0) {
    return null;
  }
  return ENVIRONMENT_ORDER[currentIndex - 1];
};

// Check if promotion is allowed from one env to another
export const canPromote = (from: EnvironmentId, to: EnvironmentId): { allowed: boolean; reason: string } => {
  const fromIndex = ENVIRONMENT_ORDER.indexOf(from);
  const toIndex = ENVIRONMENT_ORDER.indexOf(to);
  
  if (fromIndex === -1 || toIndex === -1) {
    return { allowed: false, reason: 'Invalid environment' };
  }
  
  if (toIndex !== fromIndex + 1) {
    return { allowed: false, reason: 'Cannot skip environments. Promotion must follow: DEV → UAT → STAGING → PREPROD → PROD' };
  }
  
  return { allowed: true, reason: 'Promotion allowed' };
};

// ============================================
// F. AUDIT FIELDS (MANDATORY)
// ============================================

export const MANDATORY_AUDIT_FIELDS = [
  'user_id',
  'email',
  'role',
  'environment',
  'action',
  'artifact_sha',
  'timestamp',
  'comment',
  'policy_ref',
] as const;

export type AuditField = typeof MANDATORY_AUDIT_FIELDS[number];

export interface AuditRecord {
  user_id: string;
  email: string;
  role: RBACRole;
  environment: EnvironmentId;
  action: string;
  artifact_sha: string;
  timestamp: string;
  comment: string;
  policy_ref: string;
  immutable: boolean;
}

// ============================================
// G. NODE STATES & COLORS (LOCKED)
// ============================================

export type NodeState = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'LOCKED';

export const NODE_STATE_COLORS: Record<NodeState, { border: string; fill: string; animation: string }> = {
  PENDING: { border: '#6B7280', fill: '#0F172A', animation: 'none' },
  RUNNING: { border: '#3B82F6', fill: '#020617', animation: 'pulse' },
  PASSED: { border: '#22C55E', fill: '#020617', animation: 'glow' },
  FAILED: { border: '#EF4444', fill: '#020617', animation: 'shake' },
  BLOCKED: { border: '#F59E0B', fill: '#020617', animation: 'none' },
  LOCKED: { border: '#334155', fill: '#020617', animation: 'none' },
};

// Immutable states cannot transition
export const IMMUTABLE_STATES: NodeState[] = ['PASSED', 'FAILED', 'BLOCKED', 'LOCKED'];

export const isImmutableState = (state: NodeState): boolean => {
  return IMMUTABLE_STATES.includes(state);
};

// ============================================
// H. VERSION & METADATA
// ============================================

export const OPZENIX_VERSION = 'MVP 1.0.0';
export const OPZENIX_STATUS = 'LOCKED';
export const OPZENIX_SPEC_DATE = '2026-01-14';
