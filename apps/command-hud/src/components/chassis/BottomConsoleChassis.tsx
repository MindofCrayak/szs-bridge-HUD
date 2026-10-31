import React, { useState, useEffect, useRef } from 'react';
import { ClientRecord, CommandKey } from '../../types';
import { CalendarBay } from './CalendarBay';
import { DualCenterBay } from './DualCenterBay';
import { ClientDossierBay } from './ClientDossierBay';
import { MacroPadBay } from './MacroPadBay';
import { CalendarMeetingEvent, CalendarSource } from '../CalendarConnectorModal';
import { PendingProposal } from '../../ecs/proposals';
import type { PendingAgentDispatch } from '../../ecs/agentDispatch';

interface BottomConsoleChassisProps {
  selectedClient: ClientRecord | null;
  onUpdateClient?: (updated: ClientRecord) => void;
  onTriggerCommand: (key: CommandKey) => void;
  onLogTerminal?: (message: string, type?: 'normal' | 'action' | 'server' | 'alert') => void;
  controlGroups?: Record<number, string[]>;
  activeGroupNum?: number | null;
  onRecallControlGroup?: (group: number) => void;
  calendarSources?: CalendarSource[];
  calendarMeetings?: CalendarMeetingEvent[];
  onOpenFeedConfig?: () => void;
  context?: import('../../types').ViewportContext;
  onProposal?: (proposal: PendingProposal) => void;
  pendingAgentDispatch?: PendingAgentDispatch | null;
  onAgentDispatchHandled?: (dispatchId: number) => void;
}

type BayId = 'calendar' | 'alfred' | 'dossier' | 'macropad';

export const BottomConsoleChassis: React.FC<BottomConsoleChassisProps> = ({
  selectedClient,
  onUpdateClient,
  onTriggerCommand,
  onLogTerminal,
  controlGroups = {},
  activeGroupNum = 1,
  onRecallControlGroup,
  calendarSources,
  calendarMeetings,
  onOpenFeedConfig,
  context = 'GLOBAL',
  onProposal,
  pendingAgentDispatch,
  onAgentDispatchHandled,
}) => {
  // Pinned state persisted in localStorage
  const [pinnedBays, setPinnedBays] = useState<Record<BayId, boolean>>(() => {
    try {
      const stored = localStorage.getItem('szs_hud_dock_pinned');
      return stored ? JSON.parse(stored) : { calendar: false, alfred: false, dossier: false, macropad: false };
    } catch {
      return { calendar: false, alfred: false, dossier: false, macropad: false };
    }
  });

  // Hover state with debounced timeouts (150ms in, 300ms out)
  const [hoveredBays, setHoveredBays] = useState<Record<BayId, boolean>>({
    calendar: false,
    alfred: false,
    dossier: false,
    macropad: false,
  });

  // Track if Alfred input has focus or text to prevent collapse
  const [isAlfredActive, setIsAlfredActive] = useState(false);

  const hoverEnterTimeoutRef = useRef<Record<BayId, NodeJS.Timeout | null>>({
    calendar: null,
    alfred: null,
    dossier: null,
    macropad: null,
  });
  const hoverLeaveTimeoutRef = useRef<Record<BayId, NodeJS.Timeout | null>>({
    calendar: null,
    alfred: null,
    dossier: null,
    macropad: null,
  });

  const togglePin = (bay: BayId) => {
    setPinnedBays((prev) => {
      const updated = { ...prev, [bay]: !prev[bay] };
      try {
        localStorage.setItem('szs_hud_dock_pinned', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleMouseEnter = (bay: BayId) => {
    if (hoverLeaveTimeoutRef.current[bay]) {
      clearTimeout(hoverLeaveTimeoutRef.current[bay]!);
      hoverLeaveTimeoutRef.current[bay] = null;
    }
    hoverEnterTimeoutRef.current[bay] = setTimeout(() => {
      setHoveredBays((prev) => ({ ...prev, [bay]: true }));
    }, 150);
  };

  const handleMouseLeave = (bay: BayId) => {
    if (hoverEnterTimeoutRef.current[bay]) {
      clearTimeout(hoverEnterTimeoutRef.current[bay]!);
      hoverEnterTimeoutRef.current[bay] = null;
    }
    hoverLeaveTimeoutRef.current[bay] = setTimeout(() => {
      setHoveredBays((prev) => ({ ...prev, [bay]: false }));
    }, 300);
  };

  // Close unpinned bays on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinnedBays({ calendar: false, alfred: false, dossier: false, macropad: false });
        try {
          localStorage.setItem('szs_hud_dock_pinned', JSON.stringify({ calendar: false, alfred: false, dossier: false, macropad: false }));
        } catch {}
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to focus/blur inside Alfred Core bay to keep it open while active
  const alfredBayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = alfredBayRef.current;
    if (!el) return;

    const handleFocusIn = () => setIsAlfredActive(true);
    const handleFocusOut = () => {
      setTimeout(() => {
        const input = el.querySelector('input, textarea') as HTMLInputElement | null;
        if (input && input.value.trim().length > 0) {
          setIsAlfredActive(true);
        } else if (!el.contains(document.activeElement)) {
          setIsAlfredActive(false);
        }
      }, 50);
    };
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && target.value.trim().length > 0) {
        setIsAlfredActive(true);
      }
    };

    el.addEventListener('focusin', handleFocusIn);
    el.addEventListener('focusout', handleFocusOut);
    el.addEventListener('input', handleInput);

    return () => {
      el.removeEventListener('focusin', handleFocusIn);
      el.removeEventListener('focusout', handleFocusOut);
      el.removeEventListener('input', handleInput);
    };
  }, []);

  const isExpanded = (bay: BayId) => {
    if (bay === 'alfred' && (isAlfredActive || pendingAgentDispatch)) return true;
    return Boolean(pinnedBays[bay] || hoveredBays[bay]);
  };

  return (
    <footer className="relative z-30 flex w-full flex-row items-end justify-center gap-1 select-none bg-transparent px-1 pb-2 pointer-events-none sm:gap-3 sm:px-4">
      {/* ── BAY 1: CALENDAR BAY ─────────────────────────────────── */}
      <div
        onMouseEnter={() => handleMouseEnter('calendar')}
        onMouseLeave={() => handleMouseLeave('calendar')}
        className={`pointer-events-auto flex flex-col rounded-xl border border-[#1a2b27] bg-[#0d1513]/95 shadow-[0_8px_32px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all duration-200 ease-out shrink-0 overflow-hidden ${
          isExpanded('calendar')
            ? 'h-[45vh] shadow-[0_0_25px_rgba(8,99,117,0.4)]'
            : 'h-[44px]'
        }`}
        style={{ width: 'clamp(72px, 16vw, var(--bay-calendar-w, 280px))' }}
      >
        {/* Collapsed Header Bar (~44px) */}
        <div
          onClick={() => togglePin('calendar')}
          className="h-[44px] shrink-0 flex items-center justify-between px-3 cursor-pointer hover:bg-[#10201c] transition-colors border-b border-[#086375]/30"
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-calendar-days text-xs text-[#086375]" />
            <span className="font-display text-xs font-bold text-[#DDFBD0]">CalendarBay</span>
            <span className="text-[0.6rem] text-[#DDFBD0]/60">({calendarSources?.filter(s => s.enabled).length || 0} feeds)</span>
          </div>
          <div className="flex items-center gap-1.5">
            {pinnedBays.calendar && (
              <span className="text-[0.55rem] px-1 py-0.2 rounded bg-[#086375]/40 text-[#E0CA3C] font-bold">PINNED</span>
            )}
            <i className={`fa-solid fa-chevron-up text-[0.6rem] text-[#DDFBD0]/60 transition-transform duration-200 ${isExpanded('calendar') ? 'rotate-180 text-[#E0CA3C]' : ''}`} />
          </div>
        </div>

        {/* Expanded Content Layer */}
        {isExpanded('calendar') && (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#040706] p-2.5">
            <div className="crm-grid pointer-events-none absolute inset-0 opacity-20" />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto">
              <CalendarBay
                sources={calendarSources}
                meetings={calendarMeetings}
                onOpenFeedConfig={onOpenFeedConfig}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── BAY 2: DUAL CENTER BAY (ALFRED CORE) ────────────────── */}
      <div
        ref={alfredBayRef}
        onMouseEnter={() => handleMouseEnter('alfred')}
        onMouseLeave={() => handleMouseLeave('alfred')}
        className={`pointer-events-auto flex min-w-0 flex-1 flex-col rounded-xl border border-[#1a2b27] bg-[#0d1513]/95 shadow-[0_8px_32px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all duration-200 ease-out max-w-[560px] overflow-hidden ${
          isExpanded('alfred')
            ? 'h-[45vh] shadow-[0_0_30px_rgba(8,99,117,0.5)] border-[#086375]/60'
            : 'h-[44px]'
        }`}
        style={{ width: 'clamp(160px, 29vw, var(--bay-center-w, 440px))' }}
      >
        {/* Collapsed Header Bar (~44px) */}
        <div
          onClick={() => togglePin('alfred')}
          className="h-[44px] shrink-0 flex items-center justify-between px-3 cursor-pointer hover:bg-[#10201c] transition-colors border-b border-[#086375]/30"
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-terminal text-xs text-[#E0CA3C]" />
            <span className="font-display text-xs font-bold text-[#DDFBD0]">Alfred Core</span>
            <span className="text-[0.6rem] text-[#DDFBD0]/50 truncate max-w-[140px]">
              {selectedClient ? selectedClient.Company_Name : 'Ready'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {isAlfredActive && !pinnedBays.alfred && (
              <span className="text-[0.55rem] px-1 py-0.2 rounded bg-[#FE5F00]/30 text-[#FE5F00] font-bold animate-pulse">ACTIVE</span>
            )}
            {pinnedBays.alfred && (
              <span className="text-[0.55rem] px-1 py-0.2 rounded bg-[#086375]/40 text-[#E0CA3C] font-bold">PINNED</span>
            )}
            <i className={`fa-solid fa-chevron-up text-[0.6rem] text-[#DDFBD0]/60 transition-transform duration-200 ${isExpanded('alfred') ? 'rotate-180 text-[#E0CA3C]' : ''}`} />
          </div>
        </div>

        {/* Expanded Content Layer */}
        {isExpanded('alfred') && (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#040706] p-2.5 shadow-[inset_0_0_20px_rgba(8,99,117,0.15)]">
            <div className="crm-grid pointer-events-none absolute inset-0 opacity-25" />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto">
              <DualCenterBay
                selectedClient={selectedClient}
                onUpdateClient={onUpdateClient}
                onLogTerminal={onLogTerminal}
                onProposal={onProposal}
                pendingAgentDispatch={pendingAgentDispatch}
                onAgentDispatchHandled={onAgentDispatchHandled}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── BAY 3: CLIENT DOSSIER BAY ──────────────────────────── */}
      <div
        onMouseEnter={() => handleMouseEnter('dossier')}
        onMouseLeave={() => handleMouseLeave('dossier')}
        className={`pointer-events-auto flex flex-col rounded-xl border border-[#1a2b27] bg-[#0d1513]/95 shadow-[0_8px_32px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all duration-200 ease-out shrink-0 overflow-hidden ${
          isExpanded('dossier')
            ? 'h-[45vh] shadow-[0_0_25px_rgba(8,99,117,0.4)]'
            : 'h-[44px]'
        }`}
        style={{ width: 'clamp(72px, 15vw, var(--bay-dossier-w, 270px))' }}
      >
        {/* Collapsed Header Bar (~44px) */}
        <div
          onClick={() => togglePin('dossier')}
          className="h-[44px] shrink-0 flex items-center justify-between px-3 cursor-pointer hover:bg-[#10201c] transition-colors border-b border-[#086375]/30"
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-folder-open text-xs text-[#3C91E6]" />
            <span className="font-display text-xs font-bold text-[#DDFBD0]">Client Dossier</span>
          </div>
          <div className="flex items-center gap-1.5">
            {pinnedBays.dossier && (
              <span className="text-[0.55rem] px-1 py-0.2 rounded bg-[#086375]/40 text-[#E0CA3C] font-bold">PINNED</span>
            )}
            <i className={`fa-solid fa-chevron-up text-[0.6rem] text-[#DDFBD0]/60 transition-transform duration-200 ${isExpanded('dossier') ? 'rotate-180 text-[#E0CA3C]' : ''}`} />
          </div>
        </div>

        {/* Expanded Content Layer */}
        {isExpanded('dossier') && (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#040706] p-2.5">
            <div className="crm-grid pointer-events-none absolute inset-0 opacity-20" />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto">
              <ClientDossierBay client={selectedClient} />
            </div>
          </div>
        )}
      </div>

      {/* ── BAY 4: GLOBAL / CLIENT MACRO PAD ────────────────────── */}
      <div
        onMouseEnter={() => handleMouseEnter('macropad')}
        onMouseLeave={() => handleMouseLeave('macropad')}
        className={`pointer-events-auto flex flex-col rounded-xl border border-[#1a2b27] bg-[#0d1513]/95 shadow-[0_8px_32px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all duration-200 ease-out shrink-0 overflow-hidden ${
          isExpanded('macropad')
            ? 'h-[45vh] shadow-[0_0_25px_rgba(8,99,117,0.4)]'
            : 'h-[44px]'
        }`}
        style={{ width: 'clamp(72px, 15vw, var(--bay-macro-w, 280px))' }}
      >
        {/* Collapsed Header Bar (~44px) */}
        <div
          onClick={() => togglePin('macropad')}
          className="h-[44px] shrink-0 flex items-center justify-between px-3 cursor-pointer hover:bg-[#10201c] transition-colors border-b border-[#086375]/30"
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-grip text-xs text-[#E0CA3C]" />
            <span className="font-display text-xs font-bold text-[#DDFBD0]">
              {context === 'CLIENT_WORKBENCH' ? 'Client Pad' : 'Macro Pad'}
            </span>
            <span className="text-[0.6rem] text-[#DDFBD0]/50">Q–C</span>
          </div>
          <div className="flex items-center gap-1.5">
            {pinnedBays.macropad && (
              <span className="text-[0.55rem] px-1 py-0.2 rounded bg-[#086375]/40 text-[#E0CA3C] font-bold">PINNED</span>
            )}
            <i className={`fa-solid fa-chevron-up text-[0.6rem] text-[#DDFBD0]/60 transition-transform duration-200 ${isExpanded('macropad') ? 'rotate-180 text-[#E0CA3C]' : ''}`} />
          </div>
        </div>

        {/* Expanded Content Layer */}
        {isExpanded('macropad') && (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#040706] p-2.5">
            <div className="crm-grid pointer-events-none absolute inset-0 opacity-20" />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto">
              <MacroPadBay
                onTriggerCommand={onTriggerCommand}
                controlGroups={controlGroups}
                activeGroupNum={activeGroupNum}
                onRecallControlGroup={onRecallControlGroup}
                context={context}
                selectedClient={selectedClient}
              />
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};
