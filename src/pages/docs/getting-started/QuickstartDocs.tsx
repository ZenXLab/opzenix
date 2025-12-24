import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Rocket, CheckCircle2, ArrowRight, Github, Cloud, 
  Terminal, Settings, Shield, Play, Eye, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function QuickstartDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>Getting Started</span>
          <span>/</span>
          <span className="text-foreground">Quickstart Guide</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Quickstart Guide</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Get Opzenix up and running in 5 minutes. Follow these steps to connect your first repository
            and deploy with governance.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" /> 5 minutes
          </Badge>
          <Badge variant="outline">Beginner</Badge>
        </div>

        <Callout type="info" title="Prerequisites">
          <ul className="space-y-1 mt-2">
            <li>• GitHub account with at least one repository</li>
            <li>• Admin access to install GitHub Apps (for org repos)</li>
            <li>• Modern browser (Chrome, Firefox, Safari, Edge)</li>
          </ul>
        </Callout>

        <Separator className="my-8" />

        {/* Step 1 */}
        <section className="mb-10">
          <Step number={1} title="Create Your Account">
            <p className="mb-4">
              Start by creating your Opzenix account. You can sign up with email or use Google OAuth.
            </p>
            
            <CodeBlock
              code={`# Navigate to the auth page
https://your-opzenix-instance.com/auth

# Or sign in with Google OAuth for faster onboarding`}
              language="bash"
              title="Authentication"
            />

            <div className="mt-4 p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-medium mb-2">During Sign Up</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Enter your <strong>full name</strong> and <strong>email</strong></li>
                <li>• Optionally add your <strong>company name</strong></li>
                <li>• Create a secure password (8+ characters)</li>
              </ul>
            </div>
          </Step>
        </section>

        {/* Step 2 */}
        <section className="mb-10">
          <Step number={2} title="Connect GitHub">
            <p className="mb-4">
              Install the Opzenix GitHub App to connect your repositories. This enables
              webhook-driven deployments and governance.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <CheckCircle2 className="w-5 h-5 text-sec-safe shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Go to Connections</p>
                  <p className="text-sm text-muted-foreground">Navigate to Control Tower → Connections</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <CheckCircle2 className="w-5 h-5 text-sec-safe shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Add GitHub Connection</p>
                  <p className="text-sm text-muted-foreground">Click "Add Connection" and select GitHub</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <CheckCircle2 className="w-5 h-5 text-sec-safe shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Enter Your Token</p>
                  <p className="text-sm text-muted-foreground">Paste your GitHub Personal Access Token with required scopes</p>
                </div>
              </div>
            </div>

            <CodeBlock
              code={`# Required GitHub token scopes:
repo           # Full control of repositories
workflow       # Update GitHub Action workflows
read:org       # Read org membership (for org repos)

# Generate token at:
https://github.com/settings/tokens/new`}
              language="bash"
              title="GitHub Token Scopes"
            />
          </Step>
        </section>

        {/* Step 3 */}
        <section className="mb-10">
          <Step number={3} title="Configure Your First Environment">
            <p className="mb-4">
              Set up deployment environments with policies. Start with Development, then add
              Staging and Production.
            </p>

            <CodeBlock
              code={`# Environment Configuration Example
{
  "name": "Development",
  "environment": "development",
  "strategy": "rolling",
  "approvalRequired": false,
  "guardrails": {
    "healthCheckRequired": true,
    "rollbackOnFailure": true
  }
}`}
              language="json"
              title="dev-environment.json"
            />

            <div className="mt-4 grid grid-cols-3 gap-3">
              <Card className="border-sec-safe/30">
                <CardContent className="p-4 text-center">
                  <Badge className="bg-sec-safe/20 text-sec-safe mb-2">DEV</Badge>
                  <p className="text-xs text-muted-foreground">No approval needed</p>
                </CardContent>
              </Card>
              <Card className="border-sec-warning/30">
                <CardContent className="p-4 text-center">
                  <Badge className="bg-sec-warning/20 text-sec-warning mb-2">STAGING</Badge>
                  <p className="text-xs text-muted-foreground">1 approver required</p>
                </CardContent>
              </Card>
              <Card className="border-sec-critical/30">
                <CardContent className="p-4 text-center">
                  <Badge className="bg-sec-critical/20 text-sec-critical mb-2">PROD</Badge>
                  <p className="text-xs text-muted-foreground">2 approvers + admin</p>
                </CardContent>
              </Card>
            </div>
          </Step>
        </section>

        {/* Step 4 */}
        <section className="mb-10">
          <Step number={4} title="Trigger Your First Deployment">
            <p className="mb-4">
              Push code to your repository or manually trigger a deployment from the Control Tower.
            </p>

            <CodeBlock
              code={`# Option 1: Push to trigger
git checkout -b feature/my-feature
git commit -am "Add new feature"
git push origin feature/my-feature

# Option 2: Manual trigger via Control Tower
# Go to Executions → New Execution → Select Pipeline`}
              language="bash"
              title="Trigger Deployment"
            />

            <Callout type="success" title="You Should See">
              <ul className="space-y-1 mt-2">
                <li>• A new execution appears in the Executions panel</li>
                <li>• Real-time node status updates in the Flow view</li>
                <li>• Logs streaming for each pipeline stage</li>
              </ul>
            </Callout>
          </Step>
        </section>

        {/* Step 5 */}
        <section className="mb-10">
          <Step number={5} title="Monitor and Approve">
            <p className="mb-4">
              Watch your deployment progress in real-time. For locked environments, 
              approve the deployment to proceed.
            </p>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/30">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Real-Time Monitoring
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Live Status</p>
                  <p className="text-muted-foreground">Node-by-node execution status</p>
                </div>
                <div>
                  <p className="font-medium">Streaming Logs</p>
                  <p className="text-muted-foreground">Real-time log output per stage</p>
                </div>
                <div>
                  <p className="font-medium">Checkpoints</p>
                  <p className="text-muted-foreground">Automatic state capture points</p>
                </div>
                <div>
                  <p className="font-medium">Governance</p>
                  <p className="text-muted-foreground">Approval gates and locks</p>
                </div>
              </div>
            </div>
          </Step>
        </section>

        <Separator className="my-8" />

        {/* What's Next */}
        <section>
          <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
          <div className="space-y-3">
            <Link 
              to="/docs/setup-guides/github-app"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Github className="w-5 h-5 text-primary" />
                <div>
                  <span className="font-medium">Install GitHub App</span>
                  <p className="text-sm text-muted-foreground">For organization-wide deployments</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link 
              to="/docs/governance/branch-environment-rules"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <span className="font-medium">Configure Branch Rules</span>
                  <p className="text-sm text-muted-foreground">Map branches to environments</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link 
              to="/docs/governance/rbac-model"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-primary" />
                <div>
                  <span className="font-medium">Set Up RBAC</span>
                  <p className="text-sm text-muted-foreground">Role-based access control</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

export default QuickstartDocs;
