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
  onUpdateUnit?: (unit: ClientUnit) => void;
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
  onUpdateUnit,
}) => {
  const alfredRef = useRef<AlfredTerminalHandle>(null);
  const isMulti = selectedUnitIds.length > 1;
  const currentClient = activeUnit || units[0];
  const chatSpaceUrl = getSafeHttpsUrl(currentClient?.chatSpaceUrl);
  const notesDocUrl = getSafeHttpsUrl(currentClient?.notesDocUrl);
  const driveFolderUrl = getSafeHttpsUrl(currentClient?.driveFolderUrl);
  const caseFileUrl = getSafeHttpsUrl(currentClient?.caseFileJsonUrl);

  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isVitalsDropdownOpen, setIsVitalsDropdownOpen] = useState(false);
  const [chassisScale, setChassisScale] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('szs_chassis_scale')) || 1.0;
    } catch {
      return 1.0;
    }
  });

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
      emailOrId: 'meetings@sessionzero.solutions',
      color: '#e0ca3c',
      enabled: true,
    },
    {
      id: 'cal-deadlines',
      name: 'Sprint Deadlines',
      emailOrId: 'sprints@sessionzero.solutions',
      color: '#fe5f00',
      enabled: true,
    },
  ]);

  const activeSources = calendarSources.filter((s) => s.enabled);

  const mockMeetings: CalendarMeetingEvent[] = [
    {
      id: 'meet-1',
      title: 'Session Zero: Sprint 01 Architecture Review',
      time: '10:30 AM – 11:15 AM',
      sourceId: 'cal-meetings',
      clientName: currentClient?.companyName || 'Ironclad Roofing & Solar',
      meetUrl: 'https://meet.google.com/szs-sprint-01',
      status: 'UPCOMING',
    },
    {
      id: 'meet-2',
      title: 'Mid-Flight Gate Compliance Audit',
      time: '01:30 PM – 02:30 PM',
      sourceId: 'cal-primary',
      clientName: 'Dolores & Alfred Core',
      meetUrl: 'https://meet.google.com/szs-gate-audit',
      status: 'UPCOMING',
    },
    {
      id: 'meet-3',
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

  const handleToggleDeposit = () => {
    if (!currentClient || !onUpdateUnit) return;
    onUpdateUnit({
      ...currentClient,
      depositPaid: !currentClient.depositPaid,
    });
    onLogTerminal?.(`Deposit status toggled to ${!currentClient.depositPaid ? 'PAID' : 'DUE'} for ${currentClient.name}.`, 'action');
  };

  const handleUpdateRoadblock = (value: string) => {
    if (!currentClient || !onUpdateUnit) return;
    onUpdateUnit({
      ...currentClient,
      activePebble: value,
      roadblock: value,
    });
  };

  return (
    <footer 
      style={{ zoom: chassisScale !== 1.0 ? chassisScale : undefined }}
      className="relative z-30 mt-auto flex h-[43vh] min-h-[330px] w-full flex-col border-t-2 border-t-[var(--chassis-top-bezel,#e0ca3c)] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] shadow-[0_0_15px_rgba(224,202,60,0.15)] hud-chassis-shell select-none"
    >
      <CanopyCarapace />
      <div className="relative flex h-9 items-center justify-between border-b border-[var(--chassis-top-bezel,#e0ca3c)]/50 bg-gradient-to-b from-[#0d1f18]/95 to-[#05130e]/90 px-4 pt-1 hud-faceplate-header">
        <div className="flex items-center gap-2 font-display text-sm font-bold tracking-wide text-text-mana">
          <span className="h-2 w-2 rounded-full bg-alert-orange shadow-[0_0_8px_#fe5f00]" />
          SESSION ZERO SOLUTIONS // MODULAR CONSOLE CHASSIS
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-text-mana/80">
          <div className="flex items-center gap-1.5 bg-bg-obsidian/70 border border-accent-teal/50 rounded px-2 py-0.5">
            <span className="text-[0.6rem] text-text-mana/50 uppercase">Scale:</span>
            <button
              onClick={() => {
                const newScale = Math.max(0.8, Number((chassisScale - 0.05).toFixed(2)));
                setChassisScale(newScale);
                try { localStorage.setItem('szs_chassis_scale', String(newScale)); } catch {}
              }}
              className="text-text-mana/70 hover:text-highlight-gold font-bold px-1"
              title="Decrease console chassis scale"
            >-</button>
            <span className="text-highlight-gold font-bold text-[0.65rem]">{Math.round(chassisScale * 100)}%</span>
            <button
              onClick={() => {
                const newScale = Math.min(1.25, Number((chassisScale + 0.05).toFixed(2)));
                setChassisScale(newScale);
                try { localStorage.setItem('szs_chassis_scale', String(newScale)); } catch {}
              }}
              className="text-text-mana/70 hover:text-highlight-gold font-bold px-1"
              title="Increase console chassis scale"
            >+</button>
          </div>
          <span className="text-highlight-gold font-bold">{units.length} CLIENTS</span>
        </div>
      </div>

      {/* 4 Physically Modular Seamed Bays */}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(230px,0.75fr)_minmax(330px,1.25fr)_minmax(270px,0.9fr)_minmax(260px,0.85fr)] gap-3 p-3">
        
        {/* MODULE 01: Calendar Bay */}
        <section id="calendar-bay" className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-accent-teal/70 border-t-2 border-t-[var(--chassis-top-bezel,#e0ca3c)] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] p-3 shadow-[inset_0_0_12px_rgba(8,99,117,0.2),0_0_15px_rgba(224,202,60,0.12)] hud-panel-card before:pointer-events-none before:absolute before:left-4 before:right-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[var(--chassis-top-bezel,#e0ca3c)] before:to-transparent">
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
                className="flex items-center gap-1 rounded border border-accent-teal/60 bg-primary-plum/40 px-2 py-0.5 font-mono text-[0.6rem] text-highlight-gold hover:border-highlight-gold hover:text-highlight-gold transition-colors cursor-pointer"
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
            <div className="flex flex-1 flex-col items-center justify-center p-3 text-center">
              <i className="fa-regular fa-calendar-xmark text-xl text-accent-teal/60 mb-1" />
              <p className="font-mono text-[0.65rem] text-text-mana/60">All calendar feeds muted</p>
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(true)}
                className="mt-2 rounded border border-highlight-gold/50 bg-highlight-gold/10 px-2 py-1 font-mono text-[0.6rem] text-highlight-gold hover:bg-highlight-gold/20"
              >
                Enable Feeds
              </button>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col space-y-1.5 overflow-y-auto pr-1">
              {mockMeetings.map((evt) => {
                const source = calendarSources.find((s) => s.id === evt.sourceId);
                return (
                  <div
                    key={evt.id}
                    className="rounded border border-accent-teal/40 bg-bg-obsidian/75 p-2 font-mono text-xs transition-colors hover:border-highlight-gold/60"
                  >
                    <div className="flex items-center justify-between text-[0.6rem]">
                      <span className="text-highlight-gold font-bold">{evt.time}</span>
                      <span
                        className="rounded px-1.5 py-0.2 text-[0.55rem] font-bold"
                        style={{
                          backgroundColor: `${source?.color || '#086375'}25`,
                          color: source?.color || '#ddfbd0',
                          border: `1px solid ${source?.color || '#086375'}60`,
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

        {/* MODULE 02: Dual-Purpose Center Bay (Alfred Terminal + Dropdown Vitals Screen) */}
        <section id="dual-center-bay" className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-accent-teal/70 border-t-2 border-t-[#E0CA3C] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] p-3 shadow-[inset_0_0_12px_rgba(8,99,117,0.2),0_0_15px_rgba(224,202,60,0.12)] before:pointer-events-none before:absolute before:left-4 before:right-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#E0CA3C] before:to-transparent">
          {/* Top Bar with Dropdown Toggle */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm font-bold text-text-mana">Alfred Terminal</h2>
              <button
                type="button"
                onClick={() => setIsVitalsDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[0.62rem] font-bold transition-all cursor-pointer ${
                  isVitalsDropdownOpen
                    ? 'border border-highlight-gold bg-highlight-gold text-bg-obsidian shadow-[0_0_8px_rgba(224,202,60,0.3)]'
                    : 'border border-accent-teal/70 bg-accent-teal/20 text-highlight-gold hover:border-highlight-gold hover:bg-highlight-gold/10'
                }`}
                title="Toggle Detailed Client Vitals & Gate Audit Screen"
              >
                <i className={`fa-solid fa-chevron-down text-[0.55rem] transition-transform ${isVitalsDropdownOpen ? 'rotate-180' : ''}`} />
                <span>{isVitalsDropdownOpen ? 'HIDE VITALS' : '▼ VITALS & AUDIT'}</span>
              </button>
            </div>
            <span className="font-mono text-[0.62rem] text-highlight-gold px-1.5 py-0.5 rounded bg-primary-plum/60 border border-accent-teal/50">
              SRC: {currentClient?.id || 'NO CLIENT'}
            </span>
          </div>

          {/* Dual Layer 1: Base Alfred Terminal */}
          <div className="flex-1 min-h-0 relative">
            <AlfredTerminal ref={alfredRef} activeUnit={activeUnit} />

            {/* Dual Layer 2: Slide-Down Detailed Info Panel (Dropdown covering terminal logs) */}
            {isVitalsDropdownOpen && (
              <div className="absolute inset-0 z-20 flex flex-col rounded-lg border border-highlight-gold/60 bg-bg-obsidian/95 backdrop-blur-md p-3 font-mono text-xs text-text-mana animate-in fade-in slide-in-from-top-2 duration-150 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-accent-teal/40 pb-1.5 mb-2.5">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-highlight-gold">
                    Client Audit & Gate Vitals
                  </span>
                  <span className="text-[0.6rem] text-text-mana/60">{currentClient?.companyName || currentClient?.name}</span>
                </div>

                {currentClient ? (
                  <div className="space-y-2.5 text-[0.65rem]">
                    {/* Stage & Milestone Progress */}
                    <div className="grid grid-cols-2 gap-2 bg-[#020500]/60 p-2 rounded border border-accent-teal/40">
                      <div>
                        <span className="text-text-mana/50 uppercase block text-[0.55rem]">Stage Verification:</span>
                        <span className="text-alert-orange font-bold">{currentClient.pipelineStage}</span>
                      </div>
                      <div>
                        <span className="text-text-mana/50 uppercase block text-[0.55rem]">Sprint Completion:</span>
                        <span className="text-highlight-gold font-bold">{currentClient.completedMilestones} / {currentClient.totalMilestones} Milestones</span>
                      </div>
                    </div>

                    {/* Iron Gate Checkboxes & Toggles */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={handleToggleDeposit}
                        className={`p-2 rounded border text-left transition-colors cursor-pointer ${
                          currentClient.depositPaid
                            ? 'border-highlight-gold/80 bg-highlight-gold/15 text-highlight-gold font-bold'
                            : 'border-alert-orange/80 bg-alert-orange/15 text-alert-orange font-bold'
                        }`}
                      >
                        <div className="text-[0.55rem] uppercase opacity-70">Deposit Status</div>
                        <div>{currentClient.depositPaid ? '✓ PAID ($)' : '✗ DUE ($)'}</div>
                      </button>

                      <div className={`p-2 rounded border text-left ${
                        currentClient.MSA_DocID
                          ? 'border-accent-teal bg-accent-teal/15 text-text-mana'
                          : 'border-alert-orange/60 bg-alert-orange/10 text-alert-orange'
                      }`}>
                        <div className="text-[0.55rem] uppercase opacity-70">MSA Status</div>
                        <div>{currentClient.MSA_DocID ? '✓ EXECUTED' : '✗ MISSING'}</div>
                      </div>

                      <div className={`p-2 rounded border text-left ${
                        currentClient.SOW_DocID
                          ? 'border-accent-teal bg-accent-teal/15 text-text-mana'
                          : 'border-alert-orange/60 bg-alert-orange/10 text-alert-orange'
                      }`}>
                        <div className="text-[0.55rem] uppercase opacity-70">SOW Status</div>
                        <div>{currentClient.SOW_DocID ? '✓ SIGNED' : '✗ MISSING'}</div>
                      </div>
                    </div>

                    {/* Roadblock Entry Field */}
                    <div className="bg-[#020500]/60 p-2 rounded border border-accent-teal/40">
                      <label className="text-text-mana/60 uppercase block text-[0.55rem] mb-1">
                        Active Roadblock / Pebble Note:
                      </label>
                      <input
                        type="text"
                        value={currentClient.activePebble || ''}
                        onChange={(e) => handleUpdateRoadblock(e.target.value)}
                        placeholder="Log active delivery roadblock..."
                        className="w-full rounded border border-accent-teal/60 bg-bg-obsidian px-2 py-1 text-xs text-text-mana placeholder:text-text-mana/30 focus:border-highlight-gold focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-mana/60">No client selected for vitals inspection.</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* MODULE 03: Client Dossier (Links Only, Non-Redundant) */}
        <section id="sanctum-drive-inspector" className="relative flex min-h-0 flex-col overflow-y-auto rounded-xl border border-accent-teal/70 border-t-2 border-t-[#E0CA3C] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] p-3 shadow-[inset_0_0_12px_rgba(8,99,117,0.2),0_0_15px_rgba(224,202,60,0.12)] before:pointer-events-none before:absolute before:left-4 before:right-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#E0CA3C] before:to-transparent">
          <div className="mb-2 flex items-center justify-between border-b border-accent-teal/40 pb-1">
            <h2 className="font-display text-sm font-bold text-text-mana">Client Dossier</h2>
            <span className="font-mono text-[0.6rem] text-text-mana/50">LINKS ONLY</span>
          </div>

          {currentClient ? (
            <div className="break-words font-mono text-[0.62rem] text-text-mana space-y-2">
              <div className="border-b border-accent-teal/40 pb-1.5 font-semibold">
                <span className="text-highlight-gold">{currentClient.name}</span>
                <span className="font-normal text-text-mana/50"> · {currentClient.id}</span>
              </div>

              {/* Direct Link Triggers */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-1.5 rounded bg-bg-obsidian/70 border border-accent-teal/30">
                  <span className="text-text-mana/70 flex items-center gap-1.5">
                    <i className="fa-brands fa-google-drive text-highlight-gold" />
                    Sanctum Drive
                  </span>
                  {driveFolderUrl ? (
                    <a
                      href={driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-highlight-gold hover:underline font-bold"
                    >
                      OPEN ↗
                    </a>
                  ) : (
                    <span className="text-red-400">MISSING</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-bg-obsidian/70 border border-accent-teal/30">
                  <span className="text-text-mana/70 flex items-center gap-1.5">
                    <i className="fa-solid fa-file-lines text-alert-orange" />
                    Meeting Notes Doc
                  </span>
                  {notesDocUrl ? (
                    <a
                      href={notesDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-alert-orange hover:underline font-bold"
                    >
                      OPEN ↗
                    </a>
                  ) : (
                    <span className="text-red-400">MISSING</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-bg-obsidian/70 border border-accent-teal/30">
                  <span className="text-text-mana/70 flex items-center gap-1.5">
                    <i className="fa-solid fa-file-contract text-accent-teal" />
                    Master Agreement (MSA)
                  </span>
                  {currentClient.MSA_DocID ? (
                    <a
                      href={`https://docs.google.com/document/d/${currentClient.MSA_DocID}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-teal hover:underline font-bold"
                    >
                      VIEW ↗
                    </a>
                  ) : (
                    <span className="text-red-400">MISSING</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-bg-obsidian/70 border border-accent-teal/30">
                  <span className="text-text-mana/70 flex items-center gap-1.5">
                    <i className="fa-solid fa-signature text-accent-teal" />
                    Statement of Work (SOW)
                  </span>
                  {currentClient.SOW_DocID ? (
                    <a
                      href={`https://docs.google.com/document/d/${currentClient.SOW_DocID}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-teal hover:underline font-bold"
                    >
                      VIEW ↗
                    </a>
                  ) : (
                    <span className="text-red-400">MISSING</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-bg-obsidian/70 border border-accent-teal/30">
                  <span className="text-text-mana/70 flex items-center gap-1.5">
                    <i className="fa-solid fa-comments text-highlight-gold" />
                    Client Chat Space
                  </span>
                  {chatSpaceUrl ? (
                    <a
                      href={chatSpaceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-highlight-gold hover:underline font-bold"
                    >
                      JOIN ↗
                    </a>
                  ) : (
                    <span className="text-red-400">MISSING</span>
                  )}
                </div>

                {caseFileUrl && (
                  <div className="flex items-center justify-between p-1.5 rounded bg-bg-obsidian/70 border border-accent-teal/30">
                    <span className="text-text-mana/70 flex items-center gap-1.5">
                      <i className="fa-solid fa-crosshairs text-accent-teal" />
                      Oracle Case File
                    </span>
                    <a
                      href={caseFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-teal hover:underline font-bold"
                    >
                      JSON ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-mana/65">Select a client to inspect direct links.</p>
          )}
        </section>

        {/* MODULE 04: 3x3 Hardware Macro Pad */}
        <section className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-accent-teal/70 border-t-2 border-t-[#E0CA3C] bg-gradient-to-b from-[#0d1f18] via-[#05130e] to-[#020500] p-2 shadow-[inset_0_0_12px_rgba(8,99,117,0.2),0_0_15px_rgba(224,202,60,0.12)] before:pointer-events-none before:absolute before:left-4 before:right-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#E0CA3C] before:to-transparent">
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
                className="group relative flex min-h-0 flex-col items-center justify-center rounded-lg border border-[#086375] bg-gradient-to-br from-[#284638] via-[#10251b] to-[#020500] p-1 text-center text-text-mana shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2),inset_-1px_-1px_3px_rgba(0,0,0,0.8),0_2px_6px_rgba(0,0,0,0.7)] transition-all hover:border-[#E0CA3C] hover:shadow-[0_0_10px_rgba(224,202,60,0.35),inset_1px_1px_2px_rgba(255,255,255,0.2),inset_-1px_-1px_3px_rgba(0,0,0,0.8)] active:border-alert-orange disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
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

      {/* Chassis Footer Status Bar */}
      <div className="flex h-5 items-center justify-between border-t border-accent-teal/60 px-4 font-mono text-[0.62rem] text-text-mana/60">
        <span>Session Zero Solutions · External integrations require configured connectors</span>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((group) => (
            <button
              key={group}
              onClick={() => onRecallControlGroup(group)}
              title={`Client group ${group}${controlGroups[group]?.length ? ` (${controlGroups[group].length} clients)` : ''}`}
              className={activeGroupNum === group ? 'text-alert-orange' : 'hover:text-text-mana cursor-pointer'}
            >
              {group}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
};
