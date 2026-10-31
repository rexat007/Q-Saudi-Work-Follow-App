import { enqueueTripGoogleProjection } from './projectGoogleSheetEvent.server';
import { createHash } from 'node:crypto';
import { sanitizeUndefined } from '../utils/sanitize';
import { adminDb } from '../firebase/admin';
import { buildPrincipal } from '../utils/principal';
import { decodeTrip, decodeGlobal } from '../utils/persistenceBoundary';
import { TRIP_COMMANDS, canExecuteTripCommand, type TripCommandName } from '../types/tripCommands';
import type { AuthUserContext } from '../types/common';
import type { TripEntity } from '../types/entities';
import { TripService } from './trip.service';
import { ServerTripPersistenceAdapter } from './canonicalTripPersistence.server';
import { ExceptionService } from './exception.service';
import { ServerExceptionPersistenceAdapter } from './canonicalTripPersistence.server';
import { tripTransactionDatabase } from './tripCommandTransaction.server';

export class TripCommandError extends Error { constructor(public code: string) { super(code); } }
const deny = (code: string): never => { throw new TripCommandError(code); };
const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id) && id !== 'ALL';
function exact(input: any, fields: readonly string[]) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !fields.includes(key))) deny('INVALID_TRIP_COMMAND');
}
export class TripCommandsServerService {
  constructor(private database: any = adminDb) {}
  async execute(projectId: string, raw: any, authenticated: AuthUserContext) {
    if (!validId(projectId) || !authenticated?.userId) return deny('FORBIDDEN_PROJECT_ACCESS');
    exact(raw, ['command', 'tripId', 'payload', 'operationId']);
    if (typeof raw.command !== 'string' || !Object.hasOwn(TRIP_COMMANDS, raw.command) || typeof raw.operationId !== 'string' || !/^[a-zA-Z0-9_.:-]{1,256}$/.test(raw.operationId)) return deny('INVALID_TRIP_COMMAND');
    const command = raw.command as TripCommandName, policy = TRIP_COMMANDS[command];
    const payload = raw.payload === undefined ? {} : raw.payload;
    exact(payload, policy.fields);
    for (const key of ['sourceType', 'loadingDataSource', 'unloadingDataSource']) {
      if (payload[key] !== undefined && payload[key] !== null && !['MANUAL', 'WEIGHBRIDGE', 'EXCEL', 'CSV', 'GOOGLE_SHEETS', 'GOOGLE_DRIVE', 'API', 'MIGRATION'].includes(payload[key])) return deny('INVALID_TRIP_COMMAND');
    }
    if (payload.pricingMode !== undefined && !['RESOLVED', 'PENDING'].includes(payload.pricingMode)) return deny('INVALID_TRIP_COMMAND');
    if (payload.operationalData) exact(payload.operationalData, ['shiftDate', 'ticketId', 'tareWeightKg', 'grossWeightKg', 'netWeightKg', 'destinationNetWeightKg', 'weighTime', 'loadTime', 'unloadTime', 'legacyStatus', 'tripSerial', 'note']);
    if (payload.sourceMetadata) exact(payload.sourceMetadata, ['importBatchId', 'sourceFileId', 'sourceFileName', 'sourceSheetName', 'sourceRowId', 'sourceMimeType', 'metadata', 'legacyTripSerial', 'legacyRate', 'legacyStatus']);
    for (const key of ['originTicketNo', 'destinationTicketNo']) if (payload[key] !== undefined && typeof payload[key] !== 'string') return deny('INVALID_TRIP_COMMAND');
    for (const key of ['carrierId', 'truckId', 'driverId', 'materialId', 'pricingRuleId'])
      if (payload[key] !== undefined && !(command === 'IMPORT_TRIP' && key === 'pricingRuleId' && payload[key] === null) && !validId(payload[key])) return deny('INVALID_TRIP_COMMAND');
    if (command === 'REPORT_EXCEPTION' && !validId(payload.exceptionId)) return deny('INVALID_TRIP_COMMAND');
    const creation = ['DISPATCH_TRIP', 'RECORD_LOADING', 'IMPORT_TRIP'].includes(command);
    if (creation ? raw.tripId !== undefined : !validId(raw.tripId)) return deny('INVALID_TRIP_COMMAND');
    for (const key of policy.fields) if (/^(origin|destination)(Tare|Gross)Kg$/.test(key)) {
      if (typeof payload[key] !== 'number' || !Number.isFinite(payload[key]) || payload[key] <= 0) return deny('INVALID_TRIP_COMMAND');
    }
    if (command === 'RECORD_DESTINATION_NET' && (typeof payload.destinationNetKg !== 'number' || !Number.isFinite(payload.destinationNetKg) || payload.destinationNetKg <= 0)) return deny('INVALID_TRIP_COMMAND');
    for (const prefix of ['origin', 'destination']) if (payload[`${prefix}GrossKg`] !== undefined && payload[`${prefix}GrossKg`] <= payload[`${prefix}TareKg`]) return deny('INVALID_TRIP_COMMAND');
    const fingerprint = createHash('sha256').update(JSON.stringify([command, raw.tripId || null, Object.entries(payload).sort(([a], [b]) => a.localeCompare(b))])).digest('hex');
    return this.database.runTransaction(async (tx: any) => {
      const account = await tx.get(this.database.collection('users').doc(authenticated.userId));
      const actor = buildPrincipal(account.exists ? account.data() : null, authenticated.userId, { email: authenticated.email, name: authenticated.displayName });
      if (actor.role !== 'SUPER_ADMIN' && !actor.assignedProjectIds.includes(projectId)) return deny('FORBIDDEN_PROJECT_ACCESS');
      if (!canExecuteTripCommand(actor.role, command)) return deny('FORBIDDEN_TRIP_ACTION');
      const transaction = tripTransactionDatabase(this.database, tx);
      const persistence = new ServerTripPersistenceAdapter(transaction.db);
      const tripService = new TripService(persistence);
      let current: TripEntity | null = creation ? null : await persistence.tripRepository.findById(projectId, raw.tripId);
      if (!creation && !current) return deny('TRIP_NOT_FOUND');
      if (actor.role === 'DRIVER') {
        if (!actor.linkedDriverId) return deny('DRIVER_IDENTITY_NOT_LINKED');
        const driver = await tx.get(this.database.collection('drivers').doc(actor.linkedDriverId));
        if (!driver.exists) return deny('DRIVER_IDENTITY_NOT_LINKED');
        const canonical = decodeGlobal<any>(driver.data(), 'driver', actor.linkedDriverId);
        if (canonical.status !== 'ACTIVE' || current?.driverId !== actor.linkedDriverId) return deny('FORBIDDEN_DRIVER_OWNERSHIP');
      }
      const ledgerId = 'TRIP-CMD-' + createHash('sha256').update(`${actor.userId}:${raw.operationId}`).digest('hex');
      const ledger = this.database.collection('projects').doc(projectId).collection('sync_operations').doc(ledgerId);
      const prior = await tx.get(ledger);
      if (prior.exists) {
        const previous = prior.data();
        if (previous.fingerprint !== fingerprint || previous.operationId !== raw.operationId || previous.command !== command || previous.createdBy !== actor.userId || previous.projectId !== projectId || !validId(previous.tripId)) return deny('TRIP_COMMAND_CONFLICT');
        if (actor.role === 'DRIVER' && (previous.linkedDriverId !== actor.linkedDriverId || previous.tripId !== raw.tripId)) return deny('FORBIDDEN_DRIVER_OWNERSHIP');
        const latest = current || await persistence.tripRepository.findById(projectId, previous.tripId);
        if (!latest) return deny('TRIP_NOT_FOUND');
        return { trip: latest, idempotentReplay: true };
      }
      // Preserve pre-command publication idempotency, but only after current
      // authorization and an actor/identity match. A client ledger is never trusted.
      if (creation) {
        const legacy = await transaction.db.collection('projects').doc(projectId).collection('trips').where('clientUUID', '==', raw.operationId).limit(1).get();
        if (!legacy.empty) {
          const trip = decodeTrip<TripEntity>(legacy.docs[0].data(), legacy.docs[0].id, projectId);
          if (trip.createdBy !== actor.userId || ['carrierId', 'truckId', 'driverId', 'materialId'].some(key => (trip as any)[key] !== payload[key])) return deny('TRIP_COMMAND_CONFLICT');
          return { trip, idempotentReplay: true };
        }
      }
      let exception: any;
      if (creation) {
        const params = { ...payload, projectId, clientUUID: raw.operationId, loadingActorId: actor.userId, loadingActorType: command === 'IMPORT_TRIP' ? 'IMPORT' as const : 'USER' as const, unloadingActorId: null };
        current = command === 'IMPORT_TRIP'
          ? await tripService.dispatchImportedTrip(params as any, actor)
          : await tripService.dispatchTrip(params as any, actor);
        if (command === 'RECORD_LOADING') {
          // Compound loading action traverses every canonical FSM edge; none is skipped.
          for (const status of ['AT_ORIGIN', 'LOADING', 'WEIGHED_ORIGIN', 'IN_TRANSIT'] as const)
            current = await tripService.transitionTripStatus(projectId, current.tripId, status, status === 'WEIGHED_ORIGIN' ? payload : {}, actor);
        }
      } else if (command === 'REPORT_EXCEPTION') {
        // Reuse exception domain validation; persistence is buffered in this same transaction.
        const exceptionPersistence = new ServerExceptionPersistenceAdapter(transaction.db);
        exception = await new ExceptionService(exceptionPersistence).raiseException({ exceptionId: payload.exceptionId, type: payload.type || 'ROUTE_DEVIATION', severity: payload.severity || 'MEDIUM', description: payload.descriptionAr || payload.descriptionEn || '', reasonAr: payload.descriptionAr || 'Operational exception', tripId: raw.tripId, projectId, status: 'OPEN' } as any, actor);
        current = await persistence.tripRepository.findById(projectId, raw.tripId);
      } else if ('target' in policy) {
        const values = command === 'ACCEPT_ORIGIN_NET' ? { destinationNetKg: current!.weights.originNetKg, unloadDecision: 'ACCEPT_ORIGIN_NET_AS_DESTINATION' } : payload;
        if (command === 'ACCEPT_ORIGIN_NET' && !(values.destinationNetKg > 0)) return deny('INVALID_TRIP_COMMAND');
        current = await tripService.transitionTripStatus(projectId, raw.tripId, policy.target, values, actor);
      }
      if (!current) return deny('TRIP_NOT_FOUND');
      current = await persistence.tripRepository.findById(projectId, current.tripId);
      if (!current) return deny('TRIP_NOT_FOUND');
      await enqueueTripGoogleProjection(transaction.db, current);
      tx.set(ledger, sanitizeUndefined({ operationId: raw.operationId, command, fingerprint, tripId: current.tripId, linkedDriverId: actor.linkedDriverId || null, trip: current, status: 'PROCESSED', projectId, createdBy: actor.userId, updatedBy: actor.userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
      transaction.flush();
      return { trip: current, ...(exception ? { exception } : {}), idempotentReplay: false };
    });
  }
}
