import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {requestWorkspaceGoogleToken} from '../services/googleWorkspaceAuthorization';
import {beginWorkspaceIntent,workspaceIntentCurrent} from '../utils/workspaceAuthorizationIntent';
let options:any;
const granted='openid email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/script.projects';
beforeEach(()=>{
 vi.stubEnv('VITE_FIREBASE_OAUTH_CLIENT_ID','fixture.apps.googleusercontent.com');
 vi.stubGlobal('window',{google:{accounts:{oauth2:{initTokenClient:vi.fn((value:any)=>{options=value;return {requestAccessToken:()=>{}}})}}}});
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({sub:'google-subject'})})));
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();vi.restoreAllMocks()});
async function begin(stillCurrent=()=>true){const promise=requestWorkspaceGoogleToken('google-subject',stillCurrent);await Promise.resolve();await Promise.resolve();return {promise,finish:(patch:any={})=>options.callback({access_token:'fixture',scope:granted,...patch})}}
describe('GWS-LIVE-01A isolated authorization and bounded intent',()=>{
 it('acquires a Google-only grant and verifies the original provider subject',async()=>{const f=await begin();f.finish();expect(await f.promise).toBe('fixture');expect(options.client_id).toBe('fixture.apps.googleusercontent.com');expect(fetch).toHaveBeenCalledWith('https://www.googleapis.com/oauth2/v3/userinfo',expect.any(Object));});
 it('rejects a different provider account without changing app identity',async()=>{vi.mocked(fetch).mockResolvedValueOnce({ok:true,json:async()=>({sub:'different-account'})} as any);const f=await begin();f.finish();await expect(f.promise).rejects.toThrow('WORKSPACE_GOOGLE_ACCOUNT_MISMATCH');});
 it('rejects logout/account switch while authorization is open',async()=>{let current=true;const f=await begin(()=>current);current=false;f.finish();await expect(f.promise).rejects.toThrow('WORKSPACE_IDENTITY_CHANGED');expect(fetch).not.toHaveBeenCalled();});
 it('rejects scope denial rather than continuing to Picker',async()=>{const f=await begin();f.finish({scope:'openid email'});await expect(f.promise).rejects.toThrow('SCOPE_DENIED');});
 it('exposes missing client configuration before opening a popup',async()=>{vi.stubEnv('VITE_FIREBASE_OAUTH_CLIENT_ID','');await expect(requestWorkspaceGoogleToken('google-subject',()=>true)).rejects.toThrow('GOOGLE_OAUTH_CONFIGURATION_REQUIRED');});
 it('preserves access_denied evidence returned by Google',async()=>{const f=await begin();f.finish({error:'access_denied',error_description:'not permitted'});await expect(f.promise).rejects.toMatchObject({code:'access_denied'});});
 it('retains no token or file reference in the bounded intent',()=>{const intent=beginWorkspaceIntent('u','P1','scope',100);expect(Object.keys(intent).sort()).toEqual(['action','projectId','scope','setupLayer','startedAt','userId']);const context={userId:'u',projectId:'P1',scope:'scope',layer:'WORKSPACE'};expect(workspaceIntentCurrent(intent,context,101)).toBe(true);expect(workspaceIntentCurrent(intent,{...context,projectId:'P2'},101)).toBe(false);expect(workspaceIntentCurrent(intent,{...context,userId:'v'},101)).toBe(false);expect(workspaceIntentCurrent(intent,{...context,scope:'revoked'},101)).toBe(false);expect(workspaceIntentCurrent(intent,context,600100)).toBe(false);});
});
