import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, GitBranch, Brain, Box, Sparkles, Star, Clock,
  Users, ArrowRight, Filter, Layers, Zap, Shield, Check,
  Plus, Upload, Download, Server, Database, Cloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Node, Edge } from '@xyflow/react';

interface PipelineTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  stages: number;
  popularity: number;
  tags: string[];
  nodes: Node[];
  edges: Edge[];
  is_public: boolean;
  created_at: string;
}

// Default templates for first-time users
const defaultTemplates: PipelineTemplate[] = [
  {
    id: 'default-cicd-basic',
    name: 'Basic CI/CD Pipeline',
    description: 'Standard build, test, and deploy pipeline for web applications',
    category: 'cicd',
    stages: 5,
    popularity: 4.8,
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
    is_public: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-cicd-multi-env',
    name: 'Multi-Environment Pipeline',
    description: 'Deploy to staging, pre-prod, and production with approval gates',
    category: 'cicd',
    stages: 9,
    popularity: 4.9,
    tags: ['Enterprise', 'Multi-Cloud', 'Blue-Green'],
    nodes: [
      { id: 'src-1', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Checkout', stageType: 'source', status: 'idle' } },
      { id: 'build-1', type: 'pipelineStage', position: { x: 200, y: 150 }, data: { label: 'Build', stageType: 'build', status: 'idle' } },
      { id: 'test-1', type: 'pipelineStage', position: { x: 350, y: 150 }, data: { label: 'Test Suite', stageType: 'test', status: 'idle' } },
      { id: 'deploy-stg', type: 'pipelineStage', position: { x: 500, y: 150 }, data: { label: 'Deploy Staging', stageType: 'deploy', status: 'idle' } },
      { id: 'approve-1', type: 'approvalGate', position: { x: 650, y: 150 }, data: { label: 'QA Approval', stageType: 'approval', status: 'idle' } },
      { id: 'deploy-preprod', type: 'pipelineStage', position: { x: 800, y: 150 }, data: { label: 'Deploy Pre-Prod', stageType: 'deploy', status: 'idle' } },
      { id: 'approve-2', type: 'approvalGate', position: { x: 950, y: 150 }, data: { label: 'Prod Approval', stageType: 'approval', status: 'idle' } },
      { id: 'checkpoint-1', type: 'checkpoint', position: { x: 1100, y: 150 }, data: { label: 'Pre-Deploy Check', stageType: 'checkpoint', status: 'checkpoint' } },
      { id: 'deploy-prod', type: 'pipelineStage', position: { x: 1250, y: 150 }, data: { label: 'Deploy Prod', stageType: 'deploy', status: 'idle' } },
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
    is_public: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-mlops-training',
    name: 'ML Model Training Pipeline',
    description: 'End-to-end ML training with data validation, training, and model registry',
    category: 'mlops',
    stages: 8,
    popularity: 4.6,
    tags: ['PyTorch', 'MLflow', 'Data Validation'],
    nodes: [
      { id: 'data-1', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Data Ingestion', stageType: 'source', status: 'idle' } },
      { id: 'validate-1', type: 'pipelineStage', position: { x: 200, y: 150 }, data: { label: 'Data Validation', stageType: 'test', status: 'idle' } },
      { id: 'transform-1', type: 'pipelineStage', position: { x: 350, y: 150 }, data: { label: 'Feature Transform', stageType: 'build', status: 'idle' } },
      { id: 'train-1', type: 'pipelineStage', position: { x: 500, y: 150 }, data: { label: 'Model Training', stageType: 'build', status: 'idle' } },
      { id: 'eval-1', type: 'pipelineStage', position: { x: 650, y: 150 }, data: { label: 'Model Evaluation', stageType: 'test', status: 'idle' } },
      { id: 'approve-1', type: 'approvalGate', position: { x: 800, y: 150 }, data: { label: 'Model Approval', stageType: 'approval', status: 'idle' } },
      { id: 'registry-1', type: 'pipelineStage', position: { x: 950, y: 150 }, data: { label: 'Model Registry', stageType: 'deploy', status: 'idle' } },
      { id: 'deploy-1', type: 'pipelineStage', position: { x: 1100, y: 150 }, data: { label: 'Deploy Model', stageType: 'deploy', status: 'idle' } },
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
    is_public: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-llmops-finetuning',
    name: 'LLM Fine-Tuning Pipeline',
    description: 'Fine-tune foundation models with custom datasets and RLHF',
    category: 'llmops',
    stages: 9,
    popularity: 4.9,
    tags: ['OpenAI', 'RLHF', 'LoRA'],
    nodes: [
      { id: 'data-1', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Dataset Prep', stageType: 'source', status: 'idle' } },
      { id: 'validate-1', type: 'pipelineStage', position: { x: 200, y: 150 }, data: { label: 'Data Quality', stageType: 'test', status: 'idle' } },
      { id: 'tokenize-1', type: 'pipelineStage', position: { x: 350, y: 150 }, data: { label: 'Tokenization', stageType: 'build', status: 'idle' } },
      { id: 'train-1', type: 'pipelineStage', position: { x: 500, y: 150 }, data: { label: 'Fine-Tune', stageType: 'build', status: 'idle' } },
      { id: 'eval-1', type: 'pipelineStage', position: { x: 650, y: 150 }, data: { label: 'Benchmark', stageType: 'test', status: 'idle' } },
      { id: 'rlhf-1', type: 'pipelineStage', position: { x: 800, y: 150 }, data: { label: 'RLHF', stageType: 'build', status: 'idle' } },
      { id: 'safety-1', type: 'pipelineStage', position: { x: 950, y: 150 }, data: { label: 'Safety Checks', stageType: 'security', status: 'idle' } },
      { id: 'approve-1', type: 'approvalGate', position: { x: 1100, y: 150 }, data: { label: 'Model Review', stageType: 'approval', status: 'idle' } },
      { id: 'deploy-1', type: 'pipelineStage', position: { x: 1250, y: 150 }, data: { label: 'Deploy API', stageType: 'deploy', status: 'idle' } },
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
    is_public: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-llmops-rag',
    name: 'RAG Pipeline',
    description: 'Retrieval-Augmented Generation with vector embeddings',
    category: 'llmops',
    stages: 7,
    popularity: 4.8,
    tags: ['RAG', 'Embeddings', 'Vector DB'],
    nodes: [
      { id: 'docs-1', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Doc Ingestion', stageType: 'source', status: 'idle' } },
      { id: 'chunk-1', type: 'pipelineStage', position: { x: 200, y: 150 }, data: { label: 'Chunking', stageType: 'build', status: 'idle' } },
      { id: 'embed-1', type: 'pipelineStage', position: { x: 350, y: 150 }, data: { label: 'Embeddings', stageType: 'build', status: 'idle' } },
      { id: 'index-1', type: 'pipelineStage', position: { x: 500, y: 150 }, data: { label: 'Vector Index', stageType: 'deploy', status: 'idle' } },
      { id: 'test-1', type: 'pipelineStage', position: { x: 650, y: 150 }, data: { label: 'Retrieval Test', stageType: 'test', status: 'idle' } },
      { id: 'deploy-1', type: 'pipelineStage', position: { x: 800, y: 150 }, data: { label: 'Deploy RAG', stageType: 'deploy', status: 'idle' } },
      { id: 'monitor-1', type: 'pipelineStage', position: { x: 950, y: 150 }, data: { label: 'Monitoring', stageType: 'test', status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'docs-1', target: 'chunk-1' },
      { id: 'e2', source: 'chunk-1', target: 'embed-1' },
      { id: 'e3', source: 'embed-1', target: 'index-1' },
      { id: 'e4', source: 'index-1', target: 'test-1' },
      { id: 'e5', source: 'test-1', target: 'deploy-1' },
      { id: 'e6', source: 'deploy-1', target: 'monitor-1' },
    ],
    is_public: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-infra-terraform',
    name: 'Infrastructure as Code',
    description: 'Terraform-based infrastructure provisioning with drift detection',
    category: 'infrastructure',
    stages: 6,
    popularity: 4.7,
    tags: ['Terraform', 'AWS', 'GitOps'],
    nodes: [
      { id: 'plan-1', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Terraform Plan', stageType: 'source', status: 'idle' } },
      { id: 'validate-1', type: 'pipelineStage', position: { x: 200, y: 150 }, data: { label: 'Validate', stageType: 'test', status: 'idle' } },
      { id: 'security-1', type: 'pipelineStage', position: { x: 350, y: 150 }, data: { label: 'Security Scan', stageType: 'security', status: 'idle' } },
      { id: 'approve-1', type: 'approvalGate', position: { x: 500, y: 150 }, data: { label: 'Apply Approval', stageType: 'approval', status: 'idle' } },
      { id: 'apply-1', type: 'pipelineStage', position: { x: 650, y: 150 }, data: { label: 'Terraform Apply', stageType: 'deploy', status: 'idle' } },
      { id: 'verify-1', type: 'pipelineStage', position: { x: 800, y: 150 }, data: { label: 'Verify State', stageType: 'test', status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'plan-1', target: 'validate-1' },
      { id: 'e2', source: 'validate-1', target: 'security-1' },
      { id: 'e3', source: 'security-1', target: 'approve-1' },
      { id: 'e4', source: 'approve-1', target: 'apply-1' },
      { id: 'e5', source: 'apply-1', target: 'verify-1' },
    ],
    is_public: true,
    created_at: new Date().toISOString(),
  },
];

const categoryConfig = {
  cicd: { icon: GitBranch, label: 'CI/CD', color: 'from-blue-500 to-cyan-500' },
  mlops: { icon: Brain, label: 'MLOps', color: 'from-purple-500 to-pink-500' },
  llmops: { icon: Sparkles, label: 'LLMOps', color: 'from-amber-500 to-orange-500' },
  infrastructure: { icon: Server, label: 'Infrastructure', color: 'from-emerald-500 to-teal-500' },
  security: { icon: Shield, label: 'Security', color: 'from-red-500 to-rose-500' },
};

interface PipelineTemplatesGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (nodes: Node[], edges: Edge[]) => void;
}

export const PipelineTemplatesGallery = ({ isOpen, onClose, onSelectTemplate }: PipelineTemplatesGalleryProps) => {
  const [templates, setTemplates] = useState<PipelineTemplate[]>(defaultTemplates);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<PipelineTemplate | null>(null);

  // Fetch templates from database
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('pipeline_templates')
          .select('*')
          .eq('is_public', true)
          .order('popularity', { ascending: false });

        if (error) throw error;

        // Merge with default templates, preferring DB templates
        const dbTemplates = (data || []).map((t: any) => ({
          ...t,
          nodes: t.nodes as Node[],
          edges: t.edges as Edge[],
        }));

        const merged = [...dbTemplates, ...defaultTemplates.filter(
          dt => !dbTemplates.some((dbt: PipelineTemplate) => dbt.name === dt.name)
        )];

        setTemplates(merged);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
        // Fall back to default templates
        setTemplates(defaultTemplates);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate.nodes, selectedTemplate.edges);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card border border-border rounded-xl shadow-2xl w-[95vw] max-w-6xl h-[85vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-2xl font-bold">Pipeline Templates Gallery</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a template to get started or create from scratch
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="p-4 border-b border-border flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                {Object.entries(categoryConfig).map(([key, { icon: Icon, label }]) => (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Templates Grid */}
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Layers className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No templates found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => {
                    const config = categoryConfig[template.category as keyof typeof categoryConfig] || categoryConfig.cicd;
                    const Icon = config.icon;
                    const isSelected = selectedTemplate?.id === template.id;

                    return (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={cn(
                            'cursor-pointer transition-all duration-200 h-full',
                            isSelected 
                              ? 'ring-2 ring-primary border-primary' 
                              : 'hover:border-primary/50'
                          )}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className={cn(
                                'p-2 rounded-lg bg-gradient-to-br',
                                config.color
                              )}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              {isSelected && (
                                <div className="p-1 rounded-full bg-primary">
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                </div>
                              )}
                            </div>
                            <CardTitle className="text-base mt-3">{template.name}</CardTitle>
                            <CardDescription className="text-xs line-clamp-2">
                              {template.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Layers className="h-3 w-3" />
                                {template.stages} stages
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-amber-500" />
                                {template.popularity}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {template.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {tag}
                                </Badge>
                              ))}
                              {template.tags.length > 3 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  +{template.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Preview Panel */}
            <AnimatePresence mode="wait">
              {selectedTemplate && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 350, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="border-l border-border bg-muted/30 overflow-hidden"
                >
                  <div className="p-4 h-full flex flex-col">
                    <h3 className="font-semibold text-lg">{selectedTemplate.name}</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedTemplate.description}
                    </p>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedTemplate.stages} pipeline stages</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span>{selectedTemplate.popularity} rating</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Pipeline Stages</h4>
                      <div className="space-y-2">
                        {selectedTemplate.nodes.slice(0, 6).map((node, idx) => (
                          <div
                            key={node.id}
                            className="flex items-center gap-2 p-2 rounded bg-background border border-border text-xs"
                          >
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-medium">
                              {idx + 1}
                            </span>
                            <span>{node.data?.label as string}</span>
                            <Badge variant="outline" className="ml-auto text-[10px]">
                              {node.data?.stageType as string}
                            </Badge>
                          </div>
                        ))}
                        {selectedTemplate.nodes.length > 6 && (
                          <div className="text-xs text-muted-foreground text-center py-1">
                            +{selectedTemplate.nodes.length - 6} more stages
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 space-y-2">
                      <Button className="w-full" onClick={handleUseTemplate}>
                        <Zap className="h-4 w-4 mr-2" />
                        Use This Template
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => setSelectedTemplate(null)}>
                        Choose Different
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PipelineTemplatesGallery;
