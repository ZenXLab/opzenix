import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, X, Monitor, Wrench, Eye, Palette, 
  Layout, Moon, Sun, Save, RotateCcw, Cloud, 
  Container, Server, Key, CheckCircle2, AlertCircle,
  Building2, User, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { toast } from 'sonner';
import { ProfileTab } from './ProfileTab';
import { OrganizationTab } from './OrganizationTab';
import { DeploymentHistoryTab } from './DeploymentHistoryTab';
import { ThemeSelector } from './ThemeSelector';
import { TypographySelector } from './TypographySelector';
import { IconStyleSelector } from './IconStyleSelector';

interface UserSettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function UserSettingsPanel({ open, onClose }: UserSettingsPanelProps) {
  const { preferences, updatePreferences, loading } = useUserPreferences();
  
  // Local state for form
  const [defaultMode, setDefaultMode] = useState<string>('monitor');
  const [compactMode, setCompactMode] = useState(false);
  const [showWidgetTitles, setShowWidgetTitles] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('30');
  const [dashboardLayout, setDashboardLayout] = useState<string>('grid');
  const [showMetricCards, setShowMetricCards] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load preferences when they're available
  useEffect(() => {
    if (preferences?.ui_preferences) {
      const uiPrefs = preferences.ui_preferences;
      setCompactMode(uiPrefs.compactMode ?? false);
      setShowWidgetTitles(uiPrefs.showWidgetTitles ?? true);
      setAutoRefresh(uiPrefs.autoRefresh ?? true);
      setRefreshInterval(uiPrefs.refreshInterval ?? '30');
      setDashboardLayout(uiPrefs.dashboardLayout ?? 'grid');
      setShowMetricCards(uiPrefs.showMetricCards ?? true);
      setAnimationsEnabled(uiPrefs.animationsEnabled ?? true);
    }
    if (preferences?.default_mode) {
      setDefaultMode(preferences.default_mode);
    }
  }, [preferences]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences({
        default_mode: defaultMode,
        ui_preferences: {
          compactMode,
          showWidgetTitles,
          autoRefresh,
          refreshInterval,
          dashboardLayout,
          showMetricCards,
          animationsEnabled,
        }
      });
      toast.success('Settings saved successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDefaultMode('monitor');
    setCompactMode(false);
    setShowWidgetTitles(true);
    setAutoRefresh(true);
    setRefreshInterval('30');
    setDashboardLayout('grid');
    setShowMetricCards(true);
    setAnimationsEnabled(true);
    toast.info('Settings reset to defaults');
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            User Settings
          </SheetTitle>
          <SheetDescription>
            Customize your dashboard experience and preferences
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="grid w-full grid-cols-6 h-auto">
            <TabsTrigger value="profile" className="gap-1 text-xs px-2">
              <User className="w-3 h-3" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-1 text-xs px-2">
              <Building2 className="w-3 h-3" />
              Org
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1 text-xs px-2">
              <History className="w-3 h-3" />
              History
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-1 text-xs px-2">
              <Monitor className="w-3 h-3" />
              General
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-1 text-xs px-2">
              <Layout className="w-3 h-3" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1 text-xs px-2">
              <Palette className="w-3 h-3" />
              Theme
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <ProfileTab />
          </TabsContent>

          {/* Organization Tab */}
          <TabsContent value="organization" className="mt-6">
            <OrganizationTab />
          </TabsContent>

          {/* Deployment History Tab */}
          <TabsContent value="history" className="mt-6">
            <DeploymentHistoryTab />
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Default Mode</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Choose which mode to show when you first open the app
                </p>
                <RadioGroup 
                  value={defaultMode} 
                  onValueChange={setDefaultMode}
                  className="grid grid-cols-1 gap-2"
                >
                  <Label
                    htmlFor="monitor"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-secondary/50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
                  >
                    <RadioGroupItem value="monitor" id="monitor" />
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-sec-safe" />
                      <div>
                        <span className="font-medium text-sm">Monitor Mode</span>
                        <p className="text-xs text-muted-foreground">View-only dashboards and metrics</p>
                      </div>
                    </div>
                  </Label>
                  <Label
                    htmlFor="build"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-secondary/50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
                  >
                    <RadioGroupItem value="build" id="build" />
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-ai-primary" />
                      <div>
                        <span className="font-medium text-sm">Build & Deploy Mode</span>
                        <p className="text-xs text-muted-foreground">Create and manage pipelines</p>
                      </div>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto-refresh Data</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically refresh dashboard data
                  </p>
                </div>
                <Switch 
                  checked={autoRefresh} 
                  onCheckedChange={setAutoRefresh} 
                />
              </div>

              {autoRefresh && (
                <div className="pl-4 border-l-2 border-border">
                  <Label className="text-sm">Refresh Interval</Label>
                  <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">Every 10 seconds</SelectItem>
                      <SelectItem value="30">Every 30 seconds</SelectItem>
                      <SelectItem value="60">Every minute</SelectItem>
                      <SelectItem value="300">Every 5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Dashboard Settings */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Dashboard Layout</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Choose how widgets are arranged
                </p>
                <RadioGroup 
                  value={dashboardLayout} 
                  onValueChange={setDashboardLayout}
                  className="grid grid-cols-2 gap-2"
                >
                  <Label
                    htmlFor="grid"
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
                  >
                    <RadioGroupItem value="grid" id="grid" className="sr-only" />
                    <div className="grid grid-cols-3 gap-1 w-12 h-8">
                      <div className="bg-primary/60 rounded-sm" />
                      <div className="bg-primary/60 rounded-sm" />
                      <div className="bg-primary/60 rounded-sm" />
                      <div className="bg-primary/40 rounded-sm col-span-2" />
                      <div className="bg-primary/40 rounded-sm" />
                    </div>
                    <span className="text-xs font-medium">Grid</span>
                  </Label>
                  <Label
                    htmlFor="list"
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
                  >
                    <RadioGroupItem value="list" id="list" className="sr-only" />
                    <div className="flex flex-col gap-1 w-12 h-8">
                      <div className="bg-primary/60 rounded-sm h-2" />
                      <div className="bg-primary/50 rounded-sm h-2" />
                      <div className="bg-primary/40 rounded-sm h-2" />
                    </div>
                    <span className="text-xs font-medium">List</span>
                  </Label>
                </RadioGroup>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Show Metric Cards</Label>
                  <p className="text-xs text-muted-foreground">
                    Display key metrics at the top of dashboard
                  </p>
                </div>
                <Switch 
                  checked={showMetricCards} 
                  onCheckedChange={setShowMetricCards} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Show Widget Titles</Label>
                  <p className="text-xs text-muted-foreground">
                    Display titles on dashboard widgets
                  </p>
                </div>
                <Switch 
                  checked={showWidgetTitles} 
                  onCheckedChange={setShowWidgetTitles} 
                />
              </div>
            </div>
          </TabsContent>

          {/* Appearance Settings - Now with Theme, Typography, Icons */}
          <TabsContent value="appearance" className="space-y-6 mt-6">
            <div className="space-y-6">
              {/* Theme Selector */}
              <ThemeSelector />

              <Separator />

              {/* Typography Selector */}
              <TypographySelector />

              <Separator />

              {/* Icon Style Selector */}
              <IconStyleSelector />

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Compact Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Reduce spacing and padding
                  </p>
                </div>
                <Switch 
                  checked={compactMode} 
                  onCheckedChange={setCompactMode} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Enable Animations</Label>
                  <p className="text-xs text-muted-foreground">
                    Show smooth transitions and effects
                  </p>
                </div>
                <Switch 
                  checked={animationsEnabled} 
                  onCheckedChange={setAnimationsEnabled} 
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-6 flex gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}