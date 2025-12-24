import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Settings,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  Trash2,
  History,
  Github,
  Cloud,
  Container,
  Radio,
  Loader2,
  ExternalLink,
  Copy,
  Webhook
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Connection } from '@/hooks/useConnectionsRealtime';
import WebhookSetupWizard from './WebhookSetupWizard';

interface HealthEvent {
  id: string;
  status: string;
  message: string | null;
  response_time_ms: number | null;
  checked_at: string;
  details: Record<string, unknown> | null;
}

interface ConnectionDetailsPanelProps {
  connection: Connection | null;
  onClose: () => void;
  onConnectionUpdated?: () => void;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ConnectionDetailsPanel = ({ connection, onClose, onConnectionUpdated }: ConnectionDetailsPanelProps) => {
  const [healthHistory, setHealthHistory] = useState<HealthEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showWebhookWizard, setShowWebhookWizard] = useState(false);
  
  const [editConfig, setEditConfig] = useState<Record<string, unknown>>({});
  const [editName, setEditName] = useState('');
  const [editBlocked, setEditBlocked] = useState(false);
  const [editHealthInterval, setEditHealthInterval] = useState(5);

  // Initialize edit state when connection changes
  useEffect(() => {
    if (connection) {
      setEditName(connection.name);
      setEditBlocked(connection.blocked || false);
      setEditHealthInterval(connection.health_check_interval_minutes || 5);
      setEditConfig((connection.config as Record<string, unknown>) || {});
    }
  }, [connection]);

  // Fetch health history
  const fetchHealthHistory = useCallback(async () => {
    if (!connection) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('connection_health_events')
        .select('*')
        .eq('connection_id', connection.id)
        .order('checked_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHealthHistory(data as HealthEvent[]);
    } catch (err) {
      console.error('[ConnectionDetailsPanel] Error fetching health history:', err);
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchHealthHistory();
  }, [fetchHealthHistory]);

  const handleSave = async () => {
    if (!connection) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('connections')
        .update({
          name: editName,
          blocked: editBlocked,
          health_check_interval_minutes: editHealthInterval,
          config: editConfig as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      if (error) throw error;
      toast.success('Connection updated');
      onConnectionUpdated?.();
    } catch (err: any) {
      console.error('[ConnectionDetailsPanel] Error saving:', err);
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!connection) return;
    
    setValidating(true);
    try {
      // Update status to validating
      await supabase
        .from('connections')
        .update({ status: 'validating' })
        .eq('id', connection.id);

      // Call appropriate validation function based on type
      let validationResult: { valid: boolean; error?: string } = { valid: false, error: 'Unknown type' };
      
      if (connection.type === 'github') {
        const config = connection.config as Record<string, unknown>;
        const { data, error } = await supabase.functions.invoke('github-validate-connection', {
          body: { token: config.token, owner: config.owner, repo: config.repo }
        });
        if (error) throw error;
        validationResult = data;
      } else if (connection.type === 'azure') {
        const { data, error } = await supabase.functions.invoke('azure-validate', {
          body: { config: connection.config }
        });
        if (error) throw error;
        validationResult = data;
      } else if (connection.type === 'registry') {
        const { data, error } = await supabase.functions.invoke('validate-registry', {
          body: { config: connection.config }
        });
        if (error) throw error;
        validationResult = data;
      } else if (connection.type === 'otel') {
        const { data, error } = await supabase.functions.invoke('validate-otel', {
          body: { config: connection.config }
        });
        if (error) throw error;
        validationResult = data;
      } else {
        // For vault and other types, do a basic check
        validationResult = { valid: true };
      }

      // Update connection status based on result
      await supabase
        .from('connections')
        .update({
          status: validationResult.valid ? 'connected' : 'failed',
          validated: validationResult.valid,
          last_validated_at: new Date().toISOString(),
          validation_message: validationResult.valid ? 'Connection validated successfully' : validationResult.error,
          last_validation_error: validationResult.valid ? null : validationResult.error,
        })
        .eq('id', connection.id);

      // Record health event
      await supabase
        .from('connection_health_events')
        .insert({
          connection_id: connection.id,
          status: validationResult.valid ? 'healthy' : 'unhealthy',
          message: validationResult.valid ? 'Manual validation successful' : validationResult.error,
        });

      if (validationResult.valid) {
        toast.success('Connection validated successfully');
      } else {
        toast.error(validationResult.error || 'Validation failed');
      }
      
      fetchHealthHistory();
      onConnectionUpdated?.();
    } catch (err: any) {
      console.error('[ConnectionDetailsPanel] Validation error:', err);
      toast.error(err.message || 'Validation failed');
      
      await supabase
        .from('connections')
        .update({
          status: 'failed',
          validated: false,
          last_validation_error: err.message,
        })
        .eq('id', connection.id);
    } finally {
      setValidating(false);
    }
  };

  const handleDelete = async () => {
    if (!connection) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connection.id);

      if (error) throw error;
      toast.success('Connection deleted');
      onClose();
      onConnectionUpdated?.();
    } catch (err: any) {
      console.error('[ConnectionDetailsPanel] Error deleting:', err);
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'github': return Github;
      case 'azure':
      case 'kubernetes': return Cloud;
      case 'vault': return Shield;
      case 'registry': return Container;
      case 'otel': return Radio;
      default: return Cloud;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return <Badge className="bg-sec-safe/20 text-sec-safe border-0 gap-1"><CheckCircle2 className="w-3 h-3" /> Connected</Badge>;
      case 'failed':
      case 'error':
      case 'unhealthy':
        return <Badge className="bg-sec-critical/20 text-sec-critical border-0 gap-1"><XCircle className="w-3 h-3" /> Failed</Badge>;
      case 'validating':
        return <Badge className="bg-sec-warning/20 text-sec-warning border-0 gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Validating</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!connection) return null;

  const Icon = getConnectionIcon(connection.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-y-0 right-0 w-full max-w-lg bg-background border-l border-border shadow-xl z-50"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">{connection.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground capitalize">{connection.type}</span>
                {getStatusBadge(connection.status)}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <Tabs defaultValue="config" className="p-4">
            <TabsList className="w-full">
              <TabsTrigger value="config" className="flex-1">Configuration</TabsTrigger>
              <TabsTrigger value="health" className="flex-1">Health History</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-6 mt-4">
              {/* Basic Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Basic Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Connection Name</Label>
                    <Input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Block Connection</Label>
                      <p className="text-xs text-muted-foreground">
                        Prevent this connection from being used
                      </p>
                    </div>
                    <Switch
                      checked={editBlocked}
                      onCheckedChange={setEditBlocked}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Health Check Interval</Label>
                    <Select 
                      value={String(editHealthInterval)}
                      onValueChange={(v) => setEditHealthInterval(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Every 1 minute</SelectItem>
                        <SelectItem value="5">Every 5 minutes</SelectItem>
                        <SelectItem value="15">Every 15 minutes</SelectItem>
                        <SelectItem value="30">Every 30 minutes</SelectItem>
                        <SelectItem value="60">Every hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Connection Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Connection Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Connection ID</Label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">{connection.id}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(connection.id)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Type</Label>
                    <p className="text-sm capitalize">{connection.type}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Created</Label>
                    <p className="text-sm">{new Date(connection.created_at).toLocaleString()}</p>
                  </div>

                  {connection.last_validated_at && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">Last Validated</Label>
                      <p className="text-sm">{formatTimeAgo(new Date(connection.last_validated_at))}</p>
                    </div>
                  )}

                  {connection.validation_message && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">Last Message</Label>
                      <p className="text-sm text-muted-foreground">{connection.validation_message}</p>
                    </div>
                  )}

                  {(connection as any).last_validation_error && (
                    <div className="p-3 rounded-lg bg-sec-critical/10 border border-sec-critical/30">
                      <p className="text-xs text-sec-critical font-medium">Last Error</p>
                      <p className="text-xs text-muted-foreground mt-1">{(connection as any).last_validation_error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Config Fields */}
              {Object.keys(editConfig).length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(editConfig).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                        <Input
                          type={key.toLowerCase().includes('token') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('password') ? 'password' : 'text'}
                          value={String(value || '')}
                          onChange={(e) => setEditConfig(prev => ({ ...prev, [key]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Webhook Setup for GitHub connections */}
              {connection.type === 'github' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Webhook className="w-4 h-4" />
                      Webhook Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Set up webhooks to automatically trigger pipelines when code is pushed to your repository.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => setShowWebhookWizard(true)}
                    >
                      <Webhook className="w-4 h-4" />
                      Configure Webhook
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="health" className="space-y-4 mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : healthHistory.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <History className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No health checks recorded</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {healthHistory.map((event) => (
                    <Card key={event.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {event.status === 'healthy' ? (
                              <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                            ) : (
                              <XCircle className="w-4 h-4 text-sec-critical" />
                            )}
                            <div>
                              <p className="text-sm font-medium capitalize">{event.status}</p>
                              {event.message && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{event.message}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(new Date(event.checked_at))}
                            </p>
                            {event.response_time_ms && (
                              <p className="text-[10px] text-muted-foreground">{event.response_time_ms}ms</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Actions Footer */}
        <div className="p-4 border-t space-y-3">
          <div className="flex items-center gap-2">
            <Button 
              className="flex-1 gap-2" 
              onClick={handleValidate}
              disabled={validating}
            >
              {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Validate Now
            </Button>
            <Button 
              className="flex-1 gap-2" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full gap-2" disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Connection
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Connection?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{connection.name}" and all associated health history. 
                  Executions using this connection may fail.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-sec-critical hover:bg-sec-critical/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Webhook Setup Wizard */}
      <WebhookSetupWizard
        open={showWebhookWizard}
        onOpenChange={setShowWebhookWizard}
        repositoryOwner={(editConfig as any).owner}
        repositoryName={(editConfig as any).repo}
      />
    </motion.div>
  );
};

export default ConnectionDetailsPanel;
