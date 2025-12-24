import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  Shield, RotateCcw, Eye, Workflow, CheckCircle2, 
  TrendingDown, Clock, DollarSign, Zap, Lock
} from 'lucide-react';

const capabilities = [
  {
    icon: Workflow,
    title: 'Visual Execution Flows',
    description: 'See every deployment stage in real-time with interactive flow diagrams',
    metric: '100%',
    metricLabel: 'Visibility',
    color: 'from-primary to-chart-1',
  },
  {
    icon: RotateCcw,
    title: 'One-Click Rollback',
    description: 'Checkpoint-based recovery means instant rollback to any previous state',
    metric: '< 30s',
    metricLabel: 'Recovery Time',
    color: 'from-chart-1 to-sec-safe',
  },
  {
    icon: Shield,
    title: 'Governance Gates',
    description: 'RBAC-enforced approvals prevent unauthorized deployments automatically',
    metric: '99.9%',
    metricLabel: 'Policy Compliance',
    color: 'from-sec-safe to-primary',
  },
  {
    icon: Eye,
    title: 'OTel-Native Observability',
    description: 'Every execution correlated with traces, logs, and metrics',
    metric: 'Zero',
    metricLabel: 'Blind Spots',
    color: 'from-sec-warning to-chart-2',
  },
];

const savingsData = [
  { icon: Clock, label: 'Incident Recovery', before: '4+ hours', after: '< 5 mins', savings: '98%' },
  { icon: TrendingDown, label: 'Deployment Failures', before: '15%', after: '< 2%', savings: '87%' },
  { icon: DollarSign, label: 'Operations Cost', before: '100%', after: '40%', savings: '60%' },
];

const EnterpriseCapabilitiesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-6 md:px-8 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 text-sm rounded-full bg-primary/10 text-primary border border-primary/30">
            <Zap className="w-4 h-4" />
            Enterprise Capabilities
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            How Opzenix Transforms{' '}
            <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              Enterprise Delivery
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            See the real impact of governance-first delivery on enterprise operations
          </p>
        </motion.div>

        {/* Live Capability Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {capabilities.map((cap, index) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300"
              >
                {/* Animated gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cap.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <div className="relative p-6 md:p-8">
                  <div className="flex items-start justify-between mb-4">
                    <motion.div 
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cap.color} flex items-center justify-center`}
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </motion.div>
                    <div className="text-right">
                      <motion.div 
                        className="text-3xl font-bold text-foreground"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                      >
                        {cap.metric}
                      </motion.div>
                      <div className="text-xs text-muted-foreground">{cap.metricLabel}</div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {cap.title}
                  </h3>
                  <p className="text-muted-foreground">{cap.description}</p>
                  
                  {/* Animated progress bar */}
                  <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${cap.color}`}
                      initial={{ width: 0 }}
                      animate={isInView ? { width: '100%' } : {}}
                      transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ROI / Savings Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="relative rounded-2xl border border-border bg-card/50 overflow-hidden"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-sec-safe/5 via-transparent to-primary/5" />
          <div className="absolute inset-0 control-grid opacity-5" />
          
          <div className="relative p-8 md:p-12">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs rounded-full bg-sec-safe/10 text-sec-safe border border-sec-safe/30">
                <TrendingDown className="w-3 h-3" />
                Proven ROI
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                Real Enterprise Savings
              </h3>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {savingsData.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="text-center p-6 rounded-xl bg-background/50 border border-border"
                  >
                    <div className="w-12 h-12 rounded-full bg-sec-safe/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-sec-safe" />
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">{item.label}</div>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="text-sm text-muted-foreground line-through">{item.before}</span>
                      <span className="text-lg font-bold text-foreground">→ {item.after}</span>
                    </div>
                    <motion.div 
                      className="text-3xl font-bold text-sec-safe"
                      initial={{ scale: 0 }}
                      animate={isInView ? { scale: 1 } : {}}
                      transition={{ delay: 1 + index * 0.1, type: "spring" }}
                    >
                      {item.savings} ↓
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EnterpriseCapabilitiesSection;
