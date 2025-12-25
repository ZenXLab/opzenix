import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Youtube, Shield, Globe, Mail } from 'lucide-react';
import OpzenixLogo from '@/components/brand/OpzenixLogo';

const FooterSection = () => {
  const footerLinks = {
    product: [
      { name: 'Features', href: '/product/features' },
      { name: 'Pricing', href: '/product/pricing' },
      { name: 'Enterprise', href: '/product/enterprise' },
      { name: 'Changelog', href: '/product/changelog' },
    ],
    solutions: [
      { name: 'DevOps Teams', href: '/solutions/devops' },
      { name: 'Platform Engineering', href: '/solutions/platform' },
      { name: 'Enterprise Security', href: '/solutions/security' },
      { name: 'Financial Services', href: '/solutions/fintech' },
    ],
    developers: [
      { name: 'Documentation', href: '/docs' },
      { name: 'API Reference', href: '/developers/api' },
      { name: 'GitHub', href: 'https://github.com/opzenix' },
      { name: 'Status', href: '/status' },
    ],
    company: [
      { name: 'About', href: '/company/about' },
      { name: 'Blog', href: '/company/blog' },
      { name: 'Careers', href: '/company/careers' },
      { name: 'Contact', href: '/company/contact' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Refund Policy', href: '/refund' },
    ],
  };

  const socialLinks = [
    { icon: Github, href: 'https://github.com/opzenix', label: 'GitHub' },
    { icon: Twitter, href: 'https://twitter.com/opzenix', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com/company/opzenix', label: 'LinkedIn' },
    { icon: Youtube, href: 'https://youtube.com/@opzenix', label: 'YouTube' },
  ];

  return (
    <footer className="border-t border-border bg-card/50">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <OpzenixLogo size="lg" className="mb-4" />
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Enterprise Execution Control Plane. Govern your CI/CD pipelines with confidence.
            </p>
            
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Solutions</h4>
            <ul className="space-y-3">
              {footerLinks.solutions.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Developers</h4>
            <ul className="space-y-3">
              {footerLinks.developers.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('http') ? (
                    <a 
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link 
                      to={link.href} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 py-8 border-y border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5 text-sec-safe" />
            <span className="text-sm">SOC2 Type II</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm">ISO 27001</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5 text-chart-1" />
            <span className="text-sm">GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="w-5 h-5 text-chart-2" />
            <span className="text-sm">Global CDN</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Opzenix by Cropxon Innovations Pvt Ltd. All rights reserved.</p>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            {footerLinks.legal.map((link) => (
              <Link 
                key={link.name}
                to={link.href} 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
