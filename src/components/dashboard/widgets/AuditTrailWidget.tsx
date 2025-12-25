import { motion } from 'framer-motion';
import {
  FileText,
  User,
  Clock,
  RefreshCw,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWidgetRealtime } from '@/hooks/useWidgetRealtime';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AuditTrailWidgetProps {
  id: string;
  onRemove: (id: string) => void;
}

interface AuditEntry {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  timestamp: string;
  details?: Record<string, any>;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-sec-safe/10 text-sec-safe',
  update: 'bg-blue-500/10 text-blue-500',
  delete: 'bg-sec-danger/10 text-sec-danger',
  approve: 'bg-sec-safe/10 text-sec-safe',
  reject: 'bg-sec-danger/10 text-sec-danger',
  deploy: 'bg-primary/10 text-primary',
  rollback: 'bg-sec-warning/10 text-sec-warning',
};

export function AuditTrailWidget({ id, onRemove }: AuditTrailWidgetProps) {
  const { data, loading, lastUpdated, refresh } = useWidgetRealtime({
    widgetType: 'audit-trail',
    refreshInterval: 15,
  });

  const entries: AuditEntry[] = data?.items?.map((item: any) => ({
    id: item.id,
    action: item.action,
    resourceType: item.resource_type,
    resourceId: item.resource_id,
    userId: item.user_id || 'system',
    timestamp: item.created_at,
    details: item.details,
  })) || [];

  return (
    <div className="p-4 space-y-3">
      {/* Header with Lock indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Audit Trail</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Lock className="w-3 h-3 text-sec-warning" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Immutable audit log - Fixed position widget</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px]">
            {entries.length} entries
          </Badge>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refresh}>
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Audit Entries */}
      <ScrollArea className="h-[250px]">
        <div className="space-y-1 pr-2">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileText className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No audit entries yet</p>
            </div>
          ) : (
            entries.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="flex items-start gap-3 py-2 px-2 rounded-md hover:bg-muted/30 transition-colors group"
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center mt-1">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    ACTION_COLORS[entry.action]?.includes('text-sec-safe') ? 'bg-sec-safe' :
                    ACTION_COLORS[entry.action]?.includes('text-sec-danger') ? 'bg-sec-danger' :
                    ACTION_COLORS[entry.action]?.includes('text-primary') ? 'bg-primary' :
                    'bg-muted-foreground'
                  )} />
                  {idx < entries.length - 1 && (
                    <div className="w-0.5 h-8 bg-border mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn('text-[10px] capitalize', ACTION_COLORS[entry.action])}
                    >
                      {entry.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {entry.resourceType}
                    </span>
                  </div>
                  <p className="text-xs text-foreground mt-1 truncate">
                    {entry.resourceId || 'Resource action'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span className="truncate">{entry.userId}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(entry.timestamp))} ago</span>
                  </div>
                </div>

                {/* View details arrow */}
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center" />
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default AuditTrailWidget;
