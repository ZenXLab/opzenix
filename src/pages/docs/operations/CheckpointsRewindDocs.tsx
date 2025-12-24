import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  RotateCcw, CheckCircle2, Clock, AlertTriangle, 
  ArrowLeft, History, Shield
} from 'lucide-react';

export function CheckpointsRewindDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>Operations</span>
          <span>/</span>
          <span className="text-foreground">Checkpoints & Rewind</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <RotateCcw className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Checkpoints & Rewind</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            State capture and instant rollback capabilities for safe deployments.
          </p>
        </div>

        <Callout type="success" title="Zero-Fear Deployments">
          Checkpoints enable instant recovery. Deploy with confidence knowing you can rewind in seconds.
        </Callout>

        <Separator className="my-8" />

        {/* What are Checkpoints */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">What are Checkpoints?</h2>
          <p className="text-muted-foreground mb-4">
            Checkpoints are snapshots of your deployment state captured at critical points during execution.
            They include:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Captured Data</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                    Artifact versions and digests
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                    Configuration state
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                    Environment variables
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                    Execution metadata
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Automatic Capture Points</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Before each deployment stage
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    After successful tests
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    At approval gates
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    After successful deploy
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* How Checkpoints Work */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">How Checkpoints Work</h2>

          <CodeBlock
            code={`// Checkpoint structure
{
  "id": "chk-abc123",
  "execution_id": "exec-xyz789",
  "node_id": "deploy-node",
  "name": "pre-deploy-v2.5.0",
  "created_at": "2024-01-15T10:30:00Z",
  "state": {
    "artifacts": [
      {
        "name": "app-image",
        "digest": "sha256:abc123...",
        "tag": "v2.5.0"
      }
    ],
    "config": {
      "replicas": 3,
      "resources": {...}
    },
    "environment": {
      "NODE_ENV": "production",
      "API_URL": "https://api.example.com"
    }
  }
}`}
            language="json"
            title="checkpoint.json"
          />

          <div className="mt-6">
            <Step number={1} title="Checkpoint Creation">
              <p>
                When an execution reaches a checkpoint-enabled node, Opzenix automatically captures
                the current state and stores it with a unique identifier.
              </p>
            </Step>

            <Step number={2} title="State Preservation">
              <p>
                The checkpoint stores all relevant data including artifact digests, configuration,
                and execution context. This enables exact state restoration.
              </p>
            </Step>

            <Step number={3} title="Instant Rewind">
              <p>
                When you trigger a rewind, Opzenix restores the exact state from the checkpoint
                and resumes execution from that point.
              </p>
            </Step>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Rewinding to a Checkpoint */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Rewinding to a Checkpoint</h2>

          <Callout type="warning" title="Before You Rewind">
            Rewinding discards all changes made after the checkpoint. Make sure you understand
            the implications before proceeding.
          </Callout>

          <div className="mt-6 space-y-4">
            <Card className="border-primary/30">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5 text-primary" />
                  UI Method
                </h4>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li>1. Go to <strong>Executions → Select Execution</strong></li>
                  <li>2. Click <strong>Checkpoints</strong> tab</li>
                  <li>3. Find the desired checkpoint</li>
                  <li>4. Click <strong>Rewind to This Point</strong></li>
                  <li>5. Confirm the action</li>
                </ol>
              </CardContent>
            </Card>

            <CodeBlock
              code={`# Rewind via API
curl -X POST "https://api.opzenix.io/v1/checkpoints/{checkpoint_id}/rewind" \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reason": "Rollback due to performance issues in v2.5.0",
    "ticket_id": "JIRA-1234"
  }'

# Response
{
  "success": true,
  "new_execution_id": "exec-new123",
  "reverted_to": "v2.4.0",
  "audit_id": "audit-xyz789"
}`}
              language="bash"
              title="Rewind API"
            />
          </div>
        </section>

        <Separator className="my-8" />

        {/* Best Practices */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Best Practices</h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-sec-safe/5 border-sec-safe/30">
              <CheckCircle2 className="w-5 h-5 text-sec-safe shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Name Checkpoints Descriptively</p>
                <p className="text-sm text-muted-foreground">
                  Use names like "pre-deploy-v2.5.0" or "after-db-migration" for easy identification.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border bg-sec-safe/5 border-sec-safe/30">
              <CheckCircle2 className="w-5 h-5 text-sec-safe shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Set Retention Policies</p>
                <p className="text-sm text-muted-foreground">
                  Configure how long checkpoints are retained. Default is 30 days.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border bg-sec-safe/5 border-sec-safe/30">
              <Shield className="w-5 h-5 text-sec-safe shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Protect Production Checkpoints</p>
                <p className="text-sm text-muted-foreground">
                  Production checkpoints require admin approval to delete or modify.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border bg-sec-warning/5 border-sec-warning/30">
              <AlertTriangle className="w-5 h-5 text-sec-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Test Rewind Procedures</p>
                <p className="text-sm text-muted-foreground">
                  Regularly test rewind capabilities in staging environments to ensure they work as expected.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

export default CheckpointsRewindDocs;
