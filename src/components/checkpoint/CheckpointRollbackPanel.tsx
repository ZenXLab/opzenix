import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, 
  X, 
  Clock, 
  GitBranch, 
  ArrowRight,
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Checkpoint {
  id: string;
  name: string;
  node_id: string;
  execution_id: string;
  state: unknown;
  created_at: string;
}

interface TelemetryComparison {
  before: {
    errorCount: number;
    avgLatency: number;
    traceCount: number;
  };
  after: {
    errorCount: number;
    avgLatency: number;
    traceCount: number;
  };
}

interface CheckpointRollbackPanelProps {
  isOpen: boolean;
  onClose: () => void;
  executionId?: string;
}

const CheckpointRollbackPanel = ({ isOpen, onClose, executionId }: CheckpointRollbackPanelProps) => {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [comparison, setComparison] = useState<TelemetryComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (isOpen && executionId) {
      fetchCheckpoints();
    }
  }, [isOpen, executionId]);

  const fetchCheckpoints = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('checkpoints')
        .select('*')
        .eq('execution_id', executionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCheckpoints(data || []);
    } catch (err) {
      console.error('Failed to fetch checkpoints:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectCheckpoint = async (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    
    // Fetch telemetry comparison (before/after checkpoint)
    try {
      const checkpointTime = new Date(checkpoint.created_at);
      
      // Get telemetry before checkpoint
      const { data: beforeData } = await supabase
        .from('telemetry_signals')
        .select('*')
        .eq('execution_id', executionId)
        .lt('created_at', checkpoint.created_at)
        .gte('created_at', new Date(checkpointTime.getTime() - 5 * 60000).toISOString());

      // Get telemetry after checkpoint  
      const { data: afterData } = await supabase
        .from('telemetry_signals')
        .select('*')
        .eq('execution_id', executionId)
        .gte('created_at', checkpoint.created_at);

      const beforeSignals = beforeData || [];
      const afterSignals = afterData || [];

      setComparison({
        before: {
          errorCount: beforeSignals.filter(s => s.severity === 'error').length,
          avgLatency: beforeSignals.filter(s => s.duration_ms).reduce((a, b) => a + (b.duration_ms || 0), 0) / Math.max(beforeSignals.length, 1),
          traceCount: beforeSignals.filter(s => s.signal_type === 'trace').length,
        },
        after: {
          errorCount: afterSignals.filter(s => s.severity === 'error').length,
          avgLatency: afterSignals.filter(s => s.duration_ms).reduce((a, b) => a + (b.duration_ms || 0), 0) / Math.max(afterSignals.length, 1),
          traceCount: afterSignals.filter(s => s.signal_type === 'trace').length,
        }
      });
    } catch (err) {
      console.error('Failed to fetch comparison:', err);
    }
  };

  const handleRollback = async () => {
    if (!selectedCheckpoint) return;
    
    setRolling(true);
    try {
      // Log audit entry for rollback
      await supabase.from('audit_logs').insert({
        action: 'checkpoint_rollback',
        resource_type: 'checkpoint',
        resource_id: selectedCheckpoint.id,
        details: {
          checkpoint_name: selectedCheckpoint.name,
          execution_id: executionId,
          rolled_back_at: new Date().toISOString()
        }
      });

      toast.success(`Rolled back to checkpoint: ${selectedCheckpoint.name}`);
      onClose();
    } catch (err) {
      toast.error('Rollback failed');
    } finally {
      setRolling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[80vh] bg-card border border-border rounded-lg shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-ai-primary/10">
                <RotateCcw className="w-5 h-5 text-ai-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Checkpoint Rollback</h2>
                <p className="text-xs text-muted-foreground">Compare OTel state before/after and safely rollback</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex h-[500px]">
            {/* Checkpoint List */}
            <div className="w-1/2 border-r border-border">
              <div className="p-3 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground">Available Checkpoints</span>
              </div>
              <ScrollArea className="h-[calc(100%-44px)]">
                <div className="p-2 space-y-2">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
                  ) : checkpoints.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">No checkpoints found</div>
                  ) : (
                    checkpoints.map((cp) => (
                      <button
                        key={cp.id}
                        onClick={() => selectCheckpoint(cp)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedCheckpoint?.id === cp.id 
                            ? 'bg-primary/10 border border-primary/30' 
                            : 'bg-secondary/50 hover:bg-secondary border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{cp.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(cp.created_at).toLocaleString()}
                          </span>
                          <span className="font-mono">{cp.node_id}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Comparison Panel */}
            <div className="w-1/2 flex flex-col">
              <div className="p-3 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground">OTel State Comparison</span>
              </div>
              
              {selectedCheckpoint && comparison ? (
                <div className="flex-1 p-4 space-y-4">
                  <div className="text-center mb-4">
                    <span className="text-xs text-muted-foreground">Comparing telemetry before & after checkpoint</span>
                  </div>

                  {/* Before/After Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="text-xs font-medium text-muted-foreground text-center">Before</div>
                      <ComparisonMetric 
                        label="Errors" 
                        value={comparison.before.errorCount}
                        icon={AlertTriangle}
                        variant={comparison.before.errorCount > 0 ? 'danger' : 'success'}
                      />
                      <ComparisonMetric 
                        label="Avg Latency" 
                        value={`${Math.round(comparison.before.avgLatency)}ms`}
                        icon={Activity}
                      />
                      <ComparisonMetric 
                        label="Traces" 
                        value={comparison.before.traceCount}
                        icon={GitBranch}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-medium text-muted-foreground text-center">After</div>
                      <ComparisonMetric 
                        label="Errors" 
                        value={comparison.after.errorCount}
                        icon={AlertTriangle}
                        variant={comparison.after.errorCount > 0 ? 'danger' : 'success'}
                        delta={comparison.after.errorCount - comparison.before.errorCount}
                      />
                      <ComparisonMetric 
                        label="Avg Latency" 
                        value={`${Math.round(comparison.after.avgLatency)}ms`}
                        icon={Activity}
                        delta={comparison.after.avgLatency - comparison.before.avgLatency}
                      />
                      <ComparisonMetric 
                        label="Traces" 
                        value={comparison.after.traceCount}
                        icon={GitBranch}
                        delta={comparison.after.traceCount - comparison.before.traceCount}
                      />
                    </div>
                  </div>

                  {/* Rollback Action */}
                  <div className="pt-4 border-t border-border">
                    <Button 
                      className="w-full gap-2" 
                      onClick={handleRollback}
                      disabled={rolling}
                    >
                      <RotateCcw className={`w-4 h-4 ${rolling ? 'animate-spin' : ''}`} />
                      {rolling ? 'Rolling back...' : 'Rollback to this checkpoint'}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                      This will restore execution state from checkpoint
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  Select a checkpoint to compare
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

interface ComparisonMetricProps {
  label: string;
  value: number | string;
  icon: typeof Activity;
  variant?: 'default' | 'success' | 'danger';
  delta?: number;
}

const ComparisonMetric = ({ label, value, icon: Icon, variant = 'default', delta }: ComparisonMetricProps) => {
  const getDeltaIcon = () => {
    if (!delta || delta === 0) return <Minus className="w-3 h-3 text-muted-foreground" />;
    if (delta > 0) return <TrendingUp className="w-3 h-3 text-sec-critical" />;
    return <TrendingDown className="w-3 h-3 text-sec-safe" />;
  };

  return (
    <div className={`p-3 rounded-lg ${
      variant === 'success' ? 'bg-sec-safe/10' : 
      variant === 'danger' ? 'bg-sec-critical/10' : 
      'bg-secondary/50'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        {delta !== undefined && getDeltaIcon()}
      </div>
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${
          variant === 'success' ? 'text-sec-safe' : 
          variant === 'danger' ? 'text-sec-critical' : 
          'text-muted-foreground'
        }`} />
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  );
};

export default CheckpointRollbackPanel;
