import { Check, Box, Circle, Hexagon, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

export type IconStyleOption = 'default' | 'rounded' | 'sharp' | 'outlined';

interface IconStyleSelectorProps {
  value: IconStyleOption;
  onChange: (style: IconStyleOption) => void;
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

export function IconStyleSelector({ value, onChange }: IconStyleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {iconStyles.map((style) => (
        <button
          key={style.id}
          onClick={() => onChange(style.id)}
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
          
          {/* Icon Preview */}
          <div className="mb-3">
            <style.Icon className="h-8 w-8 text-primary" strokeWidth={value === 'outlined' ? 1 : 2} />
          </div>
          
          <span className="text-sm font-medium">{style.name}</span>
          <span className="text-xs text-muted-foreground">{style.description}</span>
        </button>
      ))}
    </div>
  );
}
