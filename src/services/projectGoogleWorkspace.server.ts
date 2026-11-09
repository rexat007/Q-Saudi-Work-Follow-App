import {WorkspaceProjectionDelivery,runProjectionDelivery,projectionHash,PROJECTION_LIMITS} from '../../server/workspaceProjectionDelivery';
import {workspaceBindingAdoption} from './workspaceBindingHandoff';
import {boundedWorkspaceHttpCode} from '../utils/workspaceHttp';
import {workspaceGrantBinding,workspaceGrantFailure,boundedAuthorizationDiagnosis} from '../utils/workspaceAuthorization';
import {isGoogleProviderCode,classifyGoogleProviderFailure} from '../../server/workspaceGoogleErrors';
import { assertBlueprint, BlueprintError, type WorkspaceBlueprint } from './googleWorkspaceBlueprint/contract';
import { activeWorkspaceBlueprint } from './googleWorkspaceBlueprint/sabilHailV1';
import { createHash, randomUUID } from 'node:crypto';
import { adminDb } from '../firebase/admin';
import { buildPrincipal } from '../utils/principal';
import { decodeProject } from '../utils/persistenceBoundary';
import { assertFoundationMutation } from './projectMutability.policy';
import type { AuthUserContext } from '../types/common';
import type { ProjectEntity } from '../types/entities';
import type { ProjectGoogleBinding, ProjectGoogleStatus } from '../types/projectGoogleWorkspace';
import type { OperationalSheetInput } from './projectGoogleSheetContract';
import {classifyWorkspaceGenerationFailure, type WorkspaceGenerationDiagnostic, type WorkspaceGenerationOperation} from '../utils/workspaceGenerationDiagnostics';
import type {CanonicalWorkspaceMasterProjection} from './projectWorkspaceMasterContract';
import {MASTER_TABS,isMasterTab} from './projectWorkspaceMasterContract';
import {markDirtyInTransaction,getState as projectionState,markProjectionSuccessful} from './projectWorkspaceProjectionState.server';
import {resolveWorkspaceTemplate} from './workspaceTemplateRegistry';
import {resolveOperationalProfile} from './operationalProfileResolver';

export class GoogleWorkspaceCommandError extends Error {
  constructor(public code: string, public status = 409, public diagnostic?: WorkspaceGenerationDiagnostic) { super(code); }
}
export const gwsFail = (code: string, status = 409): never => { throw new GoogleWorkspaceCommandError(code,status); };
export async function withWorkspaceGenerationDiagnostic<T>(operation: WorkspaceGenerationOperation, run: () => Promise<T>): Promise<T> {
  try { return await run(); } catch(error) {
    if(error instanceof GoogleWorkspaceCommandError && (error.diagnostic||isGoogleProviderCode(error.code))) throw error;
    const failure=classifyWorkspaceGenerationFailure(error,operation,error instanceof GoogleWorkspaceCommandError || error instanceof BlueprintError ? error.code : undefined);
    throw new GoogleWorkspaceCommandError(failure.code,isGoogleProviderCode(failure.code)?classifyGoogleProviderFailure(error).status:502,failure.diagnostic);
  }
}
export interface TemplateConfiguration { id: string; version: string }
export function configuredTemplate(): TemplateConfiguration {
  const id = process.env.GOOGLE_PROJECT_TEMPLATE_FILE_ID;
  const version = process.env.GOOGLE_PROJECT_TEMPLATE_VERSION;
  if (!id || !/^[\w-]+$/.test(id) || !version || version.length > 128) return gwsFail('TEMPLATE_CONFIGURATION_REQUIRED',503);
  return {id,version};
}
export interface GoogleTemplatePort {
  subject(): Promise<string>;
  accountLabel?(): string;
  validateTemplate(templateId: string): Promise<void>;
  findCopies(operationId: string): Promise<Array<{id: string; folderId: string}>>;
  createFolder(name: string, operationId: string): Promise<string>;
  copyTemplate(templateId: string, name: string, folderId: string, operationId: string): Promise<string>;
  verify(fileId: string, operationId?: string): Promise<void>;
  initializeCopy(fileId: string): Promise<void>;
  upsert(fileId: string, input: OperationalSheetInput): Promise<void>;
}
export interface GoogleBlueprintPort extends GoogleTemplatePort {
  findManagedFolders?(subjectHash:string,role:import('./workspaceManagedRoot.server').ManagedFolderRole):Promise<Array<{id:string}>>;
  createManagedFolder?(name:string,parentId:string|null,subjectHash:string,role:import('./workspaceManagedRoot.server').ManagedFolderRole):Promise<string>;
  verifyManagedFolder?(id:string,subjectHash:string,role:import('./workspaceManagedRoot.server').ManagedFolderRole,parentId:string|null):Promise<void>;
  verifyScriptParent?(fileId:string,scriptId:string,version:string):Promise<void>;
  projectProfileTrip?(fileId:string,trip:import('../types/entities').TripEntity,blueprint:WorkspaceBlueprint):Promise<void>;
  projectProfileReports?(fileId:string,report:ReturnType<typeof import('./operationalReporting').buildOperationalReport>):Promise<void>;
  setDeliveryFence?(check:()=>Promise<void>):void;
  authorizeProvisioning():Promise<void>;
  authorizeBinding():Promise<void>;
  verifyBinding(rootId:string,folderId:string,fileId:string,version:string):Promise<{title:string}>;
  verifyWorkbook(fileId:string,blueprint:WorkspaceBlueprint):Promise<void>;
  projectMasterTabs(fileId:string,snapshot:CanonicalWorkspaceMasterProjection,tabs:readonly string[]):Promise<void>;
  validateDestination(folderId:string,projectId:string):Promise<void>;
  findResource(operationId:string,role:'FOLDER'|'SPREADSHEET'):Promise<Array<{id:string;parentId:string}>>;
  createProjectFolder(name:string,parentId:string,operationId:string,version:string):Promise<string>;
  createProjectSpreadsheet(name:string,folderId:string,operationId:string,version:string):Promise<string>;
  applyBlueprint(fileId:string,blueprint:WorkspaceBlueprint):Promise<void>;
  createBoundScript(fileId:string):Promise<string>;
  installScript(scriptId:string,blueprint:WorkspaceBlueprint):Promise<void>;
  verifyGenerated(fileId:string,scriptId:string,blueprint:WorkspaceBlueprint):Promise<void>;
  setInitializationObserver?(observer?: (stage:'VERIFY_BINDING'|'INSPECT_WORKBOOK_METADATA'|'INSPECT_CANONICAL_RANGES'|'PLAN_REPAIR'|'APPLY_REPAIR'|'VERIFY_REPAIR'|'VERIFY_AUTOMATION',metrics?:Record<string,number>)=>Promise<void>):void;
  repairWorkbook?(fileId:string,blueprint:WorkspaceBlueprint):Promise<{repaired:boolean;conflicts:string[]}>;
  verifyAutomation?(fileId:string,scriptId:string,blueprint:WorkspaceBlueprint):Promise<void>;
}
const validId=(value: unknown): value is string=>typeof value==='string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
export const workspaceOperation = (projectId: string) => createHash('sha256').update(`PFAG-GWS1:${projectId}`).digest('hex');
export function continuityRef(db: any, projectId: string) { return db.collection('projects').doc(projectId).collection('workspace_continuity').doc('current'); }
export function syncOutboxRef(db: any, projectId: string) { return db.collection('projects').doc(projectId).collection('workspace_sync_outbox'); }

function publicBinding(raw: ProjectGoogleBinding): ProjectGoogleBinding {
  return { projectId:raw.projectId,provider:'GOOGLE',spreadsheetId:raw.spreadsheetId,driveFileId:raw.driveFileId,spreadsheetUrl:raw.spreadsheetUrl,...(raw.spreadsheetTitle?{spreadsheetTitle:raw.spreadsheetTitle}:{}),templateId:raw.templateId,templateVersion:raw.templateVersion,...(raw.workspaceBlueprintVersion?{destinationRootFolderId:raw.destinationRootFolderId,projectFolderId:raw.projectFolderId,workspaceBlueprintVersion:raw.workspaceBlueprintVersion,appsScriptBlueprintVersion:raw.appsScriptBlueprintVersion}:{}),...(raw.scriptProjectId?{scriptProjectId:raw.scriptProjectId}:{}),googleSubject:raw.googleSubject,googleAccountLabel:raw.googleAccountLabel||raw.googleSubject,provisionedAt:raw.provisionedAt,provisionedBy:raw.provisionedBy,revision:raw.revision };
}
/** One canonical server authority; Google port is transient authorization, never a credential DTO. */
export class ProjectGoogleWorkspaceServer {
  constructor(private database?: any, private template: ()=>TemplateConfiguration = configuredTemplate, private blueprint:()=>WorkspaceBlueprint = activeWorkspaceBlueprint,private backgroundGrantId?:string,private ensureOwner?:string) {}
  private get db() { return this.database || adminDb; }
  forExecutionAuthorization(authorizationId?:string):ProjectGoogleWorkspaceServer {
    return authorizationId?new ProjectGoogleWorkspaceServer(this.database,this.template,this.blueprint,authorizationId,this.ensureOwner):this;
  }
  forEnsure(owner:string,authorizationId?:string) {return new ProjectGoogleWorkspaceServer(this.database,this.template,this.blueprint,authorizationId,owner);}
  resolvedBlueprint(project:ProjectEntity,binding?:ProjectGoogleBinding) {
    if(!project.operationalConfiguration){if(project.operationalConfigurationRequired)return gwsFail('OPERATIONAL_CONFIGURATION_REQUIRED');return this.blueprint();}
    if(binding?.workspaceBlueprintVersion==='SABIL-HAIL-V1'&&resolveOperationalProfile(project.operationalConfiguration)==='DUAL_WEIGHBRIDGE')return {...resolveWorkspaceTemplate(project.operationalConfiguration).blueprint,version:'SABIL-HAIL-V1'}; // Explicit legacy-dual adoption preserves resource tags/IDs and adds safe profile views.
    const blueprint=resolveWorkspaceTemplate(project.operationalConfiguration,Boolean(binding?.workspaceBlueprintVersion?.endsWith('_FRESH_V2')||!binding&&this.ensureOwner)).blueprint;
    if(binding&&binding.workspaceBlueprintVersion!==blueprint.version)return gwsFail('WORKSPACE_TEMPLATE_MIGRATION_REQUIRED');return blueprint;
  }
  async authorized(tx: any, projectId: string, who: AuthUserContext) {
    if (!validId(projectId) || !validId(who?.userId)) return gwsFail('FORBIDDEN_PROJECT_ACCESS',403);
    const account=await tx.get(this.db.collection('users').doc(who.userId));
    const principal=buildPrincipal(account.exists?account.data():null,who.userId,{});
    if (principal.role!=='SUPER_ADMIN' && (principal.role!=='PROJECT_ADMIN' || !principal.assignedProjectIds.includes(projectId))) return gwsFail('FORBIDDEN_PROJECT_ACCESS',403);
    const snap=await tx.get(this.db.collection('projects').doc(projectId));
    if(!snap.exists) return gwsFail('PROJECT_NOT_FOUND',404);
    const project=decodeProject<ProjectEntity>(snap.data(),projectId);
    assertFoundationMutation(project.status,'MAINTENANCE');
    if(this.ensureOwner){const s=(await tx.get(continuityRef(this.db,projectId))).data();if(s?.ensureOperation?.leaseOwner!==this.ensureOwner||s.ensureOperation.leaseExpiresAt<=Date.now())return gwsFail('WORKSPACE_EXECUTION_FENCED');}
    if(this.backgroundGrantId){
      const continuity=await tx.get(continuityRef(this.db,projectId)),grant=await tx.get(this.db.collection('workspace_google_authorizations').doc(this.backgroundGrantId));
      const b=workspaceGrantBinding(continuity.data()),g=grant.data();
      const reason=continuity.data()?.backgroundAuthorizationId!==this.backgroundGrantId?'AUTH_GRANT_NOT_ACTIVE':workspaceGrantFailure(g,b,projectId,who.userId);
      if(reason)throw Object.assign(new GoogleWorkspaceCommandError('AUTHORIZATION_REQUIRED',401),{authorizationReason:reason});
    }
    return {project,principal};
  }
  private audit(tx:any,projectId:string,actor:string,action:string,details:Record<string,unknown>) {
    const ref=this.db.collection('projects').doc(projectId).collection('audit_logs').doc(randomUUID());
    tx.set(ref,{auditLogId:ref.id,projectId,action,entityType:'PROJECT_GOOGLE_WORKSPACE',createdBy:actor,createdAt:new Date().toISOString(),details});
  }
  async templateConfiguration(projectId:string,who:AuthUserContext) {
    if(process.env.NODE_ENV!=='test')return gwsFail('LEGACY_TEMPLATE_PROVISIONING_RETIRED',410);
    await this.db.runTransaction((tx:any)=>this.authorized(tx,projectId,who));
    return this.template();
  }
  async status(projectId:string,who:AuthUserContext):Promise<ProjectGoogleStatus> {
    const state=await this.db.runTransaction(async(tx:any)=>{
      await this.authorized(tx,projectId,who);
      const snap=await tx.get(continuityRef(this.db,projectId));return snap.exists?snap.data():{};
    });
    // Canonical enqueue writes PENDING; terminal history is not current work.
    const jobs=await syncOutboxRef(this.db,projectId).where('status','==','PENDING').count().get();
    const pending=jobs.data().count;
    const scriptId=state.scriptProjectId||state.binding?.scriptProjectId,knownScript=validId(scriptId)?scriptId:undefined;
    const automationState=state.automationState||'NOT_INSTALLED';
    const recovery=Boolean(state.binding&&!knownScript&&automationState!=='NOT_REQUIRED'&&(!state.automationCreationAllowed||state.lastAutomationError==='AUTOMATION_RECOVERY_REQUIRED'||['SCRIPT_REQUESTED','CREATE_REQUESTED','SCRIPT_CREATED','CREATED','CONTENT_INSTALLING','CONTENT_INSTALLED'].includes(state.automationStage||state.stage)));
    const maintenance=Boolean(state.binding&&knownScript&&['DEGRADED','NOT_INSTALLED'].includes(automationState));
    const automationScope=state.lastAutomationError==='AUTOMATION_SCOPE_REQUIRED'||/^SCOPE_DENIED(?::script\.projects)?$/.test(state.lastAutomationError||'');
    const freshness=await projectionState(projectId,this.db);
    return {projection:{sourceRevision:freshness.mutationRevision,lastDeliveredSourceRevision:state.lastDeliveredSourceRevision??null,stale:Boolean(pending||freshness.dirtyTabs.some(isMasterTab)||state.activeProjectionDelivery||state.projectionRpc||state.lastDeliveredSourceRevision!==freshness.mutationRevision),deliveryState:state.projectionDeliveryState||'CURRENT',retryAt:state.projectionRetryAt||null,deliveryId:state.activeProjectionDelivery?.key||state.projectionReviewId||null,reportsStale:state.lastReportSourceRevision!==freshness.mutationRevision,lastReportSourceRevision:state.lastReportSourceRevision??null},lastReportRefreshAt:state.lastReportRefreshAt||null,...(state.ensureOperation?{provisioningOperationId:state.ensureOperation.operationId}:{}),authorizationDiagnostic:boundedAuthorizationDiagnosis(state.authorizationDiagnostic),state:state.state||'NOT_CONNECTED',binding:state.binding?publicBinding({...state.binding,...(knownScript?{scriptProjectId:knownScript}:{})}):null,lastSuccessfulSyncAt:state.lastSuccessfulSyncAt||null,lastSyncError:state.lastSyncError||null,pendingSyncCount:pending,workspaceState:state.binding?(state.state==='BOUND_FILE_UNAVAILABLE'?'BOUND_FILE_UNAVAILABLE':'CONNECTED'):state.folderId||state.fileId?'CONNECTING':'NOT_CONNECTED',syncHealth:state.state==='AUTHORIZATION_REQUIRED'?'AUTHORIZATION_REQUIRED':state.state==='SYNC_DEGRADED'?'DEGRADED':pending?'PENDING':'HEALTHY',workbookHealth:state.workbookHealth||'REPAIR_REQUIRED',automationState:state.automationState||'NOT_INSTALLED',backgroundAuthorization:state.backgroundAuthorization||'NOT_CONNECTED',syncTrigger:'USER_ACTIVE',automationRecoveryRequired:recovery,automationMaintenanceRequired:maintenance,automationDiagnostic:recovery?{code:'AUTOMATION_RECOVERY_REQUIRED'}:maintenance?{code:automationScope?'AUTOMATION_SCOPE_REQUIRED':'AUTOMATION_MAINTENANCE_REQUIRED'}:null,recoveryAvailable:!state.binding&&Boolean(state.destinationRootFolderId&&(state.folderId||state.fileId))};
  }
  async approveDestination(projectId:string,rootId:string,who:AuthUserContext,google:GoogleBlueprintPort) {
    if(!validId(rootId))return gwsFail('DESTINATION_FOLDER_REQUIRED',400);
    if((await this.status(projectId,who)).binding)return gwsFail('AUTHORIZATION_REQUIRED',401);
    const subject=await google.subject();await google.authorizeBinding();
    const {project}=await this.db.runTransaction((tx:any)=>this.authorized(tx,projectId,who));assertBlueprint(this.resolvedBlueprint(project),false);
    await google.validateDestination(rootId,projectId);
    return this.db.runTransaction(async(tx:any)=>{
      await this.authorized(tx,projectId,who);
      const continuity=await tx.get(continuityRef(this.db,projectId));
      if(continuity.data()?.binding) {
        if(continuity.data().binding.destinationRootFolderId!==rootId)return gwsFail('EXPLICIT_MIGRATION_REQUIRED');
        return {destinationRootFolderId:rootId};
      }
      if(continuity.data()?.destinationRootFolderId&&continuity.data().destinationRootFolderId!==rootId)return gwsFail('EXPLICIT_MIGRATION_REQUIRED');
      tx.set(this.db.collection('projects').doc(projectId).collection('workspace_destination').doc('current'),{projectId,rootId,subject,actorId:who.userId,approvedAt:new Date().toISOString()});
      this.audit(tx,projectId,who.userId,'WORKSPACE_DESTINATION_SELECTED',{destinationRootFolderId:rootId});
      return {destinationRootFolderId:rootId};
    });
  }
  async resume(projectId:string,who:AuthUserContext,google:GoogleBlueprintPort):Promise<ProjectGoogleBinding> {
    const rootId=await this.db.runTransaction(async(tx:any)=>{
      await this.authorized(tx,projectId,who);const snap=await tx.get(continuityRef(this.db,projectId));
      if(!snap.exists)return gwsFail('WORKSPACE_RECOVERY_REQUIRED');
      const s=snap.data();if(s.projectId!==projectId||!validId(s.destinationRootFolderId))return gwsFail('WORKSPACE_EXTERNAL_BINDING_INVALID');
      this.audit(tx,projectId,who.userId,'WORKSPACE_RECOVERY_REQUESTED',{stage:s.stage||null});return s.destinationRootFolderId;
    });
    return this.provision(projectId,rootId,who,google,true);
  }
  async initialProjectionResult(projectId:string,fileId:string,who:AuthUserContext,error:string|null) {
    await this.db.runTransaction(async(tx:any)=>{
      await this.authorized(tx,projectId,who);const ref=continuityRef(this.db,projectId),snap=await tx.get(ref),state=snap.data();
      if(!state?.binding||state.binding.projectId!==projectId||state.binding.spreadsheetId!==fileId)return gwsFail('WORKSPACE_BINDING_INVALID');
      const next=error?(error==='TOKEN_EXPIRED'||error==='GOOGLE_ACCESS_TOKEN_REQUIRED'||error.startsWith('SCOPE_DENIED')?'AUTHORIZATION_REQUIRED':error==='BOUND_FILE_UNAVAILABLE'?'BOUND_FILE_UNAVAILABLE':'SYNC_DEGRADED'):'READY';
      tx.set(ref,{...state,state:next,lastSyncError:error,...(!error?{lastSuccessfulSyncAt:new Date().toISOString()}:{})});
      this.audit(tx,projectId,who.userId,error?'WORKSPACE_INITIAL_PROJECTION_FAILED':'WORKSPACE_INITIAL_PROJECTED',{code:error});
    });
  }
  async recoverAutomation(projectId:string,scriptId:string,who:AuthUserContext,google:GoogleBlueprintPort) {
    if(!validId(scriptId)||!google.verifyScriptParent)return gwsFail('SCRIPT_PARENT_PROOF_REQUIRED');
    const owner=randomUUID(),claimed=await this.claimSync(projectId,who,owner),binding=claimed.binding;
    google.setDeliveryFence?.(()=>this.renewSync(projectId,who,owner));
    try{
      if(binding.scriptProjectId&&binding.scriptProjectId!==scriptId)return gwsFail('SCRIPT_IDENTITY_CONFLICT');
      if(await google.subject()!==binding.googleSubject)return gwsFail('WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION');
      await google.authorizeProvisioning();
      await google.verifyBinding(binding.destinationRootFolderId,binding.projectFolderId,binding.spreadsheetId,binding.workspaceBlueprintVersion);
      await google.verifyScriptParent(binding.spreadsheetId,scriptId,binding.workspaceBlueprintVersion);
      await this.db.runTransaction(async(tx:any)=>{
        await this.authorized(tx,projectId,who);const ref=continuityRef(this.db,projectId),snap=await tx.get(ref),s=snap.data();
        if(s.syncOwner!==owner||s.syncLeaseExpiresAt<=Date.now()||s.binding.spreadsheetId!==binding.spreadsheetId||s.binding.revision!==binding.revision)return gwsFail('WORKSPACE_EXECUTION_FENCED');
        if(s.scriptProjectId&&s.scriptProjectId!==scriptId)return gwsFail('SCRIPT_IDENTITY_CONFLICT');
        const identityRef=this.db.collection('workspace_script_identities').doc(scriptId),identity=(await tx.get(identityRef)).data();
        if(identity&&identity.projectId!==projectId)return gwsFail('SCRIPT_IDENTITY_CONFLICT');
        tx.set(identityRef,{projectId,spreadsheetId:binding.spreadsheetId,scriptProjectId:scriptId});
        tx.set(ref,{...s,scriptProjectId:scriptId,binding:{...s.binding,scriptProjectId:scriptId},automationStage:'CREATED',automationState:'NOT_INSTALLED',automationCreationAllowed:false});this.audit(tx,projectId,who.userId,'AUTOMATION_RECOVERED',{});
      });
    }finally{await this.releaseSync(projectId,owner);}
    await this.initializeBound(projectId,who,google);return this.status(projectId,who);
  }
  async provision(projectId:string,rootId:string,who:AuthUserContext,google:GoogleBlueprintPort,recovery=false):Promise<ProjectGoogleBinding> {
    await this.db.runTransaction((tx:any)=>this.authorized(tx,projectId,who));
    const prior=await this.status(projectId,who);
    if(prior.binding){if(rootId&&prior.binding.destinationRootFolderId!==rootId)return gwsFail('EXPLICIT_MIGRATION_REQUIRED');return prior.binding;} // Metadata-only idempotence; never execute with a provisioning token.
    const subject=await google.subject();
    const op=workspaceOperation(projectId),owner=randomUUID(),ref=continuityRef(this.db,projectId);
    if(!validId(rootId))return gwsFail('DESTINATION_FOLDER_REQUIRED',400);
    const {project:configuredProject}=await this.db.runTransaction((tx:any)=>this.authorized(tx,projectId,who));
    const blueprint=this.resolvedBlueprint(configuredProject);assertBlueprint(blueprint,false);
    await google.authorizeBinding();
    const recovering=recovery?(await ref.get()).data():null;
    // Existing resources require binding/access proof, not permission to create
    // another child in their parent. Missing resources still need the create gate.
    if(!recovering?.folderId||!recovering?.fileId)await google.validateDestination(rootId,projectId);
    let state=await this.db.runTransaction(async(tx:any)=>{
      const {project}=await this.authorized(tx,projectId,who),snap=await tx.get(ref);
      const receipt=await tx.get(this.db.collection('projects').doc(projectId).collection('workspace_destination').doc('current'));
      const r=receipt.data(),s=snap.exists?snap.data():{};
      if(!r||r.projectId!==projectId||r.rootId!==rootId||r.subject!==subject||(!recovery&&r.actorId!==who.userId))return gwsFail('DESTINATION_RECEIPT_REQUIRED',403);
      if(s.projectId&&s.projectId!==projectId||s.operationId&&s.operationId!==op)return gwsFail('WORKSPACE_EXTERNAL_BINDING_INVALID');
      if(s.binding)return gwsFail('WORKSPACE_PROVISIONING_IN_PROGRESS');
      if(project.settings?.googleSpreadsheetId)return gwsFail('LEGACY_WORKSPACE_REQUIRES_EXPLICIT_MIGRATION');
      if(s.stage&&!s.workspaceBlueprintVersion)return gwsFail('WORKSPACE_RECOVERY_REQUIRED');
      if(s.destinationRootFolderId&&s.destinationRootFolderId!==rootId)return gwsFail('EXPLICIT_MIGRATION_REQUIRED');
      if(s.googleSubject&&s.googleSubject!==subject)return gwsFail('WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION');
      if(s.workspaceBlueprintVersion&&s.workspaceBlueprintVersion!==blueprint.version)return gwsFail('WORKSPACE_RECOVERY_REQUIRED');
      if(s.ensureOperation?.leaseOwner&&s.ensureOperation.leaseExpiresAt>Date.now()&&s.ensureOperation.leaseOwner!==this.ensureOwner)return gwsFail('WORKSPACE_SYNC_IN_PROGRESS');
      if(s.leaseUntil>Date.now())return gwsFail('WORKSPACE_PROVISIONING_IN_PROGRESS');
      const next={...s,projectId,destinationRootFolderId:rootId,googleSubject:subject,workspaceBlueprintVersion:blueprint.version,operationId:op,owner,leaseUntil:Date.now()+120000,state:'PROVISIONING',lastGenerationDiagnostic:null,automationStage:s.automationStage||(['SCRIPT_REQUESTED','SCRIPT_CREATED','SCRIPT_INSTALLED'].includes(s.stage)?s.stage:'NOT_REQUESTED')};
      tx.set(ref,next);return {...next,project};
    });
    const save=async(patch:Record<string,unknown>)=>{
      state=await this.db.runTransaction(async(tx:any)=>{
        await this.authorized(tx,projectId,who);const snap=await tx.get(ref);
        if(snap.data()?.owner!==owner||snap.data().leaseUntil<=Date.now())return gwsFail('WORKSPACE_EXECUTION_FENCED');
        const next={...snap.data(),...patch,leaseUntil:Date.now()+120000};tx.set(ref,next);return {...next,project:state.project};
      });
    };
    google.setDeliveryFence?.(()=>save({}));
    const reconcile=async(role:'FOLDER'|'SPREADSHEET',parentId:string)=>{
      const matches=await google.findResource(op,role);
      if(matches.length!==1||matches[0].parentId!==parentId)return gwsFail('WORKSPACE_RECOVERY_REQUIRED');
      return matches[0].id;
    };
    try {
      const name=this.ensureOwner?`${state.project.projectCode||projectId} — ${state.project.nameAr}`:`${state.project.nameAr} — ${state.project.projectCode||projectId}`;
      if(!state.folderId) {
        let folderId:string;
        if(state.stage==='FOLDER_REQUESTED')folderId=await reconcile('FOLDER',rootId);
        else {await save({stage:'FOLDER_REQUESTED'});folderId=await google.createProjectFolder(name,rootId,op,blueprint.version);}
        await save({folderId,stage:'FOLDER_CREATED'});
        await this.db.runTransaction(async(tx:any)=>this.audit(tx,projectId,who.userId,'WORKSPACE_PROJECT_FOLDER_CREATED',{folderId}));
      }
      if(!state.fileId) {
        let fileId:string;
        if(state.stage==='SPREADSHEET_REQUESTED')fileId=await reconcile('SPREADSHEET',state.folderId);
        else {await save({stage:'SPREADSHEET_REQUESTED'});fileId=await google.createProjectSpreadsheet(name,state.folderId,op,blueprint.version);}
        await save({fileId,stage:'SPREADSHEET_CREATED',automationCreationAllowed:true});
        await this.db.runTransaction(async(tx:any)=>this.audit(tx,projectId,who.userId,'WORKSPACE_PROJECT_WORKBOOK_CREATED',{fileId}));
      }
      const resource=await google.verifyBinding(rootId,state.folderId,state.fileId,blueprint.version);
      const binding:ProjectGoogleBinding={projectId,provider:'GOOGLE',destinationRootFolderId:rootId,projectFolderId:state.folderId,spreadsheetId:state.fileId,driveFileId:state.fileId,spreadsheetUrl:`https://docs.google.com/spreadsheets/d/${state.fileId}/edit`,spreadsheetTitle:resource.title,workspaceBlueprintVersion:blueprint.version,...(state.scriptProjectId?{scriptProjectId:state.scriptProjectId,...(blueprint.script?{appsScriptBlueprintVersion:blueprint.script.version}:{})}:{}),googleSubject:subject,googleAccountLabel:google.accountLabel?.()||subject,provisionedAt:new Date().toISOString(),provisionedBy:who.userId,revision:1};
      await withWorkspaceGenerationDiagnostic('PERSIST_BINDING',()=>this.db.runTransaction(async(tx:any)=>{
        const {project}=await this.authorized(tx,projectId,who),snap=await tx.get(ref);
        if(snap.data()?.owner!==owner||snap.data()?.binding)return gwsFail('WORKSPACE_EXECUTION_FENCED');
        const grantRef=this.backgroundGrantId?this.db.collection('workspace_google_authorizations').doc(this.backgroundGrantId):null;
        const grant=grantRef?(await tx.get(grantRef)).data():null;
        const adoption=this.ensureOwner&&this.backgroundGrantId?workspaceBindingAdoption(snap.data(),binding,grant,this.backgroundGrantId,who.userId):null;
        if(this.ensureOwner&&!adoption)return gwsFail('WORKSPACE_BINDING_CONFLICT');
        await markDirtyInTransaction(tx,projectId,MASTER_TABS.map(spec=>spec.key),'WORKSPACE_CONNECTED',undefined,this.db);
        if(grantRef&&grant)tx.set(grantRef,adoption?.grant||{...grant,spreadsheetId:binding.spreadsheetId,bindingRevision:binding.revision,updatedAt:Date.now()});
        tx.set(ref,{...snap.data(),...(adoption?{ensureOperation:adoption.operation}:{}),binding,state:'READY',workspaceState:'CONNECTED',workbookHealth:'REPAIR_REQUIRED',automationState:snap.data()?.automationState||'NOT_INSTALLED',stage:'BOUND',leaseUntil:0,lastSyncError:null,lastGenerationDiagnostic:null});
        tx.update(this.db.collection('projects').doc(projectId),{settings:{...project.settings,googleDriveFolderId:binding.projectFolderId,googleSpreadsheetId:binding.spreadsheetId,googleDriveProvisioning:{enabled:true,status:'PROVISIONED',rootFolderName:name,spreadsheetTitle:name}},updatedBy:who.userId,updatedAt:new Date().toISOString()});
        this.audit(tx,projectId,who.userId,'WORKSPACE_BOUND',{fileId:binding.spreadsheetId,workspaceBlueprintVersion:blueprint.version,...(binding.scriptProjectId?{scriptProjectId:binding.scriptProjectId}:{})});
      }));
      // Re-read the committed handoff. A real Firestore transaction need not update prior local snapshots.
      if(this.ensureOwner)await this.verifyEnsureBindingHandoff(projectId,who);
      return binding;
    } catch(error) {
      const code=(error as {code?:string}).code||'SPREADSHEET_GENERATION_FAILED';
      const diagnostic=error instanceof GoogleWorkspaceCommandError ? error.diagnostic : undefined;
      await this.db.runTransaction(async(tx:any)=>{const snap=await tx.get(ref),s=snap.data();if(s?.owner===owner&&!s.binding)tx.set(ref,{...s,state:s.binding?(s.state==='AUTHORIZATION_REQUIRED'?'AUTHORIZATION_REQUIRED':code==='BOUND_FILE_UNAVAILABLE'?'BOUND_FILE_UNAVAILABLE':'SYNC_DEGRADED'):'FAILED',lastSyncError:code,leaseUntil:0,lastGenerationDiagnostic:diagnostic||null});});
      throw new GoogleWorkspaceCommandError(code,502,diagnostic);
    }
  }
  async verifyEnsureBindingHandoff(projectId:string,who:AuthUserContext) {
    return this.db.runTransaction(async(tx:any)=>{await this.authorized(tx,projectId,who);const s=(await tx.get(continuityRef(this.db,projectId))).data(),op=s?.ensureOperation,g=this.backgroundGrantId?(await tx.get(this.db.collection('workspace_google_authorizations').doc(this.backgroundGrantId))).data():null;
      if(!this.ensureOwner||!s?.binding||op?.bindingRevision!==s.binding.revision||op.spreadsheetId!==s.binding.spreadsheetId||g?.spreadsheetId!==s.binding.spreadsheetId||g.bindingRevision!==s.binding.revision||g.subject!==s.binding.googleSubject||g.provisioningOperationId&&g.provisioningOperationId!==op.operationId)return gwsFail('WORKSPACE_BINDING_CONFLICT');return s.binding as ProjectGoogleBinding;
    });
  }
  /** Post-binding initialization never revokes a valid resource binding. One expiring
   * execution lease also serializes repair, automation and projection requests. */
  async initializeBound(projectId:string,who:AuthUserContext,google:GoogleBlueprintPort,options:{workbookOnly?:boolean}={}) {
    const recovery=await this.db.runTransaction(async(tx:any)=>{await this.authorized(tx,projectId,who);const s=(await tx.get(continuityRef(this.db,projectId))).data();return Boolean(s?.activeProjectionDelivery||s?.projectionRpc);});
    if(recovery)await this.retrySync(projectId,who,google,true);
    const owner=randomUUID(),claimed=await this.claimSync(projectId,who,owner);
    google.setDeliveryFence?.(()=>this.renewSync(projectId,who,owner));
    const ref=continuityRef(this.db,projectId);let blueprint:WorkspaceBlueprint,workbookVerified=false;
    const save=async(patch:Record<string,unknown>,action?:string,dirty=false)=>this.db.runTransaction(async(tx:any)=>{
      await this.authorized(tx,projectId,who);const snap=await tx.get(ref),s=snap.data();
      if(s?.syncOwner!==owner||s.syncLeaseExpiresAt<=Date.now()||s.syncLeaseRevision!==(s.binding?.revision??0)||s.syncLeaseSpreadsheetId!==s.binding?.spreadsheetId)return gwsFail('WORKSPACE_EXECUTION_FENCED');
      if(dirty){const existing=await projectionState(projectId,this.db,tx);if(!MASTER_TABS.every(tab=>existing.dirtyTabs.includes(tab.key)))await markDirtyInTransaction(tx,projectId,MASTER_TABS.map(spec=>spec.key),'WORKBOOK_INITIALIZATION',undefined,this.db);}
      tx.set(ref,{...s,...patch});if(action)this.audit(tx,projectId,who.userId,action,{});
    });
    google.setInitializationObserver?.(async(stage,metrics)=>save({lastInitializationStage:stage,...(metrics?{lastInitializationMetrics:metrics}:{})}));
    const heartbeat=setInterval(()=>{void this.renewSync(projectId,who,owner).catch(()=>{});},30000);heartbeat.unref?.();
    try {
      blueprint=this.resolvedBlueprint(claimed.project,claimed.binding);
      const state=(await ref.get()).data(),b=state.binding;
      if(await google.subject()!==b.googleSubject)return gwsFail('WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION');
      await save({lastInitializationStage:'VERIFY_BINDING'});
      await google.verifyBinding(b.destinationRootFolderId,b.projectFolderId,b.spreadsheetId,b.workspaceBlueprintVersion);
      await save({workbookHealth:'REPAIRING'});
      try {
        const result=google.repairWorkbook?await google.repairWorkbook(b.spreadsheetId,blueprint):await google.verifyWorkbook(b.spreadsheetId,blueprint).then(()=>({repaired:false,conflicts:[]}));
        workbookVerified=result.conflicts.length===0;
        await save({...(workbookVerified?{}:{state:'SYNC_DEGRADED',lastSyncError:'WORKBOOK_OPERATOR_REVIEW_REQUIRED'}),workbookHealth:result.conflicts.length?'REPAIR_REQUIRED':'HEALTHY',lastWorkbookError:result.conflicts.length?'WORKBOOK_OPERATOR_REVIEW_REQUIRED':null,lastGenerationDiagnostic:null},result.repaired?'WORKBOOK_REPAIRED':undefined,result.repaired||!state.lastSuccessfulSyncAt);
      } catch(error){await save({state:'SYNC_DEGRADED',lastSyncError:error instanceof GoogleWorkspaceCommandError?error.code:'WORKBOOK_REPAIR_FAILED',workbookHealth:'DEGRADED',lastWorkbookError:error instanceof GoogleWorkspaceCommandError?error.code:'WORKBOOK_REPAIR_FAILED',lastGenerationDiagnostic:error instanceof GoogleWorkspaceCommandError?error.diagnostic||null:null});}
      if(workbookVerified&&!options.workbookOnly)try {
        await save({lastInitializationStage:'VERIFY_AUTOMATION'});
        await this.reconcileAutomation(projectId,google,blueprint,b,save);
      } catch(error){
        await save({automationState:'DEGRADED',lastAutomationError:error instanceof GoogleWorkspaceCommandError?error.code:'AUTOMATION_INSTALL_FAILED',lastAutomationDiagnostic:error instanceof GoogleWorkspaceCommandError?error.diagnostic||null:null});
      }
    } catch(error){
      const code=error instanceof GoogleWorkspaceCommandError?error.code:'WORKSPACE_INITIALIZATION_FAILED';
      await save({state:code==='BOUND_FILE_UNAVAILABLE'?'BOUND_FILE_UNAVAILABLE':/TOKEN_EXPIRED|AUTHORIZATION_REQUIRED|SCOPE_DENIED/.test(code)?'AUTHORIZATION_REQUIRED':'SYNC_DEGRADED',lastSyncError:code});
      throw error;
    } finally {google.setInitializationObserver?.();clearInterval(heartbeat);await this.releaseSync(projectId,owner);}
    if(workbookVerified&&!options.workbookOnly&&google.projectMasterTabs)await this.retrySync(projectId,who,google,true).catch(()=>{});
  }
  private async reconcileAutomation(projectId:string,google:GoogleBlueprintPort,blueprint:WorkspaceBlueprint,b:ProjectGoogleBinding,save:(patch:Record<string,unknown>,action?:string,dirty?:boolean)=>Promise<any>,expectedScriptId?:string) {
        let current=(await continuityRef(this.db,projectId).get()).data(),scriptId=current.scriptProjectId||b.scriptProjectId,created=false;
        if(current.scriptProjectId&&b.scriptProjectId&&current.scriptProjectId!==b.scriptProjectId)return gwsFail('SCRIPT_IDENTITY_CONFLICT');
        if(expectedScriptId&&scriptId!==expectedScriptId)return gwsFail('SCRIPT_IDENTITY_CONFLICT');
        assertBlueprint(blueprint,true);await google.authorizeProvisioning();
        if(!scriptId){
          if(expectedScriptId)return gwsFail('AUTOMATION_RECOVERY_REQUIRED');
          // There is no Apps Script get-by-parent API. Uncertain historical creates
          // cannot be converted into proof of non-existence by an empty Drive list.
          if(!current.automationCreationAllowed||['SCRIPT_REQUESTED','CREATE_REQUESTED','SCRIPT_CREATE_INTENT'].includes(current.automationStage))return gwsFail('AUTOMATION_RECOVERY_REQUIRED');
          await save({automationState:'INSTALLING',automationStage:'SCRIPT_CREATE_INTENT',automationCreationAllowed:false});
          scriptId=await google.createBoundScript(b.spreadsheetId);
          created=true;
          await save({scriptProjectId:scriptId,automationStage:'SCRIPT_IDENTITY_RECORDED',binding:{...b,scriptProjectId:scriptId,appsScriptBlueprintVersion:blueprint.script!.version}});
        }
        await save({automationState:'INSTALLING'});
        const verify=()=>google.verifyAutomation?google.verifyAutomation(b.spreadsheetId,scriptId,blueprint):google.verifyGenerated(b.spreadsheetId,scriptId,blueprint);
        let install=created;
        if(!install)try{await verify();}catch(error){if(error instanceof GoogleWorkspaceCommandError&&error.code.endsWith('SCRIPT_CONTENT_INSTALL_FAILED'))install=true;else throw error;}
        if(install){await save({automationStage:'CONTENT_INSTALLING'});await google.installScript(scriptId,blueprint);await save({automationStage:'CONTENT_INSTALLED'});await verify();}
        await save({automationState:'READY',automationStage:'VERIFIED',lastAutomationError:null,binding:{...b,scriptProjectId:scriptId,appsScriptBlueprintVersion:blueprint.script!.version}},'AUTOMATION_INSTALLED');
  }
  /** Known-ID maintenance shares content authority but never repairs grids or projects data. */
  async maintainAutomation(projectId:string,scriptId:string,who:AuthUserContext,google:GoogleBlueprintPort) {return this.runAutomation(projectId,who,google,scriptId);}
  async ensureAutomation(projectId:string,who:AuthUserContext,google:GoogleBlueprintPort) {return this.runAutomation(projectId,who,google);}
  private async runAutomation(projectId:string,who:AuthUserContext,google:GoogleBlueprintPort,scriptId?:string) {
    if(scriptId&&!validId(scriptId))return gwsFail('SCRIPT_IDENTITY_CONFLICT');
    const owner=randomUUID(),claimed=await this.claimSync(projectId,who,owner),ref=continuityRef(this.db,projectId);
    const save=async(patch:Record<string,unknown>,action?:string)=>this.db.runTransaction(async(tx:any)=>{
      await this.authorized(tx,projectId,who);const s=(await tx.get(ref)).data();
      if(s?.syncOwner!==owner||s.syncLeaseExpiresAt<=Date.now()||s.syncLeaseRevision!==(s.binding?.revision??0)||s.syncLeaseSpreadsheetId!==s.binding?.spreadsheetId)return gwsFail('WORKSPACE_EXECUTION_FENCED');
      if(scriptId&&(s.scriptProjectId||s.binding?.scriptProjectId)!==scriptId||s.scriptProjectId&&s.binding?.scriptProjectId&&s.scriptProjectId!==s.binding.scriptProjectId)return gwsFail('SCRIPT_IDENTITY_CONFLICT');
      const id=(patch.binding as ProjectGoogleBinding|undefined)?.scriptProjectId;
      const identityRef=id?this.db.collection('workspace_script_identities').doc(id):null,identity=identityRef?(await tx.get(identityRef)).data():null;
      if(identity&&identity.projectId!==projectId)return gwsFail('SCRIPT_IDENTITY_CONFLICT');
      if(identityRef)tx.set(identityRef,{projectId,spreadsheetId:s.binding.spreadsheetId,scriptProjectId:id});
      tx.set(ref,{...s,...patch});if(action)this.audit(tx,projectId,who.userId,action,{});
    });
    google.setDeliveryFence?.(async()=>{await this.renewSync(projectId,who,owner);await save({});});
    const heartbeat=setInterval(()=>{void this.renewSync(projectId,who,owner).catch(()=>{});},30000);heartbeat.unref?.();
    try {
      await save({});const b=claimed.binding;
      if(await google.subject()!==b.googleSubject)return gwsFail('WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION');
      await google.verifyBinding(b.destinationRootFolderId!,b.projectFolderId!,b.spreadsheetId,b.workspaceBlueprintVersion!);
      await this.reconcileAutomation(projectId,google,this.resolvedBlueprint(claimed.project,b),b,save,scriptId);
    } catch(error) {
      const original=error instanceof GoogleWorkspaceCommandError?boundedWorkspaceHttpCode(error.code):null;
      const current=(await ref.get()).data(),uncertain=!current?.scriptProjectId&&!current?.binding?.scriptProjectId&&['SCRIPT_CREATE_INTENT','CREATE_REQUESTED','SCRIPT_REQUESTED'].includes(current?.automationStage);
      const code=uncertain?'SCRIPT_CREATE_IDENTITY_UNCERTAIN':original&&/^SCOPE_DENIED(?::script\.projects)?$/.test(original)?'AUTOMATION_SCOPE_REQUIRED':original||'AUTOMATION_INSTALL_FAILED';
      await save({automationState:'DEGRADED',lastAutomationError:code});
      throw new GoogleWorkspaceCommandError(code,error instanceof GoogleWorkspaceCommandError?error.status:502);
    } finally {clearInterval(heartbeat);await this.releaseSync(projectId,owner);}
    return this.status(projectId,who);
  }
  /** No Google I/O. The coordinator and lease claim share this maintenance boundary. */
  private assertPendingOnlyState(project:ProjectEntity,s:any) {
    if(!s?.binding||s.binding.projectId!==project.projectId)return gwsFail('WORKSPACE_NOT_PROVISIONED');
    if(s.backgroundAuthorization!=='CONNECTED'||s.state==='AUTHORIZATION_REQUIRED')return gwsFail('AUTHORIZATION_REQUIRED',401);
    if(s.projectionDeliveryState==='REVIEW_REQUIRED')return gwsFail(s.lastSyncError||'WORKSPACE_DELIVERY_REVIEW_REQUIRED');
    if(s.projectionRetryAt>Date.now())return gwsFail('WORKSPACE_DELIVERY_BACKOFF',429);
    if(s.syncOwner&&Number.isFinite(s.syncLeaseExpiresAt)&&s.syncLeaseExpiresAt>Date.now())return gwsFail('WORKSPACE_SYNC_IN_PROGRESS');
    if(s.state==='BOUND_FILE_UNAVAILABLE'||['BOUND_FILE_UNAVAILABLE','PROJECT_WORKSPACE_FILE_MISSING'].includes(s.lastSyncError))return gwsFail('BOUND_FILE_UNAVAILABLE');
    if(s.lastWorkbookError==='WORKBOOK_OPERATOR_REVIEW_REQUIRED')return gwsFail('WORKBOOK_OPERATOR_REVIEW_REQUIRED');
    if(s.lastAutomationError==='AUTOMATION_RECOVERY_REQUIRED'||!s.scriptProjectId&&!s.binding.scriptProjectId&&['SCRIPT_REQUESTED','CREATE_REQUESTED'].includes(s.automationStage||s.stage))return gwsFail('AUTOMATION_RECOVERY_REQUIRED');
    if(s.workbookHealth!=='HEALTHY'||/MIGRATION_REQUIRED/.test(s.lastSyncError||''))return gwsFail('WORKSPACE_MAINTENANCE_REQUIRED');
    const blueprint=this.resolvedBlueprint(project,s.binding);
    if((s.scriptProjectId||s.binding.scriptProjectId)&&blueprint.script&&s.binding.appsScriptBlueprintVersion!==blueprint.script.version)return gwsFail('WORKSPACE_MAINTENANCE_REQUIRED');
  }
  private async pendingWork(tx:any,projectId:string) {
    const events=await tx.get(syncOutboxRef(this.db,projectId).where('status','==','PENDING').limit(1));
    const projection=await projectionState(projectId,this.db,tx),dirtyTabs=projection.dirtyTabs.filter(isMasterTab);
    const master=dirtyTabs.length?await tx.get(syncOutboxRef(this.db,projectId).doc('MASTER_DATA')):null;
    const continuity=(await tx.get(continuityRef(this.db,projectId))).data();
    return {pending:events.docs.length>0||dirtyTabs.length>0||Boolean(continuity?.activeProjectionDelivery||continuity?.projectionRpc),projection,dirtyTabs,master};
  }
  async hasPendingUserActiveWork(projectId:string,who:AuthUserContext):Promise<boolean> {
    return this.db.runTransaction(async(tx:any)=>{const {project}=await this.authorized(tx,projectId,who),s=(await tx.get(continuityRef(this.db,projectId))).data();this.assertPendingOnlyState(project,s);return (await this.pendingWork(tx,projectId)).pending;});
  }
  private async claimSync(projectId:string,who:AuthUserContext,owner:string,pendingOnly=false) {
    const result=await this.db.runTransaction(async(tx:any)=>{
      const {project}=await this.authorized(tx,projectId,who);const ref=continuityRef(this.db,projectId),snap=await tx.get(ref),s=snap.data()||{},now=Date.now();
      if(!s.binding||s.binding.projectId!==projectId)return gwsFail('WORKSPACE_NOT_PROVISIONED');
      if(s.ensureOperation?.leaseOwner&&s.ensureOperation.leaseExpiresAt>Date.now()&&s.ensureOperation.leaseOwner!==this.ensureOwner)return gwsFail('WORKSPACE_SYNC_IN_PROGRESS');
      if(s.projectionRetryAt>Date.now()&&(!this.ensureOwner||s.projectionLastFailureEnsureOwner===this.ensureOwner))return gwsFail('WORKSPACE_DELIVERY_BACKOFF',429);
      if(s.projectionDeliveryState==='REVIEW_REQUIRED')return gwsFail(s.lastSyncError||'WORKSPACE_DELIVERY_REVIEW_REQUIRED');
      if(pendingOnly)this.assertPendingOnlyState(project,s);
      const work=await this.pendingWork(tx,projectId);
      if(pendingOnly&&!work.pending)return gwsFail('WORKSPACE_NO_PENDING_WORK');
      if(s.syncOwner){
        if(!Number.isFinite(s.syncLeaseExpiresAt)){tx.set(ref,{...s,syncLeaseExpiresAt:now+120000});return null;}
        if(s.syncLeaseExpiresAt>now)return null;
      }
      // Reestablish only the metadata event for an existing canonical dirty marker; no new mutation revision.
      if(work?.dirtyTabs.length&&work.master?.data()?.status!=='PENDING')tx.set(syncOutboxRef(this.db,projectId).doc('MASTER_DATA'),{projectId,kind:'MASTER_DATA',revision:work.projection.mutationRevision,dirtyTabs:work.dirtyTabs,status:'PENDING',updatedAt:work.projection.updatedAt});
      const next={...s,syncOwner:owner,syncLeaseClaimedAt:now,syncLeaseExpiresAt:now+120000,syncLeaseRevision:s.binding.revision??0,syncLeaseSpreadsheetId:s.binding.spreadsheetId};tx.set(ref,next);return {...next,project};
    });
    if(!result)return gwsFail('WORKSPACE_SYNC_IN_PROGRESS');return result;
  }
  private async renewSync(projectId:string,who:AuthUserContext,owner:string) {
    await this.db.runTransaction(async(tx:any)=>{
      await this.authorized(tx,projectId,who);const ref=continuityRef(this.db,projectId),snap=await tx.get(ref),s=snap.data();
      if(s?.syncOwner!==owner||s.syncLeaseExpiresAt<=Date.now()||s.syncLeaseRevision!==(s.binding?.revision??0)||s.syncLeaseSpreadsheetId!==s.binding?.spreadsheetId)return gwsFail('WORKSPACE_EXECUTION_FENCED');
      if(s.syncLeaseExpiresAt-Date.now()>60000)return;
      tx.set(ref,{...s,syncLeaseExpiresAt:Date.now()+120000});
    });
  }
  private async releaseSync(projectId:string,owner:string) {
    await this.db.runTransaction(async(tx:any)=>{const ref=continuityRef(this.db,projectId),snap=await tx.get(ref),s=snap.data();if(s?.syncOwner===owner)tx.set(ref,{...s,syncOwner:null,syncLeaseExpiresAt:0});});
  }
  /** Retired copy path: unreachable outside native compatibility tests. */
  async provisionLegacyForTests(projectId:string,who:AuthUserContext,google:GoogleTemplatePort):Promise<ProjectGoogleBinding> {
    if(process.env.NODE_ENV!=='test')return gwsFail('LEGACY_TEMPLATE_PROVISIONING_RETIRED',410);
    // Authorize before even reading the provider identity.
    await this.db.runTransaction((tx:any)=>this.authorized(tx,projectId,who));
    const subject=await google.subject();
    if (!subject) return gwsFail('AUTHORIZATION_REQUIRED',401);
    const operationId=workspaceOperation(projectId), owner=randomUUID(), ref=continuityRef(this.db,projectId);
    const initial=await this.db.runTransaction(async(tx:any)=>{
      const {project}=await this.authorized(tx,projectId,who);
      const snap=await tx.get(ref), state=snap.exists?snap.data():{};
      if(state.binding) {
        if(state.binding.projectId!==projectId) return gwsFail('WORKSPACE_BINDING_INVALID');
        if(state.binding.googleSubject!==subject) return gwsFail('WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION');
        return {project,state,bound:true};
      }
      if(project.settings?.googleSpreadsheetId) return gwsFail('LEGACY_WORKSPACE_REQUIRES_EXPLICIT_MIGRATION');
      if(state.googleSubject && state.googleSubject!==subject) return gwsFail('WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION');
      if(state.leaseUntil>Date.now()) return gwsFail('WORKSPACE_PROVISIONING_IN_PROGRESS');
      const template=state.template||this.template();
      tx.set(ref,{...state,projectId,googleSubject:subject,template,operationId,owner,leaseUntil:Date.now()+120000,state:'PROVISIONING',lastSyncError:null});
      this.audit(tx,projectId,who.userId,'WORKSPACE_PROVISION_REQUEST',{operationId,templateId:template.id,templateVersion:template.version});
      return {project,state:{...state,template},bound:false};
    });
    if(initial.bound) {
      try {
        await google.verify(initial.state.binding.spreadsheetId,operationId);
        await this.db.runTransaction(async(tx:any)=>{
          await this.authorized(tx,projectId,who);
          const snap=await tx.get(ref);
          tx.set(ref,{...snap.data(),state:'READY',lastSyncError:null});
          this.audit(tx,projectId,who.userId,'WORKSPACE_RECONNECTED',{fileId:initial.state.binding.spreadsheetId});
        });
        return publicBinding(initial.state.binding);
      } catch(error) {
        const code=error instanceof GoogleWorkspaceCommandError?error.code:'PROVISIONING_FAILED';
        await this.db.runTransaction(async(tx:any)=>{
          const snap=await tx.get(ref);
          tx.set(ref,{...snap.data(),state:code==='TOKEN_EXPIRED'?'AUTHORIZATION_REQUIRED':'FAILED',lastSyncError:code});
          this.audit(tx,projectId,who.userId,'WORKSPACE_RECONNECT_FAILED',{code});
        });
        throw new GoogleWorkspaceCommandError(code,502);
      }
    }

    let stage=initial.state.stage, folderId=initial.state.folderId, fileId=initial.state.fileId;
    const checkpoint=async(patch:Record<string,unknown>)=>this.db.runTransaction(async(tx:any)=>{
      await this.authorized(tx,projectId,who);
      const s=await tx.get(ref);
      if(s.data()?.owner!==owner) return gwsFail('WORKSPACE_EXECUTION_FENCED');
      tx.set(ref,{...s.data(),...patch,leaseUntil:Date.now()+120000});
    });
    try {
      const name=`SABIL — ${initial.project.nameAr} — ${initial.project.projectCode||projectId}`;
      if (!stage) {
        await google.validateTemplate(initial.state.template.id);
        await checkpoint({stage:'FOLDER_REQUESTED'});
        folderId=await google.createFolder(name,operationId);
        await checkpoint({folderId,stage:'FOLDER_CREATED'});stage='FOLDER_CREATED';
      }
      if(stage==='FOLDER_REQUESTED') return gwsFail('WORKSPACE_FOLDER_RECOVERY_REQUIRED');
      if(!fileId && stage!=='FOLDER_CREATED') {
        const copies=await google.findCopies(operationId);
        if(copies.length>1) return gwsFail('WORKSPACE_DUPLICATE_EXTERNAL_FILES');
        if(copies.length===1) {fileId=copies[0].id;folderId=folderId||copies[0].folderId;await checkpoint({fileId,folderId,stage:'COPIED'});stage='COPIED';}
        // Unknown copy outcome is never retried as another copy, even on a temporarily empty Drive search.
        else return gwsFail('WORKSPACE_COPY_OUTCOME_UNCONFIRMED');
      }
      if(!fileId) {
        await checkpoint({stage:'COPY_REQUESTED'});
        fileId=await google.copyTemplate(initial.state.template.id,name,folderId,operationId);
        await checkpoint({fileId,stage:'COPIED'});stage='COPIED';
      }
      if (!fileId || !folderId) return gwsFail('WORKSPACE_EXTERNAL_BINDING_INVALID');
      await google.verify(fileId,operationId);
      if(stage!=='INITIALIZED') {
        await google.initializeCopy(fileId);
        await checkpoint({stage:'INITIALIZED'});
      }
      const binding:ProjectGoogleBinding={projectId,provider:'GOOGLE',spreadsheetId:fileId,driveFileId:fileId,spreadsheetUrl:`https://docs.google.com/spreadsheets/d/${fileId}/edit`,templateId:initial.state.template.id,templateVersion:initial.state.template.version,googleSubject:subject,googleAccountLabel:google.accountLabel?.()||subject,provisionedAt:new Date().toISOString(),provisionedBy:who.userId,revision:1};
      await this.db.runTransaction(async(tx:any)=>{
        const {project}=await this.authorized(tx,projectId,who), snap=await tx.get(ref);
        if(snap.data()?.owner!==owner || snap.data()?.binding) return gwsFail('WORKSPACE_EXECUTION_FENCED');
        if(project.settings?.googleSpreadsheetId && project.settings.googleSpreadsheetId!==fileId) return gwsFail('WORKSPACE_BINDING_CONFLICT');
        tx.set(ref,{...snap.data(),binding,folderId,state:'READY',stage:'BOUND',leaseUntil:0,lastSyncError:null});
        tx.update(this.db.collection('projects').doc(projectId),{settings:{...project.settings,googleSpreadsheetId:fileId,googleDriveFolderId:folderId,googleDriveProvisioning:{enabled:true,status:'PROVISIONED',rootFolderName:name,spreadsheetTitle:name}},updatedBy:who.userId,updatedAt:new Date().toISOString()});
        this.audit(tx,projectId,who.userId,'WORKSPACE_BOUND',{fileId,templateId:binding.templateId,templateVersion:binding.templateVersion});
      });
      return binding;
    } catch(error) {
      const code=error instanceof GoogleWorkspaceCommandError?error.code:'PROVISIONING_FAILED';
      // Binding failures leave external receipt evidence intact. Never log or persist provider error text.
      await this.db.runTransaction(async(tx:any)=>{
        const snap=await tx.get(ref);
        if(snap.exists && snap.data()?.owner===owner) tx.set(ref,{...snap.data(),state:'FAILED',lastSyncError:code,leaseUntil:0});
      });
      throw error instanceof GoogleWorkspaceCommandError?error:new GoogleWorkspaceCommandError(code,502);
    }
  }
  /** Drain only server-recorded events. Request never supplies a file ID or row payload. */
  /** Bounded source read adapter; no partial snapshot may be presented as complete. */
  private boundedProjectionDb(){let reads=0;return {collection:(name:string)=>this.db.collection(name),runTransaction:(work:any)=>this.db.runTransaction((tx:any)=>work({get:async(ref:any)=>{if(++reads>20000)return gwsFail('WORKSPACE_SOURCE_BUDGET_REVIEW_REQUIRED');const value=await tx.get(typeof ref.limit==='function'?ref.limit(PROJECTION_LIMITS.sourceRows+1):ref);if(value.docs?.length>PROJECTION_LIMITS.sourceRows)return gwsFail('WORKSPACE_SOURCE_BUDGET_REVIEW_REQUIRED');return value;}}))};}
  private deliveryRef(projectId:string,key:string){return this.db.collection('projects').doc(projectId).collection('workspace_delivery_receipts').doc(key);}
  private async deliverEvent(projectId:string,who:AuthUserContext,google:GoogleTemplatePort&Partial<GoogleBlueprintPort>,owner:string,state:any,id:string,event:any,budget?:{deadline:number;calls:number}){
    if(event.projectId!==projectId||!Number.isSafeInteger(event.revision)||event.revision<0)return gwsFail('WORKSPACE_EVENT_SCOPE_INVALID');
    const ref=continuityRef(this.db,projectId);let active=state.activeProjectionDelivery;
    if(!active){
      const freshness=await projectionState(projectId,this.db);let payload:any={event};const eventHash=projectionHash([event.projectId,event.kind||null,event.tripId||null,event.revision,event.snapshot||event.input||null,event.dirtyTabs||null]);
      if(event.kind==='PROFILE_TRIP'){
        if(event.snapshot)payload.trip=event.snapshot;
        else{const snapshot=await this.db.collection('projects').doc(projectId).collection('trips').doc(event.tripId).get();if(!snapshot.exists)return gwsFail('PROFILE_TRIP_NOT_FOUND');const {decodeTrip}=await import('../utils/persistenceBoundary');payload.trip=decodeTrip(snapshot.data(),event.tripId,projectId);}
      }else if(event.kind==='REPORT_REFRESH'){
        const query=this.db.collection('projects').doc(projectId).collection('trips'),snapshot=await (typeof query.limit==='function'?query.limit(PROJECTION_LIMITS.sourceRows+1):query).get();if(snapshot.docs.length>PROJECTION_LIMITS.sourceRows)return gwsFail('WORKSPACE_SOURCE_BUDGET_REVIEW_REQUIRED');const {decodeTrip}=await import('../utils/persistenceBoundary'),{buildOperationalReport}=await import('./operationalReporting');payload.report=buildOperationalReport(snapshot.docs.map((d:any)=>decodeTrip(d.data(),d.id,projectId)),{projectId},new Date(event.updatedAt),state.project.operationalConfiguration);
      }else if(event.kind==='MASTER_DATA'){
        const {ProjectWorkspaceInitialProjectionServer}=await import('./projectWorkspaceInitialProjection.server');payload.snapshot=await new ProjectWorkspaceInitialProjectionServer().buildCanonicalProjection(projectId,this.boundedProjectionDb());payload.tabs=(freshness.dirtyTabs.length?freshness.dirtyTabs:event.dirtyTabs||[]).filter(isMasterTab);if(!payload.tabs.length)return gwsFail('WORKSPACE_EVENT_SCOPE_INVALID');
      }
      const encoded=JSON.stringify(payload);if(Buffer.byteLength(encoded)>PROJECTION_LIMITS.payloadBytes)return gwsFail('WORKSPACE_SOURCE_BUDGET_REVIEW_REQUIRED');
      const key=projectionHash([projectId,state.binding.spreadsheetId,state.binding.revision,id,event.revision]);
      active={key,id,destinationId:state.binding.spreadsheetId,bindingRevision:state.binding.revision,eventHash,eventRevision:event.revision,payload:JSON.parse(encoded),payloadHash:projectionHash(JSON.parse(encoded)),sourceRevision:freshness.mutationRevision,asOf:event.updatedAt||new Date().toISOString()};
      active=await this.db.runTransaction(async(tx:any)=>{await this.authorized(tx,projectId,who);const s=(await tx.get(ref)).data(),receipt=(await tx.get(this.deliveryRef(projectId,key))).data(),head=(await tx.get(this.deliveryRef(projectId,'head-'+projectionHash(id)))).data();if(head?.revision>event.revision)return gwsFail('WORKSPACE_STALE_DELIVERY_REJECTED');if(s.syncOwner!==owner||s.syncLeaseExpiresAt<=Date.now())return gwsFail('WORKSPACE_EXECUTION_FENCED');if(s.activeProjectionDelivery)return s.activeProjectionDelivery;const latestSource=await projectionState(projectId,this.db,tx);if(['MASTER_DATA','REPORT_REFRESH'].includes(event.kind)&&latestSource.mutationRevision!==freshness.mutationRevision)return gwsFail('WORKSPACE_PROJECTION_REVISION_CONFLICT');if(receipt?.status==='COMMITTED'){if(receipt.eventHash!==eventHash||receipt.destinationId!==state.binding.spreadsheetId||receipt.bindingRevision!==state.binding.revision)return gwsFail('WORKSPACE_DELIVERY_RECEIPT_CONFLICT');return {...active,sourceRevision:receipt.sourceRevision,payloadHash:receipt.payloadHash,alreadyCommitted:true};}tx.set(ref,{...s,activeProjectionDelivery:active});return active;});
    }
    if(active.destinationId!==state.binding.spreadsheetId||active.bindingRevision!==state.binding.revision)return gwsFail('WORKSPACE_EXECUTION_FENCED');
    if(!active.alreadyCommitted&&projectionHash(active.payload)!==active.payloadHash)return gwsFail('WORKSPACE_DELIVERY_RECEIPT_CONFLICT');
    let revisionConflict=false;const body=active.payload,source=body.event;if(source.projectId!==projectId)return gwsFail('WORKSPACE_EVENT_SCOPE_INVALID');
    const delivery=new WorkspaceProjectionDelivery(this.db,projectId,state.binding,owner,tx=>this.authorized(tx,projectId,who),active.asOf,active.key,budget);
    if(!active.alreadyCommitted)await runProjectionDelivery(delivery,async()=>{
      if(source.kind==='PROFILE_TRIP'){if(body.trip?.projectId!==projectId||body.trip?.tripId!==source.tripId)return gwsFail('WORKSPACE_EVENT_SCOPE_INVALID');if(!google.projectProfileTrip||!body.trip?.operationalSnapshot)return gwsFail('PROFILE_PROJECTION_REQUIRED');await google.projectProfileTrip(state.binding.spreadsheetId,body.trip,this.resolvedBlueprint(state.project,state.binding));}
      else if(source.kind==='REPORT_REFRESH'){if(!google.projectProfileReports)return gwsFail('PROFILE_PROJECTION_REQUIRED');await google.projectProfileReports(state.binding.spreadsheetId,body.report);}
      else if(source.kind==='MASTER_DATA'){if(!google.projectMasterTabs)return gwsFail('MASTER_PROJECTION_PORT_REQUIRED');await google.projectMasterTabs(state.binding.spreadsheetId,body.snapshot,body.tabs);}
      else{if(source.input?.projectId!==projectId)return gwsFail('SHEET_SOURCE_MAPPING_REQUIRED');await google.upsert(state.binding.spreadsheetId,source.input);}
    });
    if(!active.alreadyCommitted&&['MASTER_DATA','REPORT_REFRESH'].includes(source.kind)){try{await markProjectionSuccessful(projectId,source.kind==='REPORT_REFRESH'?['REPORTS']:body.tabs,undefined,active.sourceRevision,this.db,{owner,authorize:tx=>this.authorized(tx,projectId,who)});}catch(error){if((error as any)?.code!=='WORKSPACE_PROJECTION_REVISION_CONFLICT')throw error;revisionConflict=true;/* The older delivery receipt is committed; newer dirty state is never acknowledged. */}}
    await this.db.runTransaction(async(tx:any)=>{await this.authorized(tx,projectId,who);const s=(await tx.get(ref)).data(),eventRef=syncOutboxRef(this.db,projectId).doc(active.id),fresh=(await tx.get(eventRef)).data();if(s.syncOwner!==owner||s.syncLeaseExpiresAt<=Date.now()||s.binding?.revision!==state.binding.revision||s.binding?.spreadsheetId!==state.binding.spreadsheetId)return gwsFail('WORKSPACE_EXECUTION_FENCED');if(s.projectionRpc)return gwsFail('WORKSPACE_DELIVERY_RECOVERY_REQUIRED');
      if(!active.alreadyCommitted)tx.set(this.deliveryRef(projectId,'head-'+projectionHash(active.id)),{projectId,revision:active.eventRevision,deliveryId:active.key});
      if(!active.alreadyCommitted)tx.set(this.deliveryRef(projectId,active.key),{projectId,eventHash:active.eventHash,destinationId:state.binding.spreadsheetId,bindingRevision:state.binding.revision,eventId:active.id,deliveryRevision:active.eventRevision,payloadHash:active.payloadHash,sourceRevision:active.sourceRevision,status:'COMMITTED',committedAt:new Date().toISOString()});
      if(fresh?.projectId===projectId&&fresh.revision===active.eventRevision)tx.set(eventRef,{...fresh,status:'DELIVERED',deliveredAt:new Date().toISOString(),deliveryId:active.key,attempts:0,nextAttemptAt:0});
      tx.set(ref,{...s,...(source.kind==='REPORT_REFRESH'?{lastReportRefreshAt:new Date().toISOString(),lastReportSourceRevision:active.sourceRevision}:{}),activeProjectionDelivery:null,projectionCompletedPlans:{},projectionRetryAt:0,projectionAttempts:0,projectionDeliveryState:'CURRENT'});
    });
    if(revisionConflict)return gwsFail('WORKSPACE_PROJECTION_REVISION_CONFLICT');
  }
  async retrySync(projectId:string,who:AuthUserContext,google:GoogleTemplatePort&Partial<GoogleBlueprintPort>,mode:boolean|{pendingOnly:true}=false) {
    const pendingOnly=typeof mode==='object'&&mode.pendingOnly,initialized=typeof mode==='boolean'?mode: true;
    // Namespace/Script V2 upgrade reuses the existing binding and known Script identity.
    // The internal flag prevents initialization's final drain from recursively upgrading a degraded Script.
    if(!initialized&&!pendingOnly&&google.repairWorkbook&&google.authorizeProvisioning){
      const prior=await this.db.runTransaction(async(tx:any)=>{const {project}=await this.authorized(tx,projectId,who);const snap=await tx.get(continuityRef(this.db,projectId));return {project,state:snap.data()};});
      const binding=prior.state?.binding;
      if(binding&&prior.project.operationalConfiguration&&(prior.state.scriptProjectId||binding.scriptProjectId)&&binding.appsScriptBlueprintVersion!==this.resolvedBlueprint(prior.project,binding).script?.version){
        await this.initializeBound(projectId,who,google as GoogleBlueprintPort);
        const result=await this.status(projectId,who);if(result.lastSyncError?.startsWith('PROFILE_REPORT_'))throw new GoogleWorkspaceCommandError(result.lastSyncError,502);return result;
      }
    }
    // A successful receipt and no canonical work is a read-only no-op, not another drain.
    if(!pendingOnly){
      const idle=await this.db.runTransaction(async(tx:any)=>{await this.authorized(tx,projectId,who);const s=(await tx.get(continuityRef(this.db,projectId))).data();
        if(!s?.binding||s.state!=='READY'||s.workbookHealth!=='HEALTHY'||!['READY','NOT_REQUIRED'].includes(s.automationState)||s.backgroundAuthorization!=='CONNECTED'||!s.lastSuccessfulSyncAt||s.lastSyncError||s.syncOwner||s.lastAutomationError)return false;
        const work=await this.pendingWork(tx,projectId);return !work.pending;
      });
      if(idle)return this.status(projectId,who);
    }
    const owner=randomUUID(),ref=continuityRef(this.db,projectId);
    const state=await this.claimSync(projectId,who,owner,pendingOnly);
    google.setDeliveryFence?.(()=>this.renewSync(projectId,who,owner));
    const heartbeat=setInterval(()=>{void this.renewSync(projectId,who,owner).catch(()=>{});},30000);heartbeat.unref?.();
    const projectionBudget={deadline:Date.now()+20000,calls:0};
    try {
      if(state.projectionRpc&&!state.activeProjectionDelivery)return gwsFail('WORKSPACE_DELIVERY_RECOVERY_REQUIRED');
      if(await google.subject()!==state.binding.googleSubject) return gwsFail('WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION');
      if(state.binding.workspaceBlueprintVersion){
        if(!google.verifyBinding)return gwsFail('NATIVE_BINDING_VERIFIER_REQUIRED');
        await google.verifyBinding(state.binding.destinationRootFolderId,state.binding.projectFolderId,state.binding.spreadsheetId,state.binding.workspaceBlueprintVersion);
      } else await google.verify(state.binding.spreadsheetId,workspaceOperation(projectId));
      const events=await syncOutboxRef(this.db,projectId).where('status','==','PENDING').limit(PROJECTION_LIMITS.events).get();
      let legacyMappingPending=false;const started=Date.now();
      const tasks=[...(state.activeProjectionDelivery?[{id:state.activeProjectionDelivery.id,data:()=>state.activeProjectionDelivery.payload.event}]:[]),...events.docs.filter((d:any)=>d.id!==state.activeProjectionDelivery?.id)];
      for(const doc of tasks.slice(0,PROJECTION_LIMITS.events)){
        if(Date.now()-started>20000)break;await this.renewSync(projectId,who,owner);const event=doc.data();
        if(event.projectId!==projectId)return gwsFail('WORKSPACE_EVENT_SCOPE_INVALID');
        if(state.project.operationalConfiguration&&event.mappingRequired===true&&!event.input){legacyMappingPending=true;continue;}
        await this.deliverEvent(projectId,who,google,owner,state,doc.id,event,projectionBudget);state.activeProjectionDelivery=null;
      }
      await this.finishSync(projectId,who,owner,legacyMappingPending?'SHEET_SOURCE_MAPPING_REQUIRED':null);
    } catch(error) {
      const code=error instanceof GoogleWorkspaceCommandError?error.code:typeof (error as any)?.code==='string'?(error as any).code:'SHEET_SYNC_FAILED';
      await this.finishSync(projectId,who,owner,code);
      throw new GoogleWorkspaceCommandError(code,error instanceof GoogleWorkspaceCommandError?error.status:502);
    } finally {clearInterval(heartbeat);await this.releaseSync(projectId,owner);}
    return this.status(projectId,who);
  }
  async prepareEnsureProjection(projectId:string,who:AuthUserContext) {
    return this.db.runTransaction(async(tx:any)=>{await this.authorized(tx,projectId,who);const existing=await projectionState(projectId,this.db,tx);if(!existing.dirtyTabs.some(isMasterTab))await markDirtyInTransaction(tx,projectId,MASTER_TABS.map(s=>s.key),'WORKSPACE_ENSURE',undefined,this.db);});
  }
  private async finishSync(projectId:string,who:AuthUserContext,owner:string,error:string|null) {
    await this.db.runTransaction(async(tx:any)=>{
      const ref=continuityRef(this.db,projectId),snap=await tx.get(ref);
      const current=snap.data();
      if(current?.syncOwner!==owner||current?.syncLeaseExpiresAt<=Date.now()||current?.syncLeaseRevision!==(current?.binding?.revision??0)||current?.syncLeaseSpreadsheetId!==current?.binding?.spreadsheetId) return gwsFail('WORKSPACE_EXECUTION_FENCED');
      let completedRevision:number|undefined;if(!error){const pending=await tx.get(syncOutboxRef(this.db,projectId).where('status','==','PENDING').limit(1)),freshness=await projectionState(projectId,this.db,tx);if(!pending.docs.length&&!freshness.dirtyTabs.some(isMasterTab)&&!current.activeProjectionDelivery&&!current.projectionRpc)completedRevision=freshness.mutationRevision;}
      const contention=error==='WORKSPACE_PROJECTION_REVISION_CONFLICT',attempts=error&&!contention?Number(current.projectionAttempts||0)+1:0,permanent=Boolean(error&&!contention&&(/REVIEW_REQUIRED|CONFLICT|SCOPE_DENIED|PERMISSION_DENIED|API_ACCESS_DISABLED|INVALID_REQUEST|NONATOMIC|PLAN_INVALID/.test(error)||attempts>=PROJECTION_LIMITS.attempts));
      tx.set(ref,{...snap.data(),...(completedRevision!==undefined?{lastDeliveredSourceRevision:completedRevision}:{}),projectionFailureRevision:error?Number(current.projectionFailureRevision||0)+1:current.projectionFailureRevision||0,projectionReviewId:error?(current.activeProjectionDelivery?.key||projectionHash([projectId,current.binding.spreadsheetId,current.binding.revision,Number(current.projectionFailureRevision||0)+1,error])):null,projectionLastFailureEnsureOwner:error?this.ensureOwner||null:null,projectionAttempts:attempts,projectionDeliveryState:permanent?'REVIEW_REQUIRED':error?'RETRY_PENDING':current.projectionDeliveryState||'CURRENT',projectionRetryAt:error&&!contention?Date.now()+Math.min(60000,1000*2**Math.min(6,attempts)):0,syncOwner:null,syncLeaseExpiresAt:0,state:error?(error==='BOUND_FILE_UNAVAILABLE'?'BOUND_FILE_UNAVAILABLE':/TOKEN_EXPIRED|AUTHORIZATION_REQUIRED|SCOPE_DENIED/.test(error)?'AUTHORIZATION_REQUIRED':'SYNC_DEGRADED'):'READY',lastSyncError:error,...(!error?{lastSuccessfulSyncAt:new Date().toISOString()}:{})});
      this.audit(tx,projectId,who.userId,error?'WORKSPACE_SYNC_FAILED':'WORKSPACE_SYNC_RECOVERED',{code:error});
    });
  }
  async reviewProjectionRetry(projectId:string,who:AuthUserContext,deliveryId:string){
    if(!/^[a-f0-9]{64}$/.test(deliveryId))return gwsFail('INVALID_WORKSPACE_COMMAND',400);
    await this.db.runTransaction(async(tx:any)=>{await this.authorized(tx,projectId,who);const ref=continuityRef(this.db,projectId),s=(await tx.get(ref)).data();if((s?.activeProjectionDelivery?.key||s?.projectionReviewId)!==deliveryId||s.syncOwner&&s.syncLeaseExpiresAt>Date.now())return gwsFail('WORKSPACE_EXECUTION_FENCED');tx.set(ref,{...s,projectionAttempts:0,projectionRetryAt:0,projectionDeliveryState:'RETRY_PENDING'});this.audit(tx,projectId,who.userId,'WORKSPACE_DELIVERY_RETRY_REVIEWED',{deliveryId});});
  }
  async refreshOperationalReports(projectId: string, who: AuthUserContext, google: GoogleBlueprintPort) {
    const REPORT_REFRESH_COOLDOWN_MS = 60000;
    const now = new Date();
    const nowMs = now.getTime();

    const cooldownCheck = await this.db.runTransaction(async (tx: any) => {
      await this.authorized(tx, projectId, who);
      const ref = continuityRef(this.db, projectId);
      const snap = await tx.get(ref);
      if (!snap.exists) return { allowed: true };
      const data = snap.data();
      const lastAttempt = data?.lastReportRefreshAttemptAt;
      if (lastAttempt) {
        const elapsed = nowMs - Date.parse(lastAttempt);
        if (elapsed < REPORT_REFRESH_COOLDOWN_MS) {
          const retryAfterSeconds = Math.ceil((REPORT_REFRESH_COOLDOWN_MS - elapsed) / 1000);
          return { allowed: false, retryAfterSeconds };
        }
      }
      tx.set(ref, { ...data, lastReportRefreshAttemptAt: now.toISOString() }, { merge: true });
      return { allowed: true };
    });

    if (!cooldownCheck.allowed) {
      const err = Object.assign(new GoogleWorkspaceCommandError('REPORT_REFRESH_COOLDOWN', 429), {
        retryAfterSeconds: cooldownCheck.retryAfterSeconds
      });
      throw err;
    }

    const owner = randomUUID();
    const state = await this.claimSync(projectId, who, owner, false);
    try {
      if (!google.projectProfileReports) return gwsFail('PROFILE_PROJECTION_REQUIRED');
      if (await google.subject() !== state.binding.googleSubject) return gwsFail('WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION');
      if (state.binding.workspaceBlueprintVersion) {
        if (!google.verifyBinding) return gwsFail('NATIVE_BINDING_VERIFIER_REQUIRED');
        await google.verifyBinding(state.binding.destinationRootFolderId, state.binding.projectFolderId, state.binding.spreadsheetId, state.binding.workspaceBlueprintVersion);
      }
      if(state.activeProjectionDelivery&&state.activeProjectionDelivery.payload.event.kind!=='REPORT_REFRESH')return gwsFail('WORKSPACE_DELIVERY_RECOVERY_REQUIRED');
      const source=await projectionState(projectId,this.db);
      await this.deliverEvent(projectId,who,google,owner,state,'REPORTS-'+projectionHash(now.toISOString()),{projectId,kind:'REPORT_REFRESH',revision:source.mutationRevision,updatedAt:now.toISOString()});
      await this.finishSync(projectId, who, owner, null);
    } catch (error) {
      const code = error instanceof GoogleWorkspaceCommandError ? error.code : typeof (error as any)?.code==='string'?(error as any).code:'REPORT_REFRESH_FAILED';
      await this.finishSync(projectId, who, owner, code);
      throw new GoogleWorkspaceCommandError(code, error instanceof GoogleWorkspaceCommandError ? error.status : 502);
    } finally {
      await this.releaseSync(projectId, owner);
    }
    return this.status(projectId, who);
  }
}
export const projectGoogleWorkspaceServer=new ProjectGoogleWorkspaceServer();
