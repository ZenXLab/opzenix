import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, AlertTriangle, XCircle, Clock, Activity, 
  Server, Database, Globe, Shield, Zap, RefreshCw,
  TrendingUp, Calendar, ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import EnterpriseNavigation from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';
import { useSystemHealth, SystemHealthMetrics } from '@/hooks/useSystemHealth';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  uptime: number;
  icon: React.ElementType;
  description: string;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  startTime: string;
  endTime?: string;
  updates: {
    time: string;
    message: string;
    status: string;
  }[];
}

const services: ServiceStatus[] = [
  { name: 'Control Plane API', status: 'operational', uptime: 99.99, icon: Server, description: 'Core execution and governance engine' },
  { name: 'Dashboard & UI', status: 'operational', uptime: 99.98, icon: Globe, description: 'Web interface and real-time updates' },
  { name: 'Database Cluster', status: 'operational', uptime: 99.99, icon: Database, description: 'Primary data storage and replication' },
  { name: 'Webhook Receivers', status: 'operational', uptime: 99.97, icon: Zap, description: 'GitHub, GitLab, Azure DevOps integrations' },
  { name: 'Authentication', status: 'operational', uptime: 99.99, icon: Shield, description: 'SSO, OAuth, and session management' },
  { name: 'Telemetry Pipeline', status: 'operational', uptime: 99.95, icon: Activity, description: 'OpenTelemetry collection and processing' },
];

const recentIncidents: Incident[] = [
  {
    id: 'inc-001',
    title: 'Elevated API Latency in EU Region',
    status: 'resolved',
    severity: 'minor',
    startTime: '2025-01-10T14:30:00Z',
    endTime: '2025-01-10T15:45:00Z',
    updates: [
      { time: '2025-01-10T15:45:00Z', status: 'resolved', message: 'Issue fully resolved. API latency back to normal levels.' },
      { time: '2025-01-10T15:15:00Z', status: 'monitoring', message: 'Fix deployed. Monitoring for stability.' },
      { time: '2025-01-10T14:45:00Z', status: 'identified', message: 'Root cause identified: Database connection pool exhaustion.' },
      { time: '2025-01-10T14:30:00Z', status: 'investigating', message: 'Investigating reports of slow API responses in EU region.' },
    ]
  },
  {
    id: 'inc-002',
    title: 'Scheduled Maintenance: Database Upgrade',
    status: 'resolved',
    severity: 'minor',
    startTime: '2025-01-05T02:00:00Z',
    endTime: '2025-01-05T04:30:00Z',
    updates: [
      { time: '2025-01-05T04:30:00Z', status: 'resolved', message: 'Maintenance completed successfully. All services operational.' },
      { time: '2025-01-05T02:00:00Z', status: 'investigating', message: 'Starting scheduled database maintenance window.' },
    ]
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'operational': return <CheckCircle2 className="w-5 h-5 text-sec-safe" />;
    case 'degraded': return <AlertTriangle className="w-5 h-5 text-sec-warning" />;
    case 'outage': return <XCircle className="w-5 h-5 text-sec-critical" />;
    default: return <Clock className="w-5 h-5 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'operational': return <Badge className="bg-sec-safe/20 text-sec-safe">Operational</Badge>;
    case 'degraded': return <Badge className="bg-sec-warning/20 text-sec-warning">Degraded</Badge>;
    case 'outage': return <Badge className="bg-sec-critical/20 text-sec-critical">Outage</Badge>;
    case 'investigating': return <Badge className="bg-sec-warning/20 text-sec-warning">Investigating</Badge>;
    case 'identified': return <Badge className="bg-primary/20 text-primary">Identified</Badge>;
    case 'monitoring': return <Badge className="bg-chart-1/20 text-chart-1">Monitoring</Badge>;
    case 'resolved': return <Badge className="bg-sec-safe/20 text-sec-safe">Resolved</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'critical': return <Badge className="bg-sec-critical/20 text-sec-critical">Critical</Badge>;
    case 'major': return <Badge className="bg-sec-warning/20 text-sec-warning">Major</Badge>;
    case 'minor': return <Badge className="bg-muted text-muted-foreground">Minor</Badge>;
    default: return null;
  }
};

const Status = () => {
  const { metrics, loading, refetch } = useSystemHealth();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    refetch();
    setLastUpdated(new Date());
  };

  const overallStatus = services.every(s => s.status === 'operational') ? 'operational' : 
                        services.some(s => s.status === 'outage') ? 'outage' : 'degraded';

  const averageUptime = services.reduce((acc, s) => acc + s.uptime, 0) / services.length;

  return (
    <div className="min-h-screen bg-background">
      <EnterpriseNavigation />
      
      <div className="pt-24 pb-16 px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4">System Status</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Opzenix Platform Status</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real-time health and performance metrics for all Opzenix services.
            </p>
          </motion.div>

          {/* Overall Status Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`p-6 rounded-xl border mb-8 ${
              overallStatus === 'operational' 
                ? 'bg-sec-safe/10 border-sec-safe/30' 
                : overallStatus === 'degraded'
                  ? 'bg-sec-warning/10 border-sec-warning/30'
                  : 'bg-sec-critical/10 border-sec-critical/30'
            }`}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {getStatusIcon(overallStatus)}
                <div>
                  <h2 className="text-2xl font-bold">
                    {overallStatus === 'operational' ? 'All Systems Operational' : 
                     overallStatus === 'degraded' ? 'Partial System Degradation' : 'System Outage'}
                  </h2>
                  <p className="text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-sec-safe mx-auto mb-2" />
                  <div className="text-2xl font-bold">{averageUptime.toFixed(2)}%</div>
                  <div className="text-sm text-muted-foreground">Avg Uptime (30d)</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card>
                <CardContent className="p-4 text-center">
                  <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{metrics.latencyP50}ms</div>
                  <div className="text-sm text-muted-foreground">P50 Latency</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-4 text-center">
                  <Activity className="w-6 h-6 text-sec-warning mx-auto mb-2" />
                  <div className="text-2xl font-bold">{metrics.activeExecutions}</div>
                  <div className="text-sm text-muted-foreground">Active Executions</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-chart-1 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate (24h)</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Services Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-6">Service Status</h2>
            <div className="space-y-3">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-muted rounded-lg">
                              <Icon className="w-5 h-5 text-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{service.name}</h3>
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                              <div className="text-sm font-medium">{service.uptime}%</div>
                              <div className="text-xs text-muted-foreground">30-day uptime</div>
                            </div>
                            {getStatusBadge(service.status)}
                          </div>
                        </div>
                        <div className="mt-3">
                          <Progress value={service.uptime} className="h-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Incidents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h2 className="text-2xl font-bold mb-6">Recent Incidents</h2>
            
            {recentIncidents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-sec-safe mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Recent Incidents</h3>
                  <p className="text-muted-foreground">All systems have been running smoothly.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {recentIncidents.map((incident, index) => (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{incident.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              {getStatusBadge(incident.status)}
                              {getSeverityBadge(incident.severity)}
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(incident.startTime).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="border-l-2 border-border pl-4 space-y-3">
                          {incident.updates.slice(0, 3).map((update, i) => (
                            <div key={i} className="text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusBadge(update.status)}
                                <span className="text-muted-foreground">
                                  {new Date(update.time).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-muted-foreground">{update.message}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Subscribe */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center mt-12 pt-12 border-t border-border"
          >
            <h3 className="text-lg font-semibold mb-2">Stay Informed</h3>
            <p className="text-muted-foreground mb-4">
              Subscribe to receive status updates via email or Slack.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Subscribe to Updates
              </Button>
              <Button variant="outline" className="gap-2">
                <Activity className="w-4 h-4" />
                View Historical Uptime
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default Status;
