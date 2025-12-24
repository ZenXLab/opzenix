import { 
  Activity, 
  Shield, 
  Clock, 
  Search,
  Bell,
  Settings,
  User,
  ChevronDown,
  FileCode,
  History,
  LayoutDashboard,
  GitBranch,
  Mic,
  Plus,
  Workflow,
  Server,
  Sparkles,
  PlayCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlowStore } from '@/stores/flowStore';
import { cn } from '@/lib/utils';
import { ProductionReadinessIndicator } from '@/components/validation/ProductionReadinessIndicator';

interface TopBarProps {
  onOpenGitWizard?: () => void;
  onOpenSpeech?: () => void;
  onOpenPipelineEditor?: () => void;
  onOpenEnvironmentManager?: () => void;
  onOpenOpzenixWizard?: () => void;
  onOpenDemo?: () => void;
  onOpenValidation?: () => void;
}

const TopBar = ({ 
  onOpenGitWizard, 
  onOpenSpeech, 
  onOpenPipelineEditor, 
  onOpenEnvironmentManager,
  onOpenOpzenixWizard,
  onOpenDemo,
  onOpenValidation
}: TopBarProps) => {
  const { 
    systemHealth, 
    activeEnvironment, 
    setActiveEnvironment,
    setConfigEditorOpen,
    setTimelineOpen,
    activeView,
    setActiveView
  } = useFlowStore();

  const environments = ['production', 'staging', 'development'];

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-2 sm:px-4 overflow-x-auto">
      {/* Left */}
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold text-foreground tracking-tight hidden sm:block">Opzenix</span>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 px-1 py-0.5 rounded-md bg-secondary/50 border border-border">
          <button
            onClick={() => setActiveView('dashboard')}
            className={cn(
              'flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium rounded transition-colors',
              activeView === 'dashboard'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveView('flows')}
            className={cn(
              'flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium rounded transition-colors',
              activeView === 'flows'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Flows</span>
          </button>
        </div>

        {/* Environment Toggle - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 border border-border">
          {environments.map((env) => (
            <button
              key={env}
              onClick={() => setActiveEnvironment(env)}
              className={cn(
                'px-2 lg:px-3 py-1 text-xs font-medium rounded transition-colors',
                activeEnvironment === env 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              {env.charAt(0).toUpperCase() + env.slice(1, 4)}
            </button>
          ))}
        </div>

        {/* Opzenix Wizard Button - Primary CTA */}
        <Button 
          size="sm" 
          className="h-8 gap-2 bg-ai-primary hover:bg-ai-primary/90" 
          onClick={onOpenOpzenixWizard}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">New Pipeline</span>
        </Button>

        {/* Secondary Actions - Hidden on smaller screens */}
        <div className="hidden xl:flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-2" onClick={onOpenGitWizard}>
            <Plus className="w-3.5 h-3.5" />
            Connect Repo
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-2" onClick={onOpenPipelineEditor}>
            <Workflow className="w-3.5 h-3.5" />
            Editor
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-2" onClick={onOpenEnvironmentManager}>
            <Server className="w-3.5 h-3.5" />
            Environments
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2 border-primary/50 text-primary hover:bg-primary/10" 
            onClick={onOpenDemo}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Demo
          </Button>
        </div>
      </div>

      {/* Center - Hidden on mobile */}
      <div className="hidden lg:flex items-center gap-4 xl:gap-6">
        <StatusIndicator 
          icon={<Activity className="w-3.5 h-3.5" />}
          label="System"
          value={systemHealth.status === 'healthy' ? 'Healthy' : systemHealth.status}
          status={systemHealth.status}
        />
        <StatusIndicator icon={<Clock className="w-3.5 h-3.5" />} label="Uptime" value={systemHealth.uptime} />
        <StatusIndicator icon={<Activity className="w-3.5 h-3.5" />} label="Active" value={String(systemHealth.activeFlows)} />
        <StatusIndicator 
          icon={<Shield className="w-3.5 h-3.5" />} 
          label="Pending" 
          value={String(systemHealth.pendingApprovals)}
          alert={systemHealth.pendingApprovals > 0}
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Production Readiness Indicator */}
        <ProductionReadinessIndicator />
        
        <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
        
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setConfigEditorOpen(true)}>
          <FileCode className="w-4 h-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex" onClick={() => setTimelineOpen(true)}>
          <History className="w-4 h-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex" onClick={onOpenSpeech}>
          <Mic className="w-4 h-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Search className="w-4 h-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="w-4 h-4 text-muted-foreground" />
          {systemHealth.pendingApprovals > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-node-warning" />
          )}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
          <Settings className="w-4 h-4 text-muted-foreground" />
        </Button>
        <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
        <Button variant="ghost" size="sm" className="h-8 gap-2">
          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <span className="text-xs text-foreground hidden md:inline">Operator</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
        </Button>
      </div>
    </header>
  );
};

interface StatusIndicatorProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  status?: 'healthy' | 'degraded' | 'critical';
  alert?: boolean;
}

const StatusIndicator = ({ icon, label, value, status, alert }: StatusIndicatorProps) => (
  <div className="flex items-center gap-2">
    <div className={cn(
      'w-6 h-6 rounded flex items-center justify-center',
      status === 'healthy' && 'bg-sec-safe/20 text-sec-safe',
      status === 'degraded' && 'bg-sec-warning/20 text-sec-warning',
      status === 'critical' && 'bg-sec-critical/20 text-sec-critical',
      alert && 'bg-node-warning/20 text-node-warning',
      !status && !alert && 'bg-secondary text-muted-foreground'
    )}>
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={cn(
        'text-xs font-medium',
        status === 'healthy' && 'text-sec-safe',
        status === 'degraded' && 'text-sec-warning',
        status === 'critical' && 'text-sec-critical',
        alert && 'text-node-warning',
        !status && !alert && 'text-foreground'
      )}>
        {value}
      </span>
    </div>
  </div>
);

export default TopBar;
