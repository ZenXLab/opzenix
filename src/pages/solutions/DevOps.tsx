import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  GitBranch, Workflow, RotateCcw, Activity, Shield, 
  Zap, CheckCircle2, ArrowRight, Terminal, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import EnterpriseNavigation from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';

const DevOps = () => {
  const challenges = [
    {
      problem: 'Scattered CI/CD visibility',
      solution: 'Unified control plane with real-time execution flows',
    },
    {
      problem: 'Rollback nightmares',
      solution: 'One-click checkpoint rewind to any previous state',
    },
    {
      problem: 'Compliance bottlenecks',
      solution: 'Automated governance with approval gates',
    },
    {
      problem: 'Debug fatigue',
      solution: 'OpenTelemetry-native tracing across all stages',
    },
  ];

  const stats = [
    { value: '90%', label: 'Faster incident recovery' },
    { value: '75%', label: 'Fewer deployment failures' },
    { value: '10x', label: 'Faster rollback time' },
    { value: '99.9%', label: 'Deployment reliability' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <EnterpriseNavigation />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <Badge variant="outline" className="mb-4 border-primary/30">
                <Terminal className="w-3 h-3 mr-1" /> For DevOps Teams
              </Badge>
              <h1 className="text-5xl font-bold mb-6">
                DevOps Without the{' '}
                <span className="bg-gradient-to-r from-sec-critical to-sec-warning bg-clip-text text-transparent">
                  Drama
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Stop firefighting deployments. Get complete visibility, instant rollbacks, 
                and automated governance for your entire delivery pipeline.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link to="/auth">Start Free Trial</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/docs/getting-started/quickstart">Quick Start Guide</Link>
                </Button>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-chart-1/10 to-transparent border p-8 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <Workflow className="w-32 h-32 text-primary/50" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-muted/30 border-y">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Your Problems, Solved</h2>
            <p className="text-muted-foreground">
              We understand the challenges DevOps teams face every day.
            </p>
          </motion.div>

          <div className="space-y-6">
            {challenges.map((item, index) => (
              <motion.div
                key={item.problem}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6 flex items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sec-critical mb-2">
                        <span className="w-2 h-2 rounded-full bg-sec-critical" />
                        <span className="text-sm font-medium">Problem</span>
                      </div>
                      <p className="font-medium">{item.problem}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sec-safe mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Solution</span>
                      </div>
                      <p className="font-medium">{item.solution}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary/10 via-background to-chart-1/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Level Up Your DevOps?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of DevOps engineers who trust Opzenix for their critical deployments.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth">Start Free Trial</Link>
          </Button>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default DevOps;
