import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ThemeOption = 'obsidian' | 'midnight' | 'ocean' | 'forest';

interface ThemeSelectorProps {
  value: ThemeOption;
  onChange: (theme: ThemeOption) => void;
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

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {themes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onChange(theme.id)}
          className={cn(
            'relative flex flex-col items-start rounded-lg border-2 p-3 text-left transition-all',
            value === theme.id
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          {value === theme.id && (
            <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
          
          {/* Theme Preview */}
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
  );
}
