import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_EVENT_DEPTH, publishHudEvent } from './events';
import type { Link } from './links';
import type { HudRule } from './rules';

const link: Link = {
  id: 'phase2-test-link',
  clientId: 'phase2-test-client',
  fromNodeId: 'node-pamela',
  fromPin: 'right',
  toNodeId: 'node-vala',
  toPin: 'left',
  kind: 'dependency',
  mode: 'push',
  label: 'test',
  enabled: true,
  origin: 'user',
  createdAt: 1,
};

test('events enforce depth and same-tick deduplication, then reset', async () => {
  const unblockRule: HudRule = {
    id: 'test-unblock',
    status: 'approved',
    on: 'msa.signed',
    from: 'pamela',
    kind: 'dependency',
    to: 'vala',
    effect: 'unblock',
    note: 'Test rule.',
  };
  const event = {
    id: 'phase2-test-event',
    type: 'msa.signed' as const,
    sourceNodeId: 'node-pamela',
    clientId: link.clientId,
  };
  const originalInfo = console.info;
  const originalWarn = console.warn;
  console.info = () => {};
  console.warn = () => {};

  try {
    assert.equal(
      publishHudEvent(event, [link], { rules: [unblockRule], depth: MAX_EVENT_DEPTH + 1 }).unblockedLinkIds.length,
      0,
    );
    assert.deepEqual(publishHudEvent(event, [link], { rules: [unblockRule] }).unblockedLinkIds, [link.id]);
    assert.deepEqual(publishHudEvent(event, [link], { rules: [unblockRule] }).unblockedLinkIds, []);
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    assert.deepEqual(publishHudEvent(event, [link], { rules: [unblockRule] }).unblockedLinkIds, [link.id]);
  } finally {
    console.info = originalInfo;
    console.warn = originalWarn;
  }
});

test('production suggestions stay inert and approved money rules create gated proposals', async () => {
  const originalInfo = console.info;
  console.info = () => {};
  try {
    const suggestedRule: HudRule = {
      id: 'test-suggested',
      status: 'suggested',
      on: 'milestone.done',
      from: 'dolores',
      kind: 'trigger',
      to: 'vala',
      effect: 'propose',
      proposal: 'draft_invoice',
      moneyGate: true,
      note: 'Test proposal.',
    };
    const approvedRule = { ...suggestedRule, id: 'test-approved', status: 'approved' as const };
    const event = {
      id: 'phase2-money-event',
      type: 'milestone.done' as const,
      sourceNodeId: 'node-dolores',
      clientId: link.clientId,
    };
    const triggerLink = {
      ...link,
      id: 'phase2-money-link',
      fromNodeId: 'node-dolores',
      kind: 'trigger' as const,
    };

    assert.equal(publishHudEvent(event, [triggerLink], { rules: [suggestedRule] }).proposals.length, 0);
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    const proposals = publishHudEvent(event, [triggerLink], { rules: [approvedRule] }).proposals;
    assert.equal(proposals.length, 1);
    assert.equal(proposals[0].requiresMoneyGate, true);
  } finally {
    console.info = originalInfo;
  }
});
