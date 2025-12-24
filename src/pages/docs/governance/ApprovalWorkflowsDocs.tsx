import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  UserCheck, ArrowRight, CheckCircle2, Shield, Users,
  Clock, Bell, MessageSquare, AlertTriangle, Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function ApprovalWorkflowsDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/docs" className="hover:text-foreground">Docs</Link>
          <span>/</span>
          <span>Governance</span>
          <span>/</span>
          <span className="text-foreground">Approval Workflows</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserCheck className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Approval Workflows</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Configure multi-stage approval workflows to ensure proper review and authorization 
            before deployments proceed to sensitive environments.
          </p>
        </div>

        <Separator className="my-8" />

        {/* Why Approval Workflows */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Why Approval Workflows?</h2>
          <p className="text-muted-foreground mb-4">
            Approval workflows provide a human checkpoint in your automated deployment pipeline. 
            They are essential for:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <Shield className="w-5 h-5 text-primary mb-2" />
                <h4 className="font-semibold">Compliance Requirements</h4>
                <p className="text-sm text-muted-foreground">
                  SOC2, ISO27001, and HIPAA require documented approval processes for production changes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Users className="w-5 h-5 text-sec-safe mb-2" />
                <h4 className="font-semibold">Change Management</h4>
                <p className="text-sm text-muted-foreground">
                  Ensure changes are reviewed by appropriate stakeholders before deployment.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <AlertTriangle className="w-5 h-5 text-sec-warning mb-2" />
                <h4 className="font-semibold">Risk Mitigation</h4>
                <p className="text-sm text-muted-foreground">
                  Prevent accidental deployments to production and catch issues before they impact users.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <MessageSquare className="w-5 h-5 text-chart-1 mb-2" />
                <h4 className="font-semibold">Audit Trail</h4>
                <p className="text-sm text-muted-foreground">
                  Maintain complete records of who approved what and when for audit purposes.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Approval Request Lifecycle */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Approval Request Lifecycle</h2>
          
          <div className="p-6 rounded-lg bg-muted/30 border mb-6">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sec-warning/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-sec-warning" />
                </div>
                <span>Pending</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <span>Notified</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-chart-1/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-chart-1" />
                </div>
                <span>Voting</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sec-safe/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                </div>
                <span>Approved</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-sec-warning/20 text-sec-warning">Pending</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Execution is paused. Approval request created and waiting for reviewers.
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-primary/20 text-primary">Notified</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Notifications sent to designated approvers via email, Slack, or Teams.
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-chart-1/20 text-chart-1">Voting</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Approvers review changes and cast their votes. Comments can be added.
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-sec-safe/20 text-sec-safe">Approved</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Threshold met. Execution resumes automatically. Full audit trail recorded.
              </p>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Configuring Approvals */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Configuring Approval Gates</h2>
          
          <Step number={1} title="Add Approval Node to Flow">
            <p className="mb-4">
              Include an approval node in your flow template where you want the pipeline to pause for review.
            </p>
            <CodeBlock
              code={`{
  "id": "prod-approval",
  "type": "approval",
  "name": "Production Deployment Approval",
  "config": {
    "requiredApprovals": 2,
    "allowedRoles": ["admin", "operator"],
    "timeoutHours": 24,
    "autoRejectOnTimeout": true
  }
}`}
              language="json"
              title="Approval Node Configuration"
            />
          </Step>

          <Step number={2} title="Configure Notification Channels">
            <p className="mb-4">
              Set up notifications to alert approvers when their review is needed.
            </p>
            <CodeBlock
              code={`{
  "notifications": {
    "slack": {
      "enabled": true,
      "channel": "#deployments",
      "mentionUsers": ["@oncall-lead"]
    },
    "email": {
      "enabled": true,
      "recipients": ["platform-team@company.com"]
    },
    "teams": {
      "enabled": true,
      "webhookUrl": "https://outlook.office.com/webhook/..."
    }
  }
}`}
              language="json"
              title="Notification Configuration"
            />
          </Step>

          <Step number={3} title="Define Approval Policies">
            <p className="mb-4">
              Create policies that determine approval requirements based on context.
            </p>
            <CodeBlock
              code={`{
  "approvalPolicies": [
    {
      "name": "production-deploy",
      "environment": "production",
      "conditions": {
        "requiredApprovals": 2,
        "requiredRoles": ["admin"],
        "requireDifferentApprovers": true,
        "blockSelfApproval": true
      }
    },
    {
      "name": "staging-deploy", 
      "environment": "staging",
      "conditions": {
        "requiredApprovals": 1,
        "requiredRoles": ["admin", "operator"]
      }
    },
    {
      "name": "hotfix-fast-track",
      "labels": ["hotfix", "critical"],
      "conditions": {
        "requiredApprovals": 1,
        "requiredRoles": ["admin"],
        "timeoutHours": 1
      }
    }
  ]
}`}
              language="json"
              title="Approval Policies"
            />
          </Step>
        </section>

        <Separator className="my-8" />

        {/* Approval Actions */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Approver Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-sec-safe/30">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-sec-safe mx-auto mb-2" />
                <h4 className="font-semibold">Approve</h4>
                <p className="text-sm text-muted-foreground">
                  Cast a positive vote. Optionally add a comment.
                </p>
              </CardContent>
            </Card>

            <Card className="border-sec-critical/30">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="w-8 h-8 text-sec-critical mx-auto mb-2" />
                <h4 className="font-semibold">Reject</h4>
                <p className="text-sm text-muted-foreground">
                  Block deployment. Requires explanation comment.
                </p>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardContent className="p-4 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <h4 className="font-semibold">Request Changes</h4>
                <p className="text-sm text-muted-foreground">
                  Ask for modifications before approving.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
          
          <div className="space-y-3">
            <Callout type="success" title="Require Multiple Approvers">
              For production deployments, require at least 2 approvers from different teams 
              to prevent single points of failure.
            </Callout>

            <Callout type="info" title="Set Reasonable Timeouts">
              Configure timeouts that balance urgency with review quality. 24 hours for 
              standard deployments, 1-4 hours for hotfixes.
            </Callout>

            <Callout type="warning" title="Block Self-Approval">
              Enable the "blockSelfApproval" flag to prevent the person who triggered 
              the deployment from approving it themselves.
            </Callout>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Next Steps */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <div className="space-y-3">
            <Link 
              to="/docs/governance/environment-locks"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-primary" />
                <span className="font-medium">Configure Environment Locks</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link 
              to="/docs/governance/rbac-model"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium">Understand RBAC Model</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

export default ApprovalWorkflowsDocs;
