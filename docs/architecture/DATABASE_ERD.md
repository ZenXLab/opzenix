# Opzenix Platform - Database ERD (Entity Relationship Diagram)

> **Version:** 1.0.0  
> **Database:** PostgreSQL (Lovable Cloud)  
> **Total Tables:** 27

---

## Visual ERD Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    OPZENIX DATABASE SCHEMA                                           │
│                                    Entity Relationship Diagram                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                      USER & AUTHENTICATION DOMAIN                                      ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════╝

    ┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
    │    auth.users       │         │     profiles        │         │    user_roles       │
    │    (Supabase)       │         │                     │         │                     │
    ├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤
    │ PK id: uuid         │◄────────┤ PK id: uuid (FK)    │         │ PK id: uuid         │
    │    email            │         │    full_name        │         │ FK user_id: uuid ───┼──────┐
    │    created_at       │         │    email            │         │    role: app_role   │      │
    └─────────────────────┘         │    avatar_url       │         │    created_at       │      │
              │                     │    github_username  │         └─────────────────────┘      │
              │                     │    company          │                                      │
              │                     │    job_title        │                                      │
              │                     │    timezone         │                                      │
              │                     └─────────────────────┘                                      │
              │                               │                                                  │
              │                               │                                                  │
              ▼                               ▼                                                  │
    ┌─────────────────────┐         ┌─────────────────────┐                                      │
    │  user_preferences   │         │  dashboard_layouts  │                                      │
    ├─────────────────────┤         ├─────────────────────┤                                      │
    │ PK user_id: uuid ───┼─────────┤ PK id: uuid         │                                      │
    │    default_mode     │         │ FK user_id: uuid ───┼──────────────────────────────────────┘
    │    onboarding_state │         │    name             │
    │    ui_preferences   │         │    layout: jsonb    │
    └─────────────────────┘         │    is_default       │
                                    └─────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                      ORGANIZATION & PROJECT DOMAIN                                     ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════╝

    ┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
    │   organizations     │◄────────┤organization_members │         │      projects       │
    ├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤
    │ PK id: uuid         │         │ PK id: uuid         │         │ PK id: uuid         │
    │ FK owner_id: uuid   │         │ FK organization_id  │◄────────┤ FK organization_id  │
    │    name             │         │ FK user_id: uuid    │         │ FK owner_id: uuid   │
    │    slug             │         │    role             │         │    name             │
    │    description      │         │    created_at       │         │    description      │
    │    avatar_url       │         └─────────────────────┘         │    github_repo_url  │
    │    github_org_name  │                                         │    github_repo_name │
    └─────────────────────┘                                         │    default_branch   │
                                                                    │    detected_lang    │
                                                                    │    detected_fw      │
                                                                    └─────────────────────┘
                                                                              │
                                                                              ▼
                                                                    ┌─────────────────────┐
                                                                    │ deployment_versions │
                                                                    ├─────────────────────┤
                                                                    │ PK id: uuid         │
                                                                    │ FK project_id       │
                                                                    │ FK deployment_id    │
                                                                    │    version_tag      │
                                                                    │    commit_sha       │
                                                                    │    branch           │
                                                                    │    environment      │
                                                                    │    is_current       │
                                                                    └─────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                      PIPELINE & EXECUTION DOMAIN                                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════╝

    ┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
    │   flow_templates    │◄────────┤     executions      │────────►│  execution_nodes    │
    ├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤
    │ PK id: uuid         │         │ PK id: uuid         │         │ PK id: uuid         │
    │ FK created_by: uuid │         │ FK flow_template_id │         │ FK execution_id     │
    │    name             │         │ FK started_by: uuid │         │    node_id          │
    │    description      │         │    name             │         │    status           │
    │    type: flow_type  │         │    status           │         │    started_at       │
    │    nodes: jsonb     │         │    environment      │         │    completed_at     │
    │    edges: jsonb     │         │    progress         │         │    duration_ms      │
    └─────────────────────┘         │    branch           │         │    logs: text[]     │
                                    │    commit_hash      │         │    metadata: jsonb  │
                                    │    governance_status│         └─────────────────────┘
    ┌─────────────────────┐         │    blocked_reason   │
    │ pipeline_templates  │         └─────────────────────┘
    ├─────────────────────┤                   │
    │ PK id: uuid         │                   │
    │ FK created_by: uuid │         ┌─────────┼─────────┬─────────────────┐
    │    name             │         ▼         ▼         ▼                 ▼
    │    category         │ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
    │    description      │ │checkpoints│ │exec_logs  │ │exec_state │ │approval   │
    │    nodes: jsonb     │ ├───────────┤ ├───────────┤ │_events    │ │_requests  │
    │    edges: jsonb     │ │PK id      │ │PK id      │ ├───────────┤ ├───────────┤
    │    stages           │ │FK exec_id │ │FK exec_id │ │PK id      │ │PK id      │
    │    tags: text[]     │ │   node_id │ │   node_id │ │FK exec_id │ │FK exec_id │
    │    popularity       │ │   name    │ │   level   │ │   node_id │ │   node_id │
    │    is_public        │ │   state   │ │   message │ │   old_st  │ │   title   │
    └─────────────────────┘ └───────────┘ └───────────┘ │   new_st  │ │   status  │
                                                        │   reason  │ │   req_appr│
                                                        └───────────┘ └───────────┘
                                                                            │
                                                                            ▼
                                                                    ┌───────────────┐
                                                                    │approval_votes │
                                                                    ├───────────────┤
                                                                    │PK id          │
                                                                    │FK approval_id │
                                                                    │FK user_id     │
                                                                    │   vote: bool  │
                                                                    │   comment     │
                                                                    └───────────────┘

╔═══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                      DEPLOYMENT & ARTIFACTS DOMAIN                                     ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════╝

    ┌─────────────────────┐         ┌─────────────────────┐
    │    deployments      │◄────────┤     artifacts       │
    ├─────────────────────┤         ├─────────────────────┤
    │ PK id: uuid         │         │ PK id: uuid         │
    │ FK execution_id     │         │ FK execution_id     │
    │ FK deployed_by      │         │ FK created_by: uuid │
    │ FK rollback_to (self)│        │    name             │
    │    environment      │         │    type             │
    │    version          │         │    image_digest     │
    │    status           │         │    image_tag        │
    │    notes            │         │    registry_url     │
    │    incident_id      │         │    size_bytes       │
    │    deployed_at      │         │    build_duration   │
    └─────────────────────┘         │    metadata: jsonb  │
                                    └─────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                      CONNECTIONS & INTEGRATIONS DOMAIN                                 ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════╝

    ┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
    │    connections      │────────►│connection_health    │         │ github_integrations │
    ├─────────────────────┤         │    _events          │         ├─────────────────────┤
    │ PK id: uuid         │         ├─────────────────────┤         │ PK id: uuid         │
    │ FK user_id: uuid    │         │ PK id: uuid         │         │ FK user_id: uuid    │
    │    name             │         │ FK connection_id    │         │    repository_owner │
    │    type             │         │    status           │         │    repository_name  │
    │    connection_type  │         │    response_time_ms │         │    default_branch   │
    │    status           │         │    message          │         │    workflow_file    │
    │    config: jsonb    │         │    details: jsonb   │         │    webhook_secret   │
    │    validated        │         │    checked_at       │         └─────────────────────┘
    │    blocked          │         └─────────────────────┘                   │
    │    resource_status  │                                                   ▼
    │    health_interval  │                                         ┌─────────────────────┐
    └─────────────────────┘                                         │  branch_mappings    │
                                                                    ├─────────────────────┤
    ┌─────────────────────┐                                         │ PK id: uuid         │
    │   github_tokens     │                                         │ FK github_integ_id  │
    ├─────────────────────┤                                         │ FK created_by: uuid │
    │ PK id: uuid         │                                         │    branch_pattern   │
    │ FK user_id: uuid    │                                         │    environment      │
    │    encrypted_token  │                                         │    is_deployable    │
    │    token_type       │                                         └─────────────────────┘
    │    scopes: text[]   │
    │    expires_at       │
    │    is_valid         │
    └─────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                      ENVIRONMENT & CONFIG DOMAIN                                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════╝

    ┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
    │ environment_configs │         │  environment_locks  │         │  secret_references  │
    ├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤
    │ PK id: uuid         │         │ PK id: uuid         │         │ PK id: uuid         │
    │ FK created_by: uuid │         │ FK unlocked_by: uuid│         │    ref_key          │
    │    name             │         │    environment      │         │    provider         │
    │    environment      │         │    is_locked        │         │    scope            │
    │    variables: jsonb │         │    lock_reason      │         │    description      │
    │    secrets_ref      │         │    required_role    │         │    created_at       │
    │    is_active        │         │    requires_approval│         └─────────────────────┘
    └─────────────────────┘         │    unlocked_at      │
                                    └─────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                      TELEMETRY & AUDIT DOMAIN                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════╝

    ┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
    │  telemetry_signals  │         │     audit_logs      │         │ notification_events │
    ├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤
    │ PK id: uuid         │         │ PK id: uuid         │         │ PK id: uuid         │
    │ FK execution_id     │         │ FK user_id: uuid    │         │    type             │
    │ FK flow_id          │         │    action           │         │    target           │
    │ FK checkpoint_id    │         │    resource_type    │         │    payload: jsonb   │
    │    signal_type      │         │    resource_id      │         │    status           │
    │    otel_trace_id    │         │    details: jsonb   │         │    read_at          │
    │    otel_span_id     │         │    ip_address       │         │    created_at       │
    │    otel_parent_span │         │    created_at       │         └─────────────────────┘
    │    node_id          │         └─────────────────────┘
    │    environment      │
    │    severity         │         ┌─────────────────────┐
    │    status_code      │         │   widget_metrics    │
    │    duration_ms      │         ├─────────────────────┤
    │    payload: jsonb   │         │ PK id: uuid         │
    │    span_attributes  │         │    widget_type      │
    │    resource_attrs   │         │    metric_name      │
    └─────────────────────┘         │    metric_value     │
                                    │    metadata: jsonb  │
                                    │    recorded_at      │
                                    └─────────────────────┘
```

---

## Relationship Summary

### Foreign Key Relationships

| Child Table | Column | Parent Table | Parent Column | On Delete |
|-------------|--------|--------------|---------------|-----------|
| `profiles` | `id` | `auth.users` | `id` | CASCADE |
| `user_roles` | `user_id` | `auth.users` | `id` | - |
| `user_preferences` | `user_id` | `auth.users` | `id` | - |
| `dashboard_layouts` | `user_id` | `auth.users` | `id` | - |
| `organizations` | `owner_id` | `auth.users` | `id` | - |
| `organization_members` | `organization_id` | `organizations` | `id` | - |
| `organization_members` | `user_id` | `auth.users` | `id` | - |
| `projects` | `organization_id` | `organizations` | `id` | - |
| `projects` | `owner_id` | `auth.users` | `id` | - |
| `deployment_versions` | `project_id` | `projects` | `id` | - |
| `deployment_versions` | `deployment_id` | `deployments` | `id` | - |
| `executions` | `flow_template_id` | `flow_templates` | `id` | - |
| `execution_nodes` | `execution_id` | `executions` | `id` | - |
| `execution_logs` | `execution_id` | `executions` | `id` | - |
| `execution_state_events` | `execution_id` | `executions` | `id` | - |
| `checkpoints` | `execution_id` | `executions` | `id` | - |
| `approval_requests` | `execution_id` | `executions` | `id` | - |
| `approval_votes` | `approval_request_id` | `approval_requests` | `id` | - |
| `deployments` | `execution_id` | `executions` | `id` | - |
| `deployments` | `rollback_to` | `deployments` | `id` | - |
| `artifacts` | `execution_id` | `executions` | `id` | - |
| `connection_health_events` | `connection_id` | `connections` | `id` | - |
| `branch_mappings` | `github_integration_id` | `github_integrations` | `id` | - |
| `telemetry_signals` | `execution_id` | `executions` | `id` | - |
| `telemetry_signals` | `flow_id` | `flow_templates` | `id` | - |
| `telemetry_signals` | `checkpoint_id` | `checkpoints` | `id` | - |

---

## Domain Groupings

### 1. User Domain (4 tables)
- `profiles` - User profile information
- `user_roles` - RBAC role assignments
- `user_preferences` - UI and app preferences
- `dashboard_layouts` - Custom dashboard configurations

### 2. Organization Domain (3 tables)
- `organizations` - Organization entities
- `organization_members` - Membership and roles
- `projects` - Project definitions

### 3. Pipeline Domain (3 tables)
- `flow_templates` - Saved pipeline configurations
- `pipeline_templates` - Template library
- `deployment_versions` - Version tracking

### 4. Execution Domain (5 tables)
- `executions` - Pipeline runs
- `execution_nodes` - Node-level status
- `execution_logs` - Detailed logs
- `execution_state_events` - State transitions
- `checkpoints` - State snapshots

### 5. Governance Domain (3 tables)
- `approval_requests` - Pending approvals
- `approval_votes` - Vote records
- `environment_locks` - Environment protection

### 6. Deployment Domain (2 tables)
- `deployments` - Deployment records
- `artifacts` - Build artifacts

### 7. Integration Domain (5 tables)
- `connections` - External connections
- `connection_health_events` - Health checks
- `github_integrations` - GitHub repos
- `github_tokens` - Encrypted tokens
- `branch_mappings` - Branch rules

### 8. Configuration Domain (2 tables)
- `environment_configs` - Environment variables
- `secret_references` - Vault references

### 9. Observability Domain (4 tables)
- `telemetry_signals` - OpenTelemetry data
- `audit_logs` - Audit trail
- `notification_events` - User notifications
- `widget_metrics` - Dashboard metrics

---

## Indexes

### Primary Keys
All tables use `uuid` primary keys with `gen_random_uuid()` default.

### Unique Constraints
| Table | Columns |
|-------|---------|
| `user_roles` | `(user_id, role)` |
| `organizations` | `slug` |
| `user_preferences` | `user_id` |

### Recommended Indexes
```sql
-- Execution queries
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_environment ON executions(environment);
CREATE INDEX idx_execution_nodes_execution_id ON execution_nodes(execution_id);

-- Telemetry queries
CREATE INDEX idx_telemetry_execution_id ON telemetry_signals(execution_id);
CREATE INDEX idx_telemetry_created_at ON telemetry_signals(created_at);
CREATE INDEX idx_telemetry_signal_type ON telemetry_signals(signal_type);

-- Audit queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## Enums

```sql
-- User roles
CREATE TYPE app_role AS ENUM ('admin', 'operator', 'viewer');

-- Approval status
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Execution status
CREATE TYPE execution_status AS ENUM (
  'idle', 'running', 'success', 'warning', 'failed', 'paused'
);

-- Flow types
CREATE TYPE flow_type AS ENUM (
  'cicd', 'mlops', 'llmops', 'infrastructure', 'security'
);
```

---

*Database ERD - Opzenix Platform MVP 1.0.0*
