import { useState, useEffect } from 'react';
import { 
  History, GitCommit, GitBranch, Clock, 
  CheckCircle2, XCircle, Loader2, ExternalLink,
  Tag, User, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface DeploymentVersion {
  id: string;
  version_tag: string;
  branch: string;
  commit_sha: string;
  commit_message: string | null;
  commit_author: string | null;
  commit_timestamp: string | null;
  environment: string;
  is_current: boolean;
  created_at: string;
  project?: {
    name: string;
    github_repo_owner: string | null;
    github_repo_name: string | null;
  };
  deployment?: {
    status: string;
    deployed_at: string;
  };
}

interface Deployment {
  id: string;
  version: string;
  environment: string;
  status: string;
  deployed_at: string;
  notes: string | null;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function DeploymentHistoryTab() {
  const [versions, setVersions] = useState<DeploymentVersion[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnv, setSelectedEnv] = useState<string>('all');

  useEffect(() => {
    fetchDeploymentHistory();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('deployment-history')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deployment_versions' }, fetchDeploymentHistory)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deployments' }, fetchDeploymentHistory)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchDeploymentHistory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch versions
      const { data: versionData, error: versionError } = await supabase
        .from('deployment_versions')
        .select(`
          *,
          project:projects(name, github_repo_owner, github_repo_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (versionError) throw versionError;
      setVersions(versionData || []);

      // Fetch deployments
      const { data: deploymentData, error: deploymentError } = await supabase
        .from('deployments')
        .select('*')
        .order('deployed_at', { ascending: false })
        .limit(50);

      if (deploymentError) throw deploymentError;
      setDeployments(deploymentData || []);
    } catch (error) {
      console.error('Error fetching deployment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVersions = selectedEnv === 'all' 
    ? versions 
    : versions.filter(v => v.environment === selectedEnv);

  const filteredDeployments = selectedEnv === 'all'
    ? deployments
    : deployments.filter(d => d.environment === selectedEnv);

  const environments = [...new Set(versions.map(v => v.environment))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <span className="font-medium">Deployment History</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedEnv} onValueChange={setSelectedEnv}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Environments</SelectItem>
              {environments.map((env) => (
                <SelectItem key={env} value={env} className="capitalize">{env}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchDeploymentHistory}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Version History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Version History
          </CardTitle>
          <CardDescription>Track versions by commit SHA</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredVersions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitCommit className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No versions recorded yet</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-3">
                {filteredVersions.map((version) => (
                  <div
                    key={version.id}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      version.is_current 
                        ? 'bg-primary/5 border-primary/20' 
                        : 'bg-muted/30 border-border hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                          version.is_current ? 'bg-primary/10' : 'bg-muted'
                        )}>
                          <Tag className={cn(
                            'w-4 h-4',
                            version.is_current ? 'text-primary' : 'text-muted-foreground'
                          )} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-medium text-sm">
                              {version.version_tag}
                            </span>
                            {version.is_current && (
                              <Badge variant="default" className="text-[10px]">Current</Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {version.environment}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <GitBranch className="w-3 h-3" />
                            <span>{version.branch}</span>
                            <span className="text-border">•</span>
                            <GitCommit className="w-3 h-3" />
                            <code className="bg-muted px-1 rounded">
                              {version.commit_sha.substring(0, 7)}
                            </code>
                          </div>
                          
                          {version.commit_message && (
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[400px]">
                              {version.commit_message}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(new Date(version.created_at))}
                        </p>
                        {version.commit_author && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <User className="w-3 h-3" />
                            {version.commit_author}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Recent Deployments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Recent Deployments
          </CardTitle>
          <CardDescription>Deployment execution history</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDeployments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No deployments yet</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {filteredDeployments.map((deployment) => (
                  <div
                    key={deployment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {deployment.status === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-sec-safe" />
                      ) : deployment.status === 'failed' ? (
                        <XCircle className="w-5 h-5 text-sec-critical" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{deployment.version}</span>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {deployment.environment}
                          </Badge>
                        </div>
                        {deployment.notes && (
                          <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {deployment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          deployment.status === 'success' ? 'default' :
                          deployment.status === 'failed' ? 'destructive' :
                          'secondary'
                        }
                        className="text-[10px] capitalize"
                      >
                        {deployment.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(new Date(deployment.deployed_at))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
