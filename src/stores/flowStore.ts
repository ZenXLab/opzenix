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
  setExecutions: (executions: Execution[]) => void;
  setDeployments: (deployments: Deployment[]) => void;
  addApprovalRequest: (request: ApprovalRequest) => void;
  updateApprovalRequest: (id: string, updates: Partial<ApprovalRequest>) => void;
  setApprovalRequests: (requests: ApprovalRequest[]) => void;
  setSystemHealth: (health: Partial<FlowState['systemHealth']>) => void;
}

export const useFlowStore = create<FlowState>((set) => ({
  selectedNodeId: null,
  selectedExecution: null,
  // Start with empty arrays - data will be fetched from Supabase
  executions: [],
  isInspectorOpen: false,
  activeEnvironment: 'production',
  activeFlowType: 'cicd',
  // Start with empty arrays - data will be fetched from Supabase
  approvalRequests: [],
  deployments: [],
  isConfigEditorOpen: false,
  isTimelineOpen: false,
  activeView: 'dashboard',
  systemHealth: {
    status: 'healthy',
    uptime: '0%',
    activeFlows: 0,
    pendingApprovals: 0,
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
  setExecutions: (executions) => set({ executions }),
  setDeployments: (deployments) => set({ deployments }),
  addApprovalRequest: (request) => set((state) => ({
    approvalRequests: [...state.approvalRequests, request],
  })),
  updateApprovalRequest: (id, updates) => set((state) => ({
    approvalRequests: state.approvalRequests.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    ),
  })),
  setApprovalRequests: (requests) => set({ approvalRequests: requests }),
  setSystemHealth: (health) => set((state) => ({
    systemHealth: { ...state.systemHealth, ...health },
  })),
}));