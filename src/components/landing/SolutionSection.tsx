import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { RefreshCw, Shield, Eye, Cloud } from 'lucide-react';

const pillars = [
  {
    icon: RefreshCw,
    title: 'Flow-First Execution',
    description: 'Visual, real-time execution maps. No YAML-first experience. Every step is inspectable.',
    color: 'text-ai-primary',
    bgColor: 'bg-ai-primary/10',
  },
  {
    icon: Shield,
    title: 'Built-In Governance',
    description: 'Approval gates, audit trails, role-based controls, and checkpoint-based recovery.',
    color: 'text-sec-safe',
    bgColor: 'bg-sec-safe/10',
  },
  {
    icon: Eye,
    title: 'Real-Time Observability',
    description: 'Logs, traces, and metrics correlated. Every deployment tied to system signals. Powered by OpenTelemetry.',
    color: 'text-sec-warning',
    bgColor: 'bg-sec-warning/10',
  },
  {
    icon: Cloud,
    title: 'Cloud & Kubernetes Native',
    description: 'AKS, EKS, GKE, On-prem. ACR, ECR, Docker Hub. Blue-Green & Canary deployments.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
];

const SolutionSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-8 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1 mb-4 text-sm rounded-full bg-primary/10 text-primary border border-primary/30">
            The Opzenix Solution
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            A Visual, Governed, Real-Time
            <span className="block text-primary">Execution Control Plane</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl border border-border bg-card hover:bg-card/80 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${pillar.bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${pillar.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{pillar.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
