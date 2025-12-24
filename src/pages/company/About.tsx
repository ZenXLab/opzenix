import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Globe, Users, Rocket, Heart, ArrowRight, Building2,
  MapPin, Calendar, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import EnterpriseNavigation from '@/components/landing/EnterpriseNavigation';
import FooterSection from '@/components/landing/FooterSection';
import OpzenixLogo from '@/components/brand/OpzenixLogo';

const About = () => {
  const values = [
    {
      icon: Rocket,
      title: 'Innovation First',
      description: 'We push the boundaries of what\'s possible in enterprise delivery.',
    },
    {
      icon: Users,
      title: 'Customer Obsessed',
      description: 'Every feature we build solves real problems for real teams.',
    },
    {
      icon: Heart,
      title: 'Developer Love',
      description: 'We believe great tools should make developers\' lives easier.',
    },
    {
      icon: Globe,
      title: 'Global Scale',
      description: 'Built for enterprises that operate across continents.',
    },
  ];

  const milestones = [
    { year: '2023', event: 'Opzenix founded by CropXon Innovations' },
    { year: '2024', event: 'SOC2 Type II certification achieved' },
    { year: '2024', event: 'Series A funding secured' },
    { year: '2025', event: 'Serving Fortune 500 enterprises globally' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <EnterpriseNavigation />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-1/5" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <OpzenixLogo size="xl" className="justify-center mb-8" />
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Governance for the{' '}
              <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                Modern Enterprise
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              We're on a mission to help enterprises ship software with confidence. 
              Built by DevOps veterans who've felt the pain of ungoverned pipelines.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">Our Story</Badge>
            <h2 className="text-3xl font-bold mb-6">Born from Real-World Challenges</h2>
            <div className="prose prose-lg text-muted-foreground">
              <p>
                Opzenix was born from the frustration of managing enterprise CI/CD at scale. 
                Our founders spent years building and operating delivery platforms for Fortune 500 
                companies, and they saw the same problems everywhere: scattered visibility, 
                risky deployments, and compliance nightmares.
              </p>
              <p className="mt-4">
                We founded Opzenix under CropXon Innovations to solve these problems once and for all. 
                Our vision is simple: give every enterprise the confidence to deploy faster, safer, 
                and with complete visibility.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground">
              The principles that guide everything we do.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year + milestone.event}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-6"
              >
                <div className="w-20 text-right">
                  <Badge variant="outline">{milestone.year}</Badge>
                </div>
                <div className="w-3 h-3 rounded-full bg-primary" />
                <p className="font-medium">{milestone.event}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
          <p className="text-muted-foreground mb-8">
            We're always looking for talented people who want to shape the future of enterprise delivery.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/company/careers">View Open Roles</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/company/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default About;
