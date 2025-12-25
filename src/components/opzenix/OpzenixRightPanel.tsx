import { motion } from 'framer-motion';
import {
  Activity,
  Bell,
  Clock,
  FileText,
  RefreshCw,
  TrendingUp,
  Users,
  GitCommit,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// ============================================
// 📊 OPZENIX RIGHT PANEL (Activity & Insights)
// ============================================

interface OpzenixRightPanelProps {
  recentActivity?: any[];
  systemHealth?: {
    status: string;
    uptime: string;
    lastIncident?: string;
  };
  teamMembers?: any[];
  onRefresh?: () => void;
}

export function OpzenixRightPanel({
  recentActivity = [],
  systemHealth = { status: 'healthy', uptime: '99.9%' },
  teamMembers = [],
  onRefresh,
}: OpzenixRightPanelProps) {
  // Mock data for demonstration
  const mockActivity = recentActivity.length > 0 ? recentActivity : [
    { id: '1', type: 'deploy', message: 'Deployed v2.1.4 to staging', user: 'alice@example.com', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), status: 'success' },
    { id: '2', type: 'approval', message: 'Approved prod deployment', user: 'bob@example.com', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), status: 'success' },
    { id: '3', type: 'ci', message: 'CI pipeline completed', user: 'system', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), status: 'success' },
    { id: '4', type: 'alert', message: 'Security scan found 2 issues', user: 'security-bot', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), status: 'warning' },
    { id: '5', type: 'rollback', message: 'Rollback initiated for dev', user: 'charlie@example.com', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), status: 'info' },
  ];

  const mockTeam = teamMembers.length > 0 ? teamMembers : [
    { id: '1', name: 'Alice Chen', role: 'Platform Lead', status: 'online', avatar: 'AC' },
    { id: '2', name: 'Bob Smith', role: 'SRE', status: 'online', avatar: 'BS' },
    { id: '3', name: 'Charlie Kim', role: 'DevOps Eng', status: 'away', avatar: 'CK' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deploy': return <TrendingUp className="w-3.5 h-3.5" />;
      case 'approval': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'ci': return <GitCommit className="w-3.5 h-3.5" />;
      case 'alert': return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'rollback': return <RefreshCw className="w-3.5 h-3.5" />;
      default: return <Activity className="w-3.5 h-3.5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-sec-safe bg-sec-safe/10';
      case 'warning': return 'text-sec-warning bg-sec-warning/10';
      case 'error': return 'text-sec-danger bg-sec-danger/10';
      default: return 'text-muted-foreground bg-muted/50';
    }
  };

  return (
    <aside className="w-80 border-l border-border bg-card/30 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Activity</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* System Status */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className={cn(
                'w-2 h-2 rounded-full',
                systemHealth.status === 'healthy' ? 'bg-sec-safe animate-pulse' : 'bg-sec-warning'
              )} />
              <span className="text-xs font-medium text-foreground">System Status</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg border border-border bg-background">
                <p className="text-[10px] text-muted-foreground uppercase">Status</p>
                <p className="text-sm font-semibold text-sec-safe capitalize">{systemHealth.status}</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-background">
                <p className="text-[10px] text-muted-foreground uppercase">Uptime</p>
                <p className="text-sm font-semibold text-foreground">{systemHealth.uptime}</p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Recent Activity Feed */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Recent Activity</span>
              </div>
              <Badge variant="secondary" className="text-[10px]">{mockActivity.length}</Badge>
            </div>
            <div className="space-y-2">
              {mockActivity.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                      getStatusColor(item.status)
                    )}>
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground line-clamp-2">{item.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground truncate">{item.user}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDistanceToNow(new Date(item.timestamp))} ago
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Team Online */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Team Online</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {mockTeam.filter(m => m.status === 'online').length} active
              </Badge>
            </div>
            <div className="space-y-2">
              {mockTeam.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {member.avatar}
                    </div>
                    <div className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                      member.status === 'online' ? 'bg-sec-safe' : 'bg-sec-warning'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{member.name}</p>
                    <p className="text-[10px] text-muted-foreground">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Quick Stats */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Today's Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Deployments" value="12" trend="+3" positive />
              <StatCard label="Rollbacks" value="1" trend="-2" positive />
              <StatCard label="Approvals" value="8" trend="+5" positive />
              <StatCard label="Incidents" value="0" trend="0" positive />
            </div>
          </section>
        </div>
      </ScrollArea>
    </aside>
  );
}

function StatCard({ 
  label, 
  value, 
  trend, 
  positive 
}: { 
  label: string; 
  value: string; 
  trend: string; 
  positive: boolean;
}) {
  return (
    <div className="p-3 rounded-lg border border-border bg-background">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <div className="flex items-end justify-between mt-1">
        <span className="text-lg font-bold text-foreground">{value}</span>
        <span className={cn(
          'text-[10px] font-medium',
          positive ? 'text-sec-safe' : 'text-sec-danger'
        )}>
          {trend}
        </span>
      </div>
    </div>
  );
}

export default OpzenixRightPanel;
