import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Lock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  status: 'done' | 'pending' | 'locked' | 'future';
  category: 'ci' | 'security' | 'approval' | 'artifact' | 'cd' | 'observability';
  version?: string;
}

const mvpChecklist: ChecklistItem[] = [
  // CI Pipeline
  { id: 'github-actions', name: 'GitHub Actions Integration', description: 'Trigger pipelines from GitHub pushes/PRs', status: 'done', category: 'ci' },
  { id: 'sast-semgrep', name: 'SAST (Semgrep)', description: 'Static Application Security Testing', status: 'done', category: 'security' },
  { id: 'dependency-scan', name: 'Dependency Scan', description: 'npm audit for vulnerability detection', status: 'done', category: 'security' },
  { id: 'secrets-scan', name: 'Secrets Scan (TruffleHog)', description: 'Detect leaked credentials in code', status: 'done', category: 'security' },
  { id: 'unit-tests', name: 'Unit Tests', description: 'JUnit test result parsing', status: 'done', category: 'ci' },
  { id: 'integration-tests', name: 'Integration Tests', description: 'End-to-end test execution', status: 'done', category: 'ci' },
  { id: 'docker-build', name: 'Docker Build', description: 'Container image creation', status: 'done', category: 'artifact' },
  { id: 'sbom-gen', name: 'SBOM Generation', description: 'Software Bill of Materials (Anchore/Syft)', status: 'done', category: 'artifact' },
  { id: 'image-scan', name: 'Image Scan (Trivy)', description: 'Container vulnerability scanning', status: 'done', category: 'security' },
  { id: 'image-sign', name: 'Image Signing (Cosign)', description: 'Cryptographic image signatures', status: 'done', category: 'artifact' },
  { id: 'registry-push', name: 'Registry Push', description: 'GHCR / DockerHub / ACR / ECR', status: 'done', category: 'artifact' },
  
  // Approval & Governance
  { id: 'rbac-roles', name: 'RBAC Roles', description: 'Admin, Operator, Viewer roles', status: 'done', category: 'approval' },
  { id: 'approval-gates', name: 'Approval Gates', description: 'Multi-approver workflow', status: 'done', category: 'approval' },
  { id: 'audit-logs', name: 'Audit Logs', description: 'Complete audit trail', status: 'done', category: 'approval' },
  { id: 'env-locks', name: 'Environment Locks', description: 'Lock environments for safety', status: 'done', category: 'approval' },
  
  // Environments
  { id: 'multi-env', name: 'Multi-Environment Support', description: 'Dev, UAT, Staging, PreProd, Prod', status: 'done', category: 'cd' },
  { id: 'rolling', name: 'Rolling Deployments', description: 'Zero-downtime rolling updates', status: 'done', category: 'cd' },
  { id: 'canary', name: 'Canary Deployments', description: 'Progressive rollout with traffic split', status: 'pending', category: 'cd' },
  { id: 'blue-green', name: 'Blue-Green Deployments', description: 'Zero-downtime with instant rollback', status: 'pending', category: 'cd' },
  
  // Observability
  { id: 'otel-traces', name: 'OpenTelemetry Traces', description: 'Distributed tracing', status: 'done', category: 'observability' },
  { id: 'otel-metrics', name: 'OpenTelemetry Metrics', description: 'System and app metrics', status: 'done', category: 'observability' },
  { id: 'realtime-logs', name: 'Real-time Logs', description: 'Live log streaming', status: 'done', category: 'observability' },
  { id: 'checkpoints', name: 'Checkpoints', description: 'Pipeline state snapshots', status: 'done', category: 'observability' },
  { id: 'rollback', name: 'Rollback Support', description: 'One-click rollback to previous', status: 'done', category: 'cd' },
  
  // Locked for v1.0
  { id: 'ci-locked', name: 'CI Pipeline Locked', description: 'No additional scanners without version bump', status: 'locked', category: 'ci', version: 'MVP 1.0' },
  { id: 'approval-locked', name: 'Approval Schema Locked', description: 'Role requirements frozen', status: 'locked', category: 'approval', version: 'MVP 1.0' },
  
  // Future (v1.1+)
  { id: 'argocd', name: 'ArgoCD Integration', description: 'GitOps-based deployment', status: 'future', category: 'cd', version: 'v1.1' },
  { id: 'fluxcd', name: 'FluxCD Integration', description: 'Alternative GitOps solution', status: 'future', category: 'cd', version: 'v1.1' },
  { id: 'k8s-console', name: 'Live K8s Console', description: 'Real-time pod/event viewer', status: 'future', category: 'cd', version: 'v1.1' },
  { id: 'swap-deploy', name: 'Swap Deployment', description: 'PreProd to Prod slot swap', status: 'future', category: 'cd', version: 'v1.2' },
  { id: 'break-glass', name: 'Break Glass Override', description: 'Emergency CTO-only bypass', status: 'future', category: 'approval', version: 'v1.1' },
];

const statusIcons = {
  done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  locked: <Lock className="h-4 w-4 text-blue-500" />,
  future: <Sparkles className="h-4 w-4 text-purple-500" />
};

const statusLabels = {
  done: 'DONE',
  pending: 'PENDING',
  locked: 'LOCKED',
  future: 'FUTURE'
};

const statusColors = {
  done: 'bg-green-500/10 text-green-500 border-green-500/30',
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  locked: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  future: 'bg-purple-500/10 text-purple-500 border-purple-500/30'
};

const categoryLabels = {
  ci: 'CI Pipeline',
  security: 'Security',
  approval: 'Governance',
  artifact: 'Artifacts',
  cd: 'Deployment',
  observability: 'Observability'
};

export function MVPChecklistPanel() {
  const [filter, setFilter] = useState<'all' | 'done' | 'pending' | 'locked' | 'future'>('all');

  const filteredItems = filter === 'all' 
    ? mvpChecklist 
    : mvpChecklist.filter(item => item.status === filter);

  const stats = {
    done: mvpChecklist.filter(i => i.status === 'done').length,
    pending: mvpChecklist.filter(i => i.status === 'pending').length,
    locked: mvpChecklist.filter(i => i.status === 'locked').length,
    future: mvpChecklist.filter(i => i.status === 'future').length,
    total: mvpChecklist.length
  };

  const completionPercentage = Math.round((stats.done / stats.total) * 100);

  // Group by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              MVP 1.0 Checklist
              <Badge variant="outline" className="ml-2">LOCKED</Badge>
            </CardTitle>
            <CardDescription>
              OPZENIX Platform Implementation Status
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-500">{completionPercentage}%</div>
            <div className="text-xs text-muted-foreground">{stats.done}/{stats.total} Complete</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Button
            variant={filter === 'done' ? 'default' : 'outline'}
            size="sm"
            className={cn('gap-1', filter === 'done' && 'bg-green-500')}
            onClick={() => setFilter(filter === 'done' ? 'all' : 'done')}
          >
            <CheckCircle2 className="h-3 w-3" />
            {stats.done}
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            className={cn('gap-1', filter === 'pending' && 'bg-yellow-500')}
            onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
          >
            <Clock className="h-3 w-3" />
            {stats.pending}
          </Button>
          <Button
            variant={filter === 'locked' ? 'default' : 'outline'}
            size="sm"
            className={cn('gap-1', filter === 'locked' && 'bg-blue-500')}
            onClick={() => setFilter(filter === 'locked' ? 'all' : 'locked')}
          >
            <Lock className="h-3 w-3" />
            {stats.locked}
          </Button>
          <Button
            variant={filter === 'future' ? 'default' : 'outline'}
            size="sm"
            className={cn('gap-1', filter === 'future' && 'bg-purple-500')}
            onClick={() => setFilter(filter === 'future' ? 'all' : 'future')}
          >
            <Sparkles className="h-3 w-3" />
            {stats.future}
          </Button>
        </div>

        {/* Checklist Items */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h4>
                <div className="space-y-2">
                  {items.map(item => (
                    <div 
                      key={item.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border',
                        statusColors[item.status]
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {statusIcons[item.status]}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{item.name}</span>
                            {item.version && (
                              <Badge variant="outline" className="text-xs h-4 px-1">
                                {item.version}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs shrink-0', statusColors[item.status])}
                      >
                        {statusLabels[item.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>Last updated: {new Date().toLocaleDateString()}</span>
          <Button variant="ghost" size="sm" className="gap-1 h-6 text-xs">
            View Documentation <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
