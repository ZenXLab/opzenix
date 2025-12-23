import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { 
  X, 
  Brain, 
  FileCode, 
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFlowStore } from '@/stores/flowStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const sampleConfigs = {
  kubernetes: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: registry.opzenix.io/api-gateway:v2.4.1
        ports:
        - containerPort: 8080
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url`,
  terraform: `resource "aws_ecs_service" "api_gateway" {
  name            = "api-gateway"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api_gateway.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnets
    security_groups  = [aws_security_group.api_gateway.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_gateway.arn
    container_name   = "api-gateway"
    container_port   = 8080
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
}`,
  dockerfile: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 8080
USER node
CMD ["node", "dist/index.js"]`,
};

type ConfigType = 'kubernetes' | 'terraform' | 'dockerfile';

const ConfigEditorPanel = () => {
  const { isConfigEditorOpen, setConfigEditorOpen } = useFlowStore();
  const [configType, setConfigType] = useState<ConfigType>('kubernetes');
  const [config, setConfig] = useState(sampleConfigs.kubernetes);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const { toast } = useToast();

  const handleConfigTypeChange = (type: ConfigType) => {
    setConfigType(type);
    setConfig(sampleConfigs[type]);
    setExplanation(null);
  };

  const handleExplain = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('explain-config', {
        body: { config, configType },
      });

      if (error) throw error;
      setExplanation(data.explanation);
      setShowExplanation(true);
    } catch (error) {
      console.error('Error explaining config:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate explanation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguage = (type: ConfigType) => {
    switch (type) {
      case 'kubernetes': return 'yaml';
      case 'terraform': return 'hcl';
      case 'dockerfile': return 'dockerfile';
      default: return 'yaml';
    }
  };

  return (
    <AnimatePresence>
      {isConfigEditorOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfigEditorOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-5xl h-[80vh] bg-card border border-border rounded-lg shadow-xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <FileCode className="w-5 h-5 text-ai-primary" />
                <h2 className="text-lg font-semibold text-foreground">Configuration Inspector</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfigEditorOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Config Type Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-border bg-secondary/30">
              {(['kubernetes', 'terraform', 'dockerfile'] as ConfigType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleConfigTypeChange(type)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded transition-colors',
                    configType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Editor */}
              <div className="flex-1 border-r border-border">
                <Editor
                  height="100%"
                  language={getLanguage(configType)}
                  theme="vs-dark"
                  value={config}
                  onChange={(value) => setConfig(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    readOnly: false,
                    padding: { top: 16 },
                  }}
                />
              </div>

              {/* AI Explanation Panel */}
              <div className="w-80 flex flex-col bg-secondary/20">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-ai-primary" />
                    <span className="text-sm font-medium">AI Explanation</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExplain}
                    disabled={isLoading}
                    className="text-xs gap-1.5"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Brain className="w-3 h-3" />
                    )}
                    Explain
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-3">
                  {explanation ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Analysis
                        </span>
                        {showExplanation ? (
                          <ChevronUp className="w-3 h-3 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        )}
                      </button>
                      {showExplanation && (
                        <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {explanation}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      Click "Explain" to get AI-powered insights about this configuration
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfigEditorPanel;
