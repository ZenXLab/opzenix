import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FooterSection = () => {
  return (
    <footer className="py-24 px-8 border-t border-border bg-card/30">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-ai-primary" />
            <span className="text-2xl font-bold text-foreground">Opzenix</span>
          </div>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            The universal execution, visibility, and recovery system for enterprise operations.
          </p>

          <Button size="lg" className="gap-2">
            Request Private Access
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="mt-16 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Built for enterprises that demand complete control.
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default FooterSection;
