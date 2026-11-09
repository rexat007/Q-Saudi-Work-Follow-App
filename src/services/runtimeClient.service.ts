import {SqlOfflineCoordinator} from './offline/sqlOfflineCoordinator';
/** Installed only by a trusted application root. No URL, localStorage or UI selector. */
export interface RuntimeClientComposition {companyId:string;coordinator:SqlOfflineCoordinator;principal:()=>string|null;profile:(uid:string)=>Promise<import('../types/entities').UserEntity|null>}
let composed:RuntimeClientComposition|null=null;
export const currentRuntimeClient=()=>composed;
export function installRuntimeClient(value:RuntimeClientComposition){if(composed&&composed!==value)throw Error('RUNTIME_ALREADY_COMPOSED');composed=value;return()=>{if(composed===value){value.coordinator.dispose();composed=null;}};}
export function assertLegacyClient(){if(composed)throw Object.assign(Error('LEGACY_CLIENT_FENCED'),{code:'LEGACY_CLIENT_FENCED'});}
export async function submitRuntimeTrip(projectId:string,command:string,payload:Record<string,unknown>,operationId:string,expectedRevision:number|undefined,tripId?:string){
 const runtime=composed;if(!runtime)throw Error('SQL_RUNTIME_INACTIVE');if(!runtime.principal())throw Error('AUTH_REQUIRED');
 if(!Number.isSafeInteger(expectedRevision)||Number(expectedRevision)<0)throw Object.assign(Error('AUTHORITATIVE_REVISION_REQUIRED'),{code:'AUTHORITATIVE_REVISION_REQUIRED'});
 if(runtime.coordinator.currentScope().projectId!==projectId)throw Error('OFFLINE_SCOPE_CHANGED');
 const queued=await runtime.coordinator.enqueue('TRIP',command,{...payload,...(tripId?{tripId}:{})},expectedRevision,operationId);
 if(queued.identity.projectId!==projectId)throw Error('OFFLINE_SCOPE_CHANGED');await runtime.coordinator.wake();return {success:true,pending:true,operationId:queued.operationId};
}
