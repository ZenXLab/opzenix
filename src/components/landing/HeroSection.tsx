import { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import LiveDashboardPreview from './LiveDashboardPreview';
import { EnhancedPlatformDemo } from '@/components/demo/EnhancedPlatformDemo';

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-screen w-full flex flex-col overflow-hidden">
      <EnhancedPlatformDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
      
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-20 left-10 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-[400px] h-[400px] rounded-full bg-sec-safe/8 blur-[100px]"
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 control-grid opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
      </div>
      
      <motion.div className="relative z-10 flex flex-col h-full" style={{ y, opacity }}>
        <div className="pt-16 pb-6 px-4 md:px-8 text-center">
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
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-primary/30 bg-primary/10 text-sm text-primary"
            >
              <Shield className="w-4 h-4" />
              <span>Execution Governance Platform</span>
            </motion.div>
            
            {/* Primary Headline - SEO + Enterprise */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tight leading-tight max-w-5xl mx-auto">
              Enterprise CI/CD with Built-in
              <span className="block text-primary mt-2">Governance, Security & Visibility</span>
            </h1>
            
            {/* Supporting Subheadline */}
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-4 leading-relaxed">
              Opzenix orchestrates and observes your entire delivery lifecycle — from code to Kubernetes — 
              with checkpoints, approvals, and live execution flows.
            </p>

            {/* Founder Line / Differentiator */}
            <p className="text-sm md:text-base font-semibold text-foreground max-w-2xl mx-auto mb-6">
              GitHub runs the code. Kubernetes runs the workloads. <span className="text-primary">Opzenix runs the confidence.</span>
            </p>
            
            {/* CTAs - Enterprise focused */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Button size="lg" className="gap-2 h-11 px-6 text-sm" asChild>
                <Link to="/company/contact">
                  Request Enterprise Demo
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 h-11 px-6 text-sm"
                onClick={() => setDemoOpen(true)}
              >
                <Sparkles className="w-4 h-4" />
                View Live Execution Flow
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Live Dashboard Preview */}
        <div className="flex-1 mx-4 md:mx-8 mb-8">
          <LiveDashboardPreview />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
