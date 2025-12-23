-- Create telemetry signals table for OTel data
CREATE TABLE public.telemetry_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('trace', 'log', 'metric')),
  flow_id UUID REFERENCES public.flow_templates(id) ON DELETE SET NULL,
  execution_id UUID REFERENCES public.executions(id) ON DELETE CASCADE,
  checkpoint_id UUID REFERENCES public.checkpoints(id) ON DELETE SET NULL,
  node_id TEXT,
  environment TEXT DEFAULT 'development',
  deployment_version TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  summary TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  otel_trace_id TEXT,
  otel_span_id TEXT,
  otel_parent_span_id TEXT,
  resource_attributes JSONB DEFAULT '{}',
  span_attributes JSONB DEFAULT '{}',
  duration_ms INTEGER,
  status_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_telemetry_signals_execution_id ON public.telemetry_signals(execution_id);
CREATE INDEX idx_telemetry_signals_node_id ON public.telemetry_signals(node_id);
CREATE INDEX idx_telemetry_signals_signal_type ON public.telemetry_signals(signal_type);
CREATE INDEX idx_telemetry_signals_created_at ON public.telemetry_signals(created_at DESC);
CREATE INDEX idx_telemetry_signals_otel_trace_id ON public.telemetry_signals(otel_trace_id);

-- Enable RLS
ALTER TABLE public.telemetry_signals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view telemetry signals"
ON public.telemetry_signals
FOR SELECT
USING (true);

CREATE POLICY "System can insert telemetry signals"
ON public.telemetry_signals
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Operators can manage telemetry signals"
ON public.telemetry_signals
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- Enable realtime for telemetry signals
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_signals;