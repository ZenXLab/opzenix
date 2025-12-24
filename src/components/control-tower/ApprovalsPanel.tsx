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
  Sparkles
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

interface ApprovalRequest {
  id: string;
  executionId: string;
  nodeId: string;
  title: string;
  description?: string;
  environment: string;
  artifact: {
    name: string;
    version: string;
    imageDigest: string;
  };
  ciStatus: 'passed' | 'failed' | 'running';
  securityStatus: 'passed' | 'failed' | 'warning' | 'running';
  changeSummary: {
    filesChanged: number;
    riskLevel: 'low' | 'medium' | 'high';
    aiAnalysis: string;
  };
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const ApprovalsPanel = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([
    {
      id: '1',
      executionId: 'exec-1',
      nodeId: 'approval-gate',
      title: 'Production Deployment - api-gateway v2.4.3',
      description: 'Deploy new API gateway version with rate limiting improvements',
      environment: 'production',
      artifact: {
        name: 'api-gateway',
        version: 'v2.4.3',
        imageDigest: 'sha256:a3f7c2e...',
      },
      ciStatus: 'passed',
      securityStatus: 'passed',
      changeSummary: {
        filesChanged: 12,
        riskLevel: 'low',
        aiAnalysis: 'This deployment includes rate limiting improvements and bug fixes. No breaking changes detected. All tests passing. Recommended for approval.',
      },
      requestedBy: 'CI/CD Pipeline',
      requestedAt: '5 min ago',
      status: 'pending',
    },
    {
      id: '2',
      executionId: 'exec-2',
      nodeId: 'approval-gate',
      title: 'Staging Deployment - auth-service v1.9.0',
      description: 'New authentication features with MFA support',
      environment: 'staging',
      artifact: {
        name: 'auth-service',
        version: 'v1.9.0',
        imageDigest: 'sha256:b8d4f1a...',
      },
      ciStatus: 'passed',
      securityStatus: 'warning',
      changeSummary: {
        filesChanged: 45,
        riskLevel: 'medium',
        aiAnalysis: 'Major feature addition with MFA support. One medium-severity dependency vulnerability detected but patched. Recommend manual review of auth flows before production promotion.',
      },
      requestedBy: 'CI/CD Pipeline',
      requestedAt: '15 min ago',
      status: 'pending',
    },
  ]);

  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const historyApprovals = approvals.filter(a => a.status !== 'pending');

  const handleApprove = async (id: string) => {
    if (!comment.trim()) {
      toast.error('Comment is required for approval');
      return;
    }

    // Log to audit
    await supabase.from('audit_logs').insert({
      action: 'approval_granted',
      resource_type: 'approval_request',
      resource_id: id,
      details: { comment, decision: 'approved' },
    });

    setApprovals(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'approved' as const } : a
    ));
    setSelectedApproval(null);
    setComment('');
    toast.success('Deployment approved', { description: 'Execution will resume' });
  };

  const handleReject = async (id: string) => {
    if (!comment.trim()) {
      toast.error('Comment is required for rejection');
      return;
    }

    // Log to audit
    await supabase.from('audit_logs').insert({
      action: 'approval_rejected',
      resource_type: 'approval_request',
      resource_id: id,
      details: { comment, decision: 'rejected' },
    });

    setApprovals(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'rejected' as const } : a
    ));
    setSelectedApproval(null);
    setComment('');
    toast.warning('Deployment rejected', { description: 'Execution has been stopped' });
  };

  const getStatusBadge = (status: 'passed' | 'failed' | 'warning' | 'running') => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-sec-safe/20 text-sec-safe border-0"><CheckCircle2 className="w-3 h-3 mr-1" />Passed</Badge>;
      case 'failed':
        return <Badge className="bg-sec-critical/20 text-sec-critical border-0"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'warning':
        return <Badge className="bg-sec-warning/20 text-sec-warning border-0"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      case 'running':
        return <Badge className="bg-chart-1/20 text-chart-1 border-0"><Clock className="w-3 h-3 mr-1 animate-spin" />Running</Badge>;
    }
  };

  const getRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return <Badge variant="outline" className="text-sec-safe border-sec-safe/30">Low Risk</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-sec-warning border-sec-warning/30">Medium Risk</Badge>;
      case 'high':
        return <Badge variant="outline" className="text-sec-critical border-sec-critical/30">High Risk</Badge>;
    }
  };

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
                              className={cn(
                                approval.environment === 'production' && 'border-sec-critical/50 text-sec-critical',
                                approval.environment === 'staging' && 'border-sec-warning/50 text-sec-warning',
                                approval.environment === 'development' && 'border-sec-safe/50 text-sec-safe'
                              )}
                            >
                              {approval.environment}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {approval.artifact.version}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {approval.requestedBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {approval.requestedAt}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            {getStatusBadge(approval.ciStatus)}
                            {getStatusBadge(approval.securityStatus)}
                            {getRiskBadge(approval.changeSummary.riskLevel)}
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
                            <p className="text-xs text-muted-foreground">{approval.requestedAt}</p>
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
                      <span className="capitalize font-medium">{selectedApproval.environment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Execution ID</span>
                      <span className="font-mono text-xs">{selectedApproval.executionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Artifact</span>
                      <span className="font-mono text-xs">{selectedApproval.artifact.name}:{selectedApproval.artifact.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Image Digest</span>
                      <span className="font-mono text-xs">{selectedApproval.artifact.imageDigest}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Preconditions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Preconditions Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CI Pipeline</span>
                      {getStatusBadge(selectedApproval.ciStatus)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Security Scan</span>
                      {getStatusBadge(selectedApproval.securityStatus)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Files Changed</span>
                      <span className="text-sm font-medium">{selectedApproval.changeSummary.filesChanged}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Risk Level</span>
                      {getRiskBadge(selectedApproval.changeSummary.riskLevel)}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Analysis */}
                <Card className="border-ai-primary/30 bg-ai-primary/5">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-ai-primary" />
                      <CardTitle className="text-sm">AI Impact Analysis</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selectedApproval.changeSummary.aiAnalysis}</p>
                  </CardContent>
                </Card>

                <Separator />

                {/* Decision Section */}
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
                      disabled={!comment.trim()}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                    <Button 
                      className="flex-1 gap-2 bg-sec-safe hover:bg-sec-safe/90"
                      onClick={() => handleApprove(selectedApproval.id)}
                      disabled={!comment.trim() || selectedApproval.ciStatus !== 'passed'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Deployment
                    </Button>
                  </div>

                  {selectedApproval.ciStatus !== 'passed' && (
                    <p className="text-xs text-sec-warning text-center">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      Cannot approve: CI pipeline must pass first
                    </p>
                  )}
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApprovalsPanel;
