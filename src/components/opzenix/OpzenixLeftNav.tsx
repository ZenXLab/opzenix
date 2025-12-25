import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  GitBranch,
  Rocket,
  Layers,
  Settings,
  Shield,
  Activity,
  FileText,
  ChevronLeft,
  ChevronRight,
  Zap,
  Box,
  Users,
  Lock,
  Bell,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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

const NAV_SECTIONS = {
  main: [
    { id: 'dashboard' as Screen, label: 'Control Tower', icon: LayoutDashboard },
  ],
  flows: [
    { id: 'ci-flow' as Screen, label: 'CI Pipeline', icon: GitBranch, color: 'text-blue-500' },
    { id: 'cd-flow' as Screen, label: 'CD Pipeline', icon: Rocket, color: 'text-green-500' },
    { id: 'full-flow' as Screen, label: 'Full Flow', icon: Layers, color: 'text-purple-500', badge: 'Read-Only' },
  ],
  environments: [
    { id: 'dev' as Environment, label: 'Development', shortLabel: 'DEV' },
    { id: 'uat' as Environment, label: 'UAT', shortLabel: 'UAT' },
    { id: 'staging' as Environment, label: 'Staging', shortLabel: 'STG' },
    { id: 'preprod' as Environment, label: 'Pre-Production', shortLabel: 'PRE' },
    { id: 'prod' as Environment, label: 'Production', shortLabel: 'PROD', restricted: true },
  ],
  tools: [
    { id: 'artifacts', label: 'Artifacts', icon: Box },
    { id: 'audit', label: 'Audit Log', icon: FileText },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'team', label: 'Team', icon: Users },
  ],
};

export function OpzenixLeftNav({
  currentScreen,
  currentEnvironment,
  onNavigate,
  pendingApprovals = 0,
  isCollapsed,
  onToggleCollapse,
}: OpzenixLeftNavProps) {
  const [hoveredEnv, setHoveredEnv] = useState<string | null>(null);

  return (
    <TooltipProvider>
      <motion.aside
        className={cn(
          'h-full flex flex-col border-r border-border bg-card/50 backdrop-blur-sm',
          isCollapsed ? 'w-16' : 'w-64'
        )}
        animate={{ width: isCollapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {/* Logo / Brand */}
        <div className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b border-border">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground">OPZENIX</span>
                  <p className="text-[10px] text-muted-foreground">Control Plane</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
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
          <div className={cn('p-3 space-y-6', isCollapsed && 'px-2')}>
            {/* Main Navigation */}
            <nav className="space-y-1">
              {NAV_SECTIONS.main.map((item) => {
                const isActive = currentScreen === item.id;
                return (
                  <NavItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive}
                    isCollapsed={isCollapsed}
                    onClick={() => onNavigate(item.id)}
                    badge={pendingApprovals > 0 ? pendingApprovals : undefined}
                  />
                );
              })}
            </nav>

            <Separator className={cn(isCollapsed && 'mx-auto w-8')} />

            {/* Flows Section */}
            <div>
              {!isCollapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  Pipeline Flows
                </p>
              )}
              <nav className="space-y-1">
                {NAV_SECTIONS.flows.map((item) => {
                  const isActive = currentScreen === item.id;
                  return (
                    <NavItem
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      isActive={isActive}
                      isCollapsed={isCollapsed}
                      onClick={() => onNavigate(item.id)}
                      iconColor={item.color}
                      badge={item.badge}
                    />
                  );
                })}
              </nav>
            </div>

            <Separator className={cn(isCollapsed && 'mx-auto w-8')} />

            {/* Environment Selector */}
            <div>
              {!isCollapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  Environments
                </p>
              )}
              <div className={cn('space-y-1', isCollapsed && 'flex flex-col items-center')}>
                {NAV_SECTIONS.environments.map((env) => {
                  const isActive = currentEnvironment === env.id;
                  return (
                    <Tooltip key={env.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onNavigate(currentScreen, env.id)}
                          onMouseEnter={() => setHoveredEnv(env.id)}
                          onMouseLeave={() => setHoveredEnv(null)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                            isCollapsed && 'justify-center px-2',
                            isActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                            env.restricted && 'ring-1 ring-sec-danger/20'
                          )}
                        >
                          <span className={cn(
                            'w-2 h-2 rounded-full',
                            isActive ? 'bg-primary' : 'bg-muted-foreground/50',
                            env.restricted && !isActive && 'bg-sec-danger/50'
                          )} />
                          {!isCollapsed && (
                            <>
                              <span className="flex-1 text-left">{env.label}</span>
                              {env.restricted && (
                                <Lock className="w-3 h-3 text-sec-danger" />
                              )}
                            </>
                          )}
                          {isCollapsed && (
                            <span className="text-[10px] font-bold">{env.shortLabel}</span>
                          )}
                        </button>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">
                          {env.label}
                          {env.restricted && ' (Restricted)'}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            <Separator className={cn(isCollapsed && 'mx-auto w-8')} />

            {/* Tools */}
            <div>
              {!isCollapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  Tools
                </p>
              )}
              <nav className="space-y-1">
                {NAV_SECTIONS.tools.map((item) => (
                  <NavItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isActive={false}
                    isCollapsed={isCollapsed}
                    onClick={() => {}}
                    disabled
                  />
                ))}
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
        disabled && 'opacity-50 cursor-not-allowed'
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
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export default OpzenixLeftNav;
