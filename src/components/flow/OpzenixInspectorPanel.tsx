import { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Clock,
  User,
  Shield,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
  GitCommit,
  Package,
  Activity,
  Calendar,
  Copy,
  Check,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { OpzenixNodeData, OpzenixNodeState, OpzenixNodeType } from './OpzenixNodeTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OpzenixInspectorPanelProps {
  nodeId: string;
  nodeData: OpzenixNodeData;
  onClose: () => void;
}

// Audit section data based on node type
const getAuditSections = (nodeData: OpzenixNodeData): {
  what: string;
  why: string;
  who: string;
  when: string;
  policyRef?: string;
} => {
  const nodeType = nodeData.nodeType;
  
  const baseAudit = {
    what: nodeData.description || `${nodeData.label} execution`,
    why: 'Required by enterprise governance policy',
    who: 'System automated',
    when: new Date().toISOString(),
  };

  switch (nodeType) {
    case 'source.git':
      return {
        what: `Git commit ${nodeData.commitSha?.slice(0, 7)} pushed to ${nodeData.branch}`,
        why: 'Source code change triggers CI/CD pipeline',
        who: nodeData.author || 'Developer',
        when: nodeData.timestamp || baseAudit.when,
        policyRef: 'POL-001: Source Control Policy',
      };

    case 'ci.sast':
      return {
        what: 'Static Application Security Testing completed',
        why: 'Security policy requires SAST before artifact creation',
        who: 'GitHub Actions Runner',
        when: baseAudit.when,
        policyRef: 'POL-SEC-001: Secure Development Lifecycle',
      };

    case 'ci.dependency-scan':
      return {
        what: 'Dependency vulnerability scan executed',
        why: 'Compliance requires scanning all third-party dependencies',
        who: 'GitHub Actions Runner',
        when: baseAudit.when,
        policyRef: 'POL-SEC-002: Supply Chain Security',
      };

    case 'ci.secrets-scan':
      return {
        what: 'Secrets detection scan completed',
        why: 'Prevent credential leakage in source code',
        who: 'GitHub Actions Runner',
        when: baseAudit.when,
        policyRef: 'POL-SEC-003: Secrets Management',
      };

    case 'ci.unit-test':
    case 'ci.integration-test':
      return {
        what: `Test suite executed: ${nodeData.description || 'All tests'}`,
        why: 'Quality gates require minimum test coverage',
        who: 'GitHub Actions Runner',
        when: baseAudit.when,
        policyRef: 'POL-QA-001: Testing Requirements',
      };

    case 'ci.sbom':
      return {
        what: 'Software Bill of Materials generated',
        why: 'Regulatory compliance for software transparency',
        who: 'GitHub Actions Runner',
        when: baseAudit.when,
        policyRef: 'POL-COMP-001: SBOM Requirements',
      };

    case 'ci.image-sign':
      return {
        what: `Container image signed with Cosign`,
        why: 'Ensure image integrity and authenticity',
        who: 'GitHub Actions Runner',
        when: baseAudit.when,
        policyRef: 'POL-SEC-004: Artifact Signing',
      };

    case 'ci.image-scan':
      return {
        what: 'Container image vulnerability scan (Trivy)',
        why: 'Security policy requires CVE scanning before deployment',
        who: 'GitHub Actions Runner',
        when: baseAudit.when,
        policyRef: 'POL-SEC-005: Container Security',
      };

    case 'artifact.image':
      return {
        what: `Container image created: ${nodeData.imageName}:${nodeData.tag}`,
        why: 'Immutable artifact for deployment',
        who: 'GitHub Actions Runner',
        when: baseAudit.when,
        policyRef: 'POL-ART-001: Artifact Immutability',
      };

    case 'security.gate':
      return {
        what: `Security policy evaluation: ${nodeData.state === 'PASSED' ? 'Passed' : 'Failed'}`,
        why: 'Enforce security thresholds before deployment',
        who: 'Policy Engine',
        when: baseAudit.when,
        policyRef: 'POL-SEC-006: Deployment Security Gates',
      };

    case 'approval.gate':
      return {
        what: `Production deployment approval (${nodeData.currentApprovers}/${nodeData.requiredApprovers})`,
        why: `${nodeData.environment?.toUpperCase()} requires ${nodeData.requiredApprovers} approvals`,
        who: nodeData.approvers?.map(a => a.user).join(', ') || 'Pending',
        when: baseAudit.when,
        policyRef: 'POL-GOV-001: Environment Approval Matrix',
      };

    case 'cd.argo':
      return {
        what: `Argo CD sync to ${nodeData.appName}`,
        why: 'GitOps-driven deployment to Kubernetes',
        who: 'Argo CD Controller',
        when: baseAudit.when,
        policyRef: 'POL-CD-001: GitOps Deployment',
      };

    case 'deploy.rolling':
    case 'deploy.canary':
    case 'deploy.bluegreen':
      const strategy = nodeType.split('.')[1];
      return {
        what: `${strategy.charAt(0).toUpperCase() + strategy.slice(1)} deployment execution`,
        why: `${nodeData.environment?.toUpperCase()} environment uses ${strategy} strategy`,
        who: 'Argo CD Controller',
        when: baseAudit.when,
        policyRef: 'POL-CD-002: Deployment Strategies',
      };

    case 'runtime.k8s':
      return {
        what: `Kubernetes deployment to ${nodeData.namespace}`,
        why: 'Application runtime provisioning',
        who: 'Kubernetes API Server',
        when: baseAudit.when,
        policyRef: 'POL-INF-001: Infrastructure Policy',
      };

    case 'verify.runtime':
      return {
        what: 'Runtime verification and health checks',
        why: 'Ensure deployment health before traffic routing',
        who: 'Verification Agent',
        when: baseAudit.when,
        policyRef: 'POL-OPS-001: Deployment Verification',
      };

    case 'audit.record':
      return {
        what: 'Immutable audit record created',
        why: 'Compliance requires permanent deployment records',
        who: 'Audit System',
        when: baseAudit.when,
        policyRef: 'POL-COMP-002: Audit Trail Requirements',
      };

    default:
      return baseAudit;
  }
};

// State badge component
const StateBadge = ({ state }: { state: OpzenixNodeState }) => {
  const config: Record<OpzenixNodeState, { label: string; className: string; icon: React.ElementType }> = {
    PASSED: { label: 'Passed', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
    FAILED: { label: 'Failed', className: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle },
    PENDING: { label: 'Pending', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
    RUNNING: { label: 'Running', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Activity },
    LOCKED: { label: 'Locked', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Lock },
    BLOCKED: { label: 'Blocked', className: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle },
  };

  const { label, className, icon: Icon } = config[state];

  return (
    <Badge variant="outline" className={cn('gap-1.5', className)}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
};

// Section component
const Section = memo(({ 
  icon: Icon, 
  title, 
  content, 
  highlight = false,
  copyable = false,
}: { 
  icon: React.ElementType; 
  title: string; 
  content: string; 
  highlight?: boolean;
  copyable?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      'p-3 rounded-lg border',
      highlight ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border/50'
    )}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
        </div>
        {copyable && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </Button>
        )}
      </div>
      <p className={cn(
        'text-sm',
        highlight ? 'text-primary font-medium' : 'text-foreground'
      )}>
        {content}
      </p>
    </div>
  );
});
Section.displayName = 'Section';

export const OpzenixInspectorPanel = memo(({ nodeId, nodeData, onClose }: OpzenixInspectorPanelProps) => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const auditSections = getAuditSections(nodeData);

  // Fetch related audit logs
  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('audit_logs')
          .select('*')
          .ilike('resource_id', `%${nodeId}%`)
          .order('created_at', { ascending: false })
          .limit(10);
        
        setAuditLogs(data || []);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [nodeId]);

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-[400px] h-full bg-card border-l border-border flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{nodeData.label}</h3>
              <p className="text-xs text-muted-foreground font-mono">{nodeData.nodeType}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <StateBadge state={nodeData.state} />
          {nodeData.mvpStatus && (
            <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-400">
              {nodeData.mvpStatus}
            </Badge>
          )}
          {nodeData.duration && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Clock className="w-3 h-3" />
              {nodeData.duration}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <Tabs defaultValue="audit" className="w-full">
          <TabsList className="w-full justify-start px-4 pt-4 bg-transparent">
            <TabsTrigger value="audit" className="text-xs">Audit</TabsTrigger>
            <TabsTrigger value="evidence" className="text-xs">Evidence</TabsTrigger>
            <TabsTrigger value="policy" className="text-xs">Policy</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="p-4 space-y-3">
            {/* What */}
            <Section 
              icon={Info} 
              title="What" 
              content={auditSections.what}
              highlight
            />

            {/* Why */}
            <Section 
              icon={Shield} 
              title="Why" 
              content={auditSections.why}
            />

            {/* Who */}
            <Section 
              icon={User} 
              title="Who" 
              content={auditSections.who}
            />

            {/* When */}
            <Section 
              icon={Calendar} 
              title="When" 
              content={new Date(auditSections.when).toLocaleString()}
            />

            {/* Artifact Details */}
            {nodeData.nodeType === 'artifact.image' && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Artifact Details</h4>
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                    {nodeData.imageName && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Image</span>
                        <span className="font-mono text-foreground">{nodeData.imageName}</span>
                      </div>
                    )}
                    {nodeData.registry && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Registry</span>
                        <span className="text-foreground">{nodeData.registry}</span>
                      </div>
                    )}
                    {nodeData.tag && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Tag</span>
                        <span className="font-mono text-foreground">{nodeData.tag}</span>
                      </div>
                    )}
                    {nodeData.digest && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Digest</span>
                        <span className="font-mono text-foreground truncate max-w-[200px]">{nodeData.digest}</span>
                      </div>
                    )}
                    {nodeData.signed !== undefined && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Signed</span>
                        <span className={nodeData.signed ? 'text-emerald-400' : 'text-red-400'}>
                          {nodeData.signed ? 'Yes (Cosign)' : 'No'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Approval Details */}
            {nodeData.nodeType === 'approval.gate' && nodeData.approvers && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approvals</h4>
                  <div className="space-y-2">
                    {nodeData.approvers.map((approver, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <div className="flex-1">
                          <div className="text-sm text-foreground">{approver.user}</div>
                          <div className="text-xs text-muted-foreground">{approver.role}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(approver.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                    {nodeData.pendingApprovals && nodeData.pendingApprovals > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-amber-400">
                          Waiting for {nodeData.pendingApprovals} more approval{nodeData.pendingApprovals > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="evidence" className="p-4 space-y-3">
            {nodeData.reportUrl ? (
              <a 
                href={nodeData.reportUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">View Report</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No evidence links available</p>
              </div>
            )}

            {nodeData.evidenceLinks && nodeData.evidenceLinks.length > 0 && (
              <div className="space-y-2">
                {nodeData.evidenceLinks.map((link, i) => (
                  <a 
                    key={i}
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-foreground">{link.label}</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            )}

            {/* Digest */}
            {nodeData.digest && (
              <Section 
                icon={Lock} 
                title="Cryptographic Hash" 
                content={nodeData.digest}
                copyable
              />
            )}
          </TabsContent>

          <TabsContent value="policy" className="p-4 space-y-3">
            {auditSections.policyRef && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">Policy Reference</span>
                </div>
                <p className="text-sm text-foreground">{auditSections.policyRef}</p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Compliance</h4>
              <div className="space-y-1.5">
                {['SOC 2 Type II', 'ISO 27001', 'GDPR'].map((comp) => (
                  <div key={comp} className="flex items-center gap-2 p-2 bg-muted/30 rounded border border-border/50">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-foreground">{comp}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : auditLogs.length > 0 ? (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-2 bg-muted/30 rounded border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{log.action}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{log.resource_type}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No history available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <Lock className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-400">
            This record is immutable and cryptographically linked to artifact SHA
          </span>
        </div>
      </div>
    </motion.div>
  );
});
OpzenixInspectorPanel.displayName = 'OpzenixInspectorPanel';

export default OpzenixInspectorPanel;
