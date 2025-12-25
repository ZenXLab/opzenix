import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Play, 
  Square, 
  RotateCcw, 
  GitBranch, 
  Package, 
  TestTube2, 
  Shield, 
  CheckCircle2, 
  Rocket,
  Loader2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Terminal
} from 'lucide-react';
import { usePipelineSimulation, PipelineStage } from '@/hooks/usePipelineSimulation';
import { cn } from '@/lib/utils';

interface AnimatedPipelineViewProps {
  pipelineType: 'ci' | 'cd' | 'full';
  onBack?: () => void;
}

const stageIcons: Record<string, React.ReactNode> = {
  source: <GitBranch className="w-5 h-5" />,
  build: <Package className="w-5 h-5" />,
  test: <TestTube2 className="w-5 h-5" />,
  security: <Shield className="w-5 h-5" />,
  approval: <CheckCircle2 className="w-5 h-5" />,
  deploy: <Rocket className="w-5 h-5" />,
};

const statusColors: Record<string, string> = {
  idle: 'bg-muted text-muted-foreground',
  running: 'bg-primary text-primary-foreground animate-pulse',
  success: 'bg-green-500 text-white',
  failed: 'bg-destructive text-destructive-foreground',
  warning: 'bg-yellow-500 text-white',
  pending: 'bg-muted text-muted-foreground',
};

const getStatusIcon = (status: PipelineStage['status']) => {
  switch (status) {
    case 'running':
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'success':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'failed':
      return <XCircle className="w-4 h-4" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const ciStages = [
  { id: '1', name: 'Clone', type: 'source' as const },
  { id: '2', name: 'Build', type: 'build' as const },
  { id: '3', name: 'Test', type: 'test' as const },
  { id: '4', name: 'Security Scan', type: 'security' as const },
];

const cdStages = [
  { id: '5', name: 'Approval', type: 'approval' as const },
  { id: '6', name: 'Deploy Dev', type: 'deploy' as const },
  { id: '7', name: 'Deploy Staging', type: 'deploy' as const },
  { id: '8', name: 'Deploy Prod', type: 'deploy' as const },
];

const fullStages = [...ciStages, ...cdStages];

export function AnimatedPipelineView({ pipelineType, onBack }: AnimatedPipelineViewProps) {
  const { execution, currentLogs, startExecution, stopExecution, resetExecution, isRunning } = usePipelineSimulation();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [selectedStage, setSelectedStage] = useState<(PipelineStage & { name: string; type: string }) | null>(null);

  const stages = pipelineType === 'ci' ? ciStages : pipelineType === 'cd' ? cdStages : fullStages;

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentLogs]);

  const handleStart = () => {
    startExecution(stages);
  };

  const handleStageClick = (stage: typeof displayStages[0]) => {
    setSelectedStage(stage);
  };

  const displayStages = execution?.stages || stages.map(s => ({ ...s, status: 'idle' as const, logs: [] }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h2 className="text-xl font-bold">
              {pipelineType === 'ci' ? 'CI Pipeline' : pipelineType === 'cd' ? 'CD Pipeline' : 'Full Pipeline'}
            </h2>
            <p className="text-sm text-muted-foreground">Click on stages to view details. Real-time execution with live logs.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {execution && (
            <Badge variant={
              execution.status === 'success' ? 'default' : 
              execution.status === 'failed' ? 'destructive' : 
              'secondary'
            }>
              {execution.status.toUpperCase()}
            </Badge>
          )}
          {!isRunning ? (
            <Button onClick={handleStart}>
              <Play className="w-4 h-4 mr-2" />
              {execution ? 'Re-run' : 'Start'}
            </Button>
          ) : (
            <Button variant="destructive" onClick={stopExecution}>
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          )}
          {execution && !isRunning && (
            <Button variant="outline" onClick={resetExecution}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Pipeline Visualization */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {displayStages.map((stage, index) => (
              <React.Fragment key={stage.id}>
                <div className="flex flex-col items-center min-w-[100px]">
                  <button
                    onClick={() => handleStageClick(stage)}
                    className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-105 hover:ring-2 hover:ring-primary/50',
                      statusColors[stage.status],
                      stage.status === 'running' && 'ring-4 ring-primary/30 scale-110'
                    )}
                  >
                    {stageIcons[stage.type]}
                  </button>
                  <span className="mt-2 text-sm font-medium">{stage.name}</span>
                  <div className="flex items-center gap-1 mt-1">
                    {getStatusIcon(stage.status)}
                    {stage.duration && (
                      <span className="text-xs text-muted-foreground">{stage.duration}s</span>
                    )}
                  </div>
                </div>
                {index < displayStages.length - 1 && (
                  <div className={cn(
                    'flex-1 h-1 mx-2 rounded transition-all duration-500',
                    index < (execution?.currentStageIndex ?? -1) ? 'bg-green-500' :
                    index === execution?.currentStageIndex ? 'bg-primary animate-pulse' : 'bg-muted'
                  )}>
                    <ArrowRight className={cn(
                      'w-4 h-4 -mt-1.5 ml-auto transition-colors',
                      index < (execution?.currentStageIndex ?? -1) ? 'text-green-500' :
                      index === execution?.currentStageIndex ? 'text-primary' : 'text-muted'
                    )} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            Live Logs
            {isRunning && <Loader2 className="w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full rounded border bg-muted/30 p-4">
            <div className="font-mono text-xs space-y-1">
              {currentLogs.length === 0 ? (
                <p className="text-muted-foreground">Click "Start" to begin pipeline execution...</p>
              ) : (
                currentLogs.map((log, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      'transition-all duration-200',
                      log.includes('[WARN]') && 'text-yellow-500',
                      log.includes('[ERROR]') && 'text-destructive',
                      log.includes('[INFO]') && 'text-foreground',
                      index === currentLogs.length - 1 && 'animate-fade-in'
                    )}
                  >
                    <span className="text-muted-foreground mr-2">
                      {new Date().toLocaleTimeString()}
                    </span>
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Stage Details */}
      {execution && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {execution.stages.map((stage) => (
            <Card key={stage.id} className={cn(
              'transition-all duration-300',
              stage.status === 'running' && 'ring-2 ring-primary'
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {stageIcons[stage.type]}
                  <span className="font-medium text-sm">{stage.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={cn(
                    'text-xs',
                    stage.status === 'success' && 'border-green-500 text-green-500',
                    stage.status === 'failed' && 'border-destructive text-destructive',
                    stage.status === 'warning' && 'border-yellow-500 text-yellow-500',
                    stage.status === 'running' && 'border-primary text-primary'
                  )}>
                    {stage.status}
                  </Badge>
                  {stage.duration && (
                    <span className="text-xs text-muted-foreground">{stage.duration}s</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stage Detail Dialog */}
      <Dialog open={!!selectedStage} onOpenChange={() => setSelectedStage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedStage && stageIcons[selectedStage.type]}
              {selectedStage?.name} Details
            </DialogTitle>
            <DialogDescription>
              Stage execution details and logs
            </DialogDescription>
          </DialogHeader>
          {selectedStage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline" className={cn(
                  selectedStage.status === 'success' && 'border-green-500 text-green-500',
                  selectedStage.status === 'failed' && 'border-destructive text-destructive',
                  selectedStage.status === 'warning' && 'border-yellow-500 text-yellow-500',
                  selectedStage.status === 'running' && 'border-primary text-primary'
                )}>
                  {selectedStage.status.toUpperCase()}
                </Badge>
              </div>
              {selectedStage.duration && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="font-mono text-sm">{selectedStage.duration}s</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="text-sm capitalize">{selectedStage.type}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Stage Logs</span>
                </div>
                <ScrollArea className="h-[150px] rounded border bg-muted/30 p-3">
                  <div className="font-mono text-xs space-y-1">
                    {selectedStage.logs && selectedStage.logs.length > 0 ? (
                      selectedStage.logs.map((log, idx) => (
                        <div key={idx} className={cn(
                          log.includes('[WARN]') && 'text-yellow-500',
                          log.includes('[ERROR]') && 'text-destructive',
                          log.includes('[INFO]') && 'text-foreground'
                        )}>
                          {log}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No logs available. Start the pipeline to see logs.</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
