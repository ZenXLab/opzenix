import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Activity, BarChart3, Search, Terminal, CheckCircle2, 
  AlertTriangle, Settings, Layers, GitBranch, Zap
} from 'lucide-react';

export default function OpenTelemetryDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span>Setup Guides</span>
            <span>/</span>
            <span className="text-foreground">Enable OpenTelemetry</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Enable OpenTelemetry</h1>
          <p className="text-lg text-muted-foreground">
            Configure OpenTelemetry (OTel) integration for unified observability across your 
            deployments. Collect traces, metrics, and logs from your applications and correlate 
            them with deployment events.
          </p>
        </div>

        {/* What is OpenTelemetry */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">What is OpenTelemetry?</h2>
          <p className="text-muted-foreground mb-6">
            OpenTelemetry is a vendor-neutral observability framework that provides APIs, SDKs, 
            and tools for instrumenting, generating, collecting, and exporting telemetry data.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Traces</h3>
                <p className="text-xs text-muted-foreground">
                  Follow requests across services to identify bottlenecks and failures
                </p>
              </CardContent>
            </Card>

            <Card className="border-chart-1/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-chart-1/10 flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-chart-1" />
                </div>
                <h3 className="font-semibold mb-2">Metrics</h3>
                <p className="text-xs text-muted-foreground">
                  Aggregate measurements like latency, error rates, and throughput
                </p>
              </CardContent>
            </Card>

            <Card className="border-sec-safe/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-sec-safe/10 flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-sec-safe" />
                </div>
                <h3 className="font-semibold mb-2">Logs</h3>
                <p className="text-xs text-muted-foreground">
                  Structured log events correlated with traces for debugging
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Architecture */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Architecture Overview
          </h2>
          
          <Card className="mb-6 bg-muted/30">
            <CardContent className="p-6">
              <pre className="text-sm font-mono text-muted-foreground">
{`┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Your App      │────▶│  OTel Collector  │────▶│    Opzenix      │
│ (instrumented)  │     │   (sidecar or    │     │  Telemetry API  │
└─────────────────┘     │    deployment)   │     └─────────────────┘
                        └──────────────────┘              │
                                 │                        ▼
                                 │              ┌─────────────────┐
                                 └─────────────▶│   Your Backend  │
                                                │  (Jaeger, etc)  │
                                                └─────────────────┘`}
              </pre>
            </CardContent>
          </Card>
          
          <p className="text-muted-foreground">
            Opzenix can receive telemetry data directly via OTLP (OpenTelemetry Protocol) and 
            correlate it with deployments, executions, and checkpoints for enhanced debugging.
          </p>
        </section>

        {/* Quick Start */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6">Quick Start Setup</h2>

          <Step number={1} title="Deploy OpenTelemetry Collector">
            <p className="mb-3">Deploy the OTel Collector as a sidecar or DaemonSet in your cluster:</p>
            <CodeBlock
              title="otel-collector.yaml"
              language="yaml"
              code={`apiVersion: apps/v1
kind: Deployment
metadata:
  name: otel-collector
  namespace: opzenix-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: otel-collector
  template:
    metadata:
      labels:
        app: otel-collector
    spec:
      containers:
        - name: collector
          image: otel/opentelemetry-collector-contrib:latest
          ports:
            - containerPort: 4317  # OTLP gRPC
            - containerPort: 4318  # OTLP HTTP
            - containerPort: 8888  # Metrics
          volumeMounts:
            - name: config
              mountPath: /etc/otelcol
      volumes:
        - name: config
          configMap:
            name: otel-collector-config
---
apiVersion: v1
kind: Service
metadata:
  name: otel-collector
  namespace: opzenix-system
spec:
  ports:
    - name: otlp-grpc
      port: 4317
    - name: otlp-http
      port: 4318
  selector:
    app: otel-collector`}
            />
          </Step>

          <Step number={2} title="Configure Collector">
            <p className="mb-3">Create the collector configuration with Opzenix as an exporter:</p>
            <CodeBlock
              title="otel-config.yaml"
              language="yaml"
              code={`apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
  namespace: opzenix-system
data:
  config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318

    processors:
      batch:
        timeout: 10s
        send_batch_size: 1024
      
      # Add deployment metadata
      resource:
        attributes:
          - key: deployment.environment
            value: "\${ENVIRONMENT}"
            action: upsert
          - key: service.namespace
            value: "\${NAMESPACE}"
            action: upsert

    exporters:
      # Send to Opzenix
      otlphttp:
        endpoint: "https://your-project.supabase.co/functions/v1/otel-adapter"
        headers:
          Authorization: "Bearer \${OPZENIX_API_KEY}"
      
      # Optional: Also send to your observability backend
      jaeger:
        endpoint: "jaeger-collector.observability:14250"
        tls:
          insecure: true

    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [batch, resource]
          exporters: [otlphttp, jaeger]
        metrics:
          receivers: [otlp]
          processors: [batch]
          exporters: [otlphttp]
        logs:
          receivers: [otlp]
          processors: [batch]
          exporters: [otlphttp]`}
            />
          </Step>

          <Step number={3} title="Instrument Your Application">
            <p className="mb-3">Add OpenTelemetry SDK to your application. Example for Node.js:</p>
            <CodeBlock
              title="Install packages"
              language="bash"
              code={`npm install @opentelemetry/sdk-node \\
  @opentelemetry/auto-instrumentations-node \\
  @opentelemetry/exporter-trace-otlp-grpc \\
  @opentelemetry/exporter-metrics-otlp-grpc`}
            />
            
            <CodeBlock
              title="tracing.ts"
              language="typescript"
              code={`import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const sdk = new NodeSDK({
  serviceName: process.env.SERVICE_NAME || 'my-service',
  
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4317',
  }),
  
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4317',
    }),
    exportIntervalMillis: 60000,
  }),
  
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
    }),
  ],
});

sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Telemetry shutdown complete'))
    .catch((error) => console.error('Error shutting down telemetry', error))
    .finally(() => process.exit(0));
});`}
            />
            
            <CodeBlock
              title="app.ts (import at top)"
              language="typescript"
              code={`// Import tracing first, before other imports
import './tracing';

import express from 'express';
// ... rest of your app`}
            />
          </Step>

          <Step number={4} title="Configure Environment Variables">
            <p className="mb-3">Set the required environment variables in your deployment:</p>
            <CodeBlock
              title="deployment.yaml (environment section)"
              language="yaml"
              code={`env:
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: "http://otel-collector.opzenix-system:4317"
  - name: OTEL_SERVICE_NAME
    value: "my-service"
  - name: OTEL_RESOURCE_ATTRIBUTES
    value: "deployment.environment=production,service.version=1.2.3"
  - name: OTEL_TRACES_SAMPLER
    value: "parentbased_traceidratio"
  - name: OTEL_TRACES_SAMPLER_ARG
    value: "0.1"  # Sample 10% of traces`}
            />
          </Step>
        </section>

        {/* Language SDKs */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Language-Specific Setup</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <Badge className="mb-3 bg-chart-2/20 text-chart-2">Python</Badge>
                <CodeBlock
                  language="bash"
                  code={`pip install opentelemetry-distro \\
  opentelemetry-exporter-otlp

opentelemetry-bootstrap -a install

# Run with auto-instrumentation
opentelemetry-instrument python app.py`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Badge className="mb-3 bg-sec-warning/20 text-sec-warning">Go</Badge>
                <CodeBlock
                  language="bash"
                  code={`go get go.opentelemetry.io/otel
go get go.opentelemetry.io/otel/sdk
go get go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Badge className="mb-3 bg-primary/20 text-primary">Java</Badge>
                <CodeBlock
                  language="bash"
                  code={`# Download agent
curl -L https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar -o opentelemetry-javaagent.jar

# Run with agent
java -javaagent:opentelemetry-javaagent.jar \\
  -Dotel.service.name=my-service \\
  -jar myapp.jar`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Badge className="mb-3 bg-sec-critical/20 text-sec-critical">.NET</Badge>
                <CodeBlock
                  language="bash"
                  code={`dotnet add package OpenTelemetry
dotnet add package OpenTelemetry.Extensions.Hosting
dotnet add package OpenTelemetry.Exporter.OpenTelemetryProtocol
dotnet add package OpenTelemetry.Instrumentation.AspNetCore`}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Viewing Telemetry in Opzenix */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Viewing Telemetry in Opzenix
          </h2>
          
          <p className="text-muted-foreground mb-4">
            Once configured, telemetry data appears in several places within Opzenix:
          </p>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Execution Flow View
                </h4>
                <p className="text-sm text-muted-foreground">
                  Traces are correlated with pipeline executions. Click on any node to see 
                  associated spans, latency breakdowns, and error details.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <GitBranch className="w-4 h-4 text-chart-1" />
                  Deployment Insights
                </h4>
                <p className="text-sm text-muted-foreground">
                  Compare metrics before and after deployments. Automatic anomaly detection 
                  flags latency regressions or error rate spikes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-sec-safe" />
                  Checkpoint Correlation
                </h4>
                <p className="text-sm text-muted-foreground">
                  When rewinding to a checkpoint, see the telemetry state at that exact 
                  point in time for accurate debugging.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Custom Spans */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Adding Custom Spans</h2>
          
          <p className="text-muted-foreground mb-4">
            Add custom instrumentation to capture business-specific operations:
          </p>

          <CodeBlock
            title="Custom span example (TypeScript)"
            language="typescript"
            code={`import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('my-service');

async function processOrder(orderId: string) {
  // Create a custom span
  return tracer.startActiveSpan('process-order', async (span) => {
    try {
      // Add attributes for context
      span.setAttribute('order.id', orderId);
      span.setAttribute('order.type', 'subscription');

      // Nested span for database operation
      await tracer.startActiveSpan('db.fetch-order', async (dbSpan) => {
        const order = await database.getOrder(orderId);
        dbSpan.setAttribute('db.rows_affected', 1);
        dbSpan.end();
        return order;
      });

      // Nested span for payment processing
      await tracer.startActiveSpan('payment.charge', async (paymentSpan) => {
        paymentSpan.setAttribute('payment.provider', 'stripe');
        await paymentService.charge(orderId);
        paymentSpan.end();
      });

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}`}
          />
        </section>

        {/* Sampling Strategies */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Sampling Strategies
          </h2>
          
          <Callout type="info" title="Why Sample?">
            In high-traffic applications, collecting 100% of traces can be expensive. 
            Sampling allows you to capture representative data while controlling costs.
          </Callout>

          <div className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Head-based Sampling</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Decision made at trace start. Simple but may miss errors.
                </p>
                <CodeBlock
                  language="yaml"
                  code={`OTEL_TRACES_SAMPLER: "parentbased_traceidratio"
OTEL_TRACES_SAMPLER_ARG: "0.1"  # 10% sampling`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Tail-based Sampling (Recommended)</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Decision made after trace completes. Captures all errors and slow requests.
                </p>
                <CodeBlock
                  language="yaml"
                  code={`# In otel-collector config
processors:
  tail_sampling:
    decision_wait: 10s
    policies:
      # Always capture errors
      - name: errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      # Capture slow requests
      - name: slow
        type: latency
        latency: { threshold_ms: 1000 }
      # Sample 5% of remaining
      - name: baseline
        type: probabilistic
        probabilistic: { sampling_percentage: 5 }`}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Troubleshooting */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-sec-warning" />
            Troubleshooting
          </h2>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">No traces appearing</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Check collector connectivity and configuration:
                </p>
                <CodeBlock
                  language="bash"
                  code={`# Check collector logs
kubectl logs -n opzenix-system deployment/otel-collector

# Test OTLP endpoint
curl -v http://otel-collector:4318/v1/traces

# Verify service can reach collector
kubectl exec -it my-app-pod -- curl http://otel-collector.opzenix-system:4318/v1/traces`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">High memory usage</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Tune batch processor settings:
                </p>
                <CodeBlock
                  language="yaml"
                  code={`processors:
  batch:
    timeout: 5s
    send_batch_size: 512
    send_batch_max_size: 1024
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
    spike_limit_mib: 128`}
                />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}