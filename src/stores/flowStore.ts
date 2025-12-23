import { create } from 'zustand';

export type NodeStatus = 'idle' | 'running' | 'success' | 'warning' | 'failed' | 'paused';

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
}

interface FlowState {
  selectedNodeId: string | null;
  selectedExecution: Execution | null;
  executions: Execution[];
  isInspectorOpen: boolean;
  activeEnvironment: string;
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
    },
    {
      id: 'exec-3',
      name: 'data-processor-hotfix',
      status: 'paused',
      startedAt: '28 min ago',
      environment: 'production',
      branch: 'hotfix/db-conn',
      commit: 'c2e9a7b',
      progress: 45,
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
    },
  ],
  isInspectorOpen: false,
  activeEnvironment: 'production',
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
}));
