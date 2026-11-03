import {WorkspaceManagedDriveRoot,managedRootKey,managedRootRef} from './workspaceManagedRoot.server';
import {workspaceBindingAdoption} from './workspaceBindingHandoff';
import { createHash, randomUUID } from 'node:crypto';
import type { AuthUserContext } from '../types/common';
import { WORKSPACE_PHASES, type WorkspaceEnsureStatus, type WorkspacePhase, type WorkspaceProvisioningOperation, type WorkspaceRequiredAction } from '../types/workspaceProvisioning';
import { ProjectGoogleWorkspaceServer, GoogleWorkspaceCommandError, continuityRef, workspaceOperation, gwsFail, type GoogleBlueprintPort } from './projectGoogleWorkspace.server';
import type { WorkspaceGoogleOfflineAuthorization } from './workspaceGoogleOfflineAuthorization.server';
import { resolveWorkspaceTemplate } from './workspaceTemplateRegistry';
import { validateOperationalConfiguration } from './operationalProfileResolver';
import { getState } from './projectWorkspaceProjectionState.server';
import { boundedWorkspaceHttpCode } from '../utils/workspaceHttp';
import { AUTH_TRANSIENT_CODES } from '../utils/workspaceAuthorization';
const LEASE_MS = 120000;
const ordered = (value: any): any => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])])) : value;
const configurationHash = (configuration: unknown) => createHash('sha256').update(JSON.stringify(ordered(configuration ?? null))).digest('hex');
const busyCodes = new Set(['WORKSPACE_SYNC_IN_PROGRESS', 'WORKSPACE_PROVISIONING_IN_PROGRESS','WORKSPACE_ROOT_IN_PROGRESS','WORKSPACE_EXECUTION_FENCED']);
/** One lifecycle over canonical continuity/receipts/grants. No second resource registry. */
export class WorkspaceProvisioningOrchestrator {
    constructor(private db: any, private workspace: ProjectGoogleWorkspaceServer, private authorization: Pick<WorkspaceGoogleOfflineAuthorization, 'access' | 'diagnoseWorkspaceAuthorization'>, private google: (token: string, projectId: string) => GoogleBlueprintPort) { }
    private async snapshot(projectId: string, actor: AuthUserContext) { return this.db.runTransaction(async (tx: any) => { const { project } = await this.workspace.authorized(tx, projectId, actor); return { project, state: (await tx.get(continuityRef(this.db, projectId))).data() || {} }; }); }
    async observe(projectId: string, actor: AuthUserContext): Promise<WorkspaceEnsureStatus> {
        const { state,project } = await this.snapshot(projectId, actor), op: WorkspaceProvisioningOperation | undefined = state.ensureOperation;
        if (!op)
            return { state: state.binding ? 'ATTENTION_REQUIRED' : 'NOT_CONFIGURED', operationId: null, phase: 'PREFLIGHT', completed: [], actionRequired: null, retryable: true, canResume: true };
        if(op.configurationHash!==configurationHash(project.operationalConfiguration))return this.dto({...op,lastBoundedError:'WORKSPACE_TEMPLATE_MIGRATION_REQUIRED',actionRequired:null,retryable:false},'ATTENTION_REQUIRED',false);
        if(op.bindingRevision!==(state.binding?.revision||0)||op.spreadsheetId!==(state.binding?.spreadsheetId||null))return this.dto({...op,lastBoundedError:'WORKSPACE_BINDING_CONFLICT',actionRequired:null,retryable:false},'ATTENTION_REQUIRED',false);
        const rootLease=op.managedRootKey?(await managedRootRef(this.db,op.managedRootKey).get()).data():null;
        const live = Boolean(rootLease?.owner&&rootLease.expiresAt>Date.now()||op.leaseOwner && op.leaseExpiresAt > Date.now() || state.syncOwner && state.syncLeaseExpiresAt > Date.now() || state.owner && state.leaseUntil > Date.now());
        if (live)
            return this.dto(op, 'PREPARING', false);
        const diagnosis = await this.authorization.diagnoseWorkspaceAuthorization(projectId, actor);
        if(op.actionRequired==='DESTINATION'){
          if(['ACCOUNT_MISMATCH','GRANT_BINDING_STALE'].includes(diagnosis.result))return this.dto({...op,actionRequired:null,retryable:false},'ATTENTION_REQUIRED',false);
          const valid=diagnosis.result==='CONNECTED_VALID';return this.dto({...op,actionRequired:valid?null:'GOOGLE_AUTHORIZATION'},valid?'PREPARING':'ACTION_REQUIRED',true);
        }
        if (op.lastBoundedError === 'SCRIPT_CREATE_IDENTITY_UNCERTAIN' && (state.scriptProjectId || state.binding?.scriptProjectId))
            return this.dto({ ...op, lastBoundedError: null }, 'PREPARING', true);
        if (op.actionRequired === 'GOOGLE_AUTHORIZATION' || op.actionRequired === 'GOOGLE_AUTOMATION_PERMISSION') {
            if (diagnosis.result === 'CONNECTED_VALID')
                return this.dto({ ...op, actionRequired: null }, 'PREPARING', true);
        }
        if (op.status === 'READY') {
            const status = await this.workspace.status(projectId, actor), dirty = (await getState(projectId, this.db)).dirtyTabs.length;
            const ready = status.workspaceState === 'CONNECTED' && status.workbookHealth === 'HEALTHY' && (status.automationState === 'READY' || status.automationState === 'NOT_REQUIRED') && status.backgroundAuthorization === 'CONNECTED' && diagnosis.result === 'CONNECTED_VALID' && status.syncHealth === 'HEALTHY' && !status.pendingSyncCount && !!status.lastSuccessfulSyncAt && !dirty;
            return this.dto(op, ready ? 'READY' : 'ATTENTION_REQUIRED', !ready);
        }
        if(op.actionRequired==='GOOGLE_AUTOMATION_PERMISSION')return this.dto({...op,actionRequired:'GOOGLE_AUTHORIZATION'},op.status,true);
        return this.dto(op, op.status === 'PREPARING' ? 'PREPARING' : op.status, op.status === 'PREPARING' || op.retryable || op.status === 'ACTION_REQUIRED');
    }
    private dto(op: WorkspaceProvisioningOperation, state: WorkspaceEnsureStatus['state'], canResume: boolean): WorkspaceEnsureStatus {
        return { state, operationId: op.operationId, phase: op.phase, completed: op.completed, actionRequired: op.actionRequired, retryable: op.retryable, canResume, ...(op.lastBoundedError ? { diagnostic: op.lastBoundedError } : {}) };
    }
    private async claim(projectId: string, actor: AuthUserContext, owner: string) {
        return this.db.runTransaction(async (tx: any) => {
            const { project } = await this.workspace.authorized(tx, projectId, actor), ref = continuityRef(this.db, projectId);
            let s=(await tx.get(ref)).data()||{},old:WorkspaceProvisioningOperation|undefined=s.ensureOperation;const now=Date.now();
            if (old?.leaseOwner && old.leaseExpiresAt > now || s.syncOwner && s.syncLeaseExpiresAt > now || s.owner && s.leaseUntil > now)
                return null;
            let adoption:any=null,grantRef:any=null;
            if(old&&s.binding&&s.provisioningAuthorization&&s.backgroundAuthorizationId){
              grantRef=this.db.collection('workspace_google_authorizations').doc(s.backgroundAuthorizationId);const g=(await tx.get(grantRef)).data();
              if(old.bindingRevision!==s.binding.revision||old.spreadsheetId!==s.binding.spreadsheetId||g?.bindingRevision===0&&g?.spreadsheetId===''){
                adoption=workspaceBindingAdoption(s,s.binding,g,s.backgroundAuthorizationId,actor.userId);if(!adoption)return gwsFail('WORKSPACE_BINDING_CONFLICT');s={...s,ensureOperation:adoption.operation};old=adoption.operation;
              }
            }
            const hash = configurationHash(project.operationalConfiguration);
            if (old && old.configurationHash !== hash)
                return gwsFail('WORKSPACE_TEMPLATE_MIGRATION_REQUIRED');
            if (old && (old.bindingRevision !== (s.binding?.revision || 0) || old.spreadsheetId !== (s.binding?.spreadsheetId || null)))
                return gwsFail('WORKSPACE_BINDING_CONFLICT');
            if (old?.lastBoundedError === 'SCRIPT_CREATE_IDENTITY_UNCERTAIN' && !s.scriptProjectId && !s.binding?.scriptProjectId)
                return null;
            const op: WorkspaceProvisioningOperation = {...(old?.managedRootKey?{managedRootKey:old.managedRootKey}:{}), operationId: workspaceOperation(projectId), projectId, actorId: actor.userId, configurationHash: hash, bindingRevision: s.binding?.revision || 0, spreadsheetId: s.binding?.spreadsheetId || null, profile: old?.profile || '', profileVersion: old?.profileVersion || '', phase: old?.phase || 'PREFLIGHT', completed: old?.completed || [], status: 'PREPARING', actionRequired: null, revision: (old?.revision || 0) + 1, attempt: (old?.attempt || 0) + 1, createdAt: old?.createdAt || now, updatedAt: now, lastProgressAt: now, leaseOwner: owner, leaseExpiresAt: now + LEASE_MS, lastBoundedError: null, retryable: false, timeline: [...(old?.timeline || []), { phase: old?.phase || 'PREFLIGHT', at: now, event: 'WORKSPACE_ENSURE_STARTED' }].slice(-48) };
            if(adoption&&grantRef)tx.set(grantRef,adoption.grant);
            tx.set(ref, { ...s, ensureOperation: op });
            return { project, op };
        });
    }
    async ensure(projectId: string, actor: AuthUserContext): Promise<WorkspaceEnsureStatus> {
        const owner = randomUUID(), claim = await this.claim(projectId, actor, owner);
        if (!claim) {
            const observed = await this.observe(projectId, actor);
            return observed.state === 'ATTENTION_REQUIRED' ? observed : { ...observed, state: 'PREPARING', canResume: false };
        }
        const ref = continuityRef(this.db, projectId);
        let authority = this.workspace.forEnsure(owner);
        const patch = async (change: Partial<WorkspaceProvisioningOperation>) => this.db.runTransaction(async (tx: any) => {
            const { project } = await authority.authorized(tx, projectId, actor), s = (await tx.get(ref)).data(), op: WorkspaceProvisioningOperation = s.ensureOperation;
            if (op.bindingRevision !== (s.binding?.revision || 0) || op.spreadsheetId !== (s.binding?.spreadsheetId || null))
                return gwsFail('WORKSPACE_EXECUTION_FENCED');
            if (configurationHash(project.operationalConfiguration) !== op.configurationHash)
                return gwsFail('WORKSPACE_TEMPLATE_MIGRATION_REQUIRED');
            if(Object.entries(change).every(([key,value])=>JSON.stringify((op as any)[key])===JSON.stringify(value))&&op.leaseExpiresAt-Date.now()>LEASE_MS/2)return op;
            const next = { ...op, ...change, revision: op.revision + 1, updatedAt: Date.now(), leaseExpiresAt: Date.now() + LEASE_MS };
            tx.set(ref, { ...s, ensureOperation: next });
            return next;
        });
        let heartbeatPendingRetry = false;
        const renew = async () => { const value = await patch({}); heartbeatPendingRetry = false; return value; };
        const checkpoint = async (phase: WorkspacePhase) => {
            const s = (await ref.get()).data(), op: WorkspaceProvisioningOperation = s.ensureOperation;
            if(op.completed.includes(phase)){await renew();return;}
            const completed = WORKSPACE_PHASES.filter(p => op.completed.includes(p) || p === phase);
            await patch({ phase: WORKSPACE_PHASES[Math.max(WORKSPACE_PHASES.indexOf(op.phase), WORKSPACE_PHASES.indexOf(phase))], completed, lastProgressAt: Date.now(), timeline: [...op.timeline, { phase, at: Date.now(), event: phase + '_CONFIRMED' }].slice(-48) });
        };
        const requireAction = async (action: WorkspaceRequiredAction) => patch({ status: 'ACTION_REQUIRED', actionRequired: action, retryable: false });
        const heartbeat = setInterval(() => { void renew().catch(() => { heartbeatPendingRetry = true; }); }, 30000);
        heartbeat.unref?.();
        try {
            const configuration = validateOperationalConfiguration(claim.project.operationalConfiguration), template = resolveWorkspaceTemplate(configuration, true);
            await patch({ profile: template.supportedOperationalProfile, profileVersion: template.version });
            await checkpoint('PREFLIGHT');
            let credential: Awaited<ReturnType<WorkspaceGoogleOfflineAuthorization['access']>>;
            try {
                credential = await this.authorization.access(projectId, actor);
            }
            catch (error) {
                if (error instanceof GoogleWorkspaceCommandError && error.code === 'AUTHORIZATION_REQUIRED') {
                    await requireAction('GOOGLE_AUTHORIZATION');
                    return await this.observeAfterRelease(projectId, actor, owner);
                }
                throw error;
            }
            authority = this.workspace.forEnsure(owner, credential.authorizationId);
            await renew();
            if (!credential.automation) {
                await requireAction('GOOGLE_AUTHORIZATION');
                return await this.observeAfterRelease(projectId, actor, owner);
            }
            await checkpoint('AUTHORIZATION');
            const google = this.google(credential.accessToken, projectId), setFence = google.setDeliveryFence?.bind(google);
            // Nested repair/projection leases augment rather than replace the lifecycle fence.
            google.setDeliveryFence = check => setFence?.(async () => { await renew(); await check(); });
            setFence?.(async () => { await renew(); });
            let current = (await ref.get()).data();
            if (!current.binding) {
                const receipt=(await this.db.collection('projects').doc(projectId).collection('workspace_destination').doc('current').get()).data();
                let root:string;
                if(current.stage||current.folderId||current.fileId){
                  root=current.destinationRootFolderId;if(!root||receipt?.rootId!==root)return gwsFail('WORKSPACE_RECOVERY_REQUIRED');
                }else{
                  const subject=await google.subject(),expected=current.provisioningAuthorization?.googleSubject;
                  if(!expected||subject!==expected)return gwsFail('WORKSPACE_GOOGLE_ACCOUNT_MISMATCH');
                  const key=managedRootKey(subject);await patch({managedRootKey:key});
                  root=await new WorkspaceManagedDriveRoot(this.db,tx=>authority.authorized(tx,projectId,actor)).ensure(key,google);
                  setFence?.(async()=>{await renew();});
                  await authority.approveDestination(projectId,root,actor,google);
                }
                await checkpoint('DESTINATION');
                await authority.provision(projectId, root, actor, google, Boolean(current.stage));
            }
            else if(current.ensureOperation.managedRootKey){
                if(managedRootKey(await google.subject())!==current.ensureOperation.managedRootKey)return gwsFail('WORKSPACE_GOOGLE_ACCOUNT_MISMATCH');
                await new WorkspaceManagedDriveRoot(this.db,tx=>authority.authorized(tx,projectId,actor)).ensure(current.ensureOperation.managedRootKey,google,current.binding.destinationRootFolderId);
                setFence?.(async()=>{await renew();});
            }
            for (const phase of ['DESTINATION', 'FOLDER', 'SPREADSHEET', 'BINDING'] as WorkspacePhase[])
                await checkpoint(phase);
            await authority.verifyEnsureBindingHandoff(projectId,actor);
            const adopted=await this.authorization.access(projectId,actor);if(adopted.authorizationId!==credential.authorizationId)return gwsFail('WORKSPACE_EXECUTION_FENCED');
            current = (await ref.get()).data();
            {
                await authority.initializeBound(projectId, actor, google, { workbookOnly: true });
                if ((await this.workspace.status(projectId, actor)).workbookHealth !== 'HEALTHY')
                    return gwsFail('WORKBOOK_REPAIR_FAILED', 502);
            }
            await checkpoint('WORKBOOK');
            if (!current.ensureOperation.completed.includes('MASTER_DATA')) {
                await authority.prepareEnsureProjection(projectId, actor);
                await authority.retrySync(projectId, actor, google, true);
            }
            await checkpoint('MASTER_DATA');
            await authority.ensureAutomation(projectId, actor, google);
            await checkpoint('SCRIPT');
            await checkpoint('SCRIPT_VERIFY');
            await authority.retrySync(projectId, actor, google, true);
            await checkpoint('FINAL_SYNC');
            if (heartbeatPendingRetry) await renew();
            setFence?.(async () => { await renew(); });
            const latest = await this.workspace.status(projectId, actor), state = (await ref.get()).data();
            await google.verifyBinding(latest.binding!.destinationRootFolderId!, latest.binding!.projectFolderId!, latest.binding!.spreadsheetId, latest.binding!.workspaceBlueprintVersion!);
            await google.verifyWorkbook(latest.binding!.spreadsheetId, authority.resolvedBlueprint(claim.project, state.binding));
            const proof = await this.authorization.access(projectId, actor), dirty = (await getState(projectId, this.db)).dirtyTabs.length;
            if (proof.authorizationId !== credential.authorizationId || !proof.automation || latest.workspaceState !== 'CONNECTED' || latest.workbookHealth !== 'HEALTHY' || !['READY', 'NOT_REQUIRED'].includes(latest.automationState!) || latest.syncHealth !== 'HEALTHY' || latest.pendingSyncCount || !latest.lastSuccessfulSyncAt || dirty)
                return gwsFail('WORKSPACE_FINAL_VERIFICATION_REQUIRED');
            await checkpoint('FINAL_VERIFY');
            await checkpoint('READY');
            await patch({ status: 'READY', actionRequired: null, retryable: false, lastBoundedError: null });
        }
        catch (error) {
            const raw = error instanceof GoogleWorkspaceCommandError ? error.code : undefined;
            const current = (await ref.get()).data(), historical = raw === 'GOOGLE_PERMISSION_DENIED' && current.binding?.scriptProjectId && !current.binding.workspaceBlueprintVersion?.endsWith('_FRESH_V2');
            const code = historical ? 'HISTORICAL_EXTERNAL_RESOURCE_PERMISSION' : raw === 'SCRIPT_CREATE_IDENTITY_UNCERTAIN' ? raw : boundedWorkspaceHttpCode(raw) || 'WORKSPACE_ENSURE_FAILED';
            if (code === 'AUTHORIZATION_REQUIRED' || code.startsWith('SCOPE_DENIED') || code === 'AUTOMATION_SCOPE_REQUIRED')
                await requireAction('GOOGLE_AUTHORIZATION');
            else
                await patch({ status: busyCodes.has(code) ? 'PREPARING' : 'ATTENTION_REQUIRED', lastBoundedError: code, retryable: busyCodes.has(code) || (AUTH_TRANSIENT_CODES as readonly string[]).includes(code) || ['HOST_SERVICE_UNAVAILABLE', 'WORKBOOK_REPAIR_FAILED', 'SHEET_SYNC_FAILED','WORKSPACE_ROOT_RECOVERY_REQUIRED'].includes(code) });
        }
        finally {
            clearInterval(heartbeat);
            await this.release(projectId, owner);
        }
        return this.observe(projectId, actor);
    }
    async reconcileConflict(projectId:string,actor:AuthUserContext,error:unknown):Promise<WorkspaceEnsureStatus|null>{
      if(!(error instanceof GoogleWorkspaceCommandError)||!['WORKSPACE_SYNC_IN_PROGRESS','WORKSPACE_PROVISIONING_IN_PROGRESS','WORKSPACE_EXECUTION_FENCED','WORKSPACE_BINDING_CONFLICT','WORKSPACE_TEMPLATE_MIGRATION_REQUIRED'].includes(error.code))return null;
      const canonical=await this.observe(projectId,actor);
      return error.code==='WORKSPACE_BINDING_CONFLICT'&&!['PREPARING','READY'].includes(canonical.state)?{...canonical,state:'ATTENTION_REQUIRED',diagnostic:'WORKSPACE_BINDING_CONFLICT',actionRequired:null,retryable:false,canResume:false}:canonical;
    }
    private async release(projectId: string, owner: string) { await this.db.runTransaction(async (tx: any) => { const ref = continuityRef(this.db, projectId), s = (await tx.get(ref)).data(); if (s?.ensureOperation?.leaseOwner === owner)
        tx.set(ref, { ...s, ensureOperation: { ...s.ensureOperation, leaseOwner: null, leaseExpiresAt: 0, updatedAt: Date.now() } }); }); }
    private async observeAfterRelease(projectId: string, actor: AuthUserContext, owner: string) { await this.release(projectId, owner); return this.observe(projectId, actor); }
}
