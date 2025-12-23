import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, FileText, Download, Filter, Search, User, Clock, 
  Shield, GitBranch, CheckCircle, XCircle, AlertTriangle,
  Settings, Database, Key, Eye, Trash2, Edit, Plus
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

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
}

// Sample audit log data
const sampleAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    userId: 'user-1',
    userName: 'Sarah Chen',
    action: 'deployment.approved',
    resourceType: 'deployment',
    resourceId: 'dep-v2.4.1',
    details: { environment: 'production', version: 'v2.4.1' },
    ipAddress: '192.168.1.100',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'log-2',
    userId: 'user-2',
    userName: 'Marcus Johnson',
    action: 'flow.created',
    resourceType: 'flow_template',
    resourceId: 'flow-mlops-1',
    details: { name: 'ML Pipeline v2', type: 'mlops' },
    ipAddress: '192.168.1.101',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'log-3',
    userId: 'user-1',
    userName: 'Sarah Chen',
    action: 'approval.rejected',
    resourceType: 'approval_request',
    resourceId: 'apr-123',
    details: { reason: 'Missing security scan', nodeId: 'gate-1' },
    ipAddress: '192.168.1.100',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'log-4',
    userId: 'user-3',
    userName: 'Alex Rivera',
    action: 'execution.started',
    resourceType: 'execution',
    resourceId: 'exec-4',
    details: { environment: 'staging', branch: 'feature/auth' },
    ipAddress: '192.168.1.102',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'log-5',
    userId: 'user-2',
    userName: 'Marcus Johnson',
    action: 'role.updated',
    resourceType: 'user_role',
    resourceId: 'user-4',
    details: { previousRole: 'viewer', newRole: 'operator' },
    ipAddress: '192.168.1.101',
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: 'log-6',
    userId: 'user-1',
    userName: 'Sarah Chen',
    action: 'checkpoint.created',
    resourceType: 'checkpoint',
    resourceId: 'chk-789',
    details: { executionId: 'exec-3', state: 'pre-deploy' },
    ipAddress: '192.168.1.100',
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
  },
  {
    id: 'log-7',
    userId: 'system',
    userName: 'System',
    action: 'deployment.failed',
    resourceType: 'deployment',
    resourceId: 'dep-v2.3.4',
    details: { error: 'Health check failed', environment: 'production' },
    ipAddress: '0.0.0.0',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
  },
  {
    id: 'log-8',
    userId: 'user-3',
    userName: 'Alex Rivera',
    action: 'config.updated',
    resourceType: 'configuration',
    resourceId: 'config-main',
    details: { field: 'replicas', oldValue: 3, newValue: 5 },
    ipAddress: '192.168.1.102',
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
  },
];

interface AuditLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuditLogViewer = ({ isOpen, onClose }: AuditLogViewerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return sampleAuditLogs.filter(log => {
      const matchesSearch = 
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.resourceId?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAction = actionFilter === 'all' || log.action.includes(actionFilter);
      const matchesResource = resourceFilter === 'all' || log.resourceType === resourceFilter;
      
      return matchesSearch && matchesAction && matchesResource;
    });
  }, [searchQuery, actionFilter, resourceFilter]);

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'Details'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.createdAt).toISOString(),
        log.userName,
        log.action,
        log.resourceType,
        log.resourceId || '',
        log.ipAddress,
        JSON.stringify(log.details),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('approved')) return <CheckCircle className="w-4 h-4 text-sec-safe" />;
    if (action.includes('rejected') || action.includes('failed')) return <XCircle className="w-4 h-4 text-sec-critical" />;
    if (action.includes('created') || action.includes('started')) return <Plus className="w-4 h-4 text-ai-primary" />;
    if (action.includes('updated')) return <Edit className="w-4 h-4 text-sec-warning" />;
    if (action.includes('deleted')) return <Trash2 className="w-4 h-4 text-sec-critical" />;
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
      case 'configuration': return <Settings className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (action.includes('approved') || action.includes('created') || action.includes('started')) return 'default';
    if (action.includes('rejected') || action.includes('failed') || action.includes('deleted')) return 'destructive';
    if (action.includes('updated')) return 'secondary';
    return 'outline';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-4xl h-[85vh] bg-card border border-border rounded-lg shadow-xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-ai-primary" />
                <h2 className="text-lg font-semibold text-foreground">Audit Log</h2>
                <Badge variant="outline" className="text-xs">
                  {filteredLogs.length} entries
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 p-4 border-b border-border bg-secondary/20">
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
                  <SelectItem value="flow_template">Flow Templates</SelectItem>
                  <SelectItem value="approval_request">Approvals</SelectItem>
                  <SelectItem value="execution">Executions</SelectItem>
                  <SelectItem value="user_role">User Roles</SelectItem>
                  <SelectItem value="checkpoint">Checkpoints</SelectItem>
                  <SelectItem value="configuration">Configurations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Log List */}
            <ScrollArea className="flex-1">
              <div className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Action Icon */}
                      <div className="mt-1">
                        {getActionIcon(log.action)}
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getActionBadgeVariant(log.action)} className="text-xs capitalize">
                            {log.action.replace('.', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {getResourceIcon(log.resourceType)}
                            {log.resourceType.replace('_', ' ')}
                          </span>
                          {log.resourceId && (
                            <code className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded text-foreground">
                              {log.resourceId}
                            </code>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-foreground">
                            <User className="w-3 h-3 text-muted-foreground" />
                            {log.userName}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Clock className="w-3 h-3" />
                            {formatTime(log.createdAt)}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {log.ipAddress}
                          </span>
                        </div>

                        {/* Details */}
                        {Object.keys(log.details).length > 0 && (
                          <div className="mt-2 p-2 bg-secondary/30 rounded text-xs font-mono text-muted-foreground">
                            {Object.entries(log.details).map(([key, value]) => (
                              <span key={key} className="mr-3">
                                <span className="text-ai-primary">{key}</span>
                                <span className="text-muted-foreground">:</span>
                                <span className="text-foreground ml-1">{String(value)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredLogs.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No audit logs match your filters</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-3 border-t border-border bg-secondary/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {filteredLogs.length} of {sampleAuditLogs.length} entries</span>
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuditLogViewer;
