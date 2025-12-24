import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  GitBranch, ArrowRight, Shield, CheckCircle2, 
  Server, Eye, RotateCcw, Activity
} from 'lucide-react';

const flowSteps = [
  { icon: GitBranch, label: 'Code Push', sublabel: 'GitHub Webhook' },
  { icon: Shield, label: 'Governance', sublabel: 'Policy Check' },
  { icon: CheckCircle2, label: 'Approval', sublabel: 'RBAC Gate' },
  { icon: Server, label: 'Deploy', sublabel: 'Kubernetes' },
  { icon: Eye, label: 'Observe', sublabel: 'OpenTelemetry' },
  { icon: RotateCcw, label: 'Checkpoint', sublabel: 'State Saved' },
];

const LiveFlowPreviewSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-6 md:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 text-sm rounded-full bg-chart-1/10 text-chart-1 border border-chart-1/30">
            <Activity className="w-4 h-4" />
            Live Execution Flow
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Watch Your Pipeline{' '}
            <span className="bg-gradient-to-r from-chart-1 to-primary bg-clip-text text-transparent">
              Come Alive
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every deployment visualized in real-time with checkpoints, approvals, and instant rollback
          </p>
        </motion.div>

        {/* Animated Flow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative rounded-2xl border border-border bg-card/50 p-8 md:p-12 overflow-hidden"
        >
          {/* Background grid */}
          <div className="absolute inset-0 control-grid opacity-5" />
          
          {/* Flow visualization */}
          <div className="relative flex flex-wrap justify-center items-center gap-4 md:gap-0">
            {flowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={isInView ? { scale: 1, opacity: 1 } : {}}
                    transition={{ delay: 0.3 + index * 0.15, type: "spring" }}
                    className="relative"
                  >
                    {/* Node */}
                    <motion.div
                      className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-chart-1/10 border-2 border-primary/30 flex flex-col items-center justify-center cursor-pointer"
                      whileHover={{ scale: 1.1, borderColor: 'hsl(var(--primary))' }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {/* Pulse ring */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl border-2 border-primary/50"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.3,
                        }}
                      />
                      
                      <Icon className="w-6 h-6 md:w-8 md:h-8 text-primary mb-1" />
                      <span className="text-[10px] md:text-xs font-medium text-foreground">{step.label}</span>
                      <span className="text-[8px] md:text-[10px] text-muted-foreground">{step.sublabel}</span>
                      
                      {/* Status indicator */}
                      <motion.div
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sec-safe flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={isInView ? { scale: 1 } : {}}
                        transition={{ delay: 0.8 + index * 0.15 }}
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </motion.div>
                    </motion.div>
                  </motion.div>
                  
                  {/* Arrow connector */}
                  {index < flowSteps.length - 1 && (
                    <motion.div
                      className="hidden md:flex items-center mx-2"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
                      transition={{ delay: 0.5 + index * 0.15 }}
                    >
                      <motion.div 
                        className="w-8 h-0.5 bg-gradient-to-r from-primary to-chart-1"
                        animate={{
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: index * 0.2,
                        }}
                      />
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.5 }}
            className="mt-10 pt-8 border-t border-border flex flex-wrap justify-center gap-8 text-center"
          >
            {[
              { value: '6', label: 'Stages' },
              { value: '2.4s', label: 'Avg Stage Time' },
              { value: '14.2s', label: 'Total Duration' },
              { value: '0', label: 'Failures' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.6 + index * 0.1 }}
              >
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default LiveFlowPreviewSection;
