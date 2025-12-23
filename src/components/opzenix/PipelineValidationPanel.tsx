import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, AlertTriangle, XCircle, Shield, Loader2,
  Play, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Node, Edge } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface ValidationResult {
  category: string;
  checks: {
    name: string;
    status: 'passed' | 'failed' | 'warning' | 'pending';
    message?: string;
  }[];
}

interface PipelineValidationPanelProps {
  nodes?: Node[];
  edges?: Edge[];
  config?: any;
  onValidationComplete?: (passed: boolean) => void;
  onExecute?: () => void;
}

const mockValidationResults: ValidationResult[] = [
  {
    category: 'Structural Validation',
    checks: [
      { name: 'All required stages present', status: 'passed' },
      { name: 'Correct stage ordering', status: 'passed' },
      { name: 'Strategy-compatible nodes', status: 'passed' },
    ]
  },
  {
    category: 'Policy Validation',
    checks: [
      { name: 'Security gates attached', status: 'passed' },
      { name: 'Approval rules enforced', status: 'passed' },
      { name: 'Environment compliance', status: 'passed' },
    ]
  },
  {
    category: 'Execution Validation',
    checks: [
      { name: 'Runners available', status: 'passed' },
      { name: 'Credentials valid', status: 'passed' },
      { name: 'Targets reachable', status: 'passed' },
    ]
  },
  {
    category: 'Observability Validation',
    checks: [
      { name: 'Logs configuration', status: 'passed' },
      { name: 'Metrics available', status: 'passed' },
      { name: 'Checkpoints created', status: 'passed' },
    ]
  },
  {
    category: 'UX Validation',
    checks: [
      { name: 'Flow is readable', status: 'passed' },
      { name: 'No hidden steps', status: 'passed' },
      { name: 'Deterministic layout', status: 'passed' },
    ]
  },
];

const statusIcons = {
  passed: CheckCircle2,
  failed: XCircle,
  warning: AlertTriangle,
  pending: Loader2,
};

const statusColors = {
  passed: 'text-sec-safe',
  failed: 'text-sec-critical',
  warning: 'text-sec-warning',
  pending: 'text-muted-foreground',
};

const PipelineValidationPanel = ({ nodes, edges, config, onValidationComplete, onExecute }: PipelineValidationPanelProps) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentCategory, setCurrentCategory] = useState('');

  const runValidation = async () => {
    setIsValidating(true);
    setValidationResults([]);
    setProgress(0);

    for (let i = 0; i < mockValidationResults.length; i++) {
      setCurrentCategory(mockValidationResults[i].category);
      await new Promise(r => setTimeout(r, 600));
      setProgress(((i + 1) / mockValidationResults.length) * 100);
      setValidationResults(prev => [...prev, mockValidationResults[i]]);
    }

    setIsValidating(false);
    setCurrentCategory('');
    
    const allPassed = mockValidationResults.every(cat => 
      cat.checks.every(check => check.status === 'passed')
    );
    onValidationComplete?.(allPassed);
  };

  const totalChecks = validationResults.reduce((sum, cat) => sum + cat.checks.length, 0);
  const passedChecks = validationResults.reduce((sum, cat) => 
    sum + cat.checks.filter(c => c.status === 'passed').length, 0
  );
  const failedChecks = validationResults.reduce((sum, cat) => 
    sum + cat.checks.filter(c => c.status === 'failed').length, 0
  );

  const allPassed = validationResults.length === mockValidationResults.length && failedChecks === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-card border border-border rounded-lg space-y-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-ai-primary" />
        <h3 className="text-sm font-medium text-foreground">Pipeline Validation</h3>
        {nodes && nodes.length > 0 && (
          <span className="text-xs text-muted-foreground">
            ({nodes.length} nodes, {edges?.length || 0} edges)
          </span>
        )}
      </div>

      {/* Validation Progress */}
      {isValidating && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{currentCategory}</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Results */}
      {validationResults.length > 0 && (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {validationResults.map((category, idx) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-1.5"
            >
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {category.category}
              </p>
              <div className="space-y-1">
                {category.checks.map((check) => {
                  const StatusIcon = statusIcons[check.status];
                  return (
                    <div key={check.name} className="flex items-center gap-2 p-1.5 rounded bg-secondary/20">
                      <StatusIcon className={cn(
                        "w-3.5 h-3.5 shrink-0",
                        statusColors[check.status],
                        check.status === 'pending' && 'animate-spin'
                      )} />
                      <span className="text-xs text-foreground flex-1">{check.name}</span>
                      {check.message && (
                        <span className="text-[10px] text-muted-foreground">{check.message}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary */}
      {validationResults.length === mockValidationResults.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "p-3 rounded-lg border",
            allPassed ? "bg-sec-safe/10 border-sec-safe/30" : "bg-sec-critical/10 border-sec-critical/30"
          )}
        >
          <div className="flex items-center gap-2">
            {allPassed ? (
              <CheckCircle2 className="w-5 h-5 text-sec-safe" />
            ) : (
              <XCircle className="w-5 h-5 text-sec-critical" />
            )}
            <div>
              <p className={cn("text-sm font-medium", allPassed ? "text-sec-safe" : "text-sec-critical")}>
                {allPassed ? 'All Validations Passed' : 'Validation Failed'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {passedChecks}/{totalChecks} checks passed
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {validationResults.length === 0 ? (
          <Button onClick={runValidation} disabled={isValidating} className="w-full gap-2">
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Run Validation
              </>
            )}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={runValidation} className="gap-1">
              <Shield className="w-4 h-4" />
              Re-validate
            </Button>
            {onExecute && (
              <Button 
                onClick={onExecute} 
                disabled={!allPassed}
                className="flex-1 gap-2"
              >
                <Play className="w-4 h-4" />
                Execute Pipeline
              </Button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default PipelineValidationPanel;
