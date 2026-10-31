import {beforeEach,describe,it,expect,vi} from 'vitest';
const f=vi.hoisted(()=>({check:vi.fn(),assert:vi.fn(),grant:vi.fn(),picker:vi.fn(),fetch:vi.fn()}));
vi.mock('../runtime/runtimeGeneration',()=>({CLIENT_BUILD_ID:'current',ensureRuntimeGeneration:f.check,assertRuntimeGeneration:f.assert}));
vi.mock('../firebase/config',()=>({auth:{currentUser:{uid:'u',providerData:[{providerId:'google.com',uid:'g'}],getIdToken:async()=> 'firebase'}}}));
vi.mock('../services/googleWorkspaceAuthorization',()=>({requestWorkspaceGoogleToken:f.grant,prepareWorkspaceGoogleAuthorization:vi.fn(async()=>{})}));
vi.mock('../services/googleTemplatePicker',()=>({selectWorkspaceDestinationFolder:f.picker}));
import {ClientWorkspaceService} from '../services/workspace.service';
beforeEach(()=>{vi.clearAllMocks();f.check.mockResolvedValue(undefined);f.assert.mockImplementation(()=>{});f.grant.mockResolvedValue('token');f.picker.mockResolvedValue('root');vi.stubGlobal('fetch',f.fetch);f.fetch.mockResolvedValue({ok:true,json:async()=>({data:{destinationRootFolderId:'root',spreadsheetId:'file',projectFolderId:'folder'}})});});
describe('actual Workspace client critical generation fences',()=>{
 it('known mismatch rejects before any Google grant',async()=>{f.assert.mockImplementation(()=>{throw Error('APP_UPDATE_REQUIRED')});await expect(new ClientWorkspaceService().requestGoogleScopes()).rejects.toThrow('APP_UPDATE_REQUIRED');expect(f.grant).not.toHaveBeenCalled();});
 it('destination mismatch opens no picker and approves no destination',async()=>{f.check.mockRejectedValue(Error('APP_UPDATE_REQUIRED'));const c=new ClientWorkspaceService();c.setAccessToken('token');await expect(c.selectProjectWorkspaceDestination('P1')).rejects.toThrow('APP_UPDATE_REQUIRED');expect(f.picker).not.toHaveBeenCalled();expect(f.fetch).not.toHaveBeenCalled();});
 it('provision mismatch sends no command',async()=>{f.check.mockRejectedValue(Error('APP_UPDATE_REQUIRED'));await expect(new ClientWorkspaceService().provisionProjectDrive({projectId:'P1'} as any,'root')).rejects.toThrow('APP_UPDATE_REQUIRED');expect(f.fetch).not.toHaveBeenCalled();});
 it('matched builds follow grant then folder approval then provision with generation header',async()=>{const c=new ClientWorkspaceService();await c.prepareGoogleAuthorization();await c.requestGoogleScopes();await c.selectProjectWorkspaceDestination('P1');await c.provisionProjectDrive({projectId:'P1'} as any,'root');expect(f.grant).toHaveBeenCalledTimes(1);expect(f.picker).toHaveBeenCalledTimes(1);expect(f.fetch.mock.calls.map(c=>c[0])).toEqual(['/api/projects/P1/workspace/destination','/api/workspace/provision']);expect(f.fetch.mock.calls[1][1].headers).toMatchObject({'X-App-Build':'current'});});
 it('retired response maps to APP_UPDATE_REQUIRED without new template guidance',async()=>{f.fetch.mockResolvedValueOnce({ok:false,json:async()=>({code:'RUNTIME_TEMPLATE_SELECTION_RETIRED'})});const c=new ClientWorkspaceService();c.setAccessToken('token');await expect(c.selectProjectWorkspaceDestination('P1')).rejects.toThrow('APP_UPDATE_REQUIRED');});
 it('preserves frontend missing scopes through classification and clears the rejected token',async()=>{
  const c=new ClientWorkspaceService();c.setAccessToken('old-token');f.grant.mockRejectedValueOnce(Error('SCOPE_DENIED:script.projects'));
  await expect(c.requestGoogleScopes()).rejects.toThrow(/^SCOPE_DENIED:script.projects$/);expect(c.getAccessToken()).toBeNull();expect(f.picker).not.toHaveBeenCalled();expect(f.fetch).not.toHaveBeenCalled();
 });
 it('preserves the server missing-scope code through approval and provisioning HTTP responses',async()=>{
  f.fetch.mockResolvedValue({ok:false,json:async()=>({code:'SCOPE_DENIED:drive.file,script.projects'})});
  const c=new ClientWorkspaceService();c.setAccessToken('token');await expect(c.selectProjectWorkspaceDestination('P1')).rejects.toThrow(/^SCOPE_DENIED:drive.file,script.projects$/);
  await expect(c.provisionProjectDrive({projectId:'P1'} as any,'root')).rejects.toThrow(/^SCOPE_DENIED:drive.file,script.projects$/);
 });
});
