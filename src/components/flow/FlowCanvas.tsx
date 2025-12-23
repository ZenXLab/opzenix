import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  ConnectionMode,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ExecutionNode, { ExecutionNodeData } from './ExecutionNode';
import FlowNodeInspector from './FlowNodeInspector';
import { useFlowStore } from '@/stores/flowStore';
import { getFlowTemplate } from '@/data/flowTemplates';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { seedBulkTelemetry } from '@/utils/otelSeeder';
import { toast } from 'sonner';

const nodeTypes = {
  execution: ExecutionNode,
};

const FlowCanvas = () => {
  const { setSelectedNodeId, selectedNodeId, activeFlowType } = useFlowStore();
  const [inspectedNodeId, setInspectedNodeId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  
  const { nodes: templateNodes, edges: templateEdges } = useMemo(() => 
    getFlowTemplate(activeFlowType as 'cicd' | 'mlops' | 'llmops'), 
    [activeFlowType]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(templateNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(templateEdges);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    setInspectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const handleSeedTelemetry = async () => {
    setIsSeeding(true);
    try {
      const nodeIds = nodes.map(n => n.id);
      await seedBulkTelemetry(nodeIds);
      toast.success('Test telemetry seeded for all nodes');
    } catch (err) {
      toast.error('Failed to seed telemetry');
    } finally {
      setIsSeeding(false);
    }
  };

  const styledEdges = edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const nodeData = sourceNode?.data as ExecutionNodeData | undefined;
    const isActive = nodeData?.status === 'running';
    const isSuccess = nodeData?.status === 'success';
    
    return {
      ...edge,
      style: {
        stroke: isActive ? 'hsl(217 91% 60%)' : isSuccess ? 'hsl(220 18% 35%)' : 'hsl(220 18% 25%)',
        strokeWidth: isActive ? 2 : 1.5,
      },
      animated: isActive || edge.animated,
    };
  });

  const inspectedNode = nodes.find(n => n.id === inspectedNodeId);

  return (
    <div className="w-full h-full control-grid flex">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes.map(n => ({ ...n, selected: n.id === selectedNodeId }))}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.5}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="hsl(220 18% 15%)" />
          <Controls showInteractive={false} className="!bottom-4 !left-4" />
          <MiniMap 
            className="!bottom-4 !right-4"
            nodeColor={(node) => {
              const data = node.data as ExecutionNodeData | undefined;
              switch (data?.status) {
                case 'running': return 'hsl(217 91% 60%)';
                case 'success': return 'hsl(142 76% 36%)';
                case 'warning': return 'hsl(38 92% 50%)';
                case 'failed': return 'hsl(0 84% 60%)';
                case 'paused': return 'hsl(263 70% 50%)';
                default: return 'hsl(220 15% 45%)';
              }
            }}
            maskColor="hsl(220 25% 7% / 0.8)"
          />
        </ReactFlow>

        {/* Seed Test Data Button */}
        <div className="absolute top-4 right-4 z-10">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSeedTelemetry}
            disabled={isSeeding}
            className="gap-2"
          >
            <Zap className={`w-4 h-4 ${isSeeding ? 'animate-pulse' : ''}`} />
            {isSeeding ? 'Seeding...' : 'Seed OTel Data'}
          </Button>
        </div>

        {/* Hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="px-3 py-1.5 bg-card/90 backdrop-blur border border-border rounded-lg text-xs text-muted-foreground">
            Double-click any node to view OTel telemetry
          </div>
        </div>
      </div>

      {/* Node Inspector */}
      {inspectedNodeId && (
        <FlowNodeInspector
          nodeId={inspectedNodeId}
          nodeLabel={(inspectedNode?.data as ExecutionNodeData)?.label}
          onClose={() => setInspectedNodeId(null)}
        />
      )}
    </div>
  );
};

export default FlowCanvas;
