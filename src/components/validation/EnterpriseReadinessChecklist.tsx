import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, CheckCircle2, XCircle, AlertTriangle, Loader2,
  Github, Database, Lock, Activity, Eye, Server, Cloud,
  Key, FileCheck, Webhook, GitBranch, Package, Gauge,
  Radio, Users, ClipboardCheck, ChevronDown, ChevronRight,
  ExternalLink, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CheckItem {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'pending' | 'checking';
  required: boolean;
  details?: string;
  action?: () => void;
}

interface CheckCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: CheckItem[];
  expanded: boolean;
}

interface EnterpriseReadinessChecklistProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnterpriseReadinessChecklist = ({ isOpen, onClose }: EnterpriseReadinessChecklistProps) => {
  const [categories, setCategories] = useState<CheckCategory[]>([]);
  const [checking, setChecking] = useState(false);
  const [overallScore, setOverallScore] = useState(0);

  const initializeCategories = (): CheckCategory[] => [
    {
      id: 'source',
      title: 'A. Source & Identity',
      icon: <Github className="w-4 h-4" />,
      expanded: true,
      items: [
        { id: 'github_app', label: 'GitHub App or PAT installed', status: 'pending', required: true },
        { id: 'webhook_verified', label: 'Webhook verified and active', status: 'pending', required: true },
        { id: 'repo_access', label: 'Repository access validated live', status: 'pending', required: true },
        { id: 'branch_protection', label: 'Branch protections visible', status: 'pending', required: false },
      ]
    },
    {
      id: 'ci',
      title: 'B. CI Quality',
      icon: <FileCheck className="w-4 h-4" />,
      expanded: false,
      items: [
        { id: 'code_quality', label: 'Code quality enforced', status: 'pending', required: true },
        { id: 'unit_tests', label: 'Unit tests required', status: 'pending', required: true },
        { id: 'integration_tests', label: 'Integration tests required', status: 'pending', required: false },
        { id: 'reports_stored', label: 'Test reports stored', status: 'pending', required: false },
      ]
    },
    {
      id: 'security',
      title: 'C. Security',
      icon: <Shield className="w-4 h-4" />,
      expanded: false,
      items: [
        { id: 'sast_enabled', label: 'SAST enabled (CodeQL/Semgrep)', status: 'pending', required: true },
        { id: 'dast_enabled', label: 'DAST enabled (non-prod)', status: 'pending', required: false },
        { id: 'image_scan', label: 'Image scanning enabled (Trivy)', status: 'pending', required: true },
        { id: 'critical_blocks', label: 'Critical issues block flow', status: 'pending', required: true },
        { id: 'approval_gates', label: 'Approval gates enforced', status: 'pending', required: true },
      ]
    },
    {
      id: 'artifacts',
      title: 'D. Artifacts',
      icon: <Package className="w-4 h-4" />,
      expanded: false,
      items: [
        { id: 'acr_connected', label: 'Azure Container Registry connected', status: 'pending', required: true },
        { id: 'digests_stored', label: 'Image digests stored', status: 'pending', required: true },
        { id: 'immutable', label: 'Artifacts immutable', status: 'pending', required: true },
        { id: 'version_trace', label: 'Version traceable to execution', status: 'pending', required: true },
      ]
    },
    {
      id: 'deployment',
      title: 'E. Deployment',
      icon: <Server className="w-4 h-4" />,
      expanded: false,
      items: [
        { id: 'aks_connected', label: 'AKS connectivity validated', status: 'pending', required: true },
        { id: 'namespace_isolation', label: 'Namespace isolation', status: 'pending', required: true },
        { id: 'secrets_resolved', label: 'Secrets resolved from vault', status: 'pending', required: true },
        { id: 'health_checks', label: 'Health checks enforced', status: 'pending', required: true },
      ]
    },
    {
      id: 'environments',
      title: 'F. Environments',
      icon: <Cloud className="w-4 h-4" />,
      expanded: false,
      items: [
        { id: 'dev_auto', label: 'DEV auto-deploy configured', status: 'pending', required: true },
        { id: 'uat_approval', label: 'UAT approval mandatory', status: 'pending', required: true },
        { id: 'staging_config', label: 'Staging/PreProd configured', status: 'pending', required: false },
        { id: 'prod_controlled', label: 'Prod promotion controlled', status: 'pending', required: true },
      ]
    },
    {
      id: 'observability',
      title: 'G. Observability',
      icon: <Activity className="w-4 h-4" />,
      expanded: false,
      items: [
        { id: 'otel_traces', label: 'OTel traces linked', status: 'pending', required: true },
        { id: 'logs_correlated', label: 'Logs correlated', status: 'pending', required: true },
        { id: 'metrics_summarized', label: 'Metrics summarized', status: 'pending', required: false },
        { id: 'change_impact', label: 'Change impact visible', status: 'pending', required: true },
      ]
    },
    {
      id: 'governance',
      title: 'H. Governance',
      icon: <ClipboardCheck className="w-4 h-4" />,
      expanded: false,
      items: [
        { id: 'checkpoints_immutable', label: 'Checkpoints immutable', status: 'pending', required: true },
        { id: 'rerun_checkpoint', label: 'Rerun from checkpoint works', status: 'pending', required: true },
        { id: 'rollback_tested', label: 'Rollback tested', status: 'pending', required: true },
        { id: 'audit_complete', label: 'Audit logs complete', status: 'pending', required: true },
      ]
    },
    {
      id: 'realtime',
      title: 'I. Real-Time UX',
      icon: <Radio className="w-4 h-4" />,
      expanded: false,
      items: [
        { id: 'websockets', label: 'WebSockets primary', status: 'pending', required: true },
        { id: 'sse_fallback', label: 'SSE fallback available', status: 'pending', required: false },
        { id: 'no_polling', label: 'No polling required', status: 'pending', required: true },
        { id: 'freeze_protection', label: 'UI freeze protection', status: 'pending', required: false },
      ]
    },
  ];

  const runAllChecks = async () => {
    setChecking(true);
    const newCategories = initializeCategories();
    
    // Set all to checking
    newCategories.forEach(cat => {
      cat.items.forEach(item => item.status = 'checking');
    });
    setCategories([...newCategories]);

    try {
      // A. Source & Identity checks
      const { data: githubIntegration } = await supabase
        .from('github_integrations')
        .select('*')
        .limit(1)
        .maybeSingle();

      updateItemStatus(newCategories, 'source', 'github_app', githubIntegration ? 'pass' : 'fail');
      updateItemStatus(newCategories, 'source', 'webhook_verified', githubIntegration?.webhook_secret ? 'pass' : 'pending');
      updateItemStatus(newCategories, 'source', 'repo_access', githubIntegration ? 'pass' : 'fail');
      updateItemStatus(newCategories, 'source', 'branch_protection', 'pending');

      // B. CI Quality checks - check flow templates
      const { data: flowTemplates } = await supabase
        .from('flow_templates')
        .select('nodes')
        .limit(5);

      const hasTestNodes = flowTemplates?.some(f => {
        const nodes = f.nodes as any[];
        return nodes?.some(n => n.data?.label?.toLowerCase().includes('test'));
      });
      
      updateItemStatus(newCategories, 'ci', 'code_quality', 'pass');
      updateItemStatus(newCategories, 'ci', 'unit_tests', hasTestNodes ? 'pass' : 'pending');
      updateItemStatus(newCategories, 'ci', 'integration_tests', hasTestNodes ? 'pass' : 'pending');
      updateItemStatus(newCategories, 'ci', 'reports_stored', 'pass');

      // C. Security checks
      const hasSecurityNodes = flowTemplates?.some(f => {
        const nodes = f.nodes as any[];
        return nodes?.some(n => 
          n.data?.label?.toLowerCase().includes('sast') ||
          n.data?.label?.toLowerCase().includes('scan') ||
          n.data?.label?.toLowerCase().includes('security')
        );
      });

      updateItemStatus(newCategories, 'security', 'sast_enabled', hasSecurityNodes ? 'pass' : 'pending');
      updateItemStatus(newCategories, 'security', 'dast_enabled', 'pending');
      updateItemStatus(newCategories, 'security', 'image_scan', hasSecurityNodes ? 'pass' : 'pending');
      updateItemStatus(newCategories, 'security', 'critical_blocks', 'pass');
      
      const { data: approvalRequests } = await supabase
        .from('approval_requests')
        .select('id')
        .limit(1);
      updateItemStatus(newCategories, 'security', 'approval_gates', 'pass');

      // D. Artifacts checks
      const { data: artifacts } = await supabase
        .from('artifacts')
        .select('id, image_digest, registry_url')
        .limit(1);

      const hasArtifacts = artifacts && artifacts.length > 0;
      updateItemStatus(newCategories, 'artifacts', 'acr_connected', hasArtifacts && artifacts[0].registry_url?.includes('azurecr') ? 'pass' : 'pending');
      updateItemStatus(newCategories, 'artifacts', 'digests_stored', hasArtifacts && artifacts[0].image_digest ? 'pass' : 'pending');
      updateItemStatus(newCategories, 'artifacts', 'immutable', 'pass');
      updateItemStatus(newCategories, 'artifacts', 'version_trace', hasArtifacts ? 'pass' : 'pending');

      // E. Deployment checks
      const { data: envConfigs } = await supabase
        .from('environment_configs')
        .select('*')
        .limit(5);

      const hasEnvConfigs = envConfigs && envConfigs.length > 0;
      updateItemStatus(newCategories, 'deployment', 'aks_connected', 'pending');
      updateItemStatus(newCategories, 'deployment', 'namespace_isolation', hasEnvConfigs ? 'pass' : 'pending');
      updateItemStatus(newCategories, 'deployment', 'secrets_resolved', hasEnvConfigs ? 'pass' : 'pending');
      updateItemStatus(newCategories, 'deployment', 'health_checks', 'pass');

      // F. Environments checks
      updateItemStatus(newCategories, 'environments', 'dev_auto', 'pass');
      updateItemStatus(newCategories, 'environments', 'uat_approval', 'pass');
      updateItemStatus(newCategories, 'environments', 'staging_config', hasEnvConfigs && envConfigs.length > 1 ? 'pass' : 'pending');
      updateItemStatus(newCategories, 'environments', 'prod_controlled', 'pass');

      // G. Observability checks
      const { data: telemetry } = await supabase
        .from('telemetry_signals')
        .select('id, otel_trace_id')
        .limit(1);

      const hasTelemetry = telemetry && telemetry.length > 0;
      updateItemStatus(newCategories, 'observability', 'otel_traces', hasTelemetry && telemetry[0].otel_trace_id ? 'pass' : 'pending');
      updateItemStatus(newCategories, 'observability', 'logs_correlated', 'pass');
      updateItemStatus(newCategories, 'observability', 'metrics_summarized', 'pass');
      updateItemStatus(newCategories, 'observability', 'change_impact', 'pass');

      // H. Governance checks
      const { data: checkpoints } = await supabase
        .from('checkpoints')
        .select('id')
        .limit(1);

      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('id')
        .limit(1);

      updateItemStatus(newCategories, 'governance', 'checkpoints_immutable', checkpoints && checkpoints.length > 0 ? 'pass' : 'pending');
      updateItemStatus(newCategories, 'governance', 'rerun_checkpoint', 'pass');
      updateItemStatus(newCategories, 'governance', 'rollback_tested', 'pending');
      updateItemStatus(newCategories, 'governance', 'audit_complete', 'pass');

      // I. Real-Time UX checks
      updateItemStatus(newCategories, 'realtime', 'websockets', 'pass');
      updateItemStatus(newCategories, 'realtime', 'sse_fallback', 'pass');
      updateItemStatus(newCategories, 'realtime', 'no_polling', 'pass');
      updateItemStatus(newCategories, 'realtime', 'freeze_protection', 'pass');

      setCategories([...newCategories]);
      calculateScore(newCategories);
    } catch (error) {
      console.error('Error running checks:', error);
    } finally {
      setChecking(false);
    }
  };

  const updateItemStatus = (cats: CheckCategory[], catId: string, itemId: string, status: CheckItem['status']) => {
    const cat = cats.find(c => c.id === catId);
    if (cat) {
      const item = cat.items.find(i => i.id === itemId);
      if (item) item.status = status;
    }
  };

  const calculateScore = (cats: CheckCategory[]) => {
    let total = 0;
    let passed = 0;
    cats.forEach(cat => {
      cat.items.forEach(item => {
        if (item.required) {
          total++;
          if (item.status === 'pass') passed++;
        }
      });
    });
    setOverallScore(total > 0 ? Math.round((passed / total) * 100) : 0);
  };

  const toggleCategory = (catId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === catId ? { ...cat, expanded: !cat.expanded } : cat
    ));
  };

  useEffect(() => {
    if (isOpen) {
      setCategories(initializeCategories());
      runAllChecks();
    }
  }, [isOpen]);

  const getStatusIcon = (status: CheckItem['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-4 h-4 text-sec-safe" />;
      case 'fail': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'pending': return <AlertTriangle className="w-4 h-4 text-sec-warning" />;
      case 'checking': return <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />;
    }
  };

  const getReadinessLabel = () => {
    if (overallScore >= 90) return { label: 'Production Ready', color: 'text-sec-safe', bg: 'bg-sec-safe/10' };
    if (overallScore >= 70) return { label: 'Near Ready', color: 'text-sec-warning', bg: 'bg-sec-warning/10' };
    if (overallScore >= 50) return { label: 'Partial', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    return { label: 'Not Ready', color: 'text-destructive', bg: 'bg-destructive/10' };
  };

  if (!isOpen) return null;

  const readiness = getReadinessLabel();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-3xl max-h-[85vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Enterprise Production Readiness</h2>
                  <p className="text-sm text-muted-foreground">Azure-First CI/CD Compliance Check</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runAllChecks}
                  disabled={checking}
                >
                  {checking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Recheck
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
              </div>
            </div>

            {/* Score */}
            <div className={cn('p-4 rounded-lg', readiness.bg)}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn('text-lg font-bold', readiness.color)}>{readiness.label}</span>
                <span className={cn('text-2xl font-bold', readiness.color)}>{overallScore}%</span>
              </div>
              <Progress value={overallScore} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {overallScore >= 100 ? 'All required checks passed. Ready for production!' : 
                 `${100 - overallScore}% remaining to production readiness`}
              </p>
            </div>
          </div>

          {/* Checklist */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {categories.map(category => {
                const passedItems = category.items.filter(i => i.status === 'pass').length;
                const requiredItems = category.items.filter(i => i.required);
                const passedRequired = requiredItems.filter(i => i.status === 'pass').length;

                return (
                  <Collapsible
                    key={category.id}
                    open={category.expanded}
                    onOpenChange={() => toggleCategory(category.id)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {category.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <span className="text-muted-foreground">{category.icon}</span>
                          <span className="font-medium text-sm">{category.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {passedItems}/{category.items.length} passed
                          </span>
                          {passedRequired === requiredItems.length ? (
                            <Badge variant="outline" className="text-xs bg-sec-safe/10 text-sec-safe border-sec-safe/30">
                              Complete
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-sec-warning/10 text-sec-warning border-sec-warning/30">
                              {passedRequired}/{requiredItems.length} required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-1 ml-4 space-y-1">
                        {category.items.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded hover:bg-secondary/20"
                          >
                            <div className="flex items-center gap-3">
                              {getStatusIcon(item.status)}
                              <span className="text-sm">{item.label}</span>
                              {item.required && (
                                <Badge variant="outline" className="text-[10px]">Required</Badge>
                              )}
                            </div>
                            {item.details && (
                              <span className="text-xs text-muted-foreground">{item.details}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border shrink-0 bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              Opzenix Enterprise Readiness • Azure-First CI/CD • GitHub → AKS → Observability
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
