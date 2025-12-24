import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Layers, Server, Shield, Building2, Users } from 'lucide-react';

const audiences = [
  { icon: Layers, label: 'Platform Engineering' },
  { icon: Server, label: 'DevOps & SRE Teams' },
  { icon: Shield, label: 'Security & Compliance' },
  { icon: Building2, label: 'Enterprise Architects' },
  { icon: Users, label: 'CTOs & Engineering Leaders' },
];

const AudienceSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-8 bg-card/30">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Built for Teams Who Own Production
          </h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
            Opzenix is designed for enterprises with mission-critical deployments, 
            not hobby projects or single-developer pipelines.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4">
          {audiences.map((audience, index) => {
            const Icon = audience.icon;
            return (
              <motion.div
                key={audience.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-3 px-5 py-3 rounded-full border border-border bg-card hover:bg-secondary/50 transition-colors"
              >
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{audience.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;
