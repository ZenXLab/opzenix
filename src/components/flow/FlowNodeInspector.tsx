import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Activity, FileText, BarChart3, AlertTriangle, 
  CheckCircle, Clock, RefreshCw, Sparkles, Loader2,
  ChevronDown, ChevronRight, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface FlowNodeInspectorProps {
  nodeId: string | null;
  nodeLabel?: string;
  onClose: () => void;
}

interface TelemetrySignal {
  id: string;
  signal_type: 'trace' | 'log' | 'metric';
  severity: string;
  summary: string;
  payload: any;
  otel_trace_id: string | null;
  otel_span_id: string | null;
  duration_ms: number | null;
  status_code: string | null;
  created_at: string;
}

interface AIAnalysis {
  analysis: string;
  severity: 'info' | 'warning' | 'error';
  evidence: Array<{ traceId: string; finding: string }>;
  recommendations: string[];
}

const severityColors: Record<string, string> = {
  debug: 'text-muted-foreground',
  info: 'text-foreground',
  warning: 'text-sec-warning',
  error: 'text-sec-danger',
  critical: 'text-sec-danger font-bold',
};

const FlowNodeInspector = ({ nodeId, nodeLabel, onClose }: FlowNodeInspectorProps) => {
  const [traces, setTraces] = useState<TelemetrySignal[]>([]);
  const [logs, setLogs] = useState<TelemetrySignal[]>([]);
  const [metrics, setMetrics] = useState<TelemetrySignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);

  useEffect(() => {
    if (!nodeId) {
      setTraces([]);
      setLogs([]);
      setMetrics([]);
      setAiAnalysis(null);
      return;
    }
    
    fetchTelemetry();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`flow-telemetry-${nodeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry_signals',
          filter: `node_id=eq.${nodeId}`,
        },
        (payload) => {
          const signal = payload.new as TelemetrySignal;
          if (signal.signal_type === 'trace') {
            setTraces(prev => [signal, ...prev].slice(0, 50));
          } else if (signal.signal_type === 'log') {
            setLogs(prev => [signal, ...prev].slice(0, 100));
          } else if (signal.signal_type === 'metric') {
            setMetrics(prev => [signal, ...prev].slice(0, 50));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [nodeId]);

  const fetchTelemetry = async () => {
    if (!nodeId) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('telemetry_signals')
        .select('*')
        .eq('node_id', nodeId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Failed to fetch telemetry:', error);
        return;
      }

      const signals = (data || []) as TelemetrySignal[];
      setTraces(signals.filter(s => s.signal_type === 'trace'));
      setLogs(signals.filter(s => s.signal_type === 'log'));
      setMetrics(signals.filter(s => s.signal_type === 'metric'));
    } catch (err) {
      console.error('Telemetry fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const runAIAnalysis = async () => {
    if (!nodeId) return;
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-telemetry-analysis', {
        body: { nodeId }
      });

      if (error) {
        console.error('AI analysis failed:', error);
        return;
      }

      setAiAnalysis(data);
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const time = date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${time}.${ms}`;
  };

  if (!nodeId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-[380px] h-full border-l border-border bg-card flex flex-col shrink-0"
      >
        {/* Header */}
        <div className="h-14 border-b border-border px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{nodeLabel || nodeId}</h3>
              <p className="text-xs text-muted-foreground">OTel Telemetry</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={fetchTelemetry} disabled={isLoading}>
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="px-4 py-3 border-b border-border bg-secondary/20">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-background">
              <div className="text-lg font-bold text-foreground">{traces.length}</div>
              <div className="text-[10px] text-muted-foreground">Traces</div>
            </div>
            <div className="p-2 rounded bg-background">
              <div className="text-lg font-bold text-foreground">{logs.length}</div>
              <div className="text-[10px] text-muted-foreground">Logs</div>
            </div>
            <div className="p-2 rounded bg-background">
              <div className="text-lg font-bold text-foreground">{metrics.length}</div>
              <div className="text-[10px] text-muted-foreground">Metrics</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ai" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-3 grid grid-cols-4 w-auto">
            <TabsTrigger value="ai" className="text-xs gap-1">
              <Sparkles className="w-3 h-3" />
              AI
            </TabsTrigger>
            <TabsTrigger value="traces" className="text-xs gap-1">
              <Activity className="w-3 h-3" />
              Traces
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs gap-1">
              <FileText className="w-3 h-3" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs gap-1">
              <BarChart3 className="w-3 h-3" />
              Metrics
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-4 py-3">
            {/* AI Tab */}
            <TabsContent value="ai" className="mt-0 space-y-3">
              <Button 
                onClick={runAIAnalysis} 
                disabled={isAnalyzing}
                className="w-full gap-2"
                variant={aiAnalysis ? "outline" : "default"}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing telemetry...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    {aiAnalysis ? 'Re-analyze' : 'Run AI Analysis'}
                  </>
                )}
              </Button>

              {aiAnalysis && (
                <div className="space-y-3">
                  {/* Analysis Result */}
                  <div className={cn(
                    "p-3 rounded-lg border",
                    aiAnalysis.severity === 'error' && "border-sec-danger/30 bg-sec-danger/5",
                    aiAnalysis.severity === 'warning' && "border-sec-warning/30 bg-sec-warning/5",
                    aiAnalysis.severity === 'info' && "border-ai-primary/30 bg-ai-primary/5"
                  )}>
                    <div className="flex items-start gap-2">
                      {aiAnalysis.severity === 'error' && <AlertTriangle className="w-4 h-4 text-sec-danger shrink-0 mt-0.5" />}
                      {aiAnalysis.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-sec-warning shrink-0 mt-0.5" />}
                      {aiAnalysis.severity === 'info' && <CheckCircle className="w-4 h-4 text-sec-safe shrink-0 mt-0.5" />}
                      <div>
                        <Badge variant={aiAnalysis.severity === 'error' ? 'destructive' : aiAnalysis.severity === 'warning' ? 'secondary' : 'default'} className="mb-2">
                          {aiAnalysis.severity}
                        </Badge>
                        <p className="text-sm text-foreground leading-relaxed">{aiAnalysis.analysis}</p>
                      </div>
                    </div>
                  </div>

                  {/* Evidence */}
                  {aiAnalysis.evidence.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evidence</h4>
                      {aiAnalysis.evidence.map((e, i) => (
                        <div key={i} className="p-2 bg-secondary/30 rounded text-xs">
                          <span className="font-mono text-muted-foreground">trace:{e.traceId?.substring(0, 8)}...</span>
                          <p className="text-foreground mt-1">{e.finding}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {aiAnalysis.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recommendations</h4>
                      <ul className="space-y-1">
                        {aiAnalysis.recommendations.map((r, i) => (
                          <li key={i} className="text-xs text-foreground flex items-start gap-2">
                            <span className="text-ai-primary">→</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!aiAnalysis && !isAnalyzing && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Click "Run AI Analysis" to get insights based on telemetry data
                </div>
              )}
            </TabsContent>

            {/* Traces Tab */}
            <TabsContent value="traces" className="mt-0 space-y-2">
              {traces.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No traces recorded for this node
                </div>
              ) : (
                traces.map((trace) => (
                  <div key={trace.id} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedTrace(expandedTrace === trace.id ? null : trace.id)}
                      className="w-full p-3 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {expandedTrace === trace.id ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          trace.status_code === 'ERROR' ? 'bg-sec-danger' : 'bg-sec-safe'
                        )} />
                        <span className="text-xs font-mono text-foreground truncate max-w-[160px]">
                          {trace.summary}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {trace.duration_ms && <span>{trace.duration_ms}ms</span>}
                      </div>
                    </button>
                    {expandedTrace === trace.id && (
                      <div className="p-3 border-t border-border bg-secondary/10 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Trace ID: </span>
                            <span className="font-mono text-foreground">{trace.otel_trace_id?.substring(0, 12)}...</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Time: </span>
                            <span className="font-mono text-foreground">{formatTime(trace.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="mt-0 space-y-1">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No logs recorded for this node
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 p-2 rounded hover:bg-secondary/20 text-xs font-mono">
                    <span className="text-muted-foreground shrink-0">{formatTime(log.created_at)}</span>
                    <span className={cn("shrink-0 uppercase w-10", severityColors[log.severity])}>
                      [{log.severity.substring(0, 4)}]
                    </span>
                    <span className="text-foreground break-all">{log.summary}</span>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Metrics Tab */}
            <TabsContent value="metrics" className="mt-0 space-y-2">
              {metrics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No metrics recorded for this node
                </div>
              ) : (
                metrics.map((metric) => (
                  <div key={metric.id} className="p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{metric.summary}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(metric.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </motion.div>
    </AnimatePresence>
  );
};

export default FlowNodeInspector;
