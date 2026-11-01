import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {createHash} from 'node:crypto';
const f=vi.hoisted(()=>({url:vi.fn(),getToken:vi.fn(),verify:vi.fn(),info:vi.fn(),access:vi.fn(),user:vi.fn(),revoke:vi.fn(),interceptors:[] as any[]}));
vi.mock('googleapis',()=>({google:{auth:{OAuth2:class {
 transporter={interceptors:{request:{add:(value:any)=>f.interceptors.push(value)}}};
 generateAuthUrl=f.url;getToken=f.getToken;verifyIdToken=f.verify;getTokenInfo=f.info;getAccessToken=f.access;revokeToken=f.revoke;setCredentials(){}
}},oauth2:()=>({userinfo:{get:f.user}})}}));
import {googleOfflineProvider} from '../../server/workspaceGoogleOffline.adapter';
import {configureWorkspaceGoogleTransport} from '../../server/workspaceGoogleTransport';
const c={clientId:'fixture-client',clientSecret:'fixture-secret',redirectUri:'https://fixture.example/workspace/google/callback',key:Buffer.alloc(32),keyVersion:'v1'};
const nonceHash=createHash('sha256').update('fixture-nonce').digest('base64url');
beforeEach(()=>{
 vi.resetAllMocks();f.interceptors=[];
 f.getToken.mockResolvedValue({tokens:{id_token:'fixture-id',access_token:'fixture-access',refresh_token:'fixture-refresh'}});
 f.verify.mockResolvedValue({getPayload:()=>({sub:'subject',iss:'https://accounts.google.com',nonce:'fixture-nonce'})});
 f.info.mockResolvedValue({aud:c.clientId,scopes:['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/spreadsheets']});
 f.access.mockResolvedValue({token:'fixture-access'});f.user.mockResolvedValue({data:{id:'subject'}});
});
afterEach(()=>vi.restoreAllMocks());
describe('actual Google offline provider protocol',()=>{
 it('requests offline consent and S256 PKCE without changing Firebase authentication',()=>{
  googleOfflineProvider(c).authorizationUrl({state:'fixture-state',challenge:'challenge',nonce:'fixture-nonce',scopes:['openid']});
  expect(f.url).toHaveBeenCalledWith(expect.objectContaining({access_type:'offline',code_challenge_method:'S256',code_challenge:'challenge',nonce:'fixture-nonce',state:'fixture-state',prompt:'consent'}));
 });
 it('exchanges with the exact redirect/verifier and verifies ID token audience and nonce',async()=>{
  expect(await googleOfflineProvider(c).exchange('fixture-code','fixture-verifier',nonceHash)).toMatchObject({subject:'subject',refreshToken:'fixture-refresh'});
  expect(f.getToken).toHaveBeenCalledWith({code:'fixture-code',codeVerifier:'fixture-verifier',redirect_uri:c.redirectUri});expect(f.verify).toHaveBeenCalledWith({idToken:'fixture-id',audience:c.clientId});
 });
 it.each(['nonce','issuer','audience','refresh token'] as const)('rejects invalid %s before granting background authority',async kind=>{
  if(kind==='nonce')f.verify.mockResolvedValueOnce({getPayload:()=>({sub:'subject',iss:'https://accounts.google.com',nonce:'foreign'})});
  if(kind==='issuer')f.verify.mockResolvedValueOnce({getPayload:()=>({sub:'subject',iss:'https://foreign.example',nonce:'fixture-nonce'})});
  if(kind==='audience')f.info.mockResolvedValueOnce({aud:'other',scopes:[]});
  if(kind==='refresh token')f.getToken.mockResolvedValueOnce({tokens:{id_token:'fixture-id',access_token:'fixture-access'}});
  await expect(googleOfflineProvider(c).exchange('fixture-code','fixture-verifier',nonceHash)).rejects.toThrow();
 });
 it('refreshes server-side and verifies current provider subject',async()=>{
  expect(await googleOfflineProvider(c).refresh('fixture-refresh')).toMatchObject({accessToken:'fixture-access',subject:'subject'});expect(f.user).toHaveBeenCalledOnce();
 });
 it.each(['invalid_grant','rate_limit'] as const)('distinguishes %s from revoked authorization without echoing payloads',async kind=>{
  f.access.mockRejectedValueOnce({response:{status:kind==='invalid_grant'?400:429,data:{error:kind,email:'private-email',access_token:'private-token'}}});
  const error=await googleOfflineProvider(c).refresh('fixture-refresh').catch(e=>e);expect(error.code).toBe(kind==='invalid_grant'?'AUTHORIZATION_REQUIRED':'GOOGLE_RATE_LIMITED');expect(JSON.stringify(error)).not.toContain('private-');
 });
 it('checks execution ownership at the HTTP boundary and bounds provider timeout/retries',async()=>{
  const check=vi.fn(async()=>{}),interceptors:any[]=[];configureWorkspaceGoogleTransport({transporter:{interceptors:{request:{add:(i:any)=>interceptors.push(i)}}}},check);
  const options=await interceptors[0].resolved({url:'https://sheets.googleapis.com'});expect(check).toHaveBeenCalledOnce();expect(options).toMatchObject({timeout:15000,retry:false});
  check.mockRejectedValueOnce(Error('WORKSPACE_EXECUTION_FENCED'));await expect(interceptors[0].resolved({})).rejects.toThrow('WORKSPACE_EXECUTION_FENCED');
 });
});
