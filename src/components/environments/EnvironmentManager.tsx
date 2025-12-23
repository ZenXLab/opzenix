import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, Eye, EyeOff, Lock, Server, Cloud,
  Settings, Database, Key, Variable, Shield, AlertTriangle,
  CheckCircle2, Copy, Edit2, Save, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Secret {
  id: string;
  key: string;
  value: string;
  masked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EnvVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
}

interface ClusterConfig {
  id: string;
  name: string;
  provider: 'kubernetes' | 'ecs' | 'gke' | 'aks' | 'self-hosted';
  region: string;
  status: 'healthy' | 'degraded' | 'offline';
  nodes: number;
  cpu: number;
  memory: number;
}

interface Environment {
  id: string;
  name: string;
  type: 'development' | 'staging' | 'production';
  secrets: Secret[];
  variables: EnvVariable[];
  cluster: ClusterConfig | null;
  protected: boolean;
  approvalRequired: boolean;
}

const initialEnvironments: Environment[] = [
  {
    id: 'dev',
    name: 'Development',
    type: 'development',
    protected: false,
    approvalRequired: false,
    secrets: [
      { id: 's1', key: 'DATABASE_URL', value: 'postgres://dev:***@localhost:5432/app', masked: true, createdAt: '2024-01-15', updatedAt: '2024-01-20' },
      { id: 's2', key: 'API_KEY', value: 'dev_key_***', masked: true, createdAt: '2024-01-15', updatedAt: '2024-01-18' },
    ],
    variables: [
      { id: 'v1', key: 'LOG_LEVEL', value: 'debug', isSecret: false },
      { id: 'v2', key: 'FEATURE_FLAGS', value: 'all', isSecret: false },
    ],
    cluster: {
      id: 'c1',
      name: 'dev-cluster-01',
      provider: 'kubernetes',
      region: 'us-west-2',
      status: 'healthy',
      nodes: 3,
      cpu: 45,
      memory: 62,
    },
  },
  {
    id: 'staging',
    name: 'Staging',
    type: 'staging',
    protected: false,
    approvalRequired: true,
    secrets: [
      { id: 's3', key: 'DATABASE_URL', value: 'postgres://staging:***@staging-db:5432/app', masked: true, createdAt: '2024-01-15', updatedAt: '2024-01-22' },
      { id: 's4', key: 'API_KEY', value: 'staging_key_***', masked: true, createdAt: '2024-01-15', updatedAt: '2024-01-22' },
    ],
    variables: [
      { id: 'v3', key: 'LOG_LEVEL', value: 'info', isSecret: false },
      { id: 'v4', key: 'FEATURE_FLAGS', value: 'beta', isSecret: false },
    ],
    cluster: {
      id: 'c2',
      name: 'staging-cluster-01',
      provider: 'gke',
      region: 'us-central1',
      status: 'healthy',
      nodes: 5,
      cpu: 58,
      memory: 71,
    },
  },
  {
    id: 'prod',
    name: 'Production',
    type: 'production',
    protected: true,
    approvalRequired: true,
    secrets: [
      { id: 's5', key: 'DATABASE_URL', value: 'postgres://prod:***@prod-db:5432/app', masked: true, createdAt: '2024-01-10', updatedAt: '2024-01-25' },
      { id: 's6', key: 'API_KEY', value: 'prod_key_***', masked: true, createdAt: '2024-01-10', updatedAt: '2024-01-25' },
      { id: 's7', key: 'STRIPE_SECRET', value: 'sk_live_***', masked: true, createdAt: '2024-01-12', updatedAt: '2024-01-25' },
    ],
    variables: [
      { id: 'v5', key: 'LOG_LEVEL', value: 'warn', isSecret: false },
      { id: 'v6', key: 'FEATURE_FLAGS', value: 'stable', isSecret: false },
      { id: 'v7', key: 'REPLICAS', value: '3', isSecret: false },
    ],
    cluster: {
      id: 'c3',
      name: 'prod-cluster-01',
      provider: 'aks',
      region: 'eastus',
      status: 'healthy',
      nodes: 12,
      cpu: 72,
      memory: 68,
    },
  },
];

interface EnvironmentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnvironmentManager = ({ isOpen, onClose }: EnvironmentManagerProps) => {
  const [environments] = useState<Environment[]>(initialEnvironments);
  const [selectedEnv, setSelectedEnv] = useState<Environment>(environments[0]);
  const [showSecretValue, setShowSecretValue] = useState<Record<string, boolean>>({});
  const [editingSecret, setEditingSecret] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('secrets');

  const toggleSecretVisibility = (secretId: string) => {
    setShowSecretValue(prev => ({ ...prev, [secretId]: !prev[secretId] }));
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success('Copied to clipboard');
  };

  const getEnvTypeColor = (type: string) => {
    switch (type) {
      case 'development': return 'bg-node-running/20 text-node-running border-node-running/30';
      case 'staging': return 'bg-sec-warning/20 text-sec-warning border-sec-warning/30';
      case 'production': return 'bg-sec-critical/20 text-sec-critical border-sec-critical/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getClusterStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-runtime-ok';
      case 'degraded': return 'text-runtime-degraded';
      case 'offline': return 'text-sec-critical';
      default: return 'text-muted-foreground';
    }
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
            className="w-full max-w-5xl h-[80vh] bg-card border border-border rounded-lg shadow-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-ai-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Environment Manager</h2>
                  <p className="text-xs text-muted-foreground">Manage secrets, variables, and clusters per environment</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Environment Sidebar */}
              <div className="w-56 border-r border-border p-3 flex flex-col shrink-0">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Environments
                </h3>
                <div className="space-y-1.5 flex-1">
                  {environments.map((env) => (
                    <button
                      key={env.id}
                      onClick={() => setSelectedEnv(env)}
                      className={cn(
                        'w-full flex items-center gap-2 p-2.5 rounded-md text-left transition-all',
                        selectedEnv.id === env.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-secondary/50 border border-transparent'
                      )}
                    >
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        env.type === 'production' ? 'bg-sec-critical' :
                        env.type === 'staging' ? 'bg-sec-warning' : 'bg-node-running'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{env.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {env.secrets.length} secrets • {env.variables.length} vars
                        </p>
                      </div>
                      {env.protected && <Lock className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  ))}
                </div>
                
                <Button variant="outline" size="sm" className="w-full mt-3 gap-1">
                  <Plus className="w-3 h-3" />
                  Add Environment
                </Button>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Env Header */}
                <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded border',
                      getEnvTypeColor(selectedEnv.type)
                    )}>
                      {selectedEnv.type.toUpperCase()}
                    </span>
                    <h3 className="text-lg font-medium text-foreground">{selectedEnv.name}</h3>
                    {selectedEnv.protected && (
                      <span className="flex items-center gap-1 text-xs text-sec-warning">
                        <Shield className="w-3 h-3" />
                        Protected
                      </span>
                    )}
                    {selectedEnv.approvalRequired && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertTriangle className="w-3 h-3" />
                        Approval Required
                      </span>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="mx-4 mt-3 w-fit shrink-0">
                    <TabsTrigger value="secrets" className="gap-1">
                      <Key className="w-3 h-3" />
                      Secrets ({selectedEnv.secrets.length})
                    </TabsTrigger>
                    <TabsTrigger value="variables" className="gap-1">
                      <Variable className="w-3 h-3" />
                      Variables ({selectedEnv.variables.length})
                    </TabsTrigger>
                    <TabsTrigger value="cluster" className="gap-1">
                      <Cloud className="w-3 h-3" />
                      Cluster
                    </TabsTrigger>
                  </TabsList>

                  {/* Secrets Tab */}
                  <TabsContent value="secrets" className="flex-1 overflow-hidden mt-0 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-muted-foreground">
                        Encrypted secrets available during pipeline execution
                      </p>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Plus className="w-3 h-3" />
                        Add Secret
                      </Button>
                    </div>
                    <ScrollArea className="h-[calc(100%-40px)]">
                      <div className="space-y-2">
                        {selectedEnv.secrets.map((secret) => (
                          <div
                            key={secret.id}
                            className="p-3 bg-secondary/30 border border-border rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-muted-foreground" />
                                <span className="font-mono text-sm text-foreground">{secret.key}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => toggleSecretVisibility(secret.id)}
                                >
                                  {showSecretValue[secret.id] ? (
                                    <EyeOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => copyToClipboard(secret.value)}
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-2">
                              <code className="text-xs bg-background px-2 py-1 rounded font-mono text-muted-foreground">
                                {showSecretValue[secret.id] ? secret.value : '••••••••••••••••'}
                              </code>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Updated {secret.updatedAt}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Variables Tab */}
                  <TabsContent value="variables" className="flex-1 overflow-hidden mt-0 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-muted-foreground">
                        Environment variables available to all stages
                      </p>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Plus className="w-3 h-3" />
                        Add Variable
                      </Button>
                    </div>
                    <ScrollArea className="h-[calc(100%-40px)]">
                      <div className="space-y-2">
                        {selectedEnv.variables.map((variable) => (
                          <div
                            key={variable.id}
                            className="p-3 bg-secondary/30 border border-border rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <Variable className="w-4 h-4 text-muted-foreground" />
                              <span className="font-mono text-sm text-foreground">{variable.key}</span>
                              <span className="text-muted-foreground">=</span>
                              <code className="text-sm bg-background px-2 py-0.5 rounded font-mono text-ai-primary">
                                {variable.value}
                              </code>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Cluster Tab */}
                  <TabsContent value="cluster" className="flex-1 overflow-hidden mt-0 p-4">
                    {selectedEnv.cluster ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-secondary/30 border border-border rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-md bg-infra-primary/20">
                                <Server className="w-5 h-5 text-infra-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{selectedEnv.cluster.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {selectedEnv.cluster.provider.toUpperCase()} • {selectedEnv.cluster.region}
                                </p>
                              </div>
                            </div>
                            <div className={cn(
                              'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                              selectedEnv.cluster.status === 'healthy' ? 'bg-runtime-ok/20 text-runtime-ok' :
                              selectedEnv.cluster.status === 'degraded' ? 'bg-runtime-degraded/20 text-runtime-degraded' :
                              'bg-sec-critical/20 text-sec-critical'
                            )}>
                              <div className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                selectedEnv.cluster.status === 'healthy' ? 'bg-runtime-ok' :
                                selectedEnv.cluster.status === 'degraded' ? 'bg-runtime-degraded' :
                                'bg-sec-critical'
                              )} />
                              {selectedEnv.cluster.status}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-background rounded-md">
                              <p className="text-xs text-muted-foreground">Nodes</p>
                              <p className="text-lg font-semibold text-foreground">{selectedEnv.cluster.nodes}</p>
                            </div>
                            <div className="p-3 bg-background rounded-md">
                              <p className="text-xs text-muted-foreground">CPU Usage</p>
                              <p className="text-lg font-semibold text-foreground">{selectedEnv.cluster.cpu}%</p>
                              <div className="mt-1 h-1 bg-secondary rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-exec-primary rounded-full"
                                  style={{ width: `${selectedEnv.cluster.cpu}%` }}
                                />
                              </div>
                            </div>
                            <div className="p-3 bg-background rounded-md">
                              <p className="text-xs text-muted-foreground">Memory</p>
                              <p className="text-lg font-semibold text-foreground">{selectedEnv.cluster.memory}%</p>
                              <div className="mt-1 h-1 bg-secondary rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-ai-primary rounded-full"
                                  style={{ width: `${selectedEnv.cluster.memory}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button variant="outline" size="sm" className="gap-1">
                          <Settings className="w-3 h-3" />
                          Configure Cluster
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Cloud className="w-12 h-12 text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground">No cluster configured</p>
                        <Button variant="outline" size="sm" className="mt-3 gap-1">
                          <Plus className="w-3 h-3" />
                          Connect Cluster
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnvironmentManager;
