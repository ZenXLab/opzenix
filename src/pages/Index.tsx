import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { AnimatePresence } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';
import LeftRail from '@/components/layout/LeftRail';
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
  const { activeView, setActiveView } = useFlowStore();
  
  // Enable real-time updates
  useRealtimeUpdates();

  const handleWizardComplete = (nodes: Node[], edges: Edge[], config: any) => {
    console.log('Pipeline created:', { nodes, edges, config });
    toast.success(`Created ${config.repository.language || 'custom'} pipeline with ${nodes.length} stages`);
    // Open the pipeline editor with the generated nodes
    setPipelineEditorOpen(true);
  };

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
        {/* Top Bar */}
        <TopBar 
          onOpenGitWizard={() => setGitWizardOpen(true)}
          onOpenSpeech={() => setSpeechOpen(true)}
          onOpenPipelineEditor={() => setPipelineEditorOpen(true)}
          onOpenEnvironmentManager={() => setEnvironmentManagerOpen(true)}
          onOpenOpzenixWizard={() => setOpzenixWizardOpen(true)}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {activeView === 'flows' && (
            <LeftRail onOpenAuditLog={() => setAuditLogOpen(true)} />
          )}
          
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
          
          {activeView === 'flows' && <InspectorPanel />}
        </div>

        {/* Modals & Overlays */}
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
      </div>
    </ReactFlowProvider>
  );
};

export default Index;
