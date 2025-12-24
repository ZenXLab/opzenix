import { useState, useRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  GripVertical, X, Edit2, MoreVertical, Maximize2, Minimize2,
  Copy, Settings, Info, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DraggableWidgetProps {
  id: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onRemove: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  onDuplicate?: (id: string) => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  widgetType?: string;
  executionId?: string;
}

export const DraggableWidget = ({
  id,
  title,
  icon,
  children,
  onRemove,
  onRename,
  onDuplicate,
  size = 'small',
  className,
  widgetType,
  executionId,
}: DraggableWidgetProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedTitle(title);
    setTimeout(() => inputRef.current?.select(), 50);
  };

  const handleFinishEdit = () => {
    setIsEditing(false);
    if (editedTitle.trim() && editedTitle !== title) {
      onRename?.(id, editedTitle.trim());
      toast.success('Widget renamed');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleFinishEdit();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedTitle(title);
    }
  };

  const handleDuplicate = () => {
    onDuplicate?.(id);
    toast.success('Widget duplicated');
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(executionId || id);
    toast.success('ID copied to clipboard');
  };

  const handleViewDetails = () => {
    toast.info(`Widget: ${widgetType}\nID: ${id}\nExecution: ${executionId || 'N/A'}`);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          layout
          className={cn(
            "bg-card border border-border rounded-lg overflow-hidden",
            "hover:border-primary/30 transition-colors duration-200",
            isExpanded && "fixed inset-4 z-50",
            className
          )}
          data-widget-id={id}
          data-widget-type={widgetType}
        >
          {/* Widget Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0" />
              {icon}
              {isEditing ? (
                <Input
                  ref={inputRef}
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleFinishEdit}
                  onKeyDown={handleKeyDown}
                  className="h-6 text-sm px-1 py-0 border-primary"
                  autoFocus
                />
              ) : (
                <span 
                  className="text-sm font-medium text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                  onDoubleClick={handleStartEdit}
                  title="Double-click to rename"
                >
                  {title}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleStartEdit}>
                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="h-3.5 w-3.5 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyId}>
                    <Info className="h-3.5 w-3.5 mr-2" />
                    Copy ID
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleViewDetails}>
                    <Settings className="h-3.5 w-3.5 mr-2" />
                    Widget Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onRemove(id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <X className="h-3.5 w-3.5 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Widget Content */}
          <div className={cn("p-3", isExpanded && "p-6 overflow-auto max-h-[calc(100vh-120px)]")}>
            {children}
          </div>
          
          {/* Execution ID Footer (if applicable) */}
          {executionId && (
            <div className="px-3 py-1.5 border-t border-border bg-muted/20">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Execution ID:</span>
                <code className="font-mono bg-secondary/50 px-1 rounded">
                  {executionId.slice(0, 8)}...
                </code>
              </div>
            </div>
          )}
        </motion.div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={handleStartEdit}>
          <Edit2 className="h-3.5 w-3.5 mr-2" />
          Rename Widget
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDuplicate}>
          <Copy className="h-3.5 w-3.5 mr-2" />
          Duplicate Widget
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? (
            <Minimize2 className="h-3.5 w-3.5 mr-2" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5 mr-2" />
          )}
          {isExpanded ? 'Minimize' : 'Maximize'}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleCopyId}>
          <Info className="h-3.5 w-3.5 mr-2" />
          Copy Widget ID
        </ContextMenuItem>
        <ContextMenuItem onClick={handleViewDetails}>
          <Settings className="h-3.5 w-3.5 mr-2" />
          View Details
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem 
          onClick={() => onRemove(id)}
          className="text-destructive focus:text-destructive"
        >
          <X className="h-3.5 w-3.5 mr-2" />
          Remove Widget
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default DraggableWidget;
