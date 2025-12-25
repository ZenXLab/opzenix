import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play, Pause, SkipForward, RotateCcw, CheckCircle2, XCircle,
  Github, GitBranch, GitCommit, Settings, Terminal, Activity,
  Shield, Lock, Eye, Users, Workflow, Zap, Database,
  AlertTriangle, ChevronRight, ArrowRight, Sparkles, Brain,
  RefreshCw, Clock, FileCode, Server, Cloud, Monitor,
  BarChart3, Search, Layers, History, Target, TrendingUp,
  TrendingDown, Gauge, Globe, Bell, Package, CheckSquare
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { cn } from '@/lib/utils';

interface EnhancedPlatformDemoProps {
  open: boolean;
  onClose: () => void;
}

type DemoPhase =
  | 'intro'
  | 'dashboard'
  | 'github'
  | 'pipeline'
  | 'execution'
  | 'analytics'
  | 'failure'
  | 'rollback'
  | 'ai'
  | 'governance'
  | 'complete';

interface PipelineNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'idle' | 'running' | 'success' | 'failed' | 'pending';
  duration?: string;
}

const DEMO_PHASES: { id: DemoPhase; title: string; description: string; duration: number }[] = [
  { id: 'intro', title: 'Welcome to Opzenix', description: 'Enterprise CI/CD Control Plane', duration: 3000 },
  { id: 'github', title: 'Step 1: Connect GitHub', description: 'One-click repository integration', duration: 4000 },
  { id: 'pipeline', title: 'Step 2: Build Pipeline', description: 'Visual drag-and-drop flow creation', duration: 4000 },
  { id: 'execution', title: 'Step 3: Execute Pipeline', description: 'Watch your pipeline run in real-time', duration: 6500 },
  { id: 'analytics', title: 'Step 4: Monitor & Observe', description: 'Deep observability with OpenTelemetry', duration: 4000 },
  { id: 'failure', title: 'Step 5: Failure Detected', description: 'Intelligent failure handling', duration: 3000 },
  { id: 'rollback', title: 'Step 6: Recovery', description: 'Resume from checkpoint instantly', duration: 4000 },
  { id: 'ai', title: 'Step 7: AI Analysis', description: 'Opzenix AI explains root cause', duration: 4000 },
  { id: 'governance', title: 'Step 8: Governance', description: 'RBAC, Approvals & Audit Logs', duration: 4000 },
  { id: 'dashboard', title: 'Step 9: Control Tower', description: 'Real-time system overview & metrics', duration: 4000 },
  { id: 'complete', title: 'Production Ready', description: 'Enterprise-grade CI/CD governance', duration: 3000 },
];

const generateDeploymentData = () => Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  deployments: Math.floor(Math.random() * 50) + 20,
  success: Math.floor(Math.random() * 40) + 15,
  failed: Math.floor(Math.random() * 5) + 1
}));

const generateMetricsData = () => Array.from({ length: 12 }, (_, i) => ({
  time: `${i * 2}:00`,
  latency: Math.floor(Math.random() * 100) + 50,
  throughput: Math.floor(Math.random() * 200) + 100
}));

export function EnhancedPlatformDemo({ open, onClose }: EnhancedPlatformDemoProps) {
  const [currentPhase, setCurrentPhase] = useState<DemoPhase>('intro');
  const [isPlaying, setIsPlaying] = useState(true);
  const [deploymentData] = useState(generateDeploymentData);
  const [metricsData] = useState(generateMetricsData);
  const [pipelineNodes, setPipelineNodes] = useState<PipelineNode[]>([
    { id: 'trigger', label: 'Git Push', icon: <GitCommit className="w-4 h-4" />, status: 'idle', duration: '0s' },
    { id: 'build', label: 'Build', icon: <Settings className="w-4 h-4" />, status: 'idle', duration: '0s' },
    { id: 'test', label: 'Test', icon: <Target className="w-4 h-4" />, status: 'idle', duration: '0s' },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" />, status: 'idle', duration: '0s' },
    { id: 'staging', label: 'Staging', icon: <Server className="w-4 h-4" />, status: 'idle', duration: '0s' },
    { id: 'approval', label: 'Approval', icon: <CheckSquare className="w-4 h-4" />, status: 'idle', duration: '0s' },
    { id: 'deploy', label: 'Production', icon: <Cloud className="w-4 h-4" />, status: 'idle', duration: '0s' },
  ]);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(-1);
  const [animatedMetrics, setAnimatedMetrics] = useState({
    deployments: 0,
    successRate: 0,
    avgDuration: 0,
    activeUsers: 0
  });

  const currentPhaseIndex = DEMO_PHASES.findIndex(p => p.id === currentPhase);

  const resetPipeline = useCallback(() => {
    setPipelineNodes(nodes => nodes.map(n => ({ ...n, status: 'idle', duration: '0s' })));
    setCurrentNodeIndex(-1);
  }, []);

  // Animate metrics
  useEffect(() => {
    if (currentPhase === 'dashboard' || currentPhase === 'analytics') {
      const interval = setInterval(() => {
        setAnimatedMetrics(prev => ({
          deployments: Math.min(prev.deployments + 5, 1247),
          successRate: Math.min(prev.successRate + 2, 98.5),
          avgDuration: Math.min(prev.avgDuration + 1, 45),
          activeUsers: Math.min(prev.activeUsers + 1, 24)
        }));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [currentPhase]);

  // Auto-advance phases
  useEffect(() => {
    if (!open || !isPlaying) return;

    const phase = DEMO_PHASES.find(p => p.id === currentPhase);
    if (!phase) return;

    // Phase-specific animations
    if (currentPhase === 'pipeline') {
      resetPipeline();
      setTimeout(() => {
        setPipelineNodes(nodes => nodes.map(n => ({ ...n, status: 'idle' })));
      }, 500);
    }

    if (currentPhase === 'execution') {
      resetPipeline();

      const runPipeline = async () => {
        const durations = ['1.2s', '45s', '32s', '12s', '28s', '2s', '16s'];
        const runTimes = [700, 750, 750, 750, 750, 700, 750];

        for (let i = 0; i < 7; i++) {
          setCurrentNodeIndex(i);

          setPipelineNodes(nodes =>
            nodes.map((n, idx) => ({
              ...n,
              status: idx < i ? 'success' : idx === i ? 'running' : 'idle',
              duration: idx < i ? durations[idx] : idx === i ? '0s' : '0s'
            }))
          );

          await new Promise(r => setTimeout(r, runTimes[i]));

          setPipelineNodes(nodes =>
            nodes.map((n, idx) => ({
              ...n,
              status: idx <= i ? 'success' : 'idle',
              duration: idx <= i ? durations[idx] : '0s'
            }))
          );

          await new Promise(r => setTimeout(r, 100));
        }
      };

      runPipeline();
    }

    if (currentPhase === 'failure') {
      setPipelineNodes(nodes =>
        nodes.map((n, idx) => ({
          ...n,
          status: idx < 3 ? 'success' : idx === 3 ? 'failed' : 'idle'
        }))
      );
      setCurrentNodeIndex(3);
    }

    if (currentPhase === 'rollback') {
      setTimeout(() => {
        setPipelineNodes(nodes =>
          nodes.map((n, idx) => ({
            ...n,
            status: idx < 3 ? 'success' : idx === 3 ? 'running' : 'pending'
          }))
        );
      }, 1500);
      setTimeout(() => {
        setPipelineNodes(nodes => nodes.map((n, idx) => ({
          ...n,
          status: idx <= 5 ? 'success' : 'running'
        })));
      }, 3000);
    }

    if (currentPhase === 'governance') {
      setTimeout(() => {
        setPipelineNodes(nodes => nodes.map(n => ({ ...n, status: 'success' })));
      }, 2500);
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
  }, [currentPhase, isPlaying, open, resetPipeline, currentPhaseIndex]);

  const goToPhase = (phase: DemoPhase) => {
    setCurrentPhase(phase);
    setIsPlaying(true);
    setAnimatedMetrics({ deployments: 0, successRate: 0, avgDuration: 0, activeUsers: 0 });
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
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 via-transparent to-chart-1/5">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="p-2 bg-primary/10 rounded-lg"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                </motion.div>
                <div>
                  <DialogTitle className="text-lg flex items-center gap-2">
                    Opzenix Platform Demo
                    <Badge variant="secondary" className="ml-2 text-xs">Live Preview</Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {DEMO_PHASES[currentPhaseIndex]?.description}
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
                  onClick={() => {
                    const nextIndex = (currentPhaseIndex + 1) % DEMO_PHASES.length;
                    goToPhase(DEMO_PHASES[nextIndex].id);
                  }}
                >
                  <SkipForward className="w-4 h-4" />
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

          {/* Single Progress Line */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-medium">{DEMO_PHASES[currentPhaseIndex]?.title}</span>
              <span>Step {currentPhaseIndex + 1} of {DEMO_PHASES.length}</span>
            </div>
            <div className="flex gap-1">
              {DEMO_PHASES.map((phase, index) => (
                <button
                  key={phase.id}
                  onClick={() => goToPhase(phase.id)}
                  className={`flex-1 h-2 rounded-full transition-all duration-300 hover:scale-y-125 ${
                    index <= currentPhaseIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                  title={phase.title}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Full Width, No Logs */}
        <div className="flex-1 overflow-hidden">
          <div className="h-[550px]">
            <ScrollArea className="h-full">
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {/* Intro Phase */}
                  {currentPhase === 'intro' && (
                    <motion.div
                      key="intro"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center justify-center h-[480px]"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-28 h-28 bg-gradient-to-br from-primary to-chart-1 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/30"
                      >
                        <Workflow className="w-14 h-14 text-primary-foreground" />
                      </motion.div>
                      <h2 className="text-4xl font-bold mb-3">Welcome to Opzenix</h2>
                      <p className="text-muted-foreground text-lg mb-6">Enterprise CI/CD Control Plane</p>
                      <div className="flex flex-wrap justify-center gap-3">
                        {['Governance', 'Observability', 'AI Recovery', 'Real-time Logs', 'RBAC'].map((tag, i) => (
                          <motion.div
                            key={tag}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                          >
                            <Badge variant="outline" className="text-sm py-1 px-3">
                              {tag}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Dashboard Phase */}
                  {currentPhase === 'dashboard' && (
                    <motion.div
                      key="dashboard"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="flex flex-col items-center justify-center h-[480px]"
                    >
                      <Card className="max-w-4xl w-full shadow-2xl border-2">
                        <CardHeader className="text-center pb-4">
                          <motion.div
                            className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <BarChart3 className="w-12 h-12 text-primary" />
                          </motion.div>
                          <CardTitle className="text-2xl">Control Tower Dashboard</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="bg-background p-4 rounded-lg shadow-sm">
                              <h4 className="font-semibold mb-2">Deployments This Week</h4>
                              <ResponsiveContainer width="100%" height={150}>
                                <BarChart data={deploymentData}>
                                  <XAxis dataKey="day" />
                                  <YAxis />
                                  <Tooltip />
                                  <Bar dataKey="deployments" fill="#3b82f6" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="bg-background p-4 rounded-lg shadow-sm">
                              <h4 className="font-semibold mb-2">System Metrics</h4>
                              <ResponsiveContainer width="100%" height={150}>
                                <LineChart data={metricsData}>
                                  <XAxis dataKey="time" />
                                  <YAxis />
                                  <Tooltip />
                                  <Line type="monotone" dataKey="latency" stroke="#ef4444" />
                                  <Line type="monotone" dataKey="throughput" stroke="#10b981" />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* GitHub Integration Phase */}
                  {currentPhase === 'github' && (
                    <motion.div
                      key="github"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="flex items-center justify-center h-[480px]"
                    >
                      <Card className="border-2 border-primary/20 shadow-2xl max-w-2xl w-full">
                        <CardHeader className="text-center pb-4">
                          <motion.div 
                            className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Github className="w-12 h-12 text-primary" />
                          </motion.div>
                          <CardTitle className="text-2xl">GitHub Integration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl border-2 border-primary/20"
                          >
                            <div className="flex items-center gap-4 mb-6">
                              <div className="p-3 bg-background rounded-full shadow-lg">
                                <Github className="w-8 h-8" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-xl">acme-corp/payment-service</h4>
                                <p className="text-muted-foreground">Connected via GitHub App</p>
                              </div>
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5, type: "spring" }}
                              >
                                <CheckCircle2 className="w-10 h-10 text-sec-safe" />
                              </motion.div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              {[
                                { icon: GitBranch, value: '8', label: 'Branches', delay: 0.6 },
                                { icon: GitCommit, value: '247', label: 'Commits', delay: 0.7 },
                                { icon: Users, value: '12', label: 'Contributors', delay: 0.8 }
                              ].map(({ icon: Icon, value, label, delay }) => (
                                <motion.div
                                  key={label}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay }}
                                  className="p-4 bg-background rounded-lg shadow-sm text-center"
                                >
                                  <Icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                                  <div className="text-3xl font-bold">{value}</div>
                                  <div className="text-xs text-muted-foreground mt-1">{label}</div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="flex items-center gap-3 p-4 bg-sec-safe/10 rounded-lg border border-sec-safe/30"
                          >
                            <CheckCircle2 className="w-6 h-6 text-sec-safe flex-shrink-0" />
                            <div>
                              <div className="font-semibold text-sec-safe">GitHub App Installed</div>
                              <div className="text-sm text-muted-foreground">Webhook configured • Branch protection enabled</div>
                            </div>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Pipeline Building Phase */}
                  {currentPhase === 'pipeline' && (
                    <motion.div
                      key="pipeline"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="flex items-center justify-center h-[480px]"
                    >
                      <Card className="border-2 shadow-2xl max-w-4xl w-full">
                        <CardHeader className="text-center pb-4">
                          <motion.div 
                            className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            <Workflow className="w-12 h-12 text-primary" />
                          </motion.div>
                          <CardTitle className="text-2xl">Visual Pipeline Builder</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Pipeline Flow Visualization */}
                          <div className="relative p-6 bg-gradient-to-br from-muted/50 to-transparent rounded-xl border-2">
                            <div className="flex items-center justify-between gap-3">
                              {pipelineNodes.map((node, idx) => (
                                <React.Fragment key={node.id}>
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ 
                                      delay: idx * 0.15,
                                      type: "spring",
                                      stiffness: 200
                                    }}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 bg-background shadow-lg min-w-[80px] hover:scale-105 transition-transform"
                                  >
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                      {node.icon}
                                    </div>
                                    <span className="text-xs font-semibold text-center">{node.label}</span>
                                  </motion.div>
                                  {idx < pipelineNodes.length - 1 && (
                                    <motion.div
                                      initial={{ width: 0, opacity: 0 }}
                                      animate={{ width: "auto", opacity: 1 }}
                                      transition={{ delay: idx * 0.15 + 0.08, duration: 0.3 }}
                                      className="flex items-center"
                                    >
                                      <div className="h-0.5 w-4 bg-primary"></div>
                                      <ChevronRight className="w-4 h-4 text-primary" />
                                    </motion.div>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { icon: Shield, label: 'Security Scan', color: 'text-chart-3', delay: 1.2 },
                              { icon: Lock, label: 'Approval Gates', color: 'text-chart-2', delay: 1.3 },
                              { icon: Eye, label: 'Observability', color: 'text-chart-1', delay: 1.4 },
                              { icon: RefreshCw, label: 'Auto Rollback', color: 'text-chart-4', delay: 1.5 }
                            ].map((feature) => (
                              <motion.div
                                key={feature.label}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: feature.delay, type: "spring" }}
                                className="flex items-center gap-3 p-3 bg-background rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                              >
                                <div className={`p-2 rounded-lg bg-muted ${feature.color}`}>
                                  <feature.icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium flex-1">{feature.label}</span>
                                <CheckCircle2 className="w-5 h-5 text-sec-safe" />
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Execution Phase */}
                  {currentPhase === 'execution' && (
                    <motion.div
                      key="execution"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-center h-[480px]"
                    >
                      <Card className="border-2 shadow-2xl max-w-3xl w-full">
                        <CardHeader className="text-center pb-4">
                          <motion.div 
                            className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit"
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <Activity className="w-12 h-12 text-primary" />
                          </motion.div>
                          <CardTitle className="text-2xl flex items-center justify-center gap-2">
                            Live Execution Flow
                            <Badge variant="secondary" className="animate-pulse">Running</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {pipelineNodes.map((node, idx) => (
                              <motion.div
                                key={node.id}
                                initial={{ x: -30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ 
                                  delay: idx * 0.08,
                                  type: "spring",
                                  stiffness: 150
                                }}
                                className={cn(
                                  "flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300",
                                  getNodeStatusColor(node.status),
                                  node.status === 'running' && "shadow-lg scale-105"
                                )}
                              >
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  node.status === 'running' && "bg-primary/20",
                                  node.status === 'success' && "bg-sec-safe/20",
                                  node.status === 'idle' && "bg-muted"
                                )}>
                                  {node.icon}
                                </div>
                                <span className="font-semibold flex-1">{node.label}</span>
                                {node.status === 'running' && (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="flex items-center gap-2"
                                  >
                                    <Zap className="w-5 h-5" />
                                  </motion.div>
                                )}
                                {node.status === 'success' && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="text-sm font-mono">{node.duration}</span>
                                    <CheckCircle2 className="w-6 h-6" />
                                  </motion.div>
                                )}
                                {node.status === 'idle' && (
                                  <Clock className="w-5 h-5 text-muted-foreground opacity-40" />
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Analytics Phase */}
                  {currentPhase === 'analytics' && (
                    <motion.div
                      key="analytics"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="flex flex-col items-center justify-center h-[480px]"
                    >
                      <Card className="max-w-4xl w-full shadow-2xl border-2">
                        <CardHeader className="text-center pb-4">
                          <motion.div
                            className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Monitor className="w-12 h-12 text-primary" />
                          </motion.div>
                          <CardTitle className="text-2xl">Observability & Analytics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="bg-background p-4 rounded-lg shadow-sm">
                              <h4 className="font-semibold mb-2">Latency Over Time</h4>
                              <ResponsiveContainer width="100%" height={150}>
                                <LineChart data={metricsData}>
                                  <XAxis dataKey="time" />
                                  <YAxis />
                                  <Tooltip />
                                  <Line type="monotone" dataKey="latency" stroke="#ef4444" />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="bg-background p-4 rounded-lg shadow-sm">
                              <h4 className="font-semibold mb-2">Throughput Over Time</h4>
                              <ResponsiveContainer width="100%" height={150}>
                                <LineChart data={metricsData}>
                                  <XAxis dataKey="time" />
                                  <YAxis />
                                  <Tooltip />
                                  <Line type="monotone" dataKey="throughput" stroke="#10b981" />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Failure Phase */}
                  {currentPhase === 'failure' && (
                    <motion.div
                      key="failure"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="flex flex-col items-center justify-center h-[480px]"
                    >
                      <Card className="max-w-md w-full shadow-2xl border-2 border-sec-critical">
                        <CardHeader className="text-center pb-4">
                          <motion.div
                            className="mx-auto mb-4 p-4 bg-sec-critical/10 rounded-full w-fit"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <AlertTriangle className="w-12 h-12 text-sec-critical" />
                          </motion.div>
                          <CardTitle className="text-2xl text-sec-critical">Failure Detected</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-center text-sec-critical-foreground mb-4">
                            The pipeline failed at the Security step due to a vulnerability scan.
                          </p>
                          <div className="flex justify-center gap-4">
                            <Button variant="destructive" size="sm" className="flex items-center gap-2">
                              <XCircle className="w-4 h-4" /> View Details
                            </Button>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                              <RefreshCw className="w-4 h-4" /> Retry
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Rollback Phase */}
                  {currentPhase === 'rollback' && (
                    <motion.div
                      key="rollback"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="flex flex-col items-center justify-center h-[480px]"
                    >
                      <Card className="max-w-3xl w-full shadow-2xl border-2 border-chart-4">
                        <CardHeader className="text-center pb-4">
                          <motion.div
                            className="mx-auto mb-4 p-4 bg-chart-4/10 rounded-full w-fit"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <RefreshCw className="w-12 h-12 text-chart-4" />
                          </motion.div>
                          <CardTitle className="text-2xl text-chart-4">Rollback & Recovery</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-center text-muted-foreground mb-4">
                            Resuming pipeline from last successful checkpoint...
                          </p>
                          <div className="flex justify-center gap-4">
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                              <ArrowRight className="w-4 h-4" /> Continue
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* AI Analysis Phase */}
                  {currentPhase === 'ai' && (
                    <motion.div
                      key="ai"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="flex flex-col items-center justify-center h-[480px]"
                    >
                      <Card className="max-w-3xl w-full shadow-2xl border-2 border-primary">
                        <CardHeader className="text-center pb-4">
                          <motion.div
                            className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Brain className="w-12 h-12 text-primary" />
                          </motion.div>
                          <CardTitle className="text-2xl">AI Root Cause Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-center text-muted-foreground mb-4">
                            Opzenix AI has identified the root cause of the failure and suggests remediation steps.
                          </p>
                          <div className="bg-background p-4 rounded-lg shadow-sm">
                            <ul className="list-disc list-inside space-y-2 text-sm">
                              <li>Security scan failed due to outdated vulnerability database.</li>
                              <li>Update the vulnerability definitions and rerun the scan.</li>
                              <li>Consider adding additional approval gates for security steps.</li>
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Governance Phase */}
                  {currentPhase === 'governance' && (
                    <motion.div
                      key="governance"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="flex flex-col items-center justify-center h-[480px]"
                    >
                      <Card className="max-w-3xl w-full shadow-2xl border-2 border-chart-2">
                        <CardHeader className="text-center pb-4">
                          <motion.div
                            className="mx-auto mb-4 p-4 bg-chart-2/10 rounded-full w-fit"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Lock className="w-12 h-12 text-chart-2" />
                          </motion.div>
                          <CardTitle className="text-2xl text-chart-2">Governance & Compliance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-center text-muted-foreground mb-4">
                            Role-based access control, approvals, and audit logs ensure compliance.
                          </p>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-background p-4 rounded-lg shadow-sm text-center">
                              <Users className="mx-auto mb-2 w-6 h-6 text-chart-2" />
                              <div className="font-semibold">12 Users</div>
                              <div className="text-xs text-muted-foreground">Active</div>
                            </div>
                            <div className="bg-background p-4 rounded-lg shadow-sm text-center">
                              <CheckSquare className="mx-auto mb-2 w-6 h-6 text-chart-2" />
                              <div className="font-semibold">5 Approvals</div>
                              <div className="text-xs text-muted-foreground">Required</div>
                            </div>
                            <div className="bg-background p-4 rounded-lg shadow-sm text-center">
                              <History className="mx-auto mb-2 w-6 h-6 text-chart-2" />
                              <div className="font-semibold">Audit Logs</div>
                              <div className="text-xs text-muted-foreground">Enabled</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Complete Phase */}
                  {currentPhase === 'complete' && (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center justify-center h-[480px]"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-28 h-28 bg-gradient-to-br from-sec-safe to-sec-safe/70 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-sec-safe/50"
                      >
                        <CheckCircle2 className="w-14 h-14 text-sec-safe-foreground" />
                      </motion.div>
                      <h2 className="text-4xl font-bold mb-3 text-sec-safe-foreground">Production Ready</h2>
                      <p className="text-muted-foreground text-lg mb-6 text-center max-w-xl">
                        Your enterprise-grade CI/CD governance is now fully configured and operational.
                      </p>
                      <Button variant="outline" size="lg" onClick={() => goToPhase('intro')}>
                        Restart Demo
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EnhancedPlatformDemo;
