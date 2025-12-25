import { motion } from 'framer-motion';
import {
  FileCheck,
  Clock,
  User,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWidgetRealtime } from '@/hooks/useWidgetRealtime';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ApprovalQueueWidgetProps {
  id: string;
  onRemove: (id: string) => void;
}

interface ApprovalItem {
  id: string;
  title: string;
  environment: string;
  requiredRole: string;
  requiredApprovals: number;
  currentApprovals: number;
  requestedBy: string;
  createdAt: string;
}

const ENV_COLORS: Record<string, string> = {
  dev: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  uat: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
  staging: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  preprod: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  prod: 'bg-sec-danger/10 text-sec-danger border-sec-danger/30',
};

export function ApprovalQueueWidget({ id, onRemove }: ApprovalQueueWidgetProps) {
  const { data, loading, lastUpdated, refresh } = useWidgetRealtime({
    widgetType: 'approval-queue',
    refreshInterval: 15,
  });

  // Transform data or use mock
  const approvals: ApprovalItem[] = data?.items?.map((item: any) => ({
    id: item.id,
    title: item.title,
    environment: item.node_id?.split('-')[0] || 'prod',
    requiredRole: 'PLATFORM_OWNER',
    requiredApprovals: item.required_approvals || 2,
    currentApprovals: item.current_approvals || 0,
    requestedBy: item.requested_by || 'system',
    createdAt: item.created_at,
  })) || [
    {
      id: '1',
      title: 'Deploy v1.5.0 to Production',
      environment: 'prod',
      requiredRole: 'CTO',
      requiredApprovals: 3,
      currentApprovals: 2,
      requestedBy: 'john.doe@company.com',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      title: 'Staging Release Candidate',
      environment: 'staging',
      requiredRole: 'ARCHITECT',
      requiredApprovals: 2,
      currentApprovals: 1,
      requestedBy: 'jane.smith@company.com',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const pendingCount = data?.pending || approvals.length;

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-sec-warning" />
          <span className="text-sm font-medium text-foreground">Approval Queue</span>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {pendingCount}
            </Badge>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refresh}>
                <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Approval List */}
      <ScrollArea className="h-[180px]">
        <div className="space-y-2 pr-2">
          {approvals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No pending approvals</p>
            </div>
          ) : (
            approvals.map((approval, idx) => (
              <motion.div
                key={approval.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {approval.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] uppercase', ENV_COLORS[approval.environment])}
                      >
                        {approval.environment}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {approval.requiredRole}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Progress */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sec-safe rounded-full transition-all"
                      style={{
                        width: `${(approval.currentApprovals / approval.requiredApprovals) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {approval.currentApprovals}/{approval.requiredApprovals}
                  </span>
                </div>

                {/* Time */}
                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(approval.createdAt))} ago
                </div>
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default ApprovalQueueWidget;
