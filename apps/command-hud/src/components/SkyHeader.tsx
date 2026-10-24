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
}

const routeButtonClass = (isActive: boolean): string => `flex items-center gap-1 rounded px-2 py-1 font-display text-[0.62rem] font-bold transition-all ${
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
}) => {
  return (
    <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-accent-teal/60 bg-bg-obsidian/95 px-4 py-2 shadow-md">
      <div className="flex items-center gap-3">
        <button
          className="h-8 rounded-md bg-alert-orange px-2 font-serif-display text-sm font-bold text-bg-obsidian transition-transform hover:scale-105"
          onClick={() => onSelectScreen('dashboard')}
          title="Session Zero Solutions home"
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
        <nav aria-label="Viewport switcher" className="flex items-center gap-1 rounded-lg border border-accent-teal bg-primary-plum/50 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => onSelectScreen('dashboard')}
            aria-pressed={currentScreen === 'dashboard'}
            className={`${routeButtonClass(currentScreen === 'dashboard')} px-2 sm:px-3`}
            title="Tactical Pipeline"
          >
            <i className="fa-solid fa-diagram-project" />
            <span>TACTICAL PIPELINE</span>
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="flex cursor-not-allowed items-center gap-1 rounded px-2 py-1 font-display text-[0.62rem] font-bold text-text-mana/35 sm:px-3"
            title="Oracle MMD is quarantined and excluded from the Command HUD package"
          >
            <i className="fa-solid fa-eye" />
            <span>ORACLE QUARANTINED</span>
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="flex cursor-not-allowed items-center gap-1 rounded px-2 py-1 font-display text-[0.62rem] font-bold text-text-mana/35 sm:px-3"
            title="Symphony Matrix is not available yet"
          >
            <i className="fa-solid fa-wave-square" />
            <span className="hidden sm:inline">SYMPHONY</span>
            <span className="text-[0.5rem]">STUB</span>
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="flex cursor-not-allowed items-center gap-1 rounded px-2 py-1 font-display text-[0.62rem] font-bold text-text-mana/35 sm:px-3"
            title="Treasure Ledger is not available yet"
          >
            <i className="fa-solid fa-coins" />
            <span className="hidden sm:inline">TREASURE</span>
            <span className="text-[0.5rem]">STUB</span>
          </button>
        </nav>

        <nav aria-label="HUD sections" className="flex items-center gap-0.5 rounded-lg border border-accent-teal/60 p-1">
          <button type="button" onClick={() => onSelectScreen('pipeline')} className={routeButtonClass(currentScreen === 'pipeline')} title="Pipeline summary">
            PIPELINE
          </button>
          <button type="button" onClick={() => onSelectScreen('clients')} className={routeButtonClass(currentScreen === 'clients')} title="Client directory">
            CLIENTS
          </button>
          <button type="button" onClick={() => onSelectScreen('actions')} className={routeButtonClass(currentScreen === 'actions')} title="Workspace shortcuts">
            ACTIONS
          </button>
        </nav>
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
        <button
          type="button"
          onClick={onSignOut}
          className="rounded border border-accent-teal/60 px-2 py-1 font-mono text-[0.61rem] text-text-mana/70 hover:border-alert-orange hover:text-alert-orange"
          title="Clear the in-memory Google token and HUD data"
        >
          SIGN OUT
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1.5 font-mono text-[0.61rem]">
        <div className="flex items-center gap-1.5 rounded border border-accent-teal bg-primary-plum/45 px-2 py-1 text-gold" title="Total contract value of active clients">
          <i className="fa-solid fa-chart-column" />
          <span>PIPELINE VALUE: {telemetry ? `$${telemetry.pipelineMrr.toLocaleString()}` : '—'}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded border border-accent-teal bg-primary-plum/45 px-2 py-1 text-text-mana">
          <i className="fa-solid fa-list-check text-radar" />
          <span>SPRINTS: {telemetry?.activeSprints ?? '—'}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded border border-accent-teal bg-primary-plum/45 px-2 py-1 text-plasma">
          <i className="fa-solid fa-triangle-exclamation" />
          <span>DEPOSITS DUE: {telemetry?.missingDeposits ?? '—'}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded border border-accent-teal bg-primary-plum/45 px-2 py-1 text-text-mana" role="status">
          <span className={`h-2 w-2 rounded-full ${isBackendConnected ? 'animate-pulse-glow bg-text-mana shadow-[0_0_8px_#DDFBD0]' : 'bg-plasma'}`} />
          <span>{isBackendConnected ? 'POLICE ENGINE NOMINAL' : 'ENGINE OFFLINE'}</span>
        </div>
      </div>
    </header>
  );
};
