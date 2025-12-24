import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle2, Code, Settings, Shield, Package, Server, Activity } from 'lucide-react';

const flowSteps = [
  { icon: Code, label: 'Developer', color: 'text-ai-primary' },
  { icon: Settings, label: 'GitHub', color: 'text-muted-foreground' },
  { icon: Settings, label: 'CI', color: 'text-muted-foreground' },
  { icon: Shield, label: 'Security', color: 'text-sec-warning' },
  { icon: Package, label: 'Artifacts', color: 'text-primary' },
  { icon: Server, label: 'AKS', color: 'text-sec-safe' },
  { icon: Activity, label: 'Runtime', color: 'text-ai-primary' },
];

const benefits = [
  'No SDKs required',
  'No YAML expertise needed',
  'No blind deployments',
  'No irreversible actions',
];

const qualities = [
  { label: 'Visual', icon: CheckCircle2 },
  { label: 'Auditable', icon: CheckCircle2 },
  { label: 'Recoverable', icon: CheckCircle2 },
];

const HowItWorksSection = () => {
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
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            From Git Push to Production
          </h2>
          <p className="text-xl text-primary font-semibold">
            Fully Visible, Fully Controlled
          </p>
        </motion.div>

        {/* Visual Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="mb-12 p-6 rounded-xl border border-border bg-card overflow-x-auto"
        >
          <div className="flex items-center justify-between min-w-[800px] gap-2">
            {flowSteps.map((step, index) => (
              <div key={step.label} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center`}>
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
                </motion.div>
                {index < flowSteps.length - 1 && (
                  <div className="w-12 h-0.5 bg-border mx-2" />
                )}
              </div>
            ))}
          </div>
          
          {/* Checkpoints annotation */}
          <div className="mt-4 pt-4 border-t border-border text-center">
            <span className="text-xs text-primary font-medium">
              ↑ Checkpoints + Approvals at every critical stage
            </span>
          </div>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-xl border border-border bg-card/50"
          >
            <h4 className="text-lg font-semibold text-foreground mb-4">What you don't need:</h4>
            <ul className="space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-sec-safe" />
                  {benefit}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-xl border border-primary/30 bg-primary/5"
          >
            <h4 className="text-lg font-semibold text-foreground mb-4">Everything is:</h4>
            <div className="flex flex-wrap gap-4">
              {qualities.map((quality) => (
                <div key={quality.label} className="flex items-center gap-2">
                  <quality.icon className="w-5 h-5 text-sec-safe" />
                  <span className="text-foreground font-medium">{quality.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
