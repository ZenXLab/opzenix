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
  Eye,
  WifiOff,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useConnectionsRealtime, Connection } from '@/hooks/useConnectionsRealtime';
import { useControlTowerRealtime } from '@/hooks/useControlTowerRealtime';
import SystemRiskBanner from './SystemRiskBanner';
import LastApprovalIndicator from './LastApprovalIndicator';

interface ControlTowerDashboardProps {
  onViewExecution?: (executionId: string) => void;
  onOpenConnections?: () => void;
  onOpenEnvironments?: () => void;
  onOpenApprovals?: () => void;
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

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ControlTowerDashboard = ({
  onViewExecution,
  onOpenConnections,
  onOpenEnvironments,
  onOpenApprovals,
}: ControlTowerDashboardProps) => {
  // Use real-time hooks
  const { connections, loading: connectionsLoading, isConnected: connectionsConnected } = useConnectionsRealtime();
  const { 
    executions, 
    loading: executionsLoading, 
    isConnected: realtimeConnected 
  } = useControlTowerRealtime();

  const [environments, setEnvironments] = useState<EnvironmentOverview[]>([]);
  const [envLoading, setEnvLoading] = useState(true);

  // Fetch environments with last deployment status
  useEffect(() => {
    const fetchEnvironments = async () => {
      setEnvLoading(true);
      try {
        const { data: envData, error } = await supabase
          .from('environment_configs')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (!error && envData) {
          // For each environment, get the latest deployment
          const envsWithDeployments = await Promise.all(
            envData.map(async (env) => {
              const { data: deployData } = await supabase
                .from('deployments')
                .select('*')
                .eq('environment', env.environment)
                .order('deployed_at', { ascending: false })
                .limit(1)
                .single();

              const vars = env.variables as Record<string, unknown> || {};
              
              return {
                id: env.id,
                name: env.name,
                strategy: (vars.strategy as string || 'rolling') as 'rolling' | 'canary' | 'blue-green',
                approvalRequired: (vars.approvalRequired as boolean) || env.environment === 'production',
                lastDeployment: deployData ? {
                  status: deployData.status as 'success' | 'failed' | 'running',
                  version: deployData.version,
                  timestamp: formatTimeAgo(new Date(deployData.deployed_at))
                } : undefined
              };
            })
          );

          setEnvironments(envsWithDeployments);
        }
      } catch (err) {
        console.error('[ControlTowerDashboard] Error fetching environments:', err);
      } finally {
        setEnvLoading(false);
      }
    };

    fetchEnvironments();

    // Subscribe to environment updates
    const channel = supabase
      .channel('control-tower-envs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'environment_configs' }, fetchEnvironments)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deployments' }, fetchEnvironments)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getConnectionIcon = (type: Connection['type']) => {
    switch (type) {
      case 'github': return Github;
      case 'kubernetes': 
      case 'azure': return Cloud;
      case 'vault': return Shield;
      default: return Cloud;
    }
  };

  const getStatusColor = (status: Connection['status']) => {
    switch (status) {
      case 'connected': return 'text-sec-safe';
      case 'invalid': return 'text-sec-critical';
      case 'rate-limited': return 'text-sec-warning';
      case 'error': return 'text-sec-critical';
      default: return 'text-muted-foreground';
    }
  };

  const isLoading = connectionsLoading || executionsLoading;
  const isConnected = connectionsConnected && realtimeConnected;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Connection Lost Banner */}
        {!isConnected && (
          <div className="bg-sec-warning/20 border border-sec-warning/30 rounded-lg p-3 flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-sec-warning" />
            <span className="text-sm text-sec-warning">Live connection lost — data may be stale</span>
          </div>
        )}

        {/* System Risk Banner */}
        <SystemRiskBanner onViewApprovals={onOpenApprovals} onViewExecution={onViewExecution} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Control Tower</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Is the system safe right now?
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh All
            </Button>
          </div>
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
              {connectionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No connections configured</p>
                </div>
              ) : (
                connections.map((conn) => {
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
                        {conn.last_validated_at && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatTimeAgo(new Date(conn.last_validated_at))}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
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
              {envLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : environments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No environments configured</p>
                </div>
              ) : (
                environments.map((env) => (
                  <div 
                    key={env.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        env.name.toLowerCase().includes('prod') && 'bg-sec-critical',
                        env.name.toLowerCase().includes('stag') && 'bg-sec-warning',
                        env.name.toLowerCase().includes('dev') && 'bg-sec-safe',
                        !env.name.toLowerCase().includes('prod') && 
                        !env.name.toLowerCase().includes('stag') && 
                        !env.name.toLowerCase().includes('dev') && 'bg-muted-foreground'
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
                ))
              )}
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
                  <Badge variant="secondary" className="text-[10px]">{executions.length} active</Badge>
                )}
              </div>
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {executionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
                      exec.status === 'paused' && 'bg-sec-warning animate-pulse',
                      exec.status === 'failed' && 'bg-sec-critical'
                    )} />

                    {/* Execution Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">{exec.name}</span>
                        <Badge variant={exec.status === 'running' ? 'default' : 'secondary'} className="text-[10px] h-4 capitalize">
                          {exec.status === 'paused' ? 'Awaiting Approval' : exec.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{exec.name.split('/')[0] || 'platform-core'}</span>
                        <span>•</span>
                        <span>{exec.branch || 'main'}</span>
                        <span>•</span>
                        <span className="capitalize">{exec.environment}</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="w-32 hidden sm:block">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-mono">{exec.progress || 0}%</span>
                      </div>
                      <Progress value={exec.progress || 0} className="h-1.5" />
                    </div>

                    {/* Time */}
                    <div className="text-xs text-muted-foreground hidden md:block">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatTimeAgo(new Date(exec.started_at))}
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

        {/* Last Approval Indicator */}
        <LastApprovalIndicator />
      </div>
    </ScrollArea>
  );
};

export default ControlTowerDashboard;
