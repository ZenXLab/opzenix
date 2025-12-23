import { motion } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, AlertTriangle, RotateCcw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlowStore } from '@/stores/flowStore';
import { cn } from '@/lib/utils';

const RecentDeploymentsCard = () => {
  const { deployments, setTimelineOpen } = useFlowStore();
  
  const recentDeployments = [...deployments]
    .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime())
    .slice(0, 5);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-sec-safe" />;
      case 'failed': return <XCircle className="w-4 h-4 text-sec-critical" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-sec-warning" />;
      default: return <Clock className="w-4 h-4 text-node-running animate-pulse" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-card border border-border rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-ai-primary" />
          <h3 className="text-sm font-medium text-foreground">Recent Deployments</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setTimelineOpen(true)}>
          Timeline
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>

      {/* Deployments List */}
      <div className="divide-y divide-border">
        {recentDeployments.map((deployment) => (
          <div
            key={deployment.id}
            className="p-3 flex items-center justify-between hover:bg-secondary/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(deployment.status)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-foreground">{deployment.version}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                    {deployment.environment}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{formatTime(deployment.deployedAt)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {deployment.incidentId && (
                <span className="text-xs text-sec-warning font-mono">{deployment.incidentId}</span>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default RecentDeploymentsCard;
