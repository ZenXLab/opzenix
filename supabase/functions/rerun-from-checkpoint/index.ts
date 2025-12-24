import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RerunRequest {
  checkpoint_id: string;
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

    const body: RerunRequest = await req.json();
    const { checkpoint_id, github_config } = body;

    console.log(`Rerunning from checkpoint: ${checkpoint_id}`);

    // Get checkpoint details
    const { data: checkpoint, error: checkpointError } = await supabase
      .from('checkpoints')
      .select('*, executions(*)')
      .eq('id', checkpoint_id)
      .single();

    if (checkpointError || !checkpoint) {
      return new Response(JSON.stringify({ error: 'Checkpoint not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the original execution's nodes and edges
    const originalExecution = checkpoint.executions;
    const originalNodes = originalExecution.metadata?.nodes || [];
    const originalEdges = originalExecution.metadata?.edges || [];

    // Find the checkpoint node index to resume from
    const checkpointNodeId = checkpoint.node_id;
    
    // Create new execution record
    const { data: newExecution, error: execError } = await supabase
      .from('executions')
      .insert({
        name: `${originalExecution.name} (resumed)`,
        status: 'running',
        environment: originalExecution.environment,
        branch: originalExecution.branch,
        commit_hash: originalExecution.commit_hash,
        flow_template_id: originalExecution.flow_template_id,
        metadata: {
          resumed_from_checkpoint: checkpoint_id,
          original_execution_id: originalExecution.id,
          nodes: originalNodes,
          edges: originalEdges,
        },
      })
      .select()
      .single();

    if (execError || !newExecution) {
      console.error('Failed to create new execution:', execError);
      return new Response(JSON.stringify({ error: 'Failed to create execution' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create execution nodes, marking nodes before checkpoint as 'success' (skipped)
    let passedCheckpoint = false;
    const nodeInserts = originalNodes.map((node: any) => {
      if (node.id === checkpointNodeId) {
        passedCheckpoint = true;
      }
      return {
        execution_id: newExecution.id,
        node_id: node.id,
        status: passedCheckpoint ? 'idle' : 'success',
        metadata: { skipped: !passedCheckpoint },
      };
    });

    await supabase
      .from('execution_nodes')
      .insert(nodeInserts);

    // Log the resume action
    await supabase
      .from('execution_logs')
      .insert({
        execution_id: newExecution.id,
        node_id: 'system',
        message: `Resumed from checkpoint: ${checkpoint.name}`,
        level: 'info',
      });

    // Create initial checkpoint for the new execution
    await supabase
      .from('checkpoints')
      .insert({
        execution_id: newExecution.id,
        node_id: 'resume-start',
        name: 'Resume start',
        state: {
          resumed_from: checkpoint_id,
          checkpoint_node: checkpointNodeId,
        },
      });

    // Trigger the execution (GitHub or simulation)
    const triggerUrl = `${supabaseUrl}/functions/v1/trigger-github-workflow`;
    
    // Filter nodes to only include those after checkpoint
    const nodesToExecute = originalNodes.filter((n: any) => {
      const nodeIndex = originalNodes.findIndex((on: any) => on.id === n.id);
      const checkpointIndex = originalNodes.findIndex((on: any) => on.id === checkpointNodeId);
      return nodeIndex >= checkpointIndex;
    });

    await fetch(triggerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        execution_id: newExecution.id,
        nodes: nodesToExecute,
        edges: originalEdges.filter((e: any) => 
          nodesToExecute.some((n: any) => n.id === e.source) &&
          nodesToExecute.some((n: any) => n.id === e.target)
        ),
        github_config,
      }),
    });

    return new Response(JSON.stringify({
      success: true,
      execution_id: newExecution.id,
      resumed_from: checkpoint_id,
      checkpoint_node: checkpointNodeId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Rerun error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
