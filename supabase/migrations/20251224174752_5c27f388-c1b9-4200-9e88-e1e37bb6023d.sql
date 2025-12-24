-- Organizations table for enterprise support
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  description TEXT,
  github_org_name TEXT,
  owner_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Organization members for team support
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Projects table for deployment tracking
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users NOT NULL,
  github_repo_url TEXT,
  github_repo_owner TEXT,
  github_repo_name TEXT,
  default_branch TEXT DEFAULT 'main',
  detected_language TEXT,
  detected_framework TEXT,
  detected_build_tool TEXT,
  is_private BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deployment versions for git-based versioning
CREATE TABLE public.deployment_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  deployment_id UUID REFERENCES public.deployments(id) ON DELETE SET NULL,
  version_tag TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  branch TEXT NOT NULL,
  commit_message TEXT,
  commit_author TEXT,
  commit_timestamp TIMESTAMP WITH TIME ZONE,
  is_current BOOLEAN DEFAULT false,
  environment TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- GitHub tokens stored securely per user
CREATE TABLE public.github_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  encrypted_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'pat' CHECK (token_type IN ('pat', 'app')),
  scopes TEXT[],
  expires_at TIMESTAMP WITH TIME ZONE,
  last_validated_at TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_tokens ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view orgs they are members of" ON public.organizations
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Owners can manage their organizations" ON public.organizations
  FOR ALL USING (owner_id = auth.uid());

-- Organization members policies
CREATE POLICY "Members can view org members" ON public.organization_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = organization_id AND om.user_id = auth.uid())
  );

CREATE POLICY "Org admins can manage members" ON public.organization_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = organization_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin'))
  );

-- Projects policies
CREATE POLICY "Users can view their projects" ON public.projects
  FOR SELECT USING (
    owner_id = auth.uid() OR
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage their own projects" ON public.projects
  FOR ALL USING (owner_id = auth.uid());

-- Deployment versions policies
CREATE POLICY "Users can view versions for their projects" ON public.deployment_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.owner_id = auth.uid() OR p.organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())))
  );

CREATE POLICY "Users can manage versions for their projects" ON public.deployment_versions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  );

-- GitHub tokens policies (users can only access their own)
CREATE POLICY "Users can manage their own GitHub tokens" ON public.github_tokens
  FOR ALL USING (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_org ON public.projects(organization_id);
CREATE INDEX idx_deployment_versions_project ON public.deployment_versions(project_id);
CREATE INDEX idx_deployment_versions_commit ON public.deployment_versions(commit_sha);
CREATE INDEX idx_github_tokens_user ON public.github_tokens(user_id);

-- Update profiles table to include more enterprise fields
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS github_username TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Update trigger for timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_github_tokens_updated_at
  BEFORE UPDATE ON public.github_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();