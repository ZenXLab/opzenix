import { motion } from 'framer-motion';
import { Cloud, Github, Activity, Shield, Lock, Server } from 'lucide-react';

const trustItems = [
  { icon: Cloud, label: 'Azure AKS' },
  { icon: Github, label: 'GitHub Actions' },
  { icon: Activity, label: 'OpenTelemetry' },
  { icon: Server, label: 'Kubernetes' },
  { icon: Shield, label: 'SOC2 Ready' },
  { icon: Lock, label: 'Zero-Trust' },
];

const TrustStripSection = () => {
  return (
    <section className="py-8 px-8 border-y border-border bg-card/30">
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mb-6"
        >
          Designed for regulated, security-first, and large-scale cloud environments
        </motion.p>
        
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {trustItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStripSection;
