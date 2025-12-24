import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PipelineNode {
  id: string;
  type: string;
  data: {
    label: string;
    stageType: string;
    status: string;
    description?: string;
  };
  position: { x: number; y: number };
}

interface PipelineEdge {
  id: string;
  source: string;
  target: string;
}

interface ExecutionRequest {
  pipelineId?: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  environment: string;
  branch?: string;
  commitHash?: string;
  flowType?: string;
}

// Simulated execution timing (ms) - in real implementation, this would be webhooks from external systems
const STAGE_TIMINGS: Record<string, { min: number; max: number; failRate: number }> = {
  source: { min: 1000, max: 3000, failRate: 0.02 },
  build: { min: 5000, max: 15000, failRate: 0.05 },
  test: { min: 3000, max: 10000, failRate: 0.08 },
  security: { min: 4000, max: 12000, failRate: 0.03 },
  checkpoint: { min: 500, max: 1500, failRate: 0.01 },
  approval: { min: 100, max: 500, failRate: 0 }, // Approval is manual
  deploy: { min: 8000, max: 20000, failRate: 0.04 },
  rollback: { min: 2000, max: 5000, failRate: 0.02 },
  parallel: { min: 1000, max: 2000, failRate: 0.01 },
};

function getRandomTiming(stageType: string): number {
  const timing = STAGE_TIMINGS[stageType] || { min: 2000, max: 5000 };
  return Math.floor(Math.random() * (timing.max - timing.min) + timing.min);
}

function shouldFail(stageType: string): boolean {
  const timing = STAGE_TIMINGS[stageType] || { failRate: 0.05 };
  return Math.random() < timing.failRate;
}

function generateLogs(stageType: string, label: string, status: string): string[] {
  const timestamp = new Date().toISOString();
  const logs: string[] = [];
  
  if (status === 'running') {
    logs.push(`[${timestamp}] Starting ${label}...`);
    logs.push(`[${timestamp}] Initializing ${stageType} stage`);
  } else if (status === 'success') {
    logs.push(`[${timestamp}] ${label} completed successfully`);
    if (stageType === 'test') {
      logs.push(`[${timestamp}] All tests passed (${Math.floor(Math.random() * 100 + 50)} tests)`);
    } else if (stageType === 'security') {
      logs.push(`[${timestamp}] No vulnerabilities found`);
    } else if (stageType === 'build') {
      logs.push(`[${timestamp}] Build artifacts created`);
    }
  } else if (status === 'failed') {
    logs.push(`[${timestamp}] ERROR: ${label} failed`);
    if (stageType === 'test') {
      logs.push(`[${timestamp}] ${Math.floor(Math.random() * 5 + 1)} tests failed`);
    } else if (stageType === 'build') {
      logs.push(`[${timestamp}] Build error: compilation failed`);
    }
  }
  
  return logs;
}

// Topological sort to determine execution order
function getExecutionOrder(nodes: PipelineNode[], edges: PipelineEdge[]): string[] {
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();
  
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    adjacencyList.set(node.id, []);
  });
  
  edges.forEach(edge => {
    adjacencyList.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });
  
  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId);
  });
  
  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    
    adjacencyList.get(current)?.forEach(neighbor => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    });
  }
  
  return order;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ExecutionRequest = await req.json();
    const { nodes, edges, environment, branch, commitHash, flowType } = body;

    console.log(`[pipeline-execute] Starting execution with ${nodes.length} nodes`);

    // 1. Create execution record
    const executionName = `pipeline-${Date.now().toString(36)}`;
    const { data: execution, error: execError } = await supabase
      .from('executions')
      .insert({
        name: executionName,
        status: 'running',
        environment: environment || 'development',
        branch: branch || 'main',
        commit_hash: commitHash || `${Date.now().toString(16).slice(0, 7)}`,
        progress: 0,
        metadata: { flowType, nodeCount: nodes.length },
      })
      .select()
      .single();

    if (execError) {
      console.error('[pipeline-execute] Failed to create execution:', execError);
      throw execError;
    }

    console.log(`[pipeline-execute] Created execution: ${execution.id}`);

    // 2. Create execution_nodes records for all nodes
    const executionNodes = nodes.map(node => ({
      execution_id: execution.id,
      node_id: node.id,
      status: 'idle',
      metadata: {
        label: node.data.label,
        stageType: node.data.stageType,
        position: node.position,
      },
    }));

    const { error: nodesError } = await supabase
      .from('execution_nodes')
      .insert(executionNodes);

    if (nodesError) {
      console.error('[pipeline-execute] Failed to create execution nodes:', nodesError);
    }

    // 3. Get execution order via topological sort
    const executionOrder = getExecutionOrder(nodes, edges);
    console.log(`[pipeline-execute] Execution order: ${executionOrder.join(' → ')}`);

    // 4. Start background execution simulation
    // In production, this would trigger external CI/CD systems
    // Using waitUntil for background processing
    (globalThis as any).EdgeRuntime?.waitUntil?.(
      simulateExecution(supabase, execution.id, nodes, executionOrder)
    ) || simulateExecution(supabase, execution.id, nodes, executionOrder);

    return new Response(
      JSON.stringify({
        success: true,
        executionId: execution.id,
        executionName,
        nodeCount: nodes.length,
        executionOrder,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[pipeline-execute] Error:', message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function simulateExecution(
  supabase: any,
  executionId: string,
  nodes: PipelineNode[],
  executionOrder: string[]
) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  let failedNode: string | null = null;
  let completedNodes = 0;
  
  console.log(`[pipeline-execute] Starting simulation for ${executionOrder.length} nodes`);

  for (const nodeId of executionOrder) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const stageType = node.data.stageType;
    const label = node.data.label;

    // Skip if previous node failed (except for rollback which can run after failure)
    if (failedNode && stageType !== 'rollback') {
      await updateNodeStatus(supabase, executionId, nodeId, 'idle', []);
      continue;
    }

    // Special handling for approval gates - pause execution
    if (stageType === 'approval') {
      console.log(`[pipeline-execute] Pausing at approval gate: ${nodeId}`);
      await updateNodeStatus(supabase, executionId, nodeId, 'paused', 
        generateLogs(stageType, label, 'running'));
      
      await supabase
        .from('executions')
        .update({ status: 'paused', progress: Math.round((completedNodes / nodes.length) * 100) })
        .eq('id', executionId);
      
      // Create approval request
      await supabase
        .from('approval_requests')
        .insert({
          execution_id: executionId,
          node_id: nodeId,
          title: `Approval Required: ${label}`,
          description: `Pipeline execution requires approval to proceed past ${label}`,
          status: 'pending',
          required_approvals: 1,
        });
      
      return; // Stop execution here - will resume via webhook when approved
    }

    // Update node to running
    const runningLogs = generateLogs(stageType, label, 'running');
    await updateNodeStatus(supabase, executionId, nodeId, 'running', runningLogs);
    
    // Simulate execution time
    const duration = getRandomTiming(stageType);
    await sleep(duration);

    // Determine success or failure
    const failed = shouldFail(stageType);
    const finalStatus = failed ? 'failed' : 'success';
    const finalLogs = [...runningLogs, ...generateLogs(stageType, label, finalStatus)];
    
    await updateNodeStatus(supabase, executionId, nodeId, finalStatus, finalLogs, duration);

    if (failed) {
      failedNode = nodeId;
      console.log(`[pipeline-execute] Node ${nodeId} failed`);
      
      // Update execution status
      await supabase
        .from('executions')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', executionId);
      
      // Create telemetry signal for failure
      await supabase
        .from('telemetry_signals')
        .insert({
          signal_type: 'log',
          node_id: nodeId,
          execution_id: executionId,
          severity: 'error',
          summary: `${label} failed after ${duration}ms`,
          payload: { logs: finalLogs, duration },
        });
      
      return;
    }

    completedNodes++;
    const progress = Math.round((completedNodes / nodes.length) * 100);
    
    // Update execution progress
    await supabase
      .from('executions')
      .update({ progress })
      .eq('id', executionId);

    // Create checkpoint if this is a checkpoint node
    if (stageType === 'checkpoint') {
      await supabase
        .from('checkpoints')
        .insert({
          execution_id: executionId,
          node_id: nodeId,
          name: label,
          state: {
            completedNodes: completedNodes,
            timestamp: new Date().toISOString(),
          },
        });
      console.log(`[pipeline-execute] Created checkpoint at ${nodeId}`);
    }

    // Create telemetry signal
    await supabase
      .from('telemetry_signals')
      .insert({
        signal_type: 'trace',
        node_id: nodeId,
        execution_id: executionId,
        severity: 'info',
        summary: `${label} completed in ${duration}ms`,
        duration_ms: duration,
        payload: { logs: finalLogs },
      });

    console.log(`[pipeline-execute] Completed ${nodeId} in ${duration}ms (${progress}%)`);
  }

  // All nodes completed successfully
  await supabase
    .from('executions')
    .update({ 
      status: 'success', 
      progress: 100,
      completed_at: new Date().toISOString(),
    })
    .eq('id', executionId);

  console.log(`[pipeline-execute] Execution ${executionId} completed successfully`);
}

async function updateNodeStatus(
  supabase: any,
  executionId: string,
  nodeId: string,
  status: string,
  logs: string[],
  durationMs?: number
) {
  const update: any = {
    status,
    logs,
  };
  
  if (status === 'running') {
    update.started_at = new Date().toISOString();
  } else if (status === 'success' || status === 'failed') {
    update.completed_at = new Date().toISOString();
    if (durationMs) update.duration_ms = durationMs;
  }

  await supabase
    .from('execution_nodes')
    .update(update)
    .eq('execution_id', executionId)
    .eq('node_id', nodeId);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
