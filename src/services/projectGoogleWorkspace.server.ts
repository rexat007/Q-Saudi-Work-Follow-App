import {workspaceGrantFailure,boundedAuthorizationDiagnosis} from '../utils/workspaceAuthorization';
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
  repairWorkbook?(fileId:string,blueprint:WorkspaceBlueprint):Promise<{repaired:boolean;conflicts:string[]}>;
  verifyAutomation?(fileId:string,scriptId:string,blueprint:WorkspaceBlueprint):Promise<void>;
}
const validId=(value: unknown): value is string=>typeof value==='string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
export const workspaceOperation = (projectId: string) => createHash('sha256').update(`PFAG-GWS1:${projectId}`).digest('hex');
export function continuityRef(db: any, projectId: string) { return db.collection('projects').doc(projectId).collection('workspace_continuity').doc('current'); }
export function syncOutboxRef(db: any, projectId: string) { return db.collection('projects').doc(projectId).collection('workspace_sync_outbox'); }

function publicBinding(raw: ProjectGoogleBinding): ProjectGoogleBinding {
  return { projectId:raw.projectId,provider:'GOOGLE',spreadsheetId:raw.spreadsheetId,driveFileId:raw.driveFileId,spreadsheetUrl:raw.spreadsheetUrl,...(raw.spreadsheetTitle?{spreadsheetTitle:raw.spreadsheetTitle}:{}),templateId:raw.templateId,templateVersion:raw.templateVersion,...(raw.workspaceBlueprintVersion?{destinationRootFolderId:raw.destinationRootFolderId,projectFolderId:raw.projectFolderId,workspaceBlueprintVersion:raw.workspaceBlueprintVersion,appsScriptBlueprintVersion:raw.appsScriptBlueprintVersion,...(raw.scriptProjectId?{scriptProjectId:raw.scriptProjectId}:{})}:{}),googleSubject:raw.googleSubject,googleAccountLabel:raw.googleAccountLabel||raw.googleSubject,provisionedAt:raw.provisionedAt,provisionedBy:raw.provisionedBy,revision:raw.revision };
}
/** One canonical server authority; Google port is transient authorization, never a credential DTO. */
export class ProjectGoogleWorkspaceServer {
  constructor(private database?: any, private template: ()=>TemplateConfiguration = configuredTemplate, private blueprint:()=>WorkspaceBlueprint = activeWorkspaceBlueprint,private backgroundGrantId?:string) {}
  private get db() { return this.database || adminDb; }
  forExecutionAuthorization(authorizationId?:string):ProjectGoogleWorkspaceServer {
    return authorizationId?new ProjectGoogleWorkspaceServer(this.database,this.template,this.blueprint,authorizationId):this;
  }
  private resolvedBlueprint(project:ProjectEntity,binding?:ProjectGoogleBinding) {
    if(!project.operationalConfiguration){if(project.operationalConfigurationRequired)return gwsFail('OPERATIONAL_CONFIGURATION_REQUIRED');return this.blueprint();}
    if(binding?.workspaceBlueprintVersion==='SABIL-HAIL-V1'&&resolveOperationalProfile(project.operationalConfiguration)==='DUAL_WEIGHBRIDGE')return {...resolveWorkspaceTemplate(project.operationalConfiguration).blueprint,version:'SABIL-HAIL-V1'}; // Explicit legacy-dual adoption preserves resource tags/IDs and adds safe profile views.
    const blueprint=resolveWorkspaceTemplate(project.operationalConfiguration).blueprint;
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
    if(this.backgroundGrantId){
      const continuity=await tx.get(continuityRef(this.db,projectId)),grant=await tx.get(this.db.collection('workspace_google_authorizations').doc(this.backgroundGrantId));
      const b=continuity.data()?.binding,g=grant.data();
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
    const jobs=await syncOutboxRef(this.db,projectId).get();
    const pending=jobs.docs.filter((d:any)=>d.data().status!=='DELIVERED').length;
    return {authorizationDiagnostic:boundedAuthorizationDiagnosis(state.authorizationDiagnostic),state:state.state||'NOT_CONNECTED',binding:state.binding?publicBinding(state.binding):null,lastSuccessfulSyncAt:state.lastSuccessfulSyncAt||null,lastSyncError:state.lastSyncError||null,pendingSyncCount:pending,workspaceState:state.binding?(state.state==='BOUND_FILE_UNAVAILABLE'?'BOUND_FILE_UNAVAILABLE':'CONNECTED'):state.folderId||state.fileId?'CONNECTING':'NOT_CONNECTED',syncHealth:state.state==='AUTHORIZATION_REQUIRED'?'AUTHORIZATION_REQUIRED':state.state==='SYNC_DEGRADED'?'DEGRADED':pending?'PENDING':'HEALTHY',workbookHealth:state.workbookHealth||'REPAIR_REQUIRED',automationState:state.automationState||'NOT_INSTALLED',backgroundAuthorization:state.backgroundAuthorization||'NOT_CONNECTED',syncTrigger:'USER_ACTIVE',automationRecoveryRequired:!state.scriptProjectId&&!state.binding?.scriptProjectId&&(state.lastAutomationError==='AUTOMATION_RECOVERY_REQUIRED'||['SCRIPT_REQUESTED','CREATE_REQUESTED','SCRIPT_CREATED','CREATED','CONTENT_INSTALLING','CONTENT_INSTALLED'].includes(state.automationStage||state.stage)),recoveryAvailable:!state.binding&&Boolean(state.destinationRootFolderId&&(state.folderId||state.fileId))};
  }
  async approveDestination(projectId:string,rootId:string,who:AuthUserContext,google:GoogleBlueprintPort) {
    if(!validId(rootId))return gwsFail('DESTINATION_FOLDER_REQUIRED',400);
    await this.db.runTransaction((tx:any)=>this.authorized(tx,projectId,who));
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
        tx.set(ref,{...s,scriptProjectId:scriptId,binding:{...s.binding,scriptProjectId:scriptId},automationStage:'CREATED',automationState:'NOT_INSTALLED',automationCreationAllowed:false});this.audit(tx,projectId,who.userId,'AUTOMATION_RECOVERED',{});
      });
    }finally{await this.releaseSync(projectId,owner);}
    await this.initializeBound(projectId,who,google);return this.status(projectId,who);
  }
  async provision(projectId:string,rootId:string,who:AuthUserContext,google:GoogleBlueprintPort,recovery=false):Promise<ProjectGoogleBinding> {
    await this.db.runTransaction((tx:any)=>this.authorized(tx,projectId,who));
    const subject=await google.subject();
    const op=workspaceOperation(projectId),owner=randomUUID(),ref=continuityRef(this.db,projectId);
    const prior=await this.status(projectId,who);
    if(prior.binding) {
      if(prior.binding.googleSubject!==subject)return gwsFail('WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION');
      if(rootId&&prior.binding.destinationRootFolderId!==rootId)return gwsFail('EXPLICIT_MIGRATION_REQUIRED');
      try {
        if(prior.binding.workspaceBlueprintVersion)await google.verifyBinding(prior.binding.destinationRootFolderId!,prior.binding.projectFolderId!,prior.binding.spreadsheetId,prior.binding.workspaceBlueprintVersion);
        else await google.verify(prior.binding.spreadsheetId,op);
      } catch(error) {
        const code=error instanceof GoogleWorkspaceCommandError?error.code:'BOUND_FILE_UNAVAILABLE';
        await this.db.runTransaction(async(tx:any)=>{await this.authorized(tx,projectId,who);const snap=await tx.get(ref);tx.set(ref,{...snap.data(),state:['TOKEN_EXPIRED','AUTHORIZATION_REQUIRED','SCOPE_DENIED'].includes(code)?'AUTHORIZATION_REQUIRED':'BOUND_FILE_UNAVAILABLE',lastSyncError:code});});
        throw new GoogleWorkspaceCommandError(code,502);
      }
      await this.initializeBound(projectId,who,google);
      return prior.binding;
    }
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
      if(s.leaseUntil>Date.now())return gwsFail('WORKSPACE_PROVISIONING_IN_PROGRESS');
      const next={...s,projectId,destinationRootFolderId:rootId,googleSubject:subject,workspaceBlueprintVersion:blueprint.version,operationId:op,owner,leaseUntil:Date.now()+120000,state:'PROVISIONING',lastGenerationDiagnostic:null,automationStage:s.automationStage||(['SCRIPT_REQUESTED','SCRIPT_CREATED','SCRIPT_INSTALLED'].includes(s.stage)?s.stage:'NOT_REQUESTED')};
      tx.set(ref,next);return {...next,project};
    });
    const save=async(patch:Record<string,unknown>)=>{
      state=await this.db.runTransaction(async(tx:any)=>{
        await this.authorized(tx,projectId,who);const snap=await tx.get(ref);
        if(snap.data()?.owner!==owner)return gwsFail('WORKSPACE_EXECUTION_FENCED');
        const next={...snap.data(),...patch,leaseUntil:Date.now()+120000};tx.set(ref,next);return {...next,project:state.project};
      });
    };
    const reconcile=async(role:'FOLDER'|'SPREADSHEET',parentId:string)=>{
      const matches=await google.findResource(op,role);
      if(matches.length!==1||matches[0].parentId!==parentId)return gwsFail('WORKSPACE_RECOVERY_REQUIRED');
      return matches[0].id;
    };
    try {
      const name=`${state.project.nameAr} — ${state.project.projectCode||projectId}`;
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
        await markDirtyInTransaction(tx,projectId,MASTER_TABS.map(spec=>spec.key),'WORKSPACE_CONNECTED',undefined,this.db);
        tx.set(ref,{...snap.data(),binding,state:'READY',workspaceState:'CONNECTED',workbookHealth:'REPAIR_REQUIRED',automationState:snap.data()?.automationState||'NOT_INSTALLED',stage:'BOUND',leaseUntil:0,lastSyncError:null,lastGenerationDiagnostic:null});
        tx.update(this.db.collection('projects').doc(projectId),{settings:{...project.settings,googleDriveFolderId:binding.projectFolderId,googleSpreadsheetId:binding.spreadsheetId,googleDriveProvisioning:{enabled:true,status:'PROVISIONED',rootFolderName:name,spreadsheetTitle:name}},updatedBy:who.userId,updatedAt:new Date().toISOString()});
        this.audit(tx,projectId,who.userId,'WORKSPACE_BOUND',{fileId:binding.spreadsheetId,workspaceBlueprintVersion:blueprint.version,...(binding.scriptProjectId?{scriptProjectId:binding.scriptProjectId}:{})});
      }));
      await this.initializeBound(projectId,who,google);
      return binding;
    } catch(error) {
      const code=(error as {code?:string}).code||'SPREADSHEET_GENERATION_FAILED';
      const diagnostic=error instanceof GoogleWorkspaceCommandError ? error.diagnostic : undefined;
      await this.db.runTransaction(async(tx:any)=>{const snap=await tx.get(ref),s=snap.data();if(s?.owner===owner)tx.set(ref,{...s,state:s.binding?(s.state==='AUTHORIZATION_REQUIRED'?'AUTHORIZATION_REQUIRED':code==='BOUND_FILE_UNAVAILABLE'?'BOUND_FILE_UNAVAILABLE':'SYNC_DEGRADED'):'FAILED',lastSyncError:code,leaseUntil:0,lastGenerationDiagnostic:diagnostic||null});});
      throw new GoogleWorkspaceCommandError(code,502,diagnostic);
    }
  }
  /** Post-binding initialization never revokes a valid resource binding. One expiring
   * execution lease also serializes repair, automation and projection requests. */
  async initializeBound(projectId:string,who:AuthUserContext,google:GoogleBlueprintPort) {
    const owner=randomUUID(),claimed=await this.claimSync(projectId,who,owner);
    google.setDeliveryFence?.(()=>this.renewSync(projectId,who,owner));
    const ref=continuityRef(this.db,projectId),blueprint=this.resolvedBlueprint(claimed.project,claimed.binding);
    const save=async(patch:Record<string,unknown>,action?:string,dirty=false)=>this.db.runTransaction(async(tx:any)=>{
      await this.authorized(tx,projectId,who);const snap=await tx.get(ref),s=snap.data();
      if(s?.syncOwner!==owner||s.syncLeaseExpiresAt<=Date.now()||s.syncLeaseRevision!==(s.binding?.revision??0)||s.syncLeaseSpreadsheetId!==s.binding?.spreadsheetId)return gwsFail('WORKSPACE_EXECUTION_FENCED');
      if(dirty)await markDirtyInTransaction(tx,projectId,MASTER_TABS.map(spec=>spec.key),'WORKBOOK_INITIALIZATION',undefined,this.db);
      tx.set(ref,{...s,...patch});if(action)this.audit(tx,projectId,who.userId,action,{});
    });
    const heartbeat=setInterval(()=>{void this.renewSync(projectId,who,owner).catch(()=>{});},30000);heartbeat.unref?.();
    try {
      const state=(await ref.get()).data(),b=state.binding;
      if(await google.subject()!==b.googleSubject)return gwsFail('WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION');
      await google.verifyBinding(b.destinationRootFolderId,b.projectFolderId,b.spreadsheetId,b.workspaceBlueprintVersion);
      await save({workbookHealth:'REPAIRING'});
      try {
        const result=google.repairWorkbook?await google.repairWorkbook(b.spreadsheetId,blueprint):await google.verifyWorkbook(b.spreadsheetId,blueprint).then(()=>({repaired:false,conflicts:[]}));
        await save({workbookHealth:result.conflicts.length?'REPAIR_REQUIRED':'HEALTHY',lastWorkbookError:result.conflicts.length?'WORKBOOK_OPERATOR_REVIEW_REQUIRED':null,lastGenerationDiagnostic:null},result.repaired?'WORKBOOK_REPAIRED':undefined,result.repaired||!state.lastSuccessfulSyncAt);
      } catch(error){await save({workbookHealth:'DEGRADED',lastWorkbookError:error instanceof GoogleWorkspaceCommandError?error.code:'WORKBOOK_REPAIR_FAILED',lastGenerationDiagnostic:error instanceof GoogleWorkspaceCommandError?error.diagnostic||null:null});}
      try {
        assertBlueprint(blueprint,true);await google.authorizeProvisioning();
        let current=(await ref.get()).data(),scriptId=current.scriptProjectId||b.scriptProjectId,created=false;
        if(!scriptId){
          // There is no Apps Script get-by-parent API. Uncertain historical creates
          // cannot be converted into proof of non-existence by an empty Drive list.
          if(!current.automationCreationAllowed||['SCRIPT_REQUESTED','CREATE_REQUESTED'].includes(current.automationStage))return gwsFail('AUTOMATION_RECOVERY_REQUIRED');
          await save({automationState:'INSTALLING',automationStage:'CREATE_REQUESTED',automationCreationAllowed:false});
          scriptId=await google.createBoundScript(b.spreadsheetId);
          created=true;
          await save({scriptProjectId:scriptId,automationStage:'CREATED',binding:{...b,scriptProjectId:scriptId,appsScriptBlueprintVersion:blueprint.script!.version}});
        }
        await save({automationState:'INSTALLING'});
        const verify=()=>google.verifyAutomation?google.verifyAutomation(b.spreadsheetId,scriptId,blueprint):google.verifyGenerated(b.spreadsheetId,scriptId,blueprint);
        let install=created;
        if(!install)try{await verify();}catch(error){if(error instanceof GoogleWorkspaceCommandError&&error.code.endsWith('SCRIPT_CONTENT_INSTALL_FAILED'))install=true;else throw error;}
        if(install){await save({automationStage:'CONTENT_INSTALLING'});await google.installScript(scriptId,blueprint);await save({automationStage:'CONTENT_INSTALLED'});await verify();}
        await save({automationState:'READY',automationStage:'VERIFIED',lastAutomationError:null,binding:{...b,scriptProjectId:scriptId,appsScriptBlueprintVersion:blueprint.script!.version}},'AUTOMATION_INSTALLED');
      } catch(error){
        await save({automationState:'DEGRADED',lastAutomationError:error instanceof GoogleWorkspaceCommandError?error.code:'AUTOMATION_INSTALL_FAILED',lastAutomationDiagnostic:error instanceof GoogleWorkspaceCommandError?error.diagnostic||null:null});
      }
    } catch(error){
      const code=error instanceof GoogleWorkspaceCommandError?error.code:'WORKSPACE_INITIALIZATION_FAILED';
      await save({state:code==='BOUND_FILE_UNAVAILABLE'?'BOUND_FILE_UNAVAILABLE':/TOKEN_EXPIRED|AUTHORIZATION_REQUIRED|SCOPE_DENIED/.test(code)?'AUTHORIZATION_REQUIRED':'SYNC_DEGRADED',lastSyncError:code});
      throw error;
    } finally {clearInterval(heartbeat);await this.releaseSync(projectId,owner);}
    if(google.projectMasterTabs)await this.retrySync(projectId,who,google,true).catch(()=>{});
  }
  private async claimSync(projectId:string,who:AuthUserContext,owner:string) {
    const result=await this.db.runTransaction(async(tx:any)=>{
      const {project}=await this.authorized(tx,projectId,who);const ref=continuityRef(this.db,projectId),snap=await tx.get(ref),s=snap.data()||{},now=Date.now();
      if(!s.binding||s.binding.projectId!==projectId)return gwsFail('WORKSPACE_NOT_PROVISIONED');
      if(s.syncOwner){
        if(!Number.isFinite(s.syncLeaseExpiresAt)){tx.set(ref,{...s,syncLeaseExpiresAt:now+120000});return null;}
        if(s.syncLeaseExpiresAt>now)return null;
      }
      const next={...s,syncOwner:owner,syncLeaseClaimedAt:now,syncLeaseExpiresAt:now+120000,syncLeaseRevision:s.binding.revision??0,syncLeaseSpreadsheetId:s.binding.spreadsheetId};tx.set(ref,next);return {...next,project};
    });
    if(!result)return gwsFail('WORKSPACE_SYNC_IN_PROGRESS');return result;
  }
  private async renewSync(projectId:string,who:AuthUserContext,owner:string) {
    await this.db.runTransaction(async(tx:any)=>{
      await this.authorized(tx,projectId,who);const ref=continuityRef(this.db,projectId),snap=await tx.get(ref),s=snap.data();
      if(s?.syncOwner!==owner||s.syncLeaseExpiresAt<=Date.now()||s.syncLeaseRevision!==(s.binding?.revision??0)||s.syncLeaseSpreadsheetId!==s.binding?.spreadsheetId)return gwsFail('WORKSPACE_EXECUTION_FENCED');
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
  async retrySync(projectId:string,who:AuthUserContext,google:GoogleTemplatePort&Partial<GoogleBlueprintPort>,initialized=false) {
    // Namespace/Script V2 upgrade reuses the existing binding and known Script identity.
    // The internal flag prevents initialization's final drain from recursively upgrading a degraded Script.
    if(!initialized&&google.repairWorkbook&&google.authorizeProvisioning){
      const prior=await this.db.runTransaction(async(tx:any)=>{const {project}=await this.authorized(tx,projectId,who);const snap=await tx.get(continuityRef(this.db,projectId));return {project,state:snap.data()};});
      const binding=prior.state?.binding;
      if(binding&&prior.project.operationalConfiguration&&(prior.state.scriptProjectId||binding.scriptProjectId)&&binding.appsScriptBlueprintVersion!==this.resolvedBlueprint(prior.project,binding).script?.version){
        await this.initializeBound(projectId,who,google as GoogleBlueprintPort);
        const result=await this.status(projectId,who);if(result.lastSyncError?.startsWith('PROFILE_REPORT_'))throw new GoogleWorkspaceCommandError(result.lastSyncError,502);return result;
      }
    }
    const owner=randomUUID(),ref=continuityRef(this.db,projectId);
    const state=await this.claimSync(projectId,who,owner);
    google.setDeliveryFence?.(()=>this.renewSync(projectId,who,owner));
    const heartbeat=setInterval(()=>{void this.renewSync(projectId,who,owner).catch(()=>{});},30000);heartbeat.unref?.();
    try {
      if(await google.subject()!==state.binding.googleSubject) return gwsFail('WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION');
      if(state.binding.workspaceBlueprintVersion){
        if(!google.verifyBinding)return gwsFail('NATIVE_BINDING_VERIFIER_REQUIRED');
        await google.verifyBinding(state.binding.destinationRootFolderId,state.binding.projectFolderId,state.binding.spreadsheetId,state.binding.workspaceBlueprintVersion);
      } else await google.verify(state.binding.spreadsheetId,workspaceOperation(projectId));
      const events=await syncOutboxRef(this.db,projectId).get();
      let legacyMappingPending=false;
      for(const doc of [...events.docs.filter((d:any)=>d.data().kind==='MASTER_DATA'),...events.docs.filter((d:any)=>d.data().kind!=='MASTER_DATA')]) {
        await this.renewSync(projectId,who,owner);
        const event=doc.data();if(event.status==='DELIVERED') continue;
        if(event.projectId!==projectId)return gwsFail('WORKSPACE_EVENT_SCOPE_INVALID');
        if(event.kind==='PROFILE_TRIP'){
          if(!google.projectProfileTrip||!validId(event.tripId))return gwsFail('PROFILE_PROJECTION_REQUIRED');
          const {decodeTrip}=await import('../utils/persistenceBoundary');
          const snapshot=await this.db.collection('projects').doc(projectId).collection('trips').doc(event.tripId).get();
          if(!snapshot.exists)return gwsFail('PROFILE_TRIP_NOT_FOUND');
          const trip=decodeTrip<import('../types/entities').TripEntity>(snapshot.data(),event.tripId,projectId);
          if(!trip.operationalSnapshot)return gwsFail('PROFILE_SNAPSHOT_REQUIRED');
          await google.projectProfileTrip(state.binding.spreadsheetId,trip,this.resolvedBlueprint(state.project,state.binding));
        } else if(event.kind==='MASTER_DATA') {
          if(!google.projectMasterTabs)return gwsFail('MASTER_PROJECTION_PORT_REQUIRED');
          const freshness=await projectionState(projectId,this.db);
          const tabs=(freshness.dirtyTabs.length?freshness.dirtyTabs:event.dirtyTabs||[]).filter(isMasterTab);
          if(!tabs.length)return gwsFail('WORKSPACE_EVENT_SCOPE_INVALID');
          const {ProjectWorkspaceInitialProjectionServer}=await import('./projectWorkspaceInitialProjection.server');
          const snapshot=await new ProjectWorkspaceInitialProjectionServer().buildCanonicalProjection(projectId,this.db);
          await google.projectMasterTabs(state.binding.spreadsheetId,snapshot,tabs);
          await markProjectionSuccessful(projectId,tabs,undefined,freshness.mutationRevision,this.db,{owner,authorize:tx=>this.authorized(tx,projectId,who)});
        } else {
          // Explicit legacy mapping debt cannot suppress new canonical profile delivery.
          // Keep its event pending, without inventing a source row or acknowledging it.
          if(state.project.operationalConfiguration&&event.mappingRequired===true&&!event.input){legacyMappingPending=true;continue;}
          if(event.input?.projectId!==projectId)return gwsFail('WORKSPACE_EVENT_SCOPE_INVALID');
          if(!event.input)return gwsFail('SHEET_SOURCE_MAPPING_REQUIRED');
          await google.upsert(state.binding.spreadsheetId,event.input);
        }
        await this.db.runTransaction(async(tx:any)=>{
          await this.authorized(tx,projectId,who);
          const s=await tx.get(ref),fresh=await tx.get(syncOutboxRef(this.db,projectId).doc(doc.id));
          const current=s.data();
          if(current?.syncOwner!==owner||current?.syncLeaseExpiresAt<=Date.now()||current?.syncLeaseRevision!==(current?.binding?.revision??0)||current?.syncLeaseSpreadsheetId!==current?.binding?.spreadsheetId) return gwsFail('WORKSPACE_EXECUTION_FENCED');
          if(fresh.data()?.revision===event.revision) tx.set(syncOutboxRef(this.db,projectId).doc(doc.id),{...fresh.data(),status:'DELIVERED',deliveredAt:new Date().toISOString()});
        });
      }
      if(state.project.operationalConfiguration&&google.projectProfileReports){
        await this.renewSync(projectId,who,owner);
        const {decodeTrip}=await import('../utils/persistenceBoundary'),{buildOperationalReport}=await import('./operationalReporting');
        const snapshot=await this.db.collection('projects').doc(projectId).collection('trips').get();
        const trips=snapshot.docs.map((doc:any)=>decodeTrip<import('../types/entities').TripEntity>(doc.data(),doc.id,projectId));
        await google.projectProfileReports(state.binding.spreadsheetId,buildOperationalReport(trips,{projectId},new Date(),state.project.operationalConfiguration));
      }
      await this.finishSync(projectId,who,owner,legacyMappingPending?'SHEET_SOURCE_MAPPING_REQUIRED':null);
    } catch(error) {
      const code=error instanceof GoogleWorkspaceCommandError?error.code:'SHEET_SYNC_FAILED';
      await this.finishSync(projectId,who,owner,code);
      throw new GoogleWorkspaceCommandError(code,error instanceof GoogleWorkspaceCommandError?error.status:502);
    } finally {clearInterval(heartbeat);await this.releaseSync(projectId,owner);}
    return this.status(projectId,who);
  }
  private async finishSync(projectId:string,who:AuthUserContext,owner:string,error:string|null) {
    await this.db.runTransaction(async(tx:any)=>{
      const ref=continuityRef(this.db,projectId),snap=await tx.get(ref);
      const current=snap.data();
      if(current?.syncOwner!==owner||current?.syncLeaseExpiresAt<=Date.now()||current?.syncLeaseRevision!==(current?.binding?.revision??0)||current?.syncLeaseSpreadsheetId!==current?.binding?.spreadsheetId) return gwsFail('WORKSPACE_EXECUTION_FENCED');
      tx.set(ref,{...snap.data(),syncOwner:null,syncLeaseExpiresAt:0,state:error?(error==='BOUND_FILE_UNAVAILABLE'?'BOUND_FILE_UNAVAILABLE':/TOKEN_EXPIRED|AUTHORIZATION_REQUIRED|SCOPE_DENIED/.test(error)?'AUTHORIZATION_REQUIRED':'SYNC_DEGRADED'):'READY',lastSyncError:error,...(!error?{lastSuccessfulSyncAt:new Date().toISOString()}:{})});
      this.audit(tx,projectId,who.userId,error?'WORKSPACE_SYNC_FAILED':'WORKSPACE_SYNC_RECOVERED',{code:error});
    });
  }
}
export const projectGoogleWorkspaceServer=new ProjectGoogleWorkspaceServer();
