import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  GitBranch,
  Box,
  Clock,
  MessageSquare,
  Link2,
  Target,
  User,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApprovalGateProps {
  executionId: string;
  checkpointId: string;
  environment: 'uat' | 'preprod' | 'prod';
  artifactRef: string;
  branch: string;
  preconditions: {
    ciPassed: boolean;
    testsPassed: boolean;
    sastClean: boolean;
    imageScanClean: boolean;
    devHealthy: boolean;
  };
  changeSummary: {
    filesChanged: number;
    riskLevel: 'low' | 'medium' | 'high';
    aiSummary: string;
  };
  userRole: string;
  onApprove?: () => void;
  onReject?: () => void;
}

const envColors = {
  uat: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  preprod: 'bg-sec-warning/20 text-sec-warning border-sec-warning/30',
  prod: 'bg-sec-critical/20 text-sec-critical border-sec-critical/30',
};

const riskColors = {
  low: 'bg-sec-safe/20 text-sec-safe',
  medium: 'bg-sec-warning/20 text-sec-warning',
  high: 'bg-sec-critical/20 text-sec-critical',
};

export function ApprovalGate({
  executionId,
  checkpointId,
  environment,
  artifactRef,
  branch,
  preconditions,
  changeSummary,
  userRole,
  onApprove,
  onReject,
}: ApprovalGateProps) {
  const [comment, setComment] = useState('');
  const [businessSignoff, setBusinessSignoff] = useState(false);
  const [regressionReview, setRegressionReview] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [impactScope, setImpactScope] = useState<string>('internal');
  const [submitting, setSubmitting] = useState(false);

  const allPreconditionsPassed = Object.values(preconditions).every(Boolean);
  const canApprove = comment.trim().length > 0 && allPreconditionsPassed;

  const handleApprove = async () => {
    if (!canApprove) return;
    
    setSubmitting(true);
    try {
      // Create audit log entry
      await supabase.from('audit_logs').insert({
        action: 'deployment_approved',
        resource_type: 'execution',
        resource_id: executionId,
        details: {
          execution_id: executionId,
          checkpoint_id: checkpointId,
          environment,
          decision: 'approved',
          comment,
          ticket_id: ticketId || null,
          impact_scope: impactScope,
          business_signoff: businessSignoff,
          regression_review: regressionReview,
          role: userRole,
          timestamp: new Date().toISOString(),
        },
      });

      toast.success(`Deployment to ${environment.toUpperCase()} approved`);
      onApprove?.();
    } catch (error) {
      toast.error('Failed to record approval');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error('Comment is required for rejection');
      return;
    }

    setSubmitting(true);
    try {
      // Create audit log entry
      await supabase.from('audit_logs').insert({
        action: 'deployment_rejected',
        resource_type: 'execution',
        resource_id: executionId,
        details: {
          execution_id: executionId,
          checkpoint_id: checkpointId,
          environment,
          decision: 'rejected',
          comment,
          ticket_id: ticketId || null,
          role: userRole,
          timestamp: new Date().toISOString(),
        },
      });

      toast.warning(`Deployment to ${environment.toUpperCase()} rejected`);
      onReject?.();
    } catch (error) {
      toast.error('Failed to record rejection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Context Header */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-primary" />
              Approval Gate
            </CardTitle>
            <Badge className={cn('uppercase text-[10px]', envColors[environment])}>
              {environment}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Execution:</span>
              <code className="font-mono text-[10px] bg-secondary px-1.5 py-0.5 rounded">
                {executionId.slice(0, 8)}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Branch:</span>
              <span className="font-medium">{branch}</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Box className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Artifact:</span>
              <code className="font-mono text-[10px] bg-secondary px-1.5 py-0.5 rounded truncate max-w-[200px]">
                {artifactRef}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preconditions */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            Preconditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'ciPassed', label: 'CI Status', value: preconditions.ciPassed },
              { key: 'testsPassed', label: 'Tests Passed', value: preconditions.testsPassed },
              { key: 'sastClean', label: 'SAST Clean', value: preconditions.sastClean },
              { key: 'imageScanClean', label: 'Image Scan', value: preconditions.imageScanClean },
              { key: 'devHealthy', label: 'Dev Healthy', value: preconditions.devHealthy },
            ].map((item) => (
              <div
                key={item.key}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs',
                  item.value 
                    ? 'bg-sec-safe/10 text-sec-safe' 
                    : 'bg-sec-critical/10 text-sec-critical'
                )}
              >
                {item.value ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          {!allPreconditionsPassed && (
            <div className="mt-3 p-2 bg-sec-critical/10 rounded-md flex items-center gap-2 text-xs text-sec-critical">
              <AlertTriangle className="w-3.5 h-3.5" />
              All preconditions must pass before approval
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Summary */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            Change Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Files:</span>
              <span className="font-medium">{changeSummary.filesChanged}</span>
            </div>
            <Badge className={cn('text-[10px]', riskColors[changeSummary.riskLevel])}>
              {changeSummary.riskLevel} risk
            </Badge>
          </div>
          <div className="p-3 bg-secondary/30 rounded-md text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">AI Impact Analysis:</p>
            {changeSummary.aiSummary}
          </div>
        </CardContent>
      </Card>

      {/* Approval Inputs */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            Approval Decision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">
              Comment <span className="text-sec-critical">*</span>
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide approval justification..."
              className="min-h-[80px] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="business-signoff"
                checked={businessSignoff}
                onCheckedChange={(checked) => setBusinessSignoff(checked as boolean)}
              />
              <Label htmlFor="business-signoff" className="text-xs cursor-pointer">
                Business Sign-off
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="regression-review"
                checked={regressionReview}
                onCheckedChange={(checked) => setRegressionReview(checked as boolean)}
              />
              <Label htmlFor="regression-review" className="text-xs cursor-pointer">
                Regression Review
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Change Ticket</Label>
              <Input
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder="JIRA-1234"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Impact Scope</Label>
              <Select value={impactScope} onValueChange={setImpactScope}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal Only</SelectItem>
                  <SelectItem value="external">External Facing</SelectItem>
                  <SelectItem value="critical">Critical Path</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 p-2 rounded">
            <User className="w-3.5 h-3.5" />
            <span>Approving as:</span>
            <Badge variant="outline" className="text-[10px]">{userRole}</Badge>
          </div>

          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={submitting || !comment.trim()}
              className="flex-1 gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={submitting || !canApprove}
              className="flex-1 gap-1.5 bg-sec-safe hover:bg-sec-safe/90"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve Deployment
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ApprovalGate;
