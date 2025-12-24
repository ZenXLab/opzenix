import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DocsHome from "./pages/docs/DocsHome";
import GitHubAppSetupDocs from "./pages/docs/setup-guides/GitHubAppSetupDocs";
import BranchEnvironmentRulesDocs from "./pages/docs/governance/BranchEnvironmentRulesDocs";
import RBACModelDocs from "./pages/docs/governance/RBACModelDocs";
import SecurityPermissionModelDocs from "./pages/docs/security/SecurityPermissionModelDocs";

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
          
          {/* Documentation Routes */}
          <Route path="/docs" element={<DocsHome />} />
          <Route path="/docs/setup-guides/github-app" element={<GitHubAppSetupDocs />} />
          <Route path="/docs/governance/branch-environment-rules" element={<BranchEnvironmentRulesDocs />} />
          <Route path="/docs/governance/rbac-model" element={<RBACModelDocs />} />
          <Route path="/docs/security/permission-model" element={<SecurityPermissionModelDocs />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
