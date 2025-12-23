import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nodeId, executionId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch telemetry signals for the node
    let query = supabase
      .from('telemetry_signals')
      .select('*')
      .eq('node_id', nodeId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (executionId) {
      query = query.eq('execution_id', executionId);
    }

    const { data: signals, error: fetchError } = await query;

    if (fetchError) {
      console.error('Failed to fetch telemetry:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch telemetry data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!signals || signals.length === 0) {
      return new Response(JSON.stringify({
        analysis: "No telemetry data available for this node. Send OTel signals to enable AI-powered analysis.",
        evidence: [],
        recommendations: [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare telemetry summary for AI
    const traces = signals.filter(s => s.signal_type === 'trace');
    const logs = signals.filter(s => s.signal_type === 'log');
    const metrics = signals.filter(s => s.signal_type === 'metric');
    
    const errorTraces = traces.filter(t => t.status_code === 'ERROR');
    const warningLogs = logs.filter(l => l.severity === 'warning' || l.severity === 'error');
    
    const telemetrySummary = {
      totalTraces: traces.length,
      errorTraces: errorTraces.length,
      avgDuration: traces.length > 0 
        ? Math.round(traces.reduce((sum, t) => sum + (t.duration_ms || 0), 0) / traces.length) 
        : 0,
      totalLogs: logs.length,
      warningLogs: warningLogs.length,
      metrics: metrics.map(m => m.summary).slice(0, 5),
      recentErrors: errorTraces.slice(0, 3).map(t => ({
        traceId: t.otel_trace_id,
        spanId: t.otel_span_id,
        summary: t.summary,
        timestamp: t.created_at,
      })),
      recentWarnings: warningLogs.slice(0, 3).map(l => ({
        message: l.summary,
        timestamp: l.created_at,
      })),
    };

    // Check if Lovable AI is available
    if (!lovableApiKey) {
      // Return rule-based analysis if no AI key
      const analysis = generateRuleBasedAnalysis(telemetrySummary);
      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Lovable AI for analysis
    const prompt = `You are an expert SRE/DevOps engineer analyzing OpenTelemetry signals from a CI/CD pipeline node.

Analyze this telemetry data and provide:
1. A brief root cause analysis (2-3 sentences)
2. Evidence (reference specific trace IDs)
3. Actionable recommendations

Telemetry Summary:
- Total traces: ${telemetrySummary.totalTraces}
- Error traces: ${telemetrySummary.errorTraces}
- Average span duration: ${telemetrySummary.avgDuration}ms
- Total logs: ${telemetrySummary.totalLogs}
- Warning/Error logs: ${telemetrySummary.warningLogs}
- Recent errors: ${JSON.stringify(telemetrySummary.recentErrors)}
- Recent warnings: ${JSON.stringify(telemetrySummary.recentWarnings)}
- Metrics: ${telemetrySummary.metrics.join(', ')}

Respond in JSON format:
{
  "analysis": "Your root cause analysis here",
  "severity": "info|warning|error",
  "evidence": [{"traceId": "...", "finding": "..."}],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert SRE analyzing telemetry data. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      // Fallback to rule-based analysis
      const analysis = generateRuleBasedAnalysis(telemetrySummary);
      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '';
    
    // Parse AI response
    let parsedAnalysis;
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      // Fallback if parsing fails
      parsedAnalysis = {
        analysis: content.substring(0, 500),
        severity: telemetrySummary.errorTraces > 0 ? 'error' : 'info',
        evidence: telemetrySummary.recentErrors.map(e => ({
          traceId: e.traceId,
          finding: e.summary,
        })),
        recommendations: ['Review error traces', 'Check service dependencies'],
      };
    }

    return new Response(JSON.stringify({
      ...parsedAnalysis,
      telemetrySummary,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateRuleBasedAnalysis(summary: any) {
  const { errorTraces, avgDuration, warningLogs, recentErrors } = summary;
  
  let severity = 'info';
  let analysis = 'System is operating within normal parameters.';
  const recommendations: string[] = [];
  const evidence: any[] = [];

  if (errorTraces > 0) {
    severity = 'error';
    analysis = `Detected ${errorTraces} error trace(s) indicating potential issues with this pipeline stage. `;
    
    if (recentErrors.length > 0) {
      analysis += `Most recent error occurred at ${recentErrors[0].timestamp}.`;
      evidence.push({
        traceId: recentErrors[0].traceId,
        finding: recentErrors[0].summary,
      });
    }
    
    recommendations.push('Investigate error traces for root cause');
    recommendations.push('Check downstream service availability');
  } else if (warningLogs > 0) {
    severity = 'warning';
    analysis = `Found ${warningLogs} warning log(s) that may indicate degraded performance or deprecated dependencies.`;
    recommendations.push('Review warning logs for deprecation notices');
    recommendations.push('Consider updating dependencies');
  }

  if (avgDuration > 1000) {
    if (severity === 'info') severity = 'warning';
    analysis += ` Average span duration of ${avgDuration}ms exceeds recommended threshold.`;
    recommendations.push('Optimize slow operations');
    recommendations.push('Consider adding caching');
  }

  return { analysis, severity, evidence, recommendations };
}
