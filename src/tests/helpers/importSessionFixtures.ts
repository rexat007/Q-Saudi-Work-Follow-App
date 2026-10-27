import type { ImportSessionServerService } from '../../services/importSession.server';

/** Test-only persisted record construction. This is never exposed by the public create API. */
export function makePersistedSessionFixture(projectId: string, actor: string, overrides: Record<string, any> = {}) {
  const state = overrides.lifecycleState || 'RESOLUTION';
  const stage = overrides.rosterStage || ({ SOURCE:'SOURCE_DISCOVERY', DISCOVERED:'MAPPING_APPROVAL', MAPPING:'MAPPING_APPROVAL', RESOLUTION:'DRIVER_TRUCK_RESOLUTION', REVIEW:'FINAL_REVIEW', COMMITTED:'COMMIT_RESULT', FAILED:'COMMIT_RESULT', CANCELLED:'SOURCE_DISCOVERY' } as Record<string,string>)[state];
  const legacy=['FAILED','COMMITTED'].includes(state);
  return {
    schemaVersion:legacy?1:2, domain:'ROSTER', importSessionId:'fixture-session', projectId,
    operationId:'fixture-operation', importBatchId:'fixture-batch', sourceType:'EXCEL',
    version:1, lifecycleState:state, rosterStage:stage, currentStage:stage,
    createdAt:'2026-01-01T00:00:00.000Z', updatedAt:'2026-01-01T00:00:00.000Z', createdBy:actor, updatedBy:actor,
    ...(!legacy ? {
    source:{ sourceRevisionId:'fixture-source', sourceType:'EXCEL', requiresReattach:true, fileName:'fixture.xlsx' },
    mapping:{ mappingRevisionId:'fixture-mapping', sourceRevisionId:'fixture-source', mappings:{ Driver:'driverName' }, approved:true, approvedAt:'2026-01-01T00:00:00.000Z', approvedBy:actor },
    } : {}),
    ...overrides,
  };
}
/** Recursively scoped transactional Map fixture, including immutable chunk subcollections and document IDs. */
export function sessionMapDatabase(store: Map<string, any>) {
  const ref = (path: string, order?: [string,string]): any => ({ path, id:path.split('/').at(-1), collection:(name:string)=>ref(`${path}/${name}`), doc:(id:string)=>ref(`${path}/${id}`), orderBy:(field:string,direction:string)=>ref(path,[field,direction]),
    get: async () => {
      if (path.split('/').length % 2 === 0) return { id:path.split('/').at(-1), exists:store.has(path), data:()=>structuredClone(store.get(path)) };
      let docs = [...store].filter(([key])=>key.startsWith(path+'/') && !key.slice(path.length+1).includes('/')).map(([key,data])=>({id:key.split('/').at(-1),data:()=>structuredClone(data)}));
      if (order) docs.sort((a,b)=>String(a.data()[order[0]]||'').localeCompare(String(b.data()[order[0]]||''))*(order[1]==='desc'?-1:1));
      return { docs, forEach:(cb:any)=>docs.forEach(cb) };
    },
  });
  return { collection:(name:string)=>ref(name), runTransaction:async (callback:any)=>{
    const pending: (()=>void)[]=[]; let writing=false;
    const result=await callback({get:(doc:any)=>{if(writing)throw Error('read after write');return doc.get();},set:(doc:any,data:any)=>{writing=true;pending.push(()=>store.set(doc.path,structuredClone(data)));}});
    pending.forEach(commit=>commit()); return result;
  }};
}
