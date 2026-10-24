export interface PipelineColumn {
  id: string;
  title: string;
  badge: string;
  stages: string[];
  defaultStage: string;
}

export const PIPELINE_COLUMNS: PipelineColumn[] = [
  {
    id: 'intake',
    title: 'INTAKE',
    badge: 'LEADS',
    stages: ['00: Discovery', '01: Pitch Staged'],
    defaultStage: '01: Pitch Staged',
  },
  {
    id: 'session-zero',
    title: 'SESSION ZERO',
    badge: 'DISCOVERY',
    stages: ['02: Contract & Inception', '03: Deep Intelligence'],
    defaultStage: '02: Contract & Inception',
  },
  {
    id: 'active-sprints',
    title: 'ACTIVE SPRINTS',
    badge: 'DELIVERY',
    stages: ['04: Session Zero Kickoff', '05: Builds', '06: Mid-Flight Review', '07: Final Staging'],
    defaultStage: '05: Builds',
  },
  {
    id: 'liftoff',
    title: 'LIFTOFF',
    badge: 'COMPLETE',
    stages: ['08: Liftoff', '09: Sunset / Retainer'],
    defaultStage: '08: Liftoff',
  },
];

export const PIPELINE_STAGE_SEQUENCE = PIPELINE_COLUMNS.flatMap((column) => column.stages);

const LEGACY_STAGE_MAP: Record<string, string> = {
  '00: discovery': '00: Discovery',
  '01: intake': '00: Discovery',
  '01: vibecheck': '01: Pitch Staged',
  '01: pitch staged': '01: Pitch Staged',
  '01: pitch staged / vibecheck': '01: Pitch Staged',
  '02: session zero': '02: Contract & Inception',
  '02: contract & inception': '02: Contract & Inception',
  '03: strategy & blueprint': '03: Deep Intelligence',
  '03: deep intelligence': '03: Deep Intelligence',
  '04: kickoff': '04: Session Zero Kickoff',
  '04: session zero kickoff': '04: Session Zero Kickoff',
  '03: active sprints': '05: Builds',
  '05: builds': '05: Builds',
  '05: architecture & builds': '05: Builds',
  '04: build sprint 1': '05: Builds',
  '05: build sprint 2': '05: Builds',
  '06: mid-flight review': '06: Mid-Flight Review',
  '06: mid-flight': '06: Mid-Flight Review',
  '07: final staging & qa': '07: Final Staging',
  '07: final staging': '07: Final Staging',
  '07: final qa': '07: Final Staging',
  '08: liftoff & handover': '08: Liftoff',
  '08: handover': '08: Liftoff',
  '04: liftoff': '08: Liftoff',
  '08: liftoff': '08: Liftoff',
  '09: sunset': '09: Sunset / Retainer',
  '09: sunset / retainer': '09: Sunset / Retainer',
};

export const normalizePipelineStage = (stage: string): string => {
  const normalized = stage.trim().replace(/&amp;/gi, '&');
  return LEGACY_STAGE_MAP[normalized.toLowerCase()] || normalized;
};

export const getPipelineColumnIndex = (stage: string): number => {
  const canonicalStage = normalizePipelineStage(stage);
  const stageNumber = Number.parseInt(canonicalStage.split(':', 1)[0], 10);
  if (!Number.isFinite(stageNumber)) return 0;
  if (stageNumber <= 1) return 0;
  if (stageNumber <= 3) return 1;
  if (stageNumber <= 7) return 2;
  return 3;
};

export const getPipelineColumnForStage = (stage: string): PipelineColumn =>
  PIPELINE_COLUMNS[getPipelineColumnIndex(stage)];

export const getPipelineStageForColumn = (columnIndex: number): string =>
  PIPELINE_COLUMNS[Math.min(PIPELINE_COLUMNS.length - 1, Math.max(0, columnIndex))].defaultStage;

export const getNextPipelineStage = (stage: string): string => {
  const currentIndex = PIPELINE_STAGE_SEQUENCE.indexOf(normalizePipelineStage(stage));
  if (currentIndex < 0) return PIPELINE_STAGE_SEQUENCE[0];
  return PIPELINE_STAGE_SEQUENCE[Math.min(currentIndex + 1, PIPELINE_STAGE_SEQUENCE.length - 1)];
};
