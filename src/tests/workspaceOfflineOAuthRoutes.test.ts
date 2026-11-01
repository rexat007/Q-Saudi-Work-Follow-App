import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import express from 'express';
import http from 'node:http';
import type {AddressInfo} from 'node:net';
const f=vi.hoisted(()=>({begin:vi.fn(),callback:vi.fn(),revoke:vi.fn()}));
vi.mock('../../server/workspaceSyncWorker',()=>({workspaceOfflineAuthorization:f}));
vi.mock('../services/workspaceGoogleOfflineAuthorization.server',()=>({workspaceOfflineConfig:()=>({redirectUri:'https://fixture.example/workspace/google/callback'})}));
import {registerWorkspaceOAuthCallback,registerWorkspaceOAuthCommands} from '../../server/workspaceGoogleOAuth.routes';
let server:http.Server;
const request=(method:string,path:string,body?:any,cookie?:string,authorized=true)=>new Promise<{status:number;headers:http.IncomingHttpHeaders;body:string}>((resolve,reject)=>{
 const req=http.request({host:'127.0.0.1',port:(server.address() as AddressInfo).port,path,method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(authorized?{Authorization:'Bearer fixture-firebase'}:{})}},res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode!,headers:res.headers,body}));});req.on('error',reject);req.end(body?JSON.stringify(body):undefined);
});
beforeEach(async()=>{
 vi.resetAllMocks();f.begin.mockResolvedValue({url:'https://accounts.google.com/o/oauth2/v2/auth?state=fixture-state',browser:'fixture-browser',expiresIn:600});f.callback.mockResolvedValue({projectId:'P1',result:'CONNECTED'});f.revoke.mockResolvedValue({revoked:true});
 const app=express();app.use(express.json());registerWorkspaceOAuthCallback(app);
 const guard=(req:any,res:any,next:any)=>{if(!req.headers.authorization)return res.status(401).end();req.user={userId:'actor'};next();};registerWorkspaceOAuthCommands(app,[guard]);
 await new Promise<void>((resolve,reject)=>{server=app.listen(0,'127.0.0.1',resolve);server.once('error',reject)});
});
afterEach(async()=>{if(server?.listening)await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));});
describe('offline authorization HTTP boundary',()=>{
 it('returns only consent URL, keeps browser transaction in a secure HttpOnly cookie and disables caching',async()=>{
  const result=await request('POST','/api/projects/P1/workspace/authorization',{automation:true});
  expect(result.status).toBe(200);expect(result.body).not.toContain('fixture-browser');expect(result.body).not.toMatch(/refresh|access_token|client_secret/);
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
