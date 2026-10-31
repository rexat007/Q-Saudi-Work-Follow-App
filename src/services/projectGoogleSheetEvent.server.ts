import { createHash } from 'node:crypto';
import type { TripEntity } from '../types/entities';
import type { OperationalSheetInput } from './projectGoogleSheetContract';
import { syncOutboxRef } from './projectGoogleWorkspace.server';

/** No new Trip lifecycle/validation rule. Missing source-series/timestamps are not fabricated.
 * The approved optional metadata contract feeds a projection only; it never owns Trip identity. */
export function googleSheetInputFromTrip(trip: TripEntity): OperationalSheetInput | null {
  const source = trip.sourceMetadata?.metadata?.googleSheetSource;
  if(!source || typeof source.ticketSeries!=='string' || !trip.weights.originTicketNo) return null;
  const firstWeighbridgeAt=source.firstWeighbridgeAt;
  const secondWeighbridgeAt=source.secondWeighbridgeAt;
  return {projectId:trip.projectId,tripId:trip.tripId,ticketId:trip.weights.originTicketNo,ticketSeries:source.ticketSeries,
    weightUnit:'kg',tare:trip.weights.originTareKg,gross:trip.weights.originGrossKg,
    carrierLabel:trip.carrierSnapshot?.companyNameAr,truckPlate:trip.truckSnapshot?.plateNumberAr,materialLabel:trip.materialSnapshot?.nameAr,
    firstWeighbridgeAt,secondWeighbridgeAt,arrivalAt:source.arrivalAt,offloadCompleteAt:source.offloadCompleteAt,
    warehouseWeightTonnes:trip.weights.destinationNetKg===undefined?undefined:trip.weights.destinationNetKg/1000,
    destination:source.destination,receiptNo:trip.weights.destinationTicketNo};
}
/** Uses the command's buffered transaction, before writes flush; no Google calls. */
export async function enqueueTripGoogleProjection(db:any,trip:TripEntity) {
  const id=createHash('sha256').update(trip.tripId).digest('hex');
  const ref=syncOutboxRef(db,trip.projectId).doc(id), previous=await ref.get();
  const revision=(previous.exists?previous.data().revision:0)+1;
  const input=googleSheetInputFromTrip(trip);
  await ref.set({projectId:trip.projectId,tripId:trip.tripId,revision,input:input?JSON.parse(JSON.stringify(input)):null,status:'PENDING',mappingRequired:!input});
}
