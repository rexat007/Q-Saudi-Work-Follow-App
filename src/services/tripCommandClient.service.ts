import { auth } from '../firebase/config';
import { TRIP_COMMANDS, STATUS_COMMANDS, type TripCommandName } from '../types/tripCommands';
export async function sendTripCommand(projectId: string, command: TripCommandName, payload: Record<string, unknown>, operationId: string, tripId?: string) {
  if (!auth.currentUser) throw new Error('UNAUTHENTICATED');
  const token = await auth.currentUser.getIdToken();
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/trips/commands`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ command, payload, operationId, ...(tripId ? { tripId } : {}) }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw Object.assign(new Error(result.error || result.code || 'TRIP_COMMAND_FAILED'), { code: result.code });
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
