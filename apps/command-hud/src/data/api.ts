interface AppsScriptExecutionResponse {
  done?: boolean;
  response?: {
    result?: unknown;
  };
  error?: {
    message?: string;
    details?: Array<{
      errorMessage?: string;
      errorType?: string;
    }>;
  };
}

export type ServiceAttachmentResult =
  | { status: 'offline' }
  | {
      status: 'persisted';
      updatedValue: number;
      activeComponents: string[];
      tasksCreated: number;
      tasksFailed: number;
      alreadyAttached: boolean;
    };

export const MASTER_CONTROL_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/script.scriptapp',
  'https://www.googleapis.com/auth/tasks',
] as const;

const getAppsScriptDeploymentId = (): string => {
  const deploymentId = import.meta.env.VITE_APPS_SCRIPT_DEPLOYMENT_ID?.trim();
  if (!deploymentId) {
    throw new Error('Master Control API executable deployment ID is not configured.');
  }
  return deploymentId;
};

const getErrorMessage = (response: AppsScriptExecutionResponse): string =>
  response.error?.details?.[0]?.errorMessage
  || response.error?.message
  || 'Apps Script execution failed.';

async function runMasterControlFunction(
  accessToken: string,
  functionName: string,
  parameters: unknown[] = [],
  signal?: AbortSignal,
): Promise<unknown> {
  if (!accessToken) {
    throw new Error('Google sign-in is required to contact Master Control.');
  }

  const deploymentId = getAppsScriptDeploymentId();
  const response = await fetch(
    `https://script.googleapis.com/v1/scripts/${encodeURIComponent(deploymentId)}:run`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        function: functionName,
        parameters,
        devMode: false,
      }),
      signal,
    },
  );

  const result: unknown = await response.json();
  if (!response.ok) {
    const responseError = typeof result === 'object'
      && result !== null
      && 'error' in result
      ? result.error
      : null;
    const errorMessage = typeof responseError === 'object'
      && responseError !== null
      && 'message' in responseError
      ? String(responseError.message || `HTTP ${response.status}`)
      : `Apps Script API request failed with HTTP ${response.status}.`;
    throw new Error(errorMessage);
  }
  if (typeof result !== 'object' || result === null) {
    throw new Error('Apps Script API returned an invalid execution response.');
  }

  const execution = result as AppsScriptExecutionResponse;
  if (execution.error) {
    throw new Error(getErrorMessage(execution));
  }
  if (execution.done === false) {
    throw new Error('Apps Script execution did not complete.');
  }
  if (!execution.response || !('result' in execution.response)) {
    throw new Error('Apps Script execution returned no function result.');
  }
  return execution.response.result;
}

/**
 * Normalizes client records from both legacy and HUD 2.0 schemas
 * to ensure bulletproof resilience across all modals and components.
 */
export function normalizeClientData(c: any): any {
  if (!c || typeof c !== 'object') return c;
  const phase = c.AccountPhase ?? c.pipelineStage ?? '01: Intake';
  const value = Number(c.ContractValue ?? c.contractValue ?? 0);
  const id = String(c.ClientID ?? c.id ?? 'UNKNOWN').trim();
  const name = String(c.Company_Name ?? c.companyName ?? c.name ?? 'Unnamed').trim();
  const rawComponents = c.ActiveComponents ?? c.activeComponents ?? [];
  let activeComponents: string[];
  if (Array.isArray(rawComponents)) {
    activeComponents = rawComponents.map(component => String(component).trim()).filter(Boolean);
  } else {
    const componentText = String(rawComponents).trim();
    if (componentText.startsWith('[')) {
      const parsedComponents: unknown = JSON.parse(componentText);
      if (!Array.isArray(parsedComponents)) {
        throw new Error('Master Control returned an invalid ActiveComponents value.');
      }
      activeComponents = parsedComponents.map(component => String(component).trim()).filter(Boolean);
    } else {
      activeComponents = componentText.split(',').map(component => component.trim()).filter(Boolean);
    }
  }

  return {
    ...c,
    id,
    ClientID: id,
    Company_Name: name,
    companyName: name,
    name,
    AccountPhase: phase,
    pipelineStage: phase,
    ContractValue: value,
    contractValue: value,
    DepositPaid: Boolean(c.DepositPaid ?? c.depositPaid ?? false),
    depositPaid: Boolean(c.DepositPaid ?? c.depositPaid ?? false),
    PrimaryContact: String(c.PrimaryContact ?? c.primaryContact ?? ''),
    primaryContact: String(c.PrimaryContact ?? c.primaryContact ?? ''),
    ContactEmail: String(c.ContactEmail ?? c.contactEmail ?? ''),
    contactEmail: String(c.ContactEmail ?? c.contactEmail ?? ''),
    DriveFolderUrl: String(c.DriveFolderUrl ?? c.driveFolderUrl ?? ''),
    driveFolderUrl: String(c.DriveFolderUrl ?? c.driveFolderUrl ?? ''),
    NotesDocUrl: String(c.NotesDocUrl ?? c.notesDocUrl ?? ''),
    notesDocUrl: String(c.NotesDocUrl ?? c.notesDocUrl ?? ''),
    MSA_DocID: String(c.MSA_DocID ?? ''),
    SOW_DocID: String(c.SOW_DocID ?? ''),
    ChatSpaceUrl: String(c.ChatSpaceUrl ?? c.chatSpaceUrl ?? ''),
    chatSpaceUrl: String(c.ChatSpaceUrl ?? c.chatSpaceUrl ?? ''),
    activeProjects: Array.isArray(c.activeProjects) ? c.activeProjects : [],
    activeComponents,
    totalMilestones: Number(c.totalMilestones ?? c.MilestonesTotal ?? 4),
    completedMilestones: Number(c.completedMilestones ?? c.MilestonesDone ?? 0),
    currentMilestone: String(c.currentMilestone ?? c.Title ?? 'Active Sprint Delivery'),
  };
}

export async function fetchMasterControlState(
  accessToken: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const data: any = await runMasterControlFunction(accessToken, 'getHudState', [], signal);
  if (data && typeof data === 'object' && Array.isArray(data.clients)) {
    data.clients = data.clients.map(normalizeClientData);
  }
  return { status: 200, message: 'success', data };
}

export async function postMasterControlAction(
  accessToken: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  if (payload.action === 'updateKanban') {
    return runMasterControlFunction(accessToken, 'updateKanban', [
      payload.clientID,
      payload.newStage,
      payload,
    ]);
  }

  if (payload.action === 'RUN_PROVISIONING') {
    throw new Error('Provisioning is not available through the deployed Master Control API; no authorized provisioning wrapper is configured.');
  }

  if (payload.action === 'attachClientServiceNode') {
    return runMasterControlFunction(accessToken, 'attachClientServiceNode', [payload]);
  }

  throw new Error(`Master Control action "${String(payload.action ?? 'unknown')}" is not available through the deployed API.`);
}

export async function syncServiceToMasterControl(
  clientId: string,
  serviceId: string,
  priceDelta: number,
  tasks: string[],
  accessToken?: string | null,
): Promise<ServiceAttachmentResult> {
  if (!accessToken) {
    return { status: 'offline' };
  }
  if (!clientId.trim() || !serviceId.trim() || !Number.isFinite(priceDelta) || priceDelta <= 0
      || tasks.some(task => !task.trim())) {
    throw new Error('A valid client, service, price, and task list are required.');
  }
  const result = await postMasterControlAction(accessToken, {
    action: 'attachClientServiceNode',
    clientId,
    serviceId,
    priceDelta,
    tasks,
    timestamp: new Date().toISOString(),
  });
  if (typeof result !== 'object' || result === null
      || !('success' in result) || result.success !== true
      || !('updatedValue' in result) || typeof result.updatedValue !== 'number'
      || !Number.isFinite(result.updatedValue)
      || !('activeComponents' in result) || !Array.isArray(result.activeComponents)
      || !result.activeComponents.every(component => typeof component === 'string')
      || !('tasksCreated' in result) || typeof result.tasksCreated !== 'number'
      || !Number.isInteger(result.tasksCreated)
      || !('tasksFailed' in result) || typeof result.tasksFailed !== 'number'
      || !Number.isInteger(result.tasksFailed)
      || !('alreadyAttached' in result) || typeof result.alreadyAttached !== 'boolean'
      || !result.activeComponents.includes(serviceId)) {
    throw new Error('Master Control did not confirm a complete service attachment response.');
  }
  return {
    status: 'persisted',
    updatedValue: result.updatedValue,
    activeComponents: result.activeComponents,
    tasksCreated: result.tasksCreated,
    tasksFailed: result.tasksFailed,
    alreadyAttached: result.alreadyAttached,
  };
}
