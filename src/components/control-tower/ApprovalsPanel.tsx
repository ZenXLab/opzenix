import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare,
  User,
  GitBranch,
  Package,
  AlertTriangle,
  Eye,
  FileText,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ApprovalRequest {
  id: string;
  execution_id: string;
  node_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  required_approvals: number;
  current_approvals: number;
  requested_by?: string;
  created_at: string;
  resolved_at?: string;
  // Joined execution data
  execution?: {
    environment: string;
    branch?: string;
    name: string;
  };
}

const ApprovalsPanel = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [submitting, setSubmitting] = useState(false);

  // Fetch approvals from database
  const fetchApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .select(`
          *,
          execution:executions (
            environment,
            branch,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApprovals(data || []);
    } catch (error: any) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    fetchApprovals();

    const channel = supabase
      .channel('approvals-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'approval_requests' },
        () => {
          fetchApprovals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const historyApprovals = approvals.filter(a => a.status !== 'pending');

  const handleApprove = async (id: string) => {
    if (!comment.trim()) {
      toast.error('Comment is required for approval');
      return;
    }

    setSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const approval = approvals.find(a => a.id === id);
      
      if (!approval) return;

      // Insert vote
      await supabase.from('approval_votes').insert({
        approval_request_id: id,
        user_id: user.user?.id || 'anonymous',
        vote: true,
        comment,
      });

      const newApprovals = approval.current_approvals + 1;
      const newStatus = newApprovals >= approval.required_approvals ? 'approved' : 'pending';

      // Update approval request
      await supabase
        .from('approval_requests')
        .update({
          current_approvals: newApprovals,
          status: newStatus,
          resolved_at: newStatus === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', id);

      // Log to audit
      await supabase.from('audit_logs').insert({
        action: 'approval_granted',
        resource_type: 'approval_request',
        resource_id: id,
        user_id: user.user?.id,
        details: { comment, decision: 'approved', new_count: newApprovals },
      });

      setSelectedApproval(null);
      setComment('');
      toast.success(newStatus === 'approved' ? 'Deployment approved' : 'Vote recorded', { 
        description: newStatus === 'approved' ? 'Execution will resume' : `${newApprovals}/${approval.required_approvals} approvals`
      });
    } catch (error: any) {
      toast.error(`Failed to approve: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!comment.trim()) {
      toast.error('Comment is required for rejection');
      return;
    }

    setSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();

      // Insert vote
      await supabase.from('approval_votes').insert({
        approval_request_id: id,
        user_id: user.user?.id || 'anonymous',
        vote: false,
        comment,
      });

      // Update approval request
      await supabase
        .from('approval_requests')
        .update({
          status: 'rejected',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);

      // Log to audit
      await supabase.from('audit_logs').insert({
        action: 'approval_rejected',
        resource_type: 'approval_request',
        resource_id: id,
        user_id: user.user?.id,
        details: { comment, decision: 'rejected' },
      });

      setSelectedApproval(null);
      setComment('');
      toast.warning('Deployment rejected', { description: 'Execution has been stopped' });
    } catch (error: any) {
      toast.error(`Failed to reject: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const getEnvironmentColor = (env?: string) => {
    switch (env?.toLowerCase()) {
      case 'production':
      case 'prod':
        return 'border-sec-critical/50 text-sec-critical';
      case 'staging':
      case 'uat':
      case 'preprod':
        return 'border-sec-warning/50 text-sec-warning';
      default:
        return 'border-sec-safe/50 text-sec-safe';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* List View */}
      <div className={cn('border-r border-border transition-all', selectedApproval ? 'w-1/2' : 'w-full')}>
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-semibold">Approvals</h1>
          <p className="text-sm text-muted-foreground">
            Governance gates requiring your decision
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'history')} className="h-[calc(100%-80px)]">
          <div className="px-4 border-b border-border">
            <TabsList className="h-10">
              <TabsTrigger value="pending" className="gap-2">
                Pending
                {pendingApprovals.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5">{pendingApprovals.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending" className="h-full mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {pendingApprovals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">All clear!</p>
                    <p className="text-sm">No pending approvals</p>
                  </div>
                ) : (
                  pendingApprovals.map((approval) => (
                    <motion.div
                      key={approval.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card 
                        className={cn(
                          'cursor-pointer transition-all hover:shadow-md',
                          selectedApproval?.id === approval.id && 'ring-2 ring-primary'
                        )}
                        onClick={() => setSelectedApproval(approval)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium">{approval.title}</h3>
                              <p className="text-sm text-muted-foreground">{approval.description}</p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={getEnvironmentColor(approval.execution?.environment)}
                            >
                              {approval.execution?.environment || 'Unknown'}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {approval.execution?.name || approval.node_id}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(approval.created_at)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline" className="text-xs">
                              {approval.current_approvals}/{approval.required_approvals} approvals
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="h-full mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {historyApprovals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No approval history yet</p>
                  </div>
                ) : (
                  historyApprovals.map((approval) => (
                    <Card key={approval.id} className="opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{approval.title}</h4>
                            <p className="text-xs text-muted-foreground">{formatTimeAgo(approval.created_at)}</p>
                          </div>
                          <Badge 
                            className={cn(
                              'border-0',
                              approval.status === 'approved' && 'bg-sec-safe/20 text-sec-safe',
                              approval.status === 'rejected' && 'bg-sec-critical/20 text-sec-critical'
                            )}
                          >
                            {approval.status === 'approved' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                            {approval.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail View */}
      <AnimatePresence>
        {selectedApproval && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '50%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full overflow-hidden"
          >
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedApproval.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{selectedApproval.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedApproval(null)}>
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>

                {/* Context */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Deployment Context</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Environment</span>
                      <span className="capitalize font-medium">{selectedApproval.execution?.environment || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Execution ID</span>
                      <span className="font-mono text-xs">{selectedApproval.execution_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Branch</span>
                      <span className="font-mono text-xs">{selectedApproval.execution?.branch || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Requested</span>
                      <span className="text-xs">{formatTimeAgo(selectedApproval.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Approval Progress */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Approval Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Approvals</span>
                      <span className="font-medium">{selectedApproval.current_approvals} / {selectedApproval.required_approvals}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sec-safe transition-all"
                        style={{ width: `${(selectedApproval.current_approvals / selectedApproval.required_approvals) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* Decision Section */}
                {selectedApproval.status === 'pending' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Comment (Required)</label>
                      <Textarea 
                        placeholder="Add your approval comment or rejection reason..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        variant="destructive" 
                        className="flex-1 gap-2"
                        onClick={() => handleReject(selectedApproval.id)}
                        disabled={!comment.trim() || submitting}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                      <Button 
                        className="flex-1 gap-2 bg-sec-safe hover:bg-sec-safe/90"
                        onClick={() => handleApprove(selectedApproval.id)}
                        disabled={!comment.trim() || submitting}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApprovalsPanel;