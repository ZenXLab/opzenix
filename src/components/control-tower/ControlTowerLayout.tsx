import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import ControlTowerTopBar from './ControlTowerTopBar';
import ControlTowerNav from './ControlTowerNav';
import ControlTowerStatusBar from './ControlTowerStatusBar';

interface ControlTowerLayoutProps {
  children: ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenSettings?: () => void;
  onOpenApprovals?: () => void;
  onOpenAuditLog?: () => void;
}

const ControlTowerLayout = ({
  children,
  activeSection,
  onSectionChange,
  onOpenSettings,
  onOpenApprovals,
  onOpenAuditLog,
}: ControlTowerLayoutProps) => {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Top Bar: Org • Project • Environment • User */}
      <ControlTowerTopBar 
        onOpenSettings={onOpenSettings}
        onOpenApprovals={onOpenApprovals}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Nav - Control-First Navigation */}
        <ControlTowerNav 
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          onOpenAuditLog={onOpenAuditLog}
        />
        
        {/* Main Control Canvas */}
        <main className="flex-1 overflow-hidden">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
      
      {/* Bottom Status Bar - Live System Health */}
      <ControlTowerStatusBar />
    </div>
  );
};

export default ControlTowerLayout;
