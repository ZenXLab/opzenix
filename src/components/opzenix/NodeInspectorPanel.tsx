import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, RefreshCw, RotateCcw, Edit, GitBranch, Clock,
  CheckCircle2, XCircle, AlertTriangle, Pause, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Node } from '@xyflow/react';

interface NodeInspectorPanelProps {
  node: Node | null;
  onClose: () => void;
  onEdit: (nodeId: string) => void;
  onRerun: (nodeId: string, fromHere: boolean) => void;
  onRollback: (nodeId: string) => void;
}

const statusConfig = {
  idle: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/20' },
  running: { icon: Play, color: 'text-node-running', bg: 'bg-node-running/20' },
  success: { icon: CheckCircle2, color: 'text-sec-safe', bg: 'bg-sec-safe/20' },
  warning: { icon: AlertTriangle, color: 'text-sec-warning', bg: 'bg-sec-warning/20' },
  failed: { icon: XCircle, color: 'text-sec-critical', bg: 'bg-sec-critical/20' },
  paused: { icon: Pause, color: 'text-node-paused', bg: 'bg-node-paused/20' },
};

const mockLogs = [
  '[10:24:32] Starting stage execution...',
  '[10:24:33] Pulling dependencies...',
  '[10:24:45] Dependencies installed successfully',
  '[10:24:46] Running build command...',
  '[10:25:12] Build completed with 0 errors',
  '[10:25:13] Running security scan...',
  '[10:25:34] No vulnerabilities found',
  '[10:25:35] Stage completed successfully',
];

const mockSecurityResults = [
  { severity: 'info', count: 12, label: 'Informational' },
  { severity: 'low', count: 3, label: 'Low Risk' },
  { severity: 'medium', count: 0, label: 'Medium Risk' },
  { severity: 'high', count: 0, label: 'High Risk' },
  { severity: 'critical', count: 0, label: 'Critical' },
];

const NodeInspectorPanel = ({ node, onClose, onEdit, onRerun, onRollback }: NodeInspectorPanelProps) => {
  const [activeTab, setActiveTab] = useState('logs');

  if (!node) return null;

  const nodeData = node.data as any;
  const status = nodeData.status || 'idle';
  const StatusIcon = statusConfig[status as keyof typeof statusConfig]?.icon || Clock;
  const statusColor = statusConfig[status as keyof typeof statusConfig]?.color || 'text-muted-foreground';
  const statusBg = statusConfig[status as keyof typeof statusConfig]?.bg || 'bg-muted/20';

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      className="w-80 bg-card border-l border-border flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded", statusBg)}>
              <StatusIcon className={cn("w-4 h-4", statusColor)} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">{nodeData.label}</h3>
              <p className="text-[10px] text-muted-foreground capitalize">{nodeData.stageType}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[10px] capitalize", statusColor)}>
            {status}
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="p-2 bg-secondary/30 rounded text-center">
            <p className="text-[10px] text-muted-foreground">Duration</p>
            <p className="text-xs font-medium">{nodeData.duration || '--'}</p>
          </div>
          <div className="p-2 bg-secondary/30 rounded text-center">
            <p className="text-[10px] text-muted-foreground">Retries</p>
            <p className="text-xs font-medium">{nodeData.retries || '0'}</p>
          </div>
          <div className="p-2 bg-secondary/30 rounded text-center">
            <p className="text-[10px] text-muted-foreground">Checkpoint</p>
            <p className="text-xs font-medium">{nodeData.checkpoint ? '✓' : '--'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2 grid grid-cols-4 h-8">
          <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
          <TabsTrigger value="config" className="text-xs">Config</TabsTrigger>
          <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs">AI</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          {/* Logs Tab */}
          <TabsContent value="logs" className="h-full m-0 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-1 font-mono text-[10px]">
                {mockLogs.map((log, i) => (
                  <div key={i} className={cn(
                    "py-0.5",
                    log.includes('error') ? 'text-sec-critical' :
                    log.includes('warning') ? 'text-sec-warning' :
                    log.includes('success') || log.includes('completed') ? 'text-sec-safe' :
                    'text-muted-foreground'
                  )}>
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="h-full m-0 p-4">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Description</p>
                <p className="text-xs">{nodeData.description || 'No description'}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Command</p>
                <pre className="text-xs bg-secondary/30 p-2 rounded font-mono overflow-auto">
                  {nodeData.command || 'N/A'}
                </pre>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Timeout</p>
                <p className="text-xs">{nodeData.timeout || '300'}s</p>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="h-full m-0 p-4">
            <div className="space-y-2">
              {mockSecurityResults.map((result) => (
                <div key={result.severity} className="flex items-center justify-between p-2 bg-secondary/20 rounded">
                  <span className="text-xs">{result.label}</span>
                  <Badge variant={result.count > 0 ? 'default' : 'outline'} className="text-[10px]">
                    {result.count}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* AI Tab */}
          <TabsContent value="ai" className="h-full m-0 p-4">
            <div className="space-y-3">
              <div className="p-3 bg-ai-primary/10 rounded-lg border border-ai-primary/20">
                <p className="text-xs text-ai-primary font-medium mb-1">💡 AI Suggestion</p>
                <p className="text-[11px] text-muted-foreground">
                  Consider adding a caching layer for dependencies to reduce build time by ~40%.
                </p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-xs font-medium mb-1">Execution Summary</p>
                <p className="text-[11px] text-muted-foreground">
                  This stage ran successfully. No anomalies detected. Performance is within normal parameters.
                </p>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => onEdit(node.id)}>
            <Edit className="w-3.5 h-3.5" />
            Edit Stage
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => onRerun(node.id, true)}>
            <RefreshCw className="w-3.5 h-3.5" />
            Re-run From Here
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => onRerun(node.id, false)}>
            <GitBranch className="w-3.5 h-3.5" />
            Branch Execution
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs text-sec-warning" onClick={() => onRollback(node.id)}>
            <RotateCcw className="w-3.5 h-3.5" />
            Rollback
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default NodeInspectorPanel;
