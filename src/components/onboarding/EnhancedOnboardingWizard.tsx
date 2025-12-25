import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Target,
  Github,
  Lock,
  Globe,
  Loader2,
  AlertCircle,
  Code,
  Package,
  Search,
  RefreshCw,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGitHubConnection } from '@/hooks/useGitHubConnection';
import { cn } from '@/lib/utils';

interface EnhancedOnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'welcome' | 'github' | 'repository' | 'stack' | 'environments' | 'project' | 'complete';

const STEPS: Step[] = ['welcome', 'github', 'repository', 'stack', 'environments', 'project', 'complete'];

// Language/Framework/Build tool options for manual override
const LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C#', 'Ruby', 'PHP'];
const FRAMEWORKS: Record<string, string[]> = {
  'TypeScript': ['React', 'Next.js', 'Angular', 'Vue', 'NestJS', 'Express'],
  'JavaScript': ['React', 'Vue', 'Express', 'Next.js', 'Node.js'],
  'Python': ['Django', 'FastAPI', 'Flask', 'Streamlit'],
  'Java': ['Spring Boot', 'Quarkus', 'Micronaut'],
  'Go': ['Gin', 'Echo', 'Fiber', 'Chi'],
  'Rust': ['Actix', 'Rocket', 'Axum'],
  'C#': ['.NET Core', 'ASP.NET', 'Blazor'],
  'Ruby': ['Rails', 'Sinatra', 'Hanami'],
  'PHP': ['Laravel', 'Symfony', 'CodeIgniter'],
};
const BUILD_TOOLS: Record<string, string[]> = {
  'TypeScript': ['npm', 'yarn', 'pnpm', 'vite', 'webpack'],
  'JavaScript': ['npm', 'yarn', 'webpack', 'vite'],
  'Python': ['pip', 'poetry', 'pipenv', 'conda'],
  'Java': ['Maven', 'Gradle'],
  'Go': ['go mod', 'make'],
  'Rust': ['Cargo'],
  'C#': ['dotnet', 'MSBuild'],
  'Ruby': ['Bundler', 'rake'],
  'PHP': ['Composer'],
};

export function EnhancedOnboardingWizard({ open, onClose, onComplete }: EnhancedOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // GitHub connection
  const {
    isConnected: githubConnected,
    isLoading: githubLoading,
    user: githubUser,
    repos,
    branches,
    detectedStack,
    connectWithToken,
    disconnect,
    fetchRepos,
    fetchBranches,
    detectStack,
    fetchOrganizations,
    organizations
  } = useGitHubConnection();
  
  // Form state
  const [githubToken, setGithubToken] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<{
    id: number;
    name: string;
    fullName: string;
    owner: string;
    isPrivate: boolean;
    defaultBranch: string;
  } | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  
  // Stack configuration (auto-detected or manual override)
  const [language, setLanguage] = useState<string>('');
  const [framework, setFramework] = useState<string>('');
  const [buildTool, setBuildTool] = useState<string>('');
  const [isManualOverride, setIsManualOverride] = useState(false);
  
  // Environment selection
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>(['development', 'staging', 'production']);
  
  // Project details
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const currentIndex = STEPS.indexOf(currentStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  // Fetch repos when GitHub is connected
  useEffect(() => {
    if (githubConnected && currentStep === 'repository') {
      fetchRepos();
      fetchOrganizations();
    }
  }, [githubConnected, currentStep]);

  // Fetch branches when repo is selected
  useEffect(() => {
    if (selectedRepo) {
      fetchBranches(selectedRepo.owner, selectedRepo.name);
      setSelectedBranch(selectedRepo.defaultBranch);
      setProjectName(selectedRepo.name);
    }
  }, [selectedRepo]);

  // Detect stack when repo and branch selected
  useEffect(() => {
    if (selectedRepo && selectedBranch && currentStep === 'stack') {
      detectStack(selectedRepo.owner, selectedRepo.name).then((stack) => {
        if (stack) {
          setLanguage(stack.language || '');
          setFramework(stack.framework || '');
          setBuildTool(stack.buildTool || '');
        }
      });
    }
  }, [selectedRepo, selectedBranch, currentStep]);

  const handleConnectGitHub = async () => {
    if (!githubToken.trim()) {
      toast.error('Please enter a GitHub Personal Access Token');
      return;
    }
    const success = await connectWithToken(githubToken);
    if (success) {
      setGithubToken('');
    }
  };

  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNext = async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < STEPS.length) {
      if (currentStep === 'project') {
        await createProject();
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

  const canProceed = () => {
    switch (currentStep) {
      case 'github':
        return githubConnected;
      case 'repository':
        return selectedRepo && selectedBranch;
      case 'stack':
        return language && framework && buildTool;
      case 'environments':
        return selectedEnvironments.length > 0;
      case 'project':
        return projectName.trim().length > 0;
      default:
        return true;
    }
  };

  const createProject = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // RBAC: Ensure user has a role (auto-assign admin if first time)
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!existingRole) {
        // First-time user: assign admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: 'admin' });
        
        if (roleError) {
          console.error('Failed to assign role:', roleError);
          // Continue anyway - the INSERT policy should handle this
        }
      }

      // Create organization if doesn't exist
      let orgId: string | null = null;
      const selectedOrg = organizations.find(o => o.login === selectedRepo?.owner);
      
      if (selectedOrg) {
        // Check if org exists
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('github_org_name', selectedOrg.login)
          .single();
          
        if (existingOrg) {
          orgId = existingOrg.id;
        } else {
          // Create org
          const { data: newOrg, error: orgError } = await supabase
            .from('organizations')
            .insert({
              name: selectedOrg.login,
              slug: selectedOrg.login.toLowerCase(),
              owner_id: user.id,
              github_org_name: selectedOrg.login,
              avatar_url: selectedOrg.avatarUrl,
              description: selectedOrg.description
            })
            .select('id')
            .single();
            
          if (!orgError && newOrg) {
            orgId = newOrg.id;
          }
        }
      }

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          description: projectDescription || null,
          owner_id: user.id,
          organization_id: orgId,
          github_repo_owner: selectedRepo?.owner,
          github_repo_name: selectedRepo?.name,
          github_repo_url: `https://github.com/${selectedRepo?.fullName}`,
          default_branch: selectedBranch,
          detected_language: language,
          detected_framework: framework,
          detected_build_tool: buildTool,
          is_private: selectedRepo?.isPrivate || false
        })
        .select('id')
        .single();

      if (projectError) {
        console.error('Project creation error:', projectError);
        throw new Error(projectError.message || 'Failed to create project');
      }

      // Create GitHub integration
      await supabase.from('github_integrations').insert({
        user_id: user.id,
        repository_owner: selectedRepo?.owner || '',
        repository_name: selectedRepo?.name || '',
        default_branch: selectedBranch
      });

      // Create initial version
      if (project) {
        // Get latest commit
        const { data: tokenData } = await supabase
          .from('github_tokens')
          .select('encrypted_token')
          .eq('user_id', user.id)
          .single();

        if (tokenData?.encrypted_token) {
          const { data: commitData } = await supabase.functions.invoke('github-api', {
            body: {
              action: 'get-commit',
              token: tokenData.encrypted_token,
              owner: selectedRepo?.owner,
              repo: selectedRepo?.name,
              branch: selectedBranch
            }
          });

          if (commitData?.sha) {
            await supabase.from('deployment_versions').insert({
              project_id: project.id,
              version_tag: 'v0.1.0',
              branch: selectedBranch,
              commit_sha: commitData.sha,
              commit_message: commitData.message,
              commit_author: commitData.author,
              commit_timestamp: commitData.date,
              environment: 'development',
              is_current: true
            });
          }
        }
      }

      // Create environments
      for (const env of selectedEnvironments) {
        await supabase.from('environment_configs').insert({
          name: `${projectName} - ${env}`,
          environment: env,
          created_by: user.id,
          variables: {
            language,
            framework,
            buildTool
          }
        });
      }

      // Create flow template
      const basicNodes = [
        { id: 'trigger', type: 'trigger', position: { x: 100, y: 100 }, data: { label: 'Git Push', config: { branch: selectedBranch } } },
        { id: 'build', type: 'build', position: { x: 300, y: 100 }, data: { label: `${buildTool} Build`, config: { buildTool } } },
        { id: 'test', type: 'test', position: { x: 500, y: 100 }, data: { label: 'Run Tests', config: {} } },
        { id: 'deploy', type: 'deploy', position: { x: 700, y: 100 }, data: { label: 'Deploy', config: {} } }
      ];

      const basicEdges = [
        { id: 'e1', source: 'trigger', target: 'build' },
        { id: 'e2', source: 'build', target: 'test' },
        { id: 'e3', source: 'test', target: 'deploy' }
      ];

      await supabase.from('flow_templates').insert({
        name: `${projectName} Pipeline`,
        description: `CI/CD pipeline for ${selectedRepo?.fullName} (${framework})`,
        type: 'cicd',
        nodes: basicNodes,
        edges: basicEdges,
        created_by: user.id
      });

      // Update user preferences
      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        onboarding_state: { 
          completed: true, 
          completedAt: new Date().toISOString(),
          projectId: project?.id
        }
      });

      // Log audit event
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'project_created',
        resource_type: 'project',
        resource_id: project?.id,
        details: {
          project_name: projectName,
          repository: selectedRepo?.fullName,
          environments: selectedEnvironments,
          detected_stack: { language, framework, buildTool }
        }
      });

      toast.success('Project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Setup Your Project</DialogTitle>
          </div>
          <DialogDescription>
            Connect your GitHub repo and configure your CI/CD pipeline.
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="mb-4" />

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="min-h-[320px]">
            {/* Welcome Step */}
            {currentStep === 'welcome' && (
              <div className="space-y-6">
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Rocket className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Welcome to Opzenix</h3>
                  <p className="text-muted-foreground">
                    Set up your enterprise CI/CD pipeline in minutes with real GitHub integration.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card className="text-center p-4">
                    <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
                    <h4 className="font-medium text-sm">Auto-Detection</h4>
                    <p className="text-xs text-muted-foreground">Stack auto-detected</p>
                  </Card>
                  <Card className="text-center p-4">
                    <Target className="h-6 w-6 text-primary mx-auto mb-2" />
                    <h4 className="font-medium text-sm">Real Repos</h4>
                    <p className="text-xs text-muted-foreground">Public & private</p>
                  </Card>
                  <Card className="text-center p-4">
                    <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
                    <h4 className="font-medium text-sm">Enterprise Ready</h4>
                    <p className="text-xs text-muted-foreground">Git-based versioning</p>
                  </Card>
                </div>
              </div>
            )}

            {/* GitHub Connection Step */}
            {currentStep === 'github' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Connect GitHub</h3>
                  <p className="text-muted-foreground text-sm">
                    Provide a Personal Access Token to access your repositories.
                  </p>
                </div>

                {githubConnected && githubUser ? (
                  <div className="p-4 bg-sec-safe/10 border border-sec-safe/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img 
                        src={githubUser.avatar_url} 
                        alt={githubUser.login}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-sec-safe" />
                          <span className="font-medium">Connected as {githubUser.login}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{githubUser.email || githubUser.name}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={disconnect}>
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="github-token">Personal Access Token</Label>
                      <div className="flex gap-2">
                        <Github className="h-5 w-5 text-muted-foreground mt-2.5" />
                        <Input
                          id="github-token"
                          type="password"
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          value={githubToken}
                          onChange={(e) => setGithubToken(e.target.value)}
                          disabled={githubLoading}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleConnectGitHub} 
                      disabled={githubLoading || !githubToken.trim()}
                      className="w-full"
                    >
                      {githubLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Github className="h-4 w-4 mr-2" />
                      )}
                      Connect GitHub
                    </Button>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Required scopes: <code className="bg-muted px-1 rounded">repo</code>, <code className="bg-muted px-1 rounded">read:org</code></p>
                      <a 
                        href="https://github.com/settings/tokens/new?scopes=repo,read:org&description=Opzenix%20CI/CD"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Create a new token →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Repository Selection Step */}
            {currentStep === 'repository' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Select Repository</h3>
                  <p className="text-muted-foreground text-sm">
                    Choose a repository to deploy. {repos.length} repositories available.
                  </p>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search repositories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <ScrollArea className="h-[200px] pr-2">
                  <div className="space-y-2">
                    {githubLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredRepos.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No repositories found
                      </div>
                    ) : (
                      filteredRepos.map((repo) => (
                        <Card
                          key={repo.id}
                          className={cn(
                            'cursor-pointer transition-all',
                            selectedRepo?.id === repo.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-muted-foreground/50'
                          )}
                          onClick={() => setSelectedRepo({
                            id: repo.id,
                            name: repo.name,
                            fullName: repo.fullName,
                            owner: repo.owner.login,
                            isPrivate: repo.isPrivate,
                            defaultBranch: repo.defaultBranch
                          })}
                        >
                          <CardContent className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                              {repo.isPrivate ? (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Globe className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{repo.fullName}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {repo.language && (
                                    <span className="flex items-center gap-1">
                                      <Code className="h-3 w-3" />
                                      {repo.language}
                                    </span>
                                  )}
                                  <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            {selectedRepo?.id === repo.id && (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {selectedRepo && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label>Deploy Branch</Label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.name} value={branch.name}>
                            <div className="flex items-center gap-2">
                              <GitBranch className="h-3 w-3" />
                              {branch.name}
                              {branch.protected && <Badge variant="secondary" className="text-[10px] h-4">Protected</Badge>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Stack Detection Step */}
            {currentStep === 'stack' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Tech Stack Configuration</h3>
                    <p className="text-muted-foreground text-sm">
                      {isManualOverride ? 'Manually configure your stack' : 'Auto-detected from repository'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsManualOverride(!isManualOverride)}
                  >
                    {isManualOverride ? <Eye className="h-4 w-4 mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    {isManualOverride ? 'Use Auto-Detect' : 'Manual Override'}
                  </Button>
                </div>

                {githubLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Analyzing repository...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!isManualOverride && detectedStack && (
                      <div className="p-3 bg-sec-safe/10 border border-sec-safe/20 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-sec-safe" />
                        <span className="text-sm">
                          Detected with {Math.round((detectedStack.confidence || 0) * 100)}% confidence
                        </span>
                      </div>
                    )}

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select 
                          value={language} 
                          onValueChange={(val) => {
                            setLanguage(val);
                            setFramework('');
                            setBuildTool('');
                          }}
                          disabled={!isManualOverride && !!detectedStack?.language}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.map((lang) => (
                              <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Framework</Label>
                        <Select 
                          value={framework} 
                          onValueChange={setFramework}
                          disabled={(!isManualOverride && !!detectedStack?.framework) || !language}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select framework" />
                          </SelectTrigger>
                          <SelectContent>
                            {(FRAMEWORKS[language] || []).map((fw) => (
                              <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Build Tool</Label>
                        <Select 
                          value={buildTool} 
                          onValueChange={setBuildTool}
                          disabled={(!isManualOverride && !!detectedStack?.buildTool) || !language}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select build tool" />
                          </SelectTrigger>
                          <SelectContent>
                            {(BUILD_TOOLS[language] || []).map((tool) => (
                              <SelectItem key={tool} value={tool}>{tool}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Environments Step */}
            {currentStep === 'environments' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Configure Environments</h3>
                  <p className="text-muted-foreground text-sm">
                    Select which environments you want to deploy to.
                  </p>
                </div>

                <div className="space-y-3">
                  {['development', 'staging', 'production'].map((env) => (
                    <Card
                      key={env}
                      className={cn(
                        'cursor-pointer transition-all',
                        selectedEnvironments.includes(env)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground/50'
                      )}
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

            {/* Project Details Step */}
            {currentStep === 'project' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Project Details</h3>
                  <p className="text-muted-foreground text-sm">
                    Finalize your project configuration.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="my-awesome-project"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project-description">Description (Optional)</Label>
                    <Input
                      id="project-description"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="A brief description of your project"
                    />
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">Configuration Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Repository:</div>
                      <div className="font-mono">{selectedRepo?.fullName}</div>
                      <div className="text-muted-foreground">Branch:</div>
                      <div className="font-mono">{selectedBranch}</div>
                      <div className="text-muted-foreground">Stack:</div>
                      <div>{language} / {framework} / {buildTool}</div>
                      <div className="text-muted-foreground">Environments:</div>
                      <div>{selectedEnvironments.join(', ')}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Complete Step */}
            {currentStep === 'complete' && (
              <div className="space-y-6 text-center py-6">
                <div className="w-20 h-20 bg-sec-safe/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-sec-safe" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Project Created!</h3>
                  <p className="text-muted-foreground">
                    Your project "{projectName}" is ready for deployments.
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-left">
                  <h4 className="font-medium mb-2">What's next?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Push code to <code className="bg-muted px-1 rounded">{selectedBranch}</code> to trigger builds</li>
                    <li>• Monitor executions in real-time from the dashboard</li>
                    <li>• Configure deployment strategies per environment</li>
                    <li>• Set up approval gates for production</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

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
            <Button onClick={onComplete}>
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleNext} 
              disabled={isLoading || !canProceed()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {currentStep === 'project' ? 'Create Project' : 'Continue'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
