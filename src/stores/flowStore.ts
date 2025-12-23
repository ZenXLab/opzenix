import { create } from 'zustand';

export type NodeStatus = 'idle' | 'running' | 'success' | 'warning' | 'failed' | 'paused';
export type FlowType = 'cicd' | 'mlops' | 'llmops' | 'infrastructure' | 'security';

export interface FlowNode {
  id: string;
  type: 'stage' | 'checkpoint' | 'gate';
  label: string;
  status: NodeStatus;
  description?: string;
  duration?: string;
  aiInsight?: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface Execution {
  id: string;
  name: string;
  status: NodeStatus;
  startedAt: string;
  environment: string;
  branch: string;
  commit: string;
  progress: number;
  flowType?: FlowType;
}

export interface ApprovalRequest {
  id: string;
  executionId: string;
  nodeId: string;
  title: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  requiredApprovals: number;
  currentApprovals: number;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface Deployment {
  id: string;
  executionId?: string;
  environment: string;
  version: string;
  status: NodeStatus;
  deployedAt: string;
  deployedBy?: string;
  incidentId?: string;
  notes?: string;
}

interface FlowState {
  selectedNodeId: string | null;
  selectedExecution: Execution | null;
  executions: Execution[];
  isInspectorOpen: boolean;
  activeEnvironment: string;
  activeFlowType: FlowType;
  approvalRequests: ApprovalRequest[];
  deployments: Deployment[];
  isConfigEditorOpen: boolean;
  isTimelineOpen: boolean;
  activeView: 'dashboard' | 'flows';
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    uptime: string;
    activeFlows: number;
    pendingApprovals: number;
  };
  
  setSelectedNodeId: (id: string | null) => void;
  setSelectedExecution: (execution: Execution | null) => void;
  setInspectorOpen: (open: boolean) => void;
  setActiveEnvironment: (env: string) => void;
  setActiveFlowType: (type: FlowType) => void;
  setConfigEditorOpen: (open: boolean) => void;
  setTimelineOpen: (open: boolean) => void;
  setActiveView: (view: 'dashboard' | 'flows') => void;
  updateExecutionStatus: (executionId: string, status: NodeStatus, progress: number) => void;
  addApprovalRequest: (request: ApprovalRequest) => void;
  updateApprovalRequest: (id: string, updates: Partial<ApprovalRequest>) => void;
}

export const useFlowStore = create<FlowState>((set) => ({
  selectedNodeId: null,
  selectedExecution: null,
  executions: [
    {
      id: 'exec-1',
      name: 'api-gateway-v2.4.1',
      status: 'running',
      startedAt: '2 min ago',
      environment: 'production',
      branch: 'main',
      commit: 'a3f7c2e',
      progress: 65,
      flowType: 'cicd',
    },
    {
      id: 'exec-2',
      name: 'ml-pipeline-retrain',
      status: 'success',
      startedAt: '15 min ago',
      environment: 'staging',
      branch: 'feature/v3',
      commit: 'b8d4f1a',
      progress: 100,
      flowType: 'mlops',
    },
    {
      id: 'exec-3',
      name: 'llm-prompt-deploy',
      status: 'paused',
      startedAt: '28 min ago',
      environment: 'production',
      branch: 'hotfix/guardrail',
      commit: 'c2e9a7b',
      progress: 45,
      flowType: 'llmops',
    },
    {
      id: 'exec-4',
      name: 'auth-service-v1.9.0',
      status: 'warning',
      startedAt: '1 hour ago',
      environment: 'staging',
      branch: 'release/1.9',
      commit: 'd5f2b8c',
      progress: 80,
      flowType: 'cicd',
    },
  ],
  isInspectorOpen: false,
  activeEnvironment: 'production',
  activeFlowType: 'cicd',
  approvalRequests: [
    {
      id: 'apr-1',
      executionId: 'exec-1',
      nodeId: 'approval-gate',
      title: 'Production Deployment Approval',
      description: 'Deploy api-gateway-v2.4.1 to production',
      status: 'pending',
      requiredApprovals: 2,
      currentApprovals: 1,
      createdAt: '5 min ago',
    },
  ],
  deployments: [
    { id: 'd1', environment: 'production', version: 'v2.4.0', status: 'success', deployedAt: '2024-01-20T10:30:00Z' },
    { id: 'd2', environment: 'production', version: 'v2.3.5', status: 'success', deployedAt: '2024-01-18T14:15:00Z' },
    { id: 'd3', environment: 'production', version: 'v2.3.4', status: 'failed', deployedAt: '2024-01-17T09:00:00Z', incidentId: 'INC-2024-0117' },
    { id: 'd4', environment: 'production', version: 'v2.3.3', status: 'success', deployedAt: '2024-01-15T16:45:00Z' },
    { id: 'd5', environment: 'production', version: 'v2.3.2', status: 'success', deployedAt: '2024-01-12T11:20:00Z' },
    { id: 'd6', environment: 'staging', version: 'v2.4.1', status: 'running', deployedAt: '2024-01-20T12:00:00Z' },
  ],
  isConfigEditorOpen: false,
  isTimelineOpen: false,
  activeView: 'dashboard',
  systemHealth: {
    status: 'healthy',
    uptime: '99.97%',
    activeFlows: 12,
    pendingApprovals: 3,
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id, isInspectorOpen: id !== null }),
  setSelectedExecution: (execution) => set({ selectedExecution: execution }),
  setInspectorOpen: (open) => set({ isInspectorOpen: open }),
  setActiveEnvironment: (env) => set({ activeEnvironment: env }),
  setActiveFlowType: (type) => set({ activeFlowType: type }),
  setConfigEditorOpen: (open) => set({ isConfigEditorOpen: open }),
  setTimelineOpen: (open) => set({ isTimelineOpen: open }),
  setActiveView: (view) => set({ activeView: view }),
  updateExecutionStatus: (executionId, status, progress) => set((state) => ({
    executions: state.executions.map((e) =>
      e.id === executionId ? { ...e, status, progress } : e
    ),
  })),
  addApprovalRequest: (request) => set((state) => ({
    approvalRequests: [...state.approvalRequests, request],
  })),
  updateApprovalRequest: (id, updates) => set((state) => ({
    approvalRequests: state.approvalRequests.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    ),
  })),
}));
