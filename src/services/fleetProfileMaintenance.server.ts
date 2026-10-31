import {invalidateGlobalWorkspaceProjection} from './projectWorkspaceGlobalInvalidation.server';
import {normalizePhone} from '../utils/normalization';
import {adminDb} from '../firebase/admin';
import {authorizeGlobalCommand,auditGlobalMutation,assertGlobalEntityExists,decodeAuthoritativeGlobal} from './globalIdentityAuthority.server';
import {decodeParticipation} from './projectParticipationAuthority.server';
import {validGlobalId,GlobalIdentityError} from '../utils/globalIdentityPolicy';
const fields={DRIVER:['fullNameAr','phone','licenseNumber','licenseValidUntil','nationality'],TRUCK:['truckType','tareWeightKg','maxGrossWeightKg','mvpiValidUntil','insuranceValidUntil']} as const;
/** Profile-only shared capability. Natural identity, ownership, status and temporal state are never patched. */
export class FleetProfileMaintenanceServer {
 constructor(private db:any=adminDb){}
 async update(p:string,kind:'DRIVER'|'TRUCK',id:string,patch:any,expectedVersion:number,identity:{userId:string;email?:string}){
  const fail=(code:string):never=>{throw new GlobalIdentityError(code);};
  if(!fields[kind]||!validGlobalId(p)||!validGlobalId(id)||!patch||Array.isArray(patch)||typeof patch!=='object'||!Object.keys(patch).length)fail('INVALID_PROFILE_COMMAND');
  if(Object.keys(patch).some(k=>!(fields[kind] as readonly string[]).includes(k)))fail('IDENTITY_MIGRATION_REQUIRED');
  return this.db.runTransaction(async(tx:any)=>{
   const actor=await authorizeGlobalCommand(tx,this.db,identity,p,false,'MAINTENANCE');
   const member=await tx.get(this.db.collection('projects').doc(p).collection(kind.toLowerCase()+'_memberships').doc(id));
   if(!member.exists||decodeParticipation(member.data(),kind,p,id).status!=='ACTIVE')fail('PROJECT_MEMBERSHIP_REQUIRED');
   const old=await assertGlobalEntityExists(tx,this.db,kind,id);
   if(!Number.isInteger(expectedVersion)||expectedVersion!==(old.version||0))fail('PROFILE_VERSION_CONFLICT');
   const after={...old};
   for(const [key,value] of Object.entries(patch)){
    if(value===null||value===''){if(key==='fullNameAr')fail('INVALID_PROFILE_COMMAND');delete after[key];continue;}
    if(['tareWeightKg','maxGrossWeightKg'].includes(key)){if(typeof value!=='number'||!Number.isFinite(value)||value<0)fail('INVALID_PROFILE_COMMAND');after[key]=value;}
    else if(key.endsWith('Until')){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)fail('INVALID_PROFILE_COMMAND');after[key]=new Date(value as string);}
    else {if(typeof value!=='string'||!(value as string).trim())fail('INVALID_PROFILE_COMMAND');after[key]=(value as string).trim();}
   }
   if(patch.phone && typeof patch.phone==='string'){after.phone=normalizePhone(patch.phone);if(!after.phone)fail('INVALID_PROFILE_COMMAND');}
   if(kind==='TRUCK'){
    if(after.truckType&&!['TIPPER_32M3','TRAILER_24M','FLATBED','DUMPER'].includes(after.truckType))fail('INVALID_PROFILE_COMMAND');
    if(after.maxGrossWeightKg!==undefined&&after.tareWeightKg!==undefined){if(after.maxGrossWeightKg<=after.tareWeightKg)fail('INVALID_PROFILE_COMMAND');after.legalPayloadLimitKg=after.maxGrossWeightKg-after.tareWeightKg;}else delete after.legalPayloadLimitKg;
   }
   after.version=(old.version||0)+1;after.updatedAt=new Date();after.updatedBy=actor.userId;
   decodeAuthoritativeGlobal(kind,after,id);
   await invalidateGlobalWorkspaceProjection(tx,this.db,kind,id,'FLEET_PROFILE_UPDATED',after.updatedAt.toISOString());
   tx.set(this.db.collection(kind==='DRIVER'?'drivers':'trucks').doc(id),after);
   auditGlobalMutation(tx,this.db,kind,id,actor,old,after,p);
   return after;
  });
 }
}
