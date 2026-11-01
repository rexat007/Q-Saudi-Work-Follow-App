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
  async begin(projectId:string,who:AuthUserContext,automation:boolean) {
    const c=this.configuration(),status=await this.workspace.status(projectId,who),b=status.binding;
    if(!b)return gwsFail('WORKSPACE_NOT_PROVISIONED');
    const subject=await this.googleSubject(who.userId);if(subject!==b.googleSubject)return gwsFail('WORKSPACE_GOOGLE_ACCOUNT_MISMATCH',403);
    const state=randomBytes(32).toString('base64url'),browser=randomBytes(32).toString('base64url'),verifier=randomBytes(48).toString('base64url'),nonce=randomBytes(32).toString('base64url'),id=hash(state),scopes=automation?REQUIRED_WORKSPACE_SCOPES:BINDING_WORKSPACE_SCOPES;
    await this.database.runTransaction(async(tx:any)=>{
      await this.workspace.authorized(tx,projectId,who);const ref=continuityRef(this.database,projectId),snap=await tx.get(ref);
      if(snap.data()?.binding?.spreadsheetId!==b.spreadsheetId)return gwsFail('WORKSPACE_BINDING_CONFLICT');
      tx.set(this.database.collection(TRANSACTIONS).doc(id),{projectId,actorId:who.userId,subject,spreadsheetId:b.spreadsheetId,bindingRevision:b.revision,automation,browserHash:hash(browser),nonceHash:hash(nonce),verifier:sealWorkspaceSecret(verifier,`oauth:${id}:${projectId}`,c),expiresAt:Date.now()+600000,usedAt:null});
    });
    return {url:this.provider(c).authorizationUrl({state,challenge:hash(verifier),nonce,scopes:['openid','email',...scopes]}),browser,expiresIn:600};
  }
  async callback(state:string,code:string,browser:string) {
    if(!/^[\w-]{43}$/.test(state)||!code||code.length>4096||!browser)return gwsFail('GOOGLE_OAUTH_TRANSACTION_INVALID',400);
    const c=this.configuration(),id=hash(state),ref=this.database.collection(TRANSACTIONS).doc(id);
    const pending=await this.database.runTransaction(async(tx:any)=>{
      const snap=await tx.get(ref),s=snap.data();
      if(!s||s.usedAt||s.expiresAt<=Date.now()||s.browserHash!==hash(browser))return gwsFail('GOOGLE_OAUTH_TRANSACTION_INVALID',400);
      const who={userId:s.actorId} as AuthUserContext;await this.workspace.authorized(tx,s.projectId,who);
      const continuity=await tx.get(continuityRef(this.database,s.projectId));
      if(continuity.data()?.binding?.spreadsheetId!==s.spreadsheetId||continuity.data()?.binding?.revision!==s.bindingRevision||continuity.data()?.binding?.googleSubject!==s.subject)return gwsFail('WORKSPACE_BINDING_CONFLICT');
      tx.set(ref,{...s,usedAt:Date.now(),verifier:null});return s;
    });
    const verifier=openWorkspaceSecret(pending.verifier,`oauth:${id}:${pending.projectId}`,c);
    let grant:Awaited<ReturnType<GoogleOfflineProvider['exchange']>>;
    try{grant=await this.provider(c).exchange(code,verifier,pending.nonceHash);}catch{return gwsFail('GOOGLE_OFFLINE_AUTHORIZATION_FAILED',403);}
    if(!grant.refreshToken||grant.subject!==pending.subject||await this.googleSubject(pending.actorId)!==pending.subject)return gwsFail('WORKSPACE_GOOGLE_ACCOUNT_MISMATCH',403);
    // Declining optional Script permission must not discard a usable Sheets grant.
    // The separate automation authority still requires all three before installing.
    if(missingWorkspaceBindingScopes(grant.scopes).length)return gwsFail('SCOPE_DENIED',403);
    const authorizationId=randomUUID(),secret=sealWorkspaceSecret(grant.refreshToken,this.aad(pending.projectId,grant.subject,authorizationId),c);
    await this.database.runTransaction(async(tx:any)=>{
      await this.workspace.authorized(tx,pending.projectId,{userId:pending.actorId} as AuthUserContext);
      const cr=continuityRef(this.database,pending.projectId),snap=await tx.get(cr),s=snap.data();
      if(s?.binding?.spreadsheetId!==pending.spreadsheetId||s?.binding?.revision!==pending.bindingRevision||s?.binding?.googleSubject!==grant.subject)return gwsFail('WORKSPACE_BINDING_CONFLICT');
      const old=s.backgroundAuthorizationId?this.credentialRef(s.backgroundAuthorizationId):null,oldSnap=old?await tx.get(old):null;
      if(old&&oldSnap?.exists)tx.set(old,{...oldSnap.data(),secret:null,status:'SUPERSEDED',updatedAt:Date.now()});
      tx.set(this.credentialRef(authorizationId),{authorizationId,projectId:pending.projectId,actorId:pending.actorId,subject:grant.subject,spreadsheetId:pending.spreadsheetId,bindingRevision:pending.bindingRevision,scopes:grant.scopes,status:'ACTIVE',secret,updatedAt:Date.now()});
      tx.set(cr,{...s,backgroundAuthorizationId:authorizationId,backgroundAuthorization:'CONNECTED',state:'READY',lastSyncError:null});
      const audit=this.database.collection('projects').doc(pending.projectId).collection('audit_logs').doc(randomUUID());tx.set(audit,{auditLogId:audit.id,projectId:pending.projectId,action:'GOOGLE_REAUTHORIZED',createdBy:pending.actorId,createdAt:new Date().toISOString(),details:{}});
    });
    return {projectId:pending.projectId,result:'CONNECTED' as const};
  }
  /** Server-only: never route this return value to the browser. */
  async access(projectId:string,who:AuthUserContext) {
    const c=this.configuration();await this.workspace.status(projectId,who);
    const s=(await continuityRef(this.database,projectId).get()).data(),id=s?.backgroundAuthorizationId;
    if(!id)return gwsFail('AUTHORIZATION_REQUIRED',401);
    const grant=(await this.credentialRef(id).get()).data();
    if(!grant||grant.status!=='ACTIVE'||grant.actorId!==who.userId||grant.projectId!==projectId||grant.subject!==s.binding?.googleSubject||grant.spreadsheetId!==s.binding?.spreadsheetId||grant.bindingRevision!==s.binding?.revision)return gwsFail('AUTHORIZATION_REQUIRED',401);
    if(await this.googleSubject(who.userId)!==grant.subject)return this.requireAuthorization(projectId,id);
    const token=openWorkspaceSecret(grant.secret,this.aad(projectId,grant.subject,id),c);
    let refreshed:Awaited<ReturnType<GoogleOfflineProvider['refresh']>>;
    try{refreshed=await this.provider(c).refresh(token);}catch(error){const code=(error as {code?:string}).code;if(code==='AUTHORIZATION_REQUIRED'||code==='TOKEN_EXPIRED')return this.requireAuthorization(projectId,id);const failure=classifyGoogleProviderFailure(error);return gwsFail(code&&isGoogleProviderCode(code)?code:failure.code,error instanceof GoogleWorkspaceCommandError?error.status:failure.status);}
    if(refreshed.subject!==grant.subject||missingWorkspaceBindingScopes(refreshed.scopes).length)return this.requireAuthorization(projectId,id);
    return {accessToken:refreshed.accessToken,automation:missingWorkspaceScopes(refreshed.scopes).length===0,authorizationId:id};
  }
  private async requireAuthorization(projectId:string,id:string):Promise<never> {
    await this.database.runTransaction(async(tx:any)=>{
      const cr=continuityRef(this.database,projectId),snap=await tx.get(cr),ar=this.credentialRef(id),grant=await tx.get(ar);
      if(grant.exists)tx.set(ar,{...grant.data(),status:'AUTHORIZATION_REQUIRED',updatedAt:Date.now()});
      if(snap.data()?.backgroundAuthorizationId===id)tx.set(cr,{...snap.data(),backgroundAuthorization:'AUTHORIZATION_REQUIRED',state:'AUTHORIZATION_REQUIRED',lastSyncError:'AUTHORIZATION_REQUIRED'});
    });return gwsFail('AUTHORIZATION_REQUIRED',401);
  }
  async revoke(projectId:string,who:AuthUserContext) {
    await this.workspace.status(projectId,who);
    const state=(await continuityRef(this.database,projectId).get()).data(),id=state?.backgroundAuthorizationId;
    if(!id)return {revoked:true};const grant=(await this.credentialRef(id).get()).data();
    await this.database.runTransaction(async(tx:any)=>{
      await this.workspace.authorized(tx,projectId,who);const cr=continuityRef(this.database,projectId),snap=await tx.get(cr);
      if(snap.data()?.backgroundAuthorizationId!==id)return gwsFail('WORKSPACE_EXECUTION_FENCED');
      tx.set(this.credentialRef(id),{...grant,status:'REVOKED',secret:null,updatedAt:Date.now()});
      tx.set(cr,{...snap.data(),backgroundAuthorization:'AUTHORIZATION_REQUIRED',state:'AUTHORIZATION_REQUIRED',lastSyncError:'AUTHORIZATION_REQUIRED'});
    });
    try{const c=this.configuration();await this.provider(c).revoke(openWorkspaceSecret(grant.secret,this.aad(projectId,grant.subject,id),c));}catch{/* Local credential removal is authoritative even if provider revocation is unavailable. */}
    return {revoked:true};
  }
}
