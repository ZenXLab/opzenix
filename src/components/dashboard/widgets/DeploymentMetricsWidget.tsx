import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  CheckCircle2, 
  Clock,
  BarChart3,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeploymentMetrics {
  environment: string;
  frequency: number; // deployments per day
  successRate: number; // percentage
  mttr: number; // minutes
  totalDeployments: number;
  failedDeployments: number;
  avgRecoveryTime: number;
}

const DeploymentMetricsWidget = () => {
  const [metrics, setMetrics] = useState<DeploymentMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnv, setSelectedEnv] = useState<string>('all');

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Get deployments from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: deployments, error } = await supabase
        .from('deployments')
        .select('*')
        .gte('deployed_at', thirtyDaysAgo.toISOString())
        .order('deployed_at', { ascending: false });

      if (error) throw error;

      // Calculate metrics per environment
      const environments = ['development', 'staging', 'production'];
      const calculatedMetrics: DeploymentMetrics[] = [];

      for (const env of environments) {
        const envDeployments = deployments?.filter(d => d.environment === env) || [];
        const total = envDeployments.length;
        const successful = envDeployments.filter(d => d.status === 'success').length;
        const failed = envDeployments.filter(d => d.status === 'failed').length;

        // Calculate frequency (deployments per day)
        const frequency = total / 30;

        // Calculate success rate
        const successRate = total > 0 ? (successful / total) * 100 : 0;

        // Calculate MTTR (Mean Time To Recovery)
        // For demo: calculate time between failure and next successful deployment
        let totalRecoveryTime = 0;
        let recoveryCount = 0;

        for (let i = 0; i < envDeployments.length - 1; i++) {
          if (envDeployments[i].status === 'failed') {
            // Find next successful deployment
            const nextSuccess = envDeployments
              .slice(i + 1)
              .find(d => d.status === 'success');
            
            if (nextSuccess) {
              const failTime = new Date(envDeployments[i].deployed_at).getTime();
              const successTime = new Date(nextSuccess.deployed_at).getTime();
              totalRecoveryTime += successTime - failTime;
              recoveryCount++;
            }
          }
        }

        const mttr = recoveryCount > 0 
          ? Math.round(totalRecoveryTime / recoveryCount / 60000) // Convert to minutes
          : 0;

        calculatedMetrics.push({
          environment: env,
          frequency: Math.round(frequency * 10) / 10,
          successRate: Math.round(successRate * 10) / 10,
          mttr,
          totalDeployments: total,
          failedDeployments: failed,
          avgRecoveryTime: mttr,
        });
      }

      // Add "all" aggregated metrics
      const allDeployments = deployments || [];
      const totalAll = allDeployments.length;
      const successfulAll = allDeployments.filter(d => d.status === 'success').length;
      const failedAll = allDeployments.filter(d => d.status === 'failed').length;

      calculatedMetrics.unshift({
        environment: 'all',
        frequency: Math.round((totalAll / 30) * 10) / 10,
        successRate: totalAll > 0 ? Math.round((successfulAll / totalAll) * 100 * 10) / 10 : 0,
        mttr: Math.round(
          calculatedMetrics.reduce((sum, m) => sum + m.mttr, 0) / 
          calculatedMetrics.filter(m => m.mttr > 0).length || 0
        ),
        totalDeployments: totalAll,
        failedDeployments: failedAll,
        avgRecoveryTime: Math.round(
          calculatedMetrics.reduce((sum, m) => sum + m.avgRecoveryTime, 0) / 
          calculatedMetrics.filter(m => m.avgRecoveryTime > 0).length || 0
        ),
      });

      setMetrics(calculatedMetrics);
    } catch (err) {
      console.error('Failed to fetch deployment metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Subscribe to deployment changes
    const channel = supabase
      .channel('deployment-metrics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deployments' },
        () => {
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const currentMetrics = metrics.find(m => m.environment === selectedEnv) || metrics[0];

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Deployment Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Deployment Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={selectedEnv} onValueChange={setSelectedEnv}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="development" className="flex-1">Dev</TabsTrigger>
            <TabsTrigger value="staging" className="flex-1">Staging</TabsTrigger>
            <TabsTrigger value="production" className="flex-1">Prod</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedEnv} className="space-y-4 mt-4">
            {/* Deployment Frequency */}
            <MetricCard
              icon={Activity}
              title="Deployment Frequency"
              value={`${currentMetrics?.frequency || 0}`}
              unit="per day"
              trend={currentMetrics?.frequency > 1 ? 'up' : 'neutral'}
              subtitle={`${currentMetrics?.totalDeployments || 0} total in last 30 days`}
            />

            {/* Success Rate */}
            <MetricCard
              icon={CheckCircle2}
              title="Success Rate"
              value={`${currentMetrics?.successRate || 0}%`}
              trend={currentMetrics?.successRate >= 95 ? 'up' : currentMetrics?.successRate >= 80 ? 'neutral' : 'down'}
              subtitle={`${currentMetrics?.failedDeployments || 0} failed deployments`}
              statusColor={
                currentMetrics?.successRate >= 95 
                  ? 'text-sec-safe' 
                  : currentMetrics?.successRate >= 80 
                    ? 'text-sec-warning' 
                    : 'text-sec-critical'
              }
            />

            {/* Mean Time To Recovery */}
            <MetricCard
              icon={Clock}
              title="Mean Time To Recovery (MTTR)"
              value={currentMetrics?.mttr > 0 ? formatTime(currentMetrics.mttr) : 'N/A'}
              trend={currentMetrics?.mttr > 0 && currentMetrics.mttr < 30 ? 'up' : 'neutral'}
              subtitle={currentMetrics?.mttr > 0 ? 'Average recovery time' : 'No failures recorded'}
              statusColor={
                !currentMetrics?.mttr || currentMetrics.mttr === 0
                  ? 'text-sec-safe'
                  : currentMetrics.mttr < 30 
                    ? 'text-sec-safe' 
                    : currentMetrics.mttr < 120 
                      ? 'text-sec-warning' 
                      : 'text-sec-critical'
              }
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface MetricCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  unit?: string;
  trend: 'up' | 'down' | 'neutral';
  subtitle: string;
  statusColor?: string;
}

const MetricCard = ({ icon: Icon, title, value, unit, trend, subtitle, statusColor }: MetricCardProps) => (
  <div className="p-4 rounded-lg border bg-card">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      {trend !== 'neutral' && (
        <Badge 
          variant="outline" 
          className={cn(
            "h-6",
            trend === 'up' && "border-sec-safe text-sec-safe",
            trend === 'down' && "border-sec-critical text-sec-critical"
          )}
        >
          {trend === 'up' ? (
            <TrendingUp className="w-3 h-3 mr-1" />
          ) : (
            <TrendingDown className="w-3 h-3 mr-1" />
          )}
          {trend === 'up' ? 'Good' : 'Poor'}
        </Badge>
      )}
    </div>
    <div className="mt-2">
      <div className="flex items-baseline gap-1">
        <span className={cn("text-2xl font-semibold", statusColor || "text-foreground")}>
          {value}
        </span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  </div>
);

const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export default DeploymentMetricsWidget;
