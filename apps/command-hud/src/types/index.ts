export type AccountPhase =
  | '01: Intake'
  | '02: Session Zero'
  | '03: Active Sprints'
  | '04: Liftoff'
  | '05: Complete'
  | '06: Archived/Sunset';

export type SprintStage =
  | '00: Discovery'
  | '01: Vibecheck'
  | '02: Contract & Inception'
  | '03: Deep Intelligence'
  | '04: Session Zero Kickoff'
  | '05: Architecture & Builds'
  | '06: Mid-Flight Review'
  | '07: Final Staging & QA'
  | '08: Liftoff & Handover'
  | '09: Sunset / Retainer';

export interface ProjectRecord {
  ProjectID: string;
  ClientID: string;
  SprintStage: SprintStage;
  MilestonesTotal: number;
  MilestonesDone: number;
  AssignedRateTier: 'Normal' | 'Premium' | 'Reduced' | 'Fixed';
  Title?: string;
}

export interface ClientRecord {
  ClientID: string;
  Company_Name: string;
  PrimaryContact: string;
  ContactEmail: string;
  AccountPhase: AccountPhase;
  ContractValue: number;
  DepositPaid: boolean;
  DriveFolderUrl: string;
  NotesDocUrl: string;
  MSA_DocID: string;
  SOW_DocID: string;
  ChatSpaceUrl: string;
  activeProjects: ProjectRecord[];
  activePebble?: string;
  roadblock?: string;
  avatar?: string;
  archetype?: string;
  caseFileJsonUrl?: string;
  osintGenerated?: boolean;
  leadSource?: string;
}

export interface ClientUnit extends ClientRecord {
  id: string;
  name: string;
  companyName: string;
  pipelineStage: string;
  totalMilestones: number;
  completedMilestones: number;
  currentMilestone: string;
  serviceArea: string;
  posX: number;
  posY: number;
  isDraft?: boolean;
  RootFolderID?: string | null;
  ProjectFolderID?: string | null;
  MeetingNotes_DriveFolderID?: string | null;
  taskListId?: string;
  googleGroupEmail?: string;
}

export type ScreenView = 
  | 'dashboard' 
  | 'pipeline' 
  | 'osint' 
  | 'symphony' 
  | 'treasure' 
  | 'archive' 
  | 'cockpit'
  | 'clients' 
  | 'actions';

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
