import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Shield,
  Lock,
  FileText,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Rocket,
  ArrowRight,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useRBACPermissions } from '@/hooks/useRBACPermissions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================
// ⚡ ACTION PANEL MODAL (MVP 1.0.0 LOCKED)
// ============================================
// OPENS ONLY after clicking approval gate or deploy request
// Shows:
// - Context
// - Required role
// - Policy reference
// - Audit warning
// - NO actions embedded in flow canvas
// ============================================

export interface ActionContext {
  type: 'approval' | 'deploy';
  environment: string;
  nodeId: string;
  nodeName: string;
  requiredRole: string;
  policyReference: string;
}

interface ActionPanelModalProps {
  open: boolean;
  onClose: () => void;
  context: ActionContext | null;
  onConfirmAction: (context: ActionContext, comment: string) => void;
}

const POLICY_DETAILS: Record<string, { title: string; description: string; link: string }> = {
  'POL-DEPLOY-001': {
    title: 'Production Deployment Policy',
    description: 'Requires 3 approvals from CTO, Security Head, and Platform Owner. Break-glass available for CTO only.',
    link: '/docs/governance/deployment-policy',
  },
  'POL-DEPLOY-002': {
    title: 'Standard Deployment Policy',
    description: 'Requires environment-appropriate approvals. All actions are logged to immutable audit trail.',
    link: '/docs/governance/standard-policy',
  },
};

export function ActionPanelModal({
  open,
  onClose,
  context,
  onConfirmAction,
}: ActionPanelModalProps) {
  const [comment, setComment] = useState('');
  const [acknowledgedAudit, setAcknowledgedAudit] = useState(false);
  const [acknowledgedPolicy, setAcknowledgedPolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { dbRole, canApprove, canDeploy, isAdmin } = useRBACPermissions();

  if (!context) return null;

  const isProd = context.environment === 'prod';
  const policy = POLICY_DETAILS[context.policyReference] || POLICY_DETAILS['POL-DEPLOY-002'];

  // Check if user has permission
  const hasPermission = context.type === 'approval'
    ? canApprove(context.environment as any)
    : canDeploy(context.environment as any);

  const handleSubmit = async () => {
    if (!acknowledgedAudit || !acknowledgedPolicy) {
      toast.error('Please acknowledge all requirements before proceeding');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please provide a justification comment');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmAction(context, comment);
      toast.success(`${context.type === 'approval' ? 'Approval' : 'Deploy'} request submitted`);
      onClose();
      setComment('');
      setAcknowledgedAudit(false);
      setAcknowledgedPolicy(false);
    } catch (error) {
      toast.error('Action failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setComment('');
    setAcknowledgedAudit(false);
    setAcknowledgedPolicy(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        'sm:max-w-[600px] p-0 gap-0',
        isProd && 'border-sec-danger/50'
      )}>
        {/* Header with Environment Context */}
        <DialogHeader className={cn(
          'p-6 pb-4 border-b',
          isProd ? 'border-sec-danger/30 bg-sec-danger/5' : 'border-border bg-card/50'
        )}>
          <div className="flex items-start gap-4">
            <div className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center',
              context.type === 'approval' ? 'bg-sec-safe/10' : 'bg-primary/10'
            )}>
              {context.type === 'approval' ? (
                <CheckCircle className="w-6 h-6 text-sec-safe" />
              ) : (
                <Rocket className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg">
                {context.type === 'approval' ? 'Approval Request' : 'Deploy Request'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {context.nodeName} • {context.environment.toUpperCase()} Environment
              </DialogDescription>
            </div>
            {isProd && (
              <Badge variant="destructive" className="gap-1">
                <Lock className="w-3 h-3" />
                PROD
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-6">
            {/* Context Section */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                Action Context
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Environment</span>
                  <p className="text-sm font-medium text-foreground mt-1">{context.environment.toUpperCase()}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Action Type</span>
                  <p className="text-sm font-medium text-foreground mt-1 capitalize">{context.type}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Node ID</span>
                  <p className="text-sm font-mono text-foreground mt-1">{context.nodeId}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Target</span>
                  <p className="text-sm font-medium text-foreground mt-1">{context.nodeName}</p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Required Role Section */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Required Role
              </h4>
              <div className={cn(
                'p-4 rounded-lg border',
                hasPermission ? 'border-sec-safe/50 bg-sec-safe/5' : 'border-sec-danger/50 bg-sec-danger/5'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className={cn(
                      'w-5 h-5',
                      hasPermission ? 'text-sec-safe' : 'text-sec-danger'
                    )} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{context.requiredRole}</p>
                      <p className="text-xs text-muted-foreground">
                        Your role: {dbRole?.toUpperCase() || 'VIEWER'}
                      </p>
                    </div>
                  </div>
                  {hasPermission ? (
                    <Badge variant="outline" className="text-sec-safe border-sec-safe/50">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Authorized
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-sec-danger border-sec-danger/50">
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Authorized
                    </Badge>
                  )}
                </div>
              </div>
            </section>

            <Separator />

            {/* Policy Reference Section */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Policy Reference
              </h4>
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{policy.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{context.policyReference}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View Policy
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">{policy.description}</p>
              </div>
            </section>

            <Separator />

            {/* Audit Warning Section */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-sec-warning" />
                Audit Warning
              </h4>
              <div className="p-4 rounded-lg border border-sec-warning/50 bg-sec-warning/5">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-sec-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">This action will be permanently recorded</p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                      <li>• Your identity and role will be logged</li>
                      <li>• Timestamp and IP address will be recorded</li>
                      <li>• The audit entry is immutable and cannot be deleted</li>
                      <li>• This record may be reviewed for compliance audits</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Justification Comment */}
            {hasPermission && (
              <>
                <Separator />
                <section className="space-y-3">
                  <Label htmlFor="comment" className="text-sm font-semibold">
                    Justification (Required)
                  </Label>
                  <Textarea
                    id="comment"
                    placeholder="Provide a justification for this action..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </section>

                {/* Acknowledgements */}
                <section className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="audit-ack"
                      checked={acknowledgedAudit}
                      onCheckedChange={(checked) => setAcknowledgedAudit(checked as boolean)}
                    />
                    <Label htmlFor="audit-ack" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      I understand this action will be permanently logged to the immutable audit trail
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="policy-ack"
                      checked={acknowledgedPolicy}
                      onCheckedChange={(checked) => setAcknowledgedPolicy(checked as boolean)}
                    />
                    <Label htmlFor="policy-ack" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      I confirm I have reviewed the applicable policy ({context.policyReference})
                    </Label>
                  </div>
                </section>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-6 pt-4 border-t border-border bg-muted/30">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {hasPermission ? (
            <Button
              onClick={handleSubmit}
              disabled={!acknowledgedAudit || !acknowledgedPolicy || !comment.trim() || isSubmitting}
              className={cn(
                'gap-2',
                context.type === 'approval' ? 'bg-sec-safe hover:bg-sec-safe/90' : ''
              )}
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  {context.type === 'approval' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Rocket className="w-4 h-4" />
                  )}
                  Confirm {context.type === 'approval' ? 'Approval' : 'Deploy'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          ) : (
            <Button disabled className="gap-2">
              <XCircle className="w-4 h-4" />
              Insufficient Permissions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ActionPanelModal;
