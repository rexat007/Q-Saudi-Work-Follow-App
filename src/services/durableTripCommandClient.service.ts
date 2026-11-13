import {outboxService} from './offline/outbox.service';
import type {OutboxOperation} from '../types/offline';
import type {TripCommandName} from '../types/tripCommands';
import {frozenOutboxIdentity,outboxIntentConflict} from './offline/tripCommandIdentity';
export const unconfirmedTripOperation=(op:OutboxOperation)=>op.operationType==='TRIP_COMMAND'&&['PENDING','SENDING','AWAITING_RECEIPT'].includes(op.status);
export async function pendingTripOperations(projectId:string,principal:string){
  return (await outboxService.getOperations()).filter(op=>op.projectId===projectId&&op.userId===principal&&unconfirmedTripOperation(op));
}
/** One existing Outbox and one canonical HTTP command boundary. A retry always
 * reuses the frozen operation/revision, never an updated UI payload. */
export async function durableTripCommand(projectId:string,principal:string,command:TripCommandName,payload:Record<string,unknown>,tripId?:string,expectedRevision?:number,operationId?:string){
  const operation=await outboxService.queueOperation({projectId,userId:principal,...(operationId?{operationId}:{}),operationType:'TRIP_COMMAND',payload:{command,payload,...(tripId?{tripId}:{}),...(expectedRevision===undefined?{}:{expectedRevision})}});
  return syncTripOperation(operation,principal);
}
async function storedTripOperation(operation:OutboxOperation,principal:string){
  const stored=(await outboxService.getOperations()).find(op=>op.operationId===operation.operationId&&op.projectId===operation.projectId&&op.userId===principal);
  if(stored&&frozenOutboxIdentity(stored)!==frozenOutboxIdentity(operation))throw outboxIntentConflict(stored);
  return stored;
}
async function syncTripOperation(operation:OutboxOperation,principal:string){
  await storedTripOperation(operation,principal);
  await outboxService.syncAll(false,operation.projectId);
  const receipt=(await outboxService.getOperations()).find(op=>op.operationId===operation.operationId&&op.projectId===operation.projectId&&op.userId===principal);
  if(receipt?.status!=='SYNCED'||!receipt.serverAck?.canonicalTrip)throw Object.assign(Error(receipt?.errorReason||'RECEIPT_REQUIRED'),{code:receipt?.errorReason||'RECEIPT_REQUIRED',operationId:operation.operationId,status:receipt?.status});
  return {trip:receipt.serverAck.canonicalTrip,operationId:operation.operationId};
}
export async function recoverTripOperation(operation:OutboxOperation,principal:string){
  if(operation.userId!==principal||operation.operationType!=='TRIP_COMMAND'||(!unconfirmedTripOperation(operation)&&operation.status!=='SYNCED'))throw Error('INVALID_OUTBOX_RECOVERY');
  await storedTripOperation(operation,principal);
  if(operation.retryCount>=5)await outboxService.retryOperation(operation.operationId);
  // A second tab may already have acknowledged this exact operation. Never
  // allocate a replacement intent when recovering a captured operation identity.
  return syncTripOperation(operation,principal);
}
