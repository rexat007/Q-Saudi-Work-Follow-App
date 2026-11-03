import {postSetupJson} from '../setupOrchestration.service';
import type {BulkIdentityQuery,BulkIdentityResult} from '../../types/importResolution';
export async function discoverRosterIdentities(projectId:string,queries:BulkIdentityQuery[]):Promise<BulkIdentityResult[]>{
 const results:BulkIdentityResult[]=[];
 for(let offset=0;offset<queries.length;offset+=100){
  const data=await postSetupJson(`/api/projects/${encodeURIComponent(projectId)}/import-resolution/discover`,{queries:queries.slice(offset,offset+100)});
  if(data.projectId!==projectId||!Array.isArray(data.results))throw Error('PROJECT_CONTEXT_STALE');
  results.push(...data.results);
 }
 return results;
}
