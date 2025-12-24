import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Calculator, Users, Zap, Clock, DollarSign,
  TrendingDown, CheckCircle2, ArrowRight, Sparkles, Shield,
  Server, Building2, BarChart3, AlertTriangle, XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CompetitorData {
  name: string;
  color: string;
  baseCost: number;
  perUserCost: number;
  perExecutionCost: number;
  hiddenCosts: number;
  setupWeeks: number;
  maintenanceHours: number;
  governanceCost: number;
}

const competitors: Record<string, CompetitorData> = {
  harness: {
    name: 'Harness',
    color: 'hsl(var(--sec-critical))',
    baseCost: 0,
    perUserCost: 150,
    perExecutionCost: 0,
    hiddenCosts: 2000,
    setupWeeks: 4,
    maintenanceHours: 25,
    governanceCost: 500
  },
  jenkins: {
    name: 'Jenkins + DIY',
    color: 'hsl(var(--sec-warning))',
    baseCost: 0,
    perUserCost: 0,
    perExecutionCost: 0.02,
    hiddenCosts: 3500,
    setupWeeks: 6,
    maintenanceHours: 60,
    governanceCost: 1500
  },
  gitlab: {
    name: 'GitLab Ultimate',
    color: 'hsl(var(--chart-1))',
    baseCost: 0,
    perUserCost: 99,
    perExecutionCost: 0,
    hiddenCosts: 800,
    setupWeeks: 2,
    maintenanceHours: 15,
    governanceCost: 300
  },
  circleci: {
    name: 'CircleCI Scale',
    color: 'hsl(var(--chart-2))',
    baseCost: 2000,
    perUserCost: 25,
    perExecutionCost: 0.003,
    hiddenCosts: 600,
    setupWeeks: 1,
    maintenanceHours: 10,
    governanceCost: 400
  },
  github: {
    name: 'GitHub Enterprise',
    color: 'hsl(var(--chart-3))',
    baseCost: 0,
    perUserCost: 21,
    perExecutionCost: 0.008,
    hiddenCosts: 1200,
    setupWeeks: 2,
    maintenanceHours: 20,
    governanceCost: 600
  }
};

// Opzenix uses volume-based pricing - cheaper per user as team grows
const getOpzenixPrice = (teamSize: number) => {
  if (teamSize <= 5) return { plan: 'Starter', perUser: 0, base: 0 };
  if (teamSize <= 25) return { plan: 'Team', perUser: 29, base: 0 };
  if (teamSize <= 100) return { plan: 'Professional', perUser: 19, base: 0 };
  return { plan: 'Enterprise', perUser: 15, base: 0 };
};

export function PricingCalculator() {
  const [teamSize, setTeamSize] = useState(25);
  const [monthlyExecutions, setMonthlyExecutions] = useState(2500);

  const calculations = useMemo(() => {
    const devOpsHourlyRate = 85;
    const opzenixPricing = getOpzenixPrice(teamSize);
    
    // Calculate Opzenix cost
    const opzenixUserCost = opzenixPricing.plan === 'Starter' ? 0 : opzenixPricing.perUser * teamSize;
    const opzenixTotal = opzenixUserCost;

    // Calculate all competitor costs
    const competitorCosts = Object.entries(competitors).map(([key, comp]) => {
      const userCost = comp.perUserCost * teamSize;
      const executionCost = comp.perExecutionCost * monthlyExecutions;
      const maintenanceCost = comp.maintenanceHours * devOpsHourlyRate;
      const total = comp.baseCost + userCost + executionCost + comp.hiddenCosts + maintenanceCost + comp.governanceCost;
      
      return {
        key,
        name: comp.name,
        color: comp.color,
        baseCost: comp.baseCost,
        userCost,
        executionCost,
        hiddenCosts: comp.hiddenCosts,
        maintenanceCost,
        governanceCost: comp.governanceCost,
        total,
        savings: total - opzenixTotal,
        savingsPercent: total > 0 ? ((total - opzenixTotal) / total) * 100 : 0
      };
    });

    // Sort by total cost descending
    competitorCosts.sort((a, b) => b.total - a.total);

    // Calculate average savings
    const avgSavings = competitorCosts.reduce((acc, c) => acc + c.savings, 0) / competitorCosts.length;
    const avgSavingsPercent = competitorCosts.reduce((acc, c) => acc + c.savingsPercent, 0) / competitorCosts.length;

    // Find max cost for visualization
    const maxCost = Math.max(...competitorCosts.map(c => c.total), opzenixTotal);

    return {
      opzenix: {
        plan: opzenixPricing.plan,
        perUser: opzenixPricing.perUser,
        userCost: opzenixUserCost,
        total: opzenixTotal
      },
      competitors: competitorCosts,
      avgSavings,
      avgSavingsPercent,
      maxCost,
      annualSavings: avgSavings * 12
    };
  }, [teamSize, monthlyExecutions]);

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 border-primary/30">
            <Calculator className="w-3 h-3 mr-1" /> TCO Calculator
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Calculate Your{' '}
            <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              True Cost Savings
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compare total cost of ownership against leading CI/CD platforms including hidden costs
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Calculator Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4"
          >
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Your Configuration
                </CardTitle>
                <CardDescription>
                  Adjust sliders to see real savings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Team Size Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Engineering Team Size</label>
                    <Badge variant="secondary" className="font-mono">{teamSize}</Badge>
                  </div>
                  <Slider
                    value={[teamSize]}
                    onValueChange={(v) => setTeamSize(v[0])}
                    min={5}
                    max={200}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5</span>
                    <span>100</span>
                    <span>200</span>
                  </div>
                </div>

                {/* Monthly Executions Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Monthly Pipeline Runs</label>
                    <Badge variant="secondary" className="font-mono">{monthlyExecutions.toLocaleString()}</Badge>
                  </div>
                  <Slider
                    value={[monthlyExecutions]}
                    onValueChange={(v) => setMonthlyExecutions(v[0])}
                    min={100}
                    max={50000}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>100</span>
                    <span>25K</span>
                    <span>50K</span>
                  </div>
                </div>

                {/* Opzenix Plan Display */}
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Your Opzenix Plan</span>
                    <Badge className="bg-primary">{calculations.opzenix.plan}</Badge>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    ${calculations.opzenix.total.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </div>
                  {calculations.opzenix.plan !== 'Starter' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {teamSize} users × ${calculations.opzenix.perUser}/user
                    </p>
                  )}
                </div>

                {/* What's Included */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Everything included:</p>
                  {[
                    'Unlimited pipeline executions',
                    'All integrations & connectors',
                    'Built-in governance & RBAC',
                    'Zero maintenance overhead',
                    'AI-powered recovery',
                    '24/7 enterprise support'
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-sec-safe shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cost Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-8 space-y-6"
          >
            {/* Savings Summary */}
            <Card className="bg-gradient-to-br from-sec-safe/10 to-primary/5 border-sec-safe/30">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-sec-safe">
                      ${Math.round(calculations.avgSavings).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Avg. Monthly Savings</div>
                  </div>
                  <div className="text-center border-x border-border">
                    <div className="text-4xl font-bold text-primary">
                      ${Math.round(calculations.annualSavings).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Annual Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-chart-1">
                      {calculations.avgSavingsPercent.toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Avg. Cost Reduction</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visual Cost Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Monthly Cost Comparison (Total Cost of Ownership)
                </CardTitle>
                <CardDescription>
                  Includes licensing, maintenance, hidden costs, and governance overhead
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Opzenix - Always first */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="font-medium">Opzenix {calculations.opzenix.plan}</span>
                      <Badge variant="outline" className="text-xs bg-sec-safe/10 text-sec-safe border-sec-safe/30">
                        Lowest Cost
                      </Badge>
                    </div>
                    <span className="font-bold text-sec-safe">
                      ${calculations.opzenix.total.toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(calculations.opzenix.total / calculations.maxCost) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-sec-safe rounded-lg"
                    />
                  </div>
                </div>

                {/* Competitors */}
                {calculations.competitors.map((comp, index) => (
                  <div key={comp.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-sec-warning" />
                        <span className="font-medium">{comp.name}</span>
                        <Badge variant="outline" className="text-xs">
                          +${comp.savings.toLocaleString()}/mo
                        </Badge>
                      </div>
                      <span className="font-bold text-sec-critical">
                        ${comp.total.toLocaleString()}/mo
                      </span>
                    </div>
                    <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(comp.total / calculations.maxCost) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-sec-warning to-sec-critical rounded-lg opacity-70"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Harness Deep Comparison */}
            <Card className="border-sec-critical/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="w-5 h-5 text-sec-critical" />
                  Opzenix vs Harness: Detailed Breakdown
                </CardTitle>
                <CardDescription>
                  See exactly where you save compared to Harness
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const harness = calculations.competitors.find(c => c.key === 'harness')!;
                  return (
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Harness Costs */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                          <XCircle className="w-5 h-5 text-sec-critical" />
                          <span className="font-semibold">Harness Hidden Costs</span>
                        </div>
                        <div className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                          <span>Per-seat licensing (${competitors.harness.perUserCost} × {teamSize})</span>
                          <span className="text-sec-critical">${harness.userCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                          <span>Governance module add-on</span>
                          <span className="text-sec-critical">${harness.governanceCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                          <span>Professional services & setup</span>
                          <span className="text-sec-critical">${harness.hiddenCosts.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                          <span>Maintenance ({competitors.harness.maintenanceHours}h × $85)</span>
                          <span className="text-sec-critical">${harness.maintenanceCost.toLocaleString()}</span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Harness Total</span>
                            <span className="text-sec-critical">${harness.total.toLocaleString()}/mo</span>
                          </div>
                        </div>
                      </div>

                      {/* Opzenix Value */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle2 className="w-5 h-5 text-sec-safe" />
                          <span className="font-semibold">Opzenix All-Inclusive</span>
                        </div>
                        <div className="flex justify-between text-sm p-2 bg-sec-safe/10 rounded">
                          <span>Volume pricing ({teamSize} users × ${calculations.opzenix.perUser})</span>
                          <span className="text-sec-safe">${calculations.opzenix.userCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm p-2 bg-sec-safe/10 rounded">
                          <span>Governance & RBAC included</span>
                          <span className="text-sec-safe">$0</span>
                        </div>
                        <div className="flex justify-between text-sm p-2 bg-sec-safe/10 rounded">
                          <span>All integrations included</span>
                          <span className="text-sec-safe">$0</span>
                        </div>
                        <div className="flex justify-between text-sm p-2 bg-sec-safe/10 rounded">
                          <span>Zero maintenance (fully managed)</span>
                          <span className="text-sec-safe">$0</span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Opzenix Total</span>
                            <span className="text-sec-safe">${calculations.opzenix.total.toLocaleString()}/mo</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Savings Banner */}
                <div className="mt-6 p-4 bg-gradient-to-r from-sec-safe/20 to-primary/20 rounded-lg border border-sec-safe/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-sec-safe">
                        Save ${(calculations.competitors.find(c => c.key === 'harness')?.savings || 0).toLocaleString()}/month vs Harness
                      </p>
                      <p className="text-sm text-muted-foreground">
                        That's ${((calculations.competitors.find(c => c.key === 'harness')?.savings || 0) * 12).toLocaleString()}/year back in your budget
                      </p>
                    </div>
                    <Button size="lg" className="shrink-0" asChild>
                      <Link to="/company/contact">
                        Get Custom Quote
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Value */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-primary" />
                  Beyond Cost Savings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">1 day</div>
                    <div className="text-xs text-muted-foreground">vs 4-6 weeks setup</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Server className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">0 hours</div>
                    <div className="text-xs text-muted-foreground">Monthly maintenance</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">~$10K</div>
                    <div className="text-xs text-muted-foreground">Incidents prevented/mo</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">99.99%</div>
                    <div className="text-xs text-muted-foreground">Platform uptime SLA</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/product/integrations">
                  View All Integrations
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default PricingCalculator;