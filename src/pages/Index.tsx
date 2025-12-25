import { useState, useCallback, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { AnimatePresence } from 'framer-motion';
import OpzenixMainLayout from '@/components/opzenix/OpzenixMainLayout';
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
import PipelineTemplatesGallery from '@/components/templates/PipelineTemplatesGallery';
import { EnhancedOnboardingWizard } from '@/components/onboarding/EnhancedOnboardingWizard';
import { GuidedDemoFlow } from '@/components/demo/GuidedDemoFlow';
import { UserSettingsPanel } from '@/components/settings/UserSettingsPanel';
import { EnterpriseReadinessChecklist } from '@/components/validation/EnterpriseReadinessChecklist';
import { ImplementationReport } from '@/components/reports/ImplementationReport';
import { ComplianceAuditPanel } from '@/components/compliance/ComplianceAuditPanel';
import { VaultAdapterPanel } from '@/components/vault/VaultAdapterPanel';
import { AzureIntegrationPanel } from '@/components/azure/AzureIntegrationPanel';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useFlowStore } from '@/stores/flowStore';
import { toast } from 'sonner';
import { Node, Edge } from '@xyflow/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ValidationChecklist } from '@/components/validation/ValidationChecklist';
import EnhancedApprovalPanel from '@/components/governance/EnhancedApprovalPanel';

const Index = () => {
  // Panel states
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
  const [isDemoOpen, setDemoOpen] = useState(false);
  const [isValidationOpen, setValidationOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isReadinessOpen, setReadinessOpen] = useState(false);
  const [isReportOpen, setReportOpen] = useState(false);
  const [isComplianceOpen, setComplianceOpen] = useState(false);
  const [isVaultOpen, setVaultOpen] = useState(false);
  const [isAzureOpen, setAzureOpen] = useState(false);
  const [isApprovalOpen, setApprovalOpen] = useState(false);
  
  const { selectedExecution, activeFlowType } = useFlowStore();
  
  useRealtimeUpdates();
  const { role, loading: roleLoading } = useUserRole();
  const { showOnboarding, setShowOnboarding, completeOnboarding, loading: preferencesLoading } = useUserPreferences();

  const handleWizardComplete = useCallback((nodes: Node[], edges: Edge[], config: any) => {
    toast.success(`Created ${config.repository.language || 'custom'} pipeline with ${nodes.length} stages`);
    setPipelineEditorOpen(true);
  }, []);

  const handleTemplateSelect = useCallback((nodes: Node[], edges: Edge[]) => {
    toast.success(`Loaded template with ${nodes.length} stages`);
    setTemplatesGalleryOpen(false);
    setPipelineEditorOpen(true);
  }, []);

  const handleGitHubConnected = useCallback((config: any) => {
    toast.success(`Connected to ${config.owner}/${config.repo}`);
  }, []);

  return (
    <>
      {/* Main OPZENIX Layout */}
      <OpzenixMainLayout 
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenProfile={() => setSettingsOpen(true)}
      />

      {/* Modals & Overlays */}
      <GitConnectionWizard isOpen={isGitWizardOpen} onClose={() => setGitWizardOpen(false)} />
      <GitHubConnectionPanel isOpen={isGitHubPanelOpen} onClose={() => setGitHubPanelOpen(false)} onConnected={handleGitHubConnected} />
      <SpeechPanel isOpen={isSpeechOpen} onClose={() => setSpeechOpen(false)} />
      <VisualPipelineEditor isOpen={isPipelineEditorOpen} onClose={() => setPipelineEditorOpen(false)} />
      <EnvironmentManager isOpen={isEnvironmentManagerOpen} onClose={() => setEnvironmentManagerOpen(false)} />
      <OpzenixWizard isOpen={isOpzenixWizardOpen} onClose={() => setOpzenixWizardOpen(false)} onComplete={handleWizardComplete} />
      <CheckpointRollbackPanel isOpen={isRollbackOpen} onClose={() => setRollbackOpen(false)} executionId={selectedExecution?.id} />
      <AlertsPanel isOpen={isAlertsOpen} onClose={() => setAlertsOpen(false)} />
      <TelemetryPanel isOpen={isTelemetryOpen} onClose={() => setTelemetryOpen(false)} />
      <ExecutionHistoryPanel isOpen={isExecutionHistoryOpen} onClose={() => setExecutionHistoryOpen(false)} flowType={activeFlowType} />
      <PipelineTemplatesGallery isOpen={isTemplatesGalleryOpen} onClose={() => setTemplatesGalleryOpen(false)} onSelectTemplate={handleTemplateSelect} />
      <UserSettingsPanel open={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
      <EnhancedOnboardingWizard open={showOnboarding} onClose={() => setShowOnboarding(false)} onComplete={completeOnboarding} />
      <GuidedDemoFlow open={isDemoOpen} onClose={() => setDemoOpen(false)} />
      
      <Sheet open={isValidationOpen} onOpenChange={setValidationOpen}>
        <SheetContent side="right" className="w-[500px] sm:max-w-lg">
          <SheetHeader><SheetTitle>System Validation</SheetTitle></SheetHeader>
          <div className="mt-6"><ValidationChecklist /></div>
        </SheetContent>
      </Sheet>

      <EnterpriseReadinessChecklist isOpen={isReadinessOpen} onClose={() => setReadinessOpen(false)} />
      <ImplementationReport isOpen={isReportOpen} onClose={() => setReportOpen(false)} />
      
      <Sheet open={isComplianceOpen} onOpenChange={setComplianceOpen}>
        <SheetContent side="right" className="w-[600px] sm:max-w-2xl overflow-y-auto">
          <div className="mt-6"><ComplianceAuditPanel /></div>
        </SheetContent>
      </Sheet>

      <Sheet open={isVaultOpen} onOpenChange={setVaultOpen}>
        <SheetContent side="right" className="w-[600px] sm:max-w-2xl overflow-y-auto">
          <div className="mt-6"><VaultAdapterPanel /></div>
        </SheetContent>
      </Sheet>

      <AzureIntegrationPanel isOpen={isAzureOpen} onClose={() => setAzureOpen(false)} />

      <Sheet open={isApprovalOpen} onOpenChange={setApprovalOpen}>
        <SheetContent side="right" className="w-[600px] sm:max-w-2xl overflow-y-auto">
          <div className="mt-6"><EnhancedApprovalPanel /></div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Index;
