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
  Users,
  Lock,
  Eye,
  RefreshCw,
  LayoutGrid,
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
import { useWidgetRealtime } from '@/hooks/useWidgetRealtime';
import { useRBACPermissions } from '@/hooks/useRBACPermissions';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// ============================================
// 🏢 CONTROL TOWER SCREEN (MVP 1.0.0 LOCKED)
// ============================================
// READ-ONLY DASHBOARD
// - Widgets only (health, approvals count, audit feed)
// - NO flows
// - NO deploy/approve buttons
// - Audit context dominates
// ============================================

interface ControlTowerScreenProps {
  onNavigateToFlow: (environment: string, flowType: 'ci' | 'cd' | 'ci+cd') => void;
}

export function ControlTowerScreen({ onNavigateToFlow }: ControlTowerScreenProps) {
  const { dbRole, isAdmin } = useRBACPermissions();
  const { data: executionsData, refresh: refreshExecutions } = useWidgetRealtime({
    widgetType: 'pipeline-status',
    refreshInterval: 15,
  });
  const { data: approvalsData, refresh: refreshApprovals } = useWidgetRealtime({
    widgetType: 'approval-queue',
    refreshInterval: 10,
  });
  const { data: auditData, refresh: refreshAudit } = useWidgetRealtime({
    widgetType: 'audit-trail',
    refreshInterval: 15,
  });

  const environments = [
    { id: 'dev', label: 'DEV', status: 'healthy', lastDeploy: '2h ago', version: 'v1.5.2' },
    { id: 'uat', label: 'UAT', status: 'healthy', lastDeploy: '4h ago', version: 'v1.5.1' },
    { id: 'staging', label: 'STAGING', status: 'deploying', lastDeploy: 'In progress', version: 'v1.5.2' },
    { id: 'preprod', label: 'PREPROD', status: 'healthy', lastDeploy: '1d ago', version: 'v1.5.0' },
    { id: 'prod', label: 'PROD', status: 'healthy', lastDeploy: '3d ago', version: 'v1.4.9' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-sec-safe" />;
      case 'deploying':
        return <RefreshCw className="w-4 h-4 text-node-running animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-sec-danger" />;
      case 'blocked':
        return <AlertTriangle className="w-4 h-4 text-sec-warning" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-sec-safe/30 bg-sec-safe/5';
      case 'deploying':
        return 'border-node-running/30 bg-node-running/5';
      case 'failed':
        return 'border-sec-danger/30 bg-sec-danger/5';
      case 'blocked':
        return 'border-sec-warning/30 bg-sec-warning/5';
      default:
        return 'border-border bg-card';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Control Tower</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Eye className="w-3 h-3" />
                Read-Only Dashboard • Audit Context
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              Role: {dbRole?.toUpperCase() || 'VIEWER'}
            </Badge>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sec-safe/10 text-sec-safe text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-sec-safe animate-pulse" />
              Live
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Environment Health Strip - READ ONLY */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Environment Health
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">Click to view flow</span>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {environments.map((env, idx) => (
                <motion.button
                  key={env.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => onNavigateToFlow(env.id, 'ci+cd')}
                  className={cn(
                    'p-4 rounded-lg border transition-all hover:scale-[1.02] text-left',
                    getStatusColor(env.status),
                    env.id === 'prod' && 'ring-1 ring-sec-danger/20'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">{env.label}</span>
                    {getStatusIcon(env.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{env.version}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{env.lastDeploy}</p>
                  {env.id === 'prod' && (
                    <Badge variant="outline" className="mt-2 text-[10px] border-sec-danger/30 text-sec-danger">
                      <Lock className="w-2.5 h-2.5 mr-1" />
                      Restricted
                    </Badge>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Environment Flow Indicator */}
            <div className="flex items-center justify-center mt-3 gap-1">
              {environments.map((env, idx) => (
                <div key={env.id} className="flex items-center">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    env.status === 'healthy' ? 'bg-sec-safe' :
                    env.status === 'deploying' ? 'bg-node-running' :
                    'bg-muted-foreground'
                  )} />
                  {idx < environments.length - 1 && (
                    <div className="w-8 h-0.5 bg-border mx-1" />
                  )}
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Key Metrics Row - READ ONLY */}
          <section className="grid grid-cols-4 gap-4">
            <MetricCard
              icon={TrendingUp}
              label="Active Pipelines"
              value={executionsData?.running || 0}
              subtext={`${executionsData?.total || 0} total today`}
              iconColor="text-node-running"
            />
            <MetricCard
              icon={FileText}
              label="Pending Approvals"
              value={approvalsData?.pending || 0}
              subtext="Requires action"
              iconColor="text-sec-warning"
              highlight={approvalsData?.pending > 0}
            />
            <MetricCard
              icon={CheckCircle}
              label="Success Rate"
              value={`${Math.round((executionsData?.success || 0) / Math.max(executionsData?.total || 1, 1) * 100)}%`}
              subtext="Last 24 hours"
              iconColor="text-sec-safe"
            />
            <MetricCard
              icon={Shield}
              label="Audit Entries"
              value={auditData?.total || 0}
              subtext="Immutable log"
              iconColor="text-primary"
            />
          </section>

          <Separator />

          {/* Two Column Layout: Approvals Count + Audit Feed */}
          <div className="grid grid-cols-2 gap-6">
            {/* Pending Approvals Widget - READ ONLY (no approve buttons) */}
            <section className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sec-warning" />
                  <h3 className="text-sm font-semibold text-foreground">Pending Approvals</h3>
                  <Badge variant="secondary" className="text-xs">
                    {approvalsData?.pending || 0}
                  </Badge>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refreshApprovals}>
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <ScrollArea className="h-[280px]">
                <div className="p-4 space-y-3">
                  {(approvalsData?.items || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm">No pending approvals</p>
                    </div>
                  ) : (
                    (approvalsData?.items || []).slice(0, 5).map((item: any, idx: number) => (
                      <ApprovalReadOnlyCard key={item.id || idx} item={item} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </section>

            {/* Audit Feed Widget - READ ONLY */}
            <section className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Audit Feed</h3>
                  <Badge variant="outline" className="text-[10px]">Immutable</Badge>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refreshAudit}>
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <ScrollArea className="h-[280px]">
                <div className="p-4 space-y-2">
                  {(auditData?.items || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <FileText className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm">No audit entries</p>
                    </div>
                  ) : (
                    (auditData?.items || []).slice(0, 10).map((item: any, idx: number) => (
                      <AuditEntryCard key={item.id || idx} item={item} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </section>
          </div>

          {/* RBAC Visibility - READ ONLY */}
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Your Access Level</h3>
            </div>
            <RBACReadOnlyDisplay />
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS (Read-Only Display)
// ============================================

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
      'p-4 rounded-lg border border-border bg-card',
      highlight && 'border-sec-warning/50 bg-sec-warning/5'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', `${iconColor}/10`.replace('text-', 'bg-'))}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">{subtext}</p>
    </div>
  );
}

function ApprovalReadOnlyCard({ item }: { item: any }) {
  return (
    <div className="p-3 rounded-lg border border-border bg-muted/30">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{item.title || 'Approval Request'}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px]">
              {item.node_id?.split('-')[0]?.toUpperCase() || 'PROD'}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {item.current_approvals || 0}/{item.required_approvals || 2} approvals
            </span>
          </div>
        </div>
        <Eye className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
        <Clock className="w-3 h-3" />
        {item.created_at ? formatDistanceToNow(new Date(item.created_at)) + ' ago' : 'Pending'}
      </div>
    </div>
  );
}

function AuditEntryCard({ item }: { item: any }) {
  const actionColors: Record<string, string> = {
    create: 'bg-sec-safe/10 text-sec-safe',
    approve: 'bg-sec-safe/10 text-sec-safe',
    deploy: 'bg-primary/10 text-primary',
    reject: 'bg-sec-danger/10 text-sec-danger',
    rollback: 'bg-sec-warning/10 text-sec-warning',
  };

  return (
    <div className="flex items-start gap-3 py-2 px-2 rounded-md hover:bg-muted/30 transition-colors">
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn('text-[10px] capitalize', actionColors[item.action] || '')}>
            {item.action}
          </Badge>
          <span className="text-xs text-muted-foreground truncate">{item.resource_type}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {item.created_at ? formatDistanceToNow(new Date(item.created_at)) + ' ago' : ''}
        </p>
      </div>
    </div>
  );
}

function RBACReadOnlyDisplay() {
  const { dbRole, canApprove, canDeploy, canView, canRollback } = useRBACPermissions();
  const envs = ['dev', 'uat', 'staging', 'preprod', 'prod'] as const;

  return (
    <div className="grid grid-cols-5 gap-2">
      {envs.map((env) => (
        <div
          key={env}
          className={cn(
            'p-3 rounded-lg border text-center',
            canView(env) ? 'border-sec-safe/30 bg-sec-safe/5' : 'border-border bg-muted/30 opacity-50'
          )}
        >
          <span className="text-xs font-bold uppercase">{env}</span>
          <div className="flex justify-center gap-1 mt-2">
            {canView(env) && <Eye className="w-3 h-3 text-muted-foreground" />}
            {canApprove(env) && <CheckCircle className="w-3 h-3 text-sec-safe" />}
            {canDeploy(env) && <TrendingUp className="w-3 h-3 text-primary" />}
            {canRollback(env) && <RefreshCw className="w-3 h-3 text-sec-warning" />}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ControlTowerScreen;
