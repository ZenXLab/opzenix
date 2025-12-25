# Opzenix Platform - MVP 1.0.0 Architecture Documentation

> **Version:** 1.0.0  
> **Last Updated:** December 2024  
> **Platform:** Enterprise CI/CD Control Tower

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Edge Functions](#edge-functions)
6. [Storage Buckets](#storage-buckets)
7. [AI Integration](#ai-integration)
8. [Real-time Features](#real-time-features)

---

## System Overview

Opzenix is an enterprise-grade CI/CD control tower platform that provides:

- **Visual Pipeline Builder** - Drag-and-drop pipeline configuration
- **Execution Flow Management** - Real-time pipeline execution monitoring
- **Governance & Approvals** - Multi-level approval workflows
- **Environment Management** - Dev/Staging/PreProd/Prod environment controls
- **Checkpoint & Rollback** - State preservation and recovery
- **Telemetry & Analytics** - OpenTelemetry integration for observability
- **GitHub Integration** - Repository and workflow connectivity
- **Role-Based Access Control** - Admin/Operator/Viewer roles

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OPZENIX PLATFORM                                │
│                              MVP 1.0.0 Architecture                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                 FRONTEND LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   React     │  │  React Flow │  │   Recharts  │  │   Framer    │        │
│  │   18.3.1    │  │   (xyflow)  │  │   Charts    │  │   Motion    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Tailwind   │  │  shadcn/ui  │  │   Zustand   │  │ React Query │        │
│  │    CSS      │  │ Components  │  │   State     │  │   v5.x      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY LAYER                               │
│                          (Lovable Cloud / Supabase)                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         REST API + Realtime                          │    │
│  │              PostgREST Auto-generated API + WebSocket               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌───────────────────────┐ ┌───────────────────┐ ┌───────────────────────┐
│    EDGE FUNCTIONS     │ │    DATABASE       │ │      STORAGE          │
│    (Deno Runtime)     │ │   (PostgreSQL)    │ │    (S3 Compatible)    │
│                       │ │                   │ │                       │
│ • ai-insights         │ │ • 27 Tables       │ │ • avatars bucket      │
│ • ai-telemetry        │ │ • RLS Policies    │ │   (public)            │
│ • github-webhook      │ │ • Realtime        │ │                       │
│ • pipeline-execute    │ │ • Triggers        │ │                       │
│ • rollback-deployment │ │ • Functions       │ │                       │
│ • + 15 more           │ │                   │ │                       │
└───────────────────────┘ └───────────────────┘ └───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL INTEGRATIONS                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   GitHub    │  │   Lovable   │  │  ElevenLabs │  │    Azure    │        │
│  │    API      │  │     AI      │  │    TTS      │  │   DevOps    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | Latest | Type Safety |
| Vite | Latest | Build Tool & Dev Server |
| Tailwind CSS | Latest | Utility-First CSS |
| shadcn/ui | Latest | Component Library |
| @xyflow/react | 12.10.0 | Pipeline Flow Visualization |
| Framer Motion | 12.23.26 | Animations |
| Recharts | 2.15.4 | Data Visualization |
| Zustand | 5.0.9 | State Management |
| TanStack React Query | 5.83.0 | Server State Management |
| React Router DOM | 6.30.1 | Client-Side Routing |
| React Hook Form | 7.61.1 | Form Management |
| Zod | 3.25.76 | Schema Validation |

### Backend (Lovable Cloud)

| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary Database |
| PostgREST | Auto-generated REST API |
| Realtime | WebSocket Subscriptions |
| Edge Functions (Deno) | Serverless Functions |
| Row Level Security | Data Access Control |
| Storage | File Management |

### AI & Integrations

| Service | Purpose |
|---------|---------|
| Lovable AI Gateway | AI-powered insights & analysis |
| ElevenLabs | Text-to-Speech capabilities |
| GitHub API | Repository & workflow integration |
| Azure DevOps | Cloud infrastructure validation |

---

## Database Schema

### Core Tables (27 Total)

#### Execution & Pipeline Management

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `executions` | Pipeline execution records | id, name, status, environment, progress, started_at |
| `execution_nodes` | Individual node execution status | execution_id, node_id, status, duration_ms, logs |
| `execution_logs` | Detailed execution logs | execution_id, node_id, level, message |
| `execution_state_events` | State transition history | execution_id, old_state, new_state, reason |
| `flow_templates` | Saved pipeline configurations | name, type, nodes (JSONB), edges (JSONB) |
| `pipeline_templates` | Template library | category, nodes, edges, popularity, tags |

#### Governance & Approvals

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `approval_requests` | Pending approvals | execution_id, node_id, status, required_approvals |
| `approval_votes` | Individual votes | approval_request_id, user_id, vote, comment |
| `environment_locks` | Environment protection | environment, is_locked, required_role, lock_reason |

#### Deployments & Versioning

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `deployments` | Deployment records | environment, version, status, deployed_by |
| `deployment_versions` | Version history | project_id, version_tag, commit_sha, is_current |
| `checkpoints` | State snapshots | execution_id, node_id, name, state (JSONB) |

#### Connections & Integrations

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `connections` | External service connections | type, name, status, config, validated |
| `connection_health_events` | Health check history | connection_id, status, response_time_ms |
| `github_integrations` | GitHub repo settings | repository_owner, repository_name, workflow_file |
| `github_tokens` | Encrypted GitHub tokens | user_id, encrypted_token, scopes |
| `branch_mappings` | Branch-to-environment rules | branch_pattern, environment, is_deployable |

#### Telemetry & Observability

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `telemetry_signals` | OpenTelemetry data | signal_type, otel_trace_id, otel_span_id, payload |
| `audit_logs` | User action audit trail | action, resource_type, user_id, details |
| `widget_metrics` | Dashboard metrics | widget_type, metric_name, metric_value |

#### User & Organization

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User profiles | id (auth ref), full_name, email, avatar_url |
| `user_roles` | RBAC roles | user_id, role (admin/operator/viewer) |
| `user_preferences` | UI preferences | user_id, default_mode, ui_preferences |
| `organizations` | Organization entities | name, slug, owner_id |
| `organization_members` | Org membership | organization_id, user_id, role |
| `projects` | Project definitions | name, github_repo_url, organization_id |

#### Configuration

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `environment_configs` | Environment variables | environment, variables (JSONB), secrets_ref |
| `secret_references` | Vault secret refs | ref_key, provider, scope |
| `artifacts` | Build artifacts | name, image_digest, registry_url, execution_id |
| `dashboard_layouts` | Custom dashboard layouts | user_id, layout (JSONB), is_default |
| `notification_events` | User notifications | type, target, payload, read_at |

### Database Enums

```sql
app_role: 'admin' | 'operator' | 'viewer'
approval_status: 'pending' | 'approved' | 'rejected'
execution_status: 'idle' | 'running' | 'success' | 'warning' | 'failed' | 'paused'
flow_type: 'cicd' | 'mlops' | 'llmops' | 'infrastructure' | 'security'
```

### Database Functions

| Function | Purpose |
|----------|---------|
| `handle_new_user()` | Auto-create profile & role on signup |
| `update_updated_at_column()` | Auto-update timestamps |
| `has_role(user_id, role)` | Check user role |
| `has_any_role(user_id)` | Check if user has any role |

---

## Edge Functions

### 20 Deployed Edge Functions

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `ai-insights` | AI-powered pipeline insights | Yes |
| `ai-telemetry-analysis` | AI analysis of telemetry data | No |
| `aks-validate` | Azure Kubernetes validation | No |
| `artifact-webhook` | Container registry webhooks | No |
| `azure-validate` | Azure resource validation | No |
| `connection-health-check` | Validate connection status | No |
| `create-environment` | Provision new environment | No |
| `create-test-execution` | Create test pipeline run | No |
| `elevenlabs-tts` | Text-to-Speech conversion | No |
| `execution-cancel` | Cancel running execution | No |
| `explain-config` | AI config explanation | Yes |
| `fetch-node-logs` | Retrieve node execution logs | No |
| `github-api` | GitHub API proxy | No |
| `github-validate-connection` | Validate GitHub connection | No |
| `github-webhook` | Handle GitHub webhooks | No |
| `notify-event` | Send notifications | No |
| `otel-adapter` | OpenTelemetry data ingestion | No |
| `pipeline-execute` | Execute pipeline simulation | No |
| `rerun-from-checkpoint` | Resume from checkpoint | No |
| `rollback-deployment` | Rollback to previous version | No |
| `trigger-github-workflow` | Trigger GitHub Actions | No |
| `update-environment-config` | Update env configuration | No |
| `validate-otel` | Validate OTEL connection | No |
| `validate-registry` | Validate container registry | No |

---

## Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `avatars` | Yes | User profile avatars |

---

## AI Integration

### Lovable AI Gateway

- **Endpoint:** `https://ai.gateway.lovable.dev/v1/chat/completions`
- **Models Available:**
  - `google/gemini-2.5-flash` (Default)
  - `google/gemini-2.5-pro`
  - `openai/gpt-5`
  - `openai/gpt-5-mini`

### AI-Powered Features

1. **Pipeline Insights** (`ai-insights`)
   - Analyzes execution patterns
   - Provides optimization recommendations

2. **Telemetry Analysis** (`ai-telemetry-analysis`)
   - Anomaly detection
   - Performance trend analysis

3. **Config Explanation** (`explain-config`)
   - Natural language explanation of configurations
   - Best practice recommendations

---

## Real-time Features

### Realtime Subscriptions

```typescript
// Execution status updates
supabase.channel('executions-changes')
  .on('postgres_changes', { table: 'executions' }, callback)

// Approval notifications  
supabase.channel('approvals-changes')
  .on('postgres_changes', { table: 'approval_requests' }, callback)

// Telemetry streaming
supabase.channel('telemetry-signals')
  .on('postgres_changes', { table: 'telemetry_signals' }, callback)
```

### Real-time Hooks

| Hook | Purpose |
|------|---------|
| `useRealtimeUpdates` | Execution & approval updates |
| `useControlTowerRealtime` | Control tower data sync |
| `useSystemHealth` | System health metrics |
| `useExecutionRealtime` | Pipeline execution status |
| `useNodeStatusRealtime` | Individual node updates |
| `useDeploymentsRealtime` | Deployment status |
| `useAuditLogsRealtime` | Audit log streaming |

---

## Security Model

### Row Level Security (RLS)

All tables have RLS enabled with policies based on:

- **User ownership** (`user_id = auth.uid()`)
- **Role-based access** (`has_role(auth.uid(), 'admin')`)
- **Organization membership**
- **Public read access** (for templates, configs)

### Authentication

- Email/Password authentication
- Auto-confirm enabled for development
- Profile auto-creation on signup
- Default role: `viewer`

---

## Project Structure

```
opzenix/
├── src/
│   ├── components/
│   │   ├── control-tower/     # Control tower UI
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── demo/              # Interactive demos
│   │   ├── execution/         # Execution management
│   │   ├── flow/              # React Flow components
│   │   ├── governance/        # Approval workflows
│   │   ├── landing/           # Marketing pages
│   │   ├── pipeline/          # Pipeline builder
│   │   └── ui/                # shadcn components
│   ├── hooks/                 # Custom React hooks
│   ├── pages/                 # Route pages
│   ├── stores/                # Zustand stores
│   └── integrations/          # Backend clients
├── supabase/
│   ├── functions/             # Edge functions
│   └── config.toml            # Function config
└── docs/
    └── architecture/          # This documentation
```

---

## Deployment

- **Frontend:** Lovable Platform (Auto-deployed)
- **Backend:** Lovable Cloud (Supabase)
- **Edge Functions:** Auto-deployed with code changes
- **Database:** Managed PostgreSQL

---

*Document maintained by Opzenix Engineering Team*
