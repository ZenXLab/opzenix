-- Create branch_mappings table for branch -> environment mapping
CREATE TABLE IF NOT EXISTS public.branch_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  github_integration_id UUID REFERENCES public.github_integrations(id) ON DELETE CASCADE,
  branch_pattern TEXT NOT NULL,
  environment TEXT NOT NULL,
  is_deployable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(github_integration_id, branch_pattern, environment)
);

-- Create environment_locks table for RBAC-based environment locking
CREATE TABLE IF NOT EXISTS public.environment_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  environment TEXT NOT NULL UNIQUE,
  is_locked BOOLEAN NOT NULL DEFAULT true,
  required_role app_role NOT NULL DEFAULT 'admin',
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  unlocked_by UUID,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  lock_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default environment lock states
INSERT INTO public.environment_locks (environment, is_locked, required_role, requires_approval) VALUES
  ('DEV', false, 'viewer', false),
  ('UAT', true, 'operator', true),
  ('Staging', true, 'operator', true),
  ('PreProd', true, 'admin', true),
  ('Prod', true, 'admin', true)
ON CONFLICT (environment) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.branch_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environment_locks ENABLE ROW LEVEL SECURITY;

-- RLS policies for branch_mappings
CREATE POLICY "Authenticated users can view branch mappings" ON public.branch_mappings
  FOR SELECT USING (true);

CREATE POLICY "Operators can manage branch mappings" ON public.branch_mappings
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operator'));

-- RLS policies for environment_locks
CREATE POLICY "Authenticated users can view environment locks" ON public.environment_locks
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage environment locks" ON public.environment_locks
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Operators can update non-prod locks" ON public.environment_locks
  FOR UPDATE USING (
    has_role(auth.uid(), 'operator') 
    AND environment NOT IN ('PreProd', 'Prod')
  );

-- Add blocked_reason column to executions for governance decisions
ALTER TABLE public.executions 
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS governance_status TEXT DEFAULT 'allowed';

-- Enable realtime for branch_mappings and environment_locks
ALTER PUBLICATION supabase_realtime ADD TABLE public.branch_mappings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.environment_locks;