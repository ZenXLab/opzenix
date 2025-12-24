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
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface ControlTowerTopBarProps {
  onOpenSettings?: () => void;
  onOpenApprovals?: () => void;
}

const ControlTowerTopBar = ({ 
  onOpenSettings,
  onOpenApprovals,
}: ControlTowerTopBarProps) => {
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [activeOrg] = useState('Opzenix Corp');
  const [activeProject] = useState('platform-core');
  const [activeEnvironment, setActiveEnvironment] = useState<'development' | 'staging' | 'production'>('production');

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

  const environments = [
    { id: 'development', label: 'Development', color: 'bg-chart-1' },
    { id: 'staging', label: 'Staging', color: 'bg-sec-warning' },
    { id: 'production', label: 'Production', color: 'bg-sec-critical' },
  ] as const;

  const currentEnv = environments.find(e => e.id === activeEnvironment);

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
            <DropdownMenuItem>{activeOrg}</DropdownMenuItem>
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
            <DropdownMenuItem>{activeProject}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Environment Selector - Always Visible */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span className={cn('w-2 h-2 rounded-full', currentEnv?.color)} />
              <span className="font-medium">{currentEnv?.label}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-xs">Environment</DropdownMenuLabel>
            {environments.map((env) => (
              <DropdownMenuItem 
                key={env.id}
                onClick={() => setActiveEnvironment(env.id)}
                className="gap-2"
              >
                <span className={cn('w-2 h-2 rounded-full', env.color)} />
                {env.label}
                {activeEnvironment === env.id && (
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
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-medium">Operator</p>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">Account</DropdownMenuLabel>
            <DropdownMenuItem className="gap-2">
              <User className="w-3.5 h-3.5" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={onOpenSettings}>
              <Settings className="w-3.5 h-3.5" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-sec-critical">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default ControlTowerTopBar;
