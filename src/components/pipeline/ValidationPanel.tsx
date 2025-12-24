import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, CheckCircle2, XCircle, AlertCircle, Info,
  X, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ValidationResult, ValidationError, ValidationWarning } from '@/utils/pipelineValidation';
import { cn } from '@/lib/utils';

interface ValidationPanelProps {
  validation: ValidationResult | null;
  isValidating: boolean;
  onRevalidate: () => void;
  onClose: () => void;
  onHighlightNode?: (nodeId: string) => void;
}

const ValidationPanel = ({ 
  validation, 
  isValidating, 
  onRevalidate, 
  onClose,
  onHighlightNode 
}: ValidationPanelProps) => {
  if (!validation) return null;

  const { isValid, errors, warnings } = validation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[500px] max-w-[90vw] bg-card border border-border rounded-lg shadow-xl z-40"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle2 className="w-5 h-5 text-sec-safe" />
          ) : (
            <XCircle className="w-5 h-5 text-sec-critical" />
          )}
          <span className="text-sm font-medium text-foreground">
            Pipeline Validation
          </span>
          <Badge 
            variant={isValid ? 'default' : 'destructive'} 
            className={cn(
              "text-[10px]",
              isValid && "bg-sec-safe/20 text-sec-safe"
            )}
          >
            {isValid ? 'Valid' : `${errors.length} Error${errors.length !== 1 ? 's' : ''}`}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={onRevalidate}
            disabled={isValidating}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isValidating && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="max-h-[300px]">
        <div className="p-4 space-y-3">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-sec-critical uppercase tracking-wider">
                Errors ({errors.length})
              </p>
              {errors.map((error, idx) => (
                <ErrorItem 
                  key={idx} 
                  error={error} 
                  onHighlight={onHighlightNode}
                />
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-sec-warning uppercase tracking-wider">
                Warnings ({warnings.length})
              </p>
              {warnings.map((warning, idx) => (
                <WarningItem key={idx} warning={warning} />
              ))}
            </div>
          )}

          {/* All good message */}
          {isValid && errors.length === 0 && warnings.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-sec-safe/10 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-sec-safe" />
              <span className="text-sm text-foreground">
                Pipeline configuration is valid and ready to execute.
              </span>
            </div>
          )}

          {isValid && warnings.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-sec-warning/10 rounded-lg mt-3">
              <Info className="w-4 h-4 text-sec-warning" />
              <span className="text-xs text-muted-foreground">
                Pipeline can run but consider addressing the warnings above.
              </span>
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
};

const ErrorItem = ({ 
  error, 
  onHighlight 
}: { 
  error: ValidationError; 
  onHighlight?: (nodeId: string) => void;
}) => {
  const getIcon = () => {
    switch (error.type) {
      case 'cycle': return <RefreshCw className="w-3.5 h-3.5" />;
      case 'disconnected': return <AlertCircle className="w-3.5 h-3.5" />;
      case 'missing_required':
      case 'no_source':
      case 'no_deploy': return <XCircle className="w-3.5 h-3.5" />;
      case 'invalid_connection': return <AlertTriangle className="w-3.5 h-3.5" />;
      default: return <AlertCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex items-start gap-2 p-2 bg-sec-critical/10 border border-sec-critical/20 rounded-md">
      <div className="mt-0.5 text-sec-critical">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{error.message}</p>
        {error.nodeIds && error.nodeIds.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {error.nodeIds.slice(0, 5).map((nodeId) => (
              <button
                key={nodeId}
                onClick={() => onHighlight?.(nodeId)}
                className="text-[10px] px-1.5 py-0.5 bg-sec-critical/20 text-sec-critical rounded hover:bg-sec-critical/30 transition-colors"
              >
                {nodeId}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const WarningItem = ({ warning }: { warning: ValidationWarning }) => {
  return (
    <div className="flex items-start gap-2 p-2 bg-sec-warning/10 border border-sec-warning/20 rounded-md">
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-sec-warning" />
      <p className="text-sm text-foreground">{warning.message}</p>
    </div>
  );
};

export default ValidationPanel;
