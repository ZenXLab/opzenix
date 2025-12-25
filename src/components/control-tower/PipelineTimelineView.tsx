import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  GitCommit, 
  Workflow, 
  Shield, 
  Package, 
  CheckSquare, 
  Rocket, 
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface TimelineStage {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  timestamp?: string;
  details?: Record<string, unknown>;
}

interface PipelineTimelineViewProps {
  executionId: string;
  onStageClick?: (stageId: string) => void;
}

const stageConfig = [
  { id: 'commit', name: 'Commit', icon: <GitCommit className="h-4 w-4" /> },
  { id: 'ci', name: 'CI', icon: <Workflow className="h-4 w-4" /> },
  { id: 'security', name: 'Security', icon: <Shield className="h-4 w-4" /> },
  { id: 'artifact', name: 'Artifact', icon: <Package className="h-4 w-4" /> },
  { id: 'approval', name: 'Approval', icon: <CheckSquare className="h-4 w-4" /> },
  { id: 'cd', name: 'CD', icon: <Rocket className="h-4 w-4" /> },
  { id: 'runtime', name: 'Runtime', icon: <Activity className="h-4 w-4" /> },
  { id: 'verified', name: 'Verified', icon: <CheckCircle2 className="h-4 w-4" /> }
];

const statusColors = {
  pending: 'bg-muted text-muted-foreground border-muted',
  running: 'bg-primary/10 text-primary border-primary animate-pulse',
  passed: 'bg-green-500/10 text-green-500 border-green-500',
  failed: 'bg-destructive/10 text-destructive border-destructive',
  skipped: 'bg-yellow-500/10 text-yellow-500 border-yellow-500'
};

const statusIcons = {
  pending: <Clock className="h-3 w-3" />,
  running: <Loader2 className="h-3 w-3 animate-spin" />,
  passed: <CheckCircle2 className="h-3 w-3" />,
  failed: <XCircle className="h-3 w-3" />,
  skipped: <AlertTriangle className="h-3 w-3" />
};

export function PipelineTimelineView({ executionId, onStageClick }: PipelineTimelineViewProps) {
  const [stages, setStages] = useState<TimelineStage[]>([]);
  const [execution, setExecution] = useState<{
    name: string;
    status: string;
    commit_hash: string | null;
    branch: string | null;
    environment: string;
    started_at: string;
    progress: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExecutionData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('pipeline-timeline')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'executions',
          filter: `id=eq.${executionId}`
        },
        () => fetchExecutionData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ci_evidence',
          filter: `execution_id=eq.${executionId}`
        },
        () => fetchExecutionData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [executionId]);

  const fetchExecutionData = async () => {
    // Fetch execution
    const { data: execData } = await supabase
      .from('executions')
      .select('name, status, commit_hash, branch, environment, started_at, progress')
      .eq('id', executionId)
      .single();

    if (execData) {
      setExecution(execData);
    }

    // Fetch CI evidence
    const { data: evidence } = await supabase
      .from('ci_evidence')
      .select('*')
      .eq('execution_id', executionId)
      .order('step_order', { ascending: true });

    // Fetch approvals
    const { data: approvals } = await supabase
      .from('approval_requests')
      .select('status')
      .eq('execution_id', executionId);

    // Fetch deployments
    const { data: deployments } = await supabase
      .from('deployments')
      .select('status')
      .eq('execution_id', executionId);

    // Map evidence to stages
    const mappedStages: TimelineStage[] = stageConfig.map(config => {
      let status: TimelineStage['status'] = 'pending';
      let duration: number | undefined;
      let timestamp: string | undefined;
      let details: Record<string, unknown> | undefined;

      switch (config.id) {
        case 'commit':
          status = execData?.commit_hash ? 'passed' : 'pending';
          timestamp = execData?.started_at;
          details = { 
            hash: execData?.commit_hash, 
            branch: execData?.branch 
          };
          break;
        case 'ci': {
          const ciEvidence = evidence?.filter(e => 
            ['test', 'build'].includes(e.step_type)
          );
          if (ciEvidence && ciEvidence.length > 0) {
            const hasFailed = ciEvidence.some(e => e.status === 'failed');
            const hasRunning = ciEvidence.some(e => e.status === 'running');
            const allPassed = ciEvidence.every(e => e.status === 'passed');
            status = hasFailed ? 'failed' : hasRunning ? 'running' : allPassed ? 'passed' : 'pending';
            duration = ciEvidence.reduce((sum, e) => sum + (e.duration_ms || 0), 0);
          }
          break;
        }
        case 'security': {
          const secEvidence = evidence?.filter(e => 
            ['sast', 'secrets', 'dependency', 'scan'].includes(e.step_type)
          );
          if (secEvidence && secEvidence.length > 0) {
            const hasFailed = secEvidence.some(e => e.status === 'failed');
            const hasRunning = secEvidence.some(e => e.status === 'running');
            const allPassed = secEvidence.every(e => e.status === 'passed');
            status = hasFailed ? 'failed' : hasRunning ? 'running' : allPassed ? 'passed' : 'pending';
            duration = secEvidence.reduce((sum, e) => sum + (e.duration_ms || 0), 0);
            details = {
              checks: secEvidence.length,
              passed: secEvidence.filter(e => e.status === 'passed').length
            };
          }
          break;
        }
        case 'artifact': {
          const buildEvidence = evidence?.find(e => e.step_type === 'build');
          const signEvidence = evidence?.find(e => e.step_type === 'sign');
          if (buildEvidence || signEvidence) {
            const buildStatus = buildEvidence?.status as TimelineStage['status'] | undefined;
            status = signEvidence?.status === 'passed' 
              ? 'passed' 
              : buildStatus || 'pending';
            duration = (buildEvidence?.duration_ms || 0) + (signEvidence?.duration_ms || 0);
          }
          break;
        }
        case 'approval':
          if (approvals && approvals.length > 0) {
            const approved = approvals.some(a => a.status === 'approved');
            const rejected = approvals.some(a => a.status === 'rejected');
            const pending = approvals.some(a => a.status === 'pending');
            status = approved ? 'passed' : rejected ? 'failed' : pending ? 'running' : 'pending';
          }
          break;
        case 'cd':
          if (deployments && deployments.length > 0) {
            const isDeployed = deployments.some(d => d.status === 'success');
            const hasFailed = deployments.some(d => d.status === 'failed');
            const isDeploying = deployments.some(d => d.status === 'running');
            status = isDeployed ? 'passed' : hasFailed ? 'failed' : isDeploying ? 'running' : 'pending';
          }
          break;
        case 'runtime':
          if (execData?.status === 'success') {
            status = 'passed';
          } else if (execData?.status === 'failed') {
            status = 'failed';
          } else if (deployments && deployments.some(d => d.status === 'success')) {
            status = 'running';
          }
          break;
        case 'verified':
          status = execData?.status === 'success' ? 'passed' : 'pending';
          break;
      }

      return {
        id: config.id,
        name: config.name,
        icon: config.icon,
        status,
        duration,
        timestamp,
        details
      };
    });

    setStages(mappedStages);
    setLoading(false);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const currentStageIndex = stages.findIndex(s => s.status === 'running');
  const progress = execution?.progress || 
    Math.round((stages.filter(s => s.status === 'passed').length / stages.length) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{execution?.name || 'Pipeline'}</CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Badge variant="outline">{execution?.environment}</Badge>
              {execution?.branch && (
                <span className="flex items-center gap-1">
                  <GitCommit className="h-3 w-3" />
                  {execution.branch}
                </span>
              )}
              {execution?.commit_hash && (
                <code className="text-xs">{execution.commit_hash.slice(0, 7)}</code>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{progress}%</span>
            <Badge 
              variant={
                execution?.status === 'succeeded' ? 'default' :
                execution?.status === 'failed' ? 'destructive' :
                'secondary'
              }
              className={execution?.status === 'succeeded' ? 'bg-green-500' : ''}
            >
              {execution?.status?.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Horizontal Timeline */}
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-8 right-8 h-0.5 bg-muted">
            <div 
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Stages */}
          <div className="relative flex justify-between">
            <TooltipProvider>
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex flex-col items-center z-10">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-12 w-12 rounded-full border-2 bg-background transition-all',
                          statusColors[stage.status],
                          stage.status === 'running' && 'ring-2 ring-primary ring-offset-2',
                          onStageClick && 'cursor-pointer hover:scale-110'
                        )}
                        onClick={() => onStageClick?.(stage.id)}
                      >
                        {stage.icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium">{stage.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {statusIcons[stage.status]}
                            <span className="ml-1">{stage.status}</span>
                          </Badge>
                        </div>
                        {stage.duration && (
                          <div className="text-xs text-muted-foreground">
                            Duration: {formatDuration(stage.duration)}
                          </div>
                        )}
                        {stage.details && (
                          <div className="text-xs text-muted-foreground">
                            {Object.entries(stage.details).map(([key, value]) => (
                              <div key={key}>
                                {key}: {String(value)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  <span className={cn(
                    'mt-2 text-xs font-medium',
                    stage.status === 'pending' && 'text-muted-foreground',
                    stage.status === 'running' && 'text-primary',
                    stage.status === 'passed' && 'text-green-500',
                    stage.status === 'failed' && 'text-destructive'
                  )}>
                    {stage.name}
                  </span>

                  {stage.duration && (
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(stage.duration)}
                    </span>
                  )}

                  {/* Connector arrow */}
                  {index < stages.length - 1 && (
                    <ChevronRight 
                      className={cn(
                        'absolute h-4 w-4 top-4',
                        stages[index + 1].status === 'pending' 
                          ? 'text-muted-foreground' 
                          : 'text-green-500'
                      )}
                      style={{ 
                        left: `calc(${((index + 0.5) / (stages.length - 1)) * 100}% + 16px)` 
                      }}
                    />
                  )}
                </div>
              ))}
            </TooltipProvider>
          </div>
        </div>

        {/* Current Stage Details */}
        {currentStageIndex >= 0 && (
          <div className="mt-6 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="font-medium">
                  Currently running: {stages[currentStageIndex].name}
                </span>
              </div>
              {onStageClick && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onStageClick(stages[currentStageIndex].id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
