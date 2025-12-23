import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GitBranch, Search, RefreshCw, Check, AlertCircle, Code,
  Layers, Wrench, FileCode, Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DetectedStack {
  language: string;
  framework: string;
  buildTool: string;
  confidence: number;
}

interface RepositoryDetectionBlockProps {
  onDetectionComplete: (stack: DetectedStack, repo: string, branch: string) => void;
}

const languageConfigs = {
  java: { icon: '☕', frameworks: ['Spring Boot', 'Quarkus', 'Micronaut'], buildTools: ['Maven', 'Gradle'] },
  dotnet: { icon: '🔷', frameworks: ['.NET Core', 'ASP.NET', 'Blazor'], buildTools: ['dotnet CLI', 'MSBuild'] },
  python: { icon: '🐍', frameworks: ['Django', 'FastAPI', 'Flask'], buildTools: ['pip', 'Poetry', 'Conda'] },
  javascript: { icon: '🟨', frameworks: ['React', 'Vue', 'Angular', 'Next.js'], buildTools: ['npm', 'yarn', 'pnpm'] },
  typescript: { icon: '🔷', frameworks: ['React', 'Angular', 'NestJS', 'Next.js'], buildTools: ['npm', 'yarn', 'pnpm'] },
  go: { icon: '🐹', frameworks: ['Gin', 'Echo', 'Fiber'], buildTools: ['go build', 'Makefile'] },
};

const RepositoryDetectionBlock = ({ onDetectionComplete }: RepositoryDetectionBlockProps) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detected, setDetected] = useState<DetectedStack | null>(null);
  const [manualOverride, setManualOverride] = useState(false);

  // Manual override state
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedFramework, setSelectedFramework] = useState<string>('');
  const [selectedBuildTool, setSelectedBuildTool] = useState<string>('');

  const handleDetect = async () => {
    setIsDetecting(true);
    // Simulate detection
    await new Promise(r => setTimeout(r, 1500));
    
    const detectedStack: DetectedStack = {
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
    const stack: DetectedStack = manualOverride 
      ? { language: selectedLanguage, framework: selectedFramework, buildTool: selectedBuildTool, confidence: 100 }
      : detected!;
    onDetectionComplete(stack, repoUrl, branch);
  };

  const currentLangConfig = languageConfigs[selectedLanguage as keyof typeof languageConfigs];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-card border border-border rounded-lg space-y-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <GitBranch className="w-4 h-4 text-ai-primary" />
        <h3 className="text-sm font-medium text-foreground">Repository & Stack Detection</h3>
      </div>

      {/* Repository Input */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
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
              <SelectItem value="main">main</SelectItem>
              <SelectItem value="develop">develop</SelectItem>
              <SelectItem value="staging">staging</SelectItem>
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
          <div className="flex items-center justify-between">
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
          <div className="grid grid-cols-3 gap-3 p-3 bg-secondary/20 rounded-lg">
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
          <div className="flex items-center justify-between">
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
