import React, { useState, useRef, useEffect } from 'react';
import { HudTelemetry, ScreenView, ClientRecord } from '../../types';
import { SolarMapSelector } from './SolarMapSelector';

interface SkyHeaderProps {
  currentScreen: ScreenView;
  telemetry: HudTelemetry | null;
  isBackendConnected: boolean;
  onSelectScreen: (screen: ScreenView) => void;
  onOpenDepartments: () => void;
  isDepartmentConsoleOpen: boolean;
  onSignOut: () => void;
  onOpenKeybindings?: () => void;
  currentSkin?: string;
  onToggleSkin?: () => void;
  onSpawnCockpit?: () => void;
  clients?: ClientRecord[];
  activeClientId?: string | null;
  onSelectClient?: (client: any) => void;
}

export const SkyHeader: React.FC<SkyHeaderProps> = ({
  currentScreen,
  telemetry,
  isBackendConnected,
  onSelectScreen,
  onOpenDepartments,
  isDepartmentConsoleOpen,
  onSignOut,
  onOpenKeybindings,
  currentSkin = 'heraldry-gold',
  onToggleSkin,
  onSpawnCockpit,
  clients = [],
  activeClientId = null,
  onSelectClient,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [isFocusedMode, setIsFocusedMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('szs_header_focus_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [isHoveringTop, setIsHoveringTop] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setIsOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFocusMode = () => {
    setIsFocusedMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('szs_header_focus_mode', String(next));
      } catch {}
      return next;
    });
  };

  const handleSpawnCockpit = () => {
    window.open('/cockpit', 'SZS_AvionicsCockpit', 'popup=yes,width=762,height=1366,left=1680,top=0,resizable=yes');
    setIsOverflowOpen(false);
  };

  const views: { id: ScreenView; label: string; icon: string; hotkey: string }[] = [
    { id: 'dashboard', label: '1. PIPELINE', icon: 'fa-diagram-project', hotkey: 'Alt+1' },
    { id: 'osint', label: '2. OSINT', icon: 'fa-crosshairs', hotkey: 'Alt+2' },
    { id: 'symphony', label: '3. SYMPHONY', icon: 'fa-wave-square', hotkey: 'Alt+3' },
    { id: 'treasure', label: '4. TREASURE', icon: 'fa-coins', hotkey: 'Alt+4' },
    { id: 'archive', label: '5. MAIL', icon: 'fa-envelope-open-text', hotkey: 'Alt+5' },
  ];

  const isHidden = isFocusedMode && !isHoveringTop;

  return (
    <>
      {/* Invisible Hover Sensor at top edge when Focus Mode is on */}
      {isFocusedMode && (
        <div
          onMouseEnter={() => setIsHoveringTop(true)}
          className="fixed top-0 left-0 right-0 h-2 z-[130] pointer-events-auto"
        />
      )}

      <header
        onMouseEnter={() => isFocusedMode && setIsHoveringTop(true)}
        onMouseLeave={() => isFocusedMode && setIsHoveringTop(false)}
        className={`relative z-20 h-[48px] shrink-0 border-b border-[#086375]/60 bg-[#020500]/95 px-3 flex items-center justify-between gap-2 shadow-md select-none transition-transform duration-200 ease-out font-mono text-xs ${
          isHidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* ── LEFT: Logo + Title + Solar Map Selector ──────────────── */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            className="h-7 px-2 rounded bg-[#FE5F00] font-serif-display text-xs font-bold text-[#020500] hover:scale-105 transition-transform cursor-pointer"
            onClick={() => onSelectScreen('dashboard')}
            title="Session Zero Solutions home (Alt+1)"
          >
            SZS
          </button>
          <span className="font-display text-xs font-extrabold text-[#DDFBD0] tracking-wide hidden sm:inline">
            Command HUD
          </span>

          {/* Solar Map Client Selector */}
          {onSelectClient && (
            <SolarMapSelector
              clients={clients}
              activeClientId={activeClientId}
              onSelectClient={onSelectClient}
            />
          )}
        </div>

        {/* ── CENTER: 5 Views Segmented Nav ───────────────────────── */}
        <nav aria-label="Primary canvases" className="flex items-center gap-0.5 rounded-lg border border-[#086375]/50 p-0.5 bg-[#040706]">
          {views.map((v) => {
            const isActive = currentScreen === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectScreen(v.id)}
                aria-pressed={isActive}
                title={`${v.label} (${v.hotkey})`}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[0.62rem] font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FE5F00] text-black shadow-[0_0_10px_rgba(254,95,0,0.4)]'
                    : 'text-[#DDFBD0]/70 hover:bg-[#086375]/40 hover:text-[#DDFBD0]'
                }`}
              >
                <i className={`fa-solid ${v.icon} text-[0.6rem]`} />
                <span className="hidden xl:inline">{v.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── RIGHT: Urgent Alert + Menu Dropdown + Overflow ────────── */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Urgent Alert Badge */}
          {telemetry && telemetry.missingDeposits > 0 && (
            <button
              type="button"
              onClick={() => onSelectScreen('dashboard')}
              className="flex items-center gap-1 px-2 py-1 rounded border border-[#FE5F00] bg-[#FE5F00]/20 text-[#FE5F00] text-[0.6rem] font-bold animate-pulse cursor-pointer"
              title={`${telemetry.missingDeposits} Client(s) missing upfront deposit`}
            >
              <i className="fa-solid fa-triangle-exclamation text-[0.55rem]" />
              <span>DEP DUE: {telemetry.missingDeposits}</span>
            </button>
          )}

          {/* Menu Dropdown (Overview, Directory, Actions, Departments) */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-expanded={isMenuOpen}
              className={`flex items-center gap-1 px-2 py-1 rounded border text-[0.62rem] font-bold transition-all cursor-pointer ${
                isMenuOpen || isDepartmentConsoleOpen
                  ? 'border-[#E0CA3C] bg-[#E0CA3C]/20 text-[#E0CA3C]'
                  : 'border-[#086375]/60 bg-[#086375]/15 text-[#DDFBD0]/80 hover:border-[#E0CA3C]'
              }`}
            >
              <i className="fa-solid fa-bars text-[0.55rem]" />
              <span>MENU</span>
              <i className={`fa-solid fa-chevron-down text-[0.5rem] transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-[#086375] bg-[#020500]/98 p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.9)] backdrop-blur-md z-50">
                <button
                  type="button"
                  onClick={() => { onSelectScreen('pipeline'); setIsMenuOpen(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#086375]/30 text-[#DDFBD0] flex items-center justify-between cursor-pointer"
                >
                  <span>Pipeline Overview</span>
                  <span className="text-[0.55rem] text-[#DDFBD0]/50">Alt+1</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onSelectScreen('clients'); setIsMenuOpen(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#086375]/30 text-[#DDFBD0] flex items-center justify-between cursor-pointer"
                >
                  <span>Client Directory</span>
                  <span className="text-[0.55rem] text-[#DDFBD0]/50">Alt+6</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onSelectScreen('actions'); setIsMenuOpen(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#086375]/30 text-[#DDFBD0] flex items-center justify-between cursor-pointer"
                >
                  <span>Macro Matrix Actions</span>
                  <span className="text-[0.55rem] text-[#DDFBD0]/50">Alt+7</span>
                </button>
                <div className="border-t border-[#086375]/40 my-1" />
                <button
                  type="button"
                  onClick={() => { onOpenDepartments(); setIsMenuOpen(false); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between cursor-pointer ${
                    isDepartmentConsoleOpen ? 'bg-[#E0CA3C]/20 text-[#E0CA3C] font-bold' : 'hover:bg-[#086375]/30 text-[#DDFBD0]'
                  }`}
                >
                  <span>Departments Console</span>
                  <i className="fa-solid fa-layer-group text-[0.55rem]" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Command Palette Trigger (Ctrl+K) */}
          <button
            type="button"
            onClick={() => onSelectScreen('actions')}
            className="flex items-center gap-1 px-2 py-1 rounded border border-[#086375]/60 bg-[#086375]/10 text-[#DDFBD0]/70 hover:border-[#E0CA3C] hover:text-[#E0CA3C] text-[0.62rem] transition-all cursor-pointer"
            title="Command Palette & Quick Actions (Ctrl+K)"
          >
            <i className="fa-solid fa-magnifying-glass text-[0.55rem]" />
            <kbd className="text-[0.55rem] px-1 rounded bg-[#020500] border border-[#086375]">⌘K</kbd>
          </button>

          {/* Focus Mode Pin/Unpin Toggle */}
          <button
            type="button"
            onClick={toggleFocusMode}
            className={`p-1.5 rounded border text-[0.6rem] transition-colors cursor-pointer ${
              isFocusedMode
                ? 'border-[#E0CA3C] bg-[#E0CA3C]/20 text-[#E0CA3C]'
                : 'border-[#086375]/60 text-[#DDFBD0]/60 hover:text-[#DDFBD0]'
            }`}
            title={isFocusedMode ? 'Unpin Header Auto-Hide (Focus Mode Active)' : 'Pin Header / Toggle Auto-Hide Focus Mode'}
          >
            <i className={`fa-solid ${isFocusedMode ? 'fa-thumbtack -rotate-45 text-[#E0CA3C]' : 'fa-thumbtack'}`} />
          </button>

          {/* Overflow Menu (...) */}
          <div className="relative" ref={overflowRef}>
            <button
              type="button"
              onClick={() => setIsOverflowOpen((prev) => !prev)}
              aria-expanded={isOverflowOpen}
              className="p-1.5 rounded border border-[#086375]/60 bg-[#086375]/10 text-[#DDFBD0]/70 hover:border-[#E0CA3C] hover:text-[#E0CA3C] text-[0.65rem] transition-colors cursor-pointer"
              title="More options & Settings"
            >
              <i className="fa-solid fa-ellipsis-vertical" />
            </button>

            {isOverflowOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-[#086375] bg-[#020500]/98 p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.9)] backdrop-blur-md z-50">
                {onToggleSkin && (
                  <button
                    type="button"
                    onClick={() => { onToggleSkin(); setIsOverflowOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#086375]/30 text-[#DDFBD0] flex items-center justify-between cursor-pointer"
                  >
                    <span>Skin: {currentSkin === 'heraldry-gold' ? 'Gold' : 'Stealth'}</span>
                    <i className={`fa-solid ${currentSkin === 'heraldry-gold' ? 'fa-shield-halved text-[#E0CA3C]' : 'fa-ghost text-[#086375]'}`} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSpawnCockpit}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#086375]/30 text-[#E0CA3C] flex items-center justify-between cursor-pointer"
                >
                  <span>Spawn Cockpit [762×1366]</span>
                  <i className="fa-solid fa-arrow-up-right-from-square text-[0.55rem]" />
                </button>

                {onOpenKeybindings && (
                  <button
                    type="button"
                    onClick={() => { onOpenKeybindings(); setIsOverflowOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#086375]/30 text-[#DDFBD0] flex items-center justify-between cursor-pointer"
                  >
                    <span>Settings & Keymap</span>
                    <i className="fa-solid fa-gear text-[0.55rem]" />
                  </button>
                )}

                <div className="border-t border-[#086375]/40 my-1" />

                <button
                  type="button"
                  onClick={() => { onSignOut(); setIsOverflowOpen(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#FE5F00]/20 text-[#FE5F00] flex items-center justify-between cursor-pointer font-bold"
                >
                  <span>Sign Out</span>
                  <i className="fa-solid fa-right-from-bracket text-[0.55rem]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
