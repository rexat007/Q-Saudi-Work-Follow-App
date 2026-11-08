import {randomUUID} from 'node:crypto';
import type {UnitOfWork} from './unitOfWork.js';
import {tripFail,decimal,exactTrip} from './tripContracts.js';
export interface MeasurementEvidence {sourceType:string;sourceRef?:string;sourceEventKey?:string;sourceFileHash?:string;capturedAt?:string;unit?:string;rawTare?:string|number;rawGross?:string|number;rawNet?:string|number}
/** A real adapter verifies device/provider/source ownership and raw evidence in this transaction. */
export interface TripMeasurementVerifier {verify(uow:UnitOfWork,evidence:MeasurementEvidence):Promise<void>}
export class TripMeasurementRepository {
 constructor(private uow:UnitOfWork,private verifier?:TripMeasurementVerifier){}
 async prepare(side:'origin'|'destination',payload:any,operation:string,now:string,lastTime?:string,trusted?:MeasurementEvidence){
  const incoming=trusted||payload.measurementEvidence;
  if(incoming)exactTrip(incoming,['sourceType','sourceRef','sourceEventKey','sourceFileHash','capturedAt','unit','rawTare','rawGross','rawNet']);
  const evidence:MeasurementEvidence={...(incoming||{}),sourceType:incoming?.sourceType||'MANUAL',unit:incoming?.unit||'KG',capturedAt:incoming?.capturedAt||now};
  if(!['KG','TON'].includes(evidence.unit!))tripFail('INVALID_WEIGHT_UNIT');
  if(!['MANUAL','WEIGHBRIDGE','CSV','EXCEL','GOOGLE_SHEETS','GOOGLE_DRIVE','API','MIGRATION'].includes(evidence.sourceType))tripFail('SOURCE_MEASUREMENT_UNVERIFIED');
  if(evidence.sourceType!=='MANUAL'&&!trusted){if(!this.verifier)tripFail('SOURCE_MEASUREMENT_UNVERIFIED');await this.verifier.verify(this.uow,evidence);}
  if(evidence.sourceType==='MANUAL'&&evidence.sourceFileHash!==undefined&&!trusted)tripFail('SOURCE_MEASUREMENT_UNVERIFIED');
  if(evidence.sourceFileHash!==undefined&&!/^[a-f0-9]{64}$/.test(evidence.sourceFileHash))tripFail('SOURCE_MEASUREMENT_UNVERIFIED');
  for(const key of ['sourceRef','sourceEventKey'])if(evidence[key]!==undefined&&(typeof evidence[key]!=='string'||!evidence[key]||evidence[key].length>256))tripFail('SOURCE_MEASUREMENT_UNVERIFIED');
  const captured=Date.parse(evidence.capturedAt!);if(!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(evidence.capturedAt!)||!Number.isFinite(captured)||captured>Date.parse(now)+1000||lastTime&&captured<Date.parse(lastTime))tripFail('INCONSISTENT_MEASUREMENT_TIME');
  const tare=payload[side+'TareKg'],gross=payload[side+'GrossKg'],net=payload[side+'NetKg'],measured=tare!==undefined&&gross!==undefined;
  if(!measured&&net===undefined)tripFail('MISSING_MEASUREMENT');
  const raw=measured?{TARE:evidence.rawTare??tare,GROSS:evidence.rawGross??gross}:{NET:evidence.rawNet??net};
  if(incoming?.unit==='TON'&&Object.values(raw).some(v=>v===undefined))tripFail('MISSING_MEASUREMENT');
  const readings:any[]=[];for(const [kind,value] of Object.entries(raw)){
   const input=decimal(value,evidence.unit==='TON'?6:3),kg=(await this.uow.query("SELECT ($1::numeric*CASE WHEN $2='TON' THEN 1000 ELSE 1 END)::numeric(18,3) AS kg",[input,evidence.unit])).rows[0].kg;
   const expected=measured?(kind==='TARE'?tare:gross):net;
   if(!(await this.uow.query('SELECT $1::numeric=$2::numeric AS same',[kg,decimal(expected)])).rows[0].same)tripFail('SOURCE_MEASUREMENT_VALUE_MISMATCH');
   readings.push({kind,raw:String(value),kg,authority:'MEASURED'});
  }
  let netKg=readings[0].kg;
  if(measured){netKg=(await this.uow.query('SELECT ($1::numeric-$2::numeric)::numeric(18,3) AS net',[readings[1].kg,readings[0].kg])).rows[0].net;if(Number(netKg)<=0)tripFail('INVALID_GROSS_LESS_THAN_TARE');readings.push({kind:'NET',raw:`${readings[1].raw} - ${readings[0].raw}`,kg:netKg,authority:'DERIVED'});}
  const rawTicket=payload[side+'TicketNo'];if(rawTicket!==undefined&&typeof rawTicket!=='string')tripFail('INVALID_TRIP_COMMAND');const ticket=rawTicket?.trim();if(evidence.sourceType==='MANUAL'&&ticket&&evidence.sourceRef&&evidence.sourceRef!==ticket)tripFail('SOURCE_REFERENCE_MISMATCH');if(ticket!==undefined&&(typeof ticket!=='string'||ticket.length>256))tripFail('INVALID_TRIP_COMMAND');
  return {side,netKg,readings,observedAt:incoming?.capturedAt??(evidence.sourceType==='MANUAL'?now:null),evidence:{...evidence,sourceRef:evidence.sourceRef??(ticket||null),sourceEventKey:evidence.sourceType==='MANUAL'&&ticket?side+'/'+ticket:evidence.sourceEventKey??(ticket?side+'/'+ticket:operation+'/'+side)}};
 }
 async append(trip:string,event:string,prepared:any){
  const ids:Record<string,string>={};for(const r of prepared.readings){const id=randomUUID();ids[r.kind]=id;
   await this.uow.query(`INSERT INTO trip_weight_records(id,company_id,project_id,trip_id,event_id,actor_id,measurement_type,weight_kg,raw_value,source_unit,source_ref,source_type,source_file_hash,source_event_key,captured_at,observed_at,authority_status,source_correction)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,[id,this.uow.context.companyId,this.uow.context.projectId,trip,event,this.uow.context.actorId,prepared.side.toUpperCase()+'_'+r.kind,r.kg,r.raw,prepared.evidence.unit,prepared.evidence.sourceRef,prepared.evidence.sourceType,prepared.evidence.sourceFileHash||null,prepared.evidence.sourceEventKey,prepared.evidence.capturedAt,prepared.observedAt,r.authority,r.sourceCorrection?JSON.stringify(r.sourceCorrection):null]);
  }return ids;
 }
 async derivedCorrection(trip:string,event:string,previous:string,kg:string,reason:string,now:string){
  const old=(await this.uow.query('SELECT * FROM trip_weight_records WHERE company_id=$1 AND project_id=$2 AND trip_id=$3 AND id=$4',[this.uow.context.companyId,this.uow.context.projectId,trip,previous])).rows[0];if(!old||!old.measurement_type.endsWith('_NET'))tripFail('MEASUREMENT_NOT_FOUND');
  const id=randomUUID();await this.uow.query(`INSERT INTO trip_weight_records(id,company_id,project_id,trip_id,event_id,actor_id,measurement_type,weight_kg,raw_value,source_unit,source_type,source_ref,captured_at,observed_at,authority_status,correction_of,correction_reason)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'KG','MANUAL',$10,$11,$11,'APPROVED_CORRECTION',$12,$13)`,[id,this.uow.context.companyId,this.uow.context.projectId,trip,event,this.uow.context.actorId,old.measurement_type,kg,'Derived from approved gross/tare correction',old.source_ref,now,old.id,reason]);return id;
 }
 async correct(trip:string,event:string,payload:any,now:string){
  if(typeof payload.reason!=='string'||!payload.reason.trim()||payload.reason.length>1000)tripFail('CORRECTION_REASON_REQUIRED');
  const old=(await this.uow.query('SELECT * FROM trip_weight_records WHERE company_id=$1 AND project_id=$2 AND trip_id=$3 AND id=$4',[this.uow.context.companyId,this.uow.context.projectId,trip,payload.measurementId])).rows[0];if(!old)tripFail('MEASUREMENT_NOT_FOUND');
  if(!['KG','TON'].includes(payload.unit))tripFail('INVALID_WEIGHT_UNIT');const raw=decimal(payload.rawValue,payload.unit==='TON'?6:3),kg=(await this.uow.query("SELECT ($1::numeric*CASE WHEN $2='TON' THEN 1000 ELSE 1 END)::numeric(18,3) AS kg",[raw,payload.unit])).rows[0].kg,id=randomUUID();
  await this.uow.query(`INSERT INTO trip_weight_records(id,company_id,project_id,trip_id,event_id,actor_id,measurement_type,weight_kg,raw_value,source_unit,source_type,source_ref,captured_at,observed_at,authority_status,correction_of,correction_reason)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'MANUAL',$11,$12,$12,'APPROVED_CORRECTION',$13,$14)`,[id,this.uow.context.companyId,this.uow.context.projectId,trip,event,this.uow.context.actorId,old.measurement_type,kg,raw,payload.unit,old.source_ref,now,old.id,payload.reason]);return {id,kg,type:old.measurement_type,previousId:old.id,previousKg:old.weight_kg};
 }
}
