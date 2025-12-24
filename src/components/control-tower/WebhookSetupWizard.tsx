import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Webhook,
  Copy,
  CheckCircle2,
  ExternalLink,
  Shield,
  Zap,
  GitBranch,
  AlertCircle,
  Key,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WebhookSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repositoryOwner?: string;
  repositoryName?: string;
  integrationId?: string;
}

const WebhookSetupWizard = ({ 
  open, 
  onOpenChange, 
  repositoryOwner, 
  repositoryName,
  integrationId 
}: WebhookSetupWizardProps) => {
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      setWebhookUrl(`${supabaseUrl}/functions/v1/github-webhook`);
    }
  }, []);

  const generateSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const secret = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    setWebhookSecret(secret);
    toast.success('Secure secret generated!');
  };

  const copyToClipboard = async (text: string, type: 'url' | 'secret') => {
    await navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
    toast.success(`${type === 'url' ? 'Webhook URL' : 'Secret'} copied!`);
  };

  const saveWebhookSecret = async () => {
    if (!integrationId || !webhookSecret) {
      toast.error('Please generate or enter a webhook secret');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('github_integrations')
        .update({ webhook_secret: webhookSecret })
        .eq('id', integrationId);

      if (error) throw error;

      toast.success('Webhook secret saved!');
      setStep(3);
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async () => {
    toast.info('To test the webhook, push a commit to your repository. The webhook will trigger automatically.');
  };

  const steps = [
    { number: 1, title: 'Configure Webhook URL', description: 'Copy the webhook URL to GitHub' },
    { number: 2, title: 'Set Secret', description: 'Generate and save a webhook secret' },
    { number: 3, title: 'Complete', description: 'Webhook is ready!' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            GitHub Webhook Setup
          </DialogTitle>
          <DialogDescription>
            Configure GitHub webhooks to automatically trigger pipelines on push events
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((s, idx) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  step >= s.number ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {step > s.number ? <CheckCircle2 className="w-4 h-4" /> : s.number}
                </div>
                <span className="text-xs mt-1 text-muted-foreground">{s.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2',
                  step > s.number ? 'bg-primary' : 'bg-muted'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Webhook URL */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-sec-warning" />
                  Webhook Payload URL
                </CardTitle>
                <CardDescription>
                  Add this URL to your GitHub repository webhook settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    value={webhookUrl} 
                    readOnly 
                    className="font-mono text-xs bg-muted" 
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(webhookUrl, 'url')}
                    className="shrink-0"
                  >
                    {copiedUrl ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
                  <p className="font-medium">Events to enable:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sec-safe" />
                      <span>Push</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sec-safe" />
                      <span>Workflow runs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sec-safe" />
                      <span>Workflow jobs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sec-safe" />
                      <span>Pull requests (optional)</span>
                    </div>
                  </div>
                </div>

                {repositoryOwner && repositoryName && (
                  <a
                    href={`https://github.com/${repositoryOwner}/${repositoryName}/settings/hooks/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    Open GitHub Webhook Settings <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => setStep(2)}>
                Next: Set Secret
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Webhook Secret */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sec-safe" />
                  Webhook Secret
                </CardTitle>
                <CardDescription>
                  A secret key to verify webhook signatures and prevent unauthorized triggers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        placeholder="Enter or generate a secure secret..."
                        className="pl-9 font-mono text-xs"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={generateSecret}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Generate
                    </Button>
                    {webhookSecret && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToClipboard(webhookSecret, 'secret')}
                      >
                        {copiedSecret ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-sec-warning/10 border border-sec-warning/30 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-sec-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sec-warning">Important</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Copy this secret and paste it in GitHub's webhook settings. 
                        The same secret must be used in both places for signature verification to work.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={saveWebhookSecret} disabled={saving || !webhookSecret}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save & Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-sec-safe/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-sec-safe" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Webhook Configured!</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Your GitHub webhook is now set up. Push events will automatically trigger pipeline executions based on your branch mappings.
              </p>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">What happens now?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <GitBranch className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Push to configured branches</p>
                    <p className="text-muted-foreground text-xs">
                      Pushes to branches matching your branch mappings will trigger executions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sec-safe/20 flex items-center justify-center shrink-0">
                    <Shield className="w-3.5 h-3.5 text-sec-safe" />
                  </div>
                  <div>
                    <p className="font-medium">Governance checks applied</p>
                    <p className="text-muted-foreground text-xs">
                      Environment locks and approval gates will be enforced automatically
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sec-warning/20 flex items-center justify-center shrink-0">
                    <Zap className="w-3.5 h-3.5 text-sec-warning" />
                  </div>
                  <div>
                    <p className="font-medium">Real-time monitoring</p>
                    <p className="text-muted-foreground text-xs">
                      Watch executions in the Execution Flow View with live status updates
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={testWebhook}>
                How to Test
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WebhookSetupWizard;
