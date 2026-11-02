import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import express from 'express';
import http from 'node:http';
import type {AddressInfo} from 'node:net';
const f=vi.hoisted(()=>({begin:vi.fn(),callback:vi.fn(),callbackCompletion:vi.fn(),revoke:vi.fn(),diagnoseWorkspaceAuthorization:vi.fn()}));
vi.mock('../../server/workspaceSyncWorker',()=>({workspaceOfflineAuthorization:f}));
vi.mock('../services/workspaceGoogleOfflineAuthorization.server',()=>({workspaceOfflineConfig:()=>({redirectUri:'https://fixture.example/workspace/google/callback'})}));
import {registerWorkspaceOAuthCallback,registerWorkspaceOAuthCommands} from '../../server/workspaceGoogleOAuth.routes';
let server:http.Server;
const request=(method:string,path:string,body?:any,cookie?:string,authorized=true)=>new Promise<{status:number;headers:http.IncomingHttpHeaders;body:string}>((resolve,reject)=>{
 const req=http.request({host:'127.0.0.1',port:(server.address() as AddressInfo).port,path,method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(authorized?{Authorization:'Bearer fixture-firebase'}:{})}},res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode!,headers:res.headers,body}));});req.on('error',reject);req.end(body?JSON.stringify(body):undefined);
});
beforeEach(async()=>{
 vi.resetAllMocks();f.begin.mockResolvedValue({url:'https://accounts.google.com/o/oauth2/v2/auth?state=fixture-state',browser:'fixture-browser',correlationId:'A'.repeat(32),expiresIn:600});f.callback.mockResolvedValue({projectId:'P1',result:'CONNECTED'});f.callbackCompletion.mockResolvedValue({projectId:'P1',correlationId:'A'.repeat(32)});f.revoke.mockResolvedValue({revoked:true});f.diagnoseWorkspaceAuthorization.mockResolvedValue({result:'CONNECTED_VALID',metadataOnly:true});
 const app=express();app.use(express.json());registerWorkspaceOAuthCallback(app);
 const guard=(req:any,res:any,next:any)=>{if(!req.headers.authorization)return res.status(401).end();req.user={userId:'actor'};next();};registerWorkspaceOAuthCommands(app,[guard]);app.get('*',(_req,res)=>res.send('APPLICATION_SPA_MARKER'));
 await new Promise<void>((resolve,reject)=>{server=app.listen(0,'127.0.0.1',resolve);server.once('error',reject)});
});
afterEach(async()=>{if(server?.listening)await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));});
describe('offline authorization HTTP boundary',()=>{
 it('returns consent URL and public attempt correlation, keeps browser transaction in a secure HttpOnly cookie and disables caching',async()=>{
  const result=await request('POST','/api/projects/P1/workspace/authorization',{automation:true});
  expect(JSON.parse(result.body).correlationId).toBe('A'.repeat(32));expect(result.status).toBe(200);expect(result.body).not.toContain('fixture-browser');expect(result.body).not.toMatch(/refresh|access_token|client_secret/);
  expect(result.headers['set-cookie']?.[0]).toMatch(/__Host-qws=fixture-browser/);expect(result.headers['set-cookie']?.[0]).toContain('HttpOnly');expect(result.headers['set-cookie']?.[0]).toContain('Secure');expect(result.headers['cache-control']).toBe('no-store');
 });
 it('rejects client resource identifiers and unauthenticated commands',async()=>{
  expect((await request('POST','/api/projects/P1/workspace/authorization',{automation:true,spreadsheetId:'foreign'})).status).toBe(400);
  expect((await request('POST','/api/projects/P1/workspace/authorization',{automation:true},undefined,false)).status).toBe(401);expect(f.begin).not.toHaveBeenCalled();
 });
 it('consumes code/cookie internally without reflecting code, state, subject or credential',async()=>{
  const r=await request('GET','/workspace/google/callback?state=fixture-private-state&code=fixture-private-code',undefined,'__Host-qws=fixture-browser',false);
  expect(f.callback).toHaveBeenCalledWith('fixture-private-state','fixture-private-code','fixture-browser');expect(r.body).not.toMatch(/fixture-private|fixture-browser|access_token|refresh_token/);
  expect(r.body).toContain('QSAUDI_WORKSPACE_OAUTH');expect(r.body).toContain('"projectId":"P1"');expect(r.body).toContain('"https://fixture.example"');expect(r.headers['content-security-policy']).toContain("frame-ancestors 'none'");expect(r.headers['referrer-policy']).toBe('no-referrer');
 });
 it('sanitizes callback/provider failures and supports cancel without credential exchange',async()=>{
  f.callback.mockRejectedValueOnce(Error('fixture-private-provider-token'));
  const failed=await request('GET','/workspace/google/callback?state=fixture-state&code=fixture-code',undefined,'__Host-qws=fixture-browser',false);
  expect(failed.body).toContain('AUTHORIZATION_FAILED');expect(failed.body).not.toContain('fixture-private');
  const before=f.callback.mock.calls.length;await request('GET','/workspace/google/callback?error=access_denied&error_description=fixture-private');expect(f.callback).toHaveBeenCalledTimes(before);
 });
 it('revocation returns only a bounded result',async()=>{
  const r=await request('DELETE','/api/projects/P1/workspace/authorization');expect(JSON.parse(r.body)).toEqual({success:true,revoked:true});expect(f.revoke).toHaveBeenCalledWith('P1',{userId:'actor'});
 });
});

 it('offers protected no-store server metadata diagnosis without returning grant or credential fields',async()=>{
  const r=await request('GET','/api/projects/P1/workspace/authorization/diagnosis');expect(r.status).toBe(200);expect(JSON.parse(r.body)).toEqual({success:true,data:{result:'CONNECTED_VALID',metadataOnly:true}});expect(f.diagnoseWorkspaceAuthorization).toHaveBeenCalledWith('P1',{userId:'actor'});expect(r.headers['cache-control']).toBe('no-store');
  expect((await request('GET','/api/projects/P1/workspace/authorization/diagnosis',undefined,undefined,false)).status).toBe(401);
 });
 it('callback failure carries only canonical transient codes or bounded authorization reasons',async()=>{
  const {GoogleWorkspaceCommandError}=await import('../services/projectGoogleWorkspace.server');
  f.callback.mockRejectedValueOnce(Object.assign(new GoogleWorkspaceCommandError('AUTHORIZATION_REQUIRED',401),{authorizationReason:'AUTH_REFRESH_REJECTED',refresh_token:'private-refresh',email:'private-email'}));
  const r=await request('GET','/workspace/google/callback?state=fixture-state&code=private-code',undefined,'__Host-qws=fixture-browser',false);
  expect(r.body).toContain('AUTH_REFRESH_REJECTED');expect(r.body).toContain('AUTHORIZATION_REQUIRED');expect(r.body).not.toMatch(/private-|refresh_token|email/);
  f.callback.mockRejectedValueOnce(new GoogleWorkspaceCommandError('GOOGLE_SERVICE_UNAVAILABLE',503));
  expect((await request('GET','/workspace/google/callback?state=fixture-state&code=private-code',undefined,'__Host-qws=fixture-browser',false)).body).toContain('GOOGLE_SERVICE_UNAVAILABLE');
 });

function executeCallback(html:string,opener:unknown,throws=false){
 const post=vi.fn(),closed=vi.fn(),channelClosed=vi.fn(),replace=vi.fn(),fallback=vi.fn();
 const win:any={close:closed};Object.defineProperty(win,'opener',{get(){if(throws)throw Error('COOP');return opener?{postMessage:fallback}:null;}});
 const context=vm.createContext({window:win,history:{replaceState:replace},BroadcastChannel:class{constructor(name:string){expect(name).toBe('qsaudi-workspace-oauth');}postMessage=post;close=channelClosed;}});
 vm.runInContext(html.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)![1],context);
 return {post,closed,channelClosed,replace,fallback};
}
it.each(['missing','available','blocked'])('minimal callback publishes without depending on %s opener access',async mode=>{
 const result=await request('GET','/workspace/google/callback?state=fixture-state&code=private-code',undefined,'__Host-qws=fixture-browser',false),run=executeCallback(result.body,mode==='available',mode==='blocked');
 expect(run.post).toHaveBeenCalledWith({type:'QSAUDI_WORKSPACE_OAUTH',projectId:'P1',correlationId:'A'.repeat(32),result:'CONNECTED'});expect(run.closed).toHaveBeenCalledOnce();expect(run.channelClosed).toHaveBeenCalledOnce();expect(run.fallback).toHaveBeenCalledTimes(mode==='available'?1:0);expect(result.body).not.toMatch(/APPLICATION_SPA_MARKER|type="module"|assets\/|private-code/);expect(result.body).toContain('يمكنك إغلاق هذه النافذة');
});
it('dedicated callback precedes the SPA even on invalid/error callbacks and a provider denial is correlated',async()=>{
 for(const url of ['/workspace/google/callback','/workspace/google/callback?state=fixture-state&error=access_denied','/workspace/google/callback?error=private-error']){
  const r=await request('GET',url,undefined,'__Host-qws=fixture-browser',false);expect(r.headers['content-type']).toContain('text/html');expect(r.body).not.toMatch(/APPLICATION_SPA_MARKER|assets\/|private-error/);expect(executeCallback(r.body,null).post.mock.calls[0][0].result).toBe('AUTHORIZATION_FAILED');
 }
 expect(f.callback).not.toHaveBeenCalled();expect(f.callbackCompletion).toHaveBeenCalledWith('fixture-state','fixture-browser',true);
});
it('a refresh-validation failure stays correlated but can never publish CONNECTED or private provider fields',async()=>{
 const {GoogleWorkspaceCommandError}=await import('../services/projectGoogleWorkspace.server');f.callback.mockRejectedValueOnce(Object.assign(new GoogleWorkspaceCommandError('AUTHORIZATION_REQUIRED',401),{authorizationReason:'AUTH_REFRESH_REJECTED',refresh_token:'private-refresh'}));
 const r=await request('GET','/workspace/google/callback?state=fixture-state&code=private-code',undefined,'__Host-qws=fixture-browser',false),payload=executeCallback(r.body,null).post.mock.calls[0][0];expect(payload).toMatchObject({projectId:'P1',correlationId:'A'.repeat(32),result:'AUTHORIZATION_FAILED',code:'AUTHORIZATION_REQUIRED',authorizationReason:'AUTH_REFRESH_REJECTED'});expect(r.body).not.toMatch(/private-|refresh_token/);
});
it('callback server registration precedes API authentication and production/development SPA fallback',()=>{
 const app=readFileSync('server/app.ts','utf8'),entry=readFileSync('server.ts','utf8');expect(app.indexOf('registerWorkspaceOAuthCallback(app)')).toBeLessThan(app.indexOf("app.use('/api', authenticateUser)"));expect(entry.indexOf("import { app }")).toBeLessThan(entry.indexOf('app.use(vite.middlewares)'));expect(entry.indexOf("import { app }")).toBeLessThan(entry.indexOf("app.get('*'"));
});

it('a stale or unproven callback cannot clear the browser cookie for a newer authorization attempt',async()=>{
 const {GoogleWorkspaceCommandError}=await import('../services/projectGoogleWorkspace.server');f.callbackCompletion.mockRejectedValueOnce(new GoogleWorkspaceCommandError('GOOGLE_OAUTH_TRANSACTION_INVALID',400));const r=await request('GET','/workspace/google/callback?state=old-state&code=old-code',undefined,'__Host-qws=new-browser',false);expect(r.headers['set-cookie']).toBeUndefined();expect(f.callback).not.toHaveBeenCalled();expect(executeCallback(r.body,null).post.mock.calls[0][0]).toMatchObject({projectId:null,correlationId:null,result:'AUTHORIZATION_FAILED'});
});
