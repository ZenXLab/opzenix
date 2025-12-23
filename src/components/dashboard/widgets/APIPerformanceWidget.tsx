import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Gauge, ArrowUp, ArrowDown } from 'lucide-react';
import WidgetWrapper from './WidgetWrapper';
import { cn } from '@/lib/utils';

const apiData = [
  { endpoint: '/api/users', latency: 45, requests: 12400, status: 'healthy' },
  { endpoint: '/api/orders', latency: 128, requests: 8200, status: 'degraded' },
  { endpoint: '/api/products', latency: 52, requests: 15600, status: 'healthy' },
  { endpoint: '/api/payments', latency: 89, requests: 4300, status: 'healthy' },
  { endpoint: '/api/analytics', latency: 234, requests: 2100, status: 'slow' },
  { endpoint: '/api/search', latency: 67, requests: 9800, status: 'healthy' },
];

interface APIPerformanceWidgetProps {
  id: string;
  onRemove?: (id: string) => void;
}

const APIPerformanceWidget = ({ id, onRemove }: APIPerformanceWidgetProps) => {
  const avgLatency = apiData.reduce((sum, d) => sum + d.latency, 0) / apiData.length;
  const totalRequests = apiData.reduce((sum, d) => sum + d.requests, 0);

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'hsl(var(--sec-safe))';
    if (latency < 200) return 'hsl(var(--sec-warning))';
    return 'hsl(var(--sec-critical))';
  };

  return (
    <WidgetWrapper
      id={id}
      title="API Performance"
      icon={<Gauge className="w-3.5 h-3.5 text-ai-primary" />}
      onRemove={onRemove}
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 bg-secondary/30 rounded">
          <p className="text-[10px] text-muted-foreground">Avg Latency</p>
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold text-foreground">{avgLatency.toFixed(0)}ms</p>
            <ArrowDown className="w-3 h-3 text-sec-safe" />
          </div>
        </div>
        <div className="p-2 bg-secondary/30 rounded">
          <p className="text-[10px] text-muted-foreground">Total Requests</p>
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold text-foreground">{(totalRequests / 1000).toFixed(1)}K</p>
            <ArrowUp className="w-3 h-3 text-sec-safe" />
          </div>
        </div>
      </div>

      {/* Latency Chart */}
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={apiData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="endpoint" 
              width={80}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '11px'
              }}
              formatter={(value: number) => [`${value}ms`, 'Latency']}
            />
            <Bar dataKey="latency" radius={[0, 4, 4, 0]}>
              {apiData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getLatencyColor(entry.latency)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status Legend */}
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-sec-safe" />
          <span className="text-muted-foreground">&lt;100ms</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-sec-warning" />
          <span className="text-muted-foreground">100-200ms</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-sec-critical" />
          <span className="text-muted-foreground">&gt;200ms</span>
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default APIPerformanceWidget;
