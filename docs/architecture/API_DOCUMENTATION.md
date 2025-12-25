# Opzenix Platform - API Documentation

> **Version:** 1.0.0  
> **Base URL:** `https://qylqudusmwujpagpfrjg.supabase.co/functions/v1`  
> **Authentication:** Bearer Token (JWT) unless specified

---

## Table of Contents

1. [Authentication](#authentication)
2. [AI & Insights](#ai--insights)
3. [Pipeline Execution](#pipeline-execution)
4. [GitHub Integration](#github-integration)
5. [Environment Management](#environment-management)
6. [Connections & Health](#connections--health)
7. [Telemetry & Observability](#telemetry--observability)
8. [Deployment & Rollback](#deployment--rollback)
9. [Notifications](#notifications)

---

## Authentication

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Public Endpoints (No Auth Required)

The following endpoints do not require JWT authentication:
- `ai-telemetry-analysis`
- `aks-validate`
- `artifact-webhook`
- `azure-validate`
- `connection-health-check`
- `create-environment`
- `create-test-execution`
- `elevenlabs-tts`
- `execution-cancel`
- `fetch-node-logs`
- `github-api`
- `github-validate-connection`
- `github-webhook`
- `notify-event`
- `otel-adapter`
- `pipeline-execute`
- `rerun-from-checkpoint`
- `rollback-deployment`
- `trigger-github-workflow`
- `update-environment-config`
- `validate-otel`
- `validate-registry`

---

## AI & Insights

### POST `/ai-insights`

Generate AI-powered insights for pipeline executions.

**Authentication:** Required (JWT)

**Request:**
```json
{
  "execution_id": "uuid",
  "analysis_type": "performance" | "optimization" | "failure",
  "context": {
    "nodes": [...],
    "metrics": {...}
  }
}
```

**Response:**
```json
{
  "success": true,
  "insights": {
    "summary": "string",
    "recommendations": [
      {
        "type": "optimization",
        "priority": "high" | "medium" | "low",
        "title": "string",
        "description": "string",
        "impact": "string"
      }
    ],
    "metrics_analysis": {
      "bottlenecks": [...],
      "trends": [...]
    }
  }
}
```

**Error Response:**
```json
{
  "error": "string",
  "code": "RATE_LIMIT" | "INVALID_REQUEST" | "AI_ERROR"
}
```

---

### POST `/ai-telemetry-analysis`

Analyze telemetry data using AI for anomaly detection.

**Authentication:** Not Required

**Request:**
```json
{
  "signals": [
    {
      "signal_type": "trace" | "metric" | "log",
      "timestamp": "ISO8601",
      "payload": {...}
    }
  ],
  "time_range": {
    "start": "ISO8601",
    "end": "ISO8601"
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "anomalies": [
      {
        "severity": "critical" | "warning" | "info",
        "type": "latency_spike" | "error_rate" | "resource_exhaustion",
        "description": "string",
        "timestamp": "ISO8601",
        "affected_nodes": ["string"]
      }
    ],
    "trends": {
      "performance": "improving" | "degrading" | "stable",
      "error_rate": "number",
      "latency_p99": "number"
    },
    "recommendations": ["string"]
  }
}
```

---

### POST `/explain-config`

Get AI-powered explanation of infrastructure configurations.

**Authentication:** Required (JWT)

**Request:**
```json
{
  "config": "string (YAML/JSON/HCL content)",
  "configType": "kubernetes" | "terraform" | "docker" | "github-actions"
}
```

**Response:**
```json
{
  "explanation": "string (markdown formatted)"
}
```

---

## Pipeline Execution

### POST `/pipeline-execute`

Execute a pipeline with node definitions.

**Authentication:** Not Required

**Request:**
```json
{
  "execution_id": "uuid (optional, auto-generated)",
  "name": "string",
  "environment": "development" | "staging" | "preprod" | "production",
  "nodes": [
    {
      "id": "string",
      "type": "source" | "build" | "test" | "security" | "approval" | "checkpoint" | "deploy",
      "data": {
        "label": "string",
        "config": {...}
      },
      "position": { "x": 0, "y": 0 }
    }
  ],
  "edges": [
    {
      "id": "string",
      "source": "node_id",
      "target": "node_id"
    }
  ],
  "metadata": {
    "branch": "string",
    "commit_hash": "string",
    "triggered_by": "uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "execution": {
    "id": "uuid",
    "status": "running",
    "started_at": "ISO8601",
    "nodes_count": "number",
    "environment": "string"
  }
}
```

---

### POST `/trigger-github-workflow`

Trigger a GitHub Actions workflow or simulate pipeline execution.

**Authentication:** Not Required

**Request:**
```json
{
  "execution_id": "uuid",
  "nodes": [...],
  "edges": [...],
  "github_config": {
    "token": "string (optional)",
    "owner": "string",
    "repo": "string",
    "workflow_id": "string",
    "ref": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "mode": "github" | "simulation",
  "execution_id": "uuid",
  "workflow_run_id": "number (if github mode)"
}
```

---

### POST `/execution-cancel`

Cancel a running pipeline execution.

**Authentication:** Not Required

**Request:**
```json
{
  "execution_id": "uuid",
  "reason": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "execution_id": "uuid",
  "status": "cancelled",
  "cancelled_at": "ISO8601"
}
```

---

### POST `/rerun-from-checkpoint`

Resume execution from a saved checkpoint.

**Authentication:** Not Required

**Request:**
```json
{
  "checkpoint_id": "uuid",
  "execution_id": "uuid",
  "override_config": {...}
}
```

**Response:**
```json
{
  "success": true,
  "new_execution_id": "uuid",
  "resumed_from": {
    "checkpoint_id": "uuid",
    "node_id": "string",
    "checkpoint_name": "string"
  }
}
```

---

### GET `/fetch-node-logs`

Retrieve execution logs for a specific node.

**Authentication:** Not Required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| execution_id | uuid | Yes | Execution ID |
| node_id | string | Yes | Node ID |
| limit | number | No | Max logs (default: 100) |
| level | string | No | Filter by level |

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "timestamp": "ISO8601",
      "level": "info" | "warn" | "error" | "debug",
      "message": "string",
      "metadata": {...}
    }
  ],
  "total": "number",
  "node_status": "running" | "success" | "failed"
}
```

---

### POST `/create-test-execution`

Create a test execution for development/demo purposes.

**Authentication:** Not Required

**Request:**
```json
{
  "template": "basic" | "full" | "with-approval" | "with-failure",
  "environment": "string",
  "name": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "execution_id": "uuid",
  "name": "string",
  "nodes_created": "number"
}
```

---

## GitHub Integration

### POST `/github-webhook`

Handle incoming GitHub webhook events.

**Authentication:** Not Required (validates webhook signature)

**Headers:**
```http
X-GitHub-Event: push | pull_request | workflow_run
X-Hub-Signature-256: sha256=...
```

**Request:** GitHub webhook payload (varies by event type)

**Response:**
```json
{
  "success": true,
  "event_type": "string",
  "action_taken": "string",
  "execution_id": "uuid (if triggered)"
}
```

---

### POST `/github-validate-connection`

Validate GitHub connection and token.

**Authentication:** Not Required

**Request:**
```json
{
  "token": "string",
  "owner": "string",
  "repo": "string"
}
```

**Response:**
```json
{
  "valid": true,
  "repository": {
    "name": "string",
    "full_name": "string",
    "default_branch": "string",
    "private": "boolean"
  },
  "permissions": {
    "admin": "boolean",
    "push": "boolean",
    "pull": "boolean"
  },
  "rate_limit": {
    "remaining": "number",
    "reset_at": "ISO8601"
  }
}
```

**Error Response:**
```json
{
  "valid": false,
  "error": "string",
  "error_type": "INVALID_TOKEN" | "REPO_NOT_FOUND" | "INSUFFICIENT_PERMISSIONS"
}
```

---

### POST `/github-api`

Proxy requests to GitHub API.

**Authentication:** Not Required

**Request:**
```json
{
  "endpoint": "string (GitHub API path)",
  "method": "GET" | "POST" | "PUT" | "DELETE",
  "token": "string",
  "body": {...}
}
```

**Response:** Proxied GitHub API response

---

## Environment Management

### POST `/create-environment`

Create a new environment configuration.

**Authentication:** Not Required

**Request:**
```json
{
  "name": "string",
  "environment": "development" | "staging" | "preprod" | "production",
  "variables": {
    "KEY": "value"
  },
  "secrets_ref": "string (vault path)",
  "created_by": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "environment": {
    "id": "uuid",
    "name": "string",
    "environment": "string",
    "is_active": true,
    "created_at": "ISO8601"
  }
}
```

---

### POST `/update-environment-config`

Update an existing environment configuration.

**Authentication:** Not Required

**Request:**
```json
{
  "environment_id": "uuid",
  "updates": {
    "variables": {...},
    "secrets_ref": "string",
    "is_active": "boolean"
  }
}
```

**Response:**
```json
{
  "success": true,
  "environment": {
    "id": "uuid",
    "updated_at": "ISO8601"
  }
}
```

---

## Connections & Health

### POST `/connection-health-check`

Check the health status of a connection.

**Authentication:** Not Required

**Request:**
```json
{
  "connection_id": "uuid",
  "connection_type": "github" | "azure" | "kubernetes" | "registry" | "otel"
}
```

**Response:**
```json
{
  "healthy": true,
  "connection_id": "uuid",
  "response_time_ms": "number",
  "details": {
    "status": "connected" | "degraded" | "disconnected",
    "last_checked": "ISO8601",
    "message": "string"
  },
  "resources": {
    "cpu": "number",
    "memory": "number",
    "storage": "number"
  }
}
```

---

### POST `/azure-validate`

Validate Azure connection and resources.

**Authentication:** Not Required

**Request:**
```json
{
  "subscription_id": "string",
  "tenant_id": "string",
  "client_id": "string",
  "client_secret": "string",
  "resource_group": "string (optional)"
}
```

**Response:**
```json
{
  "valid": true,
  "subscription": {
    "id": "string",
    "name": "string",
    "state": "Enabled"
  },
  "resources": {
    "resource_groups": ["string"],
    "aks_clusters": ["string"],
    "container_registries": ["string"]
  }
}
```

---

### POST `/aks-validate`

Validate Azure Kubernetes Service cluster.

**Authentication:** Not Required

**Request:**
```json
{
  "cluster_name": "string",
  "resource_group": "string",
  "subscription_id": "string",
  "credentials": {...}
}
```

**Response:**
```json
{
  "valid": true,
  "cluster": {
    "name": "string",
    "kubernetes_version": "string",
    "node_count": "number",
    "status": "Running" | "Stopped"
  },
  "node_pools": [
    {
      "name": "string",
      "count": "number",
      "vm_size": "string"
    }
  ]
}
```

---

### POST `/validate-registry`

Validate container registry connection.

**Authentication:** Not Required

**Request:**
```json
{
  "registry_url": "string",
  "username": "string",
  "password": "string",
  "registry_type": "acr" | "ecr" | "gcr" | "dockerhub"
}
```

**Response:**
```json
{
  "valid": true,
  "registry": {
    "url": "string",
    "type": "string"
  },
  "repositories": ["string"],
  "quota": {
    "used": "number",
    "limit": "number"
  }
}
```

---

## Telemetry & Observability

### POST `/otel-adapter`

Ingest OpenTelemetry data.

**Authentication:** Not Required

**Request:**
```json
{
  "resource_spans": [...],
  "resource_metrics": [...],
  "resource_logs": [...]
}
```

**Response:**
```json
{
  "success": true,
  "ingested": {
    "spans": "number",
    "metrics": "number",
    "logs": "number"
  }
}
```

---

### POST `/validate-otel`

Validate OpenTelemetry endpoint configuration.

**Authentication:** Not Required

**Request:**
```json
{
  "endpoint": "string",
  "headers": {...},
  "protocol": "grpc" | "http"
}
```

**Response:**
```json
{
  "valid": true,
  "endpoint": {
    "url": "string",
    "protocol": "string",
    "responsive": true
  },
  "test_span_id": "string"
}
```

---

## Deployment & Rollback

### POST `/rollback-deployment`

Rollback to a previous deployment version.

**Authentication:** Not Required

**Request:**
```json
{
  "deployment_id": "uuid",
  "target_version": "uuid (deployment to rollback to)",
  "environment": "string",
  "reason": "string",
  "rollback_by": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "rollback": {
    "id": "uuid",
    "from_version": "string",
    "to_version": "string",
    "environment": "string",
    "status": "success" | "in_progress",
    "initiated_at": "ISO8601"
  }
}
```

---

### POST `/artifact-webhook`

Handle artifact/container registry webhooks.

**Authentication:** Not Required

**Headers:**
```http
X-Registry-Event: push | delete
```

**Request:**
```json
{
  "events": [
    {
      "action": "push" | "delete",
      "target": {
        "repository": "string",
        "tag": "string",
        "digest": "string"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "processed_events": "number",
  "artifacts_updated": ["uuid"]
}
```

---

## Notifications

### POST `/notify-event`

Send a notification event.

**Authentication:** Not Required

**Request:**
```json
{
  "type": "execution_complete" | "approval_required" | "deployment_failed" | "alert",
  "target": "uuid (user_id) | string (email/channel)",
  "payload": {
    "title": "string",
    "message": "string",
    "severity": "info" | "warning" | "critical",
    "action_url": "string (optional)",
    "metadata": {...}
  }
}
```

**Response:**
```json
{
  "success": true,
  "notification_id": "uuid",
  "delivered_to": ["string"],
  "status": "sent" | "queued"
}
```

---

### POST `/elevenlabs-tts`

Convert text to speech using ElevenLabs.

**Authentication:** Not Required

**Request:**
```json
{
  "text": "string",
  "voice_id": "string (optional)",
  "model_id": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "audio_url": "string",
  "duration_seconds": "number"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid JWT |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Rate Limited - Too many requests |
| 500 | Internal Server Error |

## Rate Limits

| Tier | Requests/Minute | Burst |
|------|-----------------|-------|
| Free | 60 | 10 |
| Pro | 300 | 50 |
| Enterprise | Unlimited | 100 |

---

*API Documentation - Opzenix Platform MVP 1.0.0*
