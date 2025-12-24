import { useState, useEffect } from 'react';
import { 
  Settings, Shield, Zap, RefreshCcw, CheckCircle2, 
  Loader2, AlertTriangle, Save
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

interface EnvironmentConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  environment: Environment | null;
  onSave?: () => void;
}

export function EnvironmentConfigDialog({ 
  open, 
  onOpenChange, 
  environment, 
  onSave 
}: EnvironmentConfigDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('strategy');
  
  // Form state
  const [config, setConfig] = useState<{
    name: string;
    strategy: 'rolling' | 'canary' | 'blue-green';
    approvalRequired: boolean;
    autoPromote: boolean;
    vaultSource: string;
    healthCheckRequired: boolean;
    rollbackOnFailure: boolean;
    maxReplicas: string;
    requiredApprovers: string;
    canaryPercentage: string;
    blueGreenTimeout: string;
  }>({
    name: '',
    strategy: 'rolling',
    approvalRequired: false,
    autoPromote: false,
    vaultSource: '',
    healthCheckRequired: true,
    rollbackOnFailure: true,
    maxReplicas: '',
    requiredApprovers: '2',
    canaryPercentage: '10',
    blueGreenTimeout: '300',
  });

  // Initialize form when environment changes
  useEffect(() => {
    if (environment) {
      setConfig({
        name: environment.name,
        strategy: environment.strategy,
        approvalRequired: environment.approvalRequired,
        autoPromote: environment.autoPromote,
        vaultSource: environment.vaultSource || '',
        healthCheckRequired: environment.guardrails.healthCheckRequired,
        rollbackOnFailure: environment.guardrails.rollbackOnFailure,
        maxReplicas: environment.guardrails.maxReplicas?.toString() || '',
        requiredApprovers: '2',
        canaryPercentage: '10',
        blueGreenTimeout: '300',
      });
    }
  }, [environment]);

  const handleSave = async () => {
    if (!environment) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('environment_configs')
        .update({
          name: config.name,
          variables: {
            strategy: config.strategy,
            approvalRequired: config.approvalRequired,
            autoPromote: config.autoPromote,
            vaultSource: config.vaultSource || null,
            healthCheckRequired: config.healthCheckRequired,
            rollbackOnFailure: config.rollbackOnFailure,
            maxReplicas: config.maxReplicas ? parseInt(config.maxReplicas) : null,
            requiredApprovers: parseInt(config.requiredApprovers),
            canaryPercentage: parseInt(config.canaryPercentage),
            blueGreenTimeout: parseInt(config.blueGreenTimeout),
          }
        })
        .eq('id', environment.id);

      if (error) throw error;

      toast.success(`Environment "${config.name}" updated`);
      onSave?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error('[EnvironmentConfigDialog] Error saving:', err);
      toast.error(err.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (!environment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configure {environment.name}
          </DialogTitle>
          <DialogDescription>
            Edit deployment strategy, approval rules, and guardrails for this environment.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="strategy" className="gap-2">
              <Zap className="w-4 h-4" />
              Strategy
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-2">
              <Shield className="w-4 h-4" />
              Approvals
            </TabsTrigger>
            <TabsTrigger value="guardrails" className="gap-2">
              <RefreshCcw className="w-4 h-4" />
              Guardrails
            </TabsTrigger>
          </TabsList>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Environment Name</Label>
              <Input 
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Production, Staging"
              />
            </div>

            <div className="space-y-2">
              <Label>Deployment Strategy</Label>
              <Select 
                value={config.strategy}
                onValueChange={(v) => setConfig(prev => ({ ...prev, strategy: v as typeof config.strategy }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rolling">
                    <div className="flex flex-col">
                      <span>Rolling Update</span>
                      <span className="text-xs text-muted-foreground">Gradually replace instances</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="canary">
                    <div className="flex flex-col">
                      <span>Canary Deployment</span>
                      <span className="text-xs text-muted-foreground">Route % of traffic to new version</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="blue-green">
                    <div className="flex flex-col">
                      <span>Blue-Green Deployment</span>
                      <span className="text-xs text-muted-foreground">Instant traffic switch</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Strategy-specific settings */}
            {config.strategy === 'canary' && (
              <Card className="border-sec-warning/30 bg-sec-warning/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-sec-warning/20 text-sec-warning">Canary Settings</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Initial Traffic Percentage</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        min="1"
                        max="50"
                        value={config.canaryPercentage}
                        onChange={(e) => setConfig(prev => ({ ...prev, canaryPercentage: e.target.value }))}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">% of traffic to canary</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {config.strategy === 'blue-green' && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/20 text-primary">Blue-Green Settings</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Switchover Timeout (seconds)</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        min="60"
                        max="3600"
                        value={config.blueGreenTimeout}
                        onChange={(e) => setConfig(prev => ({ ...prev, blueGreenTimeout: e.target.value }))}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">seconds before auto-rollback</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label>Vault Source (Optional)</Label>
              <Select 
                value={config.vaultSource}
                onValueChange={(v) => setConfig(prev => ({ ...prev, vaultSource: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select secrets source..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="azure-keyvault-prod">Azure Key Vault (Prod)</SelectItem>
                  <SelectItem value="azure-keyvault-dev">Azure Key Vault (Dev)</SelectItem>
                  <SelectItem value="hashicorp-vault">HashiCorp Vault</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="mt-4 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">Require Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Deployments must be approved before proceeding
                </p>
              </div>
              <Switch 
                checked={config.approvalRequired}
                onCheckedChange={(v) => setConfig(prev => ({ ...prev, approvalRequired: v }))}
              />
            </div>

            {config.approvalRequired && (
              <Card className="border-primary/30">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Required Approvers</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        min="1"
                        max="10"
                        value={config.requiredApprovers}
                        onChange={(e) => setConfig(prev => ({ ...prev, requiredApprovers: e.target.value }))}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">approvers needed</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Approver Roles</Label>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Admin
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Operator
                      </Badge>
                      {environment.environment === 'production' && (
                        <Badge variant="outline" className="gap-1 border-sec-critical/50 text-sec-critical">
                          <AlertTriangle className="w-3 h-3" /> Security Lead
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-Promote</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically promote successful deployments to next stage
                </p>
              </div>
              <Switch 
                checked={config.autoPromote}
                onCheckedChange={(v) => setConfig(prev => ({ ...prev, autoPromote: v }))}
              />
            </div>
          </TabsContent>

          {/* Guardrails Tab */}
          <TabsContent value="guardrails" className="mt-4 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                  Health Check Required
                </Label>
                <p className="text-sm text-muted-foreground">
                  Verify application health before completing deployment
                </p>
              </div>
              <Switch 
                checked={config.healthCheckRequired}
                onCheckedChange={(v) => setConfig(prev => ({ ...prev, healthCheckRequired: v }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 text-sec-safe" />
                  Auto-Rollback on Failure
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically rollback if deployment fails health checks
                </p>
              </div>
              <Switch 
                checked={config.rollbackOnFailure}
                onCheckedChange={(v) => setConfig(prev => ({ ...prev, rollbackOnFailure: v }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Replicas (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number"
                  min="1"
                  max="100"
                  value={config.maxReplicas}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxReplicas: e.target.value }))}
                  placeholder="No limit"
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">maximum pod replicas</span>
              </div>
            </div>

            {environment.environment === 'production' && (
              <Card className="border-sec-critical/30 bg-sec-critical/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-sec-critical shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sec-critical">Production Environment</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Additional guardrails are enforced for production deployments including
                        mandatory health checks, change ticket requirements, and admin-only unlocks.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EnvironmentConfigDialog;
