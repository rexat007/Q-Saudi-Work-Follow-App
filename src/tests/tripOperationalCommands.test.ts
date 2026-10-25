import { describe, expect, it } from 'vitest';
import { TripCommandsServerService } from '../services/tripCommands.server';
import { buildPrincipal } from '../utils/principal';
import { commandDatabase, accountProfile } from './helpers/commandDatabase';
import { queuedTripCommand } from '../services/tripCommandClient.service';
import { TRIP_COMMANDS, canExecuteTripCommand } from '../types/tripCommands';
function fixture(role = 'DRIVER', linkedDriverId: string | undefined = 'DRV-A') {
  const actor = accountProfile(role, linkedDriverId);
  const trip = { tripId: 'T1', projectId: 'P1', driverId: 'DRV-A', carrierId: 'CAR', truckId: 'TRK', materialId: 'MAT', pricingRuleId: 'PRICE', status: 'IN_TRANSIT', weights: { originNetKg: 20000 }, financials: { isFinalized: false }, pricingSnapshot: { agreedRate: 10 }, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', createdBy: 'original', updatedBy: 'original' };
  const x = commandDatabase({ 'users/actor': actor, 'projects/P1/trips/T1': trip, 'drivers/DRV-A': { driverId: 'DRV-A', status: 'ACTIVE' } });
  return { ...x, actor: buildPrincipal(actor, 'actor', {}), service: new TripCommandsServerService(x.db) };
}
const arrival = (operationId = 'op') => ({ command: 'RECORD_ARRIVAL', tripId: 'T1', payload: {}, operationId });
describe('Current-principal operational command authorization', () => {
  it('DRIVER owns trip through canonical link, not UID, and writes event/audit atomically', async () => {
    const x = fixture(); const result = await x.service.execute('P1', arrival(), x.actor);
    expect(result.trip.status).toBe('AT_DESTINATION'); expect(result.trip.driverId).toBe('DRV-A'); expect(result.trip.updatedBy).toBe('actor');
    const event = Object.entries(x.store).find(([path]) => path.includes('/trip_events/'))![1];
    const audit = Object.entries(x.store).find(([path]) => path.includes('/audit_logs/'))![1];
    expect(event.createdBy).toBe('actor'); expect(audit.actor).toMatchObject({ userId: 'actor', role: 'DRIVER' }); expect(x.store['projects/P1/trips/T1'].status).toBe('AT_DESTINATION');
  });
  it('other-driver trip is denied', async () => { const x = fixture(); x.store['projects/P1/trips/T1'].driverId = 'DRV-B'; await expect(x.service.execute('P1', arrival(), x.actor)).rejects.toHaveProperty('code', 'FORBIDDEN_DRIVER_OWNERSHIP'); });
  it('unlinked DRIVER fails without any UID or assignedDriverId fallback', async () => { const x = fixture(); delete x.store['users/actor'].linkedDriverId; x.store['projects/P1/trips/T1'].driverId = 'actor'; x.store['projects/P1/trips/T1'].assignedDriverId = 'actor'; await expect(x.service.execute('P1', arrival(), x.actor)).rejects.toHaveProperty('code', 'DRIVER_IDENTITY_NOT_LINKED'); });
  it.each(['scope', 'role', 'link', 'status'])('replay reauthorizes current %s before accepting even a previously successful operation', async kind => {
    const x = fixture(); await x.service.execute('P1', arrival(), x.actor);
    if (kind === 'scope') x.store['users/actor'].assignedProjectIds = [];
    if (kind === 'role') x.store['users/actor'].role = 'VIEWER';
    if (kind === 'link') delete x.store['users/actor'].linkedDriverId;
    if (kind === 'status') x.store['users/actor'].status = 'SUSPENDED';
    await expect(x.service.execute('P1', arrival(), x.actor)).rejects.toThrow();
  });
  it('valid duplicate is idempotent and does not append a second audit', async () => { const x = fixture(); await x.service.execute('P1', arrival(), x.actor); const size = Object.keys(x.store).length; expect((await x.service.execute('P1', arrival(), x.actor)).idempotentReplay).toBe(true); expect(Object.keys(x.store)).toHaveLength(size); });
  it.each(['projectId', 'tripId', 'driverId', 'truckId', 'carrierId', 'materialId', 'pricingRuleId', 'pricingSnapshot', 'createdAt', 'createdBy', 'actorRole', 'actorId', 'assignedDriverId'])('rejects overposted %s', async field => {
    const x = fixture(); await expect(x.service.execute('P1', { ...arrival(), payload: { [field]: 'evil' } }, x.actor)).rejects.toHaveProperty('code', 'INVALID_TRIP_COMMAND'); expect(x.store['projects/P1/trips/T1'].status).toBe('IN_TRANSIT');
  });
  it('invalid FSM fails even for SUPER_ADMIN', async () => { const x = fixture('SUPER_ADMIN'); x.store['projects/P1/trips/T1'].status = 'COMPLETED'; await expect(x.service.execute('P1', arrival(), x.actor)).rejects.toThrow(); });
  it('SCALE_OPERATOR records destination weights without generic dispatcher privilege', async () => {
    const x = fixture('SCALE_OPERATOR'); x.store['projects/P1/trips/T1'].status = 'AT_DESTINATION';
    const result = await x.service.execute('P1', { command: 'RECORD_DESTINATION_WEIGHT', tripId: 'T1', payload: { destinationTareKg: 10000, destinationGrossKg: 30000, destinationTicketNo: 'D1' }, operationId: 'weight' }, x.actor);
    expect(result.trip.weights.destinationNetKg).toBe(20000); expect(result.trip.status).toBe('WEIGHED_DESTINATION');
  });
  it('DISPATCHER cannot use destination-only command', async () => { const x = fixture('DISPATCHER'); await expect(x.service.execute('P1', { command: 'COMPLETE_UNLOADING', tripId: 'T1', payload: {}, operationId: 'offload' }, x.actor)).rejects.toHaveProperty('code', 'FORBIDDEN_TRIP_ACTION'); });
  it.each(['SCALE_OPERATOR', 'PROJECT_ADMIN', 'SUPERVISOR', 'SITE_SUPERVISOR'])('%s remains project scoped', async role => { const x = fixture(role); await expect(x.service.execute('P2', arrival(), x.actor)).rejects.toHaveProperty('code', 'FORBIDDEN_PROJECT_ACCESS'); });
  it('supervisory arrival is a named action, no generic update command exists', async () => { const x = fixture('SUPERVISOR'); expect((await x.service.execute('P1', arrival(), x.actor)).trip.status).toBe('AT_DESTINATION'); await expect(x.service.execute('P1', { ...arrival('other'), command: 'UPDATE_TRIP' }, x.actor)).rejects.toHaveProperty('code', 'INVALID_TRIP_COMMAND'); });
  it('audit write failure rolls back trip and idempotency record', async () => { const x = fixture(); x.failWrites('/audit_logs/'); await expect(x.service.execute('P1', arrival(), x.actor)).rejects.toThrow(); expect(x.store['projects/P1/trips/T1'].status).toBe('IN_TRANSIT'); expect(Object.keys(x.store).some(path => path.includes('sync_operations'))).toBe(false); });
  it('legacy queued actor and snapshot fields never become command authority', () => {
    const intent = queuedTripCommand({ operationType: 'UPDATE_TRIP_STATUS', payload: { tripId: 'T1', status: 'AT_DESTINATION', driverId: 'spoof', actorRole: 'SUPER_ADMIN', actorId: 'other', pricingSnapshot: {} } });
    expect(intent).toEqual({ command: 'RECORD_ARRIVAL', tripId: 'T1', payload: {} });
  });
  it('loading replay sends measurements, not cached settlement or actor', () => {
    const intent = queuedTripCommand({ operationType: 'CREATE_TRIP_LOADING', payload: { driverId: 'DRV-A', truckId: 'TRK', carrierId: 'CAR', materialId: 'MAT', pricingRuleId: 'PRICE', tareWeight: 10000, grossWeight: 30000, pricingSnapshot: { settlementAmount: 1 }, actorId: 'other' } });
    expect(intent.command).toBe('RECORD_LOADING'); expect(intent.payload).toMatchObject({ originTareKg: 10000, originGrossKg: 30000 }); expect(intent.payload).not.toHaveProperty('pricingSnapshot'); expect(intent.payload).not.toHaveProperty('actorId');
  });
  it('canonical nine roles have bounded command authority', () => {
    for (const command of Object.keys(TRIP_COMMANDS) as (keyof typeof TRIP_COMMANDS)[]) {
      expect(canExecuteTripCommand('VIEWER', command)).toBe(false); expect(canExecuteTripCommand('FINANCE_AUDITOR', command)).toBe(false);
    }
    expect(canExecuteTripCommand('DRIVER', 'RECORD_ARRIVAL')).toBe(true); expect(canExecuteTripCommand('DRIVER', 'RECORD_LOADING')).toBe(false); expect(canExecuteTripCommand('SCALE_OPERATOR', 'DISPATCH_TRIP')).toBe(false);
  });
});

function dispatchGraph(x: ReturnType<typeof fixture>) {
  Object.assign(x.store, {
    'projects/P1': { projectId: 'P1', projectNumber: 1, nameAr: 'Project', nameEn: 'Project', status: 'ACTIVE' },
    'carriers/CAR': { carrierId: 'CAR', nameAr: 'Carrier', status: 'ACTIVE' },
    'trucks/TRK': { truckId: 'TRK', plate: 'ABC', status: 'ACTIVE', tareWeightKg: 10000 },
    'drivers/DRV-A': { driverId: 'DRV-A', fullNameAr: 'Driver', nationalId: '1234567890', status: 'ACTIVE' },
    'materials/MAT': { materialId: 'MAT', nameAr: 'Material', unitOfMeasure: 'TON', status: 'ACTIVE' },
    'projects/P1/pricing_rules/PRICE': { pricingRuleId: 'PRICE', projectId: 'P1', carrierId: 'CAR', materialId: 'MAT', status: 'ACTIVE', pricingModel: 'PER_TON', baseRateSAR: 10 },
    'projects/P1/driver_active_assignments/DRV-A': { assignmentId: 'ASG' },
    'projects/P1/truck_active_assignments/TRK': { assignmentId: 'ASG' },
    'projects/P1/driver_truck_assignments/ASG': { assignmentId: 'ASG', projectId: 'P1', driverId: 'DRV-A', truckId: 'TRK', status: 'ACTIVE', effectiveFrom: '2020-01-01T00:00:00Z', effectiveTo: null },
    'projects/P1/truck_active_allocations/TRK': { allocationId: 'ALC' },
    'projects/P1/truck_material_allocations/ALC': { allocationId: 'ALC', projectId: 'P1', truckId: 'TRK', materialId: 'MAT', status: 'ACTIVE', effectiveFrom: '2020-01-01T00:00:00Z', effectiveTo: null },
  });
  for (const [kind, id] of [['carrier', 'CAR'], ['truck', 'TRK'], ['driver', 'DRV-A'], ['material', 'MAT']])
    x.store[`projects/P1/${kind}_memberships/${id}`] = { [`${kind}Id`]: id, projectId: 'P1', status: 'ACTIVE' };
  for (const [kind, id] of [['driver', 'DRV-A'], ['truck', 'TRK']])
    x.store[`projects/P1/${kind}_carrier_affiliations/${id}`] = { [`${kind}Id`]: id, projectId: 'P1', carrierId: 'CAR', status: 'ACTIVE' };
}
const creationPayload = { carrierId: 'CAR', truckId: 'TRK', driverId: 'DRV-A', materialId: 'MAT', pricingRuleId: 'PRICE' };
describe('Dispatch/loading reuse canonical relationships and FSM atomically', () => {
  it('DISPATCHER dispatch uses canonical identities, pricing and snapshots', async () => {
    const x = fixture('DISPATCHER'); dispatchGraph(x);
    const result = await x.service.execute('P1', { command: 'DISPATCH_TRIP', payload: creationPayload, operationId: 'dispatch' }, x.actor);
    expect(result.trip.status).toBe('DISPATCHED'); expect(result.trip.driverSnapshot.driverId).toBe('DRV-A'); expect(result.trip.createdBy).toBe('actor'); expect(result.trip.pricingSnapshot.agreedRate).toBe(10);
  });
  it('SCALE_OPERATOR loading executes all FSM edges and derives weights, never cached financials', async () => {
    const x = fixture('SCALE_OPERATOR'); dispatchGraph(x);
    const result = await x.service.execute('P1', { command: 'RECORD_LOADING', payload: { ...creationPayload, originTareKg: 10000, originGrossKg: 30000 }, operationId: 'loading' }, x.actor);
    expect(result.trip.status).toBe('IN_TRANSIT'); expect(result.trip.weights.originNetKg).toBe(20000);
    const states = Object.entries(x.store).filter(([path]) => path.includes('/trip_events/')).map(([, value]) => value.statusResulting);
    expect(states).toEqual(['DISPATCHED', 'AT_ORIGIN', 'LOADING', 'WEIGHED_ORIGIN', 'IN_TRANSIT']);
    expect(x.store['systemCounters/tripNumber_P1'].nextNumber).toBe(2);
    const again = await x.service.execute('P1', { command: 'RECORD_LOADING', payload: { ...creationPayload, originTareKg: 10000, originGrossKg: 30000 }, operationId: 'loading' }, x.actor);
    expect(again.idempotentReplay).toBe(true); expect(again.trip.tripId).toBe(result.trip.tripId); expect(x.store['systemCounters/tripNumber_P1'].nextNumber).toBe(2);
  });
  it('failed loading audit rolls back trip, all transitions, counter and ledger', async () => {
    const x = fixture('SCALE_OPERATOR'); dispatchGraph(x); x.failWrites('/audit_logs/'); const before = Object.keys(x.store).length;
    await expect(x.service.execute('P1', { command: 'RECORD_LOADING', payload: { ...creationPayload, originTareKg: 10000, originGrossKg: 30000 }, operationId: 'loading' }, x.actor)).rejects.toThrow();
    expect(Object.keys(x.store)).toHaveLength(before); expect(x.store['systemCounters/tripNumber_P1']).toBeUndefined();
  });
});

describe('Destination modes preserve explicit operator intent', () => {
  it('direct net uses the entered net without invented gross/tare measurements', async () => {
    const x = fixture('SCALE_OPERATOR'); x.store['projects/P1/trips/T1'].status = 'AT_DESTINATION';
    const result = await x.service.execute('P1', { command: 'RECORD_DESTINATION_NET', tripId: 'T1', payload: { destinationNetKg: 19000 }, operationId: 'net' }, x.actor);
    expect(result.trip.weights.destinationNetKg).toBe(19000); expect(result.trip.weights).not.toHaveProperty('destinationGrossKg'); expect(result.trip.weights.varianceKg).toBe(-1000);
  });
  it('accept-origin reads the canonical trip weight rather than a client substitute', async () => {
    const x = fixture('SCALE_OPERATOR'); x.store['projects/P1/trips/T1'].status = 'AT_DESTINATION';
    const result = await x.service.execute('P1', { command: 'ACCEPT_ORIGIN_NET', tripId: 'T1', payload: {}, operationId: 'origin' }, x.actor);
    expect(result.trip.weights.destinationNetKg).toBe(20000); expect(result.trip.weights.varianceKg).toBe(0);
    await expect(x.service.execute('P1', { command: 'ACCEPT_ORIGIN_NET', tripId: 'T1', payload: { destinationNetKg: 1 }, operationId: 'spoof' }, x.actor)).rejects.toHaveProperty('code', 'INVALID_TRIP_COMMAND');
  });
  it('unloading completes only through weighed destination then offloaded then completed', async () => {
    const x = fixture('SCALE_OPERATOR'); x.store['projects/P1/trips/T1'].status = 'AT_DESTINATION';
    await expect(x.service.execute('P1', { command: 'COMPLETE_TRIP', tripId: 'T1', payload: {}, operationId: 'early' }, x.actor)).rejects.toThrow();
    await x.service.execute('P1', { command: 'RECORD_DESTINATION_NET', tripId: 'T1', payload: { destinationNetKg: 20000 }, operationId: 'net' }, x.actor);
    await x.service.execute('P1', { command: 'COMPLETE_UNLOADING', tripId: 'T1', payload: {}, operationId: 'offload' }, x.actor);
    const result = await x.service.execute('P1', { command: 'COMPLETE_TRIP', tripId: 'T1', payload: {}, operationId: 'complete' }, x.actor);
    expect(result.trip.financials.isFinalized).toBe(true); expect(result.trip.status).toBe('COMPLETED'); expect(result.trip.pricingSnapshot.agreedRate).toBe(10);
  });
});

describe('Replay cannot duplicate or downgrade canonical trip state', () => {
  it('returns current trip state instead of the historical ACK snapshot', async () => {
    const x = fixture(); await x.service.execute('P1', arrival(), x.actor);
    x.store['projects/P1/trips/T1'].status = 'COMPLETED';
    const result = await x.service.execute('P1', arrival(), x.actor); expect(result.idempotentReplay).toBe(true); expect(result.trip.status).toBe('COMPLETED');
  });
  it('pre-command clientUUID record is recognized only with current actor and matching identities', async () => {
    const x = fixture('DISPATCHER'); x.store['projects/P1/trips/T1'].createdBy = 'actor'; x.store['projects/P1/trips/T1'].clientUUID = 'old';
    const request = { command: 'DISPATCH_TRIP', operationId: 'old', payload: creationPayload };
    expect((await x.service.execute('P1', request, x.actor)).idempotentReplay).toBe(true);
    x.store['projects/P1/trips/T1'].createdBy = 'other'; await expect(x.service.execute('P1', request, x.actor)).rejects.toHaveProperty('code', 'TRIP_COMMAND_CONFLICT');
    expect(Object.keys(x.store).filter(path => path.includes('/trips/'))).toEqual(['projects/P1/trips/T1']);
  });
});

describe('Import command preserves the existing domain seam', () => {
  it('reuses canonical imported-trip creation without trusting supplied actor metadata', async () => {
    const x = fixture('DISPATCHER'); dispatchGraph(x);
    const result = await x.service.execute('P1', { command: 'IMPORT_TRIP', operationId: 'import', payload: { ...creationPayload, sourceType: 'CSV', operationalData: { tareWeightKg: 10000, grossWeightKg: 30000, netWeightKg: 20000 }, sourceMetadata: { sourceFileName: 'roster.csv' } } }, x.actor);
    expect(result.trip.driverSnapshot.driverId).toBe('DRV-A'); expect(result.trip.loadingActorId).toBe('actor'); expect(result.trip.loadingActorType).toBe('IMPORT'); expect(result.trip.sourceType).toBe('CSV');
    expect(result.trip.weights.originNetKg).toBe(20000);
  });
});

describe('Reserved command ledger cannot be replaced by a client-shaped record', () => {
  it('rejects a forged ledger even when its fingerprint was copied from a real request', async () => {
    const x = fixture(); await x.service.execute('P1', arrival(), x.actor);
    const path = Object.keys(x.store).find(path => path.includes('/sync_operations/TRIP-CMD-'))!;
    expect(path).toBeTruthy(); x.store[path].operationId = path.split('/').at(-1);
    await expect(x.service.execute('P1', arrival(), x.actor)).rejects.toHaveProperty('code', 'TRIP_COMMAND_CONFLICT');
  });
});
