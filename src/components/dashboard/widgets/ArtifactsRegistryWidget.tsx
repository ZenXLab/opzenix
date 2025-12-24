import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, ExternalLink, Copy, Clock, CheckCircle2, Hash, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Artifact {
  id: string;
  name: string;
  type: string;
  registry_url: string;
  image_digest: string;
  image_tag: string | null;
  version: string | null;
  size_bytes: number | null;
  created_at: string;
  execution_id: string | null;
}

interface ArtifactsRegistryWidgetProps {
  id: string;
  onRemove?: (id: string) => void;
  onViewTraceability?: (artifactId: string) => void;
}

export function ArtifactsRegistryWidget({ id, onRemove, onViewTraceability }: ArtifactsRegistryWidgetProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtifacts();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('artifacts-widget')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'artifacts' },
        () => fetchArtifacts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchArtifacts = async () => {
    try {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setArtifacts(data || []);
    } catch (error) {
      console.error('Error fetching artifacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyDigest = (digest: string) => {
    navigator.clipboard.writeText(digest);
    toast.success('Digest copied to clipboard');
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (artifacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <Package className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No artifacts yet</p>
        <p className="text-xs text-muted-foreground">Push a Docker image to see it here</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <ScrollArea className="h-[280px]">
        <div className="space-y-2 pr-3">
          {artifacts.map((artifact, index) => (
            <motion.div
              key={artifact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{artifact.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {artifact.image_tag && (
                        <Badge variant="secondary" className="text-[10px] h-4 gap-0.5">
                          <Tag className="w-2.5 h-2.5" />
                          {artifact.image_tag}
                        </Badge>
                      )}
                      {artifact.version && (
                        <Badge variant="outline" className="text-[10px] h-4">
                          v{artifact.version}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyDigest(artifact.image_digest)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy digest</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => window.open(artifact.registry_url, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Open in registry</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Hash className="w-3 h-3" />
                  <span className="font-mono truncate">{artifact.image_digest.slice(0, 24)}...</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(artifact.created_at), { addSuffix: true })}</span>
                  </div>
                  {artifact.size_bytes && (
                    <span>{formatSize(artifact.size_bytes)}</span>
                  )}
                </div>
              </div>

              {artifact.execution_id && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-5 px-0 text-xs text-primary mt-1"
                  onClick={() => onViewTraceability?.(artifact.id)}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  View provenance
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </TooltipProvider>
  );
}

export default ArtifactsRegistryWidget;