import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SystemHealthMetrics {
  uptime: number;
  errorRate: number;
  successRate: number;
  totalSignals: number;
  errorCount: number;
  warningCount: number;
  avgDuration: number;
  activeExecutions: number;
  deploymentsLast24h: number;
  latencyP50: number;
  latencyP95: number;
  status: 'healthy' | 'degraded' | 'critical';
}

export function useSystemHealth() {
  const [metrics, setMetrics] = useState<SystemHealthMetrics>({
    uptime: 99.9,
    errorRate: 0,
    successRate: 100,
    totalSignals: 0,
    errorCount: 0,
    warningCount: 0,
    avgDuration: 0,
    activeExecutions: 0,
    deploymentsLast24h: 0,
    latencyP50: 0,
    latencyP95: 0,
    status: 'healthy',
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

      // Fetch telemetry signals from last 24h
      const [signalsRes, executionsRes, deploymentsRes] = await Promise.all([
        supabase
          .from('telemetry_signals')
          .select('id, signal_type, severity, duration_ms, status_code, created_at')
          .gte('created_at', last24h)
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('executions')
          .select('id, status')
          .eq('status', 'running'),
        supabase
          .from('deployments')
          .select('id, status')
          .gte('deployed_at', last24h),
      ]);

      const signals = signalsRes.data || [];
      const activeExecutions = (executionsRes.data || []).length;
      const deploymentsLast24h = (deploymentsRes.data || []).length;

      // Calculate metrics
      const totalSignals = signals.length;
      const errorSignals = signals.filter(s => s.severity === 'error' || s.status_code === 'ERROR');
      const warningSignals = signals.filter(s => s.severity === 'warn' || s.severity === 'warning');
      const errorCount = errorSignals.length;
      const warningCount = warningSignals.length;

      const errorRate = totalSignals > 0 ? (errorCount / totalSignals) * 100 : 0;
      const successRate = totalSignals > 0 ? ((totalSignals - errorCount) / totalSignals) * 100 : 100;

      // Calculate latency percentiles
      const durations = signals
        .filter(s => s.duration_ms !== null && s.duration_ms > 0)
        .map(s => s.duration_ms as number)
        .sort((a, b) => a - b);

      const avgDuration = durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0;

      const latencyP50 = durations.length > 0 
        ? durations[Math.floor(durations.length * 0.5)] 
        : 0;

      const latencyP95 = durations.length > 0 
        ? durations[Math.floor(durations.length * 0.95)] 
        : 0;

      // Calculate uptime (based on error signals in last hour)
      const recentSignals = signals.filter(s => new Date(s.created_at) >= new Date(lastHour));
      const recentErrors = recentSignals.filter(s => s.severity === 'error').length;
      const uptime = recentSignals.length > 0 
        ? Math.max(0, 100 - (recentErrors / recentSignals.length) * 100)
        : 99.9;

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
      if (errorRate > 10 || uptime < 95) {
        status = 'critical';
      } else if (errorRate > 5 || uptime < 99 || warningCount > 10) {
        status = 'degraded';
      }

      setMetrics({
        uptime: Math.round(uptime * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        totalSignals,
        errorCount,
        warningCount,
        avgDuration: Math.round(avgDuration),
        activeExecutions,
        deploymentsLast24h,
        latencyP50: Math.round(latencyP50),
        latencyP95: Math.round(latencyP95),
        status,
      });
    } catch (error) {
      console.error('[SystemHealth] Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();

    // Subscribe to real-time updates
    const telemetryChannel = supabase
      .channel('system-health-telemetry')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'telemetry_signals'
      }, () => {
        // Refetch on new signals
        fetchMetrics();
      })
      .subscribe();

    const executionsChannel = supabase
      .channel('system-health-executions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'executions'
      }, () => {
        fetchMetrics();
      })
      .subscribe();

    // Also poll every 30 seconds as backup
    const interval = setInterval(fetchMetrics, 30000);

    return () => {
      supabase.removeChannel(telemetryChannel);
      supabase.removeChannel(executionsChannel);
      clearInterval(interval);
    };
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    refetch: fetchMetrics,
  };
}
