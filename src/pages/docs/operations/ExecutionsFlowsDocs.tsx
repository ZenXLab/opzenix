import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Play, CheckCircle2, Clock, RefreshCcw, Eye, 
  Pause, RotateCcw, ArrowRight, AlertTriangle
} from 'lucide-react';

export function ExecutionsFlowsDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>Operations</span>
          <span>/</span>
          <span className="text-foreground">Executions & Flows</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Play className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Executions & Flows</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Understanding how Opzenix executes deployment pipelines and provides real-time visibility.
          </p>
        </div>

        <Separator className="my-8" />

        {/* Execution Lifecycle */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Execution Lifecycle</h2>
          <p className="text-muted-foreground mb-4">
            Every deployment in Opzenix goes through a defined lifecycle:
          </p>

          <div className="flex items-center justify-between gap-2 p-4 rounded-lg bg-muted/30 border overflow-x-auto">
            {[
              { status: 'idle', label: 'Idle', color: 'text-muted-foreground' },
              { status: 'running', label: 'Running', color: 'text-chart-1' },
              { status: 'paused', label: 'Paused', color: 'text-sec-warning' },
              { status: 'success', label: 'Success', color: 'text-sec-safe' },
            ].map((item, i, arr) => (
              <div key={item.status} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <Badge variant="outline" className={item.color}>{item.label}</Badge>
                </div>
                {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-sec-critical/20 text-sec-critical">Failed</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Execution failed at a node. Automatic rollback triggered if enabled.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-sec-warning/20 text-sec-warning">Warning</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Execution completed with warnings. Review logs for issues.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Triggering Executions */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Triggering Executions</h2>

          <div className="space-y-4">
            <Step number={1} title="Webhook Trigger (Automatic)">
              <p className="mb-3">
                When you push code to GitHub, the webhook automatically triggers an execution.
              </p>
              <CodeBlock
                code={`# Push to trigger
git push origin feature/my-feature

# Webhook payload received:
{
  "event": "push",
  "ref": "refs/heads/feature/my-feature",
  "repository": "org/repo",
  "commit": "abc1234"
}`}
                language="bash"
              />
            </Step>

            <Step number={2} title="Manual Trigger (Control Tower)">
              <p className="mb-3">
                Start executions manually from the Control Tower UI.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>1. Navigate to <strong>Executions → New Execution</strong></p>
                <p>2. Select a <strong>Flow Template</strong> (CI/CD, MLOps, etc.)</p>
                <p>3. Choose target <strong>Branch</strong> and <strong>Environment</strong></p>
                <p>4. Click <strong>Start Execution</strong></p>
              </div>
            </Step>

            <Step number={3} title="API Trigger (Programmatic)">
              <p className="mb-3">
                Trigger executions via the REST API for automation.
              </p>
              <CodeBlock
                code={`curl -X POST "https://api.opzenix.io/v1/executions" \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "flow_template_id": "template-uuid",
    "environment": "staging",
    "branch": "main",
    "metadata": {
      "triggered_by": "scheduled-job"
    }
  }'`}
                language="bash"
                title="API Request"
              />
            </Step>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Real-time Monitoring */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Real-time Monitoring</h2>
          
          <Callout type="info" title="Live Updates">
            All execution data streams in real-time using WebSocket connections. No page refresh needed.
          </Callout>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Flow Visualization</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  See your pipeline as a visual flow diagram. Node colors update in real-time
                  as each stage completes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Streaming Logs</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click any node to view real-time log output. Logs stream as the stage executes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCcw className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Progress Tracking</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Overall progress bar and ETA based on historical execution times.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Pause className="w-5 h-5 text-sec-warning" />
                  <h4 className="font-semibold">Approval Gates</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Executions pause at approval gates. Vote directly from the dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Execution Actions */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Execution Actions</h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
              <Pause className="w-5 h-5 text-sec-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Pause Execution</p>
                <p className="text-sm text-muted-foreground">
                  Temporarily pause a running execution. Useful for manual verification.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
              <Play className="w-5 h-5 text-sec-safe shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Resume Execution</p>
                <p className="text-sm text-muted-foreground">
                  Resume a paused execution from where it left off.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
              <AlertTriangle className="w-5 h-5 text-sec-critical shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Cancel Execution</p>
                <p className="text-sm text-muted-foreground">
                  Immediately stop a running execution. Cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
              <RotateCcw className="w-5 h-5 text-chart-1 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Rerun from Checkpoint</p>
                <p className="text-sm text-muted-foreground">
                  Restart execution from any captured checkpoint. Preserves state.
                </p>
              </div>
            </div>
          </div>

          <CodeBlock
            code={`# Cancel execution via API
curl -X POST "https://api.opzenix.io/v1/executions/{id}/cancel" \\
  -H "Authorization: Bearer $API_TOKEN"

# Rerun from checkpoint
curl -X POST "https://api.opzenix.io/v1/executions/{id}/rerun" \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -d '{"checkpoint_id": "checkpoint-uuid"}'`}
            language="bash"
            title="Execution Control API"
          />
        </section>
      </div>
    </DocsLayout>
  );
}

export default ExecutionsFlowsDocs;
