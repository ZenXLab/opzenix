import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  RotateCcw, ArrowRight, CheckCircle2, AlertTriangle,
  Clock, History, Play, Shield, Zap, Database
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function RollbacksDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/docs" className="hover:text-foreground">Docs</Link>
          <span>/</span>
          <span>Operations</span>
          <span>/</span>
          <span className="text-foreground">Rollbacks</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <RotateCcw className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Rollbacks</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Quickly recover from failed deployments by rolling back to a previous known-good 
            state using Opzenix checkpoint-based rollback system.
          </p>
        </div>

        <Separator className="my-8" />

        {/* Rollback Types */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Rollback Types</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Checkpoint Rollback</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Restore to any checkpoint captured during previous executions. 
                      Includes artifacts, configuration, and deployment state.
                    </p>
                    <Badge className="mt-2 bg-sec-safe/20 text-sec-safe">Recommended</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sec-warning/10 rounded-lg">
                    <RotateCcw className="w-5 h-5 text-sec-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Version Rollback</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Redeploy a specific version tag without full checkpoint state. 
                      Faster but may require manual configuration.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-chart-1/10 rounded-lg">
                    <Zap className="w-5 h-5 text-chart-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Instant Rollback</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Blue-Green or Canary deployments allow instant traffic switching 
                      to the previous version without redeployment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Database className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Database Rollback</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Revert database migrations using captured schema snapshots. 
                      Requires careful planning for data integrity.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Performing a Rollback */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Performing a Rollback</h2>
          
          <Step number={1} title="Identify the Target State">
            <p className="mb-4">
              Navigate to Deployment History or Checkpoints to find the version you want to restore.
            </p>
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-sec-safe/10 border border-sec-safe/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                    <span className="text-sm font-medium">v2.4.1</span>
                    <span className="text-xs text-muted-foreground">2 hours ago</span>
                  </div>
                  <Badge className="bg-sec-safe/20 text-sec-safe">Current</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                    <span className="text-sm font-medium">v2.4.0</span>
                    <span className="text-xs text-muted-foreground">1 day ago</span>
                  </div>
                  <Badge variant="outline">Rollback Target</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">v2.3.5</span>
                    <span className="text-xs text-muted-foreground">3 days ago</span>
                  </div>
                </div>
              </div>
            </div>
          </Step>

          <Step number={2} title="Initiate Rollback">
            <p className="mb-4">
              Click the rollback button or use the CLI to start the rollback process.
            </p>
            <CodeBlock
              code={`# Rollback to specific checkpoint
opzenix rollback \\
  --environment production \\
  --checkpoint chk-abc123 \\
  --reason "Reverting due to performance regression"

# Rollback to previous deployment
opzenix rollback \\
  --environment production \\
  --version v2.4.0

# Rollback with approval bypass (emergency)
opzenix rollback \\
  --environment production \\
  --version v2.4.0 \\
  --emergency \\
  --ticket INC-5678`}
              language="bash"
              title="Rollback CLI Commands"
            />
          </Step>

          <Step number={3} title="Monitor Rollback Progress">
            <p className="mb-4">
              Track the rollback execution in real-time through the Control Tower dashboard.
            </p>
            <CodeBlock
              code={`{
  "rollbackExecution": {
    "id": "exec-rollback-123",
    "type": "checkpoint_rollback",
    "targetCheckpoint": "chk-abc123",
    "targetVersion": "v2.4.0",
    "environment": "production",
    "status": "running",
    "progress": 65,
    "stages": [
      { "name": "Validate Checkpoint", "status": "success" },
      { "name": "Pull Artifacts", "status": "success" },
      { "name": "Apply Configuration", "status": "running" },
      { "name": "Deploy to Kubernetes", "status": "pending" },
      { "name": "Health Check", "status": "pending" }
    ]
  }
}`}
              language="json"
              title="Rollback Execution Status"
            />
          </Step>

          <Step number={4} title="Verify Rollback Success">
            <p className="mb-4">
              Confirm the rollback completed successfully and the system is healthy.
            </p>
            <Callout type="success" title="Post-Rollback Checklist">
              <ul className="space-y-1 mt-2">
                <li>✓ Health checks passing</li>
                <li>✓ Error rates returned to baseline</li>
                <li>✓ Key functionality verified</li>
                <li>✓ Incident ticket updated</li>
              </ul>
            </Callout>
          </Step>
        </section>

        <Separator className="my-8" />

        {/* Automatic Rollback */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Automatic Rollback</h2>
          <p className="text-muted-foreground mb-4">
            Configure automatic rollback triggers based on health checks and metrics.
          </p>
          
          <CodeBlock
            code={`{
  "autoRollback": {
    "enabled": true,
    "triggers": [
      {
        "type": "health_check_failure",
        "threshold": 3,
        "window": "5m",
        "action": "rollback_to_previous"
      },
      {
        "type": "error_rate",
        "threshold": 10,
        "unit": "percent",
        "window": "5m",
        "action": "rollback_to_checkpoint"
      },
      {
        "type": "latency_p99",
        "threshold": 5000,
        "unit": "ms",
        "window": "5m",
        "action": "pause_and_alert"
      }
    ],
    "cooldownPeriod": "15m",
    "maxAutoRollbacks": 2,
    "notifyOnTrigger": true
  }
}`}
            language="json"
            title="Auto-Rollback Configuration"
          />

          <Callout type="warning" title="Rollback Loops">
            Configure a cooldown period and maximum auto-rollback count to prevent 
            rollback loops when deployments consistently fail.
          </Callout>
        </section>

        {/* Rollback Strategies */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Rollback Strategies by Deployment Type</h2>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary">Blue-Green</Badge>
                  Instant Switch
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Simply route traffic back to the blue (previous) environment. Near-instant recovery.
                </p>
                <CodeBlock
                  code={`# Switch traffic back to blue
kubectl patch service my-app -p '{"spec":{"selector":{"version":"blue"}}}'`}
                  language="bash"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge className="bg-sec-warning/20 text-sec-warning">Canary</Badge>
                  Traffic Shift
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Shift 100% traffic back to stable version. Scale down canary pods.
                </p>
                <CodeBlock
                  code={`# Route all traffic to stable
kubectl patch virtualservice my-app --type merge -p '
spec:
  http:
  - route:
    - destination:
        host: my-app-stable
      weight: 100'`}
                  language="yaml"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge className="bg-chart-1/20 text-chart-1">Rolling</Badge>
                  Redeploy Previous
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Deploy the previous version using the same rolling update strategy.
                </p>
                <CodeBlock
                  code={`# Rollback to previous revision
kubectl rollout undo deployment/my-app

# Or rollback to specific revision
kubectl rollout undo deployment/my-app --to-revision=3`}
                  language="bash"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Rollback Best Practices</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
              <h4 className="font-semibold">Always Keep Previous Version Running</h4>
              <p className="text-sm text-muted-foreground">
                Use Blue-Green or keep previous pods warm for instant rollback capability.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
              <h4 className="font-semibold">Test Rollback Procedures</h4>
              <p className="text-sm text-muted-foreground">
                Regularly practice rollbacks in staging to ensure the process works when needed.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
              <h4 className="font-semibold">Document Known-Good States</h4>
              <p className="text-sm text-muted-foreground">
                Tag checkpoints with meaningful names for easy identification during incidents.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
              <h4 className="font-semibold">Plan for Database Rollbacks</h4>
              <p className="text-sm text-muted-foreground">
                Ensure migrations are backward-compatible or have reversal scripts ready.
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
              to="/docs/operations/checkpoints-rewind"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-primary" />
                <span className="font-medium">Learn About Checkpoints</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link 
              to="/docs/operations/audit-logs"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-medium">Review Audit Logs</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

export default RollbacksDocs;
