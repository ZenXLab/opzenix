import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const comparisonData = [
  { feature: 'Visual execution flows', github: false, harness: 'partial', opzenix: true },
  { feature: 'Checkpoint-based recovery', github: false, harness: false, opzenix: true },
  { feature: 'Built-in approvals & audit', github: 'partial', harness: 'partial', opzenix: true },
  { feature: 'OTel-native correlation', github: false, harness: false, opzenix: true },
  { feature: 'CI + CD + Ops unified', github: false, harness: 'partial', opzenix: true },
  { feature: 'Enterprise-first UX', github: false, harness: 'partial', opzenix: true },
];

const getIcon = (value: boolean | string) => {
  if (value === true) return <CheckCircle2 className="w-5 h-5 text-sec-safe" />;
  if (value === 'partial') return <AlertCircle className="w-5 h-5 text-sec-warning" />;
  return <XCircle className="w-5 h-5 text-muted-foreground/50" />;
};

const ComparisonSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-8 bg-card/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Why Enterprises Choose Opzenix
          </h2>
          <p className="text-muted-foreground">Feature comparison with industry alternatives</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-4 bg-card border-b border-border">
            <div className="p-4 font-semibold text-foreground">Capability</div>
            <div className="p-4 text-center font-semibold text-muted-foreground">GitHub / GitLab</div>
            <div className="p-4 text-center font-semibold text-muted-foreground">Harness</div>
            <div className="p-4 text-center font-semibold text-primary bg-primary/5">Opzenix</div>
          </div>

          {/* Rows */}
          {comparisonData.map((row, index) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="grid grid-cols-4 border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
            >
              <div className="p-4 text-sm text-foreground">{row.feature}</div>
              <div className="p-4 flex justify-center">{getIcon(row.github)}</div>
              <div className="p-4 flex justify-center">{getIcon(row.harness)}</div>
              <div className="p-4 flex justify-center bg-primary/5">{getIcon(row.opzenix)}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;
