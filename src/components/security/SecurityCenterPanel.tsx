import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ArrowLeft,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  FileText,
  Clock,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Bug,
  KeyRound,
  Globe,
  Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecurityFinding {
  id: string;
  type: 'vulnerability' | 'misconfiguration' | 'exposure' | 'compliance';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  resource: string;
  status: 'open' | 'in_progress' | 'resolved' | 'ignored';
  detectedAt: string;
  cveId?: string;
}

interface ComplianceFramework {
  id: string;
  name: string;
  score: number;
  totalControls: number;
  passedControls: number;
  lastAssessed: string;
}

interface SecurityCenterPanelProps {
  onBack?: () => void;
}

export const SecurityCenterPanel = ({ onBack }: SecurityCenterPanelProps) => {
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [compliance, setCompliance] = useState<ComplianceFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      // Fetch vulnerability scans
      const { data: vulnData } = await supabase
        .from('vulnerability_scans')
        .select('*, artifacts(name)')
        .order('scanned_at', { ascending: false })
        .limit(20);

      if (vulnData && vulnData.length > 0) {
        const mappedFindings: SecurityFinding[] = vulnData.flatMap((scan) => {
          const findings: SecurityFinding[] = [];
          const artifactName = (scan.artifacts as any)?.name || 'Unknown';
          
          if (scan.critical > 0) {
            findings.push({
              id: `${scan.id}-critical`,
              type: 'vulnerability',
              severity: 'critical',
              title: `${scan.critical} Critical vulnerabilities in ${artifactName}`,
              description: 'Critical security vulnerabilities detected that require immediate attention',
              resource: artifactName,
              status: 'open',
              detectedAt: scan.scanned_at,
            });
          }
          if (scan.high > 0) {
            findings.push({
              id: `${scan.id}-high`,
              type: 'vulnerability',
              severity: 'high',
              title: `${scan.high} High vulnerabilities in ${artifactName}`,
              description: 'High severity vulnerabilities that should be addressed soon',
              resource: artifactName,
              status: 'open',
              detectedAt: scan.scanned_at,
            });
          }
          return findings;
        });
        setFindings(mappedFindings.length > 0 ? mappedFindings : getMockFindings());
      } else {
        setFindings(getMockFindings());
      }

      // Mock compliance data
      setCompliance([
        { id: '1', name: 'SOC 2 Type II', score: 87, totalControls: 64, passedControls: 56, lastAssessed: new Date().toISOString() },
        { id: '2', name: 'ISO 27001', score: 92, totalControls: 114, passedControls: 105, lastAssessed: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', name: 'HIPAA', score: 78, totalControls: 45, passedControls: 35, lastAssessed: new Date(Date.now() - 172800000).toISOString() },
        { id: '4', name: 'PCI DSS', score: 95, totalControls: 12, passedControls: 11, lastAssessed: new Date(Date.now() - 259200000).toISOString() },
      ]);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const getMockFindings = (): SecurityFinding[] => [
    {
      id: '1',
      type: 'vulnerability',
      severity: 'critical',
      title: 'CVE-2024-1234: Remote Code Execution',
      description: 'A critical vulnerability allowing remote code execution in the web server component',
      resource: 'api-service:v1.5.3',
      status: 'open',
      detectedAt: new Date().toISOString(),
      cveId: 'CVE-2024-1234',
    },
    {
      id: '2',
      type: 'misconfiguration',
      severity: 'high',
      title: 'S3 Bucket Public Access Enabled',
      description: 'Storage bucket has public access enabled which may expose sensitive data',
      resource: 'prod-assets-bucket',
      status: 'in_progress',
      detectedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      type: 'exposure',
      severity: 'medium',
      title: 'API Key Exposed in Repository',
      description: 'Hardcoded API key found in source code repository',
      resource: 'config/settings.yaml',
      status: 'resolved',
      detectedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '4',
      type: 'compliance',
      severity: 'low',
      title: 'Missing Access Logging',
      description: 'Database access logging is not enabled for audit compliance',
      resource: 'prod-database',
      status: 'open',
      detectedAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  const getSeverityIcon = (severity: SecurityFinding['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <ShieldAlert className="w-4 h-4 text-blue-500" />;
      default:
        return <Shield className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSeverityBadge = (severity: SecurityFinding['severity']) => {
    const styles = {
      critical: 'bg-red-500/10 text-red-500 border-red-500/30',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      low: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      info: 'bg-muted text-muted-foreground border-border',
    };
    return styles[severity];
  };

  const getTypeIcon = (type: SecurityFinding['type']) => {
    switch (type) {
      case 'vulnerability':
        return <Bug className="w-4 h-4" />;
      case 'misconfiguration':
        return <Server className="w-4 h-4" />;
      case 'exposure':
        return <KeyRound className="w-4 h-4" />;
      case 'compliance':
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredFindings = findings.filter((f) => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         f.resource.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || f.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const stats = {
    critical: findings.filter(f => f.severity === 'critical' && f.status === 'open').length,
    high: findings.filter(f => f.severity === 'high' && f.status === 'open').length,
    medium: findings.filter(f => f.severity === 'medium' && f.status === 'open').length,
    resolved: findings.filter(f => f.status === 'resolved').length,
  };

  const overallScore = Math.round(compliance.reduce((acc, c) => acc + c.score, 0) / compliance.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Security Center</h1>
              <p className="text-sm text-muted-foreground">Monitor vulnerabilities, compliance, and security posture</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchSecurityData}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Scan Now
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Security Score */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Overall Security Score</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-foreground">{overallScore}</span>
                  <span className="text-2xl text-muted-foreground">/100</span>
                  {overallScore >= 80 ? (
                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  ) : overallScore >= 60 ? (
                    <Shield className="w-8 h-8 text-yellow-500" />
                  ) : (
                    <ShieldAlert className="w-8 h-8 text-red-500" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{stats.critical}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Critical</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">{stats.high}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">High</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-500">{stats.medium}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Medium</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-500">{stats.resolved}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Resolved</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="findings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="findings">Security Findings</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Findings Tab */}
          <TabsContent value="findings" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search findings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {filteredFindings.map((finding) => (
                  <motion.div
                    key={finding.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="hover:bg-muted/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'p-2 rounded-lg',
                              finding.severity === 'critical' && 'bg-red-500/10',
                              finding.severity === 'high' && 'bg-orange-500/10',
                              finding.severity === 'medium' && 'bg-yellow-500/10',
                              finding.severity === 'low' && 'bg-blue-500/10'
                            )}>
                              {getTypeIcon(finding.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground">{finding.title}</span>
                                <Badge variant="outline" className={cn('text-[10px]', getSeverityBadge(finding.severity))}>
                                  {getSeverityIcon(finding.severity)}
                                  <span className="ml-1">{finding.severity.toUpperCase()}</span>
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Server className="w-3 h-3" />
                                  {finding.resource}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(finding.detectedAt).toLocaleDateString()}
                                </span>
                                {finding.cveId && (
                                  <Badge variant="secondary" className="text-[10px]">{finding.cveId}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn(
                            'text-[10px]',
                            finding.status === 'resolved' && 'border-emerald-500/30 text-emerald-500',
                            finding.status === 'in_progress' && 'border-blue-500/30 text-blue-500',
                            finding.status === 'open' && 'border-border'
                          )}>
                            {finding.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {compliance.map((framework) => (
                <Card key={framework.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{framework.name}</CardTitle>
                      <Badge variant="outline" className={cn(
                        'text-xs',
                        framework.score >= 90 && 'border-emerald-500/30 text-emerald-500',
                        framework.score >= 70 && framework.score < 90 && 'border-yellow-500/30 text-yellow-500',
                        framework.score < 70 && 'border-red-500/30 text-red-500'
                      )}>
                        {framework.score}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={framework.score} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {framework.passedControls} / {framework.totalControls} controls passed
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Last: {new Date(framework.lastAssessed).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: 'Vulnerability scan completed', target: 'api-service', severity: 'info', time: '10 minutes ago' },
                    { action: 'Critical CVE detected', target: 'frontend-app', severity: 'critical', time: '1 hour ago' },
                    { action: 'Security policy updated', target: 'production-cluster', severity: 'info', time: '3 hours ago' },
                    { action: 'Finding resolved', target: 'S3 bucket access', severity: 'success', time: '1 day ago' },
                  ].map((event, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Activity className={cn(
                          'w-4 h-4',
                          event.severity === 'critical' && 'text-red-500',
                          event.severity === 'success' && 'text-emerald-500',
                          event.severity === 'info' && 'text-muted-foreground'
                        )} />
                        <div>
                          <p className="text-sm font-medium">{event.action}</p>
                          <p className="text-xs text-muted-foreground">{event.target}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{event.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SecurityCenterPanel;
