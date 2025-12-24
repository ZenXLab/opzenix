import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock,
  RotateCcw,
  Eye,
  Filter,
  Download,
  User,
  AlertTriangle,
  Loader2,
  Play
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface RollbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deployment: Deployment | null;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

const RollbackDialog = ({ open, onOpenChange, deployment, onConfirm, isLoading }: RollbackDialogProps) => {
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-sec-warning" />
            Confirm Rollback
          </DialogTitle>
          <DialogDescription>
            You are about to rollback to version <span className="font-mono font-medium">{deployment?.version}</span> in <span className="capitalize">{deployment?.environment}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-sec-warning/10 border border-sec-warning/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-sec-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">This action will:</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <li>• Deploy the previous version to {deployment?.environment}</li>
                  <li>• Create a new deployment record with rollback reference</li>
                  <li>• Log the action in the audit trail</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason for rollback (optional)</Label>
            <Textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Performance regression detected in v2.1.0"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Rollback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DeploymentHistoryPanel = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [environments, setEnvironments] = useState<EnvironmentConfig[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [rollbackTarget, setRollbackTarget] = useState<Deployment | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [isCreatingTest, setIsCreatingTest] = useState(false);

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

  const handleRollback = async (reason: string) => {
    if (!rollbackTarget) return;
    
    setIsRollingBack(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('rollback-deployment', {
        body: {
          deploymentId: rollbackTarget.id,
          targetVersion: rollbackTarget.version,
          environment: rollbackTarget.environment,
          reason,
        }
      });

      if (error) throw error;

      toast.success(`Rollback to ${rollbackTarget.version} initiated`);
      setRollbackTarget(null);
    } catch (error: any) {
      console.error('[Rollback] Error:', error);
      toast.error(error.message || 'Failed to initiate rollback');
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleCreateTestExecution = async () => {
    setIsCreatingTest(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-test-execution', {
        body: {
          name: `test-pipeline-${Date.now()}`,
          environment: selectedEnv !== 'all' ? selectedEnv : 'development',
          branch: 'main'
        }
      });

      if (error) throw error;

      toast.success(data.message || 'Test execution created! Check Execution Flow View.');
    } catch (error: any) {
      console.error('[TestExecution] Error:', error);
      toast.error(error.message || 'Failed to create test execution');
    } finally {
      setIsCreatingTest(false);
    }
  };

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
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Deployment History</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real deployment records from your environments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleCreateTestExecution}
              disabled={isCreatingTest}
            >
              {isCreatingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Test Execution
            </Button>
            <Select value={selectedEnv} onValueChange={setSelectedEnv}>
              <SelectTrigger className="w-44">
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

        {/* Environment Filter Chips */}
        {environments.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={selectedEnv === 'all' ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1.5 text-xs"
              onClick={() => setSelectedEnv('all')}
            >
              All ({deployments.length})
            </Badge>
            {environments.map(env => {
              const count = deployments.filter(d => d.environment === env.environment).length;
              const isSelected = selectedEnv === env.environment;
              return (
                <Badge
                  key={env.id}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer px-3 py-1.5 text-xs transition-colors',
                    env.environment.toLowerCase().includes('prod') && isSelected && 'bg-sec-critical text-white',
                    env.environment.toLowerCase().includes('uat') && isSelected && 'bg-sec-warning text-white',
                    env.environment.toLowerCase().includes('dev') && isSelected && 'bg-sec-safe text-white',
                  )}
                  onClick={() => setSelectedEnv(env.environment)}
                >
                  {env.name} ({count})
                </Badge>
              );
            })}
          </div>
        )}

        {/* Deployments List */}
        <DeploymentList 
          deployments={selectedEnv === 'all' ? deployments : deployments.filter(d => d.environment === selectedEnv)}
          loading={loading}
          getStatusIcon={getStatusIcon}
          getEnvironmentColor={getEnvironmentColor}
          onRollback={setRollbackTarget}
        />

        {/* Rollback Confirmation Dialog */}
        <RollbackDialog
          open={!!rollbackTarget}
          onOpenChange={(open) => !open && setRollbackTarget(null)}
          deployment={rollbackTarget}
          onConfirm={handleRollback}
          isLoading={isRollingBack}
        />
      </div>
    </ScrollArea>
  );
};

// Deployment List Component
const DeploymentList = ({ 
  deployments, 
  loading, 
  getStatusIcon,
  getEnvironmentColor,
  onRollback
}: { 
  deployments: Deployment[];
  loading: boolean;
  getStatusIcon: (status: Deployment['status']) => React.ReactNode;
  getEnvironmentColor: (env: string) => string;
  onRollback: (deployment: Deployment) => void;
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
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <History className="w-8 h-8 text-muted-foreground" />
          </div>
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1.5"
                    onClick={() => onRollback(deployment)}
                    disabled={deployment.status === 'running'}
                  >
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
