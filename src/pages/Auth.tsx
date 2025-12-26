import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, GitBranch, RotateCcw, Sparkles, ArrowLeft, Clock, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import OpzenixLogo from '@/components/brand/OpzenixLogo';
import { WaitlistForm } from '@/components/waitlist/WaitlistForm';

const features = [
  { 
    icon: Zap, 
    title: 'Lightning Fast Deployments',
    description: 'Ship to production in seconds, not hours'
  },
  { 
    icon: Shield, 
    title: 'Enterprise Security',
    description: 'SOC2 Type II compliant with RBAC controls'
  },
  { 
    icon: GitBranch, 
    title: 'GitOps Native',
    description: 'Everything versioned, everything auditable'
  },
  { 
    icon: RotateCcw, 
    title: 'Instant Rollbacks',
    description: 'One-click recovery to any checkpoint'
  },
];

const testimonials = [
  {
    quote: "Opzenix cut our deployment time by 80% and gave us peace of mind with instant rollbacks.",
    author: "Sarah Chen",
    role: "VP Engineering, TechCorp"
  },
  {
    quote: "Finally, a CI/CD platform that understands enterprise governance without sacrificing speed.",
    author: "Marcus Johnson",
    role: "DevOps Lead, FinanceHub"
  },
  {
    quote: "The visual pipeline builder changed how our team thinks about deployments.",
    author: "Elena Rodriguez",
    role: "Platform Engineer, ScaleUp"
  }
];

const Auth = () => {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding with animations */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-primary/10"
              style={{
                width: 100 + i * 50,
                height: 100 + i * 50,
                left: `${10 + i * 15}%`,
                top: `${20 + i * 10}%`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <OpzenixLogo size="lg" animate={false} />
        </div>
        
        <div className="space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold mb-4">
              Enterprise CI/CD<br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Control Tower
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md">
              Visual pipeline management, real-time deployments, and enterprise governance - all in one platform.
            </p>
          </motion.div>
          
          {/* Animated Features */}
          <div className="grid gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ x: 10 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors cursor-default"
              >
                <motion.div
                  className="p-2 rounded-lg bg-primary/10"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <feature.icon className="h-5 w-5 text-primary" />
                </motion.div>
                <div>
                  <h4 className="font-medium text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Testimonials Carousel */}
          <div className="relative h-32">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 p-4 rounded-xl bg-card/50 border"
              >
                <p className="text-sm italic text-muted-foreground mb-3">
                  "{testimonials[currentTestimonial].quote}"
                </p>
                <div>
                  <p className="text-sm font-medium">{testimonials[currentTestimonial].author}</p>
                  <p className="text-xs text-muted-foreground">{testimonials[currentTestimonial].role}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Testimonial indicators */}
            <div className="absolute -bottom-6 left-0 flex gap-2">
              {testimonials.map((_, i) => (
                <motion.button
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentTestimonial ? 'bg-primary' : 'bg-muted'
                  }`}
                  onClick={() => setCurrentTestimonial(i)}
                  whileHover={{ scale: 1.5 }}
                />
              ))}
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground relative z-10">
          © {new Date().getFullYear()} Opzenix by Cropxon Innovations Pvt Ltd. Enterprise-ready DevOps platform.
        </p>
      </div>
      
      {/* Right side - Waitlist focused */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <OpzenixLogo size="lg" animate={false} />
          </div>
          
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Coming Soon</CardTitle>
                <CardDescription className="mt-2">
                  We're putting the finishing touches on Opzenix. Join the waitlist to be among the first to experience enterprise-grade CI/CD.
                </CardDescription>
              </motion.div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Waitlist CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button 
                  size="lg" 
                  className="w-full gap-2"
                  onClick={() => setWaitlistOpen(true)}
                >
                  <Sparkles className="h-5 w-5" />
                  Join the Waitlist
                </Button>
              </motion.div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Disabled Sign In */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full gap-2 opacity-50 cursor-not-allowed"
                  disabled
                >
                  <Lock className="h-4 w-4" />
                  Sign In (Coming Soon)
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  User registration and login will be available once we launch. Join the waitlist to get early access.
                </p>
              </motion.div>

              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-muted/50 rounded-lg p-4 space-y-2"
              >
                <p className="text-sm font-medium">Waitlist benefits:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Early access before public launch
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Exclusive founding member pricing
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Priority onboarding support
                  </li>
                </ul>
              </motion.div>
            </CardContent>
          </Card>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link to="/" className="hover:text-primary transition-colors flex items-center justify-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Waitlist Form Modal */}
      <WaitlistForm open={waitlistOpen} onOpenChange={setWaitlistOpen} />
    </div>
  );
};

export default Auth;
