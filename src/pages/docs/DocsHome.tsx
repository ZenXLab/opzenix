import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Rocket, Shield, GitBranch, Eye, Play, Lock, 
  CheckCircle2, ArrowRight, Github, Cloud, Terminal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function DocsHome() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Documentation</Badge>
          <h1 className="text-4xl font-bold mb-4">Opzenix Documentation</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Learn how to set up, configure, and operate the Opzenix Delivery Governance Control Plane
            for enterprise CI/CD.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <Link to="/docs/getting-started/quickstart">
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Rocket className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Quickstart</h3>
                    <p className="text-sm text-muted-foreground">
                      Get up and running in 5 minutes with our step-by-step guide.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/docs/setup-guides/github-app">
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Github className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">GitHub App Setup</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect your repositories with enterprise-grade permissions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/docs/governance/branch-environment-rules">
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Governance Rules</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure branch-to-environment mapping and approval flows.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/docs/security/permission-model">
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Security & RBAC</h3>
                    <p className="text-sm text-muted-foreground">
                      Enterprise security model with role-based access control.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* What is Opzenix */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What is Opzenix?</h2>
          <p className="text-muted-foreground mb-4">
            Opzenix is a <strong>Delivery Governance Control Plane</strong> — not just another CI/CD tool.
            It orchestrates and observes your entire delivery lifecycle from code to Kubernetes with:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
              <h4 className="font-medium">Checkpoints & Rewind</h4>
              <p className="text-sm text-muted-foreground">State capture at every stage for instant rollback</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border">
              <Shield className="w-5 h-5 text-primary mb-2" />
              <h4 className="font-medium">Approval Gates</h4>
              <p className="text-sm text-muted-foreground">RBAC-enforced approvals for sensitive environments</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border">
              <Eye className="w-5 h-5 text-chart-1 mb-2" />
              <h4 className="font-medium">Live Execution Flows</h4>
              <p className="text-sm text-muted-foreground">Real-time visibility into every deployment</p>
            </div>
          </div>

          <Callout type="info" title="The Opzenix Difference">
            <strong>GitHub runs the code. Kubernetes runs the workloads. Opzenix runs the confidence.</strong>
            <br />
            We don't replace your existing tools — we govern them.
          </Callout>
        </section>

        {/* Architecture Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Architecture Overview</h2>
          
          <div className="p-6 rounded-lg bg-muted/30 border mb-4">
            <pre className="text-sm font-mono text-muted-foreground whitespace-pre">
{`┌─────────────────────────────────────────────────────────────┐
│                    OPZENIX CONTROL PLANE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│   │   GitHub    │───▶│  Governance │───▶│    Flow     │   │
│   │   Webhook   │    │    Engine   │    │  Executor   │   │
│   └─────────────┘    └─────────────┘    └─────────────┘   │
│          │                  │                  │           │
│          ▼                  ▼                  ▼           │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│   │  Audit Log  │    │ Environment │    │ Kubernetes  │   │
│   │   (SOC2)    │    │    Locks    │    │   Deploy    │   │
│   └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>

          <p className="text-muted-foreground">
            The control plane sits between your source control (GitHub) and deployment targets (Kubernetes),
            enforcing governance policies at every stage.
          </p>
        </section>

        {/* Next Steps */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <div className="space-y-3">
            <Link 
              to="/docs/getting-started/quickstart"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Rocket className="w-5 h-5 text-primary" />
                <span className="font-medium">Follow the Quickstart Guide</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link 
              to="/docs/setup-guides/github-app"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Github className="w-5 h-5 text-primary" />
                <span className="font-medium">Install the GitHub App</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link 
              to="/docs/governance/rbac-model"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-medium">Understand the RBAC Model</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

export default DocsHome;
