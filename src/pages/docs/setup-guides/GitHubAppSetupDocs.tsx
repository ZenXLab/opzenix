import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Github, Shield, Copy, CheckCircle2, AlertTriangle,
  ExternalLink, Webhook, Lock, Eye, Play, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function GitHubAppSetupDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>Setup Guides</span>
          <span>/</span>
          <span className="text-foreground">Install GitHub App</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Github className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Install GitHub App</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Connect your GitHub repositories with enterprise-grade permissions for CI/CD governance.
          </p>
        </div>

        {/* Prerequisites */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Prerequisites</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-1" />
              <span>GitHub organization or personal account</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-1" />
              <span>Admin access to create GitHub Apps</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-1" />
              <span>Opzenix account with Control Tower access</span>
            </li>
          </ul>
        </section>

        <Separator className="my-8" />

        {/* Permission Manifest */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Permission Manifest</h2>
          <p className="text-muted-foreground mb-4">
            This is the minimum + sufficient permission set for an enterprise control plane.
            No overreach, no security red flags.
          </p>

          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="p-4 bg-muted/30 border-b">
                <h3 className="font-mono text-sm font-medium">Repository Permissions</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Why Opzenix Needs It</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-sm">actions</TableCell>
                    <TableCell><Badge variant="outline">read</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Observe CI execution status</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">workflows</TableCell>
                    <TableCell><Badge variant="outline">write</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Trigger workflow_dispatch</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">checks</TableCell>
                    <TableCell><Badge variant="outline">write</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Report governed status</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">deployments</TableCell>
                    <TableCell><Badge variant="outline">write</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Track environment deployments</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">contents</TableCell>
                    <TableCell><Badge variant="outline">read</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Detect language, framework</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">pull_requests</TableCell>
                    <TableCell><Badge variant="outline">read</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Branch & PR governance</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">metadata</TableCell>
                    <TableCell><Badge variant="outline">read</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Repo identity (safe default)</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Callout type="success" title="SOC2 / ISO Compliant">
            This permission set passes enterprise security reviews including SOC2, ISO 27001, 
            and bank security audits.
          </Callout>

          <div className="mt-6 p-4 rounded-lg bg-sec-critical/5 border border-sec-critical/30">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-sec-critical shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-2">Explicitly NOT Requested</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-sec-critical/50">contents:write</Badge>
                  <Badge variant="outline" className="border-sec-critical/50">issues</Badge>
                  <Badge variant="outline" className="border-sec-critical/50">admin</Badge>
                  <Badge variant="outline" className="border-sec-critical/50">secrets</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Step by Step */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-6">Step-by-Step Setup</h2>

          <Step number={1} title="Create a New GitHub App">
            <p className="mb-3">Navigate to your GitHub organization or personal settings:</p>
            <CodeBlock 
              code="Settings → Developer Settings → GitHub Apps → New GitHub App"
              language="text"
            />
            <p className="mt-3">Or click this direct link:</p>
            <Button variant="outline" className="gap-2 mt-2" asChild>
              <a href="https://github.com/settings/apps/new" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Create GitHub App
              </a>
            </Button>
          </Step>

          <Step number={2} title="Configure App Settings">
            <p className="mb-3">Fill in the required fields:</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 rounded bg-muted/30">
                <span className="font-medium w-32 shrink-0">App Name:</span>
                <code className="bg-background px-2 py-0.5 rounded">opzenix-control-plane</code>
              </div>
              <div className="flex items-start gap-3 p-3 rounded bg-muted/30">
                <span className="font-medium w-32 shrink-0">Homepage URL:</span>
                <code className="bg-background px-2 py-0.5 rounded">https://your-opzenix-instance.com</code>
              </div>
              <div className="flex items-start gap-3 p-3 rounded bg-muted/30">
                <span className="font-medium w-32 shrink-0">Webhook URL:</span>
                <code className="bg-background px-2 py-0.5 rounded text-xs">https://[PROJECT_ID].supabase.co/functions/v1/github-webhook</code>
              </div>
            </div>
          </Step>

          <Step number={3} title="Set Permissions">
            <p className="mb-3">Configure the exact permissions from the manifest above:</p>
            <CodeBlock
              code={`Repository permissions:
  actions: read
  checks: write
  contents: read
  deployments: write
  pull_requests: read
  workflows: write
  metadata: read`}
              language="yaml"
              title="permissions.yml"
            />
          </Step>

          <Step number={4} title="Subscribe to Webhook Events">
            <p className="mb-3">Enable the following webhook events:</p>
            <div className="grid grid-cols-2 gap-2 my-4">
              {['push', 'pull_request', 'workflow_run', 'check_run', 'check_suite', 'deployment', 'deployment_status'].map((event) => (
                <div key={event} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                  <code>{event}</code>
                </div>
              ))}
            </div>
          </Step>

          <Step number={5} title="Generate Webhook Secret">
            <p className="mb-3">Generate a secure webhook secret:</p>
            <CodeBlock
              code="openssl rand -hex 32"
              language="bash"
              title="Terminal"
            />
            <Callout type="warning" title="Save This Secret">
              Store this secret securely. You'll need it for webhook verification and it won't be shown again.
            </Callout>
          </Step>

          <Step number={6} title="Install the App">
            <p className="mb-3">After creating the app:</p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Go to the app's settings page</li>
              <li>Click "Install App" in the left sidebar</li>
              <li>Select your organization</li>
              <li>Choose "All repositories" or specific repositories</li>
              <li>Click "Install" to authorize</li>
            </ol>
          </Step>

          <Step number={7} title="Configure Opzenix">
            <p className="mb-3">In your Opzenix Control Tower:</p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Go to Connections → Add Connection</li>
              <li>Select "GitHub App"</li>
              <li>Enter your App ID (found in app settings)</li>
              <li>Enter your Installation ID (from the URL after installing)</li>
              <li>Paste your webhook secret</li>
              <li>Click "Verify & Connect"</li>
            </ol>
          </Step>
        </section>

        <Separator className="my-8" />

        {/* Verification */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Verify the Connection</h2>
          <p className="text-muted-foreground mb-4">
            After setup, verify the connection is working:
          </p>

          <CodeBlock
            code={`# Test webhook delivery
curl -X POST https://your-instance/functions/v1/github-webhook \\
  -H "Content-Type: application/json" \\
  -H "X-GitHub-Event: ping" \\
  -d '{"zen": "test"}'

# Expected response
{"success": true, "message": "pong"}`}
            language="bash"
            title="Test Webhook"
          />

          <p className="text-muted-foreground mt-4">
            You should also see the connection status as "Connected" in your Opzenix dashboard.
          </p>
        </section>

        {/* Troubleshooting */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Webhook not receiving events?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Check the webhook URL is correct and publicly accessible</li>
                  <li>• Verify the webhook secret matches in both GitHub and Opzenix</li>
                  <li>• Check GitHub's webhook delivery logs for errors</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Permission denied errors?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ensure all required permissions are granted</li>
                  <li>• Reinstall the app if permissions were changed</li>
                  <li>• Check the app is installed on the correct repositories</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Installation ID not found?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• The Installation ID is in the URL: /settings/installations/[ID]</li>
                  <li>• Make sure the app is actually installed (not just created)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

export default GitHubAppSetupDocs;
