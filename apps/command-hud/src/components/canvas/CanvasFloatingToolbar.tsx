import React, { useState, useRef, useEffect } from 'react';

export type CanvasInteractionMode = 'drag' | 'lock' | 'edit';

interface CanvasFloatingToolbarProps {
  mode: CanvasInteractionMode;
  onSetMode: (mode: CanvasInteractionMode) => void;
  showNonStructural: boolean;
  onToggleNonStructural: () => void;
  scale: number;
  onSetScale: (scale: number | ((prev: number) => number)) => void;
  onResetTransform: () => void;
}

export const CanvasFloatingToolbar: React.FC<CanvasFloatingToolbarProps> = ({
  mode,
  onSetMode,
  showNonStructural,
  onToggleNonStructural,
  scale,
  onSetScale,
  onResetTransform,
}) => {
  const [isZoomSliderOpen, setIsZoomSliderOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsZoomSliderOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const zoomPercent = Math.round(scale * 100);

  const handleZoomIn = () => {
    onSetScale((prev) => Math.min(3.0, Number((prev + 0.1).toFixed(2))));
  };

  const handleZoomOut = () => {
    onSetScale((prev) => Math.max(0.1, Number((prev - 0.1).toFixed(2))));
  };

  return (
    <div className="absolute top-3 left-4 z-40 flex items-center gap-1.5 p-1 rounded-xl bg-[#020500]/80 border border-[#086375]/60 shadow-[0_8px_24px_rgba(0,0,0,0.85)] backdrop-blur-md select-none font-mono text-[0.62rem]">
      {/* ── Segmented Mode Controls ── */}
      <div className="flex items-center gap-0.5 rounded-lg border border-[#086375]/40 bg-[#040706] p-0.5">
        <button
          type="button"
          onClick={() => onSetMode('drag')}
          aria-pressed={mode === 'drag'}
          className={`flex items-center gap-1 px-2 py-1 rounded font-bold transition-all cursor-pointer ${
            mode === 'drag'
              ? 'bg-[#E0CA3C] text-black shadow-[0_0_8px_rgba(224,202,60,0.4)]'
              : 'text-[#DDFBD0]/70 hover:text-white'
          }`}
          title="Drag Mode: Move nodes freely across the canvas plane"
        >
          <i className="fa-solid fa-arrows-up-down-left-right text-[0.55rem]" />
          <span>DRAG</span>
        </button>

        <button
          type="button"
          onClick={() => onSetMode('lock')}
          aria-pressed={mode === 'lock'}
          className={`flex items-center gap-1 px-2 py-1 rounded font-bold transition-all cursor-pointer ${
            mode === 'lock'
              ? 'bg-[#FE5F00] text-black shadow-[0_0_8px_rgba(254,95,0,0.4)]'
              : 'text-[#DDFBD0]/70 hover:text-white'
          }`}
          title="Lock Mode: Lock all node positions"
        >
          <i className="fa-solid fa-lock text-[0.55rem]" />
          <span>LOCK</span>
        </button>

        <button
          type="button"
          onClick={() => onSetMode('edit')}
          aria-pressed={mode === 'edit'}
          className={`flex items-center gap-1 px-2 py-1 rounded font-bold transition-all cursor-pointer ${
            mode === 'edit'
              ? 'bg-[#3C91E6] text-black shadow-[0_0_8px_rgba(60,145,230,0.4)]'
              : 'text-[#DDFBD0]/70 hover:text-white'
          }`}
          title="Edit Mode: Inspect and configure module properties"
        >
          <i className="fa-solid fa-pen-to-square text-[0.55rem]" />
          <span>EDIT</span>
        </button>
      </div>

      {/* ── Non-Structural Satellite Toggle ── */}
      <button
        type="button"
        onClick={onToggleNonStructural}
        aria-pressed={showNonStructural}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
          showNonStructural
            ? 'border-[#086375] bg-[#086375]/25 text-[#DDFBD0]'
            : 'border-red-900/60 bg-red-950/30 text-red-400'
        }`}
        title={showNonStructural ? 'Satellites Visible: Click to hide' : 'Satellites Hidden: Click to show'}
      >
        <i className={`fa-solid ${showNonStructural ? 'fa-satellite text-[#E0CA3C]' : 'fa-satellite-dish opacity-50'} text-[0.55rem]`} />
        <span>SATELLITES</span>
      </button>

      {/* Divider */}
      <div className="h-4 w-px bg-[#086375]/50 mx-0.5" />

      {/* ── Zoom Controls: - / % / + / Recenter ── */}
      <button
        type="button"
        onClick={handleZoomOut}
        className="w-5 h-5 flex items-center justify-center rounded border border-[#086375]/50 bg-[#086375]/20 text-[#DDFBD0] hover:border-[#E0CA3C] cursor-pointer"
        title="Zoom Out"
      >
        -
      </button>

      <div className="relative" ref={popoverRef}>
        <button
          type="button"
          onClick={() => setIsZoomSliderOpen((prev) => !prev)}
          className="px-1.5 py-0.5 rounded border border-[#086375]/60 bg-[#020500] text-[#E0CA3C] font-bold cursor-pointer hover:border-[#E0CA3C]"
          title="Click to adjust zoom slider"
        >
          {zoomPercent}%
        </button>

        {isZoomSliderOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 rounded-xl border border-[#086375] bg-[#020500]/98 p-3 shadow-2xl backdrop-blur-md z-50 animate-in fade-in">
            <div className="flex justify-between text-[10px] text-[#DDFBD0] mb-1 font-bold">
              <span>CANVAS ZOOM</span>
              <span className="text-[#E0CA3C]">{zoomPercent}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              step="5"
              value={zoomPercent}
              onChange={(e) => onSetScale(Number(e.target.value) / 100)}
              className="w-full accent-[#E0CA3C] cursor-pointer h-1.5 bg-[#086375]/40 rounded-lg appearance-none mb-2"
            />
            <div className="grid grid-cols-4 gap-1 text-[9px] text-center">
              {[25, 50, 100, 200].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => { onSetScale(preset / 100); setIsZoomSliderOpen(false); }}
                  className="p-1 rounded border border-[#086375]/50 hover:bg-[#086375]/30 text-[#DDFBD0]"
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleZoomIn}
        className="w-5 h-5 flex items-center justify-center rounded border border-[#086375]/50 bg-[#086375]/20 text-[#DDFBD0] hover:border-[#E0CA3C] cursor-pointer"
        title="Zoom In"
      >
        +
      </button>

      <button
        type="button"
        onClick={onResetTransform}
        className="flex items-center gap-1 px-2 py-1 rounded border border-[#086375]/60 bg-[#086375]/20 text-[#DDFBD0]/80 hover:text-[#E0CA3C] hover:border-[#E0CA3C] transition-colors cursor-pointer"
        title="Recenter Canvas (Alt+0 or Home)"
      >
        <i className="fa-solid fa-arrows-to-dot text-[0.55rem] text-[#E0CA3C]" />
        <span>RECENTER</span>
      </button>
    </div>
  );
};
