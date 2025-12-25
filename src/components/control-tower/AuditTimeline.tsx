import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GitCommit, 
  CheckCircle2, 
  Shield, 
  Package, 
  UserCheck, 
  Rocket, 
  Activity,
  Lock,
  Clock,
  Hash,
  ExternalLink,
  FileText,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  type: 'commit' | 'ci' | 'security' | 'artifact' | 'approval' | 'deploy' | 'runtime' | 'audit';
  status: 'success' | 'warning' | 'error' | 'info';
  sha?: string;
  metadata?: Record<string, string>;
}

interface AuditTimelineProps {
  executionId: string;
  onEventClick?: (event: AuditEvent) => void;
}

const eventIcons = {
  commit: GitCommit,
  ci: Activity,
  security: Shield,
  artifact: Package,
  approval: UserCheck,
  deploy: Rocket,
  runtime: Activity,
  audit: Lock
};

const statusColors = {
  success: 'text-green-500 bg-green-500/10 border-green-500/30',
  warning: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  error: 'text-destructive bg-destructive/10 border-destructive/30',
  info: 'text-blue-500 bg-blue-500/10 border-blue-500/30'
};

export function AuditTimeline({ executionId, onEventClick }: AuditTimelineProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditEvents();

    const channel = supabase
      .channel('audit-timeline')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, fetchAuditEvents)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ci_evidence', filter: `execution_id=eq.${executionId}` }, fetchAuditEvents)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [executionId]);

  const fetchAuditEvents = async () => {
    // Fetch multiple data sources
    const [execRes, ciRes, auditRes, approvalRes, deployRes] = await Promise.all([
      supabase.from('executions').select('*').eq('id', executionId).single(),
      supabase.from('ci_evidence').select('*').eq('execution_id', executionId).order('step_order'),
      supabase.from('audit_logs').select('*').eq('resource_id', executionId).order('created_at'),
      supabase.from('approval_requests').select('*, approval_votes(*)').eq('execution_id', executionId),
      supabase.from('deployments').select('*').eq('execution_id', executionId)
    ]);

    const exec = execRes.data;
    const ci = ciRes.data || [];
    const audits = auditRes.data || [];
    const approvals = approvalRes.data || [];
    const deployments = deployRes.data || [];

    const allEvents: AuditEvent[] = [];

    // Add commit event
    if (exec?.commit_hash) {
      allEvents.push({
        id: `commit-${exec.id}`,
        timestamp: exec.started_at,
        action: 'Commit pushed',
        actor: 'GitHub Webhook',
        details: `Branch: ${exec.branch || 'main'} | SHA: ${exec.commit_hash.slice(0, 7)}`,
        type: 'commit',
        status: 'success',
        sha: exec.commit_hash,
        metadata: {
          'Branch': exec.branch || 'main',
          'Repository': 'opzenix/opzenix-service'
        }
      });
    }

    // Add CI events
    ci.forEach(evidence => {
      const typeMap: Record<string, AuditEvent['type']> = {
        test: 'ci',
        build: 'ci',
        sast: 'security',
        secrets: 'security',
        dependency: 'security',
        scan: 'security',
        sign: 'artifact'
      };
      
      allEvents.push({
        id: evidence.id,
        timestamp: evidence.completed_at || evidence.started_at || evidence.created_at,
        action: `${evidence.step_name} ${evidence.status === 'passed' ? 'passed' : evidence.status === 'failed' ? 'failed' : 'running'}`,
        actor: evidence.step_type === 'sast' ? 'Semgrep' : 
               evidence.step_type === 'secrets' ? 'TruffleHog' : 
               evidence.step_type === 'dependency' ? 'npm audit' : 
               evidence.step_type === 'scan' ? 'Trivy' : 
               evidence.step_type === 'sign' ? 'Cosign' : 'CI Runner',
        details: evidence.summary || `Duration: ${evidence.duration_ms || 0}ms`,
        type: typeMap[evidence.step_type] || 'ci',
        status: evidence.status === 'passed' ? 'success' : evidence.status === 'failed' ? 'error' : 'info',
        metadata: {
          'Step': evidence.step_name,
          'Type': evidence.step_type,
          'Duration': `${evidence.duration_ms || 0}ms`
        }
      });
    });

    // Add approval events
    approvals.forEach(approval => {
      allEvents.push({
        id: `approval-request-${approval.id}`,
        timestamp: approval.created_at,
        action: 'Approval requested',
        actor: approval.requested_by || 'System',
        details: `Required: ${approval.required_approvals} approvals`,
        type: 'approval',
        status: 'info',
        metadata: {
          'Required': `${approval.required_approvals}`,
          'Title': approval.title
        }
      });

      // Add individual votes
      (approval.approval_votes || []).forEach((vote: { id: string; voted_at: string; user_id: string; vote: boolean; comment?: string }) => {
        allEvents.push({
          id: `vote-${vote.id}`,
          timestamp: vote.voted_at,
          action: vote.vote ? 'Approval granted' : 'Approval rejected',
          actor: vote.user_id.slice(0, 8),
          details: vote.comment || (vote.vote ? 'Approved' : 'Rejected'),
          type: 'approval',
          status: vote.vote ? 'success' : 'error',
          metadata: {
            'Voter': vote.user_id.slice(0, 8),
            'Decision': vote.vote ? 'Approved' : 'Rejected'
          }
        });
      });

      if (approval.status !== 'pending') {
        allEvents.push({
          id: `approval-resolved-${approval.id}`,
          timestamp: approval.resolved_at || approval.created_at,
          action: approval.status === 'approved' ? 'Approval gate passed' : 'Approval gate rejected',
          actor: 'OPZENIX Governance',
          details: `${approval.current_approvals}/${approval.required_approvals} approvals received`,
          type: 'approval',
          status: approval.status === 'approved' ? 'success' : 'error'
        });
      }
    });

    // Add deployment events
    deployments.forEach(deploy => {
      allEvents.push({
        id: `deploy-${deploy.id}`,
        timestamp: deploy.deployed_at,
        action: deploy.status === 'success' ? 'Deployment completed' : 
                deploy.status === 'failed' ? 'Deployment failed' : 'Deployment started',
        actor: deploy.deployed_by || 'Argo CD',
        details: `Version: ${deploy.version} | Environment: ${deploy.environment}`,
        type: 'deploy',
        status: deploy.status === 'success' ? 'success' : deploy.status === 'failed' ? 'error' : 'info',
        sha: exec?.commit_hash,
        metadata: {
          'Version': deploy.version,
          'Environment': deploy.environment
        }
      });
    });

    // Add general audit logs
    audits.forEach(log => {
      if (!allEvents.find(e => e.id === log.id)) {
        allEvents.push({
          id: log.id,
          timestamp: log.created_at,
          action: log.action,
          actor: log.user_id?.slice(0, 8) || 'System',
          details: JSON.stringify(log.details).slice(0, 100),
          type: 'audit',
          status: 'info',
          metadata: log.details as Record<string, string>
        });
      }
    });

    // Add verified event if execution is complete
    if (exec?.status === 'success') {
      allEvents.push({
        id: `verified-${exec.id}`,
        timestamp: exec.completed_at || new Date().toISOString(),
        action: 'Deployment verified',
        actor: 'OPZENIX Control Plane',
        details: 'Audit record created and cryptographically linked',
        type: 'audit',
        status: 'success',
        sha: exec.commit_hash,
        metadata: {
          'Execution': exec.id.slice(0, 8),
          'Status': 'Verified',
          'Immutable': 'Yes'
        }
      });
    }

    // Sort by timestamp
    allEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    setEvents(allEvents);
    setLoading(false);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleEventClick = (event: AuditEvent) => {
    setSelectedEvent(event.id);
    onEventClick?.(event);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Immutable Audit Timeline
            <Badge variant="outline" className="ml-2 text-xs">
              <Lock className="h-3 w-3 mr-1" />
              READ-ONLY
            </Badge>
          </CardTitle>
          <Badge variant="secondary">{events.length} events</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ScrollArea className="h-[400px] pr-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            {/* Events */}
            <div className="space-y-1">
              {events.map((event, index) => {
                const Icon = eventIcons[event.type];
                const isSelected = selectedEvent === event.id;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'relative pl-10 py-2 rounded-lg transition-colors cursor-pointer',
                      isSelected ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
                    )}
                    onClick={() => handleEventClick(event)}
                  >
                    {/* Event icon */}
                    <div className={cn(
                      'absolute left-0.5 w-7 h-7 rounded-full flex items-center justify-center border-2 bg-background',
                      statusColors[event.status]
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    {/* Event content */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{event.action}</span>
                          <Badge 
                            variant="outline" 
                            className={cn('text-xs h-5', statusColors[event.status])}
                          >
                            {event.status.toUpperCase()}
                          </Badge>
                          {event.sha && (
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                              {event.sha.slice(0, 7)}
                            </code>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {event.details}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{formatTime(event.timestamp)}</span>
                          <span>•</span>
                          <span>{event.actor}</span>
                        </div>
                      </div>

                      {isSelected && event.metadata && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Expanded metadata */}
                    {isSelected && event.metadata && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 pt-2 border-t border-dashed"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-muted-foreground">{key}: </span>
                              <span className="font-mono">{value}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-blue-500">
                          <Lock className="h-3 w-3" />
                          <span>Immutable audit record</span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Hash className="h-3 w-3" />
            <span>Cryptographically linked to artifact SHA</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
            Export Audit Log
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
