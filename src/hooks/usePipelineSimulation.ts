import { useState, useCallback, useRef } from 'react';

export interface PipelineStage {
  id: string;
  name: string;
  type: 'source' | 'build' | 'test' | 'security' | 'approval' | 'deploy';
  status: 'idle' | 'running' | 'success' | 'failed' | 'warning' | 'pending';
  duration?: number;
  logs: string[];
}

export interface PipelineExecution {
  id: string;
  status: 'idle' | 'running' | 'success' | 'failed' | 'paused';
  startedAt?: Date;
  completedAt?: Date;
  currentStageIndex: number;
  stages: PipelineStage[];
}

const generateLogs = (stageName: string, stageType: string): string[] => {
  const baseLogs: Record<string, string[]> = {
    source: [
      `[INFO] Cloning repository...`,
      `[INFO] Fetching branch: main`,
      `[INFO] Checkout commit: a1b2c3d`,
      `[INFO] Source code fetched successfully`,
    ],
    build: [
      `[INFO] Installing dependencies...`,
      `[INFO] npm install completed (247 packages)`,
      `[INFO] Running build command...`,
      `[INFO] Compiling TypeScript...`,
      `[INFO] Build artifacts generated`,
      `[INFO] Build completed in 45.2s`,
    ],
    test: [
      `[INFO] Running unit tests...`,
      `[INFO] Test suite: auth.test.ts - PASSED (12 tests)`,
      `[INFO] Test suite: api.test.ts - PASSED (8 tests)`,
      `[INFO] Test suite: utils.test.ts - PASSED (15 tests)`,
      `[INFO] Coverage: 87.3%`,
      `[INFO] All tests passed`,
    ],
    security: [
      `[INFO] Running security scan...`,
      `[INFO] Checking dependencies for vulnerabilities`,
      `[INFO] Scanning Docker image...`,
      `[WARN] 2 low severity issues found`,
      `[INFO] No critical vulnerabilities detected`,
      `[INFO] Security scan completed`,
    ],
    approval: [
      `[INFO] Approval gate triggered`,
      `[INFO] Waiting for approval from: ops-team`,
      `[INFO] Approval received from: admin@example.com`,
      `[INFO] Approval gate passed`,
    ],
    deploy: [
      `[INFO] Preparing deployment...`,
      `[INFO] Pushing to container registry...`,
      `[INFO] Updating Kubernetes deployment...`,
      `[INFO] Rolling out new pods...`,
      `[INFO] Health checks passing`,
      `[INFO] Deployment successful`,
    ],
  };

  return baseLogs[stageType] || [`[INFO] Executing ${stageName}...`, `[INFO] Stage completed`];
};

export function usePipelineSimulation() {
  const [execution, setExecution] = useState<PipelineExecution | null>(null);
  const [currentLogs, setCurrentLogs] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const logIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearIntervals = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (logIntervalRef.current) {
      clearInterval(logIntervalRef.current);
      logIntervalRef.current = null;
    }
  };

  const startExecution = useCallback((stages: Omit<PipelineStage, 'status' | 'logs'>[]) => {
    clearIntervals();

    const initialExecution: PipelineExecution = {
      id: `exec-${Date.now()}`,
      status: 'running',
      startedAt: new Date(),
      currentStageIndex: 0,
      stages: stages.map(s => ({ ...s, status: 'idle', logs: [] })),
    };

    setExecution(initialExecution);
    setCurrentLogs([]);

    let stageIndex = 0;
    let logIndex = 0;
    let stageLogs: string[] = [];

    const runStage = () => {
      if (stageIndex >= initialExecution.stages.length) {
        clearIntervals();
        setExecution(prev => prev ? {
          ...prev,
          status: 'success',
          completedAt: new Date(),
        } : null);
        return;
      }

      const stage = initialExecution.stages[stageIndex];
      stageLogs = generateLogs(stage.name, stage.type);
      logIndex = 0;

      setExecution(prev => {
        if (!prev) return null;
        const newStages = [...prev.stages];
        newStages[stageIndex] = { ...newStages[stageIndex], status: 'running', logs: [] };
        return { ...prev, currentStageIndex: stageIndex, stages: newStages };
      });

      // Stream logs
      logIntervalRef.current = setInterval(() => {
        if (logIndex < stageLogs.length) {
          const log = stageLogs[logIndex];
          setCurrentLogs(prev => [...prev, `[${stage.name}] ${log}`]);
          setExecution(prev => {
            if (!prev) return null;
            const newStages = [...prev.stages];
            newStages[stageIndex] = {
              ...newStages[stageIndex],
              logs: [...newStages[stageIndex].logs, log],
            };
            return { ...prev, stages: newStages };
          });
          logIndex++;
        } else {
          if (logIntervalRef.current) {
            clearInterval(logIntervalRef.current);
            logIntervalRef.current = null;
          }

          // Complete stage
          setExecution(prev => {
            if (!prev) return null;
            const newStages = [...prev.stages];
            const hasWarning = stage.type === 'security';
            newStages[stageIndex] = {
              ...newStages[stageIndex],
              status: hasWarning ? 'warning' : 'success',
              duration: Math.floor(Math.random() * 30 + 10),
            };
            return { ...prev, stages: newStages };
          });

          stageIndex++;
          setTimeout(runStage, 500);
        }
      }, 200);
    };

    setTimeout(runStage, 300);
  }, []);

  const stopExecution = useCallback(() => {
    clearIntervals();
    setExecution(prev => prev ? {
      ...prev,
      status: 'failed',
      completedAt: new Date(),
    } : null);
  }, []);

  const resetExecution = useCallback(() => {
    clearIntervals();
    setExecution(null);
    setCurrentLogs([]);
  }, []);

  return {
    execution,
    currentLogs,
    startExecution,
    stopExecution,
    resetExecution,
    isRunning: execution?.status === 'running',
  };
}
