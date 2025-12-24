import { 
  Activity, 
  Search,
  Bell,
  Settings,
  User,
  ChevronDown,
  LayoutDashboard,
  GitBranch,
  Sparkles,
  PlayCircle,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlowStore } from '@/stores/flowStore';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface TopBarProps {
  onOpenGitWizard?: () => void;
  onOpenSpeech?: () => void;
  onOpenPipelineEditor?: () => void;
  onOpenEnvironmentManager?: () => void;
  onOpenOpzenixWizard?: () => void;
  onOpenDemo?: () => void;
  onOpenValidation?: () => void;
  onOpenSettings?: () => void;
}

const TopBar = ({ 
  onOpenGitWizard, 
  onOpenPipelineEditor, 
  onOpenEnvironmentManager,
  onOpenOpzenixWizard,
  onOpenDemo,
  onOpenSettings
}: TopBarProps) => {
  const { 
    systemHealth, 
    activeEnvironment, 
    setActiveEnvironment,
    activeView,
    setActiveView
  } = useFlowStore();

  const environments = [
    { id: 'production', label: 'Prod', color: 'bg-sec-critical/20 text-sec-critical' },
    { id: 'staging', label: 'Stage', color: 'bg-sec-warning/20 text-sec-warning' },
    { id: 'development', label: 'Dev', color: 'bg-sec-safe/20 text-sec-safe' }
  ];

  return (
    <header className="h-12 border-b border-border bg-background flex items-center justify-between px-3 shrink-0">
      {/* Left - Branding + View Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight hidden sm:block">Opzenix</span>
        </div>

        <div className="h-5 w-px bg-border hidden sm:block" />

        {/* View Toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-muted/50">
          <button
            onClick={() => setActiveView('dashboard')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all',
              activeView === 'dashboard'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveView('flows')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all',
              activeView === 'flows'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Flows</span>
          </button>
        </div>

        {/* Environment Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs hidden md:flex">
              <span className={cn(
                'w-2 h-2 rounded-full',
                activeEnvironment === 'production' && 'bg-sec-critical',
                activeEnvironment === 'staging' && 'bg-sec-warning',
                activeEnvironment === 'development' && 'bg-sec-safe'
              )} />
              {activeEnvironment.charAt(0).toUpperCase() + activeEnvironment.slice(1, 4)}
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {environments.map((env) => (
              <DropdownMenuItem 
                key={env.id}
                onClick={() => setActiveEnvironment(env.id)}
                className="gap-2"
              >
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  env.id === 'production' && 'bg-sec-critical',
                  env.id === 'staging' && 'bg-sec-warning',
                  env.id === 'development' && 'bg-sec-safe'
                )} />
                {env.label}
                {activeEnvironment === env.id && (
                  <Badge variant="secondary" className="ml-auto text-[10px] h-4">Active</Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center - Primary Actions */}
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          className="h-7 gap-1.5 text-xs bg-ai-primary hover:bg-ai-primary/90" 
          onClick={onOpenOpzenixWizard}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Pipeline</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 gap-1.5 text-xs hidden lg:flex" 
          onClick={onOpenDemo}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          Demo
        </Button>

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hidden md:flex">
              <Menu className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem onClick={onOpenGitWizard}>
              Connect Repository
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenPipelineEditor}>
              Pipeline Editor
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenEnvironmentManager}>
              Environments
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right - Status & User */}
      <div className="flex items-center gap-1.5">
        {/* System Status Pill */}
        <div className={cn(
          'hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
          systemHealth.status === 'healthy' && 'bg-sec-safe/10 text-sec-safe',
          systemHealth.status === 'degraded' && 'bg-sec-warning/10 text-sec-warning',
          systemHealth.status === 'critical' && 'bg-sec-critical/10 text-sec-critical'
        )}>
          <span className={cn(
            'w-1.5 h-1.5 rounded-full animate-pulse',
            systemHealth.status === 'healthy' && 'bg-sec-safe',
            systemHealth.status === 'degraded' && 'bg-sec-warning',
            systemHealth.status === 'critical' && 'bg-sec-critical'
          )} />
          {systemHealth.status === 'healthy' ? 'Healthy' : systemHealth.status}
        </div>

        <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
        
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Search className="w-4 h-4 text-muted-foreground" />
        </Button>
        
        <Button variant="ghost" size="icon" className="h-7 w-7 relative">
          <Bell className="w-4 h-4 text-muted-foreground" />
          {systemHealth.pendingApprovals > 0 && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-sec-warning" />
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={onOpenSettings}
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
        </Button>

        <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-1.5">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="text-xs text-foreground hidden lg:inline">Operator</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenSettings}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;