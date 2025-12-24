import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator, Users, Zap, Clock, DollarSign, TrendingUp,
  TrendingDown, CheckCircle2, ArrowRight, Sparkles, Shield,
  Server, AlertTriangle, Target, Rocket, BarChart3, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function ROICalculator() {
  // Input metrics
  const [teamSize, setTeamSize] = useState(30);
  const [deploymentsPerMonth, setDeploymentsPerMonth] = useState(200);
  const [avgDeploymentTime, setAvgDeploymentTime] = useState(45); // minutes
  const [incidentsPerMonth, setIncidentsPerMonth] = useState(4);
  const [avgIncidentCost, setAvgIncidentCost] = useState(15000);
  const [hourlyDevRate, setHourlyDevRate] = useState(85);
  const [failedDeploymentRate, setFailedDeploymentRate] = useState(15); // percentage

  const calculations = useMemo(() => {
    // Current state calculations (without Opzenix)
    const currentDeploymentHours = (deploymentsPerMonth * avgDeploymentTime) / 60;
    const currentDeploymentCost = currentDeploymentHours * hourlyDevRate;
    const currentIncidentCost = incidentsPerMonth * avgIncidentCost;
    const failedDeployments = Math.floor(deploymentsPerMonth * (failedDeploymentRate / 100));
    const failedDeploymentCost = failedDeployments * (avgDeploymentTime / 60) * hourlyDevRate * 1.5; // 50% extra for retries
    const currentMaintenanceHours = teamSize * 2; // 2 hours per dev per month on CI/CD maintenance
    const currentMaintenanceCost = currentMaintenanceHours * hourlyDevRate;
    
    const currentTotalCost = currentDeploymentCost + currentIncidentCost + failedDeploymentCost + currentMaintenanceCost;

    // With Opzenix calculations
    const opzenixDeploymentTime = avgDeploymentTime * 0.6; // 40% faster deployments
    const opzenixDeploymentHours = (deploymentsPerMonth * opzenixDeploymentTime) / 60;
    const opzenixDeploymentCost = opzenixDeploymentHours * hourlyDevRate;
    
    const opzenixIncidentReduction = 0.7; // 70% fewer incidents
    const opzenixIncidents = incidentsPerMonth * (1 - opzenixIncidentReduction);
    const opzenixIncidentCost = opzenixIncidents * avgIncidentCost;
    
    const opzenixFailureRate = failedDeploymentRate * 0.4; // 60% fewer failed deployments
    const opzenixFailedDeployments = Math.floor(deploymentsPerMonth * (opzenixFailureRate / 100));
    const opzenixFailedDeploymentCost = opzenixFailedDeployments * (opzenixDeploymentTime / 60) * hourlyDevRate * 1.2;
    
    const opzenixMaintenanceHours = teamSize * 0.5; // 75% less maintenance
    const opzenixMaintenanceCost = opzenixMaintenanceHours * hourlyDevRate;
    
    // Opzenix subscription cost (volume pricing)
    let opzenixPerUser = 29;
    if (teamSize > 25) opzenixPerUser = 19;
    if (teamSize > 100) opzenixPerUser = 15;
    const opzenixSubscription = teamSize <= 5 ? 0 : teamSize * opzenixPerUser;
    
    const opzenixTotalCost = opzenixDeploymentCost + opzenixIncidentCost + opzenixFailedDeploymentCost + 
                             opzenixMaintenanceCost + opzenixSubscription;

    // Savings calculations
    const monthlySavings = currentTotalCost - opzenixTotalCost;
    const annualSavings = monthlySavings * 12;
    const savingsPercentage = currentTotalCost > 0 ? (monthlySavings / currentTotalCost) * 100 : 0;
    
    // Productivity metrics
    const hoursSavedMonthly = currentDeploymentHours - opzenixDeploymentHours + 
                              (currentMaintenanceHours - opzenixMaintenanceHours);
    const incidentsPrevented = incidentsPerMonth - opzenixIncidents;
    const deploymentTimeSaved = avgDeploymentTime - opzenixDeploymentTime;
    const failureReduction = failedDeploymentRate - opzenixFailureRate;
    
    // ROI calculation
    const totalInvestment = opzenixSubscription * 12;
    const totalReturn = annualSavings;
    const roi = totalInvestment > 0 ? ((totalReturn - totalInvestment) / totalInvestment) * 100 : 0;
    const paybackMonths = monthlySavings > 0 ? opzenixSubscription / monthlySavings : 0;

    return {
      current: {
        deploymentCost: currentDeploymentCost,
        incidentCost: currentIncidentCost,
        failedDeploymentCost,
        maintenanceCost: currentMaintenanceCost,
        totalCost: currentTotalCost,
        failedDeployments
      },
      opzenix: {
        deploymentCost: opzenixDeploymentCost,
        incidentCost: opzenixIncidentCost,
        failedDeploymentCost: opzenixFailedDeploymentCost,
        maintenanceCost: opzenixMaintenanceCost,
        subscription: opzenixSubscription,
        totalCost: opzenixTotalCost,
        perUser: opzenixPerUser,
        incidents: opzenixIncidents,
        failedDeployments: opzenixFailedDeployments
      },
      savings: {
        monthly: monthlySavings,
        annual: annualSavings,
        percentage: savingsPercentage,
        hoursSaved: hoursSavedMonthly,
        incidentsPrevented,
        deploymentTimeSaved,
        failureReduction
      },
      roi: {
        percentage: roi,
        paybackMonths: paybackMonths < 1 ? paybackMonths : Math.ceil(paybackMonths)
      }
    };
  }, [teamSize, deploymentsPerMonth, avgDeploymentTime, incidentsPerMonth, avgIncidentCost, hourlyDevRate, failedDeploymentRate]);

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto">
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
              Return on Investment
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how deployment frequency, incident costs, and team productivity translate into real savings
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Input Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5"
          >
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Your Current Metrics
                </CardTitle>
                <CardDescription>
                  Adjust to match your team's situation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Team Size */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      Engineering Team
                    </label>
                    <Badge variant="secondary" className="font-mono">{teamSize} engineers</Badge>
                  </div>
                  <Slider
                    value={[teamSize]}
                    onValueChange={(v) => setTeamSize(v[0])}
                    min={5}
                    max={200}
                    step={5}
                  />
                </div>

                {/* Deployments per Month */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-muted-foreground" />
                      Deployments/Month
                    </label>
                    <Badge variant="secondary" className="font-mono">{deploymentsPerMonth}</Badge>
                  </div>
                  <Slider
                    value={[deploymentsPerMonth]}
                    onValueChange={(v) => setDeploymentsPerMonth(v[0])}
                    min={10}
                    max={1000}
                    step={10}
                  />
                </div>

                {/* Average Deployment Time */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      Avg. Deploy Time
                    </label>
                    <Badge variant="secondary" className="font-mono">{avgDeploymentTime} min</Badge>
                  </div>
                  <Slider
                    value={[avgDeploymentTime]}
                    onValueChange={(v) => setAvgDeploymentTime(v[0])}
                    min={5}
                    max={120}
                    step={5}
                  />
                </div>

                {/* Failed Deployment Rate */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                      Failure Rate
                    </label>
                    <Badge variant="secondary" className="font-mono">{failedDeploymentRate}%</Badge>
                  </div>
                  <Slider
                    value={[failedDeploymentRate]}
                    onValueChange={(v) => setFailedDeploymentRate(v[0])}
                    min={1}
                    max={40}
                    step={1}
                  />
                </div>

                {/* Incidents per Month */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      Incidents/Month
                    </label>
                    <Badge variant="secondary" className="font-mono">{incidentsPerMonth}</Badge>
                  </div>
                  <Slider
                    value={[incidentsPerMonth]}
                    onValueChange={(v) => setIncidentsPerMonth(v[0])}
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>

                {/* Avg Incident Cost */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      Avg. Incident Cost
                    </label>
                    <Badge variant="secondary" className="font-mono">${avgIncidentCost.toLocaleString()}</Badge>
                  </div>
                  <Slider
                    value={[avgIncidentCost]}
                    onValueChange={(v) => setAvgIncidentCost(v[0])}
                    min={1000}
                    max={100000}
                    step={1000}
                  />
                </div>

                {/* Hourly Rate */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      Dev Hourly Rate
                    </label>
                    <Badge variant="secondary" className="font-mono">${hourlyDevRate}/hr</Badge>
                  </div>
                  <Slider
                    value={[hourlyDevRate]}
                    onValueChange={(v) => setHourlyDevRate(v[0])}
                    min={50}
                    max={200}
                    step={5}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* ROI Summary */}
            <Card className="bg-gradient-to-br from-sec-safe/10 to-primary/5 border-sec-safe/30">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-sec-safe">
                      {calculations.roi.percentage.toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">ROI</div>
                  </div>
                  <div className="text-center border-l border-border">
                    <div className="text-4xl font-bold text-primary">
                      ${Math.round(calculations.savings.annual).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Annual Savings</div>
                  </div>
                  <div className="text-center border-l border-border">
                    <div className="text-4xl font-bold text-chart-1">
                      {calculations.savings.percentage.toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Cost Reduction</div>
                  </div>
                  <div className="text-center border-l border-border">
                    <div className="text-4xl font-bold text-chart-2">
                      {calculations.roi.paybackMonths < 1 ? '<1' : calculations.roi.paybackMonths}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Month Payback</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Tabs defaultValue="comparison" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="comparison">Cost Comparison</TabsTrigger>
                <TabsTrigger value="productivity">Productivity Gains</TabsTrigger>
                <TabsTrigger value="breakdown">Detailed Breakdown</TabsTrigger>
              </TabsList>

              <TabsContent value="comparison" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Monthly Cost Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Current State */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-sec-warning" />
                          Current State
                        </span>
                        <span className="text-lg font-bold text-sec-critical">
                          ${Math.round(calculations.current.totalCost).toLocaleString()}/mo
                        </span>
                      </div>
                      <div className="h-4 bg-muted rounded-lg overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-sec-warning to-sec-critical rounded-lg w-full" />
                      </div>
                    </div>

                    {/* With Opzenix */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          With Opzenix
                        </span>
                        <span className="text-lg font-bold text-sec-safe">
                          ${Math.round(calculations.opzenix.totalCost).toLocaleString()}/mo
                        </span>
                      </div>
                      <div className="h-4 bg-muted rounded-lg overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(calculations.opzenix.totalCost / calculations.current.totalCost) * 100}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-primary to-sec-safe rounded-lg" 
                        />
                      </div>
                    </div>

                    {/* Savings */}
                    <div className="p-4 bg-sec-safe/10 rounded-lg border border-sec-safe/30">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sec-safe">Monthly Savings</span>
                        <span className="text-2xl font-bold text-sec-safe">
                          ${Math.round(calculations.savings.monthly).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="productivity" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Productivity Improvements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                        <div className="text-3xl font-bold">{Math.round(calculations.savings.hoursSaved)}h</div>
                        <div className="text-sm text-muted-foreground">Hours Saved/Month</div>
                        <div className="text-xs text-sec-safe mt-1">
                          ≈ ${Math.round(calculations.savings.hoursSaved * hourlyDevRate).toLocaleString()} value
                        </div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <Rocket className="w-8 h-8 text-primary mx-auto mb-2" />
                        <div className="text-3xl font-bold">{Math.round(calculations.savings.deploymentTimeSaved)}min</div>
                        <div className="text-sm text-muted-foreground">Faster Deploys</div>
                        <div className="text-xs text-sec-safe mt-1">
                          40% reduction in deploy time
                        </div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                        <div className="text-3xl font-bold">{calculations.savings.incidentsPrevented.toFixed(1)}</div>
                        <div className="text-sm text-muted-foreground">Incidents Prevented/Month</div>
                        <div className="text-xs text-sec-safe mt-1">
                          ≈ ${Math.round(calculations.savings.incidentsPrevented * avgIncidentCost).toLocaleString()} saved
                        </div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <TrendingDown className="w-8 h-8 text-primary mx-auto mb-2" />
                        <div className="text-3xl font-bold">{calculations.savings.failureReduction.toFixed(0)}%</div>
                        <div className="text-sm text-muted-foreground">Lower Failure Rate</div>
                        <div className="text-xs text-sec-safe mt-1">
                          {calculations.current.failedDeployments - calculations.opzenix.failedDeployments} fewer failures/month
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="breakdown" className="mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Current Costs */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-sec-warning" />
                        Current Monthly Costs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deployment labor</span>
                        <span>${Math.round(calculations.current.deploymentCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Incident costs ({incidentsPerMonth} incidents)</span>
                        <span>${Math.round(calculations.current.incidentCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Failed deployments ({calculations.current.failedDeployments})</span>
                        <span>${Math.round(calculations.current.failedDeploymentCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">CI/CD maintenance</span>
                        <span>${Math.round(calculations.current.maintenanceCost).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span className="text-sec-critical">${Math.round(calculations.current.totalCost).toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Opzenix Costs */}
                  <Card className="border-primary/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        With Opzenix
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deployment labor (40% faster)</span>
                        <span className="text-sec-safe">${Math.round(calculations.opzenix.deploymentCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Incident costs ({calculations.opzenix.incidents.toFixed(1)} incidents)</span>
                        <span className="text-sec-safe">${Math.round(calculations.opzenix.incidentCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Failed deployments ({calculations.opzenix.failedDeployments})</span>
                        <span className="text-sec-safe">${Math.round(calculations.opzenix.failedDeploymentCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Maintenance (75% less)</span>
                        <span className="text-sec-safe">${Math.round(calculations.opzenix.maintenanceCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Opzenix subscription ({teamSize} × ${calculations.opzenix.perUser})</span>
                        <span>${Math.round(calculations.opzenix.subscription).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span className="text-sec-safe">${Math.round(calculations.opzenix.totalCost).toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/company/contact">
                  Get Custom Analysis
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default ROICalculator;