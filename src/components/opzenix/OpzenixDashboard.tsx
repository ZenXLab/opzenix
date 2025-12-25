import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Shield,
  FileText,
  CheckCircle,
  AlertTriangle,
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
  Settings2,
  Plus,
  Clock,
  Users,
  Database,
  Globe,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
// 🏢 OPZENIX DASHBOARD - Enterprise Control Tower
// ============================================

interface OpzenixDashboardProps {
  onNavigateToFlow: (flowType: 'ci-flow' | 'cd-flow' | 'full-flow', env: string) => void;
  currentEnvironment: string;
}

const ENVIRONMENT_CONFIG = {
  dev: { label: 'Development', color: 'bg-sec-safe', textColor: 'text-sec-safe' },
  uat: { label: 'UAT', color: 'bg-blue-500', textColor: 'text-blue-500' },
  staging: { label: 'Staging', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  preprod: { label: 'Pre-Production', color: 'bg-orange-500', textColor: 'text-orange-500' },
  prod: { label: 'Production', color: 'bg-sec-danger', textColor: 'text-sec-danger' },
};

export function OpzenixDashboard({ onNavigateToFlow, currentEnvironment }: OpzenixDashboardProps) {
  const [breakGlassOpen, setBreakGlassOpen] = useState(false);
  const { dbRole, isAdmin, canBreakGlass } = useRBACPermissions();

  const {
    executions,
    activeExecutions,
    pendingApprovals,
    recentDeployments,
    isConnected,
    refetch,
  } = useControlTowerRealtime();

  const metrics = {
    running: activeExecutions?.length || 0,
    total: executions?.length || 0,
    success: executions?.filter((e) => e.status === 'success').length || 0,
    failed: executions?.filter((e) => e.status === 'failed').length || 0,
    pending: pendingApprovals?.length || 0,
  };

  const successRate = metrics.total > 0 ? Math.round((metrics.success / metrics.total) * 100) : 100;
  const envConfig = ENVIRONMENT_CONFIG[currentEnvironment as keyof typeof ENVIRONMENT_CONFIG] || ENVIRONMENT_CONFIG.dev;
  const isProd = currentEnvironment === 'prod';

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Dashboard Header */}
      <header className={cn(
        'flex-shrink-0 border-b px-6 py-4',
        isProd ? 'border-sec-danger/30 bg-sec-danger/5' : 'border-border bg-card/30'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              isProd ? 'bg-sec-danger/10' : 'bg-primary/10'
            )}>
              <BarChart3 className={cn('w-5 h-5', isProd ? 'text-sec-danger' : 'text-primary')} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Control Tower</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn('w-2 h-2 rounded-full', envConfig.color)} />
                <span className={cn('text-sm font-medium', envConfig.textColor)}>
                  {envConfig.label} Environment
                </span>
                {isProd && (
                  <Badge variant="outline" className="text-[10px] border-sec-danger/50 text-sec-danger">
                    <Lock className="w-2.5 h-2.5 mr-1" />
                    Restricted
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs capitalize">
              {dbRole || 'viewer'}
            </Badge>
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
              isConnected ? 'bg-sec-safe/10 text-sec-safe' : 'bg-sec-warning/10 text-sec-warning'
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-sec-safe animate-pulse' : 'bg-sec-warning')} />
              {isConnected ? 'Live' : 'Reconnecting'}
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
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setBreakGlassOpen(true)}>
                <Zap className="w-3.5 h-3.5" />
                Break Glass
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Break Glass Modal */}
      <BreakGlassModal open={breakGlassOpen} onClose={() => setBreakGlassOpen(false)} environment={currentEnvironment} />

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Key Metrics Row */}
          <section className="grid grid-cols-5 gap-4">
            <MetricCard
              icon={Activity}
              label="Active Pipelines"
              value={metrics.running}
              trend={metrics.running > 0 ? 'up' : 'neutral'}
              color="text-node-running"
              bgColor="bg-node-running/10"
            />
            <MetricCard
              icon={FileText}
              label="Pending Approvals"
              value={metrics.pending}
              trend={metrics.pending > 0 ? 'attention' : 'neutral'}
              color="text-sec-warning"
              bgColor="bg-sec-warning/10"
            />
            <MetricCard
              icon={CheckCircle}
              label="Success Rate"
              value={`${successRate}%`}
              trend={successRate >= 90 ? 'up' : 'down'}
              color="text-sec-safe"
              bgColor="bg-sec-safe/10"
            />
            <MetricCard
              icon={AlertTriangle}
              label="Failed"
              value={metrics.failed}
              trend={metrics.failed > 0 ? 'down' : 'neutral'}
              color="text-sec-danger"
              bgColor="bg-sec-danger/10"
            />
            <MetricCard
              icon={Shield}
              label="Security Score"
              value="A+"
              trend="up"
              color="text-primary"
              bgColor="bg-primary/10"
            />
          </section>

          {/* Pipeline Quick Access */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Pipeline Access
              </h2>
              <Badge variant="outline" className="text-[10px]">{currentEnvironment.toUpperCase()}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <PipelineCard
                title="CI Pipeline"
                description="Build, Test, Scan, Package"
                icon={GitBranch}
                status="healthy"
                stages={8}
                color="blue"
                onClick={() => onNavigateToFlow('ci-flow', currentEnvironment)}
              />
              <PipelineCard
                title="CD Pipeline"
                description="Deploy, Verify, Monitor"
                icon={Rocket}
                status={isProd ? 'gated' : 'healthy'}
                stages={7}
                color="green"
                onClick={() => onNavigateToFlow('cd-flow', currentEnvironment)}
              />
              <PipelineCard
                title="Full Flow View"
                description="End-to-End Pipeline"
                icon={Layers}
                status="readonly"
                stages={15}
                color="purple"
                onClick={() => onNavigateToFlow('full-flow', currentEnvironment)}
              />
            </div>
          </section>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Pending Approvals */}
            <section className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sec-warning" />
                  Pending Approvals
                </h2>
                {metrics.pending > 0 && (
                  <Badge className="bg-sec-warning/20 text-sec-warning text-xs">{metrics.pending}</Badge>
                )}
              </div>
              {pendingApprovals && pendingApprovals.length > 0 ? (
                <div className="space-y-3">
                  {pendingApprovals.slice(0, 4).map((approval: any) => (
                    <ApprovalItem key={approval.id} approval={approval} />
                  ))}
                </div>
              ) : (
                <EmptyState icon={CheckCircle} message="No pending approvals" />
              )}
            </section>

            {/* Recent Deployments */}
            <section className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-primary" />
                  Recent Deployments
                </h2>
                <Button variant="ghost" size="sm" className="text-xs h-7">View All</Button>
              </div>
              {recentDeployments && recentDeployments.length > 0 ? (
                <div className="space-y-3">
                  {recentDeployments.slice(0, 4).map((deployment: any) => (
                    <DeploymentItem key={deployment.id} deployment={deployment} />
                  ))}
                </div>
              ) : (
                <EmptyState icon={Rocket} message="No recent deployments" />
              )}
            </section>
          </div>

          {/* Environment Health Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                Environment Health
              </h2>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(ENVIRONMENT_CONFIG).map(([envId, config]) => (
                <EnvironmentHealthCard
                  key={envId}
                  envId={envId}
                  label={config.label}
                  color={config.color}
                  isActive={currentEnvironment === envId}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
  bgColor,
}: {
  icon: any;
  label: string;
  value: string | number;
  trend: 'up' | 'down' | 'neutral' | 'attention';
  color: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', bgColor)}>
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      <div className={cn(
        'w-full h-1 rounded-full mt-3',
        trend === 'up' ? 'bg-sec-safe' :
        trend === 'down' ? 'bg-sec-danger' :
        trend === 'attention' ? 'bg-sec-warning' :
        'bg-muted'
      )} />
    </div>
  );
}

function PipelineCard({
  title,
  description,
  icon: Icon,
  status,
  stages,
  color,
  onClick,
}: {
  title: string;
  description: string;
  icon: any;
  status: 'healthy' | 'gated' | 'readonly';
  stages: number;
  color: 'blue' | 'green' | 'purple';
  onClick: () => void;
}) {
  const colorConfig = {
    blue: 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10',
    green: 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10',
    purple: 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10',
  };
  const iconColor = {
    blue: 'text-blue-500 bg-blue-500/10',
    green: 'text-green-500 bg-green-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'p-5 rounded-xl border text-left transition-all hover:scale-[1.02] hover:shadow-lg',
        colorConfig[color]
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconColor[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-[10px]',
            status === 'healthy' && 'border-sec-safe/50 text-sec-safe',
            status === 'gated' && 'border-sec-warning/50 text-sec-warning',
            status === 'readonly' && 'border-muted-foreground/50 text-muted-foreground'
          )}
        >
          {status === 'healthy' && <CheckCircle className="w-2.5 h-2.5 mr-1" />}
          {status === 'gated' && <Lock className="w-2.5 h-2.5 mr-1" />}
          {status === 'readonly' && <Eye className="w-2.5 h-2.5 mr-1" />}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{stages} stages</span>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  );
}

function ApprovalItem({ approval }: { approval: any }) {
  return (
    <div className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{approval.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {approval.created_at ? formatDistanceToNow(new Date(approval.created_at)) + ' ago' : 'Pending'}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] ml-2 shrink-0">
          {approval.required_approvals - approval.current_approvals} needed
        </Badge>
      </div>
    </div>
  );
}

function DeploymentItem({ deployment }: { deployment: any }) {
  const statusColors = {
    success: 'bg-sec-safe text-sec-safe',
    failed: 'bg-sec-danger text-sec-danger',
    running: 'bg-node-running text-node-running',
    pending: 'bg-muted-foreground text-muted-foreground',
  };
  const statusColor = statusColors[deployment.status as keyof typeof statusColors] || statusColors.pending;

  return (
    <div className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-2 h-2 rounded-full', statusColor.split(' ')[0])} />
          <div>
            <p className="text-sm font-medium text-foreground">{deployment.version}</p>
            <p className="text-[10px] text-muted-foreground">
              {deployment.deployed_at ? formatDistanceToNow(new Date(deployment.deployed_at)) + ' ago' : '-'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px]">{deployment.environment}</Badge>
      </div>
    </div>
  );
}

function EnvironmentHealthCard({
  envId,
  label,
  color,
  isActive,
  isAdmin,
}: {
  envId: string;
  label: string;
  color: string;
  isActive: boolean;
  isAdmin: boolean;
}) {
  const isProd = envId === 'prod';
  
  return (
    <div className={cn(
      'p-4 rounded-xl border transition-all',
      isActive ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border bg-card hover:bg-muted/30',
      isProd && 'border-sec-danger/30'
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className={cn('w-2.5 h-2.5 rounded-full', color)} />
        {isProd && <Lock className="w-3 h-3 text-sec-danger" />}
      </div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="flex items-center gap-1 mt-2">
        <CheckCircle className="w-3 h-3 text-sec-safe" />
        <span className="text-[10px] text-sec-safe">Healthy</span>
      </div>
      {isActive && (
        <Badge variant="secondary" className="mt-2 text-[9px] w-full justify-center">
          Current
        </Badge>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="py-8 text-center text-muted-foreground">
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-20" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default OpzenixDashboard;
