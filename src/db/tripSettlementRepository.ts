import {randomUUID} from 'node:crypto';
import type {UnitOfWork} from './unitOfWork.js';
import {tripFail,decimal} from './tripContracts.js';
export class TripSettlementRepository {
 constructor(private uow:UnitOfWork){}
 async freeze(trip:string,pricedAt:string,resolution:any|null){
  const id=randomUUID(),scope=[this.uow.context.companyId,this.uow.context.projectId];
  await this.uow.query(`INSERT INTO pricing_snapshots(id,company_id,project_id,trip_id,pricing_rule_id,pricing_rule_version,rate,terms_revision_id,resolution_status,frozen_terms,priced_at)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[id,...scope,trip,resolution?.row.id||null,resolution?.row.version||null,resolution?.row.rate||null,resolution?.revision.id||null,resolution?'RESOLVED':'UNRESOLVED_PENDING',resolution?.terms||null,pricedAt]);return id;
 }
 async frozen(trip:string){return (await this.uow.query('SELECT * FROM pricing_snapshots WHERE company_id=$1 AND project_id=$2 AND trip_id=$3',[this.uow.context.companyId,this.uow.context.projectId,trip])).rows[0];}
 async latest(trip:string){return (await this.uow.query('SELECT * FROM trip_settlements WHERE company_id=$1 AND project_id=$2 AND trip_id=$3 ORDER BY version DESC LIMIT 1',[this.uow.context.companyId,this.uow.context.projectId,trip])).rows[0];}
 async calculate(terms:any|null,quantity:string|null,billableHours='0',deductions='0',adjustment='0'){
  if(!terms)return {status:'PENDING_PRICING',quantity_kg:quantity,quantity_basis:null,base_amount:null,demurrage:null,deductions:null,adjustment:null,subtotal:null,tax:null,final_amount:null};
  if(!['PER_TRIP','PER_TON'].includes(terms.pricingType))tripFail('INVALID_PRICING_RULE');decimal(terms.rate,4);
  if(Number(billableHours)>0&&terms.demurrageRatePerHourSAR===undefined)tripFail('DEMURRAGE_TERMS_REQUIRED');
  if(terms.pricingType==='PER_TON'&&quantity===null)return {status:'PENDING_QUANTITY',quantity_kg:null,quantity_basis:null,base_amount:null,demurrage:null,deductions:null,adjustment:null,subtotal:null,tax:null,final_amount:null};
  if(quantity!==null)decimal(quantity);decimal(billableHours,4,true);decimal(deductions,2,true);decimal(adjustment,2,true,true);
  const result=(await this.uow.query(`WITH q AS (SELECT CASE WHEN $1='PER_TRIP' THEN 1::numeric ELSE round(greatest($2::numeric,$3::numeric)/1000,3) END AS quantity_basis),
   b AS (SELECT quantity_basis,round(quantity_basis*$4::numeric,2)::numeric(18,2) AS base_amount,round($5::numeric*$6::numeric,2)::numeric(18,2) AS demurrage FROM q),
   s AS (SELECT *,round(greatest(0,base_amount+demurrage-$7::numeric+$8::numeric),2)::numeric(18,2) AS subtotal FROM b),
   t AS (SELECT *,CASE WHEN $9::boolean THEN round(subtotal*$10::numeric/100,2) ELSE 0 END::numeric(18,2) AS tax FROM s)
   SELECT quantity_basis::numeric(18,3),base_amount,demurrage,$7::numeric(18,2) AS deductions,$8::numeric(18,2) AS adjustment,subtotal,tax,(subtotal+tax)::numeric(18,2) AS final_amount FROM t`,
   [terms.pricingType,quantity,terms.minimumBillableWeightKg??'0',terms.rate,billableHours,terms.demurrageRatePerHourSAR??'0',deductions,adjustment,terms.vatApplicable??false,terms.vatRatePercent??'15']).catch(error=>{if(error.code==='22003')tripFail('COMMERCIAL_NUMERIC_LIMIT');throw error;})).rows[0];
  return {status:'FINAL',quantity_kg:quantity,...result};
 }
 async append(trip:string,event:string,snapshot:any,result:any,terms:any|null,termsRevision:string|null,reason:string,evidence:any){
  if(!reason?.trim())tripFail('SETTLEMENT_REASON_REQUIRED');const last=await this.latest(trip),version=Number(last?.version||0)+1,id=randomUUID();
  await this.uow.query(`INSERT INTO trip_settlements(id,company_id,project_id,trip_id,event_id,snapshot_id,version,status,terms_revision_id,quantity_kg,quantity_basis,base_amount,demurrage,deductions,adjustment,subtotal,tax,final_amount,evidence,reason,actor_id,quoted_amount)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,[id,this.uow.context.companyId,this.uow.context.projectId,trip,event,snapshot.id,version,result.status,termsRevision,result.quantity_kg,result.quantity_basis,result.base_amount,result.demurrage,result.deductions,result.adjustment,result.subtotal,result.tax,result.final_amount,{...evidence,frozenTerms:terms},reason,this.uow.context.actorId,result.quoted_amount??null]);
  return {settlementId:id,version,...result};
 }
}
