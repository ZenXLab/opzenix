import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ReactFlow, Background, BackgroundVariant, Node, Edge, Panel } from '@xyflow/react';
import { AlertTriangle, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
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

const LivePipelineSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [nodes, setNodes] = useState(pipelineNodes);
  const [activeLog, setActiveLog] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    
    // Simulate failure and recovery
    const timeline = [
      { delay: 2000, action: () => {
        setNodes(prev => prev.map(n => 
          n.id === 'cd-staging' ? { ...n, data: { ...n.data, status: 'failed' } } : n
        ));
        setActiveLog('Error: Container health check failed - timeout after 30s');
      }},
      { delay: 4000, action: () => setShowRecovery(true) },
      { delay: 6000, action: () => {
        setNodes(prev => prev.map(n => 
          n.id === 'cd-staging' ? { ...n, data: { ...n.data, status: 'running' } } : n
        ));
        setActiveLog('Restoring from checkpoint...');
        setShowRecovery(false);
      }},
      { delay: 8000, action: () => {
        setNodes(prev => prev.map(n => 
          n.id === 'cd-staging' ? { ...n, data: { ...n.data, status: 'success' } } : n
        ));
        setActiveLog('Deployment successful - health checks passing');
      }},
    ];

    const timeouts = timeline.map(({ delay, action }) => setTimeout(action, delay));
    return () => timeouts.forEach(clearTimeout);
  }, [isInView]);

  return (
    <section ref={ref} className="min-h-screen py-24 px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Live Pipeline Execution
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See checkpoint-based execution in action. Watch how failures are detected and recovered automatically.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-[500px] rounded-xl border border-border bg-card overflow-hidden relative"
        >
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
              <div className={cn(
                "p-3 rounded-lg border backdrop-blur transition-all",
                activeLog?.includes('Error') ? "bg-destructive/10 border-destructive/50" : "bg-card/90 border-border"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  {activeLog?.includes('Error') ? (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  ) : activeLog?.includes('successful') ? (
                    <CheckCircle2 className="w-4 h-4 text-node-success" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-ai-primary" />
                  )}
                  <span className="text-xs font-medium text-foreground">System Log</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {activeLog || 'Pipeline executing...'}
                </p>
              </div>
            </Panel>

            {/* Recovery Action */}
            {showRecovery && (
              <Panel position="top-center" className="mt-4">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 px-4 py-2 bg-node-warning/20 border border-node-warning/50 rounded-lg"
                >
                  <RotateCcw className="w-4 h-4 text-node-warning" />
                  <span className="text-sm text-foreground">Checkpoint recovery available</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    Restore
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
