import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Lock, ArrowRight, CheckCircle2, Shield, Unlock,
  AlertTriangle, Clock, Users, LockOpen, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function EnvironmentLocksDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/docs" className="hover:text-foreground">Docs</Link>
          <span>/</span>
          <span>Governance</span>
          <span>/</span>
          <span className="text-foreground">Environment Locks</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Environment Locks</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Protect sensitive environments from unauthorized or accidental deployments 
            using Opzenix environment locks.
          </p>
        </div>

        <Separator className="my-8" />

        {/* Lock Types */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Lock Types</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-sec-safe/30">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-sec-safe/20 flex items-center justify-center mx-auto mb-3">
                  <Unlock className="w-6 h-6 text-sec-safe" />
                </div>
                <Badge className="bg-sec-safe/20 text-sec-safe mb-2">Unlocked</Badge>
                <h4 className="font-semibold">Open</h4>
                <p className="text-sm text-muted-foreground">
                  Deployments proceed without additional approval. Suitable for development environments.
                </p>
              </CardContent>
            </Card>

            <Card className="border-sec-warning/30">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-sec-warning/20 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-sec-warning" />
                </div>
                <Badge className="bg-sec-warning/20 text-sec-warning mb-2">Soft Lock</Badge>
                <h4 className="font-semibold">Approval Required</h4>
                <p className="text-sm text-muted-foreground">
                  Deployments require approval from authorized users. Standard for staging.
                </p>
              </CardContent>
            </Card>

            <Card className="border-sec-critical/30">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-sec-critical/20 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-sec-critical" />
                </div>
                <Badge className="bg-sec-critical/20 text-sec-critical mb-2">Hard Lock</Badge>
                <h4 className="font-semibold">Completely Blocked</h4>
                <p className="text-sm text-muted-foreground">
                  No deployments allowed. Used during incidents or maintenance windows.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Configuring Locks */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Configuring Environment Locks</h2>
          
          <Step number={1} title="Navigate to Environments">
            <p className="mb-4">
              Go to Control Tower → Environments to view all configured environments and their lock status.
            </p>
          </Step>

          <Step number={2} title="Set Lock Configuration">
            <p className="mb-4">
              Click on an environment to configure its lock settings.
            </p>
            <CodeBlock
              code={`{
  "environment": "production",
  "lock": {
    "isLocked": true,
    "lockType": "soft",
    "requiredRole": "admin",
    "requiresApproval": true,
    "reason": "Production requires admin approval for all deployments"
  }
}`}
              language="json"
              title="Lock Configuration"
            />
          </Step>

          <Step number={3} title="Configure Unlock Policies">
            <p className="mb-4">
              Define who can unlock environments and under what conditions.
            </p>
            <CodeBlock
              code={`{
  "unlockPolicies": {
    "allowedRoles": ["admin"],
    "requireMFA": true,
    "requireReason": true,
    "auditRequired": true,
    "autoRelockAfterMinutes": 60
  }
}`}
              language="json"
              title="Unlock Policy"
            />
          </Step>
        </section>

        <Separator className="my-8" />

        {/* Scheduled Locks */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Scheduled Locks</h2>
          <p className="text-muted-foreground mb-4">
            Configure automatic locks during specific time periods, such as weekends, 
            holidays, or change freeze windows.
          </p>
          
          <CodeBlock
            code={`{
  "scheduledLocks": [
    {
      "name": "Weekend Freeze",
      "environment": "production",
      "schedule": {
        "type": "recurring",
        "daysOfWeek": ["saturday", "sunday"],
        "startTime": "00:00",
        "endTime": "23:59",
        "timezone": "America/New_York"
      },
      "lockType": "hard",
      "reason": "No production deployments on weekends"
    },
    {
      "name": "Holiday Freeze",
      "environment": "production",
      "schedule": {
        "type": "range",
        "startDate": "2025-12-20",
        "endDate": "2026-01-02"
      },
      "lockType": "hard",
      "reason": "Holiday code freeze"
    },
    {
      "name": "Business Hours Only",
      "environment": "staging",
      "schedule": {
        "type": "recurring",
        "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"],
        "startTime": "09:00",
        "endTime": "18:00",
        "timezone": "America/New_York",
        "invertSchedule": true
      },
      "lockType": "soft",
      "reason": "Staging deployments outside business hours require approval"
    }
  ]
}`}
            language="json"
            title="Scheduled Lock Configuration"
          />

          <Callout type="info" title="Timezone Awareness">
            All scheduled locks respect the configured timezone. Teams in different regions 
            can have localized lock schedules.
          </Callout>
        </section>

        <Separator className="my-8" />

        {/* Emergency Unlock */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Emergency Unlock</h2>
          <p className="text-muted-foreground mb-4">
            In critical situations, authorized users can perform emergency unlocks with 
            enhanced audit logging.
          </p>
          
          <div className="p-4 rounded-lg border bg-sec-warning/5 border-sec-warning/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-sec-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-2">Emergency Unlock Process</h4>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li>1. Navigate to Environment → Lock Status</li>
                  <li>2. Click "Emergency Unlock"</li>
                  <li>3. Complete MFA verification</li>
                  <li>4. Provide detailed reason for unlock</li>
                  <li>5. Acknowledge audit notification</li>
                  <li>6. Environment unlocks with auto-relock timer</li>
                </ol>
              </div>
            </div>
          </div>

          <CodeBlock
            code={`# Emergency unlock via CLI
opzenix env unlock production \\
  --emergency \\
  --reason "Critical hotfix for payment processing bug" \\
  --ticket "INC-1234" \\
  --auto-relock 30m`}
            language="bash"
            title="CLI Emergency Unlock"
          />
        </section>

        {/* Lock Status Dashboard */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Lock Status Dashboard</h2>
          <p className="text-muted-foreground mb-4">
            The Control Tower dashboard displays real-time lock status for all environments:
          </p>
          
          <div className="space-y-3">
            <div className="p-4 rounded-lg border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-sec-safe animate-pulse" />
                <span className="font-medium">Development</span>
              </div>
              <Badge className="bg-sec-safe/20 text-sec-safe">Unlocked</Badge>
            </div>
            <div className="p-4 rounded-lg border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-sec-warning animate-pulse" />
                <span className="font-medium">Staging</span>
              </div>
              <Badge className="bg-sec-warning/20 text-sec-warning">Soft Lock</Badge>
            </div>
            <div className="p-4 rounded-lg border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-sec-critical animate-pulse" />
                <span className="font-medium">Production</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-sec-critical/20 text-sec-critical">Hard Lock</Badge>
                <span className="text-xs text-muted-foreground">Holiday Freeze</span>
              </div>
            </div>
          </div>
        </section>

        {/* Audit Trail */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Lock Audit Trail</h2>
          <p className="text-muted-foreground mb-4">
            All lock/unlock actions are recorded with full context for compliance:
          </p>
          
          <CodeBlock
            code={`{
  "auditEntry": {
    "id": "audit-uuid",
    "action": "environment.unlock",
    "environment": "production",
    "user": "admin@company.com",
    "timestamp": "2025-01-15T14:30:00Z",
    "reason": "Deploying critical security patch",
    "ticket": "SEC-789",
    "previousState": "hard_locked",
    "newState": "unlocked",
    "autoRelockAt": "2025-01-15T15:00:00Z",
    "mfaVerified": true,
    "ipAddress": "10.0.1.50"
  }
}`}
            language="json"
            title="Audit Log Entry"
          />
        </section>

        <Separator className="my-8" />

        {/* Next Steps */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <div className="space-y-3">
            <Link 
              to="/docs/governance/approval-workflows"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium">Configure Approval Workflows</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link 
              to="/docs/operations/audit-logs"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-medium">View Audit Logs</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

export default EnvironmentLocksDocs;
