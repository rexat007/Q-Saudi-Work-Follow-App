import {beforeEach,describe,it,expect,vi} from 'vitest';
const f=vi.hoisted(()=>({rows:[] as any[][],get:vi.fn(),metadata:vi.fn(),append:vi.fn(),update:vi.fn(),batch:vi.fn(),structure:vi.fn()}));
vi.mock('googleapis',()=>({google:{auth:{OAuth2:class{setCredentials(){}}},sheets:()=>({spreadsheets:{get:f.metadata,batchUpdate:f.structure,values:{get:f.get,append:f.append,update:f.update,batchUpdate:f.batch}}})}}));
import {serverWorkspaceService} from '../../server/workspace.service';
beforeEach(()=>{
 vi.clearAllMocks();f.rows=[];f.metadata.mockResolvedValue({data:{sheets:[{properties:{sheetId:5,title:'Carriers'}}]}});
 f.get.mockImplementation(async({range}:any)=>({data:{values:range.endsWith('1:1')?[['carrierId','name']]:f.rows}}));
 f.append.mockImplementation(async({requestBody}:any)=>{f.rows.push(...requestBody.values);return {data:{}}});f.batch.mockImplementation(async({requestBody}:any)=>{for(const update of requestBody.data){const row=Number(update.range.match(/!A(\d+)/)[1])-2;f.rows[row]=update.values[0];}return {data:{}}});
});
describe('canonical master RAW writes through the existing reconciliation engine',()=>{
 it('keeps literal text and stable IDs on insert/update without formula execution or duplicate appends',async()=>{
  const rows=[{carrierId:'001',name:'=1+1'}];
  await serverWorkspaceService.reconcileTabSnapshot('file','Carriers','carrierId',rows,['carrierId','name'],'fixture-token','RAW');
  rows[0].name='=2+2';
  await serverWorkspaceService.reconcileTabSnapshot('file','Carriers','carrierId',rows,['carrierId','name'],'fixture-token','RAW');
  expect(f.append).toHaveBeenCalledOnce();expect(f.append.mock.calls[0][0]).toMatchObject({valueInputOption:'RAW',requestBody:{values:[['001','=1+1']]}});
  expect(f.batch.mock.calls[0][0]).toMatchObject({requestBody:{valueInputOption:'RAW',data:[{values:[['001','=2+2']]}]}});expect(f.rows).toEqual([['001','=2+2']]);
 });
 it('fails closed instead of returning simulated success when canonical delivery has no Google authorization',async()=>{
  await expect(serverWorkspaceService.reconcileTabSnapshot('file','Carriers','carrierId',[],['carrierId','name'],undefined,'RAW')).rejects.toMatchObject({code:'GOOGLE_ACCESS_TOKEN_REQUIRED'});expect(f.metadata).not.toHaveBeenCalled();
 });
});
