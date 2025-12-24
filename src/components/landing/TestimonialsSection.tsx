import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, Building2, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  industry: string;
  avatar: string;
  quote: string;
  metrics: {
    label: string;
    value: string;
  };
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'VP of Engineering',
    company: 'TechCorp Global',
    industry: 'FinTech',
    avatar: 'SC',
    quote: "Opzenix transformed our deployment process. We went from 2-hour rollbacks to 30-second checkpoint recoveries. The governance features gave our security team the confidence they needed.",
    metrics: { label: 'Deployment Time', value: '-75%' },
    rating: 5,
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    role: 'DevOps Lead',
    company: 'HealthStack',
    industry: 'Healthcare',
    avatar: 'MJ',
    quote: "The HIPAA compliance mapping was a game-changer. We reduced our audit preparation time from weeks to days. The visual pipeline editor makes it easy for non-DevOps team members to understand our processes.",
    metrics: { label: 'Audit Prep Time', value: '-80%' },
    rating: 5,
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Platform Architect',
    company: 'CloudScale Systems',
    industry: 'SaaS',
    avatar: 'ER',
    quote: "We manage 200+ microservices across 5 Kubernetes clusters. Opzenix's multi-cluster support and OpenTelemetry integration gave us the observability we desperately needed.",
    metrics: { label: 'MTTR Improvement', value: '-60%' },
    rating: 5,
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'CTO',
    company: 'Quantum Analytics',
    industry: 'Enterprise',
    avatar: 'DK',
    quote: "The AI-powered failure analysis has been incredible. It identified a recurring API rate limit issue that we'd been chasing for months. The suggested fix worked perfectly.",
    metrics: { label: 'Incidents Resolved', value: '+40%' },
    rating: 5,
  },
  {
    id: 5,
    name: 'Lisa Wang',
    role: 'Release Manager',
    company: 'RetailMax',
    industry: 'E-commerce',
    avatar: 'LW',
    quote: "During Black Friday, we deployed 47 times without a single failed rollback. The checkpoint system and approval workflows gave us the safety net we needed for high-stakes releases.",
    metrics: { label: 'Release Frequency', value: '+3x' },
    rating: 5,
  },
];

const successStories = [
  {
    company: 'TechCorp Global',
    logo: Building2,
    industry: 'Financial Services',
    challenge: 'Manual deployments causing 4-hour production incidents',
    solution: 'Automated governance with checkpoint recovery',
    results: [
      { metric: 'Deployment frequency', before: '2/week', after: '15/day' },
      { metric: 'MTTR', before: '4 hours', after: '30 seconds' },
      { metric: 'Failed deployments', before: '15%', after: '< 1%' },
    ],
  },
  {
    company: 'HealthStack',
    logo: Users,
    industry: 'Healthcare Technology',
    challenge: 'Compliance audits taking weeks of engineering time',
    solution: 'Automated audit trails and compliance mapping',
    results: [
      { metric: 'Audit prep time', before: '3 weeks', after: '2 days' },
      { metric: 'Compliance violations', before: '12/quarter', after: '0' },
      { metric: 'Documentation effort', before: '40 hrs/release', after: '0' },
    ],
  },
  {
    company: 'CloudScale Systems',
    logo: TrendingUp,
    industry: 'B2B SaaS',
    challenge: 'No visibility across 200+ microservices',
    solution: 'OpenTelemetry integration with AI-powered insights',
    results: [
      { metric: 'Incident detection', before: '45 min', after: '< 1 min' },
      { metric: 'Root cause analysis', before: '3 hours', after: '5 min' },
      { metric: 'On-call burden', before: '40 hrs/week', after: '8 hrs/week' },
    ],
  },
];

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeStory, setActiveStory] = useState(0);

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section ref={ref} className="py-24 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-muted/30" />
      
      <div className="max-w-7xl mx-auto relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 border-primary/30">
            <Star className="w-3 h-3 mr-1 fill-primary text-primary" /> Customer Stories
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Trusted by{' '}
            <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              Industry Leaders
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how engineering teams are transforming their CI/CD governance with Opzenix
          </p>
        </motion.div>

        {/* Featured Testimonials Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                {/* Quote */}
                <div className="md:col-span-2">
                  <Quote className="w-12 h-12 text-primary/30 mb-4" />
                  <motion.p
                    key={activeTestimonial}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="text-xl md:text-2xl text-foreground leading-relaxed mb-6"
                  >
                    "{testimonials[activeTestimonial].quote}"
                  </motion.p>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {testimonials[activeTestimonial].avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-lg">
                        {testimonials[activeTestimonial].name}
                      </div>
                      <div className="text-muted-foreground">
                        {testimonials[activeTestimonial].role}, {testimonials[activeTestimonial].company}
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-auto hidden sm:flex">
                      {testimonials[activeTestimonial].industry}
                    </Badge>
                  </div>
                </div>

                {/* Metric Highlight */}
                <div className="flex flex-col items-center justify-center p-6 bg-primary/10 rounded-2xl">
                  <motion.div
                    key={`metric-${activeTestimonial}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="text-5xl font-bold text-primary mb-2">
                      {testimonials[activeTestimonial].metrics.value}
                    </div>
                    <div className="text-muted-foreground">
                      {testimonials[activeTestimonial].metrics.label}
                    </div>
                    <div className="flex gap-1 mt-4 justify-center">
                      {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-sec-warning text-sec-warning" />
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <div className="flex gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTestimonial(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === activeTestimonial ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={prevTestimonial}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextTestimonial}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Success Stories */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-center mb-8">Customer Success Stories</h3>
          
          {/* Story Tabs */}
          <div className="flex justify-center gap-4 mb-8">
            {successStories.map((story, i) => (
              <Button
                key={i}
                variant={activeStory === i ? 'default' : 'outline'}
                onClick={() => setActiveStory(i)}
                className="gap-2"
              >
                <story.logo className="w-4 h-4" />
                {story.company}
              </Button>
            ))}
          </div>

          {/* Active Story */}
          <motion.div
            key={activeStory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2">
                  {/* Left - Challenge & Solution */}
                  <div className="p-8 border-r border-border">
                    <Badge variant="outline" className="mb-4">
                      {successStories[activeStory].industry}
                    </Badge>
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">THE CHALLENGE</h4>
                      <p className="text-lg">{successStories[activeStory].challenge}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">THE SOLUTION</h4>
                      <p className="text-lg text-primary">{successStories[activeStory].solution}</p>
                    </div>
                  </div>

                  {/* Right - Results */}
                  <div className="p-8 bg-muted/30">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-6">THE RESULTS</h4>
                    <div className="space-y-6">
                      {successStories[activeStory].results.map((result, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center justify-between"
                        >
                          <span className="text-muted-foreground">{result.metric}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm line-through text-muted-foreground/50">
                              {result.before}
                            </span>
                            <span className="text-lg font-bold text-sec-safe">
                              {result.after}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Logos Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 pt-16 border-t border-border"
        >
          <p className="text-center text-sm text-muted-foreground mb-8">
            Trusted by 500+ companies worldwide
          </p>
          <div className="flex flex-wrap justify-center gap-8 opacity-60">
            {['TechCorp', 'HealthStack', 'CloudScale', 'RetailMax', 'Quantum Analytics', 'DataFlow'].map((company) => (
              <div
                key={company}
                className="px-6 py-3 bg-muted/30 rounded-lg text-muted-foreground font-semibold"
              >
                {company}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
