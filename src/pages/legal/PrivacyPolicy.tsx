import { motion } from 'framer-motion';
import EnterpriseNavigation from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <EnterpriseNavigation />
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Badge variant="outline" className="mb-4"><Shield className="w-3 h-3 mr-1" /> Legal</Badge>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2025</p>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
              <p>Opzenix by Cropxon Innovations Pvt Ltd collects information you provide directly, including account details, usage data, and pipeline execution metadata to deliver and improve our services.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
              <p>We use collected data to provide the Opzenix Control Plane services, ensure security, improve functionality, and comply with legal obligations.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Data Security</h2>
              <p>We implement industry-standard security measures including encryption at rest and in transit, SOC2 Type II certified controls, and regular security audits.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Your Rights</h2>
              <p>You have rights to access, correct, delete your data, and opt-out of certain processing. Contact privacy@opzenix.com for requests.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Contact Us</h2>
              <p>For privacy inquiries: privacy@opzenix.com<br />Cropxon Innovations Pvt Ltd, Technology Park, Noida, India</p>
            </section>
          </div>
          <p className="mt-12 text-sm text-muted-foreground">© 2025 Opzenix by Cropxon Innovations Pvt Ltd. All rights reserved.</p>
        </motion.div>
      </div>
    </section>
    <FooterSection />
  </div>
);

export default PrivacyPolicy;
