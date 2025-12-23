import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, FileCheck, Clock, Users, Lock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Shield,
    title: 'SOC2 Compliant',
    description: 'Built with enterprise security standards',
    status: 'verified',
  },
  {
    icon: FileCheck,
    title: 'Audit Ready',
    description: 'Complete execution history with timestamps',
    status: 'verified',
  },
  {
    icon: Clock,
    title: '99.9% Uptime',
    description: 'Enterprise SLA with guaranteed availability',
    status: 'verified',
  },
  {
    icon: Users,
    title: 'RBAC',
    description: 'Role-based access control for teams',
    status: 'verified',
  },
  {
    icon: Lock,
    title: 'Encryption',
    description: 'End-to-end encryption for all data',
    status: 'verified',
  },
  {
    icon: Eye,
    title: 'Full Visibility',
    description: 'No hidden operations or black boxes',
    status: 'verified',
  },
];

const EnterpriseSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Built for Enterprise
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built for regulated, mission-critical systems.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl border border-border bg-card/50 hover:bg-card transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{feature.title}</h4>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-node-success" />
                </div>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default EnterpriseSection;
