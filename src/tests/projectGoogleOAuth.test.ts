import { beforeEach, describe, expect, it, vi } from 'vitest';
const f=vi.hoisted(()=>({auth:{currentUser:{uid:'app-user',providerData:[{providerId:'google.com',uid:'google-subject'}],getIdToken:async()=> 'firebase-id'} as any},grant:vi.fn()}));
vi.mock('../firebase/config',()=>({auth:f.auth}));
vi.mock('../services/googleWorkspaceAuthorization',()=>({requestWorkspaceGoogleToken:f.grant}));
vi.mock('../services/googleTemplatePicker',()=>({authorizeTemplateSelection:vi.fn()}));
import { ClientWorkspaceService } from '../services/workspace.service';
beforeEach(()=>{vi.clearAllMocks();f.auth.currentUser={uid:'app-user',providerData:[{providerId:'google.com',uid:'google-subject'}],getIdToken:async()=> 'firebase-id'};});
describe('PFAG-GWS1 isolated Google permission boundary',()=>{
 it('grants Workspace scopes for the existing provider identity without Firebase reauthentication',async()=>{const client=new ClientWorkspaceService();f.grant.mockResolvedValueOnce('fixture-google-token');expect(await client.requestGoogleScopes()).toBe('fixture-google-token');expect(f.grant.mock.calls[0][0]).toBe('google-subject');expect(f.auth.currentUser.uid).toBe('app-user');expect(f.grant.mock.calls[0][1]()).toBe(true);});
 it.each([['access_denied','AUTHORIZATION_DENIED'],['auth/popup-closed-by-user','POPUP_CLOSED'],['scope_denied','SCOPE_DENIED'],['token_expired','TOKEN_EXPIRED'],['network-request-failed','NETWORK_ERROR']])('fails closed without mock tokens or credential logs: %s',async(code,expected)=>{const client=new ClientWorkspaceService();client.setAccessToken('expired');f.grant.mockRejectedValueOnce({code,accessToken:'DO_NOT_LOG'});const log=vi.spyOn(console,'error'),warn=vi.spyOn(console,'warn');await expect(client.requestGoogleScopes()).rejects.toThrow(expected);expect(client.getAccessToken()).toBeNull();expect(log).not.toHaveBeenCalled();expect(warn).not.toHaveBeenCalled();log.mockRestore();warn.mockRestore();});
});
