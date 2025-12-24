import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TypographyOption = 'default' | 'compact' | 'comfortable' | 'large';

interface TypographySelectorProps {
  value: TypographyOption;
  onChange: (typography: TypographyOption) => void;
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

export function TypographySelector({ value, onChange }: TypographySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {typographyOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
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
          
          {/* Typography Preview */}
          <div className="mb-2 space-y-1">
            <div className={cn('font-semibold text-foreground', option.preview.title)}>Aa</div>
            <div className={cn('text-muted-foreground', option.preview.body)}>Sample text</div>
          </div>
          
          <span className="text-sm font-medium">{option.name}</span>
          <span className="text-xs text-muted-foreground">{option.description}</span>
        </button>
      ))}
    </div>
  );
}
