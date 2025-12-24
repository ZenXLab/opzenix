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

    const { environment_id, variables, secrets_ref, is_active, updated_by } = await req.json();

    console.log(`[update-environment-config] Updating environment: ${environment_id}`);

    if (!environment_id) {
      return new Response(
        JSON.stringify({ error: 'environment_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current config for audit
    const { data: currentConfig } = await supabase
      .from('environment_configs')
      .select('*')
      .eq('id', environment_id)
      .single();

    if (!currentConfig) {
      return new Response(
        JSON.stringify({ error: 'Environment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (variables !== undefined) updateData.variables = variables;
    if (secrets_ref !== undefined) updateData.secrets_ref = secrets_ref;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update the environment config
    const { data: updatedConfig, error: updateError } = await supabase
      .from('environment_configs')
      .update(updateData)
      .eq('id', environment_id)
      .select()
      .single();

    if (updateError) {
      console.error('[update-environment-config] Error updating:', updateError);
      throw updateError;
    }

    console.log(`[update-environment-config] Environment updated successfully`);

    // Log audit event
    await supabase.from('audit_logs').insert({
      action: 'update_environment',
      resource_type: 'environment_config',
      resource_id: environment_id,
      user_id: updated_by,
      details: {
        previous: currentConfig,
        updated: updateData
      }
    });

    return new Response(
      JSON.stringify({ success: true, environment: updatedConfig }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[update-environment-config] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
