import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, X, Zap, Building2, Rocket, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EnterpriseNavigation from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';
import { PricingCalculator } from '@/components/pricing/PricingCalculator';
const Pricing = () => {
  const plans = [
    {
      name: 'Starter',
      icon: Rocket,
      price: '$0',
      period: 'forever',
      description: 'Perfect for small teams getting started with CI/CD governance.',
      features: [
        { name: 'Up to 3 team members', included: true },
        { name: '10 executions/month', included: true },
        { name: 'Basic governance rules', included: true },
        { name: 'Community support', included: true },
        { name: 'Advanced RBAC', included: false },
        { name: 'SSO integration', included: false },
        { name: 'Audit log export', included: false },
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Professional',
      icon: Zap,
      price: '$99',
      period: '/user/month',
      description: 'For growing teams that need advanced governance and observability.',
      features: [
        { name: 'Unlimited team members', included: true },
        { name: 'Unlimited executions', included: true },
        { name: 'Advanced governance rules', included: true },
        { name: 'Priority support', included: true },
        { name: 'Advanced RBAC', included: true },
        { name: 'SSO integration', included: true },
        { name: 'Audit log export', included: false },
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      icon: Building2,
      price: 'Custom',
      period: '',
      description: 'For large organizations with complex compliance and security needs.',
      features: [
        { name: 'Unlimited everything', included: true },
        { name: 'Custom governance policies', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: '24/7 enterprise support', included: true },
        { name: 'Advanced RBAC', included: true },
        { name: 'Enterprise SSO (SAML/OIDC)', included: true },
        { name: 'Audit log export & SIEM', included: true },
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

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
              <Sparkles className="w-3 h-3 mr-1" /> Pricing Plans
            </Badge>
            <h1 className="text-5xl font-bold mb-6">
              Simple, Transparent{' '}
              <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                Pricing
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative h-full ${plan.popular ? 'border-primary shadow-lg shadow-primary/10' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pt-8">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <plan.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-sec-safe" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/50" />
                          )}
                          <span className={feature.included ? '' : 'text-muted-foreground/50'}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link to={plan.name === 'Enterprise' ? '/company/contact' : '/auth'}>
                        {plan.cta}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Calculator */}
      <PricingCalculator />

      {/* FAQ Teaser */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Have Questions?</h2>
          <p className="text-muted-foreground mb-6">
            Our team is here to help you find the right plan for your organization.
          </p>
          <Button variant="outline" asChild>
            <Link to="/company/contact">Contact Sales</Link>
          </Button>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default Pricing;
