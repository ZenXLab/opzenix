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
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Play,
  Pause,
  XCircle,
  Code,
  TestTube,
  Package,
  ScanSearch,
  KeyRound,
  Container,
  PenTool,
  GitMerge,
  Server,
  Activity,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { OpzenixFlowMap } from '@/components/flow/OpzenixFlowMap';
import { useRBACPermissions } from '@/hooks/useRBACPermissions';
import { cn } from '@/lib/utils';

// ============================================
// 🔄 FLOW VIEWER SCREEN - Enterprise CI/CD Views
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

const ENVIRONMENT_CONFIG = {
  dev: { label: 'DEVELOPMENT', color: 'bg-sec-safe', textColor: 'text-sec-safe' },
  uat: { label: 'UAT TESTING', color: 'bg-blue-500', textColor: 'text-blue-500' },
  staging: { label: 'STAGING', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  preprod: { label: 'PRE-PRODUCTION', color: 'bg-orange-500', textColor: 'text-orange-500' },
  prod: { label: 'PRODUCTION', color: 'bg-sec-danger', textColor: 'text-sec-danger' },
};

const FLOW_MODE_CONFIG = {
  ci: {
    label: 'CI Pipeline',
    icon: GitBranch,
    description: 'Continuous Integration - Build, Test, Scan',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    gradientFrom: 'from-blue-500/20',
    gradientTo: 'to-blue-500/5',
  },
  cd: {
    label: 'CD Pipeline',
    icon: Rocket,
    description: 'Continuous Deployment - Deploy, Verify, Monitor',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    gradientFrom: 'from-green-500/20',
    gradientTo: 'to-green-500/5',
  },
  'ci+cd': {
    label: 'Full Flow',
    icon: Layers,
    description: 'End-to-End Pipeline View (Read-Only)',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    gradientFrom: 'from-purple-500/20',
    gradientTo: 'to-purple-500/5',
  },
};

// CI Pipeline Stages with Icons
const CI_STAGES = [
  { id: 'source', label: 'Source', type: 'source.git', status: 'passed', icon: Code, description: 'Git Repository Checkout' },
  { id: 'lint', label: 'Lint', type: 'ci.lint', status: 'passed', icon: FileText, description: 'Code Quality Check' },
  { id: 'sast', label: 'SAST', type: 'ci.sast', status: 'passed', icon: ScanSearch, description: 'Static Analysis Security Testing' },
  { id: 'secrets', label: 'Secrets', type: 'ci.secrets-scan', status: 'passed', icon: KeyRound, description: 'Secrets Detection Scan' },
  { id: 'deps', label: 'Dependencies', type: 'ci.dependency-scan', status: 'passed', icon: Package, description: 'Dependency Vulnerability Check' },
  { id: 'unit', label: 'Unit Tests', type: 'ci.unit-test', status: 'running', icon: TestTube, description: 'Unit Test Execution' },
  { id: 'integration', label: 'Integration', type: 'ci.integration-test', status: 'pending', icon: GitMerge, description: 'Integration Tests' },
  { id: 'build', label: 'Build', type: 'artifact.image', status: 'pending', icon: Container, description: 'Container Image Build' },
  { id: 'sign', label: 'Sign', type: 'ci.image-sign', status: 'pending', icon: PenTool, description: 'Artifact Signing' },
];

// CD Pipeline Stages with Icons
const CD_STAGES = [
  { id: 'artifact', label: 'Artifact', type: 'artifact.image', status: 'passed', icon: Package, description: 'Verified Artifact Ready' },
  { id: 'scan', label: 'Scan', type: 'security.scan', status: 'passed', icon: Shield, description: 'Container Security Scan' },
  { id: 'gate', label: 'Gate', type: 'security.gate', status: 'passed', icon: Lock, description: 'Security Policy Gate' },
  { id: 'approval', label: 'Approval', type: 'approval.gate', status: 'blocked', icon: FileText, description: 'Manual Approval Required' },
  { id: 'deploy', label: 'Deploy', type: 'cd.deploy', status: 'pending', icon: Rocket, description: 'Rolling Deployment' },
  { id: 'k8s', label: 'Kubernetes', type: 'runtime.k8s', status: 'pending', icon: Server, description: 'K8s Pod Orchestration' },
  { id: 'health', label: 'Health', type: 'health.check', status: 'pending', icon: Activity, description: 'Health Check Validation' },
  { id: 'audit', label: 'Audit', type: 'audit.record', status: 'pending', icon: Database, description: 'Immutable Audit Record' },
];

export function FlowViewerScreen({
  environment,
  initialFlowMode = 'ci+cd',
  onBack,
  onRequestAction,
}: FlowViewerScreenProps) {
  const [flowMode, setFlowMode] = useState<FlowMode>(initialFlowMode);
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [inspectorTab, setInspectorTab] = useState<'details' | 'logs' | 'evidence'>('details');

  const { dbRole, isAdmin, canApprove, canDeploy } = useRBACPermissions();
  const envConfig = ENVIRONMENT_CONFIG[environment as keyof typeof ENVIRONMENT_CONFIG] || ENVIRONMENT_CONFIG.dev;
  const flowConfig = FLOW_MODE_CONFIG[flowMode];
  const FlowIcon = flowConfig.icon;
  const isProd = environment === 'prod';

  const stages = flowMode === 'ci' ? CI_STAGES : flowMode === 'cd' ? CD_STAGES : [...CI_STAGES, ...CD_STAGES];
  const passedCount = stages.filter(s => s.status === 'passed').length;
  const progress = Math.round((passedCount / stages.length) * 100);

  const handleStageSelect = (stage: any) => {
    setSelectedStage(stage);
    setInspectorTab('details');
  };

  const handleRequestApproval = () => {
    if (!selectedStage) return;
    onRequestAction({
      type: 'approval',
      environment,
      nodeId: selectedStage.id,
      nodeName: selectedStage.label,
      requiredRole: isProd ? 'CTO' : 'ARCHITECT',
      policyReference: 'POL-DEPLOY-001',
    });
  };

  const handleRequestDeploy = () => {
    if (!selectedStage) return;
    onRequestAction({
      type: 'deploy',
      environment,
      nodeId: selectedStage.id,
      nodeName: selectedStage.label,
      requiredRole: isProd ? 'PLATFORM_OWNER' : 'TECH_LEAD',
      policyReference: 'POL-DEPLOY-002',
    });
  };

  return (
    <ReactFlowProvider>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <header className={cn(
          'flex-shrink-0 border-b px-6 py-4',
          isProd ? 'border-sec-danger/30 bg-gradient-to-r from-sec-danger/10 to-transparent' : 'border-border bg-card/30'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />

              {/* Environment Badge */}
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border',
                isProd ? 'border-sec-danger/50 bg-sec-danger/10' : 'border-border bg-card'
              )}>
                <span className={cn('w-2.5 h-2.5 rounded-full', envConfig.color)} />
                {isProd && <Lock className="w-3.5 h-3.5 text-sec-danger" />}
                <span className={cn('text-sm font-bold', isProd ? 'text-sec-danger' : 'text-foreground')}>
                  {envConfig.label}
                </span>
              </div>

              {/* Flow Type Badge */}
              <div className={cn('flex items-center gap-2 px-4 py-2 rounded-lg border', flowConfig.borderColor, flowConfig.bgColor)}>
                <FlowIcon className={cn('w-4 h-4', flowConfig.color)} />
                <span className={cn('text-sm font-bold', flowConfig.color)}>{flowConfig.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs capitalize">{dbRole || 'viewer'}</Badge>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs">
                <Eye className="w-3 h-3" />
                <span>View Mode</span>
              </div>
            </div>
          </div>

          {/* Flow Mode Selector */}
          <div className="mt-4 flex items-center gap-3">
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
                  className={cn('gap-2', isActive && mode !== 'ci+cd' && config.bgColor)}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                  {mode === 'ci+cd' && <Badge variant="secondary" className="text-[9px] ml-1">Read-Only</Badge>}
                </Button>
              );
            })}

            <div className="flex-1" />

            {/* Progress Indicator */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{passedCount}/{stages.length} Complete</span>
              <div className="w-32">
                <Progress value={progress} className="h-2" />
              </div>
              <span className="text-xs font-medium">{progress}%</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Flow Canvas */}
          <main className="flex-1 relative">
            {flowMode === 'ci+cd' ? (
              <OpzenixFlowMap
                environment={environment}
                onNodeSelect={(nodeId, data) => handleStageSelect({ id: nodeId, ...data })}
              />
            ) : (
              <div className="h-full flex flex-col">
                {/* Pipeline Header */}
                <div className={cn(
                  'mx-6 mt-6 p-4 rounded-xl border backdrop-blur-sm',
                  flowConfig.bgColor,
                  flowConfig.borderColor
                )}>
                  <div className="flex items-center gap-3">
                    <FlowIcon className={cn('w-6 h-6', flowConfig.color)} />
                    <div>
                      <h2 className={cn('text-lg font-bold', flowConfig.color)}>{flowConfig.label}</h2>
                      <p className="text-xs text-muted-foreground">{flowConfig.description}</p>
                    </div>
                  </div>
                </div>

                {/* Stage Flow */}
                <div className="flex-1 flex items-center justify-center px-6">
                  <div className="flex items-center gap-2 overflow-x-auto pb-4">
                    {stages.map((stage, idx) => (
                      <StageNode
                        key={stage.id}
                        stage={stage}
                        isSelected={selectedStage?.id === stage.id}
                        onClick={() => handleStageSelect(stage)}
                        isLast={idx === stages.length - 1}
                        flowMode={flowMode}
                      />
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      All interactions logged to immutable audit trail
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {flowMode === 'ci' ? 'Build → Test → Package' : 'Deploy → Verify → Monitor'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Inspector Panel */}
          <aside className="w-[380px] border-l border-border bg-card flex flex-col">
            <div className="flex-shrink-0 p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                Stage Inspector
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedStage ? `Viewing: ${selectedStage.label}` : 'Select a stage to inspect'}
              </p>
            </div>

            {selectedStage ? (
              <Tabs value={inspectorTab} onValueChange={(v) => setInspectorTab(v as any)} className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4">
                  <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                  <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
                  <TabsTrigger value="evidence" className="text-xs">Evidence</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1">
                  <TabsContent value="details" className="p-4 space-y-4 m-0">
                    <StageDetailsPanel stage={selectedStage} environment={environment} />
                    
                    <Separator />

                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        Actions require policy review
                      </p>
                      
                      {canApprove(environment as any) && selectedStage.status === 'blocked' && (
                        <Button variant="outline" size="sm" className="w-full justify-between" onClick={handleRequestApproval}>
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Request Approval
                          </span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {canDeploy(environment as any) && selectedStage.type?.includes('deploy') && (
                        <Button variant="outline" size="sm" className="w-full justify-between" onClick={handleRequestDeploy}>
                          <span className="flex items-center gap-2">
                            <Rocket className="w-4 h-4" />
                            Request Deploy
                          </span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="logs" className="p-4 m-0">
                    <LogsPanel stage={selectedStage} />
                  </TabsContent>

                  <TabsContent value="evidence" className="p-4 m-0">
                    <EvidencePanel stage={selectedStage} />
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                <Eye className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm text-center">Click a stage to view details, logs, and evidence</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </ReactFlowProvider>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StageNode({
  stage,
  isSelected,
  onClick,
  isLast,
  flowMode,
}: {
  stage: any;
  isSelected: boolean;
  onClick: () => void;
  isLast: boolean;
  flowMode: FlowMode;
}) {
  const Icon = stage.icon;
  
  const statusConfig = {
    passed: { color: 'border-sec-safe bg-sec-safe/10 text-sec-safe', icon: CheckCircle },
    running: { color: 'border-node-running bg-node-running/10 text-node-running', icon: RefreshCw },
    failed: { color: 'border-sec-danger bg-sec-danger/10 text-sec-danger', icon: XCircle },
    blocked: { color: 'border-sec-warning bg-sec-warning/10 text-sec-warning', icon: Lock },
    pending: { color: 'border-muted-foreground/30 bg-muted/30 text-muted-foreground', icon: Clock },
  };

  const config = statusConfig[stage.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <>
      <button
        onClick={onClick}
        className={cn(
          'w-28 h-28 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105',
          config.color,
          isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
      >
        <div className="relative">
          <Icon className="w-6 h-6" />
          <StatusIcon className={cn(
            'w-3.5 h-3.5 absolute -bottom-1 -right-1 rounded-full bg-background',
            stage.status === 'running' && 'animate-spin'
          )} />
        </div>
        <span className="text-xs font-medium text-center leading-tight">{stage.label}</span>
      </button>
      {!isLast && (
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      )}
    </>
  );
}

function StageDetailsPanel({ stage, environment }: { stage: any; environment: string }) {
  const Icon = stage.icon;
  
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg border border-border bg-muted/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{stage.label}</h4>
            <p className="text-xs text-muted-foreground">{stage.description}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 rounded bg-background border border-border">
            <span className="text-[10px] text-muted-foreground">Status</span>
            <p className="text-sm font-medium text-foreground capitalize">{stage.status}</p>
          </div>
          <div className="p-2 rounded bg-background border border-border">
            <span className="text-[10px] text-muted-foreground">Type</span>
            <p className="text-sm font-medium text-foreground">{stage.type}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogsPanel({ stage }: { stage: any }) {
  const mockLogs = [
    { time: '10:23:45', level: 'info', message: `Starting ${stage.label}...` },
    { time: '10:23:46', level: 'info', message: 'Initializing environment' },
    { time: '10:23:47', level: 'debug', message: 'Loading configuration' },
    { time: '10:23:48', level: 'info', message: 'Executing main process' },
    stage.status === 'passed' && { time: '10:23:52', level: 'success', message: `${stage.label} completed successfully` },
    stage.status === 'failed' && { time: '10:23:52', level: 'error', message: `${stage.label} failed with exit code 1` },
    stage.status === 'running' && { time: '10:23:52', level: 'info', message: 'Processing...' },
  ].filter(Boolean);

  const levelColors = {
    info: 'text-blue-400',
    debug: 'text-muted-foreground',
    success: 'text-sec-safe',
    error: 'text-sec-danger',
    warning: 'text-sec-warning',
  };

  return (
    <div className="font-mono text-xs bg-slate-950 rounded-lg p-3 max-h-64 overflow-auto">
      {mockLogs.map((log: any, idx) => (
        <div key={idx} className="py-0.5">
          <span className="text-muted-foreground">[{log.time}]</span>
          <span className={cn('ml-2', levelColors[log.level as keyof typeof levelColors])}>{log.level.toUpperCase()}</span>
          <span className="text-slate-300 ml-2">{log.message}</span>
        </div>
      ))}
    </div>
  );
}

function EvidencePanel({ stage }: { stage: any }) {
  const evidence = [
    { type: 'test_results', name: 'Test Report', status: 'available' },
    { type: 'security_scan', name: 'Security Scan', status: 'available' },
    { type: 'artifact', name: 'Build Artifact', status: stage.status === 'passed' ? 'available' : 'pending' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">CI/CD evidence for compliance</p>
      {evidence.map((item, idx) => (
        <div key={idx} className="p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{item.name}</span>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px]',
                item.status === 'available' ? 'border-sec-safe text-sec-safe' : 'border-muted-foreground text-muted-foreground'
              )}
            >
              {item.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FlowViewerScreen;
