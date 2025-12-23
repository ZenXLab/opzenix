import { useState } from 'react';
import { 
  FileText, User, Clock, CheckCircle2, XCircle, AlertTriangle,
  Play, Pause, RotateCcw, Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import WidgetWrapper from './WidgetWrapper';
import { cn } from '@/lib/utils';

interface AuditEntry {
  id: string;
  action: string;
  user: string;
  userId: string;
  resource: string;
  status: 'success' | 'failed' | 'warning' | 'pending';
  timestamp: string;
  details?: string;
  duration?: string;
  environment?: string;
}

const mockAuditData: AuditEntry[] = [
  {
    id: '1',
    action: 'Deployment Started',
    user: 'Sarah Chen',
    userId: 'SC',
    resource: 'api-gateway v2.4.1',
    status: 'success',
    timestamp: '2 min ago',
    details: 'Canary deployment initiated',
    duration: '4m 22s',
    environment: 'production'
  },
  {
    id: '2',
    action: 'Pipeline Failed',
    user: 'Mike Johnson',
    userId: 'MJ',
    resource: 'ml-pipeline-retrain',
    status: 'failed',
    timestamp: '15 min ago',
    details: 'Test stage failed: 3 assertions failed',
    environment: 'staging'
  },
  {
    id: '3',
    action: 'Approval Granted',
    user: 'Emma Wilson',
    userId: 'EW',
    resource: 'frontend-app v3.1.0',
    status: 'success',
    timestamp: '32 min ago',
    details: 'Production deployment approved',
    environment: 'production'
  },
  {
    id: '4',
    action: 'Rollback Executed',
    user: 'System',
    userId: 'SY',
    resource: 'payment-service v1.8.2',
    status: 'warning',
    timestamp: '1 hour ago',
    details: 'Auto-rollback triggered: health check failed',
    duration: '45s',
    environment: 'production'
  },
  {
    id: '5',
    action: 'Config Updated',
    user: 'David Lee',
    userId: 'DL',
    resource: 'env/production',
    status: 'success',
    timestamp: '2 hours ago',
    details: 'Updated DATABASE_POOL_SIZE: 10 → 20',
    environment: 'production'
  },
  {
    id: '6',
    action: 'Pipeline Paused',
    user: 'Anna Park',
    userId: 'AP',
    resource: 'data-pipeline-sync',
    status: 'pending',
    timestamp: '3 hours ago',
    details: 'Manual pause requested',
    environment: 'staging'
  },
];

const statusConfig = {
  success: { icon: CheckCircle2, color: 'text-sec-safe', bg: 'bg-sec-safe/10' },
  failed: { icon: XCircle, color: 'text-sec-critical', bg: 'bg-sec-critical/10' },
  warning: { icon: AlertTriangle, color: 'text-sec-warning', bg: 'bg-sec-warning/10' },
  pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/10' },
};

const actionIcons: Record<string, typeof Play> = {
  'Deployment Started': Play,
  'Pipeline Failed': XCircle,
  'Approval Granted': CheckCircle2,
  'Rollback Executed': RotateCcw,
  'Config Updated': FileText,
  'Pipeline Paused': Pause,
};

interface AuditActivityWidgetProps {
  id: string;
  onRemove?: (id: string) => void;
}

const AuditActivityWidget = ({ id, onRemove }: AuditActivityWidgetProps) => {
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'warning'>('all');

  const filteredData = mockAuditData.filter(entry => 
    filter === 'all' || entry.status === filter
  );

  return (
    <WidgetWrapper
      id={id}
      title="Audit Activity Log"
      icon={<FileText className="w-3.5 h-3.5 text-ai-primary" />}
      onRemove={onRemove}
      className="row-span-2"
    >
      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-3 pb-2 border-b border-border">
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

      <ScrollArea className="h-[280px] pr-2">
        <div className="space-y-2">
          {filteredData.map((entry) => {
            const StatusIcon = statusConfig[entry.status].icon;
            const ActionIcon = actionIcons[entry.action] || FileText;
            
            return (
              <div
                key={entry.id}
                className="p-2.5 rounded-lg border border-border hover:border-primary/30 transition-colors bg-secondary/20"
              >
                <div className="flex items-start gap-2">
                  <div className={cn(
                    "p-1.5 rounded",
                    statusConfig[entry.status].bg
                  )}>
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
                      {entry.duration && (
                        <>
                          <span className="text-[10px] text-muted-foreground/60">•</span>
                          <span className="text-[10px] text-muted-foreground">{entry.duration}</span>
                        </>
                      )}
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
      </ScrollArea>
    </WidgetWrapper>
  );
};

export default AuditActivityWidget;
