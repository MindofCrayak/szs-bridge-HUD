import React from 'react';
import { ClientRecord, CommandKey } from '../../types';
import { CalendarBay } from './CalendarBay';
import { DualCenterBay } from './DualCenterBay';
import { ClientDossierBay } from './ClientDossierBay';
import { MacroPadBay } from './MacroPadBay';
import { CanopyCarapace } from '../CanopyCarapace';
import { CalendarMeetingEvent, CalendarSource } from '../CalendarConnectorModal';

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
}

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
}) => {
  return (
    <footer 
      className="relative z-30 mt-auto flex h-[41vh] min-h-[310px] w-full flex-col border-t-2 border-t-[#E0CA3C] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] shadow-[0_0_15px_rgba(224,202,60,0.15)] select-none shrink-0"
    >
      <CanopyCarapace />

      {/* Faceplate Header Strip */}
      <div className="relative flex h-8 items-center justify-between border-b border-[#E0CA3C]/50 bg-gradient-to-b from-[#0d1f18]/95 to-[#05130e]/90 px-4 pt-0.5">
        <div className="flex items-center gap-2 font-display text-xs font-bold tracking-wide text-[#DDFBD0]">
          <span className="h-2 w-2 rounded-full bg-[#FE5F00] shadow-[0_0_8px_#FE5F00]" />
          SESSION ZERO SOLUTIONS // MODULAR CONSOLE CHASSIS FRAME
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-[#DDFBD0]/80">
          <span className="text-[#E0CA3C] font-bold">
            {selectedClient ? selectedClient.Company_Name : 'GLOBAL MONITOR ACTIVE'}
          </span>
        </div>
      </div>

      {/* 4 Physically Modular Seamed Bays */}
      <div className="grid min-h-0 flex-1 grid-cols-[var(--bay-calendar-ratio,280px)_minmax(340px,1.2fr)_var(--bay-dossier-ratio,270px)_var(--bay-macro-ratio,280px)] gap-3 p-3">
        {/* Module 1: Calendar Bay */}
        <section className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#086375]/70 border-t-2 border-t-[#E0CA3C] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] p-3 shadow-[inset_0_0_12px_rgba(8,99,117,0.2),0_0_15px_rgba(224,202,60,0.12)]">
          <CalendarBay 
            sources={calendarSources} 
            meetings={calendarMeetings} 
            onOpenFeedConfig={onOpenFeedConfig} 
          />
        </section>

        {/* Module 2: Dual-Purpose Center Bay */}
        <section className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#086375]/70 border-t-2 border-t-[#E0CA3C] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] p-3 shadow-[inset_0_0_12px_rgba(8,99,117,0.2),0_0_15px_rgba(224,202,60,0.12)]">
          <DualCenterBay
            selectedClient={selectedClient}
            onUpdateClient={onUpdateClient}
            onLogTerminal={onLogTerminal}
          />
        </section>

        {/* Module 3: Client Dossier Bay */}
        <section className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#086375]/70 border-t-2 border-t-[#E0CA3C] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] p-3 shadow-[inset_0_0_12px_rgba(8,99,117,0.2),0_0_15px_rgba(224,202,60,0.12)]">
          <ClientDossierBay client={selectedClient} />
        </section>

        {/* Module 4: Hardware Macro Pad Bay */}
        <section className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#086375]/70 border-t-2 border-t-[#E0CA3C] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] p-2.5 shadow-[inset_0_0_12px_rgba(8,99,117,0.2),0_0_15px_rgba(224,202,60,0.12)]">
          <MacroPadBay onTriggerCommand={onTriggerCommand} />
        </section>
      </div>

      {/* Chassis Footer Status Bar */}
      <div className="flex h-5 items-center justify-between border-t border-[#086375]/60 px-4 font-mono text-[0.62rem] text-[#DDFBD0]/60 shrink-0">
        <span>Session Zero Solutions · External integrations require configured connectors</span>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((group) => (
            <button
              key={group}
              onClick={() => onRecallControlGroup?.(group)}
              title={`Client group ${group}${controlGroups[group]?.length ? ` (${controlGroups[group].length} clients)` : ''}`}
              className={activeGroupNum === group ? 'text-[#FE5F00] font-bold' : 'hover:text-[#DDFBD0] cursor-pointer'}
            >
              {group}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
};
