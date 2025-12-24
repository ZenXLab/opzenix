import { useState, useEffect } from 'react';
import { Check, Box, Circle, Hexagon, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

export type IconStyleOption = 'default' | 'rounded' | 'sharp' | 'outlined';

interface UiPreferences {
  theme?: string;
  typography?: string;
  iconStyle?: IconStyleOption;
  [key: string]: unknown;
}

const iconStyles: { id: IconStyleOption; name: string; description: string; Icon: typeof Box }[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard Lucide icons',
    Icon: Box,
  },
  {
    id: 'rounded',
    name: 'Rounded',
    description: 'Soft, friendly appearance',
    Icon: Circle,
  },
  {
    id: 'sharp',
    name: 'Sharp',
    description: 'Angular, precise look',
    Icon: Hexagon,
  },
  {
    id: 'outlined',
    name: 'Outlined',
    description: 'Minimal stroke style',
    Icon: Square,
  },
];

export function IconStyleSelector() {
  const [value, setValue] = useState<IconStyleOption>('default');

  useEffect(() => {
    const loadPreference = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('user_preferences').select('ui_preferences').eq('user_id', user.id).maybeSingle();
      const uiPrefs = data?.ui_preferences as UiPreferences | null;
      if (uiPrefs?.iconStyle) setValue(uiPrefs.iconStyle);
    };
    loadPreference();
  }, []);

  const handleChange = async (iconStyle: IconStyleOption) => {
    setValue(iconStyle);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: existing } = await supabase.from('user_preferences').select('ui_preferences').eq('user_id', user.id).maybeSingle();
    const currentPrefs = (existing?.ui_preferences as UiPreferences) || {};
    
    await supabase.from('user_preferences').upsert({ 
      user_id: user.id, 
      ui_preferences: { ...currentPrefs, iconStyle } 
    }, { onConflict: 'user_id' });
  };

  return (
    <div>
      <Label className="text-sm font-medium">Icon Style</Label>
      <p className="text-xs text-muted-foreground mb-3">Choose your preferred icon appearance</p>
      <div className="grid grid-cols-2 gap-3">
        {iconStyles.map((style) => (
          <button
            key={style.id}
            onClick={() => handleChange(style.id)}
            className={cn(
              'relative flex flex-col items-start rounded-lg border-2 p-3 text-left transition-all',
              value === style.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            {value === style.id && (
              <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
            
            <div className="mb-3">
              <style.Icon className="h-8 w-8 text-primary" strokeWidth={value === 'outlined' ? 1 : 2} />
            </div>
            
            <span className="text-sm font-medium">{style.name}</span>
            <span className="text-xs text-muted-foreground">{style.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
