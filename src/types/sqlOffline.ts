import {TRIP_COMMANDS} from './tripCommands';
export type SqlQueueStatus='PENDING'|'SENDING'|'AWAITING_RECEIPT'|'SYNCED'|'RETRYABLE_FAILURE'|'REVIEW_REQUIRED'|'CONFLICT'|'QUARANTINED_EPOCH'|'QUARANTINED_SCOPE'|'CANCELLED';
export interface OfflineScope {principal:string;companyId:string;projectId:string;deviceId:string;backendEpoch:string;epochRevision:number}
export interface OfflineEnvelope {operationId:string;expectedRevision:number;backendEpoch:string;payloadSchemaVersion:1;command:string;payload:Record<string,unknown>}
export interface OfflineCommand {
 key:string;scope:string;owner:string;principal:string;identity:OfflineScope;operationId:string;authority:'TRIP'|'IMPORT_ADVANCE';envelope:OfflineEnvelope;
 requestDigest:string;createdAt:string;status:SqlQueueStatus;version:number;attempts:number;recoveries:number;nextAttemptAt:number;
 lease?:{owner:string;until:number;fence:number};errorCode?:string;receipt?:OfflineReceipt;
}
export interface OfflineReceipt {state:'COMMITTED'|'NOT_COMMITTED'|'IN_PROGRESS';operationId:string;principal:string;companyId:string;projectId:string;deviceId:string;backendEpoch:string;epochRevision:number;requestDigest:string;trip?:Record<string,unknown>;reference?:string}
export interface OfflineContext {principal:string;companyId:string;projectId:string;backendEpoch:string;epochRevision:number;canonicalStore:'postgres'}
export interface OfflineTransport {
 context(scope:{principal:string;companyId:string;projectId:string},signal:AbortSignal):Promise<OfflineContext>;
 receipt(command:OfflineCommand,signal:AbortSignal):Promise<OfflineReceipt>;
 send(command:OfflineCommand,signal:AbortSignal):Promise<OfflineReceipt>;
}
export const sqlScope=(s:OfflineScope)=>JSON.stringify([s.principal,s.companyId,s.projectId,s.deviceId,s.backendEpoch,s.epochRevision]);
export const epochKey=(s:Pick<OfflineScope,'principal'|'companyId'|'projectId'>)=>JSON.stringify([s.principal,s.companyId,s.projectId]);
export const uuid=(s:unknown):s is string=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s);
export function offlineFail(code:string):never{throw Object.assign(Error(code),{code});}
export function stableJson(value:unknown):string {
 if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
 if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(stableJson).join(',')+']';
 if(value&&typeof value==='object'&&Object.getPrototypeOf(value)===Object.prototype)return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stableJson((value as any)[k])).join(',')+'}';
 return offlineFail('INVALID_OFFLINE_PAYLOAD');
}
export const commandIdentity=(v:Pick<OfflineCommand,'identity'|'operationId'|'authority'|'envelope'>)=>({identity:v.identity,operationId:v.operationId,authority:v.authority,envelope:v.envelope});
export async function commandDigest(v:Pick<OfflineCommand,'identity'|'operationId'|'authority'|'envelope'>){const b=new TextEncoder().encode(stableJson(commandIdentity(v)));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(v=>v.toString(16).padStart(2,'0')).join('');}
export function validateOfflineEnvelope(authority:OfflineCommand['authority'],e:OfflineEnvelope){
 if(!uuid(e.operationId)||!Number.isSafeInteger(e.expectedRevision)||e.expectedRevision<0||e.payloadSchemaVersion!==1||typeof e.backendEpoch!=='string')offlineFail('INVALID_OFFLINE_ENVELOPE');
 if(Object.keys(e).some(k=>!['operationId','expectedRevision','backendEpoch','payloadSchemaVersion','command','payload'].includes(k)))offlineFail('INVALID_OFFLINE_ENVELOPE');
 const policy=Object.hasOwn(TRIP_COMMANDS,e.command)?(TRIP_COMMANDS as any)[e.command]:null;
 const fields=authority==='IMPORT_ADVANCE'&&e.command==='ADVANCE_IMPORT'?['sessionId','operationId','expectedVersion','reviewedSignature','sourceRevisionId','mappingRevisionId']:authority==='TRIP'&&e.command!=='IMPORT_TRIP'&&policy?[...policy.fields,'tripId']:null;
 if(!fields||!e.payload||typeof e.payload!=='object'||Array.isArray(e.payload)||Object.keys(e.payload).some(k=>!fields.includes(k)))offlineFail('INVALID_OFFLINE_COMMAND');
 if(authority==='IMPORT_ADVANCE'&&(!uuid(e.payload.operationId)||!['sessionId','reviewedSignature','sourceRevisionId','mappingRevisionId'].every(k=>typeof e.payload[k]==='string'&&e.payload[k])||e.payload.expectedVersion!==e.expectedRevision))offlineFail('REVIEWED_IMPORT_REFERENCE_REQUIRED');
 if(new TextEncoder().encode(stableJson(e)).length>65536)offlineFail('OFFLINE_COMMAND_LIMIT');
}
