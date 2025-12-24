import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Key,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Settings,
  Eye,
  EyeOff,
  Database,
  Cloud,
  Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VaultConnection {
  id: string;
  type: 'opzenix' | 'azure_key_vault' | 'hashicorp' | 'aws_kms';
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastValidated?: string;
  environments: string[];
}

interface VaultAdapterPanelProps {
  onClose?: () => void;
}

const vaultIcons = {
  opzenix: Shield,
  azure_key_vault: Cloud,
  hashicorp: Lock,
  aws_kms: Database,
};

const vaultColors = {
  opzenix: 'text-primary',
  azure_key_vault: 'text-chart-1',
  hashicorp: 'text-sec-warning',
  aws_kms: 'text-sec-safe',
};

const statusColors = {
  connected: 'bg-sec-safe/20 text-sec-safe border-sec-safe/30',
  disconnected: 'bg-muted text-muted-foreground border-border',
  error: 'bg-sec-critical/20 text-sec-critical border-sec-critical/30',
};

export function VaultAdapterPanel({ onClose }: VaultAdapterPanelProps) {
  const [activeTab, setActiveTab] = useState('connections');
  const [validating, setValidating] = useState<string | null>(null);
  const [connections, setConnections] = useState<VaultConnection[]>([
    {
      id: '1',
      type: 'opzenix',
      name: 'Opzenix Internal Vault',
      status: 'connected',
      lastValidated: new Date().toISOString(),
      environments: ['dev', 'uat', 'prod'],
    },
    {
      id: '2',
      type: 'azure_key_vault',
      name: 'opzenix-prod-kv',
      status: 'connected',
      lastValidated: new Date().toISOString(),
      environments: ['uat', 'prod'],
    },
  ]);

  // Azure Key Vault config state
  const [azureConfig, setAzureConfig] = useState({
    vaultName: '',
    tenantId: '',
    clientId: '',
    authMethod: 'managed_identity',
  });

  const handleValidateConnection = async (id: string) => {
    setValidating(id);
    
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setConnections(prev => 
      prev.map(conn => 
        conn.id === id 
          ? { ...conn, status: 'connected' as const, lastValidated: new Date().toISOString() }
          : conn
      )
    );
    
    toast.success('Vault connection validated');
    setValidating(null);
  };

  const handleAddAzureVault = () => {
    if (!azureConfig.vaultName || !azureConfig.tenantId) {
      toast.error('Vault name and Tenant ID are required');
      return;
    }

    const newConnection: VaultConnection = {
      id: Date.now().toString(),
      type: 'azure_key_vault',
      name: azureConfig.vaultName,
      status: 'disconnected',
      environments: [],
    };

    setConnections(prev => [...prev, newConnection]);
    setAzureConfig({ vaultName: '', tenantId: '', clientId: '', authMethod: 'managed_identity' });
    toast.success('Azure Key Vault added. Please validate connection.');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Vault Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Enterprise-grade secret management with pluggable adapters
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="add-vault">Add Vault</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-3 mt-4">
          {connections.map((conn) => {
            const Icon = vaultIcons[conn.type];
            return (
              <Card key={conn.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        "bg-secondary"
                      )}>
                        <Icon className={cn("w-5 h-5", vaultColors[conn.type])} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{conn.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge 
                            variant="outline" 
                            className={cn("text-[10px]", statusColors[conn.status])}
                          >
                            {conn.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {conn.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleValidateConnection(conn.id)}
                      disabled={validating === conn.id}
                      className="gap-1.5 text-xs"
                    >
                      <RefreshCw className={cn(
                        "w-3 h-3",
                        validating === conn.id && "animate-spin"
                      )} />
                      Validate
                    </Button>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Server className="w-3 h-3" />
                      Environments:
                      {conn.environments.map(env => (
                        <Badge 
                          key={env} 
                          variant="secondary" 
                          className="text-[10px] px-1.5"
                        >
                          {env}
                        </Badge>
                      ))}
                    </div>
                    {conn.lastValidated && (
                      <span className="text-muted-foreground">
                        Validated: {new Date(conn.lastValidated).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {connections.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No vault connections configured</p>
                <Button 
                  size="sm" 
                  className="mt-3"
                  onClick={() => setActiveTab('add-vault')}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Vault
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Resolution Order Info */}
          <Card className="bg-secondary/30 border-border">
            <CardContent className="p-4">
              <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                Secret Resolution Order
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 pl-4 list-decimal">
                <li>Azure Key Vault (Primary, Enterprise)</li>
                <li>Opzenix Internal Vault (MVP)</li>
                <li>HashiCorp Vault (Optional)</li>
                <li>AWS KMS (Optional)</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-vault" className="space-y-4 mt-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cloud className="w-4 h-4 text-chart-1" />
                Azure Key Vault
              </CardTitle>
              <CardDescription className="text-xs">
                Connect to Azure Key Vault for enterprise secret management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Vault Name</Label>
                  <Input
                    value={azureConfig.vaultName}
                    onChange={(e) => setAzureConfig(prev => ({ ...prev, vaultName: e.target.value }))}
                    placeholder="opzenix-prod-kv"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tenant ID</Label>
                  <Input
                    value={azureConfig.tenantId}
                    onChange={(e) => setAzureConfig(prev => ({ ...prev, tenantId: e.target.value }))}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Client ID (Optional)</Label>
                  <Input
                    value={azureConfig.clientId}
                    onChange={(e) => setAzureConfig(prev => ({ ...prev, clientId: e.target.value }))}
                    placeholder="For service principal auth"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Auth Method</Label>
                  <Select 
                    value={azureConfig.authMethod} 
                    onValueChange={(v) => setAzureConfig(prev => ({ ...prev, authMethod: v }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="managed_identity">Managed Identity</SelectItem>
                      <SelectItem value="service_principal">Service Principal</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleAddAzureVault} className="w-full gap-1.5">
                <Plus className="w-4 h-4" />
                Add Azure Key Vault
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border opacity-60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-sec-warning" />
                HashiCorp Vault
                <Badge variant="secondary" className="text-[10px] ml-auto">Coming Soon</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Enterprise Vault integration with full policy support
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border opacity-60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-sec-safe" />
                AWS KMS
                <Badge variant="secondary" className="text-[10px] ml-auto">Coming Soon</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                AWS Key Management Service integration
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-3 mt-4">
          <Card className="border-border">
            <CardContent className="p-4">
              <p className="text-xs font-medium mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Recent Vault Access
              </p>
              <div className="space-y-2">
                {[
                  { secret: 'DB_CONNECTION_STRING', env: 'prod', time: '2 min ago' },
                  { secret: 'API_KEY_STRIPE', env: 'uat', time: '5 min ago' },
                  { secret: 'JWT_SECRET', env: 'dev', time: '12 min ago' },
                ].map((log, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-2 bg-secondary/30 rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono">{log.secret}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{log.env}</Badge>
                      <span className="text-muted-foreground">{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Secret values are never logged or displayed
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

export default VaultAdapterPanel;
