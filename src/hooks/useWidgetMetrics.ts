import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WidgetMetric {
  id: string;
  widget_type: string;
  metric_name: string;
  metric_value: number | null;
  metadata: Record<string, any>;
  recorded_at: string;
}

export interface AggregatedMetrics {
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  activeFlows: number;
  pendingApprovals: number;
  failedToday: number;
  deploymentsToday: number;
  securityIssues: number;
}

export const useWidgetMetrics = () => {
  const [metrics, setMetrics] = useState<WidgetMetric[]>([]);
  const [aggregated, setAggregated] = useState<AggregatedMetrics>({
    totalExecutions: 0,
    successRate: 0,
    avgDuration: 0,
    activeFlows: 0,
    pendingApprovals: 0,
    failedToday: 0,
    deploymentsToday: 0,
    securityIssues: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch and compute aggregated metrics from actual data
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);

      // Get execution stats
      const { data: executions } = await supabase
        .from('executions')
        .select('id, status, started_at, completed_at')
        .order('started_at', { ascending: false })
        .limit(100);

      // Get today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      const { data: todayExecs } = await supabase
        .from('executions')
        .select('id, status')
        .gte('started_at', todayStr);

      // Get pending approvals
      const { data: pendingApprovals } = await supabase
        .from('approval_requests')
        .select('id')
        .eq('status', 'pending');

      // Get deployments today
      const { data: todayDeployments } = await supabase
        .from('deployments')
        .select('id')
        .gte('deployed_at', todayStr);

      // Get active (running) executions
      const { data: activeExecs } = await supabase
        .from('executions')
        .select('id')
        .eq('status', 'running');

      // Calculate metrics
      const total = executions?.length || 0;
      const successful = executions?.filter(e => e.status === 'success').length || 0;
      const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

      // Calculate average duration
      const completedExecs = executions?.filter(e => e.completed_at && e.started_at) || [];
      const totalDuration = completedExecs.reduce((acc, e) => {
        const duration = new Date(e.completed_at!).getTime() - new Date(e.started_at).getTime();
        return acc + duration;
      }, 0);
      const avgDuration = completedExecs.length > 0 ? Math.round(totalDuration / completedExecs.length / 1000) : 0;

      const failedToday = todayExecs?.filter(e => e.status === 'failed').length || 0;

      setAggregated({
        totalExecutions: total,
        successRate,
        avgDuration,
        activeFlows: activeExecs?.length || 0,
        pendingApprovals: pendingApprovals?.length || 0,
        failedToday,
        deploymentsToday: todayDeployments?.length || 0,
        securityIssues: 0, // Would need security scans table
      });

      // Fetch widget-specific metrics
      const { data: widgetMetrics } = await supabase
        .from('widget_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(100);

      setMetrics(widgetMetrics || []);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get metrics for a specific widget type
  const getWidgetMetrics = useCallback((widgetType: string): WidgetMetric[] => {
    return metrics.filter(m => m.widget_type === widgetType);
  }, [metrics]);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchMetrics();

    // Set up realtime subscription for metrics
    const metricsChannel = supabase
      .channel('widget-metrics')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'widget_metrics' },
        (payload) => {
          const raw = payload.new as any;
          const newMetric: WidgetMetric = {
            id: raw.id,
            widget_type: raw.widget_type,
            metric_name: raw.metric_name,
            metric_value: raw.metric_value,
            metadata: (typeof raw.metadata === 'object' ? raw.metadata : {}) as Record<string, any>,
            recorded_at: raw.recorded_at,
          };
          setMetrics(prev => [newMetric, ...prev.slice(0, 99)]);
        }
      )
      .subscribe();

    // Also subscribe to execution changes to update aggregates
    const execChannel = supabase
      .channel('exec-metrics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'executions' },
        () => {
          // Refetch metrics when executions change
          fetchMetrics();
        }
      )
      .subscribe();

    // Refresh metrics periodically
    const interval = setInterval(fetchMetrics, 60000);

    return () => {
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(execChannel);
      clearInterval(interval);
    };
  }, [fetchMetrics]);

  return {
    metrics,
    aggregated,
    loading,
    refetch: fetchMetrics,
    getWidgetMetrics,
  };
};
