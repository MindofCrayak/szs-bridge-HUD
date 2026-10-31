import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createLinkState,
  exportLinkState,
  loadLinkState,
  parseLinkExport,
  saveLinkState,
} from './links';

test('wire exports round-trip and reject unknown nodes', () => {
  const state = createLinkState('test-client');
  const validNodeIds = new Set([
    'node-pamela',
    'node-oracle',
    'node-dolores',
    'node-vala',
    'node-daisy',
    'core-node',
  ]);
  const encoded = JSON.stringify(exportLinkState(state));

  assert.deepEqual(parseLinkExport(encoded, state.clientId, validNodeIds), state);
  assert.throws(
    () => parseLinkExport(encoded, state.clientId, new Set(['core-node'])),
    /node that is not available/,
  );
});

test('wire state persists deleted default links as suppressed', () => {
  const state = createLinkState('persisted-test-client');
  const key = 'pamela-sun';
  const withoutPamela = {
    ...state,
    links: state.links.filter((link) => link.defaultKey !== key),
    suppressedDefaults: [key],
  };
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>();

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (storageKey: string) => values.get(storageKey) ?? null,
      setItem: (storageKey: string, value: string) => values.set(storageKey, value),
    },
  });

  try {
    saveLinkState(withoutPamela);
    assert.deepEqual(loadLinkState(withoutPamela.clientId), withoutPamela);
    assert.deepEqual(loadLinkState('unpersisted-test-client'), createLinkState('unpersisted-test-client'));
  } finally {
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
