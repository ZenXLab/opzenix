import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Link2, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Github,
  Cloud,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  ExternalLink,
  Database,
  Activity,
  Container
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConnectionCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

type ConnectionType = 'github' | 'azure' | 'vault' | 'registry' | 'otel';

interface ConnectionForm {
  type: ConnectionType;
  name: string;
  // GitHub
  repositoryOwner?: string;
  repositoryName?: string;
  accessToken?: string;
  // Azure
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  subscriptionId?: string;
  acrName?: string;
  aksClusterName?: string;
  aksResourceGroup?: string;
  keyVaultName?: string;
  // Vault
  vaultUrl?: string;
  vaultToken?: string;
  vaultNamespace?: string;
  // Registry
  registryType?: 'acr' | 'ecr' | 'dockerhub' | 'ghcr' | 'gcr';
  registryUrl?: string;
  registryUsername?: string;
  registryPassword?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
  gcpServiceAccountKey?: string;
  // OTel
  otelCollectorType?: 'otlp-http' | 'otlp-grpc' | 'jaeger' | 'zipkin' | 'prometheus';
  otelEndpoint?: string;
  otelPort?: string;
  otelAuthType?: 'none' | 'bearer' | 'basic' | 'api-key';
  otelAuthToken?: string;
  otelApiKey?: string;
  otelApiKeyHeader?: string;
}

const connectionTypes = [
  {
    id: 'github' as ConnectionType,
    name: 'GitHub',
    description: 'Connect your GitHub repository for CI/CD triggers',
    icon: Github,
    color: 'text-foreground',
    bgColor: 'bg-foreground/10',
    required: true,
    blocks: 'All executions',
  },
  {
    id: 'azure' as ConnectionType,
    name: 'Azure (AKS)',
    description: 'Connect Azure AKS for Kubernetes deployments',
    icon: Cloud,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    required: true,
    blocks: 'CD deployments',
  },
  {
    id: 'registry' as ConnectionType,
    name: 'Container Registry',
    description: 'ACR, ECR, Docker Hub, GHCR, or GCR',
    icon: Container,
    color: 'text-sec-info',
    bgColor: 'bg-sec-info/10',
    required: true,
    blocks: 'CD deployments',
  },
  {
    id: 'vault' as ConnectionType,
    name: 'Secrets Vault',
    description: 'Azure Key Vault or HashiCorp Vault',
    icon: Shield,
    color: 'text-sec-warning',
    bgColor: 'bg-sec-warning/10',
    required: true,
    blocks: 'Deployments',
  },
  {
    id: 'otel' as ConnectionType,
    name: 'OpenTelemetry',
    description: 'Traces, metrics, and logs collection',
    icon: Activity,
    color: 'text-sec-safe',
    bgColor: 'bg-sec-safe/10',
    required: false,
    blocks: 'Warning only',
  },
];

const ConnectionCreationWizard = ({ open, onOpenChange, onComplete }: ConnectionCreationWizardProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [validationResult, setValidationResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [form, setForm] = useState<ConnectionForm>({
    type: 'github',
    name: '',
  });

  const selectedType = connectionTypes.find(t => t.id === form.type)!;

  const updateForm = (updates: Partial<ConnectionForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
    setValidationResult(null);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setValidationResult(null);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      if (form.type === 'azure') {
        // Call Azure validation edge function
        const { data, error } = await supabase.functions.invoke('azure-validate', {
          body: {
            tenantId: form.tenantId,
            clientId: form.clientId,
            clientSecret: form.clientSecret,
            subscriptionId: form.subscriptionId,
            acrName: form.acrName,
            aksClusterName: form.aksClusterName,
            aksResourceGroup: form.aksResourceGroup,
            keyVaultName: form.keyVaultName,
          }
        });

        if (error) throw error;

        const failedServices = data.results?.filter((r: any) => r.status === 'failed') || [];
        
        if (failedServices.length > 0) {
          setValidationResult({
            success: false,
            message: `Validation failed for: ${failedServices.map((f: any) => f.service).join(', ')}`
          });
        } else {
          setValidationResult({
            success: true,
            message: `Successfully validated ${data.summary?.successful || 0} service(s)`
          });
        }
      } else if (form.type === 'github') {
        // For GitHub, we just verify the token works
        if (!form.accessToken) {
          setValidationResult({ success: false, message: 'Access token required' });
          return;
        }
        
        // Test the token by fetching user info
        const response = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `Bearer ${form.accessToken}` }
        });

        if (!response.ok) {
          setValidationResult({ success: false, message: 'Invalid GitHub token' });
        } else {
          const user = await response.json();
          setValidationResult({ 
            success: true, 
            message: `Authenticated as ${user.login}` 
          });
        }
      } else if (form.type === 'vault') {
        // For Vault, test the connection
        if (!form.vaultUrl || !form.vaultToken) {
          setValidationResult({ success: false, message: 'Vault URL and token required' });
          return;
        }

        // Simple health check
        const response = await fetch(`${form.vaultUrl}/v1/sys/health`, {
          headers: { 'X-Vault-Token': form.vaultToken }
        });

        if (response.ok) {
          setValidationResult({ success: true, message: 'Vault connection successful' });
        } else {
          setValidationResult({ success: false, message: 'Vault connection failed' });
        }
      } else if (form.type === 'registry') {
        // Validate container registry
        const { data, error } = await supabase.functions.invoke('validate-registry', {
          body: {
            registryType: form.registryType,
            registryUrl: form.registryUrl,
            acrName: form.acrName,
            tenantId: form.tenantId,
            clientId: form.clientId,
            clientSecret: form.clientSecret,
            subscriptionId: form.subscriptionId,
            username: form.registryUsername,
            password: form.registryPassword,
            awsAccessKeyId: form.awsAccessKeyId,
            awsSecretAccessKey: form.awsSecretAccessKey,
            awsRegion: form.awsRegion,
            gcpServiceAccountKey: form.gcpServiceAccountKey,
          }
        });

        if (error) throw error;

        if (data.success) {
          setValidationResult({
            success: true,
            message: data.message || `Registry validated: ${data.registryUrl}`
          });
        } else {
          setValidationResult({
            success: false,
            message: data.message || 'Registry validation failed'
          });
        }
      } else if (form.type === 'otel') {
        // Validate OpenTelemetry collector
        const { data, error } = await supabase.functions.invoke('validate-otel', {
          body: {
            collectorType: form.otelCollectorType,
            endpoint: form.otelEndpoint,
            port: form.otelPort ? parseInt(form.otelPort) : undefined,
            authType: form.otelAuthType,
            authToken: form.otelAuthToken,
            apiKey: form.otelApiKey,
            apiKeyHeader: form.otelApiKeyHeader,
          }
        });

        if (error) throw error;

        if (data.success) {
          setValidationResult({
            success: true,
            message: data.message || `Collector validated: ${data.endpoint}`
          });
        } else {
          setValidationResult({
            success: false,
            message: data.message || 'Collector validation failed'
          });
        }
      }
    } catch (error: any) {
      console.error('[ConnectionWizard] Validation error:', error);
      setValidationResult({ success: false, message: error.message || 'Validation failed' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name) {
      toast.error('Connection name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build config based on type
      let config: Record<string, any> = {};
      
      if (form.type === 'github') {
        config = {
          repositoryOwner: form.repositoryOwner,
          repositoryName: form.repositoryName,
          // Note: In production, store token securely in Vault/Secrets Manager
        };
      } else if (form.type === 'azure') {
        config = {
          subscriptionId: form.subscriptionId,
          tenantId: form.tenantId,
          acrName: form.acrName,
          aksClusterName: form.aksClusterName,
          aksResourceGroup: form.aksResourceGroup,
          keyVaultName: form.keyVaultName,
        };
      } else if (form.type === 'vault') {
        config = {
          vaultUrl: form.vaultUrl,
          vaultNamespace: form.vaultNamespace,
        };
      } else if (form.type === 'registry') {
        config = {
          registryType: form.registryType,
          registryUrl: form.registryUrl,
          awsRegion: form.awsRegion,
        };
      } else if (form.type === 'otel') {
        config = {
          collectorType: form.otelCollectorType,
          endpoint: form.otelEndpoint,
          port: form.otelPort,
          authType: form.otelAuthType,
        };
      }

      const { error } = await supabase.from('connections').insert({
        type: form.type,
        name: form.name,
        status: validationResult?.success ? 'connected' : 'pending',
        config,
        validated: validationResult?.success || false,
        validation_message: validationResult?.message,
        last_validated_at: validationResult?.success ? new Date().toISOString() : null,
      });

      if (error) throw error;

      // Log to audit
      await supabase.from('audit_logs').insert({
        action: 'create_connection',
        resource_type: 'connection',
        details: { type: form.type, name: form.name }
      });

      toast.success(`${form.name} connection created`);
      onOpenChange(false);
      onComplete?.();

      // Reset
      setStep(1);
      setForm({ type: 'github', name: '' });
      setValidationResult(null);
    } catch (error: any) {
      console.error('[ConnectionWizard] Error:', error);
      toast.error(error.message || 'Failed to create connection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Add Connection
          </DialogTitle>
          <DialogDescription>
            Connect an external service. Step {step} of 3
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
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
            className="py-4 min-h-[350px]"
          >
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <h3 className="text-lg font-semibold">Select Connection Type</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose the service you want to connect
                  </p>
                </div>

                <div className="grid gap-3">
                  {connectionTypes.map((type) => (
                    <Card 
                      key={type.id}
                      className={cn(
                        'cursor-pointer transition-all',
                        form.type === type.id 
                          ? 'ring-2 ring-primary border-primary' 
                          : 'hover:border-muted-foreground/50'
                      )}
                      onClick={() => updateForm({ type: type.id, name: `My ${type.name} Connection` })}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={cn('p-3 rounded-lg', type.bgColor)}>
                          <type.icon className={cn('w-5 h-5', type.color)} />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">{type.name}</span>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                        {form.type === type.id && (
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
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', selectedType.bgColor)}>
                    <selectedType.icon className={cn('w-4 h-4', selectedType.color)} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedType.name} Configuration</h3>
                    <p className="text-sm text-muted-foreground">Enter your credentials</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Connection Name</Label>
                    <Input 
                      value={form.name}
                      onChange={(e) => updateForm({ name: e.target.value })}
                      placeholder="e.g., Production GitHub"
                    />
                  </div>

                  {form.type === 'github' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Repository Owner</Label>
                          <Input 
                            value={form.repositoryOwner || ''}
                            onChange={(e) => updateForm({ repositoryOwner: e.target.value })}
                            placeholder="organization or username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Repository Name</Label>
                          <Input 
                            value={form.repositoryName || ''}
                            onChange={(e) => updateForm({ repositoryName: e.target.value })}
                            placeholder="my-app"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Personal Access Token</Label>
                        <div className="relative">
                          <Input 
                            type={showSecrets ? 'text' : 'password'}
                            value={form.accessToken || ''}
                            onChange={(e) => updateForm({ accessToken: e.target.value })}
                            placeholder="ghp_..."
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-7 w-7"
                            onClick={() => setShowSecrets(!showSecrets)}
                          >
                            {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          Needs repo, workflow, and admin:repo_hook scopes
                          <a 
                            href="https://github.com/settings/tokens/new" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-0.5"
                          >
                            Create token <ExternalLink className="w-3 h-3" />
                          </a>
                        </p>
                      </div>
                    </>
                  )}

                  {form.type === 'azure' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tenant ID</Label>
                          <Input 
                            value={form.tenantId || ''}
                            onChange={(e) => updateForm({ tenantId: e.target.value })}
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Subscription ID</Label>
                          <Input 
                            value={form.subscriptionId || ''}
                            onChange={(e) => updateForm({ subscriptionId: e.target.value })}
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Client ID</Label>
                          <Input 
                            value={form.clientId || ''}
                            onChange={(e) => updateForm({ clientId: e.target.value })}
                            placeholder="App registration client ID"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Client Secret</Label>
                          <Input 
                            type={showSecrets ? 'text' : 'password'}
                            value={form.clientSecret || ''}
                            onChange={(e) => updateForm({ clientSecret: e.target.value })}
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>ACR Name (optional)</Label>
                          <Input 
                            value={form.acrName || ''}
                            onChange={(e) => updateForm({ acrName: e.target.value })}
                            placeholder="myregistry"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>AKS Cluster (optional)</Label>
                          <Input 
                            value={form.aksClusterName || ''}
                            onChange={(e) => updateForm({ aksClusterName: e.target.value })}
                            placeholder="my-cluster"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Key Vault (optional)</Label>
                          <Input 
                            value={form.keyVaultName || ''}
                            onChange={(e) => updateForm({ keyVaultName: e.target.value })}
                            placeholder="my-vault"
                          />
                        </div>
                      </div>
                      {form.aksClusterName && (
                        <div className="space-y-2">
                          <Label>AKS Resource Group</Label>
                          <Input 
                            value={form.aksResourceGroup || ''}
                            onChange={(e) => updateForm({ aksResourceGroup: e.target.value })}
                            placeholder="my-resource-group"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {form.type === 'vault' && (
                    <>
                      <div className="space-y-2">
                        <Label>Vault URL</Label>
                        <Input 
                          value={form.vaultUrl || ''}
                          onChange={(e) => updateForm({ vaultUrl: e.target.value })}
                          placeholder="https://vault.example.com:8200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Vault Token</Label>
                        <Input 
                          type={showSecrets ? 'text' : 'password'}
                          value={form.vaultToken || ''}
                          onChange={(e) => updateForm({ vaultToken: e.target.value })}
                          placeholder="hvs...."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Namespace (optional)</Label>
                        <Input 
                          value={form.vaultNamespace || ''}
                          onChange={(e) => updateForm({ vaultNamespace: e.target.value })}
                          placeholder="admin"
                        />
                      </div>
                    </>
                  )}

                  {form.type === 'registry' && (
                    <>
                      <div className="space-y-2">
                        <Label>Registry Type</Label>
                        <Select value={form.registryType || 'acr'} onValueChange={(v) => updateForm({ registryType: v as any })}>
                          <SelectTrigger><SelectValue placeholder="Select registry" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="acr">Azure Container Registry (ACR)</SelectItem>
                            <SelectItem value="ecr">AWS ECR</SelectItem>
                            <SelectItem value="dockerhub">Docker Hub</SelectItem>
                            <SelectItem value="ghcr">GitHub Container Registry</SelectItem>
                            <SelectItem value="gcr">Google Container Registry</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(form.registryType === 'dockerhub' || form.registryType === 'ghcr') && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Username</Label>
                            <Input value={form.registryUsername || ''} onChange={(e) => updateForm({ registryUsername: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Access Token</Label>
                            <Input type={showSecrets ? 'text' : 'password'} value={form.registryPassword || ''} onChange={(e) => updateForm({ registryPassword: e.target.value })} />
                          </div>
                        </div>
                      )}
                      {form.registryType === 'ecr' && (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>AWS Region</Label>
                            <Input value={form.awsRegion || ''} onChange={(e) => updateForm({ awsRegion: e.target.value })} placeholder="us-east-1" />
                          </div>
                          <div className="space-y-2">
                            <Label>Access Key ID</Label>
                            <Input value={form.awsAccessKeyId || ''} onChange={(e) => updateForm({ awsAccessKeyId: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Secret Key</Label>
                            <Input type={showSecrets ? 'text' : 'password'} value={form.awsSecretAccessKey || ''} onChange={(e) => updateForm({ awsSecretAccessKey: e.target.value })} />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {form.type === 'otel' && (
                    <>
                      <div className="space-y-2">
                        <Label>Collector Type</Label>
                        <Select value={form.otelCollectorType || 'otlp-http'} onValueChange={(v) => updateForm({ otelCollectorType: v as any })}>
                          <SelectTrigger><SelectValue placeholder="Select collector" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="otlp-http">OTLP/HTTP</SelectItem>
                            <SelectItem value="otlp-grpc">OTLP/gRPC</SelectItem>
                            <SelectItem value="jaeger">Jaeger</SelectItem>
                            <SelectItem value="zipkin">Zipkin</SelectItem>
                            <SelectItem value="prometheus">Prometheus</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 col-span-2">
                          <Label>Endpoint URL</Label>
                          <Input value={form.otelEndpoint || ''} onChange={(e) => updateForm({ otelEndpoint: e.target.value })} placeholder="https://otel-collector.example.com" />
                        </div>
                        <div className="space-y-2">
                          <Label>Port (optional)</Label>
                          <Input value={form.otelPort || ''} onChange={(e) => updateForm({ otelPort: e.target.value })} placeholder="4318" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Authentication</Label>
                        <Select value={form.otelAuthType || 'none'} onValueChange={(v) => updateForm({ otelAuthType: v as any })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Authentication</SelectItem>
                            <SelectItem value="bearer">Bearer Token</SelectItem>
                            <SelectItem value="api-key">API Key</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {form.otelAuthType === 'bearer' && (
                        <div className="space-y-2">
                          <Label>Bearer Token</Label>
                          <Input type={showSecrets ? 'text' : 'password'} value={form.otelAuthToken || ''} onChange={(e) => updateForm({ otelAuthToken: e.target.value })} />
                        </div>
                      )}
                      {form.otelAuthType === 'api-key' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>API Key</Label>
                            <Input type={showSecrets ? 'text' : 'password'} value={form.otelApiKey || ''} onChange={(e) => updateForm({ otelApiKey: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Header Name</Label>
                            <Input value={form.otelApiKeyHeader || 'X-API-Key'} onChange={(e) => updateForm({ otelApiKeyHeader: e.target.value })} />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="mt-2"
                  >
                    {showSecrets ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showSecrets ? 'Hide Secrets' : 'Show Secrets'}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center py-2">
                  <h3 className="text-lg font-semibold">Validate & Create</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Test the connection before saving
                  </p>
                </div>

                <Card className="border-dashed">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={cn('p-3 rounded-lg', selectedType.bgColor)}>
                        <selectedType.icon className={cn('w-6 h-6', selectedType.color)} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{form.name}</h4>
                        <p className="text-sm text-muted-foreground">{selectedType.name} Connection</p>
                      </div>
                      <Badge variant={
                        validationResult?.success ? 'default' : 
                        validationResult ? 'destructive' : 
                        'secondary'
                      }>
                        {validationResult?.success ? 'Validated' : 
                         validationResult ? 'Failed' : 
                         'Not validated'}
                      </Badge>
                    </div>

                    {validationResult && (
                      <div className={cn(
                        'mt-4 p-3 rounded-lg text-sm flex items-start gap-2',
                        validationResult.success 
                          ? 'bg-sec-safe/10 text-sec-safe' 
                          : 'bg-sec-critical/10 text-sec-critical'
                      )}>
                        {validationResult.success ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        )}
                        {validationResult.message}
                      </div>
                    )}

                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={handleValidate}
                      disabled={isValidating}
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Validate Connection
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {!validationResult?.success && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border">
                    <AlertTriangle className="w-4 h-4 text-sec-warning shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      You can create the connection without validation, but deployments will be blocked until validated.
                    </p>
                  </div>
                )}
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

          {step < 3 ? (
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
                  Create Connection
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionCreationWizard;
