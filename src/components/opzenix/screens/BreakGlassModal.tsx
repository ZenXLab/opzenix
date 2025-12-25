import { useState } from 'react';
import {
  AlertTriangle,
  Shield,
  Lock,
  FileText,
  User,
  Clock,
  XCircle,
  Zap,
  Eye,
  AlertOctagon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================
// 🚨 BREAK-GLASS EMERGENCY MODAL (CTO ONLY)
// ============================================
// Enhanced audit logging
// Requires CTO role
// Multi-step confirmation
// Incident ID required
// ============================================

interface BreakGlassModalProps {
  open: boolean;
  onClose: () => void;
  environment: string;
  nodeId?: string;
  nodeName?: string;
}

const EMERGENCY_REASONS = [
  { id: 'critical_incident', label: 'Critical Production Incident (P0/P1)' },
  { id: 'security_breach', label: 'Active Security Breach Response' },
  { id: 'data_loss', label: 'Data Loss Prevention' },
  { id: 'compliance_mandate', label: 'Regulatory Compliance Mandate' },
  { id: 'customer_impact', label: 'Severe Customer Impact' },
];

export function BreakGlassModal({
  open,
  onClose,
  environment,
  nodeId,
  nodeName,
}: BreakGlassModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [incidentId, setIncidentId] = useState('');
  const [justification, setJustification] = useState('');
  const [ackAudit, setAckAudit] = useState(false);
  const [ackConsequences, setAckConsequences] = useState(false);
  const [ackNotification, setAckNotification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { dbRole, canBreakGlass, isAdmin, userId } = useRBACPermissions();

  const hasPermission = canBreakGlass();
  const isProd = environment === 'prod';

  const handleSubmit = async () => {
    if (!ackAudit || !ackConsequences || !ackNotification) {
      toast.error('All acknowledgements are required');
      return;
    }

    if (!incidentId.trim() || !justification.trim() || !selectedReason) {
      toast.error('All fields are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Enhanced audit log for break-glass
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'break_glass',
        resource_type: 'emergency_override',
        resource_id: nodeId || 'system',
        details: {
          environment,
          nodeName,
          nodeId,
          reason: selectedReason,
          incidentId,
          justification,
          acknowledgements: {
            audit: ackAudit,
            consequences: ackConsequences,
            notification: ackNotification,
          },
          timestamp: new Date().toISOString(),
          userRole: dbRole,
          ipAddress: 'logged-server-side',
          breakGlassLevel: isProd ? 'CRITICAL' : 'ELEVATED',
        },
      });

      // Create notification event for security team
      await supabase.from('notification_events').insert({
        type: 'break_glass_activated',
        target: 'security_team',
        payload: {
          userId: user?.id,
          environment,
          incidentId,
          reason: selectedReason,
          timestamp: new Date().toISOString(),
        },
      });

      toast.success('Break-glass override activated. Security team notified.');
      resetAndClose();
    } catch (error) {
      console.error('Break-glass failed:', error);
      toast.error('Failed to activate break-glass. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedReason('');
    setIncidentId('');
    setJustification('');
    setAckAudit(false);
    setAckConsequences(false);
    setAckNotification(false);
    onClose();
  };

  if (!hasPermission) {
    return (
      <Dialog open={open} onOpenChange={resetAndClose}>
        <DialogContent className="sm:max-w-[500px] border-sec-danger/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-sec-danger">
              <XCircle className="w-6 h-6" />
              Access Denied
            </DialogTitle>
            <DialogDescription>
              Break-glass emergency override requires CTO authorization.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 text-center">
            <Lock className="w-16 h-16 mx-auto text-sec-danger/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              Your current role ({dbRole?.toUpperCase() || 'VIEWER'}) does not have break-glass permissions.
              Contact your CTO for emergency access.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={resetAndClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 border-sec-danger/50 overflow-hidden">
        {/* Emergency Header */}
        <DialogHeader className="p-6 pb-4 bg-sec-danger/10 border-b border-sec-danger/30">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-sec-danger/20 flex items-center justify-center animate-pulse">
              <AlertOctagon className="w-8 h-8 text-sec-danger" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl text-sec-danger flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Break-Glass Emergency Override
              </DialogTitle>
              <DialogDescription className="mt-1 text-sec-danger/80">
                Bypasses normal approval workflow • CTO Authorization Required
              </DialogDescription>
            </div>
            <Badge variant="destructive" className="gap-1 animate-pulse">
              <Lock className="w-3 h-3" />
              {isProd ? 'PROD CRITICAL' : 'ELEVATED'}
            </Badge>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                    step >= s
                      ? 'bg-sec-danger text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      'w-16 h-1 mx-1 rounded transition-colors',
                      step > s ? 'bg-sec-danger' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="p-6 space-y-6">
            {/* Step 1: Reason Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-sec-warning" />
                  Select Emergency Reason
                </h4>
                <div className="space-y-2">
                  {EMERGENCY_REASONS.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={cn(
                        'w-full p-4 rounded-lg border text-left transition-all',
                        selectedReason === reason.id
                          ? 'border-sec-danger bg-sec-danger/10 ring-2 ring-sec-danger/30'
                          : 'border-border hover:border-sec-danger/50 hover:bg-muted/30'
                      )}
                    >
                      <span className="text-sm font-medium text-foreground">{reason.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incident-id" className="text-sm font-medium">
                    Incident/Ticket ID (Required)
                  </Label>
                  <Input
                    id="incident-id"
                    placeholder="e.g., INC-2024-001234"
                    value={incidentId}
                    onChange={(e) => setIncidentId(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Justification */}
            {step === 2 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Provide Detailed Justification
                </h4>

                <div className="p-4 rounded-lg border border-sec-warning/50 bg-sec-warning/5">
                  <p className="text-xs text-sec-warning">
                    This justification will be permanently recorded in the audit trail and may be
                    reviewed by security, compliance, and executive teams.
                  </p>
                </div>

                <Textarea
                  placeholder="Describe the emergency situation, what actions you're taking, and why normal approval process cannot be followed..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="min-h-[150px] resize-none"
                />

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-border bg-muted/30">
                    <span className="text-muted-foreground">Reason</span>
                    <p className="font-medium text-foreground mt-1">
                      {EMERGENCY_REASONS.find((r) => r.id === selectedReason)?.label || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-muted/30">
                    <span className="text-muted-foreground">Incident ID</span>
                    <p className="font-medium font-mono text-foreground mt-1">{incidentId}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Acknowledgements */}
            {step === 3 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sec-danger" />
                  Final Acknowledgements
                </h4>

                <div className="p-4 rounded-lg border border-sec-danger bg-sec-danger/5 space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="ack-audit"
                      checked={ackAudit}
                      onCheckedChange={(checked) => setAckAudit(checked as boolean)}
                      className="border-sec-danger data-[state=checked]:bg-sec-danger"
                    />
                    <Label htmlFor="ack-audit" className="text-sm leading-relaxed cursor-pointer">
                      I understand this action will create an <strong>immutable audit record</strong> including
                      my identity, IP address, timestamp, and all details provided.
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="ack-consequences"
                      checked={ackConsequences}
                      onCheckedChange={(checked) => setAckConsequences(checked as boolean)}
                      className="border-sec-danger data-[state=checked]:bg-sec-danger"
                    />
                    <Label htmlFor="ack-consequences" className="text-sm leading-relaxed cursor-pointer">
                      I accept responsibility for this emergency override and understand it may be
                      subject to <strong>post-incident review</strong> by security and compliance teams.
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="ack-notification"
                      checked={ackNotification}
                      onCheckedChange={(checked) => setAckNotification(checked as boolean)}
                      className="border-sec-danger data-[state=checked]:bg-sec-danger"
                    />
                    <Label htmlFor="ack-notification" className="text-sm leading-relaxed cursor-pointer">
                      I acknowledge that the <strong>Security Team, Platform Owners, and Executive Leadership</strong>
                      will be automatically notified of this break-glass activation.
                    </Label>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Environment</span>
                    <Badge variant="destructive">{environment.toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Authorized By</span>
                    <span className="font-medium">{dbRole?.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Incident</span>
                    <span className="font-mono">{incidentId}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-6 pt-4 border-t border-border bg-muted/30 gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((step - 1) as 1 | 2)}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          
          {step < 3 ? (
            <Button
              onClick={() => setStep((step + 1) as 2 | 3)}
              disabled={
                (step === 1 && (!selectedReason || !incidentId.trim())) ||
                (step === 2 && !justification.trim())
              }
              className="bg-sec-danger hover:bg-sec-danger/90"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!ackAudit || !ackConsequences || !ackNotification || isSubmitting}
              className="bg-sec-danger hover:bg-sec-danger/90 gap-2"
            >
              {isSubmitting ? (
                'Activating...'
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Activate Break-Glass
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BreakGlassModal;
