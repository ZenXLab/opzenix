import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Github, 
  Cloud, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Plus,
  ExternalLink,
  Clock,
  Loader2,
  WifiOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useConnectionsRealtime, Connection } from '@/hooks/useConnectionsRealtime';
import { toast } from 'sonner';

const ConnectionsPanel = () => {
  const { 
    connections, 
    loading, 
    validatingId, 
    isConnected,
    validateAzureConnection 
  } = useConnectionsRealtime();

  const handleValidate = async (connectionId: string) => {
    const conn = connections.find(c => c.id === connectionId);
    if (!conn) return;

    // For demo: use placeholder credentials - in production these come from secure storage
    await validateAzureConnection(connectionId, {
      tenantId: (conn.config?.tenantId as string) || '',
      clientId: (conn.config?.clientId as string) || '',
      clientSecret: (conn.config?.clientSecret as string) || '',
      subscriptionId: (conn.config?.subscriptionId as string) || '',
      acrName: (conn.config?.acrName as string) || undefined,
      aksClusterName: (conn.config?.aksClusterName as string) || undefined,
      aksResourceGroup: (conn.config?.aksResourceGroup as string) || undefined,
      keyVaultName: (conn.config?.keyVaultName as string) || undefined,
    });
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const connectionsByType = {
    github: connections.filter(c => c.type === 'github'),
    kubernetes: connections.filter(c => c.type === 'kubernetes' || c.type === 'azure'),
    vault: connections.filter(c => c.type === 'vault'),
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Connection Status Banner */}
        {!isConnected && (
          <div className="bg-sec-warning/20 border border-sec-warning/30 rounded-lg p-3 flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-sec-warning" />
            <span className="text-sm text-sec-warning">Live connection lost - data may be stale</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Connections</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage GitHub, Kubernetes, and Vault integrations — Real-time validated
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Connection
          </Button>
        </div>

        {/* GitHub Connections */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              <CardTitle className="text-lg">GitHub</CardTitle>
            </div>
            <CardDescription>Repository and workflow connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {connectionsByType.github.map((conn) => (
              <ConnectionItem 
                key={conn.id} 
                connection={conn} 
                onValidate={handleValidate}
                isValidating={validatingId === conn.id}
              />
            ))}
            {connectionsByType.github.length === 0 && (
              <EmptyState type="GitHub repository" />
            )}
          </CardContent>
        </Card>

        {/* Kubernetes Connections */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              <CardTitle className="text-lg">Kubernetes</CardTitle>
            </div>
            <CardDescription>AKS, EKS, GKE, and on-prem clusters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {connectionsByType.kubernetes.map((conn) => (
              <ConnectionItem 
                key={conn.id} 
                connection={conn} 
                onValidate={handleValidate}
                isValidating={validatingId === conn.id}
              />
            ))}
            {connectionsByType.kubernetes.length === 0 && (
              <EmptyState type="Kubernetes cluster" />
            )}
          </CardContent>
        </Card>

        {/* Vault Connections */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <CardTitle className="text-lg">Vault</CardTitle>
            </div>
            <CardDescription>Azure Key Vault, HashiCorp Vault, AWS KMS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {connectionsByType.vault.map((conn) => (
              <ConnectionItem 
                key={conn.id} 
                connection={conn} 
                onValidate={handleValidate}
                isValidating={validatingId === conn.id}
              />
            ))}
            {connectionsByType.vault.length === 0 && (
              <EmptyState type="Vault" />
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

interface ConnectionItemProps {
  connection: Connection;
  onValidate: (id: string) => void;
  isValidating: boolean;
}

const ConnectionItem = ({ connection, onValidate, isValidating }: ConnectionItemProps) => {
  const Icon = {
    github: Github,
    kubernetes: Cloud,
    vault: Shield,
  }[connection.type];

  const getStatusBadge = (status: Connection['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-sec-safe/20 text-sec-safe border-0"><CheckCircle2 className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'invalid':
        return <Badge className="bg-sec-critical/20 text-sec-critical border-0"><XCircle className="w-3 h-3 mr-1" />Invalid</Badge>;
      case 'rate-limited':
        return <Badge className="bg-sec-warning/20 text-sec-warning border-0"><AlertTriangle className="w-3 h-3 mr-1" />Rate Limited</Badge>;
      case 'error':
        return <Badge className="bg-sec-critical/20 text-sec-critical border-0"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'validating':
        return <Badge className="bg-primary/20 text-primary border-0"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Validating</Badge>;
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border transition-colors',
        connection.status === 'connected' && 'bg-sec-safe/5 border-sec-safe/20',
        connection.status === 'error' && 'bg-sec-critical/5 border-sec-critical/20',
        connection.status === 'invalid' && 'bg-sec-critical/5 border-sec-critical/20',
        connection.status === 'rate-limited' && 'bg-sec-warning/5 border-sec-warning/20',
        connection.status === 'validating' && 'bg-muted/30 border-border',
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h4 className="text-sm font-medium">{connection.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(connection.status)}
            {connection.last_validated_at && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(connection.last_validated_at)}
              </span>
            )}
          </div>
          {connection.validation_message && connection.status !== 'connected' && (
            <p className="text-xs text-sec-critical mt-1">{connection.validation_message}</p>
          )}
          {connection.resource_status && Object.keys(connection.resource_status).length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {Object.entries(connection.resource_status).map(([key, value]) => (
                <Badge 
                  key={key} 
                  variant="outline" 
                  className={cn(
                    "text-[10px] h-5",
                    value?.status === 'ok' && 'border-sec-safe/50 text-sec-safe',
                    value?.status === 'error' && 'border-sec-critical/50 text-sec-critical'
                  )}
                >
                  {key.toUpperCase()}: {value?.status || 'unknown'}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1.5"
          onClick={() => onValidate(connection.id)}
          disabled={isValidating}
        >
          {isValidating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Validate
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
};

const EmptyState = ({ type }: { type: string }) => (
  <div className="text-center py-8 text-muted-foreground">
    <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
    <p className="text-sm">No {type} connected</p>
    <Button variant="link" size="sm" className="mt-2">
      Add your first {type.toLowerCase()}
    </Button>
  </div>
);

export default ConnectionsPanel;
