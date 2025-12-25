import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ControlTowerTopBar from '@/components/control-tower/ControlTowerTopBar';
import ControlTowerStatusBar from '@/components/control-tower/ControlTowerStatusBar';
import OpzenixLeftNav from './OpzenixLeftNav';
import OpzenixRightPanel from './OpzenixRightPanel';
import OpzenixDashboard from './OpzenixDashboard';
import FlowViewerScreen, { ActionContext } from './screens/FlowViewerScreen';
import ActionPanelModal from './screens/ActionPanelModal';
import AdminSettingsPanel from '@/components/admin/AdminSettingsPanel';
import ConnectionsHubPanel from '@/components/admin/ConnectionsHubPanel';
import { AnimatedPipelineView } from '@/components/pipeline/AnimatedPipelineView';
import { AdminOnboardingWizard } from '@/components/onboarding/AdminOnboardingWizard';
import { VaultManagementPanel } from '@/components/vault/VaultManagementPanel';
import { ArtifactsRegistryPanel } from '@/components/artifacts/ArtifactsRegistryPanel';
import { SecurityCenterPanel } from '@/components/security/SecurityCenterPanel';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// 🏗️ OPZENIX MAIN LAYOUT (Enterprise Grade)
// ============================================

type Screen = 'dashboard' | 'ci-flow' | 'cd-flow' | 'full-flow' | 'connections' | 'admin-settings' | 'pipelines' | 'ci-pipeline' | 'cd-pipeline' | 'vault' | 'artifacts' | 'security';
type Environment = 'dev' | 'uat' | 'staging' | 'preprod' | 'prod';

interface OpzenixMainLayoutProps {
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
}

export const OpzenixMainLayout = ({ onOpenSettings, onOpenProfile }: OpzenixMainLayoutProps) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment>('dev');
  const [leftNavCollapsed, setLeftNavCollapsed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionContext, setActionContext] = useState<ActionContext | null>(null);

  // Check if first-time admin
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prefs } = await supabase
            .from('user_preferences')
            .select('onboarding_state')
            .eq('user_id', user.id)
            .single();
          
          const onboardingState = prefs?.onboarding_state as Record<string, boolean> | null;
          if (!onboardingState?.completed) {
            setShowOnboarding(true);
          }
        }
      } catch (error) {
        // If no preferences exist, show onboarding
        setShowOnboarding(true);
      }
    };
    checkOnboardingStatus();
  }, []);

  const handleOnboardingComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_preferences').upsert({
          user_id: user.id,
          onboarding_state: { completed: true, completedAt: new Date().toISOString() },
        });
      }
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
    setShowOnboarding(false);
  };

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

  // Show onboarding wizard
  if (showOnboarding) {
    return (
      <AdminOnboardingWizard 
        onComplete={handleOnboardingComplete} 
        onSkip={() => setShowOnboarding(false)} 
      />
    );
  }

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
            {currentScreen === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <OpzenixDashboard 
                  onNavigateToFlow={handleNavigateToFlow} 
                  currentEnvironment={currentEnvironment}
                  onNavigate={handleNavigate}
                />
              </motion.div>
            )}
            {(currentScreen === 'ci-flow' || currentScreen === 'cd-flow' || currentScreen === 'full-flow') && (
              <motion.div key="flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <FlowViewerScreen
                  environment={currentEnvironment}
                  initialFlowMode={getFlowMode()}
                  onBack={() => setCurrentScreen('dashboard')}
                  onRequestAction={handleRequestAction}
                />
              </motion.div>
            )}
            {currentScreen === 'connections' && (
              <motion.div key="connections" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <ConnectionsHubPanel onBack={() => setCurrentScreen('dashboard')} />
              </motion.div>
            )}
            {currentScreen === 'admin-settings' && (
              <motion.div key="admin-settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <AdminSettingsPanel onBack={() => setCurrentScreen('dashboard')} />
              </motion.div>
            )}
            {currentScreen === 'ci-pipeline' && (
              <motion.div key="ci-pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-auto p-6">
                <AnimatedPipelineView pipelineType="ci" onBack={() => setCurrentScreen('dashboard')} />
              </motion.div>
            )}
            {currentScreen === 'cd-pipeline' && (
              <motion.div key="cd-pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-auto p-6">
                <AnimatedPipelineView pipelineType="cd" onBack={() => setCurrentScreen('dashboard')} />
              </motion.div>
            )}
            {currentScreen === 'pipelines' && (
              <motion.div key="pipelines" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-auto p-6">
                <AnimatedPipelineView pipelineType="full" onBack={() => setCurrentScreen('dashboard')} />
              </motion.div>
            )}
            {currentScreen === 'vault' && (
              <motion.div key="vault" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <VaultManagementPanel onBack={() => setCurrentScreen('dashboard')} />
              </motion.div>
            )}
            {currentScreen === 'artifacts' && (
              <motion.div key="artifacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <ArtifactsRegistryPanel onBack={() => setCurrentScreen('dashboard')} />
              </motion.div>
            )}
            {currentScreen === 'security' && (
              <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <SecurityCenterPanel onBack={() => setCurrentScreen('dashboard')} />
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
