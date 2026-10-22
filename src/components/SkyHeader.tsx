import React from 'react';
import { ScreenView } from '../types';

interface SkyHeaderProps {
  currentScreen: ScreenView;
  onSelectScreen: (screen: ScreenView) => void;
  onOpenOracle: () => void;
}

export const SkyHeader: React.FC<SkyHeaderProps> = ({
  currentScreen,
  onSelectScreen,
  onOpenOracle,
}) => {
  return (
    <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-accent-teal/60 bg-bg-obsidian/95 px-5 py-2 shadow-md">
      <div className="flex items-center gap-3">
        <button
          className="h-8 rounded-md bg-alert-orange px-2 font-serif-display text-sm font-bold text-bg-obsidian transition-transform hover:scale-105"
          onClick={() => onSelectScreen('dashboard')}
          title="Session Zero Solutions home"
        >
          SZS
        </button>
        <div>
          <div className="flex items-center gap-2 font-display text-xs font-extrabold tracking-wide text-text-mana sm:text-sm">
            <span>Session Zero Solutions // Command HUD</span>
          </div>
          <div className="font-mono text-[0.68rem] uppercase tracking-wide text-text-mana/65">
            GOOGLE WORKSPACE CRM // CLIENT DELIVERY
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-accent-teal bg-primary-plum/50 p-1 shadow-inner">
        <button
          onClick={() => onSelectScreen('dashboard')}
          className={`flex items-center gap-1.5 rounded px-3 py-1 font-display text-xs font-bold transition-all ${
            currentScreen === 'dashboard'
              ? 'border border-alert-orange bg-alert-orange text-bg-obsidian'
              : 'text-text-mana/75 hover:bg-accent-teal/40 hover:text-text-mana'
          }`}
          title="Client dashboard"
        >
          <i className="fa-solid fa-chart-line text-[0.7rem]"></i>
          <span>DASHBOARD</span>
        </button>

        <button
          onClick={() => onSelectScreen('pipeline')}
          className={`flex items-center gap-1.5 rounded px-3 py-1 font-display text-xs font-bold transition-all ${
            currentScreen === 'pipeline'
              ? 'border border-alert-orange bg-alert-orange text-bg-obsidian'
              : 'text-text-mana/75 hover:bg-accent-teal/40 hover:text-text-mana'
          }`}
          title="Client pipeline"
        >
          <i className="fa-solid fa-diagram-project text-[0.7rem]"></i>
          <span>PIPELINE</span>
        </button>

        <button
          onClick={() => onSelectScreen('clients')}
          className={`flex items-center gap-1.5 rounded px-3 py-1 font-display text-xs font-bold transition-all ${
            currentScreen === 'clients'
              ? 'border border-alert-orange bg-alert-orange text-bg-obsidian'
              : 'text-text-mana/75 hover:bg-accent-teal/40 hover:text-text-mana'
          }`}
          title="Client list"
        >
          <i className="fa-solid fa-address-book text-[0.7rem]"></i>
          <span>CLIENTS</span>
        </button>

        <button
          onClick={() => onSelectScreen('actions')}
          className={`flex items-center gap-1.5 rounded px-3 py-1 font-display text-xs font-bold transition-all ${
            currentScreen === 'actions'
              ? 'border border-alert-orange bg-alert-orange text-bg-obsidian'
              : 'text-text-mana/75 hover:bg-accent-teal/40 hover:text-text-mana'
          }`}
          title="Workspace shortcuts"
        >
          <i className="fa-solid fa-bolt text-[0.7rem]"></i>
          <span>ACTIONS</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 font-mono text-[0.65rem]">
        <button
          onClick={onOpenOracle}
          className="flex items-center gap-2 rounded border border-alert-orange bg-alert-orange/15 px-3 py-1.5 font-display text-xs font-bold text-alert-orange transition-colors hover:bg-alert-orange hover:text-bg-obsidian"
          title="Open Oracle tactical panel"
        >
          <i className="fa-solid fa-eye" />
          <span>ORACLE</span>
        </button>
        <div className="flex items-center gap-1.5 rounded border border-accent-teal bg-primary-plum/45 px-2 py-1 text-text-mana">
          <i className="fa-solid fa-chart-column text-alert-orange"></i>
          <span>PIPELINE MRR: $18,400</span>
        </div>
        <div className="flex items-center gap-1.5 rounded border border-accent-teal bg-primary-plum/45 px-2 py-1 text-text-mana">
          <i className="fa-solid fa-users text-alert-orange"></i>
          <span>SUBSCRIBERS: 1,204</span>
        </div>
        <div className="flex items-center gap-1.5 rounded border border-accent-teal bg-primary-plum/45 px-2 py-1 text-text-mana">
          <i className="fa-solid fa-envelope-open-text text-alert-orange"></i>
          <span>OPEN RATE: 42%</span>
        </div>
      </div>
    </header>
  );
};
