import React, { useEffect, useRef, useState } from 'react';
import { ClientUnit, CommandKey } from '../types';
import { COMMAND_ABILITIES } from '../data/initialFleet';
import { CanopyCarapace } from './CanopyCarapace';
import { AlfredTerminal, AlfredTerminalHandle } from './AlfredTerminal';

import { CalendarConnectorModal, CalendarSource, CalendarMeetingEvent } from './CalendarConnectorModal';

interface WorkspaceConsoleProps {
  units: ClientUnit[];
  activeUnit: ClientUnit | null;
  selectedUnitIds: string[];
  controlGroups: Record<number, string[]>;
  activeGroupNum: number | null;
  complianceRequestId: number;
  onRecallControlGroup: (groupNum: number) => void;
  onTriggerCommand: (key: CommandKey) => void;
  onLogTerminal?: (message: string, type?: 'normal' | 'action' | 'server' | 'alert') => void;
}

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
  complianceRequestId,
  onRecallControlGroup,
  onTriggerCommand,
  onLogTerminal,
}) => {
  const alfredRef = useRef<AlfredTerminalHandle>(null);
  const isMulti = selectedUnitIds.length > 1;
  const currentClient = activeUnit || units[0];
  const chatSpaceUrl = getSafeHttpsUrl(currentClient?.chatSpaceUrl);
  const notesDocUrl = getSafeHttpsUrl(currentClient?.notesDocUrl);
  const driveFolderUrl = getSafeHttpsUrl(currentClient?.driveFolderUrl);
  const caseFileUrl = getSafeHttpsUrl(currentClient?.caseFileJsonUrl);

  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarSources, setCalendarSources] = useState<CalendarSource[]>([
    {
      id: 'cal-primary',
      name: 'Primary',
      emailOrId: 'drake@sessionzero.solutions',
      color: '#086375',
      enabled: true,
      isPrimary: true,
    },
    {
      id: 'cal-meetings',
      name: 'SZS Client Meetings',
      emailOrId: 'c_meetings@group.calendar.google.com',
      color: '#E0CA3C',
      enabled: true,
    },
    {
      id: 'cal-personal',
      name: 'Personal',
      emailOrId: 'personal@sessionzero.solutions',
      color: '#4C2A4C',
      enabled: false,
    },
  ]);

  const activeSources = calendarSources.filter((s) => s.enabled);

  const events: CalendarMeetingEvent[] = [
    {
      id: 'evt-1',
      title: 'Session Zero: Sprint 01 Architecture Review',
      time: '10:30 AM – 11:15 AM',
      sourceId: 'cal-meetings',
      clientName: currentClient?.companyName || currentClient?.name || 'SZS Fleet',
      meetUrl: 'https://meet.google.com/szs-sprint-01',
      status: 'UPCOMING',
    },
    {
      id: 'evt-2',
      title: 'Mid-Flight Gate Compliance Audit',
      time: '02:00 PM – 02:30 PM',
      sourceId: 'cal-primary',
      clientName: 'Dolores & Alfred Core',
      meetUrl: 'https://meet.google.com/szs-gate-audit',
      status: 'UPCOMING',
    },
    {
      id: 'evt-3',
      title: 'Vala Milestone Deposit Reconciliation',
      time: '04:15 PM – 04:45 PM',
      sourceId: 'cal-meetings',
      clientName: currentClient?.companyName || 'Finance',
      status: 'UPCOMING',
    },
  ];

  const handleToggleSource = (id: string) => {
    setCalendarSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleAddSource = (source: CalendarSource) => {
    setCalendarSources((prev) => [...prev, source]);
  };

  useEffect(() => {
    if (complianceRequestId > 0) {
      alfredRef.current?.sendMessage('Run a Compliance Check.');
    }
  }, [complianceRequestId]);

  return (
    <footer className="relative z-30 mt-auto flex h-[43vh] min-h-[330px] w-full flex-col border-t-2 border-t-[var(--chassis-top-bezel,#e0ca3c)] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] shadow-[0_0_15px_rgba(224,202,60,0.15)] hud-chassis-shell">
      <CanopyCarapace />
      <div className="relative flex h-9 items-center justify-between border-b border-[var(--chassis-top-bezel,#e0ca3c)]/50 bg-gradient-to-b from-[#0d1f18]/95 to-[#05130e]/90 px-4 pt-1 hud-faceplate-header">
        <div className="flex items-center gap-2 font-display text-sm font-bold tracking-wide text-text-mana">
          <span className="h-2 w-2 rounded-full bg-alert-orange shadow-[0_0_8px_#fe5f00]" />
          SESSION ZERO SOLUTIONS // CHASSIS CONSOLE
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-text-mana/80">
          <span className="text-highlight-gold font-bold">{units.length} CLIENTS</span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(235px,0.8fr)_minmax(320px,1.1fr)_minmax(420px,1.4fr)] gap-3 p-3">
        <section id="calendar-bay" className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-accent-teal/70 border-t-2 border-t-[var(--chassis-top-bezel,#e0ca3c)] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] p-3 shadow-[0_0_15px_rgba(224,202,60,0.15)] hud-panel-card before:pointer-events-none before:absolute before:left-4 before:right-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[var(--chassis-top-bezel,#e0ca3c)] before:to-transparent">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h2 className="font-display text-sm font-bold text-text-mana">CalendarBay</h2>
              <span className="font-mono text-[0.62rem] text-text-mana/60">
                ({activeSources.length} feeds)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(true)}
                className="flex items-center gap-1 rounded border border-accent-teal/60 bg-primary-plum/40 px-2 py-0.5 font-mono text-[0.6rem] text-highlight-gold hover:border-highlight-gold hover:text-highlight-gold transition-colors"
                title="Google Calendar Source Connector (Configure Feeds)"
              >
                <i className="fa-solid fa-gear text-[0.55rem]" />
                <span>FEEDS</span>
              </button>
              <span className="font-mono text-[0.65rem] text-highlight-gold">
                {activeSources.length > 0 ? 'SYNCED' : 'MUTED'}
              </span>
            </div>
          </div>

          {activeSources.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-accent-teal/40 p-4 text-center">
              <p className="max-w-xs font-mono text-xs leading-relaxed text-text-mana/60">
                All calendar feeds are muted. Click &ldquo;FEEDS&rdquo; above to link Google Calendars.
              </p>
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(true)}
                className="mt-2 rounded border border-accent-teal px-2.5 py-1 font-mono text-[0.65rem] text-highlight-gold hover:bg-accent-teal/20"
              >
                Configure Feeds
              </button>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto pr-1 font-mono text-xs">
              <div className="text-[0.62rem] text-text-mana/50 uppercase tracking-wider">
                Today&apos;s Schedule · {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              {events.map((evt) => {
                const source = calendarSources.find((s) => s.id === evt.sourceId);
                return (
                  <div
                    key={evt.id}
                    className="p-2 rounded-lg border border-accent-teal/40 bg-bg-obsidian/80 hover:border-accent-teal transition-colors"
                  >
                    <div className="flex items-center justify-between text-[0.62rem]">
                      <span className="text-highlight-gold font-bold">{evt.time}</span>
                      <span
                        className="px-1.5 py-0.2 rounded text-[0.55rem] font-bold"
                        style={{
                          backgroundColor: `${source?.color || '#086375'}33`,
                          color: source?.color || '#DDFBD0',
                          border: `1px solid ${source?.color || '#086375'}66`,
                        }}
                      >
                        {source?.name || 'Feed'}
                      </span>
                    </div>
                    <div className="font-display text-[0.72rem] font-bold text-text-mana mt-1 truncate">
                      {evt.title}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[0.62rem] text-text-mana/60">
                      <span>{evt.clientName}</span>
                      {evt.meetUrl && (
                        <a
                          href={evt.meetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent-teal hover:text-highlight-gold underline"
                        >
                          Join Meet
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="pt-1 text-[0.6rem] font-mono text-text-mana/40 text-center">
                Press [E] to schedule meet · Feeds synced via Google Workspace
              </div>
            </div>
          )}

          <CalendarConnectorModal
            isOpen={isCalendarModalOpen}
            onClose={() => setIsCalendarModalOpen(false)}
            sources={calendarSources}
            onToggleSource={handleToggleSource}
            onAddSource={handleAddSource}
            onLogTerminal={onLogTerminal || (() => {})}
          />
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
                {currentClient.googleGroupEmail && (
                  <div className="mb-2 break-all text-text-mana/65">{currentClient.googleGroupEmail}</div>
                )}
                {currentClient.taskListId && (
                  <div className="mb-2 break-all text-text-mana/65">Tasklist ID · {currentClient.taskListId}</div>
                )}
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
                      {label === 'Root Folder' && driveFolderUrl ? (
                        <a
                          href={driveFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-emerald-400 hover:text-alert-orange"
                          title={`${label} · ${id?.trim() || 'URL only; folder ID not supplied'}`}
                        >
                          OPEN FOLDER{id?.trim() ? '' : ' · ID MISSING'}
                        </a>
                      ) : id?.trim() ? (
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
                  {caseFileUrl && (
                    <a
                      href={caseFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-alert-orange hover:text-text-mana"
                    >
                      OPEN ORACLE CASE FILE
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
                  onClick={() => onTriggerCommand(command.key)}
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
        <span>Session Zero Solutions · External integrations require configured connectors</span>
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
    </footer>
  );
};
