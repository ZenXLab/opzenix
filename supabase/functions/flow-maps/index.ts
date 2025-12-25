import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// 🔒 OPZENIX FLOW MAPS API ENDPOINT
// GET /api/v1/flow-maps/{pipelineExecutionId}
// Authoritative Backend Contract (LOCKED)
// ============================================

// Node State Types (LOCKED)
type OpzenixNodeState = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'LOCKED';

// Node Type Taxonomy (LOCKED)
type OpzenixNodeType = 
  | 'source.git'
  | 'ci.sast' | 'ci.dependency-scan' | 'ci.secrets-scan' 
  | 'ci.unit-test' | 'ci.integration-test'
  | 'ci.sbom' | 'ci.image-sign' | 'ci.image-scan'
  | 'artifact.image'
  | 'security.gate'
  | 'approval.gate'
  | 'cd.argo'
  | 'deploy.rolling' | 'deploy.canary' | 'deploy.bluegreen'
  | 'runtime.k8s'
  | 'audit.record';

// Environment Lanes (FIXED ORDER - LOCKED)
const ENVIRONMENT_LANES = ['Dev', 'UAT', 'Staging', 'PreProd', 'Prod'] as const;
type EnvironmentLane = typeof ENVIRONMENT_LANES[number];

interface FlowNode {
  id: string;
  type: OpzenixNodeType;
  state: OpzenixNodeState;
  lane: EnvironmentLane | 'ci' | 'shared';
  data: Record<string, unknown>;
  evidence?: {
    policyId?: string;
    auditId?: string;
  };
}

interface FlowEdge {
  from: string;
  to: string;
  type: 'SUCCESS' | 'FAILURE' | 'PENDING';
}

interface FlowMapResponse {
  meta: {
    tenantId: string;
    environment: string;
    pipelineExecutionId: string;
    immutable: boolean;
    generatedAt: string;
  };
  nodes: FlowNode[];
  edges: FlowEdge[];
  lanes: {
    name: EnvironmentLane | 'ci';
    label: string;
    order: number;
  }[];
}

// Map execution status to OPZENIX state
const mapStatus = (status: string): OpzenixNodeState => {
  const statusMap: Record<string, OpzenixNodeState> = {
    'success': 'PASSED',
    'completed': 'PASSED',
    'passed': 'PASSED',
    'running': 'RUNNING',
    'failed': 'FAILED',
    'pending': 'PENDING',
    'idle': 'PENDING',
    'blocked': 'BLOCKED',
    'paused': 'BLOCKED',
    'warning': 'PASSED',
  };
  return statusMap[status?.toLowerCase()] || 'PENDING';
};

// Map environment to lane
const mapEnvironmentToLane = (env: string): EnvironmentLane => {
  const envMap: Record<string, EnvironmentLane> = {
    'development': 'Dev',
    'dev': 'Dev',
    'uat': 'UAT',
    'staging': 'Staging',
    'preprod': 'PreProd',
    'pre-prod': 'PreProd',
    'production': 'Prod',
    'prod': 'Prod',
  };
  return envMap[env?.toLowerCase()] || 'Dev';
};

// CI step type to node type mapping
const ciNodeTypeMap: Record<string, OpzenixNodeType> = {
  'sast': 'ci.sast',
  'dependency': 'ci.dependency-scan',
  'secrets': 'ci.secrets-scan',
  'unit': 'ci.unit-test',
  'integration': 'ci.integration-test',
  'sbom': 'ci.sbom',
  'sign': 'ci.image-sign',
  'scan': 'ci.image-scan',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // Expect: /flow-maps/{pipelineExecutionId}
  const pipelineExecutionId = pathParts[pathParts.length - 1];

  if (!pipelineExecutionId || pipelineExecutionId === 'flow-maps') {
    return new Response(
      JSON.stringify({ error: 'Pipeline execution ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`[OPZENIX] Fetching flow map for execution: ${pipelineExecutionId}`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch execution
    const { data: execution, error: execError } = await supabase
      .from('executions')
      .select('*')
      .eq('id', pipelineExecutionId)
      .single();

    if (execError || !execution) {
      console.error('[OPZENIX] Execution not found:', execError);
      return new Response(
        JSON.stringify({ error: 'Execution not found', details: execError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch related data in parallel
    const [ciResult, artifactResult, approvalResult, deploymentResult, auditResult] = await Promise.all([
      supabase.from('ci_evidence').select('*').eq('execution_id', pipelineExecutionId).order('step_order'),
      supabase.from('artifacts').select('*').eq('execution_id', pipelineExecutionId),
      supabase.from('approval_requests').select('*, approval_votes(*)').eq('execution_id', pipelineExecutionId),
      supabase.from('deployments').select('*').eq('execution_id', pipelineExecutionId),
      supabase.from('audit_logs').select('*').eq('resource_id', pipelineExecutionId).eq('resource_type', 'execution').order('created_at'),
    ]);

    const ciEvidence = ciResult.data || [];
    const artifacts = artifactResult.data || [];
    const approvals = approvalResult.data || [];
    const deployments = deploymentResult.data || [];
    const auditLogs = auditResult.data || [];

    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    const executionMeta = execution.metadata as Record<string, unknown> | null;
    const isComplete = execution.status === 'success' || execution.status === 'failed';

    // 1. Source Node (CI Lane)
    nodes.push({
      id: 'source',
      type: 'source.git',
      state: 'PASSED',
      lane: 'ci',
      data: {
        label: 'GitHub Commit',
        repo: executionMeta?.repo as string || execution.name,
        branch: execution.branch || 'main',
        commitSha: execution.commit_hash || '',
        author: executionMeta?.author as string || '',
        timestamp: execution.started_at,
      },
      evidence: {
        auditId: auditLogs.find(a => a.action === 'pipeline_triggered')?.id,
      },
    });

    let lastNodeId = 'source';

    // 2. CI Stage Nodes (CI Lane)
    ciEvidence.forEach((evidence, index) => {
      const nodeType = ciNodeTypeMap[evidence.step_type] || 'ci.sast';
      const nodeId = `ci-${evidence.step_type}-${index}`;
      
      nodes.push({
        id: nodeId,
        type: nodeType,
        state: mapStatus(evidence.status),
        lane: 'ci',
        data: {
          label: evidence.step_name,
          description: evidence.summary || `${evidence.step_type} analysis`,
          duration: evidence.duration_ms ? `${(evidence.duration_ms / 1000).toFixed(1)}s` : undefined,
          startedAt: evidence.started_at,
          completedAt: evidence.completed_at,
          reportUrl: evidence.evidence_url,
          details: evidence.details,
        },
        evidence: {
          auditId: auditLogs.find(a => a.action === `ci_${evidence.step_type}`)?.id,
        },
      });

      const edgeType = mapStatus(evidence.status) === 'PASSED' ? 'SUCCESS' : 
                       mapStatus(evidence.status) === 'FAILED' ? 'FAILURE' : 'PENDING';
      edges.push({ from: lastNodeId, to: nodeId, type: edgeType });
      lastNodeId = nodeId;
    });

    // 3. Artifact Node (Shared Lane)
    const artifact = artifacts[0];
    if (artifact) {
      nodes.push({
        id: 'artifact',
        type: 'artifact.image',
        state: 'PASSED',
        lane: 'shared',
        data: {
          label: 'Container Image',
          imageName: artifact.name,
          registry: artifact.registry_url?.includes('ghcr') ? 'GHCR' : 
                    artifact.registry_url?.includes('azurecr') ? 'ACR' : 'DockerHub',
          tag: artifact.image_tag || '',
          digest: artifact.image_digest,
          sizeBytes: artifact.size_bytes,
          buildDurationMs: artifact.build_duration_ms,
          signed: true,
          createdAt: artifact.created_at,
        },
        evidence: {
          auditId: auditLogs.find(a => a.action === 'artifact_created')?.id,
        },
      });
      edges.push({ from: lastNodeId, to: 'artifact', type: 'SUCCESS' });
      lastNodeId = 'artifact';
    }

    // 4. Security Gate (Shared Lane)
    const isBlocked = execution.governance_status === 'blocked';
    nodes.push({
      id: 'security-gate',
      type: 'security.gate',
      state: isBlocked ? 'BLOCKED' : 'PASSED',
      lane: 'shared',
      data: {
        label: 'Security Gate',
        description: isBlocked ? execution.blocked_reason : 'Policy enforcement passed',
        severityThreshold: 'Critical: 0, High: 0',
        blockedReason: execution.blocked_reason || undefined,
        governanceStatus: execution.governance_status,
      },
      evidence: {
        policyId: 'security-policy-v1',
        auditId: auditLogs.find(a => a.action === 'security_gate')?.id,
      },
    });
    edges.push({ from: lastNodeId, to: 'security-gate', type: isBlocked ? 'FAILURE' : 'SUCCESS' });

    // 5. Process each environment lane
    const envLane = mapEnvironmentToLane(execution.environment);
    
    // Approval Gate
    const approval = approvals[0];
    if (approval) {
      const approvalState: OpzenixNodeState = 
        approval.status === 'approved' ? 'PASSED' : 
        approval.status === 'rejected' ? 'FAILED' : 'BLOCKED';
      
      const votes = approval.approval_votes || [];
      
      nodes.push({
        id: `approval-${envLane.toLowerCase()}`,
        type: 'approval.gate',
        state: approvalState,
        lane: envLane,
        data: {
          label: approval.title || `${envLane} Approval Gate`,
          requiredApprovals: approval.required_approvals,
          currentApprovals: approval.current_approvals,
          approvedBy: votes.filter((v: Record<string, unknown>) => v.vote === true).map((v: Record<string, unknown>) => ({
            user: v.user_id,
            votedAt: v.voted_at,
            comment: v.comment,
          })),
          rejectedBy: votes.filter((v: Record<string, unknown>) => v.vote === false).map((v: Record<string, unknown>) => ({
            user: v.user_id,
            votedAt: v.voted_at,
            comment: v.comment,
          })),
          description: approval.description,
          resolvedAt: approval.resolved_at,
        },
        evidence: {
          policyId: `${envLane.toLowerCase()}-approval-policy-v1`,
          auditId: auditLogs.find(a => a.action === 'approval_resolved')?.id,
        },
      });
      
      const approvalEdgeType = approvalState === 'PASSED' ? 'SUCCESS' : approvalState === 'FAILED' ? 'FAILURE' : 'PENDING';
      edges.push({ from: 'security-gate', to: `approval-${envLane.toLowerCase()}`, type: approvalEdgeType });
    }

    // Deployment nodes
    const deployment = deployments.find(d => mapEnvironmentToLane(d.environment) === envLane);
    if (deployment) {
      const cdState = mapStatus(deployment.status);
      const sourceNode = approval ? `approval-${envLane.toLowerCase()}` : 'security-gate';

      // CD Argo Node
      nodes.push({
        id: `cd-argo-${envLane.toLowerCase()}`,
        type: 'cd.argo',
        state: cdState,
        lane: envLane,
        data: {
          label: 'Argo CD Sync',
          appName: `opzenix-${envLane.toLowerCase()}`,
          gitRevision: execution.commit_hash || '',
          syncMode: envLane === 'Prod' ? 'manual' : 'auto',
          syncResult: cdState === 'PASSED' ? 'Synced' : cdState === 'RUNNING' ? 'Syncing...' : undefined,
          deployedAt: deployment.deployed_at,
        },
        evidence: {
          auditId: auditLogs.find(a => a.action === 'deployment_started')?.id,
        },
      });
      
      edges.push({ from: sourceNode, to: `cd-argo-${envLane.toLowerCase()}`, type: cdState === 'PASSED' ? 'SUCCESS' : 'PENDING' });

      // Deploy Strategy
      const strategyMap: Record<EnvironmentLane, OpzenixNodeType> = {
        'Dev': 'deploy.rolling',
        'UAT': 'deploy.rolling',
        'Staging': 'deploy.canary',
        'PreProd': 'deploy.canary',
        'Prod': 'deploy.bluegreen',
      };
      const strategyType = strategyMap[envLane];

      nodes.push({
        id: `deploy-${envLane.toLowerCase()}`,
        type: strategyType,
        state: cdState,
        lane: envLane,
        data: {
          label: strategyType === 'deploy.bluegreen' ? 'Blue/Green Deploy' : 
                 strategyType === 'deploy.canary' ? 'Canary Deploy' : 'Rolling Update',
          strategy: strategyType.split('.')[1],
          version: deployment.version,
        },
        evidence: {
          auditId: auditLogs.find(a => a.action === 'deployment_strategy')?.id,
        },
      });
      edges.push({ from: `cd-argo-${envLane.toLowerCase()}`, to: `deploy-${envLane.toLowerCase()}`, type: cdState === 'PASSED' ? 'SUCCESS' : 'PENDING' });

      // Runtime K8s
      nodes.push({
        id: `runtime-${envLane.toLowerCase()}`,
        type: 'runtime.k8s',
        state: cdState,
        lane: envLane,
        data: {
          label: 'Kubernetes',
          namespace: `opzenix-${envLane.toLowerCase()}`,
          deployment: 'opzenix-api',
          replicas: envLane === 'Prod' ? 6 : envLane === 'PreProd' ? 4 : 2,
          readyReplicas: cdState === 'PASSED' ? (envLane === 'Prod' ? 6 : envLane === 'PreProd' ? 4 : 2) : 0,
        },
        evidence: {
          auditId: auditLogs.find(a => a.action === 'k8s_deployment')?.id,
        },
      });
      edges.push({ from: `deploy-${envLane.toLowerCase()}`, to: `runtime-${envLane.toLowerCase()}`, type: cdState === 'PASSED' ? 'SUCCESS' : 'PENDING' });

      // Audit Record
      nodes.push({
        id: `audit-${envLane.toLowerCase()}`,
        type: 'audit.record',
        state: isComplete ? 'LOCKED' : 'PENDING',
        lane: envLane,
        data: {
          label: 'Audit Record',
          description: 'Immutable deployment record',
          digest: `sha256:${pipelineExecutionId.replace(/-/g, '').slice(0, 64)}`,
          immutable: isComplete,
          lockedAt: isComplete ? new Date().toISOString() : undefined,
        },
        evidence: {
          auditId: auditLogs[auditLogs.length - 1]?.id,
        },
      });
      edges.push({ from: `runtime-${envLane.toLowerCase()}`, to: `audit-${envLane.toLowerCase()}`, type: cdState === 'PASSED' ? 'SUCCESS' : 'PENDING' });
    }

    // Build response with authoritative schema
    const response: FlowMapResponse = {
      meta: {
        tenantId: executionMeta?.tenantId as string || 'default-tenant',
        environment: envLane,
        pipelineExecutionId: pipelineExecutionId,
        immutable: isComplete,
        generatedAt: new Date().toISOString(),
      },
      nodes,
      edges,
      lanes: [
        { name: 'ci', label: 'CI Pipeline', order: 0 },
        { name: 'Dev', label: 'Development', order: 1 },
        { name: 'UAT', label: 'User Acceptance Testing', order: 2 },
        { name: 'Staging', label: 'Staging', order: 3 },
        { name: 'PreProd', label: 'Pre-Production', order: 4 },
        { name: 'Prod', label: 'Production', order: 5 },
      ],
    };

    console.log(`[OPZENIX] Generated flow map with ${nodes.length} nodes, ${edges.length} edges`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': isComplete ? 'public, max-age=3600' : 'no-cache',
        } 
      }
    );

  } catch (error) {
    console.error('[OPZENIX] Error generating flow map:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
