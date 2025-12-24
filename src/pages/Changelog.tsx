import { motion } from 'framer-motion';
import { Calendar, Rocket, Shield, Zap, Bug, Star, GitBranch, Database, Eye, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import EnterpriseNavigation from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  type: 'major' | 'minor' | 'patch';
  highlights: string[];
  changes: {
    type: 'feature' | 'improvement' | 'fix' | 'security';
    description: string;
  }[];
}

const changelogData: ChangelogEntry[] = [
  {
    version: '1.0.0',
    date: '2025-12-25',
    title: 'MVP 1.0.0 - Production Ready Release',
    type: 'major',
    highlights: [
      'Full Enterprise CI/CD Control Plane',
      'Complete Governance & Compliance Suite',
      'AI-Powered Insights & Auto-Remediation'
    ],
    changes: [
      { type: 'feature', description: 'Visual Pipeline Builder with drag-and-drop flow editor' },
      { type: 'feature', description: 'GitHub App integration with webhook support and branch-to-environment mapping' },
      { type: 'feature', description: 'Checkpoint-based rollback system with instant state restoration' },
      { type: 'feature', description: 'Multi-tier approval workflows with conditional logic' },
      { type: 'feature', description: 'Environment locks with role-based unlock permissions' },
      { type: 'feature', description: 'OpenTelemetry-native observability with distributed tracing' },
      { type: 'feature', description: 'Opzenix AI Engine for failure analysis and auto-remediation suggestions' },
      { type: 'feature', description: 'Complete RBAC model with Admin, Operator, and Viewer roles' },
      { type: 'feature', description: 'Real-time execution monitoring with live log streaming' },
      { type: 'feature', description: 'Comprehensive audit logging for SOC2/HIPAA compliance' },
      { type: 'feature', description: 'Azure DevOps and AKS native deployment support' },
      { type: 'feature', description: 'HashiCorp Vault integration for secrets management' },
      { type: 'security', description: 'SOC2 Type II and HIPAA compliance mapping' },
    ]
  },
  {
    version: '0.9.0',
    date: '2025-12-15',
    title: 'Release Candidate - Final Polish',
    type: 'minor',
    highlights: [
      'Production hardening and performance optimization',
      'Complete documentation and API reference',
      'Enterprise onboarding wizard'
    ],
    changes: [
      { type: 'feature', description: 'Interactive platform demo with step-by-step walkthrough' },
      { type: 'feature', description: 'Complete API reference documentation with code examples' },
      { type: 'feature', description: 'Testimonials and customer success stories section' },
      { type: 'improvement', description: 'Reduced pipeline execution latency by 45%' },
      { type: 'improvement', description: 'Enhanced real-time WebSocket reliability' },
      { type: 'fix', description: 'Fixed edge cases in checkpoint state restoration' },
      { type: 'security', description: 'Final security audit and penetration testing completed' },
    ]
  },
  {
    version: '0.8.0',
    date: '2025-11-28',
    title: 'AI Engine & Advanced Analytics',
    type: 'minor',
    highlights: [
      'Opzenix AI for intelligent failure analysis',
      'Advanced telemetry dashboards',
      'Pattern recognition and auto-remediation'
    ],
    changes: [
      { type: 'feature', description: 'AI-powered root cause analysis for pipeline failures' },
      { type: 'feature', description: 'Suggested fixes with one-click auto-remediation' },
      { type: 'feature', description: 'Pattern matching across historical executions' },
      { type: 'feature', description: 'Custom metric dashboards with widget builder' },
      { type: 'improvement', description: 'Enhanced telemetry data visualization' },
      { type: 'fix', description: 'Fixed memory optimization in log streaming' },
    ]
  },
  {
    version: '0.7.0',
    date: '2025-11-10',
    title: 'Azure & Multi-Cloud Support',
    type: 'minor',
    highlights: [
      'Azure DevOps integration',
      'AKS native deployment strategies',
      'Multi-cluster Kubernetes support'
    ],
    changes: [
      { type: 'feature', description: 'Azure DevOps webhook receiver for pipeline triggers' },
      { type: 'feature', description: 'Native AKS deployment with managed identity support' },
      { type: 'feature', description: 'Azure Container Registry integration' },
      { type: 'feature', description: 'Multi-cluster deployment orchestration' },
      { type: 'improvement', description: 'Enhanced Azure Monitor metrics integration' },
      { type: 'fix', description: 'Corrected timezone handling in execution timestamps' },
    ]
  },
  {
    version: '0.6.0',
    date: '2025-10-20',
    title: 'Governance & Compliance Suite',
    type: 'minor',
    highlights: [
      'Complete RBAC implementation',
      'Approval workflow engine',
      'Audit logging system'
    ],
    changes: [
      { type: 'feature', description: 'Role-based access control with granular permissions' },
      { type: 'feature', description: 'Multi-tier approval workflows with SLA tracking' },
      { type: 'feature', description: 'Environment locks with configurable unlock rules' },
      { type: 'feature', description: 'Comprehensive audit log viewer with filtering' },
      { type: 'feature', description: 'SOC2 and HIPAA compliance mapping reports' },
      { type: 'security', description: 'Enhanced permission validation across all endpoints' },
    ]
  },
  {
    version: '0.5.0',
    date: '2025-09-25',
    title: 'Observability & Telemetry',
    type: 'minor',
    highlights: [
      'OpenTelemetry collector integration',
      'Distributed tracing visualization',
      'Real-time log streaming'
    ],
    changes: [
      { type: 'feature', description: 'OTEL collector sidecar for automatic trace collection' },
      { type: 'feature', description: 'Distributed tracing waterfall view' },
      { type: 'feature', description: 'Real-time log streaming with search and filtering' },
      { type: 'feature', description: 'Prometheus metrics export endpoint' },
      { type: 'improvement', description: 'Reduced telemetry data ingestion latency' },
      { type: 'security', description: 'TLS encryption for all telemetry endpoints' },
    ]
  },
  {
    version: '0.4.0',
    date: '2025-08-30',
    title: 'Checkpoint & Recovery System',
    type: 'minor',
    highlights: [
      'Checkpoint creation at pipeline stages',
      'Instant rollback to any checkpoint',
      'State preservation and restoration'
    ],
    changes: [
      { type: 'feature', description: 'Automatic checkpoint creation at stage boundaries' },
      { type: 'feature', description: 'One-click rollback to previous checkpoints' },
      { type: 'feature', description: 'Full state restoration including artifacts and variables' },
      { type: 'feature', description: 'Checkpoint comparison and diff viewer' },
      { type: 'improvement', description: 'Optimized checkpoint storage with compression' },
      { type: 'fix', description: 'Fixed race conditions in concurrent checkpoint access' },
    ]
  },
  {
    version: '0.3.0',
    date: '2025-07-15',
    title: 'Visual Pipeline Editor',
    type: 'minor',
    highlights: [
      'Drag-and-drop flow builder',
      'Node configuration panels',
      'Pipeline templates library'
    ],
    changes: [
      { type: 'feature', description: 'Interactive flow canvas with zoom and pan' },
      { type: 'feature', description: 'Node toolbox with 15+ pre-built node types' },
      { type: 'feature', description: 'Stage configuration panels with validation' },
      { type: 'feature', description: 'Pipeline templates for common CI/CD patterns' },
      { type: 'improvement', description: 'Real-time validation of pipeline configuration' },
      { type: 'fix', description: 'Fixed edge connection issues in complex flows' },
    ]
  },
  {
    version: '0.2.0',
    date: '2025-05-20',
    title: 'GitHub Integration & Execution Engine',
    type: 'minor',
    highlights: [
      'GitHub App installation',
      'Webhook-triggered executions',
      'Basic execution monitoring'
    ],
    changes: [
      { type: 'feature', description: 'GitHub App OAuth flow and installation wizard' },
      { type: 'feature', description: 'Webhook receiver for push and PR events' },
      { type: 'feature', description: 'Branch-to-environment mapping rules' },
      { type: 'feature', description: 'Basic execution status tracking' },
      { type: 'feature', description: 'Execution history with filtering' },
      { type: 'fix', description: 'Fixed webhook signature verification' },
    ]
  },
  {
    version: '0.1.0',
    date: '2025-01-15',
    title: 'Initial Alpha - Project Foundation',
    type: 'major',
    highlights: [
      'Core platform architecture',
      'Authentication system',
      'Initial dashboard UI'
    ],
    changes: [
      { type: 'feature', description: 'Core React + TypeScript application setup' },
      { type: 'feature', description: 'Supabase backend integration' },
      { type: 'feature', description: 'User authentication with email and social login' },
      { type: 'feature', description: 'Initial Control Tower dashboard layout' },
      { type: 'feature', description: 'Database schema for executions, flows, and users' },
      { type: 'feature', description: 'Edge functions infrastructure setup' },
    ]
  },
];

const getChangeIcon = (type: string) => {
  switch (type) {
    case 'feature': return <Rocket className="w-4 h-4 text-primary" />;
    case 'improvement': return <Zap className="w-4 h-4 text-sec-warning" />;
    case 'fix': return <Bug className="w-4 h-4 text-sec-safe" />;
    case 'security': return <Shield className="w-4 h-4 text-sec-critical" />;
    default: return <Star className="w-4 h-4 text-muted-foreground" />;
  }
};

const getVersionBadge = (type: string) => {
  switch (type) {
    case 'major': return <Badge className="bg-primary/20 text-primary">Major</Badge>;
    case 'minor': return <Badge className="bg-sec-warning/20 text-sec-warning">Minor</Badge>;
    case 'patch': return <Badge className="bg-muted text-muted-foreground">Patch</Badge>;
    default: return null;
  }
};

const Changelog = () => {
  return (
    <div className="min-h-screen bg-background">
      <EnterpriseNavigation />
      
      <div className="pt-24 pb-16 px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">Product Updates</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Changelog</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Follow our journey from v0.1.0 alpha to MVP 1.0.0 - a complete enterprise CI/CD control plane.
            </p>
          </motion.div>

          {/* MVP 1.0.0 Highlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-chart-1/10 to-primary/10 border border-primary/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold">MVP 1.0.0 Released!</span>
              <Badge className="bg-sec-safe text-sec-safe-foreground">December 25, 2025</Badge>
            </div>
            <p className="text-muted-foreground">
              After 11 months of development, Opzenix MVP 1.0.0 is production-ready with complete enterprise governance, 
              AI-powered insights, and seamless recovery capabilities.
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            {/* Entries */}
            <div className="space-y-12">
              {changelogData.map((entry, index) => (
                <motion.div
                  key={entry.version}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="relative pl-12"
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    entry.version === '1.0.0' 
                      ? 'bg-primary border-2 border-primary' 
                      : 'bg-primary/20 border-2 border-primary'
                  }`}>
                    {entry.version === '1.0.0' ? (
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                  </div>

                  {/* Content */}
                  <Card className={`overflow-hidden ${entry.version === '1.0.0' ? 'border-primary/50 shadow-lg shadow-primary/10' : ''}`}>
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="text-2xl font-bold text-foreground">v{entry.version}</span>
                        {getVersionBadge(entry.type)}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                          <Calendar className="w-4 h-4" />
                          {new Date(entry.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold mb-3">{entry.title}</h3>

                      {/* Highlights */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {entry.highlights.map((highlight, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {highlight}
                          </Badge>
                        ))}
                      </div>

                      {/* Changes */}
                      <div className="space-y-2">
                        {entry.changes.map((change, i) => (
                          <div key={i} className="flex items-start gap-3 text-sm">
                            {getChangeIcon(change.type)}
                            <span className="text-muted-foreground">{change.description}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-12 pt-12 border-t border-border"
          >
            <p className="text-muted-foreground mb-4">
              Building the future of enterprise CI/CD governance.
            </p>
            <a 
              href="https://github.com/cropxon/opzenix/releases" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <GitBranch className="w-4 h-4" />
              View all releases on GitHub
            </a>
          </motion.div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default Changelog;
