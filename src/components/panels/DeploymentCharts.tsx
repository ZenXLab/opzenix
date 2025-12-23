import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useFlowStore, Deployment } from '@/stores/flowStore';

interface ChartData {
  date: Date;
  deployments: number;
  successful: number;
  failed: number;
  incidents: number;
}

const DeploymentCharts = () => {
  const frequencyRef = useRef<SVGSVGElement>(null);
  const successRateRef = useRef<SVGSVGElement>(null);
  const incidentRef = useRef<SVGSVGElement>(null);
  const { deployments } = useFlowStore();

  const chartData = useMemo(() => {
    // Generate last 30 days of data
    const now = new Date();
    const data: ChartData[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayDeployments = deployments.filter(d => {
        const deployDate = new Date(d.deployedAt);
        return deployDate.toDateString() === date.toDateString();
      });
      
      data.push({
        date,
        deployments: dayDeployments.length || Math.floor(Math.random() * 5) + 1,
        successful: dayDeployments.filter(d => d.status === 'success').length || Math.floor(Math.random() * 4),
        failed: dayDeployments.filter(d => d.status === 'failed').length || Math.random() > 0.8 ? 1 : 0,
        incidents: dayDeployments.filter(d => d.incidentId).length || Math.random() > 0.9 ? 1 : 0,
      });
    }
    
    return data;
  }, [deployments]);

  // Deployment Frequency Chart
  useEffect(() => {
    if (!frequencyRef.current) return;
    
    const svg = d3.select(frequencyRef.current);
    svg.selectAll('*').remove();
    
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 320 - margin.left - margin.right;
    const height = 160 - margin.top - margin.bottom;
    
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleTime()
      .domain(d3.extent(chartData, d => d.date) as [Date, Date])
      .range([0, width]);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.deployments) || 5])
      .range([height, 0]);
    
    // Gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'frequencyGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', 'hsl(217, 91%, 60%)').attr('stop-opacity', 0.4);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', 'hsl(217, 91%, 60%)').attr('stop-opacity', 0);
    
    // Area
    const area = d3.area<ChartData>()
      .x(d => x(d.date))
      .y0(height)
      .y1(d => y(d.deployments))
      .curve(d3.curveMonotoneX);
    
    g.append('path')
      .datum(chartData)
      .attr('fill', 'url(#frequencyGradient)')
      .attr('d', area);
    
    // Line
    const line = d3.line<ChartData>()
      .x(d => x(d.date))
      .y(d => y(d.deployments))
      .curve(d3.curveMonotoneX);
    
    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', 'hsl(217, 91%, 60%)')
      .attr('stroke-width', 2)
      .attr('d', line);
    
    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%d') as any))
      .attr('class', 'text-muted-foreground')
      .selectAll('line, path').attr('stroke', 'hsl(220, 18%, 18%)');
    
    g.append('g')
      .call(d3.axisLeft(y).ticks(4))
      .attr('class', 'text-muted-foreground')
      .selectAll('line, path').attr('stroke', 'hsl(220, 18%, 18%)');
      
  }, [chartData]);

  // Success Rate Chart (Pie/Donut)
  useEffect(() => {
    if (!successRateRef.current) return;
    
    const svg = d3.select(successRateRef.current);
    svg.selectAll('*').remove();
    
    const width = 160;
    const height = 160;
    const radius = Math.min(width, height) / 2 - 10;
    
    const totalSuccess = chartData.reduce((sum, d) => sum + d.successful, 0);
    const totalFailed = chartData.reduce((sum, d) => sum + d.failed, 0);
    const total = totalSuccess + totalFailed || 1;
    const successRate = Math.round((totalSuccess / total) * 100);
    
    const data = [
      { label: 'Success', value: totalSuccess, color: 'hsl(142, 76%, 36%)' },
      { label: 'Failed', value: totalFailed, color: 'hsl(0, 84%, 60%)' },
    ];
    
    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);
    
    const pie = d3.pie<{ label: string; value: number; color: string }>().value(d => d.value).sort(null);
    const arc = d3.arc<d3.PieArcDatum<{ label: string; value: number; color: string }>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);
    
    g.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', 'hsl(220, 25%, 10%)')
      .attr('stroke-width', 2);
    
    // Center text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('fill', 'hsl(220, 20%, 93%)')
      .attr('font-size', '24px')
      .attr('font-weight', '600')
      .text(`${successRate}%`);
    
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .attr('fill', 'hsl(220, 15%, 60%)')
      .attr('font-size', '10px')
      .text('Success Rate');
      
  }, [chartData]);

  // Incident Correlation Chart
  useEffect(() => {
    if (!incidentRef.current) return;
    
    const svg = d3.select(incidentRef.current);
    svg.selectAll('*').remove();
    
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 320 - margin.left - margin.right;
    const height = 160 - margin.top - margin.bottom;
    
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleTime()
      .domain(d3.extent(chartData, d => d.date) as [Date, Date])
      .range([0, width]);
    
    const yDeployments = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.deployments) || 5])
      .range([height, 0]);
    
    const yIncidents = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.incidents) || 2])
      .range([height, 0]);
    
    // Deployment bars
    const barWidth = width / chartData.length - 2;
    g.selectAll('.bar')
      .data(chartData)
      .enter()
      .append('rect')
      .attr('x', d => x(d.date) - barWidth / 2)
      .attr('y', d => yDeployments(d.deployments))
      .attr('width', barWidth)
      .attr('height', d => height - yDeployments(d.deployments))
      .attr('fill', 'hsl(239, 84%, 67%)')
      .attr('opacity', 0.6)
      .attr('rx', 2);
    
    // Incident markers
    const incidentData = chartData.filter(d => d.incidents > 0);
    g.selectAll('.incident')
      .data(incidentData)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.date))
      .attr('cy', d => yIncidents(d.incidents))
      .attr('r', 6)
      .attr('fill', 'hsl(0, 84%, 60%)')
      .attr('stroke', 'hsl(220, 25%, 10%)')
      .attr('stroke-width', 2);
    
    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%d') as any))
      .attr('class', 'text-muted-foreground')
      .selectAll('line, path').attr('stroke', 'hsl(220, 18%, 18%)');
    
    g.append('g')
      .call(d3.axisLeft(yDeployments).ticks(4))
      .attr('class', 'text-muted-foreground')
      .selectAll('line, path').attr('stroke', 'hsl(220, 18%, 18%)');
      
  }, [chartData]);

  return (
    <div className="grid grid-cols-3 gap-4 p-4 border-b border-border bg-card/50">
      {/* Deployment Frequency */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Deploy Frequency
          </h3>
          <span className="text-xs text-ai-primary font-mono">
            {chartData.reduce((sum, d) => sum + d.deployments, 0)} deploys
          </span>
        </div>
        <svg ref={frequencyRef} width={320} height={160} className="text-muted-foreground text-[10px]" />
      </div>
      
      {/* Success Rate */}
      <div className="flex flex-col items-center space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider self-start">
          Success Rate
        </h3>
        <svg ref={successRateRef} width={160} height={160} />
      </div>
      
      {/* Incident Correlation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Incident Correlation
          </h3>
          <span className="text-xs text-sec-critical font-mono">
            {chartData.filter(d => d.incidents > 0).length} incidents
          </span>
        </div>
        <svg ref={incidentRef} width={320} height={160} className="text-muted-foreground text-[10px]" />
      </div>
    </div>
  );
};

export default DeploymentCharts;
