import {AUTH_TRANSIENT_CODES,isWorkspaceAuthReason,workspaceGrantFailure,workspaceAuthResult,type WorkspaceAuthReason,type WorkspaceAuthorizationDiagnosis} from '../utils/workspaceAuthorization';
import {classifyGoogleProviderFailure,isGoogleProviderCode} from '../../server/workspaceGoogleErrors';
import {createCipheriv,createDecipheriv,createHash,randomBytes,randomUUID} from 'node:crypto';
import {adminDb,adminAuth} from '../firebase/admin';
import type {AuthUserContext} from '../types/common';
import {BINDING_WORKSPACE_SCOPES,REQUIRED_WORKSPACE_SCOPES,missingWorkspaceBindingScopes,missingWorkspaceScopes} from '../utils/googleWorkspaceScopes';
import {GoogleWorkspaceCommandError,ProjectGoogleWorkspaceServer,continuityRef,gwsFail} from './projectGoogleWorkspace.server';

export const AUTHORIZATIONS='workspace_google_authorizations';
const TRANSACTIONS='workspace_google_oauth_transactions';
const hash=(v:string)=>createHash('sha256').update(v).digest('base64url');
export interface OfflineConfig {clientId:string;clientSecret:string;redirectUri:string;key:Buffer;keyVersion:string}
export function workspaceOfflineConfig():OfflineConfig {
  const clientId=process.env.GOOGLE_WORKSPACE_CLIENT_ID,clientSecret=process.env.GOOGLE_WORKSPACE_CLIENT_SECRET,redirectUri=process.env.GOOGLE_WORKSPACE_REDIRECT_URI,keyText=process.env.GOOGLE_WORKSPACE_CREDENTIAL_KEY;
  if(!clientId||!clientSecret||!redirectUri||!keyText)return gwsFail('GOOGLE_OFFLINE_CONFIGURATION_REQUIRED',503);
  let url:URL;try{url=new URL(redirectUri);}catch{return gwsFail('GOOGLE_OFFLINE_CONFIGURATION_REQUIRED',503);}
  if((url.protocol!=='https:'&&!(process.env.NODE_ENV!=='production'&&url.hostname==='localhost'))||url.search||url.hash||url.pathname!=='/workspace/google/callback')return gwsFail('GOOGLE_OFFLINE_CONFIGURATION_REQUIRED',503);
  const key=Buffer.from(keyText,'base64');if(key.length!==32||key.toString('base64')!==keyText)return gwsFail('GOOGLE_OFFLINE_CONFIGURATION_REQUIRED',503);
  return {clientId,clientSecret,redirectUri,key,keyVersion:process.env.GOOGLE_WORKSPACE_CREDENTIAL_KEY_VERSION||'v1'};
}
export interface SealedCredential {version:string;nonce:string;tag:string;ciphertext:string}
export function sealWorkspaceSecret(secret:string,aad:string,c:OfflineConfig):SealedCredential {
  const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',c.key,nonce);cipher.setAAD(Buffer.from(aad));
  const ciphertext=Buffer.concat([cipher.update(secret,'utf8'),cipher.final()]).toString('base64');
  return {version:c.keyVersion,nonce:nonce.toString('base64'),ciphertext,tag:cipher.getAuthTag().toString('base64')};
}
export function openWorkspaceSecret(sealed:SealedCredential,aad:string,c:OfflineConfig):string {
  try {
    // Rotation is explicit: keep older keys in hosting secrets until grants are reauthorized.
    let key=c.key;
    if(sealed.version!==c.keyVersion){const old=JSON.parse(process.env.GOOGLE_WORKSPACE_PREVIOUS_CREDENTIAL_KEYS||'{}');key=Buffer.from(old[sealed.version]||'','base64');}
    if(key.length!==32)throw Error();const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(sealed.nonce,'base64'));decipher.setAAD(Buffer.from(aad));decipher.setAuthTag(Buffer.from(sealed.tag,'base64'));
    return Buffer.concat([decipher.update(Buffer.from(sealed.ciphertext,'base64')),decipher.final()]).toString('utf8');
  } catch{return gwsFail('GOOGLE_CREDENTIAL_UNAVAILABLE',503);}
}
export interface GoogleOfflineProvider {
  authorizationUrl(options:{state:string;challenge:string;nonce:string;scopes:readonly string[]}):string;
  exchange(code:string,verifier:string,nonce:string):Promise<{refreshToken:string;subject:string;scopes:string[]}>;
  refresh(refreshToken:string):Promise<{accessToken:string;subject:string;scopes:string[]}>;
  revoke(refreshToken:string):Promise<void>;
}
export class WorkspaceGoogleOfflineAuthorization {
  private workspace:ProjectGoogleWorkspaceServer;
  constructor(private provider:(config:OfflineConfig)=>GoogleOfflineProvider,private database:any=adminDb,private configuration=workspaceOfflineConfig,private googleSubject=async(id:string)=>{
    const user=await adminAuth.getUser(id);if(user.disabled)return gwsFail('ACCOUNT_NOT_ACTIVE',403);
    return user.providerData.find(p=>p.providerId==='google.com')?.uid||gwsFail('WORKSPACE_GOOGLE_ACCOUNT_MISMATCH',403);
  }){this.workspace=new ProjectGoogleWorkspaceServer(database);}
  private credentialRef(id:string){return this.database.collection(AUTHORIZATIONS).doc(id);}
  private aad(p:string,subject:string,id:string){return `workspace:${p}:${subject}:${id}`;}
  private audit(tx:any,projectId:string,actorId:string,action:string,details:Record<string,unknown>) {
    const ref=this.database.collection('projects').doc(projectId).collection('audit_logs').doc(randomUUID());
    tx.set(ref,{auditLogId:ref.id,projectId,action,createdBy:actorId,createdAt:new Date().toISOString(),details});
  }
  private failure(reason:WorkspaceAuthReason):never {
    const error=new GoogleWorkspaceCommandError('AUTHORIZATION_REQUIRED',401);
    Object.assign(error,{authorizationReason:reason});throw error;
  }
  private async snapshot(projectId:string,who:AuthUserContext) {
    return this.database.runTransaction(async(tx:any)=>{
      await this.workspace.authorized(tx,projectId,who);
      const s=(await tx.get(continuityRef(this.database,projectId))).data()||{};
      const id=s.backgroundAuthorizationId,grant=id?(await tx.get(this.credentialRef(id))).data():null;
      return {s,id,grant};
    });
  }
  async begin(projectId:string,who:AuthUserContext,automation:boolean) {
    const c=this.configuration(),{s}=await this.snapshot(projectId,who),b=s.binding;
    if(!b)return gwsFail('WORKSPACE_NOT_PROVISIONED');
    const subject=await this.googleSubject(who.userId);if(subject!==b.googleSubject)return gwsFail('WORKSPACE_GOOGLE_ACCOUNT_MISMATCH',403);
    const state=randomBytes(32).toString('base64url'),browser=randomBytes(32).toString('base64url'),verifier=randomBytes(48).toString('base64url'),nonce=randomBytes(32).toString('base64url'),id=hash(state),scopes=automation?REQUIRED_WORKSPACE_SCOPES:BINDING_WORKSPACE_SCOPES;
    await this.database.runTransaction(async(tx:any)=>{
      await this.workspace.authorized(tx,projectId,who);const snap=await tx.get(continuityRef(this.database,projectId)),current=snap.data();
      if(current?.binding?.spreadsheetId!==b.spreadsheetId||current?.binding?.googleSubject!==subject||current?.binding?.revision!==b.revision)return gwsFail('WORKSPACE_BINDING_CONFLICT');
      tx.set(this.database.collection(TRANSACTIONS).doc(id),{projectId,actorId:who.userId,subject,spreadsheetId:b.spreadsheetId,bindingRevision:b.revision,authorizationVersion:current.authorizationVersion||0,previousAuthorizationId:current.backgroundAuthorizationId||null,automation,browserHash:hash(browser),nonceHash:hash(nonce),verifier:sealWorkspaceSecret(verifier,`oauth:${id}:${projectId}`,c),expiresAt:Date.now()+600000,usedAt:null});
    });
    return {url:this.provider(c).authorizationUrl({state,challenge:hash(verifier),nonce,scopes:['openid','email',...scopes]}),browser,expiresIn:600};
  }
  private checkPendingBinding(s:any,pending:any) {
    if(s?.binding?.projectId!==pending.projectId||s?.binding?.spreadsheetId!==pending.spreadsheetId||s?.binding?.googleSubject!==pending.subject||s?.binding?.revision!==pending.bindingRevision)return gwsFail('WORKSPACE_BINDING_CONFLICT');
    if((s.authorizationVersion||0)!==(pending.authorizationVersion||0)||(s.backgroundAuthorizationId||null)!==pending.previousAuthorizationId)return gwsFail('WORKSPACE_EXECUTION_FENCED');
  }
  /** This exact provider refresh/subject/scope proof is shared by callback acceptance and access(). */
  private async refreshProof(refreshToken:string,subject:string,c:OfflineConfig) {
    let refreshed:Awaited<ReturnType<GoogleOfflineProvider['refresh']>>;
    try {refreshed=await this.provider(c).refresh(refreshToken);}
    catch(error) {
      const code=(error as {code?:string}|null)?.code,failure=classifyGoogleProviderFailure(error);
      if(code==='AUTHORIZATION_REQUIRED'||code==='TOKEN_EXPIRED'||code==='SCOPE_DENIED'||failure.code==='TOKEN_EXPIRED'||failure.code==='SCOPE_DENIED')return this.failure(code==='SCOPE_DENIED'||failure.code==='SCOPE_DENIED'?'AUTH_BINDING_SCOPE_MISSING':'AUTH_REFRESH_REJECTED');
      return gwsFail(code&&isGoogleProviderCode(code)?code:failure.code,error instanceof GoogleWorkspaceCommandError?error.status:failure.status);
    }
    if(typeof refreshed?.accessToken!=='string'||!refreshed.accessToken.trim())return this.failure('AUTH_REFRESH_REJECTED');
    if(refreshed.subject!==subject)return this.failure('AUTH_REFRESH_SUBJECT_MISMATCH');
    if(missingWorkspaceBindingScopes(refreshed.scopes).length)return this.failure('AUTH_BINDING_SCOPE_MISSING');
    return {...refreshed,automation:missingWorkspaceScopes(refreshed.scopes).length===0};
  }
  async callback(state:string,code:string,browser:string) {
    if(!/^[\w-]{43}$/.test(state)||!code||code.length>4096||!browser)return gwsFail('GOOGLE_OAUTH_TRANSACTION_INVALID',400);
    const c=this.configuration(),id=hash(state),ref=this.database.collection(TRANSACTIONS).doc(id);
    const pending=await this.database.runTransaction(async(tx:any)=>{
      const snap=await tx.get(ref),s=snap.data();
      if(!s||s.usedAt||s.expiresAt<=Date.now()||s.browserHash!==hash(browser))return gwsFail('GOOGLE_OAUTH_TRANSACTION_INVALID',400);
      await this.workspace.authorized(tx,s.projectId,{userId:s.actorId} as AuthUserContext);
      this.checkPendingBinding((await tx.get(continuityRef(this.database,s.projectId))).data(),s);
      tx.set(ref,{...s,usedAt:Date.now(),verifier:null});return s;
    });
    const verifier=openWorkspaceSecret(pending.verifier,`oauth:${id}:${pending.projectId}`,c);
    let grant:Awaited<ReturnType<GoogleOfflineProvider['exchange']>>;
    try{grant=await this.provider(c).exchange(code,verifier,pending.nonceHash);}catch(error){
      const failure=classifyGoogleProviderFailure(error);
      if(error instanceof GoogleWorkspaceCommandError&&['AUTHORIZATION_REQUIRED','TOKEN_EXPIRED'].includes(error.code)||failure.code==='TOKEN_EXPIRED')return this.failure('AUTH_REFRESH_REJECTED');
      if(error instanceof GoogleWorkspaceCommandError)throw error;
      return gwsFail(failure.recognized?failure.code:'GOOGLE_OFFLINE_AUTHORIZATION_FAILED',failure.recognized?failure.status:403);
    }
    if(!grant?.refreshToken)return this.failure('AUTH_REFRESH_REJECTED');
    if(grant.subject!==pending.subject)return this.failure('AUTH_SUBJECT_MISMATCH');
    if(await this.googleSubject(pending.actorId)!==pending.subject)return this.failure('AUTH_PROVIDER_SUBJECT_CHANGED');
    if(missingWorkspaceBindingScopes(grant.scopes).length)return gwsFail('SCOPE_DENIED',403);
    const authorizationId=randomUUID(),ar=this.credentialRef(authorizationId),who={userId:pending.actorId} as AuthUserContext;
    const secret=sealWorkspaceSecret(grant.refreshToken,this.aad(pending.projectId,grant.subject,authorizationId),c);
    await this.database.runTransaction(async(tx:any)=>{
      await this.workspace.authorized(tx,pending.projectId,who);
      this.checkPendingBinding((await tx.get(continuityRef(this.database,pending.projectId))).data(),pending);
      tx.set(ar,{authorizationId,projectId:pending.projectId,actorId:pending.actorId,subject:grant.subject,spreadsheetId:pending.spreadsheetId,bindingRevision:pending.bindingRevision,scopes:grant.scopes,status:'PENDING_VALIDATION',automationRequested:pending.automation,secret,updatedAt:Date.now(),expiresAt:Date.now()+600000});
    });
    try {
      const refreshed=await this.refreshProof(openWorkspaceSecret(secret,this.aad(pending.projectId,grant.subject,authorizationId),c),pending.subject,c);
      if(await this.googleSubject(pending.actorId)!==pending.subject)return this.failure('AUTH_PROVIDER_SUBJECT_CHANGED');
      await this.database.runTransaction(async(tx:any)=>{
        await this.workspace.authorized(tx,pending.projectId,who);
        const cr=continuityRef(this.database,pending.projectId),s=(await tx.get(cr)).data(),candidate=(await tx.get(ar)).data();
        this.checkPendingBinding(s,pending);
        if(candidate?.status!=='PENDING_VALIDATION'||candidate.expiresAt<=Date.now())return gwsFail('WORKSPACE_EXECUTION_FENCED');
        const old=pending.previousAuthorizationId?this.credentialRef(pending.previousAuthorizationId):null,oldSnap=old?await tx.get(old):null;
        if(old&&oldSnap?.exists&&oldSnap.data()?.projectId===pending.projectId)tx.set(old,{...oldSnap.data(),secret:null,status:'SUPERSEDED',updatedAt:Date.now()});
        const diagnosis:WorkspaceAuthorizationDiagnosis={result:refreshed.automation?'CONNECTED_VALID':'AUTOMATION_SCOPE_REQUIRED',...(!refreshed.automation?{reason:'AUTH_AUTOMATION_SCOPE_MISSING' as const}:{}),metadataOnly:true};
        tx.set(ar,{...candidate,status:'ACTIVE',expiresAt:null,scopes:refreshed.scopes,automationAuthorized:refreshed.automation,refreshValidatedAt:Date.now(),updatedAt:Date.now(),lastFailureReason:null});
        tx.set(cr,{...s,authorizationVersion:(s.authorizationVersion||0)+1,backgroundAuthorizationId:authorizationId,backgroundAuthorization:'CONNECTED',authorizationDiagnostic:diagnosis,state:'READY',lastSyncError:null});
        this.audit(tx,pending.projectId,pending.actorId,'GOOGLE_REAUTHORIZED',{refreshProof:'PASSED',automationAuthorized:refreshed.automation});
      });
    } catch(error) {
      // Failed candidates cannot replace or diagnose/invalidate a previously working grant.
      const accepted=await this.database.runTransaction(async(tx:any)=>{
        const candidate=await tx.get(ar),current=(await tx.get(continuityRef(this.database,pending.projectId))).data();
        // A lost transaction acknowledgment is recovered from the committed proof, not another consent.
        if(current?.backgroundAuthorizationId===authorizationId&&candidate.data()?.refreshValidatedAt&&!workspaceGrantFailure(candidate.data(),current.binding,pending.projectId,pending.actorId)){await this.workspace.authorized(tx,pending.projectId,who);return true;}
        if(candidate.data()?.status==='PENDING_VALIDATION')tx.delete(ar);
        const reason=this.reason(error),providerCode=this.transientCode(error);
        this.audit(tx,pending.projectId,pending.actorId,'GOOGLE_AUTH_VALIDATION_FAILED',{...(reason?{reason}:{}),...(providerCode?{providerCode}:{}),result:'CANDIDATE_DISCARDED'});return false;
      });
      if(accepted)return {projectId:pending.projectId,result:'CONNECTED' as const};
      throw error;
    }
    return {projectId:pending.projectId,result:'CONNECTED' as const};
  }
  private reason(error:unknown):WorkspaceAuthReason|undefined {
    const reason=(error as {authorizationReason?:unknown})?.authorizationReason;return isWorkspaceAuthReason(reason)?reason:undefined;
  }
  private transientCode(error:unknown):string|undefined {
    const code=(error as {code?:string})?.code;return (AUTH_TRANSIENT_CODES as readonly unknown[]).includes(code)?code:undefined;
  }
  private async recordFailure(projectId:string,who:AuthUserContext,id:string|undefined,reason:WorkspaceAuthReason|undefined,providerCode?:string) {
    await this.database.runTransaction(async(tx:any)=>{
      await this.workspace.authorized(tx,projectId,who);
      const cr=continuityRef(this.database,projectId),s=(await tx.get(cr)).data()||{},ar=id?this.credentialRef(id):null,grant=ar?(await tx.get(ar)).data():null;
      if(s.backgroundAuthorizationId!==id)return; // Never let an old refresh clobber a replacement.
      const diagnosis:WorkspaceAuthorizationDiagnosis={result:providerCode?'PROVIDER_TEMPORARILY_UNAVAILABLE':workspaceAuthResult(reason!),...(reason?{reason}:{}),...(providerCode?{providerCode}:{}),metadataOnly:true};
      // A different administrator's denied attempt must not disable the grant's owner.
      const invalidate=Boolean(reason&&reason!=='AUTH_ACTOR_MISMATCH');
      if(invalidate&&ar&&grant?.status==='ACTIVE'&&grant.projectId===projectId&&grant.actorId===who.userId)tx.set(ar,{...grant,status:'AUTHORIZATION_REQUIRED',lastFailureReason:reason,updatedAt:Date.now()});
      if(reason!=='AUTH_ACTOR_MISMATCH')tx.set(cr,{...s,authorizationDiagnostic:diagnosis,...(invalidate?{backgroundAuthorization:'AUTHORIZATION_REQUIRED',state:'AUTHORIZATION_REQUIRED',lastSyncError:'AUTHORIZATION_REQUIRED'}:{})});
      this.audit(tx,projectId,who.userId,'GOOGLE_AUTHORIZATION_DIAGNOSIS',diagnosis as unknown as Record<string,unknown>);
    });
  }
  /** Server-only: never route this return value to the browser. */
  async access(projectId:string,who:AuthUserContext) {
    const {s,id,grant}=await this.snapshot(projectId,who),reason=workspaceGrantFailure(grant,s.binding,projectId,who.userId);
    if(reason){await this.recordFailure(projectId,who,id,reason);return this.failure(reason);}
    if(await this.googleSubject(who.userId)!==grant.subject){await this.recordFailure(projectId,who,id,'AUTH_PROVIDER_SUBJECT_CHANGED');return this.failure('AUTH_PROVIDER_SUBJECT_CHANGED');}
    const c=this.configuration(),token=openWorkspaceSecret(grant.secret,this.aad(projectId,grant.subject,id),c);
    let refreshed:Awaited<ReturnType<WorkspaceGoogleOfflineAuthorization['refreshProof']>>;
    try {refreshed=await this.refreshProof(token,grant.subject,c);}
    catch(error) {
      const reason=this.reason(error),providerCode=this.transientCode(error);
      if(reason||providerCode)await this.recordFailure(projectId,who,id,reason,providerCode);
      throw error;
    }
    // Refresh is external I/O: re-read identity, revocation and current pointer before use.
    if(await this.googleSubject(who.userId)!==grant.subject){await this.recordFailure(projectId,who,id,'AUTH_PROVIDER_SUBJECT_CHANGED');return this.failure('AUTH_PROVIDER_SUBJECT_CHANGED');}
    try {await this.database.runTransaction(async(tx:any)=>{
      await this.workspace.authorized(tx,projectId,who);const cr=continuityRef(this.database,projectId),current=(await tx.get(cr)).data(),fresh=(await tx.get(this.credentialRef(id))).data();
      if(current?.backgroundAuthorizationId!==id)return gwsFail('WORKSPACE_EXECUTION_FENCED');
      const changed=workspaceGrantFailure(fresh,current.binding,projectId,who.userId);if(changed)return this.failure(changed);
      const diagnosis:WorkspaceAuthorizationDiagnosis={result:refreshed.automation?'CONNECTED_VALID':'AUTOMATION_SCOPE_REQUIRED',...(!refreshed.automation?{reason:'AUTH_AUTOMATION_SCOPE_MISSING' as const}:{}),metadataOnly:true};
      tx.set(this.credentialRef(id),{...fresh,scopes:refreshed.scopes,automationAuthorized:refreshed.automation,refreshValidatedAt:Date.now(),lastFailureReason:null,updatedAt:Date.now()});
      tx.set(cr,{...current,backgroundAuthorization:'CONNECTED',authorizationDiagnostic:diagnosis});
    });}catch(error){const reason=this.reason(error);if(reason)await this.recordFailure(projectId,who,id,reason);throw error;}
    return {accessToken:refreshed.accessToken,automation:refreshed.automation,authorizationId:id};
  }
  /** Metadata/Firebase principal inspection only: no refresh, decryption or provider API call. */
  async diagnoseWorkspaceAuthorization(projectId:string,who:AuthUserContext):Promise<WorkspaceAuthorizationDiagnosis> {
    const {s,id,grant}=await this.snapshot(projectId,who);
    let reason=workspaceGrantFailure(grant,s.binding,projectId,who.userId);
    if((!reason||reason==='AUTH_GRANT_MISSING')&&s.binding?.googleSubject&&await this.googleSubject(who.userId)!==s.binding.googleSubject)reason='AUTH_PROVIDER_SUBJECT_CHANGED';
    if(reason){
      const persisted=grant?.lastFailureReason||s.authorizationDiagnostic?.reason;
      if(reason==='AUTH_GRANT_NOT_ACTIVE'&&grant?.status==='AUTHORIZATION_REQUIRED'&&isWorkspaceAuthReason(persisted)&&persisted!=='AUTH_AUTOMATION_SCOPE_MISSING')reason=persisted;
      return {result:workspaceAuthResult(reason!),reason:reason!,metadataOnly:true};
    }
    const providerCode=this.transientCode({code:s.authorizationDiagnostic?.providerCode});
    if(providerCode)return {result:'PROVIDER_TEMPORARILY_UNAVAILABLE',providerCode,metadataOnly:true};
    if(missingWorkspaceBindingScopes(grant.scopes).length)return {result:'REAUTHORIZATION_REQUIRED',reason:'AUTH_BINDING_SCOPE_MISSING',metadataOnly:true};
    return missingWorkspaceScopes(grant.scopes).length?{result:'AUTOMATION_SCOPE_REQUIRED',reason:'AUTH_AUTOMATION_SCOPE_MISSING',metadataOnly:true}:{result:'CONNECTED_VALID',metadataOnly:true};
  }
  async revoke(projectId:string,who:AuthUserContext) {
    const {s,id,grant}=await this.snapshot(projectId,who);
    await this.database.runTransaction(async(tx:any)=>{
      await this.workspace.authorized(tx,projectId,who);const cr=continuityRef(this.database,projectId),current=(await tx.get(cr)).data()||{},ar=id?this.credentialRef(id):null,fresh=ar?(await tx.get(ar)).data():null;
      if(current.backgroundAuthorizationId!==id)return gwsFail('WORKSPACE_EXECUTION_FENCED');
      if(ar&&fresh?.projectId===projectId)tx.set(ar,{...fresh,status:'REVOKED',secret:null,lastFailureReason:'AUTH_GRANT_NOT_ACTIVE',updatedAt:Date.now()});
      tx.set(cr,{...current,authorizationVersion:(current.authorizationVersion||0)+1,backgroundAuthorization:'AUTHORIZATION_REQUIRED',state:'AUTHORIZATION_REQUIRED',lastSyncError:'AUTHORIZATION_REQUIRED',authorizationDiagnostic:{result:'REAUTHORIZATION_REQUIRED',reason:'AUTH_GRANT_NOT_ACTIVE',metadataOnly:true}});
    });
    try{if(grant?.secret&&grant.projectId===projectId){const c=this.configuration();await this.provider(c).revoke(openWorkspaceSecret(grant.secret,this.aad(projectId,grant.subject,id),c));}}catch{/* Local credential removal remains authoritative. */}
    return {revoked:true};
  }
}
