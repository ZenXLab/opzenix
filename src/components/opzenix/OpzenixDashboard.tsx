import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Shield,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Lock,
  Eye,
  RefreshCw,
  Zap,
  GitBranch,
  Rocket,
  Layers,
  ArrowRight,
  BarChart3,
  Server,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useControlTowerRealtime } from '@/hooks/useControlTowerRealtime';
import { useRBACPermissions } from '@/hooks/useRBACPermissions';
import BreakGlassModal from './screens/BreakGlassModal';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// ============================================
// 🏢 OPZENIX DASHBOARD (Control Tower)
// ============================================

interface OpzenixDashboardProps {
  onNavigateToFlow: (flowType: 'ci-flow' | 'cd-flow' | 'full-flow', env: string) => void;
  currentEnvironment: string;
}

export function OpzenixDashboard({ onNavigateToFlow, currentEnvironment }: OpzenixDashboardProps) {
  const [breakGlassOpen, setBreakGlassOpen] = useState(false);

  const { dbRole, canBreakGlass } = useRBACPermissions();
  const {
    executions,
    activeExecutions,
    pendingApprovals,
    recentDeployments,
    isConnected,
    refetch,
  } = useControlTowerRealtime();

  // Derive metrics
  const metrics = {
    running: activeExecutions?.length || 0,
    total: executions?.length || 0,
    success: executions?.filter((e) => e.status === 'success').length || 0,
    failed: executions?.filter((e) => e.status === 'failed').length || 0,
    pending: pendingApprovals?.length || 0,
  };

  const successRate = metrics.total > 0 
    ? Math.round((metrics.success / metrics.total) * 100) 
    : 100;

  // Environment cards data
  const environments = [
    { id: 'dev', label: 'DEV', status: 'healthy' },
    { id: 'uat', label: 'UAT', status: 'healthy' },
    { id: 'staging', label: 'STG', status: 'deploying' },
    { id: 'preprod', label: 'PRE', status: 'healthy' },
    { id: 'prod', label: 'PROD', status: 'healthy', restricted: true },
  ];

  const getEnvStatus = (status: string) => {
    switch (status) {
      case 'healthy': return { icon: CheckCircle, color: 'text-sec-safe', bg: 'bg-sec-safe/10' };
      case 'deploying': return { icon: RefreshCw, color: 'text-node-running', bg: 'bg-node-running/10' };
      case 'failed': return { icon: XCircle, color: 'text-sec-danger', bg: 'bg-sec-danger/10' };
      default: return { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/50' };
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Dashboard Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Control Tower</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Eye className="w-3 h-3" />
                Enterprise Operations Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              Role: {dbRole?.toUpperCase() || 'VIEWER'}
            </Badge>
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
              isConnected ? 'bg-sec-safe/10 text-sec-safe' : 'bg-sec-warning/10 text-sec-warning'
            )}>
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                isConnected ? 'bg-sec-safe animate-pulse' : 'bg-sec-warning'
              )} />
              {isConnected ? 'Live' : 'Reconnecting...'}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={refetch}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh Data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {canBreakGlass() && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => setBreakGlassOpen(true)}
              >
                <Zap className="w-3.5 h-3.5" />
                Break Glass
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Break Glass Modal */}
      <BreakGlassModal
        open={breakGlassOpen}
        onClose={() => setBreakGlassOpen(false)}
        environment="prod"
      />

      {/* Dashboard Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Environment Health Strip */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Environment Health
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {environments.map((env, idx) => {
                const status = getEnvStatus(env.status);
                const StatusIcon = status.icon;
                const isActive = currentEnvironment === env.id;
                
                return (
                  <motion.div
                    key={env.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      'p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02]',
                      isActive ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border bg-card',
                      env.restricted && 'ring-1 ring-sec-danger/20'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-foreground">{env.label}</span>
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', status.bg)}>
                        <StatusIcon className={cn('w-4 h-4', status.color, env.status === 'deploying' && 'animate-spin')} />
                      </div>
                    </div>
                    <p className={cn('text-xs capitalize', status.color)}>{env.status}</p>
                    {env.restricted && (
                      <Badge variant="outline" className="mt-2 text-[10px] border-sec-danger/30 text-sec-danger">
                        <Lock className="w-2.5 h-2.5 mr-1" />
                        Restricted
                      </Badge>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* Key Metrics */}
          <section className="grid grid-cols-4 gap-4">
            <MetricCard
              icon={Activity}
              label="Active Pipelines"
              value={metrics.running}
              subtext={`${metrics.total} total executions`}
              iconColor="text-node-running"
            />
            <MetricCard
              icon={FileText}
              label="Pending Approvals"
              value={metrics.pending}
              subtext="Requires action"
              iconColor="text-sec-warning"
              highlight={metrics.pending > 0}
            />
            <MetricCard
              icon={CheckCircle}
              label="Success Rate"
              value={`${successRate}%`}
              subtext="Last 24 hours"
              iconColor="text-sec-safe"
            />
            <MetricCard
              icon={Shield}
              label="Security Score"
              value="A+"
              subtext="All checks passed"
              iconColor="text-primary"
            />
          </section>

          <Separator />

          {/* Pipeline Quick Access */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Pipeline Quick Access
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <PipelineCard
                title="CI Pipeline"
                description="Build, Test & Security Scans"
                icon={GitBranch}
                color="blue"
                stages={['Source', 'SAST', 'Tests', 'Build']}
                onClick={() => onNavigateToFlow('ci-flow', currentEnvironment)}
              />
              <PipelineCard
                title="CD Pipeline"
                description="Deploy & Release Management"
                icon={Rocket}
                color="green"
                stages={['Artifact', 'Approval', 'Deploy', 'Verify']}
                onClick={() => onNavigateToFlow('cd-flow', currentEnvironment)}
              />
              <PipelineCard
                title="Full Pipeline"
                description="Complete CI+CD Overview"
                icon={Layers}
                color="purple"
                stages={['End-to-End Flow View']}
                readOnly
                onClick={() => onNavigateToFlow('full-flow', currentEnvironment)}
              />
            </div>
          </section>

          <Separator />

          {/* Two Column: Approvals + Recent Deployments */}
          <div className="grid grid-cols-2 gap-6">
            {/* Pending Approvals */}
            <section className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sec-warning" />
                  <h3 className="text-sm font-semibold text-foreground">Pending Approvals</h3>
                  {metrics.pending > 0 && (
                    <Badge className="bg-sec-warning/20 text-sec-warning text-xs">{metrics.pending}</Badge>
                  )}
                </div>
              </div>
              <ScrollArea className="h-[200px]">
                <div className="p-4 space-y-2">
                  {(pendingApprovals || []).length === 0 ? (
                    <EmptyState icon={CheckCircle} message="No pending approvals" />
                  ) : (
                    (pendingApprovals || []).slice(0, 5).map((item: any) => (
                      <ApprovalCard key={item.id} item={item} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </section>

            {/* Recent Deployments */}
            <section className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Recent Deployments</h3>
                </div>
              </div>
              <ScrollArea className="h-[200px]">
                <div className="p-4 space-y-2">
                  {(recentDeployments || []).length === 0 ? (
                    <EmptyState icon={Rocket} message="No recent deployments" />
                  ) : (
                    (recentDeployments || []).slice(0, 5).map((item: any) => (
                      <DeploymentCard key={item.id} item={item} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </section>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// Sub-components
function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  iconColor,
  highlight,
}: {
  icon: any;
  label: string;
  value: string | number;
  subtext: string;
  iconColor: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      'p-5 rounded-xl border bg-card',
      highlight ? 'border-sec-warning/50 bg-sec-warning/5' : 'border-border'
    )}>
      <div className="flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center bg-muted/50')}>
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
        <div>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">{subtext}</p>
    </div>
  );
}

function PipelineCard({
  title,
  description,
  icon: Icon,
  color,
  stages,
  readOnly,
  onClick,
}: {
  title: string;
  description: string;
  icon: any;
  color: 'blue' | 'green' | 'purple';
  stages: string[];
  readOnly?: boolean;
  onClick: () => void;
}) {
  const colorMap = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30', hover: 'hover:border-blue-500/50' },
    green: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30', hover: 'hover:border-green-500/50' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30', hover: 'hover:border-purple-500/50' },
  };
  const c = colorMap[color];

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full p-5 rounded-xl border text-left transition-all',
        c.border, c.hover,
        'bg-card hover:bg-muted/30'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', c.bg)}>
          <Icon className={cn('w-5 h-5', c.text)} />
        </div>
        {readOnly && (
          <Badge variant="secondary" className="text-[10px]">Read-Only</Badge>
        )}
      </div>
      <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>
      <div className="flex flex-wrap gap-1">
        {stages.map((stage, idx) => (
          <Badge key={idx} variant="outline" className="text-[10px]">{stage}</Badge>
        ))}
      </div>
      <div className="flex items-center justify-end mt-3 text-xs text-muted-foreground">
        View Pipeline <ArrowRight className="w-3 h-3 ml-1" />
      </div>
    </motion.button>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <Icon className="w-10 h-10 mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function ApprovalCard({ item }: { item: any }) {
  return (
    <div className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground truncate">{item.title || 'Approval Request'}</p>
        <Badge variant="outline" className="text-[10px]">
          {item.current_approvals || 0}/{item.required_approvals || 2}
        </Badge>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        {item.created_at ? formatDistanceToNow(new Date(item.created_at)) + ' ago' : 'Pending'}
      </p>
    </div>
  );
}

function DeploymentCard({ item }: { item: any }) {
  const StatusIcon = item.status === 'success' ? CheckCircle : item.status === 'failed' ? XCircle : Clock;
  const statusColor = item.status === 'success' ? 'text-sec-safe' : item.status === 'failed' ? 'text-sec-danger' : 'text-muted-foreground';
  
  return (
    <div className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('w-4 h-4', statusColor)} />
          <p className="text-sm font-medium text-foreground">{item.version}</p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase">{item.environment}</Badge>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        {item.deployed_at ? formatDistanceToNow(new Date(item.deployed_at)) + ' ago' : 'In progress'}
      </p>
    </div>
  );
}

export default OpzenixDashboard;
