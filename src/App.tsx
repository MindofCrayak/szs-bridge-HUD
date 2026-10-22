/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ClientUnit, CommandKey, ActiveModal, ScreenView, TerminalLog } from './types';
import { CLIENT_TEMPLATES, COMMAND_ABILITIES } from './data/initialFleet';
import { SkyHeader } from './components/SkyHeader';
import { ClientStagingTray } from './components/ClientStagingTray';
import { KanbanCanvas } from './components/KanbanCanvas';
import { WorkspaceConsole } from './components/WorkspaceConsole';
import { CommandModals } from './components/CommandModals';
import { PipelineOverview } from './components/PipelineOverview';
import { ClientDirectoryView } from './components/ClientDirectoryView';
import { MacroMatrixView } from './components/MacroMatrixView';
import { OraclePanel } from './components/OraclePanel';
import { API_URL } from './data/api';

interface ClientApiRow {
  ClientID: unknown;
  ClientName: unknown;
  ContactEmail: unknown;
  Archetype: unknown;
  PipelineStage: unknown;
  ActiveRoadblock: unknown;
  ContractValue: unknown;
  DepositPaid: unknown;
  CurrentMilestone: unknown;
  CompletedMilestones: unknown;
  TotalMilestones: unknown;
  ChatSpaceUrl: unknown;
  NotesDocUrl: unknown;
  RootFolderID?: unknown;
  MSA_DocID?: unknown;
  ProjectFolderID?: unknown;
  SOW_DocID?: unknown;
  MeetingNotes_DriveFolderID?: unknown;
}

const toText = (value: unknown): string => value == null ? '' : String(value);

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return ['true', '1', 'yes'].includes(value.trim().toLowerCase());
  }
  return Boolean(value);
};

const getInitials = (name: string): string => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return initials || 'CL';
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('dashboard');
  const [units, setUnits] = useState<ClientUnit[]>([]);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fetchAttempt, setFetchAttempt] = useState(0);
  const [controlGroups, setControlGroups] = useState<Record<number, string[]>>({
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
    10: [],
    11: [],
    12: [],
  });
  const [activeGroupNum, setActiveGroupNum] = useState<number | null>(1);
  const gridSnapEnabled = true;
  const [stagingCollapsed, setStagingCollapsed] = useState(true);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    { id: '1', time: '00:01', text: 'Dashboard Online. Client pipeline is ready.', type: 'server' },
    { id: '2', time: '00:02', text: 'Shift-click to select multiple clients. Shift + 1–9 saves a client group.', type: 'action' },
    { id: '3', time: '00:03', text: 'Calendar, Drive, and workspace actions are available.', type: 'normal' },
  ]);

  useEffect(() => {
    const controller = new AbortController();

    const loadClients = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(API_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Google Sheets request failed with status ${response.status}.`);
        }

        const responseData: unknown = await response.json();
        if (!Array.isArray(responseData)) {
          throw new Error('Google Sheets returned an invalid client list.');
        }

        const clients = (responseData as ClientApiRow[]).map((row): ClientUnit => {
          const name = toText(row.ClientName);
          const archetype = toText(row.Archetype);
          const activePebble = toText(row.ActiveRoadblock);

          return {
            id: toText(row.ClientID),
            name,
            archetype,
            serviceArea: archetype,
            avatar: getInitials(name),
            contactEmail: toText(row.ContactEmail),
            pipelineStage: toText(row.PipelineStage),
            activePebble,
            roadblock: activePebble,
            contractValue: Number(row.ContractValue),
            depositPaid: toBoolean(row.DepositPaid),
            currentMilestone: toText(row.CurrentMilestone),
            completedMilestones: Number(row.CompletedMilestones),
            totalMilestones: Number(row.TotalMilestones),
            chatSpaceUrl: toText(row.ChatSpaceUrl),
            notesDocUrl: toText(row.NotesDocUrl),
            RootFolderID: toText(row.RootFolderID),
            MSA_DocID: toText(row.MSA_DocID),
            ProjectFolderID: toText(row.ProjectFolderID),
            SOW_DocID: toText(row.SOW_DocID),
            MeetingNotes_DriveFolderID: toText(row.MeetingNotes_DriveFolderID),
            posX: Math.floor(50 + Math.random() * 751),
            posY: Math.floor(50 + Math.random() * 251),
          };
        });

        setUnits(clients);
        const firstClientId = clients[0]?.id ?? null;
        setActiveUnitId(firstClientId);
        setSelectedUnitIds(firstClientId ? [firstClientId] : []);
        setControlGroups((previous) => ({ ...previous, 1: firstClientId ? [firstClientId] : [] }));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Unable to load clients from Google Sheets.', error);
        setLoadError(error instanceof Error ? error.message : 'Unable to load the client database.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void loadClients();
    return () => controller.abort();
  }, [fetchAttempt]);

  const logTerminal = useCallback((text: string, type: 'normal' | 'action' | 'server' | 'alert' = 'normal') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0].substring(3);
    const newLog: TerminalLog = {
      id: `${Date.now()}-${Math.random()}`,
      time: timeStr,
      text,
      type,
    };
    setTerminalLogs((prev) => [...prev.slice(-30), newLog]);
  }, []);

  const handleSelectUnit = (id: string, isShift: boolean) => {
    if (isShift) {
      setSelectedUnitIds((prev) => {
        if (prev.includes(id)) {
          const filtered = prev.filter((uId) => uId !== id);
          if (activeUnitId === id) {
            setActiveUnitId(filtered[0] || null);
          }
          return filtered;
        } else {
          setActiveUnitId(id);
          return [...prev, id];
        }
      });
    } else {
      setSelectedUnitIds([id]);
      setActiveUnitId(id);
    }
  };

  const handleUpdateUnitPosition = (id: string, x: number, y: number, pipelineStage?: string) => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, posX: x, posY: y, pipelineStage: pipelineStage || u.pipelineStage }
          : u
      )
    );
  };

  const handleUpdateUnit = (updatedUnit: ClientUnit) => {
    setUnits((prev) => prev.map((u) => (u.id === updatedUnit.id ? updatedUnit : u)));
  };

  const handleAddUnit = (newUnit: ClientUnit) => {
    setUnits((prev) => [...prev, newUnit]);
    setSelectedUnitIds([newUnit.id]);
    setActiveUnitId(newUnit.id);
  };

  const handleSpawnUnit = (presetKey: string) => {
    const preset = CLIENT_TEMPLATES[presetKey] || CLIENT_TEMPLATES.strategy;
    const randomId = `C-${Date.now()}`;
    const randomX = 35 + Math.random() * 15;
    const randomY = 80 + Math.random() * 150;

    const newUnit: ClientUnit = {
      id: randomId,
      name: `${preset.name} #${randomId.split('-')[1]}`,
      archetype: preset.serviceArea,
      serviceArea: preset.serviceArea,
      avatar: preset.avatar,
      currentMilestone: 'Initial consultation',
      totalMilestones: 4,
      completedMilestones: 0,
      contractValue: preset.contractValue,
      depositPaid: false,
      posX: randomX,
      posY: randomY,
      pipelineStage: '01: Intake',
      roadblock: 'Confirm project scope',
      contactEmail: '',
    };

    setUnits((prev) => [...prev, newUnit]);
    setSelectedUnitIds([newUnit.id]);
    setActiveUnitId(newUnit.id);
    logTerminal(`Client Onboarded: ${newUnit.name} added to Intake.`, 'action');
  };

  const handleBindControlGroup = (groupNum: number) => {
    if (selectedUnitIds.length === 0) return;
    setControlGroups((prev) => ({
      ...prev,
      [groupNum]: [...selectedUnitIds],
    }));
    setActiveGroupNum(groupNum);

    const names = selectedUnitIds
      .map((id) => {
        const u = units.find((x) => x.id === id);
        return u ? u.name : id;
      })
      .join(', ');

    logTerminal(`Client group [${groupNum}] saved: ${selectedUnitIds.length} client(s) [${names}].`, 'action');
  };

  const handleRecallControlGroup = (groupNum: number) => {
    const group = controlGroups[groupNum];
    if (!group || group.length === 0) {
      logTerminal(`Client group [${groupNum}] is empty. Select clients and press [Shift + ${groupNum}] to save.`, 'normal');
      return;
    }

    setSelectedUnitIds([...group]);
    setActiveUnitId(group[0]);
    setActiveGroupNum(groupNum);
    logTerminal(`Client group [${groupNum}] loaded (${group.length} clients selected).`, 'server');
  };

  const handleTriggerCommand = (key: CommandKey) => {
    const cmd = COMMAND_ABILITIES.find((c) => c.key === key);
    if (!cmd || cmd.disabled) return;
    setActiveModal(key);
    const active = units.find((u) => u.id === activeUnitId) || units[0];
    const targetText = selectedUnitIds.length > 1 ? `${selectedUnitIds.length} clients` : active?.name;
    logTerminal(`${cmd.label} started${targetText ? ` for ${targetText}` : ''}.`, 'action');
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // F10 for Menu
      if (e.key === 'F10') {
        e.preventDefault();
        setActiveModal('MENU');
        return;
      }

      // Numbers 1-9 for client groups
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        e.preventDefault();
        if (e.shiftKey || e.ctrlKey) {
          handleBindControlGroup(num);
        } else {
          handleRecallControlGroup(num);
        }
        return;
      }

      // Command hotkeys Q, W, E, A, S, D, Z, X, C
      const key = e.key.toUpperCase();
      const validHotkeys: CommandKey[] = ['Q', 'W', 'E', 'A', 'S', 'D', 'Z', 'X', 'C'];
      if (validHotkeys.includes(key as CommandKey) && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        handleTriggerCommand(key as CommandKey);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [units, activeUnitId, selectedUnitIds, controlGroups]);

  const activeUnit = units.find((u) => u.id === activeUnitId) || units[0] || null;

  if (isLoading) {
    return (
      <main className="flex h-screen w-screen flex-col items-center justify-center gap-5 bg-bg-obsidian text-text-mana" aria-live="polite">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-alert-orange bg-primary-plum/50 font-serif-display text-xl font-bold text-alert-orange shadow-[0_0_24px_rgba(254,95,0,0.2)]">
          SZS
        </div>
        <div className="text-center">
          <h1 className="font-display text-lg font-bold tracking-wide">Session Zero Solutions</h1>
          <p className="mt-2 font-mono text-xs text-text-mana/70">Establishing secure connection to Google Cloud...</p>
        </div>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-accent-teal/30">
          <div className="h-full w-1/2 animate-pulse bg-alert-orange" />
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-bg-obsidian px-6 text-center text-text-mana" role="alert">
        <div className="font-serif-display text-2xl font-bold text-alert-orange">SZS</div>
        <h1 className="font-display text-lg font-bold">Could not connect to the client database</h1>
        <p className="max-w-lg text-sm text-text-mana/70">{loadError}</p>
        <button
          onClick={() => {
            setIsLoading(true);
            setFetchAttempt((attempt) => attempt + 1);
          }}
          className="rounded-lg bg-alert-orange px-4 py-2 font-accent text-bg-obsidian"
        >
          Retry connection
        </button>
      </main>
    );
  }

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-bg-obsidian text-text-mana">

      {/* Dashboard header */}
      <SkyHeader
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
        onOpenOracle={() => setIsOracleOpen(true)}
      />

      {/* Screen Views */}
      {currentScreen === 'dashboard' && (
        <main className="relative flex-1 w-full min-h-0 flex flex-col overflow-hidden">
          {/* Collapsible client template drawer */}
          <ClientStagingTray
            isCollapsed={stagingCollapsed}
            onToggleCollapse={() => setStagingCollapsed((prev) => !prev)}
            onSpawnUnit={handleSpawnUnit}
          />

          {/* Client pipeline canvas */}
          <KanbanCanvas
            units={units}
            activeUnitId={activeUnitId}
            selectedUnitIds={selectedUnitIds}
            onSelectUnit={handleSelectUnit}
            onUpdateUnitPosition={handleUpdateUnitPosition}
            gridSnapEnabled={gridSnapEnabled}
            onLogTerminal={logTerminal}
          />

          <WorkspaceConsole
            units={units}
            activeUnit={activeUnit}
            selectedUnitIds={selectedUnitIds}
            controlGroups={controlGroups}
            activeGroupNum={activeGroupNum}
            onRecallControlGroup={handleRecallControlGroup}
            onTriggerCommand={handleTriggerCommand}
          />
        </main>
      )}

      {currentScreen === 'pipeline' && (
        <PipelineOverview
          units={units}
          onSelectUnit={(id) => {
            setSelectedUnitIds([id]);
            setActiveUnitId(id);
          }}
          onNavigateToDashboard={() => setCurrentScreen('dashboard')}
          onLogTerminal={logTerminal}
        />
      )}

      {currentScreen === 'clients' && (
        <ClientDirectoryView
          units={units}
          onSelectUnit={(id) => {
            setSelectedUnitIds([id]);
            setActiveUnitId(id);
          }}
          onUpdateUnit={handleUpdateUnit}
          onNavigateToDashboard={() => setCurrentScreen('dashboard')}
          onLogTerminal={logTerminal}
          onOpenIntake={() => setActiveModal('A')}
        />
      )}

      {currentScreen === 'actions' && (
        <MacroMatrixView
          onTriggerCommand={handleTriggerCommand}
          onNavigateToDashboard={() => setCurrentScreen('dashboard')}
        />
      )}

      {/* Interactive Command Modals for Q, W, E, A, S, D, Z, X, C, and Menu */}
      <CommandModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        activeUnit={activeUnit}
        onAddUnit={handleAddUnit}
        onLogTerminal={logTerminal}
      />

      <OraclePanel
        isOpen={isOracleOpen}
        activeUnit={activeUnit}
        onClose={() => setIsOracleOpen(false)}
        onLogTerminal={logTerminal}
      />
    </div>
  );
}
