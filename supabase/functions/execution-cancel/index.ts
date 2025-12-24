import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { execution_id, reason, cancelled_by } = await req.json();

    console.log(`[execution-cancel] Cancelling execution: ${execution_id}`);

    if (!execution_id) {
      return new Response(
        JSON.stringify({ error: 'execution_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current execution state
    const { data: execution, error: fetchError } = await supabase
      .from('executions')
      .select('*')
      .eq('id', execution_id)
      .single();

    if (fetchError || !execution) {
      console.error('[execution-cancel] Execution not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Execution not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if execution can be cancelled
    if (['success', 'failed'].includes(execution.status)) {
      return new Response(
        JSON.stringify({ error: `Cannot cancel execution with status: ${execution.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const oldState = execution.status;

    // Update execution status to failed (cancelled)
    const { error: updateError } = await supabase
      .from('executions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        metadata: {
          ...execution.metadata,
          cancelled: true,
          cancel_reason: reason || 'User requested cancellation',
          cancelled_by,
          cancelled_at: new Date().toISOString()
        }
      })
      .eq('id', execution_id);

    if (updateError) {
      console.error('[execution-cancel] Error updating execution:', updateError);
      throw updateError;
    }

    // Update all running nodes to failed
    const { error: nodesError } = await supabase
      .from('execution_nodes')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        metadata: { cancelled: true }
      })
      .eq('execution_id', execution_id)
      .eq('status', 'running');

    if (nodesError) {
      console.error('[execution-cancel] Error updating nodes:', nodesError);
    }

    // Record state event
    await supabase.from('execution_state_events').insert({
      execution_id,
      old_state: oldState,
      new_state: 'failed',
      reason: reason || 'User requested cancellation',
      triggered_by: cancelled_by
    });

    // Log audit event
    await supabase.from('audit_logs').insert({
      action: 'cancel_execution',
      resource_type: 'execution',
      resource_id: execution_id,
      user_id: cancelled_by,
      details: { reason, old_state: oldState }
    });

    // Add execution log
    await supabase.from('execution_logs').insert({
      execution_id,
      node_id: 'system',
      level: 'warn',
      message: `Execution cancelled: ${reason || 'User requested cancellation'}`
    });

    // Create notification
    await supabase.from('notification_events').insert({
      type: 'execution_cancelled',
      target: cancelled_by || 'system',
      payload: { execution_id, reason },
      status: 'sent'
    });

    console.log(`[execution-cancel] Execution cancelled successfully`);

    return new Response(
      JSON.stringify({ success: true, execution_id, status: 'failed', cancelled: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[execution-cancel] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
