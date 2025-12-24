import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Rocket, Shield, GitBranch, Eye, Play, Lock, 
  CheckCircle2, ArrowRight, Github, Cloud, Terminal,
  Zap, RefreshCw, Activity, Database, Users, Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function IntroductionDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>Getting Started</span>
          <span>/</span>
          <span className="text-foreground">Introduction</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Introduction to Opzenix</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Opzenix is the Delivery Governance Control Plane that brings enterprise-grade governance, 
            observability, and control to your CI/CD pipelines.
          </p>
        </div>

        <Badge variant="outline" className="mb-6">By Cropxon Innovations Pvt Ltd</Badge>

        <Separator className="my-8" />

        {/* What is Opzenix */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">What is Opzenix?</h2>
          <p className="text-muted-foreground mb-6">
            Opzenix is not just another CI/CD tool — it's a <strong>Delivery Governance Control Plane</strong> 
            designed for enterprises that need complete visibility, control, and compliance over their 
            software delivery lifecycle.
          </p>

          <Callout type="info" title="The Opzenix Philosophy">
            <strong>GitHub runs the code. Kubernetes runs the workloads. Opzenix runs the confidence.</strong>
            <br />
            We don't replace your existing tools — we orchestrate and govern them.
          </Callout>
        </section>

        {/* Core Pillars */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Core Pillars</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Visual Execution Flows</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Real-time, interactive pipeline visualization. No more guessing what's happening in your deployments.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-sec-safe/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sec-safe/10 rounded-lg">
                    <Shield className="w-5 h-5 text-sec-safe" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Built-In Governance</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Approval gates, RBAC, environment locks, and complete audit trails for SOC2 compliance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-sec-warning/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sec-warning/10 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-sec-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Checkpoint Recovery</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Capture state at every stage. Roll back to any checkpoint instantly when issues arise.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-chart-1/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-chart-1/10 rounded-lg">
                    <Activity className="w-5 h-5 text-chart-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold">OpenTelemetry Native</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Logs, traces, and metrics correlated with every deployment. Full observability out of the box.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Who is it for */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Who is Opzenix For?</h2>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">DevOps & Platform Teams</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Build and maintain standardized, governed pipelines across the organization. 
                Reduce toil and enable developer self-service with guardrails.
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-sec-safe" />
                <h3 className="font-semibold">Security & Compliance Teams</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Enforce policies, maintain audit trails, and ensure SOC2/ISO27001 compliance 
                with built-in governance controls.
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="w-5 h-5 text-sec-warning" />
                <h3 className="font-semibold">Engineering Leadership</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Get visibility into deployment velocity, success rates, and bottlenecks. 
                Make data-driven decisions about your delivery process.
              </p>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Key Features</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'Visual Pipeline Editor',
              'Real-Time Execution Monitoring',
              'Approval Workflows',
              'Environment Locks',
              'Checkpoint Rollback',
              'RBAC & Permissions',
              'Audit Logging',
              'GitHub/GitLab Integration',
              'Kubernetes Deployment',
              'Blue-Green & Canary',
              'OpenTelemetry Tracing',
              'Slack/Teams Notifications'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          
          <div className="p-6 rounded-lg bg-muted/30 border mb-4">
            <pre className="text-sm font-mono text-muted-foreground whitespace-pre overflow-x-auto">
{`┌─────────────────────────────────────────────────────────────────┐
│                    OPZENIX CONTROL PLANE                        │
│                 by Cropxon Innovations Pvt Ltd                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌───────────────┐    ┌───────────────┐    ┌───────────────┐   │
│   │    GitHub     │───▶│   Governance  │───▶│    Flow       │   │
│   │    Webhook    │    │    Engine     │    │   Executor    │   │
│   └───────────────┘    └───────────────┘    └───────────────┘   │
│           │                    │                    │            │
│           ▼                    ▼                    ▼            │
│   ┌───────────────┐    ┌───────────────┐    ┌───────────────┐   │
│   │   Audit Log   │    │  Environment  │    │  Kubernetes   │   │
│   │   (SOC2)      │    │     Locks     │    │    Deploy     │   │
│   └───────────────┘    └───────────────┘    └───────────────┘   │
│                                                                  │
│   ┌───────────────┐    ┌───────────────┐    ┌───────────────┐   │
│   │  Checkpoints  │    │   Telemetry   │    │  Approvals    │   │
│   │  & Recovery   │    │   (OTEL)      │    │   & RBAC      │   │
│   └───────────────┘    └───────────────┘    └───────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>

          <p className="text-muted-foreground">
            Opzenix sits between your source control (GitHub, GitLab, Azure DevOps) and 
            deployment targets (Kubernetes, Cloud Services), enforcing governance policies 
            and providing visibility at every stage.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Next Steps */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Get Started</h2>
          <div className="space-y-3">
            <Link 
              to="/docs/getting-started/quickstart"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Rocket className="w-5 h-5 text-primary" />
                <div>
                  <span className="font-medium">Quickstart Guide</span>
                  <p className="text-sm text-muted-foreground">Set up Opzenix in 5 minutes</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link 
              to="/docs/getting-started/core-concepts"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-primary" />
                <div>
                  <span className="font-medium">Core Concepts</span>
                  <p className="text-sm text-muted-foreground">Understand executions, checkpoints, and governance</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link 
              to="/docs/setup-guides/github-app"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Github className="w-5 h-5 text-primary" />
                <div>
                  <span className="font-medium">GitHub Integration</span>
                  <p className="text-sm text-muted-foreground">Connect your repositories</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Opzenix by Cropxon Innovations Pvt Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}

export default IntroductionDocs;
