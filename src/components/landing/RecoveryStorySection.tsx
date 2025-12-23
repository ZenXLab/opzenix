import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  XCircle, 
  AlertTriangle, 
  RotateCcw, 
  Wrench, 
  Play, 
  CheckCircle2,
  ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

const storySteps = [
  {
    id: 1,
    icon: XCircle,
    title: 'Deployment fails',
    description: 'Container health check timeout after 30 seconds',
    status: 'failed',
  },
  {
    id: 2,
    icon: AlertTriangle,
    title: 'Risk highlighted',
    description: 'AI detects misconfigured memory limits',
    status: 'warning',
  },
  {
    id: 3,
    icon: RotateCcw,
    title: 'Checkpoint rewind',
    description: 'Restoring to last known good state',
    status: 'info',
  },
  {
    id: 4,
    icon: Wrench,
    title: 'Fix applied',
    description: 'Memory limit increased from 256MB to 512MB',
    status: 'info',
  },
  {
    id: 5,
    icon: Play,
    title: 'Resume from stage',
    description: 'Re-running deployment with updated config',
    status: 'running',
  },
  {
    id: 6,
    icon: CheckCircle2,
    title: 'Success',
    description: 'Deployment complete, health checks passing',
    status: 'success',
  },
];

const RecoveryStorySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const interval = setInterval(() => {
      setActiveStep(prev => {
        if (prev < storySteps.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <section ref={ref} className="min-h-screen py-24 px-8 bg-card/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Failure → Recovery
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Watch how a deployment failure is detected, diagnosed, and recovered—automatically.
          </p>
        </motion.div>

        {/* Story Timeline */}
        <div className="relative">
          {storySteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index <= activeStep;
            const isCurrent = index === activeStep;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={isActive ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                {/* Connector Line */}
                {index < storySteps.length - 1 && (
                  <div className="absolute left-5 top-12 w-0.5 h-8 bg-border">
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={isActive ? { scaleY: 1 } : {}}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className={cn(
                        "w-full h-full origin-top",
                        step.status === 'success' && "bg-node-success",
                        step.status === 'failed' && "bg-node-failed",
                        step.status === 'warning' && "bg-node-warning",
                        step.status === 'running' && "bg-node-running",
                        step.status === 'info' && "bg-ai-primary"
                      )}
                    />
                  </div>
                )}

                <div className={cn(
                  "flex items-start gap-4 p-4 rounded-xl transition-all mb-4",
                  isCurrent && "bg-secondary/50 border border-border"
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all",
                    step.status === 'success' && "bg-node-success/20 text-node-success",
                    step.status === 'failed' && "bg-node-failed/20 text-node-failed",
                    step.status === 'warning' && "bg-node-warning/20 text-node-warning",
                    step.status === 'running' && "bg-node-running/20 text-node-running",
                    step.status === 'info' && "bg-ai-primary/20 text-ai-primary",
                    !isActive && "opacity-30"
                  )}>
                    <Icon className={cn("w-5 h-5", isCurrent && step.status === 'running' && "animate-spin")} />
                  </div>
                  
                  <div className={cn("flex-1", !isActive && "opacity-30")}>
                    <h4 className="font-medium text-foreground mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>

                  {isCurrent && (
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="px-2 py-1 bg-primary/20 text-primary text-xs rounded"
                    >
                      active
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Result Summary */}
        {activeStep === storySteps.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8 p-6 rounded-xl bg-node-success/10 border border-node-success/30 text-center"
          >
            <CheckCircle2 className="w-12 h-12 text-node-success mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Zero Downtime Recovery
            </h4>
            <p className="text-sm text-muted-foreground">
              Total recovery time: 45 seconds. No manual intervention required.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default RecoveryStorySection;
