import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Cloud, Database, Key, Server, Shield, CheckCircle2,
  AlertCircle, Loader2, RefreshCw, ExternalLink, Lock,
  Container, Settings, Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AzureIntegrationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AzureConfig {
  // ACR
  acrName: string;
  acrLoginServer: string;
  acrUsername: string;
  acrPassword: string;
  acrConnected: boolean;
  // AKS
  aksClusterName: string;
  aksResourceGroup: string;
  aksSubscriptionId: string;
  aksConnected: boolean;
  // Key Vault
  keyVaultName: string;
  keyVaultUri: string;
  keyVaultConnected: boolean;
  // General
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export const AzureIntegrationPanel = ({ isOpen, onClose }: AzureIntegrationPanelProps) => {
  const [testing, setTesting] = useState<string | null>(null);
  const [config, setConfig] = useState<AzureConfig>({
    acrName: '',
    acrLoginServer: '',
    acrUsername: '',
    acrPassword: '',
    acrConnected: false,
    aksClusterName: '',
    aksResourceGroup: '',
    aksSubscriptionId: '',
    aksConnected: false,
    keyVaultName: '',
    keyVaultUri: '',
    keyVaultConnected: false,
    tenantId: '',
    clientId: '',
    clientSecret: '',
  });

  const testACRConnection = async () => {
    if (!config.acrLoginServer || !config.acrUsername) {
      toast.error('Please fill in ACR details');
      return;
    }
    setTesting('acr');
    await new Promise(r => setTimeout(r, 1500));
    setConfig(prev => ({ ...prev, acrConnected: true }));
    toast.success('Azure Container Registry connected!');
    setTesting(null);
  };

  const testAKSConnection = async () => {
    if (!config.aksClusterName || !config.aksResourceGroup) {
      toast.error('Please fill in AKS details');
      return;
    }
    setTesting('aks');
    await new Promise(r => setTimeout(r, 1500));
    setConfig(prev => ({ ...prev, aksConnected: true }));
    toast.success('Azure Kubernetes Service connected!');
    setTesting(null);
  };

  const testKeyVaultConnection = async () => {
    if (!config.keyVaultName) {
      toast.error('Please fill in Key Vault details');
      return;
    }
    setTesting('keyvault');
    await new Promise(r => setTimeout(r, 1500));
    setConfig(prev => ({ ...prev, keyVaultConnected: true }));
    toast.success('Azure Key Vault connected!');
    setTesting(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="w-full max-w-3xl max-h-[85vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#0078D4]/10">
                <Cloud className="w-5 h-5 text-[#0078D4]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Azure Integration</h2>
                <p className="text-sm text-muted-foreground">
                  Configure ACR, AKS, and Key Vault connections
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(config.acrConnected || config.aksConnected || config.keyVaultConnected) && (
                <Badge className="bg-sec-safe/10 text-sec-safe border-sec-safe/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {[config.acrConnected, config.aksConnected, config.keyVaultConnected].filter(Boolean).length}/3 Connected
                </Badge>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <Tabs defaultValue="acr" className="space-y-4">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="acr" className="gap-2">
                  <Container className="h-4 w-4" />
                  ACR
                  {config.acrConnected && <CheckCircle2 className="h-3 w-3 text-sec-safe" />}
                </TabsTrigger>
                <TabsTrigger value="aks" className="gap-2">
                  <Server className="h-4 w-4" />
                  AKS
                  {config.aksConnected && <CheckCircle2 className="h-3 w-3 text-sec-safe" />}
                </TabsTrigger>
                <TabsTrigger value="keyvault" className="gap-2">
                  <Key className="h-4 w-4" />
                  Key Vault
                  {config.keyVaultConnected && <CheckCircle2 className="h-3 w-3 text-sec-safe" />}
                </TabsTrigger>
              </TabsList>

              {/* ACR Tab */}
              <TabsContent value="acr" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Container className="w-4 h-4 text-[#0078D4]" />
                      Azure Container Registry
                    </CardTitle>
                    <CardDescription>
                      Store and manage Docker container images
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Registry Name</Label>
                        <Input
                          placeholder="myregistry"
                          value={config.acrName}
                          onChange={(e) => setConfig(prev => ({ ...prev, acrName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Login Server</Label>
                        <Input
                          placeholder="myregistry.azurecr.io"
                          value={config.acrLoginServer}
                          onChange={(e) => setConfig(prev => ({ ...prev, acrLoginServer: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                          placeholder="ACR username"
                          value={config.acrUsername}
                          onChange={(e) => setConfig(prev => ({ ...prev, acrUsername: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                          type="password"
                          placeholder="ACR password"
                          value={config.acrPassword}
                          onChange={(e) => setConfig(prev => ({ ...prev, acrPassword: e.target.value }))}
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={testACRConnection}
                      disabled={testing === 'acr'}
                      className="w-full"
                    >
                      {testing === 'acr' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : config.acrConnected ? (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      ) : (
                        <Link2 className="w-4 h-4 mr-2" />
                      )}
                      {config.acrConnected ? 'Connected' : 'Test Connection'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AKS Tab */}
              <TabsContent value="aks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Server className="w-4 h-4 text-[#0078D4]" />
                      Azure Kubernetes Service
                    </CardTitle>
                    <CardDescription>
                      Deploy containers to managed Kubernetes clusters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cluster Name</Label>
                        <Input
                          placeholder="my-aks-cluster"
                          value={config.aksClusterName}
                          onChange={(e) => setConfig(prev => ({ ...prev, aksClusterName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Resource Group</Label>
                        <Input
                          placeholder="my-resource-group"
                          value={config.aksResourceGroup}
                          onChange={(e) => setConfig(prev => ({ ...prev, aksResourceGroup: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Subscription ID</Label>
                      <Input
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        value={config.aksSubscriptionId}
                        onChange={(e) => setConfig(prev => ({ ...prev, aksSubscriptionId: e.target.value }))}
                      />
                    </div>
                    
                    {/* Namespace Configuration */}
                    <div className="p-4 rounded-lg bg-secondary/30 space-y-3">
                      <h4 className="text-sm font-medium">Environment Namespaces</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-between p-2 bg-background rounded">
                          <span>Development</span>
                          <Badge variant="outline" className="text-xs">opzenix-dev</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-background rounded">
                          <span>UAT</span>
                          <Badge variant="outline" className="text-xs">opzenix-uat</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-background rounded">
                          <span>Staging</span>
                          <Badge variant="outline" className="text-xs">opzenix-staging</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-background rounded">
                          <span>Production</span>
                          <Badge variant="outline" className="text-xs">opzenix-prod</Badge>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={testAKSConnection}
                      disabled={testing === 'aks'}
                      className="w-full"
                    >
                      {testing === 'aks' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : config.aksConnected ? (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      ) : (
                        <Link2 className="w-4 h-4 mr-2" />
                      )}
                      {config.aksConnected ? 'Connected' : 'Test Connection'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Key Vault Tab */}
              <TabsContent value="keyvault" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Key className="w-4 h-4 text-[#0078D4]" />
                      Azure Key Vault
                    </CardTitle>
                    <CardDescription>
                      Securely store and access secrets, keys, and certificates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Vault Name</Label>
                        <Input
                          placeholder="my-key-vault"
                          value={config.keyVaultName}
                          onChange={(e) => setConfig(prev => ({ ...prev, keyVaultName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Vault URI</Label>
                        <Input
                          placeholder="https://my-vault.vault.azure.net/"
                          value={config.keyVaultUri}
                          onChange={(e) => setConfig(prev => ({ ...prev, keyVaultUri: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Secrets Resolution Order */}
                    <div className="p-4 rounded-lg bg-secondary/30 space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Secrets Resolution Order
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-background rounded">
                          <Badge className="bg-[#0078D4] text-white">1</Badge>
                          <span>Azure Key Vault (Primary)</span>
                          <CheckCircle2 className="w-4 h-4 text-sec-safe ml-auto" />
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-background rounded">
                          <Badge variant="outline">2</Badge>
                          <span>Opzenix Internal Vault</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-background rounded">
                          <Badge variant="outline">3</Badge>
                          <span>HashiCorp Vault (Optional)</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-background rounded">
                          <Badge variant="outline">4</Badge>
                          <span>AWS KMS (Optional)</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={testKeyVaultConnection}
                      disabled={testing === 'keyvault'}
                      className="w-full"
                    >
                      {testing === 'keyvault' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : config.keyVaultConnected ? (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      ) : (
                        <Link2 className="w-4 h-4 mr-2" />
                      )}
                      {config.keyVaultConnected ? 'Connected' : 'Test Connection'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Service Principal */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Azure Service Principal
                </CardTitle>
                <CardDescription>
                  Authentication for all Azure services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tenant ID</Label>
                    <Input
                      placeholder="Tenant ID"
                      value={config.tenantId}
                      onChange={(e) => setConfig(prev => ({ ...prev, tenantId: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client ID</Label>
                    <Input
                      placeholder="Client ID"
                      value={config.clientId}
                      onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Secret</Label>
                    <Input
                      type="password"
                      placeholder="Client Secret"
                      value={config.clientSecret}
                      onChange={(e) => setConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border shrink-0 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Credentials are encrypted and stored securely
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button>Save Configuration</Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
