import { useState } from 'react';
import { 
  FileText, Download, Filter, Search, User, Clock, 
  Shield, GitBranch, CheckCircle, XCircle, AlertTriangle,
  Settings, Database, Key, Eye, Trash2, Edit, Plus,
  Loader2, WifiOff, Calendar, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuditLogsRealtime, AuditLog } from '@/hooks/useAuditLogsRealtime';

const AuditLogPanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');

  const { 
    logs, 
    loading, 
    isConnected, 
    totalCount, 
    refetch 
  } = useAuditLogsRealtime({
    search: searchQuery,
    actionFilter,
    resourceFilter
  });

  const handleExport = () => {
    if (logs.length === 0) return;

    const csvContent = [
      ['Timestamp', 'User ID', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'Details'].join(','),
      ...logs.map(log => [
        new Date(log.created_at).toISOString(),
        log.user_id || 'system',
        log.action,
        log.resource_type,
        log.resource_id || '',
        log.ip_address || '',
        JSON.stringify(log.details).replace(/,/g, ';'),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opzenix-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('approved') || action.includes('validated')) return <CheckCircle className="w-4 h-4 text-sec-safe" />;
    if (action.includes('rejected') || action.includes('failed')) return <XCircle className="w-4 h-4 text-sec-critical" />;
    if (action.includes('created') || action.includes('started')) return <Plus className="w-4 h-4 text-primary" />;
    if (action.includes('updated')) return <Edit className="w-4 h-4 text-sec-warning" />;
    if (action.includes('deleted')) return <Trash2 className="w-4 h-4 text-sec-critical" />;
    if (action.includes('connection')) return <GitBranch className="w-4 h-4 text-primary" />;
    return <Eye className="w-4 h-4 text-muted-foreground" />;
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'deployment': return <GitBranch className="w-4 h-4" />;
      case 'flow_template': return <Settings className="w-4 h-4" />;
      case 'approval_request': return <Shield className="w-4 h-4" />;
      case 'execution': return <Clock className="w-4 h-4" />;
      case 'user_role': return <Key className="w-4 h-4" />;
      case 'checkpoint': return <Database className="w-4 h-4" />;
      case 'connection': return <GitBranch className="w-4 h-4" />;
      case 'environment': return <Settings className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getActionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (action.includes('approved') || action.includes('created') || action.includes('started') || action.includes('validated')) return 'default';
    if (action.includes('rejected') || action.includes('failed') || action.includes('deleted')) return 'destructive';
    if (action.includes('updated')) return 'secondary';
    return 'outline';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable record of all system actions — Read-only
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isConnected && (
            <Badge variant="outline" className="gap-1 text-sec-warning border-sec-warning/30">
              <WifiOff className="w-3 h-3" />
              Disconnected
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {totalCount} total entries
          </Badge>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2" disabled={logs.length === 0}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 px-6 pb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40 bg-background">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="started">Started</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="validated">Validated</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>

        <Select value={resourceFilter} onValueChange={setResourceFilter}>
          <SelectTrigger className="w-44 bg-background">
            <Database className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Resource" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            <SelectItem value="deployment">Deployments</SelectItem>
            <SelectItem value="execution">Executions</SelectItem>
            <SelectItem value="approval_request">Approvals</SelectItem>
            <SelectItem value="connection">Connections</SelectItem>
            <SelectItem value="environment">Environments</SelectItem>
            <SelectItem value="checkpoint">Checkpoints</SelectItem>
            <SelectItem value="user_role">User Roles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Log List */}
      <ScrollArea className="flex-1 px-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyAuditState hasFilters={searchQuery !== '' || actionFilter !== 'all' || resourceFilter !== 'all'} />
        ) : (
          <div className="divide-y divide-border rounded-lg border overflow-hidden">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-muted/30 transition-colors bg-card"
              >
                <div className="flex items-start gap-4">
                  {/* Action Icon */}
                  <div className="mt-1">
                    {getActionIcon(log.action)}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={getActionBadgeVariant(log.action)} className="text-xs capitalize">
                        {log.action.replace(/\./g, ' ').replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {getResourceIcon(log.resource_type)}
                        {log.resource_type.replace(/_/g, ' ')}
                      </span>
                      {log.resource_id && (
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                          {log.resource_id.slice(0, 8)}...
                        </code>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <User className="w-3 h-3" />
                        {log.user_id ? log.user_id.slice(0, 8) + '...' : 'System'}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Clock className="w-3 h-3" />
                        {formatTime(log.created_at)}
                      </span>
                      {log.ip_address && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.ip_address}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    {Object.keys(log.details).length > 0 && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground overflow-x-auto">
                        {Object.entries(log.details).map(([key, value]) => (
                          <span key={key} className="mr-3 inline-block">
                            <span className="text-primary">{key}</span>
                            <span className="text-muted-foreground">:</span>
                            <span className="text-foreground ml-1">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {logs.length} of {totalCount} entries</span>
        <span className="flex items-center gap-1">
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-sec-safe animate-pulse" />
              Live updates enabled
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-sec-warning" />
              Reconnecting...
            </>
          )}
        </span>
      </div>
    </div>
  );
};

// Empty state component
const EmptyAuditState = ({ hasFilters }: { hasFilters: boolean }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
      <FileText className="w-8 h-8 text-muted-foreground" />
    </div>
    {hasFilters ? (
      <>
        <h3 className="text-lg font-medium text-foreground mb-2">No matching logs</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No audit logs match your current filters. Try adjusting your search or filter criteria.
        </p>
      </>
    ) : (
      <>
        <h3 className="text-lg font-medium text-foreground mb-2">No audit logs yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          Audit logs will appear here as you interact with the system. Every action is recorded automatically.
        </p>
        <div className="flex flex-col items-start text-left text-xs text-muted-foreground space-y-1 bg-muted/30 p-4 rounded-lg">
          <span>Actions that create audit logs:</span>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Connection validation attempts</li>
            <li>Execution starts and completions</li>
            <li>Approval decisions</li>
            <li>Environment configuration changes</li>
            <li>Deployment events</li>
          </ul>
        </div>
      </>
    )}
  </div>
);

export default AuditLogPanel;
