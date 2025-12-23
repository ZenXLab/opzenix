import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Code, Brain, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const operationTypes = [
  {
    id: 'cicd',
    name: 'CI/CD',
    icon: Code,
    description: 'Application deployment pipelines',
    stages: ['Build', 'Test', 'Security', 'Deploy', 'Monitor'],
  },
  {
    id: 'mlops',
    name: 'MLOps',
    icon: Brain,
    description: 'Machine learning model lifecycle',
    stages: ['Data Prep', 'Train', 'Evaluate', 'Registry', 'Serve'],
  },
  {
    id: 'llmops',
    name: 'LLMOps',
    icon: MessageSquare,
    description: 'Prompt and model management',
    stages: ['Design', 'Validate', 'Guardrails', 'Deploy', 'Feedback'],
  },
];

const UnifiedOpsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeType, setActiveType] = useState('cicd');

  const activeOp = operationTypes.find(op => op.id === activeType);

  return (
    <section ref={ref} className="min-h-screen py-24 px-8 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            One Platform. All Operations.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            CI/CD, MLOps, and LLMOps unified under the same governance and visibility model.
          </p>
        </motion.div>

        {/* Operation Type Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center gap-4 mb-12"
        >
          {operationTypes.map(op => {
            const Icon = op.icon;
            return (
              <Button
                key={op.id}
                variant={activeType === op.id ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveType(op.id)}
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                {op.name}
              </Button>
            );
          })}
        </motion.div>

        {/* Flow Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeType}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-background border border-border rounded-xl p-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {activeOp?.name} Pipeline
                </h3>
                <p className="text-sm text-muted-foreground">{activeOp?.description}</p>
              </div>

              {/* Stages Flow */}
              <div className="flex items-center justify-center gap-2">
                {activeOp?.stages.map((stage, index) => (
                  <div key={stage} className="flex items-center">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "px-6 py-3 rounded-lg border-2 transition-all",
                        index === 0 && "bg-node-success/10 border-node-success",
                        index === activeOp.stages.length - 1 && "bg-primary/10 border-primary",
                        index > 0 && index < activeOp.stages.length - 1 && "bg-card border-border"
                      )}
                    >
                      <span className="text-sm font-medium text-foreground">{stage}</span>
                    </motion.div>
                    {index < activeOp.stages.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-muted-foreground mx-1" />
                    )}
                  </div>
                ))}
              </div>

              {/* Unified Features */}
              <div className="mt-10 grid grid-cols-3 gap-6 pt-8 border-t border-border">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-ai-primary/20 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-ai-primary text-lg">🔒</span>
                  </div>
                  <p className="text-sm text-foreground font-medium">Same Governance</p>
                  <p className="text-xs text-muted-foreground">Unified approval workflows</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-ai-primary/20 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-ai-primary text-lg">👁️</span>
                  </div>
                  <p className="text-sm text-foreground font-medium">Same Visibility</p>
                  <p className="text-xs text-muted-foreground">Consistent monitoring</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-ai-primary/20 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-ai-primary text-lg">⚡</span>
                  </div>
                  <p className="text-sm text-foreground font-medium">Same Recovery</p>
                  <p className="text-xs text-muted-foreground">Checkpoint-based rollback</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default UnifiedOpsSection;
