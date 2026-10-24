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
  const [activeTab, setActiveTab] = useState<'display' | 'keybindings'>('display');
  const [keymap, setKeymap] = useState<KeymapConfig>(currentKeymap);

  const [uiScale, setUiScale] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('szs_ui_scale')) || 1.0;
    } catch {
      return 1.0;
    }
  });

  const [columnScale, setColumnScale] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('szs_col_scale')) || 1.0;
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

  const [centerRatio, setCenterRatio] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('szs_bay_center')) || 420;
    } catch {
      return 420;
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

  const [canvasTheme, setCanvasTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('szs_canvas_theme') || 'obsidian-grid';
    } catch {
      return 'obsidian-grid';
    }
  });

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredKeymap(keymap);
    onUpdateKeymap(keymap);
    try {
      localStorage.setItem('szs_ui_scale', String(uiScale));
      localStorage.setItem('szs_col_scale', String(columnScale));
      localStorage.setItem('szs_bay_cal', String(calRatio));
      localStorage.setItem('szs_bay_center', String(centerRatio));
      localStorage.setItem('szs_bay_dossier', String(dossierRatio));
      localStorage.setItem('szs_bay_macro', String(macroRatio));
      localStorage.setItem('szs_canvas_theme', canvasTheme);

      document.documentElement.style.setProperty('--ui-scale', String(uiScale));
      document.documentElement.style.setProperty('--column-scale', String(columnScale));
      document.documentElement.style.setProperty('--bay-calendar-w', `${calRatio}px`);
      document.documentElement.style.setProperty('--bay-center-w', `${centerRatio}px`);
      document.documentElement.style.setProperty('--bay-dossier-w', `${dossierRatio}px`);
      document.documentElement.style.setProperty('--bay-macro-w', `${macroRatio}px`);

      // Dispatch event for ReactiveBridgeCanvas theme
      window.dispatchEvent(new Event('storage'));
    } catch {}
    onLogTerminal?.('Bridge display ergonomics and keybinding matrix saved.', 'action');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-mono select-none">
      <div className="w-full max-w-xl rounded-xl border-2 border-[#E0CA3C] bg-[#020500] p-5 shadow-[0_0_50px_rgba(224,202,60,0.35)] text-[#DDFBD0] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#086375] pb-2 mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-gear text-[#E0CA3C]" />
            <h2 className="font-display font-bold text-sm text-[#E0CA3C] tracking-wide">
              SYSTEM SETTINGS & ERGONOMICS ENGINE
            </h2>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-xs text-[#FE5F00] hover:text-white px-2 py-0.5 rounded border border-[#FE5F00]/40 font-bold cursor-pointer"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* 2 Unified Tabs */}
        <div className="flex border-b border-[#086375]/50 mb-3 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`flex-1 py-1.5 text-center font-bold transition-colors cursor-pointer ${
              activeTab === 'display'
                ? 'border-b-2 border-[#E0CA3C] text-[#E0CA3C] bg-[#E0CA3C]/10'
                : 'text-[#DDFBD0]/60 hover:text-[#DDFBD0]'
            }`}
          >
            <i className="fa-solid fa-sliders mr-1.5" />
            TAB 1: DISPLAY & ERGONOMICS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('keybindings')}
            className={`flex-1 py-1.5 text-center font-bold transition-colors cursor-pointer ${
              activeTab === 'keybindings'
                ? 'border-b-2 border-[#E0CA3C] text-[#E0CA3C] bg-[#E0CA3C]/10'
                : 'text-[#DDFBD0]/60 hover:text-[#DDFBD0]'
            }`}
          >
            <i className="fa-solid fa-keyboard mr-1.5" />
            TAB 2: KEYBINDINGS & RTS GROUPS
          </button>
        </div>

        {/* Tab 1: Display & Ergonomics */}
        {activeTab === 'display' && (
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
            {/* Master UI Scale Slider */}
            <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10">
              <div className="flex justify-between items-center mb-1.5 font-bold">
                <span>Master UI Scale Engine:</span>
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
                <span>100% (Nominal)</span>
                <span>125% (Expanded)</span>
              </div>
            </div>

            {/* Kanban Column Scale Slider */}
            <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10">
              <div className="flex justify-between items-center mb-1.5 font-bold">
                <span>Kanban Column Density Scale:</span>
                <span className="text-[#E0CA3C]">{Math.round(columnScale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.80"
                max="1.20"
                step="0.05"
                value={columnScale}
                onChange={(e) => setColumnScale(Number(e.target.value))}
                className="w-full accent-[#E0CA3C] cursor-pointer"
              />
              <div className="flex justify-between text-[0.6rem] text-[#DDFBD0]/50 mt-1">
                <span>80% (Compact Columns)</span>
                <span>100% (Standard 360px)</span>
                <span>120% (Wide Cards)</span>
              </div>
            </div>

            {/* 4 Bottom Console Chassis Bay Width Sliders */}
            <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10 space-y-2">
              <span className="font-bold block text-[#E0CA3C] mb-1">
                Independent Bottom Console Pod Widths:
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
                <span>Bay 2 (Alfred Center): {centerRatio}px</span>
                <input
                  type="range"
                  min="340"
                  max="560"
                  step="10"
                  value={centerRatio}
                  onChange={(e) => setCenterRatio(Number(e.target.value))}
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

            {/* Canvas Background Selector */}
            <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10">
              <span className="font-bold block text-[#E0CA3C] mb-2">
                Canvas Theme Background:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'obsidian-grid', label: 'Obsidian Grid' },
                  { id: 'tactical-hex', label: 'Tactical Hex' },
                  { id: 'crystal-strata', label: 'Crystal Strata' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setCanvasTheme(th.id)}
                    className={`p-2 rounded border text-center font-bold text-[0.65rem] transition-all cursor-pointer ${
                      canvasTheme === th.id
                        ? 'border-[#E0CA3C] bg-[#E0CA3C]/20 text-[#E0CA3C]'
                        : 'border-[#086375]/50 bg-[#020500]/60 text-[#DDFBD0]/70 hover:border-[#DDFBD0]'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Keybindings & RTS Control Groups */}
        {activeTab === 'keybindings' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {/* RTS Control Groups Guide */}
            <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10 space-y-1.5">
              <span className="font-bold text-[#E0CA3C] block mb-1">
                RTS Client Keybinding Engine:
              </span>
              <div className="p-2 rounded bg-[#020500]/70 border border-[#086375]/40 text-[0.65rem] space-y-1">
                <p>
                  <span className="text-[#FE5F00] font-bold">Shift + 1-9:</span> Binds currently selected client to that numerical slot.
                </p>
                <p>
                  <span className="text-[#E0CA3C] font-bold">1-9 (Unmodified):</span> Instantly recalls the bound client, centers the canvas, and locks the Dossier Bay.
                </p>
                <p>
                  <span className="text-[#DDFBD0]/60 font-bold">0:</span> Clears client lock and returns to Global Monitor.
                </p>
              </div>
            </div>

            {/* Department Shortcuts (Alt + 1..5) */}
            <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10">
              <span className="font-bold text-[#E0CA3C] block mb-2">
                Department Navigation (Alt + 1..5):
              </span>
              <div className="grid grid-cols-2 gap-2 text-[0.65rem]">
                {Object.entries(keymap.departments).map(([k, v]) => (
                  <div key={k} className="flex justify-between p-1.5 rounded bg-[#020500]/70 border border-[#086375]/30">
                    <span className="text-[#FE5F00] font-bold">{k}</span>
                    <span className="text-[#DDFBD0]/80 uppercase">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kanban Density (Ctrl + 1..4) */}
            <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10">
              <span className="font-bold text-[#E0CA3C] block mb-2">
                Kanban Topology & Filters (Ctrl + 1..4):
              </span>
              <div className="grid grid-cols-2 gap-2 text-[0.65rem]">
                {Object.entries(keymap.kanbanViews).slice(0, 4).map(([k, v]) => (
                  <div key={k} className="flex justify-between p-1.5 rounded bg-[#020500]/70 border border-[#086375]/30">
                    <span className="text-[#E0CA3C] font-bold">{k}</span>
                    <span className="text-[#DDFBD0]/80 uppercase">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 border-t border-[#086375] pt-3 mt-3 shrink-0">
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
