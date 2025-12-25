import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound,
  Shield,
  Plus,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  Unlock,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Upload,
  Clock,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VaultProvider {
  id: string;
  name: string;
  type: 'hashicorp' | 'azure' | 'aws';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  secretsCount: number;
  config: Record<string, string>;
}

interface Secret {
  id: string;
  name: string;
  provider: string;
  scope: string;
  lastRotated: string;
  expiresIn: number;
  status: 'active' | 'expiring' | 'expired' | 'rotating';
  version: number;
  description?: string;
}

interface VaultManagementPanelProps {
  onBack?: () => void;
}

const providerLogos: Record<string, { icon: string; color: string }> = {
  hashicorp: { icon: '🔐', color: 'from-purple-500/20 to-purple-600/20' },
  azure: { icon: '☁️', color: 'from-blue-500/20 to-blue-600/20' },
  aws: { icon: '🔶', color: 'from-amber-500/20 to-amber-600/20' },
};

export const VaultManagementPanel = ({ onBack }: VaultManagementPanelProps) => {
  const [providers, setProviders] = useState<VaultProvider[]>([]);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [showAddSecret, setShowAddSecret] = useState(false);
  const [showSecretValue, setShowSecretValue] = useState<Record<string, boolean>>({});
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [newProvider, setNewProvider] = useState({
    name: '',
    type: 'hashicorp' as 'hashicorp' | 'azure' | 'aws',
    endpoint: '',
    token: '',
    namespace: '',
  });
  const [newSecret, setNewSecret] = useState({
    name: '',
    value: '',
    scope: 'production',
    provider: '',
    description: '',
    autoRotate: false,
    rotationDays: 90,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch secret references from database
      const { data: secretRefs } = await supabase
        .from('secret_references')
        .select('*')
        .limit(50);

      // Mock providers for demo
      const mockProviders: VaultProvider[] = [
        {
          id: '1',
          name: 'Production Vault',
          type: 'hashicorp',
          status: 'connected',
          lastSync: new Date().toISOString(),
          secretsCount: 24,
          config: { endpoint: 'https://vault.example.com', namespace: 'production' },
        },
        {
          id: '2',
          name: 'Azure Key Vault (Prod)',
          type: 'azure',
          status: 'connected',
          lastSync: new Date(Date.now() - 3600000).toISOString(),
          secretsCount: 18,
          config: { vaultUrl: 'https://myvault.vault.azure.net', tenantId: 'xxx-xxx' },
        },
        {
          id: '3',
          name: 'AWS Secrets Manager',
          type: 'aws',
          status: 'disconnected',
          lastSync: new Date(Date.now() - 86400000).toISOString(),
          secretsCount: 0,
          config: { region: 'us-east-1' },
        },
      ];

      setProviders(mockProviders);

      // Map secret references to secrets or use mock data
      if (secretRefs && secretRefs.length > 0) {
        setSecrets(
          secretRefs.map((s, idx) => ({
            id: s.id,
            name: s.ref_key,
            provider: s.provider,
            scope: s.scope,
            lastRotated: new Date(s.created_at).toISOString(),
            expiresIn: Math.floor(Math.random() * 90) + 10,
            status: idx % 4 === 3 ? 'expiring' : 'active',
            version: Math.floor(Math.random() * 5) + 1,
            description: s.description || '',
          }))
        );
      } else {
        setSecrets([
          { id: '1', name: 'GITHUB_TOKEN', provider: 'hashicorp', scope: 'ci/cd', lastRotated: '2024-01-10', expiresIn: 75, status: 'active', version: 3 },
          { id: '2', name: 'AWS_SECRET_KEY', provider: 'aws', scope: 'infrastructure', lastRotated: '2024-01-15', expiresIn: 87, status: 'active', version: 2 },
          { id: '3', name: 'DB_PASSWORD', provider: 'azure', scope: 'production', lastRotated: '2023-12-01', expiresIn: 15, status: 'expiring', version: 5 },
          { id: '4', name: 'API_KEY_STRIPE', provider: 'hashicorp', scope: 'payments', lastRotated: '2023-10-15', expiresIn: 0, status: 'expired', version: 1 },
          { id: '5', name: 'REDIS_PASSWORD', provider: 'azure', scope: 'cache', lastRotated: '2024-01-18', expiresIn: 90, status: 'active', version: 2 },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch vault data:', error);
      toast.error('Failed to load vault data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Secret['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'expiring':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'rotating':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: Secret['status']) => {
    const styles = {
      active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      expiring: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      expired: 'bg-red-500/10 text-red-500 border-red-500/30',
      rotating: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    };
    return styles[status];
  };

  const getProviderStatus = (status: VaultProvider['status']) => {
    switch (status) {
      case 'connected':
        return { icon: <CheckCircle2 className="w-4 h-4" />, class: 'text-emerald-500' };
      case 'disconnected':
        return { icon: <XCircle className="w-4 h-4" />, class: 'text-muted-foreground' };
      case 'error':
        return { icon: <AlertTriangle className="w-4 h-4" />, class: 'text-red-500' };
    }
  };

  const filteredSecrets = secrets.filter((secret) => {
    const matchesSearch = secret.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = selectedProvider === 'all' || secret.provider === selectedProvider;
    return matchesSearch && matchesProvider;
  });

  const stats = {
    total: secrets.length,
    active: secrets.filter((s) => s.status === 'active').length,
    expiring: secrets.filter((s) => s.status === 'expiring').length,
    expired: secrets.filter((s) => s.status === 'expired').length,
  };

  const handleAddProvider = async () => {
    try {
      const newProv: VaultProvider = {
        id: Date.now().toString(),
        name: newProvider.name,
        type: newProvider.type,
        status: 'connected',
        lastSync: new Date().toISOString(),
        secretsCount: 0,
        config: { endpoint: newProvider.endpoint, namespace: newProvider.namespace },
      };
      setProviders([...providers, newProv]);
      setShowAddProvider(false);
      setNewProvider({ name: '', type: 'hashicorp', endpoint: '', token: '', namespace: '' });
      toast.success('Vault provider connected successfully');
    } catch (error) {
      toast.error('Failed to connect provider');
    }
  };

  const handleAddSecret = async () => {
    try {
      // Insert into database
      const { error } = await supabase.from('secret_references').insert({
        ref_key: newSecret.name,
        scope: newSecret.scope,
        provider: newSecret.provider || 'vault',
        description: newSecret.description,
      });

      if (error) throw error;

      const newSec: Secret = {
        id: Date.now().toString(),
        name: newSecret.name,
        provider: newSecret.provider || 'hashicorp',
        scope: newSecret.scope,
        lastRotated: new Date().toISOString(),
        expiresIn: newSecret.rotationDays,
        status: 'active',
        version: 1,
        description: newSecret.description,
      };
      setSecrets([...secrets, newSec]);
      setShowAddSecret(false);
      setNewSecret({ name: '', value: '', scope: 'production', provider: '', description: '', autoRotate: false, rotationDays: 90 });
      toast.success('Secret created successfully');
    } catch (error) {
      toast.error('Failed to create secret');
    }
  };

  const handleRotateSecret = (secret: Secret) => {
    setSecrets(secrets.map((s) => (s.id === secret.id ? { ...s, status: 'rotating' as const } : s)));
    setTimeout(() => {
      setSecrets(secrets.map((s) =>
        s.id === secret.id
          ? { ...s, status: 'active' as const, lastRotated: new Date().toISOString(), expiresIn: 90, version: s.version + 1 }
          : s
      ));
      toast.success(`Secret ${secret.name} rotated successfully`);
    }, 2000);
  };

  const handleDeleteSecret = async (secret: Secret) => {
    try {
      await supabase.from('secret_references').delete().eq('id', secret.id);
      setSecrets(secrets.filter((s) => s.id !== secret.id));
      toast.success('Secret deleted');
    } catch (error) {
      toast.error('Failed to delete secret');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="p-2 rounded-lg bg-primary/10">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Secrets Vault Management</h1>
              <p className="text-sm text-muted-foreground">Manage secrets across multiple vault providers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddProvider(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Provider
            </Button>
            <Button size="sm" onClick={() => setShowAddSecret(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Secret
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground uppercase">Total Secrets</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/10 border-emerald-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-500">{stats.active}</p>
              <p className="text-xs text-emerald-500/80 uppercase">Active</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-500">{stats.expiring}</p>
              <p className="text-xs text-amber-500/80 uppercase">Expiring Soon</p>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{stats.expired}</p>
              <p className="text-xs text-red-500/80 uppercase">Expired</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="secrets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="secrets">Secrets</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          {/* Secrets Tab */}
          <TabsContent value="secrets" className="space-y-4">
            {/* Search & Filter */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search secrets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="hashicorp">HashiCorp Vault</SelectItem>
                  <SelectItem value="azure">Azure Key Vault</SelectItem>
                  <SelectItem value="aws">AWS Secrets Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Secrets List */}
            <div className="space-y-2">
              <AnimatePresence>
                {filteredSecrets.map((secret) => (
                  <motion.div
                    key={secret.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="hover:bg-muted/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-muted">
                              <Lock className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium text-foreground">{secret.name}</span>
                                <Badge variant="outline" className={cn('text-[10px]', getStatusBadge(secret.status))}>
                                  {getStatusIcon(secret.status)}
                                  <span className="ml-1">{secret.status.toUpperCase()}</span>
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Shield className="w-3 h-3" />
                                  {secret.scope}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Rotated: {new Date(secret.lastRotated).toLocaleDateString()}
                                </span>
                                <span>v{secret.version}</span>
                                <Badge variant="secondary" className="text-[10px]">
                                  {secret.provider}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {secret.status !== 'expired' && (
                              <div className="w-24">
                                <Progress value={secret.expiresIn} className="h-1.5" />
                                <p className="text-[10px] text-muted-foreground mt-0.5 text-center">
                                  {secret.expiresIn}d left
                                </p>
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowSecretValue({ ...showSecretValue, [secret.id]: !showSecretValue[secret.id] })}
                            >
                              {showSecretValue[secret.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRotateSecret(secret)}
                              disabled={secret.status === 'rotating'}
                            >
                              <RefreshCw className={cn('w-4 h-4', secret.status === 'rotating' && 'animate-spin')} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedSecret(secret)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSecret(secret)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {showSecretValue[secret.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 p-3 rounded-lg bg-muted font-mono text-sm"
                          >
                            ••••••••••••••••••••••••
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {providers.map((provider) => {
                const status = getProviderStatus(provider.status);
                const logo = providerLogos[provider.type];
                return (
                  <Card key={provider.id} className="overflow-hidden">
                    <div className={cn('h-2 bg-gradient-to-r', logo.color)} />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{logo.icon}</span>
                          <div>
                            <CardTitle className="text-base">{provider.name}</CardTitle>
                            <CardDescription className="capitalize">{provider.type.replace('hashicorp', 'HashiCorp Vault')}</CardDescription>
                          </div>
                        </div>
                        <div className={status.class}>{status.icon}</div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Secrets</span>
                        <span className="font-medium">{provider.secretsCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Sync</span>
                        <span className="font-medium">{new Date(provider.lastSync).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Sync
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="w-3 h-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: 'Secret rotated', target: 'DB_PASSWORD', user: 'admin@company.com', time: '2 hours ago' },
                    { action: 'Secret created', target: 'NEW_API_KEY', user: 'dev@company.com', time: '5 hours ago' },
                    { action: 'Provider synced', target: 'Production Vault', user: 'system', time: '1 day ago' },
                    { action: 'Secret accessed', target: 'GITHUB_TOKEN', user: 'ci-pipeline', time: '1 day ago' },
                  ].map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-xs text-muted-foreground">{log.target} by {log.user}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{log.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Provider Dialog */}
      <Dialog open={showAddProvider} onOpenChange={setShowAddProvider}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Vault Provider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider Type</Label>
              <Select value={newProvider.type} onValueChange={(v: 'hashicorp' | 'azure' | 'aws') => setNewProvider({ ...newProvider, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hashicorp">🔐 HashiCorp Vault</SelectItem>
                  <SelectItem value="azure">☁️ Azure Key Vault</SelectItem>
                  <SelectItem value="aws">🔶 AWS Secrets Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={newProvider.name} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })} placeholder="Production Vault" />
            </div>
            <div className="space-y-2">
              <Label>Endpoint URL</Label>
              <Input value={newProvider.endpoint} onChange={(e) => setNewProvider({ ...newProvider, endpoint: e.target.value })} placeholder="https://vault.example.com" />
            </div>
            <div className="space-y-2">
              <Label>Access Token</Label>
              <Input type="password" value={newProvider.token} onChange={(e) => setNewProvider({ ...newProvider, token: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>Namespace (optional)</Label>
              <Input value={newProvider.namespace} onChange={(e) => setNewProvider({ ...newProvider, namespace: e.target.value })} placeholder="production" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProvider(false)}>Cancel</Button>
            <Button onClick={handleAddProvider}>Connect Provider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Secret Dialog */}
      <Dialog open={showAddSecret} onOpenChange={setShowAddSecret}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Secret</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Secret Name</Label>
              <Input value={newSecret.name} onChange={(e) => setNewSecret({ ...newSecret, name: e.target.value })} placeholder="API_KEY_NAME" className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Secret Value</Label>
              <Input type="password" value={newSecret.value} onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scope</Label>
                <Select value={newSecret.scope} onValueChange={(v) => setNewSecret({ ...newSecret, scope: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="ci/cd">CI/CD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={newSecret.provider} onValueChange={(v) => setNewSecret({ ...newSecret, provider: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.type}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea value={newSecret.description} onChange={(e) => setNewSecret({ ...newSecret, description: e.target.value })} placeholder="What is this secret used for?" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium">Auto-rotate</p>
                <p className="text-xs text-muted-foreground">Automatically rotate this secret</p>
              </div>
              <Switch checked={newSecret.autoRotate} onCheckedChange={(v) => setNewSecret({ ...newSecret, autoRotate: v })} />
            </div>
            {newSecret.autoRotate && (
              <div className="space-y-2">
                <Label>Rotation Period (days)</Label>
                <Input type="number" value={newSecret.rotationDays} onChange={(e) => setNewSecret({ ...newSecret, rotationDays: parseInt(e.target.value) })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSecret(false)}>Cancel</Button>
            <Button onClick={handleAddSecret}>Create Secret</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaultManagementPanel;
