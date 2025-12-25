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
  Activity,
  FileText,
  AlertTriangle,
  RefreshCw,
  Layers,
  ArrowRightLeft,
  Pause,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// ============================================
// OPZENIX NODE STATE & COLOR SPEC (LOCKED MVP 1.0.0)
// ============================================
// Color = state + trust, not decoration.
// Frontend may NEVER override state color.
// ============================================

// OPZENIX Node State Types (NON-NEGOTIABLE)
export type OpzenixNodeState = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'LOCKED';

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
  [key: string]: unknown;
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

// ============================================
// 🎨 COLOR PALETTE (Enterprise / Regulator-Safe)
// LOCKED - NON-NEGOTIABLE
// ============================================
// State      | Border    | Fill    | Animation
// PENDING    | #6B7280   | #0F172A | None
// RUNNING    | #3B82F6   | #020617 | Soft pulse
// PASSED     | #22C55E   | #020617 | 1x success glow
// FAILED     | #EF4444   | #020617 | Shake + halt
// BLOCKED    | #F59E0B   | #020617 | Static
// LOCKED     | #334155   | #020617 | None
// ============================================

const stateConfig: Record<OpzenixNodeState, { 
  icon: React.ElementType; 
  borderColor: string;
  textColor: string;
  animation: string;
}> = {
  PENDING: { 
    icon: Clock, 
    borderColor: '#6B7280', // Grey
    textColor: '#9CA3AF',
    animation: '' 
  },
  RUNNING: { 
    icon: RefreshCw, 
    borderColor: '#3B82F6', // Blue
    textColor: '#60A5FA',
    animation: 'animate-pulse' 
  },
  PASSED: { 
    icon: CheckCircle2, 
    borderColor: '#22C55E', // Green
    textColor: '#4ADE80',
    animation: '' 
  },
  FAILED: { 
    icon: XCircle, 
    borderColor: '#EF4444', // Red
    textColor: '#F87171',
    animation: 'animate-shake' 
  },
  BLOCKED: { 
    icon: Pause, 
    borderColor: '#F59E0B', // Amber
    textColor: '#FBBF24',
    animation: '' 
  },
  LOCKED: { 
    icon: Lock, 
    borderColor: '#334155', // Steel
    textColor: '#64748B',
    animation: '' 
  },
};

// Node type icons (Icons Only - NO color overrides)
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
  'security.gate': Lock,
  'approval.gate': Users,
  'cd.argo': GitCommit,
  'deploy.rolling': RefreshCw,
  'deploy.canary': Layers,
  'deploy.bluegreen': ArrowRightLeft,
  'runtime.k8s': Container,
  'verify.runtime': Activity,
  'audit.record': FileText,
};

// Fill color is consistent: #020617 (dark slate)
const FILL_COLOR = '#020617';

// Base Node Component (LOCKED SPEC)
const BaseOpzenixNode = memo(({ data, selected }: OpzenixNodeProps) => {
  const stateInfo = stateConfig[data.state];
  const StateIcon = stateInfo.icon;
  const NodeIcon = nodeTypeIcons[data.nodeType];
  const isImmutable = data.state === 'PASSED' || data.state === 'FAILED' || data.state === 'BLOCKED' || data.state === 'LOCKED';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative min-w-[180px] rounded-lg border-2 backdrop-blur-sm',
        stateInfo.animation,
        selected && 'ring-2 ring-offset-2 ring-offset-background'
      )}
      style={{ 
        backgroundColor: FILL_COLOR,
        borderColor: stateInfo.borderColor,
        boxShadow: data.state === 'RUNNING' ? `0 0 20px ${stateInfo.borderColor}40` : undefined
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
      
      <div className="px-3 py-2 border-b" style={{ borderColor: `${stateInfo.borderColor}30` }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: `${stateInfo.borderColor}20` }}>
              <NodeIcon className="w-4 h-4 text-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon 
            className={cn('w-4 h-4', data.state === 'RUNNING' && 'animate-spin')} 
            style={{ color: stateInfo.textColor }} 
          />
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

        {isImmutable && (
          <Badge 
            variant="outline" 
            className="text-[10px] px-1.5 py-0"
            style={{ borderColor: `${stateInfo.borderColor}50`, color: stateInfo.textColor }}
          >
            IMMUTABLE
          </Badge>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
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
        'relative min-w-[200px] rounded-lg border-2 backdrop-blur-sm',
        stateInfo.animation,
        selected && 'ring-2 ring-offset-2 ring-offset-background'
      )}
      style={{ backgroundColor: FILL_COLOR, borderColor: stateInfo.borderColor }}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
      
      <div className="px-3 py-2 border-b" style={{ borderColor: `${stateInfo.borderColor}30` }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: `${stateInfo.borderColor}20` }}>
              <GitBranch className="w-4 h-4 text-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', data.state === 'RUNNING' && 'animate-spin')} style={{ color: stateInfo.textColor }} />
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

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
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
        'relative min-w-[220px] rounded-lg border-2 backdrop-blur-sm',
        stateInfo.animation,
        selected && 'ring-2 ring-offset-2 ring-offset-background'
      )}
      style={{ backgroundColor: FILL_COLOR, borderColor: stateInfo.borderColor }}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
      
      <div className="px-3 py-2 border-b" style={{ borderColor: `${stateInfo.borderColor}30` }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: `${stateInfo.borderColor}20` }}>
              <Package className="w-4 h-4 text-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {data.signed && <ShieldCheck className="w-4 h-4" style={{ color: '#22C55E' }} />}
            <StateIcon className={cn('w-4 h-4', data.state === 'RUNNING' && 'animate-spin')} style={{ color: stateInfo.textColor }} />
          </div>
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        {data.imageName && (
          <div className="text-xs font-mono text-foreground truncate">{data.imageName}</div>
        )}
        <div className="flex items-center gap-2 text-xs">
          {data.registry && (
            <Badge variant="outline" className="text-[10px]" style={{ borderColor: `${stateInfo.borderColor}50` }}>{data.registry}</Badge>
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
        <Badge variant="outline" className="text-[10px]" style={{ borderColor: `${stateInfo.borderColor}50`, color: stateInfo.textColor }}>
          IMMUTABLE
        </Badge>
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
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
        'relative min-w-[200px] rounded-lg border-2 backdrop-blur-sm',
        stateInfo.animation,
        selected && 'ring-2 ring-offset-2 ring-offset-background'
      )}
      style={{ 
        backgroundColor: FILL_COLOR, 
        borderColor: stateInfo.borderColor,
        boxShadow: isBlocked ? `0 0 15px ${stateInfo.borderColor}30` : undefined
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
      
      <div className="px-3 py-2 border-b" style={{ borderColor: `${stateInfo.borderColor}30` }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: `${stateInfo.borderColor}20` }}>
              {isBlocked ? <ShieldAlert className="w-4 h-4 text-foreground" /> : <ShieldCheck className="w-4 h-4 text-foreground" />}
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', data.state === 'RUNNING' && 'animate-spin')} style={{ color: stateInfo.textColor }} />
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
          <div className="p-2 rounded text-xs" style={{ backgroundColor: `${stateInfo.borderColor}20`, color: stateInfo.textColor }}>
            {data.blockedReason}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
    </motion.div>
  );
});
SecurityGateNode.displayName = 'SecurityGateNode';

// Approval Gate Node
export const ApprovalGateNode = memo(({ data, selected }: OpzenixNodeProps) => {
  const stateInfo = stateConfig[data.state];
  const StateIcon = stateInfo.icon;
  const isPending = data.state === 'PENDING' || data.state === 'BLOCKED';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative min-w-[220px] rounded-lg border-2 backdrop-blur-sm',
        stateInfo.animation,
        selected && 'ring-2 ring-offset-2 ring-offset-background'
      )}
      style={{ 
        backgroundColor: FILL_COLOR, 
        borderColor: stateInfo.borderColor,
        boxShadow: isPending ? `0 0 15px ${stateInfo.borderColor}20` : undefined
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
      
      <div className="px-3 py-2 border-b" style={{ borderColor: `${stateInfo.borderColor}30` }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: `${stateInfo.borderColor}20` }}>
              <Users className="w-4 h-4 text-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', data.state === 'RUNNING' && 'animate-spin')} style={{ color: stateInfo.textColor }} />
        </div>
      </div>

      <div className="px-3 py-2 space-y-2">
        {data.environment && (
          <Badge variant="outline" className="text-[10px]" style={{ borderColor: `${stateInfo.borderColor}50`, color: stateInfo.textColor }}>
            {data.environment.toUpperCase()}
          </Badge>
        )}
        
        <div className="text-xs">
          <span className="text-muted-foreground">Approvals: </span>
          <span className="font-semibold" style={{ 
            color: (data.currentApprovers || 0) >= (data.requiredApprovers || 1) ? '#22C55E' : '#F59E0B' 
          }}>
            {data.currentApprovers || 0}/{data.requiredApprovers || 1}
          </span>
        </div>

        {data.approvers && data.approvers.length > 0 && (
          <div className="space-y-1">
            {data.approvers.map((approver, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-3 h-3" style={{ color: '#22C55E' }} />
                <span className="text-muted-foreground">{approver.role}:</span>
                <span className="text-foreground">{approver.user}</span>
              </div>
            ))}
          </div>
        )}

        {isPending && data.pendingApprovals && data.pendingApprovals > 0 && (
          <div className="text-xs" style={{ color: stateInfo.textColor }}>
            Waiting for {data.pendingApprovals} more approval{data.pendingApprovals > 1 ? 's' : ''}
          </div>
        )}

        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          READ-ONLY AFTER APPROVAL
        </Badge>
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
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
        'relative min-w-[200px] rounded-lg border-2 backdrop-blur-sm',
        stateInfo.animation,
        selected && 'ring-2 ring-offset-2 ring-offset-background'
      )}
      style={{ 
        backgroundColor: FILL_COLOR, 
        borderColor: stateInfo.borderColor,
        boxShadow: data.state === 'RUNNING' ? `0 0 20px ${stateInfo.borderColor}40` : undefined
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
      
      <div className="px-3 py-2 border-b" style={{ borderColor: `${stateInfo.borderColor}30` }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: `${stateInfo.borderColor}20` }}>
              <GitCommit className="w-4 h-4 text-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', data.state === 'RUNNING' && 'animate-spin')} style={{ color: stateInfo.textColor }} />
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        {data.appName && (
          <div className="text-xs font-mono text-foreground">{data.appName}</div>
        )}
        <div className="flex items-center gap-2 text-xs">
          {data.gitRevision && (
            <span className="font-mono text-muted-foreground">{data.gitRevision.slice(0, 8)}</span>
          )}
          {data.syncMode && (
            <Badge variant="outline" className="text-[10px]" style={{ borderColor: `${stateInfo.borderColor}50` }}>
              {data.syncMode.toUpperCase()}
            </Badge>
          )}
        </div>
        {data.syncResult && (
          <div className="text-xs" style={{ color: stateInfo.textColor }}>{data.syncResult}</div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
    </motion.div>
  );
});
CDArgoNode.displayName = 'CDArgoNode';

// Deploy Strategy Nodes
const createDeployNode = (type: 'rolling' | 'canary' | 'bluegreen', Icon: React.ElementType) => {
  const Node = memo(({ data, selected }: OpzenixNodeProps) => {
    const stateInfo = stateConfig[data.state];
    const StateIcon = stateInfo.icon;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'relative min-w-[180px] rounded-lg border-2 backdrop-blur-sm',
          stateInfo.animation,
          selected && 'ring-2 ring-offset-2 ring-offset-background'
        )}
        style={{ 
          backgroundColor: FILL_COLOR, 
          borderColor: stateInfo.borderColor,
          boxShadow: data.state === 'RUNNING' ? `0 0 20px ${stateInfo.borderColor}40` : undefined
        }}
      >
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
        
        <div className="px-3 py-2 border-b" style={{ borderColor: `${stateInfo.borderColor}30` }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md" style={{ backgroundColor: `${stateInfo.borderColor}20` }}>
                <Icon className="w-4 h-4 text-foreground" />
              </div>
              <span className="font-semibold text-sm text-foreground">{data.label}</span>
            </div>
            <StateIcon className={cn('w-4 h-4', data.state === 'RUNNING' && 'animate-spin')} style={{ color: stateInfo.textColor }} />
          </div>
        </div>

        <div className="px-3 py-2 space-y-1.5">
          <Badge variant="outline" className="text-[10px] capitalize" style={{ borderColor: `${stateInfo.borderColor}50` }}>
            {type.replace('-', ' ')} strategy
          </Badge>
          {data.description && (
            <p className="text-xs text-muted-foreground">{data.description}</p>
          )}
        </div>

        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
      </motion.div>
    );
  });
  Node.displayName = `Deploy${type.charAt(0).toUpperCase() + type.slice(1)}Node`;
  return Node;
};

export const DeployRollingNode = createDeployNode('rolling', RefreshCw);
export const DeployCanaryNode = createDeployNode('canary', Layers);
export const DeployBlueGreenNode = createDeployNode('bluegreen', ArrowRightLeft);

// Runtime Kubernetes Node
export const RuntimeK8sNode = memo(({ data, selected }: OpzenixNodeProps) => {
  const stateInfo = stateConfig[data.state];
  const StateIcon = stateInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative min-w-[200px] rounded-lg border-2 backdrop-blur-sm',
        stateInfo.animation,
        selected && 'ring-2 ring-offset-2 ring-offset-background'
      )}
      style={{ 
        backgroundColor: FILL_COLOR, 
        borderColor: stateInfo.borderColor,
        boxShadow: data.state === 'RUNNING' ? `0 0 20px ${stateInfo.borderColor}40` : undefined
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
      
      <div className="px-3 py-2 border-b" style={{ borderColor: `${stateInfo.borderColor}30` }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: `${stateInfo.borderColor}20` }}>
              <Container className="w-4 h-4 text-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', data.state === 'RUNNING' && 'animate-spin')} style={{ color: stateInfo.textColor }} />
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        {data.namespace && (
          <div className="text-xs font-mono text-muted-foreground">{data.namespace}</div>
        )}
        {data.deployment && (
          <div className="text-xs font-mono text-foreground">{data.deployment}</div>
        )}
        {data.replicas !== undefined && (
          <div className="text-xs">
            <span className="text-muted-foreground">Replicas: </span>
            <span className="font-semibold" style={{ 
              color: (data.readyReplicas || 0) >= (data.replicas || 0) ? '#22C55E' : '#F59E0B' 
            }}>
              {data.readyReplicas || 0}/{data.replicas}
            </span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
    </motion.div>
  );
});
RuntimeK8sNode.displayName = 'RuntimeK8sNode';

// Verify Runtime Node
export const VerifyRuntimeNode = memo(({ data, selected }: OpzenixNodeProps) => {
  const stateInfo = stateConfig[data.state];
  const StateIcon = stateInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative min-w-[200px] rounded-lg border-2 backdrop-blur-sm',
        stateInfo.animation,
        selected && 'ring-2 ring-offset-2 ring-offset-background'
      )}
      style={{ backgroundColor: FILL_COLOR, borderColor: stateInfo.borderColor }}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
      
      <div className="px-3 py-2 border-b" style={{ borderColor: `${stateInfo.borderColor}30` }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: `${stateInfo.borderColor}20` }}>
              <Activity className="w-4 h-4 text-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', data.state === 'RUNNING' && 'animate-spin')} style={{ color: stateInfo.textColor }} />
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        {data.description && (
          <p className="text-xs text-muted-foreground">{data.description}</p>
        )}
        {data.evidenceLinks && data.evidenceLinks.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.evidenceLinks.map((link, i) => (
              <Badge key={i} variant="outline" className="text-[10px]" style={{ borderColor: `${stateInfo.borderColor}50` }}>
                {link.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
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
        'relative min-w-[200px] rounded-lg border-2 backdrop-blur-sm',
        stateInfo.animation,
        selected && 'ring-2 ring-offset-2 ring-offset-background'
      )}
      style={{ backgroundColor: FILL_COLOR, borderColor: stateInfo.borderColor }}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
      
      <div className="px-3 py-2 border-b" style={{ borderColor: `${stateInfo.borderColor}30` }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: `${stateInfo.borderColor}20` }}>
              <FileText className="w-4 h-4 text-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">{data.label}</span>
          </div>
          <StateIcon className={cn('w-4 h-4', data.state === 'RUNNING' && 'animate-spin')} style={{ color: stateInfo.textColor }} />
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        {data.description && (
          <p className="text-xs text-muted-foreground">{data.description}</p>
        )}
        {data.digest && (
          <div className="text-[10px] font-mono text-muted-foreground truncate">
            {data.digest}
          </div>
        )}
        <Badge variant="outline" className="text-[10px]" style={{ borderColor: `${stateInfo.borderColor}50`, color: stateInfo.textColor }}>
          IMMUTABLE RECORD
        </Badge>
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-background" style={{ backgroundColor: stateInfo.borderColor }} />
    </motion.div>
  );
});
AuditRecordNode.displayName = 'AuditRecordNode';

// Export node types map for ReactFlow
export const opzenixNodeTypes = {
  'source.git': SourceGitNode,
  'ci.sast': BaseOpzenixNode,
  'ci.dependency-scan': BaseOpzenixNode,
  'ci.secrets-scan': BaseOpzenixNode,
  'ci.unit-test': BaseOpzenixNode,
  'ci.integration-test': BaseOpzenixNode,
  'ci.sbom': BaseOpzenixNode,
  'ci.image-sign': BaseOpzenixNode,
  'ci.image-scan': BaseOpzenixNode,
  'artifact.image': ArtifactImageNode,
  'security.gate': SecurityGateNode,
  'approval.gate': ApprovalGateNode,
  'cd.argo': CDArgoNode,
  'deploy.rolling': DeployRollingNode,
  'deploy.canary': DeployCanaryNode,
  'deploy.bluegreen': DeployBlueGreenNode,
  'runtime.k8s': RuntimeK8sNode,
  'verify.runtime': VerifyRuntimeNode,
  'audit.record': AuditRecordNode,
};

// Export state config for external use
export { stateConfig };
