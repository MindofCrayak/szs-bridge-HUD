import React, { useState } from 'react';
import { Lock, Unlock, Maximize2 } from 'lucide-react';
import { ConnectionPort } from './ConnectionPort';

export interface NodeGeometry {
  id: string;
  serviceId?: string;
  title?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isLocked: boolean;
}

interface Props {
  node: NodeGeometry;
  cameraZoom: number;
  onUpdate: (id: string, updates: Partial<NodeGeometry>) => void;
  children: React.ReactNode;
}

export const ResizableNodeContainer: React.FC<Props> = ({
  node,
  cameraZoom,
  onUpdate,
  children,
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // 1. Drag Positioning Handler
  const handleDragStart = (e: React.PointerEvent) => {
    // Also allow Alt + Right Click to open menu directly on click
    if (e.altKey && (e.button === 2 || e.button === 0)) {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY });
      return;
    }

    if (node.isLocked || e.button !== 0) return;
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = node.x;
    const initY = node.y;

    const onPointerMove = (ev: PointerEvent) => {
      const zoom = cameraZoom > 0 ? cameraZoom : 1.0;
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      onUpdate(node.id, { x: Math.round(initX + dx), y: Math.round(initY + dy) });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // 2. Corner Resizing (Bottom-Right)
  const handleResizeStart = (e: React.PointerEvent) => {
    if (node.isLocked) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initW = node.width;
    const initH = node.height;

    const onPointerMove = (ev: PointerEvent) => {
      const zoom = cameraZoom > 0 ? cameraZoom : 1.0;
      const dw = (ev.clientX - startX) / zoom;
      const dh = (ev.clientY - startY) / zoom;
      onUpdate(node.id, {
        width: Math.max(140, Math.round(initW + dw)),
        height: Math.max(80, Math.round(initH + dh)),
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // 3. Right-Click & Alt + Right-Click Context Menu for Lock/Unlock
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        onClick={(e) => {
          if (e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY });
          }
        }}
        style={{
          transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
          width: `${node.width}px`,
          height: `${node.height}px`,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        className={`group flex flex-col rounded-xl border bg-[#020500]/95 backdrop-blur-md transition-shadow select-none z-20 pointer-events-auto ${
          node.isLocked
            ? 'border-[#086375]/40 shadow-none'
            : 'border-[#086375] hover:border-[#E0CA3C] shadow-[0_0_20px_rgba(8,99,117,0.2)]'
        }`}
      >
        {/* ECS Connection Ports */}
        <ConnectionPort id={`${node.id}-top`} position="top" />
        <ConnectionPort id={`${node.id}-bottom`} position="bottom" />
        <ConnectionPort id={`${node.id}-left`} position="left" />
        <ConnectionPort id={`${node.id}-right`} position="right" />

        {/* Drag Bar Header */}
        <div
          onPointerDown={handleDragStart}
          className={`flex items-center justify-between px-2.5 py-1.5 border-b border-[#086375]/30 ${
            node.isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            {node.isLocked ? (
              <Lock size={11} className="text-[#FE5F00]/80 shrink-0" />
            ) : (
              <Unlock size={11} className="text-[#DDFBD0]/40 group-hover:text-[#E0CA3C] shrink-0" />
            )}
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#DDFBD0]/70 truncate max-w-[120px]">
              {node.title || node.id}
            </span>
          </div>
          <span className="font-mono text-[8px] text-[#086375] shrink-0">
            {node.width}×{node.height}
          </span>
        </div>

        {/* Node Body Content */}
        <div className="flex-1 overflow-hidden p-2 relative">
          {children}
        </div>

        {/* Resize Handle (Bottom-Right) */}
        {!node.isLocked && (
          <div
            onPointerDown={handleResizeStart}
            className="absolute bottom-1 right-1 p-1 cursor-se-resize text-[#086375] hover:text-[#E0CA3C] z-20"
            style={{ touchAction: 'none' }}
          >
            <Maximize2 size={11} className="rotate-90" />
          </div>
        )}
      </div>

      {/* Floating Right-Click Lock/Unlock Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[9999] bg-[#020500] border border-[#086375] rounded shadow-[0_8px_32px_rgba(0,0,0,0.9)] p-1 text-xs font-mono text-[#DDFBD0]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              onUpdate(node.id, { isLocked: !node.isLocked });
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#086375]/30 hover:text-[#E0CA3C] w-full text-left rounded cursor-pointer"
          >
            {node.isLocked ? <Unlock size={12} /> : <Lock size={12} />}
            <span>{node.isLocked ? 'Unlock Dimensions & Drag' : 'Lock Node (Freeze)'}</span>
          </button>
        </div>
      )}
    </>
  );
};
