import { AccountPhase, SprintStage } from '../types';

export interface AccountPhaseColumnConfig {
  id: string;
  phase: AccountPhase;
  title: string;
  badge: string;
}

export const ACCOUNT_PHASES: AccountPhaseColumnConfig[] = [
  { id: 'phase-01', phase: '01: Intake', title: 'INTAKE', badge: 'LEADS' },
  { id: 'phase-02', phase: '02: Session Zero', title: 'SESSION ZERO', badge: 'DISCOVERY' },
  { id: 'phase-03', phase: '03: Active Sprints', title: 'ACTIVE SPRINTS', badge: 'EXECUTION' },
  { id: 'phase-04', phase: '04: Liftoff', title: 'LIFTOFF', badge: 'HANDOVER' },
  { id: 'phase-05', phase: '05: Complete', title: 'COMPLETE', badge: 'MAINTENANCE' },
  { id: 'phase-06', phase: '06: Archived/Sunset', title: 'SUNSET / RETAINER', badge: 'ARCHIVED' },
];

export interface SprintStageColumnConfig {
  id: string;
  stage: SprintStage;
  title: string;
  badge: string;
  phaseGrouping: AccountPhase;
}

export const SPRINT_STAGES: SprintStageColumnConfig[] = [
  { id: 'stage-00', stage: '00: Discovery', title: '00: DISCOVERY', badge: 'INGEST', phaseGrouping: '01: Intake' },
  { id: 'stage-01', stage: '01: Vibecheck', title: '01: VIBECHECK', badge: 'TRIAGE', phaseGrouping: '01: Intake' },
  { id: 'stage-02', stage: '02: Contract & Inception', title: '02: CONTRACT & INCEPTION', badge: 'GATED', phaseGrouping: '02: Session Zero' },
  { id: 'stage-03', stage: '03: Deep Intelligence', title: '03: DEEP INTELLIGENCE', badge: 'OSINT', phaseGrouping: '02: Session Zero' },
  { id: 'stage-04', stage: '04: Session Zero Kickoff', title: '04: SESSION ZERO KICKOFF', badge: 'KICKOFF', phaseGrouping: '03: Active Sprints' },
  { id: 'stage-05', stage: '05: Architecture & Builds', title: '05: ARCHITECTURE & BUILDS', badge: 'BUILD', phaseGrouping: '03: Active Sprints' },
  { id: 'stage-06', stage: '06: Mid-Flight Review', title: '06: MID-FLIGHT REVIEW', badge: 'REVIEW', phaseGrouping: '03: Active Sprints' },
  { id: 'stage-07', stage: '07: Final Staging & QA', title: '07: FINAL STAGING & QA', badge: 'QA', phaseGrouping: '03: Active Sprints' },
  { id: 'stage-08', stage: '08: Liftoff & Handover', title: '08: LIFTOFF & HANDOVER', badge: 'LAUNCH', phaseGrouping: '04: Liftoff' },
  { id: 'stage-09', stage: '09: Sunset / Retainer', title: '09: SUNSET / RETAINER', badge: 'ARCHIVE', phaseGrouping: '06: Archived/Sunset' },
];

export const normalizeAccountPhase = (val: string): AccountPhase => {
  const clean = val.toLowerCase().trim();
  if (clean.includes('01') || clean.includes('intake')) return '01: Intake';
  if (clean.includes('02') || clean.includes('session zero')) return '02: Session Zero';
  if (clean.includes('03') || clean.includes('active') || clean.includes('sprint') || clean.includes('build')) return '03: Active Sprints';
  if (clean.includes('04') || clean.includes('liftoff')) return '04: Liftoff';
  if (clean.includes('05') || clean.includes('complete')) return '05: Complete';
  if (clean.includes('06') || clean.includes('sunset') || clean.includes('archive') || clean.includes('09')) return '06: Archived/Sunset';
  return '01: Intake';
};

export const normalizeSprintStage = (val: string): SprintStage => {
  const clean = val.toLowerCase().trim();
  if (clean.includes('00') || clean.includes('discovery')) return '00: Discovery';
  if (clean.includes('01') || clean.includes('vibecheck') || clean.includes('pitch')) return '01: Vibecheck';
  if (clean.includes('02') || clean.includes('contract') || clean.includes('inception')) return '02: Contract & Inception';
  if (clean.includes('03') || clean.includes('deep') || clean.includes('intel') || clean.includes('strategy')) return '03: Deep Intelligence';
  if (clean.includes('04') || clean.includes('kickoff')) return '04: Session Zero Kickoff';
  if (clean.includes('05') || clean.includes('architecture') || clean.includes('build')) return '05: Architecture & Builds';
  if (clean.includes('06') || clean.includes('mid-flight') || clean.includes('review')) return '06: Mid-Flight Review';
  if (clean.includes('07') || clean.includes('staging') || clean.includes('qa')) return '07: Final Staging & QA';
  if (clean.includes('08') || clean.includes('liftoff') || clean.includes('handover')) return '08: Liftoff & Handover';
  if (clean.includes('09') || clean.includes('sunset') || clean.includes('retainer')) return '09: Sunset / Retainer';
  return '00: Discovery';
};

// Legacy pipeline compatibility exports
export const PIPELINE_COLUMNS = [
  { id: 'intake', title: 'INTAKE', badge: 'LEADS', stages: ['00: Discovery', '01: Pitch Staged'], defaultStage: '01: Pitch Staged' },
  { id: 'session-zero', title: 'SESSION ZERO', badge: 'DISCOVERY', stages: ['02: Contract & Inception', '03: Deep Intelligence'], defaultStage: '02: Contract & Inception' },
  { id: 'active-sprints', title: 'ACTIVE SPRINTS', badge: 'DELIVERY', stages: ['04: Session Zero Kickoff', '05: Builds', '06: Mid-Flight Review', '07: Final Staging'], defaultStage: '05: Builds' },
  { id: 'liftoff', title: 'LIFTOFF', badge: 'COMPLETE', stages: ['08: Liftoff', '09: Sunset / Retainer'], defaultStage: '08: Liftoff' },
];

export const PIPELINE_STAGE_SEQUENCE = SPRINT_STAGES.map((s) => s.stage);

export const normalizePipelineStage = (stage: string): string => normalizeSprintStage(stage);

export const getPipelineColumnIndex = (stage: string): number => {
  const canonical = normalizeSprintStage(stage);
  const stageNum = parseInt(canonical.split(':')[0], 10);
  if (isNaN(stageNum)) return 0;
  if (stageNum <= 1) return 0;
  if (stageNum <= 3) return 1;
  if (stageNum <= 7) return 2;
  return 3;
};

export const getPipelineStageForColumn = (columnIndex: number): string => {
  const index = Math.max(0, Math.min(PIPELINE_COLUMNS.length - 1, Math.floor(columnIndex)));
  return PIPELINE_COLUMNS[index].defaultStage;
};

export const getNextPipelineStage = (stage: string): string => {
  const current = normalizeSprintStage(stage);
  const idx = PIPELINE_STAGE_SEQUENCE.indexOf(current);
  if (idx < 0 || idx === PIPELINE_STAGE_SEQUENCE.length - 1) return current;
  return PIPELINE_STAGE_SEQUENCE[idx + 1];
};
