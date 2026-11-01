import {workspaceFailureCode} from './workspaceGenerationErrors';
export type GoogleWorkspaceErrorCode = 'OAUTH_APP_CONFIGURATION_BLOCK' | 'AUTHORIZATION_DENIED' | 'POPUP_CLOSED' | 'TOKEN_EXPIRED' | 'SCOPE_DENIED' | 'NETWORK_ERROR' | 'PROVISIONING_FAILED' | 'APP_UPDATE_REQUIRED' | 'APP_VERSION_UNAVAILABLE';
/** Only evidence explicitly returned by the provider can establish a consent configuration block.
 * A closed cross-origin popup alone cannot reveal the Google page's error. */
export function classifyGoogleWorkspaceError(error: unknown): GoogleWorkspaceErrorCode {
  const e = error as { code?: string; message?: string; error?: string; error_description?: string } | null;
  const versionCode=workspaceFailureCode(e?.code||e?.message||'');
  if(versionCode==='APP_UPDATE_REQUIRED'||versionCode==='APP_VERSION_UNAVAILABLE')return versionCode;
  const evidence = [e?.code, e?.message, e?.error, e?.error_description].filter(Boolean).join(' ').toLowerCase();
  if (/not.*verified|testing.*test user|test user.*not|org_internal|access_blocked/.test(evidence)) return 'OAUTH_APP_CONFIGURATION_BLOCK';
  if (/scope_denied|insufficient.*scope|insufficientpermissions/.test(evidence)) return 'SCOPE_DENIED';
  if (/access_denied|user-denied|authorization_denied/.test(evidence)) return 'AUTHORIZATION_DENIED';
  if (/popup.closed|popup-closed|cancelled-popup/.test(evidence)) return 'POPUP_CLOSED';
  if (/token.expired|invalid_token|invalid_grant|unauthenticated/.test(evidence)) return 'TOKEN_EXPIRED';
  if (/network|failed to fetch|econn|timeout/.test(evidence)) return 'NETWORK_ERROR';
  return 'PROVISIONING_FAILED';
}

export function continuityStateLabel(state: string, t: (key: string)=>string): string {
  switch(state) {
    case 'APP_UPDATE_REQUIRED': return t('gws.app_update_required');
    case 'NOT_CONNECTED': return t('gws.not_connected');
    case 'CONNECTED': return t('gws.connected');
    case 'PROVISIONING': return t('gws.provisioning');
    case 'READY': return t('gws.ready');
    case 'SYNC_DEGRADED': return t('gws.degraded');
    case 'AUTHORIZATION_REQUIRED': return t('gws.authorization_required');
    default: return t('gws.failed');
  }
}

/** Bounded operator guidance; preserves support codes and does not alter validation. */
const destinationMessages = {
  DESTINATION_NOT_WRITABLE:'gws.destination_not_writable',
  STORAGE_TARGET_CONFLICT:'gws.destination_conflict',
  CURRENT_STORAGE_DESTINATION:'gws.destination_is_current',
  DESTINATION_FOLDER_INVALID:'gws.destination_invalid',
  INVALID_STORAGE_RESOURCE_ID:'gws.destination_invalid',
  DESTINATION_FOLDER_REQUIRED:'gws.destination_invalid',
  DESTINATION_ACCESS_FAILED:'gws.destination_access_failed',
  WORKSPACE_REGISTRY_ACCESS_FAILED:'gws.registry_unavailable',
  SCOPE_DENIED:'gws.scope_denied',
  TOKEN_EXPIRED:'gws.token_expired',
  AUTHORIZATION_REQUIRED:'gws.authorization_required',
  HOST_SERVICE_UNAVAILABLE:'gws.host_unavailable',
  WORKSPACE_REQUEST_FAILED:'gws.action_required',
  GOOGLE_SERVICE_UNAVAILABLE:'gws.google_service_unavailable',
  GOOGLE_NETWORK_ERROR:'gws.google_network_error',
  GOOGLE_RATE_LIMITED:'gws.google_rate_limited',
  GOOGLE_QUOTA_EXCEEDED:'gws.google_quota_exceeded',
  GOOGLE_INVALID_REQUEST:'gws.google_invalid_request',
  GOOGLE_PERMISSION_DENIED:'gws.google_permission_denied',
  API_ACCESS_DISABLED:'gws.google_api_disabled',
  PROJECT_WORKSPACE_FILE_MISSING:'gws.bound_file_unavailable',
} as const;
export function workspaceDestinationMessageKey(message:string):string|null {
  for(const [code,key] of Object.entries(destinationMessages))if(new RegExp(`\\b${code}\\b`).test(message))return key;
  return null;
}
