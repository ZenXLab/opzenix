import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Package, GitCommit, GitBranch, Clock, User, 
  CheckCircle2, ExternalLink, Copy, Link2, ChevronRight,
  FileText, Tag, Hash, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface Artifact {
  id: string;
  name: string;
  type: string;
  registry_url: string;
  image_digest: string;
  image_tag: string | null;
  version: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
  size_bytes: number | null;
  build_duration_ms: number | null;
  created_at: string;
  execution_id: string | null;
}

interface Execution {
  id: string;
  name: string;
  status: string;
  environment: string;
  branch: string | null;
  commit_hash: string | null;
  started_at: string;
  completed_at: string | null;
}

interface ArtifactTraceabilityPanelProps {
  open: boolean;
  onClose: () => void;
  artifactId?: string;
}

export function ArtifactTraceabilityPanel({ open, onClose, artifactId }: ArtifactTraceabilityPanelProps) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [execution, setExecution] = useState<Execution | null>(null);
  const [relatedArtifacts, setRelatedArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && artifactId) {
      fetchArtifactDetails();
    }
  }, [open, artifactId]);

  const fetchArtifactDetails = async () => {
    if (!artifactId) return;
    
    setLoading(true);
    try {
      // Fetch artifact
      const { data: artifactData, error: artifactError } = await supabase
        .from('artifacts')
        .select('*')
        .eq('id', artifactId)
        .single();

      if (artifactError) throw artifactError;
      setArtifact(artifactData);

      // Fetch linked execution if exists
      if (artifactData?.execution_id) {
        const { data: execData } = await supabase
          .from('executions')
          .select('*')
          .eq('id', artifactData.execution_id)
          .single();

        setExecution(execData);

        // Fetch other artifacts from same execution
        const { data: relatedData } = await supabase
          .from('artifacts')
          .select('*')
          .eq('execution_id', artifactData.execution_id)
          .neq('id', artifactId)
          .order('created_at', { ascending: false });

        setRelatedArtifacts(relatedData || []);
      }
    } catch (error) {
      console.error('Error fetching artifact details:', error);
      toast.error('Failed to load artifact details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-[480px] sm:max-w-lg p-0">
        <SheetHeader className="p-4 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Layers className="w-4 h-4 text-primary" />
              Artifact Traceability
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-70px)]">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : artifact ? (
            <div className="p-4 space-y-6">
              {/* Artifact Header */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{artifact.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {artifact.image_tag && (
                        <Badge variant="secondary" className="text-[10px] h-4 gap-0.5">
                          <Tag className="w-2.5 h-2.5" />
                          {artifact.image_tag}
                        </Badge>
                      )}
                      {artifact.version && (
                        <Badge variant="outline" className="text-[10px] h-4">v{artifact.version}</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] h-4 capitalize">{artifact.type}</Badge>
                    </div>
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Digest */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Image Digest
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-xs"
                      onClick={() => copyToClipboard(artifact.image_digest, 'Digest')}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <code className="block text-xs font-mono bg-background p-2 rounded border border-border break-all">
                    {artifact.image_digest}
                  </code>
                </div>

                <Separator className="my-3" />

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">Registry</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <a 
                        href={artifact.registry_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        View in registry
                      </a>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">Size</span>
                    <p className="text-xs font-medium text-foreground mt-0.5">
                      {formatSize(artifact.size_bytes)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">Build Time</span>
                    <p className="text-xs font-medium text-foreground mt-0.5">
                      {formatDuration(artifact.build_duration_ms)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">Created</span>
                    <p className="text-xs font-medium text-foreground mt-0.5">
                      {format(new Date(artifact.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Provenance Chain */}
              {execution && (
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-primary" />
                    Provenance Chain
                  </h4>
                  
                  <div className="relative pl-4 border-l-2 border-primary/30 space-y-4">
                    {/* Git Commit */}
                    {execution.commit_hash && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative"
                      >
                        <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                          <GitCommit className="w-2.5 h-2.5 text-primary" />
                        </div>
                        <div className="pl-3">
                          <span className="text-[10px] uppercase text-muted-foreground">Source Commit</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <code className="text-xs font-mono text-foreground">{execution.commit_hash.slice(0, 8)}</code>
                            {execution.branch && (
                              <Badge variant="secondary" className="text-[10px] h-4 gap-0.5">
                                <GitBranch className="w-2.5 h-2.5" />
                                {execution.branch}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Execution */}
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="relative"
                    >
                      <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-ai-primary/20 border-2 border-ai-primary flex items-center justify-center">
                        <CheckCircle2 className="w-2.5 h-2.5 text-ai-primary" />
                      </div>
                      <div className="pl-3">
                        <span className="text-[10px] uppercase text-muted-foreground">Pipeline Execution</span>
                        <p className="text-xs font-medium text-foreground mt-0.5">{execution.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] h-4",
                              execution.status === 'success' && 'border-sec-safe text-sec-safe',
                              execution.status === 'failed' && 'border-sec-critical text-sec-critical',
                              execution.status === 'running' && 'border-chart-1 text-chart-1'
                            )}
                          >
                            {execution.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(execution.started_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Artifact */}
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="relative"
                    >
                      <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-sec-safe/20 border-2 border-sec-safe flex items-center justify-center">
                        <Package className="w-2.5 h-2.5 text-sec-safe" />
                      </div>
                      <div className="pl-3">
                        <span className="text-[10px] uppercase text-muted-foreground">Artifact Published</span>
                        <p className="text-xs font-medium text-foreground mt-0.5">
                          {artifact.name}:{artifact.image_tag || 'latest'}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          {artifact.image_digest.slice(0, 32)}...
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Related Artifacts */}
              {relatedArtifacts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                    Related Artifacts ({relatedArtifacts.length})
                  </h4>
                  
                  <div className="space-y-2">
                    {relatedArtifacts.map((related) => (
                      <div 
                        key={related.id}
                        className="p-2.5 rounded-md bg-muted/30 border border-border flex items-center justify-between hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-foreground">{related.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {related.image_tag || 'latest'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {artifact.metadata && Object.keys(artifact.metadata).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    Metadata
                  </h4>
                  <pre className="text-[10px] font-mono bg-muted/30 p-3 rounded-lg border border-border overflow-x-auto">
                    {JSON.stringify(artifact.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Package className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Artifact not found</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default ArtifactTraceabilityPanel;