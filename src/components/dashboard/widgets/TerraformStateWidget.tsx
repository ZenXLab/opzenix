import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  GitBranch,
  FileCode,
  Cloud,
  Database,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TerraformWorkspace {
  name: string;
  environment: string;
  status: 'applied' | 'pending' | 'error' | 'drift';
  resourceCount: number;
  lastApplied: string;
  stateVersion: string;
  changes?: { add: number; change: number; destroy: number };
}

interface TerraformStateWidgetProps {
  onRemove?: () => void;
}

export const TerraformStateWidget = ({ onRemove }: TerraformStateWidgetProps) => {
  const [workspaces, setWorkspaces] = useState<TerraformWorkspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockWorkspaces: TerraformWorkspace[] = [
      {
        name: 'production',
        environment: 'prod',
        status: 'applied',
        resourceCount: 127,
        lastApplied: '2 hours ago',
        stateVersion: 'v42',
      },
      {
        name: 'staging',
        environment: 'staging',
        status: 'pending',
        resourceCount: 89,
        lastApplied: '6 hours ago',
        stateVersion: 'v38',
        changes: { add: 3, change: 2, destroy: 0 },
      },
      {
        name: 'development',
        environment: 'dev',
        status: 'drift',
        resourceCount: 45,
        lastApplied: '1 day ago',
        stateVersion: 'v56',
        changes: { add: 0, change: 5, destroy: 1 },
      },
    ];

    setTimeout(() => {
      setWorkspaces(mockWorkspaces);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusIcon = (status: TerraformWorkspace['status']) => {
    switch (status) {
      case 'applied':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'pending':
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
      case 'drift':
        return <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />;
    }
  };

  const getStatusBadge = (status: TerraformWorkspace['status']) => {
    const styles = {
      applied: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      pending: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      error: 'bg-red-500/10 text-red-500 border-red-500/30',
      drift: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    };
    return styles[status];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Infrastructure State</span>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {workspaces.reduce((acc, w) => acc + w.resourceCount, 0)} resources
        </Badge>
      </div>

      {/* Workspace List */}
      <div className="space-y-2">
        {workspaces.map((workspace) => (
          <motion.div
            key={workspace.name}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2.5 rounded-lg bg-muted/30 border border-border space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(workspace.status)}
                <span className="text-sm font-medium text-foreground">{workspace.name}</span>
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                  {workspace.environment.toUpperCase()}
                </Badge>
              </div>
              <Badge variant="outline" className={cn('text-[9px]', getStatusBadge(workspace.status))}>
                {workspace.status.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                {workspace.resourceCount} resources
              </span>
              <span className="flex items-center gap-1">
                <GitBranch className="w-3 h-3" />
                {workspace.stateVersion}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {workspace.lastApplied}
              </span>
            </div>

            {/* Pending Changes */}
            {workspace.changes && (
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground">Pending:</span>
                {workspace.changes.add > 0 && (
                  <span className="text-[10px] text-emerald-500">+{workspace.changes.add}</span>
                )}
                {workspace.changes.change > 0 && (
                  <span className="text-[10px] text-amber-500">~{workspace.changes.change}</span>
                )}
                {workspace.changes.destroy > 0 && (
                  <span className="text-[10px] text-red-500">-{workspace.changes.destroy}</span>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Resource Type Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-muted/30 border border-border text-center">
          <Cloud className="w-4 h-4 mx-auto text-blue-500 mb-1" />
          <p className="text-[10px] text-muted-foreground">Compute</p>
          <p className="text-sm font-semibold text-foreground">42</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/30 border border-border text-center">
          <Database className="w-4 h-4 mx-auto text-purple-500 mb-1" />
          <p className="text-[10px] text-muted-foreground">Storage</p>
          <p className="text-sm font-semibold text-foreground">28</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/30 border border-border text-center">
          <Shield className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
          <p className="text-[10px] text-muted-foreground">Security</p>
          <p className="text-sm font-semibold text-foreground">19</p>
        </div>
      </div>
    </div>
  );
};

export default TerraformStateWidget;
