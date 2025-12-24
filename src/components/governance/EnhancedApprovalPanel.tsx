import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, CheckCircle2, XCircle, Clock, User, MessageSquare,
  ThumbsUp, ThumbsDown, FileText, Link2, AlertTriangle,
  Clipboard, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useFlowStore, ApprovalRequest } from '@/stores/flowStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EvidenceLink {
  type: 'logs' | 'scans' | 'tests' | 'artifact' | 'other';
  label: string;
  url: string;
}

const EnhancedApprovalPanel = () => {
  const { approvalRequests, updateApprovalRequest } = useFlowStore();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [changeTicketId, setChangeTicketId] = useState('');
  const [impactScope, setImpactScope] = useState<string>('');
  const [businessSignoff, setBusinessSignoff] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const pendingRequests = approvalRequests.filter(r => r.status === 'pending');

  const handleVote = async (requestId: string, approved: boolean) => {
    if (!comment.trim()) {
      toast.error('Comment is mandatory for approval decisions');
      return;
    }

    const request = approvalRequests.find(r => r.id === requestId);
    if (!request) return;

    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id || 'anonymous';

      // Record the vote
      await supabase.from('approval_votes').insert({
        approval_request_id: requestId,
        user_id: userId,
        vote: approved,
        comment: comment,
      });

      // Update approval request
      const newApprovals = approved ? request.currentApprovals + 1 : request.currentApprovals;
      const newStatus = !approved ? 'rejected' : 
        (newApprovals >= request.requiredApprovals ? 'approved' : 'pending');

      await supabase.from('approval_requests')
        .update({
          current_approvals: newApprovals,
          status: newStatus,
          resolved_at: newStatus !== 'pending' ? new Date().toISOString() : null
        })
        .eq('id', requestId);

      // Log to audit
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: approved ? 'APPROVAL_GRANTED' : 'APPROVAL_REJECTED',
        resource_type: 'approval_request',
        resource_id: requestId,
        details: {
          comment,
          change_ticket_id: changeTicketId || null,
          impact_scope: impactScope || null,
          business_signoff: businessSignoff,
          new_status: newStatus
        }
      });

      // Update local state
      updateApprovalRequest(requestId, {
        currentApprovals: newApprovals,
        status: newStatus,
      });

      toast.success(approved ? 'Approval granted' : 'Request rejected');
      
      // Reset form
      setComment('');
      setChangeTicketId('');
      setImpactScope('');
      setBusinessSignoff(false);
      setSelectedRequest(null);
    } catch (error: any) {
      console.error('Error processing vote:', error);
      toast.error('Failed to process vote');
    }
  };

  const mockEvidenceLinks: EvidenceLink[] = [
    { type: 'logs', label: 'Pipeline Logs', url: '#logs' },
    { type: 'scans', label: 'Security Scan Report', url: '#scans' },
    { type: 'tests', label: 'Test Results', url: '#tests' },
    { type: 'artifact', label: 'Artifact Registry', url: '#artifacts' },
  ];

  if (pendingRequests.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 w-[420px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-40"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 bg-sec-warning/10 border-b border-border cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-sec-warning" />
          <span className="font-semibold text-foreground">
            Pending Approvals
          </span>
          <Badge variant="outline" className="text-xs border-sec-warning text-sec-warning">
            {pendingRequests.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <ScrollArea className="max-h-[500px]">
              {pendingRequests.map((request) => (
                <ApprovalItem
                  key={request.id}
                  request={request}
                  isExpanded={selectedRequest === request.id}
                  onToggle={() => setSelectedRequest(selectedRequest === request.id ? null : request.id)}
                  comment={comment}
                  onCommentChange={setComment}
                  changeTicketId={changeTicketId}
                  onChangeTicketIdChange={setChangeTicketId}
                  impactScope={impactScope}
                  onImpactScopeChange={setImpactScope}
                  businessSignoff={businessSignoff}
                  onBusinessSignoffChange={setBusinessSignoff}
                  evidenceLinks={mockEvidenceLinks}
                  onVote={handleVote}
                />
              ))}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface ApprovalItemProps {
  request: ApprovalRequest;
  isExpanded: boolean;
  onToggle: () => void;
  comment: string;
  onCommentChange: (value: string) => void;
  changeTicketId: string;
  onChangeTicketIdChange: (value: string) => void;
  impactScope: string;
  onImpactScopeChange: (value: string) => void;
  businessSignoff: boolean;
  onBusinessSignoffChange: (value: boolean) => void;
  evidenceLinks: EvidenceLink[];
  onVote: (requestId: string, approved: boolean) => void;
}

const ApprovalItem = ({ 
  request, 
  isExpanded, 
  onToggle, 
  comment,
  onCommentChange,
  changeTicketId,
  onChangeTicketIdChange,
  impactScope,
  onImpactScopeChange,
  businessSignoff,
  onBusinessSignoffChange,
  evidenceLinks,
  onVote 
}: ApprovalItemProps) => {
  const getEvidenceIcon = (type: EvidenceLink['type']) => {
    switch (type) {
      case 'logs': return <FileText className="w-3 h-3" />;
      case 'scans': return <Shield className="w-3 h-3" />;
      case 'tests': return <CheckCircle2 className="w-3 h-3" />;
      case 'artifact': return <Clipboard className="w-3 h-3" />;
      default: return <Link2 className="w-3 h-3" />;
    }
  };

  return (
    <div className="border-b border-border last:border-0">
      {/* Summary */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="mt-0.5">
          <AlertTriangle className="w-5 h-5 text-sec-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-foreground truncate">
              {request.title}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span>{request.createdAt}</span>
            <span>•</span>
            <span className="font-medium">{request.currentApprovals}/{request.requiredApprovals} approvals</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-sec-safe transition-all"
              style={{ width: `${(request.currentApprovals / request.requiredApprovals) * 100}%` }}
            />
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 space-y-4"
          >
            {request.description && (
              <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
                {request.description}
              </p>
            )}

            <Separator />

            {/* Evidence Links */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Evidence & Reports</Label>
              <div className="flex flex-wrap gap-2">
                {evidenceLinks.map((link, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                  >
                    {getEvidenceIcon(link.type)}
                    {link.label}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Mandatory Comment */}
            <div>
              <Label className="text-xs mb-1.5 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Comment <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="Explain your decision (mandatory)..."
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
                className="min-h-[80px] text-sm"
              />
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5">Change Ticket ID</Label>
                <Input
                  placeholder="JIRA-1234"
                  value={changeTicketId}
                  onChange={(e) => onChangeTicketIdChange(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5">Impact Scope</Label>
                <Select value={impactScope} onValueChange={onImpactScopeChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Single Service</SelectItem>
                    <SelectItem value="cluster">Cluster</SelectItem>
                    <SelectItem value="region">Region</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Business Signoff */}
            <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
              <Checkbox
                id="business-signoff"
                checked={businessSignoff}
                onCheckedChange={(checked) => onBusinessSignoffChange(checked as boolean)}
              />
              <Label htmlFor="business-signoff" className="text-sm cursor-pointer">
                Business sign-off confirmed
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 gap-2 bg-sec-safe hover:bg-sec-safe/90"
                onClick={() => onVote(request.id, true)}
                disabled={!comment.trim()}
              >
                <ThumbsUp className="w-4 h-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-2"
                onClick={() => onVote(request.id, false)}
                disabled={!comment.trim()}
              >
                <ThumbsDown className="w-4 h-4" />
                Reject
              </Button>
            </div>

            {!comment.trim() && (
              <p className="text-xs text-destructive text-center">
                ⚠️ Comment is required before voting
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedApprovalPanel;
