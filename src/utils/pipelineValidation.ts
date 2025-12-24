import { Node, Edge } from '@xyflow/react';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'cycle' | 'disconnected' | 'missing_required' | 'invalid_connection' | 'no_source' | 'no_deploy';
  message: string;
  nodeIds?: string[];
  edgeId?: string;
}

export interface ValidationWarning {
  type: 'no_tests' | 'no_security' | 'no_checkpoint' | 'parallel_risk';
  message: string;
  nodeIds?: string[];
}

// Required stage types for a valid pipeline
const REQUIRED_STAGES = ['source', 'deploy'] as const;

// Valid connection rules: source stage type -> allowed target stage types
const CONNECTION_RULES: Record<string, string[]> = {
  source: ['build', 'test', 'security', 'deploy'],
  build: ['test', 'security', 'deploy', 'checkpoint', 'approval', 'parallel'],
  test: ['security', 'deploy', 'checkpoint', 'approval', 'build', 'parallel'],
  security: ['deploy', 'checkpoint', 'approval', 'test', 'parallel'],
  checkpoint: ['approval', 'deploy', 'rollback'],
  approval: ['deploy', 'rollback'],
  deploy: ['rollback'],
  rollback: ['deploy', 'build'],
  parallel: ['test', 'security', 'build', 'checkpoint'],
};

/**
 * Detects cycles in the pipeline graph using DFS
 */
function detectCycles(nodes: Node[], edges: Edge[]): string[][] {
  const cycles: string[][] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adjacencyList = new Map<string, string[]>();
  
  // Build adjacency list
  nodes.forEach(node => adjacencyList.set(node.id, []));
  edges.forEach(edge => {
    const sources = adjacencyList.get(edge.source);
    if (sources) sources.push(edge.target);
  });
  
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];
  
  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);
    
    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        cycles.push([...path.slice(cycleStart), neighbor]);
        return true;
      }
    }
    
    path.pop();
    recursionStack.delete(nodeId);
    return false;
  }
  
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }
  
  return cycles;
}

/**
 * Finds disconnected nodes (nodes with no incoming or outgoing edges)
 */
function findDisconnectedNodes(nodes: Node[], edges: Edge[]): string[] {
  const connectedNodes = new Set<string>();
  
  edges.forEach(edge => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });
  
  return nodes
    .filter(node => !connectedNodes.has(node.id))
    .map(node => node.id);
}

/**
 * Checks if all required stages are present
 */
function checkRequiredStages(nodes: Node[]): string[] {
  const stageTypes = new Set(nodes.map(n => (n.data as any)?.stageType));
  const missing: string[] = [];
  
  REQUIRED_STAGES.forEach(required => {
    if (!stageTypes.has(required)) {
      missing.push(required);
    }
  });
  
  return missing;
}

/**
 * Validates individual edge connections based on stage types
 */
function validateConnections(nodes: Node[], edges: Edge[]): { edgeId: string; source: string; target: string; message: string }[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const invalidConnections: { edgeId: string; source: string; target: string; message: string }[] = [];
  
  edges.forEach(edge => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    
    if (!sourceNode || !targetNode) return;
    
    const sourceType = (sourceNode.data as any)?.stageType;
    const targetType = (targetNode.data as any)?.stageType;
    
    if (!sourceType || !targetType) return;
    
    const allowedTargets = CONNECTION_RULES[sourceType];
    if (allowedTargets && !allowedTargets.includes(targetType)) {
      invalidConnections.push({
        edgeId: edge.id,
        source: edge.source,
        target: edge.target,
        message: `Invalid connection: ${sourceType} → ${targetType} is not allowed`,
      });
    }
  });
  
  return invalidConnections;
}

/**
 * Checks for recommended stages that are missing
 */
function checkRecommendedStages(nodes: Node[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const stageTypes = new Set(nodes.map(n => (n.data as any)?.stageType));
  
  if (!stageTypes.has('test')) {
    warnings.push({
      type: 'no_tests',
      message: 'No test stage found. Consider adding tests before deployment.',
    });
  }
  
  if (!stageTypes.has('security')) {
    warnings.push({
      type: 'no_security',
      message: 'No security scan stage found. Consider adding security checks.',
    });
  }
  
  if (!stageTypes.has('checkpoint')) {
    warnings.push({
      type: 'no_checkpoint',
      message: 'No checkpoint stage found. Checkpoints enable safe rollbacks.',
    });
  }
  
  return warnings;
}

/**
 * Main validation function
 */
export function validatePipeline(nodes: Node[], edges: Edge[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check for empty pipeline
  if (nodes.length === 0) {
    errors.push({
      type: 'disconnected',
      message: 'Pipeline has no stages. Add at least a source and deploy stage.',
    });
    return { isValid: false, errors, warnings };
  }
  
  // 1. Detect cycles
  const cycles = detectCycles(nodes, edges);
  cycles.forEach(cycle => {
    errors.push({
      type: 'cycle',
      message: `Cycle detected: ${cycle.join(' → ')}`,
      nodeIds: cycle,
    });
  });
  
  // 2. Find disconnected nodes
  const disconnected = findDisconnectedNodes(nodes, edges);
  if (disconnected.length > 0 && nodes.length > 1) {
    errors.push({
      type: 'disconnected',
      message: `Disconnected nodes found: ${disconnected.length} node(s) not connected to pipeline`,
      nodeIds: disconnected,
    });
  }
  
  // 3. Check required stages
  const missingRequired = checkRequiredStages(nodes);
  missingRequired.forEach(stage => {
    errors.push({
      type: stage === 'source' ? 'no_source' : 'no_deploy',
      message: `Missing required stage: ${stage}`,
    });
  });
  
  // 4. Validate connections
  const invalidConnections = validateConnections(nodes, edges);
  invalidConnections.forEach(conn => {
    errors.push({
      type: 'invalid_connection',
      message: conn.message,
      nodeIds: [conn.source, conn.target],
      edgeId: conn.edgeId,
    });
  });
  
  // 5. Check recommended stages (warnings only)
  warnings.push(...checkRecommendedStages(nodes));
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a new edge would create a cycle
 */
export function wouldCreateCycle(nodes: Node[], edges: Edge[], newEdge: { source: string; target: string }): boolean {
  const testEdges = [...edges, { id: 'test-edge', ...newEdge }];
  const cycles = detectCycles(nodes, testEdges);
  return cycles.length > 0;
}

/**
 * Check if a connection is valid based on stage types
 */
export function isValidConnection(nodes: Node[], source: string, target: string): { valid: boolean; reason?: string } {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const sourceNode = nodeMap.get(source);
  const targetNode = nodeMap.get(target);
  
  if (!sourceNode || !targetNode) {
    return { valid: false, reason: 'Source or target node not found' };
  }
  
  const sourceType = (sourceNode.data as any)?.stageType;
  const targetType = (targetNode.data as any)?.stageType;
  
  if (!sourceType || !targetType) {
    return { valid: true }; // Allow if types are unknown
  }
  
  const allowedTargets = CONNECTION_RULES[sourceType];
  if (allowedTargets && !allowedTargets.includes(targetType)) {
    return { 
      valid: false, 
      reason: `Cannot connect ${sourceType} to ${targetType}` 
    };
  }
  
  return { valid: true };
}
