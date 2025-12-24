import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Play,
  Globe,
  Link2,
  CheckCircle2,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ControlTowerNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenAuditLog?: () => void;
}

// Navigation Items - ORDER IS IMPORTANT per manifesto
const navItems = [
  { 
    id: 'control-tower', 
    label: 'Control Tower', 
    icon: LayoutDashboard, 
    description: 'System overview and health',
    isDefault: true 
  },
  { 
    id: 'executions', 
    label: 'Executions', 
    icon: Play, 
    description: 'Active and recent flows',
    badge: 'live'
  },
  { 
    id: 'environments', 
    label: 'Environments', 
    icon: Globe, 
    description: 'Policy-based environment config'
  },
  { 
    id: 'connections', 
    label: 'Connections', 
    icon: Link2, 
    description: 'GitHub, Kubernetes, Vault'
  },
  { 
    id: 'approvals', 
    label: 'Approvals', 
    icon: CheckCircle2, 
    description: 'Pending governance gates',
    badge: 'count'
  },
  { 
    id: 'audit-log', 
    label: 'Audit Log', 
    icon: FileText, 
    description: 'Immutable action history'
  },
  { 
    id: 'system-health', 
    label: 'System Health', 
    icon: Activity, 
    description: 'Infrastructure status'
  },
];

const ControlTowerNav = ({ 
  activeSection, 
  onSectionChange,
  onOpenAuditLog,
}: ControlTowerNavProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleNavClick = (id: string) => {
    if (id === 'audit-log' && onOpenAuditLog) {
      onOpenAuditLog();
    } else {
      onSectionChange(id);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 56 : 220 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="h-full border-r border-border bg-sidebar flex flex-col overflow-hidden shrink-0"
      >
        {/* Collapse Toggle */}
        <div className="h-10 flex items-center justify-center px-2 border-b border-border">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 space-y-1">
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 mb-3 font-medium">
              Navigation
            </p>
          )}
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            const buttonContent = (
              <button
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium shadow-sm border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  collapsed && 'justify-center px-2'
                )}
              >
                <div className="relative">
                  <Icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
                  {item.badge === 'live' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sec-safe animate-pulse" />
                  )}
                </div>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left text-xs">{item.label}</span>
                    {item.badge === 'count' && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">3</Badge>
                    )}
                  </>
                )}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[200px]">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.id}>{buttonContent}</div>;
          })}
        </nav>

        {/* Version Footer */}
        {!collapsed && (
          <div className="p-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              Opzenix MVP 1.0.0
            </p>
          </div>
        )}
      </motion.aside>
    </TooltipProvider>
  );
};

export default ControlTowerNav;
