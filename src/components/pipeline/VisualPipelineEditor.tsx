import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Play, Undo, Redo, Sparkles, Users, FolderOpen, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { nodeTypes } from './PipelineNodeTypes';
import PipelineToolbox from './PipelineToolbox';
import StageConfigPanel from './StageConfigPanel';
import PipelineTemplatesLibrary from './PipelineTemplatesLibrary';
import NodeInspector from './NodeInspector';
import { usePipelineCollaboration } from '@/hooks/usePipelineCollaboration';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VisualPipelineEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  pipelineId?: string;
}

// Initial demo pipeline
const initialNodes: Node[] = [
  { id: 'source-1', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Checkout', stageType: 'source', status: 'success', description: 'main branch' } },
  { id: 'build-1', type: 'pipelineStage', position: { x: 280, y: 150 }, data: { label: 'Build', stageType: 'build', status: 'success', description: 'npm run build', duration: '2m 14s' } },
  { id: 'test-1', type: 'pipelineStage', position: { x: 510, y: 80 }, data: { label: 'Unit Tests', stageType: 'test', status: 'running', description: '142 tests' } },
  { id: 'test-2', type: 'pipelineStage', position: { x: 510, y: 220 }, data: { label: 'Integration', stageType: 'test', status: 'idle', description: '24 tests' } },
  { id: 'security-1', type: 'pipelineStage', position: { x: 740, y: 150 }, data: { label: 'Security Scan', stageType: 'security', status: 'idle', description: 'SAST + DAST' } },
  { id: 'checkpoint-1', type: 'checkpoint', position: { x: 970, y: 150 }, data: { label: 'Pre-Deploy', stageType: 'checkpoint', status: 'checkpoint' } },
  { id: 'approval-1', type: 'approvalGate', position: { x: 1170, y: 150 }, data: { label: 'Prod Approval', stageType: 'approval', status: 'idle' } },
  { id: 'deploy-1', type: 'pipelineStage', position: { x: 1370, y: 150 }, data: { label: 'Deploy Prod', stageType: 'deploy', status: 'idle', description: 'Canary 10%' } },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'source-1', target: 'build-1', style: { stroke: 'hsl(var(--edge-default))' } },
  { id: 'e2', source: 'build-1', target: 'test-1', style: { stroke: 'hsl(var(--edge-default))' } },
  { id: 'e3', source: 'build-1', target: 'test-2', style: { stroke: 'hsl(var(--edge-default))' } },
  { id: 'e4', source: 'test-1', target: 'security-1', style: { stroke: 'hsl(var(--edge-default))' } },
  { id: 'e5', source: 'test-2', target: 'security-1', style: { stroke: 'hsl(var(--edge-default))' } },
  { id: 'e6', source: 'security-1', target: 'checkpoint-1', style: { stroke: 'hsl(var(--edge-default))' } },
  { id: 'e7', source: 'checkpoint-1', target: 'approval-1', style: { stroke: 'hsl(var(--node-checkpoint))', strokeDasharray: '5,5' } },
  { id: 'e8', source: 'approval-1', target: 'deploy-1', style: { stroke: 'hsl(var(--edge-default))' } },
];

const VisualPipelineEditor = ({ isOpen, onClose, onSave, pipelineId = 'default' }: VisualPipelineEditorProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [inspectedNode, setInspectedNode] = useState<Node | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Real-time collaboration
  const {
    collaborators,
    isConnected,
    updateCursor,
    broadcastNodeChange,
    broadcastEdgeChange,
    subscribeToUpdates,
  } = usePipelineCollaboration(pipelineId, isOpen);

  // Subscribe to updates from collaborators
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeToUpdates(
      (remoteNodes) => {
        setNodes(remoteNodes);
      },
      (remoteEdges) => {
        setEdges(remoteEdges);
      }
    );

    return unsubscribe;
  }, [isOpen, subscribeToUpdates, setNodes, setEdges]);

  // Track mouse movement for cursor sharing
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!reactFlowInstance || !isConnected) return;
    
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!bounds) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    updateCursor(position.x, position.y, selectedNode ? 'editing' : 'viewing');
  }, [reactFlowInstance, isConnected, updateCursor, selectedNode]);

  const handleLoadTemplate = (templateNodes: Node[], templateEdges: Edge[]) => {
    const newNodes = templateNodes;
    const newEdges = templateEdges.map(e => ({ ...e, style: { stroke: 'hsl(var(--edge-default))' } }));
    setNodes(newNodes);
    setEdges(newEdges);
    broadcastNodeChange(newNodes);
    broadcastEdgeChange(newEdges);
    setShowTemplates(false);
    toast.success('Template loaded');
  };

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => {
      const newEdges = addEdge({
        ...connection,
        style: { stroke: 'hsl(var(--edge-default))' },
      }, eds);
      broadcastEdgeChange(newEdges);
      return newEdges;
    });
  }, [setEdges, broadcastEdgeChange]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const dataStr = event.dataTransfer.getData('application/reactflow');
      if (!dataStr || !reactFlowInstance) return;

      const { type, stageType, label } = JSON.parse(dataStr);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${stageType}-${Date.now()}`,
        type,
        position,
        data: { 
          label, 
          stageType, 
          status: 'idle',
          description: '',
        },
      };

      setNodes((nds) => {
        const updated = nds.concat(newNode);
        broadcastNodeChange(updated);
        return updated;
      });
      toast.success(`Added ${label} stage`);
    },
    [reactFlowInstance, setNodes, broadcastNodeChange]
  );

  const handleDragStart = (event: React.DragEvent, item: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    setInspectedNode(node);
  }, []);

  const handleUpdateNode = (nodeId: string, data: any) => {
    setNodes((nds) => {
      const updated = nds.map((node) => (node.id === nodeId ? { ...node, data } : node));
      broadcastNodeChange(updated);
      return updated;
    });
    toast.success('Stage updated');
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => {
      const updated = nds.filter((node) => node.id !== nodeId);
      broadcastNodeChange(updated);
      return updated;
    });
    setEdges((eds) => {
      const updated = eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
      broadcastEdgeChange(updated);
      return updated;
    });
    setSelectedNode(null);
    toast.success('Stage deleted');
  };

  const handleSave = () => {
    if (onSave) {
      onSave(nodes, edges);
    }
    toast.success('Pipeline saved');
  };

  // Handle nodes/edges change for collaboration
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    // Debounce broadcast for performance
    const hasPositionChange = changes.some((c: any) => c.type === 'position' && c.dragging === false);
    if (hasPositionChange) {
      setNodes((nds) => {
        broadcastNodeChange(nds);
        return nds;
      });
    }
  }, [onNodesChange, setNodes, broadcastNodeChange]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Header */}
          <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-ai-primary" />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Visual Pipeline Editor</h2>
                <p className="text-xs text-muted-foreground">Drag stages • Connect steps • Double-click for OTel</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowTemplates(true)}>
                <FolderOpen className="w-4 h-4" />
                Templates
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <div className="flex items-center gap-1 px-2 py-1 bg-secondary/30 rounded">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                {isConnected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-sec-safe animate-pulse" />
                )}
                <div className="flex -space-x-1.5">
                  {collaborators.map(c => (
                    <div 
                      key={c.id} 
                      className="w-5 h-5 rounded-full border-2 border-card flex items-center justify-center text-[8px] font-bold text-background" 
                      style={{ backgroundColor: c.color }}
                      title={`${c.name} (${c.mode})`}
                    >
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-1">
                  {collaborators.length + 1}
                </span>
              </div>
              <div className="w-px h-6 bg-border mx-1" />
              <Button variant="ghost" size="sm" className="gap-1">
                <Undo className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="gap-1">
                <Redo className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button variant="ghost" size="sm" className="gap-1">
                <Play className="w-4 h-4" />
                Run
              </Button>
              <Button size="sm" className="gap-1" onClick={handleSave}>
                <Save className="w-4 h-4" />
                Save
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Toolbox */}
            <PipelineToolbox onDragStart={handleDragStart} />

            {/* Canvas */}
            <div 
              className="flex-1" 
              ref={reactFlowWrapper}
              onMouseMove={handleMouseMove}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                nodeTypes={nodeTypes}
                fitView
                snapToGrid
                snapGrid={[16, 16]}
                defaultEdgeOptions={{
                  style: { stroke: 'hsl(var(--edge-default))', strokeWidth: 2 },
                  type: 'smoothstep',
                }}
                proOptions={{ hideAttribution: true }}
              >
                <Background 
                  variant={BackgroundVariant.Dots} 
                  gap={24} 
                  size={1}
                  color="hsl(var(--border))"
                />
                <Controls 
                  showZoom={true}
                  showFitView={true}
                  showInteractive={false}
                />
                <MiniMap 
                  nodeColor={(node) => {
                    const status = (node.data as any)?.status;
                    if (status === 'running') return 'hsl(var(--node-running))';
                    if (status === 'success') return 'hsl(var(--node-success))';
                    if (status === 'failed') return 'hsl(var(--node-failed))';
                    if (status === 'warning') return 'hsl(var(--node-warning))';
                    return 'hsl(var(--muted))';
                  }}
                  maskColor="hsl(var(--background) / 0.8)"
                />
                
                {/* Collaborator Cursors */}
                {collaborators.map(cursor => (
                  <div
                    key={cursor.id}
                    className="absolute pointer-events-none z-50 transition-all duration-300"
                    style={{ left: cursor.x, top: cursor.y }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M5 3L19 12L12 14L9 21L5 3Z" fill={cursor.color} stroke="hsl(var(--background))" strokeWidth="1.5"/>
                    </svg>
                    <span className="absolute top-4 left-3 px-1.5 py-0.5 text-[9px] font-medium rounded whitespace-nowrap" style={{ backgroundColor: cursor.color, color: 'hsl(var(--background))' }}>
                      {cursor.name}
                      {cursor.mode === 'editing' && ' ✎'}
                    </span>
                  </div>
                ))}
                
                {/* AI Hint Panel */}
                <Panel position="bottom-center" className="mb-4">
                  <div className="px-4 py-2 bg-card/90 backdrop-blur border border-border rounded-lg flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-ai-primary" />
                    <span className="text-xs text-muted-foreground">
                      Double-click any node to view OTel traces, logs & metrics
                    </span>
                  </div>
                </Panel>
              </ReactFlow>
            </div>

            {/* Config Panel */}
            {selectedNode && !inspectedNode && (
              <StageConfigPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onUpdate={handleUpdateNode}
                onDelete={handleDeleteNode}
              />
            )}

            {/* Node Inspector (OTel) */}
            <NodeInspector
              node={inspectedNode}
              onClose={() => setInspectedNode(null)}
            />
          </div>

          {/* Templates Library */}
          <PipelineTemplatesLibrary
            isOpen={showTemplates}
            onClose={() => setShowTemplates(false)}
            onSelectTemplate={handleLoadTemplate}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VisualPipelineEditor;
