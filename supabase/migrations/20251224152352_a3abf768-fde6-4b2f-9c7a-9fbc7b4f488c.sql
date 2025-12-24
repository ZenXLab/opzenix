-- Add health check columns to connections table
ALTER TABLE public.connections
  ADD COLUMN IF NOT EXISTS health_check_interval_minutes INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_validation_error TEXT,
  ADD COLUMN IF NOT EXISTS connection_type TEXT DEFAULT 'custom';

-- Create connection_health_events table for health check history
CREATE TABLE IF NOT EXISTS public.connection_health_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('connected', 'failed', 'validating')),
  message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_time_ms INTEGER,
  details JSONB DEFAULT '{}'::jsonb
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_health_events_connection ON public.connection_health_events(connection_id, checked_at DESC);

-- Enable RLS
ALTER TABLE public.connection_health_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for connection_health_events
CREATE POLICY "Users can view health events for their connections" ON public.connection_health_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.connections c 
      WHERE c.id = connection_id 
      AND (c.user_id = auth.uid() OR c.user_id IS NULL)
    )
  );

CREATE POLICY "System can insert health events" ON public.connection_health_events
  FOR INSERT WITH CHECK (true);

-- Enable realtime for health events
ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_health_events;

-- Update connections with default health check intervals
UPDATE public.connections SET health_check_interval_minutes = 
  CASE 
    WHEN type = 'github' THEN 5
    WHEN type = 'kubernetes' THEN 10
    WHEN type = 'registry' THEN 15
    WHEN type = 'vault' THEN 5
    WHEN type = 'otel' THEN 15
    ELSE 10
  END
WHERE health_check_interval_minutes IS NULL;