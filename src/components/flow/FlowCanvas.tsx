import { useCallback } from 'react';
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

const nodeTypes = {
  execution: ExecutionNode,
};

// CI/CD Pipeline Flow
const initialNodes: Node[] = [
  {
    id: 'source',
    type: 'execution',
    position: { x: 50, y: 150 },
    data: {
      label: 'Source',
      status: 'success',
      type: 'stage',
      description: 'Git clone & checkout',
      duration: '12s',
    } as ExecutionNodeData,
  },
  {
    id: 'build',
    type: 'execution',
    position: { x: 280, y: 150 },
    data: {
      label: 'Build',
      status: 'success',
      type: 'stage',
      description: 'Compile & package artifacts',
      duration: '2m 34s',
    } as ExecutionNodeData,
  },
  {
    id: 'security-scan',
    type: 'execution',
    position: { x: 510, y: 80 },
    data: {
      label: 'Security Scan',
      status: 'success',
      type: 'stage',
      description: 'SAST, dependency analysis',
      duration: '1m 12s',
    } as ExecutionNodeData,
  },
  {
    id: 'unit-tests',
    type: 'execution',
    position: { x: 510, y: 220 },
    data: {
      label: 'Unit Tests',
      status: 'success',
      type: 'stage',
      description: '847 tests passed',
      duration: '3m 45s',
    } as ExecutionNodeData,
  },
  {
    id: 'checkpoint-1',
    type: 'execution',
    position: { x: 740, y: 150 },
    data: {
      label: 'Build Verified',
      status: 'success',
      type: 'checkpoint',
      description: 'Artifact ready for deployment',
      duration: '0s',
    } as ExecutionNodeData,
  },
  {
    id: 'staging-deploy',
    type: 'execution',
    position: { x: 970, y: 150 },
    data: {
      label: 'Deploy Staging',
      status: 'running',
      type: 'stage',
      description: 'Rolling deployment to staging',
      duration: '4m 22s',
    } as ExecutionNodeData,
  },
  {
    id: 'integration-tests',
    type: 'execution',
    position: { x: 1200, y: 150 },
    data: {
      label: 'Integration Tests',
      status: 'idle',
      type: 'stage',
      description: 'E2E & API validation',
    } as ExecutionNodeData,
  },
  {
    id: 'approval-gate',
    type: 'execution',
    position: { x: 1430, y: 150 },
    data: {
      label: 'Production Approval',
      status: 'idle',
      type: 'gate',
      description: 'Requires 2 approvals',
    } as ExecutionNodeData,
  },
  {
    id: 'prod-deploy',
    type: 'execution',
    position: { x: 1660, y: 150 },
    data: {
      label: 'Deploy Production',
      status: 'idle',
      type: 'stage',
      description: 'Blue-green deployment',
    } as ExecutionNodeData,
  },
  {
    id: 'checkpoint-2',
    type: 'execution',
    position: { x: 1890, y: 150 },
    data: {
      label: 'Production Live',
      status: 'idle',
      type: 'checkpoint',
      description: 'Deployment complete',
    } as ExecutionNodeData,
  },
];

const initialEdges: Edge[] = [
  { id: 'e-source-build', source: 'source', target: 'build', animated: false },
  { id: 'e-build-security', source: 'build', target: 'security-scan', animated: false },
  { id: 'e-build-tests', source: 'build', target: 'unit-tests', animated: false },
  { id: 'e-security-cp1', source: 'security-scan', target: 'checkpoint-1', animated: false },
  { id: 'e-tests-cp1', source: 'unit-tests', target: 'checkpoint-1', animated: false },
  { id: 'e-cp1-staging', source: 'checkpoint-1', target: 'staging-deploy', animated: true },
  { id: 'e-staging-integration', source: 'staging-deploy', target: 'integration-tests', animated: false },
  { id: 'e-integration-approval', source: 'integration-tests', target: 'approval-gate', animated: false },
  { id: 'e-approval-prod', source: 'approval-gate', target: 'prod-deploy', animated: false },
  { id: 'e-prod-cp2', source: 'prod-deploy', target: 'checkpoint-2', animated: false },
];

const FlowCanvas = () => {
  const { setSelectedNodeId, selectedNodeId } = useFlowStore();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  // Apply edge styles based on node status
  const styledEdges = edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const nodeData = sourceNode?.data as ExecutionNodeData | undefined;
    const isActive = nodeData?.status === 'running';
    const isSuccess = nodeData?.status === 'success';
    
    return {
      ...edge,
      style: {
        stroke: isActive 
          ? 'hsl(217 91% 60%)' 
          : isSuccess 
            ? 'hsl(220 18% 35%)' 
            : 'hsl(220 18% 25%)',
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
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={1} 
          color="hsl(220 18% 15%)"
        />
        <Controls 
          showInteractive={false}
          className="!bottom-4 !left-4"
        />
        <MiniMap 
          className="!bottom-4 !right-4"
          nodeColor={(node) => {
            const data = node.data as ExecutionNodeData | undefined;
            const status = data?.status;
            switch (status) {
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
