import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  GitBranch, 
  Cloud, 
  Users, 
  Settings, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Rocket,
  Shield,
  Database,
  Key,
  Globe,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminOnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

type Step = 'welcome' | 'connections' | 'environments' | 'team' | 'review';

interface ConnectionConfig {
  github: { enabled: boolean; org: string; repo: string };
  azure: { enabled: boolean; subscription: string; resourceGroup: string };
  aws: { enabled: boolean; region: string; accountId: string };
  vault: { enabled: boolean; url: string };
}

interface EnvironmentConfig {
  development: { enabled: boolean; autoApprove: boolean };
  staging: { enabled: boolean; autoApprove: boolean };
  production: { enabled: boolean; autoApprove: boolean };
}

interface TeamMember {
  email: string;
  role: 'admin' | 'operator' | 'viewer';
}

export function AdminOnboardingWizard({ onComplete, onSkip }: AdminOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [connections, setConnections] = useState<ConnectionConfig>({
    github: { enabled: false, org: '', repo: '' },
    azure: { enabled: false, subscription: '', resourceGroup: '' },
    aws: { enabled: false, region: 'us-east-1', accountId: '' },
    vault: { enabled: false, url: '' }
  });
  const [environments, setEnvironments] = useState<EnvironmentConfig>({
    development: { enabled: true, autoApprove: true },
    staging: { enabled: true, autoApprove: false },
    production: { enabled: true, autoApprove: false }
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'operator' | 'viewer'>('viewer');

  const steps: Step[] = ['welcome', 'connections', 'environments', 'team', 'review'];
  const currentIndex = steps.indexOf(currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  const nextStep = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const prevStep = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const addTeamMember = () => {
    if (newMemberEmail && !teamMembers.find(m => m.email === newMemberEmail)) {
      setTeamMembers([...teamMembers, { email: newMemberEmail, role: newMemberRole }]);
      setNewMemberEmail('');
      setNewMemberRole('viewer');
    }
  };

  const removeTeamMember = (email: string) => {
    setTeamMembers(teamMembers.filter(m => m.email !== email));
  };

  const handleComplete = () => {
    toast.success('Onboarding complete! Your control plane is ready.');
    onComplete();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
            ${index < currentIndex 
              ? 'bg-primary text-primary-foreground' 
              : index === currentIndex 
                ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' 
                : 'bg-muted text-muted-foreground'}
          `}>
            {index < currentIndex ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
          </div>
          {index < steps.length - 1 && (
            <div className={`w-16 h-1 mx-2 rounded ${index < currentIndex ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderWelcome = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center">
        <Rocket className="w-10 h-10 text-primary-foreground" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">Welcome to Opzenix Control Plane</h2>
        <p className="text-muted-foreground mt-2">
          Let's configure your enterprise deployment platform in just a few steps.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 pt-4">
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <GitBranch className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Connect Sources</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <Layers className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Setup Environments</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Invite Team</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderConnections = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Configure Connections</h2>
        <p className="text-muted-foreground">Connect your source control, cloud providers, and secrets management.</p>
      </div>

      <div className="space-y-4">
        {/* GitHub */}
        <Card className={connections.github.enabled ? 'ring-2 ring-primary' : ''}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Checkbox 
                checked={connections.github.enabled}
                onCheckedChange={(checked) => 
                  setConnections({...connections, github: {...connections.github, enabled: !!checked}})
                }
              />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  <span className="font-medium">GitHub</span>
                </div>
                {connections.github.enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Organization</Label>
                      <Input 
                        placeholder="my-org"
                        value={connections.github.org}
                        onChange={(e) => setConnections({
                          ...connections, 
                          github: {...connections.github, org: e.target.value}
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Repository</Label>
                      <Input 
                        placeholder="my-repo"
                        value={connections.github.repo}
                        onChange={(e) => setConnections({
                          ...connections, 
                          github: {...connections.github, repo: e.target.value}
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Azure */}
        <Card className={connections.azure.enabled ? 'ring-2 ring-primary' : ''}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Checkbox 
                checked={connections.azure.enabled}
                onCheckedChange={(checked) => 
                  setConnections({...connections, azure: {...connections.azure, enabled: !!checked}})
                }
              />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Azure</span>
                </div>
                {connections.azure.enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Subscription ID</Label>
                      <Input 
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx"
                        value={connections.azure.subscription}
                        onChange={(e) => setConnections({
                          ...connections, 
                          azure: {...connections.azure, subscription: e.target.value}
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Resource Group</Label>
                      <Input 
                        placeholder="my-resource-group"
                        value={connections.azure.resourceGroup}
                        onChange={(e) => setConnections({
                          ...connections, 
                          azure: {...connections.azure, resourceGroup: e.target.value}
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AWS */}
        <Card className={connections.aws.enabled ? 'ring-2 ring-primary' : ''}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Checkbox 
                checked={connections.aws.enabled}
                onCheckedChange={(checked) => 
                  setConnections({...connections, aws: {...connections.aws, enabled: !!checked}})
                }
              />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">AWS</span>
                </div>
                {connections.aws.enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Region</Label>
                      <Select 
                        value={connections.aws.region}
                        onValueChange={(v) => setConnections({
                          ...connections, 
                          aws: {...connections.aws, region: v}
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                          <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                          <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                          <SelectItem value="ap-south-1">Asia Pacific (Mumbai)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Account ID</Label>
                      <Input 
                        placeholder="123456789012"
                        value={connections.aws.accountId}
                        onChange={(e) => setConnections({
                          ...connections, 
                          aws: {...connections.aws, accountId: e.target.value}
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vault */}
        <Card className={connections.vault.enabled ? 'ring-2 ring-primary' : ''}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Checkbox 
                checked={connections.vault.enabled}
                onCheckedChange={(checked) => 
                  setConnections({...connections, vault: {...connections.vault, enabled: !!checked}})
                }
              />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">HashiCorp Vault</span>
                </div>
                {connections.vault.enabled && (
                  <div>
                    <Label className="text-xs">Vault URL</Label>
                    <Input 
                      placeholder="https://vault.example.com"
                      value={connections.vault.url}
                      onChange={(e) => setConnections({
                        ...connections, 
                        vault: {...connections.vault, url: e.target.value}
                      })}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderEnvironments = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Configure Environments</h2>
        <p className="text-muted-foreground">Set up your deployment environments and approval workflows.</p>
      </div>

      <div className="space-y-4">
        {(['development', 'staging', 'production'] as const).map((env) => (
          <Card key={env} className={environments[env].enabled ? 'ring-2 ring-primary' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox 
                    checked={environments[env].enabled}
                    onCheckedChange={(checked) => 
                      setEnvironments({
                        ...environments, 
                        [env]: {...environments[env], enabled: !!checked}
                      })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    <span className="font-medium capitalize">{env}</span>
                  </div>
                </div>
                {environments[env].enabled && (
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id={`${env}-auto`}
                      checked={environments[env].autoApprove}
                      onCheckedChange={(checked) => 
                        setEnvironments({
                          ...environments, 
                          [env]: {...environments[env], autoApprove: !!checked}
                        })
                      }
                    />
                    <Label htmlFor={`${env}-auto`} className="text-sm">Auto-approve</Label>
                  </div>
                )}
              </div>
              {environments[env].enabled && (
                <div className="mt-3 pl-10">
                  <Badge variant={env === 'production' ? 'destructive' : env === 'staging' ? 'secondary' : 'outline'}>
                    {env === 'production' ? 'Protected' : env === 'staging' ? 'Pre-prod' : 'Dev'}
                  </Badge>
                  {!environments[env].autoApprove && (
                    <Badge variant="outline" className="ml-2">
                      <Shield className="w-3 h-3 mr-1" />
                      Requires Approval
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Invite Team Members</h2>
        <p className="text-muted-foreground">Add team members and assign their roles.</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input 
                placeholder="email@example.com"
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
            </div>
            <Select value={newMemberRole} onValueChange={(v: 'admin' | 'operator' | 'viewer') => setNewMemberRole(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addTeamMember}>Add</Button>
          </div>

          {teamMembers.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              {teamMembers.map((member) => (
                <div key={member.email} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{member.role}</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeTeamMember(member.email)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {teamMembers.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No team members added yet. You can skip this step and add them later.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderReview = () => {
    const enabledConnections = Object.entries(connections).filter(([, v]) => v.enabled);
    const enabledEnvironments = Object.entries(environments).filter(([, v]) => v.enabled);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Review Configuration</h2>
          <p className="text-muted-foreground">Review your setup before completing onboarding.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{enabledConnections.length}</p>
              <p className="text-xs text-muted-foreground">
                {enabledConnections.map(([k]) => k).join(', ') || 'None'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Environments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{enabledEnvironments.length}</p>
              <p className="text-xs text-muted-foreground">
                {enabledEnvironments.map(([k]) => k).join(', ') || 'None'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{teamMembers.length}</p>
              <p className="text-xs text-muted-foreground">
                {teamMembers.length > 0 ? 'Invites pending' : 'Add later'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-primary" />
            <div>
              <p className="font-medium">You're all set!</p>
              <p className="text-sm text-muted-foreground">
                Click "Complete Setup" to start using Opzenix Control Plane.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">Setup Wizard</Badge>
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip for now
            </Button>
          </div>
          <Progress value={progress} className="mt-4" />
          {renderStepIndicator()}
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {currentStep === 'welcome' && renderWelcome()}
          {currentStep === 'connections' && renderConnections()}
          {currentStep === 'environments' && renderEnvironments()}
          {currentStep === 'team' && renderTeam()}
          {currentStep === 'review' && renderReview()}
        </CardContent>
        <div className="p-6 pt-0 flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {currentStep === 'review' ? (
            <Button onClick={handleComplete}>
              Complete Setup
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
