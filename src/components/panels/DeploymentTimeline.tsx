import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertTriangle, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFlowStore, Deployment } from '@/stores/flowStore';
import { cn } from '@/lib/utils';

const DeploymentTimeline = () => {
  const { isTimelineOpen, setTimelineOpen, deployments } = useFlowStore();

  const sortedDeployments = useMemo(() => {
    return [...deployments].sort((a, b) => 
      new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()
    );
  }, [deployments]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-sec-safe" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-sec-critical" />;
      case 'running':
        return <Clock className="w-4 h-4 text-node-running animate-pulse-subtle" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-sec-warning" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-sec-safe';
      case 'failed': return 'bg-sec-critical';
      case 'running': return 'bg-node-running';
      case 'warning': return 'bg-sec-warning';
      default: return 'bg-muted';
    }
  };

  return (
    <AnimatePresence>
      {isTimelineOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setTimelineOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-3xl h-[80vh] bg-card border border-border rounded-lg shadow-xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-ai-primary" />
                <h2 className="text-lg font-semibold text-foreground">Deployment Timeline</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTimelineOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Timeline Content */}
            <ScrollArea className="flex-1 p-4">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

                {/* Deployment Items */}
                <div className="space-y-4">
                  {sortedDeployments.map((deployment, index) => (
                    <TimelineItem
                      key={deployment.id}
                      deployment={deployment}
                      isLatest={index === 0}
                      formatDate={formatDate}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              </div>
            </ScrollArea>

            {/* Legend */}
            <div className="p-4 border-t border-border flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sec-safe" />
                <span className="text-muted-foreground">Successful</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sec-critical" />
                <span className="text-muted-foreground">Failed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-node-running" />
                <span className="text-muted-foreground">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-sec-warning" />
                <span className="text-muted-foreground">Incident</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface TimelineItemProps {
  deployment: Deployment;
  isLatest: boolean;
  formatDate: (date: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}

const TimelineItem = ({ deployment, isLatest, formatDate, getStatusIcon, getStatusColor }: TimelineItemProps) => {
  return (
    <div className="relative flex gap-4 pl-12">
      {/* Status Dot */}
      <div className={cn(
        'absolute left-4 w-4 h-4 rounded-full border-2 border-card',
        getStatusColor(deployment.status),
        isLatest && 'ring-2 ring-offset-2 ring-offset-card ring-primary'
      )} />

      {/* Content */}
      <div className={cn(
        'flex-1 p-3 rounded-lg border transition-colors',
        deployment.status === 'failed' 
          ? 'bg-sec-critical/5 border-sec-critical/30' 
          : 'bg-secondary/30 border-border',
        isLatest && 'border-primary/30'
      )}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(deployment.status)}
              <span className="font-mono text-sm font-semibold text-foreground">
                {deployment.version}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-secondary text-muted-foreground rounded">
                {deployment.environment}
              </span>
              {isLatest && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-primary/20 text-primary rounded">
                  Latest
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(deployment.deployedAt)}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {deployment.incidentId && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-sec-warning">
                <AlertTriangle className="w-3 h-3" />
                {deployment.incidentId}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <RotateCcw className="w-3 h-3" />
              Rollback
            </Button>
          </div>
        </div>

        {deployment.notes && (
          <p className="mt-2 text-xs text-muted-foreground">
            {deployment.notes}
          </p>
        )}
      </div>
    </div>
  );
};

export default DeploymentTimeline;
