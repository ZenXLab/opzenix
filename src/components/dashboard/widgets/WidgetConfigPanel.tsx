import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  X,
  Clock,
  TrendingUp,
  AlertTriangle,
  Save,
  RotateCcw,
  Gauge,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { WidgetConfig, WidgetThreshold, DEFAULT_WIDGET_CONFIG } from '@/types/opzenix-widgets';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WidgetConfigPanelProps {
  open: boolean;
  onClose: () => void;
  widgetId: string;
  widgetType: string;
  widgetTitle: string;
  initialConfig?: WidgetConfig;
  onSave: (config: WidgetConfig) => void;
}

const PRESET_THRESHOLDS: Record<string, WidgetThreshold[]> = {
  'environment-health': [
    { id: 't1', name: 'Response Time', value: 200, unit: 'ms', warningLevel: 500, criticalLevel: 1000 },
    { id: 't2', name: 'Error Rate', value: 1, unit: '%', warningLevel: 5, criticalLevel: 10 },
  ],
  'pipeline-status': [
    { id: 't1', name: 'Build Time', value: 5, unit: 'min', warningLevel: 10, criticalLevel: 20 },
    { id: 't2', name: 'Queue Wait', value: 1, unit: 'min', warningLevel: 5, criticalLevel: 10 },
  ],
  'test-coverage': [
    { id: 't1', name: 'Coverage', value: 80, unit: '%', warningLevel: 70, criticalLevel: 50 },
  ],
  'security-scan': [
    { id: 't1', name: 'Critical Issues', value: 0, unit: '', warningLevel: 1, criticalLevel: 3 },
    { id: 't2', name: 'High Issues', value: 0, unit: '', warningLevel: 5, criticalLevel: 10 },
  ],
  'runtime-health': [
    { id: 't1', name: 'Error Rate', value: 0.1, unit: '%', warningLevel: 1, criticalLevel: 5 },
    { id: 't2', name: 'Latency P99', value: 100, unit: 'ms', warningLevel: 500, criticalLevel: 1000 },
  ],
  'slo-snapshot': [
    { id: 't1', name: 'Availability', value: 99.9, unit: '%', warningLevel: 99.5, criticalLevel: 99 },
    { id: 't2', name: 'Latency Target', value: 200, unit: 'ms', warningLevel: 300, criticalLevel: 500 },
  ],
};

const REFRESH_INTERVALS = [
  { value: 5, label: '5 seconds' },
  { value: 15, label: '15 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
];

export function WidgetConfigPanel({
  open,
  onClose,
  widgetId,
  widgetType,
  widgetTitle,
  initialConfig,
  onSave,
}: WidgetConfigPanelProps) {
  const [config, setConfig] = useState<WidgetConfig>(
    initialConfig || {
      ...DEFAULT_WIDGET_CONFIG,
      thresholds: PRESET_THRESHOLDS[widgetType] || [],
    }
  );
  const [hasChanges, setHasChanges] = useState(false);

  const updateConfig = <K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateThreshold = (id: string, field: keyof WidgetThreshold, value: any) => {
    const newThresholds = config.thresholds.map((t) =>
      t.id === id ? { ...t, [field]: value } : t
    );
    updateConfig('thresholds', newThresholds);
  };

  const addThreshold = () => {
    const newThreshold: WidgetThreshold = {
      id: `t-${Date.now()}`,
      name: 'New Metric',
      value: 0,
      unit: '',
      warningLevel: 50,
      criticalLevel: 80,
    };
    updateConfig('thresholds', [...config.thresholds, newThreshold]);
  };

  const removeThreshold = (id: string) => {
    updateConfig(
      'thresholds',
      config.thresholds.filter((t) => t.id !== id)
    );
  };

  const handleSave = () => {
    onSave(config);
    setHasChanges(false);
    toast.success('Widget configuration saved');
    onClose();
  };

  const handleReset = () => {
    setConfig({
      ...DEFAULT_WIDGET_CONFIG,
      thresholds: PRESET_THRESHOLDS[widgetType] || [],
    });
    setHasChanges(true);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg">{widgetTitle}</SheetTitle>
                <SheetDescription className="text-xs mt-0.5">
                  Configure metrics, thresholds, and display options
                </SheetDescription>
              </div>
            </div>
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Unsaved
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Refresh Interval */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Label className="font-medium">Refresh Interval</Label>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {REFRESH_INTERVALS.map((interval) => (
                  <Button
                    key={interval.value}
                    variant={config.refreshInterval === interval.value ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => updateConfig('refreshInterval', interval.value)}
                  >
                    {interval.label.replace(' seconds', 's').replace(' minute', 'm').replace('s', 's')}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Display Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <Label className="font-medium">Display Options</Label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Show Trend Indicators</Label>
                  <p className="text-xs text-muted-foreground">Display up/down arrows for metric changes</p>
                </div>
                <Switch
                  checked={config.showTrend}
                  onCheckedChange={(checked) => updateConfig('showTrend', checked)}
                />
              </div>
            </div>

            <Separator />

            {/* Thresholds */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-muted-foreground" />
                  <Label className="font-medium">Metric Thresholds</Label>
                </div>
                <Button variant="outline" size="sm" onClick={addThreshold} className="gap-1.5">
                  <Plus className="w-3 h-3" />
                  Add
                </Button>
              </div>

              <Accordion type="multiple" className="space-y-2">
                {config.thresholds.map((threshold) => (
                  <AccordionItem
                    key={threshold.id}
                    value={threshold.id}
                    className="border border-border rounded-lg px-3"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center justify-between w-full pr-2">
                        <span className="text-sm font-medium">{threshold.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {threshold.value}
                            {threshold.unit}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-4">
                      {/* Threshold Name */}
                      <div className="space-y-2">
                        <Label className="text-xs">Metric Name</Label>
                        <Input
                          value={threshold.name}
                          onChange={(e) => updateThreshold(threshold.id, 'name', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>

                      {/* Current Value */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Target Value</Label>
                          <Input
                            type="number"
                            value={threshold.value}
                            onChange={(e) => updateThreshold(threshold.id, 'value', parseFloat(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Unit</Label>
                          <Input
                            value={threshold.unit}
                            onChange={(e) => updateThreshold(threshold.id, 'unit', e.target.value)}
                            placeholder="ms, %, etc"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      {/* Warning Level */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-sec-warning" />
                            Warning Level
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            {threshold.warningLevel}
                            {threshold.unit}
                          </span>
                        </div>
                        <Slider
                          value={[threshold.warningLevel]}
                          onValueChange={([val]) => updateThreshold(threshold.id, 'warningLevel', val)}
                          max={threshold.criticalLevel * 2}
                          step={1}
                          className="py-2"
                        />
                      </div>

                      {/* Critical Level */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-sec-danger" />
                            Critical Level
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            {threshold.criticalLevel}
                            {threshold.unit}
                          </span>
                        </div>
                        <Slider
                          value={[threshold.criticalLevel]}
                          onValueChange={([val]) => updateThreshold(threshold.id, 'criticalLevel', val)}
                          max={threshold.criticalLevel * 2}
                          step={1}
                          className="py-2"
                        />
                      </div>

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-sec-danger hover:text-sec-danger hover:bg-sec-danger/10"
                        onClick={() => removeThreshold(threshold.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Remove Threshold
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {config.thresholds.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No thresholds configured. Add one to monitor metrics.
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="border-t border-border p-4 gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges} className="gap-1.5">
            <Save className="w-3.5 h-3.5" />
            Save Configuration
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default WidgetConfigPanel;
