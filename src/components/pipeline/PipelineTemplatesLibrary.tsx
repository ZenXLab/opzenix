import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, GitBranch, Brain, Box, Sparkles, Check, 
  ArrowRight, Filter, Star, Clock, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Node, Edge } from '@xyflow/react';

interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  category: 'cicd' | 'mlops' | 'llmops';
  stages: number;
  popularity: number;
  lastUpdated: string;
  tags: string[];
  nodes: Node[];
  edges: Edge[];
}

const templates: PipelineTemplate[] = [
  // CI/CD Templates
  {
    id: 'cicd-basic',
    name: 'Basic CI/CD Pipeline',
    description: 'Standard build, test, and deploy pipeline for web applications',
    category: 'cicd',
    stages: 5,
    popularity: 4.8,
    lastUpdated: '2 days ago',
    tags: ['Node.js', 'Docker', 'Kubernetes'],
    nodes: [
      { id: 'src-1', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Checkout', stageType: 'source', status: 'idle' } },
      { id: 'build-1', type: 'pipelineStage', position: { x: 250, y: 150 }, data: { label: 'Build', stageType: 'build', status: 'idle' } },
      { id: 'test-1', type: 'pipelineStage', position: { x: 450, y: 150 }, data: { label: 'Test', stageType: 'test', status: 'idle' } },
      { id: 'security-1', type: 'pipelineStage', position: { x: 650, y: 150 }, data: { label: 'Security Scan', stageType: 'security', status: 'idle' } },
      { id: 'deploy-1', type: 'pipelineStage', position: { x: 850, y: 150 }, data: { label: 'Deploy', stageType: 'deploy', status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'src-1', target: 'build-1' },
      { id: 'e2', source: 'build-1', target: 'test-1' },
      { id: 'e3', source: 'test-1', target: 'security-1' },
      { id: 'e4', source: 'security-1', target: 'deploy-1' },
    ],
  },
  {
    id: 'cicd-multi-env',
    name: 'Multi-Environment Pipeline',
    description: 'Deploy to staging, pre-prod, and production with approval gates',
    category: 'cicd',
    stages: 9,
    popularity: 4.9,
    lastUpdated: '1 day ago',
    tags: ['Enterprise', 'Multi-Cloud', 'Blue-Green'],
    nodes: [
      { id: 'src-1', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Checkout', stageType: 'source', status: 'idle' } },
      { id: 'build-1', type: 'pipelineStage', position: { x: 220, y: 150 }, data: { label: 'Build', stageType: 'build', status: 'idle' } },
      { id: 'test-1', type: 'pipelineStage', position: { x: 390, y: 150 }, data: { label: 'Test Suite', stageType: 'test', status: 'idle' } },
      { id: 'deploy-stg', type: 'pipelineStage', position: { x: 560, y: 150 }, data: { label: 'Deploy Staging', stageType: 'deploy', status: 'idle' } },
      { id: 'approve-1', type: 'approvalGate', position: { x: 730, y: 150 }, data: { label: 'QA Approval', stageType: 'approval', status: 'idle' } },
      { id: 'deploy-preprod', type: 'pipelineStage', position: { x: 900, y: 150 }, data: { label: 'Deploy Pre-Prod', stageType: 'deploy', status: 'idle' } },
      { id: 'approve-2', type: 'approvalGate', position: { x: 1070, y: 150 }, data: { label: 'Prod Approval', stageType: 'approval', status: 'idle' } },
      { id: 'checkpoint-1', type: 'checkpoint', position: { x: 1240, y: 150 }, data: { label: 'Pre-Deploy Check', stageType: 'checkpoint', status: 'checkpoint' } },
      { id: 'deploy-prod', type: 'pipelineStage', position: { x: 1410, y: 150 }, data: { label: 'Deploy Prod', stageType: 'deploy', status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'src-1', target: 'build-1' },
      { id: 'e2', source: 'build-1', target: 'test-1' },
      { id: 'e3', source: 'test-1', target: 'deploy-stg' },
      { id: 'e4', source: 'deploy-stg', target: 'approve-1' },
      { id: 'e5', source: 'approve-1', target: 'deploy-preprod' },
      { id: 'e6', source: 'deploy-preprod', target: 'approve-2' },
      { id: 'e7', source: 'approve-2', target: 'checkpoint-1' },
      { id: 'e8', source: 'checkpoint-1', target: 'deploy-prod' },
    ],
  },
  {
    id: 'cicd-microservices',
    name: 'Microservices CI/CD',
    description: 'Parallel build and deploy for microservices architecture',
    category: 'cicd',
    stages: 12,
    popularity: 4.7,
    lastUpdated: '3 days ago',
    tags: ['Microservices', 'Kubernetes', 'Helm'],
    nodes: [
      { id: 'src-1', type: 'pipelineStage', position: { x: 50, y: 200 }, data: { label: 'Checkout All', stageType: 'source', status: 'idle' } },
      { id: 'build-api', type: 'pipelineStage', position: { x: 250, y: 80 }, data: { label: 'Build API', stageType: 'build', status: 'idle' } },
      { id: 'build-web', type: 'pipelineStage', position: { x: 250, y: 200 }, data: { label: 'Build Web', stageType: 'build', status: 'idle' } },
      { id: 'build-worker', type: 'pipelineStage', position: { x: 250, y: 320 }, data: { label: 'Build Worker', stageType: 'build', status: 'idle' } },
      { id: 'test-api', type: 'pipelineStage', position: { x: 450, y: 80 }, data: { label: 'Test API', stageType: 'test', status: 'idle' } },
      { id: 'test-web', type: 'pipelineStage', position: { x: 450, y: 200 }, data: { label: 'Test Web', stageType: 'test', status: 'idle' } },
      { id: 'test-worker', type: 'pipelineStage', position: { x: 450, y: 320 }, data: { label: 'Test Worker', stageType: 'test', status: 'idle' } },
      { id: 'security-1', type: 'pipelineStage', position: { x: 650, y: 200 }, data: { label: 'Security Scan', stageType: 'security', status: 'idle' } },
      { id: 'checkpoint-1', type: 'checkpoint', position: { x: 850, y: 200 }, data: { label: 'Pre-Deploy', stageType: 'checkpoint', status: 'checkpoint' } },
      { id: 'deploy-all', type: 'pipelineStage', position: { x: 1050, y: 200 }, data: { label: 'Deploy All', stageType: 'deploy', status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'src-1', target: 'build-api' },
      { id: 'e2', source: 'src-1', target: 'build-web' },
      { id: 'e3', source: 'src-1', target: 'build-worker' },
      { id: 'e4', source: 'build-api', target: 'test-api' },
      { id: 'e5', source: 'build-web', target: 'test-web' },
      { id: 'e6', source: 'build-worker', target: 'test-worker' },
      { id: 'e7', source: 'test-api', target: 'security-1' },
      { id: 'e8', source: 'test-web', target: 'security-1' },
      { id: 'e9', source: 'test-worker', target: 'security-1' },
      { id: 'e10', source: 'security-1', target: 'checkpoint-1' },
      { id: 'e11', source: 'checkpoint-1', target: 'deploy-all' },
    ],
  },
  // MLOps Templates
  {
    id: 'mlops-training',
    name: 'ML Model Training Pipeline',
    description: 'End-to-end ML training with data validation, training, and model registry',
    category: 'mlops',
    stages: 8,
    popularity: 4.6,
    lastUpdated: '5 days ago',
    tags: ['PyTorch', 'MLflow', 'Data Validation'],
    nodes: [
      { id: 'data-1', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Data Ingestion', stageType: 'source', status: 'idle' } },
      { id: 'validate-1', type: 'pipelineStage', position: { x: 250, y: 150 }, data: { label: 'Data Validation', stageType: 'test', status: 'idle' } },
      { id: 'transform-1', type: 'pipelineStage', position: { x: 450, y: 150 }, data: { label: 'Feature Transform', stageType: 'build', status: 'idle' } },
      { id: 'train-1', type: 'pipelineStage', position: { x: 650, y: 150 }, data: { label: 'Model Training', stageType: 'build', status: 'idle', description: 'GPU Cluster' } },
      { id: 'eval-1', type: 'pipelineStage', position: { x: 850, y: 150 }, data: { label: 'Model Evaluation', stageType: 'test', status: 'idle' } },
      { id: 'approve-1', type: 'approvalGate', position: { x: 1050, y: 150 }, data: { label: 'Model Approval', stageType: 'approval', status: 'idle' } },
      { id: 'registry-1', type: 'pipelineStage', position: { x: 1250, y: 150 }, data: { label: 'Model Registry', stageType: 'deploy', status: 'idle' } },
      { id: 'deploy-1', type: 'pipelineStage', position: { x: 1450, y: 150 }, data: { label: 'Deploy Model', stageType: 'deploy', status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'data-1', target: 'validate-1' },
      { id: 'e2', source: 'validate-1', target: 'transform-1' },
      { id: 'e3', source: 'transform-1', target: 'train-1' },
      { id: 'e4', source: 'train-1', target: 'eval-1' },
      { id: 'e5', source: 'eval-1', target: 'approve-1' },
      { id: 'e6', source: 'approve-1', target: 'registry-1' },
      { id: 'e7', source: 'registry-1', target: 'deploy-1' },
    ],
  },
  {
    id: 'mlops-continuous',
    name: 'Continuous Training Pipeline',
    description: 'Automated retraining with drift detection and A/B testing',
    category: 'mlops',
    stages: 10,
    popularity: 4.5,
    lastUpdated: '1 week ago',
    tags: ['AutoML', 'Drift Detection', 'A/B Testing'],
    nodes: [
      { id: 'trigger-1', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Schedule Trigger', stageType: 'source', status: 'idle' } },
      { id: 'drift-1', type: 'pipelineStage', position: { x: 220, y: 150 }, data: { label: 'Drift Detection', stageType: 'test', status: 'idle' } },
      { id: 'data-1', type: 'pipelineStage', position: { x: 390, y: 150 }, data: { label: 'Data Pipeline', stageType: 'source', status: 'idle' } },
      { id: 'train-1', type: 'pipelineStage', position: { x: 560, y: 150 }, data: { label: 'Retrain Model', stageType: 'build', status: 'idle' } },
      { id: 'eval-1', type: 'pipelineStage', position: { x: 730, y: 150 }, data: { label: 'Evaluate', stageType: 'test', status: 'idle' } },
      { id: 'checkpoint-1', type: 'checkpoint', position: { x: 900, y: 150 }, data: { label: 'Quality Gate', stageType: 'checkpoint', status: 'checkpoint' } },
      { id: 'deploy-1', type: 'pipelineStage', position: { x: 1070, y: 150 }, data: { label: 'Shadow Deploy', stageType: 'deploy', status: 'idle' } },
      { id: 'ab-1', type: 'pipelineStage', position: { x: 1240, y: 150 }, data: { label: 'A/B Test', stageType: 'test', status: 'idle' } },
      { id: 'approve-1', type: 'approvalGate', position: { x: 1410, y: 150 }, data: { label: 'Promote Model', stageType: 'approval', status: 'idle' } },
      { id: 'deploy-prod', type: 'pipelineStage', position: { x: 1580, y: 150 }, data: { label: 'Production', stageType: 'deploy', status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'drift-1' },
      { id: 'e2', source: 'drift-1', target: 'data-1' },
      { id: 'e3', source: 'data-1', target: 'train-1' },
      { id: 'e4', source: 'train-1', target: 'eval-1' },
      { id: 'e5', source: 'eval-1', target: 'checkpoint-1' },
      { id: 'e6', source: 'checkpoint-1', target: 'deploy-1' },
      { id: 'e7', source: 'deploy-1', target: 'ab-1' },
      { id: 'e8', source: 'ab-1', target: 'approve-1' },
      { id: 'e9', source: 'approve-1', target: 'deploy-prod' },
    ],
  },
  // LLMOps Templates
  {
    id: 'llmops-finetuning',
    name: 'LLM Fine-Tuning Pipeline',
    description: 'Fine-tune foundation models with custom datasets and RLHF',
    category: 'llmops',
    stages: 9,
    popularity: 4.9,
    lastUpdated: '1 day ago',
    tags: ['OpenAI', 'RLHF', 'LoRA'],
    nodes: [
      { id: 'data-1', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Dataset Prep', stageType: 'source', status: 'idle' } },
      { id: 'validate-1', type: 'pipelineStage', position: { x: 220, y: 150 }, data: { label: 'Data Quality', stageType: 'test', status: 'idle' } },
      { id: 'tokenize-1', type: 'pipelineStage', position: { x: 390, y: 150 }, data: { label: 'Tokenization', stageType: 'build', status: 'idle' } },
      { id: 'train-1', type: 'pipelineStage', position: { x: 560, y: 150 }, data: { label: 'Fine-Tune', stageType: 'build', status: 'idle', description: 'A100 GPUs' } },
      { id: 'eval-1', type: 'pipelineStage', position: { x: 730, y: 150 }, data: { label: 'Benchmark', stageType: 'test', status: 'idle' } },
      { id: 'rlhf-1', type: 'pipelineStage', position: { x: 900, y: 150 }, data: { label: 'RLHF', stageType: 'build', status: 'idle' } },
      { id: 'safety-1', type: 'pipelineStage', position: { x: 1070, y: 150 }, data: { label: 'Safety Checks', stageType: 'security', status: 'idle' } },
      { id: 'approve-1', type: 'approvalGate', position: { x: 1240, y: 150 }, data: { label: 'Model Review', stageType: 'approval', status: 'idle' } },
      { id: 'deploy-1', type: 'pipelineStage', position: { x: 1410, y: 150 }, data: { label: 'Deploy API', stageType: 'deploy', status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'data-1', target: 'validate-1' },
      { id: 'e2', source: 'validate-1', target: 'tokenize-1' },
      { id: 'e3', source: 'tokenize-1', target: 'train-1' },
      { id: 'e4', source: 'train-1', target: 'eval-1' },
      { id: 'e5', source: 'eval-1', target: 'rlhf-1' },
      { id: 'e6', source: 'rlhf-1', target: 'safety-1' },
      { id: 'e7', source: 'safety-1', target: 'approve-1' },
      { id: 'e8', source: 'approve-1', target: 'deploy-1' },
    ],
  },
  {
    id: 'llmops-rag',
    name: 'RAG Pipeline',
    description: 'Retrieval-Augmented Generation with vector embeddings and knowledge base',
    category: 'llmops',
    stages: 8,
    popularity: 4.8,
    lastUpdated: '3 days ago',
    tags: ['RAG', 'Embeddings', 'Vector DB'],
    nodes: [
      { id: 'docs-1', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Doc Ingestion', stageType: 'source', status: 'idle' } },
      { id: 'chunk-1', type: 'pipelineStage', position: { x: 220, y: 150 }, data: { label: 'Chunking', stageType: 'build', status: 'idle' } },
      { id: 'embed-1', type: 'pipelineStage', position: { x: 390, y: 150 }, data: { label: 'Embeddings', stageType: 'build', status: 'idle' } },
      { id: 'index-1', type: 'pipelineStage', position: { x: 560, y: 150 }, data: { label: 'Vector Index', stageType: 'deploy', status: 'idle' } },
      { id: 'test-1', type: 'pipelineStage', position: { x: 730, y: 150 }, data: { label: 'Retrieval Test', stageType: 'test', status: 'idle' } },
      { id: 'checkpoint-1', type: 'checkpoint', position: { x: 900, y: 150 }, data: { label: 'Quality Check', stageType: 'checkpoint', status: 'checkpoint' } },
      { id: 'deploy-1', type: 'pipelineStage', position: { x: 1070, y: 150 }, data: { label: 'Deploy RAG', stageType: 'deploy', status: 'idle' } },
      { id: 'monitor-1', type: 'pipelineStage', position: { x: 1240, y: 150 }, data: { label: 'Monitoring', stageType: 'test', status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'docs-1', target: 'chunk-1' },
      { id: 'e2', source: 'chunk-1', target: 'embed-1' },
      { id: 'e3', source: 'embed-1', target: 'index-1' },
      { id: 'e4', source: 'index-1', target: 'test-1' },
      { id: 'e5', source: 'test-1', target: 'checkpoint-1' },
      { id: 'e6', source: 'checkpoint-1', target: 'deploy-1' },
      { id: 'e7', source: 'deploy-1', target: 'monitor-1' },
    ],
  },
  {
    id: 'llmops-agents',
    name: 'AI Agents Pipeline',
    description: 'Deploy autonomous AI agents with tool integration and guardrails',
    category: 'llmops',
    stages: 10,
    popularity: 4.7,
    lastUpdated: '2 days ago',
    tags: ['Agents', 'Tools', 'Guardrails'],
    nodes: [
      { id: 'config-1', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Agent Config', stageType: 'source', status: 'idle' } },
      { id: 'tools-1', type: 'pipelineStage', position: { x: 220, y: 150 }, data: { label: 'Tool Setup', stageType: 'build', status: 'idle' } },
      { id: 'prompt-1', type: 'pipelineStage', position: { x: 390, y: 150 }, data: { label: 'Prompt Eng', stageType: 'build', status: 'idle' } },
      { id: 'guard-1', type: 'pipelineStage', position: { x: 560, y: 150 }, data: { label: 'Guardrails', stageType: 'security', status: 'idle' } },
      { id: 'test-1', type: 'pipelineStage', position: { x: 730, y: 150 }, data: { label: 'Scenario Tests', stageType: 'test', status: 'idle' } },
      { id: 'stress-1', type: 'pipelineStage', position: { x: 900, y: 150 }, data: { label: 'Stress Test', stageType: 'test', status: 'idle' } },
      { id: 'checkpoint-1', type: 'checkpoint', position: { x: 1070, y: 150 }, data: { label: 'Safety Gate', stageType: 'checkpoint', status: 'checkpoint' } },
      { id: 'approve-1', type: 'approvalGate', position: { x: 1240, y: 150 }, data: { label: 'Deploy Approval', stageType: 'approval', status: 'idle' } },
      { id: 'deploy-1', type: 'pipelineStage', position: { x: 1410, y: 150 }, data: { label: 'Deploy Agent', stageType: 'deploy', status: 'idle' } },
      { id: 'observe-1', type: 'pipelineStage', position: { x: 1580, y: 150 }, data: { label: 'Observability', stageType: 'test', status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'config-1', target: 'tools-1' },
      { id: 'e2', source: 'tools-1', target: 'prompt-1' },
      { id: 'e3', source: 'prompt-1', target: 'guard-1' },
      { id: 'e4', source: 'guard-1', target: 'test-1' },
      { id: 'e5', source: 'test-1', target: 'stress-1' },
      { id: 'e6', source: 'stress-1', target: 'checkpoint-1' },
      { id: 'e7', source: 'checkpoint-1', target: 'approve-1' },
      { id: 'e8', source: 'approve-1', target: 'deploy-1' },
      { id: 'e9', source: 'deploy-1', target: 'observe-1' },
    ],
  },
];

const categoryIcons = {
  cicd: GitBranch,
  mlops: Brain,
  llmops: Box,
};

const categoryLabels = {
  cicd: 'CI/CD',
  mlops: 'MLOps',
  llmops: 'LLMOps',
};

interface PipelineTemplatesLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (nodes: Node[], edges: Edge[]) => void;
}

const PipelineTemplatesLibrary = ({ isOpen, onClose, onSelectTemplate }: PipelineTemplatesLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cicd' | 'mlops' | 'llmops'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<PipelineTemplate | null>(null);

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: PipelineTemplate) => {
    onSelectTemplate(template.nodes, template.edges);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="w-full max-w-5xl max-h-[85vh] bg-card border border-border rounded-xl shadow-xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-ai-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-ai-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Pipeline Templates</h2>
                  <p className="text-xs text-muted-foreground">Pre-built templates for CI/CD, MLOps, and LLMOps</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search & Filters */}
            <div className="p-4 border-b border-border space-y-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
                <TabsList className="grid grid-cols-4 w-full max-w-md">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="cicd" className="gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" />
                    CI/CD
                  </TabsTrigger>
                  <TabsTrigger value="mlops" className="gap-1.5">
                    <Brain className="w-3.5 h-3.5" />
                    MLOps
                  </TabsTrigger>
                  <TabsTrigger value="llmops" className="gap-1.5">
                    <Box className="w-3.5 h-3.5" />
                    LLMOps
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Templates Grid */}
            <ScrollArea className="flex-1">
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => {
                  const CategoryIcon = categoryIcons[template.category];
                  const isSelected = selectedTemplate?.id === template.id;

                  return (
                    <motion.div
                      key={template.id}
                      whileHover={{ scale: 1.01 }}
                      className={cn(
                        'group p-4 rounded-lg border transition-all cursor-pointer',
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50 bg-card hover:bg-secondary/30'
                      )}
                      onClick={() => setSelectedTemplate(isSelected ? null : template)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            template.category === 'cicd' && 'bg-node-running/20 text-node-running',
                            template.category === 'mlops' && 'bg-ai-secondary/20 text-ai-secondary',
                            template.category === 'llmops' && 'bg-ai-primary/20 text-ai-primary'
                          )}>
                            <CategoryIcon className="w-4 h-4" />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {categoryLabels[template.category]}
                          </Badge>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>

                      <h3 className="font-semibold text-foreground mb-1">{template.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{template.description}</p>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-node-warning" />
                            {template.popularity}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {template.stages} stages
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {template.lastUpdated}
                        </span>
                      </div>

                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 pt-3 border-t border-border"
                        >
                          <Button 
                            className="w-full gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUseTemplate(template);
                            }}
                          >
                            Use This Template
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between shrink-0">
              <p className="text-xs text-muted-foreground">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
              </p>
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PipelineTemplatesLibrary;
