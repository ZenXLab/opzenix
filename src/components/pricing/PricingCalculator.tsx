import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator, Users, Zap, GitBranch, Clock, DollarSign,
  TrendingDown, CheckCircle2, ArrowRight, Sparkles, Shield,
  Server, Building2, BarChart3, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CompetitorData {
  name: string;
  baseCost: number;
  perUserCost: number;
  perExecutionCost: number;
  hiddenCosts: number;
  setupTime: string;
  maintenanceHours: number;
}

const competitors: Record<string, CompetitorData> = {
  jenkins: {
    name: 'Jenkins + DIY',
    baseCost: 500,
    perUserCost: 0,
    perExecutionCost: 0.05,
    hiddenCosts: 2500,
    setupTime: '2-4 weeks',
    maintenanceHours: 40
  },
  github: {
    name: 'GitHub Actions',
    baseCost: 0,
    perUserCost: 4,
    perExecutionCost: 0.008,
    hiddenCosts: 800,
    setupTime: '1-2 weeks',
    maintenanceHours: 15
  },
  gitlab: {
    name: 'GitLab CI/CD',
    baseCost: 0,
    perUserCost: 29,
    perExecutionCost: 0,
    hiddenCosts: 600,
    setupTime: '1-2 weeks',
    maintenanceHours: 20
  },
  circleci: {
    name: 'CircleCI',
    baseCost: 0,
    perUserCost: 15,
    perExecutionCost: 0.006,
    hiddenCosts: 500,
    setupTime: '3-5 days',
    maintenanceHours: 10
  }
};

const opzenixPricing = {
  starter: { base: 0, perUser: 0, maxUsers: 3, maxExecutions: 10 },
  professional: { base: 0, perUser: 99, maxUsers: Infinity, maxExecutions: Infinity },
  enterprise: { base: 0, perUser: 'custom', maxUsers: Infinity, maxExecutions: Infinity }
};

export function PricingCalculator() {
  const [teamSize, setTeamSize] = useState(10);
  const [monthlyExecutions, setMonthlyExecutions] = useState(500);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('jenkins');
  const [includeGovernance, setIncludeGovernance] = useState(true);

  const calculations = useMemo(() => {
    const competitor = competitors[selectedCompetitor];
    
    // Competitor cost calculation
    const competitorBaseCost = competitor.baseCost;
    const competitorUserCost = competitor.perUserCost * teamSize;
    const competitorExecutionCost = competitor.perExecutionCost * monthlyExecutions;
    const competitorMaintenance = (competitor.maintenanceHours * 75); // $75/hour DevOps engineer
    const competitorTotal = competitorBaseCost + competitorUserCost + competitorExecutionCost + 
                           competitor.hiddenCosts + competitorMaintenance;
    
    // Opzenix cost calculation
    const opzenixPlan = teamSize <= 3 ? 'starter' : 'professional';
    const opzenixUserCost = opzenixPlan === 'starter' ? 0 : 99 * teamSize;
    const opzenixTotal = opzenixUserCost;
    
    // Savings
    const monthlySavings = competitorTotal - opzenixTotal;
    const annualSavings = monthlySavings * 12;
    const savingsPercentage = competitorTotal > 0 ? ((monthlySavings / competitorTotal) * 100) : 0;
    
    // Time savings
    const setupTimeSavingsHours = selectedCompetitor === 'jenkins' ? 80 : 40;
    const maintenanceTimeSaved = competitor.maintenanceHours;
    
    // Incident cost savings (governance benefits)
    const avgIncidentCost = 5000;
    const incidentsPreventedPerMonth = includeGovernance ? 2 : 0;
    const incidentSavings = avgIncidentCost * incidentsPreventedPerMonth;
    
    return {
      competitor: {
        base: competitorBaseCost,
        users: competitorUserCost,
        executions: competitorExecutionCost,
        hidden: competitor.hiddenCosts,
        maintenance: competitorMaintenance,
        total: competitorTotal
      },
      opzenix: {
        plan: opzenixPlan,
        users: opzenixUserCost,
        total: opzenixTotal
      },
      savings: {
        monthly: monthlySavings,
        annual: annualSavings,
        percentage: savingsPercentage,
        setupHours: setupTimeSavingsHours,
        maintenanceHours: maintenanceTimeSaved,
        incidents: incidentSavings
      }
    };
  }, [teamSize, monthlyExecutions, selectedCompetitor, includeGovernance]);

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
            <Calculator className="w-3 h-3 mr-1" /> ROI Calculator
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Calculate Your{' '}
            <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              Cost Savings
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how much you can save by switching to Opzenix from traditional CI/CD tools
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calculator Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Your Configuration
                </CardTitle>
                <CardDescription>
                  Adjust to match your team's needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Team Size Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Team Size</label>
                    <Badge variant="secondary">{teamSize} engineers</Badge>
                  </div>
                  <Slider
                    value={[teamSize]}
                    onValueChange={(v) => setTeamSize(v[0])}
                    min={1}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>

                {/* Monthly Executions Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Monthly Pipeline Runs</label>
                    <Badge variant="secondary">{monthlyExecutions.toLocaleString()}</Badge>
                  </div>
                  <Slider
                    value={[monthlyExecutions]}
                    onValueChange={(v) => setMonthlyExecutions(v[0])}
                    min={10}
                    max={10000}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10</span>
                    <span>5,000</span>
                    <span>10,000</span>
                  </div>
                </div>

                {/* Competitor Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Compare Against</label>
                  <Tabs value={selectedCompetitor} onValueChange={setSelectedCompetitor}>
                    <TabsList className="grid grid-cols-2 h-auto">
                      {Object.entries(competitors).map(([key, comp]) => (
                        <TabsTrigger
                          key={key}
                          value={key}
                          className="text-xs py-2"
                        >
                          {comp.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                {/* Governance Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm">Include Governance Savings</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeGovernance}
                    onChange={(e) => setIncludeGovernance(e.target.checked)}
                    className="rounded border-border"
                  />
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
            className="lg:col-span-2 space-y-6"
          >
            {/* Savings Summary */}
            <Card className="bg-gradient-to-br from-sec-safe/10 to-primary/5 border-sec-safe/30">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-sec-safe">
                      ${calculations.savings.monthly.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Monthly Savings</div>
                  </div>
                  <div className="text-center border-x border-border">
                    <div className="text-4xl font-bold text-primary">
                      ${calculations.savings.annual.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Annual Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-chart-1">
                      {calculations.savings.percentage.toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Cost Reduction</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Competitor Costs */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="w-4 h-4 text-sec-warning" />
                    {competitors[selectedCompetitor].name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base Platform</span>
                    <span>${calculations.competitor.base.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Per-User Cost</span>
                    <span>${calculations.competitor.users.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Execution Costs</span>
                    <span>${calculations.competitor.executions.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hidden Costs (plugins, integrations)</span>
                    <span>${calculations.competitor.hidden.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Maintenance ({competitors[selectedCompetitor].maintenanceHours}h × $75)</span>
                    <span>${calculations.competitor.maintenance.toLocaleString()}/mo</span>
                  </div>
                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total Monthly Cost</span>
                      <span className="text-sec-critical">${calculations.competitor.total.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Opzenix Costs */}
              <Card className="border-primary/30">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Opzenix {calculations.opzenix.plan === 'starter' ? 'Starter' : 'Professional'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base Platform</span>
                    <span className="text-sec-safe">$0/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {calculations.opzenix.plan === 'starter' 
                        ? `Up to 3 users included` 
                        : `${teamSize} users × $99`}
                    </span>
                    <span>${calculations.opzenix.users.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unlimited Executions</span>
                    <span className="text-sec-safe">Included</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">All Integrations</span>
                    <span className="text-sec-safe">Included</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Zero Maintenance</span>
                    <span className="text-sec-safe">Included</span>
                  </div>
                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total Monthly Cost</span>
                      <span className="text-sec-safe">${calculations.opzenix.total.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Benefits */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-primary" />
                  Additional Value with Opzenix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">{calculations.savings.setupHours}h</div>
                    <div className="text-xs text-muted-foreground">Setup Time Saved</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Server className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">{calculations.savings.maintenanceHours}h</div>
                    <div className="text-xs text-muted-foreground">Monthly Maintenance Saved</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">${calculations.savings.incidents.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Incident Costs Prevented</div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">99.9%</div>
                    <div className="text-xs text-muted-foreground">Platform Uptime SLA</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Start Saving Today
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/company/contact">
                  Talk to Sales
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
