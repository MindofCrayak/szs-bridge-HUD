import React, { useRef, useState } from 'react';
import { ClientUnit, CommandKey } from '../types';
import { COMMAND_ABILITIES } from '../data/initialFleet';
import { CanopyCarapace } from './CanopyCarapace';
import { AlfredTerminal, AlfredTerminalHandle } from './AlfredTerminal';
import { ComplianceModal } from './ComplianceModal';

interface WorkspaceConsoleProps {
  units: ClientUnit[];
  activeUnit: ClientUnit | null;
  selectedUnitIds: string[];
  controlGroups: Record<number, string[]>;
  activeGroupNum: number | null;
  onRecallControlGroup: (groupNum: number) => void;
  onTriggerCommand: (key: CommandKey) => void;
}

const CALENDAR_EVENTS = [
  { time: '10:00 AM', title: 'Weekly client check-in', client: 'Marco Vance', duration: '45 min' },
  { time: '1:30 PM', title: 'Project scope review', client: 'Seraphina Lin', duration: '60 min', roadblock: true },
  { time: '3:00 PM', title: 'Sprint planning', client: 'Jake Sterling', duration: '30 min' },
];

const getSafeHttpsUrl = (value?: string) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
};

export const WorkspaceConsole: React.FC<WorkspaceConsoleProps> = ({
  units,
  activeUnit,
  selectedUnitIds,
  controlGroups,
  activeGroupNum,
  onRecallControlGroup,
  onTriggerCommand,
}) => {
  const [calendarView, setCalendarView] = useState<'Day' | 'Week' | 'Month'>('Day');
  const [filterRoadblocks, setFilterRoadblocks] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const alfredRef = useRef<AlfredTerminalHandle>(null);
  const isMulti = selectedUnitIds.length > 1;
  const currentClient = activeUnit || units[0];
  const chatSpaceUrl = getSafeHttpsUrl(currentClient?.chatSpaceUrl);
  const notesDocUrl = getSafeHttpsUrl(currentClient?.notesDocUrl);

  const handleMacroClick = (key: CommandKey) => {
    if (key === 'C') {
      setIsComplianceModalOpen(true);
      alfredRef.current?.sendMessage('Run a Compliance Check.');
      return;
    }
    onTriggerCommand(key);
  };

  const visibleEvents = filterRoadblocks
    ? CALENDAR_EVENTS.filter((event) => event.roadblock)
    : CALENDAR_EVENTS;

  return (
    <footer className="relative z-30 mt-auto flex h-[43vh] min-h-[330px] w-full flex-col border-t-2 border-t-[#E0CA3C] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] shadow-[0_0_15px_rgba(224,202,60,0.15)]">
      <CanopyCarapace />
      <div className="relative flex h-9 items-center justify-between border-b border-[#E0CA3C]/50 bg-gradient-to-b from-[#0d1f18]/95 to-[#05130e]/90 px-4 pt-1">
        <div className="flex items-center gap-2 font-display text-sm font-bold tracking-wide text-text-mana">
          <span className="h-2 w-2 rounded-full bg-alert-orange" />
          SESSION ZERO SOLUTIONS
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-text-mana/80">
          <span>{units.length} CLIENTS</span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(235px,0.8fr)_minmax(320px,1.1fr)_minmax(420px,1.4fr)] gap-3 p-3">
        <section id="calendar-bay" className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-accent-teal/70 border-t-2 border-t-[#E0CA3C] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] p-3 shadow-[0_0_15px_rgba(224,202,60,0.15)] before:pointer-events-none before:absolute before:left-4 before:right-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#E0CA3C] before:to-transparent">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-text-mana">CalendarBay</h2>
            <span className="font-mono text-[0.65rem] text-text-mana/65">GOOGLE CALENDAR</span>
          </div>
          <div className="mb-2 grid grid-cols-3 gap-1">
            {(['Day', 'Week', 'Month'] as const).map((view) => (
              <button
                key={view}
                onClick={() => {
                  setCalendarView(view);
                }}
                aria-pressed={calendarView === view}
                className={`rounded-md border px-2 py-1 font-accent text-sm ${
                  calendarView === view
                    ? 'border-alert-orange bg-alert-orange text-bg-obsidian'
                    : 'border-accent-teal text-text-mana hover:border-alert-orange'
                }`}
              >
                {view}
              </button>
            ))}
            <button
              onClick={() => setFilterRoadblocks((previous) => !previous)}
              aria-pressed={filterRoadblocks}
              className={`col-span-3 rounded-md border px-2 py-1 font-accent text-sm ${
                filterRoadblocks
                  ? 'border-alert-orange bg-alert-orange text-bg-obsidian'
                  : 'border-accent-teal text-text-mana hover:border-alert-orange'
              }`}
            >
              Filter Roadblocks
            </button>
          </div>
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-accent-teal/60 pb-2">
            <span className="truncate font-display text-xs font-semibold text-text-mana">Tuesday, October 20</span>
            <span className="shrink-0 font-mono text-[0.65rem] text-text-mana/60">{calendarView} View</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {Array.from({ length: 8 }, (_, index) => {
              const hour = index + 9;
              const time = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
              const event = visibleEvents.find((item) => Number.parseInt(item.time, 10) === hour % 12 || (hour === 12 && Number.parseInt(item.time, 10) === 12));
              return (
                <div key={hour} className="flex min-h-[42px] border-b border-accent-teal/25">
                  <span className="w-[58px] shrink-0 pt-2 font-mono text-[0.65rem] text-text-mana/55">{time}</span>
                  <div className="min-w-0 flex-1 py-1">
                    {event && (
                      <div className="rounded-md border-l-2 border-alert-orange bg-accent-teal/25 px-2 py-1">
                        <div className="truncate text-xs font-semibold text-text-mana">{event.title}</div>
                        <div className="truncate font-mono text-[0.62rem] text-text-mana/65">
                          {event.client} · {event.duration}
                          {event.roadblock ? ' · ROADBLOCK' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="archimedes-terminal" className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-accent-teal/70 border-t-2 border-t-[#E0CA3C] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] p-3 shadow-[0_0_15px_rgba(224,202,60,0.15)] before:pointer-events-none before:absolute before:left-4 before:right-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#E0CA3C] before:to-transparent">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-text-mana">Alfred</h2>
            <span className="font-mono text-[0.65rem] text-text-mana/65">
              {isMulti ? `${selectedUnitIds.length} CLIENTS SELECTED` : currentClient?.id || 'NO CLIENT SELECTED'}
            </span>
          </div>
          <AlfredTerminal ref={alfredRef} activeUnit={activeUnit} />
        </section>

        <div className="grid min-h-0 grid-cols-[minmax(170px,0.85fr)_minmax(210px,1.15fr)] gap-3">
          <section id="sanctum-drive-inspector" className="relative min-h-0 overflow-y-auto rounded-xl border border-accent-teal/70 border-t-2 border-t-[#E0CA3C] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] p-3 shadow-[0_0_15px_rgba(224,202,60,0.15)] before:pointer-events-none before:absolute before:left-4 before:right-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#E0CA3C] before:to-transparent">
            <h2 className="mb-3 font-display text-sm font-bold text-text-mana">Client Dossier</h2>
            {currentClient ? (
              <div className="break-words font-mono text-[0.62rem] text-text-mana">
                <div className="mb-2 truncate border-b border-accent-teal/50 pb-2 font-semibold">
                  {currentClient.name} <span className="font-normal text-text-mana/50">· {currentClient.id}</span>
                </div>
                <div className="mb-2 text-text-mana/60">
                  {currentClient.pipelineStage} · {currentClient.completedMilestones}/{currentClient.totalMilestones} milestones
                </div>
                <div className="space-y-1.5">
                  {([
                    ['Root Folder', currentClient.RootFolderID, true],
                    ['MSA', currentClient.MSA_DocID, false],
                    ['Project Folder', currentClient.ProjectFolderID, true],
                    ['SOW', currentClient.SOW_DocID, false],
                    ['Meeting Notes', currentClient.MeetingNotes_DriveFolderID, true],
                  ] as const).map(([label, id, isFolder]) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <span className="truncate text-text-mana/75">{label}</span>
                      {id?.trim() ? (
                        <a
                          href={`https://drive.google.com/open?id=${encodeURIComponent(id)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-emerald-400 hover:text-alert-orange"
                          title={`${label} · ${id}`}
                        >
                          {isFolder ? 'OPEN FOLDER' : 'OPEN DOC'}
                        </a>
                      ) : (
                        <span className="shrink-0 text-red-400">MISSING</span>
                      )}
                    </div>
                  ))}
                  {chatSpaceUrl && (
                    <a
                      href={chatSpaceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block border-t border-accent-teal/30 pt-2 text-alert-orange hover:text-text-mana"
                    >
                      OPEN CLIENT CHAT
                    </a>
                  )}
                  {notesDocUrl && (
                    <a
                      href={notesDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-alert-orange hover:text-text-mana"
                    >
                      OPEN CLIENT NOTES
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-mana/65">Select a client to inspect its dossier and Workspace links.</p>
            )}
          </section>

          <section className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-accent-teal/70 border-t-2 border-t-[#E0CA3C] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] p-2 shadow-[0_0_15px_rgba(224,202,60,0.15)] before:pointer-events-none before:absolute before:left-4 before:right-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#E0CA3C] before:to-transparent">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="font-display text-sm font-bold text-text-mana">Workspace Actions</h2>
              <span className="font-mono text-[0.6rem] text-text-mana/60">Q–C</span>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-3 gap-1.5">
              {COMMAND_ABILITIES.map((command) => (
                <button
                  key={command.key}
                  onClick={() => handleMacroClick(command.key)}
                  disabled={command.disabled}
                  className="group relative flex min-h-0 flex-col items-center justify-center rounded-lg border border-[#086375] bg-gradient-to-br from-[#284638] via-[#10251b] to-[#020500] p-1 text-center text-text-mana shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2),inset_-1px_-1px_3px_rgba(0,0,0,0.8),0_2px_6px_rgba(0,0,0,0.7)] transition-all hover:border-[#E0CA3C] hover:shadow-[0_0_10px_rgba(224,202,60,0.35),inset_1px_1px_2px_rgba(255,255,255,0.2),inset_-1px_-1px_3px_rgba(0,0,0,0.8)] active:border-alert-orange disabled:cursor-not-allowed disabled:opacity-40"
                  title={command.key === 'C'
                    ? 'Run a compliance check for the active client.'
                    : `${command.action} (${command.description}) — ${command.key}`}
                >
                  <span className="absolute right-1 top-0.5 rounded-sm border border-[#086375] bg-[#020500]/90 px-1 font-mono text-[0.6rem] font-bold text-[#f5c441] shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)]">{command.key}</span>
                  <i className={`${command.key === 'C' ? 'fa-solid fa-shield-halved' : command.icon} mb-1 text-base text-alert-orange group-hover:text-text-mana`} />
                  <span className="font-accent text-xs leading-tight">{command.key === 'C' ? 'Compliance Check' : command.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
      <div className="flex h-5 items-center justify-between border-t border-accent-teal/60 px-4 font-mono text-[0.62rem] text-text-mana/60">
        <span>Session Zero Solutions · Workspace connected</span>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((group) => (
            <button
              key={group}
              onClick={() => onRecallControlGroup(group)}
              title={`Client group ${group}${controlGroups[group]?.length ? ` (${controlGroups[group].length} clients)` : ''}`}
              className={activeGroupNum === group ? 'text-alert-orange' : 'hover:text-text-mana'}
            >
              {group}
            </button>
          ))}
        </div>
      </div>
      {isComplianceModalOpen && (
        <ComplianceModal
          activeUnit={activeUnit}
          onClose={() => setIsComplianceModalOpen(false)}
        />
      )}
    </footer>
  );
};
