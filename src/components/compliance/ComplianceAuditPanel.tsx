import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  Clock,
  Users,
  Lock,
  Server,
  Activity,
  GitBranch,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  feature: string;
  evidence: string[];
}

const soc2Controls: ComplianceControl[] = [
  {
    id: 'CC6.1',
    name: 'Logical Access Controls',
    description: 'Access to sensitive information is restricted',
    status: 'compliant',
    feature: 'RBAC + Approval Gates',
    evidence: ['user_roles table', 'approval_requests', 'audit_logs'],
  },
  {
    id: 'CC7.2',
    name: 'Security Incident Response',
    description: 'Security events are detected and responded to',
    status: 'compliant',
    feature: 'CI Security Gates (SAST/DAST)',
    evidence: ['execution_logs', 'telemetry_signals', 'notification_events'],
  },
  {
    id: 'CC8.1',
    name: 'Change Management',
    description: 'Changes are authorized and documented',
    status: 'compliant',
    feature: 'Approval Workflows',
    evidence: ['approval_requests', 'approval_votes', 'checkpoints'],
  },
  {
    id: 'CC9.2',
    name: 'Incident Traceability',
    description: 'Incidents can be traced to root cause',
    status: 'compliant',
    feature: 'OTel Correlation',
    evidence: ['telemetry_signals', 'execution_state_events', 'deployments'],
  },
];

const iso27001Controls: ComplianceControl[] = [
  {
    id: 'A.9',
    name: 'Access Control',
    description: 'Role-based access to systems and data',
    status: 'compliant',
    feature: 'Role-Based Access Control',
    evidence: ['user_roles', 'RLS policies', 'has_role() function'],
  },
  {
    id: 'A.12',
    name: 'Operations Security',
    description: 'Secure CI/CD pipeline operations',
    status: 'compliant',
    feature: 'Secure CI/CD Pipeline',
    evidence: ['executions', 'execution_nodes', 'artifacts'],
  },
  {
    id: 'A.14',
    name: 'System Development',
    description: 'Secure development lifecycle',
    status: 'compliant',
    feature: 'Change Management',
    evidence: ['approval_requests', 'checkpoints', 'flow_templates'],
  },
  {
    id: 'A.15',
    name: 'Supplier Relationships',
    description: 'Third-party security management',
    status: 'partial',
    feature: 'Supplier Security',
    evidence: ['github_integrations', 'artifacts registry'],
  },
  {
    id: 'A.16',
    name: 'Incident Management',
    description: 'Security incident handling',
    status: 'compliant',
    feature: 'Incident Handling',
    evidence: ['audit_logs', 'deployments.incident_id', 'notification_events'],
  },
];

const statusColors = {
  compliant: 'bg-sec-safe/20 text-sec-safe border-sec-safe/30',
  partial: 'bg-sec-warning/20 text-sec-warning border-sec-warning/30',
  'non-compliant': 'bg-sec-critical/20 text-sec-critical border-sec-critical/30',
};

const statusIcons = {
  compliant: CheckCircle2,
  partial: AlertTriangle,
  'non-compliant': XCircle,
};

export function ComplianceAuditPanel() {
  const [activeTab, setActiveTab] = useState('soc2');
  const [generating, setGenerating] = useState(false);

  const calculateCompliance = (controls: ComplianceControl[]) => {
    const compliant = controls.filter(c => c.status === 'compliant').length;
    const partial = controls.filter(c => c.status === 'partial').length;
    return Math.round(((compliant + partial * 0.5) / controls.length) * 100);
  };

  const soc2Score = calculateCompliance(soc2Controls);
  const iso27001Score = calculateCompliance(iso27001Controls);

  const handleGenerateReport = async () => {
    setGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGenerating(false);
    toast.success('Compliance report generated');
  };

  const renderControlCard = (control: ComplianceControl) => {
    const StatusIcon = statusIcons[control.status];
    return (
      <Card key={control.id} className="border-border">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                statusColors[control.status]
              )}>
                <StatusIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{control.id}</span>
                  <span className="font-medium text-sm">{control.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{control.description}</p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={cn("text-[10px] capitalize", statusColors[control.status])}
            >
              {control.status}
            </Badge>
          </div>

          <Separator className="my-3" />

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground mb-1">Opzenix Feature</p>
              <Badge variant="secondary" className="text-[10px]">{control.feature}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Evidence Sources</p>
              <div className="flex flex-wrap gap-1">
                {control.evidence.slice(0, 2).map(ev => (
                  <code key={ev} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">
                    {ev}
                  </code>
                ))}
                {control.evidence.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{control.evidence.length - 2} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Compliance & Audit
          </h2>
          <p className="text-sm text-muted-foreground">
            SOC2 & ISO 27001 compliance mapping
          </p>
        </div>
        <Button 
          onClick={handleGenerateReport} 
          disabled={generating}
          className="gap-1.5"
        >
          {generating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Export Report
        </Button>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">SOC2 Type II</p>
              <Badge className={cn(
                "text-[10px]",
                soc2Score >= 90 ? statusColors.compliant : statusColors.partial
              )}>
                {soc2Score}%
              </Badge>
            </div>
            <Progress value={soc2Score} className="h-2" />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {soc2Controls.filter(c => c.status === 'compliant').length}/{soc2Controls.length} controls compliant
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">ISO 27001</p>
              <Badge className={cn(
                "text-[10px]",
                iso27001Score >= 90 ? statusColors.compliant : statusColors.partial
              )}>
                {iso27001Score}%
              </Badge>
            </div>
            <Progress value={iso27001Score} className="h-2" />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {iso27001Controls.filter(c => c.status === 'compliant').length}/{iso27001Controls.length} controls compliant
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="soc2">SOC2 Controls</TabsTrigger>
          <TabsTrigger value="iso27001">ISO 27001</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
        </TabsList>

        <TabsContent value="soc2" className="space-y-3 mt-4">
          {soc2Controls.map(renderControlCard)}
        </TabsContent>

        <TabsContent value="iso27001" className="space-y-3 mt-4">
          {iso27001Controls.map(renderControlCard)}
        </TabsContent>

        <TabsContent value="evidence" className="space-y-3 mt-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Auto-Generated Evidence
              </CardTitle>
              <CardDescription className="text-xs">
                Evidence collected automatically from Opzenix operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: GitBranch, name: 'Execution Logs', desc: 'CI/CD pipeline execution records', count: '2,847' },
                { icon: CheckCircle2, name: 'Approval Records', desc: 'Human governance decisions', count: '156' },
                { icon: Clock, name: 'Checkpoints', desc: 'Immutable pipeline states', count: '892' },
                { icon: Lock, name: 'Artifact Digests', desc: 'Container image hashes', count: '324' },
                { icon: Activity, name: 'Deployment History', desc: 'Environment promotion records', count: '478' },
                { icon: Eye, name: 'Vault Access Logs', desc: 'Secret resolution audit trail', count: '1,204' },
              ].map((item, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-secondary/30 rounded-md"
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {item.count}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

export default ComplianceAuditPanel;
