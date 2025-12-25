import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github,
  Cloud,
  Shield,
  Key,
  Database,
  Box,
  Plus,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  Settings2,
  Trash2,
  Edit,
  Eye,
  Clock,
  Loader2,
  ChevronRight,
  Server,
  Globe,
  Lock,
  Plug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================
// 🔌 CONNECTIONS HUB - Enterprise Integrations
// ============================================

type ConnectionType = 'github' | 'azure' | 'aws' | 'gcp' | 'vault' | 'registry' | 'kubernetes';

interface Connection {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'error' | 'validating' | 'pending';
  config: Record<string, any>;
  last_validated_at: string | null;
  validation_message: string | null;
  created_at: string;
}

const CONNECTION_TYPES = [
  { 
    id: 'github', 
    label: 'GitHub', 
    icon: Github, 
    description: 'Repository & Actions integration',
    color: 'bg-foreground',
    category: 'source',
  },
  { 
    id: 'azure', 
    label: 'Azure', 
    icon: Cloud, 
    description: 'AKS, ACR, Key Vault',
    color: 'bg-blue-500',
    category: 'cloud',
  },
  { 
    id: 'aws', 
    label: 'AWS', 
    icon: Cloud, 
    description: 'EKS, ECR, Secrets Manager',
    color: 'bg-orange-500',
    category: 'cloud',
  },
  { 
    id: 'gcp', 
    label: 'Google Cloud', 
    icon: Cloud, 
    description: 'GKE, Artifact Registry',
    color: 'bg-red-500',
    category: 'cloud',
  },
  { 
    id: 'vault', 
    label: 'HashiCorp Vault', 
    icon: Shield, 
    description: 'Secrets management',
    color: 'bg-yellow-500',
    category: 'security',
  },
  { 
    id: 'registry', 
    label: 'Container Registry', 
    icon: Box, 
    description: 'Docker Hub, GHCR, ACR, ECR',
    color: 'bg-primary',
    category: 'artifacts',
  },
  { 
    id: 'kubernetes', 
    label: 'Kubernetes', 
    icon: Server, 
    description: 'Direct cluster connection',
    color: 'bg-blue-600',
    category: 'runtime',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Connections' },
  { id: 'source', label: 'Source Control' },
  { id: 'cloud', label: 'Cloud Providers' },
  { id: 'security', label: 'Security & Secrets' },
  { id: 'artifacts', label: 'Artifacts' },
  { id: 'runtime', label: 'Runtime' },
];

export function ConnectionsHubPanel() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [connectionName, setConnectionName] = useState('');
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections((data || []).map(c => ({
        ...c,
        status: (c.status as Connection['status']) || 'pending',
      })));
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (connectionId: string) => {
    setValidatingId(connectionId);
    try {
      await supabase
        .from('connections')
        .update({ 
          status: 'validating',
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      // Simulate validation
      await new Promise(resolve => setTimeout(resolve, 2000));

      await supabase
        .from('connections')
        .update({ 
          status: 'connected',
          last_validated_at: new Date().toISOString(),
          validation_message: null,
        })
        .eq('id', connectionId);

      toast.success('Connection validated successfully');
      fetchConnections();
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Validation failed');
    } finally {
      setValidatingId(null);
    }
  };

  const handleAddConnection = async () => {
    if (!selectedType || !connectionName) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('connections')
        .insert({
          name: connectionName,
          type: selectedType,
          status: 'pending',
          user_id: user?.id,
          config: {},
        });

      if (error) throw error;

      toast.success('Connection added successfully');
      setAddDialogOpen(false);
      setSelectedType(null);
      setConnectionName('');
      fetchConnections();
    } catch (error) {
      console.error('Error adding connection:', error);
      toast.error('Failed to add connection');
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      toast.success('Connection deleted');
      setSelectedConnection(null);
      fetchConnections();
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast.error('Failed to delete connection');
    }
  };

  const filteredConnections = selectedCategory === 'all' 
    ? connections 
    : connections.filter(c => {
        const typeConfig = CONNECTION_TYPES.find(t => t.id === c.type);
        return typeConfig?.category === selectedCategory;
      });

  const getTypeConfig = (type: string) => CONNECTION_TYPES.find(t => t.id === type) || CONNECTION_TYPES[0];

  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const connectedCount = connections.filter(c => c.status === 'connected').length;
  const healthPercentage = connections.length > 0 ? Math.round((connectedCount / connections.length) * 100) : 100;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border px-6 py-4 bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plug className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Connections Hub</h1>
              <p className="text-xs text-muted-foreground">Manage integrations and connectors</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
              <span className={cn(
                'w-2 h-2 rounded-full',
                healthPercentage === 100 ? 'bg-sec-safe' : healthPercentage >= 50 ? 'bg-sec-warning' : 'bg-sec-danger'
              )} />
              <span className="text-xs text-muted-foreground">{connectedCount}/{connections.length} healthy</span>
            </div>
            <Button variant="outline" size="sm" onClick={fetchConnections} className="gap-2">
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Connection
            </Button>
          </div>
        </div>

        {/* Health Bar */}
        <div className="mt-4 flex items-center gap-4">
          <Progress value={healthPercentage} className="h-2 flex-1" />
          <span className="text-xs font-medium">{healthPercentage}% healthy</span>
        </div>
      </header>

      {/* Category Filter */}
      <div className="flex-shrink-0 border-b border-border bg-card/30 px-6 py-3">
        <div className="flex items-center gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="text-xs"
            >
              {cat.label}
              {cat.id !== 'all' && (
                <Badge variant="secondary" className="ml-1.5 text-[10px]">
                  {connections.filter(c => {
                    const typeConfig = CONNECTION_TYPES.find(t => t.id === c.type);
                    return typeConfig?.category === cat.id;
                  }).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConnections.length === 0 ? (
              <div className="text-center py-12">
                <Plug className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No connections found</p>
                <Button variant="link" size="sm" onClick={() => setAddDialogOpen(true)}>
                  Add your first connection
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredConnections.map((connection) => {
                  const typeConfig = getTypeConfig(connection.type);
                  const Icon = typeConfig.icon;
                  const isValidating = validatingId === connection.id;

                  return (
                    <motion.div
                      key={connection.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card 
                        className={cn(
                          'cursor-pointer hover:shadow-lg transition-all',
                          connection.status === 'connected' && 'border-sec-safe/30',
                          connection.status === 'error' && 'border-sec-danger/30',
                          selectedConnection?.id === connection.id && 'ring-2 ring-primary'
                        )}
                        onClick={() => setSelectedConnection(connection)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                typeConfig.color
                              )}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{connection.name}</p>
                                <p className="text-xs text-muted-foreground">{typeConfig.label}</p>
                              </div>
                            </div>
                            <StatusBadge status={connection.status} isValidating={isValidating} />
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Validated {formatTime(connection.last_validated_at)}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleValidate(connection.id);
                              }}
                              disabled={isValidating}
                              className="h-7 text-xs"
                            >
                              {isValidating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                            </Button>
                          </div>

                          {connection.validation_message && connection.status === 'error' && (
                            <div className="mt-3 p-2 rounded bg-sec-danger/10 border border-sec-danger/20">
                              <p className="text-xs text-sec-danger">{connection.validation_message}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Details Panel */}
        <AnimatePresence>
          {selectedConnection && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border bg-card flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold">Connection Details</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedConnection(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const typeConfig = getTypeConfig(selectedConnection.type);
                      const Icon = typeConfig.icon;
                      return (
                        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', typeConfig.color)}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      );
                    })()}
                    <div>
                      <p className="font-medium text-foreground">{selectedConnection.name}</p>
                      <StatusBadge status={selectedConnection.status} />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <p className="text-sm">{getTypeConfig(selectedConnection.type).label}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Created</Label>
                      <p className="text-sm">{new Date(selectedConnection.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Validated</Label>
                      <p className="text-sm">{selectedConnection.last_validated_at ? new Date(selectedConnection.last_validated_at).toLocaleString() : 'Never'}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <Settings2 className="w-4 h-4" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <Eye className="w-4 h-4" />
                      View Logs
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start gap-2 text-sec-danger hover:text-sec-danger"
                      onClick={() => handleDeleteConnection(selectedConnection.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Add Connection Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Connection</DialogTitle>
            <DialogDescription>Connect a new service or platform</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Connection Name</Label>
              <Input
                placeholder="e.g., Production GitHub"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Connection Type</Label>
              <div className="grid grid-cols-3 gap-3">
                {CONNECTION_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.id;

                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={cn(
                        'p-4 rounded-lg border text-left transition-all hover:shadow-md',
                        isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', type.color)}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddConnection} disabled={!selectedType || !connectionName}>
              Add Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status, isValidating }: { status: string; isValidating?: boolean }) {
  if (isValidating) {
    return (
      <Badge className="bg-primary/20 text-primary border-0 gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Validating
      </Badge>
    );
  }

  switch (status) {
    case 'connected':
      return (
        <Badge className="bg-sec-safe/20 text-sec-safe border-0 gap-1">
          <Check className="w-3 h-3" />
          Connected
        </Badge>
      );
    case 'error':
      return (
        <Badge className="bg-sec-danger/20 text-sec-danger border-0 gap-1">
          <X className="w-3 h-3" />
          Error
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-sec-warning/20 text-sec-warning border-0 gap-1">
          <AlertTriangle className="w-3 h-3" />
          Pending
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="w-3 h-3" />
          Unknown
        </Badge>
      );
  }
}

export default ConnectionsHubPanel;
