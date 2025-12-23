import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Layers, Plus, X, ChevronRight, Shield, Clock, Users,
  AlertTriangle, Check, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface Environment {
  id: string;
  name: string;
  strategy: DeploymentStrategy;
  approvalRequired: boolean;
  approvers?: number;
  policies?: string[];
}

type DeploymentStrategy = 'rolling' | 'blue-green' | 'canary' | 'feature-toggle' | 'shadow';

interface EnvironmentStrategySelectorProps {
  environments?: Environment[];
  onChange?: (environments: Environment[]) => void;
  onConfigComplete?: (environments: Environment[]) => void;
}

const strategyInfo: Record<DeploymentStrategy, { label: string; description: string; icon: string; color: string }> = {
  'rolling': { label: 'Rolling', description: 'Gradual replacement of instances', icon: '🔄', color: 'text-ai-primary' },
  'blue-green': { label: 'Blue-Green', description: 'Full parallel environment swap', icon: '🔵🟢', color: 'text-sec-safe' },
  'canary': { label: 'Canary', description: 'Progressive traffic shift', icon: '🐤', color: 'text-sec-warning' },
  'feature-toggle': { label: 'Feature Toggle', description: 'Config-driven activation', icon: '🎚️', color: 'text-primary' },
  'shadow': { label: 'Shadow/Preview', description: 'Mirror traffic testing', icon: '👤', color: 'text-muted-foreground' },
};

const defaultEnvironments: Environment[] = [
  { id: 'dev', name: 'Development', strategy: 'rolling', approvalRequired: false, approvers: 0, policies: [] },
  { id: 'staging', name: 'Staging', strategy: 'canary', approvalRequired: true, approvers: 1, policies: ['security-scan'] },
  { id: 'prod', name: 'Production', strategy: 'blue-green', approvalRequired: true, approvers: 2, policies: ['security-scan', 'compliance-check'] },
];

const EnvironmentStrategySelector = ({ environments: externalEnvs, onChange, onConfigComplete }: EnvironmentStrategySelectorProps) => {
  const [environments, setEnvironments] = useState<Environment[]>(externalEnvs || defaultEnvironments);
  const [expandedEnv, setExpandedEnv] = useState<string | null>('staging');

  // Sync with external state
  useEffect(() => {
    if (externalEnvs) {
      setEnvironments(externalEnvs.map(env => ({
        ...env,
        approvers: env.approvers ?? 0,
        policies: env.policies ?? [],
      })));
    }
  }, [externalEnvs]);

  const handleStrategyChange = (envId: string, strategy: DeploymentStrategy) => {
    const updated = environments.map(env => 
      env.id === envId ? { ...env, strategy } : env
    );
    setEnvironments(updated);
    onChange?.(updated);
  };

  const handleApprovalChange = (envId: string, required: boolean) => {
    const updated = environments.map(env => 
      env.id === envId ? { ...env, approvalRequired: required, approvers: required ? Math.max(1, env.approvers || 0) : 0 } : env
    );
    setEnvironments(updated);
    onChange?.(updated);
  };

  const handleApproversChange = (envId: string, approvers: number) => {
    const updated = environments.map(env => 
      env.id === envId ? { ...env, approvers } : env
    );
    setEnvironments(updated);
    onChange?.(updated);
  };

  const addEnvironment = () => {
    const newEnv: Environment = {
      id: `env-${Date.now()}`,
      name: 'New Environment',
      strategy: 'rolling',
      approvalRequired: false,
      approvers: 0,
      policies: [],
    };
    const updated = [...environments, newEnv];
    setEnvironments(updated);
    setExpandedEnv(newEnv.id);
    onChange?.(updated);
  };

  const removeEnvironment = (envId: string) => {
    const updated = environments.filter(env => env.id !== envId);
    setEnvironments(updated);
    onChange?.(updated);
  };

  const getAIRecommendation = (env: Environment) => {
    if (env.name.toLowerCase().includes('prod')) {
      return env.strategy === 'blue-green' || env.strategy === 'canary' 
        ? null 
        : 'Consider Blue-Green or Canary for production safety';
    }
    return null;
  };

  const handleConfirm = () => {
    onConfigComplete?.(environments);
    onChange?.(environments);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-card border border-border rounded-lg space-y-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-ai-primary" />
          <h3 className="text-sm font-medium text-foreground">Environment & Strategy</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={addEnvironment} className="gap-1 h-7">
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>

      {/* Environment List */}
      <div className="space-y-2">
        {environments.map((env, index) => {
          const isExpanded = expandedEnv === env.id;
          const strategyConfig = strategyInfo[env.strategy];
          const recommendation = getAIRecommendation(env);

          return (
            <motion.div
              key={env.id}
              layout
              className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                isExpanded ? "border-primary/50 bg-primary/5" : "border-border"
              )}
            >
              {/* Header */}
              <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/20"
                onClick={() => setExpandedEnv(isExpanded ? null : env.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-90"
                    )} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{env.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className={cn("text-[10px] h-4", strategyConfig.color)}>
                        {strategyConfig.icon} {strategyConfig.label}
                      </Badge>
                      {env.approvalRequired && (
                        <Badge variant="outline" className="text-[10px] h-4">
                          <Users className="w-2.5 h-2.5 mr-0.5" /> {env.approvers || 1} approval
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {recommendation && (
                  <div className="flex items-center gap-1 text-sec-warning">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 pb-3 space-y-3 border-t border-border pt-3"
                >
                  {/* AI Recommendation */}
                  {recommendation && (
                    <div className="flex items-center gap-2 p-2 bg-sec-warning/10 rounded text-xs text-sec-warning">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {recommendation}
                    </div>
                  )}

                  {/* Strategy Selector */}
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1.5 block">Deployment Strategy</label>
                    <Select value={env.strategy} onValueChange={(v) => handleStrategyChange(env.id, v as DeploymentStrategy)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(strategyInfo).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              <span>{info.icon}</span>
                              <span>{info.label}</span>
                              <span className="text-muted-foreground text-[10px] hidden sm:inline">- {info.description}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Approval Settings */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={env.approvalRequired}
                        onCheckedChange={(checked) => handleApprovalChange(env.id, checked)}
                      />
                      <label className="text-xs text-muted-foreground">Require Approval</label>
                    </div>
                    {env.approvalRequired && (
                      <Select 
                        value={String(env.approvers || 1)} 
                        onValueChange={(v) => handleApproversChange(env.id, parseInt(v))}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} approver{n > 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Policy Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(env.policies || []).map(policy => (
                      <Badge key={policy} variant="secondary" className="text-[10px] gap-1">
                        <Shield className="w-2.5 h-2.5" />
                        {policy}
                      </Badge>
                    ))}
                    <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5">
                      <Plus className="w-2.5 h-2.5" />
                    </Button>
                  </div>

                  {/* Remove Button */}
                  {environments.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-7 text-xs"
                      onClick={() => removeEnvironment(env.id)}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Remove Environment
                    </Button>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Confirm Button - only show if using standalone mode */}
      {onConfigComplete && (
        <Button onClick={handleConfirm} className="w-full gap-2">
          <Check className="w-4 h-4" />
          Confirm Environments
        </Button>
      )}
    </motion.div>
  );
};

export default EnvironmentStrategySelector;
