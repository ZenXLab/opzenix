import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

export type ThemeOption = 'obsidian' | 'midnight' | 'ocean' | 'forest';

interface UiPreferences {
  theme?: ThemeOption;
  typography?: string;
  iconStyle?: string;
  [key: string]: unknown;
}

const themes: { id: ThemeOption; name: string; description: string; colors: { primary: string; accent: string; bg: string } }[] = [
  {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'Deep dark with violet accents',
    colors: { primary: 'bg-violet-500', accent: 'bg-violet-400', bg: 'bg-zinc-900' },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Navy blue enterprise theme',
    colors: { primary: 'bg-blue-500', accent: 'bg-blue-400', bg: 'bg-slate-900' },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Teal and cyan modern look',
    colors: { primary: 'bg-cyan-500', accent: 'bg-teal-400', bg: 'bg-slate-800' },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural greens for focus',
    colors: { primary: 'bg-emerald-500', accent: 'bg-green-400', bg: 'bg-neutral-900' },
  },
];

export function ThemeSelector() {
  const [value, setValue] = useState<ThemeOption>('obsidian');

  useEffect(() => {
    const loadPreference = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('user_preferences').select('ui_preferences').eq('user_id', user.id).maybeSingle();
      const uiPrefs = data?.ui_preferences as UiPreferences | null;
      if (uiPrefs?.theme) setValue(uiPrefs.theme);
    };
    loadPreference();
  }, []);

  const handleChange = async (theme: ThemeOption) => {
    setValue(theme);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: existing } = await supabase.from('user_preferences').select('ui_preferences').eq('user_id', user.id).maybeSingle();
    const currentPrefs = (existing?.ui_preferences as UiPreferences) || {};
    
    await supabase.from('user_preferences').upsert({ 
      user_id: user.id, 
      ui_preferences: { ...currentPrefs, theme } 
    }, { onConflict: 'user_id' });
  };

  return (
    <div>
      <Label className="text-sm font-medium">Theme</Label>
      <p className="text-xs text-muted-foreground mb-3">Choose your preferred color theme</p>
      <div className="grid grid-cols-2 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleChange(theme.id)}
            className={cn(
              'relative flex flex-col items-start rounded-lg border-2 p-3 text-left transition-all',
              value === theme.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            {value === theme.id && (
              <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
            <div className="mb-3 flex gap-1.5">
              <div className={cn('h-6 w-6 rounded', theme.colors.bg)} />
              <div className={cn('h-6 w-6 rounded', theme.colors.primary)} />
              <div className={cn('h-6 w-6 rounded', theme.colors.accent)} />
            </div>
            <span className="text-sm font-medium">{theme.name}</span>
            <span className="text-xs text-muted-foreground">{theme.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}