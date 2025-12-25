import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Users,
  MessageSquare,
  Timer,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Incident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  environment: string;
  duration: string;
  assignee: string;
  updatesCount: number;
  createdAt: string;
}

interface IncidentStats {
  open: number;
  investigating: number;
  resolved: number;
  mttr: number;
  trend: number;
}

interface IncidentManagementWidgetProps {
  id?: string;
  onRemove?: (id: string) => void;
}

export const IncidentManagementWidget = ({ id, onRemove }: IncidentManagementWidgetProps) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        // Fetch from deployments with incidents
        const { data: deployments } = await supabase
          .from('deployments')
          .select('*')
          .not('incident_id', 'is', null)
          .order('deployed_at', { ascending: false })
          .limit(5);

        if (deployments && deployments.length > 0) {
          setIncidents(
            deployments.map((d) => ({
              id: d.id,
              title: `Deployment incident - ${d.version}`,
              severity: 'high' as const,
              status: d.status === 'failed' ? 'investigating' : 'resolved',
              environment: d.environment,
              duration: '2h 15m',
              assignee: 'Platform Team',
              updatesCount: 3,
              createdAt: new Date(d.deployed_at).toLocaleString(),
            }))
          );
        } else {
          // Mock data
          setIncidents([
            {
              id: 'INC-001',
              title: 'API Gateway Latency Spike',
              severity: 'critical',
              status: 'investigating',
              environment: 'PROD',
              duration: '45m',
              assignee: 'SRE Team',
              updatesCount: 12,
              createdAt: '15 min ago',
            },
            {
              id: 'INC-002',
              title: 'Database Connection Pool Exhausted',
              severity: 'high',
              status: 'resolved',
              environment: 'PROD',
              duration: '2h 15m',
              assignee: 'DBA Team',
              updatesCount: 8,
              createdAt: '3 hours ago',
            },
            {
              id: 'INC-003',
              title: 'Memory Leak in Worker Service',
              severity: 'medium',
              status: 'open',
              environment: 'STAGING',
              duration: '1h 30m',
              assignee: 'Backend Team',
              updatesCount: 4,
              createdAt: '1 hour ago',
            },
          ]);
        }

        setStats({
          open: 2,
          investigating: 1,
          resolved: 45,
          mttr: 38,
          trend: -12,
        });
      } catch (error) {
        console.error('Failed to fetch incidents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  const getSeverityIcon = (severity: Incident['severity']) => {
    switch (severity) {
      case 'critical':
        return <Flame className="w-3.5 h-3.5 text-red-500" />;
      case 'high':
        return <AlertOctagon className="w-3.5 h-3.5 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case 'low':
        return <Clock className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: Incident['severity']) => {
    const styles = {
      critical: 'bg-red-500/10 text-red-500 border-red-500/30',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
      medium: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      low: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    };
    return styles[severity];
  };

  const getStatusBadge = (status: Incident['status']) => {
    const styles = {
      open: 'bg-red-500/10 text-red-500 border-red-500/30',
      investigating: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      resolved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      closed: 'bg-muted/30 text-muted-foreground border-muted/30',
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Incident Management</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-500">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{Math.abs(stats?.trend || 0)}% better</span>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
            <p className="text-lg font-bold text-red-500">{stats.open}</p>
            <p className="text-[9px] text-red-500/80 uppercase">Open</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
            <p className="text-lg font-bold text-amber-500">{stats.investigating}</p>
            <p className="text-[9px] text-amber-500/80 uppercase">Active</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
            <p className="text-lg font-bold text-emerald-500">{stats.resolved}</p>
            <p className="text-[9px] text-emerald-500/80 uppercase">Resolved</p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/30 text-center">
            <p className="text-lg font-bold text-primary">{stats.mttr}m</p>
            <p className="text-[9px] text-muted-foreground uppercase">MTTR</p>
          </div>
        </div>
      )}

      {/* Incident List */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Active Incidents</p>
        {incidents.map((incident) => (
          <motion.div
            key={incident.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'p-2.5 rounded-lg border',
              incident.severity === 'critical'
                ? 'bg-red-500/5 border-red-500/30'
                : 'bg-muted/30 border-border'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getSeverityIcon(incident.severity)}
                <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {incident.title}
                </span>
              </div>
              <Badge variant="outline" className={cn('text-[9px]', getStatusBadge(incident.status))}>
                {incident.status.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  {incident.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {incident.assignee}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {incident.updatesCount}
                </span>
              </div>
              <Badge variant="secondary" className="text-[9px] h-4">
                {incident.environment}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default IncidentManagementWidget;
