import React, { useState } from 'react';
import { KeymapConfig, saveStoredKeymap } from '../../hooks/useBridgeKeybindings';

interface KeybindingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKeymap: KeymapConfig;
  onUpdateKeymap: (newKeymap: KeymapConfig) => void;
  onLogTerminal?: (message: string, type?: 'normal' | 'action' | 'server' | 'alert') => void;
}

export const KeybindingSettingsModal: React.FC<KeybindingSettingsModalProps> = ({
  isOpen,
  onClose,
  currentKeymap,
  onUpdateKeymap,
  onLogTerminal,
}) => {
  const [keymap, setKeymap] = useState<KeymapConfig>(currentKeymap);
  const [uiScale, setUiScale] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('szs_ui_scale')) || 1.0;
    } catch {
      return 1.0;
    }
  });

  const [calRatio, setCalRatio] = useState<number>(280);
  const [dossierRatio, setDossierRatio] = useState<number>(270);
  const [macroRatio, setMacroRatio] = useState<number>(280);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredKeymap(keymap);
    onUpdateKeymap(keymap);
    try {
      localStorage.setItem('szs_ui_scale', String(uiScale));
      document.documentElement.style.setProperty('--ui-scale', String(uiScale));
      document.documentElement.style.setProperty('--bay-calendar-ratio', `${calRatio}px`);
      document.documentElement.style.setProperty('--bay-dossier-ratio', `${dossierRatio}px`);
      document.documentElement.style.setProperty('--bay-macro-ratio', `${macroRatio}px`);
    } catch {}
    onLogTerminal?.('Bridge keybindings, UI scale, and modular chassis ratios saved.', 'action');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-full max-w-xl rounded-xl border-2 border-[#E0CA3C] bg-[#020500] p-5 shadow-[0_0_40px_rgba(224,202,60,0.3)] text-[#DDFBD0] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#086375] pb-2 mb-4">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-gear text-[#E0CA3C]" />
            <h2 className="font-display font-bold text-sm text-[#E0CA3C] tracking-wide">
              BRIDGE ORCHESTRATOR & RATIO SETTINGS
            </h2>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-sm text-[#FE5F00] hover:text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Runway */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Section 1: Global UI Scale */}
          <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10">
            <div className="flex justify-between items-center mb-1.5 font-bold">
              <span>Universal UI Scale Engine:</span>
              <span className="text-[#E0CA3C]">{Math.round(uiScale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.25"
              step="0.05"
              value={uiScale}
              onChange={(e) => setUiScale(Number(e.target.value))}
              className="w-full accent-[#E0CA3C] cursor-pointer"
            />
            <div className="flex justify-between text-[0.6rem] text-[#DDFBD0]/50 mt-1">
              <span>75% (Dense)</span>
              <span>100% (Default)</span>
              <span>125% (Expanded)</span>
            </div>
          </div>

          {/* Section 2: Modular Console Chassis Proportions */}
          <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10 space-y-2">
            <span className="font-bold block text-[#E0CA3C] mb-1">
              Modular Chassis Bay Width Ratios:
            </span>

            <div className="flex justify-between items-center text-[0.68rem]">
              <span>Calendar Bay Width: {calRatio}px</span>
              <input
                type="range"
                min="220"
                max="360"
                step="10"
                value={calRatio}
                onChange={(e) => setCalRatio(Number(e.target.value))}
                className="w-36 accent-[#E0CA3C] cursor-pointer"
              />
            </div>

            <div className="flex justify-between items-center text-[0.68rem]">
              <span>Client Dossier Width: {dossierRatio}px</span>
              <input
                type="range"
                min="220"
                max="360"
                step="10"
                value={dossierRatio}
                onChange={(e) => setDossierRatio(Number(e.target.value))}
                className="w-36 accent-[#E0CA3C] cursor-pointer"
              />
            </div>

            <div className="flex justify-between items-center text-[0.68rem]">
              <span>Macro Pad Width: {macroRatio}px</span>
              <input
                type="range"
                min="220"
                max="360"
                step="10"
                value={macroRatio}
                onChange={(e) => setMacroRatio(Number(e.target.value))}
                className="w-36 accent-[#E0CA3C] cursor-pointer"
              />
            </div>
          </div>

          {/* Section 3: Universal Keybinding Reference */}
          <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10 space-y-1.5 text-[0.68rem]">
            <span className="font-bold block text-[#E0CA3C] mb-1">
              Active Keymap Shortcuts:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[#DDFBD0]/80">
              <div><span className="text-[#E0CA3C] font-bold">Alt + 1..5:</span> Department Viewports</div>
              <div><span className="text-[#E0CA3C] font-bold">Ctrl + 1..4:</span> Kanban Topologies</div>
              <div><span className="text-[#E0CA3C] font-bold">Ctrl + B:</span> Toggle MAD Sidebar</div>
              <div><span className="text-[#E0CA3C] font-bold">Shift + 1..9:</span> Bind RTS Client Slot</div>
              <div><span className="text-[#E0CA3C] font-bold">1..9:</span> Recall Client & Center</div>
              <div><span className="text-[#E0CA3C] font-bold">Alt + Scroll:</span> Scale Canvas Matrix</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#086375] flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-[#086375] text-xs hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded bg-[#E0CA3C] text-black font-bold text-xs hover:bg-[#FE5F00] hover:text-white transition-colors cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
