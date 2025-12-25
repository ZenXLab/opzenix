import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================
// 📐 RESIZABLE WIDGET WRAPPER
// ============================================

interface ResizableWidgetProps {
  children: React.ReactNode;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  initialWidth?: number;
  initialHeight?: number;
  gridSnap?: number;
  isEditMode: boolean;
  onResize?: (width: number, height: number) => void;
  className?: string;
}

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export function ResizableWidget({
  children,
  minWidth = 200,
  minHeight = 150,
  maxWidth = 1200,
  maxHeight = 800,
  initialWidth,
  initialHeight,
  gridSnap = 20,
  isEditMode,
  onResize,
  className,
}: ResizableWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: initialWidth || 'auto',
    height: initialHeight || 'auto',
  });
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setActiveHandle(handle);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = containerRef.current?.offsetWidth || 0;
    const startHeight = containerRef.current?.offsetHeight || 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      // Calculate new dimensions based on handle
      if (handle.includes('e')) {
        newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
      }
      if (handle.includes('w')) {
        newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth - deltaX));
      }
      if (handle.includes('s')) {
        newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
      }
      if (handle.includes('n')) {
        newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight - deltaY));
      }

      // Snap to grid
      if (gridSnap > 0) {
        newWidth = Math.round(newWidth / gridSnap) * gridSnap;
        newHeight = Math.round(newHeight / gridSnap) * gridSnap;
      }

      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setActiveHandle(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (onResize && containerRef.current) {
        onResize(containerRef.current.offsetWidth, containerRef.current.offsetHeight);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isEditMode, minWidth, minHeight, maxWidth, maxHeight, gridSnap, onResize]);

  const handles: { position: ResizeHandle; cursor: string; className: string }[] = [
    { position: 'n', cursor: 'ns-resize', className: 'top-0 left-1/2 -translate-x-1/2 w-8 h-2 cursor-ns-resize' },
    { position: 's', cursor: 'ns-resize', className: 'bottom-0 left-1/2 -translate-x-1/2 w-8 h-2 cursor-ns-resize' },
    { position: 'e', cursor: 'ew-resize', className: 'right-0 top-1/2 -translate-y-1/2 w-2 h-8 cursor-ew-resize' },
    { position: 'w', cursor: 'ew-resize', className: 'left-0 top-1/2 -translate-y-1/2 w-2 h-8 cursor-ew-resize' },
    { position: 'ne', cursor: 'nesw-resize', className: 'top-0 right-0 w-3 h-3 cursor-nesw-resize' },
    { position: 'nw', cursor: 'nwse-resize', className: 'top-0 left-0 w-3 h-3 cursor-nwse-resize' },
    { position: 'se', cursor: 'nwse-resize', className: 'bottom-0 right-0 w-3 h-3 cursor-nwse-resize' },
    { position: 'sw', cursor: 'nesw-resize', className: 'bottom-0 left-0 w-3 h-3 cursor-nesw-resize' },
  ];

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      style={{
        width: dimensions.width === 'auto' ? '100%' : dimensions.width,
        height: dimensions.height === 'auto' ? 'auto' : dimensions.height,
      }}
    >
      {/* Content */}
      {children}

      {/* Resize Handles - Only visible in edit mode */}
      {isEditMode && (
        <>
          {handles.map((handle) => (
            <div
              key={handle.position}
              onMouseDown={(e) => handleResizeStart(e, handle.position)}
              className={cn(
                'absolute z-20 transition-all',
                handle.className,
                'opacity-0 hover:opacity-100',
                activeHandle === handle.position && 'opacity-100',
                'group'
              )}
            >
              <div
                className={cn(
                  'absolute inset-0 rounded-full transition-colors',
                  'bg-primary/30 hover:bg-primary/60',
                  activeHandle === handle.position && 'bg-primary',
                  handle.position.length === 2 && 'rounded-sm' // Corner handles are square
                )}
              />
            </div>
          ))}

          {/* Resize indicator overlay */}
          {isResizing && (
            <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary/30 rounded-lg pointer-events-none z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {typeof dimensions.width === 'number' ? dimensions.width : '?'} × {typeof dimensions.height === 'number' ? dimensions.height : '?'}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// 🎯 GRID-BASED RESIZE WIDGET
// ============================================

interface GridResizeWidgetProps {
  children: React.ReactNode;
  colSpan: number;
  rowSpan: number;
  minColSpan?: number;
  maxColSpan?: number;
  minRowSpan?: number;
  maxRowSpan?: number;
  isEditMode: boolean;
  onGridResize?: (colSpan: number, rowSpan: number) => void;
  className?: string;
}

export function GridResizeWidget({
  children,
  colSpan,
  rowSpan,
  minColSpan = 1,
  maxColSpan = 4,
  minRowSpan = 1,
  maxRowSpan = 3,
  isEditMode,
  onGridResize,
  className,
}: GridResizeWidgetProps) {
  const [currentColSpan, setCurrentColSpan] = useState(colSpan);
  const [currentRowSpan, setCurrentRowSpan] = useState(rowSpan);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentColSpan(colSpan);
    setCurrentRowSpan(rowSpan);
  }, [colSpan, rowSpan]);

  const handleCornerResize = useCallback((e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startColSpan = currentColSpan;
    const startRowSpan = currentRowSpan;

    // Estimate cell size (assuming grid gap of 16px)
    const cellWidth = containerRef.current ? containerRef.current.offsetWidth / currentColSpan : 300;
    const cellHeight = 200; // Approximate row height

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Calculate new spans
      const colChange = Math.round(deltaX / cellWidth);
      const rowChange = Math.round(deltaY / cellHeight);

      const newColSpan = Math.max(minColSpan, Math.min(maxColSpan, startColSpan + colChange));
      const newRowSpan = Math.max(minRowSpan, Math.min(maxRowSpan, startRowSpan + rowChange));

      setCurrentColSpan(newColSpan);
      setCurrentRowSpan(newRowSpan);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (onGridResize) {
        onGridResize(currentColSpan, currentRowSpan);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isEditMode, currentColSpan, currentRowSpan, minColSpan, maxColSpan, minRowSpan, maxRowSpan, onGridResize]);

  const gridClass = cn(
    `col-span-${currentColSpan}`,
    `row-span-${currentRowSpan}`
  );

  return (
    <motion.div
      ref={containerRef}
      className={cn('relative', className)}
      style={{
        gridColumn: `span ${currentColSpan}`,
        gridRow: `span ${currentRowSpan}`,
      }}
      layout
      transition={{ duration: 0.2 }}
    >
      {children}

      {/* Corner Resize Handle */}
      {isEditMode && (
        <div
          onMouseDown={handleCornerResize}
          className={cn(
            'absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-20',
            'flex items-center justify-center',
            'opacity-0 hover:opacity-100 transition-opacity',
            isResizing && 'opacity-100'
          )}
        >
          <div className="w-4 h-4 rounded-sm bg-primary/50 hover:bg-primary border-2 border-primary-foreground shadow-sm">
            <svg viewBox="0 0 16 16" className="w-full h-full text-primary-foreground">
              <path
                fill="currentColor"
                d="M14 10v4h-4v-2h2v-2h2zm-6 4v-2h2v2h-2zm-4-4v2h2v2h-4v-4h2zm8-8v2h-2v-2h2zm0 4v2h-2v-2h2zm-4-4v2h-2v2h-2v-4h4z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Resize Preview Overlay */}
      {isResizing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-xl pointer-events-none z-10"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-lg">
            {currentColSpan} × {currentRowSpan}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default ResizableWidget;
