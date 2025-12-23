import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Github, GitBranch, Box, ChevronRight, Search, 
  CheckCircle2, Loader2, Sparkles, Shield, FileCode,
  Folder, AlertTriangle, Settings, ChevronDown, ChevronUp,
  Code, Package, Server, Layers, Rocket, RefreshCw, Eye,
  Play, ArrowRight, Terminal, Database, Cloud, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Git provider icons
const GitLabIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
  </svg>
);

const BitbucketIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M.778 1.213a.768.768 0 0 0-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 0 0 .77-.646l3.27-20.03a.768.768 0 0 0-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z"/>
  </svg>
);

const AzureIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M5.483 21.3H24L14.025 4.013l-3.038 8.347 5.836 6.938L5.483 21.3zM13.23 2.7L6.105 8.677 0 19.253h5.505l7.725-16.553z"/>
  </svg>
);

const AWSCodeCommitIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4a9.6 9.6 0 110 19.2 9.6 9.6 0 010-19.2zm-1.2 4.8v9.6l7.2-4.8-7.2-4.8z"/>
  </svg>
);

const GiteaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M4.186 9.87a1.186 1.186 0 00-.95.52c-.3.43-.35.91-.14 1.37a1.235 1.235 0 001.1.66c.48 0 .91-.27 1.1-.69.2-.43.14-.91-.15-1.34-.23-.34-.59-.52-.99-.52zm15.83-.77c-.12-.49-.52-.84-1.02-.9-.5-.05-.98.21-1.22.66l-2.85 5.33h.81l2.07-3.87.69 1.29h-1.15l-.42.78h2.02l.52.97h.93l-.36-.67c.43-.18.72-.57.8-1.04.08-.47-.1-.94-.45-1.27-.37-.36-.91-.49-1.37-.28zm-7.29 2.71l-2.35.77.69-2.13 1.66 1.36zm2.81-4.48c-.06-.47-.36-.87-.79-1.05-.44-.19-.93-.12-1.3.18-.37.3-.55.78-.48 1.25l.2 1.32-3.21 1.05.79-2.44c.13-.42.04-.87-.25-1.21-.28-.34-.72-.52-1.15-.48-.44.04-.82.29-1.02.68L5.43 12.5c-.17.32-.18.7-.03 1.03.15.34.44.58.79.68l4.24 1.19-1.03 3.17c-.14.43-.05.9.24 1.24.29.34.72.52 1.16.48.43-.04.82-.29 1.02-.68l5.13-9.99c.22-.43.18-.95-.12-1.33-.29-.39-.77-.59-1.25-.52z"/>
  </svg>
);

interface GitProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  mechanism: 'oauth' | 'webhook' | 'token' | 'ssh';
  supportsWebhooks: boolean;
}

const gitProviders: GitProvider[] = [
  { id: 'github', name: 'GitHub', icon: <Github className="w-5 h-5" />, description: 'OAuth & Webhooks', mechanism: 'oauth', supportsWebhooks: true },
  { id: 'gitlab', name: 'GitLab', icon: <GitLabIcon />, description: 'OAuth & Webhooks', mechanism: 'oauth', supportsWebhooks: true },
  { id: 'bitbucket', name: 'Bitbucket', icon: <BitbucketIcon />, description: 'OAuth & Webhooks', mechanism: 'oauth', supportsWebhooks: true },
  { id: 'azure', name: 'Azure DevOps', icon: <AzureIcon />, description: 'Service Hooks', mechanism: 'token', supportsWebhooks: true },
  { id: 'aws-codecommit', name: 'AWS CodeCommit', icon: <AWSCodeCommitIcon />, description: 'IAM & SNS', mechanism: 'token', supportsWebhooks: true },
  { id: 'gitea', name: 'Gitea', icon: <GiteaIcon />, description: 'Token & Webhooks', mechanism: 'token', supportsWebhooks: true },
  { id: 'gogs', name: 'Gogs', icon: <GitBranch className="w-5 h-5" />, description: 'Token Auth', mechanism: 'token', supportsWebhooks: true },
  { id: 'self-hosted', name: 'Self-Hosted Git', icon: <Server className="w-5 h-5" />, description: 'SSH or HTTPS', mechanism: 'ssh', supportsWebhooks: false },
];

// Language/Framework/Build Tool options
const LANGUAGES = [
  'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'Kotlin', 
  'C#', 'Ruby', 'PHP', 'Swift', 'Scala', 'Elixir', 'Clojure', 'C++', 'C'
];

const FRAMEWORKS = {
  'TypeScript': ['Node.js', 'Express', 'NestJS', 'Next.js', 'React', 'Vue.js', 'Angular', 'Fastify', 'Hono', 'Deno Fresh'],
  'JavaScript': ['Node.js', 'Express', 'React', 'Vue.js', 'Angular', 'Svelte', 'Fastify', 'Koa'],
  'Python': ['FastAPI', 'Django', 'Flask', 'Starlette', 'Tornado', 'aiohttp', 'Sanic'],
  'Go': ['Gin', 'Echo', 'Fiber', 'Chi', 'Gorilla Mux', 'Buffalo', 'Standard Library'],
  'Rust': ['Actix-web', 'Rocket', 'Axum', 'Warp', 'Tide'],
  'Java': ['Spring Boot', 'Quarkus', 'Micronaut', 'Jakarta EE', 'Vert.x', 'Dropwizard'],
  'Kotlin': ['Ktor', 'Spring Boot', 'Micronaut', 'Quarkus'],
  'C#': ['.NET Core', 'ASP.NET', 'Blazor', 'Orleans'],
  'Ruby': ['Rails', 'Sinatra', 'Hanami', 'Grape'],
  'PHP': ['Laravel', 'Symfony', 'Slim', 'Lumen', 'CodeIgniter'],
  'Swift': ['Vapor', 'Kitura', 'Perfect'],
  'Scala': ['Play Framework', 'Akka HTTP', 'http4s', 'ZIO'],
  'Elixir': ['Phoenix', 'Plug'],
  'Clojure': ['Ring', 'Compojure', 'Pedestal'],
  'C++': ['Drogon', 'Crow', 'Pistache'],
  'C': ['microhttpd', 'mongoose', 'civetweb'],
};

const BUILD_TOOLS = {
  'TypeScript': ['npm', 'yarn', 'pnpm', 'bun', 'deno'],
  'JavaScript': ['npm', 'yarn', 'pnpm', 'bun'],
  'Python': ['pip', 'poetry', 'conda', 'pipenv', 'uv'],
  'Go': ['go build', 'go mod', 'mage'],
  'Rust': ['cargo'],
  'Java': ['Maven', 'Gradle', 'Ant', 'Bazel'],
  'Kotlin': ['Gradle', 'Maven'],
  'C#': ['dotnet', 'MSBuild', 'Cake'],
  'Ruby': ['bundler', 'rake'],
  'PHP': ['composer'],
  'Swift': ['Swift Package Manager', 'CocoaPods'],
  'Scala': ['sbt', 'Maven', 'Mill'],
  'Elixir': ['mix'],
  'Clojure': ['Leiningen', 'deps.edn'],
  'C++': ['CMake', 'Make', 'Bazel', 'Meson'],
  'C': ['Make', 'CMake', 'Meson'],
};

const PIPELINE_TYPES = ['CI Only', 'CI + CD', 'MLOps', 'LLMOps', 'Infrastructure as Code'];

const DEPLOYMENT_STRATEGIES = [
  { id: 'rolling', name: 'Rolling Update', description: 'Gradual replacement of instances' },
  { id: 'blue-green', name: 'Blue-Green', description: 'Switch between two environments' },
  { id: 'canary', name: 'Canary', description: 'Route % of traffic to new version' },
  { id: 'canary-feature-toggle', name: 'Canary + Feature Toggle', description: 'Canary with feature flags' },
  { id: 'recreate', name: 'Recreate', description: 'Stop old, start new' },
  { id: 'a-b-testing', name: 'A/B Testing', description: 'Split traffic for experiments' },
  { id: 'shadow', name: 'Shadow/Dark', description: 'Test with production traffic copy' },
];

interface Repository {
  id: string;
  name: string;
  fullName: string;
  branch: string;
  lastUpdated: string;
  isPrivate: boolean;
  language?: string;
}

interface DetectedConfig {
  language: string;
  framework: string;
  buildTool: string;
  hasDocker: boolean;
  hasK8s: boolean;
  hasHelm: boolean;
  hasTerraform: boolean;
  suggestedPipeline: string;
  detectedFiles: string[];
  confidence: number;
}

interface DeploymentConfig {
  strategy: string;
  environments: string[];
  approvals: boolean;
  autoRollback: boolean;
  healthChecks: boolean;
  notifications: boolean;
}

interface GitConnectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (config: DetectedConfig & DeploymentConfig) => void;
}

type WizardStep = 'provider' | 'repository' | 'detecting' | 'config' | 'deployment' | 'preview' | 'review';

// Simulated repos based on provider
const getReposForProvider = (providerId: string): Repository[] => {
  const baseRepos = [
    { id: 'r1', name: 'api-gateway', fullName: `org/api-gateway`, branch: 'main', lastUpdated: '2h ago', isPrivate: true, language: 'TypeScript' },
    { id: 'r2', name: 'ml-pipeline', fullName: `org/ml-pipeline`, branch: 'main', lastUpdated: '1d ago', isPrivate: true, language: 'Python' },
    { id: 'r3', name: 'auth-service', fullName: `org/auth-service`, branch: 'main', lastUpdated: '3d ago', isPrivate: true, language: 'Go' },
    { id: 'r4', name: 'frontend-app', fullName: `org/frontend-app`, branch: 'develop', lastUpdated: '5h ago', isPrivate: false, language: 'TypeScript' },
    { id: 'r5', name: 'llm-gateway', fullName: `org/llm-gateway`, branch: 'main', lastUpdated: '1w ago', isPrivate: true, language: 'Python' },
    { id: 'r6', name: 'infra-terraform', fullName: `org/infra-terraform`, branch: 'main', lastUpdated: '2d ago', isPrivate: true, language: 'HCL' },
    { id: 'r7', name: 'data-pipeline', fullName: `org/data-pipeline`, branch: 'main', lastUpdated: '4h ago', isPrivate: true, language: 'Python' },
    { id: 'r8', name: 'mobile-backend', fullName: `org/mobile-backend`, branch: 'main', lastUpdated: '6h ago', isPrivate: true, language: 'Java' },
  ];
  return baseRepos.map(r => ({ ...r, fullName: `${providerId}/${r.name}` }));
};

const GitConnectionWizard = ({ isOpen, onClose, onComplete }: GitConnectionWizardProps) => {
  const [step, setStep] = useState<WizardStep>('provider');
  const [selectedProvider, setSelectedProvider] = useState<GitProvider | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [detectedConfig, setDetectedConfig] = useState<DetectedConfig | null>(null);
  const [isManualOverride, setIsManualOverride] = useState(false);
  
  // Manual config state
  const [manualLanguage, setManualLanguage] = useState('');
  const [manualFramework, setManualFramework] = useState('');
  const [manualBuildTool, setManualBuildTool] = useState('');
  const [manualPipelineType, setManualPipelineType] = useState('CI + CD');
  
  // Deployment config
  const [deploymentStrategy, setDeploymentStrategy] = useState('canary');
  const [environments, setEnvironments] = useState(['development', 'staging', 'production']);
  const [requireApprovals, setRequireApprovals] = useState(true);
  const [autoRollback, setAutoRollback] = useState(true);
  const [healthChecks, setHealthChecks] = useState(true);

  const repositories = useMemo(() => 
    selectedProvider ? getReposForProvider(selectedProvider.id) : [],
    [selectedProvider]
  );

  const filteredRepos = repositories.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableFrameworks = useMemo(() => 
    FRAMEWORKS[manualLanguage as keyof typeof FRAMEWORKS] || [],
    [manualLanguage]
  );

  const availableBuildTools = useMemo(() =>
    BUILD_TOOLS[manualLanguage as keyof typeof BUILD_TOOLS] || [],
    [manualLanguage]
  );

  const handleProviderSelect = (provider: GitProvider) => {
    setSelectedProvider(provider);
    setStep('repository');
    toast.success(`Connected to ${provider.name}`);
  };

  const handleRepoSelect = (repo: Repository) => {
    setSelectedRepo(repo);
    setStep('detecting');
    
    // Simulate detection with detailed file scanning
    setTimeout(() => {
      const detectedFiles = [
        'package.json', 'tsconfig.json', 'Dockerfile', 
        'kubernetes/', 'helm/', '.github/workflows/',
        'src/index.ts', 'tests/', 'docker-compose.yml'
      ];
      
      const detected: DetectedConfig = {
        language: repo.language || 'TypeScript',
        framework: repo.language === 'Python' ? 'FastAPI' : 'Node.js / Express',
        buildTool: repo.language === 'Python' ? 'poetry' : 'npm',
        hasDocker: true,
        hasK8s: true,
        hasHelm: true,
        hasTerraform: detectedFiles.includes('terraform/'),
        suggestedPipeline: repo.name.includes('ml') || repo.name.includes('llm') ? 'MLOps' : 'CI + CD',
        detectedFiles,
        confidence: 0.92,
      };
      
      setDetectedConfig(detected);
      setManualLanguage(detected.language);
      setManualFramework(detected.framework);
      setManualBuildTool(detected.buildTool);
      setManualPipelineType(detected.suggestedPipeline);
      setStep('config');
    }, 2500);
  };

  const handleConfigConfirm = () => {
    setStep('deployment');
  };

  const handleDeploymentConfirm = () => {
    setStep('preview');
  };

  const handleComplete = () => {
    if (onComplete && detectedConfig) {
      onComplete({
        ...detectedConfig,
        language: isManualOverride ? manualLanguage : detectedConfig.language,
        framework: isManualOverride ? manualFramework : detectedConfig.framework,
        buildTool: isManualOverride ? manualBuildTool : detectedConfig.buildTool,
        suggestedPipeline: manualPipelineType,
        strategy: deploymentStrategy,
        environments,
        approvals: requireApprovals,
        autoRollback,
        healthChecks,
        notifications: true,
      });
    }
    toast.success('Project created successfully!');
    onClose();
  };

  const resetWizard = () => {
    setStep('provider');
    setSelectedProvider(null);
    setSelectedRepo(null);
    setDetectedConfig(null);
    setSearchQuery('');
    setIsManualOverride(false);
  };

  const steps: WizardStep[] = ['provider', 'repository', 'detecting', 'config', 'deployment', 'preview', 'review'];
  const stepIndex = steps.indexOf(step);

  // Generate pipeline code based on config
  const generatePipelineCode = () => {
    const lang = isManualOverride ? manualLanguage : detectedConfig?.language;
    const framework = isManualOverride ? manualFramework : detectedConfig?.framework;
    const buildTool = isManualOverride ? manualBuildTool : detectedConfig?.buildTool;

    if (deploymentStrategy === 'blue-green') {
      return `# Blue-Green Deployment Pipeline
# Generated by Opzenix for ${selectedRepo?.fullName}

stages:
  - name: build
    steps:
      - checkout: ${selectedRepo?.branch}
      - install: ${buildTool} install
      - test: ${buildTool} test
      - build: ${buildTool} run build
      - docker: build -t \${IMAGE}:\${VERSION}

  - name: deploy-green
    environment: green
    steps:
      - kubernetes:
          apply: ./k8s/deployment-green.yaml
      - healthCheck:
          endpoint: /health
          timeout: 120s

  - name: switch-traffic
    requires: [approval]
    steps:
      - kubernetes:
          patch: service/\${APP_NAME}
          selector: version=green
      - validate:
          percentage: 100

  - name: cleanup-blue
    steps:
      - kubernetes:
          delete: deployment/\${APP_NAME}-blue
`;
    } else if (deploymentStrategy === 'canary') {
      return `# Canary Deployment Pipeline
# Generated by Opzenix for ${selectedRepo?.fullName}

stages:
  - name: build
    steps:
      - checkout: ${selectedRepo?.branch}
      - install: ${buildTool} install
      - test: ${buildTool} test
      - build: ${buildTool} run build
      - security: scan --severity high,critical
      - docker: build -t \${IMAGE}:\${VERSION}

  - name: canary-10
    environment: production
    traffic: 10%
    steps:
      - kubernetes:
          apply: ./k8s/canary.yaml
          replicas: 1
      - monitor:
          duration: 5m
          metrics: [error_rate, latency_p99]
          threshold:
            error_rate: < 1%
            latency_p99: < 500ms

  - name: canary-50
    requires: [canary-10:success]
    traffic: 50%
    steps:
      - kubernetes:
          scale: replicas=5
      - monitor:
          duration: 10m

  - name: full-rollout
    requires: [canary-50:success, approval]
    traffic: 100%
    steps:
      - kubernetes:
          scale: replicas=10
      - cleanup: canary

rollback:
  trigger: [error_rate > 5%, latency_p99 > 1s]
  checkpoint: last-stable
`;
    } else if (deploymentStrategy === 'canary-feature-toggle') {
      return `# Canary with Feature Toggle Pipeline
# Generated by Opzenix for ${selectedRepo?.fullName}

stages:
  - name: build
    steps:
      - checkout: ${selectedRepo?.branch}
      - install: ${buildTool} install
      - test: ${buildTool} test
      - build: ${buildTool} run build
      - docker: build -t \${IMAGE}:\${VERSION}

  - name: deploy-with-toggle
    environment: production
    steps:
      - kubernetes:
          apply: ./k8s/deployment.yaml
      - featureFlag:
          provider: launchdarkly
          flag: new-feature-\${VERSION}
          state: off

  - name: canary-internal
    steps:
      - featureFlag:
          enable: internal-users
          percentage: 100

  - name: canary-beta
    requires: [canary-internal:success]
    steps:
      - featureFlag:
          enable: beta-users
          percentage: 100
      - monitor:
          duration: 24h

  - name: gradual-rollout
    requires: [canary-beta:success]
    steps:
      - featureFlag:
          enable: all-users
          percentage: [10, 25, 50, 75, 100]
          interval: 1h
          pauseOnError: true

rollback:
  trigger: [feature-flag-kill-switch]
  action: disable-flag
`;
    } else {
      return `# Rolling Update Pipeline
# Generated by Opzenix for ${selectedRepo?.fullName}

stages:
  - name: build
    steps:
      - checkout: ${selectedRepo?.branch}
      - install: ${buildTool} install
      - test: ${buildTool} test
      - build: ${buildTool} run build
      - docker: build -t \${IMAGE}:\${VERSION}

  - name: deploy
    strategy: rolling
    maxUnavailable: 25%
    maxSurge: 25%
    steps:
      - kubernetes:
          apply: ./k8s/deployment.yaml
      - healthCheck:
          endpoint: /health
          interval: 10s
          timeout: 60s
`;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-4xl bg-card border border-border rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <GitBranch className="w-5 h-5 text-ai-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Connect Repository</h2>
                  <p className="text-xs text-muted-foreground">Auto-detect & configure deployment pipelines</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-3 border-b border-border bg-secondary/20 shrink-0">
              <div className="flex items-center gap-1">
                {['Provider', 'Repository', 'Detect', 'Configure', 'Deploy', 'Preview', 'Create'].map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                      stepIndex === i ? 'bg-primary text-primary-foreground' :
                      stepIndex > i ? 'bg-sec-safe text-white' : 'bg-secondary text-muted-foreground'
                    )}>
                      {stepIndex > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    {i < 6 && (
                      <div className={cn(
                        'w-6 h-0.5 mx-0.5',
                        stepIndex > i ? 'bg-sec-safe' : 'bg-border'
                      )} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 min-h-[400px]">
                <AnimatePresence mode="wait">
                  {/* Step 1: Provider Selection */}
                  {step === 'provider' && (
                    <motion.div
                      key="provider"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <h3 className="text-sm font-medium text-foreground mb-1">Select Git Provider</h3>
                        <p className="text-xs text-muted-foreground">Choose where your repository is hosted. Opzenix will configure webhooks or polling based on provider.</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {gitProviders.map((provider) => (
                          <button
                            key={provider.id}
                            onClick={() => handleProviderSelect(provider)}
                            className={cn(
                              'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all text-center',
                              'hover:border-primary/50 hover:bg-primary/5',
                              'bg-secondary/30 border-border'
                            )}
                          >
                            <div className="p-2 rounded-md bg-secondary text-foreground">
                              {provider.icon}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{provider.name}</p>
                              <p className="text-xs text-muted-foreground">{provider.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 p-3 bg-ai-primary/5 border border-ai-primary/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-ai-primary mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            Opzenix supports OAuth, webhooks, tokens, and SSH for repository integration. 
                            Auto-detection works best with proper repository access.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Repository Selection */}
                  {step === 'repository' && (
                    <motion.div
                      key="repository"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-foreground mb-1">Select Repository</h3>
                          <p className="text-xs text-muted-foreground">Opzenix will scan and analyze your codebase</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setStep('provider')}>
                          Back
                        </Button>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search repositories..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 bg-background"
                        />
                      </div>

                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {filteredRepos.map((repo) => (
                            <button
                              key={repo.id}
                              onClick={() => handleRepoSelect(repo)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                            >
                              <Folder className="w-5 h-5 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{repo.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{repo.fullName}</p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="px-1.5 py-0.5 bg-secondary rounded text-xs">{repo.language}</span>
                                <GitBranch className="w-3 h-3" />
                                <span>{repo.branch}</span>
                              </div>
                              {repo.isPrivate && <Lock className="w-4 h-4 text-sec-warning" />}
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}

                  {/* Step 3: Detecting */}
                  {step === 'detecting' && (
                    <motion.div
                      key="detecting"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col items-center justify-center py-12 space-y-6"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-ai-primary/20 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-ai-primary animate-pulse" />
                        </div>
                        <Loader2 className="absolute -inset-2 w-20 h-20 text-ai-primary/50 animate-spin" />
                      </div>
                      
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-medium text-foreground">Analyzing Repository</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          Scanning files, detecting language, framework, and infrastructure configuration...
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-ai-primary animate-pulse" />
                          Scanning {selectedRepo?.fullName}
                        </div>
                        <div className="text-xs space-y-1 text-center opacity-75">
                          <p>• Reading package.json, requirements.txt, go.mod...</p>
                          <p>• Detecting Docker & Kubernetes configs...</p>
                          <p>• Analyzing CI/CD workflows...</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Configuration */}
                  {step === 'config' && detectedConfig && (
                    <motion.div
                      key="config"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 p-3 bg-sec-safe/10 border border-sec-safe/30 rounded-lg flex-1">
                          <CheckCircle2 className="w-5 h-5 text-sec-safe" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Detected with {Math.round(detectedConfig.confidence * 100)}% confidence
                            </p>
                            <p className="text-xs text-muted-foreground">Review and adjust if needed</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setStep('repository')}>
                          Back
                        </Button>
                      </div>

                      {/* Toggle Manual Override */}
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">Manual Configuration</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setIsManualOverride(!isManualOverride)}
                        >
                          {isManualOverride ? 'Use Detected' : 'Override'}
                          {isManualOverride ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                        </Button>
                      </div>

                      {isManualOverride ? (
                        <div className="grid grid-cols-2 gap-4">
                          {/* Language */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Language</label>
                            <select
                              value={manualLanguage}
                              onChange={(e) => {
                                setManualLanguage(e.target.value);
                                setManualFramework('');
                                setManualBuildTool('');
                              }}
                              className="w-full p-2 bg-background border border-border rounded-md text-sm"
                            >
                              {LANGUAGES.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                              ))}
                            </select>
                          </div>

                          {/* Framework */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Framework</label>
                            <select
                              value={manualFramework}
                              onChange={(e) => setManualFramework(e.target.value)}
                              className="w-full p-2 bg-background border border-border rounded-md text-sm"
                            >
                              <option value="">Select framework</option>
                              {availableFrameworks.map(fw => (
                                <option key={fw} value={fw}>{fw}</option>
                              ))}
                            </select>
                          </div>

                          {/* Build Tool */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Build Tool</label>
                            <select
                              value={manualBuildTool}
                              onChange={(e) => setManualBuildTool(e.target.value)}
                              className="w-full p-2 bg-background border border-border rounded-md text-sm"
                            >
                              <option value="">Select build tool</option>
                              {availableBuildTools.map(bt => (
                                <option key={bt} value={bt}>{bt}</option>
                              ))}
                            </select>
                          </div>

                          {/* Pipeline Type */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Pipeline Type</label>
                            <select
                              value={manualPipelineType}
                              onChange={(e) => setManualPipelineType(e.target.value)}
                              className="w-full p-2 bg-background border border-border rounded-md text-sm"
                            >
                              {PIPELINE_TYPES.map(pt => (
                                <option key={pt} value={pt}>{pt}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <DetectedItem label="Language" value={detectedConfig.language} icon={<Code className="w-4 h-4" />} />
                          <DetectedItem label="Framework" value={detectedConfig.framework} icon={<Layers className="w-4 h-4" />} />
                          <DetectedItem label="Build Tool" value={detectedConfig.buildTool} icon={<Package className="w-4 h-4" />} />
                          <DetectedItem label="Pipeline Type" value={detectedConfig.suggestedPipeline} icon={<GitBranch className="w-4 h-4" />} />
                        </div>
                      )}

                      {/* Detected Infrastructure */}
                      <div className="flex items-center gap-2 pt-2 flex-wrap">
                        {detectedConfig.hasDocker && (
                          <span className="px-2 py-1 text-xs bg-secondary text-foreground rounded flex items-center gap-1">
                            <Box className="w-3 h-3" /> Docker
                          </span>
                        )}
                        {detectedConfig.hasK8s && (
                          <span className="px-2 py-1 text-xs bg-secondary text-foreground rounded flex items-center gap-1">
                            <Cloud className="w-3 h-3" /> Kubernetes
                          </span>
                        )}
                        {detectedConfig.hasHelm && (
                          <span className="px-2 py-1 text-xs bg-secondary text-foreground rounded flex items-center gap-1">
                            <Layers className="w-3 h-3" /> Helm
                          </span>
                        )}
                      </div>

                      {/* Detected Files */}
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Detected Files</p>
                        <div className="flex flex-wrap gap-1">
                          {detectedConfig.detectedFiles.map(file => (
                            <span key={file} className="px-2 py-0.5 text-xs bg-background border border-border rounded">
                              {file}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 5: Deployment Configuration */}
                  {step === 'deployment' && (
                    <motion.div
                      key="deployment"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-foreground mb-1">Deployment Strategy</h3>
                          <p className="text-xs text-muted-foreground">Configure how your application will be deployed</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setStep('config')}>
                          Back
                        </Button>
                      </div>

                      {/* Strategy Selection */}
                      <div className="grid grid-cols-2 gap-3">
                        {DEPLOYMENT_STRATEGIES.map((strategy) => (
                          <button
                            key={strategy.id}
                            onClick={() => setDeploymentStrategy(strategy.id)}
                            className={cn(
                              'p-3 rounded-lg border text-left transition-all',
                              deploymentStrategy === strategy.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border bg-secondary/20 hover:border-primary/50'
                            )}
                          >
                            <p className="text-sm font-medium text-foreground">{strategy.name}</p>
                            <p className="text-xs text-muted-foreground">{strategy.description}</p>
                          </button>
                        ))}
                      </div>

                      {/* Additional Options */}
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Options</h4>
                        
                        <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">Require Approvals for Production</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={requireApprovals}
                            onChange={(e) => setRequireApprovals(e.target.checked)}
                            className="w-4 h-4"
                          />
                        </label>

                        <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">Auto-Rollback on Failure</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={autoRollback}
                            onChange={(e) => setAutoRollback(e.target.checked)}
                            className="w-4 h-4"
                          />
                        </label>

                        <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">Health Checks</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={healthChecks}
                            onChange={(e) => setHealthChecks(e.target.checked)}
                            className="w-4 h-4"
                          />
                        </label>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 6: Preview Generated Code */}
                  {step === 'preview' && (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-foreground mb-1">Generated Pipeline</h3>
                          <p className="text-xs text-muted-foreground">
                            {DEPLOYMENT_STRATEGIES.find(s => s.id === deploymentStrategy)?.name} for {selectedRepo?.name}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setStep('deployment')}>
                          Back
                        </Button>
                      </div>

                      <div className="bg-background border border-border rounded-lg overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30">
                          <Terminal className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">opzenix-pipeline.yaml</span>
                        </div>
                        <ScrollArea className="h-[300px]">
                          <pre className="p-4 text-xs text-foreground font-mono whitespace-pre overflow-x-auto">
                            {generatePipelineCode()}
                          </pre>
                        </ScrollArea>
                      </div>

                      <div className="p-3 bg-ai-primary/5 border border-ai-primary/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-ai-primary mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            This pipeline is generated based on your configuration. 
                            It will be stored in your repository and can be customized.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 7: Final Review */}
                  {step === 'review' && (
                    <motion.div
                      key="review"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 p-3 bg-sec-safe/10 border border-sec-safe/30 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-sec-safe" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Ready to Create Project</p>
                          <p className="text-xs text-muted-foreground">Review your configuration below</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-secondary/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Repository</p>
                          <p className="text-sm font-medium text-foreground">{selectedRepo?.fullName}</p>
                        </div>
                        <div className="p-3 bg-secondary/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Branch</p>
                          <p className="text-sm font-medium text-foreground">{selectedRepo?.branch}</p>
                        </div>
                        <div className="p-3 bg-secondary/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Stack</p>
                          <p className="text-sm font-medium text-foreground">
                            {isManualOverride ? manualLanguage : detectedConfig?.language} / {isManualOverride ? manualFramework : detectedConfig?.framework}
                          </p>
                        </div>
                        <div className="p-3 bg-secondary/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Deployment</p>
                          <p className="text-sm font-medium text-foreground">
                            {DEPLOYMENT_STRATEGIES.find(s => s.id === deploymentStrategy)?.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {requireApprovals && (
                          <span className="px-2 py-1 text-xs bg-sec-safe/20 text-sec-safe rounded">Approvals</span>
                        )}
                        {autoRollback && (
                          <span className="px-2 py-1 text-xs bg-sec-safe/20 text-sec-safe rounded">Auto-Rollback</span>
                        )}
                        {healthChecks && (
                          <span className="px-2 py-1 text-xs bg-sec-safe/20 text-sec-safe rounded">Health Checks</span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            {(step === 'config' || step === 'deployment' || step === 'preview' || step === 'review') && (
              <div className="p-4 border-t border-border flex items-center justify-between shrink-0">
                <Button variant="ghost" onClick={resetWizard}>
                  Start Over
                </Button>
                <Button 
                  onClick={() => {
                    if (step === 'config') handleConfigConfirm();
                    else if (step === 'deployment') handleDeploymentConfirm();
                    else if (step === 'preview') setStep('review');
                    else if (step === 'review') handleComplete();
                  }} 
                  className="gap-2"
                >
                  {step === 'review' ? (
                    <>
                      <Rocket className="w-4 h-4" />
                      Create Project
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface DetectedItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const DetectedItem = ({ label, value, icon }: DetectedItemProps) => (
  <div className="p-3 bg-secondary/30 rounded-lg border border-border">
    <div className="flex items-center gap-2 mb-1 text-muted-foreground">
      {icon}
      <span className="text-xs uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-sm font-medium text-foreground">{value}</p>
  </div>
);

// Missing import
const Activity = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);

export default GitConnectionWizard;
