import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RotateCcw, GitCommit, GitBranch, Tag, Clock,
  CheckCircle2, XCircle, Loader2, AlertTriangle,
  History, Shield, ArrowLeft
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DeploymentVersion {
  id: string;
  version_tag: string;
  branch: string;
  commit_sha: string;
  commit_message: string | null;
  commit_author: string | null;
  commit_timestamp: string | null;
  environment: string;
  is_current: boolean;
  created_at: string;
  deployment_id: string | null;
}

interface DeploymentRollbackPanelProps {
  isOpen: boolean;
  onClose: () => void;
  environment?: string;
  currentVersion?: DeploymentVersion;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function DeploymentRollbackPanel({ 
  isOpen, 
  onClose, 
  environment,
  currentVersion 
}: DeploymentRollbackPanelProps) {
  const [versions, setVersions] = useState<DeploymentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<DeploymentVersion | null>(null);
  const [rollbackReason, setRollbackReason] = useState('');
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, environment]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('deployment_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (environment) {
        query = query.eq('environment', environment);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Failed to fetch version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!selectedVersion) return;

    setIsRollingBack(true);
    try {
      const { data, error } = await supabase.functions.invoke('rollback-deployment', {
        body: {
          deploymentId: selectedVersion.deployment_id || selectedVersion.id,
          targetVersion: selectedVersion.version_tag,
          environment: selectedVersion.environment,
          reason: rollbackReason,
          commitSha: selectedVersion.commit_sha
        }
      });

      if (error) throw error;

      // Create new version entry marking this as current
      const { error: versionError } = await supabase
        .from('deployment_versions')
        .update({ is_current: false })
        .eq('environment', selectedVersion.environment);

      if (!versionError) {
        await supabase
          .from('deployment_versions')
          .update({ is_current: true })
          .eq('id', selectedVersion.id);
      }

      toast.success(`Rolled back to ${selectedVersion.version_tag}`);
      setConfirmDialog(false);
      setSelectedVersion(null);
      setRollbackReason('');
      fetchVersions();
    } catch (error: any) {
      console.error('Rollback error:', error);
      toast.error(`Rollback failed: ${error.message}`);
    } finally {
      setIsRollingBack(false);
    }
  };

  const currentEnvVersion = versions.find(v => v.is_current);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sec-warning/10 rounded-lg">
                <RotateCcw className="h-5 w-5 text-sec-warning" />
              </div>
              <div>
                <DialogTitle>Deployment Rollback</DialogTitle>
                <DialogDescription>
                  Select a previous version to roll back to
                  {environment && ` in ${environment}`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Current Version Info */}
          {currentEnvVersion && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-mono font-medium">{currentEnvVersion.version_tag}</p>
                      <p className="text-xs text-muted-foreground">Current version</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p className="flex items-center gap-1 justify-end">
                      <GitCommit className="w-3 h-3" />
                      {currentEnvVersion.commit_sha.substring(0, 7)}
                    </p>
                    <p>{formatTimeAgo(new Date(currentEnvVersion.created_at))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <ScrollArea className="max-h-[400px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No version history available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {versions.filter(v => !v.is_current).map((version, index) => (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedVersion(version)}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      selectedVersion?.id === version.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          version.environment === 'production' && 'bg-sec-critical',
                          version.environment === 'staging' && 'bg-sec-warning',
                          version.environment === 'development' && 'bg-sec-safe'
                        )} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-sm">
                              {version.version_tag}
                            </span>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {version.environment}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {version.commit_message || 'No commit message'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end text-xs">
                          <GitCommit className="w-3 h-3" />
                          <code className="bg-muted px-1 rounded text-[10px]">
                            {version.commit_sha.substring(0, 7)}
                          </code>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatTimeAgo(new Date(version.created_at))}
                        </p>
                      </div>
                    </div>

                    {selectedVersion?.id === version.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t"
                      >
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">Branch</p>
                            <p className="font-medium flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              {version.branch}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Author</p>
                            <p className="font-medium">{version.commit_author || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Deployed</p>
                            <p className="font-medium">
                              {version.commit_timestamp 
                                ? new Date(version.commit_timestamp).toLocaleDateString() 
                                : 'N/A'
                              }
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => setConfirmDialog(true)}
              disabled={!selectedVersion}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Rollback to Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-sec-warning" />
              Confirm Rollback
            </DialogTitle>
            <DialogDescription>
              This will roll back {selectedVersion?.environment} to version{' '}
              <span className="font-mono font-medium">{selectedVersion?.version_tag}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Card className="border-sec-warning/30 bg-sec-warning/5">
              <CardContent className="py-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-sec-warning shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium">This action is logged for audit purposes</p>
                    <p className="text-muted-foreground mt-1">
                      All deployments and rollbacks are recorded in the audit log.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Reason for Rollback (Required)</Label>
              <Textarea
                placeholder="e.g., Production issue detected, Reverting broken feature..."
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialog(false)}
              disabled={isRollingBack}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRollback}
              disabled={!rollbackReason.trim() || isRollingBack}
              variant="destructive"
              className="gap-2"
            >
              {isRollingBack ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Confirm Rollback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DeploymentRollbackPanel;
