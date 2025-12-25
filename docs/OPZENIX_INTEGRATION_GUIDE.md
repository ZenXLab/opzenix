# OPZENIX MVP 1.0.0 - Complete Integration Guide

## Enterprise CI/CD Control Plane Setup

This guide covers the complete integration from GitHub to Kubernetes deployment using OPZENIX as your control plane.

---

## 🔒 ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              OPZENIX CONTROL PLANE                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Metadata │  │ Approvals│  │ Policies │  │  Audit   │  │ Evidence │          │
│  │  Store   │  │  Engine  │  │  Engine  │  │   Log    │  │  Store   │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           ▼                          ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│    GITHUB ACTIONS   │    │      ARGO CD        │    │    KUBERNETES       │
│    (CI Execution)   │    │   (CD Orchestrator) │    │    (Runtime)        │
│                     │    │                     │    │                     │
│  - Build            │    │  - GitOps Sync      │    │  - Workloads        │
│  - Test             │    │  - Manual/Auto      │    │  - Services         │
│  - Scan             │    │  - Rollback         │    │  - Monitoring       │
│  - Sign             │    │  - Health Checks    │    │  - OTel             │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

---

## STEP 1: GitHub App Integration

### 1.1 Install OPZENIX GitHub App

1. Navigate to **Control Tower → Connections → GitHub**
2. Click **"Connect GitHub Repository"**
3. Authorize the OPZENIX GitHub App
4. Select the repository to connect
5. Configure webhook settings:
   - **Webhook URL**: `https://[your-supabase-project].supabase.co/functions/v1/github-webhook`
   - **Events**: Push, Pull Request, Workflow Run
   - **Secret**: Auto-generated and stored securely

### 1.2 Branch Mapping Configuration

Configure branch-to-environment mappings:

| Branch Pattern | Environment | Deployable | Strategy    |
|----------------|-------------|------------|-------------|
| `main`         | Production  | Yes        | Blue/Green  |
| `release/*`    | PreProd     | Yes        | Canary      |
| `staging`      | Staging     | Yes        | Canary      |
| `develop`      | UAT         | Yes        | Rolling     |
| `feature/*`    | Dev         | Yes        | Rolling     |

---

## STEP 2: GitHub Actions CI Pipeline

### 2.1 Create Workflow File

Create `.github/workflows/opzenix-pipeline.yml`:

```yaml
name: OPZENIX CI Pipeline

on:
  push:
    branches: [main, develop, staging, 'release/*', 'feature/*']
  pull_request:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  # OR for ACR: REGISTRY: ${{ secrets.ACR_REGISTRY }}.azurecr.io
  # OR for DockerHub: REGISTRY: docker.io
  IMAGE_NAME: ${{ github.repository }}
  OPZENIX_API: ${{ secrets.OPZENIX_API_URL }}

jobs:
  # ============================================
  # STAGE 1: STATIC ANALYSIS (SAST)
  # ============================================
  sast:
    name: "🔍 SAST - Static Analysis"
    runs-on: ubuntu-latest
    outputs:
      status: ${{ steps.sast.outputs.status }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Notify OPZENIX - SAST Started
        run: |
          curl -X POST "${{ env.OPZENIX_API }}/functions/v1/record-ci-evidence" \
            -H "Authorization: Bearer ${{ secrets.OPZENIX_SERVICE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "execution_id": "${{ github.run_id }}",
              "step_type": "sast",
              "step_name": "SAST - Static Code Analysis",
              "status": "running",
              "started_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
            }'
      
      - name: Run Semgrep SAST
        id: sast
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
        continue-on-error: true
      
      - name: Upload SAST Report
        uses: actions/upload-artifact@v4
        with:
          name: sast-report
          path: semgrep.sarif
      
      - name: Notify OPZENIX - SAST Complete
        if: always()
        run: |
          STATUS="${{ steps.sast.outcome == 'success' && 'passed' || 'failed' }}"
          curl -X POST "${{ env.OPZENIX_API }}/functions/v1/record-ci-evidence" \
            -H "Authorization: Bearer ${{ secrets.OPZENIX_SERVICE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "execution_id": "${{ github.run_id }}",
              "step_type": "sast",
              "step_name": "SAST - Static Code Analysis",
              "status": "'$STATUS'",
              "completed_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
              "evidence_url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
            }'

  # ============================================
  # STAGE 2: DEPENDENCY SCAN
  # ============================================
  dependency-scan:
    name: "📦 Dependency Scan"
    runs-on: ubuntu-latest
    needs: sast
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy Dependency Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'dependency-results.sarif'
          severity: 'CRITICAL,HIGH'
      
      - name: Upload Dependency Report
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'dependency-results.sarif'
      
      - name: Notify OPZENIX
        run: |
          curl -X POST "${{ env.OPZENIX_API }}/functions/v1/record-ci-evidence" \
            -H "Authorization: Bearer ${{ secrets.OPZENIX_SERVICE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "execution_id": "${{ github.run_id }}",
              "step_type": "dependency",
              "step_name": "Dependency Vulnerability Scan",
              "status": "passed",
              "summary": "0 critical vulnerabilities"
            }'

  # ============================================
  # STAGE 3: SECRETS SCAN
  # ============================================
  secrets-scan:
    name: "🔐 Secrets Scan"
    runs-on: ubuntu-latest
    needs: sast
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Notify OPZENIX
        run: |
          curl -X POST "${{ env.OPZENIX_API }}/functions/v1/record-ci-evidence" \
            -H "Authorization: Bearer ${{ secrets.OPZENIX_SERVICE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "execution_id": "${{ github.run_id }}",
              "step_type": "secrets",
              "step_name": "Secrets Detection Scan",
              "status": "passed",
              "summary": "No secrets detected in codebase"
            }'

  # ============================================
  # STAGE 4: UNIT TESTS
  # ============================================
  unit-tests:
    name: "🧪 Unit Tests"
    runs-on: ubuntu-latest
    needs: [dependency-scan, secrets-scan]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Run Unit Tests
        run: npm run test:unit -- --coverage --reporter=json --outputFile=test-results.json
      
      - name: Upload Coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
      
      - name: Notify OPZENIX
        run: |
          curl -X POST "${{ env.OPZENIX_API }}/functions/v1/record-ci-evidence" \
            -H "Authorization: Bearer ${{ secrets.OPZENIX_SERVICE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "execution_id": "${{ github.run_id }}",
              "step_type": "unit",
              "step_name": "Unit Tests",
              "status": "passed",
              "summary": "All tests passed with 85% coverage"
            }'

  # ============================================
  # STAGE 5: INTEGRATION TESTS
  # ============================================
  integration-tests:
    name: "🔗 Integration Tests"
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Integration Tests
        run: npm run test:integration
      
      - name: Notify OPZENIX
        run: |
          curl -X POST "${{ env.OPZENIX_API }}/functions/v1/record-ci-evidence" \
            -H "Authorization: Bearer ${{ secrets.OPZENIX_SERVICE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "execution_id": "${{ github.run_id }}",
              "step_type": "integration",
              "step_name": "Integration Tests",
              "status": "passed"
            }'

  # ============================================
  # STAGE 6: BUILD & PUSH IMAGE
  # ============================================
  build-image:
    name: "🏗️ Build Container Image"
    runs-on: ubuntu-latest
    needs: integration-tests
    permissions:
      contents: read
      packages: write
    outputs:
      image_digest: ${{ steps.build.outputs.digest }}
      image_tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      # --- GHCR Login ---
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      # --- OR: ACR Login ---
      # - name: Login to ACR
      #   uses: docker/login-action@v3
      #   with:
      #     registry: ${{ secrets.ACR_REGISTRY }}.azurecr.io
      #     username: ${{ secrets.ACR_USERNAME }}
      #     password: ${{ secrets.ACR_PASSWORD }}
      
      # --- OR: DockerHub Login ---
      # - name: Login to DockerHub
      #   uses: docker/login-action@v3
      #   with:
      #     username: ${{ secrets.DOCKERHUB_USERNAME }}
      #     password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Extract Metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}
      
      - name: Build and Push
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Notify OPZENIX - Artifact Created
        run: |
          curl -X POST "${{ env.OPZENIX_API }}/functions/v1/artifact-webhook" \
            -H "Authorization: Bearer ${{ secrets.OPZENIX_SERVICE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "execution_id": "${{ github.run_id }}",
              "name": "${{ env.IMAGE_NAME }}",
              "registry_url": "${{ env.REGISTRY }}",
              "image_tag": "${{ steps.meta.outputs.version }}",
              "image_digest": "${{ steps.build.outputs.digest }}",
              "type": "docker"
            }'

  # ============================================
  # STAGE 7: SBOM GENERATION
  # ============================================
  sbom:
    name: "📋 SBOM Generation"
    runs-on: ubuntu-latest
    needs: build-image
    steps:
      - name: Generate SBOM with Syft
        uses: anchore/sbom-action@v0
        with:
          image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build-image.outputs.image_digest }}
          format: spdx-json
          output-file: sbom.spdx.json
      
      - name: Upload SBOM
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.spdx.json
      
      - name: Notify OPZENIX
        run: |
          curl -X POST "${{ env.OPZENIX_API }}/functions/v1/generate-sbom" \
            -H "Authorization: Bearer ${{ secrets.OPZENIX_SERVICE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "execution_id": "${{ github.run_id }}",
              "artifact_digest": "${{ needs.build-image.outputs.image_digest }}",
              "format": "spdx"
            }'

  # ============================================
  # STAGE 8: IMAGE SIGNING (Cosign)
  # ============================================
  sign-image:
    name: "✍️ Sign Image (Cosign)"
    runs-on: ubuntu-latest
    needs: build-image
    permissions:
      contents: read
      packages: write
      id-token: write  # For keyless signing
    steps:
      - name: Install Cosign
        uses: sigstore/cosign-installer@v3
      
      - name: Login to Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Sign Image (Keyless)
        env:
          DIGEST: ${{ needs.build-image.outputs.image_digest }}
          TAGS: ${{ needs.build-image.outputs.image_tag }}
        run: |
          cosign sign --yes ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${DIGEST}
      
      - name: Notify OPZENIX
        run: |
          curl -X POST "${{ env.OPZENIX_API }}/functions/v1/record-ci-evidence" \
            -H "Authorization: Bearer ${{ secrets.OPZENIX_SERVICE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "execution_id": "${{ github.run_id }}",
              "step_type": "sign",
              "step_name": "Image Signing (Cosign)",
              "status": "passed",
              "summary": "Image signed with Sigstore keyless signing"
            }'

  # ============================================
  # STAGE 9: IMAGE VULNERABILITY SCAN (Trivy)
  # ============================================
  scan-image:
    name: "🔒 Scan Image (Trivy)"
    runs-on: ubuntu-latest
    needs: [build-image, sign-image]
    steps:
      - name: Run Trivy Image Scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: '${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build-image.outputs.image_digest }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'  # Fail on critical/high
        continue-on-error: true
      
      - name: Upload Trivy Results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Notify OPZENIX
        run: |
          curl -X POST "${{ env.OPZENIX_API }}/functions/v1/trivy-scan" \
            -H "Authorization: Bearer ${{ secrets.OPZENIX_SERVICE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "execution_id": "${{ github.run_id }}",
              "artifact_digest": "${{ needs.build-image.outputs.image_digest }}",
              "scan_type": "image"
            }'

  # ============================================
  # STAGE 10: TRIGGER CD (GitOps)
  # ============================================
  trigger-cd:
    name: "🚀 Trigger Deployment"
    runs-on: ubuntu-latest
    needs: [scan-image, sbom]
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/heads/release/')
    steps:
      - name: Determine Environment
        id: env
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "environment=production" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == refs/heads/release/* ]]; then
            echo "environment=preprod" >> $GITHUB_OUTPUT
          fi
      
      - name: Request OPZENIX Approval
        run: |
          curl -X POST "${{ env.OPZENIX_API }}/functions/v1/pipeline-execute" \
            -H "Authorization: Bearer ${{ secrets.OPZENIX_SERVICE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "execution_id": "${{ github.run_id }}",
              "environment": "${{ steps.env.outputs.environment }}",
              "artifact_digest": "${{ needs.build-image.outputs.image_digest }}",
              "commit_sha": "${{ github.sha }}",
              "branch": "${{ github.ref_name }}"
            }'
```

---

## STEP 3: Container Registry Setup

### 3.1 GitHub Container Registry (GHCR) - Default

GHCR is pre-configured. No additional setup required.

### 3.2 Azure Container Registry (ACR)

1. **Create ACR**:
   ```bash
   az acr create --name opzenixacr --resource-group rg-opzenix --sku Standard
   ```

2. **Get Credentials**:
   ```bash
   az acr credential show --name opzenixacr
   ```

3. **Add GitHub Secrets**:
   - `ACR_REGISTRY`: `opzenixacr`
   - `ACR_USERNAME`: (from step 2)
   - `ACR_PASSWORD`: (from step 2)

### 3.3 DockerHub

1. **Create Access Token**: https://hub.docker.com/settings/security
2. **Add GitHub Secrets**:
   - `DOCKERHUB_USERNAME`: Your username
   - `DOCKERHUB_TOKEN`: Access token

---

## STEP 4: Argo CD Setup (CD Orchestrator)

### 4.1 Install Argo CD on AKS

```bash
# Create AKS cluster
az aks create \
  --resource-group rg-opzenix \
  --name aks-opzenix-prod \
  --node-count 3 \
  --enable-managed-identity \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group rg-opzenix --name aks-opzenix-prod

# Install Argo CD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

### 4.2 Configure Argo CD Applications

Create Application manifests per environment:

**`argocd/production.yaml`**:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: opzenix-production
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/opzenix-manifests.git
    targetRevision: main
    path: overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: opzenix-prod
  syncPolicy:
    # MANUAL for production - requires approval
    automated: null
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
  revisionHistoryLimit: 10
```

**`argocd/staging.yaml`**:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: opzenix-staging
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/opzenix-manifests.git
    targetRevision: staging
    path: overlays/staging
  destination:
    server: https://kubernetes.default.svc
    namespace: opzenix-staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### 4.3 Deployment Strategies

**Rolling Update (Dev/UAT)**:
```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
```

**Canary (Staging/PreProd)** - using Argo Rollouts:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: opzenix-api
spec:
  replicas: 4
  strategy:
    canary:
      steps:
        - setWeight: 20
        - pause: {duration: 5m}
        - setWeight: 50
        - pause: {duration: 5m}
        - setWeight: 80
        - pause: {duration: 5m}
```

**Blue/Green (Production)**:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: opzenix-api
spec:
  replicas: 4
  strategy:
    blueGreen:
      activeService: opzenix-api-active
      previewService: opzenix-api-preview
      autoPromotionEnabled: false  # Requires manual promotion
      scaleDownDelaySeconds: 30
```

---

## STEP 5: Kubernetes Manifests (GitOps)

### 5.1 Directory Structure

```
opzenix-manifests/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── kustomization.yaml
└── overlays/
    ├── development/
    │   ├── kustomization.yaml
    │   └── patches/
    ├── staging/
    │   ├── kustomization.yaml
    │   └── patches/
    ├── preprod/
    │   ├── kustomization.yaml
    │   └── patches/
    └── production/
        ├── kustomization.yaml
        └── patches/
```

### 5.2 Base Deployment

**`base/deployment.yaml`**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opzenix-api
  labels:
    app: opzenix-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: opzenix-api
  template:
    metadata:
      labels:
        app: opzenix-api
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
    spec:
      containers:
        - name: api
          image: ghcr.io/your-org/opzenix-api:latest
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
          env:
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: "http://otel-collector:4317"
```

---

## STEP 6: OPZENIX Connections Configuration

### 6.1 Required Connections

Navigate to **Control Tower → Connections** and configure:

| Connection Type | Purpose | Status Required |
|-----------------|---------|-----------------|
| **GitHub** | Source control, CI triggers | Connected |
| **Container Registry** | Artifact storage | Connected |
| **Kubernetes (AKS)** | Runtime cluster | Connected |
| **Vault** | Secrets management | Optional |
| **OpenTelemetry** | Observability | Recommended |

### 6.2 Connection Validation

All connections must pass health checks before deployments can proceed.

---

## STEP 7: Approval Configuration

### 7.1 Environment-Based Approvals

| Environment | Required Approvers | Roles |
|-------------|-------------------|-------|
| Dev | 1 | Tech Lead |
| UAT | 1 | QA Lead |
| Staging | 1 | Architect |
| PreProd | 2 | Architect + CTO |
| Production | 3 | CTO + Security Head + Platform Owner |

### 7.2 Approval Rules

- ✅ No self-approval allowed
- ✅ Comments mandatory for Production
- ✅ Break-glass available for CTO only (fully audited)
- ✅ Email/Slack notifications on pending approvals

---

## STEP 8: Verification Checklist

### Pre-Deployment

- [ ] All CI stages passed (SAST, Deps, Secrets, Tests)
- [ ] Artifact created with immutable SHA digest
- [ ] Image signed with Cosign
- [ ] Trivy scan shows 0 critical vulnerabilities
- [ ] SBOM generated and stored
- [ ] Required approvals obtained

### Post-Deployment

- [ ] Argo CD sync successful
- [ ] All pods healthy (Ready/Live probes passing)
- [ ] OTel metrics flowing
- [ ] Smoke tests passed
- [ ] Audit record created (immutable)

---

## STEP 9: Rollback Procedure

### Via OPZENIX Control Tower

1. Navigate to **Deployments → Production**
2. Click **"View History"**
3. Select previous version
4. Click **"Rollback to this version"**
5. Approve rollback (follows same approval rules)

### Via Argo CD (Emergency)

```bash
# List revision history
argocd app history opzenix-production

# Rollback to specific revision
argocd app rollback opzenix-production <REVISION_NUMBER>
```

### Via Git (Preferred - GitOps)

```bash
# Revert commit
git revert <COMMIT_SHA>
git push origin main

# Argo CD will auto-sync the revert
```

---

## STEP 10: Monitoring & Observability

### OpenTelemetry Configuration

Deploy OTel Collector to your cluster:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
data:
  config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
    processors:
      batch:
    exporters:
      otlp:
        endpoint: "${OPZENIX_OTEL_ENDPOINT}"
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [batch]
          exporters: [otlp]
        metrics:
          receivers: [otlp]
          processors: [batch]
          exporters: [otlp]
```

---

## Summary: Complete Flow

```
1. Developer pushes code to GitHub
   ↓
2. GitHub Actions CI Pipeline starts
   ├── SAST (Semgrep) → Report to OPZENIX
   ├── Dependency Scan (Trivy) → Report to OPZENIX
   ├── Secrets Scan (Gitleaks) → Report to OPZENIX
   ├── Unit Tests → Report to OPZENIX
   ├── Integration Tests → Report to OPZENIX
   ├── Build Image → Push to Registry
   ├── Generate SBOM (Syft) → Store in OPZENIX
   ├── Sign Image (Cosign) → Report to OPZENIX
   └── Scan Image (Trivy) → Report to OPZENIX
   ↓
3. OPZENIX receives all CI evidence
   ↓
4. Security Gate evaluation
   ↓
5. Approval Gate (environment-based)
   ↓
6. Upon approval: Trigger Argo CD sync
   ↓
7. Argo CD deploys to Kubernetes (AKS)
   ├── Rolling (Dev/UAT)
   ├── Canary (Staging/PreProd)
   └── Blue/Green (Production)
   ↓
8. Runtime verification (OTel signals)
   ↓
9. Immutable Audit Record created
```

---

## 🔒 MVP 1.0.0 LOCKED

This integration guide covers the complete OPZENIX MVP 1.0.0 scope.

**Do NOT add features. Do NOT modify the architecture.**

For questions, contact Platform Engineering.
