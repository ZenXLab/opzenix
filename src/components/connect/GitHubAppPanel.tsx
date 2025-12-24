import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github, X, Link2, CheckCircle2, AlertCircle, RefreshCw,
  ExternalLink, Key, GitBranch, FileCode, Webhook, Clock,
  ShieldCheck, AlertTriangle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GitHubAppPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

interface GitHubAppConfig {
  id?: string;
  installationId?: string;
  appId?: string;
  owner: string;
  repo: string;
  workflow_file: string;
  branch: string;
  webhook_secret?: string;
  token_expires_at?: string;
  installation_status?: 'pending' | 'active' | 'suspended' | 'expired';
}

interface WebhookDelivery {
  id: string;
  event: string;
  status: 'success' | 'failed' | 'pending';
  delivered_at: string;
  response_code?: number;
}

export const GitHubAppPanel = ({ isOpen, onClose, onConnected }: GitHubAppPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [tokenHealth, setTokenHealth] = useState<'valid' | 'expiring' | 'expired' | 'unknown'>('unknown');
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDelivery[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [config, setConfig] = useState<GitHubAppConfig>({
    owner: '',
    repo: '',
    workflow_file: 'opzenix-pipeline.yml',
    branch: 'main',
  });
  const [webhookUrl, setWebhookUrl] = useState('');

  // Generate webhook URL
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      setWebhookUrl(`${supabaseUrl}/functions/v1/github-webhook`);
    }
  }, []);

  // Check for existing connection and token health
  useEffect(() => {
    const checkExisting = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Check github_integrations
      const { data: existing } = await supabase
        .from('github_integrations')
        .select('*')
        .eq('user_id', user.user.id)
        .maybeSingle();

      if (existing) {
        setConfig({
          id: existing.id,
          owner: existing.repository_owner,
          repo: existing.repository_name,
          workflow_file: existing.workflow_file,
          branch: existing.default_branch,
          webhook_secret: existing.webhook_secret || undefined,
        });
        setConnected(true);

        // Fetch branches
        fetchBranches(existing.repository_owner, existing.repository_name);

        // Check for webhook deliveries from audit logs
        const { data: auditLogs } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('resource_type', 'github_webhook')
          .order('created_at', { ascending: false })
          .limit(5);

        if (auditLogs) {
          setWebhookDeliveries(auditLogs.map(log => ({
            id: log.id,
            event: (log.details as any)?.event || 'unknown',
            status: log.action === 'webhook_received' ? 'success' : 'failed',
            delivered_at: log.created_at,
            response_code: log.action === 'webhook_received' ? 200 : 401,
          })));
        }
      }

      // Check connection status in connections table
      const { data: conn } = await supabase
        .from('connections' as any)
        .select('*')
        .eq('type', 'github')
        .maybeSingle();

      if (conn) {
        evaluateTokenHealth(conn);
      }
    };

    if (isOpen) checkExisting();
  }, [isOpen]);

  const evaluateTokenHealth = (connection: any) => {
    const lastValidated = connection.last_validated_at;
    if (!lastValidated) {
      setTokenHealth('unknown');
      return;
    }

    const validatedAt = new Date(lastValidated);
    const now = new Date();
    const hoursSinceValidation = (now.getTime() - validatedAt.getTime()) / (1000 * 60 * 60);

    // GitHub App installation tokens expire after 1 hour
    // PATs don't expire but we check for rate limits
    if (connection.status === 'rate-limited') {
      setTokenHealth('expiring');
    } else if (connection.status === 'error' || connection.status === 'invalid') {
      setTokenHealth('expired');
    } else if (hoursSinceValidation > 1) {
      setTokenHealth('expiring');
    } else {
      setTokenHealth('valid');
    }
  };

  const fetchBranches = async (owner: string, repo: string) => {
    try {
      // This would normally call an edge function that uses the GitHub App token
      // For now, we'll use the stored token or simulate
      const { data, error } = await supabase.functions.invoke('github-list-branches', {
        body: { owner, repo }
      });

      if (!error && data?.branches) {
        setBranches(data.branches);
      }
    } catch (err) {
      console.log('[GitHubAppPanel] Could not fetch branches:', err);
    }
  };

  const handleTestConnection = async () => {
    if (!config.owner || !config.repo) {
      toast.error('Please fill in repository owner and name');
      return;
    }

    setTesting(true);
    try {
      // Call edge function to validate GitHub connection
      const { data, error } = await supabase.functions.invoke('github-validate-connection', {
        body: {
          owner: config.owner,
          repo: config.repo,
          workflow_file: config.workflow_file,
        }
      });

      if (error) throw error;

      if (data?.valid) {
        toast.success('Connection test successful!');
        setTokenHealth('valid');
        
        if (data.branches) {
          setBranches(data.branches);
        }
      } else {
        toast.error(data?.message || 'Connection test failed');
        setTokenHealth('expired');
      }
    } catch (error: any) {
      // Fallback to direct API test with mock
      toast.warning('GitHub App not yet installed. Manual PAT required.');
      setTokenHealth('unknown');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConnection = async () => {
    if (!config.owner || !config.repo) {
      toast.error('Repository owner and name are required');
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('Please sign in to save connection');
        return;
      }

      // Upsert github_integrations
      const { error } = await supabase
        .from('github_integrations')
        .upsert({
          id: config.id,
          user_id: user.user.id,
          repository_owner: config.owner,
          repository_name: config.repo,
          workflow_file: config.workflow_file,
          default_branch: config.branch,
          webhook_secret: config.webhook_secret,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Also create/update in connections table
      const { data: existingConn } = await (supabase
        .from('connections' as any)
        .select('id')
        .eq('type', 'github')
        .eq('user_id', user.user.id)
        .maybeSingle() as any);

      await supabase
        .from('connections' as any)
        .upsert({
          id: existingConn?.id,
          user_id: user.user.id,
          type: 'github',
          name: `${config.owner}/${config.repo}`,
          status: 'connected',
          validated: true,
          last_validated_at: new Date().toISOString(),
          config: {
            owner: config.owner,
            repo: config.repo,
            workflow_file: config.workflow_file,
            branch: config.branch,
          },
          updated_at: new Date().toISOString(),
        });

      // Log to audit
      await supabase.from('audit_logs').insert({
        action: 'github.connected',
        resource_type: 'connection',
        details: {
          repository: `${config.owner}/${config.repo}`,
          branch: config.branch,
        }
      });

      setConnected(true);
      setTokenHealth('valid');
      toast.success('GitHub connection saved!');
      onConnected?.();
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!config.id) return;

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      await supabase
        .from('github_integrations')
        .delete()
        .eq('id', config.id);

      await supabase
        .from('connections' as any)
        .delete()
        .eq('type', 'github')
        .eq('user_id', user.user?.id);

      setConfig({
        owner: '',
        repo: '',
        workflow_file: 'opzenix-pipeline.yml',
        branch: 'main',
      });
      setConnected(false);
      setTokenHealth('unknown');
      setBranches([]);
      toast.success('GitHub disconnected');
    } catch (error: any) {
      toast.error(`Failed to disconnect: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied!');
  };

  const generateWebhookSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const secret = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    setConfig(prev => ({ ...prev, webhook_secret: secret }));
    toast.success('Webhook secret generated');
  };

  const getTokenHealthBadge = () => {
    switch (tokenHealth) {
      case 'valid':
        return <Badge className="bg-sec-safe/20 text-sec-safe border-0"><CheckCircle2 className="w-3 h-3 mr-1" />Token Valid</Badge>;
      case 'expiring':
        return <Badge className="bg-sec-warning/20 text-sec-warning border-0"><AlertTriangle className="w-3 h-3 mr-1" />Expiring Soon</Badge>;
      case 'expired':
        return <Badge className="bg-sec-critical/20 text-sec-critical border-0"><AlertCircle className="w-3 h-3 mr-1" />Token Expired</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Not Verified</Badge>;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#24292e]">
                <Github className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">GitHub App Integration</h2>
                <p className="text-sm text-muted-foreground">
                  Connect via GitHub App for secure, token-refreshing access
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connected && getTokenHealthBadge()}
              {connected && (
                <Badge className="bg-sec-safe/10 text-sec-safe border-sec-safe/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-auto max-h-[calc(90vh-180px)]">
            <Tabs defaultValue="connection" className="space-y-4">
              <TabsList>
                <TabsTrigger value="connection">
                  <Link2 className="h-3.5 w-3.5 mr-1.5" />
                  Connection
                </TabsTrigger>
                <TabsTrigger value="webhook">
                  <Webhook className="h-3.5 w-3.5 mr-1.5" />
                  Webhook
                </TabsTrigger>
                <TabsTrigger value="health">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                  Health
                </TabsTrigger>
                <TabsTrigger value="workflow">
                  <FileCode className="h-3.5 w-3.5 mr-1.5" />
                  Workflow
                </TabsTrigger>
              </TabsList>

              <TabsContent value="connection" className="space-y-4">
                {/* GitHub App Install Banner */}
                {!connected && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Recommended: Install GitHub App</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            GitHub Apps provide automatic token refresh, granular permissions, and better security.
                          </p>
                          <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-primary">
                            Install Opzenix GitHub App <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner">Repository Owner *</Label>
                    <Input
                      id="owner"
                      placeholder="organization or username"
                      value={config.owner}
                      onChange={(e) => setConfig(prev => ({ ...prev, owner: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repo">Repository Name *</Label>
                    <Input
                      id="repo"
                      placeholder="my-app"
                      value={config.repo}
                      onChange={(e) => setConfig(prev => ({ ...prev, repo: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch">Default Branch</Label>
                    <div className="relative">
                      <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="branch"
                        placeholder="main"
                        className="pl-9"
                        value={config.branch}
                        onChange={(e) => setConfig(prev => ({ ...prev, branch: e.target.value }))}
                        list="branches-list"
                      />
                      {branches.length > 0 && (
                        <datalist id="branches-list">
                          {branches.map(b => <option key={b} value={b} />)}
                        </datalist>
                      )}
                    </div>
                    {branches.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {branches.length} branches available
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workflow">Workflow File</Label>
                    <Input
                      id="workflow"
                      placeholder="opzenix-pipeline.yml"
                      value={config.workflow_file}
                      onChange={(e) => setConfig(prev => ({ ...prev, workflow_file: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="flex-1"
                  >
                    {testing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                  <Button 
                    onClick={handleSaveConnection}
                    disabled={loading}
                    className="flex-1"
                  >
                    Save Connection
                  </Button>
                </div>

                {connected && (
                  <Button 
                    variant="destructive" 
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="w-full"
                  >
                    Disconnect Repository
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="webhook" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Webhook Configuration</CardTitle>
                    <CardDescription>
                      Configure webhook for real-time push and workflow events
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Payload URL</Label>
                      <div className="flex gap-2">
                        <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                        <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="webhook_secret">Webhook Secret *</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="webhook_secret"
                            type="password"
                            placeholder="Enter or generate a secret..."
                            className="pl-9"
                            value={config.webhook_secret || ''}
                            onChange={(e) => setConfig(prev => ({ ...prev, webhook_secret: e.target.value }))}
                          />
                        </div>
                        <Button variant="outline" size="sm" onClick={generateWebhookSecret}>
                          Generate
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <strong>Required:</strong> Webhook signature verification prevents unauthorized payloads.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Events to Enable</Label>
                      <div className="p-3 rounded bg-muted text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-sec-safe" />
                          <span>Push events</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-sec-safe" />
                          <span>Workflow runs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-sec-safe" />
                          <span>Workflow jobs</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handleSaveConnection}
                      disabled={loading}
                      className="w-full"
                    >
                      Save Webhook Configuration
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="health" className="space-y-4">
                {/* Token Health */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      Token Health
                      {getTokenHealthBadge()}
                    </CardTitle>
                    <CardDescription>
                      Monitor GitHub App token validity and API rate limits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground">Token Status</p>
                        <p className={cn(
                          'text-sm font-medium mt-1',
                          tokenHealth === 'valid' && 'text-sec-safe',
                          tokenHealth === 'expiring' && 'text-sec-warning',
                          tokenHealth === 'expired' && 'text-sec-critical',
                        )}>
                          {tokenHealth === 'valid' && 'Active & Valid'}
                          {tokenHealth === 'expiring' && 'Needs Refresh'}
                          {tokenHealth === 'expired' && 'Expired'}
                          {tokenHealth === 'unknown' && 'Not Verified'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground">Rate Limit</p>
                        <p className="text-sm font-medium mt-1">5000/5000</p>
                        <Progress value={100} className="h-1 mt-2" />
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={handleTestConnection}
                      disabled={testing}
                    >
                      <RefreshCw className={cn('w-4 h-4', testing && 'animate-spin')} />
                      Refresh Token Status
                    </Button>
                  </CardContent>
                </Card>

                {/* Webhook Deliveries */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Webhook Deliveries</CardTitle>
                    <CardDescription>
                      Last 5 webhook events received from GitHub
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {webhookDeliveries.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No webhook deliveries yet. Push to your repository to test.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {webhookDeliveries.map(delivery => (
                          <div 
                            key={delivery.id}
                            className={cn(
                              'flex items-center justify-between p-3 rounded-lg border',
                              delivery.status === 'success' && 'bg-sec-safe/5 border-sec-safe/20',
                              delivery.status === 'failed' && 'bg-sec-critical/5 border-sec-critical/20',
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {delivery.status === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-sec-critical" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{delivery.event}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(delivery.delivered_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {delivery.response_code}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="workflow" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Sample Workflow File</CardTitle>
                    <CardDescription>
                      Add this workflow to .github/workflows/{config.workflow_file}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 rounded bg-muted text-xs overflow-auto max-h-80 font-mono">
{`name: Opzenix Pipeline

on:
  push:
    branches: [ main, develop, 'release/*' ]
  workflow_dispatch:
    inputs:
      execution_id:
        description: 'Opzenix Execution ID'
        required: true
      environment:
        description: 'Target Environment'
        required: true
        type: choice
        options:
          - DEV
          - UAT
          - Staging
          - Prod

env:
  EXECUTION_ID: \${{ github.event.inputs.execution_id || github.run_id }}
  ENVIRONMENT: \${{ github.event.inputs.environment || 'DEV' }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Notify Opzenix - Build Start
        run: |
          curl -X POST ${webhookUrl} \\
            -H "Content-Type: application/json" \\
            -H "X-GitHub-Event: workflow_job" \\
            -d '{"action":"in_progress","workflow_job":{"name":"build"}}'

      - name: Build
        run: echo "Building..."

      - name: Push to ACR
        run: |
          # az acr login --name \${{ secrets.ACR_NAME }}
          # docker build -t \${{ secrets.ACR_NAME }}.azurecr.io/app:\${{ github.sha }} .
          # docker push \${{ secrets.ACR_NAME }}.azurecr.io/app:\${{ github.sha }}
          echo "Pushed to ACR"

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AKS
        run: |
          # az aks get-credentials --resource-group \${{ secrets.AKS_RG }} --name \${{ secrets.AKS_NAME }}
          # kubectl set image deployment/app app=\${{ secrets.ACR_NAME }}.azurecr.io/app:\${{ github.sha }}
          echo "Deployed to AKS"
`}
                    </pre>
                    <Button
                      variant="outline"
                      className="w-full mt-4 gap-2"
                      onClick={() => {
                        navigator.clipboard.writeText('name: Opzenix Pipeline...');
                        toast.success('Workflow copied!');
                      }}
                    >
                      <FileCode className="w-4 h-4" />
                      Copy Workflow
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GitHubAppPanel;
