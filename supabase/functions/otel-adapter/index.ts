import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OTelSignal {
  otel_type: 'trace' | 'log' | 'metric';
  timestamp?: string;
  attributes?: Record<string, any>;
  payload?: Record<string, any>;
  // Trace-specific
  trace_id?: string;
  span_id?: string;
  parent_span_id?: string;
  duration_ms?: number;
  status_code?: string;
  // Log-specific
  severity?: string;
  message?: string;
  // Metric-specific
  metric_name?: string;
  metric_value?: number;
  metric_unit?: string;
}

interface OpzenixContext {
  flow_id?: string;
  execution_id?: string;
  checkpoint_id?: string;
  node_id?: string;
  environment?: string;
  deployment_version?: string;
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

    const body = await req.json();
    console.log('OTel Adapter received:', JSON.stringify(body, null, 2));

    // Handle batch or single signal
    const signals: OTelSignal[] = Array.isArray(body.signals) ? body.signals : [body];
    const results: any[] = [];

    for (const signal of signals) {
      // Extract Opzenix context from attributes
      const attrs = signal.attributes || {};
      const context: OpzenixContext = {
        flow_id: attrs['opzenix.flow_id'] || attrs['flow_id'],
        execution_id: attrs['opzenix.execution_id'] || attrs['execution_id'],
        checkpoint_id: attrs['opzenix.checkpoint_id'] || attrs['checkpoint_id'],
        node_id: attrs['opzenix.node_id'] || attrs['node_id'],
        environment: attrs['opzenix.environment'] || attrs['environment'] || 'development',
        deployment_version: attrs['opzenix.deployment_version'] || attrs['deployment_version'],
      };

      // Determine severity
      let severity = 'info';
      if (signal.severity) {
        severity = signal.severity.toLowerCase();
      } else if (signal.status_code === 'ERROR') {
        severity = 'error';
      }

      // Create summary based on signal type
      let summary = '';
      if (signal.otel_type === 'trace') {
        summary = signal.message || `Span: ${signal.span_id?.substring(0, 8)}`;
        if (signal.duration_ms) {
          summary += ` (${signal.duration_ms}ms)`;
        }
      } else if (signal.otel_type === 'log') {
        summary = signal.message || 'Log entry';
      } else if (signal.otel_type === 'metric') {
        summary = `${signal.metric_name}: ${signal.metric_value} ${signal.metric_unit || ''}`;
      }

      // Build the telemetry record
      const telemetryRecord = {
        signal_type: signal.otel_type,
        flow_id: context.flow_id || null,
        execution_id: context.execution_id || null,
        checkpoint_id: context.checkpoint_id || null,
        node_id: context.node_id,
        environment: context.environment,
        deployment_version: context.deployment_version,
        severity,
        summary,
        payload: signal.payload || {},
        otel_trace_id: signal.trace_id,
        otel_span_id: signal.span_id,
        otel_parent_span_id: signal.parent_span_id,
        resource_attributes: attrs.resource || {},
        span_attributes: attrs.span || attrs,
        duration_ms: signal.duration_ms,
        status_code: signal.status_code,
        created_at: signal.timestamp || new Date().toISOString(),
      };

      // Insert into database
      const { data, error } = await supabase
        .from('telemetry_signals')
        .insert(telemetryRecord)
        .select()
        .single();

      if (error) {
        console.error('Failed to insert telemetry signal:', error);
        results.push({ success: false, error: error.message });
      } else {
        console.log('Telemetry signal stored:', data.id);
        results.push({ success: true, id: data.id, signal_type: signal.otel_type });
      }
    }

    // Return correlation summary
    const response = {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('OTel Adapter error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
