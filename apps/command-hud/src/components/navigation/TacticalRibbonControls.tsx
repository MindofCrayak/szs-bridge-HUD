import React from 'react';
import { Filter, Layers, Lock, Unlock, Eye, EyeOff } from 'lucide-react';

export type CanvasInteractionMode = 'drag' | 'lock' | 'edit';

interface TacticalRibbonControlsProps {
  mode: CanvasInteractionMode;
  onSetMode: (mode: CanvasInteractionMode) => void;
  showNonStructural: boolean;
  onToggleNonStructural: () => void;
}

export const TacticalRibbonControls: React.FC<TacticalRibbonControlsProps> = ({
  mode,
  onSetMode,
  showNonStructural,
  onToggleNonStructural,
}) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-black/60 rounded-full border border-[#086375]/50 backdrop-blur-sm select-none font-mono text-xs">
      {/* Mode Selector (Segmented Control: DRAG | LOCK | EDIT) */}
      <div className="flex p-0.5 bg-[#020500] rounded-lg border border-[#086375]/40">
        <button
          type="button"
          onClick={() => onSetMode('drag')}
          className={`px-2.5 py-0.5 text-[0.62rem] font-bold rounded transition-all cursor-pointer ${
            mode === 'drag'
              ? 'bg-[#E0CA3C] text-black shadow-[0_0_8px_rgba(224,202,60,0.5)]'
              : 'text-[#DDFBD0]/70 hover:text-[#E0CA3C] hover:bg-white/5'
          }`}
          title="Free movement: Click and drag nodes freely"
        >
          DRAG
        </button>
        <button
          type="button"
          onClick={() => onSetMode('lock')}
          className={`flex items-center gap-1 px-2.5 py-0.5 text-[0.62rem] font-bold rounded transition-all cursor-pointer ${
            mode === 'lock'
              ? 'bg-[#FE5F00] text-black shadow-[0_0_8px_rgba(254,95,0,0.5)]'
              : 'text-[#DDFBD0]/70 hover:text-[#FE5F00] hover:bg-white/5'
          }`}
          title="Freeze canvas: Locks all non-structural nodes (Press Esc)"
        >
          <Lock size={10} />
          <span>LOCK</span>
        </button>
        <button
          type="button"
          onClick={() => onSetMode('edit')}
          className={`px-2.5 py-0.5 text-[0.62rem] font-bold rounded transition-all cursor-pointer ${
            mode === 'edit'
              ? 'bg-[#086375] text-[#DDFBD0] shadow-[0_0_8px_rgba(8,99,117,0.5)]'
              : 'text-[#DDFBD0]/70 hover:text-[#DDFBD0] hover:bg-white/5'
          }`}
          title="Edit mode: Adjust parameters & bindings"
        >
          EDIT
        </button>
      </div>

      <div className="h-3.5 w-[1px] bg-[#086375]/40" />

      {/* Layer Toggle: Non-Structural Nodes Filter */}
      <button
        type="button"
        onClick={onToggleNonStructural}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[0.62rem] font-bold transition-all cursor-pointer border ${
          showNonStructural
            ? 'border-[#086375]/50 bg-[#086375]/15 text-[#DDFBD0] hover:border-[#E0CA3C]'
            : 'border-[#FE5F00]/50 bg-[#FE5F00]/10 text-[#FE5F00]'
        }`}
        title="Toggle visibility of non-structural satellite/data nodes"
      >
        {showNonStructural ? <Eye size={11} className="text-[#E0CA3C]" /> : <EyeOff size={11} className="text-[#FE5F00]" />}
        <span className="hidden lg:inline text-[0.58rem] tracking-wider uppercase">
          {showNonStructural ? 'SATELLITES: ON' : 'SATELLITES: OFF'}
        </span>
      </button>
    </div>
  );
};
