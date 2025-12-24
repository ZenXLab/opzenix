import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256',
};

interface GitHubPushPayload {
  ref: string;
  before: string;
  after: string;
  repository: {
    full_name: string;
    name: string;
    owner: {
      name: string;
      login: string;
    };
    html_url: string;
  };
  pusher: {
    name: string;
    email: string;
  };
  commits: Array<{
    id: string;
    message: string;
    author: { name: string; email: string };
  }>;
  head_commit?: {
    id: string;
    message: string;
    author: { name: string; email: string };
  };
}

interface GitHubWorkflowPayload {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const event = req.headers.get('x-github-event');
    console.log(`[GitHub Webhook] Received event: ${event}`);

    const payload = await req.json();

    // Handle PUSH events - create execution based on governance
    if (event === 'push') {
      const pushPayload = payload as GitHubPushPayload;
      await handlePushEvent(supabase, pushPayload);
    }
    // Handle workflow_run and workflow_job events
    else if (event === 'workflow_run') {
      await handleWorkflowRun(supabase, payload as GitHubWorkflowPayload);
    } 
    else if (event === 'workflow_job') {
      await handleWorkflowJob(supabase, payload as GitHubWorkflowPayload);
    }

    return new Response(JSON.stringify({ success: true, event }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[GitHub Webhook] Error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handlePushEvent(supabase: any, payload: GitHubPushPayload) {
  const repoOwner = payload.repository.owner.login || payload.repository.owner.name;
  const repoName = payload.repository.name;
  const branch = payload.ref.replace('refs/heads/', '');
  const commitSha = payload.after;
  const commitMessage = payload.head_commit?.message || payload.commits[0]?.message || 'No message';

  console.log(`[Push] ${repoOwner}/${repoName} - Branch: ${branch} - Commit: ${commitSha.substring(0, 7)}`);

  // Find matching GitHub integration
  const { data: integration, error: integrationError } = await supabase
    .from('github_integrations')
    .select('*')
    .eq('repository_owner', repoOwner)
    .eq('repository_name', repoName)
    .maybeSingle();

  if (integrationError || !integration) {
    console.log(`[Push] No integration found for ${repoOwner}/${repoName}`);
    return;
  }

  // Find branch mappings
  const { data: mappings } = await supabase
    .from('branch_mappings')
    .select('*')
    .eq('github_integration_id', integration.id);

  // Match branch to environment(s)
  const matchedEnvironments = findMatchingEnvironments(branch, mappings || []);
  
  if (matchedEnvironments.length === 0) {
    // Check if it matches any pattern at all
    const anyMatch = (mappings || []).some((m: any) => branchMatchesPattern(branch, m.branch_pattern));
    
    if (!anyMatch) {
      console.log(`[Push] Branch ${branch} is not configured - blocking execution`);
      
      // Create blocked execution record
      await createBlockedExecution(supabase, {
        name: `Push: ${commitMessage.substring(0, 50)}`,
        branch,
        commit_hash: commitSha,
        repository: `${repoOwner}/${repoName}`,
        blocked_reason: `Branch '${branch}' is not allowed for deployment. No matching branch pattern configured.`,
        governance_status: 'blocked',
      });
      return;
    }
  }

  // Process each matched environment
  for (const envMatch of matchedEnvironments) {
    if (!envMatch.is_deployable) {
      console.log(`[Push] Branch ${branch} is not deployable to ${envMatch.environment}`);
      await createBlockedExecution(supabase, {
        name: `Push: ${commitMessage.substring(0, 50)}`,
        branch,
        commit_hash: commitSha,
        environment: envMatch.environment,
        repository: `${repoOwner}/${repoName}`,
        blocked_reason: `Branch '${branch}' is marked as non-deployable to ${envMatch.environment}.`,
        governance_status: 'blocked',
      });
      continue;
    }

    // Check environment lock status
    const { data: envLock } = await supabase
      .from('environment_locks')
      .select('*')
      .eq('environment', envMatch.environment)
      .maybeSingle();

    const isLocked = envLock?.is_locked ?? true;
    const requiresApproval = envLock?.requires_approval ?? true;

    if (isLocked) {
      console.log(`[Push] Environment ${envMatch.environment} is locked - execution paused`);
      
      // Create paused execution awaiting approval
      const { data: execution } = await supabase
        .from('executions')
        .insert({
          name: `Push: ${commitMessage.substring(0, 50)}`,
          branch,
          commit_hash: commitSha,
          environment: envMatch.environment,
          status: 'paused',
          governance_status: 'awaiting_approval',
          blocked_reason: `Environment '${envMatch.environment}' is locked. Requires ${envLock?.required_role || 'admin'} approval.`,
          metadata: {
            repository: `${repoOwner}/${repoName}`,
            pusher: payload.pusher.name,
            github_integration_id: integration.id,
          },
        })
        .select()
        .single();

      if (execution && requiresApproval) {
        // Create approval request
        await supabase
          .from('approval_requests')
          .insert({
            execution_id: execution.id,
            node_id: 'governance-gate',
            title: `Deploy to ${envMatch.environment}`,
            description: `Branch ${branch} (${commitSha.substring(0, 7)}) requires approval for ${envMatch.environment} deployment.`,
            required_approvals: envMatch.environment === 'Prod' ? 2 : 1,
          });
      }

      // Log to audit
      await supabase
        .from('audit_logs')
        .insert({
          action: 'execution_paused',
          resource_type: 'execution',
          resource_id: execution?.id,
          details: {
            reason: 'environment_locked',
            environment: envMatch.environment,
            branch,
            commit: commitSha,
          },
        });

    } else {
      console.log(`[Push] Environment ${envMatch.environment} is unlocked - creating execution`);
      
      // Create allowed execution
      const { data: execution } = await supabase
        .from('executions')
        .insert({
          name: `Push: ${commitMessage.substring(0, 50)}`,
          branch,
          commit_hash: commitSha,
          environment: envMatch.environment,
          status: 'idle',
          governance_status: 'allowed',
          metadata: {
            repository: `${repoOwner}/${repoName}`,
            pusher: payload.pusher.name,
            github_integration_id: integration.id,
          },
        })
        .select()
        .single();

      // Log to audit
      await supabase
        .from('audit_logs')
        .insert({
          action: 'execution_created',
          resource_type: 'execution',
          resource_id: execution?.id,
          details: {
            trigger: 'github_push',
            environment: envMatch.environment,
            branch,
            commit: commitSha,
          },
        });

      // Insert execution log
      if (execution) {
        await supabase
          .from('execution_logs')
          .insert({
            execution_id: execution.id,
            node_id: 'trigger',
            message: `Execution triggered by push to ${branch} (${commitSha.substring(0, 7)})`,
            level: 'info',
          });
      }
    }
  }
}

async function createBlockedExecution(supabase: any, data: any) {
  const { data: execution } = await supabase
    .from('executions')
    .insert({
      name: data.name,
      branch: data.branch,
      commit_hash: data.commit_hash,
      environment: data.environment || 'unknown',
      status: 'failed',
      governance_status: data.governance_status,
      blocked_reason: data.blocked_reason,
      metadata: {
        repository: data.repository,
        blocked: true,
      },
    })
    .select()
    .single();

  // Log to audit
  await supabase
    .from('audit_logs')
    .insert({
      action: 'execution_blocked',
      resource_type: 'execution',
      resource_id: execution?.id,
      details: {
        reason: data.blocked_reason,
        branch: data.branch,
        commit: data.commit_hash,
      },
    });

  return execution;
}

function findMatchingEnvironments(branch: string, mappings: any[]): any[] {
  return mappings.filter(m => branchMatchesPattern(branch, m.branch_pattern));
}

function branchMatchesPattern(branch: string, pattern: string): boolean {
  // Handle exact match
  if (pattern === branch) return true;
  
  // Handle wildcard patterns like feature/*, release/*, etc.
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -1); // Remove *
    return branch.startsWith(prefix);
  }
  
  // Handle glob patterns
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(branch);
}

async function handleWorkflowRun(supabase: any, payload: GitHubWorkflowPayload) {
  if (!payload.workflow_run) return;

  const { workflow_run } = payload;
  
  // Try to find execution by workflow run ID in metadata
  const { data: execution } = await supabase
    .from('executions')
    .select('id')
    .eq('metadata->>github_run_id', workflow_run.id.toString())
    .maybeSingle();

  if (!execution) {
    console.log(`[Workflow Run] No matching execution for run ${workflow_run.id}`);
    return;
  }

  const status = mapGitHubStatus(workflow_run.status, workflow_run.conclusion);

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
    .eq('id', execution.id);

  await supabase
    .from('execution_logs')
    .insert({
      execution_id: execution.id,
      node_id: 'workflow',
      message: `Workflow ${workflow_run.status}${workflow_run.conclusion ? ` - ${workflow_run.conclusion}` : ''}`,
      level: status === 'failed' ? 'error' : 'info',
    });

  console.log(`[Workflow Run] Updated execution ${execution.id} to ${status}`);
}

async function handleWorkflowJob(supabase: any, payload: GitHubWorkflowPayload) {
  if (!payload.workflow_job) return;

  const { workflow_job } = payload;
  
  // Extract execution and node info from job name
  const nameMatch = workflow_job.name.match(/opzenix-([a-f0-9-]+)-(.+)/);
  let executionId = nameMatch?.[1];
  let nodeId = nameMatch?.[2];

  // If not found in name, try to find by run_id
  if (!executionId) {
    const { data: execution } = await supabase
      .from('executions')
      .select('id')
      .eq('metadata->>github_run_id', workflow_job.run_id.toString())
      .maybeSingle();
    
    if (execution) executionId = execution.id;
  }

  if (!executionId) return;

  const status = mapGitHubStatus(workflow_job.status, workflow_job.conclusion);

  if (nodeId) {
    const updateData: any = { status };

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
