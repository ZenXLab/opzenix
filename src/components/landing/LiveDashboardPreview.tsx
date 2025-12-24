import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, 
  Shield, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Boxes,
  Activity,
  Lock,
  RefreshCw,
  TrendingUp,
  Users,
  DollarSign,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ExecutionNode {
  id: string;
  name: string;
  status: 'success' | 'running' | 'pending' | 'approval';
  type: 'ci' | 'security' | 'checkpoint' | 'deploy' | 'approval';
  meta?: string;
}

const executionFlow: ExecutionNode[] = [
  { id: '1', name: 'GitHub CI', status: 'success', type: 'ci', meta: 'main • abc123' },
  { id: '2', name: 'Security Scan', status: 'success', type: 'security', meta: 'SAST + DAST' },
  { id: '3', name: 'Checkpoint', status: 'success', type: 'checkpoint', meta: 'chk_verified' },
  { id: '4', name: 'AKS Staging', status: 'running', type: 'deploy', meta: 'Canary 25%' },
  { id: '5', name: 'Approval Gate', status: 'approval', type: 'approval', meta: '2/3 approved' },
  { id: '6', name: 'Production', status: 'pending', type: 'deploy', meta: 'Blue-Green' },
];

const businessMetrics = [
  { label: 'Deployments Governed', value: '12,847', trend: '+18%', icon: Boxes },
  { label: 'Incidents Prevented', value: '342', trend: '-94%', icon: Shield },
  { label: 'MTTR Reduction', value: '73%', trend: '↓', icon: Clock },
  { label: 'Audit Compliance', value: '100%', trend: 'SOC2', icon: Lock },
];

const recentActivity = [
  { action: 'Approval granted', user: 'Sarah Chen', env: 'Production', time: '2m ago', status: 'success' },
  { action: 'Checkpoint created', user: 'System', env: 'Staging', time: '5m ago', status: 'info' },
  { action: 'Deployment blocked', user: 'Policy Engine', env: 'UAT', time: '12m ago', status: 'warning' },
  { action: 'Rollback executed', user: 'Mike Torres', env: 'Production', time: '1h ago', status: 'success' },
];

const LiveDashboardPreview = () => {
  const [activeNodeIndex, setActiveNodeIndex] = useState(3);
  const [canaryProgress, setCanaryProgress] = useState(25);

  useEffect(() => {
    const interval = setInterval(() => {
      setCanaryProgress(prev => {
        if (prev >= 100) return 25;
        return prev + 5;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-sec-safe text-sec-safe';
      case 'running': return 'bg-primary text-primary';
      case 'approval': return 'bg-sec-warning text-sec-warning';
      case 'pending': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'ci': return GitBranch;
      case 'security': return Shield;
      case 'checkpoint': return CheckCircle2;
      case 'deploy': return Boxes;
      case 'approval': return Users;
      default: return Activity;
    }
  };

  return (
    <motion.div
      className="relative w-full rounded-2xl border border-border bg-card/80 backdrop-blur-xl overflow-hidden shadow-2xl"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      {/* Dashboard Header */}
      <div className="px-4 py-3 border-b border-border bg-background/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/70" />
            <div className="w-3 h-3 rounded-full bg-sec-warning/70" />
            <div className="w-3 h-3 rounded-full bg-sec-safe/70" />
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Opzenix Control Plane</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs gap-1">
            <Activity className="w-3 h-3" />
            3 Active Executions
          </Badge>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sec-safe animate-pulse" />
            <span className="text-xs text-sec-safe font-medium">Live</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left Panel - Execution Flow */}
        <div className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Live Execution Flow</h3>
              <p className="text-xs text-muted-foreground">payment-service • exe_92fd7a</p>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              Orchestrating
            </Badge>
          </div>

          {/* Flow Visualization */}
          <div className="relative flex items-center gap-2 overflow-x-auto pb-4">
            {executionFlow.map((node, index) => {
              const Icon = getNodeIcon(node.type);
              const isActive = index === activeNodeIndex;
              
              return (
                <div key={node.id} className="flex items-center">
                  <motion.div
                    className={`relative flex flex-col items-center p-3 rounded-lg border min-w-[100px] transition-all ${
                      isActive 
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                        : 'border-border bg-background/50'
                    }`}
                    animate={isActive ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                      node.status === 'success' ? 'bg-sec-safe/20' :
                      node.status === 'running' ? 'bg-primary/20' :
                      node.status === 'approval' ? 'bg-sec-warning/20' :
                      'bg-muted/50'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        node.status === 'success' ? 'text-sec-safe' :
                        node.status === 'running' ? 'text-primary' :
                        node.status === 'approval' ? 'text-sec-warning' :
                        'text-muted-foreground'
                      }`} />
                    </div>
                    <span className="text-xs font-medium text-foreground text-center">{node.name}</span>
                    <span className="text-[10px] text-muted-foreground text-center mt-0.5">{node.meta}</span>
                    
                    {/* Status indicator */}
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(node.status).split(' ')[0]}`}>
                      {node.status === 'running' && (
                        <span className="absolute inset-0 rounded-full animate-ping bg-primary/50" />
                      )}
                    </div>
                  </motion.div>
                  
                  {index < executionFlow.length - 1 && (
                    <ArrowRight className={`w-4 h-4 mx-1 flex-shrink-0 ${
                      index < activeNodeIndex ? 'text-sec-safe' : 'text-muted-foreground/50'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Canary Progress */}
          <div className="mt-4 p-3 rounded-lg bg-background/50 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-foreground">Canary Deployment Progress</span>
              </div>
              <span className="text-xs text-muted-foreground">{canaryProgress}% traffic shifted</span>
            </div>
            <Progress value={canaryProgress} className="h-2" />
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>0% (Safe)</span>
              <span>50% (Validation)</span>
              <span>100% (Full)</span>
            </div>
          </div>

          {/* Business Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {businessMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="p-3 rounded-lg bg-background/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-[10px] text-muted-foreground">{metric.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-foreground">{metric.value}</span>
                    <span className="text-xs text-sec-safe">{metric.trend}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Activity & Governance */}
        <div className="p-4 bg-background/30">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Governance Activity
          </h3>
          
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.time}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-2.5 rounded-lg bg-background/50 border border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {activity.status === 'success' && <CheckCircle2 className="w-3 h-3 text-sec-safe flex-shrink-0" />}
                        {activity.status === 'warning' && <AlertTriangle className="w-3 h-3 text-sec-warning flex-shrink-0" />}
                        {activity.status === 'info' && <Activity className="w-3 h-3 text-primary flex-shrink-0" />}
                        <span className="text-xs font-medium text-foreground truncate">{activity.action}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">{activity.user}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{activity.env}</Badge>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* System Truth */}
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">System of Truth</span>
            </div>
            <div className="space-y-1.5 text-[10px] text-muted-foreground">
              <div className="flex justify-between">
                <span>Checkpoints Created</span>
                <span className="text-foreground font-medium">847</span>
              </div>
              <div className="flex justify-between">
                <span>Approvals Logged</span>
                <span className="text-foreground font-medium">1,293</span>
              </div>
              <div className="flex justify-between">
                <span>Rollbacks Available</span>
                <span className="text-foreground font-medium">412</span>
              </div>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="mt-4 p-3 rounded-lg border border-sec-safe/30 bg-sec-safe/5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-sec-safe" />
              <span className="text-xs font-semibold text-foreground">Business Impact</span>
            </div>
            <div className="flex items-baseline gap-2">
              <DollarSign className="w-4 h-4 text-sec-safe" />
              <span className="text-lg font-bold text-foreground">$2.4M</span>
              <span className="text-xs text-muted-foreground">saved in incident costs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="px-4 py-2 border-t border-border bg-background/50 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-sec-safe" />
            GitHub Actions
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-sec-safe" />
            Azure AKS
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-sec-safe" />
            OpenTelemetry
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-sec-safe" />
            Key Vault
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Opzenix orchestrates. Others execute.
        </span>
      </div>
    </motion.div>
  );
};

export default LiveDashboardPreview;
