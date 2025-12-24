import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Lock, Shield, Users, Eye, CheckCircle2, X,
  AlertTriangle, FileText, Clock
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

export function RBACModelDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>Governance</span>
          <span>/</span>
          <span className="text-foreground">RBAC Model</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">RBAC Model</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Role-Based Access Control for enterprise-grade environment governance.
          </p>
        </div>

        <Callout type="info" title="Enterprise-Grade Security">
          The RBAC model ensures least-privilege access while enabling teams to move fast with confidence.
        </Callout>

        <Separator className="my-8" />

        {/* Roles Overview */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Role Definitions</h2>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Viewer</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Read-only access to all dashboards, executions, and audit logs.
                      Cannot trigger deployments or modify configurations.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline">View dashboards</Badge>
                      <Badge variant="outline">Read logs</Badge>
                      <Badge variant="outline">View history</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-chart-1 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Developer</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Can trigger deployments to DEV environments. Cannot unlock locked environments
                      or deploy to production.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline">Deploy to DEV</Badge>
                      <Badge variant="outline">View all envs</Badge>
                      <Badge variant="outline">Create checkpoints</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-sec-warning shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Operator</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Can unlock DEV/UAT/Staging environments. Can manage connections and configurations.
                      Cannot unlock Production without approval.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline">Unlock DEV/UAT</Badge>
                      <Badge variant="outline">Manage connections</Badge>
                      <Badge variant="outline">Configure pipelines</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sec-safe shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Approver</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Can approve deployments to UAT/Staging. Required for production approval flows.
                      Typically Release Managers or Tech Leads.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline">Approve UAT/Staging</Badge>
                      <Badge variant="outline">Review executions</Badge>
                      <Badge variant="outline">Cast approval votes</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Admin</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Full access to all environments including Production. Can manage users, roles,
                      and organization settings. Required for Production unlocks.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Badge>Full access</Badge>
                      <Badge variant="outline">Manage users</Badge>
                      <Badge variant="outline">Unlock PROD</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Permission Matrix */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Environment Permission Matrix</h2>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">DEV</TableHead>
                    <TableHead className="text-center">UAT</TableHead>
                    <TableHead className="text-center">STAGING</TableHead>
                    <TableHead className="text-center">PROD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Viewer</TableCell>
                    <TableCell className="text-center text-lg">👁</TableCell>
                    <TableCell className="text-center text-lg">👁</TableCell>
                    <TableCell className="text-center text-lg">👁</TableCell>
                    <TableCell className="text-center text-lg">👁</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Developer</TableCell>
                    <TableCell className="text-center text-lg">✅</TableCell>
                    <TableCell className="text-center text-lg">❌</TableCell>
                    <TableCell className="text-center text-lg">❌</TableCell>
                    <TableCell className="text-center text-lg">❌</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Operator</TableCell>
                    <TableCell className="text-center text-lg">✅</TableCell>
                    <TableCell className="text-center text-lg">🔓</TableCell>
                    <TableCell className="text-center text-lg">❌</TableCell>
                    <TableCell className="text-center text-lg">❌</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Approver</TableCell>
                    <TableCell className="text-center text-lg">❌</TableCell>
                    <TableCell className="text-center text-lg">✅</TableCell>
                    <TableCell className="text-center text-lg">✅</TableCell>
                    <TableCell className="text-center text-lg">❌</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Admin</TableCell>
                    <TableCell className="text-center text-lg">✅</TableCell>
                    <TableCell className="text-center text-lg">✅</TableCell>
                    <TableCell className="text-center text-lg">✅</TableCell>
                    <TableCell className="text-center text-lg">🔓</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
            <span>👁 View only</span>
            <span>✅ Full access</span>
            <span>🔓 Can unlock</span>
            <span>❌ No access</span>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Production Unlock Requirements */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Production Unlock Requirements</h2>
          
          <Callout type="danger" title="Production is Sacred">
            Unlocking Production always requires additional verification beyond role permissions.
          </Callout>

          <Card className="mt-6 border-sec-critical/30">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-sec-critical" />
                Production Unlock Checklist
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded bg-muted/30">
                  <CheckCircle2 className="w-5 h-5 text-sec-safe shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Admin Role Required</p>
                    <p className="text-sm text-muted-foreground">Only Admins can unlock Production</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded bg-muted/30">
                  <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Unlock Comment Required</p>
                    <p className="text-sm text-muted-foreground">Must provide reason for unlock</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded bg-muted/30">
                  <AlertTriangle className="w-5 h-5 text-sec-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Change Ticket ID Required</p>
                    <p className="text-sm text-muted-foreground">JIRA, ServiceNow, or similar reference</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded bg-muted/30">
                  <Clock className="w-5 h-5 text-chart-1 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Audit Log Entry</p>
                    <p className="text-sm text-muted-foreground">All actions recorded with timestamp and user</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-8" />

        {/* Implementation */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Implementation</h2>
          <p className="text-muted-foreground mb-4">
            Roles are stored in a dedicated table with security definer functions:
          </p>

          <CodeBlock
            code={`-- Role enum
CREATE TYPE app_role AS ENUM ('admin', 'operator', 'viewer');

-- User roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Security definer function to check roles
CREATE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;`}
            language="sql"
            title="schema.sql"
          />

          <Callout type="warning" title="Security Note">
            Roles are stored in a separate table, never in the user profile or JWT claims. 
            This prevents privilege escalation attacks.
          </Callout>
        </section>
      </div>
    </DocsLayout>
  );
}

export default RBACModelDocs;
