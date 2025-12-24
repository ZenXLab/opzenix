import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Copy, 
  ExternalLink, 
  Clock, 
  GitBranch, 
  GitCommit, 
  Play, 
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronRight,
  FileText,
  Bookmark,
  Package,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { ExecutionLogsViewer } from './ExecutionLogsViewer';

interface ExecutionNode {
  id: string;
  node_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  metadata: any;
}

interface Checkpoint {
  id: string;
  node_id: string;
  name: string;
  state: any;
  created_at: string;
}

interface ExecutionDetailPanelProps {
  executionId: string;
  onClose: () => void;
}

const statusConfig = {
  idle: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
  running: { icon: Loader2, color: 'text-chart-1', bg: 'bg-chart-1/20' },
  success: { icon: CheckCircle2, color: 'text-sec-safe', bg: 'bg-sec-safe/20' },
  warning: { icon: AlertTriangle, color: 'text-sec-warning', bg: 'bg-sec-warning/20' },
  failed: { icon: XCircle, color: 'text-sec-critical', bg: 'bg-sec-critical/20' },
  paused: { icon: Clock, color: 'text-sec-warning', bg: 'bg-sec-warning/20' },
};

export function ExecutionDetailPanel({ executionId, onClose }: ExecutionDetailPanelProps) {
  const [execution, setExecution] = useState<any>(null);
  const [nodes, setNodes] = useState<ExecutionNode[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchExecutionDetails();
    
    // Subscribe to real-time updates
    const executionChannel = supabase
      .channel(`execution-detail-${executionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'executions',
        filter: `id=eq.${executionId}`
      }, (payload) => {
        setExecution(payload.new);
      })
      .subscribe();

    const nodesChannel = supabase
      .channel(`nodes-detail-${executionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'execution_nodes',
        filter: `execution_id=eq.${executionId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNodes(prev => [...prev, payload.new as ExecutionNode]);
        } else if (payload.eventType === 'UPDATE') {
          setNodes(prev => prev.map(n => n.id === (payload.new as any).id ? payload.new as ExecutionNode : n));
        }
      })
      .subscribe();

    const checkpointChannel = supabase
      .channel(`checkpoints-detail-${executionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'checkpoints',
        filter: `execution_id=eq.${executionId}`
      }, (payload) => {
        setCheckpoints(prev => [...prev, payload.new as Checkpoint]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(executionChannel);
      supabase.removeChannel(nodesChannel);
      supabase.removeChannel(checkpointChannel);
    };
  }, [executionId]);

  const fetchExecutionDetails = async () => {
    setLoading(true);
    try {
      const [executionRes, nodesRes, checkpointsRes] = await Promise.all([
        supabase.from('executions').select('*').eq('id', executionId).single(),
        supabase.from('execution_nodes').select('*').eq('execution_id', executionId).order('started_at', { ascending: true }),
        supabase.from('checkpoints').select('*').eq('execution_id', executionId).order('created_at', { ascending: true }),
      ]);

      if (executionRes.data) setExecution(executionRes.data);
      if (nodesRes.data) setNodes(nodesRes.data);
      if (checkpointsRes.data) setCheckpoints(checkpointsRes.data);
    } catch (error) {
      console.error('Error fetching execution details:', error);
      toast.error('Failed to load execution details');
    } finally {
      setLoading(false);
    }
  };

  const copyExecutionId = () => {
    navigator.clipboard.writeText(executionId);
    toast.success('Execution ID copied to clipboard');
  };

  const toggleNodeExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleRerunFromCheckpoint = async (checkpointId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('rerun-from-checkpoint', {
        body: { checkpoint_id: checkpointId }
      });
      if (error) throw error;
      toast.success('Re-run initiated from checkpoint');
    } catch (error) {
      console.error('Rerun error:', error);
      toast.error('Failed to initiate re-run');
    }
  };

  const StatusIcon = execution ? statusConfig[execution.status as keyof typeof statusConfig]?.icon || Clock : Clock;
  const statusStyle = execution ? statusConfig[execution.status as keyof typeof statusConfig] : statusConfig.idle;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="w-[480px] h-full border-l border-border bg-background flex items-center justify-center"
      >
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </motion.div>
    );
  }

  if (!execution) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="w-[480px] h-full border-l border-border bg-background flex items-center justify-center"
      >
        <p className="text-muted-foreground">Execution not found</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="w-[480px] h-full border-l border-border bg-background flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded', statusStyle.bg)}>
              <StatusIcon className={cn('w-4 h-4', statusStyle.color, execution.status === 'running' && 'animate-spin')} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{execution.name}</h3>
              <Badge variant="outline" className="mt-1 text-[10px]">
                {execution.status.toUpperCase()}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Execution ID - Always Visible */}
        <div className="flex items-center gap-2 p-2 rounded bg-muted/50 border border-border">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <code className="text-xs font-mono text-muted-foreground flex-1 truncate">
            {executionId}
          </code>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyExecutionId}>
            <Copy className="w-3 h-3" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="p-2 rounded bg-secondary/50 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Environment</p>
            <p className="text-xs font-medium">{execution.environment}</p>
          </div>
          <div className="p-2 rounded bg-secondary/50 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Branch</p>
            <div className="flex items-center justify-center gap-1">
              <GitBranch className="w-3 h-3" />
              <p className="text-xs font-medium truncate">{execution.branch || 'main'}</p>
            </div>
          </div>
          <div className="p-2 rounded bg-secondary/50 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Commit</p>
            <div className="flex items-center justify-center gap-1">
              <GitCommit className="w-3 h-3" />
              <p className="text-xs font-mono">{execution.commit_hash?.slice(0, 7) || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-2 grid grid-cols-4 h-9">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
          <TabsTrigger value="checkpoints" className="text-xs">Checkpoints</TabsTrigger>
          <TabsTrigger value="artifacts" className="text-xs">Artifacts</TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0">
          <TabsContent value="overview" className="h-full m-0 data-[state=active]:flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Timeline */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Execution Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-4">
                    <div className="space-y-2">
                      {nodes.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">
                          No nodes executed yet
                        </p>
                      ) : (
                        nodes.map((node, idx) => {
                          const nodeStatus = statusConfig[node.status as keyof typeof statusConfig] || statusConfig.idle;
                          const NodeIcon = nodeStatus.icon;
                          const isExpanded = expandedNodes.has(node.id);

                          return (
                            <Collapsible key={node.id} open={isExpanded} onOpenChange={() => toggleNodeExpand(node.id)}>
                              <CollapsibleTrigger asChild>
                                <button className="w-full flex items-center gap-3 p-2 rounded hover:bg-secondary/50 transition-colors">
                                  <div className="flex flex-col items-center">
                                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', nodeStatus.bg)}>
                                      <NodeIcon className={cn('w-3 h-3', nodeStatus.color, node.status === 'running' && 'animate-spin')} />
                                    </div>
                                    {idx < nodes.length - 1 && (
                                      <div className="w-0.5 h-4 bg-border mt-1" />
                                    )}
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="text-xs font-medium">{node.node_id}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {node.duration_ms ? `${(node.duration_ms / 1000).toFixed(1)}s` : 'In progress...'}
                                    </p>
                                  </div>
                                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="ml-9 mt-1 p-2 rounded bg-muted/30 text-xs space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Started:</span>
                                    <span>{node.started_at ? new Date(node.started_at).toLocaleTimeString() : 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Completed:</span>
                                    <span>{node.completed_at ? new Date(node.completed_at).toLocaleTimeString() : 'Running...'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge variant="outline" className="text-[9px] h-4">{node.status}</Badge>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Metadata */}
                {execution.metadata && Object.keys(execution.metadata).length > 0 && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 pb-4">
                      <pre className="text-[10px] font-mono bg-muted/50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(execution.metadata, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="h-full m-0 p-4 data-[state=active]:block">
            <ExecutionLogsViewer executionId={executionId} maxHeight="100%" />
          </TabsContent>

          <TabsContent value="checkpoints" className="h-full m-0 data-[state=active]:flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {checkpoints.length === 0 ? (
                  <div className="text-center py-8">
                    <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No checkpoints created yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Checkpoints are created at major stage completions</p>
                  </div>
                ) : (
                  checkpoints.map((cp) => (
                    <Card key={cp.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Bookmark className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">{cp.name}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Node: {cp.node_id} • {new Date(cp.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs gap-1"
                            onClick={() => handleRerunFromCheckpoint(cp.id)}
                          >
                            <RotateCcw className="w-3 h-3" />
                            Re-run
                          </Button>
                        </div>
                        {cp.state && Object.keys(cp.state).length > 0 && (
                          <pre className="text-[9px] font-mono bg-muted/50 p-2 rounded mt-2 overflow-x-auto max-h-20">
                            {JSON.stringify(cp.state, null, 2)}
                          </pre>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="artifacts" className="h-full m-0 data-[state=active]:flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="text-center py-8">
                <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No artifacts available</p>
                <p className="text-xs text-muted-foreground mt-1">Build artifacts will appear here after pipeline completion</p>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer Actions */}
      <div className="p-3 border-t border-border flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1">
          <ExternalLink className="w-3.5 h-3.5" />
          View in GitHub
        </Button>
        {execution.status === 'failed' && (
          <Button variant="default" size="sm" className="flex-1 gap-1">
            <RotateCcw className="w-3.5 h-3.5" />
            Retry Execution
          </Button>
        )}
      </div>
    </motion.div>
  );
}
