import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ConnectionMode,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ExecutionNode, { ExecutionNodeData } from './ExecutionNode';
import { useFlowStore } from '@/stores/flowStore';
import { getFlowTemplate } from '@/data/flowTemplates';

const nodeTypes = {
  execution: ExecutionNode,
};

const FlowCanvas = () => {
  const { setSelectedNodeId, selectedNodeId, activeFlowType } = useFlowStore();
  
  const { nodes: templateNodes, edges: templateEdges } = useMemo(() => 
    getFlowTemplate(activeFlowType as 'cicd' | 'mlops' | 'llmops'), 
    [activeFlowType]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(templateNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(templateEdges);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

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

  return (
    <div className="w-full h-full control-grid">
      <ReactFlow
        nodes={nodes.map(n => ({ ...n, selected: n.id === selectedNodeId }))}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
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
    </div>
  );
};

export default FlowCanvas;
