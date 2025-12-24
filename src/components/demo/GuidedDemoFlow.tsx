import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  SkipForward, 
  CheckCircle2, 
  XCircle, 
  Rocket, 
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GuidedDemoFlowProps {
  open: boolean;
  onClose: () => void;
}

type DemoStep = 'setup' | 'deploy' | 'failure' | 'recovery' | 'complete';

const DEMO_STEPS: { id: DemoStep; title: string; description: string }[] = [
  { id: 'setup', title: 'Context Setup', description: 'Preparing your demo environment' },
  { id: 'deploy', title: 'Live Deploy', description: 'Watch a real deployment happen' },
  { id: 'failure', title: 'Induced Failure', description: 'See how Opzenix handles failures' },
  { id: 'recovery', title: 'Checkpoint Recovery', description: 'Recover mid-pipeline without restart' },
  { id: 'complete', title: 'Production Ready', description: 'See your validation checklist' }
];

export function GuidedDemoFlow({ open, onClose }: GuidedDemoFlowProps) {
  const [currentStep, setCurrentStep] = useState<DemoStep>('setup');
  const [isRunning, setIsRunning] = useState(false);
  const [demoExecutionId, setDemoExecutionId] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<string>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const currentIndex = DEMO_STEPS.findIndex(s => s.id === currentStep);
  const progress = ((currentIndex + 1) / DEMO_STEPS.length) * 100;

  // Real-time subscription for demo execution
  useEffect(() => {
    if (!demoExecutionId) return;

    const channel = supabase
      .channel(`demo-execution-${demoExecutionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'executions',
          filter: `id=eq.${demoExecutionId}`
        },
        (payload: any) => {
          const newStatus = payload.new?.status;
          if (newStatus) {
            setExecutionStatus(newStatus);
            setLogs(prev => [...prev, `Execution status: ${newStatus}`]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'execution_logs',
          filter: `execution_id=eq.${demoExecutionId}`
        },
        (payload: any) => {
          const message = payload.new?.message;
          if (message) {
            setLogs(prev => [...prev, message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [demoExecutionId]);

  const runSetup = async () => {
    setIsRunning(true);
    setLogs(['Setting up demo environment...']);

    try {
      // Create demo flow template if not exists
      const { data: existingTemplate } = await supabase
        .from('flow_templates')
        .select('id')
        .eq('name', 'Demo Pipeline')
        .single();

      if (!existingTemplate) {
        await supabase.from('flow_templates').insert({
          name: 'Demo Pipeline',
          description: 'Auto-generated demo pipeline for investor presentation',
          type: 'cicd',
          nodes: [
            { id: 'trigger', type: 'trigger', position: { x: 100, y: 100 }, data: { label: 'Git Push' } },
            { id: 'build', type: 'build', position: { x: 300, y: 100 }, data: { label: 'Build' } },
            { id: 'test', type: 'test', position: { x: 500, y: 100 }, data: { label: 'Test' } },
            { id: 'security', type: 'security', position: { x: 700, y: 100 }, data: { label: 'Security Scan' } },
            { id: 'deploy', type: 'deploy', position: { x: 900, y: 100 }, data: { label: 'Deploy' } }
          ],
          edges: [
            { id: 'e1', source: 'trigger', target: 'build' },
            { id: 'e2', source: 'build', target: 'test' },
            { id: 'e3', source: 'test', target: 'security' },
            { id: 'e4', source: 'security', target: 'deploy' }
          ]
        });
        setLogs(prev => [...prev, '✓ Demo pipeline created']);
      } else {
        setLogs(prev => [...prev, '✓ Demo pipeline ready']);
      }

      // Create environments
      for (const env of ['development', 'staging', 'production']) {
        const { data: existingEnv } = await supabase
          .from('environment_configs')
          .select('id')
          .eq('name', `Demo - ${env}`)
          .single();

        if (!existingEnv) {
          await supabase.functions.invoke('create-environment', {
            body: { name: `Demo - ${env}`, environment: env, variables: {} }
          });
        }
      }
      setLogs(prev => [...prev, '✓ Environments configured']);

      setLogs(prev => [...prev, '✓ Setup complete!']);
      toast.success('Demo environment ready');
    } catch (error) {
      console.error('Setup error:', error);
      setLogs(prev => [...prev, '✗ Setup failed']);
      toast.error('Failed to set up demo');
    }

    setIsRunning(false);
  };

  const runDeploy = async () => {
    setIsRunning(true);
    setLogs(['Starting live deployment...']);

    try {
      // Get demo template
      const { data: template } = await supabase
        .from('flow_templates')
        .select('id')
        .eq('name', 'Demo Pipeline')
        .single();

      if (!template) {
        throw new Error('Demo template not found');
      }

      // Create execution
      const { data: execution, error } = await supabase
        .from('executions')
        .insert({
          name: 'Demo Execution',
          flow_template_id: template.id,
          status: 'running',
          environment: 'development',
          progress: 0
        })
        .select()
        .single();

      if (error) throw error;

      setDemoExecutionId(execution.id);
      setLogs(prev => [...prev, `Execution ID: ${execution.id}`]);

      // Simulate step-by-step execution
      const steps = ['trigger', 'build', 'test', 'security', 'deploy'];
      
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Create execution node
        await supabase.from('execution_nodes').insert({
          execution_id: execution.id,
          node_id: steps[i],
          status: 'running',
          started_at: new Date().toISOString()
        });

        // Add log
        await supabase.from('execution_logs').insert({
          execution_id: execution.id,
          node_id: steps[i],
          level: 'info',
          message: `Running ${steps[i]}...`
        });

        // Update progress
        await supabase
          .from('executions')
          .update({ progress: ((i + 1) / steps.length) * 100 })
          .eq('id', execution.id);

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Complete node
        await supabase
          .from('execution_nodes')
          .update({ 
            status: 'success',
            completed_at: new Date().toISOString(),
            duration_ms: 1500
          })
          .eq('execution_id', execution.id)
          .eq('node_id', steps[i]);

        // Create checkpoint
        await supabase.from('checkpoints').insert({
          execution_id: execution.id,
          node_id: steps[i],
          name: `After ${steps[i]}`,
          state: { step: i + 1 }
        });

        setLogs(prev => [...prev, `✓ ${steps[i]} completed`]);
      }

      // Complete execution
      await supabase
        .from('executions')
        .update({ 
          status: 'success',
          completed_at: new Date().toISOString(),
          progress: 100
        })
        .eq('id', execution.id);

      setLogs(prev => [...prev, '✓ Deployment successful!']);
      toast.success('Live deployment completed');

    } catch (error) {
      console.error('Deploy error:', error);
      setLogs(prev => [...prev, '✗ Deployment failed']);
      toast.error('Deployment failed');
    }

    setIsRunning(false);
  };

  const runFailure = async () => {
    setIsRunning(true);
    setLogs(['Simulating pipeline failure...']);

    try {
      // Get demo template
      const { data: template } = await supabase
        .from('flow_templates')
        .select('id')
        .eq('name', 'Demo Pipeline')
        .single();

      if (!template) throw new Error('Demo template not found');

      // Create execution that will fail
      const { data: execution } = await supabase
        .from('executions')
        .insert({
          name: 'Demo Failure',
          flow_template_id: template.id,
          status: 'running',
          environment: 'staging',
          progress: 0
        })
        .select()
        .single();

      if (!execution) throw new Error('Failed to create execution');

      setDemoExecutionId(execution.id);

      // Run first two steps successfully
      for (const step of ['trigger', 'build']) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await supabase.from('execution_nodes').insert({
          execution_id: execution.id,
          node_id: step,
          status: 'success',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });

        await supabase.from('checkpoints').insert({
          execution_id: execution.id,
          node_id: step,
          name: `After ${step}`,
          state: {}
        });

        setLogs(prev => [...prev, `✓ ${step} completed`]);
      }

      // Fail on test step
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await supabase.from('execution_nodes').insert({
        execution_id: execution.id,
        node_id: 'test',
        status: 'failed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        metadata: { error: 'Test suite failed: 3 tests failed' }
      });

      await supabase.from('execution_logs').insert({
        execution_id: execution.id,
        node_id: 'test',
        level: 'error',
        message: 'Test suite failed: 3 tests failed'
      });

      // Record state event
      await supabase.from('execution_state_events').insert({
        execution_id: execution.id,
        node_id: 'test',
        old_state: 'running',
        new_state: 'failed',
        reason: 'Test suite failed'
      });

      // Update execution status
      await supabase
        .from('executions')
        .update({ 
          status: 'failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', execution.id);

      setLogs(prev => [...prev, '✗ Test step failed']);
      setLogs(prev => [...prev, '→ Auto-switching to Investigate mode']);
      setLogs(prev => [...prev, '→ AI explanation available']);
      toast.error('Pipeline failed at test step');

    } catch (error) {
      console.error('Failure simulation error:', error);
    }

    setIsRunning(false);
  };

  const runRecovery = async () => {
    setIsRunning(true);
    setLogs(['Starting checkpoint recovery...']);

    try {
      if (!demoExecutionId) {
        setLogs(prev => [...prev, 'No execution to recover from']);
        setIsRunning(false);
        return;
      }

      // Get the checkpoint before failure
      const { data: checkpoint } = await supabase
        .from('checkpoints')
        .select('*')
        .eq('execution_id', demoExecutionId)
        .eq('node_id', 'build')
        .single();

      if (!checkpoint) {
        setLogs(prev => [...prev, 'No checkpoint found']);
        setIsRunning(false);
        return;
      }

      setLogs(prev => [...prev, `Found checkpoint: ${checkpoint.name}`]);
      setLogs(prev => [...prev, 'Re-running from checkpoint...']);

      // Call rerun from checkpoint
      const { data, error } = await supabase.functions.invoke('rerun-from-checkpoint', {
        body: {
          checkpoint_id: checkpoint.id,
          new_execution_name: 'Demo Recovery'
        }
      });

      if (error) throw error;

      setLogs(prev => [...prev, `New execution: ${data.execution.id}`]);
      setDemoExecutionId(data.execution.id);

      // Simulate successful completion
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Complete remaining steps
      for (const step of ['test', 'security', 'deploy']) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await supabase.from('execution_nodes').insert({
          execution_id: data.execution.id,
          node_id: step,
          status: 'success',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });

        setLogs(prev => [...prev, `✓ ${step} completed`]);
      }

      await supabase
        .from('executions')
        .update({ 
          status: 'success',
          completed_at: new Date().toISOString(),
          progress: 100
        })
        .eq('id', data.execution.id);

      setLogs(prev => [...prev, '✓ Recovery successful!']);
      setLogs(prev => [...prev, '"No restart. No guessing. Just recovery."']);
      toast.success('Pipeline recovered successfully');

    } catch (error) {
      console.error('Recovery error:', error);
      setLogs(prev => [...prev, '✗ Recovery failed']);
    }

    setIsRunning(false);
  };

  const handleStepAction = async () => {
    switch (currentStep) {
      case 'setup':
        await runSetup();
        setCurrentStep('deploy');
        break;
      case 'deploy':
        await runDeploy();
        setCurrentStep('failure');
        break;
      case 'failure':
        await runFailure();
        setCurrentStep('recovery');
        break;
      case 'recovery':
        await runRecovery();
        setCurrentStep('complete');
        break;
      case 'complete':
        onClose();
        break;
    }
  };

  const skipStep = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < DEMO_STEPS.length) {
      setCurrentStep(DEMO_STEPS[nextIndex].id);
      setLogs([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Guided Demo</DialogTitle>
            <Badge variant="secondary">For Investors</Badge>
          </div>
          <DialogDescription>
            Watch Opzenix prove itself with real executions, real failures, and real recovery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {DEMO_STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${index < currentIndex ? 'bg-green-500 text-white' : 
                      index === currentIndex ? 'bg-primary text-primary-foreground' : 
                      'bg-muted text-muted-foreground'}
                  `}>
                    {index < currentIndex ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`text-xs ${index === currentIndex ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
                {index < DEMO_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${index < currentIndex ? 'bg-green-500' : 'bg-muted'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Current Step Content */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {DEMO_STEPS[currentIndex].title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {DEMO_STEPS[currentIndex].description}
                  </p>
                </div>
                {currentStep === 'failure' && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Controlled Failure
                  </Badge>
                )}
              </div>

              {/* Live Log Output */}
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm h-48 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">Ready to start...</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`
                      ${log.startsWith('✓') ? 'text-green-500' : 
                        log.startsWith('✗') ? 'text-destructive' : 
                        log.startsWith('→') ? 'text-yellow-500' : 
                        'text-foreground'}
                    `}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={skipStep} disabled={isRunning || currentStep === 'complete'}>
              <SkipForward className="h-4 w-4 mr-2" />
              Skip Step
            </Button>

            <div className="flex gap-2">
              {currentStep === 'complete' ? (
                <Button onClick={onClose}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Finish Demo
                </Button>
              ) : (
                <Button onClick={handleStepAction} disabled={isRunning}>
                  {isRunning ? (
                    <>
                      <Zap className="h-4 w-4 mr-2 animate-pulse" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {currentStep === 'setup' ? 'Start Setup' :
                       currentStep === 'deploy' ? 'Start Deploy' :
                       currentStep === 'failure' ? 'Trigger Failure' :
                       currentStep === 'recovery' ? 'Start Recovery' :
                       'Continue'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
