import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Link2, 
  Globe, 
  Play, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Github,
  Cloud,
  Shield,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ControlTowerDashboardProps {
  onViewExecution?: (executionId: string) => void;
  onOpenConnections?: () => void;
  onOpenEnvironments?: () => void;
  onOpenApprovals?: () => void;
}

interface ConnectionStatus {
  id: string;
  name: string;
  type: 'github' | 'kubernetes' | 'vault';
  status: 'connected' | 'invalid' | 'rate-limited' | 'error';
  lastValidated?: string;
  details?: string;
}

interface EnvironmentOverview {
  id: string;
  name: string;
  strategy: 'rolling' | 'canary' | 'blue-green';
  approvalRequired: boolean;
  lastDeployment?: {
    status: 'success' | 'failed' | 'running';
    version: string;
    timestamp: string;
  };
}

interface ActiveExecution {
  id: string;
  name: string;
  repo: string;
  branch: string;
  environment: string;
  currentNode: string;
  status: 'running' | 'paused' | 'awaiting-approval';
  progress: number;
  startedAt: string;
}

interface SystemWarning {
  id: string;
  type: 'deployment-failed' | 'approval-blocked' | 'rate-limit' | 'connectivity';
  message: string;
  severity: 'warning' | 'error';
  timestamp: string;
  executionId?: string;
}

const ControlTowerDashboard = ({
  onViewExecution,
  onOpenConnections,
  onOpenEnvironments,
  onOpenApprovals,
}: ControlTowerDashboardProps) => {
  // Mock data - will be replaced with real data
  const [connections] = useState<ConnectionStatus[]>([
    { id: '1', name: 'opzenix/platform-core', type: 'github', status: 'connected', lastValidated: '2 min ago' },
    { id: '2', name: 'aks-production', type: 'kubernetes', status: 'connected', lastValidated: '1 min ago' },
    { id: '3', name: 'azure-keyvault-prod', type: 'vault', status: 'connected', lastValidated: '5 min ago' },
  ]);

  const [environments] = useState<EnvironmentOverview[]>([
    { 
      id: '1', 
      name: 'Development', 
      strategy: 'rolling', 
      approvalRequired: false,
      lastDeployment: { status: 'success', version: 'v2.4.2', timestamp: '10 min ago' }
    },
    { 
      id: '2', 
      name: 'Staging', 
      strategy: 'canary', 
      approvalRequired: false,
      lastDeployment: { status: 'running', version: 'v2.4.3', timestamp: '2 min ago' }
    },
    { 
      id: '3', 
      name: 'Production', 
      strategy: 'blue-green', 
      approvalRequired: true,
      lastDeployment: { status: 'success', version: 'v2.4.1', timestamp: '2 hours ago' }
    },
  ]);

  const [executions, setExecutions] = useState<ActiveExecution[]>([]);
  const [warnings, setWarnings] = useState<SystemWarning[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch active executions
  useEffect(() => {
    const fetchExecutions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('executions')
          .select('*')
          .in('status', ['running', 'paused'])
          .order('started_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          setExecutions(data.map(e => ({
            id: e.id,
            name: e.name,
            repo: 'platform-core',
            branch: e.branch || 'main',
            environment: e.environment,
            currentNode: 'Deploy',
            status: e.status === 'paused' ? 'awaiting-approval' : 'running',
            progress: e.progress || 0,
            startedAt: new Date(e.started_at).toLocaleTimeString(),
          })));
        }

        // Fetch failed deployments as warnings
        const { data: failedData } = await supabase
          .from('deployments')
          .select('*')
          .eq('status', 'failed')
          .order('deployed_at', { ascending: false })
          .limit(5);

        if (failedData) {
          setWarnings(failedData.map(d => ({
            id: d.id,
            type: 'deployment-failed',
            message: `Deployment ${d.version} to ${d.environment} failed`,
            severity: 'error',
            timestamp: new Date(d.deployed_at).toLocaleTimeString(),
            executionId: d.execution_id || undefined,
          })));
        }
      } catch (err) {
        console.error('Failed to fetch executions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExecutions();

    // Subscribe to execution updates
    const channel = supabase
      .channel('control-tower-executions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'executions' }, fetchExecutions)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getConnectionIcon = (type: ConnectionStatus['type']) => {
    switch (type) {
      case 'github': return Github;
      case 'kubernetes': return Cloud;
      case 'vault': return Shield;
    }
  };

  const getStatusColor = (status: ConnectionStatus['status']) => {
    switch (status) {
      case 'connected': return 'text-sec-safe';
      case 'invalid': return 'text-sec-critical';
      case 'rate-limited': return 'text-sec-warning';
      case 'error': return 'text-sec-critical';
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Control Tower</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Is the system safe right now?
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh All
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connections Status */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">Connections Status</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={onOpenConnections}>
                  Manage <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {connections.map((conn) => {
                const Icon = getConnectionIcon(conn.type);
                return (
                  <div 
                    key={conn.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-background flex items-center justify-center">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{conn.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{conn.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs', getStatusColor(conn.status))}>
                        {conn.status === 'connected' && <CheckCircle2 className="w-4 h-4" />}
                        {conn.status !== 'connected' && <XCircle className="w-4 h-4" />}
                      </span>
                      {conn.lastValidated && (
                        <span className="text-[10px] text-muted-foreground">{conn.lastValidated}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Environments Overview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">Environments Overview</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={onOpenEnvironments}>
                  Configure <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {environments.map((env) => (
                <div 
                  key={env.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      env.name === 'Production' && 'bg-sec-critical',
                      env.name === 'Staging' && 'bg-sec-warning',
                      env.name === 'Development' && 'bg-sec-safe'
                    )} />
                    <div>
                      <p className="text-sm font-medium">{env.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">
                          {env.strategy.replace('-', ' ')}
                        </Badge>
                        {env.approvalRequired && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            Approval Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {env.lastDeployment && (
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        {env.lastDeployment.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-sec-safe" />}
                        {env.lastDeployment.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-sec-critical" />}
                        {env.lastDeployment.status === 'running' && (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-chart-1 border-t-transparent animate-spin" />
                        )}
                        <span className="text-xs font-mono">{env.lastDeployment.version}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{env.lastDeployment.timestamp}</span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Active Executions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-chart-1" />
                <CardTitle className="text-base">Active Executions</CardTitle>
                {executions.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{executions.length} running</Badge>
                )}
              </div>
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : executions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active executions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {executions.map((exec) => (
                  <motion.div
                    key={exec.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onViewExecution?.(exec.id)}
                  >
                    {/* Status Indicator */}
                    <div className={cn(
                      'w-2 h-8 rounded-full',
                      exec.status === 'running' && 'bg-chart-1 animate-pulse',
                      exec.status === 'paused' && 'bg-sec-warning',
                      exec.status === 'awaiting-approval' && 'bg-sec-warning animate-pulse'
                    )} />

                    {/* Execution Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">{exec.name}</span>
                        <Badge variant={exec.status === 'running' ? 'default' : 'secondary'} className="text-[10px] h-4">
                          {exec.status === 'awaiting-approval' ? 'Awaiting Approval' : exec.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{exec.repo}</span>
                        <span>•</span>
                        <span>{exec.branch}</span>
                        <span>•</span>
                        <span className="capitalize">{exec.environment}</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="w-32 hidden sm:block">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{exec.currentNode}</span>
                        <span className="font-mono">{exec.progress}%</span>
                      </div>
                      <Progress value={exec.progress} className="h-1.5" />
                    </div>

                    {/* Time */}
                    <div className="text-xs text-muted-foreground hidden md:block">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {exec.startedAt}
                    </div>

                    {/* Actions */}
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      View Flow
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Warnings */}
        {warnings.length > 0 && (
          <Card className="border-sec-warning/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-sec-warning" />
                <CardTitle className="text-base">System Warnings</CardTitle>
                <Badge variant="destructive" className="text-[10px]">{warnings.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {warnings.map((warning) => (
                <div 
                  key={warning.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg',
                    warning.severity === 'error' ? 'bg-sec-critical/10' : 'bg-sec-warning/10'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {warning.severity === 'error' ? (
                      <XCircle className="w-4 h-4 text-sec-critical" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-sec-warning" />
                    )}
                    <span className="text-sm">{warning.message}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{warning.timestamp}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};

export default ControlTowerDashboard;
