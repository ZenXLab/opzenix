-- Create connections table for real connection tracking
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('github', 'azure', 'vault', 'kubernetes')),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'invalid', 'error', 'rate_limited')),
  config JSONB DEFAULT '{}'::jsonb,
  resource_status JSONB DEFAULT '{}'::jsonb,
  validated BOOLEAN DEFAULT false,
  validation_message TEXT,
  last_validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own connections"
  ON public.connections FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create connections"
  ON public.connections FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own connections"
  ON public.connections FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete own connections"
  ON public.connections FOR DELETE
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;