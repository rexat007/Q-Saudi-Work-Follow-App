import { createHash, randomUUID } from 'node:crypto';
import { adminDb } from '../firebase/admin';
import { buildPrincipal } from '../utils/principal';
import { decodeProject } from '../utils/persistenceBoundary';
import { assertFoundationMutation } from './projectMutability.policy';
import type { AuthUserContext } from '../types/common';
import type { ProjectEntity } from '../types/entities';
import type { ProjectGoogleBinding, ProjectGoogleStatus } from '../types/projectGoogleWorkspace';
import type { OperationalSheetInput } from './projectGoogleSheetContract';

export class GoogleWorkspaceCommandError extends Error {
  constructor(public code: string, public status = 409) { super(code); }
}
export const gwsFail = (code: string, status = 409): never => { throw new GoogleWorkspaceCommandError(code,status); };
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
const validId=(value: unknown): value is string=>typeof value==='string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
export const workspaceOperation = (projectId: string) => createHash('sha256').update(`PFAG-GWS1:${projectId}`).digest('hex');
export function continuityRef(db: any, projectId: string) { return db.collection('projects').doc(projectId).collection('workspace_continuity').doc('current'); }
export function syncOutboxRef(db: any, projectId: string) { return db.collection('projects').doc(projectId).collection('workspace_sync_outbox'); }

function publicBinding(raw: ProjectGoogleBinding): ProjectGoogleBinding {
  return { projectId:raw.projectId,provider:'GOOGLE',spreadsheetId:raw.spreadsheetId,driveFileId:raw.driveFileId,spreadsheetUrl:raw.spreadsheetUrl,templateId:raw.templateId,templateVersion:raw.templateVersion,googleSubject:raw.googleSubject,googleAccountLabel:raw.googleAccountLabel||raw.googleSubject,provisionedAt:raw.provisionedAt,provisionedBy:raw.provisionedBy,revision:raw.revision };
}
/** One canonical server authority; Google port is transient authorization, never a credential DTO. */
export class ProjectGoogleWorkspaceServer {
  constructor(private database?: any, private template: ()=>TemplateConfiguration = configuredTemplate) {}
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
    await this.db.runTransaction((tx:any)=>this.authorized(tx,projectId,who));
    return this.template();
  }
  async status(projectId:string,who:AuthUserContext):Promise<ProjectGoogleStatus> {
    const state=await this.db.runTransaction(async(tx:any)=>{
      await this.authorized(tx,projectId,who);
      const snap=await tx.get(continuityRef(this.db,projectId));return snap.exists?snap.data():{};
    });
    const jobs=await syncOutboxRef(this.db,projectId).get();
    return {state:state.state||'NOT_CONNECTED',binding:state.binding?publicBinding(state.binding):null,lastSuccessfulSyncAt:state.lastSuccessfulSyncAt||null,lastSyncError:state.lastSyncError||null,pendingSyncCount:jobs.docs.filter((d:any)=>d.data().status!=='DELIVERED').length};
  }
  async provision(projectId:string,who:AuthUserContext,google:GoogleTemplatePort):Promise<ProjectGoogleBinding> {
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
