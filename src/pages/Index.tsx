import { ReactFlowProvider } from '@xyflow/react';
import TopBar from '@/components/layout/TopBar';
import LeftRail from '@/components/layout/LeftRail';
import FlowCanvas from '@/components/flow/FlowCanvas';
import InspectorPanel from '@/components/panels/InspectorPanel';

const Index = () => {
  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
        {/* Top Bar - System Health & Navigation */}
        <TopBar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Rail - Flow Selector & Environments */}
          <LeftRail />
          
          {/* Center Canvas - Live Flow Map */}
          <main className="flex-1 relative overflow-hidden">
            <FlowCanvas />
          </main>
          
          {/* Right Panel - Inspector & AI Insights */}
          <InspectorPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default Index;
