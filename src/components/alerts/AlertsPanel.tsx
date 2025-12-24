import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2,
  Activity,
  Brain,
  Clock,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  nodeId?: string;
  flowId?: string;
  traceId?: string;
  recommendation?: string;
  createdAt: string;
  acknowledged: boolean;
}

interface AlertsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Alert thresholds
const THRESHOLDS = {
  errorRatePercent: 5,
  latencyMs: 1000,
  errorsPerMinute: 10,
};

const AlertsPanel = ({ isOpen, onClose }: AlertsPanelProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkThresholds();
      const interval = setInterval(checkThresholds, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Real-time subscription for new errors
  useEffect(() => {
    const channel = supabase
      .channel('alert-telemetry')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry_signals',
          filter: 'severity=eq.error'
        },
        (payload) => {
          const signal = payload.new as any;
          const newAlert: Alert = {
            id: `alert-${Date.now()}`,
            type: 'error',
            title: 'Error Detected',
            message: signal.summary || 'An error occurred in the pipeline',
            nodeId: signal.node_id,
            flowId: signal.flow_id,
            traceId: signal.otel_trace_id,
            createdAt: new Date().toISOString(),
            acknowledged: false,
          };
          setAlerts(prev => [newAlert, ...prev]);
          
          if (soundEnabled) {
            // Play notification sound (browser API)
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2telegs=');
              audio.volume = 0.3;
              audio.play().catch(() => {});
            } catch {}
          }
          
          toast.error(`Alert: ${newAlert.title}`, {
            description: newAlert.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled]);

  const checkThresholds = async () => {
    setLoading(true);
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
      
      const { data: recentSignals } = await supabase
        .from('telemetry_signals')
        .select('*')
        .gte('created_at', fiveMinutesAgo);

      if (!recentSignals) return;

      const newAlerts: Alert[] = [];

      // Check error rate
      const totalSignals = recentSignals.length;
      const errorSignals = recentSignals.filter(s => s.severity === 'error').length;
      const errorRate = totalSignals > 0 ? (errorSignals / totalSignals) * 100 : 0;

      if (errorRate > THRESHOLDS.errorRatePercent) {
        newAlerts.push({
          id: `threshold-error-rate-${Date.now()}`,
          type: 'warning',
          title: 'High Error Rate',
          message: `Error rate is ${errorRate.toFixed(1)}% (threshold: ${THRESHOLDS.errorRatePercent}%)`,
          recommendation: 'Review recent deployments and check service health. Consider rolling back if errors persist.',
          createdAt: new Date().toISOString(),
          acknowledged: false,
        });
      }

      // Check latency
      const latencySignals = recentSignals.filter(s => s.duration_ms);
      const avgLatency = latencySignals.length > 0 
        ? latencySignals.reduce((a, b) => a + (b.duration_ms || 0), 0) / latencySignals.length
        : 0;

      if (avgLatency > THRESHOLDS.latencyMs) {
        newAlerts.push({
          id: `threshold-latency-${Date.now()}`,
          type: 'warning',
          title: 'High Latency Detected',
          message: `Average latency is ${Math.round(avgLatency)}ms (threshold: ${THRESHOLDS.latencyMs}ms)`,
          recommendation: 'Check database performance, external API dependencies, and resource utilization.',
          createdAt: new Date().toISOString(),
          acknowledged: false,
        });
      }

      // Check errors per minute
      const errorsPerMin = errorSignals / 5; // 5-minute window
      if (errorsPerMin > THRESHOLDS.errorsPerMinute) {
        newAlerts.push({
          id: `threshold-errors-per-min-${Date.now()}`,
          type: 'error',
          title: 'Error Spike',
          message: `${errorsPerMin.toFixed(1)} errors/min detected (threshold: ${THRESHOLDS.errorsPerMinute})`,
          recommendation: 'Immediate investigation required. Check recent code changes and infrastructure status.',
          createdAt: new Date().toISOString(),
          acknowledged: false,
        });
      }

      // Group by node for AI recommendation
      const nodeErrors = recentSignals
        .filter(s => s.severity === 'error' && s.node_id)
        .reduce((acc, s) => {
          acc[s.node_id!] = (acc[s.node_id!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const hotspotNode = Object.entries(nodeErrors).sort((a, b) => b[1] - a[1])[0];
      if (hotspotNode && hotspotNode[1] > 3) {
        newAlerts.push({
          id: `ai-hotspot-${Date.now()}`,
          type: 'info',
          title: 'AI Insight: Error Hotspot',
          message: `Node "${hotspotNode[0]}" has ${hotspotNode[1]} errors in the last 5 minutes`,
          nodeId: hotspotNode[0],
          recommendation: `Consider adding retries, circuit breakers, or investigating the root cause in ${hotspotNode[0]}.`,
          createdAt: new Date().toISOString(),
          acknowledged: false,
        });
      }

      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev.slice(0, 50)]);
      }
    } catch (err) {
      console.error('Failed to check thresholds:', err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const clearAcknowledged = () => {
    setAlerts(prev => prev.filter(a => !a.acknowledged));
  };

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-14 bottom-0 w-96 bg-card border-l border-border shadow-xl z-40 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Alerts</h2>
              {unacknowledgedCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-sec-critical/10 text-sec-critical rounded-full">
                  {unacknowledgedCount}
                </span>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 gap-1.5"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="text-xs">{soundEnabled ? 'Sound On' : 'Muted'}</span>
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={clearAcknowledged}
            >
              Clear Read
            </Button>
          </div>
        </div>

        {/* Thresholds Summary */}
        <div className="p-3 border-b border-border bg-secondary/30">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Active Thresholds</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-muted-foreground">Errors</div>
              <div className="font-medium text-foreground">{THRESHOLDS.errorRatePercent}%</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Latency</div>
              <div className="font-medium text-foreground">{THRESHOLDS.latencyMs}ms</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Err/min</div>
              <div className="font-medium text-foreground">{THRESHOLDS.errorsPerMinute}</div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {loading && alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Checking thresholds...</div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-8 h-8 text-sec-safe mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active alerts</p>
                <p className="text-xs text-muted-foreground">All systems operating normally</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert} 
                  onAcknowledge={() => acknowledgeAlert(alert.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
};

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: () => void;
}

const AlertCard = ({ alert, onAcknowledge }: AlertCardProps) => {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-sec-critical" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-sec-warning" />;
      default:
        return <Brain className="w-4 h-4 text-ai-primary" />;
    }
  };

  const getBgClass = () => {
    if (alert.acknowledged) return 'bg-secondary/30 opacity-60';
    switch (alert.type) {
      case 'error':
        return 'bg-sec-critical/5 border-sec-critical/20';
      case 'warning':
        return 'bg-sec-warning/5 border-sec-warning/20';
      default:
        return 'bg-ai-primary/5 border-ai-primary/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-lg border ${getBgClass()} transition-opacity`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getAlertIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{alert.title}</span>
            {!alert.acknowledged && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 px-2 text-[10px]"
                onClick={onAcknowledge}
              >
                Mark Read
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
          
          {alert.recommendation && (
            <div className="mt-2 p-2 rounded bg-background/50">
              <div className="flex items-center gap-1.5 text-[10px] text-ai-primary font-medium mb-1">
                <Brain className="w-3 h-3" />
                AI Recommendation
              </div>
              <p className="text-xs text-foreground">{alert.recommendation}</p>
            </div>
          )}

          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(alert.createdAt).toLocaleTimeString()}
            </span>
            {alert.nodeId && <span className="font-mono">{alert.nodeId}</span>}
            {alert.traceId && <span className="font-mono truncate max-w-[80px]">{alert.traceId}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AlertsPanel;
