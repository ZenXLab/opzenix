import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Lock, 
  UserCheck, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Rocket,
  RotateCcw,
  KeyRound,
  Users,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Role {
  id: string;
  name: string;
  environments: string[];
  permissions: string[];
  description: string;
  icon: React.ReactNode;
}

interface RBACVisualizationProps {
  currentEnvironment?: string;
  onRoleClick?: (roleId: string) => void;
}

const roles: Role[] = [
  {
    id: 'tech_lead',
    name: 'Tech Lead',
    environments: ['dev'],
    permissions: ['approve', 'deploy', 'view'],
    description: 'Development environment owner',
    icon: <Users className="h-4 w-4" />
  },
  {
    id: 'qa_lead',
    name: 'QA Lead',
    environments: ['uat'],
    permissions: ['approve', 'view'],
    description: 'UAT environment gatekeeper',
    icon: <CheckCircle2 className="h-4 w-4" />
  },
  {
    id: 'architect',
    name: 'Architect',
    environments: ['staging', 'preprod'],
    permissions: ['approve', 'view'],
    description: 'Architecture review authority',
    icon: <Building2 className="h-4 w-4" />
  },
  {
    id: 'cto',
    name: 'CTO',
    environments: ['preprod', 'prod'],
    permissions: ['approve', 'deploy', 'break_glass'],
    description: 'Executive approval authority',
    icon: <KeyRound className="h-4 w-4" />
  },
  {
    id: 'security_head',
    name: 'Security Head',
    environments: ['prod'],
    permissions: ['approve', 'view'],
    description: 'Security compliance gate',
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: 'platform_owner',
    name: 'Platform Owner',
    environments: ['prod'],
    permissions: ['approve', 'deploy', 'rollback'],
    description: 'Production deployment authority',
    icon: <Rocket className="h-4 w-4" />
  }
];

const environments = ['dev', 'uat', 'staging', 'preprod', 'prod'];

const permissionIcons: Record<string, React.ReactNode> = {
  approve: <UserCheck className="h-3 w-3" />,
  deploy: <Rocket className="h-3 w-3" />,
  view: <Eye className="h-3 w-3" />,
  rollback: <RotateCcw className="h-3 w-3" />,
  break_glass: <AlertTriangle className="h-3 w-3" />
};

const permissionColors: Record<string, string> = {
  approve: 'bg-green-500/10 text-green-500 border-green-500/30',
  deploy: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  view: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
  rollback: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  break_glass: 'bg-red-500/10 text-red-500 border-red-500/30'
};

const rbacRules = [
  { rule: 'No role stacking', description: 'Users cannot combine roles for escalated access', status: 'enforced' },
  { rule: 'No self-approval', description: 'Users cannot approve their own changes', status: 'enforced' },
  { rule: 'Prod requires 3 approvals', description: 'Production deployments need 3 different approvers', status: 'enforced' },
  { rule: 'Break-glass audit', description: 'Emergency overrides require CTO + audit flag', status: 'enforced' }
];

export function RBACVisualization({ currentEnvironment = 'prod', onRoleClick }: RBACVisualizationProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [hoveredEnv, setHoveredEnv] = useState<string | null>(null);

  const handleRoleClick = (roleId: string) => {
    setSelectedRole(selectedRole === roleId ? null : roleId);
    onRoleClick?.(roleId);
  };

  const getRequiredApprovals = (env: string): number => {
    switch (env.toLowerCase()) {
      case 'prod': return 3;
      case 'preprod': return 2;
      case 'staging': return 2;
      default: return 1;
    }
  };

  const getApproversForEnv = (env: string): Role[] => {
    return roles.filter(r => 
      r.environments.includes(env.toLowerCase()) && 
      r.permissions.includes('approve')
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              RBAC Model
              <Badge variant="outline" className="ml-2 text-xs">
                <Lock className="h-3 w-3 mr-1" />
                LOCKED
              </Badge>
            </CardTitle>
            <CardDescription>
              Role-based access control for environment governance
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              'text-sm',
              currentEnvironment.toLowerCase() === 'prod' && 'border-red-500 text-red-500'
            )}
          >
            {currentEnvironment.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {/* Environment Permission Matrix */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            Environment Permission Matrix
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Role</th>
                  {environments.map(env => (
                    <th 
                      key={env}
                      className={cn(
                        'text-center py-2 px-2 font-medium uppercase text-xs',
                        hoveredEnv === env && 'bg-primary/5',
                        currentEnvironment.toLowerCase() === env && 'text-primary'
                      )}
                      onMouseEnter={() => setHoveredEnv(env)}
                      onMouseLeave={() => setHoveredEnv(null)}
                    >
                      {env}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr 
                    key={role.id}
                    className={cn(
                      'border-b last:border-0 cursor-pointer hover:bg-muted/30',
                      selectedRole === role.id && 'bg-primary/5'
                    )}
                    onClick={() => handleRoleClick(role.id)}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {role.icon}
                        <span className="font-medium">{role.name}</span>
                      </div>
                    </td>
                    {environments.map(env => {
                      const hasAccess = role.environments.includes(env);
                      const permissions = hasAccess ? role.permissions : [];
                      
                      return (
                        <td 
                          key={env}
                          className={cn(
                            'text-center py-3 px-2',
                            hoveredEnv === env && 'bg-primary/5'
                          )}
                        >
                          {hasAccess ? (
                            <div className="flex justify-center gap-1 flex-wrap">
                              {permissions.slice(0, 2).map(perm => (
                                <Badge 
                                  key={perm}
                                  variant="outline"
                                  className={cn('h-5 px-1.5 text-xs', permissionColors[perm])}
                                >
                                  {permissionIcons[perm]}
                                </Badge>
                              ))}
                              {permissions.length > 2 && (
                                <Badge variant="outline" className="h-5 px-1.5 text-xs">
                                  +{permissions.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Separator />

        {/* Current Environment Approvers */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            Required Approvers for {currentEnvironment.toUpperCase()}
            <Badge variant="secondary" className="ml-auto text-xs">
              {getRequiredApprovals(currentEnvironment)} Required
            </Badge>
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {getApproversForEnv(currentEnvironment).map(role => (
              <div 
                key={role.id}
                className="p-3 bg-muted/30 rounded-lg border"
              >
                <div className="flex items-center gap-2 mb-1">
                  {role.icon}
                  <span className="font-medium text-sm">{role.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{role.description}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {role.permissions.map(perm => (
                    <Badge 
                      key={perm}
                      variant="outline"
                      className={cn('text-xs h-5', permissionColors[perm])}
                    >
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* RBAC Rules */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Enforced RBAC Rules
          </h4>
          <div className="space-y-2">
            {rbacRules.map((rule, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <div>
                    <span className="text-sm font-medium">{rule.rule}</span>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-xs">
                  {rule.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Break Glass Warning */}
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-500">Break Glass Protocol</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Emergency bypass requires CTO role, mandatory audit flag, and generates 
                immediate notification to Security Head and Platform Owner.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 text-red-500 border-red-500/30 hover:bg-red-500/10"
                disabled
              >
                <KeyRound className="h-3 w-3 mr-1" />
                Break Glass (CTO Only)
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 text-xs text-muted-foreground text-center">
          <Lock className="h-3 w-3 inline mr-1" />
          RBAC schema locked for MVP 1.0.0 — No modifications without version bump
        </div>
      </CardContent>
    </Card>
  );
}
