import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface ArtifactPayload {
  name: string;
  type?: string;
  registry_url: string;
  image_digest: string;
  image_tag?: string;
  version?: string;
  size_bytes?: number;
  build_duration_ms?: number;
  execution_id?: string;
  metadata?: Record<string, unknown>;
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

    // Validate webhook secret (optional but recommended)
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('ARTIFACT_WEBHOOK_SECRET');
    
    if (expectedSecret && webhookSecret !== expectedSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: ArtifactPayload = await req.json();
    console.log('Received artifact webhook:', JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!payload.name || !payload.registry_url || !payload.image_digest) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          required: ['name', 'registry_url', 'image_digest'] 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate digest to ensure immutability
    const { data: existing } = await supabase
      .from('artifacts')
      .select('id')
      .eq('image_digest', payload.image_digest)
      .single();

    if (existing) {
      console.log('Artifact with this digest already exists:', existing.id);
      return new Response(
        JSON.stringify({ 
          message: 'Artifact already exists', 
          artifact_id: existing.id,
          status: 'duplicate'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the artifact
    const { data: artifact, error: insertError } = await supabase
      .from('artifacts')
      .insert({
        name: payload.name,
        type: payload.type || 'docker',
        registry_url: payload.registry_url,
        image_digest: payload.image_digest,
        image_tag: payload.image_tag,
        version: payload.version,
        size_bytes: payload.size_bytes,
        build_duration_ms: payload.build_duration_ms,
        execution_id: payload.execution_id,
        metadata: payload.metadata || {},
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting artifact:', insertError);
      throw insertError;
    }

    console.log('Artifact created:', artifact.id);

    // If linked to an execution, create an audit log entry
    if (payload.execution_id) {
      await supabase.from('audit_logs').insert({
        action: 'artifact_created',
        resource_type: 'artifact',
        resource_id: artifact.id,
        details: {
          name: payload.name,
          digest: payload.image_digest,
          execution_id: payload.execution_id,
          registry_url: payload.registry_url,
        },
      });
    }

    // Also create a telemetry signal for observability
    await supabase.from('telemetry_signals').insert({
      signal_type: 'artifact_push',
      execution_id: payload.execution_id,
      summary: `Artifact pushed: ${payload.name}:${payload.image_tag || 'latest'}`,
      payload: {
        artifact_id: artifact.id,
        digest: payload.image_digest,
        registry: payload.registry_url,
        size: payload.size_bytes,
      },
      severity: 'info',
    });

    return new Response(
      JSON.stringify({ 
        message: 'Artifact registered successfully',
        artifact_id: artifact.id,
        status: 'created'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Artifact webhook error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
