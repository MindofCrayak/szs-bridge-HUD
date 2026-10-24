import { useState, useEffect } from 'react';
import { ClientRecord, ProjectRecord, AlfredAlert, HudTelemetry, ClientUnit } from '../types';
import { DEMO_CLIENT_UNITS, DEMO_ALERTS, DEMO_TELEMETRY } from '../data/demoFleet';
import { normalizeAccountPhase, normalizeSprintStage } from '../data/pipeline';

export interface HudStateReturn {
  clients: ClientRecord[];
  alerts: AlfredAlert[];
  telemetry: HudTelemetry;
  selectedClientId: string | null;
  selectedClient: ClientRecord | null;
  setSelectedClientId: (id: string | null) => void;
  updateClient: (updated: ClientRecord) => void;
  forceAdvanceClient: (client: ClientRecord) => void;
  isLoading: boolean;
}

export function useHudState(initialDemoMode = true): HudStateReturn {
  const [clients, setClients] = useState<ClientRecord[]>(() => {
    return DEMO_CLIENT_UNITS.map((u) => ({
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
  });

  const [alerts, setAlerts] = useState<AlfredAlert[]>(DEMO_ALERTS);
  const [telemetry, setTelemetry] = useState<HudTelemetry>(DEMO_TELEMETRY);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(DEMO_CLIENT_UNITS[0]?.id || null);

  const selectedClient = clients.find((c) => c.ClientID === selectedClientId) || clients[0] || null;

  const updateClient = (updated: ClientRecord) => {
    setClients((prev) => prev.map((c) => (c.ClientID === updated.ClientID ? updated : c)));
  };

  const forceAdvanceClient = (client: ClientRecord) => {
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
      updateClient(updated);

      // Append warning to Alfred alerts
      const newAlert: AlfredAlert = {
        id: `ALERT-OVERRIDE-${Date.now()}`,
        timestamp: new Date().toISOString(),
        severity: 'WARNING',
        subRoutine: 'Alfred',
        clientId: client.ClientID,
        companyName: client.Company_Name,
        message: `Admin force advance executed for ${client.Company_Name}. Stage gate bypassed.`,
        dismissed: false,
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  return {
    clients,
    alerts,
    telemetry,
    selectedClientId,
    selectedClient,
    setSelectedClientId,
    updateClient,
    forceAdvanceClient,
    isLoading: false,
  };
}
