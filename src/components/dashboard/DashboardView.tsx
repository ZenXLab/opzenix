import { motion } from 'framer-motion';
import { 
  Rocket, GitBranch, Shield, AlertTriangle, Clock, CheckCircle2,
  TrendingUp, Activity, Zap
} from 'lucide-react';
import MetricCard from './MetricCard';
import SystemHealthCard from './SystemHealthCard';
import ActiveExecutionsCard from './ActiveExecutionsCard';
import QuickDeployCard from './QuickDeployCard';
import RecentDeploymentsCard from './RecentDeploymentsCard';
import { useFlowStore } from '@/stores/flowStore';

interface DashboardViewProps {
  onViewFlows: () => void;
}

const DashboardView = ({ onViewFlows }: DashboardViewProps) => {
  const { executions, deployments, approvalRequests, systemHealth } = useFlowStore();

  // Calculate metrics
  const activeExecutions = executions.filter(e => e.status === 'running').length;
  const successfulDeployments = deployments.filter(d => d.status === 'success').length;
  const failedDeployments = deployments.filter(d => d.status === 'failed').length;
  const successRate = deployments.length > 0 
    ? Math.round((successfulDeployments / deployments.length) * 100) 
    : 100;
  const pendingApprovals = approvalRequests.filter(a => a.status === 'pending').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-auto bg-background p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Operations overview • All systems operational
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sec-safe/10 text-sec-safe text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-sec-safe animate-pulse" />
              System Healthy
            </span>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-5 gap-4">
          <MetricCard
            label="Active Flows"
            value={activeExecutions}
            icon={Zap}
            iconColor="text-node-running"
          />
          <MetricCard
            label="Deployments Today"
            value={deployments.length}
            change={{ value: '12%', positive: true }}
            icon={Rocket}
            iconColor="text-ai-primary"
          />
          <MetricCard
            label="Success Rate"
            value={`${successRate}%`}
            change={{ value: '2%', positive: true }}
            icon={CheckCircle2}
            iconColor="text-sec-safe"
          />
          <MetricCard
            label="Pending Approvals"
            value={pendingApprovals}
            icon={Clock}
            iconColor="text-sec-warning"
          />
          <MetricCard
            label="Failed (7d)"
            value={failedDeployments}
            change={{ value: '1', positive: false }}
            icon={AlertTriangle}
            iconColor="text-sec-critical"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Quick Deploy + Recent */}
          <div className="space-y-6">
            <QuickDeployCard />
            <RecentDeploymentsCard />
          </div>

          {/* Center Column - Active Executions */}
          <div className="col-span-1">
            <ActiveExecutionsCard onViewAll={onViewFlows} />
          </div>

          {/* Right Column - System Health */}
          <div className="space-y-6">
            <SystemHealthCard />
            
            {/* AI Insights Card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-ai-primary/20 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-ai-primary" />
                <h3 className="text-sm font-medium text-foreground">AI Insights</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="p-2 bg-secondary/30 rounded text-muted-foreground">
                  <span className="text-ai-primary">→</span> Deploy frequency increased 23% this week. 
                  <span className="text-foreground"> Consider adding canary deployments for stability.</span>
                </div>
                <div className="p-2 bg-secondary/30 rounded text-muted-foreground">
                  <span className="text-ai-primary">→</span> ML pipeline `ml-pipeline-retrain` completed successfully. 
                  <span className="text-foreground"> Model accuracy: 94.2%</span>
                </div>
                <div className="p-2 bg-sec-warning/10 rounded text-muted-foreground">
                  <span className="text-sec-warning">!</span> Container registry latency elevated. 
                  <span className="text-foreground"> May affect build times.</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-ai-primary" />
                <h3 className="text-sm font-medium text-foreground">Weekly Summary</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 bg-secondary/30 rounded">
                  <p className="text-muted-foreground">Total Deploys</p>
                  <p className="text-lg font-semibold text-foreground">47</p>
                </div>
                <div className="p-2 bg-secondary/30 rounded">
                  <p className="text-muted-foreground">Rollbacks</p>
                  <p className="text-lg font-semibold text-foreground">2</p>
                </div>
                <div className="p-2 bg-secondary/30 rounded">
                  <p className="text-muted-foreground">MTTR</p>
                  <p className="text-lg font-semibold text-foreground">4.2m</p>
                </div>
                <div className="p-2 bg-secondary/30 rounded">
                  <p className="text-muted-foreground">Lead Time</p>
                  <p className="text-lg font-semibold text-foreground">12m</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardView;
