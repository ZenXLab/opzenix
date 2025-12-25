// ============================================
// OPZENIX DASHBOARD WIDGET TAXONOMY (MVP 1.0.0 LOCKED)
// ============================================

export type EnvironmentScope = 'dev' | 'uat' | 'staging' | 'preprod' | 'prod' | 'global';

export type WidgetCategory = 
  | 'platform-overview'
  | 'ci-visibility'
  | 'cd-deployment'
  | 'governance-audit'
  | 'observability';

export type WidgetClickAction = 
  | { type: 'NAVIGATE'; target: string }
  | { type: 'OPEN_FLOW'; target: string }
  | { type: 'OPEN_INSPECTOR'; target: string }
  | { type: 'NONE' };

export interface WidgetPermissions {
  draggable: boolean;
  resizable: boolean;
  removable: boolean;
  configurable: boolean;
}

export interface WidgetThreshold {
  id: string;
  name: string;
  value: number;
  unit: string;
  warningLevel: number;
  criticalLevel: number;
}

export interface WidgetConfig {
  refreshInterval: number; // seconds
  showTrend: boolean;
  thresholds: WidgetThreshold[];
  customMetrics: string[];
}

export interface OpzenixWidget {
  id: string;
  type: string;
  title: string;
  category: WidgetCategory;
  environment: EnvironmentScope;
  size: 'small' | 'medium' | 'large';
  permissions: WidgetPermissions;
  dataSource: string;
  clickAction: WidgetClickAction;
  order: number;
  isFixed?: boolean; // For audit widgets
  config?: WidgetConfig;
}

// ============================================
// WIDGET TAXONOMY DEFINITIONS
// ============================================

export const WIDGET_CATEGORIES: Record<WidgetCategory, { label: string; description: string; audience: string }> = {
  'platform-overview': {
    label: 'Platform Overview',
    description: 'Situational awareness',
    audience: 'All roles',
  },
  'ci-visibility': {
    label: 'CI Visibility',
    description: 'Build & quality visibility',
    audience: 'Developers, QA, Architects',
  },
  'cd-deployment': {
    label: 'CD & Deployment',
    description: 'Release confidence',
    audience: 'Architects, Platform, CTO',
  },
  'governance-audit': {
    label: 'Governance & Audit',
    description: 'Compliance & trust',
    audience: 'Platform, Security, CTO',
  },
  'observability': {
    label: 'Observability',
    description: 'Signal, not debugging',
    audience: 'Architects, Ops',
  },
};

export interface WidgetTypeDefinition {
  type: string;
  title: string;
  category: WidgetCategory;
  description: string;
  defaultSize: 'small' | 'medium' | 'large';
  isFixed?: boolean;
  icon: string;
  dataSource: string;
}

export const OPZENIX_WIDGET_TYPES: WidgetTypeDefinition[] = [
  // Platform Overview Widgets
  {
    type: 'environment-health',
    title: 'Environment Health',
    category: 'platform-overview',
    description: 'DEV/UAT/STAGING/PREPROD/PROD status with last deployment',
    defaultSize: 'medium',
    icon: 'Activity',
    dataSource: 'environment_configs',
  },
  {
    type: 'pipeline-status',
    title: 'Pipeline Status',
    category: 'platform-overview',
    description: 'Current CI/CD executions, pass/fail/pending',
    defaultSize: 'medium',
    icon: 'GitBranch',
    dataSource: 'executions',
  },
  {
    type: 'approval-queue',
    title: 'Approval Queue',
    category: 'platform-overview',
    description: 'Pending approvals with environment and role required',
    defaultSize: 'medium',
    icon: 'CheckCircle',
    dataSource: 'approval_requests',
  },

  // CI Widgets
  {
    type: 'ci-execution-summary',
    title: 'CI Execution Summary',
    category: 'ci-visibility',
    description: 'Latest runs, duration, pass/fail',
    defaultSize: 'medium',
    icon: 'Zap',
    dataSource: 'ci_evidence',
  },
  {
    type: 'test-coverage',
    title: 'Test Coverage',
    category: 'ci-visibility',
    description: 'Unit/Integration test coverage trend',
    defaultSize: 'small',
    icon: 'PieChart',
    dataSource: 'test_results',
  },
  {
    type: 'security-scan',
    title: 'Security Scan',
    category: 'ci-visibility',
    description: 'SAST/Dependency/Image scan severity summary',
    defaultSize: 'medium',
    icon: 'Shield',
    dataSource: 'vulnerability_scans',
  },

  // CD & Deployment Widgets
  {
    type: 'deployment-activity',
    title: 'Deployment Activity',
    category: 'cd-deployment',
    description: 'Environment, strategy, status',
    defaultSize: 'medium',
    icon: 'Rocket',
    dataSource: 'deployments',
  },
  {
    type: 'promotion-flow',
    title: 'Promotion Flow',
    category: 'cd-deployment',
    description: 'DEV → PROD readiness with blockers',
    defaultSize: 'large',
    icon: 'ArrowRight',
    dataSource: 'deployment_versions',
  },
  {
    type: 'rollback-readiness',
    title: 'Rollback Readiness',
    category: 'cd-deployment',
    description: 'Previous versions and rollback availability',
    defaultSize: 'small',
    icon: 'RotateCcw',
    dataSource: 'deployments',
  },

  // Governance & Audit Widgets
  {
    type: 'audit-trail',
    title: 'Audit Trail',
    category: 'governance-audit',
    description: 'Who did what, when - immutable entries',
    defaultSize: 'large',
    icon: 'FileText',
    isFixed: true,
    dataSource: 'audit_logs',
  },
  {
    type: 'policy-compliance',
    title: 'Policy Compliance',
    category: 'governance-audit',
    description: 'Policy passes/violations by environment',
    defaultSize: 'medium',
    isFixed: true,
    icon: 'Lock',
    dataSource: 'ci_evidence',
  },
  {
    type: 'rbac-visibility',
    title: 'RBAC Visibility',
    category: 'governance-audit',
    description: 'Current user role and allowed actions',
    defaultSize: 'small',
    icon: 'Users',
    dataSource: 'user_roles',
  },

  // Observability Widgets
  {
    type: 'runtime-health',
    title: 'Runtime Health',
    category: 'observability',
    description: 'Error rate and latency (high-level)',
    defaultSize: 'medium',
    icon: 'Activity',
    dataSource: 'telemetry_signals',
  },
  {
    type: 'slo-snapshot',
    title: 'SLO Snapshot',
    category: 'observability',
    description: 'Green/Amber/Red status indicators',
    defaultSize: 'small',
    icon: 'Target',
    dataSource: 'widget_metrics',
  },
];

// ============================================
// RBAC DRAG & DROP RULES (LOCKED)
// ============================================

export type RBACRole = 'TECH_LEAD' | 'QA_LEAD' | 'ARCHITECT' | 'PLATFORM_OWNER' | 'SECURITY_HEAD' | 'CTO';

export interface RBACDragDropPermissions {
  canReorder: boolean;
  canResize: boolean;
  canAddRemove: boolean;
  scope: EnvironmentScope[];
}

export const RBAC_DRAG_DROP_RULES: Record<RBACRole, RBACDragDropPermissions> = {
  TECH_LEAD: {
    canReorder: true,
    canResize: true,
    canAddRemove: false,
    scope: ['dev'],
  },
  QA_LEAD: {
    canReorder: false,
    canResize: false,
    canAddRemove: false,
    scope: [],
  },
  ARCHITECT: {
    canReorder: true,
    canResize: true,
    canAddRemove: false,
    scope: ['staging', 'preprod'],
  },
  PLATFORM_OWNER: {
    canReorder: false,
    canResize: false,
    canAddRemove: false,
    scope: ['prod'],
  },
  SECURITY_HEAD: {
    canReorder: false,
    canResize: false,
    canAddRemove: false,
    scope: ['prod'],
  },
  CTO: {
    canReorder: true,
    canResize: true,
    canAddRemove: false,
    scope: ['dev', 'uat', 'staging', 'preprod', 'prod', 'global'],
  },
};

// Default widget config
export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  refreshInterval: 30,
  showTrend: true,
  thresholds: [],
  customMetrics: [],
};
