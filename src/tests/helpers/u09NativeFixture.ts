import {SqlTemporalAuthority} from '../../db/temporalAuthority';
import {SqlTripAuthority} from '../../db/tripAuthority';
import {SQL_TRIP_EPOCH} from '../../db/tripContracts';
import pg from 'pg';
import {randomUUID,randomBytes} from 'node:crypto';
import {applyMigrations} from '../../db/migrator';
export async function u09NativeFixture(){
 if(process.env.QSA_TEST_DATABASE_ISOLATED!=='1'||!process.env.TEST_DATABASE_URL)throw Error('ISOLATED_DATABASE_REQUIRED');
 const name='qsaudi_u09_'+randomUUID().replaceAll('-',''),url=new URL(process.env.TEST_DATABASE_URL);url.pathname='/postgres';const owner=new pg.Pool({connectionString:url.href});
 await owner.query('CREATE DATABASE '+name+' OWNER qsa_migrator');url.pathname='/'+name;
 const pool=(user:string)=>{const u=new URL(url);u.username=user;u.password='';return new pg.Pool({connectionString:u.href,max:3});};
 const admin=pool('postgres'),runtime=pool('qsa_runtime'),auth=pool('qsa_auth'),migration=pool('qsa_migrator');
 await applyMigrations(migration);const company=randomUUID(),project=randomUUID(),actor=randomUUID(),uid='u09-'+actor;
 await admin.query("INSERT INTO companies(id,slug,name,status) VALUES($1,$1::uuid::text,'synthetic','ACTIVE')",[company]);
 await admin.query("INSERT INTO users(id,firebase_uid,status) VALUES($1,$2,'ACTIVE')",[actor,uid]);
 await admin.query("INSERT INTO user_company_roles(id,company_id,user_id,role,status) VALUES(gen_random_uuid(),$1,$2,'SUPER_ADMIN','ACTIVE')",[company,actor]);
 await admin.query("INSERT INTO projects(id,company_id,external_id,name,status) VALUES($1,$2,$3,'synthetic','ACTIVE')",[project,company,'Q-PRJ-'+project]);
 const keys=['QSA_IDENTITY_HMAC_KEY','QSA_IDENTITY_ENCRYPTION_KEY','QSA_IDENTITY_KEY_VERSION'],old=keys.map(k=>process.env[k]);
 process.env.QSA_IDENTITY_HMAC_KEY=randomBytes(32).toString('hex');process.env.QSA_IDENTITY_ENCRYPTION_KEY=randomBytes(32).toString('hex');process.env.QSA_IDENTITY_KEY_VERSION='u09-test';
 return {admin,runtime,auth,migration,company,project,actor,uid,scope:{companyId:company,projectId:'Q-PRJ-'+project},deps:{runtimePool:runtime,authPool:auth,verifyToken:async(token:string)=>{if(token!=='admin')throw Error();return {uid};}},
 close:async()=>{keys.forEach((k,i)=>old[i]===undefined?delete process.env[k]:process.env[k]=old[i]);await Promise.all([admin.end(),runtime.end(),auth.end(),migration.end()]);await owner.query('DROP DATABASE '+name+' WITH (FORCE)');await owner.end();}};
}

export async function seedU09Trip(f:Awaited<ReturnType<typeof u09NativeFixture>>,epoch?:{backendEpoch:string;epochRevision:number}){
 const deps={...f.deps,...(epoch?{backendFence:epoch}:{})},canonical=new SqlTemporalAuthority(deps),trips=new SqlTripAuthority(deps);
 await f.admin.query('UPDATE projects SET operational_configuration=$1 WHERE id=$2',[{schemaVersion:1,loadingMeasurementMode:'NONE',unloadingMeasurementMode:'NONE',driverIntakeMode:'MIXED',routeConfiguration:{loadingLocation:'Origin',unloadingLocation:'Destination',expectedTravelMinutes:30},shiftConfiguration:{mode:'NONE'},capacityEstimationPolicy:{mode:'NONE'},requiredCheckpoints:[]},f.project]);
 const ids:any={};for(const kind of ['CARRIER','MATERIAL','TRUCK'] as const){const r=await canonical.create('admin',{...f.scope,operationId:randomUUID(),kind,naturalKey:kind==='CARRIER'?'1000000991':kind==='MATERIAL'?'SYNTHETIC MATERIAL':'ا ب ج 9991',profile:kind==='CARRIER'?{nameAr:'synthetic carrier'}:kind==='MATERIAL'?{nameAr:'synthetic material',unitOfMeasure:'TON'}:{truckType:'DUMPER',legalPayloadLimitKg:20000}});ids[kind]=r.identity.externalId;await canonical.membership('admin',{...f.scope,operationId:randomUUID(),kind,entityId:ids[kind],command:'ENROLL',expectedRevision:0});}
 await canonical.affiliation('admin',{...f.scope,operationId:randomUUID(),kind:'TRUCK',entityId:ids.TRUCK,carrierId:ids.CARRIER,command:'SET_AFFILIATION'});await canonical.allocation('admin',{...f.scope,operationId:randomUUID(),command:'ALLOCATE',truckId:ids.TRUCK,materialId:ids.MATERIAL});
 const env=(command:string,payload:any)=>({operationId:randomUUID(),expectedRevision:0,backendEpoch:epoch?.backendEpoch||SQL_TRIP_EPOCH,payloadSchemaVersion:1 as const,command,payload});
 await trips.savePricing('admin',f.scope,env('SAVE_PRICING_RULE',{rule:{pricingRuleId:'PRICE',carrierId:ids.CARRIER,materialId:ids.MATERIAL,pricingType:'PER_TON',rate:'10',currency:'SAR',effectiveFrom:'2020-01-01',vatApplicable:true,vatRatePercent:15,minimumBillableWeightKg:0}}));
 const envelope=env('DISPATCH_TRIP',{carrierId:ids.CARRIER,materialId:ids.MATERIAL,truckId:ids.TRUCK,driverId:null,pricingRuleId:'PRICE'}),result=await trips.execute('admin',f.scope,envelope);return {envelope,result};
}
