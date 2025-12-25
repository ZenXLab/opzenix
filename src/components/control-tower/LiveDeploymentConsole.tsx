import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Box, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Loader2,
  Server,
  Heart,
  ArrowUpDown,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Pod {
  name: string;
  status: 'Running' | 'Pending' | 'Succeeded' | 'Failed' | 'Terminating';
  ready: boolean;
  restarts: number;
  age: string;
  version: string;
  cpu: number;
  memory: number;
}

interface DeploymentStatus {
  name: string;
  namespace: string;
  strategy: 'RollingUpdate' | 'Recreate' | 'Canary' | 'BlueGreen';
  replicas: {
    desired: number;
    ready: number;
    available: number;
    updated: number;
  };
  pods: Pod[];
  healthChecks: {
    name: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck: string;
    message?: string;
  }[];
  trafficPercentage?: {
    stable: number;
    canary: number;
  };
  conditions: {
    type: string;
    status: boolean;
    reason: string;
    message: string;
    lastUpdate: string;
  }[];
}

interface LiveDeploymentConsoleProps {
  deploymentId: string;
  environment: string;
}

const podStatusColors = {
  Running: 'bg-green-500',
  Pending: 'bg-yellow-500 animate-pulse',
  Succeeded: 'bg-green-500',
  Failed: 'bg-red-500',
  Terminating: 'bg-gray-500'
};

export function LiveDeploymentConsole({ deploymentId, environment }: LiveDeploymentConsoleProps) {
  const [deployment, setDeployment] = useState<DeploymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Array<{
    type: 'Normal' | 'Warning';
    reason: string;
    message: string;
    timestamp: string;
  }>>([]);

  useEffect(() => {
    fetchDeploymentStatus();
    
    // Poll for updates every 3 seconds for live feel
    const interval = setInterval(fetchDeploymentStatus, 3000);
    
    return () => clearInterval(interval);
  }, [deploymentId]);

  const fetchDeploymentStatus = async () => {
    // Fetch deployment data from database
    const { data: deployData } = await supabase
      .from('deployments')
      .select('*')
      .eq('id', deploymentId)
      .single();

    if (deployData) {
      // Simulate kubernetes deployment status based on stored data
      const isDeploying = deployData.status === 'running';
      const isFailed = deployData.status === 'failed';
      const isSuccess = deployData.status === 'success';
      
      const desiredReplicas = 3;
      const readyReplicas = isSuccess ? 3 : isDeploying ? Math.floor(Math.random() * 2) + 1 : 0;
      
      // Generate pod statuses
      const pods: Pod[] = Array.from({ length: desiredReplicas }, (_, i) => ({
        name: `${deployData.version.replace(/\./g, '-')}-${String.fromCharCode(97 + i)}${Math.random().toString(36).substring(2, 6)}`,
        status: i < readyReplicas ? 'Running' : isDeploying ? 'Pending' : isFailed ? 'Failed' : 'Running',
        ready: i < readyReplicas,
        restarts: Math.floor(Math.random() * 2),
        age: isSuccess ? '2m' : isDeploying ? `${30 + i * 10}s` : '1m',
        version: deployData.version,
        cpu: Math.floor(Math.random() * 50) + 10,
        memory: Math.floor(Math.random() * 40) + 20
      }));

      // Determine strategy from environment
      let strategy: DeploymentStatus['strategy'] = 'RollingUpdate';
      if (environment.toLowerCase().includes('prod')) {
        strategy = 'BlueGreen';
      } else if (environment.toLowerCase().includes('stag')) {
        strategy = 'Canary';
      }

      setDeployment({
        name: `opzenix-${environment.toLowerCase()}`,
        namespace: `opzenix-${environment.toLowerCase()}`,
        strategy,
        replicas: {
          desired: desiredReplicas,
          ready: readyReplicas,
          available: readyReplicas,
          updated: isSuccess ? desiredReplicas : readyReplicas
        },
        pods,
        healthChecks: [
          {
            name: 'Liveness Probe',
            status: isSuccess || readyReplicas > 0 ? 'healthy' : 'unknown',
            lastCheck: new Date().toISOString(),
            message: 'HTTP GET /health returned 200'
          },
          {
            name: 'Readiness Probe',
            status: readyReplicas > 0 ? 'healthy' : 'unknown',
            lastCheck: new Date().toISOString(),
            message: 'HTTP GET /ready returned 200'
          },
          {
            name: 'Startup Probe',
            status: isSuccess ? 'healthy' : isDeploying ? 'unknown' : 'healthy',
            lastCheck: new Date().toISOString()
          }
        ],
        trafficPercentage: strategy === 'Canary' ? {
          stable: isSuccess ? 0 : 90,
          canary: isSuccess ? 100 : 10
        } : strategy === 'BlueGreen' ? {
          stable: isSuccess ? 0 : 100,
          canary: isSuccess ? 100 : 0
        } : undefined,
        conditions: [
          {
            type: 'Available',
            status: readyReplicas > 0,
            reason: readyReplicas > 0 ? 'MinimumReplicasAvailable' : 'MinimumReplicasUnavailable',
            message: `${readyReplicas}/${desiredReplicas} replicas available`,
            lastUpdate: new Date().toISOString()
          },
          {
            type: 'Progressing',
            status: isDeploying,
            reason: isSuccess ? 'NewReplicaSetAvailable' : 'ReplicaSetUpdated',
            message: isSuccess ? 'Deployment complete' : 'Rolling update in progress',
            lastUpdate: new Date().toISOString()
          }
        ]
      });

      // Simulate events
      if (isDeploying) {
        setEvents([
          { type: 'Normal', reason: 'ScalingReplicaSet', message: 'Scaled up replica set to 3', timestamp: new Date(Date.now() - 60000).toISOString() },
          { type: 'Normal', reason: 'SuccessfulCreate', message: `Created pod: ${pods[0]?.name}`, timestamp: new Date(Date.now() - 45000).toISOString() },
          { type: 'Normal', reason: 'Pulling', message: 'Pulling image from registry', timestamp: new Date(Date.now() - 30000).toISOString() },
          { type: 'Normal', reason: 'Pulled', message: 'Successfully pulled image', timestamp: new Date(Date.now() - 15000).toISOString() },
        ]);
      } else if (isSuccess) {
        setEvents([
          { type: 'Normal', reason: 'ScalingReplicaSet', message: 'Scaled up replica set to 3', timestamp: new Date(Date.now() - 120000).toISOString() },
          { type: 'Normal', reason: 'SuccessfulCreate', message: 'All pods created successfully', timestamp: new Date(Date.now() - 90000).toISOString() },
          { type: 'Normal', reason: 'Started', message: 'All containers started', timestamp: new Date(Date.now() - 60000).toISOString() },
          { type: 'Normal', reason: 'Deployment', message: 'Deployment completed successfully', timestamp: new Date(Date.now() - 30000).toISOString() },
        ]);
      }
    }

    setLoading(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!deployment) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          <Server className="h-8 w-8 mr-2 opacity-50" />
          <span>No deployment data available</span>
        </CardContent>
      </Card>
    );
  }

  const { replicas, pods, healthChecks, trafficPercentage, conditions } = deployment;
  const rolloutProgress = (replicas.ready / replicas.desired) * 100;
  const isComplete = replicas.ready === replicas.desired;
  const hasFailure = pods.some(p => p.status === 'Failed');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Deployment Console
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <code className="text-xs">{deployment.namespace}</code>
              <Badge variant="outline">{deployment.strategy}</Badge>
              <Badge 
                variant={isComplete ? 'default' : hasFailure ? 'destructive' : 'secondary'}
                className={isComplete ? 'bg-green-500' : ''}
              >
                {isComplete ? 'Complete' : hasFailure ? 'Failed' : 'Deploying'}
              </Badge>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchDeploymentStatus}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <RotateCcw className="h-3 w-3" />
              Rollback
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rollout Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rollout Progress</span>
            <span className="font-medium">{replicas.ready}/{replicas.desired} Ready</span>
          </div>
          <Progress 
            value={rolloutProgress} 
            className={cn(
              'h-3',
              hasFailure && '[&>div]:bg-destructive'
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{replicas.updated} Updated</span>
            <span>{replicas.available} Available</span>
          </div>
        </div>

        {/* Traffic Split (for Canary/Blue-Green) */}
        {trafficPercentage && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpDown className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Traffic Distribution</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-background rounded-lg border">
                <div className="text-2xl font-bold text-blue-500">{trafficPercentage.stable}%</div>
                <div className="text-xs text-muted-foreground">Stable</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <div className="text-2xl font-bold text-green-500">{trafficPercentage.canary}%</div>
                <div className="text-xs text-muted-foreground">
                  {deployment.strategy === 'BlueGreen' ? 'New' : 'Canary'}
                </div>
              </div>
            </div>
            {!isComplete && (
              <div className="flex justify-center gap-2 mt-3">
                <Button size="sm" variant="outline" className="gap-1">
                  <Pause className="h-3 w-3" />
                  Pause
                </Button>
                <Button size="sm" className="gap-1">
                  <Play className="h-3 w-3" />
                  Promote
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Pod Status Grid */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Box className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Pod Status</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {pods.map((pod, index) => (
              <div 
                key={index}
                className="p-3 bg-muted/30 rounded-lg border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      podStatusColors[pod.status]
                    )} />
                    <span className="text-xs font-mono truncate max-w-[100px]">{pod.name}</span>
                  </div>
                  <Badge 
                    variant={pod.ready ? 'default' : 'secondary'}
                    className={cn('text-xs h-5', pod.ready && 'bg-green-500')}
                  >
                    {pod.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>CPU: {pod.cpu}%</span>
                  <span>Mem: {pod.memory}%</span>
                  <span>Restarts: {pod.restarts}</span>
                  <span>Age: {pod.age}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Health Checks */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Health Checks</span>
          </div>
          <div className="space-y-2">
            {healthChecks.map((check, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 bg-muted/30 rounded"
              >
                <div className="flex items-center gap-2">
                  {check.status === 'healthy' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {check.status === 'unhealthy' && <XCircle className="h-4 w-4 text-red-500" />}
                  {check.status === 'unknown' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  <span className="text-sm">{check.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{check.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Events Stream */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Events</span>
          </div>
          <ScrollArea className="h-32">
            <div className="space-y-1">
              {events.map((event, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-2 p-2 text-xs"
                >
                  <span className={cn(
                    'shrink-0 w-1.5 h-1.5 rounded-full mt-1.5',
                    event.type === 'Normal' ? 'bg-green-500' : 'bg-yellow-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{event.reason}</span>
                      <span className="text-muted-foreground">{formatTime(event.timestamp)}</span>
                    </div>
                    <p className="text-muted-foreground truncate">{event.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
