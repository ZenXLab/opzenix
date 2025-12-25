import { useState, useCallback, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { AnimatePresence } from 'framer-motion';
import ControlTowerLayout from '@/components/control-tower/ControlTowerLayout';
import ControlTowerDashboard from '@/components/control-tower/ControlTowerDashboard';
import ExecutionFlowView from '@/components/control-tower/ExecutionFlowView';
import ConnectionsPanel from '@/components/control-tower/ConnectionsPanel';
import EnvironmentsPanel from '@/components/control-tower/EnvironmentsPanel';
import ApprovalsPanel from '@/components/control-tower/ApprovalsPanel';
import SystemHealthPanel from '@/components/control-tower/SystemHealthPanel';
import AuditLogPanel from '@/components/control-tower/AuditLogPanel';
import DeploymentHistoryPanel from '@/components/control-tower/DeploymentHistoryPanel';
import BranchManagementPanel from '@/components/control-tower/BranchManagementPanel';
import EnvironmentLocksPanel from '@/components/control-tower/EnvironmentLocksPanel';
import GovernanceBanner from '@/components/control-tower/GovernanceBanner';
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
import { ExecutionDetailView } from '@/components/control-tower/ExecutionDetailView';
import PipelineTemplatesGallery from '@/components/templates/PipelineTemplatesGallery';
import { EnhancedOnboardingWizard } from '@/components/onboarding/EnhancedOnboardingWizard';
import { ValidationChecklist } from '@/components/validation/ValidationChecklist';
import { GuidedDemoFlow } from '@/components/demo/GuidedDemoFlow';
import { UserSettingsPanel } from '@/components/settings/UserSettingsPanel';
import { EnterpriseReadinessChecklist } from '@/components/validation/EnterpriseReadinessChecklist';
import { ImplementationReport } from '@/components/reports/ImplementationReport';
import { ComplianceAuditPanel } from '@/components/compliance/ComplianceAuditPanel';
import { VaultAdapterPanel } from '@/components/vault/VaultAdapterPanel';
import { AzureIntegrationPanel } from '@/components/azure/AzureIntegrationPanel';
import ExecutionBuilderPanel from '@/components/control-tower/ExecutionBuilderPanel';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useFlowStore } from '@/stores/flowStore';
import { toast } from 'sonner';
import { Node, Edge } from '@xyflow/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import EnhancedApprovalPanel from '@/components/governance/EnhancedApprovalPanel';

const Index = () => {
  // Control Tower section state
  const [activeSection, setActiveSection] = useState('control-tower');
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  
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
  const [approvalNodeId, setApprovalNodeId] = useState<string | null>(null);
  
  const { selectedExecution, activeFlowType } = useFlowStore();
  
  // Enable realtime updates
  useRealtimeUpdates();
  
  // Initialize user role detection
  const { role, loading: roleLoading } = useUserRole();
  
  // User preferences with first-time onboarding detection
  const { 
    showOnboarding, 
    setShowOnboarding, 
    completeOnboarding,
    loading: preferencesLoading 
  } = useUserPreferences();

  // Listen for execution view events from other components (e.g., DeploymentHistoryPanel)
  useEffect(() => {
    const handleViewExecution = (event: CustomEvent<{ executionId: string }>) => {
      setSelectedExecutionId(event.detail.executionId);
      setActiveSection('executions');
    };

    window.addEventListener('opzenix:view-execution', handleViewExecution as EventListener);
    return () => {
      window.removeEventListener('opzenix:view-execution', handleViewExecution as EventListener);
    };
  }, []);

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

  const handleOpenApproval = useCallback((nodeId: string) => {
    setApprovalNodeId(nodeId);
    setApprovalOpen(true);
  }, []);

  const handleRollback = useCallback((checkpointId: string) => {
    console.log('Rollback to checkpoint:', checkpointId);
    toast.info(`Rolling back to checkpoint ${checkpointId}`);
    setRollbackOpen(true);
  }, []);

  // Render section content based on activeSection
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'control-tower':
        return (
          <ControlTowerDashboard 
            onViewExecution={(id) => {
              setSelectedExecutionId(id);
              setActiveSection('executions');
            }}
            onOpenConnections={() => setActiveSection('connections')}
            onOpenEnvironments={() => setActiveSection('environments')}
            onOpenApprovals={() => setActiveSection('approvals')}
          />
        );
      case 'executions':
        return selectedExecutionId ? (
          <ExecutionDetailView 
            executionId={selectedExecutionId}
            environment="development"
            onBack={() => {
              setSelectedExecutionId(null);
              setActiveSection('control-tower');
            }}
          />
        ) : (
          <ExecutionFlowView 
            executionId={selectedExecutionId || undefined}
            onOpenApproval={handleOpenApproval}
            onRollback={handleRollback}
            onBack={() => setActiveSection('control-tower')}
          />
        );
      case 'deployments':
        return <DeploymentHistoryPanel />;
      case 'execution-builder':
        return <ExecutionBuilderPanel />;
      case 'branch-management':
        return <BranchManagementPanel />;
      case 'environment-locks':
        return <EnvironmentLocksPanel />;
      case 'connections':
        return <ConnectionsPanel />;
      case 'environments':
        return <EnvironmentsPanel />;
      case 'approvals':
        return <ApprovalsPanel />;
      case 'audit-log':
        return <AuditLogPanel />;
      case 'health':
        return <SystemHealthPanel />;
      default:
        return (
          <ControlTowerDashboard 
            onViewExecution={(id) => {
              setSelectedExecutionId(id);
              setActiveSection('executions');
            }}
            onOpenConnections={() => setActiveSection('connections')}
            onOpenEnvironments={() => setActiveSection('environments')}
            onOpenApprovals={() => setActiveSection('approvals')}
          />
        );
    }
  };

  return (
    <ReactFlowProvider>
      <ControlTowerLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenApprovals={() => setActiveSection('approvals')}
        onOpenAuditLog={() => setActiveSection('audit-log')}
      >
        {renderSectionContent()}
      </ControlTowerLayout>

      {/* Modals & Overlays */}
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
      
      {/* User Settings Panel */}
      <UserSettingsPanel 
        open={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      
      {/* Enhanced Onboarding Wizard - Auto-shows for first-time users with real GitHub integration */}
      <EnhancedOnboardingWizard 
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

      {/* Enterprise Readiness Checklist */}
      <EnterpriseReadinessChecklist 
        isOpen={isReadinessOpen} 
        onClose={() => setReadinessOpen(false)} 
      />

      {/* Implementation Report */}
      <ImplementationReport 
        isOpen={isReportOpen} 
        onClose={() => setReportOpen(false)} 
      />

      {/* Compliance Audit Panel */}
      <Sheet open={isComplianceOpen} onOpenChange={setComplianceOpen}>
        <SheetContent side="right" className="w-[600px] sm:max-w-2xl overflow-y-auto">
          <div className="mt-6">
            <ComplianceAuditPanel />
          </div>
        </SheetContent>
      </Sheet>

      {/* Vault Manager Panel */}
      <Sheet open={isVaultOpen} onOpenChange={setVaultOpen}>
        <SheetContent side="right" className="w-[600px] sm:max-w-2xl overflow-y-auto">
          <div className="mt-6">
            <VaultAdapterPanel />
          </div>
        </SheetContent>
      </Sheet>

      {/* Azure Integration Panel */}
      <AzureIntegrationPanel 
        isOpen={isAzureOpen} 
        onClose={() => setAzureOpen(false)} 
      />

      {/* Approval Panel */}
      <Sheet open={isApprovalOpen} onOpenChange={setApprovalOpen}>
        <SheetContent side="right" className="w-[600px] sm:max-w-2xl overflow-y-auto">
          <div className="mt-6">
            <EnhancedApprovalPanel />
          </div>
        </SheetContent>
      </Sheet>

      {/* Execution Detail Panel - Slide-out */}
      <AnimatePresence>
        {selectedExecutionId && activeSection !== 'executions' && (
          <ExecutionDetailPanel 
            executionId={selectedExecutionId}
            onClose={() => setSelectedExecutionId(null)}
          />
        )}
      </AnimatePresence>
    </ReactFlowProvider>
  );
};

export default Index;
