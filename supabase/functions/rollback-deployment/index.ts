import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RollbackRequest {
  deploymentId: string;
  targetVersion: string;
  environment: string;
  reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { deploymentId, targetVersion, environment, reason }: RollbackRequest = await req.json();

    console.log(`[Rollback] Starting rollback to deployment ${deploymentId} (${targetVersion}) in ${environment}`);

    // Get the original deployment
    const { data: originalDeployment, error: fetchError } = await supabase
      .from('deployments')
      .select('*')
      .eq('id', deploymentId)
      .single();

    if (fetchError || !originalDeployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    // Create a new deployment record for the rollback
    const { data: newDeployment, error: insertError } = await supabase
      .from('deployments')
      .insert({
        version: targetVersion,
        environment: environment,
        status: 'running',
        rollback_to: deploymentId,
        notes: reason || `Rollback to ${targetVersion}`,
        deployed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log(`[Rollback] Created rollback deployment: ${newDeployment.id}`);

    // Log to audit
    await supabase.from('audit_logs').insert({
      action: 'rollback_deployment',
      resource_type: 'deployment',
      resource_id: newDeployment.id,
      details: {
        original_deployment_id: deploymentId,
        target_version: targetVersion,
        environment,
        reason,
      }
    });

    // Simulate rollback process (in production this would trigger actual rollback)
    setTimeout(async () => {
      // Update deployment status to success after simulated rollback
      await supabase
        .from('deployments')
        .update({ 
          status: 'success',
        })
        .eq('id', newDeployment.id);

      console.log(`[Rollback] Rollback completed for deployment: ${newDeployment.id}`);
    }, 3000);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deployment: newDeployment,
        message: `Rollback to ${targetVersion} initiated`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('[Rollback] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
