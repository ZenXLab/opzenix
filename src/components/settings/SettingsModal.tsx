import { useState, useEffect } from 'react';
import { Settings, Check, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTheme, Theme } from '@/hooks/useTheme';

type ColorTheme = 'obsidian' | 'midnight' | 'ocean' | 'forest';

interface ThemeOption {
  id: ColorTheme;
  name: string;
  description: string;
  colors: { primary: string; accent: string; bg: string };
}

const colorThemes: ThemeOption[] = [
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

export function SettingsModal() {
  const { theme, setTheme } = useTheme();
  const [colorTheme, setColorTheme] = useState<ColorTheme>('obsidian');

  useEffect(() => {
    const saved = localStorage.getItem('opzenix-color-theme') as ColorTheme;
    if (saved) setColorTheme(saved);
  }, []);

  const handleColorThemeChange = (newTheme: ColorTheme) => {
    setColorTheme(newTheme);
    localStorage.setItem('opzenix-color-theme', newTheme);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your Opzenix experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Light/Dark Mode */}
          <div>
            <Label className="text-sm font-medium">Appearance</Label>
            <p className="text-xs text-muted-foreground mb-3">Choose light or dark mode</p>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="flex-1 gap-2"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="flex-1 gap-2"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
            </div>
          </div>

          {/* Color Theme */}
          <div>
            <Label className="text-sm font-medium">Color Theme</Label>
            <p className="text-xs text-muted-foreground mb-3">Choose your preferred color accent</p>
            <div className="grid grid-cols-2 gap-3">
              {colorThemes.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => handleColorThemeChange(ct.id)}
                  className={cn(
                    'relative flex flex-col items-start rounded-lg border-2 p-3 text-left transition-all',
                    colorTheme === ct.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  )}
                >
                  {colorTheme === ct.id && (
                    <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="mb-3 flex gap-1.5">
                    <div className={cn('h-6 w-6 rounded', ct.colors.bg)} />
                    <div className={cn('h-6 w-6 rounded', ct.colors.primary)} />
                    <div className={cn('h-6 w-6 rounded', ct.colors.accent)} />
                  </div>
                  <span className="text-sm font-medium">{ct.name}</span>
                  <span className="text-xs text-muted-foreground">{ct.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
