import { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Connection {
  id: string;
  type: 'github' | 'kubernetes' | 'vault';
  name: string;
  status: 'connected' | 'invalid' | 'rate-limited' | 'error' | 'validating';
  lastValidated?: string;
  permissions?: string[];
  errorReason?: string;
  details?: Record<string, any>;
}

const ConnectionsPanel = () => {
  const [connections, setConnections] = useState<Connection[]>([
    {
      id: '1',
      type: 'github',
      name: 'opzenix/platform-core',
      status: 'connected',
      lastValidated: new Date().toISOString(),
      permissions: ['repo', 'workflow', 'read:org'],
    },
    {
      id: '2',
      type: 'kubernetes',
      name: 'aks-production-cluster',
      status: 'connected',
      lastValidated: new Date().toISOString(),
      permissions: ['get', 'list', 'create', 'delete'],
    },
    {
      id: '3',
      type: 'vault',
      name: 'azure-keyvault-prod',
      status: 'connected',
      lastValidated: new Date().toISOString(),
      permissions: ['read', 'list'],
    },
  ]);

  const [validatingId, setValidatingId] = useState<string | null>(null);

  const getConnectionIcon = (type: Connection['type']) => {
    switch (type) {
      case 'github': return Github;
      case 'kubernetes': return Cloud;
      case 'vault': return Shield;
    }
  };

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

  const handleValidate = async (connectionId: string) => {
    setValidatingId(connectionId);
    const conn = connections.find(c => c.id === connectionId);
    
    if (!conn) return;

    // Update status to validating
    setConnections(prev => prev.map(c => 
      c.id === connectionId ? { ...c, status: 'validating' as const } : c
    ));

    try {
      // Call the azure-validate edge function for actual validation
      if (conn.type === 'kubernetes' || conn.type === 'vault') {
        const { data, error } = await supabase.functions.invoke('azure-validate', {
          body: {
            type: conn.type === 'kubernetes' ? 'aks' : 'keyvault',
            // In real implementation, these would come from stored credentials
            tenantId: 'demo-tenant',
            clientId: 'demo-client',
          }
        });

        if (error) throw error;

        setConnections(prev => prev.map(c => 
          c.id === connectionId ? { 
            ...c, 
            status: data.valid ? 'connected' : 'error',
            lastValidated: new Date().toISOString(),
            errorReason: data.valid ? undefined : data.error,
          } : c
        ));

        if (data.valid) {
          toast.success(`${conn.name} validated successfully`);
        } else {
          toast.error(`Validation failed: ${data.error}`);
        }
      } else {
        // Simulate GitHub validation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setConnections(prev => prev.map(c => 
          c.id === connectionId ? { 
            ...c, 
            status: 'connected',
            lastValidated: new Date().toISOString(),
          } : c
        ));

        toast.success(`${conn.name} validated successfully`);
      }
    } catch (err) {
      console.error('Validation failed:', err);
      setConnections(prev => prev.map(c => 
        c.id === connectionId ? { 
          ...c, 
          status: 'error',
          errorReason: 'Validation request failed',
        } : c
      ));
      toast.error('Validation failed');
    } finally {
      setValidatingId(null);
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

  const connectionsByType = {
    github: connections.filter(c => c.type === 'github'),
    kubernetes: connections.filter(c => c.type === 'kubernetes'),
    vault: connections.filter(c => c.type === 'vault'),
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Connections</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage GitHub, Kubernetes, and Vault integrations
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
            {connection.lastValidated && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(connection.lastValidated)}
              </span>
            )}
          </div>
          {connection.errorReason && (
            <p className="text-xs text-sec-critical mt-1">{connection.errorReason}</p>
          )}
          {connection.permissions && connection.permissions.length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {connection.permissions.map((perm, i) => (
                <Badge key={i} variant="outline" className="text-[10px] h-5">
                  {perm}
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
