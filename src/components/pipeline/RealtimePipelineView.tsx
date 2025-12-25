import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Lock,
  Eye,
  ChevronRight,
  ArrowLeft,
  GitBranch,
  Rocket,
  Layers,
  Code,
  TestTube,
  Package,
  ScanSearch,
  KeyRound,
  Container,
  PenTool,
  GitMerge,
  Server,
  Activity,
  Database,
  Shield,
  Terminal,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// 🔄 REALTIME PIPELINE VIEW - Live Execution
// ============================================

type PipelineMode = 'ci' | 'cd' | 'full';
type StageStatus = 'pending' | 'running' | 'passed' | 'failed' | 'blocked' | 'skipped';

interface PipelineStage {
  id: string;
  name: string;
  type: string;
  icon: any;
  status: StageStatus;
  duration?: number;
  logs: string[];
  startedAt?: Date;
  completedAt?: Date;
}

interface RealtimePipelineViewProps {
  executionId?: string;
  environment: string;
  mode?: PipelineMode;
  onBack?: () => void;
}

const CI_STAGES: Omit<PipelineStage, 'status' | 'duration' | 'logs' | 'startedAt' | 'completedAt'>[] = [
  { id: 'checkout', name: 'Checkout', type: 'source', icon: GitBranch },
  { id: 'lint', name: 'Lint', type: 'quality', icon: Code },
  { id: 'sast', name: 'SAST Scan', type: 'security', icon: ScanSearch },
  { id: 'secrets', name: 'Secrets Scan', type: 'security', icon: KeyRound },
  { id: 'deps', name: 'Dependencies', type: 'security', icon: Package },
  { id: 'unit', name: 'Unit Tests', type: 'test', icon: TestTube },
  { id: 'integration', name: 'Integration', type: 'test', icon: GitMerge },
  { id: 'build', name: 'Build Image', type: 'build', icon: Container },
  { id: 'sign', name: 'Sign Artifact', type: 'security', icon: PenTool },
];

const CD_STAGES: Omit<PipelineStage, 'status' | 'duration' | 'logs' | 'startedAt' | 'completedAt'>[] = [
  { id: 'artifact', name: 'Pull Artifact', type: 'artifact', icon: Package },
  { id: 'scan', name: 'Security Scan', type: 'security', icon: Shield },
  { id: 'gate', name: 'Policy Gate', type: 'governance', icon: Lock },
  { id: 'approval', name: 'Approval', type: 'governance', icon: CheckCircle },
  { id: 'deploy', name: 'Deploy', type: 'deploy', icon: Rocket },
  { id: 'verify', name: 'Health Check', type: 'verify', icon: Activity },
  { id: 'audit', name: 'Audit Log', type: 'audit', icon: Database },
];

export function RealtimePipelineView({ 
  executionId, 
  environment, 
  mode = 'full',
  onBack,
}: RealtimePipelineViewProps) {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<{ stage: string; message: string; level: 'info' | 'warn' | 'error'; timestamp: Date }[]>([]);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Initialize stages based on mode
  useEffect(() => {
    const baseStages = mode === 'ci' ? CI_STAGES : mode === 'cd' ? CD_STAGES : [...CI_STAGES, ...CD_STAGES];
    const initializedStages = baseStages.map(s => ({
      ...s,
      status: 'pending' as StageStatus,
      duration: 0,
      logs: [],
    }));
    setStages(initializedStages);
  }, [mode]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Simulation effect for running stages
  useEffect(() => {
    if (!isRunning || currentStageIndex < 0 || currentStageIndex >= stages.length) return;

    const stage = stages[currentStageIndex];
    if (stage.status !== 'running') return;

    // Simulate stage execution
    const duration = 2000 + Math.random() * 3000;
    const logInterval = setInterval(() => {
      const messages = [
        `Executing ${stage.name}...`,
        `Processing ${stage.type} checks`,
        `Validating configuration`,
        `Running analysis`,
        `Collecting metrics`,
      ];
      addLog(stage.id, messages[Math.floor(Math.random() * messages.length)], 'info');
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(logInterval);
      
      // Determine outcome (90% success rate for demo)
      const success = Math.random() > 0.1;
      
      setStages(prev => prev.map((s, idx) => {
        if (idx === currentStageIndex) {
          return { 
            ...s, 
            status: success ? 'passed' : 'failed',
            duration: duration,
            completedAt: new Date(),
          };
        }
        return s;
      }));

      addLog(stage.id, success ? `✓ ${stage.name} completed successfully` : `✗ ${stage.name} failed`, success ? 'info' : 'error');

      if (success && currentStageIndex < stages.length - 1) {
        // Move to next stage
        setCurrentStageIndex(prev => prev + 1);
        setStages(prev => prev.map((s, idx) => {
          if (idx === currentStageIndex + 1) {
            return { ...s, status: 'running', startedAt: new Date() };
          }
          return s;
        }));
        addLog(stages[currentStageIndex + 1]?.id || '', `Starting ${stages[currentStageIndex + 1]?.name}...`, 'info');
      } else {
        // Pipeline complete
        setIsRunning(false);
      }
    }, duration);

    return () => {
      clearTimeout(timeout);
      clearInterval(logInterval);
    };
  }, [isRunning, currentStageIndex, stages]);

  const addLog = useCallback((stage: string, message: string, level: 'info' | 'warn' | 'error') => {
    setLogs(prev => [...prev, { stage, message, level, timestamp: new Date() }]);
  }, []);

  const handleStart = () => {
    // Reset pipeline
    setStages(prev => prev.map((s, idx) => ({
      ...s,
      status: idx === 0 ? 'running' : 'pending',
      startedAt: idx === 0 ? new Date() : undefined,
      completedAt: undefined,
      duration: 0,
      logs: [],
    })));
    setCurrentStageIndex(0);
    setIsRunning(true);
    setElapsedTime(0);
    setLogs([]);
    addLog(stages[0]?.id || '', `Pipeline execution started`, 'info');
    addLog(stages[0]?.id || '', `Starting ${stages[0]?.name}...`, 'info');
  };

  const handlePause = () => {
    setIsRunning(false);
    addLog(stages[currentStageIndex]?.id || '', 'Pipeline paused', 'warn');
  };

  const handleResume = () => {
    setIsRunning(true);
    addLog(stages[currentStageIndex]?.id || '', 'Pipeline resumed', 'info');
  };

  const handleStop = () => {
    setIsRunning(false);
    setStages(prev => prev.map((s, idx) => ({
      ...s,
      status: idx <= currentStageIndex && s.status === 'running' ? 'failed' : s.status,
    })));
    addLog(stages[currentStageIndex]?.id || '', 'Pipeline stopped by user', 'error');
  };

  const passedCount = stages.filter(s => s.status === 'passed').length;
  const progress = stages.length > 0 ? Math.round((passedCount / stages.length) * 100) : 0;
  const pipelineStatus = stages.some(s => s.status === 'failed') ? 'failed' : 
                         stages.every(s => s.status === 'passed') ? 'success' :
                         isRunning ? 'running' : 'idle';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className={cn(
        'flex-shrink-0 border-b px-6 py-4',
        pipelineStatus === 'failed' ? 'border-sec-danger/30 bg-sec-danger/5' :
        pipelineStatus === 'success' ? 'border-sec-safe/30 bg-sec-safe/5' :
        'border-border bg-card/30'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                pipelineStatus === 'running' ? 'bg-node-running/10' :
                pipelineStatus === 'success' ? 'bg-sec-safe/10' :
                pipelineStatus === 'failed' ? 'bg-sec-danger/10' :
                'bg-muted'
              )}>
                {pipelineStatus === 'running' ? (
                  <Loader2 className="w-5 h-5 text-node-running animate-spin" />
                ) : pipelineStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-sec-safe" />
                ) : pipelineStatus === 'failed' ? (
                  <XCircle className="w-5 h-5 text-sec-danger" />
                ) : (
                  <Play className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {mode === 'ci' ? 'CI Pipeline' : mode === 'cd' ? 'CD Pipeline' : 'Full Pipeline'}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px]">{environment.toUpperCase()}</Badge>
                  {isRunning && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(elapsedTime)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isRunning && pipelineStatus !== 'running' && (
              <Button onClick={handleStart} className="gap-2">
                <Play className="w-4 h-4" />
                {pipelineStatus === 'failed' || pipelineStatus === 'success' ? 'Re-run' : 'Start'}
              </Button>
            )}
            {isRunning && (
              <>
                <Button variant="outline" onClick={handlePause} className="gap-2">
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
                <Button variant="destructive" onClick={handleStop} className="gap-2">
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </>
            )}
            {!isRunning && pipelineStatus === 'running' && (
              <Button onClick={handleResume} className="gap-2">
                <Play className="w-4 h-4" />
                Resume
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 flex items-center gap-4">
          <Progress 
            value={progress} 
            className={cn(
              'h-2 flex-1',
              pipelineStatus === 'failed' && '[&>div]:bg-sec-danger'
            )} 
          />
          <span className="text-xs font-medium">{passedCount}/{stages.length}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pipeline Stages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-6 overflow-x-auto">
            <div className="flex items-center gap-2">
              {stages.map((stage, idx) => (
                <AnimatedStageNode
                  key={stage.id}
                  stage={stage}
                  index={idx}
                  isSelected={selectedStage?.id === stage.id}
                  onClick={() => setSelectedStage(stage)}
                  isLast={idx === stages.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Stage Legend */}
          <div className="flex-shrink-0 px-6 pb-4">
            <div className="flex items-center justify-center gap-6 p-3 rounded-lg bg-muted/30 border border-border">
              <LegendItem color="bg-muted-foreground/30" label="Pending" />
              <LegendItem color="bg-node-running" label="Running" pulse />
              <LegendItem color="bg-sec-safe" label="Passed" />
              <LegendItem color="bg-sec-danger" label="Failed" />
              <LegendItem color="bg-sec-warning" label="Blocked" />
            </div>
          </div>
        </div>

        {/* Logs Panel */}
        <aside className="w-[400px] border-l border-border bg-card flex flex-col">
          <Tabs defaultValue="logs" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 h-12">
              <TabsTrigger value="logs" className="text-xs gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                Live Logs
              </TabsTrigger>
              <TabsTrigger value="details" className="text-xs gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="flex-1 m-0 flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4 font-mono text-xs space-y-1">
                  {logs.map((log, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'py-1 px-2 rounded',
                        log.level === 'error' && 'bg-sec-danger/10 text-sec-danger',
                        log.level === 'warn' && 'bg-sec-warning/10 text-sec-warning',
                        log.level === 'info' && 'text-muted-foreground'
                      )}
                    >
                      <span className="text-muted-foreground/50 mr-2">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      {log.message}
                    </motion.div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Start the pipeline to see logs
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="details" className="flex-1 m-0">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {selectedStage ? (
                    <>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const Icon = selectedStage.icon;
                          return <Icon className="w-5 h-5 text-primary" />;
                        })()}
                        <div>
                          <p className="font-medium">{selectedStage.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedStage.type}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="capitalize">{selectedStage.status}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p>{selectedStage.duration ? `${(selectedStage.duration / 1000).toFixed(1)}s` : '-'}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a stage to view details
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}

function AnimatedStageNode({
  stage,
  index,
  isSelected,
  onClick,
  isLast,
}: {
  stage: PipelineStage;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  isLast: boolean;
}) {
  const Icon = stage.icon;
  
  const statusConfig = {
    pending: { bg: 'bg-muted', border: 'border-muted-foreground/30', text: 'text-muted-foreground' },
    running: { bg: 'bg-node-running/10', border: 'border-node-running', text: 'text-node-running' },
    passed: { bg: 'bg-sec-safe/10', border: 'border-sec-safe', text: 'text-sec-safe' },
    failed: { bg: 'bg-sec-danger/10', border: 'border-sec-danger', text: 'text-sec-danger' },
    blocked: { bg: 'bg-sec-warning/10', border: 'border-sec-warning', text: 'text-sec-warning' },
    skipped: { bg: 'bg-muted/50', border: 'border-muted-foreground/20', text: 'text-muted-foreground/50' },
  };

  const config = statusConfig[stage.status];

  return (
    <>
      <motion.button
        onClick={onClick}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          'w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105',
          config.bg,
          config.border,
          isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
      >
        <div className="relative">
          <Icon className={cn('w-6 h-6', config.text)} />
          {stage.status === 'running' && (
            <motion.div
              className="absolute -inset-2 rounded-full border-2 border-node-running"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
        <span className={cn('text-[10px] font-medium text-center px-1', config.text)}>
          {stage.name}
        </span>
        {stage.status === 'passed' && (
          <CheckCircle className="w-3 h-3 text-sec-safe absolute top-2 right-2" />
        )}
        {stage.status === 'failed' && (
          <XCircle className="w-3 h-3 text-sec-danger absolute top-2 right-2" />
        )}
      </motion.button>

      {!isLast && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: index * 0.05 + 0.1 }}
          className={cn(
            'w-8 h-0.5 origin-left',
            stage.status === 'passed' ? 'bg-sec-safe' :
            stage.status === 'running' ? 'bg-node-running' :
            'bg-muted-foreground/30'
          )}
        />
      )}
    </>
  );
}

function LegendItem({ color, label, pulse }: { color: string; label: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('w-2.5 h-2.5 rounded-full', color, pulse && 'animate-pulse')} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default RealtimePipelineView;
