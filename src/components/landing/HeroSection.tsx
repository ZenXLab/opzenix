import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ReactFlow, Background, BackgroundVariant, Node, Edge, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, ChevronDown, Shield, Zap, Eye, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { nodeTypes } from '@/components/pipeline/PipelineNodeTypes';

const demoNodes: Node[] = [
  { id: 'd-source', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Source', stageType: 'source', status: 'success', description: 'main' } },
  { id: 'd-build', type: 'pipelineStage', position: { x: 250, y: 150 }, data: { label: 'Build', stageType: 'build', status: 'success', description: 'npm run build' } },
  { id: 'd-test', type: 'pipelineStage', position: { x: 450, y: 80 }, data: { label: 'Tests', stageType: 'test', status: 'success', description: '142 passed' } },
  { id: 'd-security', type: 'pipelineStage', position: { x: 450, y: 220 }, data: { label: 'Security', stageType: 'security', status: 'success', description: 'No issues' } },
  { id: 'd-checkpoint', type: 'checkpoint', position: { x: 650, y: 150 }, data: { label: 'Verified', stageType: 'checkpoint', status: 'checkpoint' } },
  { id: 'd-staging', type: 'pipelineStage', position: { x: 850, y: 150 }, data: { label: 'Staging', stageType: 'deploy', status: 'running', description: 'Canary 20%' } },
  { id: 'd-approval', type: 'approvalGate', position: { x: 1050, y: 150 }, data: { label: 'Approval', stageType: 'approval', status: 'idle' } },
  { id: 'd-prod', type: 'pipelineStage', position: { x: 1250, y: 150 }, data: { label: 'Production', stageType: 'deploy', status: 'idle', description: 'Blue-Green' } },
];

const demoEdges: Edge[] = [
  { id: 'de1', source: 'd-source', target: 'd-build', animated: false },
  { id: 'de2', source: 'd-build', target: 'd-test', animated: false },
  { id: 'de3', source: 'd-build', target: 'd-security', animated: false },
  { id: 'de4', source: 'd-test', target: 'd-checkpoint', animated: false },
  { id: 'de5', source: 'd-security', target: 'd-checkpoint', animated: false },
  { id: 'de6', source: 'd-checkpoint', target: 'd-staging', animated: true },
  { id: 'de7', source: 'd-staging', target: 'd-approval', animated: false },
  { id: 'de8', source: 'd-approval', target: 'd-prod', animated: false },
];

const stats = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '< 50ms', label: 'Recovery Time' },
  { value: '100%', label: 'Audit Trail' },
  { value: '0', label: 'Lost Artifacts' },
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
  
  // Simulate pipeline execution
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
        {/* Gradient Orbs */}
        <motion.div 
          className="absolute top-20 left-10 w-[500px] h-[500px] rounded-full bg-ai-primary/10 blur-[120px]"
          animate={{ 
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-[400px] h-[400px] rounded-full bg-sec-safe/10 blur-[100px]"
          animate={{ 
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 control-grid opacity-20" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background pointer-events-none" />
      </div>
      
      {/* Content */}
      <motion.div 
        className="relative z-10 flex flex-col h-full"
        style={{ y, opacity }}
      >
        {/* Top Section */}
        <div className="pt-20 pb-6 px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-ai-primary/30 bg-ai-primary/10 text-sm text-ai-primary"
            >
              <Sparkles className="w-4 h-4" />
              <span>Enterprise CI/CD Control Plane</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight leading-tight">
              <span className="block">Operate Software & AI</span>
              <motion.span 
                className="block bg-gradient-to-r from-ai-primary via-sec-safe to-ai-primary bg-clip-text text-transparent bg-[length:200%_100%]"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              >
                With Confidence
              </motion.span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Flow-driven orchestration with immutable checkpoints, governed approvals, 
              and instant recovery. Built for teams who can't afford downtime.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 h-12 px-8 text-base">
                <Play className="w-4 h-4" />
                Watch Demo
              </Button>
              <Button size="lg" variant="outline" className="gap-2 h-12 px-8 text-base">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { icon: Shield, label: 'SOC2 Ready', color: 'text-sec-safe' },
                { icon: Zap, label: 'Zero Downtime', color: 'text-sec-warning' },
                { icon: Eye, label: 'Full Observability', color: 'text-ai-primary' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border"
                >
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-sm text-foreground">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Live Pipeline Preview */}
        <motion.div 
          className="flex-1 mx-4 md:mx-8 mb-8 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-ai-primary/5"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Pipeline Header */}
          <div className="px-4 py-3 border-b border-border bg-card/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/70" />
                <div className="w-3 h-3 rounded-full bg-sec-warning/70" />
                <div className="w-3 h-3 rounded-full bg-sec-safe/70" />
              </div>
              <span className="text-sm text-muted-foreground font-mono">opzenix-pipeline-v2.1</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-sec-safe/20 text-sec-safe">Live</span>
              <span className="w-2 h-2 rounded-full bg-sec-safe animate-pulse" />
            </div>
          </div>
          
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
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={24} 
              size={1}
              color="hsl(var(--border))"
            />
          </ReactFlow>
        </motion.div>

        {/* Stats Row */}
        <motion.div 
          className="px-8 pb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                className="text-center p-4 rounded-lg bg-secondary/30 border border-border"
              >
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
