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
  Position,
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
  Terminal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ExecutionFlowViewProps {
  executionId?: string;
  onOpenApproval?: (nodeId: string) => void;
  onRollback?: (checkpointId: string) => void;
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
            animate={{ width: `${data.progress || 0}%` }}
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

const ExecutionFlowView = ({
  executionId,
  onOpenApproval,
  onRollback,
}: ExecutionFlowViewProps) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ level: string; message: string; timestamp: string }[]>([]);
  
  // Default flow nodes for demo
  const initialNodes: Node[] = [
    { id: 'source', type: 'executionNode', position: { x: 0, y: 100 }, data: { label: 'Source', status: 'success', duration: '2s', isCheckpoint: true } },
    { id: 'build', type: 'executionNode', position: { x: 250, y: 100 }, data: { label: 'Build', status: 'success', duration: '45s' } },
    { id: 'test', type: 'executionNode', position: { x: 500, y: 50 }, data: { label: 'Unit Tests', status: 'success', duration: '1m 20s' } },
    { id: 'integration', type: 'executionNode', position: { x: 500, y: 150 }, data: { label: 'Integration', status: 'success', duration: '2m 10s' } },
    { id: 'security', type: 'executionNode', position: { x: 750, y: 100 }, data: { label: 'Security Scan', status: 'success', duration: '3m' } },
    { id: 'approval', type: 'executionNode', position: { x: 1000, y: 100 }, data: { label: 'Approval Gate', status: 'paused', isGate: true, isCheckpoint: true } },
    { id: 'deploy', type: 'executionNode', position: { x: 1250, y: 100 }, data: { label: 'Deploy (AKS)', status: 'idle' } },
    { id: 'health', type: 'executionNode', position: { x: 1500, y: 100 }, data: { label: 'Health Check', status: 'idle', isCheckpoint: true } },
  ];

  const initialEdges: Edge[] = [
    { id: 'e1', source: 'source', target: 'build', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'hsl(var(--sec-safe))' } },
    { id: 'e2', source: 'build', target: 'test', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'hsl(var(--sec-safe))' } },
    { id: 'e3', source: 'build', target: 'integration', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'hsl(var(--sec-safe))' } },
    { id: 'e4', source: 'test', target: 'security', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'hsl(var(--sec-safe))' } },
    { id: 'e5', source: 'integration', target: 'security', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'hsl(var(--sec-safe))' } },
    { id: 'e6', source: 'security', target: 'approval', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, animated: true, style: { stroke: 'hsl(var(--sec-warning))' } },
    { id: 'e7', source: 'approval', target: 'deploy', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '5,5' } },
    { id: 'e8', source: 'deploy', target: 'health', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '5,5' } },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

  return (
    <div className="h-full flex">
      {/* Flow Canvas */}
      <div className="flex-1 relative">
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

        {/* Flow Header */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto">
            <Badge variant="outline" className="bg-background/95 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-sec-warning mr-2 animate-pulse" />
              Awaiting Approval
            </Badge>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <Button variant="outline" size="sm" className="bg-background/95 backdrop-blur-sm gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              Rollback
            </Button>
            <Button variant="outline" size="sm" className="bg-background/95 backdrop-blur-sm gap-1.5">
              <GitBranch className="w-3.5 h-3.5" />
              Branch
            </Button>
          </div>
        </div>
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
  );
};

export default ExecutionFlowView;
