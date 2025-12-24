import { useState, useEffect } from 'react';
import { 
  Activity, 
  ChevronDown,
  Bell,
  Settings,
  User,
  Shield,
  Building2,
  FolderKanban,
  Globe,
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ControlTowerTopBarProps {
  onOpenSettings?: () => void;
  onOpenApprovals?: () => void;
  onOpenProfile?: () => void;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface Project {
  id: string;
  name: string;
  github_repo_name: string | null;
}

interface EnvironmentConfig {
  id: string;
  name: string;
  environment: string;
}

const ControlTowerTopBar = ({ 
  onOpenSettings,
  onOpenApprovals,
  onOpenProfile,
}: ControlTowerTopBarProps) => {
  const navigate = useNavigate();
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<string>('Opzenix Corp');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<string>('platform-core');
  const [environments, setEnvironments] = useState<EnvironmentConfig[]>([]);
  const [activeEnvironment, setActiveEnvironment] = useState<string>('production');
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null; email: string | null; company: string | null } | null>(null);
  const [userRole, setUserRole] = useState<string>('viewer');

  // Fetch user profile and company
  useEffect(() => {
    const fetchProfileAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, email, company')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
        // If user has company, use it as org name
        if (profileData.company) {
          setActiveOrg(profileData.company);
        }
      }

      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (roleData) {
        setUserRole(roleData.role);
      }

      // Fetch organizations user belongs to
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id);

      if (orgMembers && orgMembers.length > 0) {
        const orgIds = orgMembers.map(m => m.organization_id);
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name, slug')
          .in('id', orgIds);
        
        if (orgs && orgs.length > 0) {
          setOrganizations(orgs);
          setActiveOrg(orgs[0].name);
        }
      }

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, github_repo_name')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (projectsData && projectsData.length > 0) {
        setProjects(projectsData);
        setActiveProject(projectsData[0].github_repo_name || projectsData[0].name);
      }

      // Fetch environments based on role
      const { data: envData } = await supabase
        .from('environment_configs')
        .select('id, name, environment')
        .eq('is_active', true)
        .order('name');

      if (envData && envData.length > 0) {
        // Filter environments based on role (RBAC)
        let filteredEnvs = envData;
        if (roleData?.role === 'viewer') {
          // Viewers can only see dev environments
          filteredEnvs = envData.filter(e => 
            e.environment.toLowerCase().includes('dev') || 
            e.environment.toLowerCase().includes('development')
          );
        } else if (roleData?.role === 'operator') {
          // Operators can see dev and staging
          filteredEnvs = envData.filter(e => 
            !e.environment.toLowerCase().includes('prod')
          );
        }
        // Admins can see all

        setEnvironments(filteredEnvs);
        if (filteredEnvs.length > 0) {
          setActiveEnvironment(filteredEnvs[0].environment);
        }
      }
    };

    fetchProfileAndData();
  }, []);

  // Fetch pending approvals count
  useEffect(() => {
    const fetchApprovals = async () => {
      const { count } = await supabase
        .from('approval_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      setPendingApprovals(count || 0);
    };
    fetchApprovals();

    // Subscribe to changes
    const channel = supabase
      .channel('approvals-count')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'approval_requests'
      }, fetchApprovals)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  // Default environments if none configured
  const defaultEnvironments = [
    { id: 'dev', name: 'Development', environment: 'development' },
    { id: 'staging', name: 'Staging', environment: 'staging' },
    { id: 'prod', name: 'Production', environment: 'production' },
  ];

  const displayEnvironments = environments.length > 0 ? environments : defaultEnvironments;
  const currentEnv = displayEnvironments.find(e => e.environment === activeEnvironment) || displayEnvironments[0];

  const getEnvColor = (env: string) => {
    const envLower = env.toLowerCase();
    if (envLower.includes('prod')) return 'bg-sec-critical';
    if (envLower.includes('stag') || envLower.includes('uat')) return 'bg-sec-warning';
    return 'bg-sec-safe';
  };

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'Operator';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
      {/* Left - Branding + Context Selectors */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="hidden md:block">
            <span className="text-sm font-bold tracking-tight text-foreground">OPZENIX</span>
            <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">MVP 1.0</span>
          </div>
        </div>

        <div className="h-6 w-px bg-border hidden md:block" />

        {/* Organization Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs hidden lg:flex">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium">{activeOrg}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-xs">Organization</DropdownMenuLabel>
            {organizations.length > 0 ? (
              organizations.map(org => (
                <DropdownMenuItem key={org.id} onClick={() => setActiveOrg(org.name)}>
                  {org.name}
                  {activeOrg === org.name && (
                    <Badge variant="secondary" className="ml-auto text-[9px] h-4">Active</Badge>
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem>{activeOrg}</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Project Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs hidden md:flex">
              <FolderKanban className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium">{activeProject}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-xs">Project</DropdownMenuLabel>
            {projects.length > 0 ? (
              projects.map(project => (
                <DropdownMenuItem 
                  key={project.id} 
                  onClick={() => setActiveProject(project.github_repo_name || project.name)}
                >
                  {project.github_repo_name || project.name}
                  {activeProject === (project.github_repo_name || project.name) && (
                    <Badge variant="secondary" className="ml-auto text-[9px] h-4">Active</Badge>
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem>{activeProject}</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Environment Selector - Always Visible */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span className={cn('w-2 h-2 rounded-full', getEnvColor(currentEnv?.environment || 'development'))} />
              <span className="font-medium">{currentEnv?.name || 'Development'}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-xs">Environment (Role: {userRole})</DropdownMenuLabel>
            {displayEnvironments.map((env) => (
              <DropdownMenuItem 
                key={env.id}
                onClick={() => setActiveEnvironment(env.environment)}
                className="gap-2"
              >
                <span className={cn('w-2 h-2 rounded-full', getEnvColor(env.environment))} />
                {env.name}
                {activeEnvironment === env.environment && (
                  <Badge variant="secondary" className="ml-auto text-[9px] h-4">Active</Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right - Notifications & User */}
      <div className="flex items-center gap-2">
        {/* Pending Approvals - Critical Action */}
        {pendingApprovals > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2 text-xs border-sec-warning/50 text-sec-warning hover:bg-sec-warning/10"
            onClick={onOpenApprovals}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{pendingApprovals} Pending</span>
          </Button>
        )}

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 relative"
          onClick={onOpenApprovals}
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
          {pendingApprovals > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sec-critical animate-pulse" />
          )}
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={onOpenSettings}
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-medium">{displayName}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {profile?.email || 'No email'}
                </p>
                <Badge variant="outline" className="w-fit text-[10px] mt-1 capitalize">{userRole}</Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2" onClick={onOpenProfile}>
              <User className="w-3.5 h-3.5" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={onOpenSettings}>
              <Settings className="w-3.5 h-3.5" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-sec-critical" onClick={handleSignOut}>
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default ControlTowerTopBar;