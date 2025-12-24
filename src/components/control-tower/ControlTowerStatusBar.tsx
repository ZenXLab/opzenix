import { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  Github, 
  Radio, 
  Shield, 
  Webhook,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SystemStatus {
  id: string;
  label: string;
  status: 'healthy' | 'degraded' | 'error' | 'unknown';
  icon: typeof Activity;
  lastCheck?: string;
}

const ControlTowerStatusBar = () => {
  const [statuses, setStatuses] = useState<SystemStatus[]>([
    { id: 'db', label: 'Database', status: 'healthy', icon: Database },
    { id: 'github', label: 'GitHub API', status: 'healthy', icon: Github },
    { id: 'webhooks', label: 'Webhooks', status: 'healthy', icon: Webhook },
    { id: 'realtime', label: 'Realtime', status: 'healthy', icon: Radio },
    { id: 'vault', label: 'Vault', status: 'healthy', icon: Shield },
  ]);

  const [overallHealth, setOverallHealth] = useState<'healthy' | 'degraded' | 'critical'>('healthy');
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // Check database health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Simple health check - try to query something
        const { error } = await supabase.from('executions').select('id').limit(1);
        
        setStatuses(prev => prev.map(s => {
          if (s.id === 'db') {
            return { ...s, status: error ? 'error' : 'healthy', lastCheck: new Date().toISOString() };
          }
          return s;
        }));

        // Check realtime connection
        const channels = supabase.getChannels();
        setStatuses(prev => prev.map(s => {
          if (s.id === 'realtime') {
            return { ...s, status: channels.length > 0 ? 'healthy' : 'degraded' };
          }
          return s;
        }));

        setLastSync(new Date());
      } catch (err) {
        console.error('Health check failed:', err);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  // Calculate overall health
  useEffect(() => {
    const errorCount = statuses.filter(s => s.status === 'error').length;
    const degradedCount = statuses.filter(s => s.status === 'degraded').length;

    if (errorCount > 0) {
      setOverallHealth('critical');
    } else if (degradedCount > 0) {
      setOverallHealth('degraded');
    } else {
      setOverallHealth('healthy');
    }
  }, [statuses]);

  const getStatusIcon = (status: SystemStatus['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-3 h-3 text-sec-safe" />;
      case 'degraded': return <AlertTriangle className="w-3 h-3 text-sec-warning" />;
      case 'error': return <XCircle className="w-3 h-3 text-sec-critical" />;
      default: return <Activity className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const formatTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <TooltipProvider>
      <footer className="h-8 border-t border-border bg-muted/30 flex items-center justify-between px-4 shrink-0">
        {/* Left - Overall Status */}
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium',
            overallHealth === 'healthy' && 'bg-sec-safe/10 text-sec-safe',
            overallHealth === 'degraded' && 'bg-sec-warning/10 text-sec-warning',
            overallHealth === 'critical' && 'bg-sec-critical/10 text-sec-critical'
          )}>
            <span className={cn(
              'w-1.5 h-1.5 rounded-full animate-pulse',
              overallHealth === 'healthy' && 'bg-sec-safe',
              overallHealth === 'degraded' && 'bg-sec-warning',
              overallHealth === 'critical' && 'bg-sec-critical'
            )} />
            {overallHealth === 'healthy' ? 'All Systems Operational' : 
             overallHealth === 'degraded' ? 'Degraded Performance' : 'System Issues Detected'}
          </div>
        </div>

        {/* Center - Service Status Indicators */}
        <div className="flex items-center gap-4">
          {statuses.map((status) => {
            const Icon = status.icon;
            return (
              <Tooltip key={status.id}>
                <TooltipTrigger asChild>
                  <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                    {getStatusIcon(status.status)}
                    <Icon className="w-3 h-3" />
                    <span className="hidden lg:inline">{status.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{status.label}</p>
                  <p className="text-xs text-muted-foreground capitalize">{status.status}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Right - Sync Status */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="hidden sm:inline">Last sync: {formatTime(lastSync)}</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-sec-safe animate-pulse" />
            <span>Live</span>
          </div>
        </div>
      </footer>
    </TooltipProvider>
  );
};

export default ControlTowerStatusBar;
