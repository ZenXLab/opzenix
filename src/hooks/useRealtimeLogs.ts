import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LogEntry {
  id: string;
  execution_id: string;
  node_id: string;
  message: string;
  level: 'info' | 'warn' | 'error';
  created_at: string;
}

interface UseRealtimeLogsOptions {
  executionId: string;
  nodeId?: string;
  maxLogs?: number;
}

export const useRealtimeLogs = ({ executionId, nodeId, maxLogs = 200 }: UseRealtimeLogsOptions) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const logsRef = useRef<LogEntry[]>([]);

  // Fetch initial logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('execution_logs')
        .select('*')
        .eq('execution_id', executionId)
        .order('created_at', { ascending: true })
        .limit(maxLogs);

      if (nodeId) {
        query = query.eq('node_id', nodeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedLogs: LogEntry[] = (data || []).map((log: any) => ({
        id: log.id,
        execution_id: log.execution_id,
        node_id: log.node_id,
        message: log.message,
        level: log.level as 'info' | 'warn' | 'error',
        created_at: log.created_at,
      }));

      setLogs(mappedLogs);
      logsRef.current = mappedLogs;
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }, [executionId, nodeId, maxLogs]);

  // Subscribe to realtime log updates
  useEffect(() => {
    fetchLogs();

    const filter = nodeId
      ? `execution_id=eq.${executionId},node_id=eq.${nodeId}`
      : `execution_id=eq.${executionId}`;

    const channel = supabase
      .channel(`logs-${executionId}-${nodeId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'execution_logs',
          filter,
        },
        (payload) => {
          const newLog: LogEntry = {
            id: payload.new.id,
            execution_id: payload.new.execution_id,
            node_id: payload.new.node_id,
            message: payload.new.message,
            level: payload.new.level as 'info' | 'warn' | 'error',
            created_at: payload.new.created_at,
          };

          setLogs(prev => {
            const updated = [...prev, newLog];
            // Keep only the last maxLogs entries
            return updated.slice(-maxLogs);
          });
          setIsStreaming(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [executionId, nodeId, maxLogs, fetchLogs]);

  // Group logs by node
  const logsByNode = useCallback(() => {
    return logs.reduce((acc, log) => {
      if (!acc[log.node_id]) {
        acc[log.node_id] = [];
      }
      acc[log.node_id].push(log);
      return acc;
    }, {} as Record<string, LogEntry[]>);
  }, [logs]);

  // Get only error logs
  const errorLogs = useCallback(() => {
    return logs.filter(l => l.level === 'error');
  }, [logs]);

  // Clear logs (local only)
  const clearLogs = useCallback(() => {
    setLogs([]);
    logsRef.current = [];
  }, []);

  return {
    logs,
    loading,
    isStreaming,
    logsByNode,
    errorLogs,
    clearLogs,
    refetch: fetchLogs,
  };
};
