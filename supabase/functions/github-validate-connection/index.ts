import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  connectionId: string;
  owner?: string;
  repo?: string;
  installationId?: string;
}

interface ValidationResult {
  valid: boolean;
  installation?: {
    id: number;
    account: string;
    type: string;
    targetType: string;
    permissions: Record<string, string>;
    expiresAt?: string;
  };
  branches?: Array<{
    name: string;
    protected: boolean;
    commit: string;
  }>;
  webhookStatus?: {
    configured: boolean;
    deliveryCount?: number;
    lastDelivery?: string;
    lastStatus?: string;
  };
  tokenHealth?: {
    valid: boolean;
    expiresAt?: string;
    minutesRemaining?: number;
    requiresRefresh: boolean;
  };
  errors: string[];
  warnings: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { connectionId, owner, repo, installationId } = await req.json() as ValidationRequest;

    console.log('[github-validate-connection] Starting validation:', { connectionId, owner, repo });

    const result: ValidationResult = {
      valid: false,
      errors: [],
      warnings: [],
    };

    // Get connection config
    const { data: connection, error: connError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connError || !connection) {
      result.errors.push('Connection not found');
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const config = connection.config as Record<string, unknown> || {};
    const repoOwner = owner || config.owner as string;
    const repoName = repo || config.repo as string;
    const appInstallationId = installationId || config.installationId as string;

    // Check if GitHub App credentials are configured
    const githubAppId = Deno.env.get('GITHUB_APP_ID');
    const githubPrivateKey = Deno.env.get('GITHUB_PRIVATE_KEY');

    if (!githubAppId || !githubPrivateKey) {
      // Fall back to PAT validation
      const pat = Deno.env.get('GITHUB_PAT') || config.pat as string;
      
      if (!pat) {
        result.errors.push('No GitHub credentials configured (App or PAT)');
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Validate PAT and fetch branches
      return await validateWithPAT(supabase, connectionId, repoOwner, repoName, pat, result);
    }

    // GitHub App flow - generate installation access token
    try {
      const installationToken = await generateInstallationToken(
        githubAppId,
        githubPrivateKey,
        appInstallationId
      );

      if (!installationToken.token) {
        result.errors.push('Failed to generate installation access token');
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }

      // Store token expiry info
      result.tokenHealth = {
        valid: true,
        expiresAt: installationToken.expiresAt,
        minutesRemaining: Math.floor((new Date(installationToken.expiresAt).getTime() - Date.now()) / 60000),
        requiresRefresh: false,
      };

      if (result.tokenHealth.minutesRemaining && result.tokenHealth.minutesRemaining < 10) {
        result.tokenHealth.requiresRefresh = true;
        result.warnings.push('Token expires soon, refresh recommended');
      }

      // Validate installation
      const installationInfo = await validateInstallation(installationToken.token, appInstallationId);
      if (installationInfo) {
        result.installation = installationInfo;
      } else {
        result.errors.push('Failed to validate GitHub App installation');
      }

      // Fetch branches if repo is specified
      if (repoOwner && repoName) {
        const branches = await fetchBranches(installationToken.token, repoOwner, repoName);
        if (branches) {
          result.branches = branches;
        } else {
          result.warnings.push('Could not fetch branches - repo may not be accessible');
        }

        // Check webhook configuration
        const webhookStatus = await checkWebhookDelivery(installationToken.token, repoOwner, repoName);
        result.webhookStatus = webhookStatus;

        if (!webhookStatus.configured) {
          result.warnings.push('Webhook not configured for this repository');
        } else if (webhookStatus.lastStatus && webhookStatus.lastStatus !== 'success') {
          result.warnings.push(`Last webhook delivery failed: ${webhookStatus.lastStatus}`);
        }
      }

      result.valid = result.errors.length === 0;

      // Update connection status in database
      await supabase
        .from('connections')
        .update({
          status: result.valid ? 'connected' : 'error',
          validated: result.valid,
          last_validated_at: new Date().toISOString(),
          last_validation_error: result.errors.length > 0 ? result.errors.join('; ') : null,
          resource_status: {
            branches: result.branches?.length || 0,
            installation: result.installation ? 'active' : 'unknown',
            tokenExpiresAt: result.tokenHealth?.expiresAt,
            webhookConfigured: result.webhookStatus?.configured || false,
          },
        })
        .eq('id', connectionId);

      // Record health event
      await supabase
        .from('connection_health_events')
        .insert({
          connection_id: connectionId,
          status: result.valid ? 'healthy' : 'failed',
          message: result.valid ? 'GitHub App validation successful' : result.errors.join('; '),
          details: {
            branches: result.branches?.length,
            tokenExpiresAt: result.tokenHealth?.expiresAt,
            warnings: result.warnings,
          },
        });

      console.log('[github-validate-connection] Validation complete:', { valid: result.valid, branchCount: result.branches?.length });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (appError: any) {
      console.error('[github-validate-connection] App validation error:', appError);
      result.errors.push(`GitHub App error: ${appError.message}`);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

  } catch (error: any) {
    console.error('[github-validate-connection] Error:', error);
    return new Response(JSON.stringify({ 
      valid: false, 
      errors: [error.message],
      warnings: [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function generateInstallationToken(appId: string, privateKey: string, installationId: string) {
  // Generate JWT for GitHub App
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60, // Issued 60 seconds ago to account for clock drift
    exp: now + 600, // Expires in 10 minutes
    iss: appId,
  };

  // Create JWT (simplified - in production use proper JWT library)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  
  // For now, return a mock structure - real implementation needs crypto signing
  // In production, you'd use a proper JWT signing library
  
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${header}.${body}.[SIGNATURE]`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get installation token: ${response.status}`);
  }

  const data = await response.json();
  return {
    token: data.token,
    expiresAt: data.expires_at,
  };
}

async function validateInstallation(token: string, installationId: string) {
  try {
    const response = await fetch(
      `https://api.github.com/app/installations/${installationId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      id: data.id,
      account: data.account?.login || 'unknown',
      type: data.app_slug || 'github-app',
      targetType: data.target_type || 'Organization',
      permissions: data.permissions || {},
    };
  } catch {
    return null;
  }
}

async function fetchBranches(token: string, owner: string, repo: string) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.map((branch: any) => ({
      name: branch.name,
      protected: branch.protected || false,
      commit: branch.commit?.sha?.substring(0, 7) || 'unknown',
    }));
  } catch {
    return null;
  }
}

async function checkWebhookDelivery(token: string, owner: string, repo: string) {
  try {
    // Get repository hooks
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/hooks`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!response.ok) {
      return { configured: false };
    }

    const hooks = await response.json();
    const opzenixHook = hooks.find((h: any) => 
      h.config?.url?.includes('opzenix') || 
      h.config?.url?.includes('github-webhook')
    );

    if (!opzenixHook) {
      return { configured: false };
    }

    // Get recent deliveries
    const deliveryResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/hooks/${opzenixHook.id}/deliveries?per_page=1`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!deliveryResponse.ok) {
      return { configured: true };
    }

    const deliveries = await deliveryResponse.json();
    const lastDelivery = deliveries[0];

    return {
      configured: true,
      deliveryCount: deliveries.length,
      lastDelivery: lastDelivery?.delivered_at,
      lastStatus: lastDelivery?.status === 200 ? 'success' : 'failed',
    };
  } catch {
    return { configured: false };
  }
}

async function validateWithPAT(
  supabase: any,
  connectionId: string,
  owner: string,
  repo: string,
  pat: string,
  result: ValidationResult
) {
  try {
    // Validate PAT by checking user
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github+json',
      },
    });

    if (!userResponse.ok) {
      result.errors.push('Invalid PAT or expired token');
      result.tokenHealth = {
        valid: false,
        requiresRefresh: true,
      };
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    result.tokenHealth = {
      valid: true,
      requiresRefresh: false,
    };

    // Fetch branches
    if (owner && repo) {
      const branches = await fetchBranches(pat, owner, repo);
      if (branches) {
        result.branches = branches;
      } else {
        result.errors.push('Repository not accessible');
      }
    }

    result.valid = result.errors.length === 0;

    // Update connection
    await supabase
      .from('connections')
      .update({
        status: result.valid ? 'connected' : 'error',
        validated: result.valid,
        last_validated_at: new Date().toISOString(),
        last_validation_error: result.errors.length > 0 ? result.errors.join('; ') : null,
        resource_status: {
          branches: result.branches?.length || 0,
          authMethod: 'pat',
        },
      })
      .eq('id', connectionId);

    // Record health event
    await supabase
      .from('connection_health_events')
      .insert({
        connection_id: connectionId,
        status: result.valid ? 'healthy' : 'failed',
        message: result.valid ? 'PAT validation successful' : result.errors.join('; '),
        details: { branches: result.branches?.length },
      });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    result.errors.push(`PAT validation error: ${error.message}`);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
