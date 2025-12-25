import { useState, useCallback } from 'react';
import { motion, Reorder, useDragControls, AnimatePresence } from 'framer-motion';
import {
  GripVertical,
  X,
  Settings,
  Maximize2,
  Minimize2,
  Copy,
  RotateCcw,
  Plus,
  Check,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ============================================
// 🎯 DRAGGABLE WIDGET CONTAINER
// ============================================

interface Widget {
  id: string;
  type: string;
  size: 'small' | 'medium' | 'large';
  name?: string;
  order: number;
}

interface DraggableWidgetProps {
  widget: Widget;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  onResize: (id: string, size: 'small' | 'medium' | 'large') => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  children: React.ReactNode;
}

export function DraggableWidget({
  widget,
  isEditMode,
  onRemove,
  onResize,
  onDuplicate,
  onRename,
  children,
}: DraggableWidgetProps) {
  const dragControls = useDragControls();
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(widget.name || widget.type);

  const handleRename = () => {
    onRename(widget.id, tempName);
    setIsRenaming(false);
  };

  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-2',
    large: 'col-span-3',
  };

  return (
    <Reorder.Item
      value={widget}
      id={widget.id}
      dragListener={false}
      dragControls={dragControls}
      className={cn(
        sizeClasses[widget.size],
        'relative group'
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
    >
      <div
        className={cn(
          'h-full rounded-xl border bg-card overflow-hidden transition-all',
          isEditMode && 'ring-2 ring-primary/20 ring-dashed',
          isEditMode && 'hover:ring-primary/40'
        )}
      >
        {/* Widget Header - Visible in edit mode */}
        <AnimatePresence>
          {isEditMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-border bg-muted/50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {/* Drag Handle */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
                        onPointerDown={(e) => dragControls.start(e)}
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Drag to reorder</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Widget Name */}
                {isRenaming ? (
                  <div className="flex-1 flex items-center gap-1">
                    <Input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="h-6 text-xs"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRename}>
                      <Check className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <span className="flex-1 text-xs font-medium text-foreground truncate">
                    {widget.name || widget.type}
                  </span>
                )}

                {/* Size Badge */}
                <Badge variant="secondary" className="text-[10px]">
                  {widget.size}
                </Badge>

                {/* Widget Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Settings className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                      <Edit3 className="w-3 h-3 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(widget.id)}>
                      <Copy className="w-3 h-3 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onResize(widget.id, 'small')}>
                      <Minimize2 className="w-3 h-3 mr-2" />
                      Small
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onResize(widget.id, 'medium')}>
                      <Maximize2 className="w-3 h-3 mr-2" />
                      Medium
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onResize(widget.id, 'large')}>
                      <Maximize2 className="w-3 h-3 mr-2" />
                      Large
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onRemove(widget.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <X className="w-3 h-3 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Widget Content */}
        <div className="h-full">
          {children}
        </div>
      </div>
    </Reorder.Item>
  );
}

// ============================================
// 📊 WIDGET GRID CONTAINER
// ============================================

interface WidgetGridProps {
  widgets: Widget[];
  isEditMode: boolean;
  onReorder: (widgets: Widget[]) => void;
  onRemove: (id: string) => void;
  onResize: (id: string, size: 'small' | 'medium' | 'large') => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onReset: () => void;
  onAddWidget: () => void;
  renderWidget: (widget: Widget) => React.ReactNode;
}

export function WidgetGrid({
  widgets,
  isEditMode,
  onReorder,
  onRemove,
  onResize,
  onDuplicate,
  onRename,
  onReset,
  onAddWidget,
  renderWidget,
}: WidgetGridProps) {
  return (
    <div className="space-y-4">
      {/* Edit Mode Toolbar */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-between p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Edit Mode</span>
              <span className="text-xs text-muted-foreground">
                Drag widgets to reorder, click settings to configure
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onAddWidget}>
                <Plus className="w-3 h-3" />
                Add Widget
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onReset}>
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Grid with Reorder */}
      <Reorder.Group
        axis="y"
        values={widgets}
        onReorder={onReorder}
        className="grid grid-cols-3 gap-4"
        layoutScroll
      >
        {widgets.map((widget) => (
          <DraggableWidget
            key={widget.id}
            widget={widget}
            isEditMode={isEditMode}
            onRemove={onRemove}
            onResize={onResize}
            onDuplicate={onDuplicate}
            onRename={onRename}
          >
            {renderWidget(widget)}
          </DraggableWidget>
        ))}
      </Reorder.Group>
    </div>
  );
}

export default WidgetGrid;
