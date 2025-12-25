import { useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  GitBranch,
  Rocket,
  Layers,
  Lock,
  Eye,
  FileText,
  Clock,
  User,
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OpzenixFlowMap } from '@/components/flow/OpzenixFlowMap';
import { useRBACPermissions } from '@/hooks/useRBACPermissions';
import { useWidgetRealtime } from '@/hooks/useWidgetRealtime';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// ============================================
// 🔄 FLOW VIEWER SCREEN (MVP 1.0.0 LOCKED)
// ============================================
// DEDICATED FLOW VIEWING
// - One mode at a time: CI, CD, or CI+CD (read-only)
// - Clear header: ENVIRONMENT + FLOW TYPE
// - Canvas shows ONLY flow nodes
// - Right panel = Inspector (evidence, audit)
// - NO action buttons embedded in canvas
// ============================================

type FlowMode = 'ci' | 'cd' | 'ci+cd';

interface FlowViewerScreenProps {
  environment: string;
  initialFlowMode?: FlowMode;
  onBack: () => void;
  onRequestAction: (context: ActionContext) => void;
}

export interface ActionContext {
  type: 'approval' | 'deploy';
  environment: string;
  nodeId: string;
  nodeName: string;
  requiredRole: string;
  policyReference: string;
}

const ENVIRONMENT_LABELS: Record<string, string> = {
  dev: 'DEVELOPMENT',
  uat: 'USER ACCEPTANCE',
  staging: 'STAGING',
  preprod: 'PRE-PRODUCTION',
  prod: 'PRODUCTION',
};

const FLOW_MODE_CONFIG = {
  ci: { 
    label: 'CI Flow', 
    icon: GitBranch, 
    description: 'Continuous Integration Pipeline',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  cd: { 
    label: 'CD Flow', 
    icon: Rocket, 
    description: 'Continuous Deployment Pipeline',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  'ci+cd': { 
    label: 'CI + CD', 
    icon: Layers, 
    description: 'Full Pipeline (Read-Only View)',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
};

// CI-specific stages
const CI_STAGES = [
  { id: 'source', label: 'Source Code', type: 'source.git', status: 'passed' },
  { id: 'sast', label: 'SAST Scan', type: 'ci.sast', status: 'passed' },
  { id: 'secrets', label: 'Secrets Scan', type: 'ci.secrets-scan', status: 'passed' },
  { id: 'deps', label: 'Dependency Check', type: 'ci.dependency-scan', status: 'passed' },
  { id: 'unit', label: 'Unit Tests', type: 'ci.unit-test', status: 'passed' },
  { id: 'integration', label: 'Integration Tests', type: 'ci.integration-test', status: 'running' },
  { id: 'build', label: 'Build Image', type: 'artifact.image', status: 'pending' },
  { id: 'sign', label: 'Sign Artifact', type: 'ci.image-sign', status: 'pending' },
];

// CD-specific stages
const CD_STAGES = [
  { id: 'artifact', label: 'Artifact Ready', type: 'artifact.image', status: 'passed' },
  { id: 'security-gate', label: 'Security Gate', type: 'security.gate', status: 'passed' },
  { id: 'approval', label: 'Approval Gate', type: 'approval.gate', status: 'blocked' },
  { id: 'argocd', label: 'ArgoCD Sync', type: 'cd.argo', status: 'pending' },
  { id: 'deploy', label: 'Deployment', type: 'deploy.rolling', status: 'pending' },
  { id: 'k8s', label: 'Kubernetes', type: 'runtime.k8s', status: 'pending' },
  { id: 'audit', label: 'Audit Record', type: 'audit.record', status: 'pending' },
];

export function FlowViewerScreen({
  environment,
  initialFlowMode = 'ci+cd',
  onBack,
  onRequestAction,
}: FlowViewerScreenProps) {
  const [flowMode, setFlowMode] = useState<FlowMode>(initialFlowMode);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [inspectorTab, setInspectorTab] = useState<'details' | 'audit' | 'evidence'>('details');

  const { dbRole, isAdmin, canApprove, canDeploy } = useRBACPermissions();
  const { data: auditData } = useWidgetRealtime({ widgetType: 'audit-trail', refreshInterval: 30 });

  const FlowIcon = FLOW_MODE_CONFIG[flowMode].icon;
  const isProd = environment === 'prod';

  // Handle node selection - opens inspector, NO direct actions
  const handleNodeSelect = useCallback((nodeId: string, data: any) => {
    setSelectedNode({
      id: nodeId,
      ...data,
      timestamp: new Date().toISOString(),
    });
    setInspectorTab('details');
  }, []);

  // Handle action request from inspector - opens Action Panel
  const handleRequestApproval = useCallback(() => {
    if (!selectedNode) return;
    onRequestAction({
      type: 'approval',
      environment,
      nodeId: selectedNode.id,
      nodeName: selectedNode.label || selectedNode.id,
      requiredRole: isProd ? 'CTO' : 'ARCHITECT',
      policyReference: 'POL-DEPLOY-001',
    });
  }, [selectedNode, environment, isProd, onRequestAction]);

  const handleRequestDeploy = useCallback(() => {
    if (!selectedNode) return;
    onRequestAction({
      type: 'deploy',
      environment,
      nodeId: selectedNode.id,
      nodeName: selectedNode.label || selectedNode.id,
      requiredRole: isProd ? 'PLATFORM_OWNER' : 'TECH_LEAD',
      policyReference: 'POL-DEPLOY-002',
    });
  }, [selectedNode, environment, isProd, onRequestAction]);

  return (
    <ReactFlowProvider>
      <div className="h-full flex flex-col bg-background">
        {/* Header - Environment + Flow Type clearly displayed */}
        <header className={cn(
          'flex-shrink-0 border-b px-6 py-4',
          isProd ? 'border-sec-danger/30 bg-sec-danger/5' : 'border-border bg-card/50'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Control Tower
              </Button>
              <Separator orientation="vertical" className="h-6" />
              
              {/* Environment Badge */}
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border',
                isProd ? 'border-sec-danger/50 bg-sec-danger/10' : 'border-primary/30 bg-primary/5'
              )}>
                {isProd && <Lock className="w-4 h-4 text-sec-danger" />}
                <span className={cn('text-sm font-bold', isProd ? 'text-sec-danger' : 'text-primary')}>
                  ENVIRONMENT: {ENVIRONMENT_LABELS[environment] || environment.toUpperCase()}
                </span>
              </div>

              {/* Flow Type Badge */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card">
                <FlowIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">
                  FLOW TYPE: {FLOW_MODE_CONFIG[flowMode].label.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                {dbRole?.toUpperCase() || 'VIEWER'}
              </Badge>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sec-safe/10 text-sec-safe text-xs font-medium">
                <Eye className="w-3 h-3" />
                View Only
              </div>
            </div>
          </div>

          {/* Flow Mode Selector - Single mode at a time */}
          <div className="mt-4 flex items-center gap-2">
            {(Object.keys(FLOW_MODE_CONFIG) as FlowMode[]).map((mode) => {
              const config = FLOW_MODE_CONFIG[mode];
              const Icon = config.icon;
              const isActive = flowMode === mode;
              
              return (
                <Button
                  key={mode}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFlowMode(mode)}
                  className={cn(
                    'gap-2',
                    isActive && mode === 'ci+cd' && 'bg-muted text-muted-foreground'
                  )}
                  disabled={mode === 'ci+cd' && !isProd && !isAdmin}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                  {mode === 'ci+cd' && (
                    <Badge variant="secondary" className="text-[10px] ml-1">Read-Only</Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </header>

        {/* Main Content: Flow Canvas + Inspector */}
        <div className="flex-1 flex overflow-hidden">
          {/* Flow Canvas - Shows different content per mode */}
          <main className="flex-1 relative">
            {/* Mode-specific header banner */}
            <div className={cn(
              'absolute top-4 left-4 right-4 z-10 p-4 rounded-lg border backdrop-blur-sm',
              FLOW_MODE_CONFIG[flowMode].bgColor,
              FLOW_MODE_CONFIG[flowMode].borderColor
            )}>
              <div className="flex items-center gap-3">
                <FlowIcon className={cn('w-6 h-6', FLOW_MODE_CONFIG[flowMode].color)} />
                <div>
                  <h3 className={cn('text-lg font-bold', FLOW_MODE_CONFIG[flowMode].color)}>
                    {FLOW_MODE_CONFIG[flowMode].label} Pipeline
                  </h3>
                  <p className="text-xs text-muted-foreground">{FLOW_MODE_CONFIG[flowMode].description}</p>
                </div>
              </div>
            </div>

            {/* Render different flow based on mode */}
            {flowMode === 'ci+cd' ? (
              <OpzenixFlowMap
                environment={environment}
                onNodeSelect={handleNodeSelect}
              />
            ) : (
              <div className="h-full pt-24 px-6 pb-6">
                <FlowStagesView 
                  stages={flowMode === 'ci' ? CI_STAGES : CD_STAGES}
                  flowMode={flowMode}
                  onStageSelect={(stage) => handleNodeSelect(stage.id, { label: stage.label, type: stage.type, state: stage.status })}
                />
              </div>
            )}
            
            {/* Audit Context Watermark */}
            <div className="absolute bottom-4 left-4 px-3 py-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border">
              <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                <Lock className="w-3 h-3" />
                All interactions are logged to immutable audit trail
              </p>
            </div>
          </main>

          {/* Inspector Panel - Right Side */}
          <aside className="w-[380px] border-l border-border bg-card flex flex-col">
            <div className="flex-shrink-0 p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                Inspector Panel
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedNode ? `Viewing: ${selectedNode.label || selectedNode.id}` : 'Select a node to inspect'}
              </p>
            </div>

            {selectedNode ? (
              <>
                {/* Tabs */}
                <Tabs value={inspectorTab} onValueChange={(v) => setInspectorTab(v as any)} className="flex-1 flex flex-col">
                  <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4">
                    <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                    <TabsTrigger value="audit" className="text-xs">Audit</TabsTrigger>
                    <TabsTrigger value="evidence" className="text-xs">Evidence</TabsTrigger>
                  </TabsList>

                  <ScrollArea className="flex-1">
                    <TabsContent value="details" className="p-4 space-y-4 m-0">
                      <NodeDetailsPanel node={selectedNode} environment={environment} />
                      
                      {/* Action Request Section - NOT direct action */}
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3" />
                          Actions require policy review
                        </p>
                        
                        {canApprove(environment as any) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-between"
                            onClick={handleRequestApproval}
                          >
                            <span className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Request Approval
                            </span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {canDeploy(environment as any) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-between"
                            onClick={handleRequestDeploy}
                          >
                            <span className="flex items-center gap-2">
                              <Rocket className="w-4 h-4" />
                              Request Deploy
                            </span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="audit" className="p-4 space-y-3 m-0">
                      <AuditPanel nodeId={selectedNode.id} auditItems={auditData?.items || []} />
                    </TabsContent>

                    <TabsContent value="evidence" className="p-4 space-y-3 m-0">
                      <EvidencePanel node={selectedNode} />
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                <Eye className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm text-center">
                  Click on a node in the flow to inspect details, audit history, and evidence
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </ReactFlowProvider>
  );
}

// ============================================
// INSPECTOR SUB-PANELS
// ============================================

function NodeDetailsPanel({ node, environment }: { node: any; environment: string }) {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg border border-border bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Node ID</span>
          <Badge variant="outline" className="text-[10px] font-mono">{node.id}</Badge>
        </div>
        <h4 className="text-sm font-medium text-foreground">{node.label || 'Flow Node'}</h4>
        <p className="text-xs text-muted-foreground mt-1">{node.type || 'Standard Node'}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border border-border">
          <span className="text-[10px] text-muted-foreground">Status</span>
          <p className="text-sm font-medium text-foreground capitalize mt-1">
            {node.state || node.status || 'pending'}
          </p>
        </div>
        <div className="p-3 rounded-lg border border-border">
          <span className="text-[10px] text-muted-foreground">Environment</span>
          <p className="text-sm font-medium text-foreground uppercase mt-1">{environment}</p>
        </div>
      </div>

      {node.timestamp && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          Selected at {new Date(node.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

function AuditPanel({ nodeId, auditItems }: { nodeId: string; auditItems: any[] }) {
  const filteredItems = auditItems.filter((item) => 
    item.resource_id?.includes(nodeId) || item.details?.nodeId === nodeId
  ).slice(0, 10);

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No audit entries for this node</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredItems.map((item, idx) => (
        <div key={item.id || idx} className="p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center justify-between mb-1">
            <Badge variant="secondary" className="text-[10px] capitalize">{item.action}</Badge>
            <span className="text-[10px] text-muted-foreground">
              {new Date(item.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-foreground">{item.resource_type}</p>
        </div>
      ))}
    </div>
  );
}

function EvidencePanel({ node }: { node: any }) {
  // Mock evidence data - would come from CI evidence table
  const evidence = [
    { id: '1', type: 'test_results', name: 'Unit Tests', status: 'passed', coverage: '87%' },
    { id: '2', type: 'security_scan', name: 'SAST Scan', status: 'passed', issues: 0 },
    { id: '3', type: 'build_artifact', name: 'Docker Image', status: 'available', digest: 'sha256:abc123...' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">CI/CD evidence for compliance</p>
      {evidence.map((item) => (
        <div key={item.id} className="p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">{item.name}</span>
            <Badge 
              variant="outline" 
              className={cn(
                'text-[10px]',
                item.status === 'passed' || item.status === 'available' 
                  ? 'border-sec-safe text-sec-safe' 
                  : 'border-sec-danger text-sec-danger'
              )}
            >
              {item.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground capitalize">{item.type.replace('_', ' ')}</p>
        </div>
      ))}
    </div>
  );
}

// Flow Stages View for CI-only or CD-only modes
function FlowStagesView({ 
  stages, 
  flowMode,
  onStageSelect 
}: { 
  stages: typeof CI_STAGES; 
  flowMode: 'ci' | 'cd';
  onStageSelect: (stage: typeof CI_STAGES[0]) => void;
}) {
  const config = FLOW_MODE_CONFIG[flowMode];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'border-sec-safe bg-sec-safe/10 text-sec-safe';
      case 'running': return 'border-node-running bg-node-running/10 text-node-running';
      case 'failed': return 'border-sec-danger bg-sec-danger/10 text-sec-danger';
      case 'blocked': return 'border-sec-warning bg-sec-warning/10 text-sec-warning';
      default: return 'border-border bg-muted/30 text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-5 h-5" />;
      case 'running': return <RefreshCw className="w-5 h-5 animate-spin" />;
      case 'failed': return <AlertTriangle className="w-5 h-5" />;
      case 'blocked': return <Lock className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-4">
          {stages.map((stage, idx) => (
            <div key={stage.id} className="flex items-center">
              <button
                onClick={() => onStageSelect(stage)}
                className={cn(
                  'w-32 h-32 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105',
                  getStatusColor(stage.status)
                )}
              >
                {getStatusIcon(stage.status)}
                <span className="text-xs font-medium text-center px-2">{stage.label}</span>
              </button>
              {idx < stages.length - 1 && (
                <ChevronRight className="w-6 h-6 mx-2 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center py-4 text-xs text-muted-foreground">
        Click a stage to view details in the Inspector Panel
      </div>
    </div>
  );
}

export default FlowViewerScreen;
