import React, { useEffect, useState } from 'react';
import { AlfredAlert, ClientUnit, CommandKey } from '../types';
import { normalizePipelineStage } from '../data/pipeline';

export type DepartmentId = 'alfred' | 'pamela' | 'oracle' | 'dolores' | 'vala' | 'daisy';

interface DepartmentConsoleProps {
  units: ClientUnit[];
  activeUnit: ClientUnit | null;
  alerts: AlfredAlert[];
  isBackendConnected: boolean;
  onClose: () => void;
  onSelectUnit: (id: string) => void;
  onTriggerCommand: (key: CommandKey) => void;
  onCommandDraft: (department: DepartmentId, command: string) => void;
}

const DEPARTMENTS: { id: DepartmentId; title: string; role: string; icon: string; quarantined?: boolean }[] = [
  { id: 'alfred', title: 'Alfred', role: 'Chief of Staff', icon: 'fa-solid fa-terminal' },
  { id: 'pamela', title: 'Pamela', role: 'Systems Intake', icon: 'fa-solid fa-flask' },
  { id: 'oracle', title: 'Oracle', role: 'Market Intelligence', icon: 'fa-solid fa-eye', quarantined: true },
  { id: 'dolores', title: 'Dolores', role: 'Workspace & Tasks', icon: 'fa-solid fa-wave-square' },
  { id: 'vala', title: 'Vala', role: 'Commercial & Finance', icon: 'fa-solid fa-coins' },
  { id: 'daisy', title: 'Daisy', role: 'Communications & Exit', icon: 'fa-solid fa-envelope-open-text' },
];

const REQUIRED_IDS: (keyof Pick<ClientUnit, 'RootFolderID' | 'MSA_DocID' | 'ProjectFolderID' | 'SOW_DocID' | 'MeetingNotes_DriveFolderID'>)[] = [
  'RootFolderID',
  'MSA_DocID',
  'ProjectFolderID',
  'SOW_DocID',
  'MeetingNotes_DriveFolderID',
];

const getStageNumber = (stage: string): number => {
  const stageNumber = Number.parseInt(normalizePipelineStage(stage).split(':', 1)[0], 10);
  return Number.isFinite(stageNumber) ? stageNumber : 0;
};

const isPresent = (value?: string | null): boolean => Boolean(value?.trim());

export const DepartmentConsole: React.FC<DepartmentConsoleProps> = ({
  units,
  activeUnit,
  alerts,
  isBackendConnected,
  onClose,
  onSelectUnit,
  onTriggerCommand,
  onCommandDraft,
}) => {
  const [department, setDepartment] = useState<DepartmentId>('alfred');
  const [command, setCommand] = useState('');
  const [commandStatus, setCommandStatus] = useState('');
  const activeClients = units.filter((unit) => getStageNumber(String(unit?.AccountPhase ?? unit?.pipelineStage ?? '')) !== 9);
  const missingComplianceRecords = activeClients.filter(
    (unit) => REQUIRED_IDS.some((field) => !isPresent(unit[field])),
  ).length;
  const outstandingDeposits = activeClients.filter(
    (unit) => getStageNumber(unit.pipelineStage) === 2 && !unit.depositPaid,
  );
  const selectedDepartment = DEPARTMENTS.find((item) => item.id === department);
  const activeAlerts = alerts.filter((alert) => !alert.dismissed);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const submitCommand = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = command.trim();
    if (!value || department === 'oracle') return;
    onCommandDraft(department, value);
    setCommandStatus('Local only — no department connector is configured; nothing was sent or persisted.');
    setCommand('');
  };

  const renderDepartmentContent = () => {
    if (department === 'oracle') {
      return (
        <div className="rounded-xl border border-alert-orange/60 bg-alert-orange/10 p-4">
          <p className="font-display font-bold text-alert-orange">Quarantined · Internal use only</p>
          <p className="mt-2 text-sm text-text-mana/75">
            Oracle runs outside the Command HUD. Its source and raw research are not loaded or exposed here.
          </p>
          <p className="mt-3 font-mono text-xs text-text-mana/55">No HUD command or Oracle connector is available.</p>
        </div>
      );
    }

    if (department === 'alfred') {
      return (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Active clients" value={activeClients.length} />
            <Metric label="Open alerts" value={activeAlerts.length} />
          </div>
          <StatusNote
            title={isBackendConnected ? 'Master Control reachable' : 'Master Control unavailable'}
            detail="Client and alert data shown here comes from the configured Master Control response. Server-side police and lock policies are not verified in this workspace."
            healthy={isBackendConnected}
          />
        </>
      );
    }

    if (department === 'pamela') {
      return (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Clients with compliance gaps" value={missingComplianceRecords} />
            <Metric label="Active client records" value={activeClients.length} />
          </div>
          <StatusNote
            title="Compliance evidence review available"
            detail="The HUD can inspect the five stored folder/document IDs. Intake scoring, template validation, and Drive provisioning are not connected."
            healthy
          />
          <ActionButton disabled={!activeUnit} onClick={() => onTriggerCommand('C')}>
            Open active-client compliance check
          </ActionButton>
        </>
      );
    }

    if (department === 'dolores') {
      const taskLinked = activeClients.filter((unit) => isPresent(unit.taskListId)).length;
      const chatLinked = activeClients.filter((unit) => isPresent(unit.chatSpaceUrl)).length;
      return (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Task-list links" value={`${taskLinked}/${activeClients.length}`} />
            <Metric label="Chat-space links" value={`${chatLinked}/${activeClients.length}`} />
          </div>
          <StatusNote
            title="Workspace links only"
            detail="Task synchronization, calendar scanning/time-block creation, and Admin SDK provisioning are not connected."
          />
          <div className="flex flex-wrap gap-2">
            <ActionButton disabled={!activeUnit} onClick={() => onTriggerCommand('D')}>Open Tasks</ActionButton>
            <ActionButton disabled={!activeUnit} onClick={() => onTriggerCommand('W')}>Open client Chat</ActionButton>
            <ActionButton disabled={!activeUnit} onClick={() => onTriggerCommand('X')}>Open meeting notes</ActionButton>
          </div>
        </>
      );
    }

    if (department === 'vala') {
      const outstandingValue = outstandingDeposits.reduce((total, unit) => total + (unit?.ContractValue ?? unit?.contractValue ?? 0), 0);
      return (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Stage 02 deposits due" value={outstandingDeposits.length} />
            <Metric label="Contract value pending deposit" value={outstandingValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
          </div>
          <StatusNote
            title="Finance data is read-only"
            detail="The deposit indicators use Master Control fields. Invoice generation, payment reconciliation, and milestone unlocking are not connected."
          />
          <ActionButton disabled={!activeUnit} onClick={() => onTriggerCommand('S')}>Open invoice draft document</ActionButton>
        </>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="MCC engine source" value="Present" />
          <Metric label="HUD connector" value="Offline" />
        </div>
        <StatusNote
          title="MCC is isolated from this HUD"
          detail="Campaign dispatch, onboarding/retention drips, consent workflows, and folder archival require a verified MCC deployment and integration contract."
        />
      </>
    );
  };

  return (
    <div className="absolute inset-0 z-40 flex justify-end bg-bg-obsidian/55 backdrop-blur-[2px]" onMouseDown={onClose}>
      <section
        id="department-console"
        aria-label="Department console"
        aria-modal="true"
        className="flex h-[1366px] w-[762px] flex-shrink-0 flex-col border-l border-accent-teal bg-bg-obsidian shadow-[-16px_0_48px_rgba(0,0,0,0.55)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="flex h-[60px] flex-shrink-0 items-center justify-between gap-3 border-b border-accent-teal/60 bg-primary-plum/30 px-4">
            <div className="min-w-0">
              <p className="font-mono text-[0.6rem] uppercase tracking-widest text-accent-teal">Active department</p>
              <h2 className="truncate font-display text-lg font-bold text-text-mana">
                {selectedDepartment?.title} <span className="text-sm font-normal text-text-mana/55">· {selectedDepartment?.role}</span>
              </h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close department console" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent-teal text-text-mana hover:border-alert-orange hover:text-alert-orange">
              <i className="fa-solid fa-xmark" />
            </button>
        </header>

        <div className="flex min-h-0 flex-1 overflow-y-auto">
          <nav aria-label="Departments" className="flex w-44 shrink-0 flex-col border-r border-accent-teal/60 bg-primary-plum/15 p-2 sm:w-52">
            <p className="px-2 py-3 font-mono text-[0.62rem] uppercase tracking-widest text-accent-teal">Departments</p>
            {DEPARTMENTS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={department === item.id}
                title={item.quarantined ? 'View Oracle quarantine boundary; runtime access is not available from the HUD' : item.role}
                onClick={() => {
                  setDepartment(item.id);
                  setCommandStatus('');
                }}
                className={`mb-1 rounded-lg border px-2 py-2 text-left transition-colors ${
                  item.quarantined
                    ? 'border-alert-orange/35 text-text-mana/50 hover:border-alert-orange/70'
                    : department === item.id
                      ? 'border-highlight-gold bg-primary-plum/60 text-highlight-gold'
                      : 'border-transparent text-text-mana/75 hover:border-accent-teal/50 hover:bg-accent-teal/10'
                }`}
              >
                <span className="flex items-center gap-2 font-display text-sm font-bold">
                  <i className={`${item.icon} w-4 text-center`} />
                  {item.title}
                </span>
                <span className="mt-0.5 block pl-6 font-mono text-[0.58rem] opacity-65">
                  {item.quarantined ? 'QUARANTINED' : item.role}
                </span>
              </button>
            ))}
          </nav>

          <div className="flex min-w-0 flex-1 flex-col gap-5 p-4 sm:p-6">
            <label className="block max-w-xl font-mono text-[0.62rem] uppercase tracking-wide text-accent-teal">
              Active client context
              <select
                value={activeUnit?.id ?? ''}
                onChange={(event) => onSelectUnit(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-accent-teal bg-bg-obsidian px-3 py-2 text-sm normal-case text-text-mana focus:border-highlight-gold focus:outline-none"
              >
                {units.length === 0 && <option value="">No clients loaded</option>}
                {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.companyName || unit.name} · {unit.id}</option>)}
              </select>
            </label>

            <section aria-live="polite" className="space-y-4">
              {renderDepartmentContent()}
            </section>
          </div>
        </div>

        <div className="h-[360px] flex-shrink-0 border-t border-[#086375] p-4">
          {department !== 'oracle' ? (
              <form onSubmit={submitCommand} className="flex h-full flex-col justify-center">
                <label htmlFor="department-command" className="font-mono text-[0.62rem] uppercase tracking-wide text-accent-teal">
                  Macro Bay / Intercom · Local command draft
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    id="department-command"
                    value={command}
                    onChange={(event) => setCommand(event.target.value)}
                    placeholder={`Draft a ${selectedDepartment?.title} command…`}
                    className="min-w-0 flex-1 rounded-lg border border-accent-teal bg-bg-obsidian px-3 py-2 font-mono text-xs text-text-mana placeholder:text-text-mana/35 focus:border-highlight-gold focus:outline-none"
                  />
                  <button type="submit" disabled={!command.trim()} className="rounded-lg border border-accent-teal px-3 text-highlight-gold hover:bg-primary-plum/50 disabled:cursor-not-allowed disabled:opacity-40">
                    Record local draft
                  </button>
                </div>
                <p className="mt-2 font-mono text-[0.6rem] text-text-mana/50" aria-live="polite">
                  {commandStatus || 'Local only: no department command is sent or persisted.'}
                </p>
              </form>
          ) : (
            <p className="font-mono text-xs text-alert-orange">
              Oracle is quarantined. No commands can be sent from this HUD.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="rounded-xl border border-accent-teal/60 bg-primary-plum/20 p-4">
    <p className="font-mono text-[0.62rem] uppercase tracking-wide text-accent-teal">{label}</p>
    <p className="mt-1 break-words font-display text-xl font-bold text-highlight-gold">{value}</p>
  </div>
);

const StatusNote: React.FC<{ title: string; detail: string; healthy?: boolean }> = ({ title, detail, healthy = false }) => (
  <div className="rounded-xl border border-accent-teal/45 bg-bg-obsidian/70 p-4">
    <p className={`font-display text-sm font-bold ${healthy ? 'text-text-mana' : 'text-highlight-gold'}`}>{title}</p>
    <p className="mt-1 text-sm leading-relaxed text-text-mana/65">{detail}</p>
  </div>
);

const ActionButton: React.FC<{ children: React.ReactNode; disabled?: boolean; onClick: () => void }> = ({ children, disabled = false, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="rounded-lg border border-accent-teal px-3 py-2 text-sm text-text-mana transition-colors hover:border-highlight-gold hover:text-highlight-gold disabled:cursor-not-allowed disabled:opacity-40"
  >
    {children}
  </button>
);
