import { motion } from 'framer-motion';
import EnterpriseNavigation from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

const TermsOfService = () => (
  <div className="min-h-screen bg-background">
    <EnterpriseNavigation />
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Badge variant="outline" className="mb-4"><FileText className="w-3 h-3 mr-1" /> Legal</Badge>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2025</p>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>By accessing Opzenix services, you agree to these terms. If you disagree, do not use our services.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Service Description</h2>
              <p>Opzenix provides an enterprise CI/CD governance control plane including execution flows, checkpoints, approval gates, and observability features.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. User Responsibilities</h2>
              <p>Users must maintain account security, comply with applicable laws, and not misuse the platform for malicious purposes.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Intellectual Property</h2>
              <p>Opzenix and its content are owned by Cropxon Innovations Pvt Ltd. Your data remains yours.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Limitation of Liability</h2>
              <p>Opzenix liability is limited to fees paid. We are not liable for indirect, incidental, or consequential damages.</p>
            </section>
          </div>
          <p className="mt-12 text-sm text-muted-foreground">© 2025 Opzenix by Cropxon Innovations Pvt Ltd. All rights reserved.</p>
        </motion.div>
      </div>
    </section>
    <FooterSection />
  </div>
);

export default TermsOfService;
