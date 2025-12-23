import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Github, GitBranch, Box, ChevronRight, Search, 
  CheckCircle2, Loader2, Sparkles, Shield, FileCode,
  Folder, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Git provider icons (simplified)
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

interface GitProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
}

const gitProviders: GitProvider[] = [
  { id: 'github', name: 'GitHub', icon: <Github className="w-5 h-5" />, connected: false },
  { id: 'gitlab', name: 'GitLab', icon: <GitLabIcon />, connected: false },
  { id: 'bitbucket', name: 'Bitbucket', icon: <BitbucketIcon />, connected: false },
  { id: 'azure', name: 'Azure DevOps', icon: <AzureIcon />, connected: false },
];

interface Repository {
  id: string;
  name: string;
  fullName: string;
  branch: string;
  lastUpdated: string;
  isPrivate: boolean;
}

const sampleRepos: Repository[] = [
  { id: 'r1', name: 'api-gateway', fullName: 'opzenix/api-gateway', branch: 'main', lastUpdated: '2h ago', isPrivate: true },
  { id: 'r2', name: 'ml-pipeline', fullName: 'opzenix/ml-pipeline', branch: 'main', lastUpdated: '1d ago', isPrivate: true },
  { id: 'r3', name: 'auth-service', fullName: 'opzenix/auth-service', branch: 'main', lastUpdated: '3d ago', isPrivate: true },
  { id: 'r4', name: 'frontend-app', fullName: 'opzenix/frontend-app', branch: 'develop', lastUpdated: '5h ago', isPrivate: false },
  { id: 'r5', name: 'llm-gateway', fullName: 'opzenix/llm-gateway', branch: 'main', lastUpdated: '1w ago', isPrivate: true },
];

interface DetectedConfig {
  language: string;
  framework: string;
  buildTool: string;
  hasDocker: boolean;
  hasK8s: boolean;
  suggestedPipeline: string;
}

interface GitConnectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (config: DetectedConfig) => void;
}

type WizardStep = 'provider' | 'repository' | 'detecting' | 'review';

const GitConnectionWizard = ({ isOpen, onClose, onComplete }: GitConnectionWizardProps) => {
  const [step, setStep] = useState<WizardStep>('provider');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [detectedConfig, setDetectedConfig] = useState<DetectedConfig | null>(null);

  const filteredRepos = sampleRepos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    setStep('repository');
  };

  const handleRepoSelect = (repo: Repository) => {
    setSelectedRepo(repo);
    setStep('detecting');
    
    // Simulate detection
    setTimeout(() => {
      setDetectedConfig({
        language: 'TypeScript',
        framework: 'Node.js / Express',
        buildTool: 'npm',
        hasDocker: true,
        hasK8s: true,
        suggestedPipeline: 'cicd',
      });
      setStep('review');
    }, 2500);
  };

  const handleComplete = () => {
    if (detectedConfig && onComplete) {
      onComplete(detectedConfig);
    }
    onClose();
  };

  const resetWizard = () => {
    setStep('provider');
    setSelectedProvider(null);
    setSelectedRepo(null);
    setDetectedConfig(null);
    setSearchQuery('');
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
            className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <GitBranch className="w-5 h-5 text-ai-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Connect Repository</h2>
                  <p className="text-xs text-muted-foreground">Auto-detect pipelines from your codebase</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-3 border-b border-border bg-secondary/20">
              <div className="flex items-center gap-2">
                {(['provider', 'repository', 'detecting', 'review'] as WizardStep[]).map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                      step === s ? 'bg-primary text-primary-foreground' :
                      (['provider', 'repository', 'detecting', 'review'].indexOf(step) > i) 
                        ? 'bg-sec-safe text-white' 
                        : 'bg-secondary text-muted-foreground'
                    )}>
                      {(['provider', 'repository', 'detecting', 'review'].indexOf(step) > i) ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    {i < 3 && (
                      <div className={cn(
                        'w-12 h-0.5 mx-1',
                        (['provider', 'repository', 'detecting', 'review'].indexOf(step) > i) 
                          ? 'bg-sec-safe' 
                          : 'bg-border'
                      )} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 min-h-[400px]">
              <AnimatePresence mode="wait">
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
                      <p className="text-xs text-muted-foreground">Choose where your repository is hosted</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {gitProviders.map((provider) => (
                        <button
                          key={provider.id}
                          onClick={() => handleProviderSelect(provider.id)}
                          className={cn(
                            'flex items-center gap-3 p-4 rounded-lg border transition-all text-left',
                            'hover:border-primary/50 hover:bg-primary/5',
                            'bg-secondary/30 border-border'
                          )}
                        >
                          <div className="p-2 rounded-md bg-secondary text-foreground">
                            {provider.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{provider.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {provider.connected ? 'Connected' : 'Click to connect'}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

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
                        <p className="text-xs text-muted-foreground">Choose a repository to analyze</p>
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

                    <ScrollArea className="h-[280px]">
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
                              <GitBranch className="w-3 h-3" />
                              <span>{repo.branch}</span>
                            </div>
                            {repo.isPrivate && (
                              <Shield className="w-4 h-4 text-sec-warning" />
                            )}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}

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
                        Detecting language, framework, and generating optimal pipeline configuration...
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-ai-primary animate-pulse" />
                      Scanning {selectedRepo?.fullName}
                    </div>
                  </motion.div>
                )}

                {step === 'review' && detectedConfig && (
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
                        <p className="text-sm font-medium text-foreground">Pipeline Detected</p>
                        <p className="text-xs text-muted-foreground">Ready to deploy with smart defaults</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Detected Configuration
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <DetectedItem label="Language" value={detectedConfig.language} icon={<FileCode className="w-4 h-4" />} />
                        <DetectedItem label="Framework" value={detectedConfig.framework} icon={<Box className="w-4 h-4" />} />
                        <DetectedItem label="Build Tool" value={detectedConfig.buildTool} icon={<Settings className="w-4 h-4" />} />
                        <DetectedItem label="Pipeline Type" value="CI/CD" icon={<GitBranch className="w-4 h-4" />} />
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {detectedConfig.hasDocker && (
                          <span className="px-2 py-1 text-xs bg-secondary text-foreground rounded">Docker</span>
                        )}
                        {detectedConfig.hasK8s && (
                          <span className="px-2 py-1 text-xs bg-secondary text-foreground rounded">Kubernetes</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-ai-primary/5 border border-ai-primary/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-ai-primary mt-0.5" />
                        <div>
                          <p className="text-xs text-foreground">
                            <strong>AI Recommendation:</strong> Standard CI/CD pipeline with security scanning, 
                            Docker build, and Kubernetes deployment. Canary strategy recommended for production.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {step === 'review' && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <Button variant="ghost" onClick={resetWizard}>
                  Start Over
                </Button>
                <Button onClick={handleComplete} className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Create Project
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Settings = Box; // Placeholder

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

export default GitConnectionWizard;
