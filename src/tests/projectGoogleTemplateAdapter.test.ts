import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REQUIRED_GOOGLE_TABS, LOADING_HEADERS, OFFLOAD_HEADERS } from '../services/projectGoogleSheetContract';
const mocks=vi.hoisted(()=>({get:vi.fn(),list:vi.fn(),create:vi.fn(),copy:vi.fn(),metadata:vi.fn(),headers:vi.fn(),values:vi.fn(),write:vi.fn(),clear:vi.fn(),identity:vi.fn(),token:vi.fn()}));
vi.mock('googleapis',()=>({google:{auth:{OAuth2:class {setCredentials(){}getTokenInfo(){return mocks.token()}}},oauth2:()=>({userinfo:{get:mocks.identity}}),drive:()=>({files:{get:mocks.get,list:mocks.list,create:mocks.create,copy:mocks.copy}}),sheets:()=>({spreadsheets:{get:mocks.metadata,values:{batchGet:mocks.headers,get:mocks.values,batchUpdate:mocks.write,batchClear:mocks.clear}}})}}));
import { projectGoogleTemplatePort } from '../../server/projectGoogleTemplate.adapter';
const sample={tripId:'canonical',projectId:'P1',ticketId:'001',ticketSeries:'series',weightUnit:'kg' as const,tare:16000,gross:42000,carrierLabel:'Carrier',materialLabel:'Wheat',truckPlate:'123'};
let loading:any[][],offload:any[][];
function col(s:string){return [...s].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1}
beforeEach(()=>{
 vi.clearAllMocks();
 loading=[LOADING_HEADERS,Array(29).fill(''),Array(29).fill('')];offload=[OFFLOAD_HEADERS,Array(17).fill(''),Array(17).fill('')];
 for(let r=1;r<3;r++){loading[r][3]='=C'+(r+1)+'-B'+(r+1);loading[r][19]='=S'+(r+1)+'-R'+(r+1);offload[r][0]='=LOOKUP(G'+(r+1)+')';offload[r][7]='=B'+(r+1)}
 mocks.get.mockResolvedValue({data:{mimeType:'application/vnd.google-apps.spreadsheet',appProperties:{qSaudiWorkspaceOperation:'op'}}});
 mocks.metadata.mockResolvedValue({data:{properties:{timeZone:'Asia/Riyadh'},sheets:REQUIRED_GOOGLE_TABS.map(title=>({properties:{title}}))}});
 mocks.headers.mockResolvedValue({data:{valueRanges:[{values:[LOADING_HEADERS]},{values:[OFFLOAD_HEADERS]}]}});
 mocks.token.mockResolvedValue({scopes:['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/spreadsheets']});mocks.identity.mockResolvedValue({data:{id:'subject-1'}});
 mocks.values.mockImplementation(async({range}:any)=>({data:{values:range.includes('Loading Register')?loading:offload}}));
 mocks.write.mockImplementation(async({requestBody}:any)=>{
   for(const d of requestBody.data){const match=d.range.match(/!([A-Z]+)(\d+)$/);const grid=d.range.includes('Loading Register')?loading:offload;grid[Number(match[2])-1][col(match[1])]=d.values[0][0]}
   return {data:{}};
 });
});
describe('PFAG-GWS1 real Google API adapter contract',()=>{
 it('loading upserts the same row on retry without changing formula cells',async()=>{const port=projectGoogleTemplatePort('token');await port.upsert('file',sample);await port.upsert('file',sample);expect(loading[1][0]).toBe('001');expect(loading[2][0]).toBe('');expect(loading[1][19]).toBe('=S2-R2');expect(loading[1][3]).toBe('=C2-B2');expect(mocks.write.mock.calls.every(c=>c[0].requestBody.valueInputOption==='RAW')).toBe(true);});
 it('updates only source allowlist and retains operator input on undefined',async()=>{const port=projectGoogleTemplatePort('token');await port.upsert('file',sample);loading[1][4]='Operator carrier';await port.upsert('file',{...sample,carrierLabel:undefined,gross:43000});expect(loading[1][4]).toBe('Operator carrier');expect(loading[1][18]).toBe(43000);expect(loading[1][19]).toBe('=S2-R2');});
 it('offload retries reconcile correlation and protect H/A formulas and reviews',async()=>{const port=projectGoogleTemplatePort('token');const s={...sample,arrivalAt:'2026-10-31T10:00:00Z',warehouseWeightTonnes:26};await port.upsert('file',s);offload[1][11]='Approved';await port.upsert('file',s);expect(offload[1][6]).toBe('SERIES|001');expect(offload[2][6]).toBe('');expect(offload[1][7]).toBe('=B2');expect(offload[1][11]).toBe('Approved');});
 it('lost write response converges onto the existing row',async()=>{const port=projectGoogleTemplatePort('token');const implementation=mocks.write.getMockImplementation()!;mocks.write.mockImplementationOnce(async(args:any)=>{await implementation(args);throw {code:503}});await expect(port.upsert('file',sample)).rejects.toThrow('GOOGLE_NETWORK_OR_SERVICE_ERROR');await port.upsert('file',sample);expect(loading.filter(row=>row[0]==='001')).toHaveLength(1);});
 it('does not overwrite a formula discovered in an input position',async()=>{loading[1][0]='001';loading[1][14]='SERIES';loading[1][18]='=CUSTOM()';await expect(projectGoogleTemplatePort('token').upsert('file',sample)).rejects.toThrow('SHEET_FORMULA_PROTECTION');expect(mocks.write).not.toHaveBeenCalled();});
 it('rejects duplicate correlation matches rather than choosing a row',async()=>{for(let r=1;r<3;r++){loading[r][0]='001';loading[r][14]='SERIES'}await expect(projectGoogleTemplatePort('token').upsert('file',sample)).rejects.toThrow('SHEET_DUPLICATE_CORRELATION_KEY');});
 it('does not extend beyond preformatted formula capacity or overwrite partial manual rows',async()=>{loading[1][4]='Partial';loading[2][4]='Partial';await expect(projectGoogleTemplatePort('token').upsert('file',sample)).rejects.toThrow('TEMPLATE_FORMULA_CAPACITY_EXHAUSTED');});
 it('verifies all required tabs and exact headers',async()=>{await projectGoogleTemplatePort('token').verify('file','op');mocks.headers.mockResolvedValueOnce({data:{valueRanges:[]}});await expect(projectGoogleTemplatePort('token').verify('file','op')).rejects.toThrow('TEMPLATE_STRUCTURE_INVALID');});
 it('rejects a file tagged for another project operation',async()=>{await expect(projectGoogleTemplatePort('token').verify('file','other')).rejects.toThrow('WORKSPACE_EXTERNAL_BINDING_INVALID');});
 it('copies through Drive, never reconstructs a spreadsheet',async()=>{mocks.copy.mockResolvedValueOnce({data:{id:'copy'}});expect(await projectGoogleTemplatePort('token').copyTemplate('template','name','folder','op')).toBe('copy');expect(mocks.copy).toHaveBeenCalledWith(expect.objectContaining({fileId:'template',requestBody:expect.objectContaining({parents:['folder'],appProperties:{qSaudiWorkspaceOperation:'op'}})}));});
 it('initialization clears fixture inputs but never T/H or report ranges',async()=>{await projectGoogleTemplatePort('token').initializeCopy('file');const ranges=mocks.clear.mock.calls[0][0].requestBody.ranges;expect(ranges).toContain("'Loading Register'!A2:A");expect(ranges).toContain("'Offload Data'!L2:L");expect(ranges).not.toContain("'Loading Register'!T2:T");expect(ranges).not.toContain("'Offload Data'!H2:H");expect(ranges.some((s:string)=>s.includes('Dashboard'))).toBe(false);});
 it('reports template access denial without leaking provider response',async()=>{mocks.get.mockRejectedValueOnce({code:403,response:{data:{secret:'TOKEN'}}});await expect(projectGoogleTemplatePort('token').validateTemplate('template')).rejects.toThrow('TEMPLATE_ACCESS_DENIED');});
 it('sanitizes provider Error instances even when they carry an HTTP status',async()=>{mocks.get.mockRejectedValueOnce(Object.assign(new Error('request token=DO_NOT_EXPOSE'),{status:403}));await expect(projectGoogleTemplatePort('token').validateTemplate('template')).rejects.toThrow('TEMPLATE_ACCESS_DENIED');});
 it('refuses missing scopes and mock authorization',async()=>{mocks.token.mockResolvedValueOnce({scopes:[]});await expect(projectGoogleTemplatePort('token').subject()).rejects.toThrow('SCOPE_DENIED');expect(()=>projectGoogleTemplatePort('mock_oauth_token')).toThrow('AUTHORIZATION_REQUIRED');});
});
