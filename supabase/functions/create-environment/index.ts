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

    const { name, environment, variables, secrets_ref, created_by } = await req.json();

    console.log(`[create-environment] Creating environment: ${name} (${environment})`);

    if (!name || !environment) {
      return new Response(
        JSON.stringify({ error: 'name and environment are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the environment config
    const { data: envConfig, error: envError } = await supabase
      .from('environment_configs')
      .insert({
        name,
        environment,
        variables: variables || {},
        secrets_ref,
        created_by,
        is_active: true
      })
      .select()
      .single();

    if (envError) {
      console.error('[create-environment] Error creating environment:', envError);
      throw envError;
    }

    console.log(`[create-environment] Environment created successfully: ${envConfig.id}`);

    // Log audit event
    await supabase.from('audit_logs').insert({
      action: 'create_environment',
      resource_type: 'environment_config',
      resource_id: envConfig.id,
      user_id: created_by,
      details: { name, environment }
    });

    // Create notification event
    await supabase.from('notification_events').insert({
      type: 'environment_created',
      target: created_by || 'system',
      payload: { environment_id: envConfig.id, name, environment },
      status: 'sent'
    });

    return new Response(
      JSON.stringify({ success: true, environment: envConfig }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[create-environment] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
