import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';
import WidgetWrapper from './WidgetWrapper';

const deploymentData = [
  { date: 'Mon', deployments: 12, success: 11, failed: 1 },
  { date: 'Tue', deployments: 19, success: 18, failed: 1 },
  { date: 'Wed', deployments: 15, success: 14, failed: 1 },
  { date: 'Thu', deployments: 22, success: 21, failed: 1 },
  { date: 'Fri', deployments: 28, success: 27, failed: 1 },
  { date: 'Sat', deployments: 8, success: 8, failed: 0 },
  { date: 'Sun', deployments: 5, success: 5, failed: 0 },
];

interface DeploymentGraphWidgetProps {
  id: string;
  onRemove?: (id: string) => void;
}

const DeploymentGraphWidget = ({ id, onRemove }: DeploymentGraphWidgetProps) => {
  return (
    <WidgetWrapper
      id={id}
      title="Deployment Trends"
      icon={<TrendingUp className="w-3.5 h-3.5 text-ai-primary" />}
      onRemove={onRemove}
    >
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={deploymentData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="deployGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--ai-primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--ai-primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--sec-critical))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--sec-critical))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Area
              type="monotone"
              dataKey="success"
              stroke="hsl(var(--ai-primary))"
              fill="url(#deployGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="failed"
              stroke="hsl(var(--sec-critical))"
              fill="url(#failedGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-ai-primary" />
          <span className="text-muted-foreground">Success</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-sec-critical" />
          <span className="text-muted-foreground">Failed</span>
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default DeploymentGraphWidget;
