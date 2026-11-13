import {it,expect,vi} from 'vitest';
import {TripCommandsServerService} from '../services/tripCommands.server';
import {emulatorFixture,fleetPayload,operationalDocuments} from './helpers/convergence2Firestore';
import {commandDatabase} from './helpers/commandDatabase';
import {buildPrincipal} from '../utils/principal';
import {reportsEngineService} from '../services/reportsEngine.service';
import {computeMergedTripsFromProjects,computeMergedExceptionsFromProjects} from '../components/reports/ReportsEngineView';
import {ExceptionCommandsServerService} from '../services/exceptionCommands.server';
import {readProjectAudit} from '../services/projectAuditRead.server';

it('retains identical Trip and Exception IDs in distinct canonical scopes',()=>{
  const trip=(projectId:string)=>({projectId,tripId:'SAME'}) as any;
  expect(computeMergedTripsFromProjects({P1:[trip('P1'),trip('P1')],P2:[trip('P2')]})).toHaveLength(2);
  const e=(tripId:string)=>({projectId:'P1',tripId,exceptionId:'SAME'}) as any;
  expect(computeMergedExceptionsFromProjects({P1:[e('T1'),e('T2'),e('T1')]})).toHaveLength(2);
});
it('same-clock concurrent Trips retain distinct durable events',async()=>{
  const docs=operationalDocuments();const trip=(tripId:string)=>({projectId:'P1',tripId,driverId:'DRV',status:'IN_TRANSIT',weights:{originNetKg:20000},financials:{isFinalized:false},pricingSnapshot:{agreedRate:12.5},createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'});
  docs['projects/P1/trips/T1']=trip('T1');docs['projects/P1/trips/T2']=trip('T2');
  const x=commandDatabase(docs),service=new TripCommandsServerService(x.db),actor=buildPrincipal(docs['users/actor'],'actor',{});
  vi.spyOn(Date,'now').mockReturnValue(1767225600000);
  try{await Promise.all(['T1','T2'].map(tripId=>service.execute('P1',{command:'RECORD_ARRIVAL',tripId,operationId:tripId,payload:{}},actor)));expect(Object.keys(x.store).filter(p=>p.includes('/trip_events/'))).toHaveLength(2);}finally{vi.restoreAllMocks();}
});
it('real Firestore lifecycle reconciles snapshots, settlement, receipt replay and rollback',async()=>{
  const f=await emulatorFixture();
  try{
    const service=new TripCommandsServerService(f.db),request={command:'RECORD_LOADING',operationId:'LOAD',expectedRevision:0,payload:{...fleetPayload,originTareKg:10000,originGrossKg:30000}};
    const loaded=await service.execute(f.projectId,request,f.actor);const id=loaded.trip!.tripId;
    expect(loaded.trip!.weights.originNetKg).toBe(20000);expect(loaded.trip!.version).toBe(1);
    const snapshot=structuredClone(loaded.trip!.pricingSnapshot);
    const count=async(kind:string)=>(await f.raw.collection('projects').doc(f.projectId).collection(kind).get()).size;
    const before=[await count('trips'),await count('trip_events'),await count('audit_logs'),await count('sync_operations')];
    const recovered=await service.receipt(f.projectId,request,f.actor);expect(recovered.found).toBe(true);
    await service.execute(f.projectId,request,f.actor);expect([await count('trips'),await count('trip_events'),await count('audit_logs'),await count('sync_operations')]).toEqual(before);
    await f.raw.doc('projects/'+f.projectId+'/pricing_rules/PRICE').update({baseRateSAR:99,rate:99,vatRatePercent:0});
    let version=1;
    const run=async(command:string,payload:any={})=>{const r=await service.execute(f.projectId,{command,tripId:id,operationId:command,expectedRevision:version,payload},f.actor);version++;return r.trip!;};
    await run('RECORD_ARRIVAL');const measured=await run('RECORD_DESTINATION_NET',{destinationNetKg:19000});
    expect(measured.weights.destinationTareKg).toBeUndefined();expect(measured.weights.destinationGrossKg).toBeUndefined();expect(measured.weights.varianceKg).toBe(-1000);
    await run('COMPLETE_UNLOADING');const completed=await run('COMPLETE_TRIP');
    expect(completed.pricingSnapshot.agreedRate).toBe(snapshot.agreedRate);expect(completed.financials).toMatchObject({baseAmountSAR:237.5,subtotalSAR:237.5,vatAmountSAR:35.63,totalAmountSAR:273.13,isFinalized:true,deductionsAmountSAR:0});
    const report=reportsEngineService.computeTripFinancialBreakdown(reportsEngineService.adaptTripEntityToRecord(completed));expect(report.netAmount).toBe(237.5);expect(report.exceptions).toBe(0);
    const countBefore=await count('trip_events');await service.execute(f.projectId,{command:'COMPLETE_TRIP',tripId:id,operationId:'COMPLETE_TRIP',expectedRevision:version-1,payload:{}},f.actor);expect(await count('trip_events')).toBe(countBefore);
    await f.raw.doc('users/'+f.actorId).update({status:'SUSPENDED'});await expect(service.receipt(f.projectId,request,f.actor)).rejects.toThrow();
  }finally{await f.close();}
},60000);
it('real Firestore write failure rolls back the full compound command',async()=>{
  const f=await emulatorFixture();try{
    const broken=new Proxy(f.db,{get(target,key){if(key==='runTransaction')return (work:Function)=>target.runTransaction((tx:any)=>work(new Proxy(tx,{get(t,k){if(k==='set')return (ref:any,...args:any[])=>{if(ref.path.includes('/audit_logs/'))throw Error('INJECTED_PERSISTENCE_FAILURE');return t.set(ref,...args);};const v=t[k];return typeof v==='function'?v.bind(t):v;}})));const v=target[key];return typeof v==='function'?v.bind(target):v;}});
    await expect(new TripCommandsServerService(broken).execute(f.projectId,{command:'RECORD_LOADING',payload:{...fleetPayload,originTareKg:10000,originGrossKg:30000},operationId:'ROLLBACK'},f.actor)).rejects.toThrow('INJECTED_PERSISTENCE_FAILURE');
    for(const collection of ['trips','trip_events','audit_logs','sync_operations','workspace_sync_outbox'])expect((await f.raw.collection('projects').doc(f.projectId).collection(collection).get()).size).toBe(0);
    expect((await f.raw.doc('systemCounters/tripNumber_'+f.projectId).get()).exists).toBe(false);
  }finally{await f.close();}
},60000);
it('canonical exception decisions are current-role scoped, atomic and idempotent',async()=>{
  const f=await emulatorFixture();try{
    const service=new TripCommandsServerService(f.db);const loaded=await service.execute(f.projectId,{command:'RECORD_LOADING',payload:{...fleetPayload,originTareKg:10000,originGrossKg:30000},operationId:'LOAD'},f.actor),tripId=loaded.trip.tripId;
    const request={command:'REPORT_EXCEPTION',tripId,operationId:'EX1',payload:{exceptionId:'EX',type:'WEIGHT_VARIANCE',severity:'HIGH',descriptionAr:'Synthetic exception'}};
    await service.execute(f.projectId,request,f.actor);await expect(service.execute(f.projectId,{...request,operationId:'EX2'},f.actor)).rejects.toHaveProperty('code','TRIP_COMMAND_CONFLICT');
    const decisions=new ExceptionCommandsServerService(f.db),decision={command:'RESOLVE',notes:'Verified canonical evidence',operationId:'DECIDE'};
    await f.raw.doc('users/'+f.actorId).update({role:'SUPERVISOR'});await expect(decisions.execute(f.projectId,tripId,'EX',decision,f.actor)).rejects.toHaveProperty('code','FORBIDDEN_EXCEPTION_DECISION');
    await f.raw.doc('users/'+f.actorId).update({role:'PROJECT_ADMIN'});expect((await decisions.execute(f.projectId,tripId,'EX',decision,f.actor)).exception.status).toBe('RESOLVED');
    const before=(await f.raw.collection('projects').doc(f.projectId).collection('audit_logs').get()).size;
    expect((await decisions.execute(f.projectId,tripId,'EX',decision,f.actor)).idempotentReplay).toBe(true);
    expect((await f.raw.collection('projects').doc(f.projectId).collection('audit_logs').get()).size).toBe(before);
    await expect(decisions.execute(f.projectId,tripId,'EX',{...decision,operationId:'OTHER',command:'REJECT'},f.actor)).rejects.toHaveProperty('code','EXCEPTION_ALREADY_DECIDED');
    const audit=await readProjectAudit(f.projectId,f.actor,{},f.db);expect(audit.auditLogs.length).toBeGreaterThan(0);expect(audit.auditLogs.every((r:any)=>r.projectId===f.projectId)).toBe(true);
    await f.raw.doc('users/'+f.actorId).update({role:'VIEWER'});await expect(readProjectAudit(f.projectId,f.actor,{},f.db)).rejects.toHaveProperty('code','FORBIDDEN_AUDIT_ACCESS');
  }finally{await f.close();}
},60000);
it.each([-1,NaN,Infinity])('rejects invalid origin tare %s without a mutation',async value=>{
  const f=await emulatorFixture();try{await expect(new TripCommandsServerService(f.db).execute(f.projectId,{command:'RECORD_LOADING',operationId:'INVALID',payload:{...fleetPayload,originTareKg:value,originGrossKg:20000}},f.actor)).rejects.toHaveProperty('code','INVALID_TRIP_COMMAND');expect((await f.raw.collection('projects').doc(f.projectId).collection('trips').get()).empty).toBe(true);}finally{await f.close();}
},30000);
it('real Firestore rejects stale concurrent revisions and cross-Project scope',async()=>{
  const f=await emulatorFixture();try{
    const service=new TripCommandsServerService(f.db);const loaded=await service.execute(f.projectId,{command:'RECORD_LOADING',payload:{...fleetPayload,originTareKg:0,originGrossKg:20000},operationId:'LOAD'},f.actor);
    expect(loaded.trip!.weights.originTareKg).toBe(0);
    const commands=['A','B'].map(operationId=>service.execute(f.projectId,{command:'RECORD_ARRIVAL',tripId:loaded.trip!.tripId,payload:{},expectedRevision:1,operationId},f.actor));
    const results=await Promise.allSettled(commands);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect((results.find(r=>r.status==='rejected') as PromiseRejectedResult).reason.code).toBe('TRIP_REVISION_CONFLICT');
    await expect(service.execute('OTHER',{command:'DISPATCH_TRIP',payload:fleetPayload,operationId:'OTHER'},f.actor)).rejects.toHaveProperty('code','FORBIDDEN_PROJECT_ACCESS');
  }finally{await f.close();}
},60000);

it.each(['DIRECT','WEIGHT','ACCEPT_ORIGIN_NET'])('real measurement provenance and settlement: %s',async mode=>{
 const f=await emulatorFixture();try{
  const service=new TripCommandsServerService(f.db),loaded=await service.execute(f.projectId,{command:'RECORD_LOADING',operationId:'LOAD',payload:{...fleetPayload,originTareKg:10000,originGrossKg:30000}},f.actor),tripId=loaded.trip.tripId;
  const run=async(command:string,payload:any={})=>(await service.execute(f.projectId,{command,tripId,payload,operationId:command},f.actor)).trip;
  await run('RECORD_ARRIVAL');
  const measured=await run(mode==='DIRECT'?'RECORD_DESTINATION_NET':mode==='WEIGHT'?'RECORD_DESTINATION_WEIGHT':'ACCEPT_ORIGIN_NET',mode==='DIRECT'?{destinationNetKg:19000}:mode==='WEIGHT'?{destinationTareKg:0,destinationGrossKg:19000}:{});
  expect(measured.weights.destinationNetKg).toBe(mode==='ACCEPT_ORIGIN_NET'?20000:19000);
  if(mode==='WEIGHT'){expect(measured.weights.destinationTareKg).toBe(0);expect(measured.weights.destinationGrossKg).toBe(19000);}else{expect(measured.weights.destinationTareKg).toBeUndefined();expect(measured.weights.destinationGrossKg).toBeUndefined();}
  await run('COMPLETE_UNLOADING');const done=await run('COMPLETE_TRIP');
  expect(done.financials.totalAmountSAR).toBe(mode==='ACCEPT_ORIGIN_NET'?287.5:273.13);
  expect(done.pricingSnapshot.pricingSnapshotAt).toEqual(loaded.trip.pricingSnapshot.pricingSnapshotAt);
  expect(done.pricingSnapshot.pricingRuleVersion).toEqual(loaded.trip.pricingSnapshot.pricingRuleVersion);
  const record=reportsEngineService.adaptTripEntityToRecord(done);expect(record.unloadDecision).toBe(done.unloadDecision);
  expect(reportsEngineService.computeTripFinancialBreakdown(record).netAmount).toBe(mode==='ACCEPT_ORIGIN_NET'?250:237.5);
 }finally{await f.close();}
},60000);
it('import net-only and zero evidence never fabricates gross/tare or finalized missing pricing',async()=>{
 const f=await emulatorFixture();try{
  const service=new TripCommandsServerService(f.db);
  const result=await service.execute(f.projectId,{command:'IMPORT_TRIP',operationId:'IMPORT-ZERO',payload:{...fleetPayload,pricingRuleId:undefined,pricingMode:'PENDING',sourceType:'CSV',operationalData:{netWeightKg:0,destinationNetWeightKg:0,legacyStatus:'COMPLETED'}}},f.actor);
  expect(result.trip.weights.originNetKg).toBe(0);expect(result.trip.weights.destinationNetKg).toBe(0);expect(result.trip.weights.originTareKg).toBeUndefined();expect(result.trip.weights.originGrossKg).toBeUndefined();expect(result.trip.financials.isFinalized).toBe(false);
  expect(reportsEngineService.computeTripFinancialBreakdown(reportsEngineService.adaptTripEntityToRecord(result.trip)).isPending).toBe(true);
 }finally{await f.close();}
},60000);
it('current persisted roles fence receipt reads for all nine roles with no business effects',async()=>{
 const f=await emulatorFixture();try{
  const service=new TripCommandsServerService(f.db),allowed=['SUPER_ADMIN','PROJECT_ADMIN','DISPATCHER','SUPERVISOR','SITE_SUPERVISOR'];
  for(const role of [...allowed,'SCALE_OPERATOR','DRIVER','FINANCE_AUDITOR','VIEWER']){
   await f.raw.doc('users/'+f.actorId).update({role});
   const request=service.receipt(f.projectId,{command:'DISPATCH_TRIP',operationId:'NO-RECEIPT',payload:fleetPayload},f.actor);
   if(allowed.includes(role))expect(await request).toEqual({found:false});else await expect(request).rejects.toHaveProperty('code','FORBIDDEN_TRIP_ACTION');
  }
  expect((await f.raw.collection('projects').doc(f.projectId).collection('trips').get()).size).toBe(0);
 }finally{await f.close();}
},60000);
