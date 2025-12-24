import { motion } from 'framer-motion';
import { Calendar, Rocket, Shield, Zap, Bug, Star, GitBranch, Database, Eye, Lock, CheckCircle2 } from 'lucide-react';
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
    version: '2.5.0',
    date: '2025-01-15',
    title: 'Enterprise Governance 2.0',
    type: 'major',
    highlights: [
      'Complete RBAC overhaul with granular permissions',
      'OpenTelemetry 1.0 native integration',
      'Multi-cluster Kubernetes support'
    ],
    changes: [
      { type: 'feature', description: 'Added support for custom approval workflows with conditional logic' },
      { type: 'feature', description: 'Introduced checkpoint-based rollback with automatic state restoration' },
      { type: 'feature', description: 'New visual flow editor with drag-and-drop node configuration' },
      { type: 'improvement', description: 'Reduced execution latency by 40% with optimized pipeline scheduler' },
      { type: 'security', description: 'Enhanced secret management with HashiCorp Vault integration' },
      { type: 'fix', description: 'Fixed race condition in concurrent approval processing' },
    ]
  },
  {
    version: '2.4.2',
    date: '2025-01-08',
    title: 'Performance & Stability',
    type: 'patch',
    highlights: [
      'Critical performance improvements',
      'Bug fixes for edge cases'
    ],
    changes: [
      { type: 'fix', description: 'Resolved memory leak in real-time log streaming' },
      { type: 'fix', description: 'Fixed execution history pagination for large datasets' },
      { type: 'improvement', description: 'Optimized database queries for dashboard widgets' },
      { type: 'security', description: 'Patched XSS vulnerability in audit log viewer' },
    ]
  },
  {
    version: '2.4.0',
    date: '2024-12-20',
    title: 'Azure DevOps Integration',
    type: 'minor',
    highlights: [
      'Full Azure DevOps pipeline support',
      'AKS native deployment strategies',
      'Azure Key Vault integration'
    ],
    changes: [
      { type: 'feature', description: 'Azure DevOps webhook receiver for pipeline triggers' },
      { type: 'feature', description: 'Native AKS deployment with managed identity support' },
      { type: 'feature', description: 'Azure Container Registry integration for artifact management' },
      { type: 'improvement', description: 'Enhanced telemetry dashboard with Azure Monitor metrics' },
      { type: 'fix', description: 'Corrected timezone handling in execution timestamps' },
    ]
  },
  {
    version: '2.3.0',
    date: '2024-12-05',
    title: 'Real-Time Collaboration',
    type: 'minor',
    highlights: [
      'Multi-user presence indicators',
      'Live pipeline editing',
      'Collaborative approval workflows'
    ],
    changes: [
      { type: 'feature', description: 'Real-time presence indicators showing active users' },
      { type: 'feature', description: 'Collaborative pipeline editor with conflict resolution' },
      { type: 'feature', description: 'Team notification system with Slack and Teams integration' },
      { type: 'improvement', description: 'Improved WebSocket reliability for real-time updates' },
      { type: 'fix', description: 'Fixed approval notification delivery timing' },
    ]
  },
  {
    version: '2.2.0',
    date: '2024-11-18',
    title: 'Observability Suite',
    type: 'minor',
    highlights: [
      'OpenTelemetry collector integration',
      'Distributed tracing visualization',
      'Custom metric dashboards'
    ],
    changes: [
      { type: 'feature', description: 'OTEL collector sidecar for automatic trace collection' },
      { type: 'feature', description: 'Distributed tracing waterfall view for execution flows' },
      { type: 'feature', description: 'Custom dashboard builder with metric widgets' },
      { type: 'improvement', description: 'Reduced telemetry data ingestion costs by 35%' },
      { type: 'security', description: 'Added TLS encryption for all telemetry endpoints' },
    ]
  },
  {
    version: '2.1.0',
    date: '2024-11-01',
    title: 'Environment Management',
    type: 'minor',
    highlights: [
      'Environment-specific configurations',
      'Deployment strategy templates',
      'Branch-to-environment mapping'
    ],
    changes: [
      { type: 'feature', description: 'Environment configuration inheritance and overrides' },
      { type: 'feature', description: 'Pre-built deployment strategy templates (Canary, Blue-Green, Rolling)' },
      { type: 'feature', description: 'Automatic branch-to-environment mapping with regex patterns' },
      { type: 'improvement', description: 'Faster environment provisioning with caching' },
      { type: 'fix', description: 'Fixed environment lock state synchronization' },
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
              Stay up to date with the latest features, improvements, and fixes in Opzenix.
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
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative pl-12"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>

                  {/* Content */}
                  <Card className="overflow-hidden">
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

          {/* Older versions link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-12 pt-12 border-t border-border"
          >
            <p className="text-muted-foreground mb-4">
              Looking for older versions? Check our complete release history.
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
