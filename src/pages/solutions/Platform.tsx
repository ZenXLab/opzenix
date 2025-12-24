import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Layers, Workflow, Settings, Users, Shield, Activity,
  ArrowRight, Code, Database, Cloud, CheckCircle2
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
      description: 'Enable developers to create and manage their own pipelines with guardrails.',
    },
    {
      icon: Shield,
      title: 'Policy as Code',
      description: 'Define governance policies that automatically enforce compliance.',
    },
    {
      icon: Activity,
      title: 'Platform Observability',
      description: 'End-to-end visibility across all developer workloads.',
    },
    {
      icon: Users,
      title: 'Developer Experience',
      description: 'Abstract away infrastructure complexity for faster shipping.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <EnterpriseNavigation />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-chart-1/10 via-transparent to-primary/5" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge variant="outline" className="mb-4 border-chart-1/30">
              <Layers className="w-3 h-3 mr-1" /> Platform Engineering
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Build Your{' '}
              <span className="bg-gradient-to-r from-chart-1 to-primary bg-clip-text text-transparent">
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

      {/* Capabilities */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {capabilities.map((cap, index) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-chart-1/20 to-primary/20 flex items-center justify-center mb-6">
                      <cap.icon className="w-7 h-7 text-chart-1" />
                    </div>
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
      <section className="py-20 px-6">
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
                    className="text-center p-6 rounded-xl bg-muted/50 border"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold">{item.label}</h4>
                    <p className="text-sm text-muted-foreground">{item.sublabel}</p>
                  </motion.div>
                  {index < 2 && (
                    <ArrowRight className="absolute top-1/2 -right-6 -translate-y-1/2 w-8 h-8 text-muted-foreground/30 hidden md:block" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default Platform;
