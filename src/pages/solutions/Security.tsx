import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Shield, Lock, Eye, FileCheck, AlertTriangle, Users,
  CheckCircle2, ArrowRight, Key, Fingerprint
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import EnterpriseNavigation from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';

const Security = () => {
  const securityFeatures = [
    {
      icon: Shield,
      title: 'SOC2 Type II Certified',
      description: 'Annual third-party audits ensure enterprise-grade security controls.',
    },
    {
      icon: Lock,
      title: 'Zero-Trust Architecture',
      description: 'Every request authenticated and authorized with least-privilege access.',
    },
    {
      icon: Fingerprint,
      title: 'Enterprise SSO',
      description: 'SAML 2.0, OIDC, Azure AD, Okta, and custom identity providers.',
    },
    {
      icon: Eye,
      title: 'Complete Audit Trail',
      description: 'Every action logged with user, timestamp, and change details.',
    },
    {
      icon: FileCheck,
      title: 'Compliance Ready',
      description: 'GDPR, HIPAA, PCI-DSS, ISO 27001 compliance support.',
    },
    {
      icon: Key,
      title: 'Secrets Management',
      description: 'Native integration with HashiCorp Vault and Azure Key Vault.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <EnterpriseNavigation />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sec-safe/10 via-transparent to-primary/5" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge variant="outline" className="mb-4 border-sec-safe/30">
              <Shield className="w-3 h-3 mr-1" /> Enterprise Security
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Security-First{' '}
              <span className="bg-gradient-to-r from-sec-safe to-primary bg-clip-text text-transparent">
                By Design
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Built from the ground up with enterprise security requirements. 
              Your pipelines, your data, protected.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/company/contact">Request Security Review</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/docs/security/permission-model">Security Docs</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-6 border-y bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8">
            {['SOC2 Type II', 'ISO 27001', 'GDPR', 'HIPAA Ready', 'PCI-DSS'].map((cert, index) => (
              <motion.div
                key={cert}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sec-safe/10 border border-sec-safe/30"
              >
                <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                <span className="font-medium text-sm">{cert}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:border-sec-safe/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-sec-safe/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-sec-safe" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-sec-safe/10 via-background to-primary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Need a Security Review?</h2>
          <p className="text-muted-foreground mb-8">
            Our security team is available to walk through our architecture and controls.
          </p>
          <Button size="lg" asChild>
            <Link to="/company/contact">
              Contact Security Team <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default Security;
