import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { AnimatePresence } from 'framer-motion';
import AppSidebar from '@/components/layout/AppSidebar';
import FlowCanvas from '@/components/flow/FlowCanvas';
import InspectorPanel from '@/components/panels/InspectorPanel';
import ConfigEditorPanel from '@/components/panels/ConfigEditorPanel';
import DeploymentTimeline from '@/components/panels/DeploymentTimeline';
import ApprovalPanel from '@/components/governance/ApprovalPanel';
import AuditLogViewer from '@/components/governance/AuditLogViewer';
import ModularDashboardView from '@/components/dashboard/ModularDashboardView';
import GitConnectionWizard from '@/components/connect/GitConnectionWizard';
import SpeechPanel from '@/components/speech/SpeechPanel';
import VisualPipelineEditor from '@/components/pipeline/VisualPipelineEditor';
import EnvironmentManager from '@/components/environments/EnvironmentManager';
import OpzenixWizard from '@/components/opzenix/OpzenixWizard';
import CheckpointRollbackPanel from '@/components/checkpoint/CheckpointRollbackPanel';
import AlertsPanel from '@/components/alerts/AlertsPanel';
import TelemetryPanel from '@/components/telemetry/TelemetryPanel';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useFlowStore } from '@/stores/flowStore';
import { toast } from 'sonner';
import { Node, Edge } from '@xyflow/react';

const Index = () => {
  const [isAuditLogOpen, setAuditLogOpen] = useState(false);
  const [isGitWizardOpen, setGitWizardOpen] = useState(false);
  const [isSpeechOpen, setSpeechOpen] = useState(false);
  const [isPipelineEditorOpen, setPipelineEditorOpen] = useState(false);
  const [isEnvironmentManagerOpen, setEnvironmentManagerOpen] = useState(false);
  const [isOpzenixWizardOpen, setOpzenixWizardOpen] = useState(false);
  const [isRollbackOpen, setRollbackOpen] = useState(false);
  const [isAlertsOpen, setAlertsOpen] = useState(false);
  const [isTelemetryOpen, setTelemetryOpen] = useState(false);
  const { activeView, setActiveView, selectedExecution } = useFlowStore();
  
  useRealtimeUpdates();

  const handleWizardComplete = (nodes: Node[], edges: Edge[], config: any) => {
    console.log('Pipeline created:', { nodes, edges, config });
    toast.success(`Created ${config.repository.language || 'custom'} pipeline with ${nodes.length} stages`);
    setPipelineEditorOpen(true);
  };

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex overflow-hidden bg-background">
        {/* Left Sidebar */}
        <AppSidebar 
          onOpenAuditLog={() => setAuditLogOpen(true)}
          onOpenAlerts={() => setAlertsOpen(true)}
          onOpenRollback={() => setRollbackOpen(true)}
          onOpenTelemetry={() => setTelemetryOpen(true)}
          onOpenOpzenixWizard={() => setOpzenixWizardOpen(true)}
          onOpenPipelineEditor={() => setPipelineEditorOpen(true)}
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
              />
            ) : (
              <FlowCanvas key="flows" />
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
      </div>
    </ReactFlowProvider>
  );
};

export default Index;
