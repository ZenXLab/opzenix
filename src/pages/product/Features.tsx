import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  GitBranch, Shield, Eye, Play, CheckCircle2, Zap, Lock, 
  RotateCcw, Activity, Users, Workflow, ArrowRight, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import EnterpriseNavigation from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';
import InteractivePlatformDemo from '@/components/demo/InteractivePlatformDemo';

const Features = () => {
  const features = [
    {
      icon: Workflow,
      title: 'Visual Execution Flows',
      description: 'See your entire CI/CD pipeline as an interactive flow diagram with real-time status updates.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Shield,
      title: 'Governance Gates',
      description: 'Enforce approval workflows, environment locks, and RBAC policies at every deployment stage.',
      color: 'text-sec-safe',
      bgColor: 'bg-sec-safe/10',
    },
    {
      icon: RotateCcw,
      title: 'Checkpoint & Rewind',
      description: 'Capture state at any execution point and instantly rollback to previous checkpoints.',
      color: 'text-chart-1',
      bgColor: 'bg-chart-1/10',
    },
    {
      icon: Activity,
      title: 'OpenTelemetry Native',
      description: 'Built-in observability with traces, metrics, and logs for every execution.',
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      icon: Lock,
      title: 'Enterprise Security',
      description: 'SOC2 Type II certified with Azure AD SSO, RBAC, and audit logging.',
      color: 'text-sec-warning',
      bgColor: 'bg-sec-warning/10',
    },
    {
      icon: Users,
      title: 'Multi-Team Collaboration',
      description: 'Role-based access control with team hierarchies and approval chains.',
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <InteractivePlatformDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
      <EnterpriseNavigation />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4 border-primary/30">
              <Sparkles className="w-3 h-3 mr-1" /> Platform Features
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Enterprise CI/CD{' '}
              <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                Control Plane
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Everything you need to govern, observe, and control your delivery pipelines at scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth">Start Free Trial</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/docs">View Documentation</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl border bg-card/50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-1/5" />
            <div className="relative p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge variant="outline" className="mb-4">Live Preview</Badge>
                  <h2 className="text-3xl font-bold mb-4">See It In Action</h2>
                  <p className="text-muted-foreground mb-6">
                    Watch how Opzenix orchestrates deployments with real-time visibility, 
                    governance enforcement, and instant rollback capabilities.
                  </p>
                  <Button onClick={() => setDemoOpen(true)}>
                    Launch Demo <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
                <div className="relative aspect-video rounded-xl bg-background/50 border overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center"
                    >
                      <Play className="w-8 h-8 text-primary" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default Features;
