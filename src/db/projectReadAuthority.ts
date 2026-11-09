import { createHmac,timingSafeEqual } from 'node:crypto';
import { assertServiceIdentity,getAuthPool } from './pool.js';
import { withUnitOfWork,type UnitOfWork } from './unitOfWork.js';
import type { SqlAuthorityDependencies } from './canonicalAuthority.js';
import { FoundationReadRepository,READ_KINDS } from './foundationReadRepository.js';
import { SQL_SETUP_STAGES,type SqlSetupStage,type ParticipantKind,type BoundedProjectPage,type BoundedParticipant } from '../types/boundedProjectReads';

export class ProjectReadError extends Error {
  constructor(readonly code:string,readonly status:number){super(code);}
}
const fail=(code:string,status:number):never=>{throw new ProjectReadError(code,status);};
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
interface ReadScope {companyId:string;projectExternalId:string}
interface Authorization {project_id:string;commercial_role:string;authorization_scope:string;project_version:string;source_revision:string;project_status:string}
interface Cursor {scope:string;revision:string;after:string;expires:number}
export interface ProjectReadConfiguration extends SqlAuthorityDependencies {backendEpoch:string;cursorKey:Buffer;now?:()=>number}

/** Read presentation shares U01's trusted UID, service-identity checks and UnitOfWork.
 * It intentionally does not use the admin-only canonical command authorization.
 */
export class SqlProjectReadAuthority {
  private readonly key:Buffer;
  private readonly now:()=>number;
  constructor(private readonly config:ProjectReadConfiguration){
    if(!config.backendEpoch||config.backendEpoch.length>100||config.cursorKey.length<32)throw Error('READ_CONFIGURATION_REQUIRED');
    this.key=Buffer.from(config.cursorKey);this.now=config.now||Date.now;
  }
  private mac(domain:string,value:string){return createHmac('sha256',this.key).update(domain+'\0'+value).digest('base64url');}
  private async scoped<T>(token:string,scope:ReadScope,work:(uow:UnitOfWork,authorization:Authorization)=>Promise<T>){
    if(typeof token!=='string'||!token)fail('UNAUTHENTICATED',401);
    if(!uuid(scope.companyId)||typeof scope.projectExternalId!=='string'||!/^Q-PRJ-[A-Za-z0-9_-]{1,124}$/.test(scope.projectExternalId))fail('PROJECT_NOT_FOUND',404);
    let uid:string;
    try{uid=(this.config.verifyToken?await this.config.verifyToken(token):await(await import('../firebase/admin.js')).adminAuth.verifyIdToken(token,true)).uid;}
    catch{fail('UNAUTHENTICATED',401);}
    try{
      const auth=this.config.authPool||getAuthPool();
      await assertServiceIdentity(auth,'qsa_auth');
      const actor=(await auth.query('SELECT id FROM users WHERE firebase_uid=$1 AND status=\'ACTIVE\'',[uid])).rows[0];
      if(!actor)fail('UNAUTHENTICATED',401);
      return await withUnitOfWork({companyId:scope.companyId,actorId:actor.id},async uow=>{
        if(this.config.backendFence)await uow.query('SELECT qsa_assert_runtime_read($1,$2)',[this.config.backendFence.backendEpoch,this.config.backendFence.epochRevision]);
        const authorization=(await uow.query<Authorization>('SELECT * FROM qsa_authorize_project_read($1)',[scope.projectExternalId])).rows[0];
        if(!authorization)fail('PROJECT_NOT_FOUND',404);
        uow.context.projectId=authorization.project_id;
        return work(uow,authorization);
      },this.config.runtimePool,{readOnlySnapshot:true});
    }catch(error:any){if(error instanceof ProjectReadError)throw error;if(error?.code==='P0001'&&error?.message==='BACKEND_EPOCH_MISMATCH')fail('BACKEND_EPOCH_MISMATCH',409);fail('CANONICAL_READ_UNAVAILABLE',503);}
  }
  async summary(token:string,scope:ReadScope,ifNoneMatch?:string){
    return this.scoped(token,scope,async(uow,a)=>{
      const body=await new FoundationReadRepository(uow).summary(scope.projectExternalId,this.config.backendEpoch);
      const etag='"'+this.mac('etag',JSON.stringify([scope,uow.context.actorId,a.authorization_scope,this.config.backendEpoch,body.data]))+'"';
      // Authorization is always re-read before conditional response evaluation.
      return {status:!body.data.stale&&ifNoneMatch===etag?304:200,etag,body};
    });
  }
  async page(token:string,scope:ReadScope,input:{stage?:string;kind?:string;limit?:number;cursor?:string}={}):Promise<BoundedProjectPage>{
    const {stage='ROSTER',kind='TRUCK',limit=50,cursor}=input;
    if(!SQL_SETUP_STAGES.includes(stage as SqlSetupStage)||!Object.hasOwn(READ_KINDS,kind)||!Number.isInteger(limit)||limit<1||limit>50
      ||stage==='MATERIALS'&&kind!=='MATERIAL'||stage==='CARRIERS'&&kind!=='CARRIER'||stage==='ROSTER'&&!['DRIVER','TRUCK'].includes(kind))fail('INVALID_PAGE_REQUEST',400);
    // Non-participant stages use the scalar summary endpoint, never broad lists.
    if(!['ROSTER','CARRIERS','MATERIALS'].includes(stage))fail('STAGE_REQUIRES_SUMMARY',400);
    return this.scoped(token,scope,async(uow,a)=>{
      const binding=this.mac('page-scope',JSON.stringify([scope,uow.context.actorId,a.authorization_scope,this.config.backendEpoch,stage,kind,limit,'membership-id-asc']));
      let after:string|undefined;
      if(cursor!==undefined){
        try{
          if(typeof cursor!=='string'||cursor.length>2048)throw Error();
          const [encoded,signature,...extra]=cursor.split('.');
          if(extra.length||!encoded||!signature)throw Error();
          const expected=Buffer.from(this.mac('cursor',encoded));const actual=Buffer.from(signature);
          if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw Error();
          const c:Cursor=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));
          if(c.scope!==binding||!uuid(c.after)||!Number.isFinite(c.expires)||typeof c.revision!=='string')throw Error();
          if(c.expires<=this.now()||c.revision!==String(a.source_revision))fail('STALE_PAGE_CURSOR',409);
          after=c.after;
        }catch(error){if(error instanceof ProjectReadError)throw error;fail('INVALID_PAGE_CURSOR',400);}
      }
      const rows=await new FoundationReadRepository(uow).page(kind as ParticipantKind,limit,after);
      const selected=rows.slice(0,limit),hasMore=rows.length>limit;
      const items:BoundedParticipant[]=selected.map(r=>{
        if(!r.entity_id||!['ACTIVE','SUSPENDED','REMOVED'].includes(r.membership_status))throw Error('INVALID_PARTICIPANT');
        if(r.invalid_affiliation||r.invalid_assignment||r.invalid_allocation)fail('TEMPORAL_RECONCILIATION_REQUIRED',503);
        return {entityId:r.entity_id,kind:kind as ParticipantKind,membershipStatus:r.membership_status,globalStatus:r.global_status,
          ...(['TRUCK','DRIVER'].includes(kind)?{carrierId:r.carrier_id,integrity:'VERIFIED' as const}:{}),
          ...(kind==='TRUCK'?{assignmentId:r.assignment_id,driverId:r.driver_id,allocationId:r.allocation_id,materialId:r.material_id}:{})};
      });
      const expires=Math.min(this.now()+300000,rows[0]?.valid_until?.getTime()??Infinity);
      let nextCursor:string|null=null;
      if(hasMore){
        const encoded=Buffer.from(JSON.stringify({scope:binding,revision:String(a.source_revision),after:selected.at(-1)!.page_key,expires} satisfies Cursor)).toString('base64url');
        nextCursor=encoded+'.'+this.mac('cursor',encoded);
      }
      return {projectExternalId:scope.projectExternalId,stage:stage as SqlSetupStage,kind:kind as ParticipantKind,items,
        nextCursor,hasMore,sourceRevision:String(a.source_revision),fullSnapshot:false,
        meta:{backendEpoch:this.config.backendEpoch,generatedAt:(rows[0]?.generated_at||new Date(this.now())).toISOString()}};
    });
  }
}
