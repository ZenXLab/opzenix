import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  ClipboardCheck, ArrowRight, CheckCircle2, Shield,
  FileText, Download, AlertTriangle, Lock, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function ComplianceMappingDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/docs" className="hover:text-foreground">Docs</Link>
          <span>/</span>
          <span>Security</span>
          <span>/</span>
          <span className="text-foreground">Compliance Mapping</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Compliance Mapping</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            How Opzenix features map to major compliance frameworks including SOC2, 
            ISO27001, HIPAA, and PCI-DSS.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <Badge className="bg-sec-safe/20 text-sec-safe">SOC2 Type II</Badge>
          <Badge className="bg-primary/20 text-primary">ISO 27001</Badge>
          <Badge className="bg-sec-warning/20 text-sec-warning">HIPAA</Badge>
          <Badge className="bg-chart-1/20 text-chart-1">PCI-DSS</Badge>
        </div>

        <Separator className="my-8" />

        {/* SOC2 Mapping */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-sec-safe" />
            SOC2 Trust Service Criteria
          </h2>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge className="bg-sec-safe/20 text-sec-safe">CC6.1</Badge>
                  Logical Access Controls
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-0.5" />
                    <span><strong>RBAC Model:</strong> Role-based access control with admin, operator, viewer roles</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-0.5" />
                    <span><strong>Environment Locks:</strong> Prevent unauthorized deployments to sensitive environments</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-0.5" />
                    <span><strong>Approval Workflows:</strong> Multi-approver gates for production changes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge className="bg-sec-safe/20 text-sec-safe">CC7.2</Badge>
                  System Operations Monitoring
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-0.5" />
                    <span><strong>Audit Logs:</strong> Immutable, comprehensive logging of all actions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-0.5" />
                    <span><strong>Real-time Monitoring:</strong> Execution visibility with OpenTelemetry integration</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-0.5" />
                    <span><strong>Alerting:</strong> Configurable notifications for anomalous activity</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge className="bg-sec-safe/20 text-sec-safe">CC8.1</Badge>
                  Change Management
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-0.5" />
                    <span><strong>Approval Gates:</strong> Required approvals before production deployments</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-0.5" />
                    <span><strong>Version Tracking:</strong> Complete history of all deployments with commit references</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0 mt-0.5" />
                    <span><strong>Rollback Capability:</strong> Checkpoint-based recovery for failed changes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* ISO 27001 Mapping */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            ISO 27001 Controls
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Control</th>
                  <th className="text-left p-3 font-semibold">Description</th>
                  <th className="text-left p-3 font-semibold">Opzenix Feature</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3"><Badge variant="outline">A.9.2</Badge></td>
                  <td className="p-3 text-muted-foreground">User access management</td>
                  <td className="p-3">RBAC, SSO integration</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3"><Badge variant="outline">A.12.1</Badge></td>
                  <td className="p-3 text-muted-foreground">Operational procedures</td>
                  <td className="p-3">Flow templates, approval workflows</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3"><Badge variant="outline">A.12.4</Badge></td>
                  <td className="p-3 text-muted-foreground">Logging and monitoring</td>
                  <td className="p-3">Audit logs, telemetry</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3"><Badge variant="outline">A.14.2</Badge></td>
                  <td className="p-3 text-muted-foreground">Secure development</td>
                  <td className="p-3">Security gates, vulnerability scanning</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3"><Badge variant="outline">A.16.1</Badge></td>
                  <td className="p-3 text-muted-foreground">Incident management</td>
                  <td className="p-3">Rollbacks, checkpoints, alerting</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <Separator className="my-8" />

        {/* HIPAA */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-sec-warning" />
            HIPAA Safeguards
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Administrative Safeguards</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Access authorization policies (RBAC)</li>
                  <li>• Workforce training (audit trails)</li>
                  <li>• Security incident procedures (alerting)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Technical Safeguards</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Unique user identification (SSO)</li>
                  <li>• Automatic logoff (session management)</li>
                  <li>• Encryption (TLS 1.3, AES-256)</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Callout type="warning" title="BAA Required">
            For HIPAA-covered entities, ensure you have a Business Associate Agreement 
            in place with Opzenix before processing ePHI through the platform.
          </Callout>
        </section>

        {/* PCI-DSS */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-chart-1" />
            PCI-DSS Requirements
          </h2>
          
          <div className="space-y-3">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-chart-1/20 text-chart-1">Req 6</Badge>
                <span className="font-medium">Develop and Maintain Secure Systems</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Change control processes with approval workflows</li>
                <li>✓ Security vulnerability scanning in pipelines</li>
                <li>✓ Separation of development and production environments</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-chart-1/20 text-chart-1">Req 7</Badge>
                <span className="font-medium">Restrict Access to Cardholder Data</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Role-based access control (RBAC)</li>
                <li>✓ Environment locks for production</li>
                <li>✓ Principle of least privilege enforcement</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-chart-1/20 text-chart-1">Req 10</Badge>
                <span className="font-medium">Track and Monitor All Access</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Comprehensive audit logging</li>
                <li>✓ User activity tracking</li>
                <li>✓ Log retention (configurable up to 7 years)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Compliance Reports */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Compliance Reports</h2>
          <p className="text-muted-foreground mb-4">
            Generate audit-ready reports for compliance assessments:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card flex items-center gap-3">
              <Download className="w-5 h-5 text-primary" />
              <div>
                <h4 className="font-semibold">SOC2 Evidence Package</h4>
                <p className="text-sm text-muted-foreground">Access controls, change management, monitoring</p>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex items-center gap-3">
              <Download className="w-5 h-5 text-primary" />
              <div>
                <h4 className="font-semibold">ISO 27001 Annex A Mapping</h4>
                <p className="text-sm text-muted-foreground">Control implementation evidence</p>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex items-center gap-3">
              <Download className="w-5 h-5 text-primary" />
              <div>
                <h4 className="font-semibold">User Access Review</h4>
                <p className="text-sm text-muted-foreground">Quarterly access certification report</p>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex items-center gap-3">
              <Download className="w-5 h-5 text-primary" />
              <div>
                <h4 className="font-semibold">Change Management Log</h4>
                <p className="text-sm text-muted-foreground">Complete deployment history with approvals</p>
              </div>
            </div>
          </div>
        </section>

        {/* Auditor Access */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Auditor Access</h2>
          <p className="text-muted-foreground mb-4">
            Provide read-only access to auditors for compliance assessments:
          </p>
          
          <CodeBlock
            code={`{
  "auditorAccess": {
    "email": "auditor@kpmg.com",
    "role": "auditor",
    "permissions": [
      "audit_logs:read",
      "executions:read",
      "configurations:read",
      "users:read"
    ],
    "restrictions": {
      "readOnly": true,
      "noSecretAccess": true,
      "expiresAt": "2025-03-01T00:00:00Z"
    },
    "auditPurpose": "SOC2 Type II Annual Audit"
  }
}`}
            language="json"
            title="Auditor Access Configuration"
          />
        </section>

        <Separator className="my-8" />

        {/* Next Steps */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <div className="space-y-3">
            <Link 
              to="/docs/operations/audit-logs"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-medium">Configure Audit Logs</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link 
              to="/docs/governance/rbac-model"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium">RBAC Model</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

export default ComplianceMappingDocs;
