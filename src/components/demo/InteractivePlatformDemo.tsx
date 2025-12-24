import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Play, Pause, SkipForward, RotateCcw, CheckCircle2, XCircle,
  Github, GitBranch, GitCommit, Settings, Terminal, Activity,
  Shield, Lock, Eye, Users, Workflow, Zap, Database,
  AlertTriangle, ChevronRight, ArrowRight, Sparkles, Brain,
  RefreshCw, Clock, FileCode, Server, Cloud, Monitor,
  BarChart3, Search, Layers, History, Target
} from 'lucide-react';

interface InteractivePlatformDemoProps {
  open: boolean;
  onClose: () => void;
}

type DemoPhase = 'intro' | 'github' | 'pipeline' | 'execution' | 'logs' | 'failure' | 'rollback' | 'ai' | 'complete';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  node?: string;
}

interface PipelineNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'idle' | 'running' | 'success' | 'failed' | 'pending';
}

const DEMO_PHASES: { id: DemoPhase; title: string; description: string; duration: number }[] = [
  { id: 'intro', title: 'Welcome to Opzenix', description: 'Enterprise CI/CD Control Plane', duration: 3000 },
  { id: 'github', title: 'Connect GitHub', description: 'Seamless repository integration', duration: 5000 },
  { id: 'pipeline', title: 'Visual Pipeline Builder', description: 'Drag-and-drop flow creation', duration: 5000 },
  { id: 'execution', title: 'Live Execution', description: 'Watch your pipeline run in real-time', duration: 8000 },
  { id: 'logs', title: 'Real-time Logs & Telemetry', description: 'OpenTelemetry-native observability', duration: 4000 },
  { id: 'failure', title: 'Failure Detection', description: 'Intelligent failure handling', duration: 4000 },
  { id: 'rollback', title: 'Checkpoint Recovery', description: 'Resume from any checkpoint', duration: 5000 },
  { id: 'ai', title: 'AI-Powered Insights', description: 'Opzenix AI explains and suggests fixes', duration: 5000 },
  { id: 'complete', title: 'Production Ready', description: 'Enterprise-grade governance', duration: 3000 },
];

export function InteractivePlatformDemo({ open, onClose }: InteractivePlatformDemoProps) {
  const [currentPhase, setCurrentPhase] = useState<DemoPhase>('intro');
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pipelineNodes, setPipelineNodes] = useState<PipelineNode[]>([
    { id: 'trigger', label: 'Git Push', icon: <GitCommit className="w-4 h-4" />, status: 'idle' },
    { id: 'build', label: 'Build', icon: <Settings className="w-4 h-4" />, status: 'idle' },
    { id: 'test', label: 'Test', icon: <Target className="w-4 h-4" />, status: 'idle' },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" />, status: 'idle' },
    { id: 'deploy', label: 'Deploy', icon: <Cloud className="w-4 h-4" />, status: 'idle' },
  ]);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(-1);

  const currentPhaseIndex = DEMO_PHASES.findIndex(p => p.id === currentPhase);
  const overallProgress = ((currentPhaseIndex + 1) / DEMO_PHASES.length) * 100;

  const addLog = useCallback((level: LogEntry['level'], message: string, node?: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-15), { timestamp, level, message, node }]);
  }, []);

  const resetPipeline = useCallback(() => {
    setPipelineNodes(nodes => nodes.map(n => ({ ...n, status: 'idle' })));
    setCurrentNodeIndex(-1);
    setLogs([]);
  }, []);

  // Auto-advance phases
  useEffect(() => {
    if (!open || !isPlaying) return;

    const phase = DEMO_PHASES.find(p => p.id === currentPhase);
    if (!phase) return;

    // Phase-specific animations
    if (currentPhase === 'github') {
      setTimeout(() => addLog('info', 'Connecting to GitHub...'), 500);
      setTimeout(() => addLog('info', 'Authenticating via OAuth2...'), 1200);
      setTimeout(() => addLog('success', 'GitHub App installed successfully'), 2000);
      setTimeout(() => addLog('info', 'Scanning repositories...'), 2800);
      setTimeout(() => addLog('success', 'Found 12 repositories'), 3500);
      setTimeout(() => addLog('info', 'Selected: acme-corp/payment-service'), 4200);
    }

    if (currentPhase === 'pipeline') {
      setTimeout(() => addLog('info', 'Loading pipeline template...'), 500);
      setTimeout(() => addLog('success', 'Template: Enterprise CI/CD'), 1200);
      setTimeout(() => addLog('info', 'Adding governance gates...'), 2000);
      setTimeout(() => addLog('success', 'Approval workflow configured'), 2800);
      setTimeout(() => addLog('info', 'Environment locks enabled'), 3500);
    }

    if (currentPhase === 'execution') {
      resetPipeline();
      const runPipeline = async () => {
        for (let i = 0; i < pipelineNodes.length; i++) {
          await new Promise(r => setTimeout(r, 1200));
          setCurrentNodeIndex(i);
          setPipelineNodes(nodes => 
            nodes.map((n, idx) => ({
              ...n,
              status: idx < i ? 'success' : idx === i ? 'running' : 'pending'
            }))
          );
          addLog('info', `Running ${pipelineNodes[i].label}...`, pipelineNodes[i].id);
          
          await new Promise(r => setTimeout(r, 800));
          
          if (i < 2) {
            setPipelineNodes(nodes =>
              nodes.map((n, idx) => ({
                ...n,
                status: idx <= i ? 'success' : idx === i + 1 ? 'running' : 'pending'
              }))
            );
            addLog('success', `${pipelineNodes[i].label} completed`, pipelineNodes[i].id);
          }
        }
      };
      runPipeline();
    }

    if (currentPhase === 'logs') {
      setTimeout(() => addLog('info', 'Streaming OpenTelemetry traces...'), 500);
      setTimeout(() => addLog('info', 'Trace ID: abc123-def456'), 1000);
      setTimeout(() => addLog('info', 'Span: build → Duration: 45.2s'), 1500);
      setTimeout(() => addLog('success', 'Metrics exported to Prometheus'), 2500);
    }

    if (currentPhase === 'failure') {
      setPipelineNodes(nodes =>
        nodes.map((n, idx) => ({
          ...n,
          status: idx < 2 ? 'success' : idx === 2 ? 'failed' : 'idle'
        }))
      );
      setCurrentNodeIndex(2);
      setTimeout(() => addLog('error', 'Test suite failed: 3 tests failed', 'test'), 500);
      setTimeout(() => addLog('warning', 'Pipeline paused at Test stage'), 1200);
      setTimeout(() => addLog('info', 'Checkpoint created: post-build'), 2000);
      setTimeout(() => addLog('info', 'AI analysis triggered...'), 2800);
    }

    if (currentPhase === 'rollback') {
      setTimeout(() => addLog('info', 'Loading available checkpoints...'), 500);
      setTimeout(() => addLog('success', 'Checkpoint found: post-build'), 1200);
      setTimeout(() => addLog('info', 'Restoring pipeline state...'), 2000);
      setTimeout(() => {
        setPipelineNodes(nodes =>
          nodes.map((n, idx) => ({
            ...n,
            status: idx < 2 ? 'success' : 'running'
          }))
        );
        addLog('success', 'Resumed from checkpoint');
      }, 2800);
      setTimeout(() => addLog('info', 'Continuing execution...'), 3500);
      setTimeout(() => {
        setPipelineNodes(nodes => nodes.map(n => ({ ...n, status: 'success' })));
        addLog('success', 'Pipeline completed successfully!');
      }, 4500);
    }

    if (currentPhase === 'ai') {
      setTimeout(() => addLog('info', 'Opzenix AI analyzing failure...'), 500);
      setTimeout(() => addLog('info', 'Pattern match: API rate limit exceeded'), 1200);
      setTimeout(() => addLog('success', 'Root cause identified'), 2000);
      setTimeout(() => addLog('info', 'Suggested fix: Add retry logic with backoff'), 2800);
      setTimeout(() => addLog('success', 'Auto-remediation available'), 3800);
    }

    const timer = setTimeout(() => {
      const nextIndex = currentPhaseIndex + 1;
      if (nextIndex < DEMO_PHASES.length) {
        setCurrentPhase(DEMO_PHASES[nextIndex].id);
      } else {
        setIsPlaying(false);
      }
    }, phase.duration);

    return () => clearTimeout(timer);
  }, [currentPhase, isPlaying, open, addLog, resetPipeline, pipelineNodes, currentPhaseIndex]);

  // Progress bar animation
  useEffect(() => {
    if (!isPlaying) return;
    
    const phase = DEMO_PHASES.find(p => p.id === currentPhase);
    if (!phase) return;

    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 2, 100));
    }, phase.duration / 50);

    return () => clearInterval(interval);
  }, [currentPhase, isPlaying]);

  const goToPhase = (phase: DemoPhase) => {
    setCurrentPhase(phase);
    setLogs([]);
    setIsPlaying(true);
  };

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return <CheckCircle2 className="w-3 h-3 text-sec-safe" />;
      case 'error': return <XCircle className="w-3 h-3 text-sec-critical" />;
      case 'warning': return <AlertTriangle className="w-3 h-3 text-sec-warning" />;
      default: return <Activity className="w-3 h-3 text-primary" />;
    }
  };

  const getNodeStatusColor = (status: PipelineNode['status']) => {
    switch (status) {
      case 'success': return 'bg-sec-safe text-sec-safe-foreground border-sec-safe';
      case 'failed': return 'bg-sec-critical text-sec-critical-foreground border-sec-critical';
      case 'running': return 'bg-primary text-primary-foreground border-primary animate-pulse';
      case 'pending': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-primary/5 via-transparent to-chart-1/5">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="p-2 bg-primary/10 rounded-lg"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-6 w-6 text-primary" />
                </motion.div>
                <div>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    Interactive Platform Demo
                    <Badge variant="secondary" className="ml-2">Live Preview</Badge>
                  </DialogTitle>
                  <DialogDescription>
                    Experience Opzenix enterprise capabilities step by step
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPhase('intro')}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Phase Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>{DEMO_PHASES[currentPhaseIndex]?.title}</span>
              <span>Step {currentPhaseIndex + 1} of {DEMO_PHASES.length}</span>
            </div>
            <Progress value={overallProgress} className="h-1.5" />
            <div className="flex gap-1 mt-2">
              {DEMO_PHASES.map((phase, index) => (
                <button
                  key={phase.id}
                  onClick={() => goToPhase(phase.id)}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    index <= currentPhaseIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-[500px]">
            {/* Left Panel - Demo Visualization */}
            <div className="lg:col-span-2 border-r">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {/* Intro Phase */}
                    {currentPhase === 'intro' && (
                      <motion.div
                        key="intro"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center justify-center h-80"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-24 h-24 bg-gradient-to-br from-primary to-chart-1 rounded-2xl flex items-center justify-center mb-6"
                        >
                          <Workflow className="w-12 h-12 text-primary-foreground" />
                        </motion.div>
                        <h2 className="text-3xl font-bold mb-2">Welcome to Opzenix</h2>
                        <p className="text-muted-foreground text-lg">Enterprise CI/CD Control Plane</p>
                        <div className="flex gap-4 mt-6">
                          {['Governance', 'Observability', 'Recovery'].map((tag, i) => (
                            <Badge key={tag} variant="outline" className="text-sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* GitHub Connection Phase */}
                    {currentPhase === 'github' && (
                      <motion.div
                        key="github"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border">
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Github className="w-12 h-12" />
                          </motion.div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">GitHub Integration</h3>
                            <p className="text-sm text-muted-foreground">Install Opzenix GitHub App</p>
                          </div>
                          <Badge className="bg-sec-safe text-sec-safe-foreground">Connected</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {['Webhooks', 'Branch Rules', 'PR Checks', 'Deployments'].map((feature, i) => (
                            <motion.div
                              key={feature}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.2 }}
                              className="p-3 bg-muted/20 rounded-lg border flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                              <span className="text-sm">{feature}</span>
                            </motion.div>
                          ))}
                        </div>

                        <Card className="bg-card/50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <GitBranch className="w-5 h-5 text-primary" />
                              <span className="font-medium">Repository Selected</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                              <FileCode className="w-4 h-4" />
                              <span className="text-sm font-mono">acme-corp/payment-service</span>
                              <Badge variant="outline" className="ml-auto text-xs">main</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Pipeline Builder Phase */}
                    {currentPhase === 'pipeline' && (
                      <motion.div
                        key="pipeline"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                      >
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Layers className="w-5 h-5 text-primary" />
                          Visual Pipeline Builder
                        </h3>
                        
                        <div className="relative p-6 bg-muted/20 rounded-xl border">
                          <div className="flex items-center justify-between gap-2">
                            {pipelineNodes.map((node, i) => (
                              <React.Fragment key={node.id}>
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: i * 0.15 }}
                                  className="flex flex-col items-center"
                                >
                                  <div className="w-14 h-14 rounded-xl bg-muted border-2 flex items-center justify-center">
                                    {node.icon}
                                  </div>
                                  <span className="text-xs mt-2 text-muted-foreground">{node.label}</span>
                                </motion.div>
                                {i < pipelineNodes.length - 1 && (
                                  <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: i * 0.15 + 0.1 }}
                                    className="flex-1 h-0.5 bg-border"
                                  />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { icon: Shield, label: 'Approval Gates', desc: 'Required for prod' },
                            { icon: Lock, label: 'Env Locks', desc: 'Freeze deployments' },
                            { icon: Users, label: 'RBAC', desc: 'Role-based access' },
                          ].map((item, i) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 + 0.5 }}
                              className="p-3 bg-muted/30 rounded-lg border"
                            >
                              <item.icon className="w-5 h-5 text-primary mb-2" />
                              <div className="text-sm font-medium">{item.label}</div>
                              <div className="text-xs text-muted-foreground">{item.desc}</div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Execution Phase */}
                    {(currentPhase === 'execution' || currentPhase === 'failure' || currentPhase === 'rollback') && (
                      <motion.div
                        key="execution"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Pipeline Execution
                          </h3>
                          <Badge variant="outline" className="animate-pulse">
                            {currentPhase === 'failure' ? 'Failed' : currentPhase === 'rollback' ? 'Recovering' : 'Running'}
                          </Badge>
                        </div>

                        <div className="relative p-6 bg-muted/20 rounded-xl border">
                          <div className="flex items-center justify-between gap-2">
                            {pipelineNodes.map((node, i) => (
                              <React.Fragment key={node.id}>
                                <motion.div
                                  animate={node.status === 'running' ? { scale: [1, 1.05, 1] } : {}}
                                  transition={{ duration: 0.5, repeat: node.status === 'running' ? Infinity : 0 }}
                                  className="flex flex-col items-center"
                                >
                                  <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-colors ${getNodeStatusColor(node.status)}`}>
                                    {node.status === 'running' ? (
                                      <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      >
                                        <RefreshCw className="w-4 h-4" />
                                      </motion.div>
                                    ) : node.status === 'success' ? (
                                      <CheckCircle2 className="w-4 h-4" />
                                    ) : node.status === 'failed' ? (
                                      <XCircle className="w-4 h-4" />
                                    ) : (
                                      node.icon
                                    )}
                                  </div>
                                  <span className="text-xs mt-2 text-muted-foreground">{node.label}</span>
                                </motion.div>
                                {i < pipelineNodes.length - 1 && (
                                  <div className={`flex-1 h-0.5 transition-colors ${
                                    i < currentNodeIndex ? 'bg-sec-safe' : 
                                    i === currentNodeIndex && pipelineNodes[i + 1]?.status === 'failed' ? 'bg-sec-critical' :
                                    'bg-border'
                                  }`} />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        {currentPhase === 'failure' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-sec-critical/10 border border-sec-critical/30 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="w-5 h-5 text-sec-critical" />
                              <div>
                                <div className="font-medium text-sec-critical">Pipeline Failed</div>
                                <div className="text-sm text-muted-foreground">Checkpoint available for recovery</div>
                              </div>
                              <Button size="sm" variant="outline" className="ml-auto">
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Recover
                              </Button>
                            </div>
                          </motion.div>
                        )}

                        {currentPhase === 'rollback' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-sec-safe/10 border border-sec-safe/30 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <History className="w-5 h-5 text-sec-safe" />
                              <div>
                                <div className="font-medium text-sec-safe">Checkpoint Recovery</div>
                                <div className="text-sm text-muted-foreground">Resuming from post-build checkpoint</div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Logs Phase */}
                    {currentPhase === 'logs' && (
                      <motion.div
                        key="logs"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                      >
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Monitor className="w-5 h-5 text-primary" />
                          OpenTelemetry Observability
                        </h3>
                        
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Traces', value: '1,247', icon: Search },
                            { label: 'Metrics', value: '45.2s', icon: BarChart3 },
                            { label: 'Logs', value: '892', icon: Terminal },
                          ].map((item, i) => (
                            <Card key={item.label} className="bg-card/50">
                              <CardContent className="p-4 text-center">
                                <item.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                                <div className="text-2xl font-bold">{item.value}</div>
                                <div className="text-xs text-muted-foreground">{item.label}</div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        <Card className="bg-card/50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium">Trace Timeline</span>
                              <Badge variant="outline" className="text-xs">Real-time</Badge>
                            </div>
                            <div className="space-y-2">
                              {['trigger', 'build', 'test'].map((step, i) => (
                                <motion.div
                                  key={step}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(i + 1) * 30}%` }}
                                  transition={{ delay: i * 0.3, duration: 0.5 }}
                                  className="h-2 bg-gradient-to-r from-primary to-chart-1 rounded-full"
                                />
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* AI Phase */}
                    {currentPhase === 'ai' && (
                      <motion.div
                        key="ai"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                      >
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Brain className="w-5 h-5 text-primary" />
                          Opzenix AI Engine
                        </h3>

                        <Card className="bg-gradient-to-br from-primary/10 to-chart-1/10 border-primary/30">
                          <CardContent className="p-6">
                            <motion.div
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="flex items-start gap-4"
                            >
                              <div className="p-3 bg-primary/20 rounded-xl">
                                <Sparkles className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold mb-2">AI Analysis Complete</div>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                  <p>Root cause: External API rate limit exceeded during test execution.</p>
                                  <p className="text-foreground font-medium">Suggested fix: Implement exponential backoff retry logic.</p>
                                </div>
                                <div className="flex gap-2 mt-4">
                                  <Button size="sm">
                                    <Zap className="w-4 h-4 mr-2" />
                                    Apply Fix
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          </CardContent>
                        </Card>

                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Pattern Recognition', desc: 'Similar failures detected' },
                            { label: 'Auto-Remediation', desc: 'One-click fixes available' },
                          ].map((item, i) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + i * 0.2 }}
                              className="p-4 bg-muted/30 rounded-lg border"
                            >
                              <div className="font-medium mb-1">{item.label}</div>
                              <div className="text-sm text-muted-foreground">{item.desc}</div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Complete Phase */}
                    {currentPhase === 'complete' && (
                      <motion.div
                        key="complete"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center h-80 text-center"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.5 }}
                          className="w-20 h-20 bg-sec-safe rounded-full flex items-center justify-center mb-6"
                        >
                          <CheckCircle2 className="w-10 h-10 text-sec-safe-foreground" />
                        </motion.div>
                        <h2 className="text-2xl font-bold mb-2">Demo Complete!</h2>
                        <p className="text-muted-foreground mb-6">
                          You've experienced the power of Opzenix enterprise CI/CD governance.
                        </p>
                        <div className="flex gap-3">
                          <Button onClick={() => goToPhase('intro')}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Replay Demo
                          </Button>
                          <Button variant="outline" onClick={onClose}>
                            Start Building
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </div>

            {/* Right Panel - Live Logs */}
            <div className="flex flex-col bg-muted/20">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Live Activity
                  </span>
                  <div className="w-2 h-2 rounded-full bg-sec-safe animate-pulse" />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-1">
                  {logs.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-8">
                      Waiting for activity...
                    </div>
                  ) : (
                    logs.map((log, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-2 text-xs p-2 rounded bg-background/50"
                      >
                        {getLogIcon(log.level)}
                        <div className="flex-1 min-w-0">
                          <span className="text-muted-foreground">{log.timestamp}</span>
                          <span className="mx-1">·</span>
                          <span className={
                            log.level === 'error' ? 'text-sec-critical' :
                            log.level === 'success' ? 'text-sec-safe' :
                            log.level === 'warning' ? 'text-sec-warning' :
                            'text-foreground'
                          }>
                            {log.message}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~45 seconds
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span>Press Space to pause</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const prevIndex = currentPhaseIndex - 1;
                if (prevIndex >= 0) goToPhase(DEMO_PHASES[prevIndex].id);
              }}
              disabled={currentPhaseIndex === 0}
            >
              Previous
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const nextIndex = currentPhaseIndex + 1;
                if (nextIndex < DEMO_PHASES.length) {
                  goToPhase(DEMO_PHASES[nextIndex].id);
                } else {
                  onClose();
                }
              }}
            >
              {currentPhaseIndex === DEMO_PHASES.length - 1 ? 'Close' : 'Next'}
              <SkipForward className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default InteractivePlatformDemo;
