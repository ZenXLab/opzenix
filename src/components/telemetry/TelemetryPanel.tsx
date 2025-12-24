import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Radio, Activity, FileText, BarChart3, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface TelemetryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TelemetrySignal {
  id: string;
  signal_type: string;
  summary: string | null;
  severity: string | null;
  created_at: string;
  node_id: string | null;
  execution_id: string | null;
  flow_id: string | null;
  otel_trace_id: string | null;
  duration_ms: number | null;
}

const TelemetryPanel = ({ isOpen, onClose }: TelemetryPanelProps) => {
  const [signals, setSignals] = useState<TelemetrySignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({ traces: 0, logs: 0, metrics: 0 });

  useEffect(() => {
    if (isOpen) {
      fetchSignals();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('telemetry-panel')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry_signals',
        }, (payload) => {
          setSignals(prev => [payload.new as TelemetrySignal, ...prev].slice(0, 100));
          updateStats([payload.new as TelemetrySignal, ...signals]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [isOpen]);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('telemetry_signals')
        .select('id, signal_type, summary, severity, created_at, node_id, execution_id, flow_id, otel_trace_id, duration_ms')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSignals(data || []);
      updateStats(data || []);
    } catch (err) {
      console.error('Failed to fetch signals:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (data: TelemetrySignal[]) => {
    setStats({
      traces: data.filter(s => s.signal_type === 'trace').length,
      logs: data.filter(s => s.signal_type === 'log').length,
      metrics: data.filter(s => s.signal_type === 'metric').length,
    });
  };

  const filteredSignals = activeTab === 'all' 
    ? signals 
    : signals.filter(s => s.signal_type === activeTab);

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case 'error': return 'text-sec-critical bg-sec-critical/10';
      case 'warn': return 'text-sec-warning bg-sec-warning/10';
      case 'info': return 'text-ai-primary bg-ai-primary/10';
      default: return 'text-muted-foreground bg-secondary';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 h-full w-full max-w-2xl bg-card border-l border-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-ai-primary" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">OTel Signals</h2>
                  <p className="text-xs text-muted-foreground">Real-time telemetry data</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={fetchSignals} disabled={loading}>
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 p-4 border-b border-border">
              <div className="p-3 bg-secondary/30 rounded-lg text-center">
                <Activity className="w-4 h-4 text-ai-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{stats.traces}</p>
                <p className="text-xs text-muted-foreground">Traces</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg text-center">
                <FileText className="w-4 h-4 text-sec-warning mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{stats.logs}</p>
                <p className="text-xs text-muted-foreground">Logs</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg text-center">
                <BarChart3 className="w-4 h-4 text-sec-safe mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{stats.metrics}</p>
                <p className="text-xs text-muted-foreground">Metrics</p>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <div className="px-4 pt-3">
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                  <TabsTrigger value="trace" className="flex-1">Traces</TabsTrigger>
                  <TabsTrigger value="log" className="flex-1">Logs</TabsTrigger>
                  <TabsTrigger value="metric" className="flex-1">Metrics</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="mt-0 flex-1">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="p-4 space-y-2">
                    {filteredSignals.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Radio className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No signals found</p>
                        <p className="text-xs mt-1">Telemetry data will appear here in real-time</p>
                      </div>
                    ) : (
                      filteredSignals.map((signal) => (
                        <div
                          key={signal.id}
                          className="p-3 bg-secondary/20 border border-border rounded-lg hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={cn("text-[10px]", getSeverityColor(signal.severity))}>
                                  {signal.signal_type}
                                </Badge>
                                {signal.severity && (
                                  <Badge variant="outline" className={cn("text-[10px]", getSeverityColor(signal.severity))}>
                                    {signal.severity}
                                  </Badge>
                                )}
                                {signal.duration_ms && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {signal.duration_ms}ms
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-foreground truncate">
                                {signal.summary || 'No summary'}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                                {signal.node_id && (
                                  <span>Node: {signal.node_id}</span>
                                )}
                                {signal.otel_trace_id && (
                                  <span className="font-mono truncate max-w-[120px]">
                                    {signal.otel_trace_id.slice(0, 16)}...
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {new Date(signal.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TelemetryPanel;
