import {createHash,randomUUID} from 'node:crypto';
import {FieldPath} from 'firebase-admin/firestore';
import {adminDb} from '../src/firebase/admin';
import type {AuthUserContext} from '../src/types/common';
import {buildPrincipal} from '../src/utils/principal';
import {isGoogleProviderCode} from './workspaceGoogleErrors';
import {ProjectGoogleWorkspaceServer,GoogleWorkspaceCommandError,continuityRef,syncOutboxRef,type GoogleBlueprintPort,type GoogleTemplatePort} from '../src/services/projectGoogleWorkspace.server';
import {AUTHORIZATIONS,type WorkspaceGoogleOfflineAuthorization} from '../src/services/workspaceGoogleOfflineAuthorization.server';
import {getState} from '../src/services/projectWorkspaceProjectionState.server';
import {isMasterTab} from '../src/services/projectWorkspaceMasterContract';
import {projectGoogleBlueprintPort} from './projectGoogleBlueprint.adapter';
export interface WorkspaceSyncPass {examined:number;eligible:number;attempted:number;delivered:number;skipped:number;deferred:number}
const emptyPass=():WorkspaceSyncPass=>({examined:0,eligible:0,attempted:0,delivered:0,skipped:0,deferred:0});
const validId=(v:unknown):v is string=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(v);
const attentionCodes=new Set(['AUTHORIZATION_REQUIRED','BOUND_FILE_UNAVAILABLE','WORKSPACE_NOT_PROVISIONED','WORKBOOK_OPERATOR_REVIEW_REQUIRED','AUTOMATION_RECOVERY_REQUIRED','WORKSPACE_MAINTENANCE_REQUIRED','WORKSPACE_TEMPLATE_MIGRATION_REQUIRED','WORKSPACE_NO_PENDING_WORK','WORKSPACE_SYNC_IN_PROGRESS','FORBIDDEN_PROJECT_ACCESS']);
/** Shared bounded grant discovery and canonical delivery. Scheduled maintenance is dormant.
 * The global actor pass never receives Project IDs, browser Google tokens or row payloads. */
export class WorkspaceSyncCoordinator {
 constructor(private offline:Pick<WorkspaceGoogleOfflineAuthorization,'access'>,private database:any=adminDb,
  private port:(token:string,projectId:string)=>GoogleTemplatePort&Partial<GoogleBlueprintPort>=projectGoogleBlueprintPort,
  private limits={candidates:20,attempts:3,milliseconds:25000}){}
 runForActor(user:AuthUserContext){return this.run(user);}
 runScheduled(){return this.run();}
 private async run(user?:AuthUserContext):Promise<WorkspaceSyncPass>{
  if(user&&!validId(user.userId))throw new GoogleWorkspaceCommandError('FORBIDDEN',403);
  const key=user?`actor-${createHash('sha256').update(user.userId).digest('hex')}`:'scheduled',owner=randomUUID(),now=Date.now();
  const ref=this.database.collection('workspace_sync_coordinators').doc(key),result=emptyPass();
  const claim=await this.database.runTransaction(async(tx:any)=>{
   if(user){const profile=await tx.get(this.database.collection('users').doc(user.userId)),principal=buildPrincipal(profile.data(),user.userId,{});if(!['SUPER_ADMIN','PROJECT_ADMIN'].includes(principal.role))return null;}
   const s=(await tx.get(ref)).data()||{};if(s.owner&&s.expiresAt>now)return null;
   tx.set(ref,{...s,owner,expiresAt:now+120000});return {cursor:validId(s.cursor)?s.cursor:null};
  });
  if(!claim)return result;
  let cursor=claim.cursor;
  try{
   // One equality index: actor-owned history is filtered ACTIVE before execution.
   // Server cursor prevents inactive/no-work first pages starving later grants.
   const query=this.database.collection(AUTHORIZATIONS).where(user?'actorId':'status','==',user?user.userId:'ACTIVE').orderBy(FieldPath.documentId());
   let page=await (cursor?query.startAfter(cursor):query).limit(this.limits.candidates+1).get();
   if(!page.docs.length&&cursor){cursor=null;page=await query.limit(this.limits.candidates+1).get();}
   let processed=0;
   for(const doc of page.docs.slice(0,this.limits.candidates)){
    if(result.attempted>=this.limits.attempts||Date.now()-now>=this.limits.milliseconds)break;
    const lease=await this.database.runTransaction(async(tx:any)=>{const s=(await tx.get(ref)).data();if(s?.owner!==owner||s.expiresAt<=Date.now())return false;tx.set(ref,{...s,expiresAt:Date.now()+120000});return true;});if(!lease)break;
    cursor=doc.id;processed++;result.examined++;
    const grant=doc.data(),projectId=grant.projectId,actor=user||{userId:grant.actorId} as AuthUserContext;
    if(grant.status!=='ACTIVE'||!validId(projectId)||!validId(actor.userId)||grant.actorId!==actor.userId){result.skipped++;continue;}
    const service=new ProjectGoogleWorkspaceServer(this.database,undefined,undefined,doc.id);let attempted=false;
    try{
     let initialize=false;
     if(user){if(!await service.hasPendingUserActiveWork(projectId,actor)){result.skipped++;continue;}}
     else{
      // Same discovery/execution engine, retaining the dormant worker's explicit maintenance policy.
      await this.database.runTransaction((tx:any)=>service.authorized(tx,projectId,actor));
      const s=(await continuityRef(this.database,projectId).get()).data();
      initialize=s?.workbookHealth!=='HEALTHY'||['NOT_INSTALLED','DEGRADED'].includes(s?.automationState);
      const events=await syncOutboxRef(this.database,projectId).where('status','==','PENDING').limit(1).get();
      const dirty=(await getState(projectId,this.database)).dirtyTabs.some(isMasterTab);
      if(!events.docs.length&&!dirty&&!initialize){result.skipped++;continue;}
     }
     result.eligible++;result.attempted++;attempted=true;
     const access=await this.offline.access(projectId,actor);
     if(access.authorizationId!==doc.id)throw new GoogleWorkspaceCommandError('WORKSPACE_EXECUTION_FENCED',409);
     const google=this.port(access.accessToken,projectId);
     if(initialize)await service.initializeBound(projectId,actor,google as GoogleBlueprintPort);
     else await service.retrySync(projectId,actor,google,user?{pendingOnly:true}:false);
     const status=await service.status(projectId,actor),dirty=(await getState(projectId,this.database)).dirtyTabs.some(isMasterTab);
     if(status.pendingSyncCount||dirty||status.syncHealth!=='HEALTHY'||status.workspaceState!=='CONNECTED')result.deferred++;else result.delivered++;
    }catch(error){
     const code=error instanceof GoogleWorkspaceCommandError?error.code:undefined;
     if(!attempted&&attentionCodes.has(code||'')||code==='WORKSPACE_NO_PENDING_WORK')result.skipped++;else result.deferred++;
     if(attempted)await this.noteProjectFailure(projectId,actor,doc.id,code).catch(()=>{/* Existing leases/diagnosis remain authoritative if state storage is unavailable. */});
    }
   }
   if(processed===page.docs.length)cursor=null;
   return result;
  }finally{
   await this.database.runTransaction(async(tx:any)=>{const s=(await tx.get(ref)).data();if(s?.owner===owner)tx.set(ref,{...s,cursor,owner:null,expiresAt:0});});
  }
 }
 private async noteProjectFailure(projectId:string,who:AuthUserContext,id:string,code?:string){
  if(['WORKSPACE_SYNC_IN_PROGRESS','WORKSPACE_EXECUTION_FENCED','WORKSPACE_NO_PENDING_WORK'].includes(code||''))return;
  await this.database.runTransaction(async(tx:any)=>{
   const ref=continuityRef(this.database,projectId),s=(await tx.get(ref)).data(),g=(await tx.get(this.database.collection(AUTHORIZATIONS).doc(id))).data();
   if(s?.backgroundAuthorizationId!==id||s.syncOwner||g?.projectId!==projectId||g.actorId!==who.userId)return;
   const missing=s.state==='BOUND_FILE_UNAVAILABLE'||['BOUND_FILE_UNAVAILABLE','PROJECT_WORKSPACE_FILE_MISSING'].includes(code||''),auth=s.state==='AUTHORIZATION_REQUIRED'||s.backgroundAuthorization==='AUTHORIZATION_REQUIRED';
   const bounded=code&&(isGoogleProviderCode(code)||attentionCodes.has(code))?code:'WORKSPACE_COORDINATOR_DEFERRED';
   tx.set(ref,{...s,state:missing?'BOUND_FILE_UNAVAILABLE':auth?'AUTHORIZATION_REQUIRED':'SYNC_DEGRADED',lastSyncError:auth?s.lastSyncError||'AUTHORIZATION_REQUIRED':bounded});
  });
 }
}
