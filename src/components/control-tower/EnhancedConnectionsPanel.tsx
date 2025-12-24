import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github, Cloud, Database, Shield, Activity, Plus, RefreshCw,
  CheckCircle2, XCircle, AlertTriangle, Clock, Settings, Trash2,
  ChevronRight, ExternalLink, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ConnectionCreationWizard from './ConnectionCreationWizard';

interface Connection {
  id: string;
  name: string;
  type: string;
  status: string;
  validated: boolean;
  validation_message: string | null;
  last_validated_at: string | null;
  last_validation_error: string | null;
  blocked: boolean;
  health_check_interval_minutes: number;
  config: any;
  created_at: string;
}

interface HealthEvent {
  id: string;
  connection_id: string;
  status: string;
  message: string;
  checked_at: string;
  response_time_ms: number;
}

const CONNECTION_TYPES = [
  { 
    id: 'github', 
    name: 'GitHub', 
    icon: Github, 
    description: 'Source control & CI/CD triggers',
    required: true,
    blocks: 'All executions',
    interval: '5 min',
  },
  { 
    id: 'kubernetes', 
    name: 'Kubernetes', 
    icon: Cloud, 
    description: 'Container orchestration & CD',
    required: true,
    blocks: 'Deployments',
    interval: '10 min',
  },
  { 
    id: 'registry', 
    name: 'Container Registry', 
    icon: Database, 
    description: 'Image storage (ACR, ECR, Docker Hub)',
    required: true,
    blocks: 'Deployments',
    interval: '15 min',
  },
  { 
    id: 'vault', 
    name: 'Secrets Vault', 
    icon: Shield, 
    description: 'Azure Key Vault, HashiCorp Vault',
    required: true,
    blocks: 'Deployments',
    interval: '5 min',
  },
  { 
    id: 'otel', 
    name: 'OpenTelemetry', 
    icon: Activity, 
    description: 'Observability & telemetry',
    required: true,
    blocks: 'Warning only',
    interval: '15 min',
  },
];

export const EnhancedConnectionsPanel = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [healthEvents, setHealthEvents] = useState<Record<string, HealthEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
    
    // Subscribe to realtime updates
    const connectionsChannel = supabase
      .channel('connections-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'connections',
      }, () => fetchConnections())
      .subscribe();

    const healthChannel = supabase
      .channel('health-events-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'connection_health_events',
      }, (payload) => {
        const event = payload.new as HealthEvent;
        setHealthEvents(prev => ({
          ...prev,
          [event.connection_id]: [event, ...(prev[event.connection_id] || []).slice(0, 4)],
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(connectionsChannel);
      supabase.removeChannel(healthChannel);
    };
  }, []);

  const fetchConnections = async () => {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setConnections(data as Connection[]);
      
      // Fetch recent health events for each connection
      for (const conn of data) {
        const { data: events } = await supabase
          .from('connection_health_events')
          .select('*')
          .eq('connection_id', conn.id)
          .order('checked_at', { ascending: false })
          .limit(5);
        
        if (events) {
          setHealthEvents(prev => ({
            ...prev,
            [conn.id]: events as HealthEvent[],
          }));
        }
      }
    }
    setLoading(false);
  };

  const handleValidate = async (connectionId: string) => {
    setValidating(connectionId);
    try {
      const { error } = await supabase.functions.invoke('connection-health-check', {
        body: { connection_id: connectionId },
      });

      if (error) throw error;
      toast.success('Health check completed');
    } catch (error: any) {
      toast.error('Health check failed: ' + error.message);
    } finally {
      setValidating(null);
    }
  };

  const handleDelete = async (connectionId: string) => {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      toast.error('Failed to delete connection');
    } else {
      toast.success('Connection deleted');
    }
  };

  const getConnectionByType = (type: string) => {
    return connections.find(c => c.type === type);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-sec-safe" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-sec-critical" />;
      case 'validating':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-sec-warning" />;
    }
  };

  const getStatusBadge = (status: string, blocked: boolean) => {
    if (blocked) {
      return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Blocked</Badge>;
    }
    switch (status) {
      case 'connected':
        return <Badge className="bg-sec-safe/20 text-sec-safe border-sec-safe/30 gap-1"><CheckCircle2 className="w-3 h-3" /> Connected</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Failed</Badge>;
      case 'validating':
        return <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Validating</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
    }
  };

  const connectedCount = connections.filter(c => c.status === 'connected').length;
  const failedCount = connections.filter(c => c.status === 'failed').length;
  const overallHealth = connections.length > 0 ? Math.round((connectedCount / connections.length) * 100) : 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Connections</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Governed infrastructure connections with continuous health monitoring
            </p>
          </div>
          <Button onClick={() => setShowWizard(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
        </div>

        {/* Health Overview */}
        <Card className={cn(
          'border-2',
          failedCount > 0 ? 'border-sec-critical/50 bg-sec-critical/5' : 'border-sec-safe/50 bg-sec-safe/5'
        )}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'p-3 rounded-full',
                  failedCount > 0 ? 'bg-sec-critical/20' : 'bg-sec-safe/20'
                )}>
                  {failedCount > 0 ? (
                    <AlertTriangle className="w-6 h-6 text-sec-critical" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-sec-safe" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">
                    {failedCount > 0 ? `${failedCount} Connection${failedCount > 1 ? 's' : ''} Failed` : 'All Connections Healthy'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {connectedCount} of {connections.length} connections active
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold">{overallHealth}%</p>
                  <p className="text-xs text-muted-foreground">Health Score</p>
                </div>
                <Progress value={overallHealth} className="w-24 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Types */}
        <div className="space-y-4">
          {CONNECTION_TYPES.map((type) => {
            const connection = getConnectionByType(type.id);
            const Icon = type.icon;
            const events = connection ? (healthEvents[connection.id] || []) : [];
            
            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={cn(
                  'transition-all',
                  connection?.blocked && 'border-sec-critical/50',
                  !connection && 'border-dashed opacity-75'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'p-3 rounded-lg',
                          connection?.status === 'connected' ? 'bg-sec-safe/10' :
                          connection?.status === 'failed' ? 'bg-sec-critical/10' :
                          'bg-muted'
                        )}>
                          <Icon className="w-6 h-6" />
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{type.name}</h3>
                            {type.required && (
                              <Badge variant="outline" className="text-[10px]">Required</Badge>
                            )}
                            {connection && getStatusBadge(connection.status, connection.blocked)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {type.description}
                          </p>
                          
                          {connection ? (
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Every {type.interval}
                              </span>
                              {connection.last_validated_at && (
                                <span>
                                  Last check: {new Date(connection.last_validated_at).toLocaleString()}
                                </span>
                              )}
                              {connection.validation_message && (
                                <span className={cn(
                                  connection.status === 'failed' ? 'text-sec-critical' : 'text-muted-foreground'
                                )}>
                                  {connection.validation_message}
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-sec-warning mt-2 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Not configured - {type.blocks}
                            </p>
                          )}

                          {/* Health History Dots */}
                          {events.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <span className="text-xs text-muted-foreground mr-2">Recent:</span>
                              {events.map((event, i) => (
                                <TooltipProvider key={event.id}>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className={cn(
                                        'w-2 h-2 rounded-full',
                                        event.status === 'connected' ? 'bg-sec-safe' : 'bg-sec-critical'
                                      )} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">{event.message}</p>
                                      <p className="text-xs text-muted-foreground">{event.response_time_ms}ms</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {connection ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleValidate(connection.id)}
                              disabled={validating === connection.id}
                            >
                              {validating === connection.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedType(type.id);
                                setShowWizard(true);
                              }}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedType(type.id);
                              setShowWizard(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Governance Rules */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Connection Governance Rules</p>
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <p>• <strong>GitHub:</strong> Required for all executions - no GitHub = no pipelines</p>
                  <p>• <strong>Kubernetes + Registry:</strong> Required for CD - CI allowed without them</p>
                  <p>• <strong>Vault:</strong> Required for enterprise deployments - secrets must be resolvable</p>
                  <p>• <strong>OpenTelemetry:</strong> Required for observability - deployments flagged without it</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Wizard */}
      <ConnectionCreationWizard
        open={showWizard}
        onOpenChange={(open) => {
          setShowWizard(open);
          if (!open) setSelectedType(null);
        }}
        onComplete={() => {
          setShowWizard(false);
          setSelectedType(null);
          fetchConnections();
        }}
      />
    </ScrollArea>
  );
};

export default EnhancedConnectionsPanel;
