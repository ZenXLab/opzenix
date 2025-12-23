import { supabase } from '@/integrations/supabase/client';

interface OTelSignal {
  otel_type: 'trace' | 'log' | 'metric';
  attributes: Record<string, any>;
  trace_id?: string;
  span_id?: string;
  parent_span_id?: string;
  duration_ms?: number;
  status_code?: string;
  severity?: string;
  message?: string;
  metric_name?: string;
  metric_value?: number;
  metric_unit?: string;
  payload?: Record<string, any>;
}

const generateTraceId = () => Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
const generateSpanId = () => Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

export const seedTestTelemetry = async (nodeId: string, executionId?: string) => {
  const traceId = generateTraceId();
  const signals: OTelSignal[] = [];

  // Generate traces
  const spanIds = [generateSpanId(), generateSpanId(), generateSpanId()];
  
  signals.push({
    otel_type: 'trace',
    trace_id: traceId,
    span_id: spanIds[0],
    duration_ms: Math.floor(Math.random() * 500) + 100,
    status_code: 'OK',
    message: 'Pipeline stage initialized',
    attributes: {
      'opzenix.node_id': nodeId,
      'opzenix.execution_id': executionId,
      'opzenix.environment': 'production',
      'service.name': 'opzenix-executor',
    },
  });

  signals.push({
    otel_type: 'trace',
    trace_id: traceId,
    span_id: spanIds[1],
    parent_span_id: spanIds[0],
    duration_ms: Math.floor(Math.random() * 2000) + 500,
    status_code: Math.random() > 0.8 ? 'ERROR' : 'OK',
    message: 'Executing build process',
    attributes: {
      'opzenix.node_id': nodeId,
      'opzenix.execution_id': executionId,
      'opzenix.environment': 'production',
      'build.command': 'npm run build',
    },
  });

  signals.push({
    otel_type: 'trace',
    trace_id: traceId,
    span_id: spanIds[2],
    parent_span_id: spanIds[1],
    duration_ms: Math.floor(Math.random() * 1000) + 200,
    status_code: 'OK',
    message: 'Artifact upload complete',
    attributes: {
      'opzenix.node_id': nodeId,
      'opzenix.execution_id': executionId,
      'artifact.size_mb': Math.floor(Math.random() * 100) + 10,
    },
  });

  // Generate logs
  const logMessages = [
    { severity: 'info', message: 'Starting execution for node ' + nodeId },
    { severity: 'info', message: 'Pulling latest dependencies...' },
    { severity: 'debug', message: 'Cache hit for node_modules' },
    { severity: 'info', message: 'Running build command: npm run build' },
    { severity: 'warning', message: 'Deprecation warning: node-sass is deprecated' },
    { severity: 'info', message: 'Build completed successfully in 45.2s' },
    { severity: 'info', message: 'Running security scan...' },
    { severity: 'info', message: 'No vulnerabilities found' },
  ];

  for (const log of logMessages) {
    signals.push({
      otel_type: 'log',
      severity: log.severity,
      message: log.message,
      trace_id: traceId,
      attributes: {
        'opzenix.node_id': nodeId,
        'opzenix.execution_id': executionId,
        'opzenix.environment': 'production',
      },
    });
  }

  // Generate metrics
  const metrics = [
    { name: 'cpu_usage_percent', value: Math.random() * 80 + 10, unit: '%' },
    { name: 'memory_usage_mb', value: Math.floor(Math.random() * 2000) + 500, unit: 'MB' },
    { name: 'build_duration_seconds', value: Math.random() * 120 + 30, unit: 's' },
    { name: 'artifact_size_mb', value: Math.floor(Math.random() * 50) + 5, unit: 'MB' },
    { name: 'test_coverage_percent', value: Math.random() * 30 + 70, unit: '%' },
  ];

  for (const metric of metrics) {
    signals.push({
      otel_type: 'metric',
      metric_name: metric.name,
      metric_value: metric.value,
      metric_unit: metric.unit,
      attributes: {
        'opzenix.node_id': nodeId,
        'opzenix.execution_id': executionId,
        'opzenix.environment': 'production',
      },
    });
  }

  // Send to OTel adapter
  try {
    const { data, error } = await supabase.functions.invoke('otel-adapter', {
      body: { signals }
    });

    if (error) {
      console.error('Failed to send test telemetry:', error);
      return { success: false, error };
    }

    console.log('Test telemetry seeded:', data);
    return { success: true, data, traceId };
  } catch (err) {
    console.error('Telemetry seed error:', err);
    return { success: false, error: err };
  }
};

export const seedBulkTelemetry = async (nodeIds: string[]) => {
  const results = [];
  for (const nodeId of nodeIds) {
    const result = await seedTestTelemetry(nodeId);
    results.push({ nodeId, ...result });
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }
  return results;
};
