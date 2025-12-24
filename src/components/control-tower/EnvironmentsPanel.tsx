import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Plus, 
  Settings, 
  Shield, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  Trash2,
  Copy,
  MoreVertical,
  RefreshCcw,
  Zap,
  GitBranch
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

interface Environment {
  id: string;
  name: string;
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

const EnvironmentsPanel = () => {
  const [environments, setEnvironments] = useState<Environment[]>([
    {
      id: '1',
      name: 'Development',
      strategy: 'rolling',
      approvalRequired: false,
      autoPromote: true,
      guardrails: { healthCheckRequired: true, rollbackOnFailure: true },
      lastDeployment: { version: 'v2.4.5', status: 'success', timestamp: '10 min ago' },
    },
    {
      id: '2',
      name: 'Staging',
      strategy: 'canary',
      approvalRequired: false,
      autoPromote: false,
      guardrails: { healthCheckRequired: true, rollbackOnFailure: true, maxReplicas: 3 },
      lastDeployment: { version: 'v2.4.4', status: 'success', timestamp: '2 hours ago' },
    },
    {
      id: '3',
      name: 'Production',
      strategy: 'blue-green',
      approvalRequired: true,
      autoPromote: false,
      vaultSource: 'azure-keyvault-prod',
      guardrails: { healthCheckRequired: true, rollbackOnFailure: true, maxReplicas: 10 },
      lastDeployment: { version: 'v2.4.1', status: 'success', timestamp: '1 day ago' },
    },
  ]);

  const [isWizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newEnv, setNewEnv] = useState<Partial<Environment>>({
    name: '',
    strategy: 'rolling',
    approvalRequired: false,
    autoPromote: false,
    guardrails: { healthCheckRequired: true, rollbackOnFailure: true },
  });

  const handleCreateEnvironment = () => {
    if (!newEnv.name) {
      toast.error('Environment name is required');
      return;
    }

    const env: Environment = {
      id: Date.now().toString(),
      name: newEnv.name,
      strategy: newEnv.strategy || 'rolling',
      approvalRequired: newEnv.approvalRequired || false,
      autoPromote: newEnv.autoPromote || false,
      vaultSource: newEnv.vaultSource,
      guardrails: newEnv.guardrails || { healthCheckRequired: true, rollbackOnFailure: true },
    };

    setEnvironments(prev => [...prev, env]);
    setWizardOpen(false);
    setWizardStep(1);
    setNewEnv({
      name: '',
      strategy: 'rolling',
      approvalRequired: false,
      autoPromote: false,
      guardrails: { healthCheckRequired: true, rollbackOnFailure: true },
    });
    toast.success(`Environment "${env.name}" created`);
  };

  const handleDeleteEnvironment = (id: string) => {
    setEnvironments(prev => prev.filter(e => e.id !== id));
    toast.success('Environment deleted');
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
                        env.name === 'Production' && 'bg-sec-critical',
                        env.name === 'Staging' && 'bg-sec-warning',
                        env.name === 'Development' && 'bg-sec-safe',
                        !['Production', 'Staging', 'Development'].includes(env.name) && 'bg-primary'
                      )} />

                      <div className="space-y-3">
                        {/* Header */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{env.name}</h3>
                            {getStrategyBadge(env.strategy)}
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
                        {env.lastDeployment && (
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
                        <DropdownMenuItem className="gap-2">
                          <Settings className="w-4 h-4" /> Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Copy className="w-4 h-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
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
                      checked={newEnv.guardrails?.healthCheckRequired}
                      onCheckedChange={(v) => setNewEnv(prev => ({ 
                        ...prev, 
                        guardrails: { ...prev.guardrails!, healthCheckRequired: v } 
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
                      checked={newEnv.guardrails?.rollbackOnFailure}
                      onCheckedChange={(v) => setNewEnv(prev => ({ 
                        ...prev, 
                        guardrails: { ...prev.guardrails!, rollbackOnFailure: v } 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vault Source (Optional)</Label>
                    <Select 
                      value={newEnv.vaultSource}
                      onValueChange={(v) => setNewEnv(prev => ({ ...prev, vaultSource: v }))}
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
                <Button variant="outline" onClick={() => setWizardStep(s => s - 1)}>
                  Back
                </Button>
              )}
              {wizardStep < 4 ? (
                <Button onClick={() => setWizardStep(s => s + 1)}>
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleCreateEnvironment}>
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
