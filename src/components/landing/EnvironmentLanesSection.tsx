import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, GitBranch, Shield, Zap, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const environments = [
  {
    name: 'Preview',
    icon: GitBranch,
    strategy: 'Feature Branch',
    status: 'active',
    traffic: '0%',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
  },
  {
    name: 'Development',
    icon: Zap,
    strategy: 'Rolling',
    status: 'active',
    traffic: '0%',
    color: 'text-node-running',
    bgColor: 'bg-node-running/10',
  },
  {
    name: 'Staging',
    icon: Shield,
    strategy: 'Canary',
    status: 'deploying',
    traffic: '20%',
    color: 'text-node-warning',
    bgColor: 'bg-node-warning/10',
  },
  {
    name: 'Production',
    icon: Users,
    strategy: 'Blue-Green',
    status: 'stable',
    traffic: '100%',
    color: 'text-node-success',
    bgColor: 'bg-node-success/10',
  },
];

const EnvironmentLanesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="min-h-screen py-24 px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Multi-Environment Deployments
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Different strategies per environment. Full visibility across all stages.
          </p>
        </motion.div>

        {/* Environment Lanes */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-muted via-border to-muted" />
          
          <div className="relative grid grid-cols-4 gap-4">
            {environments.map((env, index) => {
              const Icon = env.icon;
              return (
                <motion.div
                  key={env.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative"
                >
                  {/* Arrow */}
                  {index < environments.length - 1 && (
                    <ArrowRight className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-4 h-4 text-muted-foreground" />
                  )}
                  
                  <div className={cn(
                    "p-6 rounded-xl border transition-all",
                    env.bgColor,
                    "border-border hover:border-primary/50"
                  )}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        env.bgColor
                      )}>
                        <Icon className={cn("w-5 h-5", env.color)} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{env.name}</h3>
                        <p className="text-xs text-muted-foreground">{env.strategy}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <Badge variant={env.status === 'stable' ? 'default' : 'secondary'} className="text-xs">
                          {env.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Traffic</span>
                        <span className={cn("text-sm font-medium", env.color)}>{env.traffic}</span>
                      </div>
                      
                      {/* Traffic Bar */}
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={isInView ? { width: env.traffic } : {}}
                          transition={{ duration: 1, delay: index * 0.15 + 0.5 }}
                          className={cn("h-full rounded-full", env.status === 'stable' ? "bg-node-success" : "bg-node-warning")}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Strategy Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 flex justify-center gap-8"
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-node-running" />
            <span className="text-sm text-muted-foreground">Rolling Update</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-node-warning" />
            <span className="text-sm text-muted-foreground">Canary (Progressive)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-node-success" />
            <span className="text-sm text-muted-foreground">Blue-Green (Zero Downtime)</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EnvironmentLanesSection;
