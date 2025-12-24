import { motion } from 'framer-motion';
import EnterpriseNavigation from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw } from 'lucide-react';

const RefundPolicy = () => (
  <div className="min-h-screen bg-background">
    <EnterpriseNavigation />
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Badge variant="outline" className="mb-4"><RefreshCcw className="w-3 h-3 mr-1" /> Legal</Badge>
          <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2025</p>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Free Trial</h2>
              <p>Opzenix offers a free trial period. No payment is required during the trial, and you can cancel anytime.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Subscription Refunds</h2>
              <p>Monthly subscriptions can be cancelled anytime. Refunds are available within 14 days of payment if you're unsatisfied.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Enterprise Contracts</h2>
              <p>Enterprise agreements have custom terms. Please refer to your specific contract for refund conditions.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. How to Request a Refund</h2>
              <p>Contact billing@opzenix.com with your account details and reason for the refund request. We process requests within 5-7 business days.</p>
            </section>
          </div>
          <p className="mt-12 text-sm text-muted-foreground">© 2025 Opzenix by Cropxon Innovations Pvt Ltd. All rights reserved.</p>
        </motion.div>
      </div>
    </section>
    <FooterSection />
  </div>
);

export default RefundPolicy;
