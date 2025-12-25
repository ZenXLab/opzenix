import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cloud,
  Server,
  Cpu,
  HardDrive,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ClusterData {
  name: string;
  region: string;
  status: 'healthy' | 'warning' | 'critical';
  nodes: { ready: number; total: number };
  pods: { running: number; pending: number; failed: number };
  cpu: number;
  memory: number;
  lastSync: string;
}

interface KubernetesClusterWidgetProps {
  onRemove?: () => void;
}

export const KubernetesClusterWidget = ({ onRemove }: KubernetesClusterWidgetProps) => {
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  // Mock data - in production, this would come from an edge function
  useEffect(() => {
    const mockClusters: ClusterData[] = [
      {
        name: 'prod-us-east-1',
        region: 'US East',
        status: 'healthy',
        nodes: { ready: 12, total: 12 },
        pods: { running: 156, pending: 2, failed: 0 },
        cpu: 68,
        memory: 74,
        lastSync: new Date().toISOString(),
      },
      {
        name: 'prod-eu-west-1',
        region: 'EU West',
        status: 'healthy',
        nodes: { ready: 8, total: 8 },
        pods: { running: 98, pending: 1, failed: 0 },
        cpu: 52,
        memory: 61,
        lastSync: new Date().toISOString(),
      },
      {
        name: 'staging-us-west-2',
        region: 'US West',
        status: 'warning',
        nodes: { ready: 4, total: 5 },
        pods: { running: 34, pending: 3, failed: 1 },
        cpu: 89,
        memory: 85,
        lastSync: new Date().toISOString(),
      },
    ];

    setTimeout(() => {
      setClusters(mockClusters);
      setSelectedCluster(mockClusters[0].name);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusIcon = (status: ClusterData['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case 'critical':
        return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    }
  };

  const getStatusColor = (status: ClusterData['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      case 'warning':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
    }
  };

  const activeCluster = clusters.find((c) => c.name === selectedCluster);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1">
      {/* Cluster Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {clusters.map((cluster) => (
          <button
            key={cluster.name}
            onClick={() => setSelectedCluster(cluster.name)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors',
              selectedCluster === cluster.name
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            {getStatusIcon(cluster.status)}
            <span className="font-medium">{cluster.name}</span>
          </button>
        ))}
      </div>

      {/* Selected Cluster Details */}
      {activeCluster && (
        <motion.div
          key={activeCluster.name}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{activeCluster.name}</span>
            </div>
            <Badge variant="outline" className={cn('text-[10px]', getStatusColor(activeCluster.status))}>
              {activeCluster.status.toUpperCase()}
            </Badge>
          </div>

          {/* Nodes & Pods */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-1.5 mb-1">
                <Server className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] uppercase text-muted-foreground">Nodes</span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {activeCluster.nodes.ready}/{activeCluster.nodes.total}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] uppercase text-muted-foreground">Pods</span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {activeCluster.pods.running}
                <span className="text-xs text-muted-foreground ml-1">running</span>
              </p>
            </div>
          </div>

          {/* Resource Usage */}
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Cpu className="w-3 h-3" />
                  CPU
                </span>
                <span className="font-medium text-foreground">{activeCluster.cpu}%</span>
              </div>
              <Progress value={activeCluster.cpu} className="h-1.5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <HardDrive className="w-3 h-3" />
                  Memory
                </span>
                <span className="font-medium text-foreground">{activeCluster.memory}%</span>
              </div>
              <Progress value={activeCluster.memory} className="h-1.5" />
            </div>
          </div>

          {/* Pod Status Breakdown */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Running: {activeCluster.pods.running}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Pending: {activeCluster.pods.pending}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Failed: {activeCluster.pods.failed}</span>
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default KubernetesClusterWidget;
