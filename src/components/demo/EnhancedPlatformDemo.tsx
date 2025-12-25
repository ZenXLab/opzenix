import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  duration?: string;
}

const DEMO_PHASES: { id: DemoPhase; title: string; description: string; duration: number }[] = [
  { id: 'intro', title: 'Welcome to Opzenix', description: 'Enterprise CI/CD Control Plane', duration: 3000 },
  { id: 'github', title: 'Step 1: Connect GitHub', description: 'One-click repository integration', duration: 5000 },
  { id: 'pipeline', title: 'Step 2: Build Pipeline', description: 'Visual drag-and-drop flow creation', duration: 5000 },
  { id: 'execution', title: 'Step 3: Execute Pipeline', description: 'Watch your pipeline run in real-time', duration: 8000 },
  { id: 'analytics', title: 'Step 4: Monitor & Observe', description: 'Deep observability with OpenTelemetry', duration: 5000 },
  { id: 'failure', title: 'Step 5: Failure Detected', description: 'Intelligent failure handling', duration: 4000 },
  { id: 'rollback', title: 'Step 6: Recovery', description: 'Resume from checkpoint instantly', duration: 5000 },
  { id: 'ai', title: 'Step 7: AI Analysis', description: 'Opzenix AI explains root cause', duration: 5000 },
  { id: 'governance', title: 'Step 8: Governance', description: 'RBAC, Approvals & Audit Logs', duration: 5000 },
  { id: 'dashboard', title: 'Step 9: Control Tower', description: 'Real-time system overview & metrics', duration: 6000 },
  { id: 'complete', title: 'Production Ready', description: 'Enterprise-grade CI/CD governance', duration: 3000 },
];

// Generate fake chart data
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
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
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
  const overallProgress = ((currentPhaseIndex + 1) / DEMO_PHASES.length) * 100;

  const addLog = useCallback((level: LogEntry['level'], message: string, node?: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-7), { timestamp, level, message, node }]); // Keep only last 8 logs
  }, []);

  const resetPipeline = useCallback(() => {
    setPipelineNodes(nodes => nodes.map(n => ({ ...n, status: 'idle', duration: '0s' })));
    setCurrentNodeIndex(-1);
    setLogs([]);
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
    if (currentPhase === 'dashboard') {
      setTimeout(() => addLog('success', 'Control Tower connected'), 500);
      setTimeout(() => addLog('info', '1,247 deployments loaded'), 1500);
      setTimeout(() => addLog('success', 'System health: 99.9% uptime'), 3000);
    }

    if (currentPhase === 'github') {
      setTimeout(() => addLog('info', 'Authenticating via GitHub App...'), 500);
      setTimeout(() => addLog('success', 'GitHub App installed'), 1500);
      setTimeout(() => addLog('success', 'Repository: acme-corp/payment-service'), 3000);
    }

    if (currentPhase === 'pipeline') {
      setTimeout(() => addLog('success', 'Template: Enterprise CI/CD'), 700);
      setTimeout(() => addLog('success', 'Approval gates configured'), 1800);
      setTimeout(() => addLog('success', 'Environment locks enabled'), 2800);
    }

    if (currentPhase === 'execution') {
      resetPipeline();
      
      const runPipeline = async () => {
        const durations = ['1.2s', '45s', '32s', '12s', '28s', '2s', '16s'];
        const runTimes = [600, 900, 900, 900, 900, 700, 900]; // Smooth fast execution
        
        // Run through all nodes
        for (let i = 0; i < 7; i++) {
          await new Promise(r => setTimeout(r, 150));
          setCurrentNodeIndex(i);
          
          // Set to running
          setPipelineNodes(nodes => 
            nodes.map((n, idx) => ({
              ...n,
              status: idx < i ? 'success' : idx === i ? 'running' : 'pending',
              duration: idx < i ? durations[idx] : '0s'
            }))
          );
          
          await new Promise(r => setTimeout(r, runTimes[i]));
          
          // Complete node
          setPipelineNodes(nodes =>
            nodes.map((n, idx) => ({
              ...n,
              status: idx <= i ? 'success' : 'pending',
              duration: idx <= i ? durations[idx] : '0s'
            }))
          );
        }
      };
      
      runPipeline();
    }

    if (currentPhase === 'analytics') {
      // Just visual metrics, no logs
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

    if (currentPhase === 'ai') {
      // Pure visual AI analysis - no logs
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
    setAnimatedMetrics({ deployments: 0, successRate: 0, avgDuration: 0, activeUsers: 0 });
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

          {/* Phase Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-medium">{DEMO_PHASES[currentPhaseIndex]?.title}</span>
              <span>Step {currentPhaseIndex + 1} of {DEMO_PHASES.length}</span>
            </div>
            <Progress value={overallProgress} className="h-1" />
            <div className="flex gap-0.5 mt-2">
              {DEMO_PHASES.map((phase, index) => (
                <button
                  key={phase.id}
                  onClick={() => goToPhase(phase.id)}
                  className={`flex-1 h-1.5 rounded-full transition-all hover:scale-y-150 ${
                    index <= currentPhaseIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                  title={phase.title}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className={cn(
            "grid gap-0 h-[550px]",
            ['execution', 'analytics', 'failure', 'rollback', 'ai', 'governance'].includes(currentPhase) 
              ? "grid-cols-1" 
              : "grid-cols-1 lg:grid-cols-4"
          )}>
            {/* Main Panel - Demo Visualization */}
            <div className={cn(
              "overflow-hidden",
              ['execution', 'analytics', 'failure', 'rollback', 'ai', 'governance'].includes(currentPhase)
                ? "" 
                : "lg:col-span-3 border-r"
            )}>
              <ScrollArea className="h-full">
                <div className="p-4">
                  <AnimatePresence mode="wait">
                    {/* Intro Phase */}
                    {currentPhase === 'intro' && (
                      <motion.div
                        key="intro"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
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
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-primary" />
                            Control Tower Dashboard
                          </h3>
                          <Badge variant="outline" className="bg-sec-safe/10 text-sec-safe border-sec-safe/30">
                            All Systems Operational
                          </Badge>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { label: 'Total Deployments', value: animatedMetrics.deployments, icon: Package, color: 'text-primary' },
                            { label: 'Success Rate', value: `${animatedMetrics.successRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-sec-safe' },
                            { label: 'Avg Duration', value: `${animatedMetrics.avgDuration}s`, icon: Clock, color: 'text-chart-1' },
                            { label: 'Active Users', value: animatedMetrics.activeUsers, icon: Users, color: 'text-chart-2' },
                          ].map((metric, i) => (
                            <motion.div
                              key={metric.label}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                            >
                              <Card className="bg-card/50">
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <metric.icon className={`w-4 h-4 ${metric.color}`} />
                                    <span className="text-xs text-muted-foreground">{metric.label}</span>
                                  </div>
                                  <div className="text-2xl font-bold">{metric.value}</div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-2 gap-4">
                          <Card className="bg-card/50">
                            <CardHeader className="py-3 px-4">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-primary" />
                                Weekly Deployments
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2">
                              <ResponsiveContainer width="100%" height={120}>
                                <BarChart data={deploymentData}>
                                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                                  <Bar dataKey="success" fill="hsl(var(--sec-safe))" radius={2} />
                                  <Bar dataKey="failed" fill="hsl(var(--sec-critical))" radius={2} />
                                </BarChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>

                          <Card className="bg-card/50">
                            <CardHeader className="py-3 px-4">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                System Performance
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2">
                              <ResponsiveContainer width="100%" height={120}>
                                <AreaChart data={metricsData}>
                                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                  <Area 
                                    type="monotone" 
                                    dataKey="latency" 
                                    stroke="hsl(var(--primary))" 
                                    fill="hsl(var(--primary))" 
                                    fillOpacity={0.2}
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Environment Status */}
                        <Card className="bg-card/50">
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Globe className="w-4 h-4 text-primary" />
                              Environment Status
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3">
                            <div className="grid grid-cols-4 gap-3">
                              {[
                                { name: 'Development', status: 'healthy', deploys: 47 },
                                { name: 'Staging', status: 'healthy', deploys: 23 },
                                { name: 'UAT', status: 'healthy', deploys: 12 },
                                { name: 'Production', status: 'locked', deploys: 8 },
                              ].map((env, i) => (
                                <motion.div
                                  key={env.name}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 + 0.5 }}
                                  className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg"
                                >
                                  <div className={`w-2 h-2 rounded-full ${
                                    env.status === 'healthy' ? 'bg-sec-safe' : 'bg-sec-warning'
                                  }`} />
                                  <div className="flex-1">
                                    <div className="text-xs font-medium">{env.name}</div>
                                    <div className="text-xs text-muted-foreground">{env.deploys} deploys</div>
                                  </div>
                                  {env.status === 'locked' && <Lock className="w-3 h-3 text-sec-warning" />}
                                </motion.div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* GitHub Connection Phase */}
                    {currentPhase === 'github' && (
                      <motion.div
                        key="github"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                      >
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Github className="w-5 h-5" />
                          GitHub Integration
                        </h3>

                        <Card className="bg-card/50">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                              <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="p-4 bg-muted rounded-xl"
                              >
                                <Github className="w-10 h-10" />
                              </motion.div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-1">GitHub App Connected</h4>
                                <p className="text-sm text-muted-foreground">Opzenix has access to your repositories</p>
                              </div>
                              <Badge className="bg-sec-safe text-sec-safe-foreground">Connected</Badge>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { icon: GitBranch, label: 'Branch Protection', desc: 'Auto-sync rules' },
                            { icon: Bell, label: 'Webhooks', desc: 'Real-time events' },
                            { icon: Shield, label: 'PR Checks', desc: 'Quality gates' },
                            { icon: Cloud, label: 'Deploy Keys', desc: 'Secure access' },
                          ].map((feature, i) => (
                            <motion.div
                              key={feature.label}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.15 }}
                              className="p-3 bg-muted/30 rounded-lg border flex items-center gap-3"
                            >
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <feature.icon className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <div className="text-sm font-medium">{feature.label}</div>
                                <div className="text-xs text-muted-foreground">{feature.desc}</div>
                              </div>
                              <CheckCircle2 className="w-4 h-4 text-sec-safe ml-auto" />
                            </motion.div>
                          ))}
                        </div>

                        <Card className="bg-card/50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <FileCode className="w-5 h-5 text-primary" />
                              <span className="font-medium">Selected Repository</span>
                            </div>
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                              className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
                            >
                              <Github className="w-5 h-5" />
                              <span className="font-mono text-sm">acme-corp/payment-service</span>
                              <Badge variant="outline" className="ml-auto text-xs">main</Badge>
                              <Badge variant="outline" className="text-xs">TypeScript</Badge>
                            </motion.div>
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
                        className="space-y-4"
                      >
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Layers className="w-5 h-5 text-primary" />
                          Visual Pipeline Builder
                        </h3>
                        
                        <Card className="bg-muted/20 border">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
                              {pipelineNodes.map((node, i) => (
                                <React.Fragment key={node.id}>
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex flex-col items-center min-w-[70px]"
                                  >
                                    <div className="w-12 h-12 rounded-xl bg-muted border-2 border-border flex items-center justify-center">
                                      {node.icon}
                                    </div>
                                    <span className="text-xs mt-2 text-muted-foreground text-center">{node.label}</span>
                                  </motion.div>
                                  {i < pipelineNodes.length - 1 && (
                                    <motion.div
                                      initial={{ scaleX: 0 }}
                                      animate={{ scaleX: 1 }}
                                      transition={{ delay: i * 0.1 + 0.05 }}
                                      className="flex-shrink-0 w-8 h-0.5 bg-border"
                                    />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { icon: Shield, label: 'Approval Gates', desc: 'Required for production' },
                            { icon: Lock, label: 'Environment Locks', desc: 'Freeze deployments' },
                            { icon: Users, label: 'RBAC Policies', desc: 'Role-based access' },
                          ].map((item, i) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 + 0.5 }}
                              className="p-4 bg-muted/30 rounded-lg border"
                            >
                              <item.icon className="w-6 h-6 text-primary mb-2" />
                              <div className="font-medium">{item.label}</div>
                              <div className="text-xs text-muted-foreground">{item.desc}</div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Execution & Analytics Phases */}
                    {(currentPhase === 'execution' || currentPhase === 'failure' || currentPhase === 'rollback') && (
                      <motion.div
                        key="execution"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Pipeline Execution
                          </h3>
                          <Badge 
                            variant="outline" 
                            className={`animate-pulse ${
                              currentPhase === 'failure' ? 'border-sec-critical text-sec-critical' : 
                              currentPhase === 'rollback' ? 'border-sec-warning text-sec-warning' :
                              'border-primary text-primary'
                            }`}
                          >
                            {currentPhase === 'failure' ? 'Failed' : currentPhase === 'rollback' ? 'Recovering' : 'Running'}
                          </Badge>
                        </div>

                        <Card className="bg-muted/20 border">
                          <CardContent className="p-6">
                            <div className="relative">
                              {/* Progress line background */}
                              <div className="absolute top-6 left-0 right-0 h-1 bg-border/30 rounded-full" 
                                   style={{ marginLeft: '36px', marginRight: '36px' }} />
                              
                              {/* Animated progress line */}
                              <motion.div 
                                className="absolute top-6 left-0 h-1 bg-gradient-to-r from-primary via-chart-1 to-sec-safe rounded-full"
                                style={{ marginLeft: '36px' }}
                                initial={{ width: 0 }}
                                animate={{ 
                                  width: `calc(${(currentNodeIndex + 1) / pipelineNodes.length * 100}% - 72px)` 
                                }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                              />
                              
                              <div className="flex items-center justify-between gap-2 relative">
                                {pipelineNodes.map((node, i) => (
                                  <motion.div
                                    key={node.id}
                                    animate={node.status === 'running' ? { 
                                      scale: [1, 1.1, 1],
                                      y: [0, -4, 0]
                                    } : {}}
                                    transition={{ 
                                      duration: 0.8, 
                                      repeat: node.status === 'running' ? Infinity : 0,
                                      ease: "easeInOut"
                                    }}
                                    className="flex flex-col items-center min-w-[72px] relative z-10"
                                  >
                                    {/* Node circle with enhanced styling */}
                                    <motion.div 
                                      className={`w-14 h-14 rounded-2xl border-3 flex items-center justify-center transition-all duration-300 shadow-lg ${getNodeStatusColor(node.status)}`}
                                      animate={node.status === 'running' ? {
                                        boxShadow: [
                                          '0 0 0 0 rgba(99, 102, 241, 0.4)',
                                          '0 0 0 8px rgba(99, 102, 241, 0)',
                                        ]
                                      } : {}}
                                      transition={{ duration: 1.5, repeat: node.status === 'running' ? Infinity : 0 }}
                                    >
                                      <AnimatePresence mode="wait">
                                        {node.status === 'running' ? (
                                          <motion.div
                                            key="running"
                                            initial={{ opacity: 0, rotate: 0 }}
                                            animate={{ opacity: 1, rotate: 360 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ rotate: { duration: 1.2, repeat: Infinity, ease: "linear" } }}
                                          >
                                            <RefreshCw className="w-5 h-5" />
                                          </motion.div>
                                        ) : node.status === 'success' ? (
                                          <motion.div
                                            key="success"
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                          >
                                            <CheckCircle2 className="w-5 h-5" />
                                          </motion.div>
                                        ) : node.status === 'failed' ? (
                                          <motion.div
                                            key="failed"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 0.4 }}
                                          >
                                            <XCircle className="w-5 h-5" />
                                          </motion.div>
                                        ) : (
                                          <motion.div
                                            key="idle"
                                            initial={{ opacity: 0.5 }}
                                            animate={{ opacity: 0.7 }}
                                          >
                                            {node.icon}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </motion.div>
                                    
                                    {/* Node label */}
                                    <motion.span 
                                      className={`text-xs mt-2 font-medium text-center ${
                                        node.status === 'success' ? 'text-sec-safe' :
                                        node.status === 'running' ? 'text-primary' :
                                        node.status === 'failed' ? 'text-sec-critical' :
                                        'text-muted-foreground'
                                      }`}
                                      animate={node.status === 'running' ? {
                                        opacity: [1, 0.7, 1]
                                      } : {}}
                                      transition={{ duration: 1, repeat: node.status === 'running' ? Infinity : 0 }}
                                    >
                                      {node.label}
                                    </motion.span>
                                    
                                    {/* Duration badge */}
                                    <AnimatePresence>
                                      {node.status === 'success' && node.duration !== '0s' && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0 }}
                                          className="mt-1 px-2 py-0.5 bg-sec-safe/10 rounded-full"
                                        >
                                          <span className="text-xs text-sec-safe font-mono">{node.duration}</span>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {currentPhase === 'failure' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-sec-critical/10 border border-sec-critical/30 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="w-5 h-5 text-sec-critical" />
                              <div className="flex-1">
                                <div className="font-medium text-sec-critical">Security Scan Failed</div>
                                <div className="text-sm text-muted-foreground">2 high-severity vulnerabilities detected</div>
                              </div>
                              <Button size="sm" variant="outline" className="border-sec-critical text-sec-critical hover:bg-sec-critical/10">
                                <History className="w-4 h-4 mr-2" />
                                Rollback
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
                              <div className="flex-1">
                                <div className="font-medium text-sec-safe">Checkpoint Recovery Active</div>
                                <div className="text-sm text-muted-foreground">Resuming from post-test checkpoint</div>
                              </div>
                              <Badge variant="outline" className="border-sec-safe text-sec-safe">Recovering</Badge>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Analytics Phase */}
                    {currentPhase === 'analytics' && (
                      <motion.div
                        key="analytics"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                      >
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-primary" />
                          Analytics & Observability
                        </h3>
                        
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Traces', value: '1,247', icon: Search, trend: '+12%' },
                            { label: 'Avg Latency', value: '45.2ms', icon: Gauge, trend: '-8%' },
                            { label: 'Error Rate', value: '0.03%', icon: AlertTriangle, trend: '-45%' },
                          ].map((item, i) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                            >
                              <Card className="bg-card/50">
                                <CardContent className="p-4 text-center">
                                  <item.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                                  <div className="text-2xl font-bold">{item.value}</div>
                                  <div className="flex items-center justify-center gap-1 text-xs">
                                    <span className="text-muted-foreground">{item.label}</span>
                                    <span className={item.trend.startsWith('+') ? 'text-sec-safe' : 'text-sec-safe'}>{item.trend}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>

                        <Card className="bg-card/50">
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Activity className="w-4 h-4 text-primary" />
                              OpenTelemetry Trace Timeline
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <ResponsiveContainer width="100%" height={150}>
                              <LineChart data={metricsData}>
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Line 
                                  type="monotone" 
                                  dataKey="latency" 
                                  stroke="hsl(var(--primary))" 
                                  strokeWidth={2}
                                  dot={false}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="throughput" 
                                  stroke="hsl(var(--chart-1))" 
                                  strokeWidth={2}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
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
                        className="space-y-4"
                      >
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Brain className="w-5 h-5 text-primary" />
                          Opzenix AI Engine
                        </h3>

                        <Card className="bg-gradient-to-br from-primary/10 to-chart-1/10 border-primary/30">
                          <CardContent className="p-6">
                            <motion.div
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="flex items-start gap-4"
                            >
                              <div className="p-3 bg-primary/20 rounded-xl">
                                <Sparkles className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold mb-2">AI Analysis Complete</div>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                  <p><strong>Root Cause:</strong> CVE-2024-1234 in lodash@4.17.15</p>
                                  <p><strong>Impact:</strong> Prototype pollution vulnerability</p>
                                  <p className="text-foreground font-medium">
                                    <strong>Suggested Fix:</strong> Upgrade to lodash@4.17.21
                                  </p>
                                </div>
                                <div className="flex gap-2 mt-4">
                                  <Button size="sm" className="bg-primary">
                                    <Zap className="w-4 h-4 mr-2" />
                                    Auto-Remediate
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    View PR #1247
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          </CardContent>
                        </Card>

                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Patterns Analyzed', value: '847', icon: Search },
                            { label: 'Similar Incidents', value: '23', icon: History },
                            { label: 'Fixes Available', value: '3', icon: Zap },
                          ].map((item, i) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 + i * 0.1 }}
                              className="p-4 bg-muted/30 rounded-lg border text-center"
                            >
                              <item.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                              <div className="text-xl font-bold">{item.value}</div>
                              <div className="text-xs text-muted-foreground">{item.label}</div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Governance Phase */}
                    {currentPhase === 'governance' && (
                      <motion.div
                        key="governance"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                      >
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Shield className="w-5 h-5 text-primary" />
                          Enterprise Governance
                        </h3>

                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { icon: Users, label: 'RBAC', desc: '3 roles configured', status: 'active' },
                            { icon: CheckSquare, label: 'Approvals', desc: '2 pending', status: 'pending' },
                            { icon: FileCode, label: 'Audit Logs', desc: '1,247 events', status: 'active' },
                          ].map((item, i) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                            >
                              <Card className="bg-card/50">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <item.icon className="w-5 h-5 text-primary" />
                                    <div className={`w-2 h-2 rounded-full ${
                                      item.status === 'active' ? 'bg-sec-safe' : 'bg-sec-warning animate-pulse'
                                    }`} />
                                  </div>
                                  <div className="font-medium">{item.label}</div>
                                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>

                        <Card className="bg-sec-safe/10 border-sec-safe/30">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-sec-safe/20 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-sec-safe" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sec-safe">Production Deployment Approved</div>
                                <div className="text-sm text-muted-foreground">
                                  Approved by @jane.smith • 2 minutes ago
                                </div>
                              </div>
                              <Badge className="bg-sec-safe text-sec-safe-foreground">Deployed</Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-card/50">
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <History className="w-4 h-4 text-primary" />
                              Recent Audit Log
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="divide-y divide-border">
                              {[
                                { action: 'DEPLOY_PROD_APPROVED', user: 'jane.smith', time: '2m ago' },
                                { action: 'PIPELINE_EXECUTED', user: 'john.doe', time: '5m ago' },
                                { action: 'ENV_LOCK_RELEASED', user: 'admin', time: '10m ago' },
                              ].map((log, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.5 + i * 0.1 }}
                                  className="px-4 py-2 flex items-center gap-3 text-sm"
                                >
                                  <code className="text-xs bg-muted px-2 py-0.5 rounded">{log.action}</code>
                                  <span className="text-muted-foreground">by @{log.user}</span>
                                  <span className="text-muted-foreground ml-auto">{log.time}</span>
                                </motion.div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Complete Phase */}
                    {currentPhase === 'complete' && (
                      <motion.div
                        key="complete"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center h-[480px] text-center"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.5 }}
                          className="w-24 h-24 bg-sec-safe rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-sec-safe/30"
                        >
                          <CheckCircle2 className="w-12 h-12 text-sec-safe-foreground" />
                        </motion.div>
                        <h2 className="text-3xl font-bold mb-3">Demo Complete!</h2>
                        <p className="text-muted-foreground mb-8 max-w-md">
                          You've experienced the full power of Opzenix enterprise CI/CD governance platform.
                        </p>
                        <div className="flex gap-4">
                          <Button size="lg" onClick={() => goToPhase('intro')}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Replay Demo
                          </Button>
                          <Button size="lg" variant="outline" onClick={onClose}>
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

            {/* Right Panel - Live Logs (hidden for execution phases) */}
            {!['execution', 'analytics', 'failure', 'rollback', 'ai', 'governance'].includes(currentPhase) && (
            <div className="flex flex-col bg-muted/10">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Live Activity
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sec-safe animate-pulse" />
                    <span className="text-xs text-muted-foreground">Live</span>
                  </div>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
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
                        className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 text-xs"
                      >
                        {getLogIcon(log.level)}
                        <div className="flex-1 min-w-0">
                          <span className="text-muted-foreground">[{log.timestamp}]</span>
                          <span className="ml-1 break-words">{log.message}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              {/* Phase Navigation */}
              <div className="p-2 border-t">
                <div className="text-xs text-muted-foreground mb-2">Jump to:</div>
                <div className="grid grid-cols-2 gap-1">
                  {DEMO_PHASES.slice(0, 6).map((phase) => (
                    <Button
                      key={phase.id}
                      variant={currentPhase === phase.id ? "secondary" : "ghost"}
                      size="sm"
                      className="text-xs h-7 justify-start"
                      onClick={() => goToPhase(phase.id)}
                    >
                      {phase.title.split(' ')[0]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EnhancedPlatformDemo;
