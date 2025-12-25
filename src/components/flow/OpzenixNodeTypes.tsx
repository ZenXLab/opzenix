import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import {
  GitBranch,
  Shield,
  ShieldCheck,
  ShieldAlert,
  TestTube,
  Bug,
  FileSearch,
  Key,
  Package,
  PenTool,
  ScanLine,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Users,
  GitCommit,
  Container,
  Rocket,
  Server,
  Activity,
  FileText,
  AlertTriangle,
  RefreshCw,
  Layers,
  Box,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// OPZENIX Node State Types
export type OpzenixNodeState = 'PASSED' | 'FAILED' | 'PENDING' | 'RUNNING' | 'LOCKED' | 'BLOCKED';

// OPZENIX Node Types (from taxonomy)
export type OpzenixNodeType = 
  | 'source.git'
  | 'ci.sast'
  | 'ci.dependency-scan'
  | 'ci.secrets-scan'
  | 'ci.unit-test'
  | 'ci.integration-test'
  | 'ci.sbom'
  | 'ci.image-sign'
  | 'ci.image-scan'
  | 'artifact.image'
  | 'security.gate'
  | 'approval.gate'
  | 'cd.argo'
  | 'deploy.rolling'
  | 'deploy.canary'
  | 'deploy.bluegreen'
  | 'runtime.k8s'
  | 'verify.runtime'
  | 'audit.record';

export interface OpzenixNodeData {
  label: string;
  nodeType: OpzenixNodeType;
  state: OpzenixNodeState;
  description?: string;
  duration?: string;
  
  // Source node data
  repo?: string;
  branch?: string;
  commitSha?: string;
  author?: string;
  timestamp?: string;
  
  // Artifact node data
  imageName?: string;
  registry?: string;
  tag?: string;
  digest?: string;
  signed?: boolean;
  
  // Security gate data
  severityThreshold?: string;
  blockedReason?: string;
  
  // Approval gate data
  environment?: string;
  requiredApprovers?: number;
  currentApprovers?: number;
  approvers?: Array<{ role: string; user: string; timestamp: string }>;
  pendingApprovals?: number;
  comments?: string[];
  
  // CD data
  appName?: string;
  gitRevision?: string;
  syncMode?: 'manual' | 'auto';
  syncResult?: string;
  
  // Kubernetes data
  namespace?: string;
  deployment?: string;
  replicas?: number;
  readyReplicas?: number;
  
  // Evidence
  reportUrl?: string;
  evidenceLinks?: Array<{ label: string; url: string }>;
  
  // Metadata
  mvpStatus?: 'DONE' | 'LOCKED' | 'FUTURE';
}

// Props interface for all OPZENIX nodes
interface OpzenixNodeProps {
  data: OpzenixNodeData;
  selected?: boolean;
}

// State configuration
const stateConfig: Record<OpzenixNodeState, { icon: React.ElementType; className: string; borderClass: string }> = {
  PASSED: { icon: CheckCircle2, className: 'text-emerald-400', borderClass: 'border-emerald-500/50' },
  FAILED: { icon: XCircle, className: 'text-red-400', borderClass: 'border-red-500/50' },
  PENDING: { icon: Clock, className: 'text-amber-400', borderClass: 'border-amber-500/50' },
  RUNNING: { icon: RefreshCw, className: 'text-blue-400 animate-spin', borderClass: 'border-blue-500/50' },
  LOCKED: { icon: Lock, className: 'text-muted-foreground', borderClass: 'border-muted' },
  BLOCKED: { icon: AlertTriangle, className: 'text-red-400', borderClass: 'border-red-500/50' },
};

// Node type icons
const nodeTypeIcons: Record<OpzenixNodeType, React.ElementType> = {
  'source.git': GitBranch,
  'ci.sast': Shield,
  'ci.dependency-scan': Bug,
  'ci.secrets-scan': Key,
  'ci.unit-test': TestTube,
  'ci.integration-test': TestTube,
  'ci.sbom': FileSearch,
  'ci.image-sign': PenTool,
  'ci.image-scan': ScanLine,
  'artifact.image': Package,
  'security.gate': ShieldAlert,
  'approval.gate': Users,
  'cd.argo': GitCommit,
  'deploy.rolling': RefreshCw,
  'deploy.canary': Layers,
  'deploy.bluegreen': ArrowRightLeft,
  'runtime.k8s': Container,
  'verify.runtime': Activity,
  'audit.record': FileText,
};

// Node category colors
const getNodeCategoryClass = (nodeType: OpzenixNodeType): string => {
  if (nodeType.startsWith('source')) return 'bg-slate-800/90';
  if (nodeType.startsWith('ci.')) return 'bg-blue-950/90';
  if (nodeType.startsWith('artifact')) return 'bg-purple-950/90';
  if (nodeType.startsWith('security')) return 'bg-red-950/90';
  if (nodeType.startsWith('approval')) return 'bg-amber-950/90';
  if (nodeType.startsWith('cd.') || nodeType.startsWith('deploy.')) return 'bg-emerald-950/90';
  if (nodeType.startsWith('runtime')) return 'bg-cyan-950/90';
  if (nodeType.startsWith('verify')) return 'bg-teal-950/90';
  if (nodeType.startsWith('audit')) return 'bg-slate-900/90';
  return 'bg-card';
};

// Base Node Component for CI stages
const BaseOpzenixNode = memo(({ data, selected }: OpzenixNodeProps) => {
  const stateInfo = stateConfig[data.state];
  const StateIcon = stateInfo.icon;
  const NodeIcon = nodeTypeIcons[data.nodeType];
  const categoryClass = getNodeCategoryClass(data.nodeType);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative min-w-[180px] rounded-lg border-2 backdrop-blur-sm',
        categoryClass,
        stateInfo.borderClass,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        data.state === 'RUNNING' && 'shadow-lg shadow-blue-500/20'
      )}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded-md', stateInfo.borderClass.replace('border-', 'bg-').replace('/50', '/20'))}>
              <NodeIcon className="w-4 h-4 text-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', stateInfo.className)} />
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        {data.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>
        )}
        
        {data.duration && data.state !== 'PENDING' && data.state !== 'LOCKED' && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{data.duration}</span>
          </div>
        )}

        {data.mvpStatus && (
          <Badge 
            variant="outline" 
            className={cn(
              'text-[10px] px-1.5 py-0',
              data.mvpStatus === 'DONE' && 'border-emerald-500/50 text-emerald-400',
              data.mvpStatus === 'LOCKED' && 'border-amber-500/50 text-amber-400',
              data.mvpStatus === 'FUTURE' && 'border-muted text-muted-foreground'
            )}
          >
            {data.mvpStatus}
          </Badge>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
    </motion.div>
  );
});
BaseOpzenixNode.displayName = 'BaseOpzenixNode';

// Source Node - GitHub
export const SourceGitNode = memo(({ data, selected }: OpzenixNodeProps) => {
  const stateInfo = stateConfig[data.state];
  const StateIcon = stateInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative min-w-[200px] rounded-lg border-2 bg-slate-800/90 backdrop-blur-sm',
        stateInfo.borderClass,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-slate-700/50">
              <GitBranch className="w-4 h-4 text-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', stateInfo.className)} />
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        {data.repo && (
          <div className="text-xs text-muted-foreground font-mono">{data.repo}</div>
        )}
        <div className="flex items-center gap-3 text-xs">
          {data.branch && (
            <div className="flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-muted-foreground" />
              <span className="text-foreground">{data.branch}</span>
            </div>
          )}
          {data.commitSha && (
            <div className="flex items-center gap-1">
              <GitCommit className="w-3 h-3 text-muted-foreground" />
              <span className="font-mono text-foreground">{data.commitSha.slice(0, 7)}</span>
            </div>
          )}
        </div>
        {data.author && data.timestamp && (
          <div className="text-xs text-muted-foreground">
            {data.author} • {data.timestamp}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
    </motion.div>
  );
});
SourceGitNode.displayName = 'SourceGitNode';

// Artifact Image Node
export const ArtifactImageNode = memo(({ data, selected }: OpzenixNodeProps) => {
  const stateInfo = stateConfig[data.state];
  const StateIcon = stateInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative min-w-[220px] rounded-lg border-2 bg-purple-950/90 backdrop-blur-sm',
        stateInfo.borderClass,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-purple-800/50">
              <Package className="w-4 h-4 text-purple-300" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {data.signed && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
            <StateIcon className={cn('w-4 h-4', stateInfo.className)} />
          </div>
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        {data.imageName && (
          <div className="text-xs font-mono text-foreground truncate">{data.imageName}</div>
        )}
        <div className="flex items-center gap-2 text-xs">
          {data.registry && (
            <Badge variant="outline" className="text-[10px]">{data.registry}</Badge>
          )}
          {data.tag && (
            <span className="font-mono text-muted-foreground">:{data.tag}</span>
          )}
        </div>
        {data.digest && (
          <div className="text-[10px] font-mono text-muted-foreground truncate">
            SHA: {data.digest.slice(0, 16)}...
          </div>
        )}
        <Badge variant="outline" className="text-[10px] border-purple-500/50 text-purple-300">
          IMMUTABLE
        </Badge>
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
    </motion.div>
  );
});
ArtifactImageNode.displayName = 'ArtifactImageNode';

// Security Gate Node
export const SecurityGateNode = memo(({ data, selected }: OpzenixNodeProps) => {
  const stateInfo = stateConfig[data.state];
  const StateIcon = stateInfo.icon;
  const isBlocked = data.state === 'FAILED' || data.state === 'BLOCKED';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative min-w-[200px] rounded-lg border-2 bg-red-950/90 backdrop-blur-sm',
        stateInfo.borderClass,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isBlocked && 'shadow-lg shadow-red-500/30'
      )}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded-md', isBlocked ? 'bg-red-800/50' : 'bg-emerald-800/50')}>
              {isBlocked ? <ShieldAlert className="w-4 h-4 text-red-300" /> : <ShieldCheck className="w-4 h-4 text-emerald-300" />}
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', stateInfo.className)} />
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        <p className="text-xs text-muted-foreground">{data.description}</p>
        {data.severityThreshold && (
          <div className="text-xs">
            <span className="text-muted-foreground">Threshold: </span>
            <span className="text-foreground font-medium">{data.severityThreshold}</span>
          </div>
        )}
        {isBlocked && data.blockedReason && (
          <div className="p-2 bg-red-900/50 rounded text-xs text-red-200">
            {data.blockedReason}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
    </motion.div>
  );
});
SecurityGateNode.displayName = 'SecurityGateNode';

// Approval Gate Node
export const ApprovalGateNode = memo(({ data, selected }: OpzenixNodeProps) => {
  const stateInfo = stateConfig[data.state];
  const StateIcon = stateInfo.icon;
  const isPending = data.state === 'PENDING';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative min-w-[220px] rounded-lg border-2 bg-amber-950/90 backdrop-blur-sm',
        stateInfo.borderClass,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isPending && 'shadow-lg shadow-amber-500/20'
      )}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-800/50">
              <Users className="w-4 h-4 text-amber-300" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', stateInfo.className)} />
        </div>
      </div>

      <div className="px-3 py-2 space-y-2">
        {data.environment && (
          <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-300">
            {data.environment.toUpperCase()}
          </Badge>
        )}
        
        <div className="text-xs">
          <span className="text-muted-foreground">Approvals: </span>
          <span className={cn(
            'font-semibold',
            (data.currentApprovers || 0) >= (data.requiredApprovers || 1) ? 'text-emerald-400' : 'text-amber-400'
          )}>
            {data.currentApprovers || 0}/{data.requiredApprovers || 1}
          </span>
        </div>

        {data.approvers && data.approvers.length > 0 && (
          <div className="space-y-1">
            {data.approvers.map((approver, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-muted-foreground">{approver.role}:</span>
                <span className="text-foreground">{approver.user}</span>
              </div>
            ))}
          </div>
        )}

        {isPending && data.pendingApprovals && data.pendingApprovals > 0 && (
          <div className="text-xs text-amber-400">
            Waiting for {data.pendingApprovals} more approval{data.pendingApprovals > 1 ? 's' : ''}
          </div>
        )}

        <Badge variant="outline" className="text-[10px] border-muted text-muted-foreground">
          READ-ONLY AFTER APPROVAL
        </Badge>
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
    </motion.div>
  );
});
ApprovalGateNode.displayName = 'ApprovalGateNode';

// CD Argo Node
export const CDArgoNode = memo(({ data, selected }: OpzenixNodeProps) => {
  const stateInfo = stateConfig[data.state];
  const StateIcon = stateInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative min-w-[200px] rounded-lg border-2 bg-emerald-950/90 backdrop-blur-sm',
        stateInfo.borderClass,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-800/50">
              <Rocket className="w-4 h-4 text-emerald-300" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', stateInfo.className)} />
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        {data.appName && (
          <div className="text-xs font-mono text-foreground">{data.appName}</div>
        )}
        {data.gitRevision && (
          <div className="flex items-center gap-1.5 text-xs">
            <GitCommit className="w-3 h-3 text-muted-foreground" />
            <span className="font-mono text-muted-foreground">{data.gitRevision.slice(0, 7)}</span>
          </div>
        )}
        {data.syncMode && (
          <Badge 
            variant="outline" 
            className={cn(
              'text-[10px]',
              data.syncMode === 'manual' ? 'border-amber-500/50 text-amber-300' : 'border-emerald-500/50 text-emerald-300'
            )}
          >
            {data.syncMode.toUpperCase()} SYNC
          </Badge>
        )}
        {data.syncResult && (
          <div className="text-xs text-muted-foreground">{data.syncResult}</div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
    </motion.div>
  );
});
CDArgoNode.displayName = 'CDArgoNode';

// Deployment Strategy Node
export const DeploymentStrategyNode = memo(({ data, selected }: OpzenixNodeProps) => {
  const stateInfo = stateConfig[data.state];
  const StateIcon = stateInfo.icon;
  
  const strategyType = data.nodeType.split('.')[1] as 'rolling' | 'canary' | 'bluegreen';
  const strategyIcons = {
    rolling: RefreshCw,
    canary: Layers,
    bluegreen: ArrowRightLeft,
  };
  const StrategyIcon = strategyIcons[strategyType];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative min-w-[200px] rounded-lg border-2 bg-emerald-950/90 backdrop-blur-sm',
        stateInfo.borderClass,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        data.state === 'RUNNING' && 'shadow-lg shadow-emerald-500/20'
      )}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-800/50">
              <StrategyIcon className={cn('w-4 h-4 text-emerald-300', data.state === 'RUNNING' && 'animate-spin')} />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', stateInfo.className)} />
        </div>
      </div>

      <div className="px-3 py-2 space-y-2">
        <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-300">
          {strategyType.toUpperCase()}
        </Badge>
        
        {data.state === 'RUNNING' && (
          <div className="space-y-1">
            {strategyType === 'rolling' && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-sm bg-emerald-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                  />
                ))}
              </div>
            )}
            {strategyType === 'canary' && (
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1 h-2 bg-blue-500/50 rounded" style={{ width: '70%' }} />
                <div className="h-2 bg-emerald-500 rounded" style={{ width: '30%' }} />
                <span className="text-muted-foreground">30%</span>
              </div>
            )}
            {strategyType === 'bluegreen' && (
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-blue-500/50 rounded text-xs">Blue</div>
                <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                <div className="px-2 py-1 bg-emerald-500/50 rounded text-xs">Green</div>
              </div>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
    </motion.div>
  );
});
DeploymentStrategyNode.displayName = 'DeploymentStrategyNode';

// Kubernetes Runtime Node
export const RuntimeK8sNode = memo(({ data, selected }: OpzenixNodeProps) => {
  const stateInfo = stateConfig[data.state];
  const StateIcon = stateInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative min-w-[200px] rounded-lg border-2 bg-cyan-950/90 backdrop-blur-sm',
        stateInfo.borderClass,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-cyan-800/50">
              <Container className="w-4 h-4 text-cyan-300" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', stateInfo.className)} />
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        {data.namespace && (
          <div className="flex items-center gap-1.5 text-xs">
            <Box className="w-3 h-3 text-muted-foreground" />
            <span className="font-mono text-foreground">{data.namespace}</span>
          </div>
        )}
        {data.deployment && (
          <div className="flex items-center gap-1.5 text-xs">
            <Server className="w-3 h-3 text-muted-foreground" />
            <span className="font-mono text-foreground">{data.deployment}</span>
          </div>
        )}
        {data.replicas !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Replicas:</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: data.replicas }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full',
                    i < (data.readyReplicas || 0) ? 'bg-emerald-500' : 'bg-muted'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-foreground">
              {data.readyReplicas || 0}/{data.replicas}
            </span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
    </motion.div>
  );
});
RuntimeK8sNode.displayName = 'RuntimeK8sNode';

// Verification Node
export const VerifyRuntimeNode = memo(({ data, selected }: OpzenixNodeProps) => {
  const stateInfo = stateConfig[data.state];
  const StateIcon = stateInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative min-w-[180px] rounded-lg border-2 bg-teal-950/90 backdrop-blur-sm',
        stateInfo.borderClass,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-teal-800/50">
              <Activity className="w-4 h-4 text-teal-300" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', stateInfo.className)} />
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        <p className="text-xs text-muted-foreground">{data.description}</p>
        {data.duration && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{data.duration}</span>
          </div>
        )}
        {data.evidenceLinks && data.evidenceLinks.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.evidenceLinks.map((link, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">
                {link.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
    </motion.div>
  );
});
VerifyRuntimeNode.displayName = 'VerifyRuntimeNode';

// Audit Record Node
export const AuditRecordNode = memo(({ data, selected }: OpzenixNodeProps) => {
  const stateInfo = stateConfig[data.state];
  const StateIcon = stateInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative min-w-[180px] rounded-lg border-2 border-dashed bg-slate-900/90 backdrop-blur-sm',
        stateInfo.borderClass,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-slate-800/50">
              <FileText className="w-4 h-4 text-slate-300" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', stateInfo.className)} />
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        <p className="text-xs text-muted-foreground">{data.description}</p>
        <div className="flex items-center gap-2">
          <Lock className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Immutable • Cryptographically linked</span>
        </div>
        {data.digest && (
          <div className="text-[10px] font-mono text-muted-foreground truncate">
            {data.digest}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
    </motion.div>
  );
});
AuditRecordNode.displayName = 'AuditRecordNode';

// CI Stage Node (generic for all CI types)
export const CIStageNode = memo(({ data, selected }: OpzenixNodeProps) => {
  return <BaseOpzenixNode data={data} selected={selected} />;
});
CIStageNode.displayName = 'CIStageNode';

// Export all node types for React Flow registration
export const opzenixNodeTypes = {
  'source.git': SourceGitNode,
  'ci.sast': CIStageNode,
  'ci.dependency-scan': CIStageNode,
  'ci.secrets-scan': CIStageNode,
  'ci.unit-test': CIStageNode,
  'ci.integration-test': CIStageNode,
  'ci.sbom': CIStageNode,
  'ci.image-sign': CIStageNode,
  'ci.image-scan': CIStageNode,
  'artifact.image': ArtifactImageNode,
  'security.gate': SecurityGateNode,
  'approval.gate': ApprovalGateNode,
  'cd.argo': CDArgoNode,
  'deploy.rolling': DeploymentStrategyNode,
  'deploy.canary': DeploymentStrategyNode,
  'deploy.bluegreen': DeploymentStrategyNode,
  'runtime.k8s': RuntimeK8sNode,
  'verify.runtime': VerifyRuntimeNode,
  'audit.record': AuditRecordNode,
};
