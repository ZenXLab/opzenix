import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, AlertCircle, Info, AlertTriangle, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useRealtimeLogs, LogEntry } from '@/hooks/useRealtimeLogs';

interface ExecutionLogsViewerProps {
  executionId: string;
  nodeId?: string;
  maxHeight?: string;
  showHeader?: boolean;
  autoScroll?: boolean;
}

const levelConfig = {
  info: { icon: Info, className: 'text-blue-400', bg: 'bg-blue-500/10' },
  warn: { icon: AlertTriangle, className: 'text-amber-400', bg: 'bg-amber-500/10' },
  error: { icon: AlertCircle, className: 'text-red-400', bg: 'bg-red-500/10' },
};

export const ExecutionLogsViewer = ({
  executionId,
  nodeId,
  maxHeight = '400px',
  showHeader = true,
  autoScroll = true,
}: ExecutionLogsViewerProps) => {
  const { logs, loading, isStreaming, clearLogs } = useRealtimeLogs({ executionId, nodeId });
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleDownload = () => {
    const content = logs.map(l => 
      `[${new Date(l.created_at).toISOString()}] [${l.level.toUpperCase()}] [${l.node_id}] ${l.message}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-${executionId}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="bg-background border border-border rounded-lg overflow-hidden">
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Execution Logs</span>
            {isStreaming && (
              <Badge variant="outline" className="text-xs animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                Live
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearLogs}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <ScrollArea
        ref={scrollRef}
        className="font-mono text-xs"
        style={{ maxHeight }}
      >
        <div className="p-2 space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Terminal className="h-8 w-8 mb-2 opacity-50" />
              <span>Waiting for logs...</span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {logs.map((log, index) => {
                const config = levelConfig[log.level];
                const Icon = config.icon;

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'flex items-start gap-2 px-2 py-1 rounded',
                      config.bg
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0', config.className)} />
                    <span className="text-muted-foreground flex-shrink-0">
                      {formatTimestamp(log.created_at)}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 flex-shrink-0">
                      {log.node_id}
                    </Badge>
                    <span className={cn('flex-1', config.className)}>
                      {log.message}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default ExecutionLogsViewer;
