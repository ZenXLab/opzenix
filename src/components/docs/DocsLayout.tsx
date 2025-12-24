import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Book, ChevronRight, Search, Menu, X, ExternalLink,
  Rocket, Settings, Shield, GitBranch, Terminal, Play,
  CheckCircle2, AlertTriangle, Copy, Github, Cloud,
  Lock, Users, Eye, History, Webhook, FileCode, Home, LogIn, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import OpzenixLogo from '@/components/brand/OpzenixLogo';

// Documentation structure
const DOCS_STRUCTURE = {
  'getting-started': {
    title: 'Getting Started',
    icon: Rocket,
    items: [
      { slug: 'introduction', title: 'What is Opzenix?' },
      { slug: 'core-concepts', title: 'Core Concepts' },
      { slug: 'control-plane-model', title: 'Control Plane Model' },
      { slug: 'quickstart', title: 'Quickstart Guide' },
    ]
  },
  'setup-guides': {
    title: 'Setup Guides',
    icon: Settings,
    items: [
      { slug: 'github-app', title: 'Install GitHub App' },
      { slug: 'kubernetes', title: 'Connect Kubernetes (AKS)' },
      { slug: 'container-registry', title: 'Configure Container Registry' },
      { slug: 'vault', title: 'Configure Vault' },
      { slug: 'opentelemetry', title: 'Enable OpenTelemetry' },
    ]
  },
  'governance': {
    title: 'Governance',
    icon: Shield,
    items: [
      { slug: 'branch-environment-rules', title: 'Branch → Environment Rules' },
      { slug: 'approval-workflows', title: 'Approval Workflows' },
      { slug: 'environment-locks', title: 'Environment Locks' },
      { slug: 'rbac-model', title: 'RBAC Model' },
    ]
  },
  'operations': {
    title: 'Operations',
    icon: Play,
    items: [
      { slug: 'executions-flows', title: 'Executions & Flows' },
      { slug: 'checkpoints-rewind', title: 'Checkpoints & Rewind' },
      { slug: 'rollbacks', title: 'Rollbacks' },
      { slug: 'audit-logs', title: 'Audit Logs' },
    ]
  },
  'security': {
    title: 'Security',
    icon: Lock,
    items: [
      { slug: 'permission-model', title: 'Permission Model' },
      { slug: 'secrets-handling', title: 'Secrets Handling' },
      { slug: 'compliance-mapping', title: 'Compliance Mapping' },
    ]
  },
};

interface DocLayoutProps {
  children: React.ReactNode;
}

export function DocsLayout({ children }: DocLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check auth state
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setLoading(false);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            
            <Link to="/docs" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
                <Book className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Opzenix Docs</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </div>

            {!loading && (
              <>
                {isAuthenticated ? (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/app">
                        <Home className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/">
                        <Home className="w-4 h-4 mr-2" />
                        Home
                      </Link>
                    </Button>
                    <Button variant="default" size="sm" asChild>
                      <Link to="/auth">
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Link>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Sidebar */}
        <aside className={cn(
          'fixed lg:sticky top-14 left-0 z-40 w-64 h-[calc(100vh-3.5rem)] border-r bg-background transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <ScrollArea className="h-full py-4">
            <nav className="px-3 space-y-6">
              {Object.entries(DOCS_STRUCTURE).map(([section, data]) => {
                const Icon = data.icon;
                return (
                  <div key={section}>
                    <div className="flex items-center gap-2 px-3 mb-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">{data.title}</span>
                    </div>
                    <div className="space-y-1">
                      {data.items.map((item) => (
                        <Link
                          key={item.slug}
                          to={`/docs/${section}/${item.slug}`}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                          onClick={() => setSidebarOpen(false)}
                        >
                          <ChevronRight className="w-3 h-3" />
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <OpzenixLogo size="sm" />
            <p className="text-sm text-muted-foreground text-center">
              © 2025 Opzenix by Cropxon Innovations Pvt Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Code block component
interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

function CodeBlock({ code, language = 'bash', title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      bash: 'bg-emerald-500/20 text-emerald-400',
      yaml: 'bg-amber-500/20 text-amber-400',
      typescript: 'bg-blue-500/20 text-blue-400',
      javascript: 'bg-yellow-500/20 text-yellow-400',
      json: 'bg-orange-500/20 text-orange-400',
      sql: 'bg-purple-500/20 text-purple-400',
      hcl: 'bg-violet-500/20 text-violet-400',
    };
    return colors[lang] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border">
      {title && (
        <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <Badge variant="outline" className={cn('text-[10px]', getLanguageColor(language))}>
            {language.toUpperCase()}
          </Badge>
        </div>
      )}
      <div className="relative">
        <pre className="p-4 overflow-x-auto bg-muted/30">
          <code className="text-sm font-mono">{code}</code>
        </pre>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <CheckCircle2 className="w-4 h-4 text-sec-safe" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Callout component
interface CalloutProps {
  type: 'info' | 'warning' | 'success' | 'danger';
  title?: string;
  children: React.ReactNode;
}

function Callout({ type, title, children }: CalloutProps) {
  const styles = {
    info: 'border-primary/30 bg-primary/5',
    warning: 'border-sec-warning/30 bg-sec-warning/5',
    success: 'border-sec-safe/30 bg-sec-safe/5',
    danger: 'border-sec-critical/30 bg-sec-critical/5',
  };

  const icons = {
    info: <Book className="w-5 h-5 text-primary" />,
    warning: <AlertTriangle className="w-5 h-5 text-sec-warning" />,
    success: <CheckCircle2 className="w-5 h-5 text-sec-safe" />,
    danger: <AlertTriangle className="w-5 h-5 text-sec-critical" />,
  };

  return (
    <div className={cn('my-4 p-4 rounded-lg border', styles[type])}>
      <div className="flex items-start gap-3">
        {icons[type]}
        <div>
          {title && <p className="font-medium mb-1">{title}</p>}
          <div className="text-sm text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Step component
interface StepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

function Step({ number, title, children }: StepProps) {
  return (
    <div className="flex gap-4 my-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div className="flex-1 pt-0.5">
        <h4 className="font-semibold mb-2">{title}</h4>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export { CodeBlock, Callout, Step };
export default DocsLayout;
