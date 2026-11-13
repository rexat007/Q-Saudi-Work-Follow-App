import {beforeEach,it,expect} from 'vitest';
import {IndexedDBService} from '../services/offline/indexedDB.service';
import {TRIP_COMMANDS} from '../types/tripCommands';
import type {OutboxOperation} from '../types/offline';
let store:IndexedDBService;
const operation=(operationId:string,payload:OutboxOperation['payload']={command:'COMPLETE_TRIP',tripId:'T1',payload:{},expectedRevision:7}):OutboxOperation=>({operationId,deviceId:'DEVICE',projectId:'P1',userId:'OWNER',operationType:'TRIP_COMMAND',payload,status:'PENDING',retryCount:0,createdAt:'2026-01-01T00:00:00Z'});
beforeEach(()=>{store=new IndexedDBService();store.setPrincipalProvider(()=> 'OWNER');});
it.each(Object.keys(TRIP_COMMANDS))('the complete named-command family retains identical retry identity: %s',async command=>{
 const first=operation('FIRST',{command,tripId:'T1',payload:{first:1,second:2},expectedRevision:7});await store.insertOutboxOperation(first);
 const retry=await store.insertOutboxOperation(operation('RETRY',{payload:{second:2,first:1},expectedRevision:7,tripId:'T1',command}));expect(retry.operationId).toBe('FIRST');expect(retry.payload).toEqual(first.payload);
});
it.each(['command','payload','revision','missingRevision','dependency'] as const)('different %s fails explicitly without replacing frozen intent',async field=>{
 const first=operation('FIRST');await store.insertOutboxOperation(first);const changed=operation('OTHER');
 if(field==='command')changed.payload.command='COMPLETE_UNLOADING';if(field==='payload')changed.payload.payload={note:'DIFFERENT'};if(field==='revision')changed.payload.expectedRevision=8;if(field==='missingRevision')delete changed.payload.expectedRevision;if(field==='dependency')changed.dependsOnOperationId='OTHER-PREDECESSOR';
 await expect(store.insertOutboxOperation(changed)).rejects.toMatchObject({code:'OUTBOX_INTENT_CONFLICT',operationId:'FIRST'});expect(await store.getAll('outbox')).toEqual([first]);
});
it('explicit operation-ID retry retains the acknowledged receipt, rejecting a changed envelope',async()=>{
 const first=operation('FIRST');await store.insertOutboxOperation(first);await store.updateOutboxStatus('FIRST','SYNCED',{serverAck:{tripId:'T1'}});
 expect((await store.insertOutboxOperation(first)).serverAck?.tripId).toBe('T1');await expect(store.insertOutboxOperation({...first,payload:{...first.payload,command:'START_LOADING'}})).rejects.toMatchObject({code:'OUTBOX_OPERATION_CONFLICT'});
 await store.updateOutboxStatus('FIRST','FAILED',{errorReason:'STALE'});expect((await store.getById<OutboxOperation>('outbox','FIRST'))?.status).toBe('SYNCED');
});
it('Project and principal lanes are isolated',async()=>{
 const first=operation('FIRST');await store.insertOutboxOperation(first);expect((await store.insertOutboxOperation({...first,operationId:'P2',projectId:'P2'})).operationId).toBe('P2');
 await expect(store.insertOutboxOperation({...first,operationId:'FORGED',userId:'OTHER'})).rejects.toThrow('AUTH_CONTEXT_CHANGED');store.setPrincipalProvider(()=> 'OTHER');expect((await store.insertOutboxOperation({...first,operationId:'OTHER',userId:'OTHER'})).operationId).toBe('OTHER');
});

it('status and save APIs cannot replace a frozen command or downgrade its ACK',async()=>{
 const first=operation('FIRST');await store.insertOutboxOperation(first);
 await expect(store.updateOutboxStatus('FIRST','PENDING',{payload:{...first.payload,command:'START_LOADING'}})).rejects.toMatchObject({code:'OUTBOX_OPERATION_CONFLICT'});
 await store.updateOutboxStatus('FIRST','SYNCED',{serverAck:{tripId:'T1'}});await store.saveOutboxOperation({...first,status:'PENDING'});expect((await store.getById<OutboxOperation>('outbox','FIRST'))?.status).toBe('SYNCED');
});
