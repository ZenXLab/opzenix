-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'operator', 'viewer');

-- Create enum for execution status
CREATE TYPE public.execution_status AS ENUM ('idle', 'running', 'success', 'warning', 'failed', 'paused');

-- Create enum for approval status
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for flow type
CREATE TYPE public.flow_type AS ENUM ('cicd', 'mlops', 'llmops', 'infrastructure', 'security');

-- User roles table for RBAC
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Flow templates table
CREATE TABLE public.flow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type flow_type NOT NULL,
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Executions table for tracking pipeline runs
CREATE TABLE public.executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_template_id UUID REFERENCES public.flow_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status execution_status NOT NULL DEFAULT 'idle',
  environment TEXT NOT NULL DEFAULT 'development',
  branch TEXT,
  commit_hash TEXT,
  progress INTEGER DEFAULT 0,
  started_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Execution nodes state (for real-time updates)
CREATE TABLE public.execution_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.executions(id) ON DELETE CASCADE NOT NULL,
  node_id TEXT NOT NULL,
  status execution_status NOT NULL DEFAULT 'idle',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  logs TEXT[],
  metadata JSONB DEFAULT '{}',
  UNIQUE (execution_id, node_id)
);

-- Checkpoints table
CREATE TABLE public.checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.executions(id) ON DELETE CASCADE NOT NULL,
  node_id TEXT NOT NULL,
  name TEXT NOT NULL,
  state JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Approval requests for governance
CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.executions(id) ON DELETE CASCADE NOT NULL,
  node_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status approval_status NOT NULL DEFAULT 'pending',
  required_approvals INTEGER NOT NULL DEFAULT 2,
  current_approvals INTEGER NOT NULL DEFAULT 0,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Approval votes
CREATE TABLE public.approval_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id UUID REFERENCES public.approval_requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote BOOLEAN NOT NULL,
  comment TEXT,
  voted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (approval_request_id, user_id)
);

-- Audit trail
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deployment history for timeline
CREATE TABLE public.deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.executions(id) ON DELETE CASCADE,
  environment TEXT NOT NULL,
  version TEXT NOT NULL,
  status execution_status NOT NULL,
  deployed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deployed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  rollback_to UUID REFERENCES public.deployments(id),
  incident_id TEXT,
  notes TEXT
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user has any role (for general access)
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email)
  );
  -- Default role for new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'viewer');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can view all profiles, update own
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- User roles: Admins can manage, users can view own
CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Flow templates: All authenticated users can view, admins/operators can manage
CREATE POLICY "Authenticated users can view flow templates"
  ON public.flow_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can manage flow templates"
  ON public.flow_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- Executions: All can view, operators can manage
CREATE POLICY "Authenticated users can view executions"
  ON public.executions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can manage executions"
  ON public.executions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- Execution nodes: Same as executions
CREATE POLICY "Authenticated users can view execution nodes"
  ON public.execution_nodes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can manage execution nodes"
  ON public.execution_nodes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- Checkpoints: All can view, operators can manage
CREATE POLICY "Authenticated users can view checkpoints"
  ON public.checkpoints FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can manage checkpoints"
  ON public.checkpoints FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- Approval requests: All can view, operators can create
CREATE POLICY "Authenticated users can view approval requests"
  ON public.approval_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can create approval requests"
  ON public.approval_requests FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Admins can update approval requests"
  ON public.approval_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Approval votes: Users can vote and view
CREATE POLICY "Authenticated users can view votes"
  ON public.approval_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators and admins can vote"
  ON public.approval_votes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- Audit logs: Admins can view all, users can view own
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Deployments: All can view, operators can manage
CREATE POLICY "Authenticated users can view deployments"
  ON public.deployments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can manage deployments"
  ON public.deployments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.executions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.execution_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.approval_requests;