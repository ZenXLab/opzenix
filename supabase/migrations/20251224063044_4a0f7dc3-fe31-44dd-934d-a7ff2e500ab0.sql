-- Create execution_logs table for node-scoped logs
CREATE TABLE IF NOT EXISTS public.execution_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id uuid NOT NULL REFERENCES public.executions(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  message text NOT NULL,
  level text NOT NULL DEFAULT 'info',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on execution_logs
ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for execution_logs
CREATE POLICY "Authenticated users can view execution logs"
  ON public.execution_logs
  FOR SELECT
  USING (true);

CREATE POLICY "Operators can manage execution logs"
  ON public.execution_logs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "System can insert execution logs"
  ON public.execution_logs
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime on execution_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.execution_logs;

-- Create github_integrations table for storing GitHub connection info
CREATE TABLE IF NOT EXISTS public.github_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  repository_owner text NOT NULL,
  repository_name text NOT NULL,
  workflow_file text NOT NULL DEFAULT 'opzenix-pipeline.yml',
  default_branch text NOT NULL DEFAULT 'main',
  webhook_secret text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on github_integrations
ALTER TABLE public.github_integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for github_integrations
CREATE POLICY "Users can view own github integrations"
  ON public.github_integrations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own github integrations"
  ON public.github_integrations
  FOR ALL
  USING (user_id = auth.uid());

-- Create pipeline_templates table for storing templates
CREATE TABLE IF NOT EXISTS public.pipeline_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  stages integer NOT NULL DEFAULT 0,
  popularity numeric(3,1) NOT NULL DEFAULT 0,
  tags text[] DEFAULT '{}',
  nodes jsonb NOT NULL DEFAULT '[]',
  edges jsonb NOT NULL DEFAULT '[]',
  created_by uuid,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on pipeline_templates
ALTER TABLE public.pipeline_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pipeline_templates
CREATE POLICY "Anyone can view public templates"
  ON public.pipeline_templates
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view own templates"
  ON public.pipeline_templates
  FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can manage own templates"
  ON public.pipeline_templates
  FOR ALL
  USING (created_by = auth.uid());

-- Create widget_metrics table for dashboard widgets
CREATE TABLE IF NOT EXISTS public.widget_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  widget_type text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric,
  metadata jsonb DEFAULT '{}',
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on widget_metrics
ALTER TABLE public.widget_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for widget_metrics
CREATE POLICY "Authenticated users can view widget metrics"
  ON public.widget_metrics
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert widget metrics"
  ON public.widget_metrics
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime on widget_metrics
ALTER PUBLICATION supabase_realtime ADD TABLE public.widget_metrics;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_execution_logs_execution_id ON public.execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_node_id ON public.execution_logs(node_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_created_at ON public.execution_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_widget_metrics_widget_type ON public.widget_metrics(widget_type);
CREATE INDEX IF NOT EXISTS idx_widget_metrics_recorded_at ON public.widget_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_templates_category ON public.pipeline_templates(category);

-- Add indexes to existing tables for better performance
CREATE INDEX IF NOT EXISTS idx_executions_started_at ON public.executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkpoints_execution_id ON public.checkpoints(execution_id);