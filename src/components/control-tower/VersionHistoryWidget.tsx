import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GitCommit, GitBranch, Tag, Clock, 
  CheckCircle2, XCircle, Loader2, ArrowRight,
  History, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
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
}

interface VersionHistoryWidgetProps {
  onViewAll?: () => void;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function VersionHistoryWidget({ onViewAll }: VersionHistoryWidgetProps) {
  const [versions, setVersions] = useState<DeploymentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchVersions();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('version-history-widget')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deployment_versions' }, fetchVersions)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deployment_versions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentVersion = versions.find(v => v.is_current);
  const recentVersions = versions.slice(0, expanded ? 10 : 5);

  // Group versions by environment
  const versionsByEnv = versions.reduce((acc, version) => {
    if (!acc[version.environment]) {
      acc[version.environment] = [];
    }
    acc[version.environment].push(version);
    return acc;
  }, {} as Record<string, DeploymentVersion[]>);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Version History</CardTitle>
            {versions.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {versions.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={fetchVersions}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-6">
            <GitCommit className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No versions tracked yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Versions will appear when you create deployments
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Version Highlight */}
            {currentVersion && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    <span className="font-mono font-medium">{currentVersion.version_tag}</span>
                    <Badge className="text-[10px]">Current</Badge>
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px]">
                    {currentVersion.environment}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <GitBranch className="w-3 h-3" />
                  <span>{currentVersion.branch}</span>
                  <span className="text-border">•</span>
                  <GitCommit className="w-3 h-3" />
                  <code className="bg-muted px-1 rounded">
                    {currentVersion.commit_sha.substring(0, 7)}
                  </code>
                </div>
              </div>
            )}

            {/* Version Timeline */}
            <Collapsible open={expanded} onOpenChange={setExpanded}>
              <ScrollArea className={cn(expanded ? 'h-[300px]' : 'h-auto')}>
                <div className="space-y-1">
                  {recentVersions.map((version, index) => (
                    <motion.div
                      key={version.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg transition-colors',
                        version.is_current 
                          ? 'bg-primary/5' 
                          : 'hover:bg-muted/50'
                      )}
                    >
                      {/* Timeline indicator */}
                      <div className="relative flex flex-col items-center">
                        <div className={cn(
                          'w-2 h-2 rounded-full z-10',
                          version.is_current ? 'bg-primary' : 'bg-muted-foreground'
                        )} />
                        {index < recentVersions.length - 1 && (
                          <div className="w-px h-6 bg-border absolute top-3" />
                        )}
                      </div>
                      
                      {/* Version info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                            {version.commit_sha.substring(0, 7)}
                          </code>
                          <span className="text-xs text-muted-foreground truncate">
                            {version.commit_message || 'No message'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Meta */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-[10px] capitalize',
                            version.environment === 'production' && 'border-sec-critical/50',
                            version.environment === 'staging' && 'border-sec-warning/50',
                            version.environment === 'development' && 'border-sec-safe/50'
                          )}
                        >
                          {version.environment}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTimeAgo(new Date(version.created_at))}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              {versions.length > 5 && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
                    {expanded ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 mr-1" />
                        Show {versions.length - 5} More
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
              )}
            </Collapsible>

            {/* Environment Summary */}
            <div className="flex gap-2 pt-2 border-t">
              {Object.entries(versionsByEnv).map(([env, envVersions]) => (
                <div 
                  key={env}
                  className="flex-1 p-2 rounded-lg bg-muted/30 text-center"
                >
                  <p className="text-xs text-muted-foreground capitalize">{env}</p>
                  <p className="text-sm font-mono font-medium">
                    {envVersions[0]?.version_tag || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
