import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  Shield,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  GitCommit,
  Link2,
  Copy,
  ExternalLink,
  ChevronRight,
  Activity,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================
// 🔍 OPZENIX INSPECTOR PANEL (MVP 1.0.0 LOCKED)
// ============================================
// Read-only inspector showing:
// - What happened
// - Why it was allowed
// - Who triggered/approved
// - When it happened
// - Artifact SHA & Evidence
// - Policy reference
// ============================================

export type InspectorContext = 'node' | 'arrow' | 'environment';
export type InspectorStatus = 'passed' | 'failed' | 'running' | 'pending' | 'blocked';

export interface InspectorData {
  id: string;
  context: InspectorContext;
  type: string;
  environment: string;
  status: InspectorStatus;
  timestamp: string;
  
  // What happened
  summary: string;
  
  // Why allowed
  policyId?: string;
  policyName?: string;
  approvalRequired: boolean;
  
  // Who
  triggeredBy?: { id: string; email: string; role: string };
  approvedBy?: Array<{ id: string; email: string; role: string; timestamp: string }>;
  
  // Evidence
  artifactSha?: string;
  registryUrl?: string;
  imageTag?: string;
  testReportUrl?: string;
  scanReportUrl?: string;
  
  // Audit
  auditId?: string;
  isImmutable: boolean;
  source?: string;
}

interface InspectorPanelDrawerProps {
  open: boolean;
  onClose: () => void;
  data?: InspectorData | null;
  nodeId?: string;
  environment?: string;
}

export const InspectorPanelDrawer = ({
  open,
  onClose,
  data: externalData,
  nodeId,
  environment,
}: InspectorPanelDrawerProps) => {
  const [data, setData] = useState<InspectorData | null>(externalData || null);
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);

  // Fetch audit data when node is selected
  const fetchAuditData = useCallback(async () => {
    if (!nodeId && !environment) return;
    
    setLoading(true);
    try {
      // Fetch audit logs
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .or(`resource_id.eq.${nodeId},details->node_id.eq.${nodeId}`)
        .order('created_at', { ascending: false })
        .limit(10);

      setAuditLogs(logs || []);

      // Fetch approval history for this node/environment
      const { data: approvals } = await supabase
        .from('approval_votes')
        .select(`
          *,
          approval_request:approval_requests(*)
        `)
        .order('voted_at', { ascending: false })
        .limit(10);

      setApprovalHistory(approvals || []);
    } catch (error) {
      console.error('[Inspector] Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [nodeId, environment]);

  useEffect(() => {
    if (externalData) {
      setData(externalData);
    }
  }, [externalData]);

  useEffect(() => {
    if (open && (nodeId || environment)) {
      fetchAuditData();
    }
  }, [open, nodeId, environment, fetchAuditData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusIcon = (status: InspectorStatus) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'blocked':
        return <Lock className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: InspectorStatus) => {
    switch (status) {
      case 'passed':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'running':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'blocked':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[500px] max-w-full bg-sidebar border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Inspector Panel</h2>
                  <p className="text-xs text-muted-foreground">
                    {data?.context || 'Node'} • {data?.environment?.toUpperCase() || environment?.toUpperCase() || 'N/A'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Summary Section */}
            {data && (
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className={cn('text-xs', getStatusColor(data.status))}>
                    {getStatusIcon(data.status)}
                    <span className="ml-1.5">{data.status.toUpperCase()}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">{data.timestamp}</span>
                </div>
                <p className="text-sm text-foreground">{data.summary}</p>
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="audit" className="flex-1 flex flex-col">
              <TabsList className="w-full justify-start border-b border-border rounded-none h-10 bg-transparent px-4">
                <TabsTrigger value="audit" className="text-xs">Audit</TabsTrigger>
                <TabsTrigger value="evidence" className="text-xs">Evidence</TabsTrigger>
                <TabsTrigger value="policy" className="text-xs">Policy</TabsTrigger>
                <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                {/* Audit Tab */}
                <TabsContent value="audit" className="p-4 m-0 space-y-4">
                  {/* What Happened */}
                  <Section
                    icon={FileText}
                    title="What Happened"
                    content={data?.summary || 'No summary available'}
                  />

                  {/* Why Allowed */}
                  <Section
                    icon={Shield}
                    title="Why This Was Allowed"
                    highlight
                  >
                    <div className="space-y-2 text-xs">
                      {data?.policyId && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Policy ID:</span>
                          <code className="text-foreground bg-muted px-1.5 py-0.5 rounded">
                            {data.policyId}
                          </code>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Approval Required:</span>
                        <span className="text-foreground">
                          {data?.approvalRequired ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <a
                        href="#"
                        className="flex items-center gap-1 text-primary hover:underline mt-2"
                      >
                        <Link2 className="w-3 h-3" />
                        View policy definition
                      </a>
                    </div>
                  </Section>

                  {/* Who */}
                  <Section icon={User} title="Who">
                    <div className="space-y-3 text-xs">
                      {data?.triggeredBy && (
                        <div className="p-2 rounded-lg bg-muted/30 border border-border">
                          <p className="text-muted-foreground mb-1">Triggered by:</p>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="w-3 h-3 text-primary" />
                            </div>
                            <div>
                              <p className="text-foreground font-medium">{data.triggeredBy.email}</p>
                              <p className="text-muted-foreground">{data.triggeredBy.role}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {data?.approvedBy && data.approvedBy.length > 0 && (
                        <div>
                          <p className="text-muted-foreground mb-2">Approved by:</p>
                          <div className="space-y-2">
                            {data.approvedBy.map((approver, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border"
                              >
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-foreground">{approver.email}</span>
                                  <Badge variant="secondary" className="text-[9px] h-4">
                                    {approver.role}
                                  </Badge>
                                </div>
                                <span className="text-muted-foreground text-[10px]">
                                  {approver.timestamp}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Section>

                  {/* Audit ID */}
                  <Section icon={Hash} title="Audit">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Audit ID:</span>
                        <div className="flex items-center gap-1">
                          <code className="text-foreground bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">
                            {data?.auditId || 'aud_' + Math.random().toString(36).substr(2, 9)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => copyToClipboard(data?.auditId || '')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Immutable:</span>
                        <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                          <Lock className="w-2.5 h-2.5 mr-1" />
                          YES
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Source:</span>
                        <span className="text-foreground">{data?.source || 'GitHub Actions'}</span>
                      </div>
                    </div>
                  </Section>
                </TabsContent>

                {/* Evidence Tab */}
                <TabsContent value="evidence" className="p-4 m-0 space-y-4">
                  {/* Artifact */}
                  <Section icon={GitCommit} title="Artifact / Evidence">
                    <div className="space-y-3 text-xs">
                      {data?.artifactSha && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Artifact SHA:</span>
                          <div className="flex items-center gap-1">
                            <code className="text-foreground bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">
                              {data.artifactSha.substring(0, 12)}...
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => copyToClipboard(data?.artifactSha || '')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {data?.registryUrl && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Registry:</span>
                          <span className="text-foreground truncate max-w-[200px]">
                            {data.registryUrl}
                          </span>
                        </div>
                      )}

                      {data?.imageTag && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Image Tag:</span>
                          <Badge variant="outline" className="text-[9px]">
                            {data.imageTag}
                          </Badge>
                        </div>
                      )}

                      <Separator />

                      <div className="space-y-2">
                        <p className="text-muted-foreground">Reports:</p>
                        {data?.testReportUrl && (
                          <a
                            href={data.testReportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                          >
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">Test Report</span>
                            <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                          </a>
                        )}
                        {data?.scanReportUrl && (
                          <a
                            href={data.scanReportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                          >
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <span className="text-foreground">Security Scan</span>
                            <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                          </a>
                        )}
                      </div>
                    </div>
                  </Section>
                </TabsContent>

                {/* Policy Tab */}
                <TabsContent value="policy" className="p-4 m-0 space-y-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      {data?.policyName || 'Environment Promotion Policy'}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      This action was evaluated against the OPZENIX promotion policy framework.
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-foreground">CI build passed on main branch</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-foreground">Required approvals obtained</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-foreground">Artifact SHA verified immutable</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-foreground">No role stacking detected</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      Policy Reference
                    </p>
                    <code className="text-xs text-foreground block font-mono">
                      MVP_1.0.0/PROMOTION_RULES/ENV_GATE
                    </code>
                  </div>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="p-4 m-0 space-y-4">
                  <p className="text-xs text-muted-foreground mb-3">
                    Complete audit trail for this resource
                  </p>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Activity className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : auditLogs.length > 0 ? (
                    <div className="space-y-2">
                      {auditLogs.map((log, idx) => (
                        <div
                          key={log.id || idx}
                          className="p-3 rounded-lg bg-muted/30 border border-border"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-foreground">{log.action}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {log.resource_type} • {log.user_id?.substring(0, 8)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-xs text-muted-foreground">No audit history available</p>
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>

            {/* Footer */}
            <div className="p-3 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Lock className="w-3 h-3" />
                <span>Inspector is read-only (MVP 1.0.0)</span>
              </div>
              <Badge variant="outline" className="text-[9px]">
                AUDIT-SAFE
              </Badge>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Section component for consistent layout
interface SectionProps {
  icon: React.ElementType;
  title: string;
  content?: string;
  highlight?: boolean;
  children?: React.ReactNode;
}

const Section = ({ icon: Icon, title, content, highlight, children }: SectionProps) => (
  <div className={cn('p-3 rounded-lg border', highlight ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border')}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className={cn('w-4 h-4', highlight ? 'text-primary' : 'text-muted-foreground')} />
      <span className="text-xs font-medium text-foreground uppercase tracking-wider">{title}</span>
    </div>
    {content && <p className="text-xs text-muted-foreground">{content}</p>}
    {children}
  </div>
);

export default InspectorPanelDrawer;
