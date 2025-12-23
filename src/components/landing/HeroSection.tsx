import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ReactFlow, Background, BackgroundVariant, Node, Edge, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, ChevronDown } from 'lucide-react';
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

const HeroSection = () => {
  const [nodes, setNodes] = useState(demoNodes);
  const nodeIndexRef = useRef(0);
  
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
    <section className="relative h-screen w-full flex flex-col overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 control-grid opacity-30" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top Section */}
        <div className="pt-24 pb-8 px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
              Operate Software & AI
              <span className="block text-ai-primary">With Confidence</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Flow-driven. Governed. Recoverable. Enterprise-ready.
            </p>
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
              <Play className="w-4 h-4" />
              Watch the System Run
            </Button>
          </motion.div>
        </div>

        {/* Live Pipeline Preview */}
        <motion.div 
          className="flex-1 mx-8 mb-8 rounded-xl border border-border bg-card/50 backdrop-blur overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
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

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
