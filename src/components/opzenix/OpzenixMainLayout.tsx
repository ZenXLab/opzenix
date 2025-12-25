import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ControlTowerTopBar from '@/components/control-tower/ControlTowerTopBar';
import ControlTowerStatusBar from '@/components/control-tower/ControlTowerStatusBar';
import OpzenixLeftNav from './OpzenixLeftNav';
import OpzenixRightPanel from './OpzenixRightPanel';
import OpzenixDashboard from './OpzenixDashboard';
import FlowViewerScreen, { ActionContext } from './screens/FlowViewerScreen';
import ActionPanelModal from './screens/ActionPanelModal';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// 🏗️ OPZENIX MAIN LAYOUT (Enterprise Grade)
// ============================================

type Screen = 'dashboard' | 'ci-flow' | 'cd-flow' | 'full-flow';
type Environment = 'dev' | 'uat' | 'staging' | 'preprod' | 'prod';

interface OpzenixMainLayoutProps {
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
}

export const OpzenixMainLayout = ({ onOpenSettings, onOpenProfile }: OpzenixMainLayoutProps) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment>('dev');
  const [leftNavCollapsed, setLeftNavCollapsed] = useState(false);
  
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionContext, setActionContext] = useState<ActionContext | null>(null);

  const handleNavigate = useCallback((screen: Screen, env?: Environment) => {
    setCurrentScreen(screen);
    if (env) setCurrentEnvironment(env);
  }, []);

  const handleNavigateToFlow = useCallback((flowType: 'ci-flow' | 'cd-flow' | 'full-flow', env: string) => {
    setCurrentScreen(flowType);
    setCurrentEnvironment(env as Environment);
  }, []);

  const handleRequestAction = useCallback((context: ActionContext) => {
    setActionContext(context);
    setActionModalOpen(true);
  }, []);

  const handleConfirmAction = useCallback(async (context: ActionContext, comment: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: context.type,
        resource_type: 'flow_node',
        resource_id: context.nodeId,
        details: { environment: context.environment, nodeName: context.nodeName, requiredRole: context.requiredRole, comment },
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      throw error;
    }
  }, []);

  const getFlowMode = () => {
    if (currentScreen === 'ci-flow') return 'ci';
    if (currentScreen === 'cd-flow') return 'cd';
    return 'ci+cd';
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <ControlTowerTopBar onOpenSettings={onOpenSettings} onOpenProfile={onOpenProfile} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation */}
        <OpzenixLeftNav
          currentScreen={currentScreen}
          currentEnvironment={currentEnvironment}
          onNavigate={handleNavigate}
          pendingApprovals={0}
          isCollapsed={leftNavCollapsed}
          onToggleCollapse={() => setLeftNavCollapsed(!leftNavCollapsed)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentScreen === 'dashboard' ? (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <OpzenixDashboard onNavigateToFlow={handleNavigateToFlow} currentEnvironment={currentEnvironment} />
              </motion.div>
            ) : (
              <motion.div key="flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <FlowViewerScreen
                  environment={currentEnvironment}
                  initialFlowMode={getFlowMode()}
                  onBack={() => setCurrentScreen('dashboard')}
                  onRequestAction={handleRequestAction}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right Panel - Only on Dashboard */}
        {currentScreen === 'dashboard' && <OpzenixRightPanel />}
      </div>

      <ControlTowerStatusBar />

      <ActionPanelModal
        open={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        context={actionContext}
        onConfirmAction={handleConfirmAction}
      />
    </div>
  );
};

export default OpzenixMainLayout;
