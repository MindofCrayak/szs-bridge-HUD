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

  // Real-time CSS Variable Injections
  const handleUiScaleChange = (val: number) => {
    setUiScale(val);
    document.documentElement.style.setProperty('--ui-scale', val.toString());
  };

  const handleBayWidthChange = (bayVar: string, px: number, setter: (val: number) => void) => {
    setter(px);
    document.documentElement.style.setProperty(bayVar, `${px}px`);
  };

  const handleColumnScaleChange = (val: number) => {
    setColumnScale(val);
    document.documentElement.style.setProperty('--column-scale', val.toString());
  };

  const handleCanvasThemeChange = (theme: string) => {
    setCanvasTheme(theme);
    try {
      localStorage.setItem('szs_canvas_theme', theme);
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

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
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs custom-scrollbar">
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
                onChange={(e) => handleUiScaleChange(Number(e.target.value))}
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
                onChange={(e) => handleColumnScaleChange(Number(e.target.value))}
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
                  onChange={(e) => handleBayWidthChange('--bay-calendar-w', Number(e.target.value), setCalRatio)}
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
                  onChange={(e) => handleBayWidthChange('--bay-center-w', Number(e.target.value), setCenterRatio)}
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
                  onChange={(e) => handleBayWidthChange('--bay-dossier-w', Number(e.target.value), setDossierRatio)}
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
                  onChange={(e) => handleBayWidthChange('--bay-macro-w', Number(e.target.value), setMacroRatio)}
                  className="w-40 accent-[#E0CA3C] cursor-pointer"
                />
              </div>
            </div>

            {/* Reactive Canvas Background Theme Selector */}
            <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10 space-y-1.5">
              <span className="font-bold block text-[#E0CA3C]">Canvas Background Environment:</span>
              <div className="grid grid-cols-3 gap-2 text-[0.7rem]">
                <button
                  type="button"
                  onClick={() => handleCanvasThemeChange('obsidian-grid')}
                  className={`py-1.5 rounded border transition-colors cursor-pointer ${
                    canvasTheme === 'obsidian-grid'
                      ? 'border-[#E0CA3C] bg-[#E0CA3C]/20 text-[#E0CA3C] font-bold'
                      : 'border-[#086375] bg-[#020500] text-[#DDFBD0]/70'
                  }`}
                >
                  OBSIDIAN GRID
                </button>
                <button
                  type="button"
                  onClick={() => handleCanvasThemeChange('tactical-hex')}
                  className={`py-1.5 rounded border transition-colors cursor-pointer ${
                    canvasTheme === 'tactical-hex'
                      ? 'border-[#E0CA3C] bg-[#E0CA3C]/20 text-[#E0CA3C] font-bold'
                      : 'border-[#086375] bg-[#020500] text-[#DDFBD0]/70'
                  }`}
                >
                  TACTICAL HEX
                </button>
                <button
                  type="button"
                  onClick={() => handleCanvasThemeChange('void')}
                  className={`py-1.5 rounded border transition-colors cursor-pointer ${
                    canvasTheme === 'void'
                      ? 'border-[#E0CA3C] bg-[#E0CA3C]/20 text-[#E0CA3C] font-bold'
                      : 'border-[#086375] bg-[#020500] text-[#DDFBD0]/70'
                  }`}
                >
                  ABSOLUTE VOID
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Keybindings & RTS Groups */}
        {activeTab === 'keybindings' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs custom-scrollbar">
            <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10">
              <span className="font-bold block text-[#E0CA3C] mb-2">Tactical Macro Pad (Q..C):</span>
              <div className="grid grid-cols-3 gap-2">
                {(['Q', 'W', 'E', 'A', 'S', 'D', 'Z', 'X', 'C'] as const).map((key) => (
                  <div key={key} className="flex items-center justify-between border border-[#086375]/50 bg-[#020500] p-1.5 rounded">
                    <span className="font-bold text-[#E0CA3C]">{key}:</span>
                    <input
                      type="text"
                      maxLength={1}
                      value={keymap[key]}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        if (val) setKeymap((prev) => ({ ...prev, [key]: val }));
                      }}
                      className="w-8 text-center bg-[#086375]/20 border border-[#086375] rounded text-white font-bold"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-[#086375]/60 bg-[#086375]/10 space-y-1">
              <span className="font-bold block text-[#E0CA3C]">RTS Control Groups (StarCraft Style):</span>
              <p className="text-[0.65rem] text-[#DDFBD0]/60">
                • <strong className="text-white">Ctrl + 1..9:</strong> Bind currently selected client card to group slot.
              </p>
              <p className="text-[0.65rem] text-[#DDFBD0]/60">
                • <strong className="text-white">1..9:</strong> Single tap recalls client and centers camera.
              </p>
              <p className="text-[0.65rem] text-[#DDFBD0]/60">
                • <strong className="text-white">Double tap 1..9:</strong> Recalls and enters granular sprint drill-down.
              </p>
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-between border-t border-[#086375] pt-3 mt-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              handleUiScaleChange(1.0);
              handleColumnScaleChange(1.0);
              handleBayWidthChange('--bay-calendar-w', 280, setCalRatio);
              handleBayWidthChange('--bay-center-w', 420, setCenterRatio);
              handleBayWidthChange('--bay-dossier-w', 270, setDossierRatio);
              handleBayWidthChange('--bay-macro-w', 280, setMacroRatio);
              handleCanvasThemeChange('obsidian-grid');
            }}
            className="text-[0.65rem] text-[#DDFBD0]/60 hover:text-white underline cursor-pointer"
          >
            Reset Defaults
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded border border-[#086375] text-[#DDFBD0]/70 hover:bg-[#086375]/20 transition-colors cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1 rounded bg-[#E0CA3C] text-black font-bold hover:brightness-110 transition-all cursor-pointer text-xs shadow-[0_0_12px_rgba(224,202,60,0.4)]"
            >
              SAVE CONFIG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
