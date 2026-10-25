import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OutboxService } from '../services/offline/outbox.service';
import { indexedDBService } from '../services/offline/indexedDB.service';
import { TripCommandsServerService } from '../services/tripCommands.server';
import { buildPrincipal } from '../utils/principal';
import { accountProfile, commandDatabase } from './helpers/commandDatabase';
vi.mock('../firebase/config', () => ({ auth: { currentUser: { uid: 'actor', getIdToken: async () => 'token' } }, db: {} }));
function bridge(role = 'DRIVER') {
  const profile = accountProfile(role, 'DRV-A');
  const database = commandDatabase({ 'users/actor': profile, 'drivers/DRV-A': { driverId: 'DRV-A', status: 'ACTIVE' }, 'projects/P1/trips/T1': { tripId: 'T1', projectId: 'P1', driverId: 'DRV-A', status: 'IN_TRANSIT', weights: { originNetKg: 20000 }, financials: { isFinalized: false }, pricingSnapshot: { agreedRate: 10 }, updatedBy: 'original' } });
  const service = new TripCommandsServerService(database.db), actor = buildPrincipal(profile, 'actor', {});
  const fetch = vi.fn(async (_url: any, options: any) => {
    expect(options.headers.Authorization).toBe('Bearer token');
    try { const result = await service.execute('P1', JSON.parse(options.body), actor); return { ok: true, json: async () => JSON.parse(JSON.stringify({ success: true, ...result })) }; }
    catch (error: any) { return { ok: false, json: async () => ({ success: false, code: error.code || error.message }) }; }
  });
  vi.stubGlobal('fetch', fetch); return { ...database, fetch, outbox: new OutboxService() };
}
beforeEach(async () => { await indexedDBService.clear('outbox'); await indexedDBService.clear('trips'); await indexedDBService.clear('conflicts'); });
afterEach(() => vi.unstubAllGlobals());
describe('Queued intent -> HTTP client -> real command service with staged transaction model', () => {
  it('valid own-trip arrival is acknowledged and cached only after the server FSM succeeds', async () => {
    const x = bridge(); await x.outbox.queueOperation({ projectId: 'P1', userId: 'actor', operationId: 'arrival', operationType: 'UPDATE_TRIP_STATUS', payload: { tripId: 'T1', status: 'AT_DESTINATION', actorId: 'spoof', driverId: 'spoof' } });
    const result = await x.outbox.syncAll(false); expect(result.syncedCount).toBe(1); expect(result.failedCount).toBe(0);
    expect(x.store['projects/P1/trips/T1'].status).toBe('AT_DESTINATION'); expect((await indexedDBService.getById<any>('trips', 'T1')).status).toBe('ARRIVED');
    expect(JSON.parse(x.fetch.mock.calls[0][1].body).payload).toEqual({});
  });
  it.each(['link', 'scope', 'role'])('revoking %s after queueing prevents replay and false ACK', async kind => {
    const x = bridge(); await x.outbox.queueOperation({ projectId: 'P1', userId: 'actor', operationId: 'revoked', operationType: 'UPDATE_TRIP_STATUS', payload: { tripId: 'T1', status: 'AT_DESTINATION' } });
    if (kind === 'link') delete x.store['users/actor'].linkedDriverId;
    if (kind === 'scope') x.store['users/actor'].assignedProjectIds = [];
    if (kind === 'role') x.store['users/actor'].role = 'VIEWER';
    const result = await x.outbox.syncAll(false); expect(result.syncedCount).toBe(0); expect(result.failedCount).toBe(1); expect(x.store['projects/P1/trips/T1'].status).toBe('IN_TRANSIT');
    const op = (await x.outbox.getOperations())[0]; expect(op.status).toBe('FAILED'); expect(op.serverAck).toBeUndefined();
  });
  it('pending local completion cannot be mistaken for server completion during the three-command unloading replay', async () => {
    const x = bridge('SCALE_OPERATOR'); x.store['projects/P1/trips/T1'].status = 'AT_DESTINATION';
    await indexedDBService.put('trips', { tripId: 'T1', projectId: 'P1', status: 'COMPLETED', syncStatus: 'PENDING' });
    for (const [operationId, operationType, payload] of [
      ['receipt', 'RECORD_RECEIPT', { tripId: 'T1', receiptMode: 'DIRECT', destinationNetKg: 19000 }],
      ['offload', 'UPDATE_TRIP_STATUS', { tripId: 'T1', status: 'OFFLOADED' }],
      ['complete', 'UPDATE_TRIP_STATUS', { tripId: 'T1', status: 'COMPLETED' }],
    ] as const) await x.outbox.queueOperation({ operationId, operationType, payload, projectId: 'P1', userId: 'actor' });
    const result = await x.outbox.syncAll(false); expect(result.syncedCount).toBe(3); expect(result.failedCount).toBe(0); expect(result.conflictCount).toBe(0);
    expect(x.store['projects/P1/trips/T1'].status).toBe('COMPLETED'); expect(x.store['projects/P1/trips/T1'].weights.destinationNetKg).toBe(19000); expect(x.store['projects/P1/trips/T1'].financials.isFinalized).toBe(true);
  });
});
