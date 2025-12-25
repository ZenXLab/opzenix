import { useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Shield,
  GitBranch,
  Rocket,
  Layers,
  ArrowLeft,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ControlTowerTopBar from '@/components/control-tower/ControlTowerTopBar';
import ControlTowerStatusBar from '@/components/control-tower/ControlTowerStatusBar';
import OpzenixFlowSidebar, { EnvironmentId, FlowViewMode, ENVIRONMENT_DISPLAY_NAMES } from './OpzenixFlowSidebar';
import WidgetDashboard from '@/components/control-tower/WidgetDashboard';
import { OpzenixFlowMap } from '@/components/flow/OpzenixFlowMap';
import { RBACActionsPanel, RBACRoleMatrix } from '@/components/flow/OpzenixRBACActions';
import { useRBACPermissions, type Environment as RBACEnvironment } from '@/hooks/useRBACPermissions';
import { cn } from '@/lib/utils';

// ============================================
// 🏗️ OPZENIX MAIN LAYOUT (MVP 1.0.0 LOCKED)
// ============================================
// Unified layout with:
// - Left Sidebar: OPZENIX Flow Maps (Environment Pipeline)
// - Main Area: Control Tower (Widget Dashboard) OR Flow View
// ============================================

interface OpzenixMainLayoutProps {
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
}

export const OpzenixMainLayout = ({ onOpenSettings, onOpenProfile }: OpzenixMainLayoutProps) => {
  // View state
  const [currentView, setCurrentView] = useState<'dashboard' | 'flow-map'>('dashboard');
  const [activeEnvironment, setActiveEnvironment] = useState<EnvironmentId | null>(null);
  const [activeFlowMode, setActiveFlowMode] = useState<FlowViewMode | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showRBACMatrix, setShowRBACMatrix] = useState(false);

  // RBAC
  const { dbRole, isAdmin } = useRBACPermissions();

  // Handle environment/flow selection
  const handleSelectEnvironment = useCallback((env: EnvironmentId, mode: FlowViewMode) => {
    setActiveEnvironment(env);
    setActiveFlowMode(mode);
    setCurrentView('flow-map');
  }, []);

  // Go back to dashboard
  const handleBackToDashboard = useCallback(() => {
    setCurrentView('dashboard');
    setActiveEnvironment(null);
    setActiveFlowMode(null);
  }, []);

  // Get flow mode icon
  const getFlowModeIcon = (mode: FlowViewMode | null) => {
    switch (mode) {
      case 'ci':
        return GitBranch;
      case 'cd':
        return Rocket;
      case 'ci+cd':
        return Layers;
      default:
        return LayoutDashboard;
    }
  };

  const FlowModeIcon = getFlowModeIcon(activeFlowMode);

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
        {/* Top Bar */}
        <ControlTowerTopBar onOpenSettings={onOpenSettings} onOpenProfile={onOpenProfile} />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* OPZENIX Flow Sidebar */}
          <OpzenixFlowSidebar
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
            activeEnvironment={activeEnvironment || undefined}
            activeFlowMode={activeFlowMode || undefined}
            onSelectEnvironment={handleSelectEnvironment}
            onViewRBACMatrix={() => setShowRBACMatrix(true)}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-hidden flex flex-col">
            {/* Flow View Header (when viewing a flow) */}
            <AnimatePresence>
              {currentView === 'flow-map' && activeEnvironment && activeFlowMode && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-3 border-b border-border bg-primary/5"
                >
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={handleBackToDashboard}>
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Control Tower
                    </Button>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2">
                      <FlowModeIcon className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">
                        ENVIRONMENT: {ENVIRONMENT_DISPLAY_NAMES[activeEnvironment]}
                      </span>
                      <span className="text-muted-foreground">|</span>
                      <span className="font-medium text-foreground">FLOW TYPE: {activeFlowMode.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* RBAC Actions */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Role: {dbRole?.toUpperCase() || 'VIEWER'}
                    </Badge>
                    <RBACActionsPanel
                      environment={activeEnvironment as RBACEnvironment}
                      onApprove={() => console.log('Approve', activeEnvironment)}
                      onDeploy={() => console.log('Deploy', activeEnvironment)}
                      onRollback={() => console.log('Rollback', activeEnvironment)}
                      onBreakGlass={isAdmin ? () => console.log('Break Glass', activeEnvironment) : undefined}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main View Content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {currentView === 'dashboard' ? (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <WidgetDashboard
                      onMetricClick={(type) => console.log('Metric clicked:', type)}
                      onOpenExecutionHistory={() => console.log('Open execution history')}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="flow-map"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <OpzenixFlowMap
                      environment={activeEnvironment || 'dev'}
                      onNodeSelect={(nodeId, data) => {
                        console.log('[OPZENIX] Node selected:', nodeId, data);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Bottom Status Bar */}
        <ControlTowerStatusBar />

        {/* RBAC Matrix Sheet */}
        <Sheet open={showRBACMatrix} onOpenChange={setShowRBACMatrix}>
          <SheetContent side="right" className="w-[600px] sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                RBAC Matrix (MVP 1.0.0 LOCKED)
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <RBACRoleMatrix />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </ReactFlowProvider>
  );
};

export default OpzenixMainLayout;
