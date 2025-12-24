import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Minus, ArrowRight, Shield, Zap,
  GitBranch, Eye, History, Clock, Users, Building2,
  BarChart3, Lock, Terminal, Sparkles, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnterpriseNavigation } from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';

type FeatureStatus = 'full' | 'partial' | 'none' | 'addon';

interface FeatureComparison {
  category: string;
  features: {
    name: string;
    description: string;
    opzenix: FeatureStatus;
    harness: FeatureStatus;
    jenkins: FeatureStatus;
    gitlab: FeatureStatus;
    circleci: FeatureStatus;
  }[];
}

const featureComparisons: FeatureComparison[] = [
  {
    category: 'CI/CD Core',
    features: [
      {
        name: 'Visual Pipeline Builder',
        description: 'Drag-and-drop pipeline creation',
        opzenix: 'full', harness: 'full', jenkins: 'partial', gitlab: 'partial', circleci: 'none'
      },
      {
        name: 'Parallel Execution',
        description: 'Run pipeline stages in parallel',
        opzenix: 'full', harness: 'full', jenkins: 'full', gitlab: 'full', circleci: 'full'
      },
      {
        name: 'Multi-Cloud Deployment',
        description: 'Deploy to AWS, Azure, GCP',
        opzenix: 'full', harness: 'full', jenkins: 'partial', gitlab: 'partial', circleci: 'partial'
      },
      {
        name: 'Kubernetes Native',
        description: 'First-class K8s support',
        opzenix: 'full', harness: 'full', jenkins: 'partial', gitlab: 'full', circleci: 'partial'
      },
      {
        name: 'GitOps Integration',
        description: 'ArgoCD, Flux CD support',
        opzenix: 'full', harness: 'full', jenkins: 'none', gitlab: 'partial', circleci: 'none'
      }
    ]
  },
  {
    category: 'Governance & Compliance',
    features: [
      {
        name: 'Approval Workflows',
        description: 'Multi-level approval gates',
        opzenix: 'full', harness: 'addon', jenkins: 'partial', gitlab: 'partial', circleci: 'none'
      },
      {
        name: 'Environment Locks',
        description: 'Freeze deployments per environment',
        opzenix: 'full', harness: 'addon', jenkins: 'none', gitlab: 'none', circleci: 'none'
      },
      {
        name: 'RBAC (Role-Based Access)',
        description: 'Granular permission control',
        opzenix: 'full', harness: 'full', jenkins: 'partial', gitlab: 'full', circleci: 'partial'
      },
      {
        name: 'Audit Logs',
        description: 'Complete action history',
        opzenix: 'full', harness: 'addon', jenkins: 'partial', gitlab: 'full', circleci: 'partial'
      },
      {
        name: 'Policy as Code',
        description: 'OPA/Rego policy enforcement',
        opzenix: 'full', harness: 'addon', jenkins: 'none', gitlab: 'partial', circleci: 'none'
      },
      {
        name: 'Branch-Environment Rules',
        description: 'Branch protection per environment',
        opzenix: 'full', harness: 'partial', jenkins: 'none', gitlab: 'partial', circleci: 'none'
      }
    ]
  },
  {
    category: 'Observability',
    features: [
      {
        name: 'OpenTelemetry Native',
        description: 'Built-in OTel support',
        opzenix: 'full', harness: 'partial', jenkins: 'none', gitlab: 'none', circleci: 'none'
      },
      {
        name: 'Real-time Logs',
        description: 'Live streaming execution logs',
        opzenix: 'full', harness: 'full', jenkins: 'full', gitlab: 'full', circleci: 'full'
      },
      {
        name: 'Deployment Tracking',
        description: 'Track deployments across environments',
        opzenix: 'full', harness: 'full', jenkins: 'partial', gitlab: 'partial', circleci: 'partial'
      },
      {
        name: 'Performance Metrics',
        description: 'Pipeline performance analytics',
        opzenix: 'full', harness: 'full', jenkins: 'partial', gitlab: 'full', circleci: 'full'
      },
      {
        name: 'Custom Dashboards',
        description: 'Build your own views',
        opzenix: 'full', harness: 'addon', jenkins: 'partial', gitlab: 'none', circleci: 'none'
      }
    ]
  },
  {
    category: 'Recovery & Reliability',
    features: [
      {
        name: 'Checkpoint & Resume',
        description: 'Resume from failure point',
        opzenix: 'full', harness: 'none', jenkins: 'none', gitlab: 'none', circleci: 'none'
      },
      {
        name: 'One-Click Rollback',
        description: 'Instant version rollback',
        opzenix: 'full', harness: 'full', jenkins: 'partial', gitlab: 'partial', circleci: 'none'
      },
      {
        name: 'AI-Powered Recovery',
        description: 'Automated failure analysis',
        opzenix: 'full', harness: 'partial', jenkins: 'none', gitlab: 'none', circleci: 'none'
      },
      {
        name: 'Auto-Remediation',
        description: 'Automatic fix suggestions',
        opzenix: 'full', harness: 'partial', jenkins: 'none', gitlab: 'none', circleci: 'none'
      },
      {
        name: 'Deployment Versioning',
        description: 'Track all deployment versions',
        opzenix: 'full', harness: 'full', jenkins: 'partial', gitlab: 'partial', circleci: 'partial'
      }
    ]
  },
  {
    category: 'Enterprise Features',
    features: [
      {
        name: 'SSO/SAML',
        description: 'Enterprise identity providers',
        opzenix: 'full', harness: 'full', jenkins: 'partial', gitlab: 'full', circleci: 'full'
      },
      {
        name: 'Multi-Tenancy',
        description: 'Isolated team environments',
        opzenix: 'full', harness: 'full', jenkins: 'none', gitlab: 'full', circleci: 'partial'
      },
      {
        name: 'Self-Hosted Option',
        description: 'On-premises deployment',
        opzenix: 'full', harness: 'full', jenkins: 'full', gitlab: 'full', circleci: 'none'
      },
      {
        name: 'SOC2 Compliance',
        description: 'Security certification',
        opzenix: 'full', harness: 'full', jenkins: 'none', gitlab: 'full', circleci: 'full'
      },
      {
        name: 'SLA Guarantee',
        description: '99.9%+ uptime SLA',
        opzenix: 'full', harness: 'full', jenkins: 'none', gitlab: 'full', circleci: 'full'
      }
    ]
  }
];

const competitorInfo = {
  harness: {
    name: 'Harness',
    logo: '🔷',
    description: 'Enterprise CI/CD with separate modules for CD, CI, and governance',
    pros: ['Strong CD capabilities', 'Good Kubernetes support'],
    cons: ['Very expensive', 'Governance requires add-ons', 'Complex pricing']
  },
  jenkins: {
    name: 'Jenkins',
    logo: '🔧',
    description: 'Open-source automation server requiring significant self-management',
    pros: ['Free and open-source', 'Massive plugin ecosystem'],
    cons: ['High maintenance burden', 'No built-in governance', 'Outdated UI']
  },
  gitlab: {
    name: 'GitLab',
    logo: '🦊',
    description: 'DevOps platform with integrated CI/CD capabilities',
    pros: ['All-in-one platform', 'Good Git integration'],
    cons: ['Limited governance', 'No checkpoint/resume', 'Per-seat pricing adds up']
  },
  circleci: {
    name: 'CircleCI',
    logo: '🔄',
    description: 'Cloud-native CI/CD focused on speed and simplicity',
    pros: ['Fast builds', 'Easy setup'],
    cons: ['Minimal governance', 'No approval workflows', 'Credit-based pricing']
  }
};

const StatusIcon = ({ status }: { status: FeatureStatus }) => {
  switch (status) {
    case 'full':
      return <CheckCircle2 className="w-5 h-5 text-sec-safe" />;
    case 'partial':
      return <Minus className="w-5 h-5 text-sec-warning" />;
    case 'addon':
      return <AlertTriangle className="w-5 h-5 text-chart-1" />;
    case 'none':
      return <XCircle className="w-5 h-5 text-sec-critical" />;
  }
};

const StatusLabel = ({ status }: { status: FeatureStatus }) => {
  switch (status) {
    case 'full':
      return <span className="text-xs text-sec-safe">Included</span>;
    case 'partial':
      return <span className="text-xs text-sec-warning">Limited</span>;
    case 'addon':
      return <span className="text-xs text-chart-1">Add-on $$$</span>;
    case 'none':
      return <span className="text-xs text-sec-critical">Not Available</span>;
  }
};

export default function Comparison() {
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
                <BarChart3 className="w-3 h-3 mr-2" />
                Feature Comparison
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                How Opzenix Compares to
                <span className="text-primary"> Competitors</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                See why enterprises choose Opzenix over Harness, Jenkins, GitLab, and CircleCI 
                for their CI/CD governance needs.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="gap-2" asChild>
                  <Link to="/product/pricing">
                    View Pricing
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/company/contact">
                    Request Demo
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quick Comparison Cards */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">Why Teams Switch to Opzenix</h2>
              <p className="text-muted-foreground">Key differentiators that matter for enterprise CI/CD</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(competitorInfo).map(([key, info], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{info.logo}</span>
                        <CardTitle className="text-lg">{info.name}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">
                        {info.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Strengths</p>
                        {info.pros.map((pro) => (
                          <div key={pro} className="flex items-center gap-2 text-sm text-sec-safe">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            {pro}
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Weaknesses</p>
                        {info.cons.map((con) => (
                          <div key={con} className="flex items-center gap-2 text-sm text-sec-critical">
                            <XCircle className="w-3 h-3 shrink-0" />
                            {con}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Feature Matrix */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">Detailed Feature Comparison</h2>
              <p className="text-muted-foreground">
                Comprehensive breakdown of capabilities across all platforms
              </p>
            </motion.div>

            <Tabs defaultValue={featureComparisons[0].category} className="w-full">
              <TabsList className="flex flex-wrap justify-center mb-8 h-auto gap-2">
                {featureComparisons.map((category) => (
                  <TabsTrigger key={category.category} value={category.category} className="text-sm">
                    {category.category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {featureComparisons.map((category) => (
                <TabsContent key={category.category} value={category.category}>
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left p-4 font-medium">Feature</th>
                              <th className="text-center p-4 font-medium min-w-[100px]">
                                <div className="flex flex-col items-center gap-1">
                                  <Sparkles className="w-5 h-5 text-primary" />
                                  <span>Opzenix</span>
                                </div>
                              </th>
                              <th className="text-center p-4 font-medium min-w-[100px]">Harness</th>
                              <th className="text-center p-4 font-medium min-w-[100px]">Jenkins</th>
                              <th className="text-center p-4 font-medium min-w-[100px]">GitLab</th>
                              <th className="text-center p-4 font-medium min-w-[100px]">CircleCI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {category.features.map((feature, index) => (
                              <tr 
                                key={feature.name} 
                                className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                              >
                                <td className="p-4">
                                  <div className="font-medium">{feature.name}</div>
                                  <div className="text-xs text-muted-foreground">{feature.description}</div>
                                </td>
                                <td className="text-center p-4 bg-primary/5">
                                  <div className="flex flex-col items-center gap-1">
                                    <StatusIcon status={feature.opzenix} />
                                    <StatusLabel status={feature.opzenix} />
                                  </div>
                                </td>
                                <td className="text-center p-4">
                                  <div className="flex flex-col items-center gap-1">
                                    <StatusIcon status={feature.harness} />
                                    <StatusLabel status={feature.harness} />
                                  </div>
                                </td>
                                <td className="text-center p-4">
                                  <div className="flex flex-col items-center gap-1">
                                    <StatusIcon status={feature.jenkins} />
                                    <StatusLabel status={feature.jenkins} />
                                  </div>
                                </td>
                                <td className="text-center p-4">
                                  <div className="flex flex-col items-center gap-1">
                                    <StatusIcon status={feature.gitlab} />
                                    <StatusLabel status={feature.gitlab} />
                                  </div>
                                </td>
                                <td className="text-center p-4">
                                  <div className="flex flex-col items-center gap-1">
                                    <StatusIcon status={feature.circleci} />
                                    <StatusLabel status={feature.circleci} />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <StatusIcon status="full" />
                <span>Fully Included</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon status="partial" />
                <span>Limited/Partial</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon status="addon" />
                <span>Paid Add-on</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon status="none" />
                <span>Not Available</span>
              </div>
            </div>
          </div>
        </section>

        {/* Opzenix Exclusive Features */}
        <section className="py-20 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge variant="outline" className="mb-4">
                <Sparkles className="w-3 h-3 mr-1" /> Only in Opzenix
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Features You Won't Find Elsewhere</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Unique capabilities that set Opzenix apart from every competitor
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: History,
                  title: 'Checkpoint & Resume',
                  description: 'Failed pipeline? Resume exactly where you left off instead of restarting from scratch. No other platform offers this.'
                },
                {
                  icon: Shield,
                  title: 'Built-in Governance',
                  description: 'Approval workflows, environment locks, and audit logs included at no extra cost. Harness charges extra for these.'
                },
                {
                  icon: Eye,
                  title: 'Native OpenTelemetry',
                  description: 'First-class OTel support with automatic trace correlation across your entire pipeline. Zero configuration needed.'
                },
                {
                  icon: Sparkles,
                  title: 'AI-Powered Recovery',
                  description: 'Automatic failure analysis with actionable fix suggestions. Our AI learns from 100K+ pipeline runs.'
                },
                {
                  icon: Lock,
                  title: 'Environment Locks',
                  description: 'Freeze deployments to specific environments with one click. Perfect for production freezes during incidents.'
                },
                {
                  icon: GitBranch,
                  title: 'Branch-Environment Rules',
                  description: 'Automatically enforce which branches can deploy to which environments. Set it once, never worry again.'
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardContent className="p-6">
                      <feature.icon className="w-10 h-10 text-primary mb-4" />
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to See the Difference?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join hundreds of enterprises who've switched to Opzenix for better governance, 
                lower costs, and faster deployments.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" className="gap-2" asChild>
                  <Link to="/auth">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/product/pricing">
                    Calculate Your Savings
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