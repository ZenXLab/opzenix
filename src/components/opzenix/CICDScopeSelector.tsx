import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GitBranch, Rocket, Settings, Cloud, Server, 
  Check, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type CICDScope = 'ci-only' | 'ci-cd';
type CDEngine = 'opzenix' | 'external';
type DeployTarget = 'aws' | 'azure' | 'gcp' | 'on-prem' | 'custom';

interface ScopeConfig {
  ciOnly: boolean;
  cdEngine: 'opzenix' | 'external';
  target: string;
}

interface CICDScopeSelectorProps {
  config?: ScopeConfig;
  onChange?: (config: ScopeConfig) => void;
  onConfigComplete?: (scope: CICDScope, engine: CDEngine, target: DeployTarget) => void;
}

const targetConfigs: Record<DeployTarget, { label: string; icon: string; description: string }> = {
  aws: { label: 'AWS', icon: '🟠', description: 'Amazon Web Services' },
  azure: { label: 'Azure', icon: '🔵', description: 'Microsoft Azure' },
  gcp: { label: 'GCP', icon: '🔴', description: 'Google Cloud Platform' },
  'on-prem': { label: 'On-Premises', icon: '🏢', description: 'Self-hosted infrastructure' },
  custom: { label: 'Custom', icon: '⚙️', description: 'Custom server / other' },
};

const CICDScopeSelector = ({ config, onChange, onConfigComplete }: CICDScopeSelectorProps) => {
  const [scope, setScope] = useState<CICDScope>(config?.ciOnly ? 'ci-only' : 'ci-cd');
  const [engine, setEngine] = useState<CDEngine>(config?.cdEngine || 'opzenix');
  const [target, setTarget] = useState<DeployTarget>((config?.target as DeployTarget) || 'aws');
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState<Record<string, boolean>>({});

  // Sync with external config
  useEffect(() => {
    if (config) {
      setScope(config.ciOnly ? 'ci-only' : 'ci-cd');
      setEngine(config.cdEngine);
      setTarget((config.target as DeployTarget) || 'aws');
    }
  }, [config]);

  // Notify parent of changes
  useEffect(() => {
    onChange?.({
      ciOnly: scope === 'ci-only',
      cdEngine: engine,
      target,
    });
  }, [scope, engine, target, onChange]);

  const handleValidate = async (targetId: DeployTarget) => {
    setValidating(true);
    await new Promise(r => setTimeout(r, 1000));
    setValidated(prev => ({ ...prev, [targetId]: true }));
    setValidating(false);
  };

  const handleConfirm = () => {
    onConfigComplete?.(scope, engine, target);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-card border border-border rounded-lg space-y-4"
    >
      {/* CI/CD Scope */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-4 h-4 text-ai-primary" />
          <h3 className="text-sm font-medium text-foreground">CI/CD Scope</h3>
        </div>

        <RadioGroup value={scope} onValueChange={(v) => setScope(v as CICDScope)} className="grid grid-cols-2 gap-3">
          <Label
            htmlFor="ci-only"
            className={cn(
              "flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-all",
              scope === 'ci-only' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
          >
            <RadioGroupItem value="ci-only" id="ci-only" className="sr-only" />
            <GitBranch className={cn("w-6 h-6", scope === 'ci-only' ? "text-primary" : "text-muted-foreground")} />
            <span className="text-sm font-medium">CI Only</span>
            <span className="text-[10px] text-muted-foreground text-center">Build, test, and package only</span>
          </Label>

          <Label
            htmlFor="ci-cd"
            className={cn(
              "flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-all",
              scope === 'ci-cd' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
          >
            <RadioGroupItem value="ci-cd" id="ci-cd" className="sr-only" />
            <Rocket className={cn("w-6 h-6", scope === 'ci-cd' ? "text-primary" : "text-muted-foreground")} />
            <span className="text-sm font-medium">CI + CD</span>
            <span className="text-[10px] text-muted-foreground text-center">Full pipeline with deployment</span>
          </Label>
        </RadioGroup>
      </div>

      {/* CD Engine (only if CI+CD) */}
      {scope === 'ci-cd' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-4 h-4 text-ai-primary" />
            <h4 className="text-sm font-medium text-foreground">CD Engine</h4>
          </div>

          <RadioGroup value={engine} onValueChange={(v) => setEngine(v as CDEngine)} className="grid grid-cols-2 gap-3">
            <Label
              htmlFor="opzenix"
              className={cn(
                "flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all",
                engine === 'opzenix' ? "border-ai-primary bg-ai-primary/5" : "border-border hover:border-ai-primary/50"
              )}
            >
              <RadioGroupItem value="opzenix" id="opzenix" className="sr-only" />
              <div className="text-lg">⚡</div>
              <span className="text-xs font-medium">Opzenix Native</span>
              <Badge variant="outline" className="text-[9px] h-4 bg-ai-primary/10 text-ai-primary">Recommended</Badge>
            </Label>

            <Label
              htmlFor="external"
              className={cn(
                "flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all",
                engine === 'external' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
            >
              <RadioGroupItem value="external" id="external" className="sr-only" />
              <div className="text-lg">🔌</div>
              <span className="text-xs font-medium">External Tool</span>
              <span className="text-[9px] text-muted-foreground">ArgoCD, FluxCD, etc.</span>
            </Label>
          </RadioGroup>
        </motion.div>
      )}

      {/* Deployment Target (only if CI+CD) */}
      {scope === 'ci-cd' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="w-4 h-4 text-ai-primary" />
            <h4 className="text-sm font-medium text-foreground">Deployment Target</h4>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {Object.entries(targetConfigs).map(([key, config]) => {
              const isSelected = target === key;
              const isValidated = validated[key];

              return (
                <button
                  key={key}
                  onClick={() => setTarget(key as DeployTarget)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 border rounded-lg transition-all",
                    isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-[10px] font-medium">{config.label}</span>
                  {isValidated && <Check className="w-3 h-3 text-sec-safe" />}
                </button>
              );
            })}
          </div>

          {/* Validation */}
          <div className="mt-3 p-3 bg-secondary/20 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{targetConfigs[target].description}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => handleValidate(target)}
                disabled={validating}
              >
                {validating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : validated[target] ? (
                  <>
                    <Check className="w-3 h-3 text-sec-safe" />
                    Validated
                  </>
                ) : (
                  'Validate Connection'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Confirm - only show if using standalone mode */}
      {onConfigComplete && (
        <Button 
          onClick={handleConfirm} 
          className="w-full gap-2"
          disabled={scope === 'ci-cd' && !validated[target]}
        >
          <Check className="w-4 h-4" />
          {scope === 'ci-only' ? 'Configure CI Pipeline' : 'Configure Full Pipeline'}
        </Button>
      )}
    </motion.div>
  );
};

export default CICDScopeSelector;
