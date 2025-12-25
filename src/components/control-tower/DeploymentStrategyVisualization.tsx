import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Box, 
  ArrowUpDown, 
  Pause, 
  Play, 
  CheckCircle2,
  RefreshCw,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Pod {
  id: string;
  version: 'stable' | 'canary' | 'blue' | 'green';
  status: 'running' | 'pending' | 'terminating';
}

interface DeploymentStrategyVisualizationProps {
  environment: string;
  version?: string;
  isDeploying?: boolean;
}

const strategyConfig: Record<string, {
  name: string;
  description: string;
  phases: string[];
}> = {
  dev: {
    name: 'Rolling Update',
    description: 'Fast rolling pods replacement',
    phases: ['Old pods terminating', 'New pods starting', 'Complete']
  },
  uat: {
    name: 'Rolling Update',
    description: 'Controlled rolling update with health checks',
    phases: ['Health check', 'Rolling update', 'Verification', 'Complete']
  },
  staging: {
    name: 'Canary',
    description: 'Progressive rollout with traffic split',
    phases: ['10% traffic', '50% traffic', '100% traffic', 'Verified']
  },
  preprod: {
    name: 'Canary',
    description: 'Canary with manual promotion gates',
    phases: ['10% traffic', 'Analysis', '50% traffic', 'Analysis', '100% traffic']
  },
  prod: {
    name: 'Blue/Green',
    description: 'Zero-downtime with instant rollback capability',
    phases: ['Green ready', 'Traffic switch', 'Blue terminated', 'Verified']
  }
};

export function DeploymentStrategyVisualization({ 
  environment, 
  version = 'v1.0.0',
  isDeploying = false 
}: DeploymentStrategyVisualizationProps) {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [pods, setPods] = useState<Pod[]>([]);
  const [trafficSplit, setTrafficSplit] = useState({ stable: 100, new: 0 });
  const [isPaused, setIsPaused] = useState(false);

  const strategy = strategyConfig[environment.toLowerCase()] || strategyConfig.dev;
  const isBlueGreen = strategy.name === 'Blue/Green';
  const isCanary = strategy.name === 'Canary';

  useEffect(() => {
    // Initialize pods based on strategy
    const initialPods: Pod[] = Array.from({ length: 3 }, (_, i) => ({
      id: `pod-${i}`,
      version: 'stable',
      status: 'running'
    }));
    setPods(initialPods);

    if (isDeploying && !isPaused) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + 2;
          
          // Update phase based on progress
          const phaseProgress = 100 / strategy.phases.length;
          const newPhase = Math.min(Math.floor(next / phaseProgress), strategy.phases.length - 1);
          setCurrentPhase(newPhase);

          // Update traffic split for canary/blue-green
          if (isCanary || isBlueGreen) {
            if (next < 25) {
              setTrafficSplit({ stable: 90, new: 10 });
            } else if (next < 50) {
              setTrafficSplit({ stable: 50, new: 50 });
            } else if (next < 75) {
              setTrafficSplit({ stable: 10, new: 90 });
            } else {
              setTrafficSplit({ stable: 0, new: 100 });
            }
          }

          // Update pods
          setPods(prevPods => {
            return prevPods.map((pod, i) => {
              if (isBlueGreen) {
                return {
                  ...pod,
                  version: next > 75 ? 'green' : 'blue',
                  status: 'running'
                };
              }
              if (isCanary) {
                const canaryRatio = next / 100;
                return {
                  ...pod,
                  version: i < Math.ceil(prevPods.length * canaryRatio) ? 'canary' : 'stable',
                  status: 'running'
                };
              }
              // Rolling
              const rollingRatio = next / 100;
              return {
                ...pod,
                version: i < Math.ceil(prevPods.length * rollingRatio) ? 'canary' : 'stable',
                status: i < Math.ceil(prevPods.length * rollingRatio) ? 'running' : (next > 50 ? 'terminating' : 'running')
              };
            });
          });

          return next >= 100 ? 100 : next;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isDeploying, isPaused, environment]);

  const getPodColor = (pod: Pod) => {
    if (pod.status === 'terminating') return 'bg-gray-500';
    if (pod.status === 'pending') return 'bg-yellow-500 animate-pulse';
    switch (pod.version) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'canary': return 'bg-yellow-500';
      default: return 'bg-primary';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className={cn('h-5 w-5', isDeploying && !isPaused && 'animate-spin')} />
              {strategy.name}
              <Badge variant="outline" className="ml-2">
                <Lock className="h-3 w-3 mr-1" />
                LOCKED
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
          </div>
          <Badge variant="secondary">{environment.toUpperCase()}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Phase Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Deployment Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-3">
            {strategy.phases.map((phase, i) => (
              <div 
                key={i}
                className={cn(
                  'flex flex-col items-center text-center',
                  i <= currentPhase ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center mb-1 text-xs',
                  i < currentPhase ? 'bg-green-500 text-white' :
                  i === currentPhase ? 'bg-primary text-primary-foreground' :
                  'bg-muted'
                )}>
                  {i < currentPhase ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-xs max-w-[60px]">{phase}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Split (Canary/Blue-Green) */}
        {(isCanary || isBlueGreen) && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpDown className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Traffic Distribution</span>
            </div>
            <div className="relative h-8 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className={cn(
                  'absolute inset-y-0 left-0',
                  isBlueGreen ? 'bg-blue-500' : 'bg-primary'
                )}
                initial={{ width: '100%' }}
                animate={{ width: `${trafficSplit.stable}%` }}
                transition={{ duration: 0.5 }}
              />
              <motion.div 
                className={cn(
                  'absolute inset-y-0 right-0',
                  isBlueGreen ? 'bg-green-500' : 'bg-yellow-500'
                )}
                initial={{ width: '0%' }}
                animate={{ width: `${trafficSplit.new}%` }}
                transition={{ duration: 0.5 }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-medium">
                <span className="text-white">{isBlueGreen ? 'Blue' : 'Stable'}: {trafficSplit.stable}%</span>
                <span className="text-white">{isBlueGreen ? 'Green' : 'Canary'}: {trafficSplit.new}%</span>
              </div>
            </div>
            
            {isDeploying && (
              <div className="flex justify-center gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button size="sm" disabled={progress >= 100}>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Promote
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Pod Visualization */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Box className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Replica Set</span>
          </div>
          <div className="flex gap-2 justify-center">
            <AnimatePresence>
              {pods.map((pod) => (
                <motion.div
                  key={pod.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className={cn(
                    'w-16 h-16 rounded-lg flex flex-col items-center justify-center text-white text-xs',
                    getPodColor(pod)
                  )}
                >
                  <Box className="h-5 w-5 mb-1" />
                  <span className="font-mono">{pod.version}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary" /> Stable
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" /> Canary
            </span>
            {isBlueGreen && (
              <>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-blue-500" /> Blue
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500" /> Green
                </span>
              </>
            )}
          </div>
        </div>

        {/* Strategy Mapping */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Deployment Strategy by Environment</h4>
          <div className="grid grid-cols-5 gap-2 text-xs">
            {Object.entries(strategyConfig).map(([env, config]) => (
              <div 
                key={env}
                className={cn(
                  'p-2 rounded text-center border',
                  environment.toLowerCase() === env 
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-background'
                )}
              >
                <div className="font-medium uppercase">{env}</div>
                <div className="text-muted-foreground text-[10px]">{config.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Prod Warning */}
        {environment.toLowerCase() === 'prod' && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
            <span className="text-yellow-500">
              Production: No auto-sync, no image tag mutation, no UI hotfix. Only Git-approved changes.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
