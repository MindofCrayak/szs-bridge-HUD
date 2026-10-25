import React from 'react';
import { HudTelemetry, ScreenView } from '../types';

interface SkyHeaderProps {
  currentScreen: ScreenView;
  telemetry: HudTelemetry | null;
  isBackendConnected: boolean;
  onSelectScreen: (screen: ScreenView) => void;
  onOpenDepartments: () => void;
  isDepartmentConsoleOpen: boolean;
  onSignOut: () => void;
  zoomScale?: number;
  onResetZoom?: () => void;
  onSetZoom?: (scale: number) => void;
  onOpenKeybindings?: () => void;
  currentSkin?: string;
  onToggleSkin?: () => void;
  onSpawnCockpit?: () => void;
}

const routeButtonClass = (isActive: boolean): string => `flex items-center gap-1 rounded px-2 py-1 font-display text-[0.62rem] font-bold transition-all cursor-pointer ${
  isActive
    ? 'border border-alert-orange bg-alert-orange text-bg-obsidian'
    : 'text-text-mana/75 hover:bg-accent-teal/40 hover:text-text-mana'
}`;

export const SkyHeader: React.FC<SkyHeaderProps> = ({
  currentScreen,
  telemetry,
  isBackendConnected,
  onSelectScreen,
  onOpenDepartments,
  isDepartmentConsoleOpen,
  onSignOut,
  zoomScale = 1.0,
  onResetZoom,
  onSetZoom,
  onOpenKeybindings,
  currentSkin = 'heraldry-gold',
  onToggleSkin,
  onSpawnCockpit,
}) => {
  const [isZoomPopoverOpen, setIsZoomPopoverOpen] = React.useState(false);
  const zoomPopoverRef = React.useRef<HTMLDivElement>(null);

  // Close zoom popover when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isZoomPopoverOpen && zoomPopoverRef.current && !zoomPopoverRef.current.contains(event.target as Node)) {
        setIsZoomPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isZoomPopoverOpen]);

  // Dedicated Browser Popup Window Launcher for Display 2 (762x1366)
  const handleSpawnCockpit = () => {
    window.open('/cockpit', 'SZS_AvionicsCockpit', 'popup=yes,width=762,height=1366,left=1680,top=0,resizable=yes');
  };

  return (
    <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-accent-teal/60 bg-bg-obsidian/95 px-4 py-2 shadow-md select-none">
      <div className="flex items-center gap-3">
        <button
          className="h-8 rounded-md bg-alert-orange px-2 font-serif-display text-sm font-bold text-bg-obsidian transition-transform hover:scale-105 cursor-pointer"
          onClick={() => onSelectScreen('dashboard')}
          title="Session Zero Solutions home (Alt+1)"
        >
          SZS
        </button>
        <div>
          <div className="font-display text-xs font-extrabold tracking-wide text-text-mana sm:text-sm">
            Session Zero Solutions // Command HUD
          </div>
          <div className="font-mono text-[0.62rem] uppercase tracking-wide text-text-mana/65">
            GOOGLE WORKSPACE CRM // CLIENT DELIVERY
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Navigation Switcher: 5 Top Department Tabs */}
        <nav aria-label="Department canvases" className="flex items-center gap-1 rounded-lg border border-accent-teal/60 p-1">
          <button
            type="button"
            onClick={() => onSelectScreen('dashboard')}
            aria-pressed={currentScreen === 'dashboard'}
            className={`${routeButtonClass(currentScreen === 'dashboard')} px-2 sm:px-2.5`}
            title="1. Tactical Kanban Pipeline (Alt+1)"
          >
            <i className="fa-solid fa-diagram-project" />
            <span>1. PIPELINE</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectScreen('osint')}
            aria-pressed={currentScreen === 'osint'}
            className={`${routeButtonClass(currentScreen === 'osint')} px-2 sm:px-2.5`}
            title="2. Oracle's Spatial Intelligence Canvas & Competitive Radar (Alt+2)"
          >
            <i className="fa-solid fa-crosshairs text-accent-teal" />
            <span>2. OSINT WAR ROOM</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectScreen('symphony')}
            aria-pressed={currentScreen === 'symphony'}
            className={`${routeButtonClass(currentScreen === 'symphony')} px-2 sm:px-2.5`}
            title="3. Dolores's Gantt Roadmap & Sprint Matrix (Alt+3)"
          >
            <i className="fa-solid fa-wave-square text-highlight-gold" />
            <span>3. SYMPHONY</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectScreen('treasure')}
            aria-pressed={currentScreen === 'treasure'}
            className={`${routeButtonClass(currentScreen === 'treasure')} px-2 sm:px-2.5`}
            title="4. Vala's Milestone Billing & Fiscal Ledger (Alt+4)"
          >
            <i className="fa-solid fa-coins text-gold" />
            <span>4. TREASURE</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectScreen('archive')}
            aria-pressed={currentScreen === 'archive'}
            className={`${routeButtonClass(currentScreen === 'archive')} px-2 sm:px-2.5`}
            title="5. Daisy's Mail Command Center (MCC), Broadcasts, Drips & Grand Archive (Alt+5)"
          >
            <i className="fa-solid fa-envelope-open-text text-highlight-gold" />
            <span>5. MAIL COMMAND</span>
          </button>
        </nav>

        {/* Directory, Overview, Actions navigation */}
        <nav aria-label="HUD sections" className="flex items-center gap-0.5 rounded-lg border border-accent-teal/60 p-1">
          <button type="button" onClick={() => onSelectScreen('pipeline')} className={routeButtonClass(currentScreen === 'pipeline')} title="Pipeline summary">
            OVERVIEW
          </button>
          <button type="button" onClick={() => onSelectScreen('clients')} className={routeButtonClass(currentScreen === 'clients')} title="Client directory (Alt+6)">
            DIRECTORY
          </button>
          <button type="button" onClick={() => onSelectScreen('actions')} className={routeButtonClass(currentScreen === 'actions')} title="Workspace shortcuts (Alt+7)">
            ACTIONS
          </button>
        </nav>

        {/* Departments Drawer Button */}
        <button
          type="button"
          onClick={onOpenDepartments}
          aria-expanded={isDepartmentConsoleOpen}
          aria-controls="department-console"
          className={`${routeButtonClass(isDepartmentConsoleOpen)} border border-accent-teal/60 px-3`}
          title="Open department consoles over the tactical canvas"
        >
          <i className="fa-solid fa-layer-group" />
          <span>DEPARTMENTS</span>
        </button>

        {/* Tactical Zoom Popover Control */}
        <div className="relative" ref={zoomPopoverRef}>
          <button
            type="button"
            onClick={() => setIsZoomPopoverOpen((prev) => !prev)}
            aria-expanded={isZoomPopoverOpen}
            className={`flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-[0.61rem] transition-all cursor-pointer ${
              isZoomPopoverOpen
                ? 'border-highlight-gold bg-primary-plum text-highlight-gold shadow-[0_0_10px_rgba(224,202,60,0.3)]'
                : 'border-accent-teal/60 bg-primary-plum/30 text-text-mana/80 hover:border-highlight-gold hover:text-highlight-gold'
            }`}
            title="Tactical Scale & Canvas Zoom - Click for Range Slider & Presets (or Alt + Scroll Wheel on Canvas)"
          >
            <i className="fa-solid fa-magnifying-glass text-[0.55rem] text-highlight-gold" />
            <span className="font-bold">{Math.round(zoomScale * 100)}%</span>
            <i className={`fa-solid fa-chevron-down text-[0.5rem] transition-transform ${isZoomPopoverOpen ? 'rotate-180' : ''}`} />
          </button>

          {isZoomPopoverOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-accent-teal/80 bg-bg-obsidian/98 p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.9),0_0_15px_rgba(8,99,117,0.5)] backdrop-blur-md z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between text-[11px] font-mono text-text-mana mb-2 border-b border-accent-teal/40 pb-1.5">
                <span className="font-bold tracking-wider uppercase text-[0.65rem]">Tactical Scale</span>
                <span className="text-highlight-gold font-bold text-xs">{Math.round(zoomScale * 100)}%</span>
              </div>

              {/* Range Slider - Wires directly to onSetZoom */}
              <div className="mb-3">
                <input
                  type="range"
                  min="60"
                  max="140"
                  step="5"
                  value={Math.round(zoomScale * 100)}
                  onChange={(e) => onSetZoom?.(Number(e.target.value) / 100)}
                  className="w-full accent-highlight-gold cursor-pointer h-1.5 bg-accent-teal/30 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] font-mono text-text-mana/50 mt-1">
                  <span>60% (Macro)</span>
                  <span>100% (Default)</span>
                  <span>140% (Focus)</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono mb-2.5">
                <button
                  type="button"
                  onClick={() => onSetZoom?.(0.65)}
                  className="px-2 py-1 rounded border border-accent-teal/60 bg-accent-teal/15 text-text-mana hover:border-accent-teal hover:bg-accent-teal/30 transition-colors cursor-pointer"
                >
                  65%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onResetZoom) onResetZoom();
                    else onSetZoom?.(1.0);
                  }}
                  className="px-2 py-1 rounded border border-highlight-gold/60 bg-highlight-gold/20 text-highlight-gold font-bold hover:bg-highlight-gold/30 transition-colors cursor-pointer"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => onSetZoom?.(1.25)}
                  className="px-2 py-1 rounded border border-accent-teal/60 bg-accent-teal/15 text-text-mana hover:border-accent-teal hover:bg-accent-teal/30 transition-colors cursor-pointer"
                >
                  125%
                </button>
              </div>

              <div className="border-t border-accent-teal/40 pt-2 flex items-center justify-between text-[9px] font-mono text-text-mana/60">
                <span>Hotkey: Alt + Wheel</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetZoom?.();
                    setIsZoomPopoverOpen(false);
                  }}
                  className="text-highlight-gold underline hover:text-alert-orange cursor-pointer"
                >
                  Reset Pan & Zoom
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chassis Skin Toggle */}
        {onToggleSkin && (
          <button
            type="button"
            onClick={onToggleSkin}
            className="flex items-center gap-1 rounded border border-accent-teal/60 bg-primary-plum/30 px-2 py-1 font-mono text-[0.61rem] text-text-mana/80 hover:border-highlight-gold hover:text-highlight-gold transition-colors cursor-pointer"
            title={`Chassis Skin: ${currentSkin === 'heraldry-gold' ? 'Heraldry Gold' : 'Stealth Obsidian'} - Click to toggle`}
          >
            <i className={`fa-solid ${currentSkin === 'heraldry-gold' ? 'fa-shield-halved text-highlight-gold' : 'fa-ghost text-accent-teal'}`} />
            <span className="uppercase">{currentSkin === 'heraldry-gold' ? 'GOLD' : 'STEALTH'}</span>
          </button>
        )}

        {/* Display 2: Spawn Cockpit Pop-Out Toggle */}
        <button
          type="button"
          onClick={handleSpawnCockpit}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#E0CA3C] bg-[#E0CA3C]/10 text-[#E0CA3C] hover:bg-[#E0CA3C] hover:text-black transition-all font-mono text-xs font-bold shadow-[0_0_10px_rgba(224,202,60,0.2)] cursor-pointer"
          title="Open Avionics Cockpit UI on Secondary Monitor (762x1366)"
        >
          <i className="fa-solid fa-arrow-up-right-from-square text-[0.6rem]" />
          <span>SPAWN COCKPIT [762×1366]</span>
        </button>

        {/* Module 5: Single Unified Settings Gear Button */}
        {onOpenKeybindings && (
          <button
            type="button"
            onClick={onOpenKeybindings}
            className="flex items-center gap-1.5 rounded border border-[#E0CA3C]/60 bg-[#E0CA3C]/10 px-2.5 py-1 font-mono text-[0.61rem] text-[#E0CA3C] hover:bg-[#E0CA3C] hover:text-black transition-all cursor-pointer font-bold shadow-[0_0_8px_rgba(224,202,60,0.2)]"
            title="Unified System Settings & Ergonomics Engine"
          >
            <i className="fa-solid fa-gear text-[0.65rem]" />
            <span>SETTINGS</span>
          </button>
        )}

        <button
          type="button"
          onClick={onSignOut}
          className="rounded border border-accent-teal/60 px-2 py-1 font-mono text-[0.61rem] text-text-mana/70 hover:border-alert-orange hover:text-alert-orange cursor-pointer"
          title="Clear the in-memory Google token and HUD data"
        >
          SIGN OUT
        </button>
      </div>

      {/* Persistent Telemetry Ribbon Indicators */}
      <div className="flex flex-wrap items-center justify-end gap-1.5 font-mono text-[0.61rem]">
        <div className="flex items-center gap-1.5 rounded border border-accent-teal bg-primary-plum/45 px-2 py-1 text-gold" title="Total contract value of active clients">
          <i className="fa-solid fa-chart-line text-accent-teal" />
          <span>PIPELINE: ${telemetry ? (telemetry.pipelineMrr ?? 0).toLocaleString() : '0'}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded border border-accent-teal bg-primary-plum/45 px-2 py-1 text-text-mana" title="Clients in building or testing stages">
          <i className="fa-solid fa-layer-group text-accent-teal" />
          <span>SPRINTS: {telemetry ? telemetry.activeSprints : 0}</span>
        </div>
        <div
          className={`flex items-center gap-1.5 rounded border px-2 py-1 ${
            telemetry && telemetry.missingDeposits > 0
              ? 'border-alert-orange bg-primary-plum/70 text-alert-orange'
              : 'border-accent-teal bg-primary-plum/45 text-text-mana/70'
          }`}
          title="Clients in Session Zero missing upfront deposit"
        >
          <i className="fa-solid fa-triangle-exclamation" />
          <span>DEP DUE: {telemetry ? telemetry.missingDeposits : 0}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded border border-accent-teal bg-primary-plum/45 px-2 py-1 text-text-mana/70">
          <i className="fa-solid fa-signal text-accent-teal" />
          <span>GA4: 14 LIVE</span>
        </div>
        <div className="flex items-center gap-1.5 rounded border border-accent-teal bg-primary-plum/45 px-2 py-1 text-text-mana/70">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>POLICE ENGINE NOMINAL</span>
        </div>
      </div>
    </header>
  );
};
