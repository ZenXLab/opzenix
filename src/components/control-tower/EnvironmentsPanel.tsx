import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Plus, 
  Settings, 
  Shield, 
  CheckCircle2, 
  XCircle,
  Trash2,
  Copy,
  MoreVertical,
  RefreshCcw,
  Zap,
  GitBranch,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EnvironmentConfigDialog } from './EnvironmentConfigDialog';

interface Environment {
  id: string;
  name: string;
  environment: string;
  strategy: 'rolling' | 'canary' | 'blue-green';
  approvalRequired: boolean;
  autoPromote: boolean;
  vaultSource?: string;
  guardrails: {
    maxReplicas?: number;
    healthCheckRequired: boolean;
    rollbackOnFailure: boolean;
  };
  lastDeployment?: {
    version: string;
    status: 'success' | 'failed' | 'running';
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

const EnvironmentsPanel = () => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [configEnv, setConfigEnv] = useState<Environment | null>(null);
  const [newEnv, setNewEnv] = useState<{
    name: string;
    environment: string;
    strategy: 'rolling' | 'canary' | 'blue-green';
    approvalRequired: boolean;
    autoPromote: boolean;
    vaultSource?: string;
    guardrails: {
      healthCheckRequired: boolean;
      rollbackOnFailure: boolean;
    };
  }>({
    name: '',
    environment: 'development',
    strategy: 'rolling',
    approvalRequired: false,
    autoPromote: false,
    guardrails: { healthCheckRequired: true, rollbackOnFailure: true },
  });

  // Fetch environments from database
  const fetchEnvironments = useCallback(async () => {
    setLoading(true);
    try {
      const { data: envData, error } = await supabase
        .from('environment_configs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (envData) {
        // For each environment, get the latest deployment
        const envsWithDeployments = await Promise.all(
          envData.map(async (env) => {
            const { data: deployData } = await supabase
              .from('deployments')
              .select('*')
              .eq('environment', env.environment)
              .order('deployed_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const vars = (env.variables as Record<string, unknown>) || {};
            
            return {
              id: env.id,
              name: env.name,
              environment: env.environment,
              strategy: (vars.strategy as string || 'rolling') as 'rolling' | 'canary' | 'blue-green',
              approvalRequired: (vars.approvalRequired as boolean) || env.environment === 'production',
              autoPromote: (vars.autoPromote as boolean) || false,
              vaultSource: vars.vaultSource as string | undefined,
              guardrails: {
                healthCheckRequired: (vars.healthCheckRequired as boolean) ?? true,
                rollbackOnFailure: (vars.rollbackOnFailure as boolean) ?? true,
                maxReplicas: vars.maxReplicas as number | undefined,
              },
              lastDeployment: deployData ? {
                version: deployData.version,
                status: deployData.status as 'success' | 'failed' | 'running',
                timestamp: formatTimeAgo(new Date(deployData.deployed_at))
              } : undefined
            };
          })
        );

        setEnvironments(envsWithDeployments);
      }
    } catch (err) {
      console.error('[EnvironmentsPanel] Error fetching environments:', err);
      toast.error('Failed to load environments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnvironments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('environments-panel-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'environment_configs' }, fetchEnvironments)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deployments' }, fetchEnvironments)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchEnvironments]);

  const handleCreateEnvironment = async () => {
    if (!newEnv.name) {
      toast.error('Environment name is required');
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('environment_configs')
        .insert({
          name: newEnv.name,
          environment: newEnv.environment,
          is_active: true,
          variables: {
            strategy: newEnv.strategy,
            approvalRequired: newEnv.approvalRequired,
            autoPromote: newEnv.autoPromote,
            vaultSource: newEnv.vaultSource,
            healthCheckRequired: newEnv.guardrails.healthCheckRequired,
            rollbackOnFailure: newEnv.guardrails.rollbackOnFailure,
          }
        });

      if (error) throw error;

      toast.success(`Environment "${newEnv.name}" created`);
      setWizardOpen(false);
      setWizardStep(1);
      setNewEnv({
        name: '',
        environment: 'development',
        strategy: 'rolling',
        approvalRequired: false,
        autoPromote: false,
        guardrails: { healthCheckRequired: true, rollbackOnFailure: true },
      });
    } catch (err: any) {
      console.error('[EnvironmentsPanel] Error creating environment:', err);
      toast.error(err.message || 'Failed to create environment');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteEnvironment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('environment_configs')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Environment deleted');
    } catch (err: any) {
      console.error('[EnvironmentsPanel] Error deleting environment:', err);
      toast.error(err.message || 'Failed to delete environment');
    }
  };

  const handleDuplicateEnvironment = async (env: Environment) => {
    try {
      const { error } = await supabase
        .from('environment_configs')
        .insert({
          name: `${env.name} (Copy)`,
          environment: env.environment,
          is_active: true,
          variables: {
            strategy: env.strategy,
            approvalRequired: env.approvalRequired,
            autoPromote: env.autoPromote,
            vaultSource: env.vaultSource,
            healthCheckRequired: env.guardrails.healthCheckRequired,
            rollbackOnFailure: env.guardrails.rollbackOnFailure,
          }
        });

      if (error) throw error;
      toast.success('Environment duplicated');
    } catch (err: any) {
      console.error('[EnvironmentsPanel] Error duplicating environment:', err);
      toast.error(err.message || 'Failed to duplicate environment');
    }
  };

  const handleConfigureEnvironment = (env: Environment) => {
    setConfigEnv(env);
    setIsConfiguring(true);
  };

  const handleViewDeployments = (environment: string) => {
    window.dispatchEvent(new CustomEvent('opzenix:navigate', { 
      detail: { section: 'deployments', filter: environment } 
    }));
    toast.info(`Viewing deployments for ${environment}`);
  };

  const getStrategyBadge = (strategy: Environment['strategy']) => {
    const colors = {
      'rolling': 'bg-chart-1/20 text-chart-1',
      'canary': 'bg-sec-warning/20 text-sec-warning',
      'blue-green': 'bg-primary/20 text-primary',
    };
    return (
      <Badge className={cn('border-0 capitalize', colors[strategy])}>
        {strategy.replace('-', ' ')}
      </Badge>
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Environments</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Policy-based deployment configuration
            </p>
          </div>
          <Button className="gap-2" onClick={() => setWizardOpen(true)}>
            <Plus className="w-4 h-4" />
            New Environment
          </Button>
        </div>

        {/* Info Banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Environments are policy objects</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Each environment defines deployment strategy, approval requirements, security policies, and guardrails.
                  Opzenix enforces these rules during every deployment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environments List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : environments.length === 0 ? (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Environments Configured</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                Create your first environment to define deployment policies and guardrails.
              </p>
              <Button onClick={() => setWizardOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Environment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {environments.map((env) => (
              <motion.div
                key={env.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {/* Environment Indicator */}
                        <div className={cn(
                          'w-3 h-full min-h-[80px] rounded-full',
                          env.environment === 'production' && 'bg-sec-critical',
                          env.environment === 'staging' && 'bg-sec-warning',
                          env.environment === 'development' && 'bg-sec-safe',
                          !['production', 'staging', 'development'].includes(env.environment) && 'bg-primary'
                        )} />

                        <div className="space-y-3">
                          {/* Header */}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">{env.name}</h3>
                              {getStrategyBadge(env.strategy)}
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {env.environment}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {env.approvalRequired && (
                                <Badge variant="outline" className="text-[10px] gap-1">
                                  <Shield className="w-3 h-3" /> Approval Required
                                </Badge>
                              )}
                              {env.autoPromote && (
                                <Badge variant="outline" className="text-[10px] gap-1">
                                  <Zap className="w-3 h-3" /> Auto-Promote
                                </Badge>
                              )}
                              {env.vaultSource && (
                                <Badge variant="outline" className="text-[10px] gap-1">
                                  <Shield className="w-3 h-3" /> {env.vaultSource}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Guardrails */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {env.guardrails.healthCheckRequired && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-sec-safe" /> Health check
                              </span>
                            )}
                            {env.guardrails.rollbackOnFailure && (
                              <span className="flex items-center gap-1">
                                <RefreshCcw className="w-3 h-3 text-sec-safe" /> Auto-rollback
                              </span>
                            )}
                            {env.guardrails.maxReplicas && (
                              <span>Max {env.guardrails.maxReplicas} replicas</span>
                            )}
                          </div>

                          {/* Last Deployment */}
                          {env.lastDeployment ? (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Last deployment:</span>
                              <span className="font-mono">{env.lastDeployment.version}</span>
                              {env.lastDeployment.status === 'success' && (
                                <CheckCircle2 className="w-3 h-3 text-sec-safe" />
                              )}
                              {env.lastDeployment.status === 'failed' && (
                                <XCircle className="w-3 h-3 text-sec-critical" />
                              )}
                              <span className="text-muted-foreground">{env.lastDeployment.timestamp}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">No deployments yet</div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handleConfigureEnvironment(env)}>
                            <Settings className="w-4 h-4" /> Configure
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleDuplicateEnvironment(env)}>
                            <Copy className="w-4 h-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleViewDeployments(env.environment)}>
                            <GitBranch className="w-4 h-4" /> View Deployments
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="gap-2 text-sec-critical"
                            onClick={() => handleDeleteEnvironment(env.id)}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Environment Wizard */}
        <Dialog open={isWizardOpen} onOpenChange={setWizardOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Environment</DialogTitle>
              <DialogDescription>
                Step {wizardStep} of 4: {
                  wizardStep === 1 ? 'Basic Info' :
                  wizardStep === 2 ? 'Deployment Strategy' :
                  wizardStep === 3 ? 'Approval Rules' :
                  'Security Policies'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Environment Name</Label>
                    <Input 
                      placeholder="e.g., UAT, QA, Pre-Prod"
                      value={newEnv.name}
                      onChange={(e) => setNewEnv(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Environment Type</Label>
                    <Select 
                      value={newEnv.environment}
                      onValueChange={(v) => setNewEnv(prev => ({ ...prev, environment: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="qa">QA</SelectItem>
                        <SelectItem value="uat">UAT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Deployment Strategy</Label>
                    <Select 
                      value={newEnv.strategy}
                      onValueChange={(v) => setNewEnv(prev => ({ ...prev, strategy: v as Environment['strategy'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rolling">Rolling Update</SelectItem>
                        <SelectItem value="canary">Canary Deployment</SelectItem>
                        <SelectItem value="blue-green">Blue-Green Deployment</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {newEnv.strategy === 'rolling' && 'Gradually replaces instances with new version'}
                      {newEnv.strategy === 'canary' && 'Routes a percentage of traffic to new version'}
                      {newEnv.strategy === 'blue-green' && 'Runs two identical environments, switches traffic instantly'}
                    </p>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Approval</Label>
                      <p className="text-xs text-muted-foreground">
                        Deployments must be approved before proceeding
                      </p>
                    </div>
                    <Switch 
                      checked={newEnv.approvalRequired}
                      onCheckedChange={(v) => setNewEnv(prev => ({ ...prev, approvalRequired: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Promote</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically promote successful deployments
                      </p>
                    </div>
                    <Switch 
                      checked={newEnv.autoPromote}
                      onCheckedChange={(v) => setNewEnv(prev => ({ ...prev, autoPromote: v }))}
                    />
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Health Check Required</Label>
                      <p className="text-xs text-muted-foreground">
                        Verify health before completing deployment
                      </p>
                    </div>
                    <Switch 
                      checked={newEnv.guardrails.healthCheckRequired}
                      onCheckedChange={(v) => setNewEnv(prev => ({ 
                        ...prev, 
                        guardrails: { ...prev.guardrails, healthCheckRequired: v } 
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Rollback on Failure</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically rollback if deployment fails
                      </p>
                    </div>
                    <Switch 
                      checked={newEnv.guardrails.rollbackOnFailure}
                      onCheckedChange={(v) => setNewEnv(prev => ({ 
                        ...prev, 
                        guardrails: { ...prev.guardrails, rollbackOnFailure: v } 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vault Source (Optional)</Label>
                    <Select 
                      value={newEnv.vaultSource || ''}
                      onValueChange={(v) => setNewEnv(prev => ({ ...prev, vaultSource: v || undefined }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vault..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="azure-keyvault-prod">Azure Key Vault (Prod)</SelectItem>
                        <SelectItem value="azure-keyvault-dev">Azure Key Vault (Dev)</SelectItem>
                        <SelectItem value="hashicorp-vault">HashiCorp Vault</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              {wizardStep > 1 && (
                <Button variant="outline" onClick={() => setWizardStep(s => s - 1)} disabled={isCreating}>
                  Back
                </Button>
              )}
              {wizardStep < 4 ? (
                <Button onClick={() => setWizardStep(s => s + 1)} disabled={wizardStep === 1 && !newEnv.name}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleCreateEnvironment} disabled={isCreating} className="gap-2">
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Environment
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
};

export default EnvironmentsPanel;
