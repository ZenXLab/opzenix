import { useState, useCallback, useEffect } from 'react';
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
  Activity,
  Container,
  XCircle,
  RefreshCw
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

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  success: boolean;
  message: string;
  details?: { service: string; status: string; message: string; latencyMs?: number }[];
}

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
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ValidationError[]>([]);
  
  const [form, setForm] = useState<ConnectionForm>({
    type: 'github',
    name: '',
  });

  const selectedType = connectionTypes.find(t => t.id === form.type)!;

  // Get required fields based on connection type
  const getRequiredFields = useCallback((): { field: keyof ConnectionForm; label: string }[] => {
    const baseFields: { field: keyof ConnectionForm; label: string }[] = [
      { field: 'name', label: 'Connection Name' }
    ];

    switch (form.type) {
      case 'github':
        return [...baseFields, 
          { field: 'repositoryOwner', label: 'Repository Owner' },
          { field: 'repositoryName', label: 'Repository Name' },
          { field: 'accessToken', label: 'Access Token' }
        ];
      case 'azure':
        return [...baseFields,
          { field: 'tenantId', label: 'Tenant ID' },
          { field: 'clientId', label: 'Client ID' },
          { field: 'clientSecret', label: 'Client Secret' },
          { field: 'subscriptionId', label: 'Subscription ID' }
        ];
      case 'vault':
        return [...baseFields,
          { field: 'vaultUrl', label: 'Vault URL' },
          { field: 'vaultToken', label: 'Vault Token' }
        ];
      case 'registry':
        const registryFields = [...baseFields];
        if (form.registryType === 'dockerhub' || form.registryType === 'ghcr') {
          registryFields.push(
            { field: 'registryUsername', label: 'Username' },
            { field: 'registryPassword', label: 'Access Token' }
          );
        } else if (form.registryType === 'ecr') {
          registryFields.push(
            { field: 'awsRegion', label: 'AWS Region' },
            { field: 'awsAccessKeyId', label: 'Access Key ID' },
            { field: 'awsSecretAccessKey', label: 'Secret Key' }
          );
        } else if (form.registryType === 'acr') {
          registryFields.push(
            { field: 'tenantId', label: 'Tenant ID' },
            { field: 'clientId', label: 'Client ID' },
            { field: 'clientSecret', label: 'Client Secret' }
          );
        }
        return registryFields;
      case 'otel':
        return [...baseFields,
          { field: 'otelEndpoint', label: 'Endpoint URL' }
        ];
      default:
        return baseFields;
    }
  }, [form.type, form.registryType]);

  // Validate required fields
  const validateFields = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    const requiredFields = getRequiredFields();

    for (const { field, label } of requiredFields) {
      const value = form[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push({ field, message: `${label} is required` });
      }
    }

    return errors;
  }, [form, getRequiredFields]);

  // Check if form is valid for proceeding
  const isFormValid = useCallback((): boolean => {
    return validateFields().length === 0;
  }, [validateFields]);

  // Real-time field validation on blur
  const handleFieldBlur = useCallback((field: keyof ConnectionForm) => {
    const requiredFields = getRequiredFields();
    const fieldDef = requiredFields.find(f => f.field === field);
    
    if (fieldDef) {
      const value = form[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        setFieldErrors(prev => {
          const existing = prev.find(e => e.field === field);
          if (!existing) {
            return [...prev, { field, message: `${fieldDef.label} is required` }];
          }
          return prev;
        });
      } else {
        setFieldErrors(prev => prev.filter(e => e.field !== field));
      }
    }
  }, [form, getRequiredFields]);

  const updateForm = (updates: Partial<ConnectionForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
    setValidationResult(null);
    // Clear field errors for updated fields
    Object.keys(updates).forEach(field => {
      setFieldErrors(prev => prev.filter(e => e.field !== field));
    });
  };

  const handleNext = () => {
    // Validate before moving to step 2
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Validate all fields before moving to step 3
      const errors = validateFields();
      if (errors.length > 0) {
        setFieldErrors(errors);
        toast.error('Please fill in all required fields');
        return;
      }
      // Validate the connection before proceeding
      handleValidate();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setValidationResult(null);
      setFieldErrors([]);
    }
  };

  const handleValidate = async () => {
    // First validate required fields
    const errors = validateFields();
    if (errors.length > 0) {
      setFieldErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      if (form.type === 'azure') {
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

        const results = data.results || [];
        const failedServices = results.filter((r: any) => r.status === 'failed');
        
        if (failedServices.length > 0) {
          setValidationResult({
            success: false,
            message: `Validation failed for ${failedServices.length} service(s)`,
            details: results
          });
        } else {
          setValidationResult({
            success: true,
            message: `Successfully validated ${data.summary?.successful || 0} service(s)`,
            details: results
          });
          setStep(3);
        }
      } else if (form.type === 'github') {
        const response = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `Bearer ${form.accessToken}` }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          setValidationResult({ 
            success: false, 
            message: errorData.message || 'Invalid GitHub token',
            details: [{ service: 'GitHub API', status: 'failed', message: errorData.message || 'Authentication failed' }]
          });
        } else {
          const user = await response.json();
          
          // Also verify repo access
          const repoResponse = await fetch(`https://api.github.com/repos/${form.repositoryOwner}/${form.repositoryName}`, {
            headers: { 'Authorization': `Bearer ${form.accessToken}` }
          });
          
          if (!repoResponse.ok) {
            setValidationResult({
              success: false,
              message: 'Cannot access repository',
              details: [
                { service: 'GitHub Auth', status: 'success', message: `Authenticated as ${user.login}` },
                { service: 'Repository Access', status: 'failed', message: `Cannot access ${form.repositoryOwner}/${form.repositoryName}` }
              ]
            });
          } else {
            setValidationResult({ 
              success: true, 
              message: `Authenticated as ${user.login}`,
              details: [
                { service: 'GitHub Auth', status: 'success', message: `User: ${user.login}` },
                { service: 'Repository Access', status: 'success', message: `${form.repositoryOwner}/${form.repositoryName}` }
              ]
            });
            setStep(3);
          }
        }
      } else if (form.type === 'vault') {
        try {
          const response = await fetch(`${form.vaultUrl}/v1/sys/health`, {
            headers: { 'X-Vault-Token': form.vaultToken! }
          });

          if (response.ok) {
            setValidationResult({ 
              success: true, 
              message: 'Vault connection successful',
              details: [{ service: 'HashiCorp Vault', status: 'success', message: 'Health check passed' }]
            });
            setStep(3);
          } else {
            setValidationResult({ 
              success: false, 
              message: 'Vault connection failed',
              details: [{ service: 'HashiCorp Vault', status: 'failed', message: `HTTP ${response.status}` }]
            });
          }
        } catch (err: any) {
          setValidationResult({ 
            success: false, 
            message: 'Cannot reach Vault server',
            details: [{ service: 'HashiCorp Vault', status: 'failed', message: err.message || 'Network error' }]
          });
        }
      } else if (form.type === 'registry') {
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
            message: data.message || `Registry validated: ${data.registryUrl}`,
            details: [{ service: 'Container Registry', status: 'success', message: data.message }]
          });
          setStep(3);
        } else {
          setValidationResult({
            success: false,
            message: data.message || 'Registry validation failed',
            details: [{ service: 'Container Registry', status: 'failed', message: data.message }]
          });
        }
      } else if (form.type === 'otel') {
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
            message: data.message || `Collector validated: ${data.endpoint}`,
            details: [{ service: 'OpenTelemetry Collector', status: 'success', message: data.message }]
          });
          setStep(3);
        } else {
          setValidationResult({
            success: false,
            message: data.message || 'Collector validation failed',
            details: [{ service: 'OpenTelemetry Collector', status: 'failed', message: data.message }]
          });
        }
      }
    } catch (error: any) {
      console.error('[ConnectionWizard] Validation error:', error);
      setValidationResult({ 
        success: false, 
        message: error.message || 'Validation failed',
        details: [{ service: 'Validation', status: 'failed', message: error.message || 'Unknown error' }]
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name) {
      toast.error('Connection name is required');
      return;
    }

    if (!validationResult?.success) {
      toast.error('Connection must be validated before creating');
      return;
    }

    setIsSubmitting(true);

    try {
      let config: Record<string, any> = {};
      
      if (form.type === 'github') {
        config = {
          repositoryOwner: form.repositoryOwner,
          repositoryName: form.repositoryName,
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
        status: 'connected',
        config,
        validated: true,
        validation_message: validationResult.message,
        last_validated_at: new Date().toISOString(),
      });

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'create_connection',
        resource_type: 'connection',
        details: { type: form.type, name: form.name }
      });

      toast.success(`${form.name} connection created successfully`);
      onOpenChange(false);
      onComplete?.();

      // Reset
      setStep(1);
      setForm({ type: 'github', name: '' });
      setValidationResult(null);
      setFieldErrors([]);
    } catch (error: any) {
      console.error('[ConnectionWizard] Error:', error);
      toast.error(error.message || 'Failed to create connection');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setForm({ type: 'github', name: '' });
      setValidationResult(null);
      setFieldErrors([]);
      setShowSecrets(false);
    }
  }, [open]);

  const getFieldError = (field: keyof ConnectionForm) => {
    return fieldErrors.find(e => e.field === field)?.message;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
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
            className="py-4 min-h-[380px]"
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
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', selectedType.bgColor)}>
                    <selectedType.icon className={cn('w-4 h-4', selectedType.color)} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedType.name} Configuration</h3>
                    <p className="text-sm text-muted-foreground">Enter your credentials</p>
                  </div>
                </div>

                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label>Connection Name <span className="text-sec-critical">*</span></Label>
                    <Input 
                      value={form.name}
                      onChange={(e) => updateForm({ name: e.target.value })}
                      onBlur={() => handleFieldBlur('name')}
                      placeholder="e.g., Production GitHub"
                      className={cn(getFieldError('name') && 'border-sec-critical')}
                    />
                    {getFieldError('name') && (
                      <p className="text-xs text-sec-critical">{getFieldError('name')}</p>
                    )}
                  </div>

                  {form.type === 'github' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Repository Owner <span className="text-sec-critical">*</span></Label>
                          <Input 
                            value={form.repositoryOwner || ''}
                            onChange={(e) => updateForm({ repositoryOwner: e.target.value })}
                            onBlur={() => handleFieldBlur('repositoryOwner')}
                            placeholder="organization or username"
                            className={cn(getFieldError('repositoryOwner') && 'border-sec-critical')}
                          />
                          {getFieldError('repositoryOwner') && (
                            <p className="text-xs text-sec-critical">{getFieldError('repositoryOwner')}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Repository Name <span className="text-sec-critical">*</span></Label>
                          <Input 
                            value={form.repositoryName || ''}
                            onChange={(e) => updateForm({ repositoryName: e.target.value })}
                            onBlur={() => handleFieldBlur('repositoryName')}
                            placeholder="my-app"
                            className={cn(getFieldError('repositoryName') && 'border-sec-critical')}
                          />
                          {getFieldError('repositoryName') && (
                            <p className="text-xs text-sec-critical">{getFieldError('repositoryName')}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Personal Access Token <span className="text-sec-critical">*</span></Label>
                        <div className="relative">
                          <Input 
                            type={showSecrets ? 'text' : 'password'}
                            value={form.accessToken || ''}
                            onChange={(e) => updateForm({ accessToken: e.target.value })}
                            onBlur={() => handleFieldBlur('accessToken')}
                            placeholder="ghp_..."
                            className={cn(getFieldError('accessToken') && 'border-sec-critical')}
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
                        {getFieldError('accessToken') && (
                          <p className="text-xs text-sec-critical">{getFieldError('accessToken')}</p>
                        )}
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
                          <Label>Tenant ID <span className="text-sec-critical">*</span></Label>
                          <Input 
                            value={form.tenantId || ''}
                            onChange={(e) => updateForm({ tenantId: e.target.value })}
                            onBlur={() => handleFieldBlur('tenantId')}
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            className={cn(getFieldError('tenantId') && 'border-sec-critical')}
                          />
                          {getFieldError('tenantId') && (
                            <p className="text-xs text-sec-critical">{getFieldError('tenantId')}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Subscription ID <span className="text-sec-critical">*</span></Label>
                          <Input 
                            value={form.subscriptionId || ''}
                            onChange={(e) => updateForm({ subscriptionId: e.target.value })}
                            onBlur={() => handleFieldBlur('subscriptionId')}
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            className={cn(getFieldError('subscriptionId') && 'border-sec-critical')}
                          />
                          {getFieldError('subscriptionId') && (
                            <p className="text-xs text-sec-critical">{getFieldError('subscriptionId')}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Client ID <span className="text-sec-critical">*</span></Label>
                          <Input 
                            value={form.clientId || ''}
                            onChange={(e) => updateForm({ clientId: e.target.value })}
                            onBlur={() => handleFieldBlur('clientId')}
                            placeholder="App registration client ID"
                            className={cn(getFieldError('clientId') && 'border-sec-critical')}
                          />
                          {getFieldError('clientId') && (
                            <p className="text-xs text-sec-critical">{getFieldError('clientId')}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Client Secret <span className="text-sec-critical">*</span></Label>
                          <Input 
                            type={showSecrets ? 'text' : 'password'}
                            value={form.clientSecret || ''}
                            onChange={(e) => updateForm({ clientSecret: e.target.value })}
                            onBlur={() => handleFieldBlur('clientSecret')}
                            placeholder="••••••••"
                            className={cn(getFieldError('clientSecret') && 'border-sec-critical')}
                          />
                          {getFieldError('clientSecret') && (
                            <p className="text-xs text-sec-critical">{getFieldError('clientSecret')}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>ACR Name</Label>
                          <Input 
                            value={form.acrName || ''}
                            onChange={(e) => updateForm({ acrName: e.target.value })}
                            placeholder="myregistry"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>AKS Cluster</Label>
                          <Input 
                            value={form.aksClusterName || ''}
                            onChange={(e) => updateForm({ aksClusterName: e.target.value })}
                            placeholder="my-cluster"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Key Vault</Label>
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
                        <Label>Vault URL <span className="text-sec-critical">*</span></Label>
                        <Input 
                          value={form.vaultUrl || ''}
                          onChange={(e) => updateForm({ vaultUrl: e.target.value })}
                          onBlur={() => handleFieldBlur('vaultUrl')}
                          placeholder="https://vault.example.com:8200"
                          className={cn(getFieldError('vaultUrl') && 'border-sec-critical')}
                        />
                        {getFieldError('vaultUrl') && (
                          <p className="text-xs text-sec-critical">{getFieldError('vaultUrl')}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Vault Token <span className="text-sec-critical">*</span></Label>
                        <Input 
                          type={showSecrets ? 'text' : 'password'}
                          value={form.vaultToken || ''}
                          onChange={(e) => updateForm({ vaultToken: e.target.value })}
                          onBlur={() => handleFieldBlur('vaultToken')}
                          placeholder="hvs...."
                          className={cn(getFieldError('vaultToken') && 'border-sec-critical')}
                        />
                        {getFieldError('vaultToken') && (
                          <p className="text-xs text-sec-critical">{getFieldError('vaultToken')}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Namespace</Label>
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
                        <Label>Registry Type <span className="text-sec-critical">*</span></Label>
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
                            <Label>Username <span className="text-sec-critical">*</span></Label>
                            <Input 
                              value={form.registryUsername || ''} 
                              onChange={(e) => updateForm({ registryUsername: e.target.value })}
                              onBlur={() => handleFieldBlur('registryUsername')}
                              className={cn(getFieldError('registryUsername') && 'border-sec-critical')}
                            />
                            {getFieldError('registryUsername') && (
                              <p className="text-xs text-sec-critical">{getFieldError('registryUsername')}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Access Token <span className="text-sec-critical">*</span></Label>
                            <Input 
                              type={showSecrets ? 'text' : 'password'} 
                              value={form.registryPassword || ''} 
                              onChange={(e) => updateForm({ registryPassword: e.target.value })}
                              onBlur={() => handleFieldBlur('registryPassword')}
                              className={cn(getFieldError('registryPassword') && 'border-sec-critical')}
                            />
                            {getFieldError('registryPassword') && (
                              <p className="text-xs text-sec-critical">{getFieldError('registryPassword')}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {form.registryType === 'ecr' && (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>AWS Region <span className="text-sec-critical">*</span></Label>
                            <Input 
                              value={form.awsRegion || ''} 
                              onChange={(e) => updateForm({ awsRegion: e.target.value })} 
                              placeholder="us-east-1"
                              onBlur={() => handleFieldBlur('awsRegion')}
                              className={cn(getFieldError('awsRegion') && 'border-sec-critical')}
                            />
                            {getFieldError('awsRegion') && (
                              <p className="text-xs text-sec-critical">{getFieldError('awsRegion')}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Access Key ID <span className="text-sec-critical">*</span></Label>
                            <Input 
                              value={form.awsAccessKeyId || ''} 
                              onChange={(e) => updateForm({ awsAccessKeyId: e.target.value })}
                              onBlur={() => handleFieldBlur('awsAccessKeyId')}
                              className={cn(getFieldError('awsAccessKeyId') && 'border-sec-critical')}
                            />
                            {getFieldError('awsAccessKeyId') && (
                              <p className="text-xs text-sec-critical">{getFieldError('awsAccessKeyId')}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Secret Key <span className="text-sec-critical">*</span></Label>
                            <Input 
                              type={showSecrets ? 'text' : 'password'} 
                              value={form.awsSecretAccessKey || ''} 
                              onChange={(e) => updateForm({ awsSecretAccessKey: e.target.value })}
                              onBlur={() => handleFieldBlur('awsSecretAccessKey')}
                              className={cn(getFieldError('awsSecretAccessKey') && 'border-sec-critical')}
                            />
                            {getFieldError('awsSecretAccessKey') && (
                              <p className="text-xs text-sec-critical">{getFieldError('awsSecretAccessKey')}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {form.registryType === 'acr' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Tenant ID <span className="text-sec-critical">*</span></Label>
                            <Input 
                              value={form.tenantId || ''} 
                              onChange={(e) => updateForm({ tenantId: e.target.value })}
                              onBlur={() => handleFieldBlur('tenantId')}
                              placeholder="Azure AD tenant ID"
                              className={cn(getFieldError('tenantId') && 'border-sec-critical')}
                            />
                            {getFieldError('tenantId') && (
                              <p className="text-xs text-sec-critical">{getFieldError('tenantId')}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Client ID <span className="text-sec-critical">*</span></Label>
                            <Input 
                              value={form.clientId || ''} 
                              onChange={(e) => updateForm({ clientId: e.target.value })}
                              onBlur={() => handleFieldBlur('clientId')}
                              className={cn(getFieldError('clientId') && 'border-sec-critical')}
                            />
                            {getFieldError('clientId') && (
                              <p className="text-xs text-sec-critical">{getFieldError('clientId')}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Client Secret <span className="text-sec-critical">*</span></Label>
                            <Input 
                              type={showSecrets ? 'text' : 'password'} 
                              value={form.clientSecret || ''} 
                              onChange={(e) => updateForm({ clientSecret: e.target.value })}
                              onBlur={() => handleFieldBlur('clientSecret')}
                              className={cn(getFieldError('clientSecret') && 'border-sec-critical')}
                            />
                            {getFieldError('clientSecret') && (
                              <p className="text-xs text-sec-critical">{getFieldError('clientSecret')}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>ACR Name</Label>
                            <Input 
                              value={form.acrName || ''} 
                              onChange={(e) => updateForm({ acrName: e.target.value })}
                              placeholder="myregistry.azurecr.io"
                            />
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
                          <Label>Endpoint URL <span className="text-sec-critical">*</span></Label>
                          <Input 
                            value={form.otelEndpoint || ''} 
                            onChange={(e) => updateForm({ otelEndpoint: e.target.value })} 
                            placeholder="https://otel-collector.example.com"
                            onBlur={() => handleFieldBlur('otelEndpoint')}
                            className={cn(getFieldError('otelEndpoint') && 'border-sec-critical')}
                          />
                          {getFieldError('otelEndpoint') && (
                            <p className="text-xs text-sec-critical">{getFieldError('otelEndpoint')}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Port</Label>
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

                {/* Validation result shown in step 2 if failed */}
                {validationResult && !validationResult.success && (
                  <Card className="border-sec-critical/50 bg-sec-critical/5">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sec-critical">
                        <XCircle className="w-5 h-5" />
                        <span className="font-medium">Validation Failed</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{validationResult.message}</p>
                      
                      {validationResult.details && validationResult.details.length > 0 && (
                        <div className="space-y-2">
                          {validationResult.details.map((detail, idx) => (
                            <div 
                              key={idx}
                              className={cn(
                                'p-2 rounded text-sm flex items-center gap-2',
                                detail.status === 'failed' ? 'bg-sec-critical/10 text-sec-critical' : 
                                detail.status === 'success' ? 'bg-sec-safe/10 text-sec-safe' :
                                'bg-muted text-muted-foreground'
                              )}
                            >
                              {detail.status === 'failed' ? <XCircle className="w-4 h-4 shrink-0" /> :
                               detail.status === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> :
                               <AlertTriangle className="w-4 h-4 shrink-0" />}
                              <span className="font-medium">{detail.service}:</span>
                              <span className="flex-1">{detail.message}</span>
                              {detail.latencyMs && <span className="text-xs">({detail.latencyMs}ms)</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleValidate}
                        disabled={isValidating}
                        className="w-full"
                      >
                        {isValidating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry Validation
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center py-2">
                  <CheckCircle2 className="w-12 h-12 text-sec-safe mx-auto mb-3" />
                  <h3 className="text-lg font-semibold">Connection Validated</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ready to create your connection
                  </p>
                </div>

                <Card className="border-sec-safe/50 bg-sec-safe/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={cn('p-3 rounded-lg', selectedType.bgColor)}>
                        <selectedType.icon className={cn('w-6 h-6', selectedType.color)} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{form.name}</h4>
                        <p className="text-sm text-muted-foreground">{selectedType.name} Connection</p>
                      </div>
                      <Badge variant="default" className="bg-sec-safe text-sec-safe-foreground">
                        Validated
                      </Badge>
                    </div>

                    {validationResult?.details && validationResult.details.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {validationResult.details.map((detail, idx) => (
                          <div 
                            key={idx}
                            className="p-2 rounded bg-background/50 text-sm flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0" />
                            <span className="font-medium">{detail.service}</span>
                            <span className="text-muted-foreground flex-1">{detail.message}</span>
                            {detail.latencyMs && <span className="text-xs text-muted-foreground">({detail.latencyMs}ms)</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <DialogFooter className="flex justify-between gap-2">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={step === 1 || isSubmitting || isValidating}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step === 1 && (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {step === 2 && (
            <Button 
              onClick={handleNext}
              disabled={isValidating || !isFormValid()}
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  Validate & Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}

          {step === 3 && (
            <Button 
              onClick={handleCreate} 
              disabled={isSubmitting}
              className="bg-sec-safe hover:bg-sec-safe/90"
            >
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
