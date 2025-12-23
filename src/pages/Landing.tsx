import { ReactFlowProvider } from '@xyflow/react';
import HeroSection from '@/components/landing/HeroSection';
import LivePipelineSection from '@/components/landing/LivePipelineSection';
import LogsConfigSection from '@/components/landing/LogsConfigSection';
import EnvironmentLanesSection from '@/components/landing/EnvironmentLanesSection';
import UnifiedOpsSection from '@/components/landing/UnifiedOpsSection';
import AIReasoningSection from '@/components/landing/AIReasoningSection';
import RecoveryStorySection from '@/components/landing/RecoveryStorySection';
import EnterpriseSection from '@/components/landing/EnterpriseSection';
import FooterSection from '@/components/landing/FooterSection';

const Landing = () => {
  return (
    <ReactFlowProvider>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <HeroSection />
        <LivePipelineSection />
        <LogsConfigSection />
        <EnvironmentLanesSection />
        <UnifiedOpsSection />
        <AIReasoningSection />
        <RecoveryStorySection />
        <EnterpriseSection />
        <FooterSection />
      </div>
    </ReactFlowProvider>
  );
};

export default Landing;
