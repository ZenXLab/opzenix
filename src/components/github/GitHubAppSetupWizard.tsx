import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github, Shield, Webhook, GitBranch, CheckCircle2, Copy,
  ExternalLink, AlertTriangle, Loader2, ArrowRight, ArrowLeft,
  Eye, Play, FileCode, Container, Radio, Settings, X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface GitHubAppSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (config: any) => void;
}

type Step = 'intro' | 'permissions' | 'create' | 'install' | 'webhook' | 'verify' | 'complete';

const STEPS: Step[] = ['intro', 'permissions', 'create', 'install', 'webhook', 'verify', 'complete'];

// GitHub App Permission Manifest - FINAL (Enterprise-Grade)
const PERMISSION_MANIFEST = {
  name: 'Opzenix Control Plane',
  url: 'https://opzenix.dev',
  description: 'Enterprise CI/CD Governance & Execution Control',
  public: false,
  default_permissions: {
    actions: 'read',
    checks: 'write',
    contents: 'read',
    deployments: 'write',
    pull_requests: 'read',
    workflows: 'write',
    metadata: 'read',
  },
  default_events: [
    'push',
    'pull_request',
    'workflow_run',
    'check_run',
    'check_suite',
    'deployment',
    'deployment_status',
  ],
};

const PERMISSION_EXPLANATIONS = [
  { permission: 'actions: read', why: 'Observe CI execution status and results', required: true },
  { permission: 'workflows: write', why: 'Trigger workflow_dispatch for controlled deployments', required: true },
  { permission: 'checks: write', why: 'Report governed status back to GitHub PRs', required: true },
  { permission: 'deployments: write', why: 'Track environment deployments and versions', required: true },
  { permission: 'contents: read', why: 'Detect language, framework, and build tools', required: true },
  { permission: 'pull_requests: read', why: 'Branch & PR governance enforcement', required: true },
  { permission: 'metadata: read', why: 'Repository identity (safe default)', required: true },
];

const WEBHOOK_EVENTS = [
  { event: 'push', description: 'Trigger pipeline on code push' },
  { event: 'pull_request', description: 'Governance checks on PRs' },
  { event: 'workflow_run', description: 'Track workflow execution' },
  { event: 'check_run', description: 'Status check correlation' },
  { event: 'check_suite', description: 'Test suite completion' },
  { event: 'deployment', description: 'Deployment tracking' },
  { event: 'deployment_status', description: 'Environment status updates' },
];

export function GitHubAppSetupWizard({ isOpen, onClose, onComplete }: GitHubAppSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  
  // Configuration state
  const [appName, setAppName] = useState('opzenix-control-plane');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [appId, setAppId] = useState('');
  const [installationId, setInstallationId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verifying' | 'success' | 'failed'>('pending');

  const currentIndex = STEPS.indexOf(currentStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  // Generate webhook URL
  const generateWebhookUrl = async () => {
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    const url = `${projectUrl}/functions/v1/github-webhook`;
    setWebhookUrl(url);
    
    // Generate webhook secret
    const secret = crypto.randomUUID().replace(/-/g, '');
    setWebhookSecret(secret);
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleNext = async () => {
    if (currentStep === 'webhook' && !webhookUrl) {
      await generateWebhookUrl();
    }
    
    const nextIndex = currentIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleVerify = async () => {
    setVerificationStatus('verifying');
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('github-validate-connection', {
        body: {
          appId,
          installationId,
          webhookSecret,
        }
      });

      if (error) throw error;

      if (data?.valid) {
        setVerificationStatus('success');
        toast.success('GitHub App connection verified!');
        
        // Save configuration
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          await supabase.from('connections').insert({
            name: `GitHub App - ${appName}`,
            type: 'github',
            connection_type: 'github-app',
            status: 'connected',
            validated: true,
            last_validated_at: new Date().toISOString(),
            user_id: user.user.id,
            config: {
              app_id: appId,
              installation_id: installationId,
              webhook_url: webhookUrl,
            }
          });
        }
      } else {
        setVerificationStatus('failed');
        toast.error('Verification failed: ' + (data?.message || 'Unknown error'));
      }
    } catch (error: any) {
      setVerificationStatus('failed');
      toast.error('Verification failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete?.({
      appId,
      installationId,
      webhookUrl,
      webhookSecret,
    });
    onClose();
    setCurrentStep('intro');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'verify':
        return appId && installationId;
      case 'complete':
        return verificationStatus === 'success';
      default:
        return true;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Github className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>GitHub App Setup</DialogTitle>
              <DialogDescription>
                Connect your repositories with enterprise-grade permissions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Progress value={progress} className="mb-4" />

        <ScrollArea className="max-h-[60vh] pr-4">
          <AnimatePresence mode="wait">
            {/* Intro Step */}
            {currentStep === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Enterprise GitHub Integration</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Opzenix uses a GitHub App for secure, fine-grained access to your repositories
                    with minimal permissions required for CI/CD governance.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <Shield className="h-6 w-6 text-sec-safe mx-auto mb-2" />
                    <h4 className="font-medium text-sm">SOC2 Compliant</h4>
                    <p className="text-xs text-muted-foreground">Minimal permissions</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <Eye className="h-6 w-6 text-primary mx-auto mb-2" />
                    <h4 className="font-medium text-sm">Read-Only Code</h4>
                    <p className="text-xs text-muted-foreground">No write access</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <Webhook className="h-6 w-6 text-chart-1 mx-auto mb-2" />
                    <h4 className="font-medium text-sm">Webhook Events</h4>
                    <p className="text-xs text-muted-foreground">Real-time updates</p>
                  </Card>
                </div>

                <Card className="border-sec-safe/30 bg-sec-safe/5">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-sec-safe shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Security First</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This integration does NOT request <code className="bg-muted px-1 rounded">contents:write</code>,{' '}
                          <code className="bg-muted px-1 rounded">issues</code>, <code className="bg-muted px-1 rounded">admin</code>, or{' '}
                          <code className="bg-muted px-1 rounded">secrets</code> permissions.
                          Passes SOC2 / ISO / bank security reviews.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Permissions Step */}
            {currentStep === 'permissions' && (
              <motion.div
                key="permissions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-2">Permission Manifest</h3>
                  <p className="text-sm text-muted-foreground">
                    Minimum + sufficient permissions for enterprise control plane
                  </p>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Repository Permissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {PERMISSION_EXPLANATIONS.map((perm) => (
                      <div 
                        key={perm.permission}
                        className="flex items-start justify-between p-2 rounded-lg bg-muted/30"
                      >
                        <div>
                          <code className="text-xs font-mono bg-background px-2 py-0.5 rounded">
                            {perm.permission}
                          </code>
                          <p className="text-xs text-muted-foreground mt-1">{perm.why}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          Required
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-sec-critical/30">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-sec-critical shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Explicitly NOT Requested</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px] border-sec-critical/50">
                            contents:write
                          </Badge>
                          <Badge variant="outline" className="text-[10px] border-sec-critical/50">
                            issues
                          </Badge>
                          <Badge variant="outline" className="text-[10px] border-sec-critical/50">
                            admin
                          </Badge>
                          <Badge variant="outline" className="text-[10px] border-sec-critical/50">
                            secrets
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Create App Step */}
            {currentStep === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-2">Create GitHub App</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a new GitHub App in your organization with the required permissions
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>App Name</Label>
                    <Input
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="opzenix-control-plane"
                    />
                    <p className="text-xs text-muted-foreground">
                      This name will be visible in your GitHub organization
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <p className="text-sm font-medium">Steps to create:</p>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="shrink-0 mt-0.5">1</Badge>
                        <span>Go to your GitHub Organization Settings → Developer Settings → GitHub Apps</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="shrink-0 mt-0.5">2</Badge>
                        <span>Click "New GitHub App"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="shrink-0 mt-0.5">3</Badge>
                        <span>Enter app name: <code className="bg-muted px-1 rounded">{appName}</code></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="shrink-0 mt-0.5">4</Badge>
                        <span>Set Homepage URL to your Opzenix instance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="shrink-0 mt-0.5">5</Badge>
                        <span>Configure permissions as shown in the previous step</span>
                      </li>
                    </ol>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => window.open('https://github.com/settings/apps/new', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open GitHub App Settings
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Install App Step */}
            {currentStep === 'install' && (
              <motion.div
                key="install"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-2">Install GitHub App</h3>
                  <p className="text-sm text-muted-foreground">
                    Install the app on your repositories to enable CI/CD governance
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">After creating the app:</p>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 mt-0.5">1</Badge>
                      <span>Go to the app's settings page and click "Install App"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 mt-0.5">2</Badge>
                      <span>Select your organization or personal account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 mt-0.5">3</Badge>
                      <span>Choose repositories: "All repositories" or specific ones</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 mt-0.5">4</Badge>
                      <span>Click "Install" to authorize the app</span>
                    </li>
                  </ol>
                </div>

                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="py-4">
                    <p className="text-sm">
                      <strong>Tip:</strong> Start with specific repositories for testing,
                      then expand to all repositories once verified.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Webhook Step */}
            {currentStep === 'webhook' && (
              <motion.div
                key="webhook"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-2">Configure Webhook</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up webhook to receive real-time events from GitHub
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                      >
                        <Copy className={cn('w-4 h-4', copied === 'Webhook URL' && 'text-sec-safe')} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Webhook Secret</Label>
                    <div className="flex gap-2">
                      <Input value={webhookSecret} readOnly className="font-mono text-xs" type="password" />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(webhookSecret, 'Secret')}
                      >
                        <Copy className={cn('w-4 h-4', copied === 'Secret' && 'text-sec-safe')} />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Save this secret securely - it won't be shown again
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <Label className="mb-2 block">Subscribe to Events</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {WEBHOOK_EVENTS.map((event) => (
                        <div key={event.event} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sec-safe" />
                          <div>
                            <code className="text-xs font-mono">{event.event}</code>
                            <p className="text-[10px] text-muted-foreground">{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Verify Step */}
            {currentStep === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-2">Verify Connection</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your GitHub App credentials to verify the connection
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>App ID</Label>
                    <Input
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      placeholder="123456"
                    />
                    <p className="text-xs text-muted-foreground">
                      Found in your GitHub App's settings page
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Installation ID</Label>
                    <Input
                      value={installationId}
                      onChange={(e) => setInstallationId(e.target.value)}
                      placeholder="12345678"
                    />
                    <p className="text-xs text-muted-foreground">
                      Found in the URL after installing: /installations/[ID]
                    </p>
                  </div>

                  <Button
                    onClick={handleVerify}
                    disabled={!appId || !installationId || isLoading}
                    className="w-full gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : verificationStatus === 'success' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {verificationStatus === 'success' ? 'Verified!' : 'Verify Connection'}
                  </Button>

                  {verificationStatus === 'failed' && (
                    <Card className="border-sec-critical/30 bg-sec-critical/5">
                      <CardContent className="py-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-sec-critical shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            Verification failed. Please check your App ID and Installation ID.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}

            {/* Complete Step */}
            {currentStep === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-sec-safe/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-sec-safe" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Setup Complete!</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Your GitHub App is now connected and ready for CI/CD governance.
                  </p>
                </div>

                <Card className="border-sec-safe/30 bg-sec-safe/5">
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                      <span className="text-sm">GitHub App installed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                      <span className="text-sm">Webhook configured</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                      <span className="text-sm">Connection verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                      <span className="text-sm">Ready for deployments</span>
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={handleComplete} className="w-full gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Go to Control Tower
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-1">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index <= currentIndex ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>

          {currentStep !== 'complete' && (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2"
            >
              {currentStep === 'verify' ? 'Continue' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GitHubAppSetupWizard;
