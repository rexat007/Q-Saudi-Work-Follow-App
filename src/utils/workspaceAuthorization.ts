/** Closed metadata only. No credentials, provider payloads or account identifiers. */
export const WORKSPACE_AUTH_REASONS = [
  'AUTH_GRANT_MISSING', 'AUTH_GRANT_NOT_ACTIVE', 'AUTH_ACTOR_MISMATCH',
  'AUTH_PROJECT_MISMATCH', 'AUTH_SUBJECT_MISMATCH', 'AUTH_SPREADSHEET_MISMATCH',
  'AUTH_BINDING_REVISION_MISMATCH', 'AUTH_PROVIDER_SUBJECT_CHANGED',
  'AUTH_REFRESH_REJECTED', 'AUTH_REFRESH_SUBJECT_MISMATCH',
  'AUTH_BINDING_SCOPE_MISSING', 'AUTH_AUTOMATION_SCOPE_MISSING',
] as const;
export type WorkspaceAuthReason = typeof WORKSPACE_AUTH_REASONS[number];
export const isWorkspaceAuthReason=(value:unknown):value is WorkspaceAuthReason=>(WORKSPACE_AUTH_REASONS as readonly unknown[]).includes(value);
export const WORKSPACE_AUTH_RESULTS = [
  'CONNECTED_VALID', 'REAUTHORIZATION_REQUIRED', 'GRANT_BINDING_STALE',
  'ACCOUNT_MISMATCH', 'AUTOMATION_SCOPE_REQUIRED', 'PROVIDER_TEMPORARILY_UNAVAILABLE',
] as const;
export type WorkspaceAuthResult = typeof WORKSPACE_AUTH_RESULTS[number];
export const AUTH_TRANSIENT_CODES = ['GOOGLE_SERVICE_UNAVAILABLE', 'GOOGLE_NETWORK_ERROR', 'GOOGLE_RATE_LIMITED', 'GOOGLE_QUOTA_EXCEEDED'] as const;
export interface WorkspaceAuthorizationDiagnosis {
  result: WorkspaceAuthResult;
  reason?: WorkspaceAuthReason;
  providerCode?: string;
  metadataOnly: true;
}
export function workspaceAuthResult(reason: WorkspaceAuthReason): WorkspaceAuthResult {
  if (['AUTH_PROJECT_MISMATCH', 'AUTH_SPREADSHEET_MISMATCH', 'AUTH_BINDING_REVISION_MISMATCH'].includes(reason)) return 'GRANT_BINDING_STALE';
  if (['AUTH_ACTOR_MISMATCH', 'AUTH_SUBJECT_MISMATCH', 'AUTH_PROVIDER_SUBJECT_CHANGED'].includes(reason)) return 'ACCOUNT_MISMATCH';
  if (reason === 'AUTH_AUTOMATION_SCOPE_MISSING') return 'AUTOMATION_SCOPE_REQUIRED';
  return 'REAUTHORIZATION_REQUIRED';
}
/** Both acquisition and per-request execution fences consume the same predicates. */
export function workspaceGrantFailure(grant: {status?:string;actorId?:string;projectId?:string;subject?:string;spreadsheetId?:string;bindingRevision?:number}|null|undefined,
  binding: {projectId?:string;googleSubject?:string;spreadsheetId?:string;revision?:number}|null|undefined, projectId:string, actorId:string): WorkspaceAuthReason|null {
  if (!grant) return 'AUTH_GRANT_MISSING';
  if (grant.status !== 'ACTIVE') return 'AUTH_GRANT_NOT_ACTIVE';
  if (grant.actorId !== actorId) return 'AUTH_ACTOR_MISMATCH';
  if (grant.projectId !== projectId || binding?.projectId !== projectId) return 'AUTH_PROJECT_MISMATCH';
  if (grant.subject !== binding?.googleSubject) return 'AUTH_SUBJECT_MISMATCH';
  if (grant.spreadsheetId !== binding?.spreadsheetId) return 'AUTH_SPREADSHEET_MISMATCH';
  if (grant.bindingRevision !== binding?.revision) return 'AUTH_BINDING_REVISION_MISMATCH';
  return null;
}
export function boundedAuthorizationDiagnosis(value: unknown): WorkspaceAuthorizationDiagnosis|undefined {
  if (!value || typeof value !== 'object') return;
  const d = value as Record<string, unknown>;
  if (!(WORKSPACE_AUTH_RESULTS as readonly unknown[]).includes(d.result)) return;
  const reason = (WORKSPACE_AUTH_REASONS as readonly unknown[]).includes(d.reason) ? d.reason as WorkspaceAuthReason : undefined;
  const providerCode = (AUTH_TRANSIENT_CODES as readonly unknown[]).includes(d.providerCode) ? d.providerCode as string : undefined;
  return {result: d.result as WorkspaceAuthResult, ...(reason ? {reason} : {}), ...(providerCode ? {providerCode} : {}), metadataOnly:true};
}
export function workspaceAuthorizationMessageKey(diagnosis?: WorkspaceAuthorizationDiagnosis): string|null {
  switch (diagnosis?.result) {
    case 'REAUTHORIZATION_REQUIRED': return 'gws.authorization_required';
    case 'GRANT_BINDING_STALE': return 'gws.authorization_binding_review';
    case 'ACCOUNT_MISMATCH': return 'gws.authorization_account_mismatch';
    case 'AUTOMATION_SCOPE_REQUIRED': return 'gws.authorization_automation_scope';
    case 'PROVIDER_TEMPORARILY_UNAVAILABLE': return 'gws.authorization_retry_later';
    default: return null;
  }
}

export function workspaceNeedsReauthorization(status:{backgroundAuthorization?:string;authorizationDiagnostic?:WorkspaceAuthorizationDiagnosis}|null|undefined):boolean {
  const diagnosis=status?.authorizationDiagnostic;
  if(diagnosis&&['GRANT_BINDING_STALE','ACCOUNT_MISMATCH'].includes(diagnosis.result))return false;
  if(status?.backgroundAuthorization==='NOT_CONNECTED'||status?.backgroundAuthorization==='AUTHORIZATION_REQUIRED')return true;
  if(!diagnosis)return status?.backgroundAuthorization==='AUTHORIZATION_REQUIRED'||status?.backgroundAuthorization==='NOT_CONNECTED';
  return diagnosis.result==='REAUTHORIZATION_REQUIRED';
}

/** Success is proved by canonical status, never by a popup or a cached React value. */
export function assertDurableWorkspaceAuthorization(status:import('../types/projectGoogleWorkspace').ProjectGoogleStatus,projectId:string):void {
 if(status.binding?.projectId!==projectId||status.backgroundAuthorization!=='CONNECTED'||!['CONNECTED_VALID','AUTOMATION_SCOPE_REQUIRED'].includes(status.authorizationDiagnostic?.result||''))throw Error('DURABLE_AUTHORIZATION_REQUIRED');
}
export async function authorizeBoundWorkspaceExecution(projectId:string,port:{getGoogleWorkspaceStatus:(id:string)=>Promise<import('../types/projectGoogleWorkspace').ProjectGoogleStatus>;connectBackgroundAuthorization:(id:string,current:()=>boolean)=>Promise<void>},current:()=>boolean,automation=false) {
 const status=await port.getGoogleWorkspaceStatus(projectId);if(!current())throw Error('WORKSPACE_IDENTITY_CHANGED');
 if(status.binding?.projectId!==projectId)throw Error('WORKSPACE_NOT_PROVISIONED');
 const diagnosis=status.authorizationDiagnostic;
 if(diagnosis&&['GRANT_BINDING_STALE','ACCOUNT_MISMATCH'].includes(diagnosis.result))throw Error(diagnosis.result==='ACCOUNT_MISMATCH'?'WORKSPACE_GOOGLE_ACCOUNT_MISMATCH':'WORKSPACE_BINDING_CONFLICT');
 // A transient outage is retried through the accepted durable grant, without asking for consent again.
 if(status.backgroundAuthorization==='CONNECTED'&&diagnosis?.result==='PROVIDER_TEMPORARILY_UNAVAILABLE')return status;
 if(status.backgroundAuthorization==='CONNECTED'&&(diagnosis?.result==='CONNECTED_VALID'||!automation&&diagnosis?.result==='AUTOMATION_SCOPE_REQUIRED'))return status;
 await port.connectBackgroundAuthorization(projectId,current);if(!current())throw Error('WORKSPACE_IDENTITY_CHANGED');
 const confirmed=await port.getGoogleWorkspaceStatus(projectId);if(!current())throw Error('WORKSPACE_IDENTITY_CHANGED');
 assertDurableWorkspaceAuthorization(confirmed,projectId);
 if(confirmed.binding?.spreadsheetId!==status.binding.spreadsheetId||confirmed.binding?.revision!==status.binding.revision)throw Error('WORKSPACE_IDENTITY_CHANGED');
 return confirmed;
}
