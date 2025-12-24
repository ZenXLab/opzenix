import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch, Plus, Trash2, Check, X, RefreshCw, Settings,
  ArrowRight, Lock, Unlock, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BranchMapping {
  id: string;
  github_integration_id: string;
  branch_pattern: string;
  environment: string;
  is_deployable: boolean;
  created_at: string;
}

interface GitHubIntegration {
  id: string;
  repository_owner: string;
  repository_name: string;
}

const ENVIRONMENTS = ['DEV', 'UAT', 'Staging', 'PreProd', 'Prod'];

const DEFAULT_MAPPINGS = [
  { pattern: 'feature/*', environment: 'DEV', description: 'Feature branches deploy to DEV' },
  { pattern: 'develop', environment: 'DEV', description: 'Develop branch deploys to DEV' },
  { pattern: 'develop', environment: 'UAT', description: 'Develop branch can deploy to UAT' },
  { pattern: 'release/*', environment: 'UAT', description: 'Release branches deploy to UAT' },
  { pattern: 'release/*', environment: 'Staging', description: 'Release branches can deploy to Staging' },
  { pattern: 'main', environment: 'PreProd', description: 'Main branch deploys to PreProd' },
  { pattern: 'main', environment: 'Prod', description: 'Main branch deploys to Prod' },
];

export const BranchManagementPanel = () => {
  const [integrations, setIntegrations] = useState<GitHubIntegration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [mappings, setMappings] = useState<BranchMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMapping, setNewMapping] = useState({
    branch_pattern: '',
    environment: 'DEV',
    is_deployable: true,
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  useEffect(() => {
    if (selectedIntegration) {
      fetchMappings(selectedIntegration);
    }
  }, [selectedIntegration]);

  const fetchIntegrations = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data, error } = await supabase
      .from('github_integrations')
      .select('id, repository_owner, repository_name')
      .eq('user_id', user.user.id);

    if (!error && data) {
      setIntegrations(data);
      if (data.length > 0 && !selectedIntegration) {
        setSelectedIntegration(data[0].id);
      }
    }
    setLoading(false);
  };

  const fetchMappings = async (integrationId: string) => {
    const { data, error } = await supabase
      .from('branch_mappings')
      .select('*')
      .eq('github_integration_id', integrationId)
      .order('environment', { ascending: true });

    if (!error && data) {
      setMappings(data);
    }
  };

  const handleAddMapping = async () => {
    if (!selectedIntegration || !newMapping.branch_pattern) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { error } = await supabase
      .from('branch_mappings')
      .insert({
        github_integration_id: selectedIntegration,
        branch_pattern: newMapping.branch_pattern,
        environment: newMapping.environment,
        is_deployable: newMapping.is_deployable,
      });

    if (error) {
      toast.error('Failed to add mapping: ' + error.message);
    } else {
      toast.success('Branch mapping added');
      setShowAddDialog(false);
      setNewMapping({ branch_pattern: '', environment: 'DEV', is_deployable: true });
      fetchMappings(selectedIntegration);
    }
  };

  const handleDeleteMapping = async (id: string) => {
    const { error } = await supabase
      .from('branch_mappings')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete mapping');
    } else {
      toast.success('Mapping deleted');
      if (selectedIntegration) fetchMappings(selectedIntegration);
    }
  };

  const handleToggleDeployable = async (mapping: BranchMapping) => {
    const { error } = await supabase
      .from('branch_mappings')
      .update({ is_deployable: !mapping.is_deployable })
      .eq('id', mapping.id);

    if (error) {
      toast.error('Failed to update mapping');
    } else {
      if (selectedIntegration) fetchMappings(selectedIntegration);
    }
  };

  const applyDefaultMappings = async () => {
    if (!selectedIntegration) return;

    for (const defaultMap of DEFAULT_MAPPINGS) {
      await supabase
        .from('branch_mappings')
        .upsert({
          github_integration_id: selectedIntegration,
          branch_pattern: defaultMap.pattern,
          environment: defaultMap.environment,
          is_deployable: true,
        }, {
          onConflict: 'github_integration_id,branch_pattern,environment'
        });
    }

    toast.success('Default mappings applied');
    fetchMappings(selectedIntegration);
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'DEV': return 'bg-sec-safe/20 text-sec-safe border-sec-safe/30';
      case 'UAT': return 'bg-chart-1/20 text-chart-1 border-chart-1/30';
      case 'Staging': return 'bg-sec-warning/20 text-sec-warning border-sec-warning/30';
      case 'PreProd': return 'bg-chart-4/20 text-chart-4 border-chart-4/30';
      case 'Prod': return 'bg-sec-critical/20 text-sec-critical border-sec-critical/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const groupedMappings = ENVIRONMENTS.map(env => ({
    environment: env,
    mappings: mappings.filter(m => m.environment === env),
  }));

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <GitBranch className="w-6 h-6" />
              Branch Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure which branches can deploy to which environments
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedIntegration && (
              <>
                <Button variant="outline" onClick={applyDefaultMappings}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Apply Defaults
                </Button>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Mapping
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Repository Selector */}
        {integrations.length > 0 ? (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Label>Repository:</Label>
                <Select
                  value={selectedIntegration || ''}
                  onValueChange={setSelectedIntegration}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {integrations.map((int) => (
                      <SelectItem key={int.id} value={int.id}>
                        {int.repository_owner}/{int.repository_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No GitHub Repositories Connected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect a GitHub repository first to manage branch mappings.
              </p>
              <Button variant="outline">
                Connect GitHub Repository
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Branch → Environment Governance</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Only branches matching configured patterns can trigger deployments. 
                  Unmatched branches will be blocked with a clear reason shown in Control Tower.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mappings by Environment */}
        {selectedIntegration && (
          <div className="space-y-4">
            {groupedMappings.map(({ environment, mappings: envMappings }) => (
              <Card key={environment}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={cn('border', getEnvironmentColor(environment))}>
                        {environment}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {envMappings.length} mapping{envMappings.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {environment === 'DEV' ? (
                      <Badge variant="outline" className="gap-1">
                        <Unlock className="w-3 h-3" /> Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-sec-warning">
                        <Lock className="w-3 h-3" /> Locked
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {envMappings.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No branches configured for this environment
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {envMappings.map((mapping) => (
                        <motion.div
                          key={mapping.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <GitBranch className="w-4 h-4 text-muted-foreground" />
                            <code className="text-sm font-mono bg-background px-2 py-0.5 rounded">
                              {mapping.branch_pattern}
                            </code>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <Badge className={cn('border', getEnvironmentColor(mapping.environment))}>
                              {mapping.environment}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={mapping.is_deployable}
                                onCheckedChange={() => handleToggleDeployable(mapping)}
                              />
                              <span className="text-xs text-muted-foreground">
                                {mapping.is_deployable ? 'Deployable' : 'Blocked'}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-sec-critical"
                              onClick={() => handleDeleteMapping(mapping.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Mapping Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Branch Mapping</DialogTitle>
              <DialogDescription>
                Define which branch pattern can deploy to which environment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Branch Pattern</Label>
                <Input
                  placeholder="e.g., feature/*, develop, release/*"
                  value={newMapping.branch_pattern}
                  onChange={(e) => setNewMapping(prev => ({ ...prev, branch_pattern: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Use * for wildcards. Examples: feature/*, hotfix/*, release/*
                </p>
              </div>
              <div className="space-y-2">
                <Label>Target Environment</Label>
                <Select
                  value={newMapping.environment}
                  onValueChange={(v) => setNewMapping(prev => ({ ...prev, environment: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENVIRONMENTS.map((env) => (
                      <SelectItem key={env} value={env}>
                        {env}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Deployments</Label>
                  <p className="text-xs text-muted-foreground">
                    When disabled, matching branches will be blocked
                  </p>
                </div>
                <Switch
                  checked={newMapping.is_deployable}
                  onCheckedChange={(v) => setNewMapping(prev => ({ ...prev, is_deployable: v }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMapping}>
                Add Mapping
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
};

export default BranchManagementPanel;
