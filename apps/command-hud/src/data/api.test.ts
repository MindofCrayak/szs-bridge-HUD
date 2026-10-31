import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MASTER_CONTROL_OAUTH_SCOPES,
  normalizeClientData,
  syncServiceToMasterControl,
} from './api';

test('requests Google Tasks access for approved service attachments', () => {
  assert.ok(MASTER_CONTROL_OAUTH_SCOPES.includes('https://www.googleapis.com/auth/tasks'));
});

test('normalizes comma-separated service IDs from Master Control', () => {
  const client = normalizeClientData({
    ClientID: 'CLIENT-01',
    ContractValue: 12000,
    ActiveComponents: 'comp_mcc_engine,comp_other',
  });

  assert.deepEqual(client.activeComponents, ['comp_mcc_engine', 'comp_other']);
});

test('normalizes JSON service arrays from Master Control', () => {
  const client = normalizeClientData({
    ClientID: 'CLIENT-01',
    ActiveComponents: '["comp_mcc_engine"]',
  });

  assert.deepEqual(client.activeComponents, ['comp_mcc_engine']);
});

test('marks missing-auth service attachments as offline, not persisted', async () => {
  const result = await syncServiceToMasterControl(
    'CLIENT-01',
    'comp_mcc_engine',
    3200,
    ['Create the welcome sequence'],
  );

  assert.deepEqual(result, { status: 'offline' });
});
