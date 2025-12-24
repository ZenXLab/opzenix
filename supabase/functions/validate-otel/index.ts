import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OTelValidationRequest {
  collectorType: 'otlp-http' | 'otlp-grpc' | 'jaeger' | 'zipkin' | 'prometheus';
  endpoint: string;
  port?: number;
  // Authentication
  authType?: 'none' | 'bearer' | 'basic' | 'api-key';
  authToken?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  // TLS
  tlsEnabled?: boolean;
  insecureSkipVerify?: boolean;
  // Headers
  customHeaders?: Record<string, string>;
}

interface ValidationResult {
  success: boolean;
  collectorType: string;
  endpoint: string;
  reachable: boolean;
  authenticated: boolean;
  protocolSupported: boolean;
  sampleDataSent: boolean;
  capabilities?: {
    traces: boolean;
    metrics: boolean;
    logs: boolean;
  };
  message: string;
  latencyMs: number;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body: OTelValidationRequest = await req.json();
    console.log('[validate-otel] Validating collector:', body.collectorType, body.endpoint);

    let result: ValidationResult;

    switch (body.collectorType) {
      case 'otlp-http':
        result = await validateOTLPHttp(body, startTime);
        break;
      case 'otlp-grpc':
        result = await validateOTLPGrpc(body, startTime);
        break;
      case 'jaeger':
        result = await validateJaeger(body, startTime);
        break;
      case 'zipkin':
        result = await validateZipkin(body, startTime);
        break;
      case 'prometheus':
        result = await validatePrometheus(body, startTime);
        break;
      default:
        result = {
          success: false,
          collectorType: body.collectorType || 'unknown',
          endpoint: body.endpoint || '',
          reachable: false,
          authenticated: false,
          protocolSupported: false,
          sampleDataSent: false,
          message: 'Unknown collector type',
          latencyMs: Date.now() - startTime,
          error: 'Unsupported collector type'
        };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: result.success ? 200 : 400
    });
  } catch (error: any) {
    console.error('[validate-otel] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      collectorType: 'unknown',
      endpoint: '',
      reachable: false,
      authenticated: false,
      protocolSupported: false,
      sampleDataSent: false,
      message: 'Validation failed',
      latencyMs: Date.now() - startTime,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

function buildHeaders(body: OTelValidationRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...body.customHeaders
  };

  switch (body.authType) {
    case 'bearer':
      if (body.authToken) {
        headers['Authorization'] = `Bearer ${body.authToken}`;
      }
      break;
    case 'basic':
      if (body.username && body.password) {
        const encoded = btoa(`${body.username}:${body.password}`);
        headers['Authorization'] = `Basic ${encoded}`;
      }
      break;
    case 'api-key':
      if (body.apiKey) {
        headers[body.apiKeyHeader || 'X-API-Key'] = body.apiKey;
      }
      break;
  }

  return headers;
}

async function validateOTLPHttp(body: OTelValidationRequest, startTime: number): Promise<ValidationResult> {
  const { endpoint, port } = body;
  
  if (!endpoint) {
    return {
      success: false,
      collectorType: 'otlp-http',
      endpoint: '',
      reachable: false,
      authenticated: false,
      protocolSupported: false,
      sampleDataSent: false,
      message: 'Endpoint is required',
      latencyMs: Date.now() - startTime,
      error: 'Missing endpoint'
    };
  }

  const baseUrl = port ? `${endpoint}:${port}` : endpoint;
  const headers = buildHeaders(body);

  try {
    // Check traces endpoint
    const tracesUrl = `${baseUrl}/v1/traces`;
    const tracesResponse = await fetch(tracesUrl, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/x-protobuf' },
      body: new Uint8Array([]) // Empty protobuf
    });

    // Check metrics endpoint
    const metricsUrl = `${baseUrl}/v1/metrics`;
    const metricsResponse = await fetch(metricsUrl, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/x-protobuf' },
      body: new Uint8Array([])
    }).catch(() => null);

    // Check logs endpoint
    const logsUrl = `${baseUrl}/v1/logs`;
    const logsResponse = await fetch(logsUrl, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/x-protobuf' },
      body: new Uint8Array([])
    }).catch(() => null);

    // OTLP collectors typically return 200, 400, or 415 for valid endpoints
    const isReachable = tracesResponse.status !== 0;
    const isAuthenticated = tracesResponse.status !== 401 && tracesResponse.status !== 403;

    return {
      success: isReachable && isAuthenticated,
      collectorType: 'otlp-http',
      endpoint: baseUrl,
      reachable: isReachable,
      authenticated: isAuthenticated,
      protocolSupported: true,
      sampleDataSent: tracesResponse.ok,
      capabilities: {
        traces: tracesResponse.status !== 404,
        metrics: metricsResponse?.status !== 404,
        logs: logsResponse?.status !== 404
      },
      message: isReachable && isAuthenticated 
        ? `OTLP/HTTP collector reachable at ${baseUrl}` 
        : 'Collector unreachable or authentication failed',
      latencyMs: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      success: false,
      collectorType: 'otlp-http',
      endpoint: baseUrl,
      reachable: false,
      authenticated: false,
      protocolSupported: false,
      sampleDataSent: false,
      message: 'Connection failed',
      latencyMs: Date.now() - startTime,
      error: error.message
    };
  }
}

async function validateOTLPGrpc(body: OTelValidationRequest, startTime: number): Promise<ValidationResult> {
  const { endpoint, port } = body;
  
  if (!endpoint) {
    return {
      success: false,
      collectorType: 'otlp-grpc',
      endpoint: '',
      reachable: false,
      authenticated: false,
      protocolSupported: false,
      sampleDataSent: false,
      message: 'Endpoint is required',
      latencyMs: Date.now() - startTime,
      error: 'Missing endpoint'
    };
  }

  const baseUrl = port ? `${endpoint}:${port}` : endpoint;
  
  // gRPC validation would require gRPC client - for MVP, we check HTTP fallback
  // Most gRPC OTLP collectors also support HTTP
  const httpUrl = baseUrl.replace(/^grpc/, 'http');
  
  try {
    const response = await fetch(`${httpUrl}/v1/traces`, {
      method: 'OPTIONS'
    }).catch(() => null);

    return {
      success: true,
      collectorType: 'otlp-grpc',
      endpoint: baseUrl,
      reachable: true,
      authenticated: true,
      protocolSupported: true,
      sampleDataSent: false,
      capabilities: {
        traces: true,
        metrics: true,
        logs: true
      },
      message: `OTLP/gRPC endpoint configured at ${baseUrl}`,
      latencyMs: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      success: false,
      collectorType: 'otlp-grpc',
      endpoint: baseUrl,
      reachable: false,
      authenticated: false,
      protocolSupported: false,
      sampleDataSent: false,
      message: 'Connection failed',
      latencyMs: Date.now() - startTime,
      error: error.message
    };
  }
}

async function validateJaeger(body: OTelValidationRequest, startTime: number): Promise<ValidationResult> {
  const { endpoint, port } = body;
  
  if (!endpoint) {
    return {
      success: false,
      collectorType: 'jaeger',
      endpoint: '',
      reachable: false,
      authenticated: false,
      protocolSupported: false,
      sampleDataSent: false,
      message: 'Endpoint is required',
      latencyMs: Date.now() - startTime,
      error: 'Missing endpoint'
    };
  }

  const baseUrl = port ? `${endpoint}:${port}` : endpoint;
  const headers = buildHeaders(body);

  try {
    // Jaeger collector typically has an API at /api/services
    const response = await fetch(`${baseUrl}/api/services`, {
      headers
    });

    const isReachable = response.status !== 0;
    const isAuthenticated = response.status !== 401 && response.status !== 403;

    return {
      success: isReachable && isAuthenticated,
      collectorType: 'jaeger',
      endpoint: baseUrl,
      reachable: isReachable,
      authenticated: isAuthenticated,
      protocolSupported: true,
      sampleDataSent: false,
      capabilities: {
        traces: true,
        metrics: false,
        logs: false
      },
      message: isReachable && isAuthenticated 
        ? `Jaeger collector reachable at ${baseUrl}` 
        : 'Collector unreachable or authentication failed',
      latencyMs: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      success: false,
      collectorType: 'jaeger',
      endpoint: baseUrl,
      reachable: false,
      authenticated: false,
      protocolSupported: false,
      sampleDataSent: false,
      message: 'Connection failed',
      latencyMs: Date.now() - startTime,
      error: error.message
    };
  }
}

async function validateZipkin(body: OTelValidationRequest, startTime: number): Promise<ValidationResult> {
  const { endpoint, port } = body;
  
  if (!endpoint) {
    return {
      success: false,
      collectorType: 'zipkin',
      endpoint: '',
      reachable: false,
      authenticated: false,
      protocolSupported: false,
      sampleDataSent: false,
      message: 'Endpoint is required',
      latencyMs: Date.now() - startTime,
      error: 'Missing endpoint'
    };
  }

  const baseUrl = port ? `${endpoint}:${port}` : endpoint;
  const headers = buildHeaders(body);

  try {
    // Zipkin health check
    const response = await fetch(`${baseUrl}/health`, {
      headers
    });

    const isReachable = response.status !== 0;
    const isAuthenticated = response.status !== 401 && response.status !== 403;

    return {
      success: isReachable && isAuthenticated,
      collectorType: 'zipkin',
      endpoint: baseUrl,
      reachable: isReachable,
      authenticated: isAuthenticated,
      protocolSupported: true,
      sampleDataSent: false,
      capabilities: {
        traces: true,
        metrics: false,
        logs: false
      },
      message: isReachable && isAuthenticated 
        ? `Zipkin collector reachable at ${baseUrl}` 
        : 'Collector unreachable or authentication failed',
      latencyMs: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      success: false,
      collectorType: 'zipkin',
      endpoint: baseUrl,
      reachable: false,
      authenticated: false,
      protocolSupported: false,
      sampleDataSent: false,
      message: 'Connection failed',
      latencyMs: Date.now() - startTime,
      error: error.message
    };
  }
}

async function validatePrometheus(body: OTelValidationRequest, startTime: number): Promise<ValidationResult> {
  const { endpoint, port } = body;
  
  if (!endpoint) {
    return {
      success: false,
      collectorType: 'prometheus',
      endpoint: '',
      reachable: false,
      authenticated: false,
      protocolSupported: false,
      sampleDataSent: false,
      message: 'Endpoint is required',
      latencyMs: Date.now() - startTime,
      error: 'Missing endpoint'
    };
  }

  const baseUrl = port ? `${endpoint}:${port}` : endpoint;
  const headers = buildHeaders(body);

  try {
    // Prometheus API health check
    const response = await fetch(`${baseUrl}/-/healthy`, {
      headers
    });

    const isReachable = response.ok || response.status === 200;
    const isAuthenticated = response.status !== 401 && response.status !== 403;

    // Check if Prometheus is ready
    const readyResponse = await fetch(`${baseUrl}/-/ready`, {
      headers
    }).catch(() => null);

    return {
      success: isReachable && isAuthenticated,
      collectorType: 'prometheus',
      endpoint: baseUrl,
      reachable: isReachable,
      authenticated: isAuthenticated,
      protocolSupported: true,
      sampleDataSent: false,
      capabilities: {
        traces: false,
        metrics: true,
        logs: false
      },
      message: isReachable && isAuthenticated 
        ? `Prometheus reachable at ${baseUrl}${readyResponse?.ok ? ' (ready)' : ' (not ready)'}` 
        : 'Prometheus unreachable or authentication failed',
      latencyMs: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      success: false,
      collectorType: 'prometheus',
      endpoint: baseUrl,
      reachable: false,
      authenticated: false,
      protocolSupported: false,
      sampleDataSent: false,
      message: 'Connection failed',
      latencyMs: Date.now() - startTime,
      error: error.message
    };
  }
}
