import { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, GitBranch, Box, ChevronDown, Sparkles, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const environments = [
  { id: 'staging', label: 'Staging', safe: true },
  { id: 'production', label: 'Production', safe: false },
];

const recentProjects = [
  { id: 'p1', name: 'api-gateway', branch: 'main', lastDeploy: '2h ago' },
  { id: 'p2', name: 'ml-pipeline', branch: 'feature/v3', lastDeploy: '4h ago' },
  { id: 'p3', name: 'auth-service', branch: 'release/1.9', lastDeploy: '1d ago' },
];

const QuickDeployCard = () => {
  const [selectedEnv, setSelectedEnv] = useState('staging');
  const [selectedProject, setSelectedProject] = useState(recentProjects[0]);
  const [deploying, setDeploying] = useState(false);

  const handleDeploy = () => {
    setDeploying(true);
    setTimeout(() => setDeploying(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border border-border rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-ai-primary" />
          <h3 className="text-sm font-medium text-foreground">Quick Deploy</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Deploy with confidence. Smart defaults applied.
        </p>
      </div>

      {/* Project Selection */}
      <div className="p-4 space-y-4">
        {/* Recent Projects */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Project</label>
          <div className="space-y-1">
            {recentProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={cn(
                  'w-full flex items-center justify-between p-2.5 rounded-md text-left transition-colors',
                  selectedProject.id === project.id
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-secondary/30 border border-transparent hover:border-border'
                )}
              >
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{project.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <GitBranch className="w-3 h-3" />
                  <span className="font-mono">{project.branch}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Environment Selection */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Environment</label>
          <div className="flex gap-2">
            {environments.map((env) => (
              <button
                key={env.id}
                onClick={() => setSelectedEnv(env.id)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                  selectedEnv === env.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                {env.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Insight */}
        <div className="p-3 bg-ai-primary/5 border border-ai-primary/20 rounded-md">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-ai-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-foreground">
                {selectedEnv === 'production' 
                  ? 'Production deploy will require approval. Canary strategy recommended.'
                  : 'Staging deploy is safe. Auto-detected: Node.js 20, Docker build.'}
              </p>
            </div>
          </div>
        </div>

        {/* Security Check */}
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-sec-safe" />
          <span className="text-muted-foreground">Security scan passed</span>
          <Shield className="w-3 h-3 text-muted-foreground ml-auto" />
          <span className="text-muted-foreground">Policy compliant</span>
        </div>
      </div>

      {/* Deploy Button */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={handleDeploy}
          disabled={deploying}
          className="w-full h-10 gap-2"
          variant={selectedEnv === 'production' ? 'destructive' : 'default'}
        >
          {deploying ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              Deploy to {selectedEnv === 'production' ? 'Production' : 'Staging'}
            </>
          )}
        </Button>
        {selectedEnv === 'production' && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Requires 2 approvals before deployment
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default QuickDeployCard;
