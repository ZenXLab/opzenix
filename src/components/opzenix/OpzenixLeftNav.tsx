import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  GitBranch,
  Rocket,
  Layers,
  Settings,
  Shield,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Box,
  Users,
  Bell,
  HelpCircle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Terminal,
  Database,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useRBACPermissions } from '@/hooks/useRBACPermissions';
import OpzenixLogo from '@/components/brand/OpzenixLogo';

// ============================================
// 🧭 OPZENIX LEFT NAVIGATION (Enterprise Grade)
// ============================================

type Screen = 'dashboard' | 'ci-flow' | 'cd-flow' | 'full-flow';
type Environment = 'dev' | 'uat' | 'staging' | 'preprod' | 'prod';

interface OpzenixLeftNavProps {
  currentScreen: Screen;
  currentEnvironment: Environment;
  onNavigate: (screen: Screen, env?: Environment) => void;
  pendingApprovals?: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const ENVIRONMENTS: { id: Environment; label: string; shortLabel: string; color: string; restricted?: boolean }[] = [
  { id: 'dev', label: 'Development', shortLabel: 'DEV', color: 'bg-sec-safe' },
  { id: 'uat', label: 'UAT Testing', shortLabel: 'UAT', color: 'bg-blue-500' },
  { id: 'staging', label: 'Staging', shortLabel: 'STG', color: 'bg-yellow-500' },
  { id: 'preprod', label: 'Pre-Production', shortLabel: 'PRE', color: 'bg-orange-500' },
  { id: 'prod', label: 'Production', shortLabel: 'PROD', color: 'bg-sec-danger', restricted: true },
];

const TOOLS = [
  { id: 'artifacts', label: 'Artifacts Registry', icon: Box, adminOnly: false },
  { id: 'audit', label: 'Audit Log', icon: FileText, adminOnly: false },
  { id: 'security', label: 'Security Center', icon: Shield, adminOnly: false },
  { id: 'team', label: 'Team Management', icon: Users, adminOnly: true },
  { id: 'secrets', label: 'Secrets Vault', icon: Key, adminOnly: true },
  { id: 'terminal', label: 'Debug Console', icon: Terminal, adminOnly: true },
];

export function OpzenixLeftNav({
  currentScreen,
  currentEnvironment,
  onNavigate,
  pendingApprovals = 0,
  isCollapsed,
  onToggleCollapse,
}: OpzenixLeftNavProps) {
  const { isAdmin, dbRole } = useRBACPermissions();
  const [toolDialogOpen, setToolDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>({
    artifacts: true,
    audit: true,
    security: true,
    team: true,
    secrets: true,
    terminal: true,
  });

  const handleToolClick = (toolId: string) => {
    if (!featureToggles[toolId] && !isAdmin) return;
    setSelectedTool(toolId);
    setToolDialogOpen(true);
  };

  const toggleFeature = (toolId: string) => {
    if (!isAdmin) return;
    setFeatureToggles(prev => ({ ...prev, [toolId]: !prev[toolId] }));
  };

  // Filter environments based on role
  const accessibleEnvironments = ENVIRONMENTS.filter(env => {
    if (isAdmin) return true;
    if (dbRole === 'operator') return env.id !== 'prod';
    return env.id === 'dev' || env.id === 'uat';
  });

  const currentEnvData = ENVIRONMENTS.find(e => e.id === currentEnvironment) || ENVIRONMENTS[0];

  return (
    <TooltipProvider>
      <motion.aside
        className={cn(
          'h-full flex flex-col border-r border-border bg-card/80 backdrop-blur-sm relative',
          isCollapsed ? 'w-16' : 'w-64'
        )}
        animate={{ width: isCollapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {/* Logo / Brand */}
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-3 border-b border-border">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <OpzenixLogo size="sm" showText={true} animate={false} />
              </motion.div>
            )}
          </AnimatePresence>
          
          {isCollapsed && (
            <OpzenixLogo size="sm" showText={false} animate={false} />
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0"
            onClick={onToggleCollapse}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className={cn('p-3 space-y-4', isCollapsed && 'px-2')}>
            {/* Main Navigation */}
            <nav className="space-y-1">
              <NavItem
                icon={LayoutDashboard}
                label="Control Tower"
                isActive={currentScreen === 'dashboard'}
                isCollapsed={isCollapsed}
                onClick={() => onNavigate('dashboard')}
                badge={pendingApprovals > 0 ? pendingApprovals : undefined}
              />
            </nav>

            <Separator className={cn(isCollapsed && 'mx-auto w-8')} />

            {/* Environment Dropdown */}
            <div>
              {!isCollapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  Environment
                </p>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size={isCollapsed ? 'icon' : 'default'}
                    className={cn(
                      'w-full justify-between',
                      isCollapsed && 'h-10 w-10 p-0 justify-center',
                      currentEnvData.restricted && 'border-sec-danger/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', currentEnvData.color)} />
                      {!isCollapsed && (
                        <span className="text-sm font-medium">{currentEnvData.label}</span>
                      )}
                    </div>
                    {!isCollapsed && <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-popover border border-border">
                  <DropdownMenuLabel className="text-xs flex items-center justify-between">
                    <span>Select Environment</span>
                    <Badge variant="outline" className="text-[9px]">{dbRole?.toUpperCase()}</Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {accessibleEnvironments.map((env) => (
                    <DropdownMenuItem
                      key={env.id}
                      onClick={() => onNavigate(currentScreen, env.id)}
                      className={cn(
                        'gap-2 cursor-pointer',
                        currentEnvironment === env.id && 'bg-primary/10'
                      )}
                    >
                      <span className={cn('w-2 h-2 rounded-full', env.color)} />
                      <span className="flex-1">{env.label}</span>
                      {env.restricted && <Lock className="w-3 h-3 text-sec-danger" />}
                      {currentEnvironment === env.id && (
                        <Badge variant="secondary" className="text-[9px]">Active</Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                  {ENVIRONMENTS.length > accessibleEnvironments.length && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[10px] text-muted-foreground">
                        {ENVIRONMENTS.length - accessibleEnvironments.length} environment(s) restricted
                      </DropdownMenuLabel>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Separator className={cn(isCollapsed && 'mx-auto w-8')} />

            {/* Pipeline Flows */}
            <div>
              {!isCollapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  Pipeline Flows
                </p>
              )}
              <nav className="space-y-1">
                <NavItem
                  icon={GitBranch}
                  label="CI Pipeline"
                  isActive={currentScreen === 'ci-flow'}
                  isCollapsed={isCollapsed}
                  onClick={() => onNavigate('ci-flow')}
                  iconColor="text-blue-500"
                />
                <NavItem
                  icon={Rocket}
                  label="CD Pipeline"
                  isActive={currentScreen === 'cd-flow'}
                  isCollapsed={isCollapsed}
                  onClick={() => onNavigate('cd-flow')}
                  iconColor="text-green-500"
                />
                <NavItem
                  icon={Layers}
                  label="Full Flow"
                  isActive={currentScreen === 'full-flow'}
                  isCollapsed={isCollapsed}
                  onClick={() => onNavigate('full-flow')}
                  iconColor="text-purple-500"
                  badge="View"
                />
              </nav>
            </div>

            <Separator className={cn(isCollapsed && 'mx-auto w-8')} />

            {/* Tools Section */}
            <div>
              {!isCollapsed && (
                <div className="flex items-center justify-between mb-2 px-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Tools
                  </p>
                  {isAdmin && (
                    <Badge variant="outline" className="text-[9px]">Admin</Badge>
                  )}
                </div>
              )}
              <nav className="space-y-1">
                {TOOLS.map((tool) => {
                  const isEnabled = featureToggles[tool.id];
                  const canAccess = isAdmin || (!tool.adminOnly && isEnabled);
                  
                  return (
                    <div key={tool.id} className="relative group">
                      <NavItem
                        icon={tool.icon}
                        label={tool.label}
                        isActive={false}
                        isCollapsed={isCollapsed}
                        onClick={() => canAccess && handleToolClick(tool.id)}
                        disabled={!canAccess}
                      />
                      {/* Admin toggle overlay */}
                      {isAdmin && !isCollapsed && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => toggleFeature(tool.id)}
                            className="scale-75"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className={cn(
          'flex-shrink-0 border-t border-border p-3 space-y-1',
          isCollapsed && 'px-2'
        )}>
          <NavItem
            icon={Bell}
            label="Notifications"
            isActive={false}
            isCollapsed={isCollapsed}
            onClick={() => {}}
            badge={pendingApprovals > 0 ? pendingApprovals : undefined}
          />
          <NavItem
            icon={Settings}
            label="Settings"
            isActive={false}
            isCollapsed={isCollapsed}
            onClick={() => {}}
          />
          <NavItem
            icon={HelpCircle}
            label="Help & Docs"
            isActive={false}
            isCollapsed={isCollapsed}
            onClick={() => {}}
          />
        </div>

        {/* Version - Bottom Left Corner Only */}
        {!isCollapsed && (
          <div className="absolute bottom-2 left-3 text-[9px] text-muted-foreground/50">
            v1.0.0-mvp
          </div>
        )}

        {/* Tool Dialog */}
        <Dialog open={toolDialogOpen} onOpenChange={setToolDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTool && TOOLS.find(t => t.id === selectedTool)?.icon && (
                  (() => {
                    const Icon = TOOLS.find(t => t.id === selectedTool)!.icon;
                    return <Icon className="w-5 h-5 text-primary" />;
                  })()
                )}
                {TOOLS.find(t => t.id === selectedTool)?.label || 'Tool'}
              </DialogTitle>
              <DialogDescription>
                {selectedTool === 'artifacts' && 'Browse and manage build artifacts, container images, and SBOM records.'}
                {selectedTool === 'audit' && 'View immutable audit trail of all actions and deployments.'}
                {selectedTool === 'security' && 'Security dashboard with vulnerability scans and compliance status.'}
                {selectedTool === 'team' && 'Manage team members, roles, and permissions.'}
                {selectedTool === 'secrets' && 'Secure vault for managing secrets and environment variables.'}
                {selectedTool === 'terminal' && 'Debug console for troubleshooting pipeline issues.'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-8 text-center text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">Tool content would be displayed here</p>
              <p className="text-xs mt-1">This is a placeholder for the {selectedTool} interface</p>
            </div>
          </DialogContent>
        </Dialog>
      </motion.aside>
    </TooltipProvider>
  );
}

// Nav Item Component
function NavItem({
  icon: Icon,
  label,
  isActive,
  isCollapsed,
  onClick,
  iconColor,
  badge,
  disabled,
}: {
  icon: any;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
  iconColor?: string;
  badge?: number | string;
  disabled?: boolean;
}) {
  const content = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
        isCollapsed && 'justify-center px-2',
        isActive
          ? 'bg-primary text-primary-foreground font-medium shadow-sm'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground'
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0', iconColor, isActive && 'text-current')} />
      {!isCollapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {badge !== undefined && (
            <Badge
              variant={isActive ? 'secondary' : 'outline'}
              className="text-[10px] min-w-[18px] h-5 justify-center"
            >
              {badge}
            </Badge>
          )}
        </>
      )}
    </button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {label}
          {badge !== undefined && (
            <Badge variant="secondary" className="text-[10px]">{badge}</Badge>
          )}
          {disabled && <span className="text-[10px] text-muted-foreground">(Disabled)</span>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export default OpzenixLeftNav;
