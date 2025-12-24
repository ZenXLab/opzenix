import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Layers, ArrowRight, GitBranch, Shield, Eye, Play, 
  CheckCircle2, Server, Cloud, Database, Lock, Zap,
  Activity, RefreshCw, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function ControlPlaneModelDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/docs" className="hover:text-foreground">Docs</Link>
          <span>/</span>
          <span>Getting Started</span>
          <span>/</span>
          <span className="text-foreground">Control Plane Model</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Layers className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Control Plane Model</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Understanding how Opzenix sits between your source control and deployment targets 
            to provide governance, visibility, and control.
          </p>
        </div>

        <Separator className="my-8" />

        {/* What is a Control Plane */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">What is a Control Plane?</h2>
          <p className="text-muted-foreground mb-4">
            In distributed systems, a <strong>control plane</strong> is the component that manages and 
            configures the system, while the <strong>data plane</strong> handles the actual work. 
            Think of Kubernetes: the control plane (API server, scheduler, controller manager) 
            decides what should run where, while the data plane (kubelets, containers) does the running.
          </p>
          
          <Callout type="info" title="The Opzenix Approach">
            Opzenix applies this same principle to software delivery. Your CI/CD tools (GitHub Actions, 
            Jenkins, etc.) are the data plane — they execute builds and deployments. Opzenix is the 
            control plane — it governs, observes, and orchestrates the entire delivery lifecycle.
          </Callout>
        </section>

        {/* Architecture Diagram */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Architecture Overview</h2>
          
          <div className="p-6 rounded-lg bg-muted/30 border mb-6 overflow-x-auto">
            <pre className="text-sm font-mono text-muted-foreground whitespace-pre">
{`┌─────────────────────────────────────────────────────────────────────┐
│                         SOURCE CONTROL                               │
│                  (GitHub, GitLab, Azure DevOps)                      │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ Webhooks
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    OPZENIX CONTROL PLANE                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Webhook    │  │ Governance  │  │    Flow     │  │  Telemetry  │ │
│  │  Receiver   │─▶│   Engine    │─▶│  Executor   │─▶│  Collector  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│         │               │                │                │          │
│         ▼               ▼                ▼                ▼          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Audit     │  │ Environment │  │ Checkpoint  │  │   Metrics   │ │
│  │    Log      │  │    Locks    │  │   Manager   │  │  Dashboard  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ Deploy Commands
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT TARGETS                              │
│              (Kubernetes, Cloud Services, VMs)                       │
└─────────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </section>

        {/* Control Plane Components */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Control Plane Components</h2>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Webhook Receiver</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Listens for events from source control systems. Validates payloads, 
                      extracts metadata, and triggers the governance engine. Supports GitHub, 
                      GitLab, Azure DevOps, and custom webhooks.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sec-safe/10 rounded-lg">
                    <Shield className="w-5 h-5 text-sec-safe" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Governance Engine</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      The brain of Opzenix. Evaluates branch-to-environment rules, checks 
                      environment locks, validates permissions, and enforces approval workflows. 
                      All decisions are logged for audit compliance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-chart-1/10 rounded-lg">
                    <Play className="w-5 h-5 text-chart-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Flow Executor</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Orchestrates pipeline execution based on flow templates. Manages node 
                      sequencing, parallel execution, conditional logic, and checkpoint creation. 
                      Provides real-time status updates via WebSocket.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sec-warning/10 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-sec-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Checkpoint Manager</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Captures execution state at configurable points. Enables instant rollback 
                      to any previous known-good state. Stores artifacts, configuration snapshots, 
                      and deployment metadata.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Activity className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Telemetry Collector</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Aggregates logs, traces, and metrics from all execution stages. 
                      OpenTelemetry-native for seamless integration with existing observability 
                      stacks. Correlates signals with deployments for root cause analysis.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Data Plane Integration */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Data Plane Integration</h2>
          <p className="text-muted-foreground mb-4">
            Opzenix does not replace your existing CI/CD tools — it orchestrates them. The control 
            plane integrates with various data plane components:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-primary" />
                Source Control
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• GitHub (App & Actions)</li>
                <li>• GitLab (Webhooks & CI)</li>
                <li>• Azure DevOps (Pipelines)</li>
                <li>• Bitbucket (Pipelines)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-chart-1" />
                Container Registries
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Azure Container Registry (ACR)</li>
                <li>• Amazon ECR</li>
                <li>• Google Container Registry</li>
                <li>• Docker Hub</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Server className="w-4 h-4 text-sec-safe" />
                Kubernetes Clusters
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Azure Kubernetes Service (AKS)</li>
                <li>• Amazon EKS</li>
                <li>• Google GKE</li>
                <li>• Self-managed clusters</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-sec-warning" />
                Secret Management
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• HashiCorp Vault</li>
                <li>• Azure Key Vault</li>
                <li>• AWS Secrets Manager</li>
                <li>• Kubernetes Secrets</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Benefits of the Control Plane Model</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-sec-safe/5 border-sec-safe/30">
              <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
              <h4 className="font-semibold mb-1">Separation of Concerns</h4>
              <p className="text-sm text-muted-foreground">
                Governance logic is centralized, not scattered across pipeline YAML files.
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-sec-safe/5 border-sec-safe/30">
              <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
              <h4 className="font-semibold mb-1">Tool Agnostic</h4>
              <p className="text-sm text-muted-foreground">
                Switch CI/CD tools without rewriting governance rules or losing audit history.
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-sec-safe/5 border-sec-safe/30">
              <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
              <h4 className="font-semibold mb-1">Unified Visibility</h4>
              <p className="text-sm text-muted-foreground">
                One dashboard for all deployments across all environments and tools.
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-sec-safe/5 border-sec-safe/30">
              <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
              <h4 className="font-semibold mb-1">Enterprise Scale</h4>
              <p className="text-sm text-muted-foreground">
                Consistent policies across hundreds of repositories and teams.
              </p>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Next Steps */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <div className="space-y-3">
            <Link 
              to="/docs/getting-started/quickstart"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Play className="w-5 h-5 text-primary" />
                <span className="font-medium">Get Started with Quickstart Guide</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link 
              to="/docs/governance/branch-environment-rules"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-medium">Configure Governance Rules</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

export default ControlPlaneModelDocs;
