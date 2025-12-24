-- Create artifacts table for Docker image tracking
CREATE TABLE public.artifacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID REFERENCES public.executions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'docker',
  registry_url TEXT NOT NULL,
  image_digest TEXT NOT NULL,
  image_tag TEXT,
  version TEXT,
  size_bytes BIGINT,
  build_duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

-- Policies for artifacts
CREATE POLICY "Authenticated users can view artifacts"
ON public.artifacts
FOR SELECT
USING (true);

CREATE POLICY "Operators can manage artifacts"
ON public.artifacts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "System can insert artifacts"
ON public.artifacts
FOR INSERT
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.artifacts;

-- Create index for faster lookups
CREATE INDEX idx_artifacts_execution_id ON public.artifacts(execution_id);
CREATE INDEX idx_artifacts_image_digest ON public.artifacts(image_digest);
CREATE INDEX idx_artifacts_created_at ON public.artifacts(created_at DESC);