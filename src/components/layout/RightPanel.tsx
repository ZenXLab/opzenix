import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight,
  Activity,
  Radio,
  GitBranch,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFlowStore } from '@/stores/flowStore';
import { cn } from '@/lib/utils';

interface RightPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const RightPanel = ({ isOpen, onToggle }: RightPanelProps) => {
  const { executions, deployments, systemHealth } = useFlowStore();
  
  const activeExecutions = executions.filter(e => e.status === 'running');
  const recentDeployments = deployments.slice(0, 5);

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed right-0 top-1/2 -translate-y-1/2 h-16 w-6 rounded-l-md rounded-r-none border border-r-0 border-border bg-card z-30"
          onClick={onToggle}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full border-l border-border bg-card/50 flex flex-col overflow-hidden shrink-0"
          >
            {/* Header */}
            <div className="h-12 flex items-center justify-between px-3 border-b border-border">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quick View
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {/* System Status */}
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">System Status</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <StatusItem 
                      label="Health" 
                      value={systemHealth.status} 
                      variant={systemHealth.status}
                    />
                    <StatusItem label="Uptime" value={systemHealth.uptime} />
                    <StatusItem label="Active Flows" value={String(systemHealth.activeFlows)} />
                    <StatusItem 
                      label="Pending" 
                      value={String(systemHealth.pendingApprovals)}
                      variant={systemHealth.pendingApprovals > 0 ? 'warning' : 'default'}
                    />
                  </div>
                </div>

                {/* Active Executions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Active Executions</span>
                  </div>
                  {activeExecutions.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      No active executions
                    </div>
                  ) : (
                    activeExecutions.map((exec) => (
                      <div key={exec.id} className="p-2 rounded-lg bg-secondary/30 border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground truncate">{exec.name}</span>
                          <span className="text-[10px] text-node-running font-medium">{exec.progress}%</span>
                        </div>
                        <div className="h-1 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-node-running transition-all duration-500" 
                            style={{ width: `${exec.progress}%` }} 
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span className="font-mono">{exec.commit}</span>
                          <span>{exec.environment}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Recent Deployments */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Recent Deployments</span>
                  </div>
                  {recentDeployments.map((dep) => (
                    <div key={dep.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        dep.status === 'success' && 'bg-sec-safe',
                        dep.status === 'failed' && 'bg-sec-critical',
                        dep.status === 'running' && 'bg-node-running animate-pulse',
                        dep.status === 'warning' && 'bg-sec-warning'
                      )} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-foreground">{dep.version}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{dep.environment}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* OTel Quick Stats */}
                <div className="p-3 rounded-lg bg-ai-primary/5 border border-ai-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Radio className="w-4 h-4 text-ai-primary" />
                    <span className="text-xs font-medium text-foreground">OTel Signals</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Traces</span>
                      <span className="font-medium text-foreground">12.4k/min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Metrics</span>
                      <span className="font-medium text-foreground">847</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Correlation</span>
                      <span className="font-medium text-sec-safe">98.7%</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

interface StatusItemProps {
  label: string;
  value: string;
  variant?: 'default' | 'healthy' | 'degraded' | 'critical' | 'warning';
}

const StatusItem = ({ label, value, variant = 'default' }: StatusItemProps) => (
  <div className="text-center">
    <div className="text-[10px] text-muted-foreground">{label}</div>
    <div className={cn(
      "text-xs font-medium",
      variant === 'healthy' && 'text-sec-safe',
      variant === 'degraded' && 'text-sec-warning',
      variant === 'critical' && 'text-sec-critical',
      variant === 'warning' && 'text-sec-warning',
      variant === 'default' && 'text-foreground'
    )}>
      {value}
    </div>
  </div>
);

export default RightPanel;
