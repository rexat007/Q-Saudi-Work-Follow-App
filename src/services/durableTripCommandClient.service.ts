import {outboxService} from './offline/outbox.service';
import type {OutboxOperation} from '../types/offline';
import type {TripCommandName} from '../types/tripCommands';
export const unconfirmedTripOperation=(op:OutboxOperation)=>op.operationType==='TRIP_COMMAND'&&['PENDING','SENDING','AWAITING_RECEIPT'].includes(op.status);
export async function pendingTripOperations(projectId:string,principal:string){
  return (await outboxService.getOperations()).filter(op=>op.projectId===projectId&&op.userId===principal&&unconfirmedTripOperation(op));
}
/** One existing Outbox and one canonical HTTP command boundary. A retry always
 * reuses the frozen operation/revision, never an updated UI payload. */
export async function durableTripCommand(projectId:string,principal:string,command:TripCommandName,payload:Record<string,unknown>,tripId?:string,expectedRevision?:number){
  const pending=await pendingTripOperations(projectId,principal);
  const existing=pending.find(op=>(op.payload.tripId||null)===(tripId||null));
  const operation=existing||await outboxService.queueOperation({projectId,userId:principal,operationType:'TRIP_COMMAND',payload:{command,payload,...(tripId?{tripId}:{}),...(expectedRevision===undefined?{}:{expectedRevision})}});
  return syncTripOperation(operation,principal);
}
async function syncTripOperation(operation:OutboxOperation,principal:string){
  await outboxService.syncAll(false,operation.projectId);
  const receipt=(await outboxService.getOperations()).find(op=>op.operationId===operation.operationId&&op.projectId===operation.projectId&&op.userId===principal);
  if(receipt?.status!=='SYNCED'||!receipt.serverAck?.canonicalTrip)throw Object.assign(Error(receipt?.errorReason||'RECEIPT_REQUIRED'),{code:receipt?.errorReason||'RECEIPT_REQUIRED',operationId:operation.operationId,status:receipt?.status});
  return {trip:receipt.serverAck.canonicalTrip,operationId:operation.operationId};
}
export async function recoverTripOperation(operation:OutboxOperation,principal:string){
  if(operation.userId!==principal||!unconfirmedTripOperation(operation))throw Error('INVALID_OUTBOX_RECOVERY');
  if(operation.retryCount>=5)await outboxService.retryOperation(operation.operationId);
  // A second tab may already have acknowledged this exact operation. Never
  // allocate a replacement intent when recovering a captured operation identity.
  return syncTripOperation(operation,principal);
}
