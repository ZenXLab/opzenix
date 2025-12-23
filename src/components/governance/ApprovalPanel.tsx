import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock,
  User,
  MessageSquare,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useFlowStore, ApprovalRequest } from '@/stores/flowStore';
import { cn } from '@/lib/utils';

const ApprovalPanel = () => {
  const { approvalRequests, updateApprovalRequest } = useFlowStore();
  const [comment, setComment] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const handleVote = (requestId: string, approved: boolean) => {
    const request = approvalRequests.find(r => r.id === requestId);
    if (!request) return;

    const newApprovals = approved ? request.currentApprovals + 1 : request.currentApprovals;
    const newStatus = newApprovals >= request.requiredApprovals 
      ? 'approved' 
      : approved ? 'pending' : 'rejected';

    updateApprovalRequest(requestId, {
      currentApprovals: newApprovals,
      status: newStatus,
    });

    setComment('');
    setSelectedRequest(null);
  };

  const pendingRequests = approvalRequests.filter(r => r.status === 'pending');

  if (pendingRequests.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 w-96 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-40"
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 bg-sec-warning/10 border-b border-border">
        <Shield className="w-4 h-4 text-sec-warning" />
        <span className="text-sm font-semibold text-foreground">
          Pending Approvals ({pendingRequests.length})
        </span>
      </div>

      {/* Requests */}
      <div className="max-h-80 overflow-y-auto">
        {pendingRequests.map((request) => (
          <ApprovalItem
            key={request.id}
            request={request}
            isExpanded={selectedRequest === request.id}
            onToggle={() => setSelectedRequest(
              selectedRequest === request.id ? null : request.id
            )}
            comment={selectedRequest === request.id ? comment : ''}
            onCommentChange={setComment}
            onVote={handleVote}
          />
        ))}
      </div>
    </motion.div>
  );
};

interface ApprovalItemProps {
  request: ApprovalRequest;
  isExpanded: boolean;
  onToggle: () => void;
  comment: string;
  onCommentChange: (value: string) => void;
  onVote: (requestId: string, approved: boolean) => void;
}

const ApprovalItem = ({ 
  request, 
  isExpanded, 
  onToggle, 
  comment, 
  onCommentChange,
  onVote 
}: ApprovalItemProps) => {
  return (
    <div className="border-b border-border last:border-0">
      {/* Summary */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-start gap-3 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="mt-0.5">
          <Clock className="w-4 h-4 text-sec-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground truncate">
              {request.title}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{request.createdAt}</span>
            <span>•</span>
            <span>{request.currentApprovals}/{request.requiredApprovals} approvals</span>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px] border-sec-warning text-sec-warning">
          Pending
        </Badge>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-3 pb-3 space-y-3"
        >
          {request.description && (
            <p className="text-xs text-muted-foreground pl-7">
              {request.description}
            </p>
          )}

          {/* Progress */}
          <div className="pl-7">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Approval Progress</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-sec-safe transition-all"
                style={{ width: `${(request.currentApprovals / request.requiredApprovals) * 100}%` }}
              />
            </div>
          </div>

          {/* Comment */}
          <div className="pl-7">
            <Textarea
              placeholder="Add a comment (optional)..."
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              className="min-h-[60px] text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pl-7">
            <Button
              size="sm"
              className="flex-1 gap-1 bg-sec-safe hover:bg-sec-safe/90"
              onClick={() => onVote(request.id, true)}
            >
              <ThumbsUp className="w-3 h-3" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 gap-1"
              onClick={() => onVote(request.id, false)}
            >
              <ThumbsDown className="w-3 h-3" />
              Reject
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ApprovalPanel;
