import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Shield,
  Zap,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EnvironmentSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

interface EnvironmentConfig {
  name: string;
  environment: 'development' | 'staging' | 'production';
  strategy: 'rolling' | 'canary' | 'blue-green';
  approvalRequired: boolean;
  autoPromote: boolean;
  healthCheckRequired: boolean;
  rollbackOnFailure: boolean;
  secretsRef?: string;
}

const defaultEnvironments: EnvironmentConfig[] = [
  {
    name: 'Development',
    environment: 'development',
    strategy: 'rolling',
    approvalRequired: false,
    autoPromote: true,
    healthCheckRequired: true,
    rollbackOnFailure: true,
  },
  {
    name: 'Staging',
    environment: 'staging',
    strategy: 'canary',
    approvalRequired: false,
    autoPromote: false,
    healthCheckRequired: true,
    rollbackOnFailure: true,
  },
  {
    name: 'Production',
    environment: 'production',
    strategy: 'blue-green',
    approvalRequired: true,
    autoPromote: false,
    healthCheckRequired: true,
    rollbackOnFailure: true,
  },
];

const EnvironmentSetupWizard = ({ open, onOpenChange, onComplete }: EnvironmentSetupWizardProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [environments, setEnvironments] = useState<EnvironmentConfig[]>(defaultEnvironments);
  const [selectedEnv, setSelectedEnv] = useState<'development' | 'staging' | 'production'>('development');

  const currentEnv = environments.find(e => e.environment === selectedEnv)!;
  const currentEnvIndex = environments.findIndex(e => e.environment === selectedEnv);

  const updateCurrentEnv = (updates: Partial<EnvironmentConfig>) => {
    setEnvironments(prev => prev.map((e, i) => 
      i === currentEnvIndex ? { ...e, ...updates } : e
    ));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    
    try {
      // Create all environments in database
      for (const env of environments) {
        const { error } = await supabase.from('environment_configs').insert({
          name: env.name,
          environment: env.environment,
          variables: {
            strategy: env.strategy,
            approvalRequired: env.approvalRequired,
            autoPromote: env.autoPromote,
            guardrails: {
              healthCheckRequired: env.healthCheckRequired,
              rollbackOnFailure: env.rollbackOnFailure,
            }
          },
          secrets_ref: env.secretsRef || null,
          is_active: true,
        });

        if (error) {
          console.error('[EnvironmentSetupWizard] Error creating environment:', error);
          throw error;
        }
      }

      // Log to audit
      await supabase.from('audit_logs').insert({
        action: 'create_environments',
        resource_type: 'environment_config',
        details: { environments: environments.map(e => e.name) }
      });

      toast.success('Environments created successfully');
      onOpenChange(false);
      onComplete?.();
      
      // Reset wizard
      setStep(1);
      setEnvironments(defaultEnvironments);
    } catch (error: any) {
      console.error('[EnvironmentSetupWizard] Error:', error);
      toast.error(error.message || 'Failed to create environments');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Environment Setup
          </DialogTitle>
          <DialogDescription>
            Configure your deployment environments. Step {step} of 4
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 py-2">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s}
              className={cn(
                'flex-1 h-1 rounded-full transition-colors',
                s <= step ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="py-4 min-h-[300px]"
          >
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <h3 className="text-lg font-semibold">Choose Environment to Configure</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    We'll set up Development, Staging, and Production environments
                  </p>
                </div>

                <div className="grid gap-3">
                  {environments.map((env) => (
                    <Card 
                      key={env.environment}
                      className={cn(
                        'cursor-pointer transition-all',
                        selectedEnv === env.environment 
                          ? 'ring-2 ring-primary border-primary' 
                          : 'hover:border-muted-foreground/50'
                      )}
                      onClick={() => setSelectedEnv(env.environment)}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={cn(
                          'w-3 h-12 rounded-full',
                          env.environment === 'production' && 'bg-sec-critical',
                          env.environment === 'staging' && 'bg-sec-warning',
                          env.environment === 'development' && 'bg-sec-safe'
                        )} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{env.name}</span>
                            {env.approvalRequired && (
                              <Shield className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">
                            {env.strategy.replace('-', ' ')} deployment
                          </p>
                        </div>
                        {selectedEnv === env.environment && (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold capitalize">{selectedEnv} Environment</h3>
                  <p className="text-sm text-muted-foreground">Configure deployment strategy</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Environment Name</Label>
                    <Input 
                      value={currentEnv.name}
                      onChange={(e) => updateCurrentEnv({ name: e.target.value })}
                      placeholder="e.g., Development"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Deployment Strategy</Label>
                    <Select 
                      value={currentEnv.strategy}
                      onValueChange={(v) => updateCurrentEnv({ strategy: v as EnvironmentConfig['strategy'] })}
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
                      {currentEnv.strategy === 'rolling' && 'Gradually replaces instances with new version'}
                      {currentEnv.strategy === 'canary' && 'Routes a percentage of traffic to new version first'}
                      {currentEnv.strategy === 'blue-green' && 'Runs two identical environments, switches traffic instantly'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold capitalize">{selectedEnv} Policies</h3>
                  <p className="text-sm text-muted-foreground">Set approval and promotion rules</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-primary" />
                      <div>
                        <Label>Require Approval</Label>
                        <p className="text-xs text-muted-foreground">
                          Deployments must be approved before proceeding
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={currentEnv.approvalRequired}
                      onCheckedChange={(v) => updateCurrentEnv({ approvalRequired: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-sec-warning" />
                      <div>
                        <Label>Auto-Promote</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically promote successful deployments to next stage
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={currentEnv.autoPromote}
                      onCheckedChange={(v) => updateCurrentEnv({ autoPromote: v })}
                    />
                  </div>
                </div>

                {currentEnv.approvalRequired && currentEnv.autoPromote && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-sec-warning/10 border border-sec-warning/20">
                    <AlertTriangle className="w-4 h-4 text-sec-warning shrink-0 mt-0.5" />
                    <p className="text-xs text-sec-warning">
                      Auto-promote will only trigger after approval is granted
                    </p>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold capitalize">{selectedEnv} Guardrails</h3>
                  <p className="text-sm text-muted-foreground">Configure safety checks</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label>Health Check Required</Label>
                      <p className="text-xs text-muted-foreground">
                        Verify health before completing deployment
                      </p>
                    </div>
                    <Switch 
                      checked={currentEnv.healthCheckRequired}
                      onCheckedChange={(v) => updateCurrentEnv({ healthCheckRequired: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <Label>Auto-Rollback on Failure</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically rollback if deployment fails
                      </p>
                    </div>
                    <Switch 
                      checked={currentEnv.rollbackOnFailure}
                      onCheckedChange={(v) => updateCurrentEnv({ rollbackOnFailure: v })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Secrets Reference (Optional)</Label>
                    <Select 
                      value={currentEnv.secretsRef || ''}
                      onValueChange={(v) => updateCurrentEnv({ secretsRef: v || undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vault source..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="azure-keyvault">Azure Key Vault</SelectItem>
                        <SelectItem value="hashicorp-vault">HashiCorp Vault</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <h4 className="font-medium text-sm">Ready to create {environments.length} environments:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {environments.map(env => (
                      <li key={env.environment} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-sec-safe" />
                        {env.name} ({env.strategy})
                        {env.approvalRequired && ' • Approval required'}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={step === 1 || isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < 4 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Create Environments
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnvironmentSetupWizard;
