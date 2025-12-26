import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, User, Building2, Briefcase, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import OpzenixLogo from '@/components/brand/OpzenixLogo';

const waitlistSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email'),
  company: z.string().optional(),
  role: z.string().optional(),
});

interface WaitlistFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WaitlistForm({ open, onOpenChange }: WaitlistFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    role: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = waitlistSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke('waitlist-signup', {
        body: formData,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('You\'re on the list! Check your email for confirmation.');
    } catch (error: any) {
      console.error('Waitlist signup error:', error);
      toast.error(error.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    if (isSuccess) {
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ fullName: '', email: '', company: '', role: '' });
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="p-4 rounded-full bg-primary/10 mb-4"
            >
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">You're on the list!</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              We've sent a confirmation email to <span className="font-medium text-foreground">{formData.email}</span>. 
              We'll notify you when Opzenix is ready for you.
            </p>
            <Button className="mt-6" onClick={handleClose}>
              Got it!
            </Button>
          </motion.div>
        ) : (
          <>
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <OpzenixLogo size="md" animate={false} />
              </div>
              <DialogTitle className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Join the Waitlist
              </DialogTitle>
              <DialogDescription>
                Be among the first to experience enterprise-grade CI/CD with Opzenix.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    placeholder="Your company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Your Role</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="role"
                    placeholder="DevOps Engineer, Platform Lead, etc."
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Join Waitlist
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By joining, you agree to our{' '}
                <a href="/legal/terms" className="underline hover:text-foreground">Terms</a>
                {' '}and{' '}
                <a href="/legal/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default WaitlistForm;
