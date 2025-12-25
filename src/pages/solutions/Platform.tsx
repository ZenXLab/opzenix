import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Layers, Workflow, Settings, Users, Shield, Activity,
  ArrowRight, Code, Database, Cloud, CheckCircle2,
  Boxes, GitBranch, Zap, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import EnterpriseNavigation from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';

const Platform = () => {
  const capabilities = [
    {
      icon: Workflow,
      title: 'Self-Service Pipelines',
      description: 'Enable developers to create and manage their own pipelines with guardrails and golden paths.',
    },
    {
      icon: Shield,
      title: 'Policy as Code',
      description: 'Define governance policies that automatically enforce compliance across all teams.',
    },
    {
      icon: Activity,
      title: 'Platform Observability',
      description: 'End-to-end visibility across all developer workloads with OpenTelemetry integration.',
    },
    {
      icon: Users,
      title: 'Developer Experience',
      description: 'Abstract away infrastructure complexity so developers can focus on shipping.',
    },
  ];

  const benefits = [
    { icon: Zap, label: '10x Faster Onboarding', description: 'New developers productive in hours, not weeks' },
    { icon: Lock, label: 'Zero-Trust Security', description: 'Every deployment verified and audited' },
    { icon: Boxes, label: 'Reusable Templates', description: 'Build once, deploy everywhere' },
    { icon: GitBranch, label: 'GitOps Native', description: 'Everything versioned, everything auditable' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <EnterpriseNavigation />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/5" />
        
        {/* Animated grid background */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
            animate={{ 
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge variant="outline" className="mb-4 border-accent/30">
              <Layers className="w-3 h-3 mr-1" /> Platform Engineering
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Build Your{' '}
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Internal Developer Platform
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Opzenix provides the foundation for platform teams to build 
              golden paths that developers love while maintaining enterprise governance.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth">Start Building</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/docs">Platform Docs</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Banner */}
      <section className="py-12 px-6 bg-muted/30 border-y overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: index * 0.5 }}
                >
                  <benefit.icon className="w-6 h-6 text-primary" />
                </motion.div>
                <h4 className="font-semibold text-sm mb-1">{benefit.label}</h4>
                <p className="text-xs text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Platform Capabilities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build and operate an internal developer platform.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {capabilities.map((cap, index) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="p-8">
                    <motion.div 
                      className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-6"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <cap.icon className="w-7 h-7 text-accent" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-3">{cap.title}</h3>
                    <p className="text-muted-foreground">{cap.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Preview */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">The Platform Engineering Stack</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Opzenix integrates with your existing tools to create a unified developer experience.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl border bg-card/50 p-8"
          >
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Code, label: 'Developers', sublabel: 'Self-service' },
                { icon: Layers, label: 'Opzenix', sublabel: 'Control Plane' },
                { icon: Cloud, label: 'Infrastructure', sublabel: 'Kubernetes, Cloud' },
              ].map((item, index) => (
                <div key={item.label} className="relative">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-6 rounded-xl bg-muted/50 border"
                  >
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
                      animate={index === 1 ? { 
                        boxShadow: [
                          '0 0 0 0 hsl(var(--primary) / 0)',
                          '0 0 0 10px hsl(var(--primary) / 0.1)',
                          '0 0 0 0 hsl(var(--primary) / 0)'
                        ]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <item.icon className="w-6 h-6 text-primary" />
                    </motion.div>
                    <h4 className="font-semibold">{item.label}</h4>
                    <p className="text-sm text-muted-foreground">{item.sublabel}</p>
                  </motion.div>
                  {index < 2 && (
                    <motion.div
                      className="absolute top-1/2 -right-6 -translate-y-1/2 hidden md:block"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-8 h-8 text-muted-foreground/30" />
                    </motion.div>
                  )}
                </div>
              ))}
            </div>

            {/* Data flow animation */}
            <div className="mt-8 relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-primary/50 to-accent/50 rounded-full"
                animate={{ x: ['0%', '200%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Continuous flow from developer intent to production deployment
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-accent/10 via-background to-primary/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Build Your Platform?</h2>
            <p className="text-muted-foreground mb-8">
              Join leading platform teams who use Opzenix to power their internal developer platforms.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/company/contact">Talk to Sales</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default Platform;