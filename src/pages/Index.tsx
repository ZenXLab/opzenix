import { useState, useCallback, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { AnimatePresence } from 'framer-motion';
import ModeDrivenSidebar from '@/components/layout/ModeDrivenSidebar';
import TopBar from '@/components/layout/TopBar';
import FlowCanvas from '@/components/flow/FlowCanvas';
import InspectorPanel from '@/components/panels/InspectorPanel';
import ConfigEditorPanel from '@/components/panels/ConfigEditorPanel';
import DeploymentTimeline from '@/components/panels/DeploymentTimeline';
import ApprovalPanel from '@/components/governance/ApprovalPanel';
import AuditLogViewer from '@/components/governance/AuditLogViewer';
import ModularDashboardView from '@/components/dashboard/ModularDashboardView';
import GitConnectionWizard from '@/components/connect/GitConnectionWizard';
import GitHubConnectionPanel from '@/components/connect/GitHubConnectionPanel';
import SpeechPanel from '@/components/speech/SpeechPanel';
import VisualPipelineEditor from '@/components/pipeline/VisualPipelineEditor';
import EnvironmentManager from '@/components/environments/EnvironmentManager';
import OpzenixWizard from '@/components/opzenix/OpzenixWizard';
import CheckpointRollbackPanel from '@/components/checkpoint/CheckpointRollbackPanel';
import AlertsPanel from '@/components/alerts/AlertsPanel';
import TelemetryPanel from '@/components/telemetry/TelemetryPanel';
import ExecutionHistoryPanel from '@/components/execution/ExecutionHistoryPanel';
import { ExecutionDetailPanel } from '@/components/execution/ExecutionDetailPanel';
import PipelineTemplatesGallery from '@/components/templates/PipelineTemplatesGallery';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { ValidationChecklist } from '@/components/validation/ValidationChecklist';
import { GuidedDemoFlow } from '@/components/demo/GuidedDemoFlow';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useFlowStore } from '@/stores/flowStore';
import { toast } from 'sonner';
import { Node, Edge } from '@xyflow/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const Index = () => {
  const [isAuditLogOpen, setAuditLogOpen] = useState(false);
  const [isGitWizardOpen, setGitWizardOpen] = useState(false);
  const [isGitHubPanelOpen, setGitHubPanelOpen] = useState(false);
  const [isSpeechOpen, setSpeechOpen] = useState(false);
  const [isPipelineEditorOpen, setPipelineEditorOpen] = useState(false);
  const [isEnvironmentManagerOpen, setEnvironmentManagerOpen] = useState(false);
  const [isOpzenixWizardOpen, setOpzenixWizardOpen] = useState(false);
  const [isRollbackOpen, setRollbackOpen] = useState(false);
  const [isAlertsOpen, setAlertsOpen] = useState(false);
  const [isTelemetryOpen, setTelemetryOpen] = useState(false);
  const [isExecutionHistoryOpen, setExecutionHistoryOpen] = useState(false);
  const [isTemplatesGalleryOpen, setTemplatesGalleryOpen] = useState(false);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [isDemoOpen, setDemoOpen] = useState(false);
  const [isValidationOpen, setValidationOpen] = useState(false);
  const { activeView, setActiveView, selectedExecution, activeFlowType } = useFlowStore();
  
  // Enable realtime updates
  useRealtimeUpdates();
  
  // Initialize user role detection - automatically sets sidebar mode based on role
  const { role, loading: roleLoading } = useUserRole();
  
  // User preferences with first-time onboarding detection
  const { 
    showOnboarding, 
    setShowOnboarding, 
    completeOnboarding,
    loading: preferencesLoading 
  } = useUserPreferences();

  const handleWizardComplete = useCallback((nodes: Node[], edges: Edge[], config: any) => {
    console.log('Pipeline created:', { nodes, edges, config });
    toast.success(`Created ${config.repository.language || 'custom'} pipeline with ${nodes.length} stages`);
    setPipelineEditorOpen(true);
  }, []);

  const handleTemplateSelect = useCallback((nodes: Node[], edges: Edge[]) => {
    console.log('Template selected:', { nodes, edges });
    toast.success(`Loaded template with ${nodes.length} stages`);
    setTemplatesGalleryOpen(false);
    setPipelineEditorOpen(true);
  }, []);

  const handleGitHubConnected = useCallback((config: any) => {
    console.log('GitHub connected:', config);
    toast.success(`Connected to ${config.owner}/${config.repo}`);
  }, []);

  // Handle metric card clicks - navigate to relevant section
  const handleMetricClick = useCallback((metricType: string) => {
    switch (metricType) {
      case 'active-flows':
        setActiveView('flows');
        break;
      case 'deployments':
        setActiveView('flows');
        setExecutionHistoryOpen(true);
        break;
      case 'pending':
        // Open approval panel
        break;
      default:
        break;
    }
  }, [setActiveView]);

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
        {/* Top Bar with Demo Button and Production Readiness */}
        <TopBar 
          onOpenGitWizard={() => setGitWizardOpen(true)}
          onOpenSpeech={() => setSpeechOpen(true)}
          onOpenPipelineEditor={() => setPipelineEditorOpen(true)}
          onOpenEnvironmentManager={() => setEnvironmentManagerOpen(true)}
          onOpenOpzenixWizard={() => setOpzenixWizardOpen(true)}
          onOpenDemo={() => setDemoOpen(true)}
          onOpenValidation={() => setValidationOpen(true)}
        />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Mode Driven */}
          <ModeDrivenSidebar 
            onOpenAuditLog={() => setAuditLogOpen(true)}
            onOpenAlerts={() => setAlertsOpen(true)}
            onOpenRollback={() => setRollbackOpen(true)}
            onOpenTelemetry={() => setTelemetryOpen(true)}
            onOpenOpzenixWizard={() => setOpzenixWizardOpen(true)}
            onOpenPipelineEditor={() => setPipelineEditorOpen(true)}
            onOpenExecutionHistory={() => setExecutionHistoryOpen(true)}
            onViewDashboard={() => setActiveView('dashboard')}
            onViewFlows={() => setActiveView('flows')}
            onOpenExecutionDetail={(id) => setSelectedExecutionId(id)}
          />
          
          {/* Main Content */}
          <main className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {activeView === 'dashboard' ? (
                <ModularDashboardView 
                  key="dashboard"
                  onViewFlows={() => setActiveView('flows')}
                  onOpenPipelineEditor={() => setPipelineEditorOpen(true)}
                  onOpenEnvironmentManager={() => setEnvironmentManagerOpen(true)}
                  onOpenOpzenixWizard={() => setOpzenixWizardOpen(true)}
                  onOpenTemplatesGallery={() => setTemplatesGalleryOpen(true)}
                  onOpenGitHubConnection={() => setGitHubPanelOpen(true)}
                  onOpenExecutionHistory={() => setExecutionHistoryOpen(true)}
                  onMetricClick={handleMetricClick}
                />
              ) : (
                <FlowCanvas key="flows" />
              )}
            </AnimatePresence>
            
            {/* Execution Detail Panel - Slide-out */}
            <AnimatePresence>
              {selectedExecutionId && (
                <ExecutionDetailPanel 
                  executionId={selectedExecutionId}
                  onClose={() => setSelectedExecutionId(null)}
                />
              )}
            </AnimatePresence>
          </main>
        </div>
        <main className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' ? (
              <ModularDashboardView 
                key="dashboard"
                onViewFlows={() => setActiveView('flows')}
                onOpenPipelineEditor={() => setPipelineEditorOpen(true)}
                onOpenEnvironmentManager={() => setEnvironmentManagerOpen(true)}
                onOpenOpzenixWizard={() => setOpzenixWizardOpen(true)}
                onOpenTemplatesGallery={() => setTemplatesGalleryOpen(true)}
                onOpenGitHubConnection={() => setGitHubPanelOpen(true)}
                onOpenExecutionHistory={() => setExecutionHistoryOpen(true)}
                onMetricClick={handleMetricClick}
              />
            ) : (
              <FlowCanvas key="flows" />
            )}
          </AnimatePresence>
          
          {/* Execution Detail Panel - Slide-out */}
          <AnimatePresence>
            {selectedExecutionId && (
              <ExecutionDetailPanel 
                executionId={selectedExecutionId}
                onClose={() => setSelectedExecutionId(null)}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Modals & Overlays */}
        {activeView === 'flows' && <InspectorPanel />}
        <ConfigEditorPanel />
        <DeploymentTimeline />
        <ApprovalPanel />
        <AuditLogViewer isOpen={isAuditLogOpen} onClose={() => setAuditLogOpen(false)} />
        <GitConnectionWizard isOpen={isGitWizardOpen} onClose={() => setGitWizardOpen(false)} />
        <GitHubConnectionPanel 
          isOpen={isGitHubPanelOpen} 
          onClose={() => setGitHubPanelOpen(false)}
          onConnected={handleGitHubConnected}
        />
        <SpeechPanel isOpen={isSpeechOpen} onClose={() => setSpeechOpen(false)} />
        <VisualPipelineEditor isOpen={isPipelineEditorOpen} onClose={() => setPipelineEditorOpen(false)} />
        <EnvironmentManager isOpen={isEnvironmentManagerOpen} onClose={() => setEnvironmentManagerOpen(false)} />
        <OpzenixWizard 
          isOpen={isOpzenixWizardOpen} 
          onClose={() => setOpzenixWizardOpen(false)} 
          onComplete={handleWizardComplete}
        />
        <CheckpointRollbackPanel 
          isOpen={isRollbackOpen} 
          onClose={() => setRollbackOpen(false)}
          executionId={selectedExecution?.id}
        />
        <AlertsPanel 
          isOpen={isAlertsOpen} 
          onClose={() => setAlertsOpen(false)} 
        />
        <TelemetryPanel
          isOpen={isTelemetryOpen}
          onClose={() => setTelemetryOpen(false)}
        />
        <ExecutionHistoryPanel
          isOpen={isExecutionHistoryOpen}
          onClose={() => setExecutionHistoryOpen(false)}
          flowType={activeFlowType}
        />
        <PipelineTemplatesGallery
          isOpen={isTemplatesGalleryOpen}
          onClose={() => setTemplatesGalleryOpen(false)}
          onSelectTemplate={handleTemplateSelect}
        />
        
        {/* Onboarding Wizard - Auto-shows for first-time users */}
        <OnboardingWizard 
          open={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={completeOnboarding}
        />
        
        {/* Guided Demo Flow - For investor presentations */}
        <GuidedDemoFlow 
          open={isDemoOpen}
          onClose={() => setDemoOpen(false)}
        />
        
        {/* Validation Checklist Sheet */}
        <Sheet open={isValidationOpen} onOpenChange={setValidationOpen}>
          <SheetContent side="right" className="w-[500px] sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>System Validation</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <ValidationChecklist />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </ReactFlowProvider>
  );
};

export default Index;
