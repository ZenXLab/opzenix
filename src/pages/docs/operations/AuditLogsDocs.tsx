import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, ArrowRight, CheckCircle2, Shield, Search,
  Clock, Download, Filter, Eye, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function AuditLogsDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/docs" className="hover:text-foreground">Docs</Link>
          <span>/</span>
          <span>Operations</span>
          <span>/</span>
          <span className="text-foreground">Audit Logs</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Comprehensive audit logging for compliance, security investigations, 
            and operational visibility. SOC2 and ISO27001 compliant.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <Badge variant="outline" className="bg-sec-safe/10 text-sec-safe border-sec-safe/30">
            SOC2 Compliant
          </Badge>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            ISO27001
          </Badge>
        </div>

        <Separator className="my-8" />

        {/* What is Logged */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">What Gets Logged</h2>
          <p className="text-muted-foreground mb-4">
            Opzenix automatically captures detailed audit logs for all security-relevant events:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Authentication Events
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• User login/logout</li>
                  <li>• Failed login attempts</li>
                  <li>• Password changes</li>
                  <li>• MFA enrollment/verification</li>
                  <li>• Session creation/expiration</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-sec-safe" />
                  Authorization Events
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Role assignments</li>
                  <li>• Permission grants/revokes</li>
                  <li>• Access denied events</li>
                  <li>• Privilege escalation</li>
                  <li>• API key usage</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sec-warning" />
                  Deployment Events
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Execution started/completed</li>
                  <li>• Approval requests/votes</li>
                  <li>• Environment locks/unlocks</li>
                  <li>• Rollbacks performed</li>
                  <li>• Configuration changes</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-sec-critical" />
                  Security Events
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Secret access</li>
                  <li>• Connection modifications</li>
                  <li>• Policy violations</li>
                  <li>• Suspicious activity</li>
                  <li>• Data exports</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Audit Log Structure */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Audit Log Structure</h2>
          
          <CodeBlock
            code={`{
  "id": "audit-uuid-12345",
  "timestamp": "2025-01-15T14:30:00.000Z",
  "action": "deployment.execute",
  "resource_type": "execution",
  "resource_id": "exec-abc123",
  "user_id": "user-xyz789",
  "user_email": "admin@company.com",
  "user_role": "admin",
  "ip_address": "10.0.1.50",
  "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "session_id": "sess-456def",
  "details": {
    "environment": "production",
    "version": "v2.5.0",
    "branch": "main",
    "commit_sha": "abc123def456",
    "flow_template": "standard-cicd",
    "approval_status": "approved",
    "approvers": ["lead@company.com", "security@company.com"]
  },
  "result": "success",
  "duration_ms": 245,
  "geo_location": {
    "country": "US",
    "region": "California",
    "city": "San Francisco"
  }
}`}
            language="json"
            title="Audit Log Entry Example"
          />
        </section>

        {/* Viewing Audit Logs */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Viewing Audit Logs</h2>
          
          <Step number={1} title="Access Audit Log Viewer">
            <p className="mb-4">
              Navigate to Control Tower → Audit Logs to access the audit log viewer.
            </p>
          </Step>

          <Step number={2} title="Filter and Search">
            <p className="mb-4">
              Use filters to narrow down to specific events.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <div className="p-2 rounded border text-center text-sm">
                <Filter className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                Action Type
              </div>
              <div className="p-2 rounded border text-center text-sm">
                <Filter className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                User
              </div>
              <div className="p-2 rounded border text-center text-sm">
                <Filter className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                Date Range
              </div>
              <div className="p-2 rounded border text-center text-sm">
                <Filter className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                Environment
              </div>
            </div>
            <CodeBlock
              code={`# Query audit logs via API
GET /api/audit-logs?
  action=deployment.execute&
  environment=production&
  from=2025-01-01&
  to=2025-01-15&
  user=admin@company.com&
  limit=100`}
              language="bash"
              title="API Query"
            />
          </Step>

          <Step number={3} title="Export Logs">
            <p className="mb-4">
              Export audit logs for compliance reporting or external analysis.
            </p>
            <div className="flex gap-2">
              <Badge variant="outline">CSV</Badge>
              <Badge variant="outline">JSON</Badge>
              <Badge variant="outline">PDF Report</Badge>
            </div>
          </Step>
        </section>

        <Separator className="my-8" />

        {/* Compliance Features */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Compliance Features</h2>
          
          <div className="space-y-4">
            <Card className="border-sec-safe/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sec-safe shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Immutable Logs</h4>
                    <p className="text-sm text-muted-foreground">
                      Audit logs cannot be modified or deleted. They are append-only with 
                      cryptographic verification to detect tampering.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-sec-safe/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sec-safe shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Retention Policies</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure retention periods to meet compliance requirements. Default 
                      is 1 year with options for 3, 5, or 7 year retention.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-sec-safe/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sec-safe shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">SIEM Integration</h4>
                    <p className="text-sm text-muted-foreground">
                      Stream audit logs to external SIEM systems like Splunk, Datadog, 
                      or Azure Sentinel for centralized security monitoring.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-sec-safe/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sec-safe shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Access Controls</h4>
                    <p className="text-sm text-muted-foreground">
                      Only administrators can view audit logs. All access to audit logs 
                      is itself logged for complete chain of custody.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Log Streaming */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Log Streaming Configuration</h2>
          
          <CodeBlock
            code={`{
  "auditLogStreaming": {
    "enabled": true,
    "destinations": [
      {
        "type": "s3",
        "bucket": "company-audit-logs",
        "region": "us-east-1",
        "prefix": "opzenix/",
        "encryption": "AES256"
      },
      {
        "type": "splunk",
        "endpoint": "https://splunk.company.com:8088",
        "token": "$SPLUNK_HEC_TOKEN",
        "index": "opzenix_audit"
      },
      {
        "type": "azure_sentinel",
        "workspaceId": "$SENTINEL_WORKSPACE_ID",
        "sharedKey": "$SENTINEL_SHARED_KEY"
      }
    ],
    "batchSize": 100,
    "flushIntervalSeconds": 30
  }
}`}
            language="json"
            title="Streaming Configuration"
          />
        </section>

        {/* Compliance Reports */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Compliance Reports</h2>
          <p className="text-muted-foreground mb-4">
            Generate pre-built compliance reports for auditors:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card flex items-center gap-3">
              <Download className="w-5 h-5 text-primary" />
              <div>
                <h4 className="font-semibold">SOC2 Access Report</h4>
                <p className="text-sm text-muted-foreground">User access and authentication activity</p>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex items-center gap-3">
              <Download className="w-5 h-5 text-primary" />
              <div>
                <h4 className="font-semibold">Change Management Report</h4>
                <p className="text-sm text-muted-foreground">All deployments with approval chain</p>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex items-center gap-3">
              <Download className="w-5 h-5 text-primary" />
              <div>
                <h4 className="font-semibold">Privilege Usage Report</h4>
                <p className="text-sm text-muted-foreground">Admin actions and escalations</p>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex items-center gap-3">
              <Download className="w-5 h-5 text-primary" />
              <div>
                <h4 className="font-semibold">Security Incidents Report</h4>
                <p className="text-sm text-muted-foreground">Failed access and policy violations</p>
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Next Steps */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <div className="space-y-3">
            <Link 
              to="/docs/security/compliance-mapping"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-medium">Compliance Framework Mapping</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link 
              to="/docs/security/permission-model"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-primary" />
                <span className="font-medium">Permission Model</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

export default AuditLogsDocs;
