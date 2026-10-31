import type { Link } from './links';
import { createPendingProposal } from './proposals';
import type { PendingProposal, ProposalType } from './proposals';
import { RULES } from './rules';
import type { HudRule } from './rules';
import type { Department } from './catalog';

export type HudEventType =
  | 'msa.signed'
  | 'sweep.complete'
  | 'component.installed'
  | 'milestone.done'
  | 'invoice.paid'
  | 'task.overdue'
  | 'police.corrected'
  | 'police.schema';

export interface HudEvent {
  id?: string;
  type: HudEventType;
  sourceNodeId: string;
  clientId: string;
  projectId?: string;
  payload?: Record<string, unknown>;
}

export interface HudEventTrace {
  source: string;
  target: string | null;
  kind: Link['kind'] | null;
  type: HudEventType;
  time: number;
}

export interface PublishEventResult {
  proposals: PendingProposal[];
  traces: HudEventTrace[];
  activeLinkIds: string[];
  unblockedLinkIds: string[];
}

interface PublishEventOptions {
  rules?: readonly HudRule[];
  getDepartment?: (nodeId: string) => Department | 'component' | null;
  depth?: number;
}

export const MAX_EVENT_DEPTH = 3;
let firedThisTick = new Set<string>();
let resetScheduled = false;

const DEPARTMENTS: Department[] = ['pamela', 'oracle', 'dolores', 'vala', 'daisy', 'core'];

function getDefaultDepartment(nodeId: string): Department | 'component' | null {
  if (nodeId === 'core-node') return 'core';
  const suffix = nodeId.startsWith('node-') ? nodeId.slice(5) : nodeId;
  if (DEPARTMENTS.includes(suffix as Department)) return suffix as Department;
  return nodeId.startsWith('node-') ? 'component' : null;
}

function scheduleTickReset(): void {
  if (resetScheduled) return;
  resetScheduled = true;
  queueMicrotask(() => {
    firedThisTick = new Set();
    resetScheduled = false;
  });
}

function proposalTitle(type: ProposalType): string {
  return type.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function matchesRule(
  rule: HudRule,
  event: HudEvent,
  link: Link,
  getDepartment: (nodeId: string) => Department | 'component' | null,
): boolean {
  const sourceDepartment = getDepartment(link.fromNodeId);
  const targetDepartment = getDepartment(link.toNodeId);
  return rule.status === 'approved'
    && rule.on === event.type
    && rule.from === sourceDepartment
    && rule.kind === link.kind
    && (rule.to === '*' || rule.to === targetDepartment);
}

export function publishHudEvent(
  event: HudEvent,
  links: readonly Link[],
  options: PublishEventOptions = {},
): PublishEventResult {
  const result: PublishEventResult = {
    proposals: [],
    traces: [],
    activeLinkIds: [],
    unblockedLinkIds: [],
  };

  if (options.depth && options.depth > MAX_EVENT_DEPTH) {
    console.warn('[HUD events] Maximum event depth reached.', event.type);
    return result;
  }

  const eventId = event.id || `${event.clientId}:${event.type}:${event.sourceNodeId}`;
  const getDepartment = options.getDepartment || getDefaultDepartment;
  const rules = options.rules || RULES;
  const directLinks = links.filter((link) =>
    link.clientId === event.clientId
    && link.fromNodeId === event.sourceNodeId
    && link.enabled);

  if (event.type === 'police.corrected' || event.type === 'police.schema') {
    const trace: HudEventTrace = {
      source: event.sourceNodeId,
      target: null,
      kind: null,
      type: event.type,
      time: Date.now(),
    };
    result.traces.push(trace);
    console.info('[HUD event]', trace);
    return result;
  }

  scheduleTickReset();
  for (const link of directLinks) {
    const trace: HudEventTrace = {
      source: link.fromNodeId,
      target: link.toNodeId,
      kind: link.kind,
      type: event.type,
      time: Date.now(),
    };
    result.traces.push(trace);
    console.info('[HUD event]', trace);

    const firedKey = `${link.id}:${event.type}`;
    if (firedThisTick.has(firedKey)) continue;
    firedThisTick.add(firedKey);

    for (const rule of rules) {
      if (!matchesRule(rule, event, link, getDepartment)) continue;
      result.activeLinkIds.push(link.id);
      if (rule.effect === 'unblock') {
        result.unblockedLinkIds.push(link.id);
        continue;
      }
      if (rule.effect !== 'propose' || !rule.proposal) continue;

      const proposal = createPendingProposal({
        id: `${eventId}:${rule.id}:${link.id}`,
        proposer: 'Event engine',
        eventId,
        type: rule.proposal,
        title: proposalTitle(rule.proposal),
        detail: rule.note,
        clientId: event.clientId,
        requiresMoneyGate: Boolean(rule.moneyGate),
        clientFacing: Boolean(rule.clientFacing),
      });
      result.proposals.push(proposal);
    }
  }

  return result;
}
