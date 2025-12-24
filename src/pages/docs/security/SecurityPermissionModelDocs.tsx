import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Lock, Shield, Key, Eye, CheckCircle2, X,
  AlertTriangle, FileText, Database, Server
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

export function SecurityPermissionModelDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>Security</span>
          <span>/</span>
          <span className="text-foreground">Permission Model</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Permission Model</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Enterprise security architecture with defense-in-depth for CI/CD governance.
          </p>
        </div>

        <Callout type="success" title="Compliance Ready">
          This permission model is designed to meet SOC2, ISO 27001, and enterprise security requirements.
        </Callout>

        <Separator className="my-8" />

        {/* Security Layers */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Security Layers</h2>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sec-safe/10 rounded">
                    <Lock className="w-5 h-5 text-sec-safe" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Layer 1: Authentication</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      All requests require valid JWT tokens. Supports SSO, SAML, and OAuth providers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <Key className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Layer 2: Authorization (RBAC)</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Role-based access control with security definer functions. No client-side role checks.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sec-warning/10 rounded">
                    <Database className="w-5 h-5 text-sec-warning" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Layer 3: Row-Level Security (RLS)</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Database-level enforcement ensures data isolation even if application code is compromised.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-chart-1/10 rounded">
                    <FileText className="w-5 h-5 text-chart-1" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Layer 4: Audit Logging</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Every action is logged with user ID, timestamp, IP address, and full request details.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* GitHub Permissions */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">GitHub App Permissions</h2>
          <p className="text-muted-foreground mb-4">
            Opzenix requests minimal permissions — only what's necessary for governance:
          </p>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Justification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-sm">contents</TableCell>
                    <TableCell><Badge variant="outline">read</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Detect language/framework only</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">actions</TableCell>
                    <TableCell><Badge variant="outline">read</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Observe CI status</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">workflows</TableCell>
                    <TableCell><Badge variant="outline">write</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Trigger controlled deployments</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">checks</TableCell>
                    <TableCell><Badge variant="outline">write</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Report governance status</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">deployments</TableCell>
                    <TableCell><Badge variant="outline">write</Badge></TableCell>
                    <TableCell className="text-muted-foreground">Track environment deployments</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="mt-6 p-4 rounded-lg bg-sec-critical/5 border border-sec-critical/30">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-sec-critical shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-2">Never Requested</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-sec-critical/50">contents:write</Badge>
                  <Badge variant="outline" className="border-sec-critical/50">admin</Badge>
                  <Badge variant="outline" className="border-sec-critical/50">secrets</Badge>
                  <Badge variant="outline" className="border-sec-critical/50">issues:write</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Data Protection */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Data Protection</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Encryption at Rest
                </h4>
                <p className="text-sm text-muted-foreground">
                  All data encrypted using AES-256. Database encryption managed by Supabase/PostgreSQL.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Encryption in Transit
                </h4>
                <p className="text-sm text-muted-foreground">
                  All traffic uses TLS 1.3. No unencrypted connections accepted.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  Secrets Management
                </h4>
                <p className="text-sm text-muted-foreground">
                  Secrets never logged. Tokens encrypted before storage. Vault integration available.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" />
                  Environment Isolation
                </h4>
                <p className="text-sm text-muted-foreground">
                  Separate credentials per environment. No cross-environment data leakage.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Audit Trail */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Audit Trail</h2>
          <p className="text-muted-foreground mb-4">
            Every action in Opzenix is logged for compliance and forensics:
          </p>

          <CodeBlock
            code={`{
  "id": "uuid-here",
  "action": "environment_unlocked",
  "resource_type": "environment_lock",
  "resource_id": "lock-uuid",
  "user_id": "user-uuid",
  "created_at": "2024-01-15T10:30:00Z",
  "ip_address": "192.168.1.100",
  "details": {
    "environment": "production",
    "comment": "Approved release v2.5.0",
    "ticket_id": "JIRA-8721"
  }
}`}
            language="json"
            title="audit_log_entry.json"
          />

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-medium mb-2">Logged Actions</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Environment unlocks/locks</li>
                <li>• Deployment triggers</li>
                <li>• Rollback operations</li>
                <li>• Approval votes</li>
                <li>• Configuration changes</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-medium mb-2">Retention</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Default: 90 days</li>
                <li>• Enterprise: Configurable</li>
                <li>• Export to S3/Azure Blob</li>
                <li>• SIEM integration available</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

export default SecurityPermissionModelDocs;
