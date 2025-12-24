import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Plus,
  Settings,
  GitBranch,
  Package,
  Shield,
  Clock,
  CheckCircle2,
  Loader2,
  Trash2,
  GripVertical,
  ArrowRight,
  AlertTriangle,
  X,
  Link2,
  Github,
  Cloud,
  Container,
  Radio
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useConnectionsRealtime, Connection } from '@/hooks/useConnectionsRealtime';

interface ExecutionNode {
  id: string;
  type: 'source' | 'build' | 'test' | 'security' | 'deploy' | 'approval' | 'custom';
  label: string;
  connectionId?: string;
  config: Record<string, unknown>;
}

interface EnvironmentConfig {
  id: string;
  name: string;
  environment: string;
}

const NODE_TYPES = [
  { type: 'source', label: 'Source', icon: Github, description: 'Clone repository' },
  { type: 'build', label: 'Build', icon: Package, description: 'Build artifacts' },
  { type: 'test', label: 'Test', icon: CheckCircle2, description: 'Run tests' },
  { type: 'security', label: 'Security', icon: Shield, description: 'Security scan' },
  { type: 'deploy', label: 'Deploy', icon: Cloud, description: 'Deploy to environment' },
  { type: 'approval', label: 'Approval', icon: Clock, description: 'Manual approval gate' },
] as const;

const ExecutionBuilderPanel = () => {
  const { connections } = useConnectionsRealtime();
  const [environments, setEnvironments] = useState<EnvironmentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Execution config
  const [executionName, setExecutionName] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('development');
  const [branch, setBranch] = useState('main');
  const [nodes, setNodes] = useState<ExecutionNode[]>([]);
  const [requireApproval, setRequireApproval] = useState(false);
  
  // Drag state
  const [draggedNodeType, setDraggedNodeType] = useState<typeof NODE_TYPES[number] | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Fetch environments
  useEffect(() => {
    const fetchEnvironments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('environment_configs')
          .select('id, name, environment')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setEnvironments(data || []);
      } catch (err) {
        console.error('[ExecutionBuilder] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnvironments();
  }, []);

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'github': return Github;
      case 'azure':
      case 'kubernetes': return Cloud;
      case 'vault': return Shield;
      case 'registry': return Container;
      case 'otel': return Radio;
      default: return Link2;
    }
  };

  const addNode = (nodeType: typeof NODE_TYPES[number], atIndex?: number) => {
    const newNode: ExecutionNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: nodeType.type as ExecutionNode['type'],
      label: nodeType.label,
      config: {}
    };

    if (atIndex !== undefined) {
      const newNodes = [...nodes];
      newNodes.splice(atIndex, 0, newNode);
      setNodes(newNodes);
    } else {
      setNodes([...nodes, newNode]);
    }
  };

  const removeNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
  };

  const updateNode = (nodeId: string, updates: Partial<ExecutionNode>) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  };

  const moveNode = (fromIndex: number, toIndex: number) => {
    const newNodes = [...nodes];
    const [moved] = newNodes.splice(fromIndex, 1);
    newNodes.splice(toIndex, 0, moved);
    setNodes(newNodes);
  };

  const handleDragStart = (nodeType: typeof NODE_TYPES[number]) => {
    setDraggedNodeType(nodeType);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedNodeType) {
      addNode(draggedNodeType, index);
    }
    setDraggedNodeType(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedNodeType(null);
    setDragOverIndex(null);
  };

  const handleCreateExecution = async () => {
    if (!executionName.trim()) {
      toast.error('Execution name is required');
      return;
    }

    if (nodes.length === 0) {
      toast.error('Add at least one step to the execution');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('pipeline-execute', {
        body: {
          name: executionName,
          environment: selectedEnv,
          branch: branch,
          nodes: nodes.map(n => ({
            id: n.id,
            type: n.type,
            label: n.label,
            connectionId: n.connectionId,
            config: n.config
          })),
          requireApproval,
        }
      });

      if (error) throw error;

      toast.success('Execution started successfully');
      
      // Reset form
      setExecutionName('');
      setNodes([]);
      setBranch('main');
      setRequireApproval(false);
    } catch (err: any) {
      console.error('[ExecutionBuilder] Create error:', err);
      toast.error(err.message || 'Failed to create execution');
    } finally {
      setCreating(false);
    }
  };

  const validConnections = connections.filter(c => c.status === 'connected' && !c.blocked);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Execution Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and configure pipeline executions with drag-and-drop
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Node Toolbox */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Available Steps</CardTitle>
              <CardDescription className="text-xs">
                Drag steps to build your pipeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {NODE_TYPES.map((nodeType) => {
                const Icon = nodeType.icon;
                return (
                  <div
                    key={nodeType.type}
                    draggable
                    onDragStart={() => handleDragStart(nodeType)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all',
                      'hover:border-primary hover:bg-primary/5',
                      draggedNodeType?.type === nodeType.type && 'opacity-50'
                    )}
                  >
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{nodeType.label}</p>
                      <p className="text-xs text-muted-foreground">{nodeType.description}</p>
                    </div>
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </div>
                );
              })}

              {/* Connected Connections */}
              {validConnections.length > 0 && (
                <>
                  <div className="pt-3 pb-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Available Connections
                    </p>
                  </div>
                  {validConnections.map((conn) => {
                    const Icon = getConnectionIcon(conn.type);
                    return (
                      <div
                        key={conn.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-sec-safe/5 border border-sec-safe/20"
                      >
                        <Icon className="w-4 h-4 text-sec-safe" />
                        <span className="text-sm">{conn.name}</span>
                        <CheckCircle2 className="w-3 h-3 text-sec-safe ml-auto" />
                      </div>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Builder */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Play className="w-4 h-4" />
                Pipeline Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Config */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Execution Name</Label>
                  <Input
                    placeholder="e.g., deploy-frontend-v2.1"
                    value={executionName}
                    onChange={(e) => setExecutionName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input
                    placeholder="main"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Environment</Label>
                  <Select value={selectedEnv} onValueChange={setSelectedEnv}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      {environments.length > 0 ? (
                        environments.map(env => (
                          <SelectItem key={env.id} value={env.environment}>
                            {env.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between pt-6">
                  <div className="space-y-0.5">
                    <Label>Require Approval</Label>
                    <p className="text-xs text-muted-foreground">Add approval gate</p>
                  </div>
                  <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
                </div>
              </div>

              {/* Pipeline Steps */}
              <div className="space-y-2">
                <Label>Pipeline Steps</Label>
                <div 
                  className={cn(
                    'min-h-[200px] border-2 border-dashed rounded-lg p-4 transition-colors',
                    nodes.length === 0 && 'flex items-center justify-center',
                    draggedNodeType && 'border-primary bg-primary/5'
                  )}
                  onDragOver={(e) => handleDragOver(e, nodes.length)}
                  onDrop={(e) => handleDrop(e, nodes.length)}
                >
                  {nodes.length === 0 ? (
                    <div className="text-center">
                      <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Drag steps here to build your pipeline
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {nodes.map((node, index) => {
                        const nodeType = NODE_TYPES.find(n => n.type === node.type);
                        const Icon = nodeType?.icon || Package;
                        
                        return (
                          <motion.div
                            key={node.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={cn(
                              'relative',
                              dragOverIndex === index && 'pt-10'
                            )}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                          >
                            {dragOverIndex === index && (
                              <div className="absolute top-0 left-0 right-0 h-8 border-2 border-dashed border-primary rounded-lg bg-primary/5" />
                            )}
                            
                            <div className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:shadow-sm transition-shadow">
                              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                              
                              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                                <Icon className="w-4 h-4" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{node.label}</p>
                                <p className="text-xs text-muted-foreground capitalize">{node.type}</p>
                              </div>

                              {/* Connection selector for applicable nodes */}
                              {['source', 'deploy', 'build'].includes(node.type) && validConnections.length > 0 && (
                                <Select 
                                  value={node.connectionId || ''} 
                                  onValueChange={(v) => updateNode(node.id, { connectionId: v || undefined })}
                                >
                                  <SelectTrigger className="w-40 h-8 text-xs">
                                    <SelectValue placeholder="Link connection" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {validConnections.map(conn => (
                                      <SelectItem key={conn.id} value={conn.id}>
                                        {conn.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-sec-critical"
                                onClick={() => removeNode(node.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Arrow to next */}
                            {index < nodes.length - 1 && (
                              <div className="flex justify-center py-1">
                                <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Add Buttons */}
              <div className="flex flex-wrap gap-2">
                {NODE_TYPES.map((nodeType) => {
                  const Icon = nodeType.icon;
                  return (
                    <Button
                      key={nodeType.type}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => addNode(nodeType)}
                    >
                      <Icon className="w-3 h-3" />
                      {nodeType.label}
                    </Button>
                  );
                })}
              </div>

              {/* Validation */}
              {nodes.length > 0 && (
                <Card className={cn(
                  'border-l-4',
                  nodes.some(n => ['source', 'deploy'].includes(n.type) && !n.connectionId && validConnections.length > 0)
                    ? 'border-l-sec-warning bg-sec-warning/5'
                    : 'border-l-sec-safe bg-sec-safe/5'
                )}>
                  <CardContent className="py-3">
                    <div className="flex items-center gap-2">
                      {nodes.some(n => ['source', 'deploy'].includes(n.type) && !n.connectionId && validConnections.length > 0) ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-sec-warning" />
                          <span className="text-sm text-sec-warning">Some steps are missing connection links</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                          <span className="text-sm text-sec-safe">Pipeline configuration is valid</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Create Button */}
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleCreateExecution}
                disabled={creating || !executionName.trim() || nodes.length === 0}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Execution...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Execution
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
};

export default ExecutionBuilderPanel;
