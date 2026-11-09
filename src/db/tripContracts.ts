import {GlobalIdentityError} from '../utils/globalIdentityPolicy';
import {assertSessionPayload} from '../services/import/durableSessionContract';
export const SQL_TRIP_EPOCH='AR2_U06_INACTIVE_V1';
export const tripFail=(code:string,status=409):never=>{throw new GlobalIdentityError(code,'',status);};
export const tripId=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(v)&&v!=='ALL';
export function exactTrip(value:any,fields:readonly string[]){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!fields.includes(k)))tripFail('INVALID_TRIP_COMMAND');assertSessionPayload(value);}
/** Decimal input is a value, never a final JS commercial calculation. */
export function decimal(value:unknown,scale=3,allowZero=false,signed=false):string{
 const s=String(value??'');if(!new RegExp(`^${signed?'[+-]?':''}\\d{1,12}(?:\\.\\d{1,${scale}})?$`).test(s)||!Number.isFinite(Number(s))||(!signed&&(allowZero?Number(s)<0:Number(s)<=0)))tripFail('INVALID_DECIMAL');const sign=s.startsWith('-')?'-':'',parts=s.replace(/^[+-]/,'').split('.'),whole=parts[0].replace(/^0+(?=\d)/,''),fraction=parts[1]?.replace(/0+$/,'');const result=sign+whole+(fraction?'.'+fraction:'');return result==='-0'?'0':result;
}
export interface SqlTripEnvelope {operationId:string;expectedRevision:number;backendEpoch:string;payloadSchemaVersion:number;command:string;payload:Record<string,any>}
export function tripEnvelope(r:SqlTripEnvelope,expectedEpoch=SQL_TRIP_EPOCH){exactTrip(r,['operationId','expectedRevision','backendEpoch','payloadSchemaVersion','command','payload']);
 if(Buffer.byteLength(JSON.stringify(r))>65536)tripFail('TRIP_COMMAND_LIMIT');
 if(r.backendEpoch!==expectedEpoch)tripFail('BACKEND_EPOCH_CONFLICT');if(r.payloadSchemaVersion!==1)tripFail('TRIP_PAYLOAD_SCHEMA_UNSUPPORTED');
 if(!Number.isSafeInteger(r.expectedRevision)||r.expectedRevision<0)tripFail('TRIP_REVISION_CONFLICT');
 if(typeof r.operationId!=='string'||!(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r.operationId)))tripFail('INVALID_OPERATION_ID');
}
