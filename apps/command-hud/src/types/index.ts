export interface ClientUnit {
  id: string;
  name: string;
  archetype: string;
  serviceArea: string;
  avatar: string;
  contractValue: number;
  depositPaid: boolean;
  currentMilestone: string;
  totalMilestones: number;
  completedMilestones: number;
  posX: number;
  posY: number;
  pipelineStage: string;
  activePebble?: string;
  roadblock?: string;
  notes?: string;
  contactEmail?: string;
  companyName?: string;
  primaryContact?: string;
  leadSource?: string;
  taskListId?: string;
  googleGroupEmail?: string;
  chatSpaceUrl?: string;
  notesDocUrl?: string;
  caseFileJsonUrl?: string;
  osintGenerated?: boolean;
  driveFolderUrl?: string;
  isDraft?: boolean;
  RootFolderID?: string | null;
  MSA_DocID?: string | null;
  ProjectFolderID?: string | null;
  SOW_DocID?: string | null;
  MeetingNotes_DriveFolderID?: string | null;
}

export type ScreenView = 'dashboard' | 'pipeline' | 'osint' | 'symphony' | 'treasure' | 'archive' | 'clients' | 'actions';

export type CommandKey = 'Q' | 'W' | 'E' | 'A' | 'S' | 'D' | 'Z' | 'X' | 'C';

export interface CommandAbility {
  key: CommandKey;
  label: string;
  action: string;
  icon: string;
  description: string;
  disabled?: boolean;
}

export interface TerminalLog {
  id: string;
  time: string;
  text: string;
  type: 'normal' | 'action' | 'server' | 'alert';
}

export interface HudTelemetry {
  pipelineMrr: number;
  activeSprints: number;
  missingDeposits: number;
  activeAlertsCount: number;
  lastSynced: string;
}

export interface AlfredAlert {
  id: string;
  timestamp: string;
  severity: string;
  subRoutine: string;
  clientId: string;
  companyName: string;
  message: string;
  dismissed: boolean;
}

export type ActiveModal = CommandKey | 'MENU' | null;
