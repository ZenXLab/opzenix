import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Shield, Lock, Users, Building2, Globe, CheckCircle2, 
  FileCheck, Headphones, Server, ArrowRight, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import EnterpriseNavigation from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';

const Enterprise = () => {
  const benefits = [
    {
      icon: Shield,
      title: 'SOC2 Type II Certified',
      description: 'Enterprise-grade security with annual audits and compliance reports.',
    },
    {
      icon: Lock,
      title: 'Enterprise SSO',
      description: 'SAML 2.0, OIDC, Azure AD, and Okta integration out of the box.',
    },
    {
      icon: Users,
      title: 'Advanced RBAC',
      description: 'Granular role-based access control with custom policy support.',
    },
    {
      icon: FileCheck,
      title: 'Audit & Compliance',
      description: 'Complete audit trail with SIEM integration and export capabilities.',
    },
    {
      icon: Server,
      title: 'Dedicated Infrastructure',
      description: 'Private cloud deployment with data residency options.',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Dedicated account manager and priority support SLA.',
    },
  ];

  const logos = [
    'Fortune 500 Banks', 'Global Healthcare', 'Government Agencies', 
    'Tech Giants', 'Financial Services', 'Manufacturing Leaders'
  ];

  return (
    <div className="min-h-screen bg-background">
      <EnterpriseNavigation />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-1/5" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge variant="outline" className="mb-4 border-primary/30">
              <Building2 className="w-3 h-3 mr-1" /> Enterprise Solutions
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Built for{' '}
              <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                Enterprise Scale
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Trusted by Fortune 500 companies to govern mission-critical delivery pipelines 
              with bank-grade security and compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/company/contact">
                  Request Demo <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/docs">View Documentation</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Logos */}
      <section className="py-12 px-6 border-y bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-8">
            TRUSTED BY INDUSTRY LEADERS
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {logos.map((logo, index) => (
              <motion.div
                key={logo}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="px-6 py-3 rounded-lg bg-background/50 border text-muted-foreground font-medium"
              >
                {logo}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Enterprise-Grade Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to meet the strictest compliance and security requirements.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/10 via-background to-chart-1/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Delivery?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Let us show you how Opzenix can help your organization achieve faster, safer deployments.
            </p>
            <Button size="lg" asChild>
              <Link to="/company/contact">
                Schedule a Demo <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default Enterprise;
