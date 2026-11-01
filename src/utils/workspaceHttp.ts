import {GOOGLE_PROVIDER_CODES} from '../../server/workspaceGoogleErrors';
import {workspaceGenerationDiagnosticCode} from './workspaceGenerationDiagnostics';
import {workspaceScopeDiagnosticCode} from './googleWorkspaceScopes';
const codes=new Set<string>([...GOOGLE_PROVIDER_CODES,
 'WORKSPACE_COORDINATOR_UNAVAILABLE','GOOGLE_CREDENTIAL_UNAVAILABLE','GOOGLE_AUTHORIZATION_DIAGNOSIS_UNAVAILABLE','AUTHORIZATION_REQUIRED','AUTHORIZATION_DENIED','GOOGLE_ACCESS_TOKEN_REQUIRED','UNAUTHENTICATED','FORBIDDEN_PROJECT_ACCESS','FORBIDDEN','APP_UPDATE_REQUIRED','APP_VERSION_UNAVAILABLE',
 'WORKSPACE_SYNC_IN_PROGRESS','WORKSPACE_EXECUTION_FENCED','WORKSPACE_IDENTITY_CHANGED','WORKSPACE_GOOGLE_ACCOUNT_MISMATCH','WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION','WORKSPACE_EXTERNAL_BINDING_INVALID',
 'WORKSPACE_RECOVERY_REQUIRED','WORKSPACE_BINDING_INVALID','WORKSPACE_BINDING_INCOMPLETE','WORKSPACE_TEMPLATE_MIGRATION_REQUIRED','WORKSPACE_INITIALIZATION_FAILED','AUTOMATION_RECOVERY_REQUIRED','AUTOMATION_RECOVERY_FAILED','SCRIPT_PARENT_PROOF_REQUIRED','SCRIPT_IDENTITY_CONFLICT','SHEET_SOURCE_MAPPING_REQUIRED',
 'PROFILE_REPORT_TAB_CONFLICT','PROFILE_REPORT_TAB_OWNERSHIP_INVALID','PROFILE_REPORT_OVERVIEW_SYNC_FAILED','PROFILE_REPORT_TRIPS_SYNC_FAILED','PROFILE_REPORT_DAILY_SYNC_FAILED','PROFILE_REPORT_CARRIER_SYNC_FAILED','PROFILE_REPORT_FLEET_SYNC_FAILED','PROFILE_REPORT_DASHBOARD_SYNC_FAILED','PROFILE_REPORT_LIVE_SYNC_FAILED','PROFILE_REPORT_EXCEPTIONS_SYNC_FAILED','PROFILE_REPORT_AUDIT_SYNC_FAILED',
 'DESTINATION_NOT_WRITABLE','STORAGE_TARGET_CONFLICT','CURRENT_STORAGE_DESTINATION','DESTINATION_FOLDER_INVALID','INVALID_STORAGE_RESOURCE_ID','DESTINATION_FOLDER_REQUIRED','DESTINATION_ACCESS_FAILED','WORKSPACE_REGISTRY_ACCESS_FAILED','INVALID_WORKSPACE_COMMAND','PROVISIONING_FAILED','SHEET_SYNC_FAILED','GOOGLE_OFFLINE_CONFIGURATION_REQUIRED','GOOGLE_OFFLINE_AUTHORIZATION_FAILED',
 'RUNTIME_TEMPLATE_SELECTION_RETIRED','TEMPLATE_SELECTION_MISMATCH','TEMPLATE_TIMEZONE_INVALID','PROJECT_WORKSPACE_FILE_MISSING','TEMPLATE_ACCESS_DENIED','TEMPLATE_NOT_FOUND','INVALID_ARGUMENT','PROJECT_NOT_FOUND','OPERATIONAL_CONFIGURATION_REQUIRED','HOST_SERVICE_UNAVAILABLE','WORKSPACE_REQUEST_FAILED',
]);
export function boundedWorkspaceHttpCode(value:unknown):string|null {
 if(typeof value!=='string')return null;if(codes.has(value))return value;
 const scope=workspaceScopeDiagnosticCode(value);if(scope&&value.startsWith('SCOPE_DENIED'))return scope;
 const stage=workspaceGenerationDiagnosticCode(value);return stage===value?stage:null;
}
/** Hosting/proxy failure is not Google evidence; raw bodies and parse exceptions never escape. */
export async function decodeWorkspaceResponse(response:Response):Promise<any>{
 let data:unknown;
 try{
  const type=response.headers?.get?.('content-type');if(type&&!/^application\/(?:[\w.-]+\+)?json(?:\s*;|$)/i.test(type))throw Error();
  if(typeof response.text==='function'){
   if(!type)throw Error();const text=await response.text();if(!text.trim())throw Error();data=JSON.parse(text);
  }else{
   // Also accepts the small Response-like transports used by existing clients/tests;
   // parsing is always caught and the error envelope still passes the closed-code filter.
   data=await response.json();
  }
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error();
 }catch{throw Error('HOST_SERVICE_UNAVAILABLE');}
 const object=data as Record<string,unknown>;
 if(!response.ok||object.success===false){
  const code=boundedWorkspaceHttpCode(object.code)||boundedWorkspaceHttpCode(object.error)|| (response.status>=500?'HOST_SERVICE_UNAVAILABLE':response.status===401?'AUTHORIZATION_REQUIRED':response.status===403?'AUTHORIZATION_DENIED':'WORKSPACE_REQUEST_FAILED');
  if(response.ok)throw Error(code);
  return {success:false,code,error:code};
 }
 return object;
}
export async function workspaceFetch(input:RequestInfo|URL,init?:RequestInit):Promise<Response>{
 try{return await fetch(input,init);}catch{throw Error('HOST_SERVICE_UNAVAILABLE');}
}
