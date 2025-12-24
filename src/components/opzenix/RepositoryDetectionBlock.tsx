import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GitBranch, Search, RefreshCw, Check, AlertCircle, Code,
  Layers, Wrench, Box, Github, XCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LanguageStack } from '@/data/languageTemplates';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RepoConfig {
  url: string;
  branch: string;
  language: LanguageStack | null;
  framework: string;
  buildTool: string;
}

interface RepositoryDetectionBlockProps {
  config?: RepoConfig;
  onChange?: (config: RepoConfig) => void;
  onDetectionComplete?: (stack: { language: string; framework: string; buildTool: string; confidence: number }, repo: string, branch: string) => void;
}

interface GitHubConnectionStatus {
  connected: boolean;
  validating: boolean;
  branches: string[];
  error: string | null;
  connectionId: string | null;
}

const languageConfigs = {
  java: { icon: '☕', frameworks: ['Spring Boot', 'Quarkus', 'Micronaut'], buildTools: ['Maven', 'Gradle'] },
  dotnet: { icon: '🔷', frameworks: ['.NET Core', 'ASP.NET', 'Blazor'], buildTools: ['dotnet CLI', 'MSBuild'] },
  python: { icon: '🐍', frameworks: ['Django', 'FastAPI', 'Flask'], buildTools: ['pip', 'Poetry', 'Conda'] },
  javascript: { icon: '🟨', frameworks: ['React', 'Vue', 'Angular', 'Next.js'], buildTools: ['npm', 'yarn', 'pnpm'] },
  typescript: { icon: '🔷', frameworks: ['React', 'Angular', 'NestJS', 'Next.js'], buildTools: ['npm', 'yarn', 'pnpm'] },
  go: { icon: '🐹', frameworks: ['Gin', 'Echo', 'Fiber'], buildTools: ['go build', 'Makefile'] },
};

const RepositoryDetectionBlock = ({ config, onChange, onDetectionComplete }: RepositoryDetectionBlockProps) => {
  const [repoUrl, setRepoUrl] = useState(config?.url || '');
  const [branch, setBranch] = useState(config?.branch || 'main');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detected, setDetected] = useState<{ language: string; framework: string; buildTool: string; confidence: number } | null>(null);
  const [manualOverride, setManualOverride] = useState(false);

  // GitHub connection state
  const [githubStatus, setGithubStatus] = useState<GitHubConnectionStatus>({
    connected: false,
    validating: false,
    branches: [],
    error: null,
    connectionId: null,
  });

  // Manual override state
  const [selectedLanguage, setSelectedLanguage] = useState<string>(config?.language || '');
  const [selectedFramework, setSelectedFramework] = useState<string>(config?.framework || '');
  const [selectedBuildTool, setSelectedBuildTool] = useState<string>(config?.buildTool || '');

  // Check existing GitHub connection
  useEffect(() => {
    const checkGitHubConnection = async () => {
      const { data: connections } = await supabase
        .from('connections')
        .select('*')
        .eq('type', 'github')
        .eq('status', 'connected')
        .limit(1);

      if (connections && connections.length > 0) {
        const conn = connections[0];
        const resourceStatus = conn.resource_status as Record<string, unknown> || {};
        setGithubStatus({
          connected: true,
          validating: false,
          branches: [],
          error: null,
          connectionId: conn.id,
        });
      }
    };

    checkGitHubConnection();
  }, []);

  // Sync with external config
  useEffect(() => {
    if (config) {
      setRepoUrl(config.url);
      setBranch(config.branch);
      if (config.language) {
        setSelectedLanguage(config.language);
        setSelectedFramework(config.framework);
        setSelectedBuildTool(config.buildTool);
      }
    }
  }, [config]);

  // Validate GitHub connection and fetch branches
  const validateGitHubConnection = async () => {
    if (!repoUrl || !githubStatus.connectionId) return;

    setGithubStatus(prev => ({ ...prev, validating: true, error: null }));

    try {
      // Parse repo URL
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        setGithubStatus(prev => ({ ...prev, validating: false, error: 'Invalid GitHub URL' }));
        return;
      }

      const [, owner, repo] = match;
      const cleanRepo = repo.replace('.git', '');

      const { data, error } = await supabase.functions.invoke('github-validate-connection', {
        body: {
          connectionId: githubStatus.connectionId,
          owner,
          repo: cleanRepo,
        }
      });

      if (error) throw error;

      if (data.valid && data.branches) {
        setGithubStatus(prev => ({
          ...prev,
          validating: false,
          connected: true,
          branches: data.branches.map((b: any) => b.name),
          error: null,
        }));
        toast.success('GitHub connection validated');
      } else {
        setGithubStatus(prev => ({
          ...prev,
          validating: false,
          error: data.errors?.[0] || 'Validation failed',
        }));
      }
    } catch (err: any) {
      console.error('[RepositoryDetection] GitHub validation error:', err);
      setGithubStatus(prev => ({
        ...prev,
        validating: false,
        error: err.message || 'Failed to validate connection',
      }));
    }
  };

  const handleDetect = async () => {
    setIsDetecting(true);
    
    // First validate GitHub if we have a connection
    if (githubStatus.connectionId && repoUrl) {
      await validateGitHubConnection();
    }

    // Simulate detection
    await new Promise(r => setTimeout(r, 1500));
    
    const detectedStack = {
      language: 'typescript',
      framework: 'React',
      buildTool: 'npm',
      confidence: 94,
    };
    
    setDetected(detectedStack);
    setSelectedLanguage(detectedStack.language);
    setSelectedFramework(detectedStack.framework);
    setSelectedBuildTool(detectedStack.buildTool);
    setIsDetecting(false);
  };

  const handleConfirm = () => {
    const stack = manualOverride 
      ? { language: selectedLanguage, framework: selectedFramework, buildTool: selectedBuildTool, confidence: 100 }
      : detected!;
    
    // Call onChange for wizard integration
    if (onChange) {
      onChange({
        url: repoUrl,
        branch,
        language: stack.language as LanguageStack,
        framework: stack.framework,
        buildTool: stack.buildTool,
      });
    }
    
    // Call legacy callback
    if (onDetectionComplete) {
      onDetectionComplete(stack, repoUrl, branch);
    }
  };

  const currentLangConfig = languageConfigs[selectedLanguage as keyof typeof languageConfigs];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 bg-card border border-border rounded-lg space-y-4"
    >
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-ai-primary" />
          <h3 className="text-sm font-medium text-foreground">Repository & Stack Detection</h3>
        </div>
        
        {/* GitHub Connection Status */}
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] gap-1",
            githubStatus.connected ? "border-sec-safe/50 text-sec-safe" : "border-sec-warning/50 text-sec-warning"
          )}
        >
          <Github className="w-3 h-3" />
          {githubStatus.validating ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Validating...
            </>
          ) : githubStatus.connected ? 'Connected' : 'Not Connected'}
        </Badge>
      </div>

      {/* GitHub Connection Error */}
      {githubStatus.error && (
        <div className="p-3 rounded-lg bg-sec-critical/10 border border-sec-critical/30 flex items-start gap-2">
          <XCircle className="w-4 h-4 text-sec-critical shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-sec-critical">GitHub Connection Error</p>
            <p className="text-[10px] text-muted-foreground">{githubStatus.error}</p>
          </div>
        </div>
      )}

      {/* Repository Input */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block">Repository URL</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/org/repo"
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Branch</label>
          <Select value={branch} onValueChange={setBranch}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {githubStatus.branches.length > 0 ? (
                githubStatus.branches.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="main">main</SelectItem>
                  <SelectItem value="develop">develop</SelectItem>
                  <SelectItem value="staging">staging</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Detect Button */}
      <Button 
        onClick={handleDetect} 
        disabled={!repoUrl || isDetecting}
        className="w-full gap-2"
      >
        {isDetecting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Detecting Stack...
          </>
        ) : (
          <>
            <Layers className="w-4 h-4" />
            Detect Configuration
          </>
        )}
      </Button>

      {/* Detection Results */}
      {detected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-sec-safe" />
              <span className="text-xs font-medium text-foreground">Detected Configuration</span>
            </div>
            <Badge variant="outline" className={cn(
              "text-[10px]",
              detected.confidence >= 90 ? "border-sec-safe text-sec-safe" : "border-sec-warning text-sec-warning"
            )}>
              {detected.confidence}% confidence
            </Badge>
          </div>

          {/* Detected/Override Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-secondary/20 rounded-lg">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block flex items-center gap-1">
                <Code className="w-3 h-3" /> Language
              </label>
              {manualOverride ? (
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(languageConfigs).map(lang => (
                      <SelectItem key={lang} value={lang} className="capitalize">{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium text-foreground capitalize flex items-center gap-1">
                  {languageConfigs[detected.language as keyof typeof languageConfigs]?.icon} {detected.language}
                </p>
              )}
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block flex items-center gap-1">
                <Box className="w-3 h-3" /> Framework
              </label>
              {manualOverride ? (
                <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentLangConfig?.frameworks.map(fw => (
                      <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium text-foreground">{detected.framework}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block flex items-center gap-1">
                <Wrench className="w-3 h-3" /> Build Tool
              </label>
              {manualOverride ? (
                <Select value={selectedBuildTool} onValueChange={setSelectedBuildTool}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentLangConfig?.buildTools.map(bt => (
                      <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium text-foreground">{detected.buildTool}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setManualOverride(!manualOverride)}
            >
              {manualOverride ? 'Use Auto-Detected' : 'Manual Override'}
            </Button>
            <Button size="sm" onClick={handleConfirm} className="gap-1">
              <Check className="w-3.5 h-3.5" />
              Confirm & Continue
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RepositoryDetectionBlock;
