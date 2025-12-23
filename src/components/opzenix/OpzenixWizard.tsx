import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, 
  Server, 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Node, Edge } from '@xyflow/react';
import RepositoryDetectionBlock from './RepositoryDetectionBlock';
import EnvironmentStrategySelector from './EnvironmentStrategySelector';
import CICDScopeSelector from './CICDScopeSelector';
import PipelineValidationPanel from './PipelineValidationPanel';
import { getLanguageTemplate, LanguageStack } from '@/data/languageTemplates';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OpzenixWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (nodes: Node[], edges: Edge[], config: WizardConfig) => void;
}

export interface WizardConfig {
  repository: {
    url: string;
    branch: string;
    language: LanguageStack | null;
    framework: string;
    buildTool: string;
  };
  environments: Array<{
    id: string;
    name: string;
    strategy: string;
    approvalRequired: boolean;
  }>;
  scope: {
    ciOnly: boolean;
    cdEngine: 'opzenix' | 'external';
    target: string;
  };
}

const steps = [
  { id: 'repo', title: 'Repository', subtitle: 'Connect & detect stack', icon: GitBranch },
  { id: 'env', title: 'Environments', subtitle: 'Configure deployment strategy', icon: Server },
  { id: 'scope', title: 'CI/CD Scope', subtitle: 'Define execution depth', icon: Play },
  { id: 'validate', title: 'Validation', subtitle: 'Verify pipeline', icon: CheckCircle2 },
];

const OpzenixWizard = ({ isOpen, onClose, onComplete }: OpzenixWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<WizardConfig>({
    repository: {
      url: '',
      branch: 'main',
      language: null,
      framework: '',
      buildTool: '',
    },
    environments: [
      { id: 'dev', name: 'Development', strategy: 'rolling', approvalRequired: false },
      { id: 'staging', name: 'Staging', strategy: 'canary', approvalRequired: true },
      { id: 'prod', name: 'Production', strategy: 'blue-green', approvalRequired: true },
    ],
    scope: {
      ciOnly: false,
      cdEngine: 'opzenix',
      target: 'aws',
    },
  });
  
  const [generatedNodes, setGeneratedNodes] = useState<Node[]>([]);
  const [generatedEdges, setGeneratedEdges] = useState<Edge[]>([]);

  const handleRepoChange = useCallback((repoConfig: WizardConfig['repository']) => {
    setConfig(prev => ({ ...prev, repository: repoConfig }));
    
    // Auto-generate pipeline based on detected language
    if (repoConfig.language) {
      const template = getLanguageTemplate(repoConfig.language);
      setGeneratedNodes(template.nodes);
      setGeneratedEdges(template.edges);
      toast.success(`Generated ${repoConfig.language} pipeline template`);
    }
  }, []);

  const handleEnvChange = useCallback((environments: WizardConfig['environments']) => {
    setConfig(prev => ({ ...prev, environments }));
  }, []);

  const handleScopeChange = useCallback((scope: WizardConfig['scope']) => {
    setConfig(prev => ({ ...prev, scope }));
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    onComplete(generatedNodes, generatedEdges, config);
    onClose();
    toast.success('Pipeline created successfully');
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <RepositoryDetectionBlock
            config={config.repository}
            onChange={handleRepoChange}
          />
        );
      case 1:
        return (
          <EnvironmentStrategySelector
            environments={config.environments as any}
            onChange={(envs) => handleEnvChange(envs.map(e => ({
              id: e.id,
              name: e.name,
              strategy: e.strategy,
              approvalRequired: e.approvalRequired,
            })))}
          />
        );
      case 2:
        return (
          <CICDScopeSelector
            config={config.scope}
            onChange={handleScopeChange}
          />
        );
      case 3:
        return (
          <PipelineValidationPanel
            nodes={generatedNodes}
            edges={generatedEdges}
            config={config}
            onValidationComplete={(passed) => {
              if (passed) {
                toast.success('All validations passed');
              }
            }}
            onExecute={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
    >
      {/* Header */}
      <div className="h-14 sm:h-16 border-b border-border bg-card/50 flex items-center justify-between px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 sm:w-6 h-5 sm:h-6 text-ai-primary" />
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Opzenix Pipeline Wizard</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Universal Execution Platform</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Progress */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-card/30">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3 overflow-x-auto pb-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className={cn(
                    "w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center transition-all",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && "bg-node-success text-background",
                    !isActive && !isCompleted && "bg-secondary text-muted-foreground"
                  )}>
                    {isCompleted ? <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5" /> : <Icon className="w-4 sm:w-5 h-4 sm:h-5" />}
                  </div>
                  <div className="hidden lg:block">
                    <p className={cn(
                      "text-sm font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground mx-1 sm:mx-2 hidden sm:block" />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="h-14 sm:h-16 border-t border-border bg-card/50 flex items-center justify-between px-4 sm:px-6 shrink-0">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </div>

        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext} className="gap-2">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} className="gap-2 bg-node-success hover:bg-node-success/90">
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Create Pipeline</span>
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default OpzenixWizard;
