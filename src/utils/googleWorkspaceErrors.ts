export type GoogleWorkspaceErrorCode = 'OAUTH_APP_CONFIGURATION_BLOCK' | 'AUTHORIZATION_DENIED' | 'POPUP_CLOSED' | 'TOKEN_EXPIRED' | 'SCOPE_DENIED' | 'NETWORK_ERROR' | 'PROVISIONING_FAILED';
/** Only evidence explicitly returned by the provider can establish a consent configuration block.
 * A closed cross-origin popup alone cannot reveal the Google page's error. */
export function classifyGoogleWorkspaceError(error: unknown): GoogleWorkspaceErrorCode {
  const e = error as { code?: string; message?: string; error?: string; error_description?: string } | null;
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
    case 'NOT_CONNECTED': return t('gws.not_connected');
    case 'CONNECTED': return t('gws.connected');
    case 'PROVISIONING': return t('gws.provisioning');
    case 'READY': return t('gws.ready');
    case 'SYNC_DEGRADED': return t('gws.degraded');
    case 'AUTHORIZATION_REQUIRED': return t('gws.authorization_required');
    default: return t('gws.failed');
  }
}
