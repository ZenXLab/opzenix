import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type StepType = 'sast' | 'dast' | 'secrets' | 'dependency' | 'test' | 'build' | 'scan' | 'sign';
type StepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

interface CIEvidencePayload {
  execution_id: string;
  step_name: string;
  step_type: StepType;
  step_order?: number;
  status: StepStatus;
  evidence_url?: string;
  summary?: string;
  details?: Record<string, unknown>;
  duration_ms?: number;
  started_at?: string;
  completed_at?: string;
}

// Default step order mapping for OPZENIX CI pipeline
const STEP_ORDER_MAP: Record<StepType, number> = {
  sast: 1,
  secrets: 2,
  dependency: 3,
  test: 4,
  build: 5,
  scan: 6,
  sign: 7,
  dast: 8
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: CIEvidencePayload | CIEvidencePayload[] = await req.json();
    const evidenceItems = Array.isArray(payload) ? payload : [payload];

    console.log(`[record-ci-evidence] Recording ${evidenceItems.length} evidence item(s)`);

    const results = [];

    for (const evidence of evidenceItems) {
      const {
        execution_id,
        step_name,
        step_type,
        step_order,
        status,
        evidence_url,
        summary,
        details,
        duration_ms,
        started_at,
        completed_at
      } = evidence;

      if (!execution_id || !step_name || !step_type || !status) {
        console.error('[record-ci-evidence] Missing required fields:', { execution_id, step_name, step_type, status });
        continue;
      }

      console.log(`[record-ci-evidence] Recording: ${step_name} (${step_type}) - ${status}`);

      // Check if evidence for this step already exists
      const { data: existing } = await supabase
        .from('ci_evidence')
        .select('id')
        .eq('execution_id', execution_id)
        .eq('step_name', step_name)
        .single();

      let result;

      if (existing) {
        // Update existing evidence
        const { data, error } = await supabase
          .from('ci_evidence')
          .update({
            status,
            summary,
            details,
            duration_ms,
            completed_at: completed_at || (status !== 'running' && status !== 'pending' ? new Date().toISOString() : null)
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('[record-ci-evidence] Update error:', error);
          throw error;
        }
        result = data;
        console.log(`[record-ci-evidence] Updated evidence ID: ${data.id}`);
      } else {
        // Insert new evidence
        const { data, error } = await supabase
          .from('ci_evidence')
          .insert({
            execution_id,
            step_name,
            step_type,
            step_order: step_order ?? STEP_ORDER_MAP[step_type] ?? 99,
            status,
            evidence_url,
            summary,
            details: details || {},
            duration_ms,
            started_at: started_at || (status === 'running' ? new Date().toISOString() : null),
            completed_at: completed_at || (status !== 'running' && status !== 'pending' ? new Date().toISOString() : null)
          })
          .select()
          .single();

        if (error) {
          console.error('[record-ci-evidence] Insert error:', error);
          throw error;
        }
        result = data;
        console.log(`[record-ci-evidence] Created evidence ID: ${data.id}`);
      }

      results.push(result);
    }

    // Update execution progress based on evidence
    if (results.length > 0) {
      const executionId = results[0].execution_id;
      
      const { data: allEvidence } = await supabase
        .from('ci_evidence')
        .select('status')
        .eq('execution_id', executionId);

      if (allEvidence) {
        const total = allEvidence.length;
        const completed = allEvidence.filter(e => e.status === 'passed' || e.status === 'failed' || e.status === 'skipped').length;
        const failed = allEvidence.filter(e => e.status === 'failed').length;
        const progress = Math.round((completed / Math.max(total, 8)) * 100); // Assume 8 steps max

        await supabase
          .from('executions')
          .update({ 
            progress,
            status: failed > 0 ? 'failed' : (progress >= 100 ? 'succeeded' : 'running')
          })
          .eq('id', executionId);

        console.log(`[record-ci-evidence] Updated execution progress: ${progress}%`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        recorded: results.length,
        data: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[record-ci-evidence] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
