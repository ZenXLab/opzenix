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
import DashboardView from '@/components/dashboard/DashboardView';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useFlowStore } from '@/stores/flowStore';

const Index = () => {
  const [isAuditLogOpen, setAuditLogOpen] = useState(false);
  const { activeView, setActiveView } = useFlowStore();
  
  // Enable real-time updates
  useRealtimeUpdates();

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
        {/* Top Bar */}
        <TopBar />
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {activeView === 'flows' && (
            <LeftRail onOpenAuditLog={() => setAuditLogOpen(true)} />
          )}
          
          <main className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {activeView === 'dashboard' ? (
                <DashboardView 
                  key="dashboard"
                  onViewFlows={() => setActiveView('flows')} 
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
      </div>
    </ReactFlowProvider>
  );
};

export default Index;
