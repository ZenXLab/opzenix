import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, Key, Lock, FileSearch, ScanSearch, Server } from 'lucide-react';

const securityFeatures = [
  { icon: ScanSearch, label: 'SAST, DAST, Image Scanning' },
  { icon: Key, label: 'Azure Key Vault, HashiCorp Vault, KMS' },
  { icon: Lock, label: 'Zero-Trust execution model' },
  { icon: Shield, label: 'Immutable artifacts' },
  { icon: FileSearch, label: 'Full audit trails' },
  { icon: Server, label: 'SOC2 / ISO-ready architecture' },
];

const SecuritySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1 mb-4 text-sm rounded-full bg-sec-safe/10 text-sec-safe border border-sec-safe/30">
            Security & Compliance
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Security, Compliance, and Control
            <span className="block text-primary">By Design</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="p-5 rounded-xl border border-border bg-card/50 hover:bg-card transition-all flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-sec-safe/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-sec-safe" />
                </div>
                <span className="text-sm text-foreground">{feature.label}</span>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          * SOC2 and ISO certifications in progress. Current architecture is compliant-ready.
        </motion.p>
      </div>
    </section>
  );
};

export default SecuritySection;
