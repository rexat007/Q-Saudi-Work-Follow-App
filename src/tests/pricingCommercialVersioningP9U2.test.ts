import {describe,it,expect,beforeEach} from 'vitest';
import {ProjectPricingServerService} from '../services/projectPricing.server';
import {TripCommandsServerService} from '../services/tripCommands.server';
import {ServerTripPersistenceAdapter} from '../services/canonicalTripPersistence.server';
import {commandDatabase,accountProfile} from './helpers/commandDatabase';
import {buildPrincipal} from '../utils/principal';
import {commercialTotals,PricingService,pricingService} from '../services/pricing.service';
import {reportsEngineService} from '../services/reportsEngine.service';
import {readinessPricing} from '../services/projectReadiness.service';
function fixture(){const profile=accountProfile('PROJECT_ADMIN');const x=commandDatabase({'users/actor':profile});return {...x,actor:buildPrincipal(profile,'actor',{}),service:new TripCommandsServerService(x.db)};}
function dispatchGraph(x: ReturnType<typeof fixture>) {
  Object.assign(x.store, {
    'projects/P1': { projectId: 'P1', projectNumber: 1, nameAr: 'Project', nameEn: 'Project', status: 'ACTIVE' },
    'carriers/CAR': { carrierId: 'CAR', nameAr: 'Carrier', status: 'ACTIVE' },
    'trucks/TRK': { truckId: 'TRK', plate: 'ABC', status: 'ACTIVE', tareWeightKg: 10000 },
    'drivers/DRV-A': { driverId: 'DRV-A', fullNameAr: 'Driver', nationalId: '1234567890', status: 'ACTIVE' },
    'materials/MAT': { materialId: 'MAT', nameAr: 'Material', unitOfMeasure: 'TON', status: 'ACTIVE' },
    'projects/P1/pricing_rules/PRICE': { pricingRuleId: 'PRICE', projectId: 'P1', carrierId: 'CAR', materialId: 'MAT', status: 'ACTIVE', pricingModel: 'PER_TON', baseRateSAR: 10, effectiveFrom:'2020-01-01' },
    'projects/P1/driver_active_assignments/DRV-A': { assignmentId: 'ASG' },
    'projects/P1/truck_active_assignments/TRK': { assignmentId: 'ASG' },
    'projects/P1/driver_truck_assignments/ASG': { assignmentId: 'ASG', projectId: 'P1', driverId: 'DRV-A', truckId: 'TRK', status: 'ACTIVE', effectiveFrom: '2020-01-01T00:00:00Z', effectiveTo: null },
    'projects/P1/truck_active_material_allocations/TRK': { allocationId: 'ALC' },
    'projects/P1/truck_material_allocations/ALC': { allocationId: 'ALC', projectId: 'P1', truckId: 'TRK', materialId: 'MAT', status: 'ACTIVE', effectiveFrom: '2020-01-01T00:00:00Z', effectiveTo: null },
  });
  for (const [kind, id] of [['carrier', 'CAR'], ['truck', 'TRK'], ['driver', 'DRV-A'], ['material', 'MAT']])
    x.store[`projects/P1/${kind}_memberships/${id}`] = { [`${kind}Id`]: id, projectId: 'P1', status: 'ACTIVE' };
  for (const [kind, id] of [['driver', 'DRV-A'], ['truck', 'TRK']])
    x.store[`projects/P1/${kind}_carrier_affiliations/${id}`] = { [`${kind}Id`]: id, projectId: 'P1', carrierId: 'CAR', status: 'ACTIVE' };
}

let x:ReturnType<typeof fixture>, prices:ProjectPricingServerService;
const rule=(id='PRICE',rate=10,extra:any={})=>({pricingRuleId:id,carrierId:'CAR',materialId:'MAT',pricingModel:'PER_TON',baseRateSAR:rate,effectiveFrom:'2020-01-01',currency:'SAR',...extra});
const payload={carrierId:'CAR',driverId:'DRV-A',truckId:'TRK',materialId:'MAT',pricingRuleId:'PRICE'};
beforeEach(()=>{x=fixture();dispatchGraph(x);delete x.store['projects/P1/pricing_rules/PRICE'];prices=new ProjectPricingServerService(x.db);});
describe('P9-U2 commercial versions and financial history',()=>{
 async function used(){await prices.createPricingRule('P1',rule(),x.actor);return (await x.service.execute('P1',{command:'RECORD_LOADING',payload:{...payload,originTareKg:10000,originGrossKg:30000},operationId:'trip-a'},x.actor)).trip;}
 async function finish(t:any){for(const command of ['RECORD_ARRIVAL','ACCEPT_ORIGIN_NET','COMPLETE_UNLOADING','COMPLETE_TRIP'] as const)t=(await x.service.execute('P1',{command,tripId:t.tripId,payload:{},operationId:t.tripId+'-'+command},x.actor)).trip;return t;}
 it('future COW preserves immutable predecessor terms, serves old date and switches exactly at UTC midnight',async()=>{
  await used();const before=structuredClone(x.store['projects/P1/pricing_rules/PRICE']);
  const next=await prices.savePricingRule('P1','PRICE',{baseRateSAR:20,effectiveFrom:'2031-01-01',expectedVersion:1},x.actor);
  expect(next.pricingRuleId).not.toBe('PRICE');expect(next.parentRuleId).toBe('PRICE');expect(next.version).toBe(2);
  const previous=x.store['projects/P1/pricing_rules/PRICE'];for(const k of ['baseRateSAR','effectiveFrom','effectiveTo','vatApplicable','demurrageRatePerHourSAR'])expect(previous[k]).toEqual(before[k]);
  expect(previous.supersededByRuleId).toBe(next.pricingRuleId);
  expect((await prices.resolvePricing('P1','CAR','MAT','2030-12-31T23:59:59.999Z')).pricingRuleId).toBe('PRICE');
  expect((await prices.resolvePricing('P1','CAR','MAT','2031-01-01T00:00:00Z')).pricingRuleId).toBe(next.pricingRuleId);
 });
 it('Trip A financials and snapshot survive V2 activation and reopening; new Trip B uses V2',async()=>{
  let a=await used();a=await finish(a);const original=structuredClone(a);
  const next=await prices.savePricingRule('P1','PRICE',{baseRateSAR:20,effectiveFrom:new Date().toISOString().slice(0,10),expectedVersion:1},x.actor);
  const reopened=await new ServerTripPersistenceAdapter(x.db).tripRepository.findById('P1',a.tripId);
  expect(reopened!.financials).toEqual(original.financials);expect(reopened!.pricingSnapshot).toEqual(original.pricingSnapshot);
  const b=await x.service.execute('P1',{command:'DISPATCH_TRIP',payload:{...payload,pricingRuleId:next.pricingRuleId},operationId:'trip-b'},x.actor);expect(b.trip.pricingSnapshot.agreedRate).toBe(20);expect(b.trip.pricingSnapshot.pricingRuleVersion).toBe(2);
 });
 it('deactivate and reactivate alter only future resolution, not stored Trip evidence',async()=>{
  const a=await used(),before=structuredClone(a.pricingSnapshot);
  await prices.savePricingRule('P1','PRICE',{status:'INACTIVE',expectedVersion:1},x.actor);
  await expect(prices.resolvePricing('P1','CAR','MAT','2026-10-29')).rejects.toThrow();
  await prices.savePricingRule('P1','PRICE',{status:'ACTIVE',expectedVersion:2},x.actor);
  expect((await prices.resolvePricing('P1','CAR','MAT','2026-10-29')).pricingRuleId).toBe('PRICE');
  expect(x.store['projects/P1/trips/'+a.tripId].pricingSnapshot).toEqual(before);
 });
 it('deactivated successor never falls back to superseded predecessor',async()=>{await used();const n=await prices.savePricingRule('P1','PRICE',{baseRateSAR:20,effectiveFrom:'2031-01-01',expectedVersion:1},x.actor);await prices.savePricingRule('P1',n.pricingRuleId,{status:'INACTIVE',expectedVersion:2},x.actor);await expect(prices.resolvePricing('P1','CAR','MAT','2031-01-02')).rejects.toThrow();});
 it('safe unused edit stays on same identity',async()=>{await prices.createPricingRule('P1',rule(),x.actor);const n=await prices.savePricingRule('P1','PRICE',{baseRateSAR:20,expectedVersion:1},x.actor);expect(n.pricingRuleId).toBe('PRICE');expect(n.version).toBe(2);expect(n.parentRuleId).toBeUndefined();});
 it('concurrent replacements produce one successor and reject the stale contender',async()=>{await used();const results=await Promise.allSettled([20,30].map(baseRateSAR=>prices.savePricingRule('P1','PRICE',{baseRateSAR,effectiveFrom:'2031-01-01',expectedVersion:1},x.actor)));expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect((results.find(r=>r.status==='rejected') as PromiseRejectedResult).reason.message).toBe('PRICING_VERSION_CONFLICT');expect(Object.keys(x.store).filter(k=>k.includes('/pricing_rules/'))).toHaveLength(2);});
 it('rollback leaves no successor, cutoff or audit if a transaction write fails',async()=>{await used();const old=structuredClone(x.store);x.failWrites('audit_logs');await expect(prices.savePricingRule('P1','PRICE',{baseRateSAR:20,effectiveFrom:'2031-01-01',expectedVersion:1},x.actor)).rejects.toThrow('simulated write failure');expect(x.store).toEqual(old);});
 it('replacement refuses carrier/material identity reassignment',async()=>{await used();x.store['materials/M2']={materialId:'M2',status:'ACTIVE'};x.store['projects/P1/material_memberships/M2']={projectId:'P1',materialId:'M2',status:'ACTIVE'};await expect(prices.savePricingRule('P1','PRICE',{materialId:'M2',effectiveFrom:'2031-01-01',expectedVersion:1},x.actor)).rejects.toThrow('PRICING_REPLACEMENT_IDENTITY_MISMATCH');});
 it.each(['2020-01-01','2031-01-01T12:00:00Z'])('replacement rejects ambiguous/old boundary %s',async date=>{await used();await expect(prices.savePricingRule('P1','PRICE',{baseRateSAR:20,effectiveFrom:date,expectedVersion:1},x.actor)).rejects.toThrow('INVALID_REPLACEMENT_BOUNDARY');});
 it('cannot branch a predecessor into multiple successors',async()=>{await used();await prices.savePricingRule('P1','PRICE',{baseRateSAR:20,effectiveFrom:'2031-01-01',expectedVersion:1},x.actor);await expect(prices.savePricingRule('P1','PRICE',{baseRateSAR:30,effectiveFrom:'2032-01-01',expectedVersion:2},x.actor)).rejects.toThrow('PRICING_RULE_ALREADY_REPLACED');});
 it('existing active future competitor blocks replacement without partial changes',async()=>{await used();x.store['projects/P1/pricing_rules/CONFLICT']={...x.store['projects/P1/pricing_rules/PRICE'],pricingRuleId:'CONFLICT',effectiveFrom:'2031-01-01'};const old=structuredClone(x.store);await expect(prices.savePricingRule('P1','PRICE',{baseRateSAR:20,effectiveFrom:'2031-01-01',expectedVersion:1},x.actor)).rejects.toThrow('PRICING_OVERLAP');expect(x.store).toEqual(old);});
 it.each([{baseRateSAR:20,effectiveFrom:'2031-01-01'},{status:'INACTIVE'},{status:'ACTIVE'}])('canonical non-admin cannot mutate %j',async patch=>{await used();x.store['users/actor'].role='DISPATCHER';await expect(prices.savePricingRule('P1','PRICE',{...patch,expectedVersion:1},x.actor)).rejects.toThrow('FORBIDDEN_PRICING_ACTION');await expect(prices.createPricingRule('P1',rule('X'),x.actor)).rejects.toThrow('FORBIDDEN_PRICING_ACTION');});
 it('replacement cannot read or write across Project scope',async()=>{await used();x.store['projects/P2']={projectId:'P2',status:'ACTIVE'};await expect(prices.savePricingRule('P2','PRICE',{baseRateSAR:20,effectiveFrom:'2031-01-01',expectedVersion:1},x.actor)).rejects.toThrow();expect(Object.keys(x.store).some(p=>p.startsWith('projects/P2/pricing_rules'))).toBe(false);});
 it('version audit records actor/project/full predecessor and successor with effective boundary',async()=>{await used();const n=await prices.savePricingRule('P1','PRICE',{baseRateSAR:20,effectiveFrom:'2031-01-01',expectedVersion:1},x.actor);const a:any=Object.values(x.store).find((a:any)=>a.action==='UPDATE'&&a.changes?.after?.supersededByRuleId);expect(a.projectId).toBe('P1');expect(a.actor.userId).toBe('actor');expect(a.changes.before.baseRateSAR).toBe(10);expect(a.changes.after.supersededByRuleId).toBe(n.pricingRuleId);expect(a.changes.after.supersededFrom).toBe('2031-01-01');const successorAudit:any=Object.values(x.store).find((v:any)=>v.entityId===n.pricingRuleId&&v.action==='CREATE');expect(successorAudit.changes.after.parentRuleId).toBe('PRICE');expect(successorAudit.correlationId).toBe(a.correlationId);expect(a.createdAt).toBeTruthy();});
 it.each(['PER_TON','PER_TRIP'])('server completion uses supported model %s with fixed tax and waiting terms',async model=>{await prices.createPricingRule('P1',rule('PRICE',10,{pricingModel:model,vatRatePercent:20}),x.actor);let t=(await x.service.execute('P1',{command:'RECORD_LOADING',payload:{...payload,originTareKg:10000,originGrossKg:30000},operationId:'priced-load'},x.actor)).trip;t=await finish(t);const amount=model==='PER_TON'?200:10;expect(t.financials.baseAmountSAR).toBe(amount);expect(t.financials.vatAmountSAR).toBe(amount*.2);expect(t.financials.totalAmountSAR).toBe(amount*1.2);expect(t.pricingSnapshot.vatRatePercent).toBe(20);expect(t.pricingSnapshot.demurrageRatePerHourSAR).toBe(50);});
 it('later tax and waiting configuration cannot reprice a historical financial result',async()=>{await prices.createPricingRule('P1',rule('PRICE',10,{vatRatePercent:20,demurrageRatePerHourSAR:60,freeTimeHours:3}),x.actor);let a=(await x.service.execute('P1',{command:'RECORD_LOADING',payload:{...payload,originTareKg:10000,originGrossKg:30000},operationId:'tax-load'},x.actor)).trip;a=await finish(a);const before=structuredClone(a);await prices.savePricingRule('P1','PRICE',{vatApplicable:false,vatRatePercent:0,demurrageRatePerHourSAR:100,freeTimeHours:1,effectiveFrom:new Date().toISOString().slice(0,10),expectedVersion:1},x.actor);const after=await new ServerTripPersistenceAdapter(x.db).tripRepository.findById('P1',a.tripId);expect(after!.financials).toEqual(before.financials);expect(after!.pricingSnapshot).toEqual(before.pricingSnapshot);});
 it('commercial totals use stored terms and round subtotal then VAT, not mutable settings',()=>{expect(commercialTotals(10.01,{vatApplicable:true,vatRatePercent:15},2.02,.02)).toEqual({subtotalSAR:12.01,vatAmountSAR:1.8,totalAmountSAR:13.81});expect(commercialTotals(10,{vatApplicable:true,vatRatePercent:0})).toEqual({subtotalSAR:10,vatAmountSAR:0,totalAmountSAR:10});expect(()=>commercialTotals(10,{vatApplicable:true,vatRatePercent:NaN})).toThrow('INVALID_COMMERCIAL_TERMS');});
 it('legacy aliases read and edit only through canonical policy; unsupported model fails closed',async()=>{x.store['projects/P1/pricing_rules/OLD']={...rule('OLD'),projectId:'P1',status:'ACTIVE',rate:10,pricingType:'PER_TON'};delete x.store['projects/P1/pricing_rules/OLD'].baseRateSAR;delete x.store['projects/P1/pricing_rules/OLD'].pricingModel;const edited=await prices.savePricingRule('P1','OLD',{baseRateSAR:20,expectedVersion:1},x.actor);expect(edited.pricingModel).toBe('PER_TON');expect((await prices.resolvePricing('P1','CAR','MAT','2026-10-29')).rate).toBe(20);await expect(prices.createPricingRule('P1',rule('BAD',10,{pricingModel:'PER_KM'}),x.actor)).rejects.toThrow('UNSUPPORTED_PRICING_MODEL');});
 it('list usage is a server projection rather than a client authority claim',async()=>{await used();expect((await prices.listPricingRules('P1',x.actor))[0].hasHistoricalTrips).toBe(true);await expect(prices.savePricingRule('P1','PRICE',{hasHistoricalTrips:false,baseRateSAR:30,expectedVersion:1},x.actor)).rejects.toThrow('INVALID_PRICING_COMMAND');});
 it('minimum billed weight is captured and applied by the shared server policy after weighing',async()=>{await prices.createPricingRule('P1',rule('PRICE',10,{minimumBillableWeightKg:30000}),x.actor);let t=(await x.service.execute('P1',{command:'RECORD_LOADING',payload:{...payload,originTareKg:10000,originGrossKg:30000},operationId:'minimum-load'},x.actor)).trip;expect(t.pricingSnapshot.minimumBillableWeightKg).toBe(30000);t=await finish(t);expect(t.pricingSnapshot.settlementBase).toBe(30);expect(t.financials.baseAmountSAR).toBe(300);expect(t.weights.billableWeightKg).toBe(20000);});
 it('invalid stored tax/adjustment configuration fails before a new Trip snapshot',async()=>{await prices.createPricingRule('P1',rule(),x.actor);x.store['projects/P1/pricing_rules/PRICE'].vatRatePercent='20';expect(readinessPricing(await prices.listPricingRules('P1',x.actor),'P1','CAR','MAT',new Date('2026-10-29')).reasonCode).toBe('INVALID_COMMERCIAL_TERMS');await expect(prices.resolvePricing('P1','CAR','MAT','2026-10-29')).rejects.toThrow('INVALID_COMMERCIAL_TERMS');});

 it('legacy used-rule status changes preserve absent historical terms and normalize only equivalent aliases',async()=>{x.store['projects/P1/pricing_rules/LEGACY']={pricingRuleId:'LEGACY',projectId:'P1',carrierId:'CAR',materialId:'MAT',pricingType:'PER_TON',rate:10,effectiveFrom:'2020-01-01',status:'ACTIVE'};x.store['projects/P1/trips/HISTORY']={pricingRuleId:'LEGACY'};const changed=await prices.savePricingRule('P1','LEGACY',{status:'INACTIVE',expectedVersion:1},x.actor);expect(changed.status).toBe('INACTIVE');expect(changed.baseRateSAR).toBe(10);expect(changed.demurrageRatePerHourSAR).toBeUndefined();expect(changed.vatApplicable).toBeUndefined();});

 it('legacy general-material sentinel normalizes to the same specificity and cannot bypass overlap',async()=>{x.store['projects/P1/pricing_rules/LEGACY']={...rule('LEGACY'),projectId:'P1',materialId:'ALL_MATERIALS',status:'ACTIVE'};expect((await prices.resolvePricing('P1','CAR','MAT','2026-10-29')).pricingRuleId).toBe('LEGACY');await expect(prices.createPricingRule('P1',rule('GENERAL',20,{materialId:undefined}),x.actor)).rejects.toThrow('PRICING_OVERLAP');});

});
