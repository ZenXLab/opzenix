import { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Maximize2, Minimize2, X, GripVertical, MoreVertical,
  RefreshCw, Settings, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface WidgetWrapperProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onRemove?: (id: string) => void;
  onRefresh?: () => void;
  className?: string;
  isDragging?: boolean;
}

const WidgetWrapper = forwardRef<HTMLDivElement, WidgetWrapperProps>(({
  id,
  title,
  icon,
  children,
  onRemove,
  onRefresh,
  className,
  isDragging,
  ...props
}, ref) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (isMaximized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-4 z-50 bg-card border border-border rounded-lg flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-secondary/20">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium text-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh}>
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMaximized(false)}>
              <Minimize2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "bg-card border border-border rounded-lg flex flex-col overflow-hidden",
        isDragging && "shadow-lg ring-2 ring-primary/50 opacity-90",
        className
      )}
      {...props}
    >
      {/* Widget Header */}
      <div className="h-10 border-b border-border flex items-center justify-between px-3 bg-secondary/10 cursor-move group">
        <div className="flex items-center gap-2">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          {icon}
          <span className="text-xs font-medium text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRefresh}
          >
            <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsMaximized(true)}
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleRefresh}>
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Refresh
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-3.5 h-3.5 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-3.5 h-3.5 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => onRemove?.(id)}
              >
                <X className="w-3.5 h-3.5 mr-2" />
                Remove Widget
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Widget Content */}
      <div className="flex-1 overflow-auto p-3">
        {children}
      </div>
    </motion.div>
  );
});

WidgetWrapper.displayName = 'WidgetWrapper';

export default WidgetWrapper;
