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
  googleGroupEmail?: string;
  chatSpaceUrl?: string;
  notesDocUrl?: string;
  caseFileJsonUrl?: string;
  driveFolderUrl?: string;
  RootFolderID?: string | null;
  MSA_DocID?: string | null;
  ProjectFolderID?: string | null;
  SOW_DocID?: string | null;
  MeetingNotes_DriveFolderID?: string | null;
}

export type ScreenView = 'dashboard' | 'pipeline' | 'clients' | 'actions';

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

export type ActiveModal = CommandKey | 'MENU' | null;
