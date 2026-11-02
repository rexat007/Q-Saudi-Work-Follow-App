import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import http from 'node:http';
import type {AddressInfo} from 'node:net';
const f=vi.hoisted(()=>({status:vi.fn(),access:vi.fn(),provider:vi.fn(),execute:vi.fn()}));
vi.mock('../../server/security.middleware',()=>{
 const pass=(_req:any,_res:any,next:any)=>next();
 return {authenticateUser:(req:any,res:any,next:any)=>{if(req.headers.authorization!=='Bearer fixture-firebase')return res.status(401).end();req.user={userId:'actor',role:'SUPER_ADMIN',assignedProjectIds:['P1']};next();},enforceProjectIsolation:pass,enforceTripSupervisorRestrictions:pass,enforceTruckCarrierIntegrity:pass,enforceIdempotency:pass,enforceFileUploadSecurity:pass,enforceRole:()=>pass,enforceAdminOnly:pass,enforceAuditorOrAdmin:pass,enforceDispatcherOrAbove:pass,enforceWeighbridgeUnloadIntegrity:pass};
});
vi.mock('../../server/runtimeVersion',()=>({runtimeVersionHandler:(_q:any,r:any)=>r.json({}),workspaceGenerationFence:(_q:any,_r:any,next:any)=>next()}));
vi.mock('../../server/workspaceSyncWorker',()=>({workspaceOfflineAuthorization:{access:f.access},workspaceSyncCoordinator:{}}));
vi.mock('../../server/projectGoogleBlueprint.adapter',()=>({projectGoogleBlueprintPort:f.provider}));
vi.mock('../../server/projectGoogleTemplate.adapter',()=>({projectGoogleTemplatePort:f.provider}));
vi.mock('../services/projectGoogleWorkspace.server',async original=>({...await original<any>(),projectGoogleWorkspaceServer:{status:f.status,forExecutionAuthorization:f.execute}}));
vi.mock('../../server/workspace.isolation',async original=>({...await original<any>(),strictWorkspaceProject:(req:any,res:any,next:any)=>{res.locals.workspaceProjectId=req.body.projectId;next();},WorkspaceStorageBoundary:class{async project(){return {projectId:'P1',settings:{googleSpreadsheetId:'file',googleDriveFolderId:'folder'}};}async assertCanonicalStorage(){}}}));
import {app} from '../../server/app';
import {commandDatabase} from './helpers/commandDatabase';
import {setTestDbOverride} from '../firebase/admin';
let server:http.Server;
beforeEach(async()=>{vi.clearAllMocks();const x=commandDatabase({'projects/P1/workspace_continuity/current':{binding:{projectId:'P1',spreadsheetId:'file'}}});setTestDbOverride(x.db);f.status.mockResolvedValue({binding:{projectId:'P1',spreadsheetId:'file'},backgroundAuthorization:'NOT_CONNECTED'});await new Promise<void>((resolve,reject)=>{server=app.listen(0,'127.0.0.1',resolve);server.once('error',reject);});});
afterEach(async()=>{if(server?.listening)await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));});
it.each([
 ['/api/projects/P1/workspace/initialize',{}],
 ['/api/projects/P1/workspace/initialize',{scriptProjectId:'known-script'}],
 ['/api/projects/P1/workspace/retry-sync',{}],
 ['/api/projects/P1/workspace/automation/recover',{scriptProjectId:'script'}],
 ['/api/workspace/sync/initial',{projectId:'P1',spreadsheetId:'file'}],
] as const)('real HTTP %s rejects browser-token substitution before any provider or execution',async(path,body)=>{
 const result=await new Promise<{status:number;body:string}>((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port:(server.address() as AddressInfo).port,path,method:'POST',headers:{Authorization:'Bearer fixture-firebase','Content-Type':'application/json','X-Google-Access-Token':'fixture-rejected-browser'}},res=>{let text='';res.on('data',c=>text+=c);res.on('end',()=>resolve({status:res.statusCode!,body:text}));});req.on('error',reject);req.end(JSON.stringify(body));});
 expect(result.status).toBe(401);expect(JSON.parse(result.body)).toMatchObject({success:false,code:'AUTHORIZATION_REQUIRED'});expect(result.body).not.toContain('fixture-rejected-browser');expect(f.access).not.toHaveBeenCalled();expect(f.provider).not.toHaveBeenCalled();expect(f.execute).not.toHaveBeenCalled();
});

it('real initialize HTTP dispatches an explicit known-ID maintenance request through durable authorization',async()=>{
 f.status.mockResolvedValue({binding:{projectId:'P1',spreadsheetId:'file',scriptProjectId:'known-script'},backgroundAuthorization:'CONNECTED',automationMaintenanceRequired:false,automationState:'READY'});f.access.mockResolvedValue({accessToken:'server-only',authorizationId:'G'});const maintain=vi.fn(async()=>{}),initialize=vi.fn();f.execute.mockReturnValue({maintainAutomation:maintain,initializeBound:initialize});f.provider.mockReturnValue({marker:'port'});
 const response=await new Promise<{status:number;body:string}>((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port:(server.address() as AddressInfo).port,path:'/api/projects/P1/workspace/initialize',method:'POST',headers:{Authorization:'Bearer fixture-firebase','Content-Type':'application/json'}},res=>{let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode!,body}));});req.on('error',reject);req.end(JSON.stringify({scriptProjectId:'known-script'}));});expect(response.status).toBe(200);expect(maintain).toHaveBeenCalledWith('P1','known-script',expect.objectContaining({userId:'actor'}),{marker:'port'});expect(initialize).not.toHaveBeenCalled();expect(f.provider).toHaveBeenCalledWith('server-only','P1');expect(response.body).not.toContain('server-only');
});
