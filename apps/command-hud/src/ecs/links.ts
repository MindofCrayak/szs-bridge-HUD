import { Department } from './catalog';

export type LinkKind = 'context' | 'dependency' | 'trigger';
export type FlowMode = 'push' | 'pull' | 'sync';
export type Pin = 'top' | 'bottom' | 'left' | 'right';

export interface Link {
  id: string;
  clientId: string;
  fromNodeId: string;
  fromPin: Pin;
  toNodeId: string;
  toPin: Pin;
  kind: LinkKind;
  mode: FlowMode;
  label?: string;
  enabled: boolean;
  origin: 'default' | 'user';
  defaultKey?: string;
  createdAt: number;
}

export interface LinkState {
  version: 1;
  clientId: string;
  links: Link[];
  suppressedDefaults: string[];
}

export interface LinkExport extends LinkState {
  exportedAt: number;
}

export interface WireNodeOption {
  id: string;
  label: string;
  type: 'agent' | 'component' | 'core';
}

export type WireEditableFields = Pick<Link, 'kind' | 'mode' | 'label' | 'enabled'>;

export interface WireCreateInput {
  fromNodeId: string;
  fromPin: Pin;
  toNodeId: string;
  toPin: Pin;
  kind: LinkKind;
  mode: FlowMode;
  label: string;
}

export interface WirePanelSnapshot {
  clientId: string;
  clientName: string;
  nodes: WireNodeOption[];
  links: Link[];
  selectedWireId: string | null;
  contextMenuOpen: boolean;
}

export interface WirePanelActions {
  create: (input: WireCreateInput) => boolean;
  select: (linkId: string | null) => void;
  update: (linkId: string, updates: Partial<WireEditableFields>) => void;
  reverse: (linkId: string) => void;
  remove: (linkId: string) => void;
}

const STORAGE_PREFIX = 'szs.links.v1:';
const PINS: Pin[] = ['top', 'bottom', 'left', 'right'];
const LINK_KINDS: LinkKind[] = ['context', 'dependency', 'trigger'];
const FLOW_MODES: FlowMode[] = ['push', 'pull', 'sync'];

const DEFAULT_LINKS: Array<{
  key: string;
  from: string;
  to: string;
  department: Department;
  mode: FlowMode;
  label: string;
}> = [
  { key: 'pamela-sun', from: 'node-pamela', to: 'core-node', department: 'pamela', mode: 'push', label: 'Legal and vault status' },
  { key: 'oracle-sun', from: 'node-oracle', to: 'core-node', department: 'oracle', mode: 'push', label: 'Intel summary' },
  { key: 'dolores-sun', from: 'node-dolores', to: 'core-node', department: 'dolores', mode: 'sync', label: 'Tasks and Gantt' },
  { key: 'vala-sun', from: 'node-vala', to: 'core-node', department: 'vala', mode: 'sync', label: 'Ledger' },
  { key: 'sun-daisy', from: 'core-node', to: 'node-daisy', department: 'core', mode: 'push', label: 'Broadcast feed' },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function isLink(value: unknown, clientId: string): value is Link {
  if (!isRecord(value)) return false;
  return value.clientId === clientId
    && typeof value.id === 'string'
    && typeof value.fromNodeId === 'string'
    && PINS.includes(value.fromPin as Pin)
    && typeof value.toNodeId === 'string'
    && PINS.includes(value.toPin as Pin)
    && LINK_KINDS.includes(value.kind as LinkKind)
    && FLOW_MODES.includes(value.mode as FlowMode)
    && typeof value.enabled === 'boolean'
    && (value.origin === 'default' || value.origin === 'user')
    && (value.origin !== 'default' || typeof value.defaultKey === 'string')
    && typeof value.createdAt === 'number'
    && (value.defaultKey === undefined || typeof value.defaultKey === 'string')
    && (value.label === undefined || typeof value.label === 'string');
}

function seedDefaultLinks(clientId: string, suppressedDefaults: string[]): Link[] {
  const suppressed = new Set(suppressedDefaults);
  return DEFAULT_LINKS.filter((link) => !suppressed.has(link.key)).map((link) => ({
    id: `default:${clientId}:${link.key}`,
    clientId,
    fromNodeId: link.from,
    fromPin: 'right',
    toNodeId: link.to,
    toPin: 'left',
    kind: 'context',
    mode: link.mode,
    label: link.label,
    enabled: true,
    origin: 'default',
    defaultKey: link.key,
    createdAt: 0,
  }));
}

export function createLinkState(clientId: string): LinkState {
  return {
    version: 1,
    clientId,
    links: seedDefaultLinks(clientId, []),
    suppressedDefaults: [],
  };
}

export function loadLinkState(clientId: string): LinkState {
  const key = `${STORAGE_PREFIX}${clientId}`;
  const raw = localStorage.getItem(key);
  if (raw === null) return createLinkState(clientId);

  return parseLinkState(raw, clientId);
}

export function parseLinkState(raw: string, clientId: string): LinkState {
  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch {
    throw new Error('Wire data is invalid JSON.');
  }
  if (
    !isRecord(value)
    || value.version !== 1
    || value.clientId !== clientId
    || !Array.isArray(value.links)
    || !value.links.every((link) => isLink(link, clientId))
    || !Array.isArray(value.suppressedDefaults)
    || !value.suppressedDefaults.every((entry) => typeof entry === 'string')
  ) {
    throw new Error('Wire data does not match the current format.');
  }
  const ids = new Set<string>();
  const connections = new Set<string>();
  for (const link of value.links) {
    if (ids.has(link.id)) throw new Error('Wire data contains duplicate link IDs.');
    ids.add(link.id);
    const connection = `${link.fromNodeId}\u0000${link.toNodeId}`;
    if (connections.has(connection)) throw new Error('Wire data contains duplicate connections.');
    connections.add(connection);
  }
  return {
    version: 1,
    clientId,
    links: value.links,
    suppressedDefaults: value.suppressedDefaults,
  };
}

export function exportLinkState(state: LinkState): LinkExport {
  return { ...state, exportedAt: Date.now() };
}

export function parseLinkExport(raw: string, clientId: string, validNodeIds: ReadonlySet<string>): LinkState {
  let envelope: unknown;
  try {
    envelope = JSON.parse(raw) as unknown;
  } catch {
    throw new Error('Wire export is invalid JSON.');
  }
  if (!isRecord(envelope) || typeof envelope.exportedAt !== 'number' || !Number.isFinite(envelope.exportedAt)) {
    throw new Error('Wire export is missing a valid export timestamp.');
  }
  const parsed = parseLinkState(raw, clientId);
  if (parsed.links.some((link) => !validNodeIds.has(link.fromNodeId) || !validNodeIds.has(link.toNodeId))) {
    throw new Error('Wire export references a node that is not available in this workbench.');
  }
  return {
    version: parsed.version,
    clientId: parsed.clientId,
    links: parsed.links,
    suppressedDefaults: parsed.suppressedDefaults,
  };
}

export function saveLinkState(state: LinkState): void {
  localStorage.setItem(`${STORAGE_PREFIX}${state.clientId}`, JSON.stringify(state));
}

export function createUserLink(input: Omit<Link, 'id' | 'createdAt' | 'origin'>): Link {
  return {
    ...input,
    id: `wire:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    origin: 'user',
    createdAt: Date.now(),
  };
}

export function allowedKinds(fromType: string, toType: string): LinkKind[] {
  const allowed: Record<string, LinkKind[]> = {
    'agent>agent': ['context', 'dependency', 'trigger'],
    'agent>core': ['context', 'trigger'],
    'core>agent': ['context', 'trigger'],
    'component>agent': ['context', 'trigger'],
    'component>core': ['context'],
    'agent>component': ['context'],
    'core>component': ['context'],
  };
  return allowed[`${fromType}>${toType}`] ?? [];
}
