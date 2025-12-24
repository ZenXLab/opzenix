import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Lock, Unlock, Shield, AlertTriangle, CheckCircle2, Users,
  History, MessageSquare, Clock, GitBranch, ExternalLink,
  FileText, Eye, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

interface EnvironmentLock {
  id: string;
  environment: string;
  is_locked: boolean;
  required_role: 'admin' | 'operator' | 'viewer';
  requires_approval: boolean;
  unlocked_by: string | null;
  unlocked_at: string | null;
  lock_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface BranchMapping {
  id: string;
  branch_pattern: string;
  environment: string;
  is_deployable: boolean;
}

// Branch → Environment Lock Rules (CORE GOVERNANCE)
const BRANCH_RULES = [
  { pattern: 'feature/*', environment: 'DEV', locked: false, approval: false },
  { pattern: 'develop', environment: 'DEV', locked: false, approval: false },
  { pattern: 'release/*', environment: 'UAT', locked: true, approval: true },
  { pattern: 'main', environment: 'STAGING', locked: true, approval: true },
  { pattern: 'main (tagged)', environment: 'PROD', locked: true, approval: true, hardLocked: true },
];

// RBAC Matrix
const RBAC_MATRIX = {
  DEV: { viewer: '👁', developer: '✅', operator: '✅', approver: '❌', admin: '✅' },
  UAT: { viewer: '👁', developer: '❌', operator: '🔓', approver: '✅', admin: '✅' },
  STAGING: { viewer: '👁', developer: '❌', operator: '❌', approver: '✅', admin: '✅' },
  PROD: { viewer: '👁', developer: '❌', operator: '❌', approver: '❌', admin: '🔓' },
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin / Release Manager',
  operator: 'Operator / DevOps',
  viewer: 'All Users',
};

export function EnhancedEnvironmentLocksPanel() {
  const { role: userRole, isAdmin, isOperator } = useUserRole();
  const [locks, setLocks] = useState<EnvironmentLock[]>([]);
  const [branchMappings, setBranchMappings] = useState<BranchMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockDialog, setUnlockDialog] = useState<{ open: boolean; lock: EnvironmentLock | null }>({
    open: false,
    lock: null,
  });
  const [unlockComment, setUnlockComment] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchLocks();
    fetchBranchMappings();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('enhanced-environment-locks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'environment_locks' }, fetchLocks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'branch_mappings' }, fetchBranchMappings)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLocks = async () => {
    const { data, error } = await supabase
      .from('environment_locks')
      .select('*')
      .order('environment', { ascending: true });

    if (!error && data) {
      const order = ['DEV', 'UAT', 'Staging', 'PreProd', 'Prod'];
      const sorted = data.sort((a, b) => 
        order.indexOf(a.environment) - order.indexOf(b.environment)
      );
      setLocks(sorted as EnvironmentLock[]);
    }
    setLoading(false);
  };

  const fetchBranchMappings = async () => {
    const { data } = await supabase
      .from('branch_mappings')
      .select('*')
      .order('environment');
    if (data) setBranchMappings(data);
  };

  const canUnlock = (lock: EnvironmentLock): boolean => {
    if (!lock.is_locked) return false;
    if (isAdmin) return true;
    if (isOperator && lock.required_role !== 'admin') return true;
    return false;
  };

  const canLock = (lock: EnvironmentLock): boolean => {
    if (lock.is_locked) return false;
    if (lock.environment === 'DEV') return isAdmin;
    if (isAdmin) return true;
    if (isOperator) return true;
    return false;
  };

  const requiresTicket = (env: string) => {
    return ['Prod', 'PreProd', 'PROD'].includes(env);
  };

  const handleUnlock = async () => {
    if (!unlockDialog.lock) return;
    
    if (requiresTicket(unlockDialog.lock.environment) && !ticketId.trim()) {
      toast.error('Ticket ID is required for production environments');
      return;
    }
    
    setProcessing(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('environment_locks')
        .update({
          is_locked: false,
          unlocked_by: user.user?.id,
          unlocked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', unlockDialog.lock.id);

      if (error) throw error;

      // Log to audit with ticket reference
      await supabase
        .from('audit_logs')
        .insert({
          action: 'environment_unlocked',
          resource_type: 'environment_lock',
          resource_id: unlockDialog.lock.id,
          user_id: user.user?.id,
          details: {
            environment: unlockDialog.lock.environment,
            comment: unlockComment,
            ticket_id: ticketId || null,
          },
        });

      toast.success(`${unlockDialog.lock.environment} environment unlocked`);
      setUnlockDialog({ open: false, lock: null });
      setUnlockComment('');
      setTicketId('');
    } catch (error: any) {
      toast.error('Failed to unlock: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleLock = async (lock: EnvironmentLock, reason?: string) => {
    setProcessing(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('environment_locks')
        .update({
          is_locked: true,
          lock_reason: reason || 'Manually locked',
          unlocked_by: null,
          unlocked_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lock.id);

      if (error) throw error;

      await supabase
        .from('audit_logs')
        .insert({
          action: 'environment_locked',
          resource_type: 'environment_lock',
          resource_id: lock.id,
          user_id: user.user?.id,
          details: { environment: lock.environment, reason: reason || 'Manually locked' },
        });

      toast.success(`${lock.environment} environment locked`);
    } catch (error: any) {
      toast.error('Failed to lock: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env.toUpperCase()) {
      case 'DEV': return 'border-l-sec-safe';
      case 'UAT': return 'border-l-chart-1';
      case 'STAGING': return 'border-l-sec-warning';
      case 'PREPROD': return 'border-l-chart-4';
      case 'PROD': return 'border-l-sec-critical';
      default: return 'border-l-muted';
    }
  };

  const getLockStyle = (lock: EnvironmentLock) => {
    if (!lock.is_locked) return 'ring-2 ring-sec-safe/30';
    if (['Prod', 'PROD'].includes(lock.environment)) return 'ring-2 ring-sec-critical/50';
    return 'ring-2 ring-sec-warning/30';
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Environment Lock Control
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              RBAC-enforced deployment gates for enterprise governance
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            Your Role: <span className="font-semibold capitalize">{userRole || 'viewer'}</span>
          </Badge>
        </div>

        {/* Branch → Environment Rules */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Branch → Environment Mapping</CardTitle>
            </div>
            <CardDescription>Default branch-to-environment deployment rules</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Pattern</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Lock Status</TableHead>
                  <TableHead>Approval Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {BRANCH_RULES.map((rule) => (
                  <TableRow key={rule.pattern}>
                    <TableCell className="font-mono text-sm">{rule.pattern}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          rule.environment === 'DEV' && 'border-sec-safe/50 text-sec-safe',
                          rule.environment === 'UAT' && 'border-chart-1/50 text-chart-1',
                          rule.environment === 'STAGING' && 'border-sec-warning/50 text-sec-warning',
                          rule.environment === 'PROD' && 'border-sec-critical/50 text-sec-critical'
                        )}
                      >
                        {rule.environment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {rule.hardLocked ? (
                        <Badge variant="destructive" className="gap-1">
                          <Shield className="w-3 h-3" />
                          HARD LOCKED
                        </Badge>
                      ) : rule.locked ? (
                        <Badge className="bg-sec-warning/20 text-sec-warning border-sec-warning/30">
                          🔒 Locked
                        </Badge>
                      ) : (
                        <Badge className="bg-sec-safe/20 text-sec-safe border-sec-safe/30">
                          🔓 Unlocked
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {rule.approval ? (
                        <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* RBAC Matrix */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">RBAC Permission Matrix</CardTitle>
            </div>
            <CardDescription>Role-based access control for environment operations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">DEV</TableHead>
                  <TableHead className="text-center">UAT</TableHead>
                  <TableHead className="text-center">STAGING</TableHead>
                  <TableHead className="text-center">PROD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {['viewer', 'developer', 'operator', 'approver', 'admin'].map((role) => (
                  <TableRow key={role}>
                    <TableCell className="font-medium capitalize">{role}</TableCell>
                    {['DEV', 'UAT', 'STAGING', 'PROD'].map((env) => (
                      <TableCell key={env} className="text-center text-lg">
                        {RBAC_MATRIX[env as keyof typeof RBAC_MATRIX][role as keyof (typeof RBAC_MATRIX)['DEV']]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
              <span>👁 View only</span>
              <span>✅ Full access</span>
              <span>🔓 Can unlock</span>
              <span>❌ No access</span>
            </div>
          </CardContent>
        </Card>

        {/* Environment Lock Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Active Environment Locks</h2>
          {locks.map((lock) => (
            <motion.div
              key={lock.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={cn('border-l-4', getEnvironmentColor(lock.environment), getLockStyle(lock))}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'p-3 rounded-lg',
                        lock.is_locked 
                          ? 'bg-sec-critical/10 text-sec-critical' 
                          : 'bg-sec-safe/10 text-sec-safe'
                      )}>
                        {lock.is_locked ? (
                          ['Prod', 'PROD'].includes(lock.environment) ? (
                            <Shield className="w-6 h-6" />
                          ) : (
                            <Lock className="w-6 h-6" />
                          )
                        ) : (
                          <Unlock className="w-6 h-6" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{lock.environment}</h3>
                          <Badge 
                            variant={lock.is_locked ? 'destructive' : 'default'}
                            className={cn(
                              lock.is_locked 
                                ? 'bg-sec-critical/20 text-sec-critical border-sec-critical/30' 
                                : 'bg-sec-safe/20 text-sec-safe border-sec-safe/30'
                            )}
                          >
                            {lock.is_locked ? (
                              ['Prod', 'PROD'].includes(lock.environment) ? 'HARD LOCKED' : 'LOCKED'
                            ) : 'UNLOCKED'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Requires: {ROLE_LABELS[lock.required_role]}
                          </span>
                          {lock.requires_approval && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Approval Required
                            </span>
                          )}
                        </div>

                        {lock.unlocked_at && !lock.is_locked && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Unlocked {new Date(lock.unlocked_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {lock.is_locked ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Button
                                  variant="outline"
                                  disabled={!canUnlock(lock) || processing}
                                  onClick={() => setUnlockDialog({ open: true, lock })}
                                  className={cn(
                                    canUnlock(lock) && 'border-sec-safe text-sec-safe hover:bg-sec-safe/10'
                                  )}
                                >
                                  <Unlock className="w-4 h-4 mr-2" />
                                  Unlock
                                </Button>
                              </div>
                            </TooltipTrigger>
                            {!canUnlock(lock) && (
                              <TooltipContent>
                                <p>Requires {ROLE_LABELS[lock.required_role]} role</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Button
                          variant="outline"
                          disabled={!canLock(lock) || processing}
                          onClick={() => handleLock(lock)}
                          className={cn(
                            canLock(lock) && 'border-sec-warning text-sec-warning hover:bg-sec-warning/10'
                          )}
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Lock
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Warning for Production */}
                  {['Prod', 'PROD'].includes(lock.environment) && (
                    <div className="mt-4 p-3 rounded-lg bg-sec-critical/10 border border-sec-critical/20 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-sec-critical shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-sec-critical">Production Environment</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Unlocking requires Admin role, comment, and ticket ID. All actions are logged for audit.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Unlock Dialog */}
        <Dialog open={unlockDialog.open} onOpenChange={(open) => setUnlockDialog({ open, lock: null })}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Unlock className="w-5 h-5" />
                Unlock {unlockDialog.lock?.environment}
              </DialogTitle>
              <DialogDescription>
                This action will allow deployments to {unlockDialog.lock?.environment}. 
                All unlock actions are logged for audit purposes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Reason for Unlock (Required)</Label>
                <Textarea
                  placeholder="e.g., Approved release v2.5.0, Emergency hotfix, Scheduled maintenance..."
                  value={unlockComment}
                  onChange={(e) => setUnlockComment(e.target.value)}
                  rows={3}
                />
              </div>
              
              {requiresTicket(unlockDialog.lock?.environment || '') && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Change Ticket ID (Required for Production)
                  </Label>
                  <Input
                    placeholder="e.g., JIRA-8721, CHG-1234"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                  />
                </div>
              )}
              
              <Card className="border-sec-warning/30 bg-sec-warning/5">
                <CardContent className="py-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-sec-warning shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      By unlocking this environment, you confirm that you have the authority 
                      to approve deployments. This action will be recorded in the audit log
                      with your user ID and timestamp.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setUnlockDialog({ open: false, lock: null })}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUnlock}
                disabled={
                  !unlockComment.trim() || 
                  processing ||
                  (requiresTicket(unlockDialog.lock?.environment || '') && !ticketId.trim())
                }
                className="bg-sec-safe hover:bg-sec-safe/90"
              >
                {processing ? 'Unlocking...' : 'Confirm Unlock'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}

export default EnhancedEnvironmentLocksPanel;
