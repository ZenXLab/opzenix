import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Brain, 
  Shield, 
  Clock, 
  GitCommit, 
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  GitBranch,
  Pause,
  Play,
  ChevronRight,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useFlowStore } from '@/stores/flowStore';
import { cn } from '@/lib/utils';

const nodeDetails: Record<string, {
  whatItDoes: string;
  whyItExists: string;
  risks: string[];
  securityImpact: string;
  aiRecommendation: string;
  lastChange?: string;
}> = {
  'source': {
    whatItDoes: 'Clones the repository and checks out the specified branch/commit for the build process.',
    whyItExists: 'Ensures a clean, reproducible source state for every execution.',
    risks: [],
    securityImpact: 'Low - Read-only access to repository',
    aiRecommendation: 'Consider enabling shallow clones to reduce checkout time by 40%.',
    lastChange: 'Branch protection rules updated 3 days ago',
  },
  'build': {
    whatItDoes: 'Compiles source code, resolves dependencies, and packages deployment artifacts.',
    whyItExists: 'Creates immutable, versioned artifacts that can be deployed consistently across environments.',
    risks: ['3 deprecated dependencies detected'],
    securityImpact: 'Medium - Executes arbitrary build scripts',
    aiRecommendation: 'Detected 3 unused dependencies. Removing them could reduce build time by ~18s.',
    lastChange: 'Build script modified 12 hours ago',
  },
  'security-scan': {
    whatItDoes: 'Performs static application security testing (SAST), dependency vulnerability scanning, and secret detection.',
    whyItExists: 'Shifts security left by catching vulnerabilities before deployment.',
    risks: [],
    securityImpact: 'Critical - Security gate for all deployments',
    aiRecommendation: 'All 0 critical vulnerabilities addressed. Ready for deployment.',
  },
  'unit-tests': {
    whatItDoes: 'Executes the full unit test suite with code coverage analysis.',
    whyItExists: 'Validates individual component behavior and prevents regressions.',
    risks: [],
    securityImpact: 'Low - Test execution only',
    aiRecommendation: 'Test coverage is 94.2%. Consider adding tests for the new auth module.',
  },
  'checkpoint-1': {
    whatItDoes: 'Creates a verified checkpoint of the build state. All previous stages have passed validation.',
    whyItExists: 'Enables rollback, branching, and audit trail for deployments.',
    risks: [],
    securityImpact: 'Low - State preservation only',
    aiRecommendation: 'Checkpoint stored. You can rollback to this state or branch a new execution path.',
  },
  'staging-deploy': {
    whatItDoes: 'Deploys the verified artifact to the staging environment using a rolling deployment strategy.',
    whyItExists: 'Provides a production-like environment for final validation before production deployment.',
    risks: ['High CPU utilization detected on staging cluster'],
    securityImpact: 'High - Modifies staging infrastructure',
    aiRecommendation: 'Staging deployment is 65% complete. No anomalies detected.',
    lastChange: 'Deployment strategy changed to canary 1 week ago',
  },
  'integration-tests': {
    whatItDoes: 'Runs end-to-end tests, API contract validation, and cross-service integration tests.',
    whyItExists: 'Validates the system behaves correctly when all components work together.',
    risks: [],
    securityImpact: 'Medium - Accesses multiple services',
    aiRecommendation: 'Waiting for staging deployment to complete before execution.',
  },
  'approval-gate': {
    whatItDoes: 'Requires manual approval from authorized personnel before proceeding to production.',
    whyItExists: 'Provides human oversight for critical production deployments.',
    risks: [],
    securityImpact: 'Critical - Production access control',
    aiRecommendation: 'Based on historical data, similar deployments have 99.2% success rate.',
  },
  'prod-deploy': {
    whatItDoes: 'Deploys to production using blue-green deployment with automated rollback capability.',
    whyItExists: 'Delivers changes to end users with minimal downtime and risk.',
    risks: [],
    securityImpact: 'Critical - Production infrastructure',
    aiRecommendation: 'Ready for deployment. Recommended deployment window: 2:00-4:00 AM UTC.',
  },
  'checkpoint-2': {
    whatItDoes: 'Final checkpoint marking successful production deployment.',
    whyItExists: 'Provides rollback point and audit record for production state.',
    risks: [],
    securityImpact: 'Low - State preservation only',
    aiRecommendation: 'Production checkpoint will be created upon successful deployment.',
  },
};

const InspectorPanel = () => {
  const { selectedNodeId, isInspectorOpen, setSelectedNodeId } = useFlowStore();
  
  const details = selectedNodeId ? nodeDetails[selectedNodeId] : null;
  const nodeLabel = selectedNodeId?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <AnimatePresence>
      {isInspectorOpen && selectedNodeId && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-[380px] h-full border-l border-border bg-card/95 backdrop-blur-sm flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-node-running animate-pulse-subtle" />
              <h2 className="text-sm font-semibold text-foreground">{nodeLabel}</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSelectedNodeId(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {details && (
              <>
                {/* What this node does */}
                <Section
                  icon={<Zap className="w-4 h-4 text-exec-active" />}
                  title="What this does"
                >
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {details.whatItDoes}
                  </p>
                </Section>

                {/* Why it exists */}
                <Section
                  icon={<GitCommit className="w-4 h-4 text-muted-foreground" />}
                  title="Why it exists"
                >
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {details.whyItExists}
                  </p>
                </Section>

                {/* Risks */}
                {details.risks.length > 0 && (
                  <Section
                    icon={<AlertTriangle className="w-4 h-4 text-node-warning" />}
                    title="Detected Risks"
                  >
                    <div className="space-y-2">
                      {details.risks.map((risk, i) => (
                        <div 
                          key={i}
                          className="flex items-start gap-2 p-2 rounded bg-node-warning/10 border border-node-warning/30"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-node-warning mt-0.5 shrink-0" />
                          <span className="text-xs text-foreground">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Security Impact */}
                <Section
                  icon={<Shield className="w-4 h-4 text-ai-primary" />}
                  title="Security Impact"
                >
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-xs',
                      details.securityImpact.startsWith('Critical') && 'border-sec-critical text-sec-critical',
                      details.securityImpact.startsWith('High') && 'border-sec-warning text-sec-warning',
                      details.securityImpact.startsWith('Medium') && 'border-muted-foreground text-muted-foreground',
                      details.securityImpact.startsWith('Low') && 'border-sec-safe text-sec-safe',
                    )}
                  >
                    {details.securityImpact}
                  </Badge>
                </Section>

                {/* AI Insight */}
                <Section
                  icon={<Brain className="w-4 h-4 text-ai-primary" />}
                  title="AI Insight"
                  highlight
                >
                  <p className="text-sm text-foreground leading-relaxed">
                    {details.aiRecommendation}
                  </p>
                </Section>

                {/* Last Change */}
                {details.lastChange && (
                  <Section
                    icon={<Clock className="w-4 h-4 text-muted-foreground" />}
                    title="Last Change"
                  >
                    <p className="text-xs text-muted-foreground">
                      {details.lastChange}
                    </p>
                  </Section>
                )}
              </>
            )}
          </div>

          {/* Actions Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Rollback
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                <GitBranch className="w-3.5 h-3.5 mr-1.5" />
                Branch
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                <Pause className="w-3.5 h-3.5 mr-1.5" />
                Pause
              </Button>
              <Button variant="default" size="sm" className="flex-1 text-xs">
                <Play className="w-3.5 h-3.5 mr-1.5" />
                Resume
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}

const Section = ({ icon, title, children, highlight }: SectionProps) => (
  <div className={cn(
    'space-y-2',
    highlight && 'p-3 rounded-md bg-ai-primary/5 border border-ai-primary/20'
  )}>
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
    </div>
    {children}
  </div>
);

export default InspectorPanel;
