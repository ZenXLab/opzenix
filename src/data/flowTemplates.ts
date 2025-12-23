import { Node, Edge } from '@xyflow/react';
import { ExecutionNodeData } from '@/components/flow/ExecutionNode';

// MLOps Flow Template
export const mlopsNodes: Node[] = [
  {
    id: 'data-ingestion',
    type: 'execution',
    position: { x: 50, y: 150 },
    data: {
      label: 'Data Ingestion',
      status: 'success',
      type: 'stage',
      description: 'Load training dataset',
      duration: '45s',
    } as ExecutionNodeData,
  },
  {
    id: 'data-validation',
    type: 'execution',
    position: { x: 280, y: 150 },
    data: {
      label: 'Data Validation',
      status: 'success',
      type: 'stage',
      description: 'Schema & quality checks',
      duration: '1m 20s',
    } as ExecutionNodeData,
  },
  {
    id: 'feature-engineering',
    type: 'execution',
    position: { x: 510, y: 150 },
    data: {
      label: 'Feature Engineering',
      status: 'success',
      type: 'stage',
      description: 'Transform & extract features',
      duration: '5m 12s',
    } as ExecutionNodeData,
  },
  {
    id: 'model-training',
    type: 'execution',
    position: { x: 740, y: 80 },
    data: {
      label: 'Model Training',
      status: 'running',
      type: 'stage',
      description: 'Train XGBoost model',
      duration: '15m 34s',
    } as ExecutionNodeData,
  },
  {
    id: 'hyperparameter-tuning',
    type: 'execution',
    position: { x: 740, y: 220 },
    data: {
      label: 'Hyperparameter Tuning',
      status: 'running',
      type: 'stage',
      description: 'Bayesian optimization',
      duration: '12m 48s',
    } as ExecutionNodeData,
  },
  {
    id: 'model-evaluation',
    type: 'execution',
    position: { x: 970, y: 150 },
    data: {
      label: 'Model Evaluation',
      status: 'idle',
      type: 'checkpoint',
      description: 'Accuracy, F1, AUC metrics',
    } as ExecutionNodeData,
  },
  {
    id: 'model-registry',
    type: 'execution',
    position: { x: 1200, y: 150 },
    data: {
      label: 'Model Registry',
      status: 'idle',
      type: 'stage',
      description: 'Version & store model',
    } as ExecutionNodeData,
  },
  {
    id: 'staging-deploy-ml',
    type: 'execution',
    position: { x: 1430, y: 150 },
    data: {
      label: 'Deploy Staging',
      status: 'idle',
      type: 'stage',
      description: 'Shadow deployment',
    } as ExecutionNodeData,
  },
  {
    id: 'drift-monitor',
    type: 'execution',
    position: { x: 1660, y: 150 },
    data: {
      label: 'Drift Monitor',
      status: 'idle',
      type: 'stage',
      description: 'Data & model drift detection',
    } as ExecutionNodeData,
  },
];

export const mlopsEdges: Edge[] = [
  { id: 'e-ingestion-validation', source: 'data-ingestion', target: 'data-validation' },
  { id: 'e-validation-feature', source: 'data-validation', target: 'feature-engineering' },
  { id: 'e-feature-training', source: 'feature-engineering', target: 'model-training' },
  { id: 'e-feature-tuning', source: 'feature-engineering', target: 'hyperparameter-tuning' },
  { id: 'e-training-eval', source: 'model-training', target: 'model-evaluation', animated: true },
  { id: 'e-tuning-eval', source: 'hyperparameter-tuning', target: 'model-evaluation', animated: true },
  { id: 'e-eval-registry', source: 'model-evaluation', target: 'model-registry' },
  { id: 'e-registry-staging', source: 'model-registry', target: 'staging-deploy-ml' },
  { id: 'e-staging-drift', source: 'staging-deploy-ml', target: 'drift-monitor' },
];

// LLMOps Flow Template
export const llmopsNodes: Node[] = [
  {
    id: 'prompt-design',
    type: 'execution',
    position: { x: 50, y: 150 },
    data: {
      label: 'Prompt Design',
      status: 'success',
      type: 'stage',
      description: 'Template & variable definition',
      duration: '0s',
    } as ExecutionNodeData,
  },
  {
    id: 'prompt-validation',
    type: 'execution',
    position: { x: 280, y: 80 },
    data: {
      label: 'Prompt Validation',
      status: 'success',
      type: 'stage',
      description: 'Syntax & injection checks',
      duration: '5s',
    } as ExecutionNodeData,
  },
  {
    id: 'safety-scan',
    type: 'execution',
    position: { x: 280, y: 220 },
    data: {
      label: 'Safety Scan',
      status: 'success',
      type: 'stage',
      description: 'Harmful content detection',
      duration: '8s',
    } as ExecutionNodeData,
  },
  {
    id: 'guardrails-check',
    type: 'execution',
    position: { x: 510, y: 150 },
    data: {
      label: 'Guardrails',
      status: 'running',
      type: 'checkpoint',
      description: 'Input/output filters',
      duration: '3s',
    } as ExecutionNodeData,
  },
  {
    id: 'model-routing',
    type: 'execution',
    position: { x: 740, y: 150 },
    data: {
      label: 'Model Router',
      status: 'idle',
      type: 'stage',
      description: 'Select optimal model',
    } as ExecutionNodeData,
  },
  {
    id: 'a-b-testing',
    type: 'execution',
    position: { x: 970, y: 80 },
    data: {
      label: 'A/B Testing',
      status: 'idle',
      type: 'stage',
      description: 'Compare prompt versions',
    } as ExecutionNodeData,
  },
  {
    id: 'cost-optimization',
    type: 'execution',
    position: { x: 970, y: 220 },
    data: {
      label: 'Cost Optimization',
      status: 'idle',
      type: 'stage',
      description: 'Token & latency analysis',
    } as ExecutionNodeData,
  },
  {
    id: 'llm-approval',
    type: 'execution',
    position: { x: 1200, y: 150 },
    data: {
      label: 'Human Review',
      status: 'idle',
      type: 'gate',
      description: 'Manual quality check',
    } as ExecutionNodeData,
  },
  {
    id: 'prompt-deploy',
    type: 'execution',
    position: { x: 1430, y: 150 },
    data: {
      label: 'Deploy Prompt',
      status: 'idle',
      type: 'stage',
      description: 'Production rollout',
    } as ExecutionNodeData,
  },
  {
    id: 'feedback-loop',
    type: 'execution',
    position: { x: 1660, y: 150 },
    data: {
      label: 'Feedback Loop',
      status: 'idle',
      type: 'checkpoint',
      description: 'User feedback collection',
    } as ExecutionNodeData,
  },
];

export const llmopsEdges: Edge[] = [
  { id: 'e-design-validation', source: 'prompt-design', target: 'prompt-validation' },
  { id: 'e-design-safety', source: 'prompt-design', target: 'safety-scan' },
  { id: 'e-validation-guardrails', source: 'prompt-validation', target: 'guardrails-check' },
  { id: 'e-safety-guardrails', source: 'safety-scan', target: 'guardrails-check' },
  { id: 'e-guardrails-routing', source: 'guardrails-check', target: 'model-routing', animated: true },
  { id: 'e-routing-ab', source: 'model-routing', target: 'a-b-testing' },
  { id: 'e-routing-cost', source: 'model-routing', target: 'cost-optimization' },
  { id: 'e-ab-approval', source: 'a-b-testing', target: 'llm-approval' },
  { id: 'e-cost-approval', source: 'cost-optimization', target: 'llm-approval' },
  { id: 'e-approval-deploy', source: 'llm-approval', target: 'prompt-deploy' },
  { id: 'e-deploy-feedback', source: 'prompt-deploy', target: 'feedback-loop' },
];

// CI/CD Flow Template (existing, enhanced)
export const cicdNodes: Node[] = [
  {
    id: 'source',
    type: 'execution',
    position: { x: 50, y: 150 },
    data: {
      label: 'Source',
      status: 'success',
      type: 'stage',
      description: 'Git clone & checkout',
      duration: '12s',
    } as ExecutionNodeData,
  },
  {
    id: 'build',
    type: 'execution',
    position: { x: 280, y: 150 },
    data: {
      label: 'Build',
      status: 'success',
      type: 'stage',
      description: 'Compile & package artifacts',
      duration: '2m 34s',
    } as ExecutionNodeData,
  },
  {
    id: 'security-scan',
    type: 'execution',
    position: { x: 510, y: 80 },
    data: {
      label: 'Security Scan',
      status: 'success',
      type: 'stage',
      description: 'SAST, dependency analysis',
      duration: '1m 12s',
    } as ExecutionNodeData,
  },
  {
    id: 'unit-tests',
    type: 'execution',
    position: { x: 510, y: 220 },
    data: {
      label: 'Unit Tests',
      status: 'success',
      type: 'stage',
      description: '847 tests passed',
      duration: '3m 45s',
    } as ExecutionNodeData,
  },
  {
    id: 'checkpoint-1',
    type: 'execution',
    position: { x: 740, y: 150 },
    data: {
      label: 'Build Verified',
      status: 'success',
      type: 'checkpoint',
      description: 'Artifact ready for deployment',
      duration: '0s',
    } as ExecutionNodeData,
  },
  {
    id: 'staging-deploy',
    type: 'execution',
    position: { x: 970, y: 150 },
    data: {
      label: 'Deploy Staging',
      status: 'running',
      type: 'stage',
      description: 'Rolling deployment to staging',
      duration: '4m 22s',
    } as ExecutionNodeData,
  },
  {
    id: 'integration-tests',
    type: 'execution',
    position: { x: 1200, y: 150 },
    data: {
      label: 'Integration Tests',
      status: 'idle',
      type: 'stage',
      description: 'E2E & API validation',
    } as ExecutionNodeData,
  },
  {
    id: 'approval-gate',
    type: 'execution',
    position: { x: 1430, y: 150 },
    data: {
      label: 'Production Approval',
      status: 'idle',
      type: 'gate',
      description: 'Requires 2 approvals',
    } as ExecutionNodeData,
  },
  {
    id: 'prod-deploy',
    type: 'execution',
    position: { x: 1660, y: 150 },
    data: {
      label: 'Deploy Production',
      status: 'idle',
      type: 'stage',
      description: 'Blue-green deployment',
    } as ExecutionNodeData,
  },
  {
    id: 'checkpoint-2',
    type: 'execution',
    position: { x: 1890, y: 150 },
    data: {
      label: 'Production Live',
      status: 'idle',
      type: 'checkpoint',
      description: 'Deployment complete',
    } as ExecutionNodeData,
  },
];

export const cicdEdges: Edge[] = [
  { id: 'e-source-build', source: 'source', target: 'build' },
  { id: 'e-build-security', source: 'build', target: 'security-scan' },
  { id: 'e-build-tests', source: 'build', target: 'unit-tests' },
  { id: 'e-security-cp1', source: 'security-scan', target: 'checkpoint-1' },
  { id: 'e-tests-cp1', source: 'unit-tests', target: 'checkpoint-1' },
  { id: 'e-cp1-staging', source: 'checkpoint-1', target: 'staging-deploy', animated: true },
  { id: 'e-staging-integration', source: 'staging-deploy', target: 'integration-tests' },
  { id: 'e-integration-approval', source: 'integration-tests', target: 'approval-gate' },
  { id: 'e-approval-prod', source: 'approval-gate', target: 'prod-deploy' },
  { id: 'e-prod-cp2', source: 'prod-deploy', target: 'checkpoint-2' },
];

export const getFlowTemplate = (type: 'cicd' | 'mlops' | 'llmops') => {
  switch (type) {
    case 'mlops':
      return { nodes: mlopsNodes, edges: mlopsEdges };
    case 'llmops':
      return { nodes: llmopsNodes, edges: llmopsEdges };
    case 'cicd':
    default:
      return { nodes: cicdNodes, edges: cicdEdges };
  }
};
