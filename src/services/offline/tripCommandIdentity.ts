import type {OutboxOperation} from '../../types/offline';

/** Match the existing server command fingerprint without making client storage
 * an authority. Operation/device/status/receipt are not business intent. */
export function frozenOutboxIdentity(operation:OutboxOperation):string {
  if(operation.operationType!=='TRIP_COMMAND')return JSON.stringify([operation.projectId,operation.userId,operation.operationType,operation.payload,operation.dependsOnOperationId??null]);
  const envelope=operation.payload;
  return JSON.stringify([operation.projectId,operation.userId,operation.operationType,operation.dependsOnOperationId??null,envelope.command,envelope.tripId||null,Object.entries(envelope.payload??{}).sort(([a],[b])=>a.localeCompare(b)),...(envelope.expectedRevision===undefined?[]:[envelope.expectedRevision])]);
}
export function outboxIntentConflict(operation:OutboxOperation,code='OUTBOX_INTENT_CONFLICT') {
  return Object.assign(new Error(code),{code,operationId:operation.operationId});
}
