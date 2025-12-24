import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ControlTowerTopBar from './ControlTowerTopBar';
import ControlTowerNav from './ControlTowerNav';
import ControlTowerStatusBar from './ControlTowerStatusBar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

interface ControlTowerLayoutProps {
  children: ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenSettings?: () => void;
  onOpenApprovals?: () => void;
  onOpenAuditLog?: () => void;
  onOpenProfile?: () => void;
}

const ControlTowerLayout = ({
  children,
  activeSection,
  onSectionChange,
  onOpenSettings,
  onOpenApprovals,
  onOpenAuditLog,
  onOpenProfile,
}: ControlTowerLayoutProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    setMobileNavOpen(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Top Bar: Org • Project • Environment • User */}
      <ControlTowerTopBar 
        onOpenSettings={onOpenSettings}
        onOpenApprovals={onOpenApprovals}
        onOpenProfile={onOpenProfile}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Nav - Control-First Navigation */}
        <div className="hidden md:block">
          <ControlTowerNav 
            activeSection={activeSection}
            onSectionChange={onSectionChange}
            onOpenAuditLog={onOpenAuditLog}
          />
        </div>

        {/* Mobile Nav Button */}
        <div className="md:hidden fixed bottom-16 left-4 z-40">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button size="icon" className="rounded-full shadow-lg h-12 w-12">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
              <ControlTowerNav 
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
                onOpenAuditLog={onOpenAuditLog}
              />
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Main Control Canvas */}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
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
          </AnimatePresence>
        </main>
      </div>
      
      {/* Bottom Status Bar - Live System Health */}
      <ControlTowerStatusBar />
    </div>
  );
};

export default ControlTowerLayout;
