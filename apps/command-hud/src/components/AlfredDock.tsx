import React, { useMemo, useState, useRef, useEffect } from 'react';
import { AlfredAlert, ClientUnit, ScreenView } from '../types';
import { getPipelineColumnIndex, normalizePipelineStage, PIPELINE_COLUMNS } from '../data/pipeline';

interface AlfredDockProps {
  clients: ClientUnit[];
  alerts: AlfredAlert[];
  activeFilters: number[];
  onToggleFilter: (columnIndex: number) => void;
  onJumpToClient: (clientId: string) => void;
  onCommand: (command: string) => void;
  commandFeedback: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectScreen?: (screen: ScreenView) => void;
  onFlashClients?: (clientIds: string[]) => void;
  activeDepartment?: string;
  onSelectDepartment?: (dept: string) => void;
}

const ROUTINES: { id: string; name: string; icon: string; departmentScreen: ScreenView; badge: string }[] = [
  { id: 'Alfred', name: 'Alfred', icon: 'fa-solid fa-terminal', departmentScreen: 'dashboard', badge: 'A' },
  { id: 'Pamela', name: 'Pamela', icon: 'fa-solid fa-file-signature', departmentScreen: 'dashboard', badge: 'P' },
  { id: 'Oracle', name: 'Oracle', icon: 'fa-solid fa-crosshairs', departmentScreen: 'osint', badge: 'O' },
  { id: 'Dolores', name: 'Dolores', icon: 'fa-solid fa-wave-square', departmentScreen: 'symphony', badge: 'D' },
  { id: 'Vala', name: 'Vala', icon: 'fa-solid fa-coins', departmentScreen: 'treasure', badge: 'V' },
  { id: 'Daisy', name: 'Daisy', icon: 'fa-solid fa-envelope-open-text', departmentScreen: 'archive', badge: 'D' },
];

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
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  onSelectScreen,
  onFlashClients,
  activeDepartment,
  onSelectDepartment,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const toggleCollapse = onToggleCollapse ?? (() => setInternalCollapsed((prev) => !prev));
  const drawerRef = useRef<HTMLDivElement>(null);

  // Outside click auto-dismiss when expanded
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!collapsed && drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        toggleCollapse();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [collapsed, toggleCollapse]);

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
    const match = submittedCommand.match(/^@(\w+)/);
    if (match) {
      const routineName = match[1].toLowerCase();
      const matched = ROUTINES.find((r) => r.id.toLowerCase() === routineName);
      if (matched) {
        setSelectedRoutine(matched.id);
      }
    }
    onCommand(submittedCommand);
    setCommand('');
  };

  const handleRoutineClick = (routine: typeof ROUTINES[0], e: React.MouseEvent) => {
    if (e.altKey) {
      onSelectScreen?.(routine.departmentScreen);
      return;
    }
    setSelectedRoutine(routine.id);
    onSelectDepartment?.(routine.id);

    // Active alert ring flash on Kanban canvas
    const matchingAlerts = activeAlerts.filter((alert) => (
      routine.id === 'Alfred' || alert.subRoutine.toLowerCase().includes(routine.id.toLowerCase())
    ));
    const knownIssues = generatedIssues[routine.id] || [];
    const clientIds = Array.from(new Set([
      ...matchingAlerts.map((a) => a.clientId),
      ...knownIssues.map((i) => i.clientId),
    ].filter(Boolean)));

    if (clientIds.length > 0 && onFlashClients) {
      onFlashClients(clientIds);
    }
  };

  const handleRoutineDoubleClick = (routine: typeof ROUTINES[0]) => {
    onSelectScreen?.(routine.departmentScreen);
  };

  return (
    <>
      {/* Outside-Click Backdrop when expanded */}
      {!collapsed && (
        <div
          onClick={toggleCollapse}
          className="fixed inset-0 top-[56px] bg-black/60 backdrop-blur-[2px] z-30 transition-opacity animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Full Floating Overlay Drawer */}
      <aside
        ref={drawerRef}
        className={`${collapsed ? 'relative' : 'absolute left-0 top-0 bottom-0'} z-40 h-full flex flex-col border-r border-accent-teal bg-bg-obsidian/95 backdrop-blur-md text-text-mana transition-all duration-300 ease-in-out select-none ${
          collapsed
            ? 'w-[52px] shadow-none flex-shrink-0'
            : 'w-80 shadow-[8px_0_32px_rgba(0,0,0,0.85)]'
        }`}
      >
        {/* Header & Collapse Toggle */}
        <div className="flex items-center justify-between border-b border-accent-teal bg-primary-plum/30 px-2 py-3 flex-shrink-0">
          {!collapsed && (
            <span className="font-display text-xs font-bold uppercase tracking-widest text-highlight-gold px-2">
              Multi-Agent Dispatch
            </span>
          )}
          <button
            type="button"
            onClick={toggleCollapse}
            className="flex h-6 w-6 items-center justify-center rounded border border-accent-teal/50 text-xs text-text-mana/80 hover:border-highlight-gold hover:text-highlight-gold transition-colors mx-auto cursor-pointer"
            title={collapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
          >
            {collapsed ? '»' : '«'}
          </button>
          {!collapsed && (
            <span className="h-2 w-2 rounded-full bg-text-mana shadow-[0_0_8px_#DDFBD0]" aria-label="Telemetry online" />
          )}
        </div>

        {/* ===== COLLAPSED: Icon Rail ===== */}
        {collapsed ? (
          <div className="flex flex-1 flex-col items-center py-3 space-y-2 overflow-y-auto">
            {ROUTINES.map((routine) => {
              const count = getRoutineCount(routine.id);
              const isSelected = selectedRoutine === routine.id;
              return (
                <button
                  key={routine.id}
                  type="button"
                  onClick={(e) => handleRoutineClick(routine, e)}
                  onDoubleClick={() => handleRoutineDoubleClick(routine)}
                  className={`relative flex h-8 w-8 items-center justify-center rounded border text-xs font-mono font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'border-highlight-gold bg-primary-plum text-highlight-gold shadow-[0_0_12px_rgba(224,202,60,0.4)] ring-1 ring-highlight-gold'
                      : 'border-accent-teal/50 text-text-mana/70 hover:border-text-mana hover:text-text-mana'
                  }`}
                  title={`${routine.name} (${routine.badge}) · Single-click: Filter alerts & pulse cards · Double-click / Alt-click: Open ${routine.departmentScreen.toUpperCase()}`}
                >
                  {routine.badge}
                  {count > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-alert-orange px-1 text-[0.5rem] font-bold leading-4 text-bg-obsidian text-center shadow-[0_0_6px_#fe5f00] animate-pulse">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="flex-1" />
            {/* Terminal expand button */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="flex h-8 w-8 items-center justify-center rounded border border-accent-teal/50 text-alert-orange hover:text-highlight-gold hover:border-highlight-gold transition-colors cursor-pointer"
              title="Open Command Intercom (Click to Expand)"
            >
              <i className="fa-solid fa-terminal text-xs" />
            </button>
          </div>
        ) : (
          /* ===== EXPANDED: Full Dock ===== */
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
            {/* Sub-routine tabs */}
            <div className="grid grid-cols-6 gap-1 border-b border-accent-teal/60 px-2 py-2 flex-shrink-0" aria-label="Sub-routine feed">
              {ROUTINES.map((routine) => {
                const count = getRoutineCount(routine.id);
                const isSelected = selectedRoutine === routine.id;
                return (
                  <button
                    key={routine.id}
                    type="button"
                    aria-label={`${routine.name}${count ? `, ${count} notifications` : ''}`}
                    aria-pressed={isSelected}
                    title={`${routine.name} · Click: Filter alerts · Double-click: Jump to ${routine.departmentScreen.toUpperCase()}`}
                    onClick={(e) => handleRoutineClick(routine, e)}
                    onDoubleClick={() => handleRoutineDoubleClick(routine)}
                    className={`relative flex h-8 items-center justify-center rounded border text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-highlight-gold bg-primary-plum text-highlight-gold shadow-[0_0_8px_rgba(224,202,60,0.3)]'
                        : 'border-accent-teal/50 text-text-mana/70 hover:border-accent-teal hover:text-text-mana'
                    }`}
                  >
                    <i className={routine.icon} />
                    {count > 0 && (
                      <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-alert-orange px-1 text-[0.55rem] font-bold leading-4 text-bg-obsidian shadow-[0_0_6px_#fe5f00]">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Client jumper */}
            <div className="border-b border-accent-teal/60 p-3 flex-shrink-0">
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
                        onFlashClients?.([client.id]);
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

            {/* Pipeline matrix filter */}
            <div className="border-b border-accent-teal/60 p-3 flex-shrink-0">
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
                      className={`rounded border px-2 py-1.5 text-left font-mono text-[0.58rem] transition-colors cursor-pointer ${
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

            {/* Priority feed — scrollable area with min-h-0 */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="border-b border-accent-teal/40 px-3 py-2 font-mono text-[0.62rem] uppercase text-accent-teal flex justify-between items-center">
                <span>{selectedRoutine} priority feed ({dispatchItems.length})</span>
                <span className="text-highlight-gold text-[0.55rem]">LIVE TELEMETRY</span>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {dispatchItems.length === 0 ? (
                  <p className="py-8 text-center font-mono text-xs text-accent-teal">No active items. The House is in order.</p>
                ) : dispatchItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.clientId) {
                        onJumpToClient(item.clientId);
                        onFlashClients?.([item.clientId]);
                      }
                    }}
                    className={`w-full rounded border p-2 text-left text-xs transition-colors hover:bg-primary-plum/50 cursor-pointer ${getAlertStyle(item.severity)}`}
                  >
                    <span className="block truncate font-mono text-[0.62rem] font-bold uppercase">{item.companyName} · {item.clientId}</span>
                    <span className="mt-1 block leading-snug">{item.message}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Universal Intercom — pinned bottom */}
            <form onSubmit={submitCommand} className="border-t border-accent-teal/60 bg-primary-plum/20 p-3 flex-shrink-0">
              <label htmlFor="dispatch-intercom" className="mb-1 block font-mono text-[0.62rem] uppercase text-accent-teal">
                Universal intercom
              </label>
              <div className="flex gap-1">
                <input
                  id="dispatch-intercom"
                  type="text"
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                  placeholder="@subroutine or command..."
                  className="min-w-0 flex-1 rounded border border-accent-teal bg-bg-obsidian px-2 py-1.5 font-mono text-xs text-text-mana placeholder:text-text-mana/40 focus:border-highlight-gold focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Send intercom command"
                  className="rounded border border-accent-teal px-2 text-xs text-highlight-gold hover:bg-primary-plum cursor-pointer"
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
          </div>
        )}
      </aside>
    </>
  );
};
