import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Unlock, Shield, AlertTriangle, CheckCircle2, Users,
  History, MessageSquare, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
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

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin / Release Manager',
  operator: 'Operator / DevOps',
  viewer: 'All Users',
};

export const EnvironmentLocksPanel = () => {
  const { role: userRole, isAdmin, isOperator } = useUserRole();
  const [locks, setLocks] = useState<EnvironmentLock[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockDialog, setUnlockDialog] = useState<{ open: boolean; lock: EnvironmentLock | null }>({
    open: false,
    lock: null,
  });
  const [unlockComment, setUnlockComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchLocks();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('environment-locks-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'environment_locks',
      }, () => {
        fetchLocks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLocks = async () => {
    const { data, error } = await supabase
      .from('environment_locks')
      .select('*')
      .order('environment', { ascending: true });

    if (!error && data) {
      // Sort by environment order
      const order = ['DEV', 'UAT', 'Staging', 'PreProd', 'Prod'];
      const sorted = data.sort((a, b) => 
        order.indexOf(a.environment) - order.indexOf(b.environment)
      );
      setLocks(sorted as EnvironmentLock[]);
    }
    setLoading(false);
  };

  const canUnlock = (lock: EnvironmentLock): boolean => {
    if (!lock.is_locked) return false;
    if (isAdmin) return true;
    if (isOperator && lock.required_role !== 'admin') return true;
    return false;
  };

  const canLock = (lock: EnvironmentLock): boolean => {
    if (lock.is_locked) return false;
    if (lock.environment === 'DEV') return isAdmin; // DEV can only be locked by admins
    if (isAdmin) return true;
    if (isOperator) return true;
    return false;
  };

  const handleUnlock = async () => {
    if (!unlockDialog.lock) return;
    
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

      // Log to audit
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
          },
        });

      toast.success(`${unlockDialog.lock.environment} environment unlocked`);
      setUnlockDialog({ open: false, lock: null });
      setUnlockComment('');
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

      // Log to audit
      await supabase
        .from('audit_logs')
        .insert({
          action: 'environment_locked',
          resource_type: 'environment_lock',
          resource_id: lock.id,
          user_id: user.user?.id,
          details: {
            environment: lock.environment,
            reason: reason || 'Manually locked',
          },
        });

      toast.success(`${lock.environment} environment locked`);
    } catch (error: any) {
      toast.error('Failed to lock: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'DEV': return 'border-l-sec-safe';
      case 'UAT': return 'border-l-chart-1';
      case 'Staging': return 'border-l-sec-warning';
      case 'PreProd': return 'border-l-chart-4';
      case 'Prod': return 'border-l-sec-critical';
      default: return 'border-l-muted';
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Environment Locks
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              RBAC-enforced deployment gates for each environment
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            Your Role: <span className="font-semibold capitalize">{userRole || 'viewer'}</span>
          </Badge>
        </div>

        {/* RBAC Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Role-Based Access Control (RBAC)</p>
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <p><strong>Viewer:</strong> Can view all environments, cannot unlock or deploy</p>
                  <p><strong>Operator:</strong> Can unlock DEV/UAT/Staging, deploy to non-prod</p>
                  <p><strong>Admin:</strong> Can unlock all environments including PreProd/Prod</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment Lock Cards */}
        <div className="space-y-4">
          {locks.map((lock) => (
            <motion.div
              key={lock.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={cn('border-l-4', getEnvironmentColor(lock.environment))}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Lock Icon */}
                      <div className={cn(
                        'p-3 rounded-lg',
                        lock.is_locked 
                          ? 'bg-sec-critical/10 text-sec-critical' 
                          : 'bg-sec-safe/10 text-sec-safe'
                      )}>
                        {lock.is_locked ? (
                          <Lock className="w-6 h-6" />
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
                            {lock.is_locked ? 'LOCKED' : 'UNLOCKED'}
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

                    {/* Actions */}
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
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
                              </div>
                            </TooltipTrigger>
                            {!canLock(lock) && (
                              <TooltipContent>
                                <p>Insufficient permissions</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>

                  {/* Warning for non-authorized users */}
                  {lock.is_locked && !canUnlock(lock) && (
                    <div className="mt-4 p-3 rounded-lg bg-sec-warning/10 border border-sec-warning/20 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-sec-warning shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-sec-warning">Restricted Environment</p>
                        <p className="text-muted-foreground">
                          This environment requires <strong>{ROLE_LABELS[lock.required_role]}</strong> role to unlock.
                          Contact your administrator to request access.
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
          <DialogContent>
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
              
              <Card className="border-sec-warning/30 bg-sec-warning/5">
                <CardContent className="py-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-sec-warning shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      By unlocking this environment, you confirm that you have the authority 
                      to approve deployments. This action will be recorded in the audit log.
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
                disabled={!unlockComment.trim() || processing}
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
};

export default EnvironmentLocksPanel;
