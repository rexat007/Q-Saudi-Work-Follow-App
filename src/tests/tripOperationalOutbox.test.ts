import {auth} from '../firebase/config';
import {sendTripCommand} from '../services/tripCommandClient.service';
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
    try { const result = await service.execute('P1', JSON.parse(options.body), actor); return { ok: true, status:200, json: async () => JSON.parse(JSON.stringify({ success: true, ...result })) }; }
    catch (error: any) { return { ok: false, status:403, json: async () => ({ success: false, code: error.code || error.message }) }; }
  });
  vi.stubGlobal('fetch', fetch); return { ...database, fetch, outbox: new OutboxService() };
}
beforeEach(async () => { (auth as any).currentUser={uid:'actor',getIdToken:async()=>'token'}; await indexedDBService.clear('outbox'); await indexedDBService.clear('trips'); await indexedDBService.clear('conflicts'); });
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
  it('another actor cannot see, retry or replay retained legacy intent',async()=>{
    const x=bridge();await x.outbox.queueOperation({projectId:'P1',userId:'actor',operationId:'private-op',operationType:'UPDATE_TRIP_STATUS',payload:{tripId:'T1',status:'AT_DESTINATION'}});(auth as any).currentUser={uid:'other',getIdToken:async()=>'other-token'};expect(await x.outbox.getOperations()).toEqual([]);await x.outbox.retryOperation('private-op');expect((await x.outbox.syncAll()).processedCount).toBe(0);expect(x.fetch).not.toHaveBeenCalled();expect((await indexedDBService.getById<any>('outbox','private-op')).status).toBe('PENDING');
  });
  it('a principal change while obtaining a token cannot send old intent with a new actor',async()=>{
    const x=bridge();(auth as any).currentUser={uid:'actor',getIdToken:async()=>{(auth as any).currentUser={uid:'other'};return 'old-token';}};await expect(sendTripCommand('P1','RECORD_ARRIVAL',{},'stable','T1','actor')).rejects.toThrow('AUTH_CONTEXT_CHANGED');expect(x.fetch).not.toHaveBeenCalled();
  });
  it('a late legacy ACK after logout cannot write a new account cache or clear retained evidence',async()=>{
    const x=bridge();await x.outbox.queueOperation({projectId:'P1',userId:'actor',operationId:'late',operationType:'UPDATE_TRIP_STATUS',payload:{tripId:'T1',status:'AT_DESTINATION'}});vi.stubGlobal('fetch',async()=>{(auth as any).currentUser=null;return {ok:true,json:async()=>({success:true,trip:{tripId:'T1',status:'AT_DESTINATION'}})};});expect((await x.outbox.syncAll()).syncedCount).toBe(0);expect(await indexedDBService.getById('trips','T1')).toBeUndefined();expect((await indexedDBService.getById<any>('outbox','late')).status).toBe('SENDING');
  });

});
