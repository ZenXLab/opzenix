import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  GitBranch, 
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Bookmark,
  Shield,
  Terminal,
  ArrowLeft,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useExecutionRealtime } from '@/hooks/useExecutionRealtime';
import { useNodeStatusRealtime } from '@/hooks/useNodeStatusRealtime';

interface ExecutionFlowViewProps {
  executionId?: string;
  onOpenApproval?: (nodeId: string) => void;
  onRollback?: (checkpointId: string) => void;
  onBack?: () => void;
}

interface ExecutionData {
  id: string;
  name: string;
  status: string;
  environment: string;
  branch: string | null;
  progress: number | null;
  started_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown> | null;
}

interface NodeData {
  id: string;
  node_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  metadata: Record<string, unknown> | null;
}

// Custom Node Component for Execution Flow
const ExecutionFlowNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const statusColors: Record<string, string> = {
    idle: 'border-muted-foreground bg-muted/30',
    running: 'border-chart-1 bg-chart-1/10 shadow-lg shadow-chart-1/20',
    success: 'border-sec-safe bg-sec-safe/10',
    failed: 'border-sec-critical bg-sec-critical/10',
    paused: 'border-sec-warning bg-sec-warning/10',
    warning: 'border-sec-warning bg-sec-warning/10',
  };

  const StatusIcon = {
    idle: Clock,
    running: Play,
    success: CheckCircle2,
    failed: XCircle,
    paused: Pause,
    warning: AlertTriangle,
  }[data.status as string] || Clock;

  return (
    <div
      className={cn(
        'relative px-6 py-4 rounded-xl border-2 bg-background transition-all min-w-[180px]',
        statusColors[data.status] || statusColors.idle,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {/* Checkpoint Badge */}
      {data.isCheckpoint && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Bookmark className="w-3 h-3 text-primary-foreground" />
        </div>
      )}

      {/* Gate Badge */}
      {data.isGate && (
        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-sec-warning flex items-center justify-center">
          <Shield className="w-3 h-3 text-background" />
        </div>
      )}

      {/* Node Content */}
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          data.status === 'running' && 'animate-pulse'
        )}>
          <StatusIcon className={cn(
            'w-4 h-4',
            data.status === 'idle' && 'text-muted-foreground',
            data.status === 'running' && 'text-chart-1',
            data.status === 'success' && 'text-sec-safe',
            data.status === 'failed' && 'text-sec-critical',
            data.status === 'paused' && 'text-sec-warning',
            data.status === 'warning' && 'text-sec-warning',
          )} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">{String(data.label || '')}</h4>
          {data.duration && (
            <p className="text-xs text-muted-foreground">{String(data.duration)}</p>
          )}
        </div>
      </div>

      {/* Running Indicator */}
      {data.status === 'running' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden rounded-b-xl">
          <motion.div
            className="h-full bg-chart-1"
            initial={{ width: '0%' }}
            animate={{ width: `${data.progress || 50}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  executionNode: ExecutionFlowNode,
};

function formatDuration(ms: number | null): string {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

const ExecutionFlowView = ({
  executionId,
  onOpenApproval,
  onRollback,
  onBack,
}: ExecutionFlowViewProps) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ level: string; message: string; timestamp: string }[]>([]);
  const [execution, setExecution] = useState<ExecutionData | null>(null);
  const [executionNodes, setExecutionNodes] = useState<NodeData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Real-time subscription for execution updates
  useExecutionRealtime(executionId || null, (payload) => {
    const newExecution = payload.new as ExecutionData;
    if (newExecution) {
      setExecution(newExecution);
    }
  });

  // Real-time subscription for node updates
  useNodeStatusRealtime(executionId || null, (nodeId, status, data) => {
    setExecutionNodes(prev => {
      const existing = prev.find(n => n.node_id === nodeId);
      if (existing) {
        return prev.map(n => n.node_id === nodeId ? { ...n, status, ...data } : n);
      }
      return [...prev, data];
    });
  });

  // Fetch execution and nodes data
  useEffect(() => {
    if (!executionId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch execution
        const { data: execData, error: execError } = await supabase
          .from('executions')
          .select('*')
          .eq('id', executionId)
          .single();

        if (!execError && execData) {
          setExecution(execData as ExecutionData);
        }

        // Fetch execution nodes
        const { data: nodesData, error: nodesError } = await supabase
          .from('execution_nodes')
          .select('*')
          .eq('execution_id', executionId)
          .order('started_at', { ascending: true });

        if (!nodesError && nodesData) {
          setExecutionNodes(nodesData as NodeData[]);
        }
      } catch (err) {
        console.error('[ExecutionFlowView] Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [executionId]);

  // Build React Flow nodes from execution_nodes data
  useEffect(() => {
    if (executionNodes.length === 0) {
      // Show empty state with placeholder
      setNodes([]);
      setEdges([]);
      return;
    }

    // Convert execution_nodes to React Flow nodes
    const flowNodes: Node[] = executionNodes.map((node, index) => {
      const metadata = node.metadata || {};
      return {
        id: node.node_id,
        type: 'executionNode',
        position: { x: index * 250, y: 100 },
        data: {
          label: (metadata as any).label || node.node_id,
          status: node.status,
          duration: formatDuration(node.duration_ms),
          isCheckpoint: (metadata as any).isCheckpoint || false,
          isGate: (metadata as any).isGate || false,
          progress: (metadata as any).progress || 0,
        },
      };
    });

    // Create edges between sequential nodes
    const flowEdges: Edge[] = executionNodes.slice(0, -1).map((node, index) => {
      const nextNode = executionNodes[index + 1];
      const status = node.status;
      let strokeColor = 'hsl(var(--muted-foreground))';
      let animated = false;
      let dashArray = '5,5';

      if (status === 'success') {
        strokeColor = 'hsl(var(--sec-safe))';
        dashArray = '';
      } else if (status === 'running') {
        strokeColor = 'hsl(var(--chart-1))';
        animated = true;
        dashArray = '';
      } else if (status === 'failed') {
        strokeColor = 'hsl(var(--sec-critical))';
        dashArray = '';
      } else if (status === 'paused') {
        strokeColor = 'hsl(var(--sec-warning))';
        animated = true;
        dashArray = '';
      }

      return {
        id: `e-${node.node_id}-${nextNode.node_id}`,
        source: node.node_id,
        target: nextNode.node_id,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        animated,
        style: { stroke: strokeColor, strokeDasharray: dashArray },
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [executionNodes, setNodes, setEdges]);

  // Fetch logs for selected node
  useEffect(() => {
    if (!selectedNodeId || !executionId) return;

    const fetchLogs = async () => {
      const { data } = await supabase
        .from('execution_logs')
        .select('*')
        .eq('execution_id', executionId)
        .eq('node_id', selectedNodeId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setLogs(data.map(l => ({
          level: l.level,
          message: l.message,
          timestamp: new Date(l.created_at).toLocaleTimeString(),
        })));
      }
    };

    fetchLogs();

    // Subscribe to new logs
    const channel = supabase
      .channel(`logs-${selectedNodeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'execution_logs',
        filter: `node_id=eq.${selectedNodeId}`
      }, (payload) => {
        const newLog = payload.new as any;
        setLogs(prev => [{
          level: newLog.level,
          message: newLog.message,
          timestamp: new Date(newLog.created_at).toLocaleTimeString(),
        }, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedNodeId, executionId]);

  const selectedNode = useMemo(() => 
    nodes.find(n => n.id === selectedNodeId)?.data,
    [nodes, selectedNodeId]
  );

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const getStatusBadge = () => {
    if (!execution) return null;
    
    const statusConfig: Record<string, { color: string; label: string }> = {
      idle: { color: 'bg-muted text-muted-foreground', label: 'Idle' },
      running: { color: 'bg-chart-1 text-primary-foreground', label: 'Running' },
      success: { color: 'bg-sec-safe text-sec-safe-foreground', label: 'Completed' },
      failed: { color: 'bg-sec-critical text-sec-critical-foreground', label: 'Failed' },
      paused: { color: 'bg-sec-warning text-sec-warning-foreground', label: 'Awaiting Approval' },
      warning: { color: 'bg-sec-warning text-sec-warning-foreground', label: 'Warning' },
    };
    
    const config = statusConfig[execution.status] || statusConfig.idle;
    
    return (
      <Badge className={cn('gap-1.5', config.color)}>
        {execution.status === 'running' && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!executionId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <Play className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">No Execution Selected</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Select an active execution from the Control Tower dashboard to view its real-time flow progress.
        </p>
        {onBack && (
          <Button variant="outline" className="mt-4 gap-2" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h1 className="text-lg font-semibold">{execution?.name || 'Execution Flow'}</h1>
              <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                <span>{execution?.branch || 'main'}</span>
                <span>•</span>
                <span className="capitalize">{execution?.environment}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button variant="outline" size="sm" className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              Rollback
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <GitBranch className="w-3.5 h-3.5" />
              Branch
            </Button>
          </div>
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 flex">
        <div className="flex-1 relative">
          {nodes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <RefreshCw className="w-10 h-10 text-muted-foreground mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Waiting for Nodes</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Execution nodes will appear here as they are created and processed.
              </p>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              fitView
              className="bg-muted/20"
            >
              <Background color="hsl(var(--border))" gap={20} />
              <Controls className="bg-background border border-border rounded-lg" />
              <MiniMap 
                className="bg-background border border-border rounded-lg"
                nodeColor={(node) => {
                  const status = node.data?.status as string;
                  if (status === 'success') return 'hsl(var(--sec-safe))';
                  if (status === 'failed') return 'hsl(var(--sec-critical))';
                  if (status === 'running') return 'hsl(var(--chart-1))';
                  if (status === 'paused') return 'hsl(var(--sec-warning))';
                  return 'hsl(var(--muted-foreground))';
                }}
              />
            </ReactFlow>
          )}
        </div>

        {/* Node Inspector Panel */}
        <AnimatePresence>
          {selectedNodeId && selectedNode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="border-l border-border bg-background overflow-hidden"
            >
              <div className="w-[350px] h-full flex flex-col">
                {/* Inspector Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{String(selectedNode.label || '')}</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => setSelectedNodeId(null)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={selectedNode.status === 'success' ? 'default' : 'secondary'}
                      className={cn(
                        selectedNode.status === 'success' && 'bg-sec-safe text-sec-safe-foreground',
                        selectedNode.status === 'failed' && 'bg-sec-critical text-sec-critical-foreground',
                        selectedNode.status === 'running' && 'bg-chart-1 text-primary-foreground',
                        selectedNode.status === 'paused' && 'bg-sec-warning text-sec-warning-foreground',
                      )}
                    >
                      {String(selectedNode.status || '')}
                    </Badge>
                    {selectedNode.duration && (
                      <span className="text-xs text-muted-foreground">{String(selectedNode.duration)}</span>
                    )}
                    {selectedNode.isCheckpoint && (
                      <Badge variant="outline" className="gap-1">
                        <Bookmark className="w-3 h-3" /> Checkpoint
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Checkpoint Actions */}
                {selectedNode.isCheckpoint && (
                  <div className="p-4 border-b border-border space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Checkpoint Actions</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" /> Re-run from here
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <GitBranch className="w-3.5 h-3.5" /> Branch
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> Inspect state
                      </Button>
                    </div>
                  </div>
                )}

                {/* Gate Actions */}
                {selectedNode.isGate && selectedNode.status === 'paused' && (
                  <div className="p-4 border-b border-border">
                    <Button 
                      className="w-full gap-2"
                      onClick={() => onOpenApproval?.(selectedNodeId)}
                    >
                      <Shield className="w-4 h-4" />
                      Open Approval Gate
                    </Button>
                  </div>
                )}

                {/* Logs */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="px-4 py-2 border-b border-border flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Logs</span>
                    {selectedNode.status === 'running' && (
                      <div className="w-2 h-2 rounded-full bg-sec-safe animate-pulse ml-auto" />
                    )}
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 font-mono text-[11px] space-y-1">
                      {logs.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No logs yet</p>
                      ) : (
                        logs.map((log, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-muted-foreground shrink-0">{log.timestamp}</span>
                            <span className={cn(
                              'shrink-0',
                              log.level === 'error' && 'text-sec-critical',
                              log.level === 'warn' && 'text-sec-warning',
                              log.level === 'info' && 'text-muted-foreground',
                            )}>[{log.level.toUpperCase()}]</span>
                            <span className="text-foreground break-all">{log.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExecutionFlowView;
