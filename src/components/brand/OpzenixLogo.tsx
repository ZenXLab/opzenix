import { cn } from '@/lib/utils';

interface OpzenixLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'white' | 'dark';
}

const OpzenixLogo = ({ 
  className, 
  size = 'md', 
  showText = true,
  variant = 'default' 
}: OpzenixLogoProps) => {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-sm', gap: 'gap-1.5' },
    md: { icon: 'w-8 h-8', text: 'text-lg', gap: 'gap-2' },
    lg: { icon: 'w-10 h-10', text: 'text-xl', gap: 'gap-2.5' },
    xl: { icon: 'w-14 h-14', text: 'text-2xl', gap: 'gap-3' },
  };

  const textColors = {
    default: 'text-foreground',
    white: 'text-white',
    dark: 'text-slate-900',
  };

  return (
    <div className={cn('flex items-center', sizes[size].gap, className)}>
      {/* Unique Opzenix Logo Mark */}
      <div className={cn(
        sizes[size].icon,
        'relative rounded-xl overflow-hidden flex items-center justify-center',
        'bg-gradient-to-br from-primary via-primary to-primary/80',
        'shadow-lg shadow-primary/25'
      )}>
        {/* Hexagonal inner pattern */}
        <svg 
          viewBox="0 0 40 40" 
          className="w-full h-full"
          fill="none"
        >
          {/* Background gradient */}
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="innerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.9" />
              <stop offset="100%" stopColor="white" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          
          {/* Outer hexagon frame */}
          <path 
            d="M20 4L34 12V28L20 36L6 28V12L20 4Z" 
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeOpacity="0.3"
          />
          
          {/* Central Z with flow lines - representing execution flows */}
          <path 
            d="M12 13H28L14 27H30" 
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Connection nodes representing control points */}
          <circle cx="12" cy="13" r="2.5" fill="white" />
          <circle cx="28" cy="13" r="2.5" fill="white" />
          <circle cx="14" cy="27" r="2.5" fill="white" />
          <circle cx="30" cy="27" r="2.5" fill="white" />
          
          {/* Pulse effect dot in center */}
          <circle cx="20" cy="20" r="3" fill="white" fillOpacity="0.4">
            <animate 
              attributeName="r" 
              values="2;4;2" 
              dur="2s" 
              repeatCount="indefinite" 
            />
            <animate 
              attributeName="fill-opacity" 
              values="0.6;0.2;0.6" 
              dur="2s" 
              repeatCount="indefinite" 
            />
          </circle>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            sizes[size].text,
            'font-bold tracking-tight leading-none',
            textColors[variant]
          )}>
            Opzenix
          </span>
          <span className={cn(
            'text-[9px] font-medium tracking-widest uppercase opacity-60 leading-none mt-0.5',
            textColors[variant]
          )}>
            by CropXon
          </span>
        </div>
      )}
    </div>
  );
};

export default OpzenixLogo;
