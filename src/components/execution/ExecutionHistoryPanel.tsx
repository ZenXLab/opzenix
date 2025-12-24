import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, Play, CheckCircle2, XCircle, Clock, AlertTriangle,
  ChevronDown, ChevronRight, Terminal, FileText, GitBranch,
  Calendar, User, ArrowRight, Sparkles, PauseCircle, RefreshCw,
  Filter, Search, Download, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useFlowStore, Execution, FlowType, NodeStatus } from '@/stores/flowStore';
import { formatDistanceToNow } from 'date-fns';

interface ExecutionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  flowType?: FlowType;
}

interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  stage: string;
  message: string;
}

interface ExecutionDetails extends Execution {
  stages: {
    name: string;
    status: NodeStatus;
    duration: string;
    logs: ExecutionLog[];
  }[];
  totalDuration: string;
  triggeredBy: string;
  artifacts: string[];
}

// Mock detailed executions
const mockExecutionDetails: Record<string, ExecutionDetails> = {
  'exec-1': {
    id: 'exec-1',
    name: 'api-gateway-v2.4.1',
    status: 'running',
    startedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    environment: 'production',
    branch: 'main',
    commit: 'a3f7c2e',
    progress: 65,
    flowType: 'cicd',
    stages: [
      { name: 'Source', status: 'success', duration: '12s', logs: [
        { timestamp: '10:32:15', level: 'info', stage: 'Source', message: 'Cloning repository...' },
        { timestamp: '10:32:22', level: 'info', stage: 'Source', message: 'Checkout branch: main' },
        { timestamp: '10:32:27', level: 'info', stage: 'Source', message: 'Commit: a3f7c2e - "feat: add rate limiting"' },
      ]},
      { name: 'Build', status: 'success', duration: '2m 34s', logs: [
        { timestamp: '10:32:28', level: 'info', stage: 'Build', message: 'Installing dependencies...' },
        { timestamp: '10:33:45', level: 'info', stage: 'Build', message: 'Running build script...' },
        { timestamp: '10:35:02', level: 'info', stage: 'Build', message: 'Build completed successfully' },
      ]},
      { name: 'Security Scan', status: 'success', duration: '1m 12s', logs: [
        { timestamp: '10:35:03', level: 'info', stage: 'Security Scan', message: 'Running SAST analysis...' },
        { timestamp: '10:35:45', level: 'warn', stage: 'Security Scan', message: 'Low: 2 deprecated dependencies found' },
        { timestamp: '10:36:15', level: 'info', stage: 'Security Scan', message: 'No critical vulnerabilities detected' },
      ]},
      { name: 'Unit Tests', status: 'success', duration: '3m 45s', logs: [
        { timestamp: '10:36:16', level: 'info', stage: 'Unit Tests', message: 'Running 847 test suites...' },
        { timestamp: '10:39:01', level: 'info', stage: 'Unit Tests', message: '847/847 tests passed' },
      ]},
      { name: 'Deploy Staging', status: 'running', duration: '4m 22s', logs: [
        { timestamp: '10:39:02', level: 'info', stage: 'Deploy Staging', message: 'Initiating rolling deployment...' },
        { timestamp: '10:40:15', level: 'info', stage: 'Deploy Staging', message: 'Pod 1/3 updated' },
        { timestamp: '10:42:30', level: 'info', stage: 'Deploy Staging', message: 'Pod 2/3 updated' },
      ]},
      { name: 'Integration Tests', status: 'idle', duration: '-', logs: [] },
      { name: 'Production Approval', status: 'idle', duration: '-', logs: [] },
      { name: 'Deploy Production', status: 'idle', duration: '-', logs: [] },
    ],
    totalDuration: '12m 45s',
    triggeredBy: 'John Doe',
    artifacts: ['api-gateway-2.4.1.tar.gz', 'docker-image:v2.4.1'],
  },
  'exec-2': {
    id: 'exec-2',
    name: 'ml-pipeline-retrain',
    status: 'success',
    startedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    environment: 'staging',
    branch: 'feature/v3',
    commit: 'b8d4f1a',
    progress: 100,
    flowType: 'mlops',
    stages: [
      { name: 'Data Ingestion', status: 'success', duration: '45s', logs: [
        { timestamp: '10:15:00', level: 'info', stage: 'Data Ingestion', message: 'Loading dataset from S3...' },
        { timestamp: '10:15:45', level: 'info', stage: 'Data Ingestion', message: 'Loaded 1.2M records' },
      ]},
      { name: 'Data Validation', status: 'success', duration: '1m 20s', logs: [
        { timestamp: '10:15:46', level: 'info', stage: 'Data Validation', message: 'Validating schema...' },
        { timestamp: '10:17:06', level: 'info', stage: 'Data Validation', message: 'Schema validated, 99.8% data quality' },
      ]},
      { name: 'Model Training', status: 'success', duration: '15m 34s', logs: [
        { timestamp: '10:17:07', level: 'info', stage: 'Model Training', message: 'Training XGBoost model...' },
        { timestamp: '10:32:41', level: 'info', stage: 'Model Training', message: 'Training complete. Accuracy: 94.2%' },
      ]},
      { name: 'Model Evaluation', status: 'success', duration: '2m 15s', logs: [
        { timestamp: '10:32:42', level: 'info', stage: 'Model Evaluation', message: 'Evaluating model metrics...' },
        { timestamp: '10:34:57', level: 'info', stage: 'Model Evaluation', message: 'F1: 0.93, AUC: 0.97' },
      ]},
    ],
    totalDuration: '19m 54s',
    triggeredBy: 'Scheduled',
    artifacts: ['model-v3.pkl', 'metrics-report.json'],
  },
};

const ExecutionHistoryPanel = ({ isOpen, onClose, flowType }: ExecutionHistoryPanelProps) => {
  const { executions } = useFlowStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const filteredExecutions = executions
    .filter(e => !flowType || e.flowType === flowType)
    .filter(e => statusFilter === 'all' || e.status === statusFilter)
    .filter(e => 
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.branch.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getStatusIcon = (status: NodeStatus) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-sec-safe" />;
      case 'failed': return <XCircle className="w-4 h-4 text-sec-critical" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-node-running animate-spin" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-sec-warning" />;
      case 'paused': return <PauseCircle className="w-4 h-4 text-muted-foreground" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: NodeStatus) => {
    const variants: Record<NodeStatus, string> = {
      success: 'bg-sec-safe/10 text-sec-safe border-sec-safe/20',
      failed: 'bg-sec-critical/10 text-sec-critical border-sec-critical/20',
      running: 'bg-node-running/10 text-node-running border-node-running/20',
      warning: 'bg-sec-warning/10 text-sec-warning border-sec-warning/20',
      paused: 'bg-muted text-muted-foreground border-border',
      idle: 'bg-muted text-muted-foreground border-border',
    };
    return (
      <Badge variant="outline" className={cn('text-[10px] capitalize', variants[status])}>
        {status}
      </Badge>
    );
  };

  const executionDetails = selectedExecution ? mockExecutionDetails[selectedExecution] : null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-ai-primary" />
            Execution History
            {flowType && (
              <Badge variant="outline" className="ml-2 text-[10px] uppercase">
                {flowType}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Execution List */}
          <div className={cn(
            "border-r border-border flex flex-col transition-all duration-300",
            selectedExecution ? "w-1/3" : "w-full"
          )}>
            {/* Filters */}
            <div className="p-3 border-b border-border space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search executions..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Execution List */}
            <ScrollArea className="flex-1">
              {filteredExecutions.length === 0 ? (
                <div className="p-8 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground mb-2">No executions found</p>
                  <p className="text-xs text-muted-foreground">
                    {flowType ? `Create your first ${flowType.toUpperCase()} pipeline to see executions here.` : 'Start a pipeline to see execution history.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredExecutions.map((execution) => (
                    <button
                      key={execution.id}
                      onClick={() => setSelectedExecution(execution.id)}
                      className={cn(
                        "w-full p-3 text-left hover:bg-secondary/50 transition-colors",
                        selectedExecution === execution.id && "bg-primary/5 border-l-2 border-primary"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          {getStatusIcon(execution.status)}
                          <span className="text-sm font-medium truncate">{execution.name}</span>
                        </div>
                        {!selectedExecution && getStatusBadge(execution.status)}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                        <GitBranch className="w-3 h-3" />
                        <span className="truncate">{execution.branch}</span>
                        <span>•</span>
                        <span>{execution.startedAt}</span>
                      </div>
                      {execution.status === 'running' && (
                        <div className="mt-2">
                          <div className="h-1 bg-secondary rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-node-running"
                              initial={{ width: 0 }}
                              animate={{ width: `${execution.progress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-0.5">{execution.progress}%</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Execution Details */}
          <AnimatePresence>
            {selectedExecution && executionDetails && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '66.67%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(executionDetails.status)}
                      <h3 className="text-sm font-medium">{executionDetails.name}</h3>
                      {getStatusBadge(executionDetails.status)}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => setSelectedExecution(null)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[10px] text-muted-foreground mt-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>Duration: {executionDetails.totalDuration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      <span>By: {executionDetails.triggeredBy}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GitBranch className="w-3 h-3" />
                      <span>{executionDetails.branch} ({executionDetails.commit})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      <span>{executionDetails.startedAt}</span>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="stages" className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="mx-4 mt-2 w-fit">
                    <TabsTrigger value="stages" className="text-xs">Stages</TabsTrigger>
                    <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
                    <TabsTrigger value="artifacts" className="text-xs">Artifacts</TabsTrigger>
                  </TabsList>

                  <TabsContent value="stages" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-2">
                        {executionDetails.stages.map((stage, idx) => (
                          <div key={stage.name} className="border border-border rounded-lg overflow-hidden">
                            <button
                              onClick={() => setExpandedStage(expandedStage === stage.name ? null : stage.name)}
                              className="w-full flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-muted-foreground w-5">{idx + 1}</span>
                                  {getStatusIcon(stage.status)}
                                </div>
                                <span className="text-sm font-medium">{stage.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{stage.duration}</span>
                                {stage.logs.length > 0 && (
                                  expandedStage === stage.name 
                                    ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </button>
                            
                            <AnimatePresence>
                              {expandedStage === stage.name && stage.logs.length > 0 && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden border-t border-border"
                                >
                                  <div className="p-3 bg-background/50 space-y-1 font-mono text-[11px]">
                                    {stage.logs.map((log, i) => (
                                      <div key={i} className="flex items-start gap-2">
                                        <span className="text-muted-foreground shrink-0">{log.timestamp}</span>
                                        <span className={cn(
                                          "shrink-0 uppercase text-[9px] font-bold px-1.5 py-0.5 rounded",
                                          log.level === 'info' && 'bg-blue-500/10 text-blue-500',
                                          log.level === 'warn' && 'bg-sec-warning/10 text-sec-warning',
                                          log.level === 'error' && 'bg-sec-critical/10 text-sec-critical',
                                          log.level === 'debug' && 'bg-muted text-muted-foreground'
                                        )}>
                                          {log.level}
                                        </span>
                                        <span className="text-foreground break-all">{log.message}</span>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="logs" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full">
                      <div className="p-4">
                        <div className="bg-background rounded-lg border border-border p-3 font-mono text-[11px] space-y-1">
                          {executionDetails.stages.flatMap(s => s.logs).map((log, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-muted-foreground shrink-0">{log.timestamp}</span>
                              <span className={cn(
                                "shrink-0 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold",
                                log.level === 'info' && 'bg-blue-500/10 text-blue-500',
                                log.level === 'warn' && 'bg-sec-warning/10 text-sec-warning',
                                log.level === 'error' && 'bg-sec-critical/10 text-sec-critical'
                              )}>
                                {log.level}
                              </span>
                              <span className="text-muted-foreground shrink-0">[{log.stage}]</span>
                              <span className="text-foreground break-all">{log.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="artifacts" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-2">
                        {executionDetails.artifacts.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">No artifacts generated</p>
                        ) : (
                          executionDetails.artifacts.map((artifact, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-mono">{artifact}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExecutionHistoryPanel;
