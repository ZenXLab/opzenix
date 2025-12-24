import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { EnhancedPlatformDemo } from '@/components/demo/EnhancedPlatformDemo';

const FinalCTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <section ref={ref} className="py-24 px-8 bg-gradient-to-b from-card/50 to-background">
      <EnhancedPlatformDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
      
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Turn Software Delivery into a
            <span className="block text-primary">System You Can Trust</span>
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join enterprises who have moved from hoping deployments work to knowing they will.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="gap-2 h-12 px-8 text-base" asChild>
              <Link to="/company/contact">
                Schedule an Enterprise Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="gap-2 h-12 px-8 text-base"
              onClick={() => setDemoOpen(true)}
            >
              <Play className="w-4 h-4" />
              See a Live Execution Flow
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTASection;
