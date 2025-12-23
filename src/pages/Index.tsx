import { ReactFlowProvider } from '@xyflow/react';
import TopBar from '@/components/layout/TopBar';
import LeftRail from '@/components/layout/LeftRail';
import FlowCanvas from '@/components/flow/FlowCanvas';
import InspectorPanel from '@/components/panels/InspectorPanel';
import ConfigEditorPanel from '@/components/panels/ConfigEditorPanel';
import DeploymentTimeline from '@/components/panels/DeploymentTimeline';
import ApprovalPanel from '@/components/governance/ApprovalPanel';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

const Index = () => {
  // Enable real-time updates
  useRealtimeUpdates();

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
        {/* Top Bar */}
        <TopBar />
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <LeftRail />
          
          <main className="flex-1 relative overflow-hidden">
            <FlowCanvas />
          </main>
          
          <InspectorPanel />
        </div>

        {/* Modals & Overlays */}
        <ConfigEditorPanel />
        <DeploymentTimeline />
        <ApprovalPanel />
      </div>
    </ReactFlowProvider>
  );
};

export default Index;
