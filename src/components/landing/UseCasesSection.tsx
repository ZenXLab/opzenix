import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronDown, Cloud, Shield, Workflow, FileCheck, Lock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const useCases = [
  { 
    icon: Cloud, 
    title: 'Enterprise CI/CD for Kubernetes',
    description: 'Full pipeline orchestration from code to production on AKS, EKS, or GKE with built-in governance.',
  },
  { 
    icon: Shield, 
    title: 'Secure Deployments on AKS',
    description: 'Azure-native integration with Container Registry, Key Vault, and managed identities.',
  },
  { 
    icon: Workflow, 
    title: 'Governed Multi-Environment Delivery',
    description: 'Approval gates and checkpoints across dev, staging, and production environments.',
  },
  { 
    icon: FileCheck, 
    title: 'Audit-Ready DevOps Pipelines',
    description: 'Complete execution history with immutable logs for SOC2 and ISO compliance.',
  },
  { 
    icon: Lock, 
    title: 'Regulated Cloud Deployments',
    description: 'Meet financial, healthcare, and government compliance requirements out of the box.',
  },
  { 
    icon: Activity, 
    title: 'Zero-Trust CI/CD Orchestration',
    description: 'Every action is verified, logged, and traceable with OpenTelemetry integration.',
  },
];

const UseCasesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <section ref={ref} className="py-24 px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1 mb-4 text-sm rounded-full bg-ai-primary/10 text-ai-primary border border-ai-primary/30">
            Use Cases
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Enterprise Deployment Scenarios
          </h2>
        </motion.div>

        <div className="space-y-3">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            const isExpanded = expandedIndex === index;

            return (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full p-5 flex items-center justify-between bg-card hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground text-left">{useCase.title}</span>
                  </div>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180"
                  )} />
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-2 text-muted-foreground">
                        {useCase.description}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
