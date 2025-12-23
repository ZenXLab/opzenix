import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Layers, GitBranch, Box, Database, Brain, Shield, Clock,
  CheckCircle2, AlertCircle, XCircle, Pause, Zap, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useFlowStore, Execution, FlowType } from '@/stores/flowStore';
import { cn } from '@/lib/utils';

const flowCategories: { id: FlowType; label: string; icon: typeof GitBranch; count: number }[] = [
  { id: 'cicd', label: 'CI/CD', icon: GitBranch, count: 8 },
  { id: 'mlops', label: 'MLOps', icon: Brain, count: 3 },
  { id: 'llmops', label: 'LLMOps', icon: Box, count: 2 },
  { id: 'infrastructure', label: 'Infrastructure', icon: Database, count: 5 },
  { id: 'security', label: 'Security', icon: Shield, count: 2 },
];

const statusIcons = {
  running: { icon: Zap, className: 'text-node-running' },
  success: { icon: CheckCircle2, className: 'text-node-success' },
  warning: { icon: AlertCircle, className: 'text-node-warning' },
  failed: { icon: XCircle, className: 'text-node-failed' },
  paused: { icon: Pause, className: 'text-node-paused' },
  idle: { icon: Clock, className: 'text-muted-foreground' },
};

const LeftRail = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { executions, selectedExecution, setSelectedExecution, activeFlowType, setActiveFlowType } = useFlowStore();

  const filteredExecutions = executions.filter(e => 
    !activeFlowType || activeFlowType === 'cicd' || e.flowType === activeFlowType
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 280 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="h-full border-r border-border bg-sidebar flex flex-col overflow-hidden"
    >
      <div className="h-12 flex items-center justify-between px-3 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Flows</span>
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      <div className={cn('p-2 space-y-1', collapsed && 'px-1')}>
        {flowCategories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeFlowType === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveFlowType(cat.id)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors',
                isSelected ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                collapsed && 'justify-center px-0'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left text-xs font-medium">{cat.label}</span>
                  <span className="text-[10px] text-muted-foreground">{cat.count}</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <Separator className="my-2" />

      {!collapsed && (
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Executions</span>
          <Button variant="ghost" size="icon" className="h-6 w-6"><Filter className="w-3 h-3 text-muted-foreground" /></Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className={cn('p-2 space-y-1', collapsed && 'px-1')}>
          {filteredExecutions.map((exec) => (
            <ExecutionItem
              key={exec.id}
              execution={exec}
              collapsed={collapsed}
              selected={selectedExecution?.id === exec.id}
              onSelect={() => setSelectedExecution(exec)}
            />
          ))}
        </div>
      </ScrollArea>

      {!collapsed && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last sync: 12s ago</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-sec-safe animate-pulse" />
              <span>Live</span>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
};

interface ExecutionItemProps {
  execution: Execution;
  collapsed: boolean;
  selected: boolean;
  onSelect: () => void;
}

const ExecutionItem = ({ execution, collapsed, selected, onSelect }: ExecutionItemProps) => {
  const StatusIcon = statusIcons[execution.status].icon;
  const statusClass = statusIcons[execution.status].className;

  if (collapsed) {
    return (
      <button onClick={onSelect} className={cn('w-full flex items-center justify-center p-2 rounded transition-colors', selected ? 'bg-primary/10' : 'hover:bg-secondary')}>
        <StatusIcon className={cn('w-4 h-4', statusClass)} />
      </button>
    );
  }

  return (
    <button onClick={onSelect} className={cn('w-full flex flex-col gap-1.5 p-2 rounded transition-colors text-left', selected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary border border-transparent')}>
      <div className="flex items-center gap-2">
        <StatusIcon className={cn('w-3.5 h-3.5 shrink-0', statusClass)} />
        <span className="text-xs font-medium text-foreground truncate flex-1">{execution.name}</span>
      </div>
      <div className="flex items-center justify-between pl-5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono">{execution.commit}</span>
          <span className="text-[10px] text-muted-foreground">{execution.environment}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{execution.startedAt}</span>
      </div>
      {execution.status === 'running' && (
        <div className="h-1 bg-secondary rounded-full overflow-hidden ml-5">
          <div className="h-full bg-node-running transition-all duration-500" style={{ width: `${execution.progress}%` }} />
        </div>
      )}
    </button>
  );
};

export default LeftRail;
