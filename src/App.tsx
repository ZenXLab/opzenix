import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Changelog from "./pages/Changelog";
import Status from "./pages/Status";

// Docs
import DocsHome from "./pages/docs/DocsHome";
import GitHubAppSetupDocs from "./pages/docs/setup-guides/GitHubAppSetupDocs";
import BranchEnvironmentRulesDocs from "./pages/docs/governance/BranchEnvironmentRulesDocs";
import RBACModelDocs from "./pages/docs/governance/RBACModelDocs";
import SecurityPermissionModelDocs from "./pages/docs/security/SecurityPermissionModelDocs";
import QuickstartDocs from "./pages/docs/getting-started/QuickstartDocs";
import CoreConceptsDocs from "./pages/docs/getting-started/CoreConceptsDocs";
import IntroductionDocs from "./pages/docs/getting-started/IntroductionDocs";
import ExecutionsFlowsDocs from "./pages/docs/operations/ExecutionsFlowsDocs";
import CheckpointsRewindDocs from "./pages/docs/operations/CheckpointsRewindDocs";
import KubernetesDocs from "./pages/docs/setup-guides/KubernetesDocs";
import VaultDocs from "./pages/docs/setup-guides/VaultDocs";
import OpenTelemetryDocs from "./pages/docs/setup-guides/OpenTelemetryDocs";

// Product
import Features from "./pages/product/Features";
import Pricing from "./pages/product/Pricing";
import Enterprise from "./pages/product/Enterprise";

// Solutions
import DevOps from "./pages/solutions/DevOps";
import Platform from "./pages/solutions/Platform";
import Security from "./pages/solutions/Security";

// Company
import About from "./pages/company/About";
import Contact from "./pages/company/Contact";
import Careers from "./pages/company/Careers";

// Legal
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import CookiePolicy from "./pages/legal/CookiePolicy";
import RefundPolicy from "./pages/legal/RefundPolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/app" element={<Index />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/status" element={<Status />} />
          
          {/* Product Routes */}
          <Route path="/product/features" element={<Features />} />
          <Route path="/product/pricing" element={<Pricing />} />
          <Route path="/product/enterprise" element={<Enterprise />} />
          
          {/* Solutions Routes */}
          <Route path="/solutions/devops" element={<DevOps />} />
          <Route path="/solutions/platform" element={<Platform />} />
          <Route path="/solutions/security" element={<Security />} />
          
          {/* Company Routes */}
          <Route path="/company/about" element={<About />} />
          <Route path="/company/contact" element={<Contact />} />
          <Route path="/company/careers" element={<Careers />} />
          
          {/* Legal Routes */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/refund" element={<RefundPolicy />} />
          
          {/* Documentation Routes */}
          <Route path="/docs" element={<DocsHome />} />
          <Route path="/docs/getting-started/introduction" element={<IntroductionDocs />} />
          <Route path="/docs/getting-started/quickstart" element={<QuickstartDocs />} />
          <Route path="/docs/getting-started/core-concepts" element={<CoreConceptsDocs />} />
          <Route path="/docs/setup-guides/github-app" element={<GitHubAppSetupDocs />} />
          <Route path="/docs/setup-guides/kubernetes" element={<KubernetesDocs />} />
          <Route path="/docs/setup-guides/vault" element={<VaultDocs />} />
          <Route path="/docs/setup-guides/opentelemetry" element={<OpenTelemetryDocs />} />
          <Route path="/docs/governance/branch-environment-rules" element={<BranchEnvironmentRulesDocs />} />
          <Route path="/docs/governance/rbac-model" element={<RBACModelDocs />} />
          <Route path="/docs/operations/executions-flows" element={<ExecutionsFlowsDocs />} />
          <Route path="/docs/operations/checkpoints-rewind" element={<CheckpointsRewindDocs />} />
          <Route path="/docs/security/permission-model" element={<SecurityPermissionModelDocs />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
