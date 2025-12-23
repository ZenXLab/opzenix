import { useState, useEffect } from 'react';
import { 
  FileText, Clock, CheckCircle2, XCircle, AlertTriangle,
  Play, Pause, RotateCcw, RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import WidgetWrapper from './WidgetWrapper';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';

type AuditLog = Tables<'audit_logs'>;

interface AuditEntry {
  id: string;
  action: string;
  user: string;
  userId: string;
  resource: string;
  status: 'success' | 'failed' | 'warning' | 'pending';
  timestamp: string;
  details?: string;
  environment?: string;
}

const statusConfig = {
  success: { icon: CheckCircle2, color: 'text-sec-safe', bg: 'bg-sec-safe/10' },
  failed: { icon: XCircle, color: 'text-sec-critical', bg: 'bg-sec-critical/10' },
  warning: { icon: AlertTriangle, color: 'text-sec-warning', bg: 'bg-sec-warning/10' },
  pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/10' },
};

const actionIcons: Record<string, typeof Play> = {
  'deployment_started': Play,
  'deployment_completed': CheckCircle2,
  'deployment_failed': XCircle,
  'pipeline_failed': XCircle,
  'approval_granted': CheckCircle2,
  'rollback_executed': RotateCcw,
  'config_updated': FileText,
  'pipeline_paused': Pause,
};

const mapAuditLogToEntry = (log: AuditLog): AuditEntry => {
  const details = log.details as Record<string, any> | null;
  const action = log.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  let status: AuditEntry['status'] = 'success';
  if (log.action.includes('failed')) status = 'failed';
  else if (log.action.includes('warning') || log.action.includes('rollback')) status = 'warning';
  else if (log.action.includes('pending') || log.action.includes('paused')) status = 'pending';

  return {
    id: log.id,
    action,
    user: details?.user_name || 'System',
    userId: details?.user_initials || 'SY',
    resource: `${log.resource_type}${log.resource_id ? ` #${log.resource_id.slice(0, 8)}` : ''}`,
    status,
    timestamp: formatDistanceToNow(new Date(log.created_at), { addSuffix: true }),
    details: details?.message || details?.description,
    environment: details?.environment,
  };
};

interface AuditActivityWidgetProps {
  id: string;
  onRemove?: (id: string) => void;
}

const AuditActivityWidget = ({ id, onRemove }: AuditActivityWidgetProps) => {
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'warning'>('all');
  const [auditData, setAuditData] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchAuditLogs = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching audit logs:', error);
      } else if (data) {
        setAuditData(data.map(mapAuditLogToEntry));
      }
      setIsLoading(false);
    };

    fetchAuditLogs();
  }, []);

  // Real-time subscription
  useEffect(() => {
    if (!isLive) return;

    const channel = supabase
      .channel('audit-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
        },
        (payload) => {
          const newEntry = mapAuditLogToEntry(payload.new as AuditLog);
          setAuditData(prev => [newEntry, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLive]);

  const filteredData = auditData.filter(entry => 
    filter === 'all' || entry.status === filter
  );

  const handleRefresh = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setAuditData(data.map(mapAuditLogToEntry));
    }
    setIsLoading(false);
  };

  return (
    <WidgetWrapper
      id={id}
      title="Audit Activity Log"
      icon={<FileText className="w-3.5 h-3.5 text-ai-primary" />}
      onRemove={onRemove}
      onRefresh={handleRefresh}
      className="row-span-2"
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <div className="flex items-center gap-1">
          {(['all', 'success', 'failed', 'warning'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs capitalize"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={isLive ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={() => setIsLive(!isLive)}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", isLive ? "bg-sec-safe animate-pulse" : "bg-muted")} />
            {isLive ? 'Live' : 'Paused'}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[280px] pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileText className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">No audit logs found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredData.map((entry) => {
              const StatusIcon = statusConfig[entry.status].icon;
              const ActionIcon = actionIcons[entry.action.toLowerCase().replace(/ /g, '_')] || FileText;
              
              return (
                <div
                  key={entry.id}
                  className="p-2.5 rounded-lg border border-border hover:border-primary/30 transition-colors bg-secondary/20"
                >
                  <div className="flex items-start gap-2">
                    <div className={cn("p-1.5 rounded", statusConfig[entry.status].bg)}>
                      <ActionIcon className={cn("w-3.5 h-3.5", statusConfig[entry.status].color)} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground truncate">
                          {entry.action}
                        </span>
                        <StatusIcon className={cn("w-3.5 h-3.5 shrink-0", statusConfig[entry.status].color)} />
                      </div>
                      
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {entry.resource}
                      </p>
                      
                      {entry.details && (
                        <p className="text-[10px] text-muted-foreground/70 mt-1 line-clamp-2">
                          {entry.details}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                            {entry.userId}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{entry.user}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">•</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {entry.timestamp}
                        </span>
                        {entry.environment && (
                          <Badge variant="outline" className="h-4 text-[9px] px-1">
                            {entry.environment}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground">
        <span>{filteredData.length} entries</span>
        <div className="flex items-center gap-1">
          <span className={cn("w-1.5 h-1.5 rounded-full", isLive ? "bg-sec-safe animate-pulse" : "bg-muted")} />
          <span>{isLive ? 'Real-time updates' : 'Updates paused'}</span>
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default AuditActivityWidget;
