/**
 * @license
 * Session Zero Solutions // SZS Command HUD 2.0 Root Architecture
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TokenResponse } from '@react-oauth/google';
import { 
  AlfredAlert, 
  ClientRecord, 
  CommandKey, 
  ActiveModal, 
  HudTelemetry, 
  ScreenView, 
  TerminalLog,
  ClientUnit
} from './types';
import { SkyHeader } from './components/navigation/SkyHeader';
import { MultiAgentDispatch } from './components/navigation/MultiAgentDispatch';
import { DepartmentHeaderTray } from './components/canvas/DepartmentHeaderTray';
import { TacticalCanvas } from './components/canvas/TacticalCanvas';
import { BottomConsoleChassis } from './components/chassis/BottomConsoleChassis';
import { AvionicsCockpitView } from './components/cockpit/AvionicsCockpitView';
import { CardContextMenu } from './components/CardContextMenu';
import { CommandModals } from './components/CommandModals';
import { PipelineOverview } from './components/PipelineOverview';
import { ClientDirectoryView } from './components/ClientDirectoryView';
import { MacroMatrixView } from './components/MacroMatrixView';
import { ComplianceModal } from './components/ComplianceModal';
import { GoogleSignIn } from './components/GoogleSignIn';
import { DepartmentConsole, DepartmentId } from './components/DepartmentConsole';
import { ReactiveBridgeCanvas } from './components/ReactiveBridgeCanvas';
import { OsintWarRoomView } from './components/OsintWarRoomView';
import { SymphonyMatrixView } from './components/SymphonyMatrixView';
import { TreasureLedgerView } from './components/TreasureLedgerView';
import { GrandArchiveView } from './components/GrandArchiveView';
import { MailCommandCenter } from './components/departments/MailCommandCenter';
import { fetchMasterControlState, postMasterControlAction } from './data/api';
import { normalizeAccountPhase, normalizeSprintStage } from './data/pipeline';
import { DEMO_CLIENT_UNITS, DEMO_ALERTS, DEMO_TELEMETRY } from './data/demoFleet';
import { useBridgeKeybindings, loadStoredKeymap, KeymapConfig } from './hooks/useBridgeKeybindings';
import { KeybindingSettingsModal } from './components/navigation/KeybindingSettingsModal';

interface AppProps {
  isDemoModeInitial?: boolean;
}

export default function App({ isDemoModeInitial = false }: AppProps) {
  // Module 5: Strict route isolation for secondary cockpit window
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/cockpit')) {
    return (
      <div className="w-screen h-screen max-h-[1366px] overflow-hidden bg-[#020500] flex items-center justify-center">
        <AvionicsCockpitView />
      </div>
    );
  }

  const [currentScreen, setCurrentScreen] = useState<ScreenView>('dashboard');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(isDemoModeInitial);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [alerts, setAlerts] = useState<AlfredAlert[]>([]);
  const [telemetry, setTelemetry] = useState<HudTelemetry | null>(null);
  const [activeDepartment, setActiveDepartment] = useState<string>('Alfred');

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; client: ClientRecord } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [oauthError, setOAuthError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [fetchAttempt, setFetchAttempt] = useState(0);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [isDepartmentConsoleOpen, setIsDepartmentConsoleOpen] = useState(false);
  const [complianceRequestId, setComplianceRequestId] = useState(0);

  const [keymap, setKeymap] = useState<KeymapConfig>(loadStoredKeymap);
  const [isKeymapModalOpen, setIsKeymapModalOpen] = useState(false);
  const [controlGroups, setControlGroups] = useState<Record<number, string[]>>({ 1: [] });
  const [activeGroupNum, setActiveGroupNum] = useState<number | null>(1);

  const [currentSkin, setCurrentSkin] = useState<string>(() => {
    try {
      return localStorage.getItem('szs_chassis_skin') || 'heraldry-gold';
    } catch {
      return 'heraldry-gold';
    }
  });

  const [canvasZoom, setCanvasZoom] = useState<number>(1.0);
  const [workbenchClient, setWorkbenchClient] = useState<ClientRecord | null>(null);

  const handleToggleSkin = useCallback(() => {
    setCurrentSkin((prev) => {
      const next = prev === 'heraldry-gold' ? 'stealth-obsidian' : 'heraldry-gold';
      document.documentElement.setAttribute('data-skin', next);
      try { localStorage.setItem('szs_chassis_skin', next); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-skin', currentSkin);
  }, [currentSkin]);

  // Load state from Master Control API or Fallback Demo Fleet
  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      if (isDemoMode) {
        setIsLoading(false);
        setLoadError(null);
        const mappedClients: ClientRecord[] = DEMO_CLIENT_UNITS.map((u) => ({
          ClientID: u.id,
          Company_Name: u.companyName || u.name,
          PrimaryContact: u.primaryContact || '',
          ContactEmail: u.contactEmail || '',
          AccountPhase: normalizeAccountPhase(u.pipelineStage || '01: Intake'),
          ContractValue: u.contractValue,
          DepositPaid: u.depositPaid,
          DriveFolderUrl: u.driveFolderUrl || '',
          NotesDocUrl: u.notesDocUrl || '',
          MSA_DocID: u.MSA_DocID || '',
          SOW_DocID: u.SOW_DocID || '',
          ChatSpaceUrl: u.chatSpaceUrl || '',
          activeProjects: [
            {
              ProjectID: `PRJ-${u.id}-01`,
              ClientID: u.id,
              SprintStage: normalizeSprintStage(u.pipelineStage || '00: Discovery'),
              MilestonesTotal: u.totalMilestones || 4,
              MilestonesDone: u.completedMilestones || 1,
              AssignedRateTier: 'Normal',
              Title: u.currentMilestone || 'Sprint Architecture & Execution',
            },
          ],
          activePebble: u.activePebble,
          roadblock: u.roadblock,
          avatar: u.avatar,
          archetype: u.archetype,
          caseFileJsonUrl: u.caseFileJsonUrl,
          osintGenerated: u.osintGenerated,
          leadSource: u.leadSource,
        }));
        setClients(mappedClients);
        setAlerts(DEMO_ALERTS);
        setTelemetry(DEMO_TELEMETRY);
        setSelectedClientId(mappedClients[0]?.ClientID || null);
        return;
      }

      if (!accessToken) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setLoadError(null);

      try {
        const responseData: any = await fetchMasterControlState(accessToken, controller.signal);
        if (responseData && (responseData.status === 200 || responseData.status === 'success') && responseData.data) {
          const rawClients = responseData.data.clients || [];
          const mapped: ClientRecord[] = rawClients.map((row: any) => {
            const id = String(row.ClientID || '').trim();
            const companyName = String(row.CompanyName || row.ClientName || id).trim();
            return {
              ClientID: id,
              Company_Name: companyName,
              PrimaryContact: String(row.PrimaryContact || ''),
              ContactEmail: String(row.ContactEmail || ''),
              AccountPhase: normalizeAccountPhase(String(row.PipelineStage || row.CurrentStage || '01: Intake')),
              ContractValue: Number(row.ContractValue) || 0,
              DepositPaid: Boolean(row.DepositPaid),
              DriveFolderUrl: String(row.DriveFolderUrl || ''),
              NotesDocUrl: String(row.NotesDocUrl || ''),
              MSA_DocID: String(row.MSA_DocID || ''),
              SOW_DocID: String(row.SOW_DocID || ''),
              ChatSpaceUrl: String(row.ChatSpaceUrl || ''),
              activeProjects: [
                {
                  ProjectID: `PRJ-${id}-01`,
                  ClientID: id,
                  SprintStage: normalizeSprintStage(String(row.PipelineStage || '00: Discovery')),
                  MilestonesTotal: Number(row.TotalMilestones) || 4,
                  MilestonesDone: Number(row.CompletedMilestones) || 0,
                  AssignedRateTier: 'Normal',
                  Title: String(row.CurrentMilestone || 'Active Sprint Delivery'),
                },
              ],
            };
          });
          setClients(mapped);
          setAlerts(responseData.data.alerts || []);
          setSelectedClientId(mapped[0]?.ClientID || null);
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setLoadError(err.message || 'Unable to connect to Master Control.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void loadData();
    return () => controller.abort();
  }, [accessToken, fetchAttempt, isDemoMode]);

  const activeClient = clients.find((c) => c.ClientID === selectedClientId) || clients[0] || null;

  const handleUpdateClient = (updated: ClientRecord) => {
    setClients((prev) => prev.map((c) => (c.ClientID === updated.ClientID ? updated : c)));
  };

  const handleForceAdvance = (client: ClientRecord) => {
    const phases: ClientRecord['AccountPhase'][] = [
      '01: Intake',
      '02: Session Zero',
      '03: Active Sprints',
      '04: Liftoff',
      '05: Complete',
      '06: Archived/Sunset',
    ];
    const currentIndex = phases.indexOf(client.AccountPhase);
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      const updated = { ...client, AccountPhase: nextPhase };
      handleUpdateClient(updated);

      const alertMsg: AlfredAlert = {
        id: `ALERT-OVERRIDE-${Date.now()}`,
        timestamp: new Date().toISOString(),
        severity: 'WARNING',
        subRoutine: 'Alfred',
        clientId: client.ClientID,
        companyName: client.Company_Name,
        message: `Admin force advance executed for ${client.Company_Name}. Stage gate bypassed.`,
        dismissed: false,
      };
      setAlerts((prev) => [alertMsg, ...prev]);

      if (accessToken) {
        void postMasterControlAction(accessToken, {
          action: 'updateKanban',
          clientID: client.ClientID,
          newStage: nextPhase,
          overrideAuth: true,
        });
      }
    }
  };

  const handleGoogleToken = (tokenResponse: TokenResponse) => {
    setOAuthError(null);
    setLoadError(null);
    setIsDemoMode(false);
    setAccessToken(tokenResponse.access_token);
    setTokenExpiresAt(tokenResponse.expires_in ? Date.now() + tokenResponse.expires_in * 1000 : null);
  };

  const handleSignOut = () => {
    setAccessToken(null);
    setTokenExpiresAt(null);
    setIsDemoMode(false);
    setClients([]);
  };

  // Keyboard navigation & RTS control group handlers
  const handleSwitchDepartment = useCallback((view: string) => {
    const validScreens: ScreenView[] = ['dashboard', 'pipeline', 'osint', 'symphony', 'treasure', 'archive', 'cockpit', 'clients', 'actions'];
    if (validScreens.includes(view as ScreenView)) {
      setCurrentScreen(view as ScreenView);
      if (view !== 'dashboard') setIsDepartmentConsoleOpen(false);
    }
  }, []);

  const handleRecallClientSlot = useCallback((slot: number) => {
    if (slot === 0) {
      setSelectedClientId(null);
      return;
    }
    // Check if slot was explicitly bound in controlGroups
    const boundIds = controlGroups[slot];
    if (boundIds && boundIds.length > 0) {
      const found = clients.find((c) => c.ClientID === boundIds[0]);
      if (found) {
        setSelectedClientId(found.ClientID);
        setActiveGroupNum(slot);
        return;
      }
    }
    // Fallback to array index if not bound
    const target = clients[slot - 1];
    if (target) {
      setSelectedClientId(target.ClientID);
      setActiveGroupNum(slot);
    }
  }, [clients, controlGroups]);

  useBridgeKeybindings({
    keymap,
    onSwitchDepartment: handleSwitchDepartment,
    onSwitchKanbanMode: () => setCurrentScreen('dashboard'),
    onBindClientSlot: (slot) => {
      if (selectedClientId) {
        setControlGroups((prev) => ({ ...prev, [slot]: [selectedClientId] }));
        setActiveGroupNum(slot);
      }
    },
    onRecallClientSlot: handleRecallClientSlot,
    onTriggerMacro: (key) => setActiveModal(key as CommandKey),
    onToggleSettings: () => setIsKeymapModalOpen((prev) => !prev),
  });

  // Calculate header telemetry
  const headerTelemetry: HudTelemetry = {
    pipelineMrr: clients.reduce((sum, c) => sum + (c.ContractValue || 0), 0),
    activeSprints: clients.filter((c) => c.AccountPhase === '03: Active Sprints').length,
    missingDeposits: clients.filter((c) => c.AccountPhase === '02: Session Zero' && !c.DepositPaid).length,
    activeAlertsCount: alerts.filter((a) => !a.dismissed).length,
    lastSynced: telemetry?.lastSynced || 'LIVE',
  };

  if (!accessToken && !isDemoMode) {
    return (
      <main className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-[#020500] px-6 text-[#DDFBD0]">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#FE5F00] bg-[#5F0F40]/50 font-serif-display text-xl font-bold text-[#FE5F00] shadow-[0_0_24px_rgba(254,95,0,0.2)]">
          SZS
        </div>
        <div className="text-center">
          <h1 className="font-display text-xl font-bold tracking-wide">Session Zero Solutions</h1>
          <p className="mt-2 font-mono text-xs text-[#DDFBD0]/70">Sign in to securely connect to Master Control or explore the demo fleet.</p>
        </div>
        <GoogleSignIn
          deploymentConfigured={Boolean(import.meta.env.VITE_APPS_SCRIPT_DEPLOYMENT_ID?.trim())}
          error={oauthError}
          onError={setOAuthError}
          onToken={handleGoogleToken}
          onExploreDemo={() => setIsDemoMode(true)}
        />
      </main>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#020500] text-[#DDFBD0] overflow-hidden relative select-none">
      {/* Reactive Airship Bridge Canvas Ambient Glow — fixed overlay, outside the grid */}
      <ReactiveBridgeCanvas activeDepartment={activeDepartment} alertsCount={headerTelemetry.activeAlertsCount} />

      {/* Root grid: 52px permanent rail | main workspace */}
      <div className="relative z-10 w-full h-full grid grid-cols-[52px_1fr] overflow-hidden">

      {/* Permanent 52px Left Rail + Floating 320px Auto-Closing Drawer */}
      <MultiAgentDispatch
        activeDepartment={activeDepartment}
        onSelectDepartment={(dept) => {
          setActiveDepartment(dept);
          if (dept === 'Oracle') setCurrentScreen('osint');
          if (dept === 'Dolores') setCurrentScreen('symphony');
          if (dept === 'Vala') setCurrentScreen('treasure');
          if (dept === 'Daisy') setCurrentScreen('archive');
        }}
        alerts={alerts}
        clients={clients}
        onCommandSubmit={(cmd) => {
          const newAlert: AlfredAlert = {
            id: `CMD-${Date.now()}`,
            timestamp: new Date().toISOString(),
            severity: 'INFO',
            subRoutine: 'Alfred',
            clientId: activeClient?.ClientID || '',
            companyName: activeClient?.Company_Name || 'Bridge Command',
            message: `Command executed: "${cmd}"`,
            dismissed: false,
          };
          setAlerts((prev) => [newAlert, ...prev]);
        }}
      />

      {/* Main Horizon Workspace */}
      <main className="h-full flex flex-col relative overflow-hidden">
        {/* Top SkyHeader */}
        <SkyHeader
          currentScreen={currentScreen}
          telemetry={headerTelemetry}
          isBackendConnected={Boolean(accessToken) || isDemoMode}
          onSelectScreen={setCurrentScreen}
          onOpenDepartments={() => setIsDepartmentConsoleOpen((prev) => !prev)}
          isDepartmentConsoleOpen={isDepartmentConsoleOpen}
          onSignOut={handleSignOut}
          onOpenKeybindings={() => setIsKeymapModalOpen(true)}
          currentSkin={currentSkin}
          onToggleSkin={handleToggleSkin}
          onSpawnCockpit={() => setCurrentScreen('cockpit')}
          zoomScale={canvasZoom}
          onSetZoom={setCanvasZoom}
          onResetZoom={() => setCanvasZoom(1.0)}
        />

        {/* Viewport 1: Tactical Horizon (Dashboard) */}
        {currentScreen === 'dashboard' && (
          <div className="relative flex-1 w-full overflow-hidden">
            {/* Tactical Canvas: Full-bleed infinite Pan/Zoom & Hierarchical Semantic Zoom */}
            <div className="absolute inset-0 z-0">
              <TacticalCanvas
                clients={clients}
                selectedClientId={selectedClientId}
                onSelectClient={setSelectedClientId}
                onUpdateClient={handleUpdateClient}
                onForceAdvance={handleForceAdvance}
                scale={canvasZoom}
                setScale={setCanvasZoom}
                onWorkbenchChange={setWorkbenchClient}
                onOpenContextMenu={(x, y, item) => {
                  if ('AccountPhase' in item) {
                    setContextMenu({ x, y, client: item });
                  }
                }}
              />
            </div>

            {/* Modular Console Chassis (Bottom HUD) — Absolute overlay, not a flex sibling */}
            <div className="absolute bottom-2 left-0 right-0 z-30 pointer-events-none">
              <BottomConsoleChassis
                selectedClient={activeClient}
                onUpdateClient={handleUpdateClient}
                onTriggerCommand={(key) => setActiveModal(key)}
                controlGroups={controlGroups}
                activeGroupNum={activeGroupNum}
                onRecallControlGroup={(grp) => handleRecallClientSlot(grp)}
                context={workbenchClient ? 'CLIENT_WORKBENCH' : 'GLOBAL'}
              />
            </div>
          </div>
        )}

        {/* Viewport 2: Oracle OSINT War Room */}
        {currentScreen === 'osint' && (
          <OsintWarRoomView
            units={clients as any}
            activeUnit={activeClient as any}
            onSelectUnit={(id) => setSelectedClientId(id)}
            onNavigateToDashboard={() => setCurrentScreen('dashboard')}
          />
        )}

        {/* Viewport 3: Dolores Symphony Matrix */}
        {currentScreen === 'symphony' && (
          <SymphonyMatrixView
            units={clients as any}
            activeUnit={activeClient as any}
            onSelectUnit={(id) => setSelectedClientId(id)}
            onNavigateToDashboard={() => setCurrentScreen('dashboard')}
          />
        )}

        {/* Viewport 4: Vala Treasure Ledger */}
        {currentScreen === 'treasure' && (
          <TreasureLedgerView
            units={clients as any}
            activeUnit={activeClient as any}
            onSelectUnit={(id) => setSelectedClientId(id)}
            onNavigateToDashboard={() => setCurrentScreen('dashboard')}
          />
        )}

        {/* Viewport 5: Full-Screen Mail Command Center (MCC) */}
        {currentScreen === 'archive' && (
          <MailCommandCenter />
        )}

        {/* Display 2: Avionics Cockpit View (762×1366 Portrait) */}
        {currentScreen === 'cockpit' && (
          <div className="flex-1 flex items-center justify-center p-4 bg-[#020500] overflow-y-auto">
            <AvionicsCockpitView
              onClose={() => setCurrentScreen('dashboard')}
              activeSprintCount={headerTelemetry.activeSprints}
              totalMrr={headerTelemetry.pipelineMrr}
              activeClientName={activeClient?.Company_Name}
            />
          </div>
        )}

        {/* Secondary Screens */}
        {currentScreen === 'pipeline' && (
          <PipelineOverview
            units={clients as any}
            onSelectUnit={(id) => setSelectedClientId(id)}
            onNavigateToDashboard={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'clients' && (
          <ClientDirectoryView
            units={clients as any}
            onSelectUnit={(id) => setSelectedClientId(id)}
            onUpdateUnit={() => {}}
            onNavigateToDashboard={() => setCurrentScreen('dashboard')}
            onOpenIntake={() => setActiveModal('A')}
          />
        )}

        {currentScreen === 'actions' && (
          <MacroMatrixView
            onTriggerCommand={(key) => setActiveModal(key)}
            onNavigateToDashboard={() => setCurrentScreen('dashboard')}
          />
        )}
      </main>

      {/* Settings Modal */}
      <KeybindingSettingsModal
        isOpen={isKeymapModalOpen}
        onClose={() => setIsKeymapModalOpen(false)}
        currentKeymap={keymap}
        onUpdateKeymap={setKeymap}
      />

      {/* Context Menu with [ Sprint Stage View ] and [ Admin: Force Advance ] */}
      {contextMenu && (
        <CardContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          client={contextMenu.client as any}
          onClose={() => setContextMenu(null)}
          onAdvanceStage={() => handleForceAdvance(contextMenu.client)}
          onDraftInvoice={() => alert(`Drafting 1/3rd milestone invoice for ${contextMenu.client.Company_Name}`)}
          onFlagBlocker={() => alert(`Blocker logged for ${contextMenu.client.Company_Name}`)}
          onSunsetClient={() => {
            handleUpdateClient({ ...contextMenu.client, AccountPhase: '06: Archived/Sunset' });
            setContextMenu(null);
          }}
          onDeleteDraftCard={() => setContextMenu(null)}
        />
      )}

      {/* Command Modals for Actions Q..C */}
      <CommandModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        activeUnit={activeClient as any}
        units={clients as any}
        onAddUnit={() => {}}
      />
      </div>{/* end grid wrapper */}
    </div>
  );
}
