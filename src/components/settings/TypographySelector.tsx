import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

export type TypographyOption = 'default' | 'compact' | 'comfortable' | 'large';

interface UiPreferences {
  theme?: string;
  typography?: TypographyOption;
  iconStyle?: string;
  [key: string]: unknown;
}

const typographyOptions: { id: TypographyOption; name: string; description: string; preview: { title: string; body: string } }[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Balanced for most screens',
    preview: { title: 'text-base', body: 'text-sm' },
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Dense information display',
    preview: { title: 'text-sm', body: 'text-xs' },
  },
  {
    id: 'comfortable',
    name: 'Comfortable',
    description: 'Relaxed spacing and sizing',
    preview: { title: 'text-lg', body: 'text-base' },
  },
  {
    id: 'large',
    name: 'Large',
    description: 'Accessibility focused',
    preview: { title: 'text-xl', body: 'text-lg' },
  },
];

export function TypographySelector() {
  const [value, setValue] = useState<TypographyOption>('default');

  useEffect(() => {
    const loadPreference = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('user_preferences').select('ui_preferences').eq('user_id', user.id).maybeSingle();
      const uiPrefs = data?.ui_preferences as UiPreferences | null;
      if (uiPrefs?.typography) setValue(uiPrefs.typography);
    };
    loadPreference();
  }, []);

  const handleChange = async (typography: TypographyOption) => {
    setValue(typography);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: existing } = await supabase.from('user_preferences').select('ui_preferences').eq('user_id', user.id).maybeSingle();
    const currentPrefs = (existing?.ui_preferences as UiPreferences) || {};
    
    await supabase.from('user_preferences').upsert({ 
      user_id: user.id, 
      ui_preferences: { ...currentPrefs, typography } 
    }, { onConflict: 'user_id' });
  };

  return (
    <div>
      <Label className="text-sm font-medium">Typography</Label>
      <p className="text-xs text-muted-foreground mb-3">Choose your preferred text sizing</p>
      <div className="grid grid-cols-2 gap-3">
        {typographyOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleChange(option.id)}
            className={cn(
              'relative flex flex-col items-start rounded-lg border-2 p-3 text-left transition-all',
              value === option.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            {value === option.id && (
              <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
            
            <div className="mb-2 space-y-1">
              <div className={cn('font-semibold text-foreground', option.preview.title)}>Aa</div>
              <div className={cn('text-muted-foreground', option.preview.body)}>Sample text</div>
            </div>
            
            <span className="text-sm font-medium">{option.name}</span>
            <span className="text-xs text-muted-foreground">{option.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
