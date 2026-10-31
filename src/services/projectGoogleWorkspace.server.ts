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

export class GoogleWorkspaceCommandError extends Error {
  constructor(public code: string, public status = 409, public diagnostic?: WorkspaceGenerationDiagnostic) { super(code); }
}
export const gwsFail = (code: string, status = 409): never => { throw new GoogleWorkspaceCommandError(code,status); };
export async function withWorkspaceGenerationDiagnostic<T>(operation: WorkspaceGenerationOperation, run: () => Promise<T>): Promise<T> {
  try { return await run(); } catch(error) {
    if(error instanceof GoogleWorkspaceCommandError && error.diagnostic) throw error;
    const failure=classifyWorkspaceGenerationFailure(error,operation,error instanceof GoogleWorkspaceCommandError || error instanceof BlueprintError ? error.code : undefined);
    throw new GoogleWorkspaceCommandError(failure.code,502,failure.diagnostic);
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
  authorizeProvisioning():Promise<void>;
  authorizeBinding():Promise<void>;
  verifyBinding(rootId:string,folderId:string,fileId:string,version:string):Promise<{title:string}>;
  verifyWorkbook(fileId:string,blueprint:WorkspaceBlueprint):Promise<void>;
  validateDestination(folderId:string,projectId:string):Promise<void>;
  findResource(operationId:string,role:'FOLDER'|'SPREADSHEET'):Promise<Array<{id:string;parentId:string}>>;
  createProjectFolder(name:string,parentId:string,operationId:string,version:string):Promise<string>;
  createProjectSpreadsheet(name:string,folderId:string,operationId:string,version:string):Promise<string>;
  applyBlueprint(fileId:string,blueprint:WorkspaceBlueprint):Promise<void>;
  createBoundScript(fileId:string):Promise<string>;
  installScript(scriptId:string,blueprint:WorkspaceBlueprint):Promise<void>;
  verifyGenerated(fileId:string,scriptId:string,blueprint:WorkspaceBlueprint):Promise<void>;
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
  constructor(private database?: any, private template: ()=>TemplateConfiguration = configuredTemplate, private blueprint:()=>WorkspaceBlueprint = activeWorkspaceBlueprint) {}
  private get db() { return this.database || adminDb; }
  private async authorized(tx: any, projectId: string, who: AuthUserContext) {
    if (!validId(projectId) || !validId(who?.userId)) return gwsFail('FORBIDDEN_PROJECT_ACCESS',403);
    const account=await tx.get(this.db.collection('users').doc(who.userId));
    const principal=buildPrincipal(account.exists?account.data():null,who.userId,{});
    if (principal.role!=='SUPER_ADMIN' && (principal.role!=='PROJECT_ADMIN' || !principal.assignedProjectIds.includes(projectId))) return gwsFail('FORBIDDEN_PROJECT_ACCESS',403);
    const snap=await tx.get(this.db.collection('projects').doc(projectId));
    if(!snap.exists) return gwsFail('PROJECT_NOT_FOUND',404);
    const project=decodeProject<ProjectEntity>(snap.data(),projectId);
    assertFoundationMutation(project.status,'MAINTENANCE');
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
    return {state:state.state||'NOT_CONNECTED',binding:state.binding?publicBinding(state.binding):null,lastSuccessfulSyncAt:state.lastSuccessfulSyncAt||null,lastSyncError:state.lastSyncError||null,pendingSyncCount:jobs.docs.filter((d:any)=>d.data().status!=='DELIVERED').length,workspaceState:state.binding?(['AUTHORIZATION_REQUIRED','BOUND_FILE_UNAVAILABLE','SYNC_DEGRADED'].includes(state.state)?state.state:'CONNECTED'):state.folderId||state.fileId?'CONNECTING':'NOT_CONNECTED',automationState:state.automationState||'NOT_INSTALLED',recoveryAvailable:!state.binding&&Boolean(state.destinationRootFolderId&&(state.folderId||state.fileId))};
  }
  async approveDestination(projectId:string,rootId:string,who:AuthUserContext,google:GoogleBlueprintPort) {
    if(!validId(rootId))return gwsFail('DESTINATION_FOLDER_REQUIRED',400);
    await this.db.runTransaction((tx:any)=>this.authorized(tx,projectId,who));
    const subject=await google.subject();await google.authorizeBinding();
    assertBlueprint(this.blueprint(),false);
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
      return prior.binding;
    }
    if(!validId(rootId))return gwsFail('DESTINATION_FOLDER_REQUIRED',400);
    const blueprint=this.blueprint();assertBlueprint(blueprint,false);
    await google.authorizeBinding();await google.validateDestination(rootId,projectId);
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
      const next={...s,projectId,destinationRootFolderId:rootId,googleSubject:subject,workspaceBlueprintVersion:blueprint.version,operationId:op,owner,leaseUntil:Date.now()+120000,state:'PROVISIONING',lastGenerationDiagnostic:null,automationStage:s.automationStage||(['SCRIPT_REQUESTED','SCRIPT_CREATED','SCRIPT_INSTALLED'].includes(s.stage)?s.stage:'NOT_INSTALLED')};
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
        await save({fileId,stage:'SPREADSHEET_CREATED'});
        await this.db.runTransaction(async(tx:any)=>this.audit(tx,projectId,who.userId,'WORKSPACE_PROJECT_WORKBOOK_CREATED',{fileId}));
      }
      if(!['BLUEPRINT_APPLIED','SCRIPT_REQUESTED','SCRIPT_CREATED','SCRIPT_INSTALLED','VERIFIED'].includes(state.stage)) {
        await google.applyBlueprint(state.fileId,blueprint);await save({stage:'BLUEPRINT_APPLIED'});
      }
      const resource=await google.verifyBinding(rootId,state.folderId,state.fileId,blueprint.version);
      await google.verifyWorkbook(state.fileId,blueprint);await save({stage:'VERIFIED'});
      const binding:ProjectGoogleBinding={projectId,provider:'GOOGLE',destinationRootFolderId:rootId,projectFolderId:state.folderId,spreadsheetId:state.fileId,driveFileId:state.fileId,spreadsheetUrl:`https://docs.google.com/spreadsheets/d/${state.fileId}/edit`,spreadsheetTitle:resource.title,workspaceBlueprintVersion:blueprint.version,...(state.scriptProjectId?{scriptProjectId:state.scriptProjectId,...(blueprint.script?{appsScriptBlueprintVersion:blueprint.script.version}:{})}:{}),googleSubject:subject,googleAccountLabel:google.accountLabel?.()||subject,provisionedAt:new Date().toISOString(),provisionedBy:who.userId,revision:1};
      await withWorkspaceGenerationDiagnostic('PERSIST_BINDING',()=>this.db.runTransaction(async(tx:any)=>{
        const {project}=await this.authorized(tx,projectId,who),snap=await tx.get(ref);
        if(snap.data()?.owner!==owner||snap.data()?.binding)return gwsFail('WORKSPACE_EXECUTION_FENCED');
        tx.set(ref,{...snap.data(),binding,state:'READY',workspaceState:'CONNECTED',automationState:snap.data()?.automationState||'NOT_INSTALLED',stage:'BOUND',leaseUntil:0,lastSyncError:null,lastGenerationDiagnostic:null});
        tx.update(this.db.collection('projects').doc(projectId),{settings:{...project.settings,googleDriveFolderId:binding.projectFolderId,googleSpreadsheetId:binding.spreadsheetId,googleDriveProvisioning:{enabled:true,status:'PROVISIONED',rootFolderName:name,spreadsheetTitle:name}},updatedBy:who.userId,updatedAt:new Date().toISOString()});
        this.audit(tx,projectId,who.userId,'WORKSPACE_BOUND',{fileId:binding.spreadsheetId,workspaceBlueprintVersion:blueprint.version,...(binding.scriptProjectId?{scriptProjectId:binding.scriptProjectId}:{})});
      }));return binding;
    } catch(error) {
      const code=(error as {code?:string}).code||'SPREADSHEET_GENERATION_FAILED';
      const diagnostic=error instanceof GoogleWorkspaceCommandError ? error.diagnostic : undefined;
      await this.db.runTransaction(async(tx:any)=>{const snap=await tx.get(ref);if(snap.data()?.owner===owner)tx.set(ref,{...snap.data(),state:'FAILED',lastSyncError:code,leaseUntil:0,lastGenerationDiagnostic:diagnostic||null});});
      throw new GoogleWorkspaceCommandError(code,502,diagnostic);
    }
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
  async retrySync(projectId:string,who:AuthUserContext,google:GoogleTemplatePort) {
    const owner=randomUUID(),ref=continuityRef(this.db,projectId);
    const state=await this.db.runTransaction(async(tx:any)=>{
      await this.authorized(tx,projectId,who);
      const snap=await tx.get(ref),s=snap.exists?snap.data():{};
      if(!s.binding || s.binding.projectId!==projectId) return gwsFail('WORKSPACE_NOT_PROVISIONED');
      if(s.syncOwner) return gwsFail('WORKSPACE_SYNC_RECONCILIATION_REQUIRED');
      tx.set(ref,{...s,syncOwner:owner});return s;
    });
    try {
      if(await google.subject()!==state.binding.googleSubject) return gwsFail('WORKSPACE_ACCOUNT_CHANGE_REQUIRES_EXPLICIT_MIGRATION');
      await google.verify(state.binding.spreadsheetId,workspaceOperation(projectId));
      const events=await syncOutboxRef(this.db,projectId).get();
      for(const doc of events.docs) {
        const event=doc.data();if(event.status==='DELIVERED') continue;
        if(event.projectId!==projectId || event.input?.projectId!==projectId) return gwsFail('WORKSPACE_EVENT_SCOPE_INVALID');
        if(!event.input) return gwsFail('SHEET_SOURCE_MAPPING_REQUIRED');
        await google.upsert(state.binding.spreadsheetId,event.input);
        await this.db.runTransaction(async(tx:any)=>{
          await this.authorized(tx,projectId,who);
          const s=await tx.get(ref),fresh=await tx.get(syncOutboxRef(this.db,projectId).doc(doc.id));
          if(s.data()?.syncOwner!==owner) return gwsFail('WORKSPACE_EXECUTION_FENCED');
          if(fresh.data()?.revision===event.revision) tx.set(syncOutboxRef(this.db,projectId).doc(doc.id),{...fresh.data(),status:'DELIVERED',deliveredAt:new Date().toISOString()});
        });
      }
      await this.finishSync(projectId,who,owner,null);
    } catch(error) {
      const code=error instanceof GoogleWorkspaceCommandError?error.code:'SHEET_SYNC_FAILED';
      await this.finishSync(projectId,who,owner,code);
      throw new GoogleWorkspaceCommandError(code,502);
    }
    return this.status(projectId,who);
  }
  private async finishSync(projectId:string,who:AuthUserContext,owner:string,error:string|null) {
    await this.db.runTransaction(async(tx:any)=>{
      const ref=continuityRef(this.db,projectId),snap=await tx.get(ref);
      if(snap.data()?.syncOwner!==owner) return gwsFail('WORKSPACE_EXECUTION_FENCED');
      tx.set(ref,{...snap.data(),syncOwner:null,state:error?(['TOKEN_EXPIRED','AUTHORIZATION_REQUIRED','SCOPE_DENIED'].includes(error)?'AUTHORIZATION_REQUIRED':'SYNC_DEGRADED'):'READY',lastSyncError:error,...(!error?{lastSuccessfulSyncAt:new Date().toISOString()}:{})});
      this.audit(tx,projectId,who.userId,error?'WORKSPACE_SYNC_FAILED':'WORKSPACE_SYNC_RECOVERED',{code:error});
    });
  }
}
export const projectGoogleWorkspaceServer=new ProjectGoogleWorkspaceServer();
