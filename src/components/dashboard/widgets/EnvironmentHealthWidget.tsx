import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWidgetRealtime } from '@/hooks/useWidgetRealtime';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface EnvironmentHealthWidgetProps {
  id: string;
  onRemove: (id: string) => void;
}

const ENVIRONMENTS = ['dev', 'uat', 'staging', 'preprod', 'prod'] as const;

const ENV_LABELS: Record<string, string> = {
  dev: 'DEV',
  uat: 'UAT',
  staging: 'STAGING',
  preprod: 'PREPROD',
  prod: 'PROD',
};

interface EnvironmentStatus {
  name: string;
  status: 'healthy' | 'blocked' | 'failed' | 'deploying';
  lastDeployment?: string;
  version?: string;
}

export function EnvironmentHealthWidget({ id, onRemove }: EnvironmentHealthWidgetProps) {
  const { data, loading, lastUpdated, refresh } = useWidgetRealtime({
    widgetType: 'environment-health',
    refreshInterval: 30,
  });

  // Mock environment data (would come from real data in production)
  const environments: EnvironmentStatus[] = ENVIRONMENTS.map((env) => ({
    name: env,
    status: env === 'prod' ? 'healthy' : env === 'staging' ? 'deploying' : 'healthy',
    lastDeployment: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    version: `v1.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 100)}`,
  }));

  const getStatusIcon = (status: EnvironmentStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-sec-safe" />;
      case 'blocked':
        return <AlertTriangle className="w-4 h-4 text-sec-warning" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-sec-danger" />;
      case 'deploying':
        return <Clock className="w-4 h-4 text-node-running animate-pulse" />;
    }
  };

  const getStatusColor = (status: EnvironmentStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-sec-safe/10 text-sec-safe border-sec-safe/30';
      case 'blocked':
        return 'bg-sec-warning/10 text-sec-warning border-sec-warning/30';
      case 'failed':
        return 'bg-sec-danger/10 text-sec-danger border-sec-danger/30';
      case 'deploying':
        return 'bg-node-running/10 text-node-running border-node-running/30';
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Environment Health</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refresh}>
                <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {lastUpdated ? `Updated ${formatDistanceToNow(lastUpdated)} ago` : 'Refresh'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Environment Grid */}
      <div className="grid grid-cols-5 gap-2">
        {environments.map((env, idx) => (
          <motion.div
            key={env.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              'flex flex-col items-center p-2 rounded-lg border',
              getStatusColor(env.status)
            )}
          >
            {getStatusIcon(env.status)}
            <span className="text-xs font-semibold mt-1">{ENV_LABELS[env.name]}</span>
            {env.version && (
              <span className="text-[10px] opacity-70 mt-0.5">{env.version}</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Flow indicator */}
      <div className="flex items-center justify-center gap-1 text-muted-foreground">
        {ENVIRONMENTS.map((env, idx) => (
          <div key={env} className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            {idx < ENVIRONMENTS.length - 1 && (
              <div className="w-4 h-0.5 bg-muted-foreground/30" />
            )}
          </div>
        ))}
      </div>

      {/* Last update */}
      {lastUpdated && (
        <p className="text-[10px] text-muted-foreground text-center">
          Last updated {formatDistanceToNow(lastUpdated)} ago
        </p>
      )}
    </div>
  );
}

export default EnvironmentHealthWidget;
