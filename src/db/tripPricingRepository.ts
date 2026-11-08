import {randomUUID} from 'node:crypto';
import type {UnitOfWork} from './unitOfWork.js';
import type {CanonicalIdentityRepository} from './canonicalIdentityRepository.js';
import {PricingService,pricingInstant,canonicalPricingDate} from '../services/pricing.service';
import {assertFoundationMutation} from '../services/projectMutability.policy';
import {PricingRuleValidator} from '../validators/pricingRule.validator';
import {tripFail,tripId,decimal,exactTrip} from './tripContracts.js';
const policy=new PricingService();
const general=(v:any)=>['ALL','ALL_MATERIALS','GENERAL','*','',null,undefined].includes(v)?null:v;
const pricingView=(r:any)=>({...r.commercial_terms,...Object.fromEntries(['minimumBillableWeightKg','demurrageRatePerHourSAR','freeTimeHours','vatRatePercent'].filter(k=>r.commercial_terms[k]!==undefined).map(k=>[k,Number(r.commercial_terms[k])])),rate:Number(r.rate),version:Number(r.version),status:r.status,supersededFrom:r.superseded_from?new Date(r.superseded_from).toISOString():undefined});
const eq=(a:any,b:any)=>JSON.stringify(a??null)===JSON.stringify(b??null);
export class TripPricingRepository {
 constructor(private uow:UnitOfWork,private identities:CanonicalIdentityRepository){}
 async participant(kind:'CARRIER'|'MATERIAL',id:string){
  const e=await this.identities.get(kind,id,true),table=kind==='CARRIER'?'project_carriers':'project_materials',field=kind==='CARRIER'?'carrier_id':'material_id';
  const m=(await this.uow.query(`SELECT status FROM ${table} WHERE company_id=$1 AND project_id=$2 AND ${field}=$3 AND valid_period @> clock_timestamp() FOR SHARE`,[this.uow.context.companyId,this.uow.context.projectId,e.id])).rows[0];
  if(e.status!=='ACTIVE'||m?.status!=='ACTIVE')tripFail('PRICING_PARTICIPATION_REQUIRED');return e;
 }
 async resolve(carrier:string,material:string,at:string,requestedId?:string){
  const c=await this.participant('CARRIER',carrier),m=await this.participant('MATERIAL',material),instant=pricingInstant(at);if(instant===undefined)tripFail('INVALID_TRIP_DATE');
  const rows=(await this.uow.query(`SELECT * FROM pricing_rules WHERE company_id=$1 AND project_id=$2 AND carrier_id=$3
   AND (material_id=$4 OR material_id IS NULL) AND commercial_terms IS NOT NULL AND effective_period @> $5::timestamptz ORDER BY external_id LIMIT 129`,[this.uow.context.companyId,this.uow.context.projectId,c.id,m.id,new Date(instant).toISOString()])).rows;
  if(rows.length>128)tripFail('PRICING_CANDIDATE_BUDGET');
  const project=(await this.uow.query('SELECT external_id FROM projects WHERE company_id=$1 AND id=$2',[this.uow.context.companyId,this.uow.context.projectId])).rows[0];
  const resolved=policy.resolvePricingRuleFromList(rows.map(pricingView),{projectId:project.external_id,carrierId:carrier,materialId:material,tripDate:at});
  if(resolved.status!=='RESOLVED')tripFail(resolved.reasonCode||'MISSING_PRICING');
  if(requestedId&&requestedId!==resolved.selectedRule!.pricingRuleId)tripFail('PRICING_SELECTION_MISMATCH');
  const row=rows.find(r=>r.external_id===resolved.selectedRule!.pricingRuleId)!;
  const revision=(await this.uow.query('SELECT * FROM pricing_rule_revisions WHERE company_id=$1 AND project_id=$2 AND rule_id=$3 AND commercial_revision=$4',[this.uow.context.companyId,this.uow.context.projectId,row.id,row.version])).rows[0];
  if(!revision||revision.rate!==row.rate||revision.terms?.pricingRuleId!==row.external_id||!eq(revision.terms,row.commercial_terms))tripFail('PRICING_VERSION_UNVERIFIED');return {row,revision,terms:revision.terms};
 }
 async save(raw:any,actor:string,requested?:string){
  exactTrip(raw,['pricingRuleId','expectedVersion','carrierId','materialId','name','notes','pricingType','pricingModel','rate','baseRateSAR','currency','effectiveFrom','effectiveTo','status','isActive','minimumBillableWeightKg','demurrageRatePerHourSAR','freeTimeHours','vatApplicable','vatRatePercent']);
  const scope=[this.uow.context.companyId,this.uow.context.projectId];
  const old=requested?(await this.uow.query('SELECT * FROM pricing_rules WHERE company_id=$1 AND project_id=$2 AND external_id=$3 FOR UPDATE',[...scope,requested])).rows[0]:null;
  if(requested&&!old)tripFail('PRICING_RULE_NOT_FOUND');if(old&&!old.commercial_terms)tripFail('PRICING_LEGACY_RECONCILIATION_REQUIRED');if(old&&Number(old.version)!==raw.expectedVersion)tripFail('PRICING_VERSION_CONFLICT');
  const prior=old?.commercial_terms||{},input={...prior,...raw},external=requested||raw.pricingRuleId;
  if(!tripId(external)||!tripId(input.carrierId))tripFail('INVALID_PRICING_IDENTITY');
  const material=general(input.materialId);if(material!==null&&!tripId(material))tripFail('INVALID_PRICING_IDENTITY');
  const from=canonicalPricingDate(input.effectiveFrom),to=input.effectiveTo?canonicalPricingDate(input.effectiveTo):null;
  if(!from||input.effectiveTo&&!to||to&&pricingInstant(to,true)!<pricingInstant(from)!)tripFail('INVALID_PRICING_DATE');
  const rate=decimal(raw.baseRateSAR??raw.rate??prior.rate,4),model=raw.pricingModel??raw.pricingType??prior.pricingType;
  if(!['PER_TRIP','PER_TON'].includes(model))tripFail('UNSUPPORTED_PRICING_MODEL');
  const status=raw.status??(raw.isActive===undefined?old?.status||'ACTIVE':raw.isActive?'ACTIVE':'INACTIVE');if(!['ACTIVE','INACTIVE'].includes(status))tripFail('INVALID_PRICING_STATUS');
  const currency=input.currency||'SAR';if(typeof currency!=='string'||currency.length<2||currency.length>8)tripFail('INVALID_CURRENCY');
  if(input.vatApplicable!==undefined&&typeof input.vatApplicable!=='boolean')tripFail('INVALID_COMMERCIAL_TERMS');
  const project=(await this.uow.query('SELECT external_id,status FROM projects WHERE company_id=$1 AND id=$2',scope)).rows[0];
  for(const key of ['name','notes'])if(input[key]!==undefined&&(typeof input[key]!=='string'||input[key].length>(key==='name'?256:2000)))tripFail('INVALID_PRICING_RULE');
  const terms:any={pricingRuleId:external,projectId:project.external_id,name:input.name?.trim()||external,notes:input.notes?.trim()||undefined,
   carrierId:input.carrierId,materialId:material,pricingType:model,rate,currency,effectiveFrom:from,effectiveTo:to,
   minimumBillableWeightKg:input.minimumBillableWeightKg===undefined?undefined:decimal(input.minimumBillableWeightKg,3,true),demurrageRatePerHourSAR:input.demurrageRatePerHourSAR===undefined?(old?undefined:'50'):decimal(input.demurrageRatePerHourSAR,4,true),
   freeTimeHours:input.freeTimeHours===undefined?(old?undefined:'2'):decimal(input.freeTimeHours,4,true),vatApplicable:input.vatApplicable===undefined?(old?undefined:true):input.vatApplicable,vatRatePercent:decimal(input.vatRatePercent??15,4,true)};
  if(Number(terms.vatRatePercent)>100)tripFail('INVALID_COMMERCIAL_TERMS');
  const commercial=['carrierId','materialId','pricingType','rate','currency','effectiveFrom','effectiveTo','minimumBillableWeightKg','demurrageRatePerHourSAR','freeTimeHours','vatApplicable','vatRatePercent'];
  const changed=old&&commercial.some(k=>!eq(prior[k],terms[k]));
  const cleanup=old&&status==='INACTIVE'&&!changed&&['name','notes'].every(k=>eq(prior[k],terms[k]));
  assertFoundationMutation(project.status,cleanup?'CONSISTENCY_CLEANUP':old?'MAINTENANCE':'NEW_OPERATION');
  const carrier=cleanup?await this.identities.get('CARRIER',input.carrierId,true):await this.participant('CARRIER',input.carrierId),mat=material?(cleanup?await this.identities.get('MATERIAL',material,true):await this.participant('MATERIAL',material)):null;
  if(old?.successor_rule_id&&changed)tripFail('PRICING_RULE_ALREADY_REPLACED');
  const linked=old&&(await this.uow.query(`SELECT 1 WHERE EXISTS(SELECT 1 FROM pricing_snapshots WHERE company_id=$1 AND project_id=$2 AND pricing_rule_id=$3)
   OR EXISTS(SELECT 1 FROM pricing_rule_revisions r JOIN trip_settlements s ON s.company_id=r.company_id AND s.project_id=r.project_id AND s.terms_revision_id=r.id WHERE r.company_id=$1 AND r.project_id=$2 AND r.rule_id=$3)`,[...scope,old.id])).rowCount;
  let id=old?.id||randomUUID(),version=Number(old?.version||0)+1,parent:string|null=null;
  if(linked&&changed){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(from!)||pricingInstant(from!)!<=pricingInstant(prior.effectiveFrom)!||status!=='ACTIVE')tripFail('INVALID_REPLACEMENT_BOUNDARY');
   if(terms.carrierId!==prior.carrierId||terms.materialId!==prior.materialId)tripFail('PRICING_REPLACEMENT_IDENTITY_MISMATCH');
   parent=old.id;id=randomUUID();terms.pricingRuleId='PR-'+id;
  }
  // Preserve the P9 whole-UTC-day overlap rule, including ISO endpoints.
  const peers=(await this.uow.query(`SELECT * FROM pricing_rules WHERE company_id=$1 AND project_id=$2 AND carrier_id=$3 AND material_id IS NOT DISTINCT FROM $4 AND status='ACTIVE'
   AND effective_period && tstzrange($5,$6,'[]') AND id<>$7 ORDER BY external_id LIMIT 129`,[...scope,carrier.id,mat?.id||null,from!.slice(0,10),to?to.slice(0,10)+'T23:59:59.999Z':null,old?.id||id])).rows;
  if(peers.length>128)tripFail('PRICING_CANDIDATE_BUDGET');
  const mapped=peers.map(pricingView);if(status==='ACTIVE'&&PricingRuleValidator.checkOverlap({...terms,rate:Number(rate)} as any,mapped as any).hasOverlap)tripFail('PRICING_OVERLAP');
  const low=new Date(pricingInstant(from)!).toISOString(),high=to?new Date(pricingInstant(to,true)!).toISOString():null;
  if(parent){await this.uow.query(`UPDATE pricing_rules SET version=version+1,successor_rule_id=$1,superseded_from=$2,effective_period=tstzrange(lower(effective_period),$2,'[)'),updated_at=clock_timestamp(),updated_by=$3 WHERE company_id=$4 AND project_id=$5 AND id=$6`,[id,low,actor,...scope,old.id]);
   await this.uow.query('INSERT INTO pricing_rule_revisions(id,company_id,project_id,rule_id,commercial_revision,terms,rate,actor_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[randomUUID(),...scope,old.id,Number(old.version)+1,old.commercial_terms,old.rate,actor]);
  }
  if(old&&!parent)await this.uow.query(`UPDATE pricing_rules SET carrier_id=$11,material_id=$12,pricing_model=$13,version=$1,status=$2,commercial_terms=$3,rate=$4,effective_period=tstzrange($5,$6,'[]'),updated_at=clock_timestamp(),updated_by=$7 WHERE company_id=$8 AND project_id=$9 AND id=$10`,[version,status,terms,rate,low,high,actor,...scope,id,carrier.id,mat?.id||null,model]);
  else await this.uow.query(`INSERT INTO pricing_rules(id,company_id,project_id,external_id,carrier_id,material_id,version,status,effective_period,pricing_model,rate,tax_policy,commercial_terms,parent_rule_id,created_by,updated_by)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,tstzrange($9,$10,'[]'),$11,$12,'EXCLUSIVE',$13,$14,$15,$15)`,[id,...scope,terms.pricingRuleId,carrier.id,mat?.id||null,version,status,low,high,model,rate,terms,parent,actor]);
  const revision=randomUUID();await this.uow.query(`INSERT INTO pricing_rule_revisions(id,company_id,project_id,rule_id,commercial_revision,terms,rate,actor_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[revision,...scope,id,version,terms,rate,actor]);
  return {pricingRuleId:terms.pricingRuleId,version,termsRevisionId:revision,parentRuleId:parent?requested:null,...(parent?{predecessorVersion:Number(old.version)+1}:{}),status,terms};
 }
}
