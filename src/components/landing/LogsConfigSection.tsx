import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Terminal, FileCode, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const logLines = [
  { type: 'info', text: '[2024-01-15 14:32:01] Starting deployment pipeline...' },
  { type: 'info', text: '[2024-01-15 14:32:02] Pulling container image: app:v2.4.1' },
  { type: 'success', text: '[2024-01-15 14:32:15] Image pulled successfully (2.3 GB)' },
  { type: 'info', text: '[2024-01-15 14:32:16] Running security scan...' },
  { type: 'warning', text: '[2024-01-15 14:32:28] WARN: CVE-2024-1234 detected in dependency lodash@4.17.20' },
  { type: 'info', text: '[2024-01-15 14:32:29] AI Analysis: Low severity, no action required' },
  { type: 'success', text: '[2024-01-15 14:32:30] Security scan complete - 1 warning, 0 critical' },
  { type: 'info', text: '[2024-01-15 14:32:31] Initiating canary deployment (10% traffic)...' },
  { type: 'success', text: '[2024-01-15 14:32:45] Canary pods healthy - 3/3 ready' },
  { type: 'info', text: '[2024-01-15 14:32:46] Monitoring latency and error rates...' },
  { type: 'success', text: '[2024-01-15 14:33:00] Canary metrics nominal - proceeding to 50%' },
];

const configDiff = `deployment:
  strategy: canary
  canary:
-   weight: 10
+   weight: 50
    maxSurge: 25%
    maxUnavailable: 0
  healthCheck:
    path: /health
-   interval: 30s
+   interval: 15s
    timeout: 5s`;

const LogsConfigSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [visibleLogs, setVisibleLogs] = useState<typeof logLines>([]);
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    if (!isInView) return;

    logLines.forEach((log, index) => {
      setTimeout(() => {
        setVisibleLogs(prev => [...prev, log]);
      }, index * 400);
    });

    setTimeout(() => setShowDiff(true), logLines.length * 400 + 500);
  }, [isInView]);

  return (
    <section ref={ref} className="min-h-screen py-24 px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Live Logs & Configuration
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time visibility into every execution step. No hidden operations.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Log Stream */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-xl border border-border bg-background overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-card">
              <Terminal className="w-4 h-4 text-ai-primary" />
              <span className="text-sm font-medium text-foreground">Live Logs</span>
              <span className="ml-auto text-xs text-muted-foreground">streaming</span>
              <div className="w-2 h-2 rounded-full bg-node-success animate-pulse" />
            </div>
            <div className="h-[400px] overflow-auto p-4 font-mono text-xs space-y-1">
              {visibleLogs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex items-start gap-2",
                    log.type === 'warning' && "text-node-warning",
                    log.type === 'success' && "text-node-success",
                    log.type === 'info' && "text-muted-foreground"
                  )}
                >
                  {log.type === 'warning' && <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />}
                  {log.type === 'success' && <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />}
                  {log.type === 'info' && <Info className="w-3 h-3 mt-0.5 shrink-0" />}
                  <span>{log.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Config Diff */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-xl border border-border bg-background overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-card">
              <FileCode className="w-4 h-4 text-ai-primary" />
              <span className="text-sm font-medium text-foreground">Config Changes</span>
              <span className="ml-auto px-2 py-0.5 text-xs bg-node-warning/20 text-node-warning rounded">
                pending review
              </span>
            </div>
            <div className="h-[400px] overflow-auto p-4 font-mono text-xs">
              {showDiff ? (
                <motion.pre
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-pre-wrap"
                >
                  {configDiff.split('\n').map((line, index) => (
                    <div
                      key={index}
                      className={cn(
                        line.startsWith('-') && "text-node-failed bg-node-failed/10",
                        line.startsWith('+') && "text-node-success bg-node-success/10",
                        !line.startsWith('-') && !line.startsWith('+') && "text-muted-foreground"
                      )}
                    >
                      {line}
                    </div>
                  ))}
                </motion.pre>
              ) : (
                <div className="text-muted-foreground">Loading configuration...</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LogsConfigSection;
