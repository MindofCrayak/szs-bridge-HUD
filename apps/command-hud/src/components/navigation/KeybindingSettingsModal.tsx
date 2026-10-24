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
  const [activeTab, setActiveTab] = useState<'ui' | 'hotkeys'>('ui');
  const [keymap, setKeymap] = useState<KeymapConfig>(currentKeymap);
  const [uiScale, setUiScale] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('szs_ui_scale')) || 1.0;
    } catch {
      return 1.0;
    }
  });

  const [calRatio, setCalRatio] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('szs_bay_cal')) || 280;
    } catch {
      return 280;
    }
  });
  const [dossierRatio, setDossierRatio] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('szs_bay_dossier')) || 270;
    } catch {
      return 270;
    }
  });
  const [macroRatio, setMacroRatio] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('szs_bay_macro')) || 280;
    } catch {
      return 280;
    }
  });

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredKeymap(keymap);
    onUpdateKeymap(keymap);
    try {
      localStorage.setItem('szs_ui_scale', String(uiScale));
      localStorage.setItem('szs_bay_cal', String(calRatio));
      localStorage.setItem('szs_bay_dossier', String(dossierRatio));
      localStorage.setItem('szs_bay_macro', String(macroRatio));

      document.documentElement.style.setProperty('--ui-scale', String(uiScale));
      document.documentElement.style.setProperty('--bay-calendar-w', `${calRatio}px`);
      document.documentElement.style.setProperty('--bay-dossier-w', `${dossierRatio}px`);
      document.documentElement.style.setProperty('--bay-macro-w', `${macroRatio}px`);
      document.documentElement.style.setProperty('--bay-calendar-ratio', `${calRatio}px`);
      document.documentElement.style.setProperty('--bay-dossier-ratio', `${dossierRatio}px`);
      document.documentElement.style.setProperty('--bay-macro-ratio', `${macroRatio}px`);
    } catch {}
    onLogTerminal?.('Bridge keybindings, UI scale, and modular chassis ratios saved.', 'action');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono select-none">
      <div className="w-full max-w-xl rounded-xl border-2 border-[#E0CA3C] bg-[#020500] p-5 shadow-[0_0_50px_rgba(224,202,60,0.35)] text-[#DDFBD0] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#086375] pb-2 mb-3">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-gear text-[#E0CA3C]" />
            <h2 className="font-display font-bold text-sm text-[#E0CA3C] tracking-wide">
              SYSTEM SETTINGS & RATIO ORCHESTRATOR
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

        {/* Tab Switcher: Tab 1 (UI Scale) & Tab 2 (Hotkeys) */}
        <div className="flex border-b border-[#086375]/50 mb-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ui')}
            className={`flex-1 py-1.5 text-center font-bold transition-colors cursor-pointer ${
              activeTab === 'ui'
                ? 'border-b-2 border-[#E0CA3C] text-[#E0CA3C] bg-[#E0CA3C]/10'
                : 'text-[#DDFBD0]/60 hover:text-[#DDFBD0]'
            }`}
          >
            <i className="fa-solid fa-sliders mr-1.5" />
            TAB 1: UI SCALE & CHASSIS BAYS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hotkeys')}
            className={`flex-1 py-1.5 text-center font-bold transition-colors cursor-pointer ${
              activeTab === 'hotkeys'
                ? 'border-b-2 border-[#E0CA3C] text-[#E0CA3C] bg-[#E0CA3C]/10'
                : 'text-[#DDFBD0]/60 hover:text-[#DDFBD0]'
            }`}
          >
            <i className="fa-solid fa-keyboard mr-1.5" />
            TAB 2: HOTKEY RE-MAPPER
          </button>
        </div>

        {/* Content Runway */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {activeTab === 'ui' ? (
            <>
              {/* Universal UI Scale Engine */}
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
                  <span>75% (Dense Macro)</span>
                  <span>100% (Default)</span>
                  <span>125% (Expanded)</span>
                </div>
              </div>

              {/* Modular Chassis Bay Width Sliders */}
              <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10 space-y-2.5">
                <span className="font-bold block text-[#E0CA3C] mb-1">
                  Modular Chassis Pod Widths:
                </span>

                <div className="flex justify-between items-center text-[0.68rem]">
                  <span>Bay 1 (Calendar): {calRatio}px</span>
                  <input
                    type="range"
                    min="220"
                    max="360"
                    step="10"
                    value={calRatio}
                    onChange={(e) => setCalRatio(Number(e.target.value))}
                    className="w-40 accent-[#E0CA3C] cursor-pointer"
                  />
                </div>

                <div className="flex justify-between items-center text-[0.68rem]">
                  <span>Bay 3 (Client Dossier): {dossierRatio}px</span>
                  <input
                    type="range"
                    min="200"
                    max="340"
                    step="10"
                    value={dossierRatio}
                    onChange={(e) => setDossierRatio(Number(e.target.value))}
                    className="w-40 accent-[#E0CA3C] cursor-pointer"
                  />
                </div>

                <div className="flex justify-between items-center text-[0.68rem]">
                  <span>Bay 4 (Macro Pad): {macroRatio}px</span>
                  <input
                    type="range"
                    min="220"
                    max="360"
                    step="10"
                    value={macroRatio}
                    onChange={(e) => setMacroRatio(Number(e.target.value))}
                    className="w-40 accent-[#E0CA3C] cursor-pointer"
                  />
                </div>
              </div>

              {/* RTS Client Keybinding Quick Help */}
              <div className="p-2.5 rounded-lg border border-[#086375]/40 bg-[#020500]/70 text-[0.65rem] space-y-1">
                <div className="text-[#E0CA3C] font-bold">RTS Client Hotkey Routing:</div>
                <p className="text-[#DDFBD0]/70">
                  <span className="text-[#FE5F00] font-bold">Shift + 1-9:</span> Binds currently selected client to that numerical slot.
                </p>
                <p className="text-[#DDFBD0]/70">
                  <span className="text-[#FE5F00] font-bold">1-9 (Unmodified):</span> Instantly snaps HUD, Alfred Terminal, and Dossier to that client.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Hotkey Re-Mapper View */}
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10">
                  <span className="font-bold text-[#E0CA3C] block mb-2">Department Canvas Navigation (Alt + Key):</span>
                  <div className="grid grid-cols-2 gap-2 text-[0.65rem]">
                    {Object.entries(keymap.departments).map(([k, v]) => (
                      <div key={k} className="flex justify-between p-1.5 rounded bg-[#020500]/70 border border-[#086375]/30">
                        <span className="text-[#FE5F00] font-bold">{k}</span>
                        <span className="text-[#DDFBD0]/80 uppercase">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10">
                  <span className="font-bold text-[#E0CA3C] block mb-2">Kanban Topology & Filters (Ctrl + Key):</span>
                  <div className="grid grid-cols-2 gap-2 text-[0.65rem]">
                    {Object.entries(keymap.kanbanViews).map(([k, v]) => (
                      <div key={k} className="flex justify-between p-1.5 rounded bg-[#020500]/70 border border-[#086375]/30">
                        <span className="text-[#E0CA3C] font-bold">{k}</span>
                        <span className="text-[#DDFBD0]/80 uppercase">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 border-t border-[#086375] pt-3 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-[#086375] text-[#DDFBD0]/70 hover:text-white transition-colors cursor-pointer text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded bg-[#E0CA3C] text-black font-bold hover:bg-[#ffe359] shadow-[0_0_15px_rgba(224,202,60,0.4)] transition-all cursor-pointer text-xs"
          >
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};
