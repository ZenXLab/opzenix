-- Create a function to auto-assign admin role to the first user (project creator)
CREATE OR REPLACE FUNCTION public.handle_first_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user (no existing user_roles)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    -- Auto-assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to assign role on profile creation (when user signs up)
DROP TRIGGER IF EXISTS on_profile_created_assign_role ON public.profiles;
CREATE TRIGGER on_profile_created_assign_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_first_user_role();

-- Also create a helper function to check if user has any role (for self-assignment)
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean
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

-- Allow users to insert their own role if they don't have one (first-time setup)
DROP POLICY IF EXISTS "Users can assign initial role" ON public.user_roles;
CREATE POLICY "Users can assign initial role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND NOT has_any_role(auth.uid())
  );

-- Also ensure operators can create projects (currently only admins via has_role)
DROP POLICY IF EXISTS "Operators and admins can create projects" ON public.projects;
CREATE POLICY "Operators and admins can create projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() 
    AND (
      has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'operator'::app_role)
      OR NOT has_any_role(auth.uid())
    )
  );