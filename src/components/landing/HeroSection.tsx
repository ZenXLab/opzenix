import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ReactFlow, Background, BackgroundVariant, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { nodeTypes } from '@/components/pipeline/PipelineNodeTypes';

const demoNodes: Node[] = [
  { id: 'd-source', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Source', stageType: 'source', status: 'success', description: 'main' } },
  { id: 'd-build', type: 'pipelineStage', position: { x: 250, y: 150 }, data: { label: 'Build', stageType: 'build', status: 'success', description: 'npm run build' } },
  { id: 'd-test', type: 'pipelineStage', position: { x: 450, y: 80 }, data: { label: 'Tests', stageType: 'test', status: 'success', description: '142 passed' } },
  { id: 'd-security', type: 'pipelineStage', position: { x: 450, y: 220 }, data: { label: 'Security', stageType: 'security', status: 'success', description: 'SAST + DAST' } },
  { id: 'd-checkpoint', type: 'checkpoint', position: { x: 650, y: 150 }, data: { label: 'Verified', stageType: 'checkpoint', status: 'checkpoint' } },
  { id: 'd-staging', type: 'pipelineStage', position: { x: 850, y: 150 }, data: { label: 'AKS Deploy', stageType: 'deploy', status: 'running', description: 'Canary 20%' } },
  { id: 'd-approval', type: 'approvalGate', position: { x: 1050, y: 150 }, data: { label: 'Approval', stageType: 'approval', status: 'idle' } },
  { id: 'd-prod', type: 'pipelineStage', position: { x: 1250, y: 150 }, data: { label: 'Production', stageType: 'deploy', status: 'idle', description: 'Blue-Green' } },
];

const demoEdges: Edge[] = [
  { id: 'de1', source: 'd-source', target: 'd-build' },
  { id: 'de2', source: 'd-build', target: 'd-test' },
  { id: 'de3', source: 'd-build', target: 'd-security' },
  { id: 'de4', source: 'd-test', target: 'd-checkpoint' },
  { id: 'de5', source: 'd-security', target: 'd-checkpoint' },
  { id: 'de6', source: 'd-checkpoint', target: 'd-staging', animated: true },
  { id: 'de7', source: 'd-staging', target: 'd-approval' },
  { id: 'de8', source: 'd-approval', target: 'd-prod' },
];

const HeroSection = () => {
  const [nodes, setNodes] = useState(demoNodes);
  const nodeIndexRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(prev => {
        const updated = [...prev];
        const currentNode = updated[nodeIndexRef.current];
        
        if (currentNode && currentNode.data.status !== 'checkpoint' && currentNode.data.status !== 'approval') {
          if (currentNode.data.status === 'idle') {
            updated[nodeIndexRef.current] = {
              ...currentNode,
              data: { ...currentNode.data, status: 'running' }
            };
          } else if (currentNode.data.status === 'running') {
            updated[nodeIndexRef.current] = {
              ...currentNode,
              data: { ...currentNode.data, status: 'success' }
            };
            nodeIndexRef.current = (nodeIndexRef.current + 1) % updated.length;
          }
        } else {
          nodeIndexRef.current = (nodeIndexRef.current + 1) % updated.length;
        }
        
        return updated;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-screen w-full flex flex-col overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-20 left-10 w-[500px] h-[500px] rounded-full bg-ai-primary/8 blur-[120px]"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-[400px] h-[400px] rounded-full bg-sec-safe/8 blur-[100px]"
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 control-grid opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background pointer-events-none" />
      </div>
      
      <motion.div className="relative z-10 flex flex-col h-full" style={{ y, opacity }}>
        <div className="pt-20 pb-6 px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-primary/30 bg-primary/10 text-sm text-primary"
            >
              <Sparkles className="w-4 h-4" />
              <span>Enterprise Execution Control Plane</span>
            </motion.div>
            
            {/* Primary Headline - SEO + Enterprise */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight leading-tight max-w-5xl mx-auto">
              Enterprise CI/CD with Built-in
              <span className="block text-primary">Governance, Security & Visibility</span>
            </h1>
            
            {/* Supporting Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 leading-relaxed">
              Opzenix orchestrates and observes your entire delivery lifecycle — from code to Kubernetes — 
              with checkpoints, approvals, and live execution flows.
            </p>

            {/* Founder Line / Differentiator */}
            <p className="text-base md:text-lg font-semibold text-foreground max-w-2xl mx-auto mb-8">
              GitHub runs the code. Kubernetes runs the workloads. <span className="text-primary">Opzenix runs the confidence.</span>
            </p>
            
            {/* CTAs - Enterprise focused */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button size="lg" className="gap-2 h-12 px-8 text-base">
                Request Enterprise Demo
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 h-12 px-8 text-base">
                <Play className="w-4 h-4" />
                View Live Execution Flow
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Live Pipeline Preview */}
        <motion.div 
          className="flex-1 mx-4 md:mx-8 mb-8 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="px-4 py-3 border-b border-border bg-card/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/70" />
                <div className="w-3 h-3 rounded-full bg-sec-warning/70" />
                <div className="w-3 h-3 rounded-full bg-sec-safe/70" />
              </div>
              <span className="text-sm text-muted-foreground font-mono">opzenix-execution-flow</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-sec-safe/20 text-sec-safe font-medium">Live</span>
              <span className="w-2 h-2 rounded-full bg-sec-safe animate-pulse" />
            </div>
          </div>
          
          <div className="h-[350px]">
            <ReactFlow
              nodes={nodes}
              edges={demoEdges}
              nodeTypes={nodeTypes}
              fitView
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={false}
              zoomOnScroll={false}
              defaultEdgeOptions={{
                style: { stroke: 'hsl(var(--edge-default))', strokeWidth: 2 },
                type: 'smoothstep',
              }}
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="hsl(var(--border))" />
            </ReactFlow>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
