import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Github, GitBranch, Cloud, Server, Shield, Database,
  Container, Lock, Activity, Layers, Terminal, Cpu,
  ArrowRight, CheckCircle2, ExternalLink, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnterpriseNavigation } from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  status: 'available' | 'coming-soon' | 'beta';
  features: string[];
  docsUrl?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'github',
    name: 'GitHub',
    category: 'Source Control',
    description: 'Native GitHub App integration with webhooks, branch protection sync, and PR status checks.',
    icon: <Github className="w-8 h-8" />,
    status: 'available',
    features: ['GitHub App installation', 'Webhook events', 'PR status checks', 'Branch protection sync'],
    docsUrl: '/docs/setup-guides/github-app'
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    category: 'Source Control',
    description: 'Full GitLab integration supporting self-hosted and SaaS instances with CI/CD pipeline triggers.',
    icon: <GitBranch className="w-8 h-8" />,
    status: 'available',
    features: ['OAuth integration', 'Pipeline triggers', 'Merge request gates', 'Self-hosted support']
  },
  {
    id: 'azure-devops',
    name: 'Azure DevOps',
    category: 'Source Control',
    description: 'Connect Azure DevOps repositories and pipelines for enterprise Microsoft ecosystem integration.',
    icon: <Cloud className="w-8 h-8" />,
    status: 'available',
    features: ['Azure Repos', 'Azure Pipelines', 'Service connections', 'Work item linking']
  },
  {
    id: 'bitbucket',
    name: 'Bitbucket',
    category: 'Source Control',
    description: 'Atlassian Bitbucket integration for teams using the Atlassian ecosystem.',
    icon: <GitBranch className="w-8 h-8" />,
    status: 'beta',
    features: ['Cloud & Server', 'Pipeline triggers', 'PR webhooks', 'Branch permissions']
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    category: 'Infrastructure',
    description: 'Deploy to any Kubernetes cluster including AKS, EKS, GKE, and on-premises clusters.',
    icon: <Container className="w-8 h-8" />,
    status: 'available',
    features: ['Multi-cluster support', 'Helm charts', 'Kustomize', 'Rollback support'],
    docsUrl: '/docs/setup-guides/kubernetes'
  },
  {
    id: 'aws',
    name: 'Amazon Web Services',
    category: 'Cloud Providers',
    description: 'Deploy to AWS services including ECS, EKS, Lambda, and EC2 with IAM role integration.',
    icon: <Cloud className="w-8 h-8" />,
    status: 'available',
    features: ['ECS/EKS deployment', 'Lambda functions', 'S3 artifacts', 'IAM integration']
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    category: 'Cloud Providers',
    description: 'Native Azure integration for AKS, Container Apps, App Service, and Azure Functions.',
    icon: <Cloud className="w-8 h-8" />,
    status: 'available',
    features: ['AKS clusters', 'Container Apps', 'App Service', 'Azure Functions']
  },
  {
    id: 'gcp',
    name: 'Google Cloud Platform',
    category: 'Cloud Providers',
    description: 'Deploy to GKE, Cloud Run, Cloud Functions, and Compute Engine with service account auth.',
    icon: <Cloud className="w-8 h-8" />,
    status: 'available',
    features: ['GKE clusters', 'Cloud Run', 'Cloud Functions', 'Workload Identity']
  },
  {
    id: 'docker-hub',
    name: 'Docker Hub',
    category: 'Container Registry',
    description: 'Push and pull container images from Docker Hub with automated scanning.',
    icon: <Container className="w-8 h-8" />,
    status: 'available',
    features: ['Image push/pull', 'Vulnerability scanning', 'Tag management', 'Webhook triggers']
  },
  {
    id: 'acr',
    name: 'Azure Container Registry',
    category: 'Container Registry',
    description: 'Enterprise container registry with geo-replication and integrated security scanning.',
    icon: <Container className="w-8 h-8" />,
    status: 'available',
    features: ['Geo-replication', 'Security scanning', 'Managed identity', 'Image signing'],
    docsUrl: '/docs/setup-guides/container-registry'
  },
  {
    id: 'ecr',
    name: 'Amazon ECR',
    category: 'Container Registry',
    description: 'AWS Elastic Container Registry integration with IAM authentication.',
    icon: <Container className="w-8 h-8" />,
    status: 'available',
    features: ['IAM authentication', 'Image scanning', 'Lifecycle policies', 'Cross-region replication']
  },
  {
    id: 'gcr',
    name: 'Google Container Registry',
    category: 'Container Registry',
    description: 'Google Artifact Registry integration for container images and packages.',
    icon: <Container className="w-8 h-8" />,
    status: 'available',
    features: ['Artifact Registry', 'Vulnerability scanning', 'Binary authorization', 'Regional storage']
  },
  {
    id: 'hashicorp-vault',
    name: 'HashiCorp Vault',
    category: 'Secrets Management',
    description: 'Enterprise secrets management with dynamic credentials and encryption as a service.',
    icon: <Lock className="w-8 h-8" />,
    status: 'available',
    features: ['Dynamic secrets', 'PKI management', 'Transit encryption', 'Policy management'],
    docsUrl: '/docs/setup-guides/vault'
  },
  {
    id: 'azure-key-vault',
    name: 'Azure Key Vault',
    category: 'Secrets Management',
    description: 'Microsoft Azure Key Vault for secrets, keys, and certificates management.',
    icon: <Lock className="w-8 h-8" />,
    status: 'available',
    features: ['Secrets storage', 'Key management', 'Certificate management', 'Managed identity']
  },
  {
    id: 'aws-secrets-manager',
    name: 'AWS Secrets Manager',
    category: 'Secrets Management',
    description: 'AWS native secrets management with automatic rotation and fine-grained access control.',
    icon: <Lock className="w-8 h-8" />,
    status: 'available',
    features: ['Secret rotation', 'IAM policies', 'Cross-account access', 'Audit logging']
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    category: 'Observability',
    description: 'Export deployment metrics and alerts to Prometheus for monitoring and alerting.',
    icon: <Activity className="w-8 h-8" />,
    status: 'available',
    features: ['Metrics export', 'Custom dashboards', 'Alert rules', 'ServiceMonitor']
  },
  {
    id: 'opentelemetry',
    name: 'OpenTelemetry',
    category: 'Observability',
    description: 'Full OpenTelemetry support for traces, metrics, and logs with OTLP export.',
    icon: <Activity className="w-8 h-8" />,
    status: 'available',
    features: ['Distributed tracing', 'Metrics collection', 'Log correlation', 'OTLP export'],
    docsUrl: '/docs/setup-guides/opentelemetry'
  },
  {
    id: 'datadog',
    name: 'Datadog',
    category: 'Observability',
    description: 'Send deployment events and metrics to Datadog for unified observability.',
    icon: <Activity className="w-8 h-8" />,
    status: 'available',
    features: ['Deployment tracking', 'APM correlation', 'Log integration', 'Dashboard widgets']
  },
  {
    id: 'grafana',
    name: 'Grafana',
    category: 'Observability',
    description: 'Visualize deployment metrics and create custom dashboards with Grafana integration.',
    icon: <Layers className="w-8 h-8" />,
    status: 'available',
    features: ['Custom dashboards', 'Alerting', 'Annotations', 'Data source integration']
  },
  {
    id: 'splunk',
    name: 'Splunk',
    category: 'Observability',
    description: 'Enterprise log aggregation and SIEM integration with Splunk.',
    icon: <Database className="w-8 h-8" />,
    status: 'beta',
    features: ['Log forwarding', 'HEC integration', 'Custom indexes', 'Alert actions']
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Notifications',
    description: 'Real-time deployment notifications and approval workflows via Slack.',
    icon: <Terminal className="w-8 h-8" />,
    status: 'available',
    features: ['Deployment alerts', 'Approval buttons', 'Thread updates', 'Channel routing']
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    category: 'Notifications',
    description: 'Deployment notifications and interactive approval cards for Microsoft Teams.',
    icon: <Terminal className="w-8 h-8" />,
    status: 'available',
    features: ['Adaptive cards', 'Approval workflows', 'Channel notifications', 'Bot commands']
  },
  {
    id: 'pagerduty',
    name: 'PagerDuty',
    category: 'Notifications',
    description: 'Incident management integration for deployment failures and rollback alerts.',
    icon: <Shield className="w-8 h-8" />,
    status: 'available',
    features: ['Incident creation', 'Escalation policies', 'On-call routing', 'Change events']
  },
  {
    id: 'terraform',
    name: 'Terraform',
    category: 'Infrastructure as Code',
    description: 'Infrastructure provisioning with Terraform state management and plan approvals.',
    icon: <Cpu className="w-8 h-8" />,
    status: 'available',
    features: ['State management', 'Plan approvals', 'Drift detection', 'Module registry']
  },
  {
    id: 'argocd',
    name: 'Argo CD',
    category: 'GitOps',
    description: 'GitOps continuous delivery with Argo CD sync status and application health.',
    icon: <GitBranch className="w-8 h-8" />,
    status: 'available',
    features: ['Sync status', 'Health monitoring', 'Rollback triggers', 'App-of-apps']
  },
  {
    id: 'flux',
    name: 'Flux CD',
    category: 'GitOps',
    description: 'CNCF Flux integration for GitOps workflows with Kustomize and Helm support.',
    icon: <GitBranch className="w-8 h-8" />,
    status: 'beta',
    features: ['Source sync', 'Kustomize support', 'Helm controller', 'Image automation']
  }
];

const CATEGORIES = [
  'Source Control',
  'Infrastructure',
  'Cloud Providers',
  'Container Registry',
  'Secrets Management',
  'Observability',
  'Notifications',
  'Infrastructure as Code',
  'GitOps'
];

export default function Integrations() {
  return (
    <>
      <EnterpriseNavigation />

      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-primary/5 via-transparent to-transparent">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge variant="outline" className="mb-6 text-sm py-1 px-4">
                <Zap className="w-3 h-3 mr-2" />
                25+ Native Integrations
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Connect Your Entire
                <span className="text-primary"> DevOps Stack</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Opzenix integrates seamlessly with your existing tools. From source control to 
                observability, connect everything in minutes.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="gap-2" asChild>
                  <Link to="/docs/getting-started/quickstart">
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/company/contact">
                    Request Integration
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Integration Logos */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-16 grid grid-cols-4 md:grid-cols-8 gap-4"
            >
              {INTEGRATIONS.slice(0, 8).map((integration, i) => (
                <motion.div
                  key={integration.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-center justify-center p-4 bg-card/50 border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div className="text-muted-foreground hover:text-foreground transition-colors">
                    {integration.icon}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Integrations by Category */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            {CATEGORIES.map((category, categoryIndex) => {
              const categoryIntegrations = INTEGRATIONS.filter(i => i.category === category);
              if (categoryIntegrations.length === 0) return null;

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: categoryIndex * 0.1 }}
                  className="mb-16"
                >
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <span className="w-8 h-0.5 bg-primary" />
                    {category}
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryIntegrations.map((integration) => (
                      <Card 
                        key={integration.id} 
                        className="group hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="p-3 bg-primary/10 rounded-xl text-primary">
                              {integration.icon}
                            </div>
                            <Badge 
                              variant={
                                integration.status === 'available' ? 'default' : 
                                integration.status === 'beta' ? 'secondary' : 'outline'
                              }
                              className={
                                integration.status === 'available' ? 'bg-sec-safe text-sec-safe-foreground' :
                                integration.status === 'beta' ? 'bg-chart-1 text-primary-foreground' : ''
                              }
                            >
                              {integration.status === 'available' ? 'Available' : 
                               integration.status === 'beta' ? 'Beta' : 'Coming Soon'}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg mt-4">{integration.name}</CardTitle>
                          <CardDescription>{integration.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 mb-4">
                            {integration.features.map((feature) => (
                              <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          {integration.docsUrl && (
                            <Button variant="ghost" size="sm" className="gap-2 w-full" asChild>
                              <Link to={integration.docsUrl}>
                                View Documentation
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Don't See Your Tool?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                We're constantly adding new integrations. Let us know what you need 
                and we'll prioritize it.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="gap-2" asChild>
                  <Link to="/company/contact">
                    Request Integration
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/docs/api-reference">
                    Build Your Own
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <FooterSection />
      </main>
    </>
  );
}