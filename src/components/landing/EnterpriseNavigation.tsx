import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Rocket, Shield, GitBranch, Eye, History,
  Building2, Cpu, Lock, Puzzle, BookOpen, Github, Cloud,
  Terminal, Users, Briefcase, Mail, Menu, X, ArrowRight,
  LayoutDashboard, CheckCircle2, RotateCcw, Globe, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href?: string;
  items?: {
    label: string;
    description: string;
    href: string;
    icon: React.ReactNode;
  }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Product',
    items: [
      {
        label: 'Control Tower',
        description: 'Unified command center for all delivery operations',
        href: '/features/control-tower',
        icon: <LayoutDashboard className="w-5 h-5" />
      },
      {
        label: 'Execution Governance',
        description: 'RBAC-enforced approval gates and environment locks',
        href: '/features/governance',
        icon: <Shield className="w-5 h-5" />
      },
      {
        label: 'Checkpoints & Rewind',
        description: 'State capture and instant rollback capabilities',
        href: '/features/checkpoints',
        icon: <RotateCcw className="w-5 h-5" />
      },
      {
        label: 'Environments & Approvals',
        description: 'Branch-to-environment mapping with approval flows',
        href: '/features/environments',
        icon: <Globe className="w-5 h-5" />
      },
      {
        label: 'Observability Correlation',
        description: 'OpenTelemetry-native traces, logs, and metrics',
        href: '/features/observability',
        icon: <Radio className="w-5 h-5" />
      }
    ]
  },
  {
    label: 'Solutions',
    items: [
      {
        label: 'Enterprise CI/CD',
        description: 'Governance layer for complex delivery pipelines',
        href: '/solutions/enterprise-cicd',
        icon: <Building2 className="w-5 h-5" />
      },
      {
        label: 'Kubernetes Delivery',
        description: 'AKS/EKS/GKE deployment orchestration',
        href: '/solutions/kubernetes',
        icon: <Cloud className="w-5 h-5" />
      },
      {
        label: 'DevSecOps Governance',
        description: 'Security-first delivery with audit trails',
        href: '/solutions/devsecops',
        icon: <Lock className="w-5 h-5" />
      },
      {
        label: 'ML/AI Delivery Control',
        description: 'MLOps and LLMOps pipeline governance',
        href: '/solutions/mlops',
        icon: <Cpu className="w-5 h-5" />
      }
    ]
  },
  {
    label: 'Platform',
    items: [
      {
        label: 'How It Works',
        description: 'Understand the Opzenix control plane model',
        href: '/platform/how-it-works',
        icon: <Rocket className="w-5 h-5" />
      },
      {
        label: 'Architecture',
        description: 'Technical deep-dive into our infrastructure',
        href: '/platform/architecture',
        icon: <Puzzle className="w-5 h-5" />
      },
      {
        label: 'Security & Compliance',
        description: 'SOC2, ISO 27001, and enterprise security',
        href: '/platform/security',
        icon: <Shield className="w-5 h-5" />
      },
      {
        label: 'Integrations',
        description: 'GitHub, Azure, Vault, OTel, and more',
        href: '/platform/integrations',
        icon: <Puzzle className="w-5 h-5" />
      }
    ]
  },
  {
    label: 'Developers',
    items: [
      {
        label: 'Documentation',
        description: 'Comprehensive guides and references',
        href: '/docs',
        icon: <BookOpen className="w-5 h-5" />
      },
      {
        label: 'GitHub App Setup',
        description: 'Connect your repositories in minutes',
        href: '/docs/github-setup',
        icon: <Github className="w-5 h-5" />
      },
      {
        label: 'AKS/Kubernetes Setup',
        description: 'Deploy to any Kubernetes cluster',
        href: '/docs/kubernetes-setup',
        icon: <Cloud className="w-5 h-5" />
      },
      {
        label: 'API Reference',
        description: 'REST and GraphQL API documentation',
        href: '/docs/api',
        icon: <Terminal className="w-5 h-5" />
      }
    ]
  },
  {
    label: 'Company',
    items: [
      {
        label: 'About',
        description: 'Our mission and story',
        href: '/about',
        icon: <Building2 className="w-5 h-5" />
      },
      {
        label: 'Careers',
        description: 'Join the Opzenix team',
        href: '/careers',
        icon: <Users className="w-5 h-5" />
      },
      {
        label: 'Contact',
        description: 'Get in touch with our team',
        href: '/contact',
        icon: <Mail className="w-5 h-5" />
      }
    ]
  }
];

export function EnterpriseNavigation() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Opzenix</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setActiveMenu(item.label)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  className={cn(
                    'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    activeMenu === item.label
                      ? 'text-foreground bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {item.label}
                  {item.items && <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {activeMenu === item.label && item.items && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 pt-2 w-80"
                    >
                      <div className="bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
                        <div className="p-2">
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.label}
                              to={subItem.href}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                                {subItem.icon}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{subItem.label}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {subItem.description}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button size="sm" className="gap-2" onClick={() => navigate('/auth')}>
              Request Access
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border bg-background"
          >
            <div className="px-4 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
              {NAV_ITEMS.map((item) => (
                <div key={item.label} className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  {item.items && (
                    <div className="space-y-1 pl-2">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.label}
                          to={subItem.href}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 text-sm text-muted-foreground"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="text-primary">{subItem.icon}</span>
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-4 border-t space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}
                >
                  Sign In
                </Button>
                <Button 
                  className="w-full" 
                  onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}
                >
                  Request Access
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default EnterpriseNavigation;
