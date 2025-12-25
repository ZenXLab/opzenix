import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Database,
  RefreshCw,
  Palette,
  Clock,
  BarChart,
  LineChart,
  PieChart,
  Table,
  CheckCircle,
  X,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ============================================
// ⚙️ WIDGET CONFIGURATION PANEL
// ============================================

export interface WidgetConfig {
  dataSource?: string;
  refreshInterval?: number;
  displayType?: 'chart' | 'table' | 'cards' | 'list';
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  showHeader?: boolean;
  showFooter?: boolean;
  maxItems?: number;
  theme?: 'default' | 'compact' | 'detailed';
  autoRefresh?: boolean;
  customTitle?: string;
  dateRange?: '1h' | '24h' | '7d' | '30d' | 'custom';
  environment?: string;
  columns?: number;
}

interface WidgetConfigPanelProps {
  open: boolean;
  onClose: () => void;
  widget: {
    id: string;
    type: string;
    name?: string;
    config?: WidgetConfig;
  };
  onSave: (widgetId: string, config: WidgetConfig) => void;
}

const DATA_SOURCES = [
  { id: 'executions', label: 'Pipeline Executions', icon: BarChart },
  { id: 'deployments', label: 'Deployments', icon: LineChart },
  { id: 'approvals', label: 'Approval Requests', icon: CheckCircle },
  { id: 'audit', label: 'Audit Logs', icon: Table },
  { id: 'metrics', label: 'System Metrics', icon: PieChart },
  { id: 'health', label: 'Environment Health', icon: Database },
];

const REFRESH_INTERVALS = [
  { value: 5, label: '5 seconds' },
  { value: 15, label: '15 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 0, label: 'Manual only' },
];

const CHART_TYPES = [
  { id: 'bar', label: 'Bar Chart', icon: BarChart },
  { id: 'line', label: 'Line Chart', icon: LineChart },
  { id: 'pie', label: 'Pie Chart', icon: PieChart },
  { id: 'area', label: 'Area Chart', icon: BarChart },
];

export function WidgetConfigPanel({
  open,
  onClose,
  widget,
  onSave,
}: WidgetConfigPanelProps) {
  const [config, setConfig] = useState<WidgetConfig>(widget.config || {
    dataSource: 'executions',
    refreshInterval: 30,
    displayType: 'chart',
    chartType: 'bar',
    showHeader: true,
    showFooter: false,
    maxItems: 10,
    theme: 'default',
    autoRefresh: true,
    dateRange: '24h',
    columns: 1,
  });

  const handleSave = () => {
    onSave(widget.id, config);
    onClose();
  };

  const updateConfig = (key: keyof WidgetConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Configure Widget
          </DialogTitle>
          <DialogDescription>
            Customize <span className="font-medium text-foreground">{widget.name || widget.type}</span> settings
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <Tabs defaultValue="data" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6">
              <TabsTrigger value="data" className="gap-2">
                <Database className="w-3.5 h-3.5" />
                Data Source
              </TabsTrigger>
              <TabsTrigger value="refresh" className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </TabsTrigger>
              <TabsTrigger value="display" className="gap-2">
                <Palette className="w-3.5 h-3.5" />
                Display
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              {/* Data Source Tab */}
              <TabsContent value="data" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Data Source</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Select the data source for this widget
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {DATA_SOURCES.map((source) => {
                        const Icon = source.icon;
                        const isSelected = config.dataSource === source.id;
                        return (
                          <button
                            key={source.id}
                            onClick={() => updateConfig('dataSource', source.id)}
                            className={cn(
                              'p-3 rounded-lg border text-left transition-all',
                              isSelected
                                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                                : 'border-border bg-card hover:bg-muted/50'
                            )}
                          >
                            <Icon className={cn('w-4 h-4 mb-2', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                            <p className="text-xs font-medium">{source.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium">Date Range</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Time period for data display
                    </p>
                    <Select
                      value={config.dateRange}
                      onValueChange={(v) => updateConfig('dateRange', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">Last 1 hour</SelectItem>
                        <SelectItem value="24h">Last 24 hours</SelectItem>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Environment Filter</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Filter data by environment
                    </p>
                    <Select
                      value={config.environment || 'all'}
                      onValueChange={(v) => updateConfig('environment', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Environments</SelectItem>
                        <SelectItem value="dev">Development</SelectItem>
                        <SelectItem value="uat">UAT</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="preprod">Pre-Production</SelectItem>
                        <SelectItem value="prod">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Max Items</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Maximum number of items to display: {config.maxItems}
                    </p>
                    <Slider
                      value={[config.maxItems || 10]}
                      onValueChange={([v]) => updateConfig('maxItems', v)}
                      min={1}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Refresh Tab */}
              <TabsContent value="refresh" className="mt-0 space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Auto Refresh</p>
                    <p className="text-xs text-muted-foreground">
                      Automatically update widget data
                    </p>
                  </div>
                  <Switch
                    checked={config.autoRefresh}
                    onCheckedChange={(v) => updateConfig('autoRefresh', v)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Refresh Interval</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    How often to fetch new data
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {REFRESH_INTERVALS.map((interval) => {
                      const isSelected = config.refreshInterval === interval.value;
                      return (
                        <button
                          key={interval.value}
                          onClick={() => updateConfig('refreshInterval', interval.value)}
                          disabled={!config.autoRefresh && interval.value !== 0}
                          className={cn(
                            'p-3 rounded-lg border text-center transition-all',
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-card hover:bg-muted/50',
                            !config.autoRefresh && interval.value !== 0 && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <Clock className={cn('w-4 h-4 mx-auto mb-1', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                          <p className="text-xs font-medium">{interval.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Current Setting</p>
                      <p className="text-xs text-muted-foreground">
                        {config.autoRefresh
                          ? `Refreshing every ${config.refreshInterval} seconds`
                          : 'Manual refresh only'}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Display Tab */}
              <TabsContent value="display" className="mt-0 space-y-6">
                <div>
                  <Label className="text-sm font-medium">Custom Title</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Override the default widget title
                  </p>
                  <Input
                    value={config.customTitle || ''}
                    onChange={(e) => updateConfig('customTitle', e.target.value)}
                    placeholder={widget.name || widget.type}
                  />
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Display Type</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    How to visualize the data
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {(['chart', 'table', 'cards', 'list'] as const).map((type) => {
                      const isSelected = config.displayType === type;
                      return (
                        <button
                          key={type}
                          onClick={() => updateConfig('displayType', type)}
                          className={cn(
                            'p-3 rounded-lg border text-center transition-all capitalize',
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-card hover:bg-muted/50'
                          )}
                        >
                          <p className="text-xs font-medium">{type}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {config.displayType === 'chart' && (
                  <div>
                    <Label className="text-sm font-medium">Chart Type</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Select chart visualization
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {CHART_TYPES.map((chart) => {
                        const Icon = chart.icon;
                        const isSelected = config.chartType === chart.id;
                        return (
                          <button
                            key={chart.id}
                            onClick={() => updateConfig('chartType', chart.id as any)}
                            className={cn(
                              'p-3 rounded-lg border text-center transition-all',
                              isSelected
                                ? 'border-primary bg-primary/10'
                                : 'border-border bg-card hover:bg-muted/50'
                            )}
                          >
                            <Icon className={cn('w-4 h-4 mx-auto mb-1', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                            <p className="text-xs font-medium">{chart.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Theme</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Widget appearance preset
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['default', 'compact', 'detailed'] as const).map((theme) => {
                      const isSelected = config.theme === theme;
                      return (
                        <button
                          key={theme}
                          onClick={() => updateConfig('theme', theme)}
                          className={cn(
                            'p-3 rounded-lg border text-center transition-all capitalize',
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-card hover:bg-muted/50'
                          )}
                        >
                          <p className="text-xs font-medium">{theme}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Show Header</p>
                    <p className="text-xs text-muted-foreground">Display widget title bar</p>
                  </div>
                  <Switch
                    checked={config.showHeader}
                    onCheckedChange={(v) => updateConfig('showHeader', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Show Footer</p>
                    <p className="text-xs text-muted-foreground">Display last updated time</p>
                  </div>
                  <Switch
                    checked={config.showFooter}
                    onCheckedChange={(v) => updateConfig('showFooter', v)}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WidgetConfigPanel;
