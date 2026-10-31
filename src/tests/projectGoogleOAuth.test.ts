import { beforeEach, describe, expect, it, vi } from 'vitest';
const f=vi.hoisted(()=>({auth:{currentUser:{uid:'app-user',getIdToken:async()=> 'firebase-id'} as any},popup:vi.fn(),credential:vi.fn(),scopes:[] as string[]}));
vi.mock('../firebase/config',()=>({auth:f.auth}));
vi.mock('firebase/auth',()=>({reauthenticateWithPopup:f.popup,GoogleAuthProvider:class {static credentialFromResult=f.credential;addScope(s:string){f.scopes.push(s)}setCustomParameters(){}}}));
vi.mock('../services/googleTemplatePicker',()=>({authorizeTemplateSelection:vi.fn()}));
import { ClientWorkspaceService } from '../services/workspace.service';
beforeEach(()=>{vi.clearAllMocks();f.scopes.length=0;f.auth.currentUser={uid:'app-user',getIdToken:async()=> 'firebase-id'};});
describe('PFAG-GWS1 real client OAuth boundary',()=>{
 it('reauthorizes current Firebase identity and requests only selected scopes',async()=>{const client=new ClientWorkspaceService();f.popup.mockResolvedValueOnce({user:f.auth.currentUser});f.credential.mockReturnValueOnce({accessToken:'fixture-google-token'});expect(await client.requestGoogleScopes()).toBe('fixture-google-token');expect(f.popup.mock.calls[0][0]).toBe(f.auth.currentUser);expect(f.scopes).toEqual(['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/drive.file']);});
 it.each([['access_denied','AUTHORIZATION_DENIED'],['auth/popup-closed-by-user','POPUP_CLOSED'],['scope_denied','SCOPE_DENIED'],['token_expired','TOKEN_EXPIRED'],['network-request-failed','NETWORK_ERROR']])('fails closed without mock tokens or credential logs: %s',async(code,expected)=>{const client=new ClientWorkspaceService();client.setAccessToken('expired');f.popup.mockRejectedValueOnce({code,accessToken:'DO_NOT_LOG'});const log=vi.spyOn(console,'error'),warn=vi.spyOn(console,'warn');await expect(client.requestGoogleScopes()).rejects.toThrow(expected);expect(client.getAccessToken()).toBeNull();expect(log).not.toHaveBeenCalled();expect(warn).not.toHaveBeenCalled();log.mockRestore();warn.mockRestore();});
});
