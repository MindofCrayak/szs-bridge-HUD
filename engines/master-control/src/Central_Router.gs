/**
 * SZS CENTRAL ROUTER & POLICE ENGINE (Master Control)
 * Author: Drake Austin / Session Zero Solutions
 * Description: The authoritative API and synchronization engine for the SZS ecosystem.
 */

const SYSTEM_CONFIG = {
  get ACTIVE_DRIVE_FOLDER_ID() {
    return PropertiesService.getScriptProperties().getProperty('ACTIVE_DRIVE_FOLDER_ID') || '';
  },
  get ORACLE_DB_ID() {
    return PropertiesService.getScriptProperties().getProperty('ORACLE_DB_ID') || '';
  },
  get MCC_DB_ID() {
    return PropertiesService.getScriptProperties().getProperty('MCC_DB_ID') || '';
  },
  get MASTER_CONTROL_SHEET_ID() {
    return PropertiesService.getScriptProperties().getProperty('MASTER_CONTROL_SHEET_ID') || '1VLvipkP8LUOX2_F4RdIFHrq7e346XRSk1nYSClTVDy0';
  }
};

function getMasterControlSpreadsheet_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  return SpreadsheetApp.openById(SYSTEM_CONFIG.MASTER_CONTROL_SHEET_ID);
}

// ============================================================================
// 1. THE WEBHOOK ROUTER (doPost)
// ============================================================================

function doPost(e) {
  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    const actor = getAuthorizedMasterControlUser_();
    if (!e || !e.postData || typeof e.postData.contents !== 'string') {
      return buildResponse_(400, 'A JSON request body is required.');
    }
    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch {
      throw createRouterError_('The request body is not valid JSON.', 'INVALID_JSON', 400);
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return buildResponse_(400, 'The request body must be a JSON object.');
    }

    lock.waitLock(30000);
    lockAcquired = true;

    let responseData = {};

    switch (payload.action) {
      case 'graduateLead':
        return buildResponse_(501, 'Lead graduation is disabled until its idempotency and provisioning controls are verified.');
      case 'updateKanban':
        responseData = updateKanbanWithActor_(
          payload.clientID || payload.clientId,
          payload.newStage,
          payload,
          actor
        );
        break;
      case 'attachClientServiceNode':
        responseData = attachClientServiceNode(payload);
        break;
      case 'recordPayment':
        return buildResponse_(501, 'Payment recording is not implemented.');

      default:
        return buildResponse_(400, 'Unknown action.');
    }

    return buildResponse_(200, 'Success', responseData);

  } catch (error) {
    console.error('Central Router Error:', error);
    if (!error || (error.code !== 'UNAUTHORIZED' && (!error.statusCode || error.statusCode >= 500))) {
      try {
        logAlfredAlert_('SYSTEM', 'CRITICAL', 'Webhook Router Error', error.message);
      } catch (alertError) {
        console.error('Failed to persist router error alert:', alertError);
      }
    }
    const status = error && error.statusCode ? error.statusCode : 500;
    const message = error && error.statusCode ? error.message : 'Internal Server Error';
    return buildResponse_(status, message, {
      code: error && error.code ? error.code : 'ROUTER_ERROR',
      details: error && error.details ? error.details : undefined
    });
  } finally {
    if (lockAcquired) lock.releaseLock();
  }
}

function buildResponse_(code, message, data = {}) {
  return ContentService.createTextOutput(JSON.stringify({
    status: code,
    message: message,
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// BULLETPROOF: MINT CLIENT ID
// ============================================================================

function mintClientID_(sheet, rawName) {
  const companyName = String(rawName || 'Client').trim();
  
  // Extract first letter of each word (up to 3), or fallback to first 3 letters
  const words = companyName.toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(' ').filter(w => w.length > 0);
  let baseID = words.length > 1 ? words.map(w => w[0]).join('').substring(0, 3) : companyName.substring(0, 3).toUpperCase();
  if (baseID.length < 2) baseID = "CLT";

  // Check for collisions in Clients sheet safely
  const lastRow = sheet ? sheet.getLastRow() : 0;
  let existingIDs = [];
  if (lastRow > 1) {
    existingIDs = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(id => String(id).trim());
  }

  let finalID = baseID;
  let counter = 2;
  while (existingIDs.includes(finalID)) {
    finalID = `${baseID}-${counter.toString().padStart(2, '0')}`;
    counter++;
  }
  return finalID;
}

// ============================================================================
// BULLETPROOF: EXECUTE LEAD GRADUATION
// ============================================================================

function executeLeadGraduation_(leadData) {
  const ss = getMasterControlSpreadsheet_();
  const clientsSheet = findSheetFlexible_(ss, ['Clients']);
  const projectsSheet = findSheetFlexible_(ss, ['Projects']);
  const financesSheet = findSheetFlexible_(ss, ['Finances']);

  if (!clientsSheet || !projectsSheet || !financesSheet) {
    throw new Error('Could not locate Clients, Projects, or Finances tab in Master Control.');
  }

  // Support both Company_Name and Company headers
  const company = leadData.Company_Name || leadData.Company || 'New Client';
  const firstName = leadData.First_Name || '';
  const lastName = leadData.Last_Name || '';
  const email = leadData.Email || '';
  const techStack = leadData.Tech_Stack_Current || leadData.Tech_Stack || '';
  const estValue = Number(leadData.Est_Value || leadData['Est._Value'] || 0);
  const depositAmt = Math.round(estValue / 3);

  // 1. Mint Smart Client ID
  const clientID = mintClientID_(clientsSheet, company);
  const projectID = `${clientID}-01`;
  const invoiceID = `INV-${clientID}-01`;
  const groupEmail = `client-${clientID.toLowerCase()}@sessionzero.solutions`;

  // 2. Provision Complete Drive Architecture & Documents
  let artifacts = null;
  try {
    artifacts = provisionClientDriveArchitecture_(clientID, projectID, invoiceID, {
      Company_Name: company,
      First_Name: firstName,
      Last_Name: lastName,
      Email: email,
      Phone: leadData.Phone || '',
      Est_Value: estValue,
      Tech_Stack_Current: techStack,
      Lead_Source: leadData.Lead_Source || '',
      GBP_Status: leadData.GBP_Status || '',
      Inboxes_Needed: leadData.Inboxes_Needed || ''
    });
  } catch (err) {
    console.error('Drive Provisioning Error:', err);
    logAlfredAlert_(clientID, 'CRITICAL', 'Drive Provisioning Failed', err.message);
  }

  const driveUrl = artifacts ? artifacts.clientFolderUrl : 'PROVISIONING_FAILED';
  const kickoffNotesUrl = artifacts ? artifacts.kickoffDocUrl : '';
  const msaId = artifacts ? artifacts.msaDocId : '';
  const sowId = artifacts ? artifacts.sowDocId : '';
  const notesFolderId = artifacts ? artifacts.meetingNotesFolderId : '';

  // 3. Write to Master Control: Clients
  clientsSheet.appendRow([
    clientID, firstName, lastName, company, email,
    groupEmail, '', '02: Session Zero', '', estValue, false, 'Session Zero Audit', 
    0, 5, driveUrl, '', kickoffNotesUrl, msaId, techStack, '', ''
  ]);

  // 4. Write to Master Control: Projects
  projectsSheet.appendRow([
    projectID, clientID, 'Initial Project Build', '02: Session Zero', 'Normal ($85)',
    sowId, '', '', '', '', notesFolderId, '', '', 0, 0
  ]);

  // 5. Write to Master Control: Finances
  financesSheet.appendRow([
    invoiceID, clientID, projectID, invoiceID, 'Deposit (1/3)', estValue, depositAmt, depositAmt,
    false, (estValue - depositAmt), 'Draft', '', 0, 0, 0, (depositAmt * 0.25), 0, '67%'
  ]);

  // 6. Push to Oracle Baseline
  pushToOracleBaseline_(clientID, {
    Company_Name: company,
    First_Name: firstName,
    Last_Name: lastName,
    Tech_Stack_Current: techStack
  });

  // 7. Push to Mail Command Center (MCC)
  const mccSubId = pushToMailCommandCenter_(clientID, {
    Email: email,
    First_Name: firstName,
    Last_Name: lastName
  });

  // 8. Update MCC_Subscriber_ID in Master Control: Clients
  if (mccSubId) {
    const clientsLastRow = clientsSheet.getLastRow();
    clientsSheet.getRange(clientsLastRow, 20).setValue(mccSubId); // Col T: MCC_Subscriber_ID
  }

  logAlfredAlert_(clientID, 'INFO', 'Graduation', `Lead ${company} graduated. ID: ${clientID}. Provisioned across Drive, Oracle, and MCC.`);

  return { 
    clientID: clientID, 
    projectID: projectID, 
    folderUrl: driveUrl 
  };
}

// ============================================================================
// UPDATED: ORACLE HANDSHAKE (FEEDS TAB 1 & TAB 5)
// ============================================================================

function pushToOracleBaseline_(clientID, leadData) {
  if (!SYSTEM_CONFIG.ORACLE_DB_ID) return;
  
  try {
    const oracleSS = SpreadsheetApp.openById(SYSTEM_CONFIG.ORACLE_DB_ID);
    
    // 1. Seed Tab 1: Baseline
    const baselineSheet = findSheetFlexible_(oracleSS, ['1_Client_Baseline', 'Client Baseline', 'Baseline']);
    if (baselineSheet) {
      baselineSheet.appendRow([
        new Date().toISOString(), clientID, leadData.Company_Name, 
        `${leadData.First_Name} ${leadData.Last_Name}`.trim(), '', '', '', 
        leadData.Tech_Stack_Current || ''
      ]);
    }

    // 2. Seed Tab 5: Sourcebook Generation
    const sourcebookSheet = findSheetFlexible_(oracleSS, ['5_Sourcebook_Generation', 'Sourcebook Generation', 'Sourcebook']);
    if (sourcebookSheet) {
      sourcebookSheet.appendRow([
        clientID, 
        leadData.Company_Name, 
        0, // Initial Thought Leadership Score
        getFormattedCurrentDate_(), 
        '', 
        '', 
        '' // Sourcebook Deck link staged for Phase 3
      ]);
    }
  } catch (e) {
    logAlfredAlert_(clientID, 'WARNING', 'Oracle Sync Failed', e.message);
  }
}

// ============================================================================
// 4. THE POLICE ENGINE (RESILIENT AUDIT)
// ============================================================================
function runSystemPoliceAudit() {
  getAuthorizedPoliceAuditUser_();
  const lock = LockService.getScriptLock();
  let lockAcquired = false;
  try {
    lock.waitLock(30000);
    lockAcquired = true;
    runSystemPoliceAuditBody_();
  } finally {
    if (lockAcquired) lock.releaseLock();
  }
}

function runSystemPoliceAuditBody_() {
  console.log('Running Master Control Police Audit...');
  const ss = getMasterControlSpreadsheet_();
  const clientsSheet = findSheetFlexible_(ss, ['Clients']);
 
  if (!clientsSheet) {
    console.error('Clients tab not found in Master Control.');
    return;
  }
  const lastRow = clientsSheet.getLastRow();
  if (lastRow < 2) {
    console.log('No client rows to audit in Master Control.');
    return;
  }
 
  const clientData = clientsSheet.getRange(2, 1, lastRow - 1, 6).getValues();
  // Indexes: 0=ClientID, 1=First, 2=Last, 3=Company, 4=ContactEmail, 5=GroupEmail

  // 1. Audit Oracle Sync
  if (SYSTEM_CONFIG.ORACLE_DB_ID) {
    try {
      const oracleSS = SpreadsheetApp.openById(SYSTEM_CONFIG.ORACLE_DB_ID);
      const baselineSheet = findSheetFlexible_(oracleSS, [
        '1_Client_Baseline', 'Client Baseline', '1. Client Baseline', 'Baseline'
      ]);
     
      if (!baselineSheet) {
        logAlfredAlert_('SYSTEM', 'WARNING', 'Police Engine', 'Oracle Baseline tab not found. Check tab names.');
      } else {
        const oracleLastRow = baselineSheet.getLastRow();
        if (oracleLastRow >= 2) {
          const oracleData = baselineSheet.getRange(2, 1, oracleLastRow - 1, 5).getValues();
          // Index 1 is Client_ID, Index 3 is Owner_Name
          clientData.forEach(mcRow => {
            const mcID = String(mcRow[0]).trim();
            const mcOwner = `${mcRow[1]} ${mcRow[2]}`.trim();
           
            if (!mcID) return;
            const oracleRowIndex = oracleData.findIndex(oRow => String(oRow[1]).trim() === mcID);
            if (oracleRowIndex !== -1 && String(oracleData[oracleRowIndex][3]).trim() !== mcOwner) {
              // Master Control wins: overwrite Oracle's Owner Name
              baselineSheet.getRange(oracleRowIndex + 2, 4).setValue(mcOwner);
              logAlfredAlert_(mcID, 'INFO', 'Police Engine', `Force-synced Owner Name to Oracle for ${mcID}`);
            }
          });
        }
      }
    } catch (err) {
      console.error('Oracle audit check failed:', err.message);
      logAlfredAlert_('SYSTEM', 'WARNING', 'Police Engine Error', err.message);
    }
  }

  // 2. Audit MCC Email Sync (Master Control wins via external_id)
  if (SYSTEM_CONFIG.MCC_DB_ID) {
    try {
      const mccSS = SpreadsheetApp.openById(SYSTEM_CONFIG.MCC_DB_ID);
      const subSheet = findSheetFlexible_(mccSS, ['Subscribers', 'Subscriber_List']);
     
      if (subSheet && subSheet.getLastRow() > 1) {
        const subData = subSheet.getRange(2, 1, subSheet.getLastRow() - 1, 8).getValues();
        clientData.forEach(mcRow => {
          const mcID = String(mcRow[0]).trim().toUpperCase();
          const mcEmail = String(mcRow[4]).trim().toLowerCase();
          
          if (!mcID || !mcEmail) return;
          
          const subIndex = subData.findIndex(sRow => String(sRow[7]).trim().toUpperCase() === mcID);
          if (subIndex !== -1) {
            const currentMccEmail = String(subData[subIndex][1]).trim().toLowerCase();
            if (currentMccEmail !== mcEmail) {
              subSheet.getRange(subIndex + 2, 2).setValue(mcEmail); // Force-update Col B (email)
              logAlfredAlert_(mcID, 'INFO', 'Police Engine', `Force-synced email to MCC for ${mcID}`);
            }
          }
        });
      }
    } catch (err) {
      console.error('MCC police audit check failed:', err.message);
    }
  }



  console.log('Police Audit completed successfully.');
}
// ============================================================================
// HELPER: FUZZY TAB FINDER
// ============================================================================

function findSheetFlexible_(ss, possibleNames) {
  for (let name of possibleNames) {
    let s = ss.getSheetByName(name);
    if (s) return s;
  }
  const sheets = ss.getSheets();
  for (let s of sheets) {
    const sClean = s.getName().toLowerCase().replace(/[^a-z0-9]/g, '');
    for (let name of possibleNames) {
      const targetClean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (sClean.includes(targetClean) || targetClean.includes(sClean)) {
        return s;
      }
    }
  }
  return null;
}

// ============================================================================
// 5. ALFRED TELEMETRY LOGGING
// ============================================================================

function logAlfredAlert_(clientID, priority, category, message) {
  appendAlertRecord_({
    Alert_ID: `ALT-${Utilities.getUuid()}`,
    Timestamp: new Date().toISOString(),
    ClientID: clientID,
    Priority: priority,
    Category: category,
    Message: sanitizeAlertText_(message),
    Action_URL: '',
    Dismissed_Status: false
  });
}

function appendAlertRecord_(alert) {
  const ss = getMasterControlSpreadsheet_();
  const alertSheet = ss.getSheetByName('Alfred_Alerts');
  if (!alertSheet) throw new Error('The Alfred_Alerts sheet is unavailable.');

  const lastColumn = alertSheet.getLastColumn();
  if (lastColumn < 1) throw new Error('The Alfred_Alerts sheet has no header row.');
  const headers = alertSheet.getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map(value => String(value).trim());
  const requiredHeaders = [
    'Alert_ID', 'Timestamp', 'ClientID', 'Priority',
    'Category', 'Message', 'Action_URL', 'Dismissed_Status'
  ];
  if (requiredHeaders.some(header => !headers.includes(header))) {
    throw new Error('The Alfred_Alerts sheet does not match the required alert schema.');
  }

  alertSheet.appendRow(headers.map(header =>
    Object.prototype.hasOwnProperty.call(alert, header) ? alert[header] : ''
  ));
}

function getHudState() {
  getAuthorizedMasterControlUser_();
  return JSON.parse(JSON.stringify(buildHudPayload_()));
}

function updateKanban(clientID, newStage, request) {
  const actor = getAuthorizedMasterControlUser_();
  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    lock.waitLock(30000);
    lockAcquired = true;
    return updateKanbanWithActor_(clientID, newStage, request || {}, actor);
  } finally {
    if (lockAcquired) lock.releaseLock();
  }
}

function updateKanbanWithActor_(clientID, newStage, request, actor) {
  const targetClientID = String(clientID == null ? '' : clientID).trim();
  const targetStage = String(newStage == null ? '' : newStage).trim();
  if (!targetClientID || !targetStage) {
    throw createRouterError_('ClientID and newStage are required.', 'INVALID_REQUEST', 400);
  }

  const sheet = getMasterControlSpreadsheet_().getSheetByName('Clients');
  if (!sheet) throw new Error('The Clients sheet is unavailable.');

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) throw createRouterError_('No client records are available.', 'CLIENT_NOT_FOUND', 404);
  const headers = values[0].map(value => String(value).trim());
  const requiredFields = ['ClientID', 'PipelineStage'];
  const columns = {};
  requiredFields.forEach(field => {
    columns[field] = headers.indexOf(field);
    if (columns[field] === -1) {
      throw new Error(`The Clients sheet is missing the required ${field} column.`);
    }
  });

  const matchingRows = values.slice(1)
    .map((row, index) => ({ row, index }))
    .filter(item => String(item.row[columns.ClientID]).trim() === targetClientID);
  if (matchingRows.length === 0) {
    throw createRouterError_(`Client ${targetClientID} was not found.`, 'CLIENT_NOT_FOUND', 404);
  }
  if (matchingRows.length > 1) {
    throw new Error(`Master Control contains duplicate ClientID records for ${targetClientID}.`);
  }
  const sheetRow = matchingRows[0].index + 2;
  const row = matchingRows[0].row;
  const client = {};
  headers.forEach((header, index) => {
    if (header) client[header] = row[index];
  });

  if (/^0[4-9](?::|$)/.test(targetStage)) {
    const projectsSheet = getMasterControlSpreadsheet_().getSheetByName('Projects');
    const financesSheet = getMasterControlSpreadsheet_().getSheetByName('Finances');
    if (!projectsSheet || !financesSheet) {
      throw new Error('The Projects and Finances sheets are required by the stage gate.');
    }

    const projectValues = projectsSheet.getDataRange().getValues();
    const financeValues = financesSheet.getDataRange().getValues();
    const projectHeaders = (projectValues[0] || []).map(value => String(value).trim());
    const financeHeaders = (financeValues[0] || []).map(value => String(value).trim());
    const projectClientColumn = projectHeaders.indexOf('ClientID');
    const sowColumn = projectHeaders.indexOf('SOW_DocID');
    const financeClientColumn = financeHeaders.indexOf('ClientID');
    const depositColumn = financeHeaders.indexOf('DepositPaid');
    const msaColumn = headers.indexOf('MSA_DocID');

    if (projectClientColumn === -1 || sowColumn === -1
        || financeClientColumn === -1 || depositColumn === -1 || msaColumn === -1) {
      throw new Error('Master Control sheets are missing columns required by the stage gate.');
    }

    client.DepositPaid = financeValues.slice(1).some(financeRow =>
      String(financeRow[financeClientColumn]).trim() === targetClientID
      && (financeRow[depositColumn] === true
        || String(financeRow[depositColumn]).trim().toLowerCase() === 'true')
    );
    client.SOW_DocID = projectValues.slice(1)
      .filter(projectRow => String(projectRow[projectClientColumn]).trim() === targetClientID)
      .map(projectRow => projectRow[sowColumn])
      .find(value => typeof value === 'string' && value.trim()) || '';
    client.MSA_DocID = row[msaColumn];
  }

  const decision = evaluatePipelineStageGate_(client, targetStage, request, {
    authorizeOverride: () => isPipelineOverrideUser_(actor),
    logOverride: audit => appendPipelineOverrideAudit_(audit, actor)
  });
  if (!decision.allowed) {
    throw createRouterError_(decision.message, decision.code, 409, {
      missing: decision.missing || []
    });
  }

  sheet.getRange(sheetRow, columns.PipelineStage + 1).setValue(targetStage);

  // Synchronize Projects.KanbanStage simultaneously
  try {
    const ss = getMasterControlSpreadsheet_();
    const projectsSheet = ss.getSheetByName('Projects');
    if (projectsSheet) {
      const pVals = projectsSheet.getDataRange().getValues();
      if (pVals.length > 1) {
        const pHeaders = pVals[0].map(h => String(h).trim());
        const pClientCol = pHeaders.indexOf('ClientID');
        const pKanbanCol = pHeaders.indexOf('KanbanStage');
        if (pClientCol !== -1 && pKanbanCol !== -1) {
          for (let p = 1; p < pVals.length; p++) {
            if (String(pVals[p][pClientCol]).trim() === targetClientID) {
              projectsSheet.getRange(p + 1, pKanbanCol + 1).setValue(targetStage);
              break;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not synchronize Projects.KanbanStage:', err);
  }

  // Append transition to immutable Stage_History audit ledger
  try {
    const ss = getMasterControlSpreadsheet_();
    let historySheet = ss.getSheetByName('Stage_History');
    if (!historySheet) {
      historySheet = ss.insertSheet('Stage_History');
      historySheet.appendRow(['Timestamp', 'ClientID', 'OldStage', 'NewStage', 'Actor', 'GateDecision']);
    }
    historySheet.appendRow([
      new Date().toISOString(),
      targetClientID,
      String(client.PipelineStage || 'UNKNOWN'),
      targetStage,
      String(actor || 'System'),
      String(decision.code || 'PREREQUISITES_MET')
    ]);
  } catch (err) {
    console.warn('Could not record to Stage_History:', err);
  }

  return {
    clientID: targetClientID,
    pipelineStage: targetStage,
    gate: decision.code
  };
}

function appendPipelineOverrideAudit_(record, actor) {
  appendAlertRecord_({
    Alert_ID: `ALT-${Utilities.getUuid()}`,
    Timestamp: record.timestamp,
    ClientID: record.clientId,
    Priority: 'CRITICAL',
    Category: 'PIPELINE_OVERRIDE',
    Message: [
      `Actor: ${actor}`,
      `From: ${record.fromStage}`,
      `To: ${record.targetStage}`,
      `Missing: ${record.missing.join(', ')}`,
      `Reason: ${record.reason}`
    ].join(' | '),
    Action_URL: '',
    Dismissed_Status: false
  });
}

// ============================================================================
// 6. THE HUD DATA FEED (doGet)
// ============================================================================

function doGet(e) {
  try {
    getAuthorizedMasterControlUser_();
    const action = e && e.parameter && e.parameter.action ? e.parameter.action : 'getHudState';
    if (action === 'getHudState') {
      return buildResponse_(200, 'Success', buildHudPayload_());
    } else {
      return buildResponse_(400, 'Unknown action.');
    }
  } catch (error) {
    console.error('HUD Data Feed Error:', error);
    const status = error && error.statusCode ? error.statusCode : 500;
    const message = error && error.statusCode ? error.message : 'Internal Server Error';
    return buildResponse_(status, message);
  }
}

// ============================================================================
// HELPER: BUILD HUD PAYLOAD & CALCULATE TELEMETRY
// ============================================================================

function buildHudPayload_() {
  const ss = getMasterControlSpreadsheet_();
  
  const clients = getSheetDataAsObjectsFlexible_(findSheetFlexible_(ss, ['Clients']));
  const projects = getSheetDataAsObjectsFlexible_(findSheetFlexible_(ss, ['Projects']));
  const alerts = getSheetDataAsObjectsFlexible_(findSheetFlexible_(ss, ['Alfred_Alerts']));

  // Filter out dismissed alerts
  const activeAlerts = alerts.filter(a => String(a.Dismissed_Status).toUpperCase() !== 'TRUE');

  // Filter out sunset/archived clients (e.g., keep Kanban stages 00-08)
  const activeClients = clients.filter(c => {
    const stage = String(c.PipelineStage || '');
    return !stage.includes('09: Sunset');
  });

  // Calculate Top Ribbon Telemetry
  let totalPipelineValue = 0;
  let activeSprintsCount = 0;
  let missingDepositsCount = 0;

  activeClients.forEach(c => {
    totalPipelineValue += Number(c.ContractValue || 0);
    
    if (String(c.PipelineStage).includes('03: Active Sprints') || String(c.PipelineStage).includes('04: Session Zero')) {
      activeSprintsCount++;
    }
    
    if (String(c.DepositPaid).toUpperCase() !== 'TRUE') {
      missingDepositsCount++;
    }
  });

  const projectByClient = new Map();
  projects.forEach(project => {
    const clientID = String(project.ClientID || '').trim();
    if (!clientID) return;
    const projectedProject = pickHudFields_(project, [
      'ProjectFolderID', 'SOW_DocID', 'MeetingNotes_DriveFolderID'
    ]);
    const combinedProject = projectByClient.get(clientID) || {};
    Object.keys(projectedProject).forEach(field => {
      if (!String(combinedProject[field] || '').trim() && String(projectedProject[field] || '').trim()) {
        combinedProject[field] = projectedProject[field];
      }
    });
    projectByClient.set(clientID, combinedProject);
  });
  const hudClients = activeClients.map(client => {
    const projectedClient = pickHudFields_(client, [
      'ClientID', 'First_Name', 'Last_Name', 'Company_Name', 'CompanyName',
      'ContactEmail', 'PrimaryContact', 'LeadSource', 'GoogleTasklistID',
      'GoogleGroupEmail', 'Archetype', 'PipelineStage', 'Current_Stage',
      'Stage', 'ActiveRoadblock', 'ContractValue', 'DepositPaid',
      'CurrentMilestone', 'CompletedMilestones', 'TotalMilestones',
      'ChatSpaceUrl', 'ChatSpaceURL', 'NotesDocUrl', 'DriveFolderUrl',
      'RootFolderID', 'MSA_DocID'
    ]);
    const project = projectByClient.get(String(client.ClientID || '').trim());
    if (project) Object.assign(projectedClient, project);
    return projectedClient;
  });

  return {
    telemetry: {
      pipeline_mrr: totalPipelineValue,
      active_sprints: activeSprintsCount,
      missing_deposits: missingDepositsCount,
      active_alerts_count: activeAlerts.length,
      last_synced: new Date().toISOString()
    },
    clients: hudClients,
    alerts: activeAlerts.map(alert => pickHudFields_(alert, [
      'Alert_ID', 'Timestamp', 'ClientID', 'Priority', 'Category',
      'Message', 'Action_URL', 'Dismissed_Status'
    ]))
  };
}

function pickHudFields_(record, allowedFields) {
  const selected = {};
  allowedFields.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(record, field)) {
      selected[field] = field === 'Message'
        ? sanitizeAlertText_(record[field])
        : record[field];
    }
  });
  return selected;
}

function sanitizeAlertText_(value) {
  return String(value == null ? '' : value)
    .replace(/\b(api[_-]?key|secret|token|password)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .replace(/https?:\/\/\S+/gi, '[REDACTED_URL]')
    .replace(/\b[A-Za-z0-9_-]{25,}\b/g, '[REDACTED_ID]');
}

function getSheetDataAsObjectsFlexible_(sheet) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = data[0].map(h => String(h).trim());
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      if (h) obj[h] = row[i];
    });
    return obj;
  });
}

// ============================================================================
// 7. PATHWAY 3: MAIL COMMAND CENTER (MCC) SUBSCRIBER SYNC (NATIVE SCHEMA)
// ============================================================================

function pushToMailCommandCenter_(clientID, leadData) {
  if (!SYSTEM_CONFIG.MCC_DB_ID) {
    console.log('MCC Sync skipped: MCC_DB_ID not configured.');
    return null;
  }
  // ... rest of the function

  try {
    const mccSS = SpreadsheetApp.openById(SYSTEM_CONFIG.MCC_DB_ID);
    const subSheet = findSheetFlexible_(mccSS, ['Subscribers', 'Subscriber_List', 'MCC_Subscribers']);
    
    if (!subSheet) {
      logAlfredAlert_(clientID, 'WARNING', 'MCC Sync', 'Subscribers tab not found in MCC database.');
      return null;
    }

    const email = String(leadData.Email || '').trim().toLowerCase();
    const firstName = String(leadData.First_Name || '').trim();
    const lastName = String(leadData.Last_Name || '').trim();
    const subscriberID = `sub_${clientID.toLowerCase()}_${Math.random().toString(36).substring(2, 7)}`;
    const defaultNewsletter = 'sz_newsletter';

    const lastRow = subSheet.getLastRow();
    let existingRowIndex = -1;
    
    if (lastRow > 1) {
      // Col B (Index 1) is email, Col H (Index 7) is external_id
      const data = subSheet.getRange(2, 1, lastRow - 1, 8).getValues();
      existingRowIndex = data.findIndex(row => 
        String(row[1]).trim().toLowerCase() === email || 
        String(row[7]).trim().toUpperCase() === clientID.toUpperCase()
      );
    }

    if (existingRowIndex === -1) {
      // Matches MCC native schema:
      // [subscriber_id, email, first_name, last_name, subscribed_newsletters, status, source, external_id, created_at]
      subSheet.appendRow([
        subscriberID,
        email,
        firstName,
        lastName,
        defaultNewsletter,
        'active',
        'master_control',
        clientID, // external_id foreign key
        new Date().toISOString()
      ]);
      console.log(`Enrolled ${clientID} (${email}) into MCC.`);
      return subscriberID;
    } else {
      // Record exists: update status, source, and link external_id
      const targetRow = existingRowIndex + 2;
      subSheet.getRange(targetRow, 6).setValue('active');         // Col F: status
      subSheet.getRange(targetRow, 7).setValue('master_control');  // Col G: source
      subSheet.getRange(targetRow, 8).setValue(clientID);          // Col H: external_id
      console.log(`Linked existing MCC record for ${clientID} at row ${targetRow}.`);
      return subSheet.getRange(targetRow, 1).getValue();           // Col A: subscriber_id
    }

  } catch (error) {
    console.error('MCC Sync Failed:', error);
    logAlfredAlert_(clientID, 'WARNING', 'MCC Sync Failed', error.message);
    return null;
  }
}


/**
 * Receives the GitHub Action payload and updates the Google Doc source in Drive.
 * (Rename to doPost(e) if this is a standalone script)
 */

function attachClientServiceNode(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var projectSheet = ss.getSheetByName("Master_Control_Projects") || ss.getSheetByName("Projects");
  if (!projectSheet) {
    projectSheet = ss.getSheets()[0];
  }
  var data = projectSheet.getDataRange().getValues();
  var clientRow = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(payload.clientId) || String(data[i][1]) === String(payload.clientId)) {
      clientRow = i + 1;
      break;
    }
  }

  if (clientRow === -1) throw new Error("Client not found: " + payload.clientId);

  // 1. Update ActiveComponents (Col 8 / JSON array or comma list)
  var currentComponents = projectSheet.getRange(clientRow, 8).getValue() || "";
  var compArray = currentComponents ? String(currentComponents).split(",") : [];
  if (compArray.indexOf(payload.serviceId) === -1) {
    compArray.push(payload.serviceId);
    projectSheet.getRange(clientRow, 8).setValue(compArray.join(","));
  }

  // 2. Increment ContractValue (Col 5)
  var currentVal = Number(projectSheet.getRange(clientRow, 5).getValue() || 0);
  var newVal = currentVal + Number(payload.priceDelta);
  projectSheet.getRange(clientRow, 5).setValue(newVal);

  // 3. Inject standard tasks into Google Tasks if array is non-empty
  if (payload.tasks && payload.tasks.length > 0 && typeof Tasks !== 'undefined') {
    try {
      var taskLists = Tasks.Tasklists.list().getItems();
      var targetList = taskLists && taskLists.length > 0 ? taskLists[0].getId() : "@default";
      payload.tasks.forEach(function(taskTitle) {
        Tasks.Tasks.insert({ title: "[" + payload.serviceId + "] " + taskTitle }, targetList);
      });
    } catch (taskErr) {
      console.warn("Tasks service injection skipped or unavailable: " + taskErr.message);
    }
  }

  return { success: true, updatedValue: newVal };
}

