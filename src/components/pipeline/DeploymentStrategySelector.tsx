import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, RefreshCw, Percent, ArrowRightLeft, 
  CheckCircle2, Info, Settings2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DeploymentStrategySelectorProps {
  value: string;
  onChange: (strategy: string, config: DeploymentConfig) => void;
  environment?: string;
}

interface DeploymentConfig {
  strategy: 'rolling' | 'blue-green' | 'canary';
  canaryPercentage?: number;
  canarySteps?: number[];
  blueGreenAutoPromote?: boolean;
  healthCheckInterval?: number;
  rollbackOnFailure?: boolean;
}

const strategies = [
  {
    id: 'rolling',
    name: 'Rolling Update',
    icon: RefreshCw,
    description: 'Gradually replace old pods with new ones',
    color: 'text-ai-primary',
    bgColor: 'bg-ai-primary/10',
    borderColor: 'border-ai-primary/30',
  },
  {
    id: 'blue-green',
    name: 'Blue-Green',
    icon: ArrowRightLeft,
    description: 'Deploy to idle environment, then switch traffic',
    color: 'text-sec-safe',
    bgColor: 'bg-sec-safe/10',
    borderColor: 'border-sec-safe/30',
  },
  {
    id: 'canary',
    name: 'Canary',
    icon: Percent,
    description: 'Gradually shift traffic to new version',
    color: 'text-sec-warning',
    bgColor: 'bg-sec-warning/10',
    borderColor: 'border-sec-warning/30',
  },
];

export function DeploymentStrategySelector({ 
  value, 
  onChange,
  environment = 'production'
}: DeploymentStrategySelectorProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string>(value || 'rolling');
  const [canaryPercentage, setCanaryPercentage] = useState(10);
  const [blueGreenAutoPromote, setBlueGreenAutoPromote] = useState(false);
  const [rollbackOnFailure, setRollbackOnFailure] = useState(true);

  const handleStrategyChange = (strategyId: string) => {
    setSelectedStrategy(strategyId);
    onChange(strategyId, {
      strategy: strategyId as DeploymentConfig['strategy'],
      canaryPercentage: strategyId === 'canary' ? canaryPercentage : undefined,
      blueGreenAutoPromote: strategyId === 'blue-green' ? blueGreenAutoPromote : undefined,
      rollbackOnFailure,
    });
  };

  const handleConfigChange = () => {
    onChange(selectedStrategy, {
      strategy: selectedStrategy as DeploymentConfig['strategy'],
      canaryPercentage: selectedStrategy === 'canary' ? canaryPercentage : undefined,
      blueGreenAutoPromote: selectedStrategy === 'blue-green' ? blueGreenAutoPromote : undefined,
      rollbackOnFailure,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          Deployment Strategy
        </Label>
        <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
          {environment}
        </span>
      </div>

      <RadioGroup
        value={selectedStrategy}
        onValueChange={handleStrategyChange}
        className="grid grid-cols-1 gap-3"
      >
        {strategies.map((strategy) => {
          const Icon = strategy.icon;
          const isSelected = selectedStrategy === strategy.id;
          
          return (
            <motion.div
              key={strategy.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Label
                htmlFor={strategy.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                  isSelected 
                    ? `${strategy.bgColor} ${strategy.borderColor} border-2` 
                    : "border-border hover:bg-secondary/50"
                )}
              >
                <RadioGroupItem value={strategy.id} id={strategy.id} className="mt-0.5" />
                <div className={cn(
                  "p-2 rounded-lg",
                  isSelected ? strategy.bgColor : "bg-secondary"
                )}>
                  <Icon className={cn("w-4 h-4", isSelected ? strategy.color : "text-muted-foreground")} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{strategy.name}</span>
                    {isSelected && (
                      <CheckCircle2 className={cn("w-4 h-4", strategy.color)} />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {strategy.description}
                  </p>
                </div>
              </Label>
            </motion.div>
          );
        })}
      </RadioGroup>

      {/* Strategy-specific configuration */}
      <AnimatePresence mode="wait">
        {selectedStrategy === 'canary' && (
          <motion.div
            key="canary-config"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-lg border border-sec-warning/30 bg-sec-warning/5 space-y-4"
          >
            <div className="flex items-center gap-2 text-sec-warning">
              <Percent className="w-4 h-4" />
              <span className="text-sm font-medium">Canary Configuration</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Initial Traffic</Label>
                <span className="text-sm font-mono font-medium">{canaryPercentage}%</span>
              </div>
              <Slider
                value={[canaryPercentage]}
                onValueChange={(v) => {
                  setCanaryPercentage(v[0]);
                  handleConfigChange();
                }}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>1%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 50].map((pct) => (
                <Button
                  key={pct}
                  variant={canaryPercentage === pct ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setCanaryPercentage(pct);
                    handleConfigChange();
                  }}
                >
                  {pct}%
                </Button>
              ))}
            </div>

            <div className="p-2 rounded bg-background/50 text-xs text-muted-foreground">
              <span className="text-sec-warning">Recommended:</span> Start with 5-10% and gradually increase after monitoring metrics.
            </div>
          </motion.div>
        )}

        {selectedStrategy === 'blue-green' && (
          <motion.div
            key="blue-green-config"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-lg border border-sec-safe/30 bg-sec-safe/5 space-y-4"
          >
            <div className="flex items-center gap-2 text-sec-safe">
              <ArrowRightLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Blue-Green Configuration</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Auto-promote on health check</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically switch traffic if green is healthy
                </p>
              </div>
              <Switch
                checked={blueGreenAutoPromote}
                onCheckedChange={(checked) => {
                  setBlueGreenAutoPromote(checked);
                  handleConfigChange();
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded bg-background/50">
              <div className="text-center p-3 rounded border border-ai-primary/30 bg-ai-primary/10">
                <div className="text-xs text-muted-foreground mb-1">Blue (Current)</div>
                <div className="text-lg font-bold text-ai-primary">100%</div>
              </div>
              <div className="text-center p-3 rounded border border-sec-safe/30 bg-sec-safe/10">
                <div className="text-xs text-muted-foreground mb-1">Green (New)</div>
                <div className="text-lg font-bold text-sec-safe">0%</div>
              </div>
            </div>
          </motion.div>
        )}

        {selectedStrategy === 'rolling' && (
          <motion.div
            key="rolling-config"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-lg border border-ai-primary/30 bg-ai-primary/5 space-y-4"
          >
            <div className="flex items-center gap-2 text-ai-primary">
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Rolling Update Configuration</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Max Unavailable</Label>
                <Input defaultValue="25%" className="bg-background h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Max Surge</Label>
                <Input defaultValue="25%" className="bg-background h-8 text-sm" />
              </div>
            </div>

            <div className="p-2 rounded bg-background/50 text-xs text-muted-foreground">
              Pods will be replaced gradually with zero downtime.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Common options */}
      <div className="pt-3 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Auto-rollback on failure</Label>
            <p className="text-xs text-muted-foreground">
              Revert to previous version if health checks fail
            </p>
          </div>
          <Switch
            checked={rollbackOnFailure}
            onCheckedChange={(checked) => {
              setRollbackOnFailure(checked);
              handleConfigChange();
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default DeploymentStrategySelector;
