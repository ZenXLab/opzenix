import { useCallback, useEffect, useMemo, useState } from 'react';
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
import ELK from 'elkjs/lib/elk.bundled.js';

import { opzenixNodeTypes, OpzenixNodeData, OpzenixNodeState, OpzenixNodeType } from './OpzenixNodeTypes';
import { OpzenixInspectorPanel } from './OpzenixInspectorPanel';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ELK layout options for deterministic left-to-right flow
const elk = new ELK();

const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.layered.nodePlacement.strategy': 'SIMPLE',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.edgeRouting': 'SPLINES',
};

interface OpzenixFlowMapProps {
  executionId?: string;
  environment?: string;
  onNodeSelect?: (nodeId: string, data: OpzenixNodeData) => void;
}

// Generate flow nodes from execution data
const generateFlowFromExecution = async (executionId: string): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  // Fetch execution data
  const { data: execution } = await supabase
    .from('executions')
    .select('*')
    .eq('id', executionId)
    .single();

  // Fetch CI evidence
  const { data: ciEvidence } = await supabase
    .from('ci_evidence')
    .select('*')
    .eq('execution_id', executionId)
    .order('step_order', { ascending: true });

  // Fetch artifacts
  const { data: artifacts } = await supabase
    .from('artifacts')
    .select('*')
    .eq('execution_id', executionId);

  // Fetch approval requests
  const { data: approvals } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('execution_id', executionId);

  // Fetch deployments
  const { data: deployments } = await supabase
    .from('deployments')
    .select('*')
    .eq('execution_id', executionId);

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Source node
  nodes.push({
    id: 'source',
    type: 'source.git',
    position: { x: 0, y: 0 },
    data: {
      label: 'GitHub Commit',
      nodeType: 'source.git' as OpzenixNodeType,
      state: 'PASSED' as OpzenixNodeState,
      repo: (execution?.metadata as Record<string, unknown>)?.repo as string || 'opzenix/platform',
      branch: execution?.branch || 'main',
      commitSha: execution?.commit_hash || 'a1b2c3d4e5f6',
      author: execution?.started_by || 'Developer',
      timestamp: new Date(execution?.started_at || Date.now()).toLocaleString(),
      mvpStatus: 'DONE',
    } as OpzenixNodeData,
  });

  // CI Stage nodes from evidence
  let lastNodeId = 'source';
  const ciNodeMap: Record<string, string> = {
    'sast': 'ci.sast',
    'dependency': 'ci.dependency-scan',
    'secrets': 'ci.secrets-scan',
    'unit': 'ci.unit-test',
    'integration': 'ci.integration-test',
    'sbom': 'ci.sbom',
    'sign': 'ci.image-sign',
    'scan': 'ci.image-scan',
  };

  if (ciEvidence && ciEvidence.length > 0) {
    ciEvidence.forEach((evidence, index) => {
      const nodeType = ciNodeMap[evidence.step_type] || 'ci.sast';
      const nodeId = `ci-${evidence.step_type}-${index}`;
      
      const stateMap: Record<string, OpzenixNodeState> = {
        'completed': 'PASSED',
        'passed': 'PASSED',
        'failed': 'FAILED',
        'running': 'RUNNING',
        'pending': 'PENDING',
      };

      nodes.push({
        id: nodeId,
        type: nodeType,
        position: { x: 0, y: 0 },
        data: {
          label: evidence.step_name,
          nodeType: nodeType as OpzenixNodeType,
          state: stateMap[evidence.status] || 'PENDING',
          description: evidence.summary || `${evidence.step_type} analysis`,
          duration: evidence.duration_ms ? `${(evidence.duration_ms / 1000).toFixed(1)}s` : undefined,
          reportUrl: evidence.evidence_url,
          mvpStatus: 'DONE',
        } as OpzenixNodeData,
      });

      edges.push({
        id: `e-${lastNodeId}-${nodeId}`,
        source: lastNodeId,
        target: nodeId,
        type: 'smoothstep',
      });
      lastNodeId = nodeId;
    });
  } else {
    // Default CI stages if no evidence
    const defaultStages = [
      { id: 'ci-sast', type: 'ci.sast', label: 'SAST', state: 'PASSED' },
      { id: 'ci-deps', type: 'ci.dependency-scan', label: 'Dependency Scan', state: 'PASSED' },
      { id: 'ci-secrets', type: 'ci.secrets-scan', label: 'Secrets Scan', state: 'PASSED' },
      { id: 'ci-unit', type: 'ci.unit-test', label: 'Unit Tests', state: 'PASSED' },
      { id: 'ci-integration', type: 'ci.integration-test', label: 'Integration Tests', state: 'PASSED' },
      { id: 'ci-sbom', type: 'ci.sbom', label: 'SBOM', state: 'PASSED' },
      { id: 'ci-sign', type: 'ci.image-sign', label: 'Image Sign', state: 'PASSED' },
      { id: 'ci-scan', type: 'ci.image-scan', label: 'Image Scan', state: 'PASSED' },
    ];

    defaultStages.forEach((stage, index) => {
      nodes.push({
        id: stage.id,
        type: stage.type,
        position: { x: 0, y: 0 },
        data: {
          label: stage.label,
          nodeType: stage.type as OpzenixNodeType,
          state: stage.state as OpzenixNodeState,
          description: `${stage.label} completed`,
          duration: `${(Math.random() * 60 + 10).toFixed(0)}s`,
          mvpStatus: 'DONE',
        } as OpzenixNodeData,
      });

      edges.push({
        id: `e-${lastNodeId}-${stage.id}`,
        source: lastNodeId,
        target: stage.id,
        type: 'smoothstep',
      });
      lastNodeId = stage.id;
    });
  }

  // Artifact node
  const artifact = artifacts?.[0];
  nodes.push({
    id: 'artifact',
    type: 'artifact.image',
    position: { x: 0, y: 0 },
    data: {
      label: 'Container Image',
      nodeType: 'artifact.image' as OpzenixNodeType,
      state: 'PASSED' as OpzenixNodeState,
      imageName: artifact?.name || 'opzenix/platform',
      registry: artifact?.registry_url?.includes('ghcr') ? 'GHCR' : 'DockerHub',
      tag: artifact?.image_tag || (execution?.metadata as Record<string, unknown>)?.version as string || 'v2.1.0',
      digest: artifact?.image_digest || 'sha256:a1b2c3d4e5f6...',
      signed: true,
      mvpStatus: 'DONE',
    } as OpzenixNodeData,
  });
  edges.push({ id: `e-${lastNodeId}-artifact`, source: lastNodeId, target: 'artifact', type: 'smoothstep' });

  // Security gate
  nodes.push({
    id: 'security-gate',
    type: 'security.gate',
    position: { x: 0, y: 0 },
    data: {
      label: 'Security Gate',
      nodeType: 'security.gate' as OpzenixNodeType,
      state: 'PASSED' as OpzenixNodeState,
      description: 'Policy enforcement passed',
      severityThreshold: 'Critical: 0, High: 0',
      mvpStatus: 'DONE',
    } as OpzenixNodeData,
  });
  edges.push({ id: 'e-artifact-security', source: 'artifact', target: 'security-gate', type: 'smoothstep' });

  // Approval gate
  const approval = approvals?.[0];
  const approvalState = approval?.status === 'approved' ? 'PASSED' : 
                        approval?.status === 'rejected' ? 'FAILED' : 'PENDING';
  
  nodes.push({
    id: 'approval-gate',
    type: 'approval.gate',
    position: { x: 0, y: 0 },
    data: {
      label: 'Production Approval',
      nodeType: 'approval.gate' as OpzenixNodeType,
      state: approvalState as OpzenixNodeState,
      environment: execution?.environment || 'prod',
      requiredApprovers: approval?.required_approvals || 3,
      currentApprovers: approval?.current_approvals || 1,
      pendingApprovals: (approval?.required_approvals || 3) - (approval?.current_approvals || 1),
      approvers: approval?.current_approvals ? [
        { role: 'CTO', user: 'Sarah Chen', timestamp: new Date().toISOString() }
      ] : [],
      mvpStatus: 'DONE',
    } as OpzenixNodeData,
  });
  edges.push({ id: 'e-security-approval', source: 'security-gate', target: 'approval-gate', type: 'smoothstep' });

  // CD Argo node
  const deployment = deployments?.[0];
  const cdState = deployment?.status === 'success' ? 'PASSED' : 
                  deployment?.status === 'running' ? 'RUNNING' : 
                  approvalState === 'PASSED' ? 'RUNNING' : 'PENDING';
  
  nodes.push({
    id: 'cd-argo',
    type: 'cd.argo',
    position: { x: 0, y: 0 },
    data: {
      label: 'Argo CD Sync',
      nodeType: 'cd.argo' as OpzenixNodeType,
      state: cdState as OpzenixNodeState,
      appName: `opzenix-${execution?.environment || 'prod'}`,
      gitRevision: execution?.commit_hash || 'a1b2c3d4',
      syncMode: execution?.environment === 'prod' ? 'manual' : 'auto',
      syncResult: cdState === 'PASSED' ? 'Synced' : cdState === 'RUNNING' ? 'Syncing...' : undefined,
      mvpStatus: 'DONE',
    } as OpzenixNodeData,
  });
  edges.push({ id: 'e-approval-cd', source: 'approval-gate', target: 'cd-argo', type: 'smoothstep' });

  // Deployment strategy node
  const strategyMap: Record<string, OpzenixNodeType> = {
    'dev': 'deploy.rolling',
    'uat': 'deploy.rolling',
    'staging': 'deploy.canary',
    'preprod': 'deploy.canary',
    'prod': 'deploy.bluegreen',
    'production': 'deploy.bluegreen',
  };
  const strategyType = strategyMap[execution?.environment || 'prod'] || 'deploy.bluegreen';
  
  nodes.push({
    id: 'deploy-strategy',
    type: strategyType,
    position: { x: 0, y: 0 },
    data: {
      label: strategyType === 'deploy.bluegreen' ? 'Blue/Green Deploy' : 
             strategyType === 'deploy.canary' ? 'Canary Deploy' : 'Rolling Update',
      nodeType: strategyType,
      state: cdState as OpzenixNodeState,
      mvpStatus: 'DONE',
    } as OpzenixNodeData,
  });
  edges.push({ id: 'e-cd-deploy', source: 'cd-argo', target: 'deploy-strategy', type: 'smoothstep' });

  // Kubernetes runtime node
  nodes.push({
    id: 'runtime-k8s',
    type: 'runtime.k8s',
    position: { x: 0, y: 0 },
    data: {
      label: 'Kubernetes',
      nodeType: 'runtime.k8s' as OpzenixNodeType,
      state: cdState as OpzenixNodeState,
      namespace: `opzenix-${execution?.environment || 'prod'}`,
      deployment: 'opzenix-api',
      replicas: 4,
      readyReplicas: cdState === 'PASSED' ? 4 : cdState === 'RUNNING' ? 2 : 0,
      mvpStatus: 'DONE',
    } as OpzenixNodeData,
  });
  edges.push({ id: 'e-deploy-runtime', source: 'deploy-strategy', target: 'runtime-k8s', type: 'smoothstep' });

  // Verification node
  nodes.push({
    id: 'verify-runtime',
    type: 'verify.runtime',
    position: { x: 0, y: 0 },
    data: {
      label: 'Runtime Verification',
      nodeType: 'verify.runtime' as OpzenixNodeType,
      state: cdState === 'PASSED' ? 'PASSED' : 'PENDING' as OpzenixNodeState,
      description: 'OTel signals, health checks, smoke tests',
      evidenceLinks: [
        { label: 'Metrics', url: '/metrics' },
        { label: 'Traces', url: '/traces' },
      ],
      mvpStatus: 'DONE',
    } as OpzenixNodeData,
  });
  edges.push({ id: 'e-runtime-verify', source: 'runtime-k8s', target: 'verify-runtime', type: 'smoothstep' });

  // Audit record node
  nodes.push({
    id: 'audit-record',
    type: 'audit.record',
    position: { x: 0, y: 0 },
    data: {
      label: 'Audit Record',
      nodeType: 'audit.record' as OpzenixNodeType,
      state: cdState === 'PASSED' ? 'PASSED' : 'PENDING' as OpzenixNodeState,
      description: 'Immutable deployment record',
      digest: `sha256:${execution?.id?.slice(0, 32) || 'a1b2c3d4e5f6g7h8'}`,
      mvpStatus: 'DONE',
    } as OpzenixNodeData,
  });
  edges.push({ id: 'e-verify-audit', source: 'verify-runtime', target: 'audit-record', type: 'smoothstep' });

  return { nodes, edges };
};

// Apply ELK layout to nodes
const applyElkLayout = async (nodes: Node[], edges: Edge[]): Promise<Node[]> => {
  const graph = {
    id: 'root',
    layoutOptions: elkOptions,
    children: nodes.map((node) => ({
      id: node.id,
      width: 220,
      height: 100,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layoutedGraph = await elk.layout(graph);

  return nodes.map((node) => {
    const layoutedNode = layoutedGraph.children?.find((n) => n.id === node.id);
    return {
      ...node,
      position: {
        x: layoutedNode?.x || 0,
        y: layoutedNode?.y || 0,
      },
    };
  });
};

export const OpzenixFlowMap = ({ executionId, environment = 'prod', onNodeSelect }: OpzenixFlowMapProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<{ id: string; data: OpzenixNodeData } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load and layout flow
  useEffect(() => {
    const loadFlow = async () => {
      setLoading(true);
      try {
        const { nodes: flowNodes, edges: flowEdges } = executionId 
          ? await generateFlowFromExecution(executionId)
          : await generateDefaultFlow();
        
        const layoutedNodes = await applyElkLayout(flowNodes, flowEdges);
        setNodes(layoutedNodes);
        setEdges(flowEdges.map(edge => ({
          ...edge,
          style: { stroke: 'hsl(220 15% 30%)', strokeWidth: 2 },
          animated: false,
        })));
      } catch (error) {
        console.error('Failed to load flow:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFlow();
  }, [executionId, setNodes, setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const data = node.data as unknown as OpzenixNodeData;
    setSelectedNode({ id: node.id, data });
    onNodeSelect?.(node.id, data);
  }, [onNodeSelect]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Update edge styles based on node states
  const styledEdges = useMemo(() => {
    return edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const nodeData = sourceNode?.data as OpzenixNodeData | undefined;
      const isRunning = nodeData?.state === 'RUNNING';
      const isPassed = nodeData?.state === 'PASSED';
      
      return {
        ...edge,
        style: {
          stroke: isRunning ? 'hsl(217 91% 60%)' : isPassed ? 'hsl(142 76% 36%)' : 'hsl(220 15% 30%)',
          strokeWidth: isRunning ? 2.5 : 2,
        },
        animated: isRunning,
      };
    });
  }, [edges, nodes]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading flow map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes.map(n => ({ ...n, selected: n.id === selectedNode?.id }))}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={opzenixNodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={1.5}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="hsl(220 18% 12%)" />
          <Controls showInteractive={false} className="!bottom-4 !left-4" />
          <MiniMap 
            className="!bottom-4 !right-4"
            nodeColor={(node) => {
              const data = node.data as unknown as OpzenixNodeData | undefined;
              switch (data?.state) {
                case 'RUNNING': return 'hsl(217 91% 60%)';
                case 'PASSED': return 'hsl(142 76% 36%)';
                case 'PENDING': return 'hsl(38 92% 50%)';
                case 'FAILED': return 'hsl(0 84% 60%)';
                case 'BLOCKED': return 'hsl(0 84% 60%)';
                default: return 'hsl(220 15% 45%)';
              }
            }}
            maskColor="hsl(220 25% 7% / 0.8)"
          />
        </ReactFlow>

        {/* Flow Legend */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-4 px-3 py-2 bg-card/90 backdrop-blur border border-border rounded-lg">
          <span className="text-xs font-medium text-muted-foreground">Status:</span>
          {[
            { label: 'Passed', color: 'bg-emerald-500' },
            { label: 'Running', color: 'bg-blue-500' },
            { label: 'Pending', color: 'bg-amber-500' },
            { label: 'Failed', color: 'bg-red-500' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={cn('w-2 h-2 rounded-full', item.color)} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        {/* MVP Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-card/90 backdrop-blur">
            MVP 1.0.0 LOCKED
          </Badge>
        </div>

        {/* Hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="px-3 py-1.5 bg-card/90 backdrop-blur border border-border rounded-lg text-xs text-muted-foreground">
            Click any node to view audit details
          </div>
        </div>
      </div>

      {/* Inspector Panel */}
      {selectedNode && (
        <OpzenixInspectorPanel
          nodeId={selectedNode.id}
          nodeData={selectedNode.data}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};

// Generate default flow when no execution is selected
const generateDefaultFlow = async (): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  // Fetch the most recent execution
  const { data: executions } = await supabase
    .from('executions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1);

  if (executions && executions.length > 0) {
    return generateFlowFromExecution(executions[0].id);
  }

  // Fallback to static demo flow
  const nodes: Node[] = [
    {
      id: 'source',
      type: 'source.git',
      position: { x: 0, y: 0 },
      data: {
        label: 'GitHub Commit',
        nodeType: 'source.git',
        state: 'PASSED',
        repo: 'opzenix/platform',
        branch: 'main',
        commitSha: 'a1b2c3d4e5f6',
        author: 'Developer',
        timestamp: new Date().toLocaleString(),
        mvpStatus: 'DONE',
      } as OpzenixNodeData,
    },
    {
      id: 'ci-sast',
      type: 'ci.sast',
      position: { x: 0, y: 0 },
      data: {
        label: 'SAST',
        nodeType: 'ci.sast',
        state: 'PASSED',
        description: 'Static analysis complete',
        duration: '45s',
        mvpStatus: 'DONE',
      } as OpzenixNodeData,
    },
    {
      id: 'ci-deps',
      type: 'ci.dependency-scan',
      position: { x: 0, y: 0 },
      data: {
        label: 'Dependency Scan',
        nodeType: 'ci.dependency-scan',
        state: 'PASSED',
        description: '0 vulnerabilities found',
        duration: '32s',
        mvpStatus: 'DONE',
      } as OpzenixNodeData,
    },
    {
      id: 'ci-secrets',
      type: 'ci.secrets-scan',
      position: { x: 0, y: 0 },
      data: {
        label: 'Secrets Scan',
        nodeType: 'ci.secrets-scan',
        state: 'PASSED',
        description: 'No secrets detected',
        duration: '12s',
        mvpStatus: 'DONE',
      } as OpzenixNodeData,
    },
    {
      id: 'ci-unit',
      type: 'ci.unit-test',
      position: { x: 0, y: 0 },
      data: {
        label: 'Unit Tests',
        nodeType: 'ci.unit-test',
        state: 'PASSED',
        description: '847 tests passed',
        duration: '187s',
        mvpStatus: 'DONE',
      } as OpzenixNodeData,
    },
    {
      id: 'artifact',
      type: 'artifact.image',
      position: { x: 0, y: 0 },
      data: {
        label: 'Container Image',
        nodeType: 'artifact.image',
        state: 'PASSED',
        imageName: 'opzenix/platform',
        registry: 'GHCR',
        tag: 'v2.1.0',
        digest: 'sha256:a1b2c3d4e5f6...',
        signed: true,
        mvpStatus: 'DONE',
      } as OpzenixNodeData,
    },
    {
      id: 'approval-gate',
      type: 'approval.gate',
      position: { x: 0, y: 0 },
      data: {
        label: 'Production Approval',
        nodeType: 'approval.gate',
        state: 'PENDING',
        environment: 'prod',
        requiredApprovers: 3,
        currentApprovers: 1,
        pendingApprovals: 2,
        approvers: [
          { role: 'CTO', user: 'Sarah Chen', timestamp: new Date().toISOString() }
        ],
        mvpStatus: 'DONE',
      } as OpzenixNodeData,
    },
    {
      id: 'cd-argo',
      type: 'cd.argo',
      position: { x: 0, y: 0 },
      data: {
        label: 'Argo CD Sync',
        nodeType: 'cd.argo',
        state: 'PENDING',
        appName: 'opzenix-prod',
        gitRevision: 'a1b2c3d4',
        syncMode: 'manual',
        mvpStatus: 'DONE',
      } as OpzenixNodeData,
    },
    {
      id: 'deploy-strategy',
      type: 'deploy.bluegreen',
      position: { x: 0, y: 0 },
      data: {
        label: 'Blue/Green Deploy',
        nodeType: 'deploy.bluegreen',
        state: 'LOCKED',
        mvpStatus: 'DONE',
      } as OpzenixNodeData,
    },
    {
      id: 'audit-record',
      type: 'audit.record',
      position: { x: 0, y: 0 },
      data: {
        label: 'Audit Record',
        nodeType: 'audit.record',
        state: 'LOCKED',
        description: 'Immutable deployment record',
        digest: 'sha256:pending...',
        mvpStatus: 'DONE',
      } as OpzenixNodeData,
    },
  ];

  const edges: Edge[] = [
    { id: 'e-source-sast', source: 'source', target: 'ci-sast', type: 'smoothstep' },
    { id: 'e-sast-deps', source: 'ci-sast', target: 'ci-deps', type: 'smoothstep' },
    { id: 'e-deps-secrets', source: 'ci-deps', target: 'ci-secrets', type: 'smoothstep' },
    { id: 'e-secrets-unit', source: 'ci-secrets', target: 'ci-unit', type: 'smoothstep' },
    { id: 'e-unit-artifact', source: 'ci-unit', target: 'artifact', type: 'smoothstep' },
    { id: 'e-artifact-approval', source: 'artifact', target: 'approval-gate', type: 'smoothstep' },
    { id: 'e-approval-cd', source: 'approval-gate', target: 'cd-argo', type: 'smoothstep' },
    { id: 'e-cd-deploy', source: 'cd-argo', target: 'deploy-strategy', type: 'smoothstep' },
    { id: 'e-deploy-audit', source: 'deploy-strategy', target: 'audit-record', type: 'smoothstep' },
  ];

  return { nodes, edges };
};

export default OpzenixFlowMap;
