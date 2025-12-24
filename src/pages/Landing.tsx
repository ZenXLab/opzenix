import { ReactFlowProvider } from '@xyflow/react';
import HeroSection from '@/components/landing/HeroSection';
import TrustStripSection from '@/components/landing/TrustStripSection';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSection from '@/components/landing/SolutionSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import ComparisonSection from '@/components/landing/ComparisonSection';
import SecuritySection from '@/components/landing/SecuritySection';
import AudienceSection from '@/components/landing/AudienceSection';
import UseCasesSection from '@/components/landing/UseCasesSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import FooterSection from '@/components/landing/FooterSection';

const Landing = () => {
  return (
    <ReactFlowProvider>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <HeroSection />
        <TrustStripSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <ComparisonSection />
        <SecuritySection />
        <AudienceSection />
        <UseCasesSection />
        <FinalCTASection />
        <FooterSection />
      </div>
    </ReactFlowProvider>
  );
};

export default Landing;
