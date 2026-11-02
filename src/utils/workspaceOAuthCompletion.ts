/** Public attempt correlation only; never OAuth state, PKCE, cookie or credential material. */
export const WORKSPACE_OAUTH_CHANNEL='qsaudi-workspace-oauth';
export const WORKSPACE_OAUTH_MESSAGE='QSAUDI_WORKSPACE_OAUTH';
export const WORKSPACE_OAUTH_TIMEOUT_MS=600000;
export const isWorkspaceOAuthCorrelation=(value:unknown):value is string=>typeof value==='string'&&/^[A-Za-z0-9_-]{32}$/.test(value);
export interface WorkspaceOAuthCompletion {
 type:typeof WORKSPACE_OAUTH_MESSAGE;
 projectId:string|null;
 correlationId:string|null;
 result:'CONNECTED'|'AUTHORIZATION_FAILED';
 code?:string;
 authorizationReason?:string;
}
