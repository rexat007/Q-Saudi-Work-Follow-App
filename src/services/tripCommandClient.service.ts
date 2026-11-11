import {currentRuntimeClient,submitRuntimeTrip} from './runtimeClient.service';
import { auth } from '../firebase/config';
import { TRIP_COMMANDS, STATUS_COMMANDS, type TripCommandName } from '../types/tripCommands';
export async function sendTripCommand(projectId: string, command: TripCommandName, payload: Record<string, unknown>, operationId: string, tripId?: string, expectedPrincipal?: string, expectedRevision?:number, recoverFirst=false) {
  const actor=auth.currentUser;
  if (!actor || expectedPrincipal && actor.uid!==expectedPrincipal) throw new Error('UNAUTHENTICATED');
  if(currentRuntimeClient()?.principal()&&currentRuntimeClient()!.principal()!==actor.uid)throw Error('AUTH_CONTEXT_CHANGED');
  if(currentRuntimeClient())return submitRuntimeTrip(projectId,command,payload,operationId,expectedRevision,tripId);
  const token = await actor.getIdToken();
  if(auth.currentUser?.uid!==actor.uid)throw new Error('AUTH_CONTEXT_CHANGED');
  const body=JSON.stringify({ command, payload, operationId, ...(tripId ? { tripId } : {}), ...(expectedRevision===undefined?{}:{expectedRevision}) });
  const endpoint=`/api/projects/${encodeURIComponent(projectId)}/trips/commands`;
  const request = {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body,
  };
  if(recoverFirst){
    const receiptResponse=await fetch(endpoint+'/receipt',request),receipt=await receiptResponse.json();
    if(auth.currentUser?.uid!==actor.uid)throw new Error('AUTH_CONTEXT_CHANGED');
    if(!receiptResponse.ok||!receipt.success)throw Object.assign(new Error(receipt.code||'RECEIPT_UNAVAILABLE'),{code:receipt.code,status:receiptResponse.status});
    if(receipt.found===true)return receipt;
    if(receipt.found!==false)throw new Error('RECEIPT_UNAVAILABLE');
  }
  const response = await fetch(endpoint,request);
  const result = await response.json();
  if(auth.currentUser?.uid!==actor.uid)throw new Error('AUTH_CONTEXT_CHANGED');
  if (!response.ok || !result.success) throw Object.assign(new Error(result.error || result.code || 'TRIP_COMMAND_FAILED'), { code: result.code, status:response.status });
  return result;
}
// Compatibility is confined to translating queued business intent. It never
// forwards cached actor, financials, snapshots, or arbitrary fields to the server.
export function queuedTripCommand(operation: { operationType: string; payload: Record<string, any> }) {
  const data = operation.payload;
  let command: TripCommandName;
  let payload: Record<string, any> = {};
  if (operation.operationType === 'CREATE_TRIP_LOADING') {
    command = 'RECORD_LOADING';
    payload = { carrierId: data.carrierId, truckId: data.truckId, driverId: data.driverId, materialId: data.materialId, pricingRuleId: data.pricingRuleId,
      originTareKg: data.originTareKg ?? data.tareWeight ?? data.tareWeightKg,
      originGrossKg: data.originGrossKg ?? data.grossWeight ?? data.grossWeightKg,
      originTicketNo: data.originTicketNo ?? data.ticketId };
  } else if (operation.operationType === 'UPDATE_TRIP_STATUS') {
    command = STATUS_COMMANDS[data.status as keyof typeof STATUS_COMMANDS] as TripCommandName;
    if (!command) throw new Error('INVALID_TRIP_COMMAND');
    payload = Object.fromEntries(TRIP_COMMANDS[command].fields.filter(key => data[key] !== undefined).map(key => [key, data[key]]));
  } else if (operation.operationType === 'RECORD_RECEIPT') {
    command = data.receiptMode === 'ACCEPT_ORIGIN_NET' ? 'ACCEPT_ORIGIN_NET' : data.receiptMode === 'DIRECT' ? 'RECORD_DESTINATION_NET' : 'RECORD_DESTINATION_WEIGHT';
    payload = command === 'ACCEPT_ORIGIN_NET' ? {} : command === 'RECORD_DESTINATION_NET' ? { destinationNetKg: data.destinationNetKg, destinationTicketNo: data.destinationTicketNo } : { destinationTareKg: data.destinationTareKg, destinationGrossKg: data.destinationGrossKg, destinationTicketNo: data.destinationTicketNo };
  } else if (operation.operationType === 'REPORT_EXCEPTION') {
    command = 'REPORT_EXCEPTION';
    payload = Object.fromEntries(TRIP_COMMANDS.REPORT_EXCEPTION.fields.filter(key => data[key] !== undefined).map(key => [key, data[key]]));
  } else throw new Error('INVALID_TRIP_COMMAND');
  return { command, payload, ...(operation.operationType === 'CREATE_TRIP_LOADING' ? {} : { tripId: data.tripId }) };
}
