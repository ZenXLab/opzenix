import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ControlTowerTopBar from '@/components/control-tower/ControlTowerTopBar';
import ControlTowerStatusBar from '@/components/control-tower/ControlTowerStatusBar';
import ControlTowerScreen from './screens/ControlTowerScreen';
import FlowViewerScreen, { ActionContext } from './screens/FlowViewerScreen';
import ActionPanelModal from './screens/ActionPanelModal';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// 🏗️ OPZENIX MAIN LAYOUT (MVP 1.0.0 LOCKED)
// ============================================
// STRICT SCREEN SEPARATION:
// 1. Control Tower (Dashboard Only) - Read-only widgets
// 2. Flow Viewer (Dedicated Screen) - One mode at a time
// 3. Action Panel (Modal) - Opens only for approval/deploy
// ============================================

type Screen = 'control-tower' | 'flow-viewer';
type FlowMode = 'ci' | 'cd' | 'ci+cd';

interface OpzenixMainLayoutProps {
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
}

export const OpzenixMainLayout = ({ onOpenSettings, onOpenProfile }: OpzenixMainLayoutProps) => {
  // Screen state - STRICT separation
  const [currentScreen, setCurrentScreen] = useState<Screen>('control-tower');
  const [flowEnvironment, setFlowEnvironment] = useState<string>('dev');
  const [flowMode, setFlowMode] = useState<FlowMode>('ci+cd');
  
  // Action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionContext, setActionContext] = useState<ActionContext | null>(null);

  // Navigate to Flow Viewer
  const handleNavigateToFlow = useCallback((environment: string, mode: FlowMode) => {
    setFlowEnvironment(environment);
    setFlowMode(mode);
    setCurrentScreen('flow-viewer');
  }, []);

  // Navigate back to Control Tower
  const handleBackToControlTower = useCallback(() => {
    setCurrentScreen('control-tower');
  }, []);

  // Open Action Modal (from Flow Viewer inspector)
  const handleRequestAction = useCallback((context: ActionContext) => {
    setActionContext(context);
    setActionModalOpen(true);
  }, []);

  // Confirm action and log to audit
  const handleConfirmAction = useCallback(async (context: ActionContext, comment: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: context.type,
        resource_type: 'flow_node',
        resource_id: context.nodeId,
        details: {
          environment: context.environment,
          nodeName: context.nodeName,
          requiredRole: context.requiredRole,
          policyReference: context.policyReference,
          comment,
        },
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      throw error;
    }
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <ControlTowerTopBar onOpenSettings={onOpenSettings} onOpenProfile={onOpenProfile} />

      {/* Main Content - Strict Screen Separation */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentScreen === 'control-tower' ? (
            <motion.div
              key="control-tower"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <ControlTowerScreen onNavigateToFlow={handleNavigateToFlow} />
            </motion.div>
          ) : (
            <motion.div
              key="flow-viewer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <FlowViewerScreen
                environment={flowEnvironment}
                initialFlowMode={flowMode}
                onBack={handleBackToControlTower}
                onRequestAction={handleRequestAction}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Status Bar */}
      <ControlTowerStatusBar />

      {/* Action Panel Modal - Opens ONLY from Flow Viewer */}
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
