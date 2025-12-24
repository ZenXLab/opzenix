import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac, timingSafeEqual } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256, x-github-event, x-github-delivery',
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
    name: string;
    owner: {
      login: string;
    };
    html_url: string;
  };
}

/**
 * Verify GitHub webhook signature using HMAC SHA-256
 * @see https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
 */
function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !signature.startsWith('sha256=')) {
    console.log('[Signature] Invalid signature format');
    return false;
  }

  const expectedSignature = signature.slice(7); // Remove 'sha256=' prefix
  const hmac = createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const computedSignature = hmac.digest('hex');

  try {
    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = new Uint8Array(expectedSignature.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const computedBuffer = new Uint8Array(computedSignature.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    
    if (expectedBuffer.length !== computedBuffer.length) {
      console.log('[Signature] Length mismatch');
      return false;
    }
    
    return timingSafeEqual(expectedBuffer, computedBuffer);
  } catch (error) {
    console.error('[Signature] Comparison error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const deliveryId = req.headers.get('x-github-delivery') || 'unknown';
  console.log(`[GitHub Webhook] Delivery ID: ${deliveryId}`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const event = req.headers.get('x-github-event');
    const signature = req.headers.get('x-hub-signature-256');
    
    console.log(`[GitHub Webhook] Event: ${event}`);

    // Get raw payload for signature verification
    const rawPayload = await req.text();
    let payload: any;
    
    try {
      payload = JSON.parse(rawPayload);
    } catch (e) {
      console.error('[GitHub Webhook] Invalid JSON payload');
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract repository info for signature verification
    const repoOwner = payload.repository?.owner?.login || payload.repository?.owner?.name;
    const repoName = payload.repository?.name;

    if (!repoOwner || !repoName) {
      console.log('[GitHub Webhook] Missing repository information');
      return new Response(JSON.stringify({ error: 'Missing repository information' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find matching GitHub integration to get webhook secret
    const { data: integration, error: integrationError } = await supabase
      .from('github_integrations')
      .select('id, webhook_secret')
      .eq('repository_owner', repoOwner)
      .eq('repository_name', repoName)
      .maybeSingle();

    if (integrationError) {
      console.error('[GitHub Webhook] Error fetching integration:', integrationError);
      return new Response(JSON.stringify({ error: 'Failed to fetch integration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!integration) {
      console.log(`[GitHub Webhook] No integration found for ${repoOwner}/${repoName}`);
      return new Response(JSON.stringify({ 
        error: 'Repository not configured',
        message: `No integration found for ${repoOwner}/${repoName}` 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify webhook signature if secret is configured
    if (integration.webhook_secret) {
      if (!signature) {
        console.log('[GitHub Webhook] Missing signature header');
        
        // Log security event
        await supabase.from('audit_logs').insert({
          action: 'webhook_signature_missing',
          resource_type: 'github_webhook',
          details: {
            repository: `${repoOwner}/${repoName}`,
            event,
            delivery_id: deliveryId,
          },
        });

        return new Response(JSON.stringify({ error: 'Missing signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const isValid = verifyGitHubSignature(rawPayload, signature, integration.webhook_secret);
      
      if (!isValid) {
        console.log('[GitHub Webhook] Invalid signature');
        
        // Log security event
        await supabase.from('audit_logs').insert({
          action: 'webhook_signature_invalid',
          resource_type: 'github_webhook',
          details: {
            repository: `${repoOwner}/${repoName}`,
            event,
            delivery_id: deliveryId,
          },
        });

        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('[GitHub Webhook] Signature verified successfully');
    } else {
      console.log('[GitHub Webhook] No webhook secret configured - skipping signature verification');
    }

    // Log successful webhook receipt
    await supabase.from('audit_logs').insert({
      action: 'webhook_received',
      resource_type: 'github_webhook',
      details: {
        repository: `${repoOwner}/${repoName}`,
        event,
        delivery_id: deliveryId,
        signature_verified: !!integration.webhook_secret,
      },
    });

    // Handle PUSH events - create execution based on governance
    if (event === 'push') {
      const pushPayload = payload as GitHubPushPayload;
      await handlePushEvent(supabase, pushPayload, integration.id);
    }
    // Handle workflow_run and workflow_job events
    else if (event === 'workflow_run') {
      await handleWorkflowRun(supabase, payload as GitHubWorkflowPayload);
    } 
    else if (event === 'workflow_job') {
      await handleWorkflowJob(supabase, payload as GitHubWorkflowPayload);
    }
    // Handle ping event (sent when webhook is first configured)
    else if (event === 'ping') {
      console.log('[GitHub Webhook] Ping received - webhook configured successfully');
      return new Response(JSON.stringify({ success: true, message: 'Pong!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, event, delivery_id: deliveryId }), {
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

async function handlePushEvent(supabase: any, payload: GitHubPushPayload, integrationId: string) {
  const repoOwner = payload.repository.owner.login || payload.repository.owner.name;
  const repoName = payload.repository.name;
  const branch = payload.ref.replace('refs/heads/', '');
  const commitSha = payload.after;
  const commitMessage = payload.head_commit?.message || payload.commits[0]?.message || 'No message';

  console.log(`[Push] ${repoOwner}/${repoName} - Branch: ${branch} - Commit: ${commitSha.substring(0, 7)}`);

  // Find branch mappings
  const { data: mappings } = await supabase
    .from('branch_mappings')
    .select('*')
    .eq('github_integration_id', integrationId);

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
            github_integration_id: integrationId,
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
            github_integration_id: integrationId,
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