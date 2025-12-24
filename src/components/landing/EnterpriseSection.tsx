import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, FileCheck, Clock, Users, Lock, Eye, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Shield,
    title: 'SOC2 Type II',
    description: 'Built with enterprise security standards from day one',
    status: 'verified',
    color: 'text-sec-safe',
    bgColor: 'bg-sec-safe/10',
  },
  {
    icon: FileCheck,
    title: 'Complete Audit Trail',
    description: 'Every execution, approval, and change is logged immutably',
    status: 'verified',
    color: 'text-ai-primary',
    bgColor: 'bg-ai-primary/10',
  },
  {
    icon: Clock,
    title: '99.9% Uptime SLA',
    description: 'Enterprise SLA with guaranteed availability',
    status: 'verified',
    color: 'text-sec-warning',
    bgColor: 'bg-sec-warning/10',
  },
  {
    icon: Users,
    title: 'RBAC & SSO',
    description: 'Role-based access control with SAML/OIDC integration',
    status: 'verified',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'AES-256 at rest, TLS 1.3 in transit',
    status: 'verified',
    color: 'text-sec-safe',
    bgColor: 'bg-sec-safe/10',
  },
  {
    icon: Eye,
    title: 'Full Observability',
    description: 'OpenTelemetry native with traces, metrics, and logs',
    status: 'verified',
    color: 'text-ai-primary',
    bgColor: 'bg-ai-primary/10',
  },
];

const certifications = [
  { name: 'SOC2', status: 'Certified' },
  { name: 'ISO 27001', status: 'In Progress' },
  { name: 'GDPR', status: 'Compliant' },
  { name: 'HIPAA', status: 'Ready' },
];

const EnterpriseSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className="inline-block px-4 py-1 mb-4 text-sm rounded-full bg-primary/10 text-primary border border-primary/30"
          >
            Enterprise Ready
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Built for Regulated Industries
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mission-critical deployments require mission-critical infrastructure. 
            Opzenix is designed for teams who can't compromise on security or compliance.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group p-6 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", feature.bgColor)}>
                    <Icon className={cn("w-6 h-6", feature.color)} />
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-sec-safe/10 border border-sec-safe/30">
                    <CheckCircle2 className="w-3 h-3 text-sec-safe" />
                    <span className="text-xs text-sec-safe font-medium">Verified</span>
                  </div>
                </div>
                <h4 className="font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Certifications Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="p-6 rounded-xl border border-border bg-card/50"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Compliance & Certifications</h4>
              <p className="text-sm text-muted-foreground">Trusted by Fortune 500 companies</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {certifications.map((cert) => (
                <div 
                  key={cert.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border"
                >
                  <span className="font-medium text-sm text-foreground">{cert.name}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    cert.status === 'Certified' && "bg-sec-safe/20 text-sec-safe",
                    cert.status === 'In Progress' && "bg-sec-warning/20 text-sec-warning",
                    cert.status === 'Compliant' && "bg-ai-primary/20 text-ai-primary",
                    cert.status === 'Ready' && "bg-primary/20 text-primary",
                  )}>
                    {cert.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <Button size="lg" className="gap-2">
            Talk to Sales
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default EnterpriseSection;
