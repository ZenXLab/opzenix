import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowRight,
  RotateCcw,
  Eye,
  Filter,
  Download,
  GitBranch,
  User,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Deployment {
  id: string;
  version: string;
  environment: string;
  status: 'success' | 'failed' | 'running' | 'idle' | 'warning' | 'paused';
  deployed_at: string;
  deployed_by: string | null;
  execution_id: string | null;
  notes: string | null;
  rollback_to: string | null;
}

interface EnvironmentConfig {
  id: string;
  name: string;
  environment: string;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const DeploymentHistoryPanel = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [environments, setEnvironments] = useState<EnvironmentConfig[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Fetch environments
  useEffect(() => {
    const fetchEnvironments = async () => {
      const { data, error } = await supabase
        .from('environment_configs')
        .select('id, name, environment')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setEnvironments(data);
      }
    };

    fetchEnvironments();
  }, []);

  // Fetch deployments with real-time updates
  useEffect(() => {
    const fetchDeployments = async () => {
      setLoading(true);
      
      let query = supabase
        .from('deployments')
        .select('*')
        .order('deployed_at', { ascending: false })
        .limit(50);

      if (selectedEnv !== 'all') {
        query = query.eq('environment', selectedEnv);
      }

      const { data, error } = await query;

      if (!error && data) {
        setDeployments(data as Deployment[]);
      }
      
      setLoading(false);
    };

    fetchDeployments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('deployments-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deployments'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newDeployment = payload.new as Deployment;
          if (selectedEnv === 'all' || newDeployment.environment === selectedEnv) {
            setDeployments(prev => [newDeployment, ...prev].slice(0, 50));
          }
        } else if (payload.eventType === 'UPDATE') {
          setDeployments(prev => 
            prev.map(d => d.id === (payload.new as Deployment).id ? payload.new as Deployment : d)
          );
        } else if (payload.eventType === 'DELETE') {
          setDeployments(prev => prev.filter(d => d.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedEnv]);

  const getStatusIcon = (status: Deployment['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-sec-safe" />;
      case 'failed': return <XCircle className="w-4 h-4 text-sec-critical" />;
      case 'running': return <div className="w-4 h-4 rounded-full border-2 border-chart-1 border-t-transparent animate-spin" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-sec-warning" />;
      case 'paused': return <Clock className="w-4 h-4 text-sec-warning" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getEnvironmentColor = (env: string) => {
    const envLower = env.toLowerCase();
    if (envLower.includes('prod')) return 'bg-sec-critical/20 text-sec-critical border-sec-critical/30';
    if (envLower.includes('stag')) return 'bg-sec-warning/20 text-sec-warning border-sec-warning/30';
    if (envLower.includes('dev')) return 'bg-sec-safe/20 text-sec-safe border-sec-safe/30';
    return 'bg-muted text-muted-foreground';
  };

  const exportDeployments = () => {
    const csv = [
      ['Version', 'Environment', 'Status', 'Deployed At', 'Deployed By', 'Notes'].join(','),
      ...deployments.map(d => [
        d.version,
        d.environment,
        d.status,
        new Date(d.deployed_at).toISOString(),
        d.deployed_by || 'System',
        d.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployments-${selectedEnv}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group deployments by environment for tab view
  const groupedByEnv = environments.reduce((acc, env) => {
    acc[env.environment] = deployments.filter(d => d.environment === env.environment);
    return acc;
  }, {} as Record<string, Deployment[]>);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Deployment History</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real deployment records from your environments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedEnv} onValueChange={setSelectedEnv}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All environments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Environments</SelectItem>
                {environments.map(env => (
                  <SelectItem key={env.id} value={env.environment}>
                    {env.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportDeployments}>
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Environment Tabs */}
        {selectedEnv === 'all' && environments.length > 0 && (
          <Tabs defaultValue={environments[0]?.environment || 'development'} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${environments.length}, 1fr)` }}>
              {environments.map(env => (
                <TabsTrigger key={env.id} value={env.environment} className="capitalize">
                  {env.name}
                  <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1">
                    {groupedByEnv[env.environment]?.length || 0}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            {environments.map(env => (
              <TabsContent key={env.id} value={env.environment} className="mt-4">
                <DeploymentList 
                  deployments={groupedByEnv[env.environment] || []}
                  loading={loading}
                  getStatusIcon={getStatusIcon}
                  getEnvironmentColor={getEnvironmentColor}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Single List when filtered */}
        {(selectedEnv !== 'all' || environments.length === 0) && (
          <DeploymentList 
            deployments={deployments}
            loading={loading}
            getStatusIcon={getStatusIcon}
            getEnvironmentColor={getEnvironmentColor}
          />
        )}
      </div>
    </ScrollArea>
  );
};

// Deployment List Component
const DeploymentList = ({ 
  deployments, 
  loading, 
  getStatusIcon,
  getEnvironmentColor 
}: { 
  deployments: Deployment[];
  loading: boolean;
  getStatusIcon: (status: Deployment['status']) => React.ReactNode;
  getEnvironmentColor: (env: string) => string;
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <History className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Deployments Yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Deployments will appear here once executions complete and deploy to environments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {deployments.map((deployment, index) => (
        <motion.div
          key={deployment.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    {getStatusIcon(deployment.status)}
                  </div>

                  {/* Deployment Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{deployment.version}</span>
                      <Badge 
                        variant="outline" 
                        className={cn('text-[10px] capitalize', getEnvironmentColor(deployment.environment))}
                      >
                        {deployment.environment}
                      </Badge>
                      {deployment.rollback_to && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <RotateCcw className="w-3 h-3" /> Rollback
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(new Date(deployment.deployed_at))}
                      </span>
                      {deployment.deployed_by && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {deployment.deployed_by.slice(0, 8)}...
                        </span>
                      )}
                      {deployment.notes && (
                        <span className="truncate max-w-[200px]">{deployment.notes}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {deployment.execution_id && (
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      View Execution
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Rollback to this
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default DeploymentHistoryPanel;
