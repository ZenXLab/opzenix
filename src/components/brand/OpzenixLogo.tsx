import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface OpzenixLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'default' | 'white' | 'dark';
  animate?: boolean;
}

const OpzenixLogo = ({ 
  className, 
  size = 'md', 
  showText = true,
  variant = 'default',
  animate = true
}: OpzenixLogoProps) => {
  const sizes = {
    sm: { icon: 'w-7 h-7', text: 'text-sm', gap: 'gap-1.5', subtext: 'text-[8px]' },
    md: { icon: 'w-9 h-9', text: 'text-lg', gap: 'gap-2', subtext: 'text-[9px]' },
    lg: { icon: 'w-11 h-11', text: 'text-xl', gap: 'gap-2.5', subtext: 'text-[10px]' },
    xl: { icon: 'w-14 h-14', text: 'text-2xl', gap: 'gap-3', subtext: 'text-[11px]' },
  };

  const textColors = {
    default: 'text-foreground',
    white: 'text-white',
    dark: 'text-slate-900',
  };

  return (
    <div className={cn('flex items-center', sizes[size].gap, className)}>
      {/* Unique DevOps + Security Logo - Infinity Shield Concept */}
      <div className={cn(
        sizes[size].icon,
        'relative rounded-xl overflow-hidden flex items-center justify-center',
        'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700',
        'shadow-lg shadow-blue-500/30'
      )}>
        <svg 
          viewBox="0 0 48 48" 
          className="w-full h-full p-1"
          fill="none"
        >
          <defs>
            {/* Gradient definitions */}
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.95" />
              <stop offset="100%" stopColor="white" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0.9" />
              <stop offset="50%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          
          {/* Shield outline - Security foundation */}
          <motion.path 
            d="M24 4L8 10V22C8 32 15 40 24 44C33 40 40 32 40 22V10L24 4Z" 
            fill="none"
            stroke="url(#shieldGrad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={animate ? { pathLength: 1 } : { pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Infinity symbol - DevOps continuous flow */}
          <motion.path
            d="M16 24C16 24 18 20 21 20C24 20 24 24 24 24C24 24 24 28 27 28C30 28 32 24 32 24C32 24 30 20 27 20C24 20 24 24 24 24C24 24 24 28 21 28C18 28 16 24 16 24Z"
            stroke="url(#flowGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={animate ? { pathLength: 1 } : { pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
          />
          
          {/* Node points - Control points in the flow */}
          <motion.circle 
            cx="16" cy="24" r="2" 
            fill="white"
            initial={{ scale: 0 }}
            animate={animate ? { scale: 1 } : { scale: 1 }}
            transition={{ delay: 1.2 }}
          />
          <motion.circle 
            cx="32" cy="24" r="2" 
            fill="white"
            initial={{ scale: 0 }}
            animate={animate ? { scale: 1 } : { scale: 1 }}
            transition={{ delay: 1.3 }}
          />
          <motion.circle 
            cx="24" cy="24" r="2.5" 
            fill="white"
            initial={{ scale: 0 }}
            animate={animate ? { scale: 1 } : { scale: 1 }}
            transition={{ delay: 1.4 }}
          />
          
          {/* Pulse effect at center */}
          {animate && (
            <circle cx="24" cy="24" r="4" fill="white" fillOpacity="0.2">
              <animate 
                attributeName="r" 
                values="3;6;3" 
                dur="2s" 
                repeatCount="indefinite" 
              />
              <animate 
                attributeName="fill-opacity" 
                values="0.3;0.1;0.3" 
                dur="2s" 
                repeatCount="indefinite" 
              />
            </circle>
          )}
          
          {/* Top checkmark - Governance verified */}
          <motion.path
            d="M20 13L23 16L28 11"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={animate ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.4 }}
          />
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
            sizes[size].subtext,
            'font-medium tracking-widest uppercase opacity-60 leading-none mt-0.5',
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
