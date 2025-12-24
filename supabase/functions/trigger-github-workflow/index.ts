import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TriggerRequest {
  execution_id: string;
  nodes: Array<{
    id: string;
    type: string;
    data: any;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
  github_config?: {
    owner: string;
    repo: string;
    workflow_file: string;
    branch: string;
    token: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: TriggerRequest = await req.json();
    const { execution_id, nodes, edges, github_config } = body;

    console.log(`Triggering GitHub workflow for execution: ${execution_id}`);

    // If no GitHub config, fall back to simulation mode
    if (!github_config?.token) {
      console.log('No GitHub token provided, using simulation mode');
      
      // Start background simulation (fire and forget)
      simulateExecution(supabase, execution_id, nodes, edges).catch(console.error);

      return new Response(JSON.stringify({
        success: true,
        mode: 'simulation',
        execution_id,
        message: 'Pipeline execution started in simulation mode',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Trigger real GitHub Actions workflow
    const workflowUrl = `https://api.github.com/repos/${github_config.owner}/${github_config.repo}/actions/workflows/${github_config.workflow_file}/dispatches`;

    const response = await fetch(workflowUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${github_config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: github_config.branch,
        inputs: {
          execution_id,
          nodes: JSON.stringify(nodes),
          edges: JSON.stringify(edges),
          callback_url: `${supabaseUrl}/functions/v1/github-webhook`,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', errorText);
      
      // Update execution status to failed
      await supabase
        .from('executions')
        .update({ status: 'failed' })
        .eq('id', execution_id);

      // Fall back to simulation if GitHub fails
      console.log('GitHub trigger failed, falling back to simulation mode');
      simulateExecution(supabase, execution_id, nodes, edges).catch(console.error);

      return new Response(JSON.stringify({
        success: true,
        mode: 'simulation',
        fallback_reason: 'GitHub API error',
        execution_id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update execution with GitHub metadata
    await supabase
      .from('executions')
      .update({
        status: 'running',
        metadata: {
          github_owner: github_config.owner,
          github_repo: github_config.repo,
          github_branch: github_config.branch,
          triggered_at: new Date().toISOString(),
        },
      })
      .eq('id', execution_id);

    return new Response(JSON.stringify({
      success: true,
      mode: 'github_actions',
      execution_id,
      message: 'GitHub Actions workflow triggered successfully',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Trigger error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Stage timing configurations
const STAGE_TIMINGS: Record<string, { min: number; max: number; failRate: number }> = {
  source: { min: 1000, max: 3000, failRate: 0.02 },
  build: { min: 3000, max: 8000, failRate: 0.08 },
  test: { min: 2000, max: 6000, failRate: 0.1 },
  security: { min: 2000, max: 5000, failRate: 0.05 },
  deploy: { min: 3000, max: 7000, failRate: 0.06 },
  approval: { min: 500, max: 1000, failRate: 0 },
  checkpoint: { min: 500, max: 1000, failRate: 0 },
};

function getRandomTiming(stageType: string): number {
  const timing = STAGE_TIMINGS[stageType] || { min: 1000, max: 3000 };
  return Math.floor(Math.random() * (timing.max - timing.min) + timing.min);
}

function shouldFail(stageType: string): boolean {
  const failRate = STAGE_TIMINGS[stageType]?.failRate || 0.05;
  return Math.random() < failRate;
}

function getExecutionOrder(nodes: any[], edges: any[]): string[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    adjList.set(n.id, []);
  });

  edges.forEach(e => {
    adjList.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId);
  });

  const result: string[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    result.push(nodeId);
    adjList.get(nodeId)?.forEach(neighbor => {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    });
  }

  return result;
}

async function simulateExecution(supabase: any, executionId: string, nodes: any[], edges: any[]) {
  console.log(`Starting simulation for execution ${executionId}`);
  
  const executionOrder = getExecutionOrder(nodes, edges);
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  for (const nodeId of executionOrder) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const stageType = node.data?.stageType || 'build';
    const label = node.data?.label || nodeId;

    // Skip approval gates in simulation
    if (stageType === 'approval') {
      await supabase
        .from('execution_nodes')
        .update({ status: 'paused', started_at: new Date().toISOString() })
        .eq('execution_id', executionId)
        .eq('node_id', nodeId);

      await supabase
        .from('execution_logs')
        .insert({
          execution_id: executionId,
          node_id: nodeId,
          message: `⏸ ${label} - Waiting for approval`,
          level: 'warn',
        });

      // Create approval request
      await supabase
        .from('approval_requests')
        .insert({
          execution_id: executionId,
          node_id: nodeId,
          title: `Approval required: ${label}`,
          description: `Pipeline requires approval to proceed past ${label}`,
          status: 'pending',
          required_approvals: 1,
          current_approvals: 0,
        });

      // Auto-approve after 3 seconds for simulation
      await sleep(3000);
      
      await supabase
        .from('execution_nodes')
        .update({ status: 'success', completed_at: new Date().toISOString() })
        .eq('execution_id', executionId)
        .eq('node_id', nodeId);

      continue;
    }

    // Update to running
    const startedAt = new Date().toISOString();
    await supabase
      .from('execution_nodes')
      .update({ status: 'running', started_at: startedAt })
      .eq('execution_id', executionId)
      .eq('node_id', nodeId);

    await supabase
      .from('execution_logs')
      .insert({
        execution_id: executionId,
        node_id: nodeId,
        message: `▶ Starting ${label}...`,
        level: 'info',
      });

    // Simulate execution time
    const duration = getRandomTiming(stageType);
    await sleep(duration);

    // Determine success or failure
    const failed = shouldFail(stageType);
    const status = failed ? 'failed' : 'success';
    const completedAt = new Date().toISOString();

    await supabase
      .from('execution_nodes')
      .update({
        status,
        completed_at: completedAt,
        duration_ms: duration,
        logs: [`${label} ${failed ? 'failed' : 'completed'} in ${duration}ms`],
      })
      .eq('execution_id', executionId)
      .eq('node_id', nodeId);

    await supabase
      .from('execution_logs')
      .insert({
        execution_id: executionId,
        node_id: nodeId,
        message: failed ? `✗ ${label} failed after ${duration}ms` : `✓ ${label} completed in ${duration}ms`,
        level: failed ? 'error' : 'info',
      });

    // Create checkpoint for successful stages
    if (status === 'success' && stageType === 'checkpoint') {
      await supabase
        .from('checkpoints')
        .insert({
          execution_id: executionId,
          node_id: nodeId,
          name: `${label}`,
          state: { duration_ms: duration, completed_at: completedAt },
        });
    }

    // Update execution progress
    const completedCount = executionOrder.indexOf(nodeId) + 1;
    const progress = Math.round((completedCount / executionOrder.length) * 100);
    
    await supabase
      .from('executions')
      .update({ progress, status: failed ? 'failed' : 'running' })
      .eq('id', executionId);

    // Stop on failure
    if (failed) {
      await supabase
        .from('executions')
        .update({ status: 'failed', completed_at: completedAt })
        .eq('id', executionId);
      return;
    }
  }

  // Mark execution as complete
  await supabase
    .from('executions')
    .update({
      status: 'success',
      progress: 100,
      completed_at: new Date().toISOString(),
    })
    .eq('id', executionId);

  console.log(`Simulation complete for execution ${executionId}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
