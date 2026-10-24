/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TokenResponse } from '@react-oauth/google';
import { AlfredAlert, ClientUnit, CommandKey, ActiveModal, HudTelemetry, ScreenView, TerminalLog } from './types';
import { COMMAND_ABILITIES } from './data/initialFleet';
import { SkyHeader } from './components/SkyHeader';
import { AlfredDock } from './components/AlfredDock';
import { CardContextMenu } from './components/CardContextMenu';
import { KanbanCanvas } from './components/KanbanCanvas';
import { WorkspaceConsole } from './components/WorkspaceConsole';
import { CommandModals } from './components/CommandModals';
import { PipelineOverview } from './components/PipelineOverview';
import { ClientDirectoryView } from './components/ClientDirectoryView';
import { MacroMatrixView } from './components/MacroMatrixView';
import { ComplianceModal } from './components/ComplianceModal';
import { GoogleSignIn } from './components/GoogleSignIn';
import { DepartmentConsole, DepartmentId } from './components/DepartmentConsole';
import { ReactiveBridgeCanvas } from './components/ReactiveBridgeCanvas';
import { fetchMasterControlState, postMasterControlAction } from './data/api';
import { getNextPipelineStage, normalizePipelineStage, PIPELINE_STAGE_SEQUENCE } from './data/pipeline';
import { useCanvasZoomPan } from './hooks/useCanvasZoomPan';

const toText = (value: unknown): string => value == null ? '' : String(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readNormalizedField = (record: Record<string, unknown>, field: string): unknown => {
  const key = field.replace(/_/g, '').toLowerCase();
  const entry = Object.entries(record).find(([name]) => name.replace(/_/g, '').toLowerCase() === key);
  return entry?.[1];
};

const toFiniteNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getStageNumber = (stage: string): number => {
  const value = Number.parseInt(normalizePipelineStage(stage).split(':', 1)[0], 10);
  return Number.isFinite(value) ? value : 0;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return ['true', '1', 'yes'].includes(value.trim().toLowerCase());
  }
  return Boolean(value);
};

const normalizeAlert = (value: unknown, clients: ClientUnit[]): AlfredAlert => {
  if (!isRecord(value)) throw new Error('Master Control returned an invalid alert record.');
  const clientId = toText(readNormalizedField(value, 'ClientID'));
  const client = clients.find((item) => item.id === clientId);
  return {
    id: toText(readNormalizedField(value, 'AlertID')) || `ALERT-${clientId}-${toText(readNormalizedField(value, 'Timestamp'))}`,
    timestamp: toText(readNormalizedField(value, 'Timestamp')),
    severity: toText(readNormalizedField(value, 'Severity') ?? readNormalizedField(value, 'Priority') ?? readNormalizedField(value, 'Category')) || 'INFO',
    subRoutine: toText(readNormalizedField(value, 'SubRoutine') ?? readNormalizedField(value, 'Category')) || 'Alfred',
    clientId,
    companyName: toText(readNormalizedField(value, 'CompanyName')) || client?.companyName || client?.name || '',
    message: toText(readNormalizedField(value, 'Message')),
    dismissed: toBoolean(readNormalizedField(value, 'Dismissed') ?? readNormalizedField(value, 'DismissedStatus')),
  };
};

const normalizeTelemetry = (value: unknown, alerts: AlfredAlert[]): HudTelemetry => {
  const telemetry = isRecord(value) ? value : {};
  const ribbon = isRecord(telemetry.ribbon) ? telemetry.ribbon : telemetry;
  return {
    pipelineMrr: toFiniteNumber(readNormalizedField(ribbon, 'PipelineMRR')),
    activeSprints: toFiniteNumber(readNormalizedField(ribbon, 'ActiveSprints')),
    missingDeposits: toFiniteNumber(readNormalizedField(ribbon, 'MissingDeposits')),
    activeAlertsCount: toFiniteNumber(readNormalizedField(telemetry, 'ActiveAlertsCount')) || alerts.filter((alert) => !alert.dismissed).length,
    lastSynced: toText(readNormalizedField(telemetry, 'LastSynced')) || toText(readNormalizedField(telemetry, 'Timestamp')),
  };
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
  const [alerts, setAlerts] = useState<AlfredAlert[]>([]);
  const [telemetry, setTelemetry] = useState<HudTelemetry | null>(null);
  const [intercomStatus, setIntercomStatus] = useState('');
  const [activeFilters, setActiveFilters] = useState<number[]>([0, 1, 2, 3]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; client: ClientUnit } | null>(null);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [oauthError, setOAuthError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
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
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [isDepartmentConsoleOpen, setIsDepartmentConsoleOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeDepartment, setActiveDepartment] = useState<string>('Alfred');
  const [complianceRequestId, setComplianceRequestId] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    { id: '1', time: '00:01', text: 'Dashboard Online. Client pipeline is ready.', type: 'server' },
    { id: '2', time: '00:02', text: 'Shift-click to select multiple clients. Shift + 1–9 saves a client group.', type: 'action' },
    { id: '3', time: '00:03', text: 'Calendar, Drive, and workspace actions are available.', type: 'normal' },
  ]);

  const { containerRef: canvasContainerRef, scale: canvasScale, resetZoom: handleResetCanvasZoom, canvasStyle } = useCanvasZoomPan(1.0);

  useEffect(() => {
    const controller = new AbortController();

    const loadClients = async () => {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setLoadError(null);

      try {
        const responseData: unknown = await fetchMasterControlState(accessToken, controller.signal);
        if (!isRecord(responseData)) {
          throw new Error('Master Control returned an invalid HUD state response.');
        }

        if (responseData.status !== 200 && responseData.status !== 'success') {
          throw new Error(toText(responseData.message) || 'Master Control rejected the HUD state request.');
        }

        const stateData = responseData.data;
        if (!isRecord(stateData) || !Array.isArray(stateData.clients)) {
          throw new Error('Master Control returned an invalid client list.');
        }

        const clients = stateData.clients.map((row): ClientUnit => {
          if (!isRecord(row)) {
            throw new Error('Master Control returned an invalid client record.');
          }
          const readField = (field: string) => readNormalizedField(row, field);
          const id = toText(readField('ClientID')).trim();
          const personName = [readField('FirstName'), readField('LastName')]
            .map((value) => toText(value).trim())
            .filter(Boolean)
            .join(' ');
          const companyName = toText(readField('CompanyName') ?? readField('ClientName')).trim();
          const primaryContact = toText(readField('PrimaryContact')).trim() || personName;
          const name = [companyName, primaryContact]
            .map((value) => toText(value).trim())
            .find(Boolean) || '';
          if (!id || !name) {
            throw new Error('Master Control client records must include ClientID and a client or company name.');
          }
          const archetype = toText(readField('Archetype'));
          const activePebble = toText(readField('ActiveRoadblock'));
          const caseFileJsonUrl = toText(readField('CaseFileJsonUrl'));

          return {
            id,
            name,
            archetype,
            serviceArea: archetype,
            avatar: getInitials(name),
            contactEmail: toText(readField('ContactEmail')),
            companyName,
            primaryContact,
            leadSource: toText(readField('LeadSource')),
            taskListId: toText(readField('GoogleTasklistID')),
            googleGroupEmail: toText(readField('GoogleGroupEmail')),
            pipelineStage: normalizePipelineStage(toText(readField('PipelineStage') ?? readField('CurrentStage') ?? readField('Stage'))),
            activePebble,
            roadblock: activePebble,
            contractValue: toFiniteNumber(readField('ContractValue')),
            depositPaid: toBoolean(readField('DepositPaid')),
            currentMilestone: toText(readField('CurrentMilestone')),
            completedMilestones: toFiniteNumber(readField('CompletedMilestones')),
            totalMilestones: toFiniteNumber(readField('TotalMilestones')),
            chatSpaceUrl: toText(readField('ChatSpaceUrl')),
            notesDocUrl: toText(readField('NotesDocUrl')),
            driveFolderUrl: toText(readField('DriveFolderUrl')),
            caseFileJsonUrl,
            osintGenerated: toBoolean(readField('OSINTGenerated')) || Boolean(caseFileJsonUrl),
            RootFolderID: toText(readField('RootFolderID')),
            MSA_DocID: toText(readField('MSA_DocID')),
            ProjectFolderID: toText(readField('ProjectFolderID')),
            SOW_DocID: toText(readField('SOW_DocID')),
            MeetingNotes_DriveFolderID: toText(readField('MeetingNotes_DriveFolderID')),
            posX: Math.floor(50 + Math.random() * 751),
            posY: Math.floor(50 + Math.random() * 251),
          };
        });

        const normalizedAlerts = Array.isArray(stateData.alerts)
          ? stateData.alerts.map((alert) => normalizeAlert(alert, clients))
          : [];
        setUnits(clients);
        setAlerts(normalizedAlerts);
        setTelemetry(normalizeTelemetry(stateData.telemetry ?? stateData.ribbon, normalizedAlerts));
        const firstClientId = clients[0]?.id ?? null;
        setActiveUnitId(firstClientId);
        setSelectedUnitIds(firstClientId ? [firstClientId] : []);
        setControlGroups((previous) => ({ ...previous, 1: firstClientId ? [firstClientId] : [] }));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Unable to load HUD state from Master Control.', error);
        setLoadError(error instanceof Error ? error.message : 'Unable to load the client database.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void loadClients();
    return () => controller.abort();
  }, [accessToken, fetchAttempt]);

  useEffect(() => {
    if (!tokenExpiresAt) return;
    const timeoutId = window.setTimeout(() => {
      setAccessToken(null);
      setTokenExpiresAt(null);
      setOAuthError('Your Google access token expired. Sign in again to continue.');
    }, Math.max(0, tokenExpiresAt - Date.now()));
    return () => window.clearTimeout(timeoutId);
  }, [tokenExpiresAt]);

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
    const existingUnit = units.find((unit) => unit.id === id);
    const previousStage = existingUnit?.pipelineStage;
    const nextStage = pipelineStage || previousStage || '';
    setUnits((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, posX: x, posY: y, pipelineStage: nextStage }
          : u
      )
    );
    if (!existingUnit || existingUnit.isDraft || !previousStage || nextStage === previousStage) return;
    if (!accessToken) return;
    void postMasterControlAction(accessToken, { action: 'updateKanban', clientID: id, newStage: nextStage })
      .then(() => logTerminal(`${existingUnit.name} moved to ${nextStage}; Master Control synchronized.`, 'server'))
      .catch((error: unknown) => {
        setUnits((previous) => previous.map((unit) => (
          unit.id === id && unit.pipelineStage === nextStage
            ? { ...unit, pipelineStage: previousStage }
            : unit
        )));
        logTerminal(error instanceof Error ? error.message : 'Master Control could not save the pipeline move.', 'alert');
      });
  };

  const handleUpdateUnit = (updatedUnit: ClientUnit) => {
    setUnits((prev) => prev.map((u) => (u.id === updatedUnit.id ? updatedUnit : u)));
  };

  const handleAddUnit = (newUnit: ClientUnit) => {
    setUnits((prev) => [...prev, { ...newUnit, isDraft: true }]);
    setSelectedUnitIds([newUnit.id]);
    setActiveUnitId(newUnit.id);
  };

  const handleToggleFilter = (columnIndex: number) => {
    setActiveFilters((previous) => previous.includes(columnIndex)
      ? previous.filter((index) => index !== columnIndex)
      : [...previous, columnIndex].sort());
  };

  const handleJumpToClient = (id: string) => {
    const client = units.find((unit) => unit.id === id);
    if (!client) return;
    setActiveUnitId(id);
    setSelectedUnitIds([id]);
    setUnits((previous) => previous.map((unit) => unit.id === id
      ? { ...unit, posX: 500, posY: Math.max(32, Math.round(window.innerHeight * 0.12)) }
      : unit));
    logTerminal(`Viewport focused on ${client.companyName || client.name} (${client.id}).`, 'action');
  };

  const persistPipelineStage = async (client: ClientUnit, newStage: string) => {
    if (client.isDraft) {
      logTerminal(`${client.name} is a local draft; its stage change is not persisted.`, 'alert');
      return;
    }
    setUnits((previous) => previous.map((unit) => unit.id === client.id ? { ...unit, pipelineStage: newStage } : unit));
    try {
      if (!accessToken) throw new Error('Google sign-in is required to save this change.');
      await postMasterControlAction(accessToken, { action: 'updateKanban', clientID: client.id, newStage });
      logTerminal(`${client.companyName || client.name} moved to ${newStage}; Master Control synchronized.`, 'server');
    } catch (error) {
      setUnits((previous) => previous.map((unit) => (
        unit.id === client.id && unit.pipelineStage === newStage
          ? { ...unit, pipelineStage: client.pipelineStage }
          : unit
      )));
      logTerminal(error instanceof Error ? error.message : 'Master Control could not save the pipeline stage.', 'alert');
    }
  };

  const handleAdvanceStage = (client: ClientUnit) => {
    const nextStage = getNextPipelineStage(client.pipelineStage);
    if (nextStage === normalizePipelineStage(client.pipelineStage)) {
      logTerminal(`${client.name} is already at the final pipeline stage.`, 'normal');
      return;
    }
    void persistPipelineStage(client, nextStage);
  };

  const handleSunsetClient = (client: ClientUnit) => {
    if (normalizePipelineStage(client.pipelineStage) === PIPELINE_STAGE_SEQUENCE[PIPELINE_STAGE_SEQUENCE.length - 1]) {
      logTerminal(`${client.name} is already in Sunset / Retainer.`, 'normal');
      return;
    }
    void persistPipelineStage(client, PIPELINE_STAGE_SEQUENCE[PIPELINE_STAGE_SEQUENCE.length - 1]);
  };

  const handleDraftInvoice = (client: ClientUnit) => {
    logTerminal(`Invoice draft requested for ${client.companyName || client.name}; invoice generation is not connected yet.`, 'action');
  };

  const handleFlagBlocker = (client: ClientUnit) => {
    const message = window.prompt(`Describe the blocker for ${client.companyName || client.name}:`)?.trim();
    if (!message) return;
    const alert: AlfredAlert = {
      id: `ALT-MANUAL-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: 'BLOCKER',
      subRoutine: 'Alfred',
      clientId: client.id,
      companyName: client.companyName || client.name,
      message,
      dismissed: false,
    };
    setAlerts((previous) => [alert, ...previous]);
    if (!accessToken) {
      logTerminal('Google sign-in is required to save the blocker alert.', 'alert');
      return;
    }
    void postMasterControlAction(accessToken, {
      action: 'logAlert',
      alert: {
        alert_id: alert.id,
        timestamp: alert.timestamp,
        severity: alert.severity,
        sub_routine: alert.subRoutine,
        client_id: alert.clientId,
        company_name: alert.companyName,
        message: alert.message,
        dismissed: false,
        raw_payload: null,
      },
    }).then(() => {
      logTerminal(`Blocker recorded for ${client.companyName || client.name}.`, 'server');
    }).catch((error: unknown) => {
      setAlerts((previous) => previous.filter((item) => item.id !== alert.id));
      logTerminal(error instanceof Error ? error.message : 'Master Control could not save the blocker alert.', 'alert');
    });
  };

  const handleDeleteDraftCard = (client: ClientUnit) => {
    if (!client.isDraft) return;
    setUnits((previous) => previous.filter((unit) => unit.id !== client.id));
    setSelectedUnitIds((previous) => previous.filter((id) => id !== client.id));
    if (activeUnitId === client.id) setActiveUnitId(null);
    logTerminal(`Local draft card removed: ${client.name}.`, 'action');
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

    const active = units.find((u) => u.id === activeUnitId) || units[0];
    const targetText = selectedUnitIds.length > 1 ? `${selectedUnitIds.length} clients` : active?.name;
    if (key === 'Z') {
      logTerminal('Oracle MMD is quarantined and excluded from the Command HUD package.', 'alert');
      return;
    }
    if (key === 'C') {
      setCurrentScreen('dashboard');
      setIsComplianceModalOpen(true);
      setComplianceRequestId((requestId) => requestId + 1);
      logTerminal(`${cmd.label} started${targetText ? ` for ${targetText}` : ''}.`, 'action');
      return;
    }

    setActiveModal(key);
    logTerminal(`${cmd.label} started${targetText ? ` for ${targetText}` : ''}.`, 'action');
  };

  const handleGoogleToken = (tokenResponse: TokenResponse) => {
    setOAuthError(null);
    setLoadError(null);
    setAccessToken(tokenResponse.access_token);
    setTokenExpiresAt(tokenResponse.expires_in
      ? Date.now() + tokenResponse.expires_in * 1000
      : null);
  };

  const handleSignOut = () => {
    setAccessToken(null);
    setTokenExpiresAt(null);
    setOAuthError(null);
    setActiveModal(null);
    setIsComplianceModalOpen(false);
    setIsDepartmentConsoleOpen(false);
    setContextMenu(null);
    setUnits([]);
    setAlerts([]);
    setTelemetry(null);
    setActiveUnitId(null);
    setSelectedUnitIds([]);
    setTerminalLogs([]);
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

      // Ctrl+B to toggle sidebar collapse
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
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
  const headerTelemetry: HudTelemetry = {
    pipelineMrr: units
      .filter((unit) => getStageNumber(unit.pipelineStage) !== 9)
      .reduce((total, unit) => total + unit.contractValue, 0),
    activeSprints: units.filter((unit) => {
      const stage = getStageNumber(unit.pipelineStage);
      return stage >= 4 && stage <= 7;
    }).length,
    missingDeposits: units.filter((unit) => getStageNumber(unit.pipelineStage) === 2 && !unit.depositPaid).length,
    activeAlertsCount: alerts.filter((alert) => !alert.dismissed).length,
    lastSynced: telemetry?.lastSynced || '',
  };
  const handleTerminalCommand = (command: string) => {
    const message = `Received "${command}". Command dispatch is not connected yet.`;
    setIntercomStatus(message);
    logTerminal(message, 'action');
  };
  const handleDepartmentCommandDraft = (department: DepartmentId, command: string) => {
    const message = `${department} command draft received locally: "${command}". No connector is configured; nothing was sent or persisted.`;
    logTerminal(message, 'alert');
  };

  if (!accessToken) {
    return (
      <main className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-bg-obsidian px-6 text-text-mana">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-alert-orange bg-primary-plum/50 font-serif-display text-xl font-bold text-alert-orange shadow-[0_0_24px_rgba(254,95,0,0.2)]">
          SZS
        </div>
        <div className="text-center">
          <h1 className="font-display text-xl font-bold tracking-wide">Session Zero Solutions</h1>
          <p className="mt-2 font-mono text-xs text-text-mana/70">Sign in to securely connect to Master Control.</p>
        </div>
        <GoogleSignIn
          deploymentConfigured={Boolean(import.meta.env.VITE_APPS_SCRIPT_DEPLOYMENT_ID?.trim())}
          error={oauthError}
          onError={setOAuthError}
          onToken={handleGoogleToken}
        />
      </main>
    );
  }

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
        <button type="button" onClick={handleSignOut} className="font-mono text-xs text-text-mana/60 underline hover:text-alert-orange">
          Sign out
        </button>
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
        <button type="button" onClick={handleSignOut} className="font-mono text-xs text-text-mana/60 underline hover:text-alert-orange">
          Sign out
        </button>
      </main>
    );
  }

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-bg-obsidian text-text-mana">
      {/* Reactive Airship Bridge Canvas */}
      <ReactiveBridgeCanvas activeDepartment={activeDepartment} alertsCount={headerTelemetry.activeAlertsCount} />

      {/* Dashboard header */}
      <SkyHeader
        currentScreen={currentScreen}
        telemetry={headerTelemetry}
        isBackendConnected={!isLoading && !loadError}
        onSelectScreen={(screen) => {
          setCurrentScreen(screen);
          if (screen !== 'dashboard') setIsDepartmentConsoleOpen(false);
        }}
        onOpenDepartments={() => {
          const shouldOpen = currentScreen !== 'dashboard' || !isDepartmentConsoleOpen;
          setCurrentScreen('dashboard');
          setIsDepartmentConsoleOpen(shouldOpen);
        }}
        isDepartmentConsoleOpen={isDepartmentConsoleOpen}
        onSignOut={handleSignOut}
        zoomScale={canvasScale}
        onResetZoom={handleResetCanvasZoom}
      />

      {/* Screen Views */}
      {currentScreen === 'dashboard' && (
        <main className="relative flex-1 w-full min-h-0 flex flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1">
            <AlfredDock
              clients={units}
              alerts={alerts}
              activeFilters={activeFilters}
              onToggleFilter={handleToggleFilter}
              onJumpToClient={handleJumpToClient}
              onCommand={handleTerminalCommand}
              commandFeedback={intercomStatus}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            />
            <div 
              ref={canvasContainerRef} 
              className="flex-1 min-h-0 min-w-0 overflow-hidden relative cursor-default"
            >
              <div style={canvasStyle} className="origin-top-left">
                <KanbanCanvas
                  units={units}
                  activeFilters={activeFilters}
                  activeUnitId={activeUnitId}
                  selectedUnitIds={selectedUnitIds}
                  onSelectUnit={handleSelectUnit}
                  onUpdateUnitPosition={handleUpdateUnitPosition}
                  gridSnapEnabled={gridSnapEnabled}
                  onLogTerminal={logTerminal}
                  onOpenContextMenu={(x, y, client) => setContextMenu({ x, y, client })}
                />
              </div>
            </div>
          </div>

          <WorkspaceConsole
            units={units}
            activeUnit={activeUnit}
            selectedUnitIds={selectedUnitIds}
            controlGroups={controlGroups}
            activeGroupNum={activeGroupNum}
            onRecallControlGroup={handleRecallControlGroup}
            onTriggerCommand={handleTriggerCommand}
            complianceRequestId={complianceRequestId}
          />
          {isDepartmentConsoleOpen && (
            <DepartmentConsole
              units={units}
              activeUnit={activeUnit}
              alerts={alerts}
              isBackendConnected={!isLoading && !loadError}
              onClose={() => setIsDepartmentConsoleOpen(false)}
              onSelectUnit={(id) => handleSelectUnit(id, false)}
              onTriggerCommand={handleTriggerCommand}
              onCommandDraft={handleDepartmentCommandDraft}
            />
          )}
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
        units={units}
        onAddUnit={handleAddUnit}
        onLogTerminal={logTerminal}
      />

      {contextMenu && (
        <CardContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          client={contextMenu.client}
          onClose={() => setContextMenu(null)}
          onAdvanceStage={handleAdvanceStage}
          onDraftInvoice={handleDraftInvoice}
          onFlagBlocker={handleFlagBlocker}
          onSunsetClient={handleSunsetClient}
          onDeleteDraftCard={handleDeleteDraftCard}
        />
      )}
      {isComplianceModalOpen && (
        <ComplianceModal
          activeUnit={activeUnit}
          accessToken={accessToken}
          onClose={() => setIsComplianceModalOpen(false)}
        />
      )}
    </div>
  );
}
