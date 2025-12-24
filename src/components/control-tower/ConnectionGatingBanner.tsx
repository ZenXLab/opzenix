import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  Shield,
  Github,
  Cloud,
  Package,
  Key,
  Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useConnectionGating, ConnectionType } from '@/hooks/useConnectionGating';

interface ConnectionGatingBannerProps {
  onOpenConnections?: () => void;
}

const connectionIcons: Record<ConnectionType, React.ElementType> = {
  github: Github,
  kubernetes: Cloud,
  registry: Package,
  vault: Key,
  otel: Activity,
};

const connectionLabels: Record<ConnectionType, string> = {
  github: 'GitHub',
  kubernetes: 'AKS',
  registry: 'ACR',
  vault: 'Vault',
  otel: 'OTel',
};

export const ConnectionGatingBanner = ({ onOpenConnections }: ConnectionGatingBannerProps) => {
  const { 
    canExecuteCI, 
    canExecuteCD, 
    canDeploy, 
    blockingReasons, 
    connectionHealth,
    loading 
  } = useConnectionGating();

  if (loading) return null;

  const allHealthy = canExecuteCI && canExecuteCD && canDeploy;
  const hasWarnings = connectionHealth.some(h => h.status === 'degraded');
  const hasCritical = !canExecuteCI || !canExecuteCD || !canDeploy;

  if (allHealthy && !hasWarnings) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border p-4 mb-4',
        hasCritical && 'bg-sec-critical/10 border-sec-critical/30',
        !hasCritical && hasWarnings && 'bg-sec-warning/10 border-sec-warning/30',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {hasCritical ? (
            <XCircle className="w-5 h-5 text-sec-critical mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-sec-warning mt-0.5" />
          )}
          <div>
            <h4 className={cn(
              'font-semibold text-sm',
              hasCritical ? 'text-sec-critical' : 'text-sec-warning'
            )}>
              {hasCritical ? 'Execution Blocked' : 'Limited Observability'}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-lg">
              {hasCritical 
                ? 'One or more required connections are not configured. Executions will be blocked until resolved.'
                : 'Deployments will proceed but with limited telemetry visibility.'}
            </p>
            
            {/* Connection Status Pills */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {connectionHealth.map(health => {
                const Icon = connectionIcons[health.type];
                return (
                  <Badge
                    key={health.type}
                    variant="outline"
                    className={cn(
                      'gap-1.5 text-xs',
                      health.status === 'healthy' && 'border-sec-safe/50 text-sec-safe',
                      health.status === 'degraded' && 'border-sec-warning/50 text-sec-warning',
                      health.status === 'failed' && 'border-sec-critical/50 text-sec-critical',
                      health.status === 'unknown' && 'border-muted-foreground/50 text-muted-foreground',
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {connectionLabels[health.type]}
                    {health.status === 'healthy' && <CheckCircle2 className="w-3 h-3" />}
                    {health.status === 'failed' && <XCircle className="w-3 h-3" />}
                    {health.status === 'degraded' && <AlertTriangle className="w-3 h-3" />}
                  </Badge>
                );
              })}
            </div>

            {/* Blocking Reasons */}
            {blockingReasons.length > 0 && (
              <ul className="mt-3 space-y-1">
                {blockingReasons.slice(0, 3).map((reason, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-sec-critical" />
                    {reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {onOpenConnections && (
          <Button 
            variant="outline" 
            size="sm" 
            className="shrink-0"
            onClick={onOpenConnections}
          >
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            Configure
          </Button>
        )}
      </div>

      {/* Gating Status Summary */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span className={cn(
            'w-2 h-2 rounded-full',
            canExecuteCI ? 'bg-sec-safe' : 'bg-sec-critical'
          )} />
          <span className="text-xs text-muted-foreground">CI</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'w-2 h-2 rounded-full',
            canExecuteCD ? 'bg-sec-safe' : 'bg-sec-critical'
          )} />
          <span className="text-xs text-muted-foreground">CD</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'w-2 h-2 rounded-full',
            canDeploy ? 'bg-sec-safe' : 'bg-sec-critical'
          )} />
          <span className="text-xs text-muted-foreground">Deploy</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ConnectionGatingBanner;
