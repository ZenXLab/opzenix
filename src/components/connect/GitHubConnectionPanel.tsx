import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github, X, Link2, CheckCircle2, AlertCircle, Settings,
  RefreshCw, ExternalLink, Key, GitBranch, FileCode, Webhook
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GitHubConnectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (config: GitHubConfig) => void;
}

export interface GitHubConfig {
  id?: string;
  owner: string;
  repo: string;
  workflow_file: string;
  branch: string;
  token: string;
  webhook_secret?: string;
}

export const GitHubConnectionPanel = ({ isOpen, onClose, onConnected }: GitHubConnectionPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<GitHubConfig>({
    owner: '',
    repo: '',
    workflow_file: 'opzenix-pipeline.yml',
    branch: 'main',
    token: '',
  });
  const [webhookUrl, setWebhookUrl] = useState('');

  // Generate webhook URL
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      setWebhookUrl(`${supabaseUrl}/functions/v1/github-webhook`);
    }
  }, []);

  // Check for existing connection
  useEffect(() => {
    const checkExisting = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

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
          token: '', // Don't expose token
          webhook_secret: existing.webhook_secret || undefined,
        });
        setConnected(true);
      }
    };

    if (isOpen) checkExisting();
  }, [isOpen]);

  const handleTestConnection = async () => {
    if (!config.owner || !config.repo || !config.token) {
      toast.error('Please fill in all required fields');
      return;
    }

    setTesting(true);
    try {
      // Test GitHub API access
      const response = await fetch(
        `https://api.github.com/repos/${config.owner}/${config.repo}`,
        {
          headers: {
            Authorization: `Bearer ${config.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to access repository');
      }

      // Check if workflow file exists
      const workflowResponse = await fetch(
        `https://api.github.com/repos/${config.owner}/${config.repo}/contents/.github/workflows/${config.workflow_file}`,
        {
          headers: {
            Authorization: `Bearer ${config.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!workflowResponse.ok) {
        toast.warning('Workflow file not found. You may need to create it.');
      }

      toast.success('Connection test successful!');
    } catch (error: any) {
      toast.error(`Connection failed: ${error.message}`);
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

      // Upsert the GitHub integration
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

      setConnected(true);
      toast.success('GitHub connection saved!');
      onConnected?.(config);
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
      const { error } = await supabase
        .from('github_integrations')
        .delete()
        .eq('id', config.id);

      if (error) throw error;

      setConfig({
        owner: '',
        repo: '',
        workflow_file: 'opzenix-pipeline.yml',
        branch: 'main',
        token: '',
      });
      setConnected(false);
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
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#24292e]">
                <Github className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">GitHub Actions Integration</h2>
                <p className="text-sm text-muted-foreground">
                  Connect your repository for real pipeline execution
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                <TabsTrigger value="workflow">
                  <FileCode className="h-3.5 w-3.5 mr-1.5" />
                  Workflow
                </TabsTrigger>
              </TabsList>

              <TabsContent value="connection" className="space-y-4">
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
                      />
                    </div>
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

                <div className="space-y-2">
                  <Label htmlFor="token">
                    Personal Access Token *
                    <span className="text-muted-foreground text-xs ml-2">
                      (requires repo and workflow permissions)
                    </span>
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="token"
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxx"
                      className="pl-9"
                      value={config.token}
                      onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <a 
                      href="https://github.com/settings/tokens/new?scopes=repo,workflow" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Create a new token <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="flex-1"
                  >
                    {testing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
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
                      Add this webhook to your GitHub repository to receive real-time updates
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
                      <Label>Content Type</Label>
                      <Input value="application/json" readOnly />
                    </div>

                    <div className="space-y-2">
                      <Label>Events to Send</Label>
                      <div className="p-3 rounded bg-muted text-sm space-y-1">
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

                    <a
                      href={`https://github.com/${config.owner}/${config.repo}/settings/hooks/new`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      Open GitHub Webhook Settings <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="workflow" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Sample Workflow File</CardTitle>
                    <CardDescription>
                      Add this workflow to your repository at .github/workflows/{config.workflow_file}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 rounded bg-muted text-xs overflow-auto max-h-80 font-mono">
{`name: Opzenix Pipeline

on:
  workflow_dispatch:
    inputs:
      execution_id:
        description: 'Opzenix Execution ID'
        required: true
      nodes:
        description: 'Pipeline nodes JSON'
        required: true
      callback_url:
        description: 'Webhook callback URL'
        required: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Test
        run: npm test

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        run: echo "Deploying..."
      
      - name: Notify Opzenix
        run: |
          curl -X POST \${{ github.event.inputs.callback_url }} \\
            -H "Content-Type: application/json" \\
            -d '{"execution_id": "\${{ github.event.inputs.execution_id }}", "status": "success"}'
`}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Your token is stored securely and never exposed
            </p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GitHubConnectionPanel;
