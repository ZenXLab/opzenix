import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256',
};

interface GitHubWebhookPayload {
  action: string;
  workflow_run?: {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    html_url: string;
    created_at: string;
    updated_at: string;
  };
  workflow_job?: {
    id: number;
    run_id: number;
    name: string;
    status: string;
    conclusion: string | null;
    started_at: string;
    completed_at: string | null;
    steps?: Array<{
      name: string;
      status: string;
      conclusion: string | null;
      number: number;
      started_at: string;
      completed_at: string | null;
    }>;
  };
  repository?: {
    full_name: string;
    html_url: string;
  };
}

interface ExecutionPayload {
  execution_id: string;
  flow_id: string;
  node_id: string;
  checkpoint_id?: string;
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

    // Verify GitHub signature (simplified for now - in production use HMAC verification)
    const signature = req.headers.get('x-hub-signature-256');
    const event = req.headers.get('x-github-event');
    
    console.log(`Received GitHub webhook: ${event}`);

    const payload: GitHubWebhookPayload = await req.json();
    
    // Extract execution metadata from workflow run name or inputs
    // Expected format: "opzenix-<execution_id>-<node_id>"
    let executionId: string | null = null;
    let nodeId: string | null = null;

    if (payload.workflow_run) {
      const nameMatch = payload.workflow_run.name.match(/opzenix-([a-f0-9-]+)-(.+)/);
      if (nameMatch) {
        executionId = nameMatch[1];
        nodeId = nameMatch[2];
      }
    }

    if (payload.workflow_job) {
      const nameMatch = payload.workflow_job.name.match(/opzenix-([a-f0-9-]+)-(.+)/);
      if (nameMatch) {
        executionId = nameMatch[1];
        nodeId = nameMatch[2];
      }
    }

    // If we couldn't extract from name, try to get from run ID mapping
    if (!executionId && payload.workflow_run?.id) {
      const { data: mapping } = await supabase
        .from('executions')
        .select('id, metadata')
        .eq('metadata->>github_run_id', payload.workflow_run.id.toString())
        .single();
      
      if (mapping) {
        executionId = mapping.id;
      }
    }

    // Handle different webhook events
    if (event === 'workflow_run') {
      await handleWorkflowRun(supabase, payload, executionId);
    } else if (event === 'workflow_job') {
      await handleWorkflowJob(supabase, payload, executionId, nodeId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('GitHub webhook error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleWorkflowRun(
  supabase: any,
  payload: GitHubWebhookPayload,
  executionId: string | null
) {
  if (!executionId || !payload.workflow_run) return;

  const { workflow_run } = payload;
  const status = mapGitHubStatus(workflow_run.status, workflow_run.conclusion);

  // Update execution status
  const updateData: any = {
    status,
    metadata: {
      github_run_id: workflow_run.id,
      github_url: workflow_run.html_url,
      updated_at: workflow_run.updated_at,
    },
  };

  if (status === 'success' || status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }

  await supabase
    .from('executions')
    .update(updateData)
    .eq('id', executionId);

  // Insert log entry
  await supabase
    .from('execution_logs')
    .insert({
      execution_id: executionId,
      node_id: 'workflow',
      message: `Workflow ${workflow_run.status}${workflow_run.conclusion ? ` - ${workflow_run.conclusion}` : ''}`,
      level: status === 'failed' ? 'error' : 'info',
    });

  console.log(`Updated execution ${executionId} to status ${status}`);
}

async function handleWorkflowJob(
  supabase: any,
  payload: GitHubWebhookPayload,
  executionId: string | null,
  nodeId: string | null
) {
  if (!executionId || !payload.workflow_job) return;

  const { workflow_job } = payload;
  const status = mapGitHubStatus(workflow_job.status, workflow_job.conclusion);

  // Update node status
  if (nodeId) {
    const updateData: any = {
      status,
    };

    if (workflow_job.started_at && status === 'running') {
      updateData.started_at = workflow_job.started_at;
    }

    if (workflow_job.completed_at && (status === 'success' || status === 'failed')) {
      updateData.completed_at = workflow_job.completed_at;
      if (workflow_job.started_at) {
        const duration = new Date(workflow_job.completed_at).getTime() - new Date(workflow_job.started_at).getTime();
        updateData.duration_ms = duration;
      }
    }

    await supabase
      .from('execution_nodes')
      .update(updateData)
      .eq('execution_id', executionId)
      .eq('node_id', nodeId);

    console.log(`Updated node ${nodeId} in execution ${executionId} to status ${status}`);
  }

  // Insert step logs
  if (workflow_job.steps) {
    for (const step of workflow_job.steps) {
      await supabase
        .from('execution_logs')
        .insert({
          execution_id: executionId,
          node_id: nodeId || workflow_job.name,
          message: `[${step.name}] ${step.status}${step.conclusion ? ` - ${step.conclusion}` : ''}`,
          level: step.conclusion === 'failure' ? 'error' : 'info',
        });
    }
  }

  // Create checkpoint if job completed successfully
  if (status === 'success' && nodeId) {
    await supabase
      .from('checkpoints')
      .insert({
        execution_id: executionId,
        node_id: nodeId,
        name: `${nodeId} completed`,
        state: {
          job_id: workflow_job.id,
          completed_at: workflow_job.completed_at,
          steps: workflow_job.steps?.map(s => ({ name: s.name, status: s.conclusion })),
        },
      });

    console.log(`Created checkpoint for node ${nodeId}`);
  }
}

function mapGitHubStatus(status: string, conclusion: string | null): string {
  if (status === 'queued' || status === 'pending' || status === 'waiting') {
    return 'idle';
  }
  if (status === 'in_progress') {
    return 'running';
  }
  if (status === 'completed') {
    if (conclusion === 'success') return 'success';
    if (conclusion === 'failure' || conclusion === 'timed_out' || conclusion === 'cancelled') return 'failed';
    if (conclusion === 'skipped') return 'idle';
  }
  return 'idle';
}
