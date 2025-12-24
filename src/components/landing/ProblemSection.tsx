import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AlertTriangle, EyeOff, XCircle, FileX } from 'lucide-react';

const problems = [
  { icon: EyeOff, text: 'Execute pipelines' },
  { icon: AlertTriangle, text: 'Hide system context' },
  { icon: XCircle, text: 'Fail silently across environments' },
  { icon: FileX, text: 'Break audit trails' },
];

const ProblemSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-8">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            Modern CI/CD Tools Execute Tasks.
            <span className="block text-muted-foreground">Enterprises Need Systems That Prove Correctness.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="mt-12 p-8 rounded-xl border border-destructive/30 bg-destructive/5"
        >
          <p className="text-lg text-muted-foreground mb-6">Most CI/CD tools today:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {problems.map((problem, index) => (
              <motion.div
                key={problem.text}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50"
              >
                <problem.icon className="w-6 h-6 text-destructive" />
                <span className="text-sm text-muted-foreground text-center">{problem.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-8 text-lg text-foreground font-medium"
        >
          Enterprises don't fail because of code.
          <span className="block text-muted-foreground">They fail because delivery lacks visibility and control.</span>
        </motion.p>
      </div>
    </section>
  );
};

export default ProblemSection;
