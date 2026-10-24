export const MASTER_CONTROL_AUTH_UNAVAILABLE =
  'Master Control is unavailable until the approved Google OAuth connector is configured.';

export async function fetchMasterControlState(): Promise<unknown> {
  throw new Error(MASTER_CONTROL_AUTH_UNAVAILABLE);
}

export async function postMasterControlAction(_payload: Record<string, unknown>): Promise<void> {
  throw new Error(MASTER_CONTROL_AUTH_UNAVAILABLE);
}
