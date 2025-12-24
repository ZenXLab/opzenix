import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, GitBranch, Lock, Unlock, CheckCircle2, X,
  AlertTriangle, Users, Eye
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export function BranchEnvironmentRulesDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>Governance</span>
          <span>/</span>
          <span className="text-foreground">Branch → Environment Rules</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GitBranch className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Branch → Environment Rules</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Core governance rules that map Git branches to deployment environments with lock enforcement.
          </p>
        </div>

        <Callout type="info" title="This is Core Governance">
          This is where Opzenix proves it's not just CI/CD — it's a <strong>Delivery Governance Control Plane</strong>.
        </Callout>

        <Separator className="my-8" />

        {/* Default Branch Mapping */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Default Branch Mapping (MVP 1.0.0)</h2>
          <p className="text-muted-foreground mb-4">
            Out of the box, Opzenix enforces these branch-to-environment mappings:
          </p>

          <Card className="mb-6">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch Pattern</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Lock Status</TableHead>
                    <TableHead>Approval</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-sm">feature/*</TableCell>
                    <TableCell>
                      <Badge className="bg-sec-safe/20 text-sec-safe border-sec-safe/30">DEV</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sec-safe">
                        <Unlock className="w-4 h-4" /> Unlocked
                      </span>
                    </TableCell>
                    <TableCell><X className="w-4 h-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">develop</TableCell>
                    <TableCell>
                      <Badge className="bg-sec-safe/20 text-sec-safe border-sec-safe/30">DEV</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sec-safe">
                        <Unlock className="w-4 h-4" /> Unlocked
                      </span>
                    </TableCell>
                    <TableCell><X className="w-4 h-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">release/*</TableCell>
                    <TableCell>
                      <Badge className="bg-sec-warning/20 text-sec-warning border-sec-warning/30">UAT</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sec-warning">
                        <Lock className="w-4 h-4" /> Locked
                      </span>
                    </TableCell>
                    <TableCell><CheckCircle2 className="w-4 h-4 text-sec-safe" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">main</TableCell>
                    <TableCell>
                      <Badge className="bg-sec-warning/20 text-sec-warning border-sec-warning/30">STAGING</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sec-warning">
                        <Lock className="w-4 h-4" /> Locked
                      </span>
                    </TableCell>
                    <TableCell><CheckCircle2 className="w-4 h-4 text-sec-safe" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">main (tagged)</TableCell>
                    <TableCell>
                      <Badge className="bg-sec-critical/20 text-sec-critical border-sec-critical/30">PROD</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sec-critical">
                        <Shield className="w-4 h-4" /> Hard Locked
                      </span>
                    </TableCell>
                    <TableCell><CheckCircle2 className="w-4 h-4 text-sec-safe" /> Mandatory</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-8" />

        {/* Enforcement Rules */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Enforcement Rules (Non-Negotiable)</h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-sec-critical/5 border border-sec-critical/30">
              <X className="w-5 h-5 text-sec-critical shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Branch not mapped → Execution blocked</p>
                <p className="text-sm text-muted-foreground">Unknown branches cannot deploy to any environment</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-sec-critical/5 border border-sec-critical/30">
              <X className="w-5 h-5 text-sec-critical shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Locked env without approval → Blocked</p>
                <p className="text-sm text-muted-foreground">No exceptions for locked environments</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-sec-critical/5 border border-sec-critical/30">
              <X className="w-5 h-5 text-sec-critical shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Unauthorized role → Blocked</p>
                <p className="text-sm text-muted-foreground">RBAC violations are rejected immediately</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-sec-safe/5 border border-sec-safe/30">
              <CheckCircle2 className="w-5 h-5 text-sec-safe shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Clear reason shown in Control Tower</p>
                <p className="text-sm text-muted-foreground">Developers always know why execution was blocked</p>
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* UX Behavior */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">UX Behavior</h2>
          <p className="text-muted-foreground mb-4">
            When a developer pushes to an invalid branch, they see a clear, actionable message:
          </p>

          <Card className="border-sec-critical/30 bg-sec-critical/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-sec-critical shrink-0" />
                <div>
                  <Badge variant="destructive" className="mb-2">Blocked</Badge>
                  <h4 className="font-semibold text-lg">Execution Blocked</h4>
                  <p className="text-muted-foreground mt-2">
                    Branch <code className="bg-background px-2 py-0.5 rounded mx-1">feature/foo</code> 
                    is not allowed to deploy to <strong>STAGING</strong>.
                  </p>
                  <div className="mt-4 p-3 rounded bg-background/50 text-sm">
                    <p className="font-medium mb-1">Allowed branches for STAGING:</p>
                    <code className="text-primary">main</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Callout type="info" title="This is Confidence, Not Friction">
            Clear governance messages help teams move faster by eliminating guesswork and manual coordination.
          </Callout>
        </section>

        <Separator className="my-8" />

        {/* Custom Rules */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Custom Branch Rules</h2>
          <p className="text-muted-foreground mb-4">
            You can customize branch mappings through the Control Tower UI or API:
          </p>

          <CodeBlock
            code={`{
  "branch_mappings": [
    {
      "pattern": "feature/*",
      "environment": "development",
      "locked": false,
      "requires_approval": false
    },
    {
      "pattern": "hotfix/*",
      "environment": "production",
      "locked": true,
      "requires_approval": true,
      "required_approvers": ["security-lead", "release-manager"]
    }
  ]
}`}
            language="json"
            title="branch-rules.json"
          />

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Pattern Syntax</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><code>*</code> — matches any characters</li>
                  <li><code>feature/*</code> — all feature branches</li>
                  <li><code>release/v*</code> — versioned releases</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Priority Order</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>1. Exact matches first</li>
                  <li>2. Specific patterns</li>
                  <li>3. Wildcard patterns last</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Environment Lock Visual Language */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Environment Lock Visual Language</h2>
          <p className="text-muted-foreground mb-4">
            Environment locks are displayed with consistent visual indicators:
          </p>

          <div className="grid grid-cols-3 gap-4">
            <Card className="ring-2 ring-sec-safe/30">
              <CardContent className="p-4 text-center">
                <Unlock className="w-8 h-8 text-sec-safe mx-auto mb-2" />
                <h4 className="font-medium">Unlocked</h4>
                <p className="text-xs text-muted-foreground">Green outline</p>
              </CardContent>
            </Card>
            <Card className="ring-2 ring-sec-warning/30">
              <CardContent className="p-4 text-center">
                <Lock className="w-8 h-8 text-sec-warning mx-auto mb-2" />
                <h4 className="font-medium">Locked</h4>
                <p className="text-xs text-muted-foreground">Amber outline</p>
              </CardContent>
            </Card>
            <Card className="ring-2 ring-sec-critical/50">
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 text-sec-critical mx-auto mb-2" />
                <h4 className="font-medium">Hard Locked</h4>
                <p className="text-xs text-muted-foreground">Red outline + shield</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

export default BranchEnvironmentRulesDocs;
