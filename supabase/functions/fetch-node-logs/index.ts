import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FetchLogsRequest {
  execution_id: string;
  node_id?: string;
  limit?: number;
  offset?: number;
  level?: 'info' | 'warn' | 'error';
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

    // Support both GET with query params and POST with body
    let params: FetchLogsRequest;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      params = {
        execution_id: url.searchParams.get('execution_id') || '',
        node_id: url.searchParams.get('node_id') || undefined,
        limit: parseInt(url.searchParams.get('limit') || '100'),
        offset: parseInt(url.searchParams.get('offset') || '0'),
        level: url.searchParams.get('level') as any || undefined,
      };
    } else {
      params = await req.json();
    }

    const { execution_id, node_id, limit = 100, offset = 0, level } = params;

    if (!execution_id) {
      return new Response(JSON.stringify({ error: 'execution_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching logs for execution: ${execution_id}, node: ${node_id || 'all'}`);

    // Build query
    let query = supabase
      .from('execution_logs')
      .select('*', { count: 'exact' })
      .eq('execution_id', execution_id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (node_id) {
      query = query.eq('node_id', node_id);
    }

    if (level) {
      query = query.eq('level', level);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Failed to fetch logs:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch logs' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Also get node status info
    const { data: nodeStatus } = await supabase
      .from('execution_nodes')
      .select('node_id, status, started_at, completed_at, duration_ms')
      .eq('execution_id', execution_id);

    // Group logs by node if no specific node requested
    let groupedLogs: any = logs;
    if (!node_id && logs) {
      groupedLogs = logs.reduce((acc: any, log: any) => {
        if (!acc[log.node_id]) {
          acc[log.node_id] = [];
        }
        acc[log.node_id].push(log);
        return acc;
      }, {});
    }

    return new Response(JSON.stringify({
      success: true,
      logs: groupedLogs,
      node_status: nodeStatus,
      total: count,
      limit,
      offset,
      has_more: (count || 0) > offset + limit,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Fetch logs error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
