import React, { useRef, useState } from 'react';
import { Lock, Unlock, Maximize2 } from 'lucide-react';

export interface ColumnState {
  id: string;
  title: string;
  phase?: string;
  stage?: string;
  badge?: string;
  color?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isLocked: boolean;
}

interface Props {
  column: ColumnState;
  cameraZoom: number;
  updateColumn: (id: string, updates: Partial<ColumnState>) => void;
  children: React.ReactNode;
}

export const SpatialKanbanColumn: React.FC<Props> = ({
  column,
  cameraZoom,
  updateColumn,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ screenX: 0, screenY: 0, startX: 0, startY: 0, startW: 0, startH: 0 });

  // 1. COLUMN DRAG LOGIC (Only fires if NOT locked)
  const onHeaderPointerDown = (e: React.PointerEvent) => {
    if (column.isLocked) return; // If locked, let event bubble up to pan the camera
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStart.current = {
      ...dragStart.current,
      screenX: e.clientX,
      screenY: e.clientY,
      startX: column.x,
      startY: column.y,
    };
  };

  const onHeaderPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.stopPropagation();
    // Divide by cameraZoom so the column tracks exactly with the mouse at any scale
    const zoom = cameraZoom > 0 ? cameraZoom : 1.0;
    const dx = (e.clientX - dragStart.current.screenX) / zoom;
    const dy = (e.clientY - dragStart.current.screenY) / zoom;

    updateColumn(column.id, {
      x: dragStart.current.startX + dx,
      y: dragStart.current.startY + dy,
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (isDragging || isResizing) {
      e.stopPropagation();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback if capture was already released
      }
      setIsDragging(false);
      setIsResizing(false);
    }
  };

  // 2. COLUMN RESIZE LOGIC
  const onResizePointerDown = (e: React.PointerEvent) => {
    if (column.isLocked) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsResizing(true);
    dragStart.current = {
      ...dragStart.current,
      screenX: e.clientX,
      screenY: e.clientY,
      startW: column.width,
      startH: column.height,
    };
  };

  const onResizePointerMove = (e: React.PointerEvent) => {
    if (!isResizing) return;
    e.stopPropagation();
    const zoom = cameraZoom > 0 ? cameraZoom : 1.0;
    const dx = (e.clientX - dragStart.current.screenX) / zoom;
    const dy = (e.clientY - dragStart.current.screenY) / zoom;

    updateColumn(column.id, {
      width: Math.max(300, dragStart.current.startW + dx),
      height: Math.max(260, dragStart.current.startH + dy),
    });
  };

  return (
    <div
      style={{
        transform: `translate3d(${column.x}px, ${column.y}px, 0)`,
        width: `${column.width}px`,
        height: `${column.height}px`,
        position: 'absolute',
        top: 0,
        left: 0,
      }}
      className={`flex flex-col rounded-xl border bg-[#020500]/95 backdrop-blur-md shadow-2xl transition-[border-color,box-shadow] select-none ${
        column.isLocked
          ? 'border-[#086375]/50 shadow-[0_4px_24px_rgba(0,0,0,0.6)]'
          : 'border-[#E0CA3C] shadow-[0_0_20px_rgba(224,202,60,0.25)]'
      }`}
    >
      {/* HEADER: Drag Handle & Lock Toggle */}
      <div
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onPointerUp}
        className={`flex items-center justify-between p-3 border-b border-[#086375]/50 border-t-2 rounded-t-xl transition-colors ${
          column.isLocked
            ? 'cursor-grab border-t-[#086375] bg-[#020500]'
            : 'cursor-move border-t-[#E0CA3C] bg-[#5F0F40]/25'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {column.color && (
            <span
              className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] shrink-0"
              style={{ backgroundColor: column.color, color: column.color }}
            />
          )}
          <span className="font-display font-bold text-xs text-[#E0CA3C] tracking-wider uppercase truncate">
            {column.title}
          </span>
          <span className="font-mono text-[9px] text-[#086375] shrink-0">
            {Math.round(column.x)}, {Math.round(column.y)}
          </span>
        </div>

        {/* Lock Toggle Button */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => updateColumn(column.id, { isLocked: !column.isLocked })}
          className="text-[#DDFBD0]/60 hover:text-[#E0CA3C] transition-colors p-1"
          title={column.isLocked ? 'Column locked (click to unlock and move/resize)' : 'Column unlocked (click to lock in place)'}
        >
          {column.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
      </div>

      {/* BODY: Card Container */}
      <div
        onPointerDown={(e) => {
          if (!column.isLocked) e.stopPropagation();
        }}
        className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scrollbar"
      >
        {/* CARDS ARE STRICT-LOCKED: render here without drag-drop mutation */}
        {children}
      </div>

      {/* RESIZE HANDLE (Hidden when locked) */}
      {!column.isLocked && (
        <div
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onPointerUp}
          className="absolute bottom-1 right-1 p-1 cursor-se-resize text-[#086375] hover:text-[#E0CA3C] transition-colors"
          title="Drag to resize column"
        >
          <Maximize2 className="rotate-90" size={12} />
        </div>
      )}
    </div>
  );
};

export default SpatialKanbanColumn;
