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

export const MASTER_CONTROL_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/script.scriptapp',
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

export async function fetchMasterControlState(
  accessToken: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const data = await runMasterControlFunction(accessToken, 'getHudState', [], signal);
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

  throw new Error(`Master Control action "${String(payload.action ?? 'unknown')}" is not available through the deployed API.`);
}
