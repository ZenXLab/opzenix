import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageTransition } from "@/components/layout/PageTransition";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Changelog from "./pages/Changelog";
import Status from "./pages/Status";

// Docs - Getting Started
import DocsHome from "./pages/docs/DocsHome";
import IntroductionDocs from "./pages/docs/getting-started/IntroductionDocs";
import CoreConceptsDocs from "./pages/docs/getting-started/CoreConceptsDocs";
import ControlPlaneModelDocs from "./pages/docs/getting-started/ControlPlaneModelDocs";
import QuickstartDocs from "./pages/docs/getting-started/QuickstartDocs";

// Docs - Setup Guides
import GitHubAppSetupDocs from "./pages/docs/setup-guides/GitHubAppSetupDocs";
import KubernetesDocs from "./pages/docs/setup-guides/KubernetesDocs";
import ContainerRegistryDocs from "./pages/docs/setup-guides/ContainerRegistryDocs";
import VaultDocs from "./pages/docs/setup-guides/VaultDocs";
import OpenTelemetryDocs from "./pages/docs/setup-guides/OpenTelemetryDocs";

// Docs - Governance
import BranchEnvironmentRulesDocs from "./pages/docs/governance/BranchEnvironmentRulesDocs";
import ApprovalWorkflowsDocs from "./pages/docs/governance/ApprovalWorkflowsDocs";
import EnvironmentLocksDocs from "./pages/docs/governance/EnvironmentLocksDocs";
import RBACModelDocs from "./pages/docs/governance/RBACModelDocs";

// Docs - Operations
import ExecutionsFlowsDocs from "./pages/docs/operations/ExecutionsFlowsDocs";
import CheckpointsRewindDocs from "./pages/docs/operations/CheckpointsRewindDocs";
import RollbacksDocs from "./pages/docs/operations/RollbacksDocs";
import AuditLogsDocs from "./pages/docs/operations/AuditLogsDocs";

// Docs - Security
import SecurityPermissionModelDocs from "./pages/docs/security/SecurityPermissionModelDocs";
import SecretsHandlingDocs from "./pages/docs/security/SecretsHandlingDocs";
import ComplianceMappingDocs from "./pages/docs/security/ComplianceMappingDocs";
import APIReferenceDocs from "./pages/docs/APIReferenceDocs";

// Product
import Features from "./pages/product/Features";
import Pricing from "./pages/product/Pricing";
import Enterprise from "./pages/product/Enterprise";
import Integrations from "./pages/product/Integrations";
import Comparison from "./pages/product/Comparison";

// Solutions
import DevOps from "./pages/solutions/DevOps";
import Platform from "./pages/solutions/Platform";
import Security from "./pages/solutions/Security";

// Company
import About from "./pages/company/About";
import Contact from "./pages/company/Contact";
import Careers from "./pages/company/Careers";
import CaseStudies from "./pages/company/CaseStudies";

// Legal
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import CookiePolicy from "./pages/legal/CookiePolicy";
import RefundPolicy from "./pages/legal/RefundPolicy";

const queryClient = new QueryClient();

// Animated Routes component for page transitions
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/app" element={<ProtectedRoute><PageTransition><Index /></PageTransition></ProtectedRoute>} />
        <Route path="/changelog" element={<PageTransition><Changelog /></PageTransition>} />
        <Route path="/status" element={<PageTransition><Status /></PageTransition>} />
        
        {/* Product Routes */}
        <Route path="/product/features" element={<PageTransition><Features /></PageTransition>} />
        <Route path="/product/pricing" element={<PageTransition><Pricing /></PageTransition>} />
        <Route path="/product/enterprise" element={<PageTransition><Enterprise /></PageTransition>} />
        <Route path="/product/integrations" element={<PageTransition><Integrations /></PageTransition>} />
        <Route path="/product/comparison" element={<PageTransition><Comparison /></PageTransition>} />
        <Route path="/product/changelog" element={<PageTransition><Changelog /></PageTransition>} />
        
        {/* Solutions Routes */}
        <Route path="/solutions/devops" element={<PageTransition><DevOps /></PageTransition>} />
        <Route path="/solutions/platform" element={<PageTransition><Platform /></PageTransition>} />
        <Route path="/solutions/security" element={<PageTransition><Security /></PageTransition>} />
        
        {/* Company Routes */}
        <Route path="/company/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/company/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/company/careers" element={<PageTransition><Careers /></PageTransition>} />
        <Route path="/company/case-studies" element={<PageTransition><CaseStudies /></PageTransition>} />
        
        {/* Legal Routes */}
        <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsOfService /></PageTransition>} />
        <Route path="/cookies" element={<PageTransition><CookiePolicy /></PageTransition>} />
        <Route path="/refund" element={<PageTransition><RefundPolicy /></PageTransition>} />
        
        {/* Documentation Routes */}
        <Route path="/docs" element={<PageTransition><DocsHome /></PageTransition>} />
        
        {/* Getting Started */}
        <Route path="/docs/getting-started/introduction" element={<PageTransition><IntroductionDocs /></PageTransition>} />
        <Route path="/docs/getting-started/core-concepts" element={<PageTransition><CoreConceptsDocs /></PageTransition>} />
        <Route path="/docs/getting-started/control-plane-model" element={<PageTransition><ControlPlaneModelDocs /></PageTransition>} />
        <Route path="/docs/getting-started/quickstart" element={<PageTransition><QuickstartDocs /></PageTransition>} />
        
        {/* Setup Guides */}
        <Route path="/docs/setup-guides/github-app" element={<PageTransition><GitHubAppSetupDocs /></PageTransition>} />
        <Route path="/docs/setup-guides/kubernetes" element={<PageTransition><KubernetesDocs /></PageTransition>} />
        <Route path="/docs/setup-guides/container-registry" element={<PageTransition><ContainerRegistryDocs /></PageTransition>} />
        <Route path="/docs/setup-guides/vault" element={<PageTransition><VaultDocs /></PageTransition>} />
        <Route path="/docs/setup-guides/opentelemetry" element={<PageTransition><OpenTelemetryDocs /></PageTransition>} />
        
        {/* Governance */}
        <Route path="/docs/governance/branch-environment-rules" element={<PageTransition><BranchEnvironmentRulesDocs /></PageTransition>} />
        <Route path="/docs/governance/approval-workflows" element={<PageTransition><ApprovalWorkflowsDocs /></PageTransition>} />
        <Route path="/docs/governance/environment-locks" element={<PageTransition><EnvironmentLocksDocs /></PageTransition>} />
        <Route path="/docs/governance/rbac-model" element={<PageTransition><RBACModelDocs /></PageTransition>} />
        
        {/* Operations */}
        <Route path="/docs/operations/executions-flows" element={<PageTransition><ExecutionsFlowsDocs /></PageTransition>} />
        <Route path="/docs/operations/checkpoints-rewind" element={<PageTransition><CheckpointsRewindDocs /></PageTransition>} />
        <Route path="/docs/operations/rollbacks" element={<PageTransition><RollbacksDocs /></PageTransition>} />
        <Route path="/docs/operations/audit-logs" element={<PageTransition><AuditLogsDocs /></PageTransition>} />
        
        {/* Security */}
        <Route path="/docs/security/permission-model" element={<PageTransition><SecurityPermissionModelDocs /></PageTransition>} />
        <Route path="/docs/security/secrets-handling" element={<PageTransition><SecretsHandlingDocs /></PageTransition>} />
        <Route path="/docs/security/compliance-mapping" element={<PageTransition><ComplianceMappingDocs /></PageTransition>} />
        
        {/* API Reference */}
        <Route path="/docs/api-reference" element={<PageTransition><APIReferenceDocs /></PageTransition>} />
        
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
