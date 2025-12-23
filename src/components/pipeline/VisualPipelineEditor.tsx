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
import { X, Save, Play, Undo, Redo, Sparkles, Users, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { nodeTypes } from './PipelineNodeTypes';
import PipelineToolbox from './PipelineToolbox';
import StageConfigPanel from './StageConfigPanel';
import PipelineTemplatesLibrary from './PipelineTemplatesLibrary';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VisualPipelineEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
}

interface CollaboratorCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
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

// Simulated collaborators
const mockCollaborators: CollaboratorCursor[] = [
  { id: 'u1', name: 'Sarah C.', color: 'hsl(var(--ai-primary))', x: 400, y: 200 },
  { id: 'u2', name: 'Mike J.', color: 'hsl(var(--sec-safe))', x: 800, y: 150 },
];

const VisualPipelineEditor = ({ isOpen, onClose, onSave }: VisualPipelineEditorProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [collaboratorCursors, setCollaboratorCursors] = useState<CollaboratorCursor[]>(mockCollaborators);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Simulate cursor movement
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCollaboratorCursors(prev => prev.map(c => ({
        ...c,
        x: c.x + (Math.random() - 0.5) * 30,
        y: c.y + (Math.random() - 0.5) * 20,
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleLoadTemplate = (templateNodes: Node[], templateEdges: Edge[]) => {
    setNodes(templateNodes);
    setEdges(templateEdges.map(e => ({ ...e, style: { stroke: 'hsl(var(--edge-default))' } })));
    setShowTemplates(false);
    toast.success('Template loaded');
  };

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({
      ...connection,
      style: { stroke: 'hsl(var(--edge-default))' },
    }, eds));
  }, [setEdges]);

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

      setNodes((nds) => nds.concat(newNode));
      toast.success(`Added ${label} stage`);
    },
    [reactFlowInstance, setNodes]
  );

  const handleDragStart = (event: React.DragEvent, item: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleUpdateNode = (nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === nodeId ? { ...node, data } : node))
    );
    toast.success('Stage updated');
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
    toast.success('Stage deleted');
  };

  const handleSave = () => {
    if (onSave) {
      onSave(nodes, edges);
    }
    toast.success('Pipeline saved');
  };

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
                <p className="text-xs text-muted-foreground">Drag stages • Connect steps • Configure</p>
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
                <div className="flex -space-x-1.5">
                  {collaboratorCursors.map(c => (
                    <div key={c.id} className="w-5 h-5 rounded-full border-2 border-card flex items-center justify-center text-[8px] font-bold text-foreground" style={{ backgroundColor: c.color }}>
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  ))}
                </div>
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
            <div className="flex-1" ref={reactFlowWrapper}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={handleNodeClick}
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
                {collaboratorCursors.map(cursor => (
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
                    </span>
                  </div>
                ))}
                
                {/* AI Hint Panel */}
                <Panel position="bottom-center" className="mb-4">
                  <div className="px-4 py-2 bg-card/90 backdrop-blur border border-border rounded-lg flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-ai-primary" />
                    <span className="text-xs text-muted-foreground">
                      AI: Consider adding a security scan before deployment
                    </span>
                  </div>
                </Panel>
              </ReactFlow>
            </div>

            {/* Config Panel */}
            {selectedNode && (
              <StageConfigPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onUpdate={handleUpdateNode}
                onDelete={handleDeleteNode}
              />
            )}
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
