import { ReactNode } from 'react';
import { 
  Link2, 
  Globe, 
  Play, 
  Github, 
  Cloud, 
  Shield,
  ArrowRight,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateGuidanceProps {
  type: 'connections' | 'environments' | 'executions';
  onAction?: () => void;
}

const EmptyStateGuidance = ({ type, onAction }: EmptyStateGuidanceProps) => {
  const configs = {
    connections: {
      icon: Link2,
      title: 'No connections configured',
      description: 'Connect your GitHub repositories, Kubernetes clusters, and secret vaults to start orchestrating deployments.',
      steps: [
        { icon: Github, text: 'Connect GitHub repository with GitHub App' },
        { icon: Cloud, text: 'Add Azure AKS or other Kubernetes cluster' },
        { icon: Shield, text: 'Configure Azure Key Vault for secrets' },
      ],
      actionText: 'Add First Connection',
      benefit: 'Once connected, Opzenix validates all integrations in real-time.',
    },
    environments: {
      icon: Globe,
      title: 'No environments configured',
      description: 'Define your deployment environments with governance rules, approval gates, and rollout strategies.',
      steps: [
        { icon: Globe, text: 'Create Development environment (no approval)' },
        { icon: Globe, text: 'Create Staging environment (optional approval)' },
        { icon: Shield, text: 'Create Production environment (mandatory approval)' },
      ],
      actionText: 'Create First Environment',
      benefit: 'Each environment enforces its own governance policies automatically.',
    },
    executions: {
      icon: Play,
      title: 'No active executions',
      description: 'Executions appear here when code is pushed to connected repositories. The flow is fully automated.',
      steps: [
        { icon: Github, text: 'Push code to a connected repository' },
        { icon: Play, text: 'Opzenix triggers the execution automatically' },
        { icon: CheckCircle2, text: 'Monitor progress and approve when needed' },
      ],
      actionText: 'View Connections',
      benefit: 'All executions are recorded with checkpoints for safe rollback.',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* Title & Description */}
      <h3 className="text-lg font-semibold text-foreground mb-2">{config.title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {config.description}
      </p>

      {/* Steps */}
      <div className="w-full max-w-sm space-y-3 mb-6">
        {config.steps.map((step, index) => {
          const StepIcon = step.icon;
          return (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 text-left"
            >
              <div className="w-8 h-8 rounded-md bg-background flex items-center justify-center flex-shrink-0">
                <StepIcon className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-foreground">{step.text}</span>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      {onAction && (
        <Button onClick={onAction} className="gap-2 mb-4">
          <Plus className="w-4 h-4" />
          {config.actionText}
        </Button>
      )}

      {/* Benefit Note */}
      <p className="text-xs text-muted-foreground italic max-w-sm">
        {config.benefit}
      </p>
    </div>
  );
};

export default EmptyStateGuidance;
