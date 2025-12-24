import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Widget {
  id: string;
  type: string;
  size: 'small' | 'medium' | 'large';
  name?: string;
  executionId?: string;
  order: number;
}

interface DashboardLayout {
  id: string;
  name: string;
  widgets: Widget[];
  isDefault: boolean;
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'w1', type: 'actions', size: 'small', name: 'Quick Actions', order: 0 },
  { id: 'w2', type: 'system-health', size: 'medium', name: 'System Health', order: 1 },
  { id: 'w3', type: 'deployments', size: 'medium', name: 'Deployments', order: 2 },
  { id: 'w4', type: 'pipelines', size: 'small', name: 'Pipeline Status', order: 3 },
  { id: 'w5', type: 'audit', size: 'medium', name: 'Audit Activity', order: 4 },
  { id: 'w6', type: 'api', size: 'small', name: 'API Performance', order: 5 },
];

export function useDashboardLayout() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch layout from database
  const fetchLayout = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Use default layout for non-authenticated users
        setWidgets(DEFAULT_WIDGETS);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (error && error.code === 'PGRST116') {
        // No layout exists, create default
        const { data: newLayout, error: createError } = await supabase
          .from('dashboard_layouts')
          .insert([{
            user_id: user.id,
            name: 'Default',
            layout: DEFAULT_WIDGETS as any,
            is_default: true
          }])
          .select()
          .single();

        if (!createError && newLayout) {
          setLayoutId(newLayout.id);
          const layoutData = newLayout.layout as unknown as Widget[];
          setWidgets(Array.isArray(layoutData) ? layoutData : DEFAULT_WIDGETS);
        }
      } else if (data) {
        setLayoutId(data.id);
        const layoutData = data.layout as unknown as Widget[];
        setWidgets(Array.isArray(layoutData) ? layoutData : DEFAULT_WIDGETS);
      }
    } catch (error) {
      console.error('Error fetching dashboard layout:', error);
      setWidgets(DEFAULT_WIDGETS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save layout to database (debounced)
  const saveLayout = useCallback(async (newWidgets: Widget[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    try {
      if (layoutId) {
        await supabase
          .from('dashboard_layouts')
          .update({ 
            layout: newWidgets as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', layoutId);
      } else {
        const { data } = await supabase
          .from('dashboard_layouts')
          .insert([{
            user_id: user.id,
            name: 'Default',
            layout: newWidgets as any,
            is_default: true
          }])
          .select()
          .single();
        
        if (data) {
          setLayoutId(data.id);
        }
      }
    } catch (error) {
      console.error('Error saving layout:', error);
    } finally {
      setSaving(false);
    }
  }, [layoutId]);

  // Update widgets and persist
  const updateWidgets = useCallback((newWidgets: Widget[]) => {
    // Add order to widgets
    const orderedWidgets = newWidgets.map((w, idx) => ({ ...w, order: idx }));
    setWidgets(orderedWidgets);
    saveLayout(orderedWidgets);
  }, [saveLayout]);

  // Add widget
  const addWidget = useCallback((type: string, name: string, size: 'small' | 'medium' | 'large' = 'small') => {
    const newWidget: Widget = {
      id: `w-${Date.now()}`,
      type,
      size,
      name,
      order: widgets.length,
      executionId: `exec-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`
    };
    const newWidgets = [...widgets, newWidget];
    updateWidgets(newWidgets);
    return newWidget;
  }, [widgets, updateWidgets]);

  // Remove widget
  const removeWidget = useCallback((id: string) => {
    const newWidgets = widgets.filter(w => w.id !== id);
    updateWidgets(newWidgets);
  }, [widgets, updateWidgets]);

  // Rename widget
  const renameWidget = useCallback((id: string, newName: string) => {
    const newWidgets = widgets.map(w => 
      w.id === id ? { ...w, name: newName } : w
    );
    updateWidgets(newWidgets);
  }, [widgets, updateWidgets]);

  // Duplicate widget
  const duplicateWidget = useCallback((id: string) => {
    const widget = widgets.find(w => w.id === id);
    if (widget) {
      const newWidget: Widget = {
        ...widget,
        id: `w-${Date.now()}`,
        name: `${widget.name || widget.type} (copy)`,
        order: widgets.length
      };
      const newWidgets = [...widgets, newWidget];
      updateWidgets(newWidgets);
    }
  }, [widgets, updateWidgets]);

  // Reorder widgets
  const reorderWidgets = useCallback((newOrder: Widget[]) => {
    updateWidgets(newOrder);
  }, [updateWidgets]);

  // Move widget to specific position
  const moveWidget = useCallback((fromIndex: number, toIndex: number) => {
    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(fromIndex, 1);
    newWidgets.splice(toIndex, 0, removed);
    updateWidgets(newWidgets);
  }, [widgets, updateWidgets]);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    updateWidgets(DEFAULT_WIDGETS);
    toast.success('Dashboard reset to default layout');
  }, [updateWidgets]);

  useEffect(() => {
    fetchLayout();
  }, [fetchLayout]);

  return {
    widgets,
    loading,
    saving,
    addWidget,
    removeWidget,
    renameWidget,
    duplicateWidget,
    reorderWidgets,
    moveWidget,
    resetLayout,
    refetch: fetchLayout
  };
}
