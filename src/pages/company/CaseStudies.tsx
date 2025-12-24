import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Building2, TrendingUp, Clock, Shield, Users, ArrowRight, 
  CheckCircle2, Quote, BarChart3, Zap, Globe, Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EnterpriseNavigation from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';

const caseStudies = [
  {
    id: 'fintech-global',
    company: 'GlobalPay Financial',
    industry: 'Financial Services',
    logo: Building2,
    color: 'from-blue-500 to-cyan-500',
    challenge: 'Manual deployment approvals causing 72-hour delays in production releases, with no audit trail for compliance.',
    solution: 'Implemented Opzenix with automated approval workflows, environment locks, and comprehensive audit logging.',
    results: [
      { metric: '85%', label: 'Faster Deployments' },
      { metric: '100%', label: 'Audit Compliance' },
      { metric: '$2.4M', label: 'Annual Savings' },
      { metric: '0', label: 'Compliance Incidents' },
    ],
    quote: "Opzenix transformed our deployment process from a week-long ordeal to a same-day operation. The governance features gave our compliance team the visibility they needed.",
    author: 'Sarah Chen',
    role: 'VP of Engineering',
    timeline: '3 months implementation',
    teamSize: '250+ engineers',
  },
  {
    id: 'healthcare-tech',
    company: 'MedSecure Health',
    industry: 'Healthcare Technology',
    logo: Shield,
    color: 'from-emerald-500 to-teal-500',
    challenge: 'HIPAA compliance requirements made deployments complex, with no centralized view of who deployed what and when.',
    solution: 'Deployed Opzenix with RBAC, checkpoint recovery, and OpenTelemetry integration for complete observability.',
    results: [
      { metric: '99.9%', label: 'Uptime SLA' },
      { metric: '15min', label: 'MTTR Reduction' },
      { metric: 'SOC2', label: 'Certified' },
      { metric: '40%', label: 'Fewer Incidents' },
    ],
    quote: "The checkpoint and rollback features have been game-changers. When issues arise, we can recover in minutes instead of hours.",
    author: 'Dr. Michael Torres',
    role: 'CTO',
    timeline: '6 weeks implementation',
    teamSize: '80 engineers',
  },
  {
    id: 'ecommerce-scale',
    company: 'ShopStream Commerce',
    industry: 'E-Commerce',
    logo: Globe,
    color: 'from-purple-500 to-pink-500',
    challenge: 'Black Friday deployments were high-risk events. One failed deployment cost $3M in lost revenue.',
    solution: 'Integrated Opzenix with canary deployments, automatic rollbacks, and real-time monitoring dashboards.',
    results: [
      { metric: '500+', label: 'Daily Deployments' },
      { metric: '$0', label: 'Deployment Losses' },
      { metric: '3x', label: 'Release Velocity' },
      { metric: '99.99%', label: 'Success Rate' },
    ],
    quote: "We went from dreading Black Friday deployments to confidently shipping features during peak traffic. Opzenix gave us that confidence.",
    author: 'Jennifer Park',
    role: 'Director of Platform Engineering',
    timeline: '2 months implementation',
    teamSize: '150 engineers',
  },
  {
    id: 'saas-startup',
    company: 'DataFlow Analytics',
    industry: 'SaaS / Analytics',
    logo: BarChart3,
    color: 'from-orange-500 to-red-500',
    challenge: 'Rapid growth meant scaling from 5 to 50 microservices. Deployment coordination became chaotic.',
    solution: 'Adopted Opzenix for visual pipeline orchestration, multi-environment management, and team collaboration.',
    results: [
      { metric: '50+', label: 'Microservices' },
      { metric: '10x', label: 'Team Scaling' },
      { metric: '2hrs', label: 'Onboarding Time' },
      { metric: '90%', label: 'Less Config Drift' },
    ],
    quote: "Opzenix scaled with us. What started as a simple CI/CD tool became our entire deployment governance platform.",
    author: 'Alex Kumar',
    role: 'Co-Founder & CTO',
    timeline: '4 weeks implementation',
    teamSize: '50 engineers',
  },
];

const CaseStudies = () => {
  return (
    <div className="min-h-screen bg-background">
      <EnterpriseNavigation />
      
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4 border-primary/30">
              <Building2 className="w-3 h-3 mr-1" /> Customer Success
            </Badge>
            <h1 className="text-5xl font-bold mb-6">
              Enterprise{' '}
              <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                Case Studies
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how leading enterprises use Opzenix to transform their CI/CD governance and accelerate delivery with confidence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-12 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '500+', label: 'Enterprise Customers' },
              { value: '10M+', label: 'Deployments/Month' },
              { value: '99.9%', label: 'Platform Uptime' },
              { value: '85%', label: 'Avg. Time Savings' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          {caseStudies.map((study, index) => (
            <motion.div
              key={study.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${study.color}`} />
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${study.color} flex items-center justify-center`}>
                        <study.logo className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{study.company}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{study.industry}</Badge>
                          <span className="text-sm text-muted-foreground">• {study.teamSize}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {study.timeline}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Challenge & Solution */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-sec-critical/5 rounded-lg border border-sec-critical/20">
                      <h4 className="font-semibold text-sec-critical mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> The Challenge
                      </h4>
                      <p className="text-muted-foreground">{study.challenge}</p>
                    </div>
                    <div className="p-4 bg-sec-safe/5 rounded-lg border border-sec-safe/20">
                      <h4 className="font-semibold text-sec-safe mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> The Solution
                      </h4>
                      <p className="text-muted-foreground">{study.solution}</p>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {study.results.map((result, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="text-center p-4 bg-muted/30 rounded-lg"
                      >
                        <div className="text-2xl font-bold text-primary">{result.metric}</div>
                        <div className="text-sm text-muted-foreground">{result.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="relative p-6 bg-card rounded-xl border">
                    <Quote className="absolute top-4 left-4 w-8 h-8 text-primary/20" />
                    <blockquote className="pl-8 text-lg italic text-foreground mb-4">
                      "{study.quote}"
                    </blockquote>
                    <div className="pl-8 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{study.author}</div>
                        <div className="text-sm text-muted-foreground">{study.role}, {study.company}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Write Your Success Story?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join hundreds of enterprises who have transformed their delivery pipelines with Opzenix.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/company/contact">
                  Schedule a Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/product/pricing">View Pricing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default CaseStudies;
