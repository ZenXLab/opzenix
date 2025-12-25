import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  Lock,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ComplianceFramework {
  name: string;
  shortName: string;
  score: number;
  controls: { passed: number; failed: number; pending: number };
  lastAudit: string;
  status: 'compliant' | 'at-risk' | 'non-compliant';
}

interface ComplianceDashboardWidgetProps {
  id?: string;
  onRemove?: (id: string) => void;
}

export const ComplianceDashboardWidget = ({ onRemove }: ComplianceDashboardWidgetProps) => {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    const mockFrameworks: ComplianceFramework[] = [
      {
        name: 'SOC 2 Type II',
        shortName: 'SOC2',
        score: 94,
        controls: { passed: 89, failed: 3, pending: 2 },
        lastAudit: '15 days ago',
        status: 'compliant',
      },
      {
        name: 'ISO 27001',
        shortName: 'ISO',
        score: 87,
        controls: { passed: 112, failed: 8, pending: 5 },
        lastAudit: '22 days ago',
        status: 'at-risk',
      },
      {
        name: 'GDPR',
        shortName: 'GDPR',
        score: 91,
        controls: { passed: 45, failed: 2, pending: 3 },
        lastAudit: '8 days ago',
        status: 'compliant',
      },
      {
        name: 'PCI DSS',
        shortName: 'PCI',
        score: 78,
        controls: { passed: 234, failed: 18, pending: 12 },
        lastAudit: '30 days ago',
        status: 'at-risk',
      },
    ];

    setTimeout(() => {
      setFrameworks(mockFrameworks);
      setOverallScore(Math.round(mockFrameworks.reduce((acc, f) => acc + f.score, 0) / mockFrameworks.length));
      setLoading(false);
    }, 500);
  }, []);

  const getStatusIcon = (status: ComplianceFramework['status']) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'at-risk':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case 'non-compliant':
        return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 75) return 'text-amber-500';
    return 'text-red-500';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 75) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1">
      {/* Overall Score */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Overall Compliance</p>
            <p className={cn('text-2xl font-bold', getScoreColor(overallScore))}>{overallScore}%</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-500">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+2.3%</span>
        </div>
      </div>

      {/* Framework List */}
      <div className="space-y-2">
        {frameworks.map((framework) => (
          <motion.div
            key={framework.shortName}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2.5 rounded-lg bg-muted/30 border border-border"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(framework.status)}
                <span className="text-sm font-medium text-foreground">{framework.name}</span>
              </div>
              <span className={cn('text-sm font-bold', getScoreColor(framework.score))}>
                {framework.score}%
              </span>
            </div>

            <div className="relative h-1.5 rounded-full bg-muted overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${framework.score}%` }}
                transition={{ duration: 0.5 }}
                className={cn('h-full rounded-full', getProgressColor(framework.score))}
              />
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                  <span className="text-muted-foreground">{framework.controls.passed} passed</span>
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-2.5 h-2.5 text-red-500" />
                  <span className="text-muted-foreground">{framework.controls.failed} failed</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-amber-500" />
                  <span className="text-muted-foreground">{framework.controls.pending} pending</span>
                </span>
              </div>
              <span className="text-muted-foreground">{framework.lastAudit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-muted/30 border border-border text-center">
          <FileText className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-[10px] text-muted-foreground">Controls</p>
          <p className="text-sm font-semibold text-foreground">
            {frameworks.reduce((acc, f) => acc + f.controls.passed + f.controls.failed + f.controls.pending, 0)}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-muted/30 border border-border text-center">
          <Lock className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
          <p className="text-[10px] text-muted-foreground">Passed</p>
          <p className="text-sm font-semibold text-foreground">
            {frameworks.reduce((acc, f) => acc + f.controls.passed, 0)}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-muted/30 border border-border text-center">
          <AlertTriangle className="w-4 h-4 mx-auto text-red-500 mb-1" />
          <p className="text-[10px] text-muted-foreground">Issues</p>
          <p className="text-sm font-semibold text-foreground">
            {frameworks.reduce((acc, f) => acc + f.controls.failed, 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboardWidget;
