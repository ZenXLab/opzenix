-- Create environment_configs table
CREATE TABLE public.environment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  environment TEXT NOT NULL,
  variables JSONB DEFAULT '{}'::jsonb,
  secrets_ref TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create secret_references table (reference-only, no plaintext secrets)
CREATE TABLE public.secret_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL,
  ref_key TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'vault',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create execution_state_events table for audit-grade history
CREATE TABLE public.execution_state_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.executions(id) ON DELETE CASCADE,
  node_id TEXT,
  old_state TEXT,
  new_state TEXT NOT NULL,
  reason TEXT,
  triggered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_mode TEXT DEFAULT 'monitor',
  onboarding_state JSONB DEFAULT '{"completed": false, "step": 0}'::jsonb,
  ui_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create dashboard_layouts table
CREATE TABLE public.dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  name TEXT DEFAULT 'Default',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notification_events table
CREATE TABLE public.notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  target TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.environment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_state_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for environment_configs
CREATE POLICY "Authenticated users can view environment configs" 
ON public.environment_configs FOR SELECT USING (true);

CREATE POLICY "Operators can manage environment configs" 
ON public.environment_configs FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- RLS Policies for secret_references
CREATE POLICY "Authenticated users can view secret references" 
ON public.secret_references FOR SELECT USING (true);

CREATE POLICY "Admins can manage secret references" 
ON public.secret_references FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for execution_state_events
CREATE POLICY "Authenticated users can view state events" 
ON public.execution_state_events FOR SELECT USING (true);

CREATE POLICY "System can insert state events" 
ON public.execution_state_events FOR INSERT WITH CHECK (true);

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage own preferences" 
ON public.user_preferences FOR ALL USING (user_id = auth.uid());

-- RLS Policies for dashboard_layouts
CREATE POLICY "Users can manage own layouts" 
ON public.dashboard_layouts FOR ALL USING (user_id = auth.uid());

-- RLS Policies for notification_events
CREATE POLICY "Users can view own notifications" 
ON public.notification_events FOR SELECT USING (target = auth.uid()::text);

CREATE POLICY "System can insert notifications" 
ON public.notification_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" 
ON public.notification_events FOR UPDATE USING (target = auth.uid()::text);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.execution_state_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_events;