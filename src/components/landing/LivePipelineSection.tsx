import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ReactFlow, Background, BackgroundVariant, Node, Edge, Panel } from '@xyflow/react';
import { AlertTriangle, CheckCircle2, RotateCcw, Sparkles, Clock, Activity, Shield } from 'lucide-react';
import { nodeTypes } from '@/components/pipeline/PipelineNodeTypes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const pipelineNodes: Node[] = [
  { id: 'ci-source', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Source', stageType: 'source', status: 'success' } },
  { id: 'ci-build', type: 'pipelineStage', position: { x: 220, y: 150 }, data: { label: 'Build', stageType: 'build', status: 'success' } },
  { id: 'ci-security', type: 'pipelineStage', position: { x: 390, y: 150 }, data: { label: 'Security', stageType: 'security', status: 'success' } },
  { id: 'ci-artifact', type: 'checkpoint', position: { x: 560, y: 150 }, data: { label: 'Artifact', stageType: 'checkpoint', status: 'checkpoint' } },
  { id: 'cd-staging', type: 'pipelineStage', position: { x: 730, y: 80 }, data: { label: 'Staging', stageType: 'deploy', status: 'running' } },
  { id: 'cd-canary', type: 'pipelineStage', position: { x: 730, y: 220 }, data: { label: 'Canary', stageType: 'deploy', status: 'idle' } },
  { id: 'cd-prod', type: 'pipelineStage', position: { x: 900, y: 150 }, data: { label: 'Production', stageType: 'deploy', status: 'idle' } },
  { id: 'runtime', type: 'pipelineStage', position: { x: 1070, y: 150 }, data: { label: 'Runtime', stageType: 'test', status: 'idle' } },
];

const pipelineEdges: Edge[] = [
  { id: 'pe1', source: 'ci-source', target: 'ci-build' },
  { id: 'pe2', source: 'ci-build', target: 'ci-security' },
  { id: 'pe3', source: 'ci-security', target: 'ci-artifact' },
  { id: 'pe4', source: 'ci-artifact', target: 'cd-staging', animated: true },
  { id: 'pe5', source: 'ci-artifact', target: 'cd-canary' },
  { id: 'pe6', source: 'cd-staging', target: 'cd-prod' },
  { id: 'pe7', source: 'cd-canary', target: 'cd-prod' },
  { id: 'pe8', source: 'cd-prod', target: 'runtime' },
];

const metrics = [
  { icon: Clock, label: 'Avg Deploy Time', value: '2m 14s', color: 'text-ai-primary' },
  { icon: Activity, label: 'Success Rate', value: '99.8%', color: 'text-sec-safe' },
  { icon: Shield, label: 'Security Score', value: 'A+', color: 'text-sec-warning' },
];

const LivePipelineSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [nodes, setNodes] = useState(pipelineNodes);
  const [activeLog, setActiveLog] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [phase, setPhase] = useState<'running' | 'failed' | 'recovering' | 'success'>('running');

  useEffect(() => {
    if (!isInView) return;
    
    // Simulate failure and recovery
    const timeline = [
      { delay: 2000, action: () => {
        setNodes(prev => prev.map(n => 
          n.id === 'cd-staging' ? { ...n, data: { ...n.data, status: 'failed' } } : n
        ));
        setActiveLog('Error: Container health check failed - timeout after 30s');
        setPhase('failed');
      }},
      { delay: 4000, action: () => setShowRecovery(true) },
      { delay: 6000, action: () => {
        setNodes(prev => prev.map(n => 
          n.id === 'cd-staging' ? { ...n, data: { ...n.data, status: 'running' } } : n
        ));
        setActiveLog('Restoring from checkpoint... Rolling back to v2.0.3');
        setShowRecovery(false);
        setPhase('recovering');
      }},
      { delay: 8000, action: () => {
        setNodes(prev => prev.map(n => 
          n.id === 'cd-staging' ? { ...n, data: { ...n.data, status: 'success' } } : n
        ));
        setActiveLog('Deployment successful - health checks passing');
        setPhase('success');
      }},
    ];

    const timeouts = timeline.map(({ delay, action }) => setTimeout(action, delay));
    return () => timeouts.forEach(clearTimeout);
  }, [isInView]);

  return (
    <section ref={ref} className="min-h-screen py-24 px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[300px] h-[300px] rounded-full bg-destructive/5 blur-[100px]" />
        <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] rounded-full bg-sec-safe/5 blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className="inline-block px-4 py-1 mb-4 text-sm rounded-full bg-destructive/10 text-destructive border border-destructive/30"
          >
            Live Demo
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Checkpoint-Based Recovery
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch how Opzenix automatically detects failures and recovers from immutable checkpoints. 
            No data loss. No manual intervention.
          </p>
        </motion.div>

        {/* Metrics Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto"
        >
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="text-center p-4 rounded-lg bg-card border border-border"
            >
              <metric.icon className={cn("w-5 h-5 mx-auto mb-2", metric.color)} />
              <div className="text-xl font-bold text-foreground">{metric.value}</div>
              <div className="text-xs text-muted-foreground">{metric.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-[500px] rounded-xl border border-border bg-card overflow-hidden relative shadow-xl"
        >
          {/* Status Bar */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-1 transition-all duration-500",
            phase === 'running' && "bg-ai-primary",
            phase === 'failed' && "bg-destructive",
            phase === 'recovering' && "bg-sec-warning",
            phase === 'success' && "bg-sec-safe"
          )} />

          <ReactFlow
            nodes={nodes}
            edges={pipelineEdges}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            defaultEdgeOptions={{
              style: { stroke: 'hsl(var(--edge-default))', strokeWidth: 2 },
              type: 'smoothstep',
            }}
          >
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={24} 
              size={1}
              color="hsl(var(--border))"
            />
            
            {/* Log Panel */}
            <Panel position="bottom-left" className="m-4">
              <motion.div 
                className={cn(
                  "p-4 rounded-lg border backdrop-blur transition-all min-w-[300px]",
                  phase === 'failed' ? "bg-destructive/10 border-destructive/50" : 
                  phase === 'success' ? "bg-sec-safe/10 border-sec-safe/50" :
                  phase === 'recovering' ? "bg-sec-warning/10 border-sec-warning/50" :
                  "bg-card/90 border-border"
                )}
                animate={{ 
                  scale: phase === 'failed' ? [1, 1.02, 1] : 1 
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {phase === 'failed' ? (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  ) : phase === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                  ) : phase === 'recovering' ? (
                    <RotateCcw className="w-4 h-4 text-sec-warning animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-ai-primary" />
                  )}
                  <span className="text-xs font-medium text-foreground">System Log</span>
                  <span className={cn(
                    "ml-auto text-xs px-2 py-0.5 rounded",
                    phase === 'failed' && "bg-destructive/20 text-destructive",
                    phase === 'success' && "bg-sec-safe/20 text-sec-safe",
                    phase === 'recovering' && "bg-sec-warning/20 text-sec-warning",
                    phase === 'running' && "bg-ai-primary/20 text-ai-primary"
                  )}>
                    {phase.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  {activeLog || 'Pipeline executing...'}
                </p>
              </motion.div>
            </Panel>

            {/* Recovery Action */}
            {showRecovery && (
              <Panel position="top-center" className="mt-4">
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 px-5 py-3 bg-sec-warning/20 border border-sec-warning/50 rounded-lg shadow-lg"
                >
                  <RotateCcw className="w-5 h-5 text-sec-warning" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Checkpoint Recovery Available</p>
                    <p className="text-xs text-muted-foreground">Last stable: v2.0.3 (2 minutes ago)</p>
                  </div>
                  <Button size="sm" className="ml-4 bg-sec-warning text-sec-warning-foreground hover:bg-sec-warning/90">
                    Restore Now
                  </Button>
                </motion.div>
              </Panel>
            )}
          </ReactFlow>
        </motion.div>
      </div>
    </section>
  );
};

export default LivePipelineSection;
