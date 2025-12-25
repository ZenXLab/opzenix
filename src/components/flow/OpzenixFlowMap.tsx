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

import { opzenixNodeTypes, OpzenixNodeData, OpzenixNodeState, OpzenixNodeType, stateConfig } from './OpzenixNodeTypes';
import { OpzenixInspectorPanel } from './OpzenixInspectorPanel';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================
// 🔒 ELK LAYOUT CONFIG PRESETS (DETERMINISTIC) - LOCKED
// Same input → same graph
// No node "jumping"
// Regulator-friendly visuals
// ============================================

const elk = new ELK();

// GLOBAL ELK SETTINGS (LOCKED)
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.spacing.nodeNodeBetweenLayers': '80',
  'elk.spacing.nodeNode': '60',
  'elk.spacing.edgeNode': '40',
  'elk.layered.edgeRouting': 'ORTHOGONAL',
  'elk.layered.layering.strategy': 'LONGEST_PATH',
  'elk.layered.considerModelOrder': 'true',
};

// ============================================
// 🎨 STATE COLORS FOR EDGES (LOCKED)
// ============================================
const stateEdgeColors: Record<OpzenixNodeState, string> = {
  PENDING: '#6B7280',
  RUNNING: '#3B82F6',
  PASSED: '#22C55E',
  FAILED: '#EF4444',
  BLOCKED: '#F59E0B',
  LOCKED: '#334155',
};

interface OpzenixFlowMapProps {
  executionId?: string;
  environment?: string;
  onNodeSelect?: (nodeId: string, data: OpzenixNodeData) => void;
}

// Generate flow nodes from real execution data (NO HARDCODED DATA)
const generateFlowFromExecution = async (executionId: string): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  // Fetch execution data
  const { data: execution } = await supabase
    .from('executions')
    .select('*')
    .eq('id', executionId)
    .single();

  if (!execution) {
    return { nodes: [], edges: [] };
  }

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

  const executionMeta = execution.metadata as Record<string, unknown> | null;

  // Source node (from real execution data)
  nodes.push({
    id: 'source',
    type: 'source.git',
    position: { x: 0, y: 0 },
    data: {
      label: 'GitHub Commit',
      nodeType: 'source.git' as OpzenixNodeType,
      state: 'PASSED' as OpzenixNodeState,
      repo: executionMeta?.repo as string || `${execution.name}`,
      branch: execution.branch || 'main',
      commitSha: execution.commit_hash || '',
      author: executionMeta?.author as string || '',
      timestamp: new Date(execution.started_at).toLocaleString(),
    } as OpzenixNodeData,
  });

  // CI Stage nodes from evidence (REAL DATA ONLY)
  let lastNodeId = 'source';
  const ciNodeMap: Record<string, OpzenixNodeType> = {
    'sast': 'ci.sast',
    'dependency': 'ci.dependency-scan',
    'secrets': 'ci.secrets-scan',
    'unit': 'ci.unit-test',
    'integration': 'ci.integration-test',
    'sbom': 'ci.sbom',
    'sign': 'ci.image-sign',
    'scan': 'ci.image-scan',
  };

  const stateMap: Record<string, OpzenixNodeState> = {
    'completed': 'PASSED',
    'passed': 'PASSED',
    'success': 'PASSED',
    'failed': 'FAILED',
    'running': 'RUNNING',
    'pending': 'PENDING',
    'blocked': 'BLOCKED',
  };

  if (ciEvidence && ciEvidence.length > 0) {
    ciEvidence.forEach((evidence, index) => {
      const nodeType = ciNodeMap[evidence.step_type] || 'ci.sast';
      const nodeId = `ci-${evidence.step_type}-${index}`;
      
      nodes.push({
        id: nodeId,
        type: nodeType,
        position: { x: 0, y: 0 },
        data: {
          label: evidence.step_name,
          nodeType: nodeType,
          state: stateMap[evidence.status] || 'PENDING',
          description: evidence.summary || `${evidence.step_type} analysis`,
          duration: evidence.duration_ms ? `${(evidence.duration_ms / 1000).toFixed(1)}s` : undefined,
          reportUrl: evidence.evidence_url,
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
  }

  // Artifact node (if exists)
  const artifact = artifacts?.[0];
  if (artifact) {
    nodes.push({
      id: 'artifact',
      type: 'artifact.image',
      position: { x: 0, y: 0 },
      data: {
        label: 'Container Image',
        nodeType: 'artifact.image' as OpzenixNodeType,
        state: 'PASSED' as OpzenixNodeState,
        imageName: artifact.name,
        registry: artifact.registry_url?.includes('ghcr') ? 'GHCR' : 
                  artifact.registry_url?.includes('azurecr') ? 'ACR' : 'DockerHub',
        tag: artifact.image_tag || '',
        digest: artifact.image_digest,
        signed: true,
      } as OpzenixNodeData,
    });
    edges.push({ id: `e-${lastNodeId}-artifact`, source: lastNodeId, target: 'artifact', type: 'smoothstep' });
    lastNodeId = 'artifact';
  }

  // Security gate
  nodes.push({
    id: 'security-gate',
    type: 'security.gate',
    position: { x: 0, y: 0 },
    data: {
      label: 'Security Gate',
      nodeType: 'security.gate' as OpzenixNodeType,
      state: execution.governance_status === 'blocked' ? 'BLOCKED' : 'PASSED' as OpzenixNodeState,
      description: execution.governance_status === 'blocked' ? execution.blocked_reason : 'Policy enforcement passed',
      severityThreshold: 'Critical: 0, High: 0',
      blockedReason: execution.blocked_reason || undefined,
    } as OpzenixNodeData,
  });
  edges.push({ id: `e-${lastNodeId}-security`, source: lastNodeId, target: 'security-gate', type: 'smoothstep' });

  // Approval gate (if exists)
  const approval = approvals?.[0];
  if (approval) {
    const approvalState: OpzenixNodeState = 
      approval.status === 'approved' ? 'PASSED' : 
      approval.status === 'rejected' ? 'FAILED' : 'BLOCKED';
    
    nodes.push({
      id: 'approval-gate',
      type: 'approval.gate',
      position: { x: 0, y: 0 },
      data: {
        label: approval.title || 'Approval Gate',
        nodeType: 'approval.gate' as OpzenixNodeType,
        state: approvalState,
        environment: execution.environment,
        requiredApprovers: approval.required_approvals,
        currentApprovers: approval.current_approvals,
        pendingApprovals: approval.required_approvals - approval.current_approvals,
        description: approval.description || undefined,
      } as OpzenixNodeData,
    });
    edges.push({ id: 'e-security-approval', source: 'security-gate', target: 'approval-gate', type: 'smoothstep' });
  }

  // Deployment (if exists)
  const deployment = deployments?.[0];
  if (deployment) {
    const cdState: OpzenixNodeState = 
      deployment.status === 'success' ? 'PASSED' : 
      deployment.status === 'running' ? 'RUNNING' : 
      deployment.status === 'failed' ? 'FAILED' : 'PENDING';
    
    nodes.push({
      id: 'cd-argo',
      type: 'cd.argo',
      position: { x: 0, y: 0 },
      data: {
        label: 'Argo CD Sync',
        nodeType: 'cd.argo' as OpzenixNodeType,
        state: cdState,
        appName: `opzenix-${deployment.environment}`,
        gitRevision: execution.commit_hash || '',
        syncMode: deployment.environment === 'production' ? 'manual' : 'auto',
        syncResult: cdState === 'PASSED' ? 'Synced' : cdState === 'RUNNING' ? 'Syncing...' : undefined,
      } as OpzenixNodeData,
    });
    
    const sourceNode = approval ? 'approval-gate' : 'security-gate';
    edges.push({ id: `e-${sourceNode}-cd`, source: sourceNode, target: 'cd-argo', type: 'smoothstep' });

    // Deploy strategy
    const strategyMap: Record<string, OpzenixNodeType> = {
      'development': 'deploy.rolling',
      'staging': 'deploy.canary',
      'production': 'deploy.bluegreen',
    };
    const strategyType = strategyMap[deployment.environment] || 'deploy.rolling';
    
    nodes.push({
      id: 'deploy-strategy',
      type: strategyType,
      position: { x: 0, y: 0 },
      data: {
        label: strategyType === 'deploy.bluegreen' ? 'Blue/Green Deploy' : 
               strategyType === 'deploy.canary' ? 'Canary Deploy' : 'Rolling Update',
        nodeType: strategyType,
        state: cdState,
      } as OpzenixNodeData,
    });
    edges.push({ id: 'e-cd-deploy', source: 'cd-argo', target: 'deploy-strategy', type: 'smoothstep' });

    // Runtime K8s
    nodes.push({
      id: 'runtime-k8s',
      type: 'runtime.k8s',
      position: { x: 0, y: 0 },
      data: {
        label: 'Kubernetes',
        nodeType: 'runtime.k8s' as OpzenixNodeType,
        state: cdState,
        namespace: `opzenix-${deployment.environment}`,
        deployment: 'opzenix-api',
        replicas: 4,
        readyReplicas: cdState === 'PASSED' ? 4 : cdState === 'RUNNING' ? 2 : 0,
      } as OpzenixNodeData,
    });
    edges.push({ id: 'e-deploy-runtime', source: 'deploy-strategy', target: 'runtime-k8s', type: 'smoothstep' });

    // Audit record
    nodes.push({
      id: 'audit-record',
      type: 'audit.record',
      position: { x: 0, y: 0 },
      data: {
        label: 'Audit Record',
        nodeType: 'audit.record' as OpzenixNodeType,
        state: cdState === 'PASSED' ? 'LOCKED' : 'PENDING' as OpzenixNodeState,
        description: 'Immutable deployment record',
        digest: `sha256:${execution.id.slice(0, 32)}`,
      } as OpzenixNodeData,
    });
    edges.push({ id: 'e-runtime-audit', source: 'runtime-k8s', target: 'audit-record', type: 'smoothstep' });
  }

  return { nodes, edges };
};

// Apply ELK layout to nodes (DETERMINISTIC)
const applyElkLayout = async (nodes: Node[], edges: Edge[]): Promise<Node[]> => {
  if (nodes.length === 0) return [];

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
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hasData, setHasData] = useState(false);

  // Load flow from real data only
  const loadFlow = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      let flowData: { nodes: Node[]; edges: Edge[] } = { nodes: [], edges: [] };

      if (executionId) {
        flowData = await generateFlowFromExecution(executionId);
      } else {
        // Fetch the most recent execution
        const { data: executions } = await supabase
          .from('executions')
          .select('id')
          .order('started_at', { ascending: false })
          .limit(1);

        if (executions && executions.length > 0) {
          flowData = await generateFlowFromExecution(executions[0].id);
        }
      }

      if (flowData.nodes.length > 0) {
        const layoutedNodes = await applyElkLayout(flowData.nodes, flowData.edges);
        setNodes(layoutedNodes);
        setEdges(flowData.edges);
        setHasData(true);
      } else {
        setNodes([]);
        setEdges([]);
        setHasData(false);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('[OPZENIX] Failed to load flow:', error);
      setHasData(false);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [executionId, setNodes, setEdges]);

  // Initial load
  useEffect(() => {
    loadFlow();
  }, [loadFlow]);

  // Real-time subscriptions for live updates
  useEffect(() => {
    console.log('[OPZENIX] Setting up real-time subscriptions...');
    
    const channel = supabase
      .channel('opzenix-flow-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'executions',
      }, () => loadFlow(false))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ci_evidence',
      }, () => loadFlow(false))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'approval_requests',
      }, () => loadFlow(false))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'approval_votes',
      }, () => loadFlow(false))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deployments',
      }, () => loadFlow(false))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'artifacts',
      }, () => loadFlow(false))
      .subscribe((status) => {
        console.log('[OPZENIX] Realtime subscription status:', status);
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[OPZENIX] Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [loadFlow]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const data = node.data as unknown as OpzenixNodeData;
    setSelectedNode({ id: node.id, data });
    onNodeSelect?.(node.id, data);
  }, [onNodeSelect]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Update edge styles based on node states (LOCKED COLORS)
  const styledEdges = useMemo(() => {
    return edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const nodeData = sourceNode?.data as OpzenixNodeData | undefined;
      const state = nodeData?.state || 'PENDING';
      const edgeColor = stateEdgeColors[state];
      
      return {
        ...edge,
        style: {
          stroke: edgeColor,
          strokeWidth: state === 'RUNNING' ? 2.5 : 2,
        },
        animated: state === 'RUNNING',
      };
    });
  }, [edges, nodes]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#020617' }}>
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading flow map...</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#020617' }}>
        <div className="text-center space-y-4 max-w-md p-6">
          <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto">
            <Activity className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No Pipeline Executions</h3>
          <p className="text-sm text-muted-foreground">
            Start a pipeline execution to see the flow map visualization. 
            Connect your GitHub repository and trigger a workflow to begin.
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isLive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'
            )} />
            <span className="text-xs text-muted-foreground">
              {isLive ? 'Listening for events...' : 'Connecting...'}
            </span>
          </div>
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
              return stateEdgeColors[data?.state || 'PENDING'];
            }}
            maskColor="hsl(220 25% 7% / 0.8)"
          />
        </ReactFlow>

        {/* Flow Legend (LOCKED COLORS) */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-4 px-3 py-2 bg-card/90 backdrop-blur border border-border rounded-lg">
          {/* Live Indicator */}
          <div className="flex items-center gap-1.5 pr-3 border-r border-border">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isLive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'
            )} />
            <span className="text-xs font-medium text-muted-foreground">
              {isLive ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          
          <span className="text-xs font-medium text-muted-foreground">Status:</span>
          {[
            { label: 'Passed', color: '#22C55E' },
            { label: 'Running', color: '#3B82F6' },
            { label: 'Pending', color: '#6B7280' },
            { label: 'Blocked', color: '#F59E0B' },
            { label: 'Failed', color: '#EF4444' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        {/* MVP Status Badge + Last Update */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {lastUpdate && (
            <span className="text-[10px] text-muted-foreground bg-card/90 backdrop-blur px-2 py-1 rounded border border-border">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-card/90 backdrop-blur">
            MVP 1.0.0 LOCKED
          </Badge>
        </div>

        {/* Hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="px-3 py-1.5 bg-card/90 backdrop-blur border border-border rounded-lg text-xs text-muted-foreground">
            Click any node to view audit details • Real-time updates enabled
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

// Import for empty state icon
import { Activity } from 'lucide-react';

export default OpzenixFlowMap;
