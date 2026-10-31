import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const context = vm.createContext({
  console,
  Utilities: { getUuid: () => 'test-uuid' },
  Session: { getActiveUser: () => ({ getEmail: () => 'operator@example.com' }) },
});

const sourceFiles = [
  '../src/Master_Control_Auth.gs',
  '../src/Pipeline_Phase_Gate.gs',
  '../src/Central_Router.gs',
];
for (const sourceFile of sourceFiles) {
  vm.runInContext(readFileSync(new URL(sourceFile, import.meta.url), 'utf8'), context);
}

const headers = [
  'ClientID',
  'PipelineStage',
  'MSA_DocID',
  'CompanyName',
];

function createHarness({
  client = ['CLIENT-01', '02: Session Zero', '', 'Example Co'],
  depositPaid = false,
  sowDocId = '',
  projectClientId = 'CLIENT-01',
  financeClientId = 'CLIENT-01',
  authorizedUsers = 'operator@example.com',
  overrideUsers = '',
  masterControlSheetId = '',
  includeAlertSheet = true,
  auditFails = false,
} = {}) {
  context.Tasks = undefined;
  const clientRow = [...client];
  const alertRows = [];
  const calls = [];
  const projectSheet = {
    getDataRange: () => ({ getValues: () => [['ClientID', 'SOW_DocID'], [projectClientId, sowDocId]] }),
  };
  const financesSheet = {
    getDataRange: () => ({ getValues: () => [['ClientID', 'DepositPaid'], [financeClientId, depositPaid]] }),
  };
  const clientsSheet = {
    getDataRange: () => ({ getValues: () => [headers, clientRow] }),
    getRange: (row, column) => ({
      setValue: (value) => {
        calls.push('mutate');
        clientRow[column - 1] = value;
      },
    }),
  };
  const alertsSheet = {
    getLastColumn: () => 8,
    getRange: () => ({ getValues: () => [[
      'Alert_ID', 'Timestamp', 'ClientID', 'Priority', 'Category', 'Message', 'Action_URL', 'Dismissed_Status',
    ]] }),
    appendRow: (row) => {
      calls.push('audit');
      if (auditFails) throw new Error('audit write failed');
      alertRows.push(row);
    },
  };
  const spreadsheet = {
    getSheetByName: (name) => {
      if (name === 'Clients') return clientsSheet;
      if (name === 'Projects') return projectSheet;
      if (name === 'Finances') return financesSheet;
      if (name === 'Alfred_Alerts' && includeAlertSheet) return alertsSheet;
      return null;
    },
    getSheets: () => [clientsSheet, projectSheet, financesSheet, alertsSheet],
  };
  const lockState = { waits: 0, releases: 0 };
  context.SpreadsheetApp = { getActiveSpreadsheet: () => spreadsheet };
  context.PropertiesService = {
    getScriptProperties: () => ({
      getProperty: (name) => ({
        AUTHORIZED_USER_EMAILS: authorizedUsers,
        PIPELINE_OVERRIDE_EMAILS: overrideUsers,
        MASTER_CONTROL_SHEET_ID: masterControlSheetId,
      })[name] || '',
    }),
  };
  context.LockService = {
    getScriptLock: () => ({
      waitLock: (timeout) => {
        assert.equal(timeout, 30000);
        lockState.waits += 1;
      },
      releaseLock: () => { lockState.releases += 1; },
    }),
  };
  context.ContentService = {
    MimeType: { JSON: 'application/json' },
    createTextOutput: (text) => ({
      text,
      setMimeType: () => ({ text }),
    }),
  };
  return { clientRow, alertRows, calls, lockState };
}

function createServiceHarness({
  clientValue = 12000,
  activeComponents = '',
  includeActiveComponents = true,
  projectRows,
  authorizedUsers = 'operator@example.com',
  tasksAvailable = true,
  masterControlSheetId = '',
} = {}) {
  const harness = createHarness({ authorizedUsers, masterControlSheetId });
  const clientHeaders = [
    'ClientID', 'First_Name', 'Last_Name', 'Company_Name', 'ContactEmail',
    'GoogleGroupEmail', 'Archetype', 'AccountPhase', 'ActiveRoadblock',
    'ContractValue', 'DepositPaid', 'CurrentMilestone', 'CompletedMilestones',
    'TotalMilestones', 'DriveFolderUrl', 'ChatSpaceUrl', 'NotesDocUrl',
    'MSA_DocID', 'Tech_Stack', 'MCC_Subscriber_ID', 'Oracle_Baseline_ID',
  ];
  const projectHeaders = [
    'ProjectID', 'ClientID', 'ProjectName', 'SprintStage', 'AssignedRateTier',
    'SOW_DocID', 'Project_Brief_DocID', 'Project_Outline_DocID',
    'COMS_Sheet_URL', 'Google_Tasklist_ID', 'MeetingNotes_DriveFolderID',
    'ChatSpaceURL', 'ChatSpace_Internal_URL', 'Est_Hours', 'Actual_Hours',
    'ParentProjectID', 'AddendumRef',
  ];
  if (includeActiveComponents) projectHeaders.push('ActiveComponents');

  const clientRow = [
    'CLIENT-01', 'Test', 'Operator', 'Test Client', '', '', '',
    '02: Session Zero', '', clientValue, false, '', 0, 5, '', '', '',
    '', '', '', '',
  ];
  const projectRow = [
    'PROJECT-01', 'CLIENT-01', 'Test Project', '03: Active Sprints',
    'Tier 1', 'sow-id', 'brief-id', 'outline-id', '', '', '', '', '',
    100, 0, '', '',
  ];
  if (includeActiveComponents) projectRow.push(activeComponents);

  const rows = {
    clients: [clientRow],
    projects: projectRows || [projectRow],
  };
  const writes = [];
  const makeSheet = (name, headers) => ({
    getDataRange: () => ({ getValues: () => [headers, ...rows[name]] }),
    getRange: (row, column) => ({
      setValue: value => {
        writes.push({ sheet: name, row, column, value });
        rows[name][row - 2][column - 1] = value;
      },
    }),
  });
  const clientsSheet = makeSheet('clients', clientHeaders);
  const projectsSheet = makeSheet('projects', projectHeaders);
  const spreadsheet = {
    getSheetByName: name => ({
      Clients: clientsSheet,
      Projects: projectsSheet,
    })[name] || null,
  };
  const openedSpreadsheetIds = [];
  let activeSpreadsheetLookups = 0;
  context.SpreadsheetApp = {
    getActiveSpreadsheet: () => {
      activeSpreadsheetLookups += 1;
      return spreadsheet;
    },
    openById: id => {
      openedSpreadsheetIds.push(id);
      return spreadsheet;
    },
  };

  const insertedTasks = [];
  let taskListLookups = 0;
  if (tasksAvailable) {
    context.Tasks = {
      Tasklists: {
        list: () => ({
          getItems: () => {
            taskListLookups += 1;
            return [{ getId: () => 'test-task-list' }];
          },
        }),
      },
      Tasks: {
        insert: (task, listId) => insertedTasks.push({ task, listId }),
      },
    };
  }

  return {
    ...harness,
    clientRow,
    projectRow,
    rows,
    writes,
    insertedTasks,
    openedSpreadsheetIds,
    getActiveSpreadsheetLookups: () => activeSpreadsheetLookups,
    getTaskListLookups: () => taskListLookups,
  };
}

test('persists a permitted stage change while holding and releasing the mutation lock', () => {
  const harness = createHarness();
  const result = context.updateKanban('CLIENT-01', '03: Active Sprints', {});
  assert.equal(result.pipelineStage, '03: Active Sprints');
  assert.equal(harness.clientRow[1], '03: Active Sprints');
  assert.equal(harness.lockState.waits, 1);
  assert.equal(harness.lockState.releases, 1);
});

test('routes authenticated POST stage changes without a request-body shared secret', () => {
  const harness = createHarness();
  const response = context.doPost({
    postData: {
      contents: JSON.stringify({
        action: 'updateKanban',
        clientID: 'CLIENT-01',
        newStage: '03: Active Sprints',
      }),
    },
  });
  const result = JSON.parse(response.text);
  assert.equal(result.status, 200);
  assert.equal(harness.clientRow[1], '03: Active Sprints');
  assert.equal(harness.lockState.waits, 1);
  assert.equal(harness.lockState.releases, 1);
});

test('denies stage 04+ without deposit, MSA, and SOW and leaves the client unchanged', () => {
  const harness = createHarness();
  assert.throws(
    () => context.updateKanban('CLIENT-01', '04: Session Zero Kickoff', {}),
    (error) => error.code === 'PHASE_GATE_REQUIREMENTS_MISSING' && error.statusCode === 409,
  );
  assert.equal(harness.clientRow[1], '02: Session Zero');
  assert.equal(harness.lockState.releases, 1);
});

test('records an authorized override before changing the client stage', () => {
  const harness = createHarness({ overrideUsers: 'operator@example.com', client: ['CLIENT-01', '03: Active Sprints', 'msa-id', 'Example Co'] });
  const result = context.updateKanban('CLIENT-01', '04: Session Zero Kickoff', {
    overrideAuth: true,
    overrideReason: 'Finance approved an exception.',
  });
  assert.equal(result.gate, 'AUTHORIZED_OVERRIDE');
  assert.deepEqual(harness.calls, ['audit', 'mutate']);
  assert.equal(harness.clientRow[1], '04: Session Zero Kickoff');
  assert.match(harness.alertRows[0][5], /Actor: operator@example\.com/);
  assert.match(harness.alertRows[0][5], /Finance approved an exception\./);
});

test('fails closed when override auditing is unavailable or fails', () => {
  const missingSheet = createHarness({
    overrideUsers: 'operator@example.com',
    includeAlertSheet: false,
    client: ['CLIENT-01', '03: Active Sprints', 'msa-id', 'Example Co'],
  });
  assert.throws(
    () => context.updateKanban('CLIENT-01', '04: Session Zero Kickoff', {
      overrideAuth: true,
      overrideReason: 'Approved.',
    }),
    /Alfred_Alerts sheet is unavailable/,
  );
  assert.equal(missingSheet.clientRow[1], '03: Active Sprints');

  const failedWrite = createHarness({
    overrideUsers: 'operator@example.com',
    auditFails: true,
    client: ['CLIENT-01', '03: Active Sprints', 'msa-id', 'Example Co'],
  });
  assert.throws(
    () => context.updateKanban('CLIENT-01', '04: Session Zero Kickoff', {
      overrideAuth: true,
      overrideReason: 'Approved.',
    }),
    /audit write failed/,
  );
  assert.equal(failedWrite.clientRow[1], '03: Active Sprints');
});

test('reads deposit and SOW prerequisites from their authoritative sheets', () => {
  const harness = createHarness({
    client: ['CLIENT-01', '03: Active Sprints', 'msa-id', 'Example Co'],
    depositPaid: ' TRUE ',
    sowDocId: 'sow-id',
  });
  const result = context.updateKanban('CLIENT-01', '04: Session Zero Kickoff', {});
  assert.equal(result.gate, 'PREREQUISITES_MET');
  assert.equal(harness.clientRow[1], '04: Session Zero Kickoff');
});

test('does not accept payment or SOW records belonging to another client', () => {
  const harness = createHarness({
    client: ['CLIENT-01', '03: Active Sprints', 'msa-id', 'Example Co'],
    depositPaid: true,
    sowDocId: 'other-client-sow',
    projectClientId: 'OTHER-CLIENT',
    financeClientId: 'OTHER-CLIENT',
  });
  assert.throws(
    () => context.updateKanban('CLIENT-01', '04: Session Zero Kickoff', {}),
    (error) => error.code === 'PHASE_GATE_REQUIREMENTS_MISSING'
      && Array.from(error.details.missing).includes('DepositPaid')
      && Array.from(error.details.missing).includes('SOW_DocID'),
  );
  assert.equal(harness.clientRow[1], '03: Active Sprints');
});

test('rejects unauthenticated users before acquiring the lock', () => {
  const harness = createHarness({ authorizedUsers: 'different@example.com' });
  assert.throws(
    () => context.updateKanban('CLIENT-01', '02: Session Zero', {}),
    (error) => error.code === 'UNAUTHORIZED',
  );
  assert.equal(harness.lockState.waits, 0);
  assert.equal(harness.clientRow[1], '02: Session Zero');
});

test('persists service components and contract value by header while holding the lock', () => {
  const harness = createServiceHarness();
  const result = context.attachClientServiceNode({
    clientId: 'CLIENT-01',
    serviceId: 'comp_mcc_engine',
    priceDelta: 3200,
    tasks: ['Create the welcome sequence', 'Configure follow-up automation'],
  });

  assert.equal(result.success, true);
  assert.equal(result.alreadyAttached, false);
  assert.equal(result.updatedValue, 15200);
  assert.deepEqual(Array.from(result.activeComponents), ['comp_mcc_engine']);
  assert.equal(result.tasksCreated, 2);
  assert.equal(result.tasksFailed, 0);
  assert.equal(harness.clientRow[9], 15200);
  assert.equal(harness.projectRow[4], 'Tier 1');
  assert.equal(harness.projectRow[7], 'outline-id');
  assert.equal(harness.projectRow[17], 'comp_mcc_engine');
  assert.deepEqual(
    harness.insertedTasks.map(({ task, listId }) => [task.title, listId]),
    [
      ['[comp_mcc_engine] Create the welcome sequence', 'test-task-list'],
      ['[comp_mcc_engine] Configure follow-up automation', 'test-task-list'],
    ],
  );
  assert.equal(harness.lockState.waits, 1);
  assert.equal(harness.lockState.releases, 1);
});

test('configured Master Control sheet ID takes precedence over the active spreadsheet', () => {
  const harness = createServiceHarness({ masterControlSheetId: 'disposable-master-control' });
  const result = context.attachClientServiceNode({
    clientId: 'CLIENT-01',
    serviceId: 'comp_mcc_engine',
    priceDelta: 3200,
    tasks: [],
  });

  assert.equal(result.updatedValue, 15200);
  assert.deepEqual(harness.openedSpreadsheetIds, ['disposable-master-control']);
  assert.equal(harness.getActiveSpreadsheetLookups(), 0);
});

test('service attachment through doPost does not acquire a nested lock', () => {
  const harness = createServiceHarness();
  const response = context.doPost({
    postData: {
      contents: JSON.stringify({
        action: 'attachClientServiceNode',
        clientId: 'CLIENT-01',
        serviceId: 'comp_mcc_engine',
        priceDelta: 3200,
        tasks: [],
      }),
    },
  });

  assert.equal(JSON.parse(response.text).status, 200);
  assert.equal(harness.lockState.waits, 1);
  assert.equal(harness.lockState.releases, 1);
});

test('retries do not charge or create tasks for an already attached service', () => {
  const harness = createServiceHarness({
    clientValue: 15200,
    activeComponents: 'comp_mcc_engine',
  });
  const result = context.attachClientServiceNode({
    clientId: 'CLIENT-01',
    serviceId: 'comp_mcc_engine',
    priceDelta: 3200,
    tasks: ['Create the welcome sequence'],
  });

  assert.equal(result.success, true);
  assert.equal(result.alreadyAttached, true);
  assert.equal(result.updatedValue, 15200);
  assert.equal(harness.clientRow[9], 15200);
  assert.equal(harness.writes.length, 0);
  assert.equal(harness.insertedTasks.length, 0);
  assert.equal(harness.getTaskListLookups(), 0);
  assert.equal(harness.lockState.releases, 1);
});

test('service attachment fails closed when the schema is missing ActiveComponents', () => {
  const harness = createServiceHarness({ includeActiveComponents: false });
  assert.throws(
    () => context.attachClientServiceNode({
      clientId: 'CLIENT-01',
      serviceId: 'comp_mcc_engine',
      priceDelta: 3200,
      tasks: [],
    }),
    /Projects\.ActiveComponents are required/,
  );
  assert.equal(harness.clientRow[9], 12000);
  assert.equal(harness.projectRow[4], 'Tier 1');
  assert.equal(harness.projectRow[7], 'outline-id');
  assert.equal(harness.writes.length, 0);
  assert.equal(harness.lockState.releases, 1);
});

test('service attachment rejects ambiguous project rows without writing', () => {
  const projectHeaders = [
    'ProjectID', 'ClientID', 'ProjectName', 'SprintStage', 'AssignedRateTier',
    'SOW_DocID', 'Project_Brief_DocID', 'Project_Outline_DocID',
    'COMS_Sheet_URL', 'Google_Tasklist_ID', 'MeetingNotes_DriveFolderID',
    'ChatSpaceURL', 'ChatSpace_Internal_URL', 'Est_Hours', 'Actual_Hours',
    'ParentProjectID', 'AddendumRef', 'ActiveComponents',
  ];
  const firstProject = [
    'PROJECT-01', 'CLIENT-01', 'Project One', '03: Active Sprints',
    'Tier 1', '', '', 'outline-one', '', '', '', '', '', 100, 0, '', '', '',
  ];
  const secondProject = [
    'PROJECT-02', 'CLIENT-01', 'Project Two', '03: Active Sprints',
    'Tier 2', '', '', 'outline-two', '', '', '', '', '', 100, 0, '', '', '',
  ];
  const harness = createServiceHarness({ projectRows: [firstProject, secondProject] });

  assert.throws(
    () => context.attachClientServiceNode({
      clientId: 'CLIENT-01',
      serviceId: 'comp_mcc_engine',
      priceDelta: 3200,
      tasks: [],
    }),
    error => error.code === 'AMBIGUOUS_PROJECT' && error.statusCode === 409,
  );
  assert.equal(harness.clientRow[9], 12000);
  assert.equal(harness.writes.length, 0);
});

test('service attachment rejects unauthorized direct executions before locking', () => {
  const harness = createServiceHarness({ authorizedUsers: 'different@example.com' });
  assert.throws(
    () => context.attachClientServiceNode({
      clientId: 'CLIENT-01',
      serviceId: 'comp_mcc_engine',
      priceDelta: 3200,
      tasks: [],
    }),
    error => error.code === 'UNAUTHORIZED',
  );
  assert.equal(harness.lockState.waits, 0);
  assert.equal(harness.writes.length, 0);
});

test('redacts sensitive values from alert text exposed to the HUD', () => {
  const message = context.sanitizeAlertText_(
    'token=example-token https://drive.google.com/drive/folders/example-id abcdefghijklmnopqrstuvwxyz123',
  );
  assert.equal(message, 'token=[REDACTED] [REDACTED_URL] [REDACTED_ID]');
});

test('HUD state projects only approved fields and joins project compliance IDs', () => {
  createHarness();
  const clientsHeaders = [
    'ClientID', 'PipelineStage', 'Company_Name', 'MSA_DocID',
    'CaseFileJsonUrl', 'Oracle_Baseline_ID', 'ContractValue', 'DepositPaid',
  ];
  const projectHeaders = [
    'ClientID', 'SOW_DocID', 'MeetingNotes_DriveFolderID',
    'ProjectFolderID', 'CaseFileJsonUrl', 'ActiveComponents',
  ];
  const alertHeaders = [
    'Alert_ID', 'Timestamp', 'ClientID', 'Priority', 'Category',
    'Message', 'Action_URL', 'Dismissed_Status',
  ];
  const table = (headers, row) => ({
    getLastRow: () => 2,
    getLastColumn: () => headers.length,
    getRange: () => ({ getValues: () => [headers, row] }),
  });
  const clientsSheet = table(clientsHeaders, [
    'CLIENT-01', '03: Active Sprints', 'Example Co', 'msa-id',
    'https://internal.example/case.json', 'oracle-baseline-id', 12000, true,
  ]);
  const projectsSheet = table(projectHeaders, [
    'CLIENT-01', 'sow-id', 'notes-id', 'project-folder-id',
    'https://internal.example/project-case.json', 'comp_mcc_engine',
  ]);
  const alertsSheet = table(alertHeaders, [
    'ALT-1', '2026-01-01T00:00:00.000Z', 'CLIENT-01', 'INFO', 'Test',
    'token=example-token https://drive.google.com/private', '', false,
  ]);
  context.SpreadsheetApp = {
    getActiveSpreadsheet: () => ({
      getSheetByName: (name) => ({
        Clients: clientsSheet,
        Projects: projectsSheet,
        Alfred_Alerts: alertsSheet,
      })[name] || null,
      getSheets: () => [clientsSheet, projectsSheet, alertsSheet],
    }),
  };

  const state = context.getHudState();
  assert.equal(state.clients[0].SOW_DocID, 'sow-id');
  assert.equal(state.clients[0].MeetingNotes_DriveFolderID, 'notes-id');
  assert.equal(state.clients[0].ProjectFolderID, 'project-folder-id');
  assert.equal(state.clients[0].ActiveComponents, 'comp_mcc_engine');
  assert.equal('CaseFileJsonUrl' in state.clients[0], false);
  assert.equal('Oracle_Baseline_ID' in state.clients[0], false);
  assert.equal('projects' in state, false);
  assert.equal('finances' in state, false);
  assert.equal(state.alerts[0].Message, 'token=[REDACTED] [REDACTED_URL]');
});
