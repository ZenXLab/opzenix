import { ReactFlowProvider } from '@xyflow/react';
import EnterpriseNavigation from '@/components/landing/EnterpriseNavigation';
import HeroSection from '@/components/landing/HeroSection';
import TrustStripSection from '@/components/landing/TrustStripSection';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSection from '@/components/landing/SolutionSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import EnterpriseCapabilitiesSection from '@/components/landing/EnterpriseCapabilitiesSection';
import LiveFlowPreviewSection from '@/components/landing/LiveFlowPreviewSection';
import ComparisonSection from '@/components/landing/ComparisonSection';
import SecuritySection from '@/components/landing/SecuritySection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import AudienceSection from '@/components/landing/AudienceSection';
import UseCasesSection from '@/components/landing/UseCasesSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import FooterSection from '@/components/landing/FooterSection';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { OpzenixChatbot } from '@/components/chatbot/OpzenixChatbot';

const Landing = () => {
  return (
    <ReactFlowProvider>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <EnterpriseNavigation />
        <HeroSection />
        <TrustStripSection />
        <ProblemSection />
        <SolutionSection />
        <EnterpriseCapabilitiesSection />
        <LiveFlowPreviewSection />
        <HowItWorksSection />
        <ComparisonSection />
        <SecuritySection />
        <TestimonialsSection />
        <AudienceSection />
        <UseCasesSection />
        <FinalCTASection />
        <FooterSection />
        <ScrollToTop />
        <OpzenixChatbot />
      </div>
    </ReactFlowProvider>
  );
};

export default Landing;
