import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket, 
  GitBranch, 
  Server, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Shield,
  Zap,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'welcome' | 'repository' | 'environments' | 'pipeline' | 'complete';

const STEPS: Step[] = ['welcome', 'repository', 'environments', 'pipeline', 'complete'];

export function OnboardingWizard({ open, onClose, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [repoUrl, setRepoUrl] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>(['development', 'staging', 'production']);
  const [pipelineName, setPipelineName] = useState('My First Pipeline');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('basic-cicd');

  const currentIndex = STEPS.indexOf(currentStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  const parseRepoUrl = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      setRepoOwner(match[1]);
      setRepoName(match[2].replace('.git', ''));
    }
  };

  const handleNext = async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < STEPS.length) {
      if (currentStep === 'pipeline') {
        await createPipeline();
      }
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const createPipeline = async () => {
    setIsLoading(true);
    try {
      // Create environments
      for (const env of selectedEnvironments) {
        await supabase.functions.invoke('create-environment', {
          body: {
            name: `${pipelineName} - ${env}`,
            environment: env,
            variables: {}
          }
        });
      }

      // Create flow template
      const basicNodes = [
        { id: 'trigger', type: 'trigger', position: { x: 100, y: 100 }, data: { label: 'Git Push', config: {} } },
        { id: 'build', type: 'build', position: { x: 300, y: 100 }, data: { label: 'Build', config: {} } },
        { id: 'test', type: 'test', position: { x: 500, y: 100 }, data: { label: 'Test', config: {} } },
        { id: 'deploy', type: 'deploy', position: { x: 700, y: 100 }, data: { label: 'Deploy', config: {} } }
      ];

      const basicEdges = [
        { id: 'e1', source: 'trigger', target: 'build' },
        { id: 'e2', source: 'build', target: 'test' },
        { id: 'e3', source: 'test', target: 'deploy' }
      ];

      await supabase.from('flow_templates').insert({
        name: pipelineName,
        description: `Auto-generated pipeline for ${repoOwner}/${repoName}`,
        type: 'cicd',
        nodes: basicNodes,
        edges: basicEdges
      });

      // If repo is connected, save GitHub integration
      if (repoOwner && repoName) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('github_integrations').insert({
            user_id: user.id,
            repository_owner: repoOwner,
            repository_name: repoName,
            default_branch: 'main'
          });
        }
      }

      toast.success('Pipeline created successfully!');
    } catch (error) {
      console.error('Error creating pipeline:', error);
      toast.error('Failed to create pipeline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    // Update user preferences to mark onboarding complete
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        onboarding_state: { completed: true, completedAt: new Date().toISOString() }
      });
    }
    onComplete();
  };

  const templates = [
    { id: 'basic-cicd', name: 'Basic CI/CD', description: 'Build, test, and deploy', icon: Rocket },
    { id: 'microservices', name: 'Microservices', description: 'Multi-service pipeline', icon: Server },
    { id: 'security-first', name: 'Security First', description: 'With security scanning', icon: Shield }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Welcome to Opzenix</DialogTitle>
          </div>
          <DialogDescription>
            Let's set up your first pipeline in under 2 minutes. No YAML required.
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="mb-6" />

        <div className="min-h-[300px]">
          {currentStep === 'welcome' && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Let's Get You Started</h3>
                <p className="text-muted-foreground">
                  We'll guide you through creating your first pipeline step by step.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="text-center p-4">
                  <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Fast Setup</h4>
                  <p className="text-xs text-muted-foreground">Under 2 minutes</p>
                </Card>
                <Card className="text-center p-4">
                  <Target className="h-6 w-6 text-primary mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Zero YAML</h4>
                  <p className="text-xs text-muted-foreground">Visual editor only</p>
                </Card>
                <Card className="text-center p-4">
                  <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
                  <h4 className="font-medium text-sm">Best Practices</h4>
                  <p className="text-xs text-muted-foreground">Built-in security</p>
                </Card>
              </div>
            </div>
          )}

          {currentStep === 'repository' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Connect Your Repository</h3>
                <p className="text-muted-foreground text-sm">
                  Paste your GitHub repository URL to get started.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repo-url">GitHub Repository URL</Label>
                  <div className="flex gap-2">
                    <GitBranch className="h-5 w-5 text-muted-foreground mt-2.5" />
                    <Input
                      id="repo-url"
                      placeholder="https://github.com/owner/repository"
                      value={repoUrl}
                      onChange={(e) => {
                        setRepoUrl(e.target.value);
                        parseRepoUrl(e.target.value);
                      }}
                    />
                  </div>
                </div>

                {repoOwner && repoName && (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Repository detected:</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {repoOwner}/{repoName}
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  You can also skip this step and connect later.
                </p>
              </div>
            </div>
          )}

          {currentStep === 'environments' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Choose Environments</h3>
                <p className="text-muted-foreground text-sm">
                  Select which environments you want to deploy to.
                </p>
              </div>

              <div className="space-y-3">
                {['development', 'staging', 'production'].map((env) => (
                  <Card
                    key={env}
                    className={`cursor-pointer transition-all ${
                      selectedEnvironments.includes(env)
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-muted-foreground/50'
                    }`}
                    onClick={() => {
                      setSelectedEnvironments((prev) =>
                        prev.includes(env)
                          ? prev.filter((e) => e !== env)
                          : [...prev, env]
                      );
                    }}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Server className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium capitalize">{env}</h4>
                          <p className="text-xs text-muted-foreground">
                            {env === 'development' && 'For local testing and development'}
                            {env === 'staging' && 'Pre-production testing environment'}
                            {env === 'production' && 'Live production environment'}
                          </p>
                        </div>
                      </div>
                      {selectedEnvironments.includes(env) && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'pipeline' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Create Your Pipeline</h3>
                <p className="text-muted-foreground text-sm">
                  Name your pipeline and choose a template.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pipeline-name">Pipeline Name</Label>
                  <Input
                    id="pipeline-name"
                    value={pipelineName}
                    onChange={(e) => setPipelineName(e.target.value)}
                    placeholder="My Pipeline"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Choose a Template</Label>
                  <div className="grid gap-3">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all ${
                          selectedTemplate === template.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-muted-foreground/50'
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <template.icon className="h-5 w-5 text-primary" />
                            <div>
                              <h4 className="font-medium">{template.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {template.description}
                              </p>
                            </div>
                          </div>
                          {selectedTemplate === template.id && (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="space-y-6 text-center py-6">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">You're All Set!</h3>
                <p className="text-muted-foreground">
                  Your pipeline "{pipelineName}" is ready to go.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <h4 className="font-medium mb-2">What's next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Push code to trigger your first build</li>
                  <li>• Monitor executions in real-time</li>
                  <li>• Customize your pipeline in the visual editor</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep === 'complete' ? (
            <Button onClick={handleComplete}>
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Continue'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
