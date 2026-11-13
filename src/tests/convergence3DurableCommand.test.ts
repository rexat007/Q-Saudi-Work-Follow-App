import {beforeEach,it,expect,vi} from 'vitest';
import type {OutboxOperation} from '../types/offline';
const state=vi.hoisted(()=>({operations:[] as any[],sync:vi.fn(),queue:vi.fn(),retry:vi.fn()}));
vi.mock('../services/offline/outbox.service',()=>({outboxService:{getOperations:async()=>state.operations,syncAll:state.sync,queueOperation:state.queue,retryOperation:state.retry}}));
import {durableTripCommand,recoverTripOperation} from '../services/durableTripCommandClient.service';
const captured:OutboxOperation={operationId:'FROZEN',deviceId:'SYNTHETIC-DEVICE',operationType:'TRIP_COMMAND',projectId:'P1',userId:'OWNER',payload:{command:'COMPLETE_TRIP',payload:{},tripId:'T1',expectedRevision:7},status:'AWAITING_RECEIPT',retryCount:1,createdAt:'2026-01-01T00:00:00Z'};
beforeEach(()=>{vi.resetAllMocks();state.operations=[];});
it('recovery uses the captured identity when another tab already persisted its ACK; never allocates another command',async()=>{
 const trip={tripId:'T1',projectId:'P1',version:8};state.operations=[{...captured,status:'SYNCED',serverAck:{canonicalTrip:trip}}];
 expect(await recoverTripOperation(captured,'OWNER')).toEqual({trip,operationId:'FROZEN'});expect(state.queue).not.toHaveBeenCalled();expect(state.sync).toHaveBeenCalledWith(false,'P1');
});
it('missing durable receipt cannot become a successful recovery or replacement command',async()=>{
 await expect(recoverTripOperation(captured,'OWNER')).rejects.toMatchObject({code:'RECEIPT_REQUIRED',operationId:'FROZEN'});expect(state.queue).not.toHaveBeenCalled();
});
it('a different principal cannot recover the captured operation',async()=>{
 await expect(recoverTripOperation(captured,'OTHER')).rejects.toThrow('INVALID_OUTBOX_RECOVERY');expect(state.sync).not.toHaveBeenCalled();expect(state.queue).not.toHaveBeenCalled();
});
it('explicit recovery can reopen the bounded retry budget while retaining the same operation identity',async()=>{
 state.operations=[{...captured,status:'SYNCED',serverAck:{canonicalTrip:{tripId:'T1',projectId:'P1'}}}];
 await recoverTripOperation({...captured,retryCount:5},'OWNER');expect(state.retry).toHaveBeenCalledWith('FROZEN');expect(state.queue).not.toHaveBeenCalled();
});

it('a new intent cannot silently reuse an unresolved resource or trigger synchronization',async()=>{
 state.operations=[captured];state.queue.mockRejectedValue(Object.assign(Error('OUTBOX_INTENT_CONFLICT'),{code:'OUTBOX_INTENT_CONFLICT'}));
 await expect(durableTripCommand('P1','OWNER','START_LOADING',{},'T1',7)).rejects.toMatchObject({code:'OUTBOX_INTENT_CONFLICT'});expect(state.queue).toHaveBeenCalledOnce();expect(state.sync).not.toHaveBeenCalled();
});
it('an explicit identical retry reuses its durable acknowledged operation',async()=>{
 const trip={tripId:'T1',projectId:'P1',version:8},ack={...captured,status:'SYNCED',serverAck:{canonicalTrip:trip}};state.operations=[ack];state.queue.mockResolvedValue(ack);
 expect(await durableTripCommand('P1','OWNER','COMPLETE_TRIP',{},'T1',7,'FROZEN')).toEqual({trip,operationId:'FROZEN'});expect(state.queue).toHaveBeenCalledWith(expect.objectContaining({operationId:'FROZEN'}));
});
it('a changed captured recovery envelope is rejected before retry/status or network effects',async()=>{
 state.operations=[captured];await expect(recoverTripOperation({...captured,retryCount:5,payload:{...captured.payload,expectedRevision:8}},'OWNER')).rejects.toMatchObject({code:'OUTBOX_INTENT_CONFLICT'});expect(state.retry).not.toHaveBeenCalled();expect(state.sync).not.toHaveBeenCalled();
});
