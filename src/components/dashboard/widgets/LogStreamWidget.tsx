import { useState, useEffect, useRef } from 'react';
import { Terminal, Pause, Play, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import WidgetWrapper from './WidgetWrapper';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  message: string;
}

const generateLogEntry = (id: number): LogEntry => {
  const levels: LogEntry['level'][] = ['info', 'info', 'info', 'warn', 'error', 'debug'];
  const services = ['api-gateway', 'auth-service', 'payment-svc', 'ml-engine', 'cache'];
  const messages = [
    'Request processed successfully',
    'Connection established',
    'Cache miss, fetching from DB',
    'Rate limit threshold reached',
    'Failed to connect to database',
    'Debug: Memory usage at 68%',
    'User authentication successful',
    'Webhook delivered',
    'Background job completed',
    'Warning: High latency detected',
  ];
  
  const now = new Date();
  return {
    id: `log-${id}`,
    timestamp: now.toISOString().split('T')[1].slice(0, 12),
    level: levels[Math.floor(Math.random() * levels.length)],
    service: services[Math.floor(Math.random() * services.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
  };
};

const levelColors = {
  info: 'text-ai-primary',
  warn: 'text-sec-warning',
  error: 'text-sec-critical',
  debug: 'text-muted-foreground',
};

const levelBg = {
  info: 'bg-ai-primary/10',
  warn: 'bg-sec-warning/10',
  error: 'bg-sec-critical/10',
  debug: 'bg-muted/20',
};

interface LogStreamWidgetProps {
  id: string;
  onRemove?: (id: string) => void;
}

const LogStreamWidget = ({ id, onRemove }: LogStreamWidgetProps) => {
  const [logs, setLogs] = useState<LogEntry[]>(() => 
    Array.from({ length: 20 }, (_, i) => generateLogEntry(i))
  );
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<LogEntry['level'] | 'all'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setLogs(prev => [...prev.slice(-50), generateLogEntry(Date.now())]);
    }, 1500);
    
    return () => clearInterval(interval);
  }, [isPaused]);

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter);

  return (
    <WidgetWrapper
      id={id}
      title="Live Logs"
      icon={<Terminal className="w-3.5 h-3.5 text-ai-primary" />}
      onRemove={onRemove}
      className="col-span-2"
    >
      {/* Controls */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
        <div className="flex items-center gap-1">
          {(['all', 'info', 'warn', 'error', 'debug'] as const).map((level) => (
            <Button
              key={level}
              variant={filter === level ? 'secondary' : 'ghost'}
              size="sm"
              className="h-5 px-1.5 text-[10px] capitalize"
              onClick={() => setFilter(level)}
            >
              {level}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Log Stream */}
      <ScrollArea className="h-36" ref={scrollRef}>
        <div className="space-y-0.5 font-mono text-[10px]">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 py-0.5 hover:bg-secondary/20 px-1 rounded"
            >
              <span className="text-muted-foreground shrink-0">{log.timestamp}</span>
              <Badge variant="outline" className={cn("h-4 px-1 text-[8px] uppercase shrink-0", levelColors[log.level], levelBg[log.level])}>
                {log.level}
              </Badge>
              <span className="text-primary/70 shrink-0">[{log.service}]</span>
              <span className="text-foreground truncate">{log.message}</span>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground">
        <span>{filteredLogs.length} entries</span>
        <div className="flex items-center gap-1">
          <span className={cn("w-1.5 h-1.5 rounded-full", isPaused ? "bg-sec-warning" : "bg-sec-safe animate-pulse")} />
          <span>{isPaused ? 'Paused' : 'Streaming'}</span>
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default LogStreamWidget;
