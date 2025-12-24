import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Book, CheckCircle2, Rocket, Shield, GitBranch, 
  Eye, Play, Lock, Zap, RefreshCcw, Clock, Terminal
} from 'lucide-react';

export function CoreConceptsDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>Getting Started</span>
          <span>/</span>
          <span className="text-foreground">Core Concepts</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Book className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Core Concepts</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Understanding the fundamental concepts behind Opzenix Delivery Governance Control Plane.
          </p>
        </div>

        <Separator className="my-8" />

        {/* Control Plane vs CI/CD */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Control Plane vs Traditional CI/CD</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="border-muted">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 text-muted-foreground">Traditional CI/CD</h3>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>Runs build and deploy scripts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>Limited visibility into execution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>Manual rollback procedures</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>Governance as an afterthought</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 text-primary">Opzenix Control Plane</h3>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-0.5" />
                    <span>Orchestrates and <strong>governs</strong> delivery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-0.5" />
                    <span>Real-time execution visibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-0.5" />
                    <span>Checkpoint-based instant rollback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-0.5" />
                    <span>Governance built into the platform</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Callout type="info" title="The Opzenix Philosophy">
            <strong>GitHub runs the code. Kubernetes runs the workloads. Opzenix runs the confidence.</strong>
            <br />
            We don't replace your existing tools — we add a governance layer that ensures every deployment
            follows your policies.
          </Callout>
        </section>

        <Separator className="my-8" />

        {/* Core Components */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Core Components</h2>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <Play className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Executions</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      An execution is a single run of a deployment pipeline. It contains multiple nodes
                      (stages) that execute in sequence or parallel. Each execution is tracked with
                      full audit logging and checkpoint capture.
                    </p>
                    <CodeBlock
                      code={`// Execution structure
{
  "id": "exec-uuid",
  "name": "Deploy v2.5.0",
  "status": "running",
  "environment": "staging",
  "branch": "main",
  "progress": 65,
  "nodes": ["build", "test", "deploy"]
}`}
                      language="json"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sec-warning/10 rounded">
                    <Lock className="w-5 h-5 text-sec-warning" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Environment Locks</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Environments can be locked to prevent unauthorized deployments. Locked environments
                      require explicit approval before deployment can proceed. Production environments
                      are typically locked by default.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Badge className="bg-sec-safe/20 text-sec-safe">Unlocked</Badge>
                      <Badge className="bg-sec-warning/20 text-sec-warning">Locked</Badge>
                      <Badge className="bg-sec-critical/20 text-sec-critical">Hard Locked</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sec-safe/10 rounded">
                    <RefreshCcw className="w-5 h-5 text-sec-safe" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Checkpoints</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Checkpoints capture the state of your execution at critical points. They enable
                      instant rollback to any previous known-good state. Checkpoints include artifacts,
                      configuration, and deployment metadata.
                    </p>
                    <CodeBlock
                      code={`// Checkpoint capture
POST /api/checkpoints
{
  "execution_id": "exec-uuid",
  "node_id": "deploy-node",
  "name": "pre-deploy-v2.5.0",
  "state": {
    "artifacts": [...],
    "config": {...}
  }
}`}
                      language="json"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-chart-1/10 rounded">
                    <Shield className="w-5 h-5 text-chart-1" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Approval Gates</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Approval gates pause execution and require human approval before proceeding.
                      They can require multiple approvers, specific roles, and include comments
                      and audit trail.
                    </p>
                    <div className="mt-3 p-3 rounded bg-muted/30 text-sm">
                      <p className="font-medium mb-1">Approval Flow:</p>
                      <p className="text-muted-foreground">
                        Execution paused → Notification sent → Approvers vote → Threshold met → Execution resumes
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Flow Templates */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Flow Templates</h2>
          <p className="text-muted-foreground mb-4">
            Flow templates define the structure of your deployment pipelines. They specify which
            nodes to execute, in what order, and with what conditions.
          </p>

          <CodeBlock
            code={`// CI/CD Flow Template
{
  "name": "Standard CI/CD Pipeline",
  "type": "cicd",
  "nodes": [
    { "id": "checkout", "type": "source", "name": "Checkout Code" },
    { "id": "install", "type": "build", "name": "Install Dependencies" },
    { "id": "test", "type": "test", "name": "Run Tests" },
    { "id": "build", "type": "build", "name": "Build Artifact" },
    { "id": "scan", "type": "security", "name": "Security Scan" },
    { "id": "approval", "type": "approval", "name": "Approve Deploy" },
    { "id": "deploy", "type": "deploy", "name": "Deploy to K8s" }
  ],
  "edges": [
    { "source": "checkout", "target": "install" },
    { "source": "install", "target": "test" },
    { "source": "test", "target": "build" },
    { "source": "build", "target": "scan" },
    { "source": "scan", "target": "approval" },
    { "source": "approval", "target": "deploy" }
  ]
}`}
            language="json"
            title="flow-template.json"
          />

          <div className="mt-4 grid grid-cols-5 gap-2">
            {['Source', 'Build', 'Test', 'Security', 'Deploy'].map((stage, i) => (
              <div key={stage} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <span className="text-xs mt-1 text-muted-foreground">{stage}</span>
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-8" />

        {/* Deployment Strategies */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Deployment Strategies</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <Badge className="bg-chart-1/20 text-chart-1 mb-3">Rolling</Badge>
                <h4 className="font-semibold mb-2">Rolling Update</h4>
                <p className="text-sm text-muted-foreground">
                  Gradually replaces old instances with new ones. Zero downtime with gradual rollout.
                </p>
                <div className="mt-3 text-xs text-muted-foreground">
                  <strong>Best for:</strong> Standard deployments, stateless apps
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Badge className="bg-sec-warning/20 text-sec-warning mb-3">Canary</Badge>
                <h4 className="font-semibold mb-2">Canary Deployment</h4>
                <p className="text-sm text-muted-foreground">
                  Routes a small percentage of traffic to the new version first. Monitor before full rollout.
                </p>
                <div className="mt-3 text-xs text-muted-foreground">
                  <strong>Best for:</strong> High-risk changes, A/B testing
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Badge className="bg-primary/20 text-primary mb-3">Blue-Green</Badge>
                <h4 className="font-semibold mb-2">Blue-Green</h4>
                <p className="text-sm text-muted-foreground">
                  Runs two identical environments. Instantly switch traffic between them.
                </p>
                <div className="mt-3 text-xs text-muted-foreground">
                  <strong>Best for:</strong> Instant rollback needs, zero-downtime
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

export default CoreConceptsDocs;
