import React, { useMemo, useState } from 'react';
import { AlfredAlert, ClientUnit } from '../types';
import { getPipelineColumnIndex, normalizePipelineStage, PIPELINE_COLUMNS } from '../data/pipeline';

interface AlfredDockProps {
  clients: ClientUnit[];
  alerts: AlfredAlert[];
  activeFilters: number[];
  onToggleFilter: (columnIndex: number) => void;
  onJumpToClient: (clientId: string) => void;
  onCommand: (command: string) => void;
  commandFeedback: string;
}

const ROUTINES = [
  { id: 'Alfred', icon: 'fa-solid fa-terminal' },
  { id: 'Pamela', icon: 'fa-solid fa-file-signature' },
  { id: 'Oracle', icon: 'fa-solid fa-eye' },
  { id: 'Dolores', icon: 'fa-solid fa-comments' },
  { id: 'Vala', icon: 'fa-solid fa-coins' },
  { id: 'Daisy', icon: 'fa-solid fa-wand-magic-sparkles' },
] as const;

interface DispatchItem {
  id: string;
  clientId: string;
  companyName: string;
  message: string;
  severity: string;
}

const getStageNumber = (stage: string): number => {
  const value = Number.parseInt(normalizePipelineStage(stage).split(':', 1)[0], 10);
  return Number.isFinite(value) ? value : 0;
};

const getAlertStyle = (severity: string): string => {
  const normalized = severity.toUpperCase();
  if (['CRITICAL', 'BLOCKER', 'HIGH'].includes(normalized)) {
    return 'border-alert-orange bg-alert-orange/10 text-alert-orange';
  }
  if (['WARN', 'WARNING', 'MEDIUM'].includes(normalized)) {
    return 'border-highlight-gold bg-highlight-gold/10 text-highlight-gold';
  }
  return 'border-accent-teal bg-bg-obsidian text-text-mana';
};

export const AlfredDock: React.FC<AlfredDockProps> = ({
  clients,
  alerts,
  activeFilters,
  onToggleFilter,
  onJumpToClient,
  onCommand,
  commandFeedback,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoutine, setSelectedRoutine] = useState<string>('Alfred');
  const [command, setCommand] = useState('');
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return clients
      .filter((client) => (
        client.name.toLowerCase().includes(query)
        || client.id.toLowerCase().includes(query)
        || client.companyName?.toLowerCase().includes(query)
      ))
      .slice(0, 8);
  }, [clients, searchQuery]);

  const activeClients = clients.filter((client) => getStageNumber(client.pipelineStage) !== 9);
  const generatedIssues = useMemo<Record<string, DispatchItem[]>>(() => ({
    Pamela: activeClients
      .filter((client) => !client.MSA_DocID)
      .map((client) => ({
        id: `pamela-${client.id}`,
        clientId: client.id,
        companyName: client.companyName || client.name,
        message: 'Required MSA is missing.',
        severity: 'HIGH',
      })),
    Oracle: activeClients
      .filter((client) => !client.osintGenerated && !client.caseFileJsonUrl)
      .map((client) => ({
        id: `oracle-${client.id}`,
        clientId: client.id,
        companyName: client.companyName || client.name,
        message: 'OSINT case file has not been generated.',
        severity: 'MEDIUM',
      })),
    Dolores: activeClients
      .filter((client) => !client.chatSpaceUrl)
      .map((client) => ({
        id: `dolores-${client.id}`,
        clientId: client.id,
        companyName: client.companyName || client.name,
        message: 'Client chat space is not linked.',
        severity: 'MEDIUM',
      })),
    Vala: activeClients
      .filter((client) => getStageNumber(client.pipelineStage) === 2 && !client.depositPaid)
      .map((client) => ({
        id: `vala-${client.id}`,
        clientId: client.id,
        companyName: client.companyName || client.name,
        message: 'Deposit is outstanding for this contract-stage client.',
        severity: 'HIGH',
      })),
  }), [activeClients]);

  const activeAlerts = alerts.filter((alert) => !alert.dismissed);
  const dispatchItems = useMemo<DispatchItem[]>(() => {
    const relatedAlerts = activeAlerts.filter((alert) => (
      selectedRoutine === 'Alfred'
      || alert.subRoutine.toLowerCase().includes(selectedRoutine.toLowerCase())
    )).map((alert) => ({
      id: alert.id,
      clientId: alert.clientId,
      companyName: alert.companyName || alert.clientId,
      message: alert.message,
      severity: alert.severity,
    }));
    const routineIssues = selectedRoutine === 'Alfred' ? [] : (generatedIssues[selectedRoutine] || []);
    const alertClientIds = new Set(relatedAlerts.map((alert) => alert.clientId));
    return [
      ...relatedAlerts,
      ...routineIssues.filter((issue) => !alertClientIds.has(issue.clientId)),
    ];
  }, [activeAlerts, generatedIssues, selectedRoutine]);

  const getRoutineCount = (routineId: string): number => {
    const matchingAlerts = activeAlerts.filter((alert) => (
      routineId === 'Alfred'
      || alert.subRoutine.toLowerCase().includes(routineId.toLowerCase())
    ));
    const knownIssues = generatedIssues[routineId] || [];
    const alertedClients = new Set(matchingAlerts.map((alert) => alert.clientId));
    return matchingAlerts.length + knownIssues.filter((issue) => !alertedClients.has(issue.clientId)).length;
  };

  const submitCommand = (event: React.FormEvent) => {
    event.preventDefault();
    const submittedCommand = command.trim();
    if (!submittedCommand) return;
    onCommand(submittedCommand);
    setCommand('');
  };

  return (
    <aside className="flex h-full min-h-0 w-64 shrink-0 flex-col border-r border-accent-teal bg-bg-obsidian text-text-mana lg:w-72">
      <div className="flex items-center justify-between border-b border-accent-teal bg-primary-plum/30 px-4 py-3">
        <span className="font-display text-xs font-bold uppercase tracking-widest text-highlight-gold">Multi-Agent Dispatch</span>
        <span className="h-2 w-2 rounded-full bg-text-mana shadow-[0_0_8px_#DDFBD0]" aria-label="Telemetry online" />
      </div>

      <div className="grid grid-cols-6 gap-1 border-b border-accent-teal/60 px-2 py-2" aria-label="Sub-routine feed">
        {ROUTINES.map((routine) => {
          const count = getRoutineCount(routine.id);
          const isSelected = selectedRoutine === routine.id;
          return (
            <button
              key={routine.id}
              type="button"
              aria-label={`${routine.id}${count ? `, ${count} notifications` : ''}`}
              aria-pressed={isSelected}
              title={routine.id}
              onClick={() => setSelectedRoutine(routine.id)}
              className={`relative flex h-8 items-center justify-center rounded border text-xs transition-colors ${
                isSelected
                  ? 'border-highlight-gold bg-primary-plum text-highlight-gold'
                  : 'border-accent-teal/50 text-text-mana/70 hover:border-accent-teal hover:text-text-mana'
              }`}
            >
              <i className={routine.icon} />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-alert-orange px-1 text-[0.55rem] font-bold leading-4 text-bg-obsidian">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="border-b border-accent-teal/60 p-3">
        <label htmlFor="client-jumper" className="mb-1 block font-mono text-[0.62rem] uppercase text-accent-teal">
          Client jumper
        </label>
        <input
          id="client-jumper"
          type="search"
          placeholder="Find by client ID or name..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded border border-accent-teal bg-bg-obsidian px-2.5 py-1.5 font-mono text-xs text-text-mana placeholder:text-accent-teal focus:border-highlight-gold focus:outline-none"
        />
        {searchQuery.trim() && (
          <div className="mt-1 max-h-36 overflow-y-auto rounded border border-accent-teal bg-bg-obsidian">
            {searchResults.length ? searchResults.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => {
                  onJumpToClient(client.id);
                  setSearchQuery('');
                }}
                className="block w-full px-2.5 py-1.5 text-left text-xs hover:bg-primary-plum hover:text-highlight-gold"
              >
                <span className="font-bold">{client.id}</span>
                <span className="text-text-mana/70"> · {client.companyName || client.name}</span>
              </button>
            )) : (
              <p className="px-2.5 py-2 font-mono text-xs text-text-mana/50">No client matches.</p>
            )}
          </div>
        )}
      </div>

      <div className="border-b border-accent-teal/60 p-3">
        <p className="mb-2 font-mono text-[0.62rem] uppercase text-accent-teal">Pipeline matrix filter</p>
        <div className="grid grid-cols-2 gap-1.5">
          {PIPELINE_COLUMNS.map((column, index) => {
            const isActive = activeFilters.includes(index);
            return (
              <button
                key={column.id}
                type="button"
                onClick={() => onToggleFilter(index)}
                aria-pressed={isActive}
                className={`rounded border px-2 py-1.5 text-left font-mono text-[0.58rem] transition-colors ${
                  isActive
                    ? 'border-highlight-gold bg-primary-plum font-bold text-highlight-gold'
                    : 'border-accent-teal/50 text-text-mana/65 hover:border-accent-teal'
                }`}
                title={column.stages.join(', ')}
              >
                {index + 1}. {column.title}
              </button>
            );
          })}
        </div>
        <p className="mt-2 font-mono text-[0.55rem] text-text-mana/45">
          {activeClients.filter((client) => activeFilters.includes(getPipelineColumnIndex(client.pipelineStage))).length} / {activeClients.length} active clients visible
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-accent-teal/40 px-3 py-2 font-mono text-[0.62rem] uppercase text-accent-teal">
          {selectedRoutine} priority feed ({dispatchItems.length})
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {dispatchItems.length === 0 ? (
            <p className="py-8 text-center font-mono text-xs text-accent-teal">No active items. The House is in order.</p>
          ) : dispatchItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => item.clientId && onJumpToClient(item.clientId)}
              className={`w-full rounded border p-2 text-left text-xs transition-colors hover:bg-primary-plum/50 ${getAlertStyle(item.severity)}`}
            >
              <span className="block truncate font-mono text-[0.62rem] font-bold uppercase">{item.companyName} · {item.clientId}</span>
              <span className="mt-1 block leading-snug">{item.message}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submitCommand} className="border-t border-accent-teal/60 bg-primary-plum/20 p-3">
        <label htmlFor="dispatch-intercom" className="mb-1 block font-mono text-[0.62rem] uppercase text-accent-teal">
          Universal intercom
        </label>
        <div className="flex gap-1">
          <input
            id="dispatch-intercom"
            type="text"
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="> Command..."
            className="min-w-0 flex-1 rounded border border-accent-teal bg-bg-obsidian px-2 py-1.5 font-mono text-xs text-text-mana placeholder:text-text-mana/40 focus:border-highlight-gold focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Send intercom command"
            className="rounded border border-accent-teal px-2 text-xs text-highlight-gold hover:bg-primary-plum"
          >
            <i className="fa-solid fa-paper-plane" />
          </button>
        </div>
        {commandFeedback && (
          <p className="mt-1 break-words font-mono text-[0.58rem] text-text-mana/65" aria-live="polite">
            {commandFeedback}
          </p>
        )}
      </form>
    </aside>
  );
};
