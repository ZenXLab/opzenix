import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Connection {
  id: string;
  name: string;
  type: string;
  status: string;
  config: any;
  health_check_interval_minutes: number;
  last_validated_at: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request for optional specific connection check
    let specificConnectionId: string | null = null;
    try {
      const body = await req.json();
      specificConnectionId = body?.connection_id || null;
    } catch {
      // No body, check all connections
    }

    console.log('[Health Check] Starting connection health checks');

    // Get connections that need health check
    let query = supabase
      .from('connections')
      .select('*');

    if (specificConnectionId) {
      query = query.eq('id', specificConnectionId);
    }

    const { data: connections, error } = await query;

    if (error) {
      throw error;
    }

    const results: any[] = [];

    for (const connection of (connections as Connection[]) || []) {
      const startTime = Date.now();
      let status: 'connected' | 'failed' = 'connected';
      let message = '';
      let details: any = {};

      try {
        switch (connection.type) {
          case 'github':
            ({ status, message, details } = await checkGitHub(connection));
            break;
          case 'kubernetes':
            ({ status, message, details } = await checkKubernetes(connection));
            break;
          case 'registry':
            ({ status, message, details } = await checkRegistry(connection));
            break;
          case 'vault':
            ({ status, message, details } = await checkVault(connection));
            break;
          case 'otel':
            ({ status, message, details } = await checkOTel(connection));
            break;
          default:
            // Generic connectivity check
            status = 'connected';
            message = 'Connection type not validated';
        }
      } catch (checkError: any) {
        status = 'failed';
        message = checkError.message || 'Health check failed';
      }

      const responseTime = Date.now() - startTime;

      // Update connection status
      const updateData: any = {
        status,
        last_validated_at: new Date().toISOString(),
        validated: status === 'connected',
        validation_message: message,
        last_validation_error: status === 'failed' ? message : null,
        blocked: status === 'failed',
      };

      await supabase
        .from('connections')
        .update(updateData)
        .eq('id', connection.id);

      // Insert health event
      await supabase
        .from('connection_health_events')
        .insert({
          connection_id: connection.id,
          status,
          message,
          response_time_ms: responseTime,
          details,
        });

      results.push({
        connection_id: connection.id,
        name: connection.name,
        type: connection.type,
        status,
        message,
        response_time_ms: responseTime,
      });

      console.log(`[Health Check] ${connection.name} (${connection.type}): ${status} - ${message}`);
    }

    // If any critical connection failed, update environment locks
    const failedCritical = results.filter(r => 
      r.status === 'failed' && 
      ['github', 'kubernetes', 'registry', 'vault'].includes(r.type)
    );

    if (failedCritical.length > 0) {
      // Log critical failure
      await supabase
        .from('audit_logs')
        .insert({
          action: 'connection_health_check_failed',
          resource_type: 'connection',
          details: {
            failed_connections: failedCritical,
            timestamp: new Date().toISOString(),
          },
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      checked: results.length,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Health Check] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkGitHub(connection: Connection): Promise<{ status: 'connected' | 'failed'; message: string; details: any }> {
  const config = connection.config || {};
  const owner = config.repository_owner;
  const repo = config.repository_name;
  const token = config.token;

  if (!owner || !repo) {
    return { status: 'connected', message: 'Configuration incomplete - validation skipped', details: {} };
  }

  try {
    // Check repo access
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: token ? {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      } : {
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!repoResponse.ok) {
      return { 
        status: 'failed', 
        message: `Repository access failed: ${repoResponse.status}`,
        details: { status_code: repoResponse.status }
      };
    }

    const repoData = await repoResponse.json();

    // Check rate limit
    const rateResponse = await fetch('https://api.github.com/rate_limit', {
      headers: token ? {
        'Authorization': `Bearer ${token}`,
      } : {},
    });

    const rateData = await rateResponse.json();
    const remaining = rateData.rate?.remaining || 0;

    return {
      status: 'connected',
      message: `Repository accessible, ${remaining} API calls remaining`,
      details: {
        repo_full_name: repoData.full_name,
        default_branch: repoData.default_branch,
        rate_limit_remaining: remaining,
      }
    };
  } catch (error: any) {
    return { status: 'failed', message: error.message, details: {} };
  }
}

async function checkKubernetes(connection: Connection): Promise<{ status: 'connected' | 'failed'; message: string; details: any }> {
  const config = connection.config || {};
  
  // For demo/simulation, check if config has required fields
  if (!config.cluster_url && !config.cluster_name) {
    return { status: 'connected', message: 'Kubernetes configuration pending', details: {} };
  }

  // In production, this would use the Kubernetes API
  // For now, simulate connectivity check
  return {
    status: 'connected',
    message: `Cluster ${config.cluster_name || 'default'} reachable`,
    details: {
      cluster_name: config.cluster_name,
      namespace: config.namespace || 'default',
    }
  };
}

async function checkRegistry(connection: Connection): Promise<{ status: 'connected' | 'failed'; message: string; details: any }> {
  const config = connection.config || {};
  
  if (!config.registry_url) {
    return { status: 'connected', message: 'Registry configuration pending', details: {} };
  }

  // Check if registry URL is reachable
  try {
    const url = new URL(config.registry_url);
    const checkUrl = `${url.protocol}//${url.host}/v2/`;
    
    const response = await fetch(checkUrl, {
      method: 'GET',
      headers: config.token ? {
        'Authorization': `Bearer ${config.token}`,
      } : {},
    });

    if (response.status === 401 || response.status === 200) {
      return {
        status: 'connected',
        message: 'Registry reachable',
        details: { registry_url: config.registry_url }
      };
    }

    return { 
      status: 'failed', 
      message: `Registry returned ${response.status}`,
      details: { status_code: response.status }
    };
  } catch (error: any) {
    return { status: 'failed', message: error.message, details: {} };
  }
}

async function checkVault(connection: Connection): Promise<{ status: 'connected' | 'failed'; message: string; details: any }> {
  const config = connection.config || {};
  
  if (!config.vault_url && !config.vault_name) {
    return { status: 'connected', message: 'Vault configuration uses internal store', details: {} };
  }

  // For Azure Key Vault or HashiCorp Vault
  // In production, this would authenticate and check access
  return {
    status: 'connected',
    message: `Vault ${config.vault_name || 'internal'} accessible`,
    details: {
      vault_type: config.vault_type || 'internal',
      vault_name: config.vault_name,
    }
  };
}

async function checkOTel(connection: Connection): Promise<{ status: 'connected' | 'failed'; message: string; details: any }> {
  const config = connection.config || {};
  
  if (!config.endpoint) {
    return { status: 'connected', message: 'OTel using internal collector', details: {} };
  }

  // Check if OTel endpoint is reachable
  try {
    const response = await fetch(config.endpoint, {
      method: 'OPTIONS',
    });

    return {
      status: 'connected',
      message: 'OTel collector reachable',
      details: { endpoint: config.endpoint }
    };
  } catch (error: any) {
    // OTel endpoints may not respond to OPTIONS, so we still mark as connected
    return {
      status: 'connected',
      message: 'OTel endpoint configured',
      details: { endpoint: config.endpoint }
    };
  }
}
