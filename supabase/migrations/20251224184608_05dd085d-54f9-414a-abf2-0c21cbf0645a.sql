-- Fix infinite recursion in organization_members RLS policies
-- The policies were referencing the table incorrectly

-- Drop existing policies
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
DROP POLICY IF EXISTS "Org admins can manage members" ON public.organization_members;

-- Recreate with correct logic (no self-reference that causes recursion)
CREATE POLICY "Members can view org members" 
ON public.organization_members 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_members om 
    WHERE om.user_id = auth.uid()
  )
);

CREATE POLICY "Org admins can manage members" 
ON public.organization_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.organizations o 
    WHERE o.id = organization_members.organization_id 
      AND o.owner_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 
    FROM public.organization_members om2 
    WHERE om2.organization_id = organization_members.organization_id 
      AND om2.user_id = auth.uid() 
      AND om2.role IN ('owner', 'admin')
  )
);

-- Also fix the organizations view policy which has similar issues
DROP POLICY IF EXISTS "Users can view orgs they are members of" ON public.organizations;

CREATE POLICY "Users can view orgs they are members of" 
ON public.organizations 
FOR SELECT 
USING (
  owner_id = auth.uid() OR 
  id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

-- Fix deployment_versions policies which reference organization_members
DROP POLICY IF EXISTS "Users can view versions for their projects" ON public.deployment_versions;
DROP POLICY IF EXISTS "Users can manage versions for their projects" ON public.deployment_versions;

-- Create simpler policies that avoid the recursion
CREATE POLICY "Users can view versions for their projects" 
ON public.deployment_versions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = deployment_versions.project_id 
      AND (
        p.owner_id = auth.uid() OR 
        p.organization_id IN (
          SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
      )
  )
);

CREATE POLICY "Users can manage versions for their projects" 
ON public.deployment_versions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = deployment_versions.project_id 
      AND p.owner_id = auth.uid()
  )
);