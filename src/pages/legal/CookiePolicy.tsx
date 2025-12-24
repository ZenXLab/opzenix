import { motion } from 'framer-motion';
import EnterpriseNavigation from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';
import { Badge } from '@/components/ui/badge';
import { Cookie } from 'lucide-react';

const CookiePolicy = () => (
  <div className="min-h-screen bg-background">
    <EnterpriseNavigation />
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Badge variant="outline" className="mb-4"><Cookie className="w-3 h-3 mr-1" /> Legal</Badge>
          <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2025</p>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. What Are Cookies</h2>
              <p>Cookies are small text files stored on your device to enhance your experience and analyze usage patterns.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Cookies</h2>
              <p>We use essential cookies for authentication, preference cookies to remember settings, and analytics cookies to improve our services.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Managing Cookies</h2>
              <p>You can control cookies through your browser settings. Disabling certain cookies may affect functionality.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Third-Party Cookies</h2>
              <p>We may use third-party analytics services. These are governed by their respective privacy policies.</p>
            </section>
          </div>
          <p className="mt-12 text-sm text-muted-foreground">© 2025 Opzenix by Cropxon Innovations Pvt Ltd. All rights reserved.</p>
        </motion.div>
      </div>
    </section>
    <FooterSection />
  </div>
);

export default CookiePolicy;
