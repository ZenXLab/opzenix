import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Sparkles, AlertTriangle, TrendingUp, Shield, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

const insights = [
  {
    id: 1,
    type: 'explanation',
    icon: Lightbulb,
    title: 'Why this stage exists',
    content: 'Security scan runs after build to catch vulnerabilities before deployment. This prevents compromised code from reaching production.',
    confidence: 98,
  },
  {
    id: 2,
    type: 'risk',
    icon: AlertTriangle,
    title: 'Risk detected',
    content: 'Dependency lodash@4.17.20 has known vulnerability CVE-2024-1234. Consider upgrading to 4.17.21 or later.',
    confidence: 87,
    severity: 'medium',
  },
  {
    id: 3,
    type: 'optimization',
    icon: TrendingUp,
    title: 'Performance insight',
    content: 'Build stage taking 3m 45s. Enabling build cache could reduce this to ~45s based on similar pipelines.',
    confidence: 92,
  },
  {
    id: 4,
    type: 'security',
    icon: Shield,
    title: 'Security recommendation',
    content: 'Production deployment should require 2 approvals. Currently set to 1. This aligns with SOC2 compliance requirements.',
    confidence: 95,
  },
];

const AIReasoningSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [visibleInsights, setVisibleInsights] = useState<number[]>([]);

  useEffect(() => {
    if (!isInView) return;

    insights.forEach((insight, index) => {
      setTimeout(() => {
        setVisibleInsights(prev => [...prev, insight.id]);
      }, index * 600);
    });
  }, [isInView]);

  return (
    <section ref={ref} className="min-h-screen py-24 px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-ai-primary" />
            <h2 className="text-3xl font-bold text-foreground">
              AI-Powered Intelligence
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Contextual insights, not chatbots. AI that explains, warns, and suggests—quietly and powerfully.
          </p>
        </motion.div>

        <div className="grid gap-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            const isVisible = visibleInsights.includes(insight.id);

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4 }}
                className={cn(
                  "p-5 rounded-xl border transition-all",
                  insight.type === 'risk' && "bg-node-warning/5 border-node-warning/30",
                  insight.type === 'security' && "bg-node-failed/5 border-node-failed/30",
                  insight.type === 'explanation' && "bg-ai-primary/5 border-ai-primary/30",
                  insight.type === 'optimization' && "bg-node-success/5 border-node-success/30"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    insight.type === 'risk' && "bg-node-warning/20",
                    insight.type === 'security' && "bg-node-failed/20",
                    insight.type === 'explanation' && "bg-ai-primary/20",
                    insight.type === 'optimization' && "bg-node-success/20"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5",
                      insight.type === 'risk' && "text-node-warning",
                      insight.type === 'security' && "text-node-failed",
                      insight.type === 'explanation' && "text-ai-primary",
                      insight.type === 'optimization' && "text-node-success"
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{insight.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Confidence: {insight.confidence}%
                        </span>
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={isVisible ? { width: `${insight.confidence}%` } : {}}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="h-full bg-ai-primary rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.content}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Key Point */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 2.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-foreground italic">
            "AI as intelligence, not gimmick."
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default AIReasoningSection;
