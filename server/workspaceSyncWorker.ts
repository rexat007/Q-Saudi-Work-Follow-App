import {adminDb} from '../src/firebase/admin';
import {ProjectGoogleWorkspaceServer,continuityRef,syncOutboxRef} from '../src/services/projectGoogleWorkspace.server';
import {AUTHORIZATIONS,WorkspaceGoogleOfflineAuthorization,workspaceOfflineConfig} from '../src/services/workspaceGoogleOfflineAuthorization.server';
import type {AuthUserContext} from '../src/types/common';
import {googleOfflineProvider} from './workspaceGoogleOffline.adapter';
import {projectGoogleBlueprintPort} from './projectGoogleBlueprint.adapter';

export const workspaceOfflineAuthorization=new WorkspaceGoogleOfflineAuthorization(googleOfflineProvider);
/** One worker invokes the SAME authority/drain used by interactive requests.
 * Multiple scheduled invocations are safe: each Project has one renewable lease. */
export async function runWorkspaceSyncWorker(database:any=adminDb,offline=workspaceOfflineAuthorization,port=projectGoogleBlueprintPort,configure=workspaceOfflineConfig) {
  configure();
  const grants=await database.collection(AUTHORIZATIONS).where('status','==','ACTIVE').get();
  const result={examined:0,delivered:0,deferred:0};
  for(const doc of grants.docs){
    const grant=doc.data(),projectId=grant.projectId;result.examined++;
    try {
      const s=(await continuityRef(database,projectId).get()).data();if(s?.backgroundAuthorizationId!==doc.id)continue;
      const events=await syncOutboxRef(database,projectId).where('status','==','PENDING').limit(1).get();
      const initialize=s.workbookHealth!=='HEALTHY'||s.automationState==='NOT_INSTALLED'||s.automationState==='DEGRADED';
      if(!events.docs.length&&!initialize)continue;
      const who={userId:grant.actorId} as AuthUserContext,access=await offline.access(projectId,who),google=port(access.accessToken,projectId),service=new ProjectGoogleWorkspaceServer(database,undefined,undefined,access.authorizationId);
      if(initialize)await service.initializeBound(projectId,who,google);
      else await service.retrySync(projectId,who,google);
      const status=await service.status(projectId,who);if(status.pendingSyncCount||status.syncHealth!=='HEALTHY'||status.workspaceState!=='CONNECTED')result.deferred++;else result.delivered++;
    } catch(error){
      result.deferred++;
      const code=(error as {code?:string}).code;
      // Only closed, non-secret failure categories are persisted. A stale worker
      // cannot overwrite the authorization/lease owned by another execution.
      if(!['WORKSPACE_SYNC_IN_PROGRESS','WORKSPACE_EXECUTION_FENCED'].includes(code||''))await database.runTransaction(async(tx:any)=>{
        const ref=continuityRef(database,projectId),snap=await tx.get(ref),s=snap.data();
        if(s?.backgroundAuthorizationId===doc.id&&!s.syncOwner){
          const auth=s.state==='AUTHORIZATION_REQUIRED'||/TOKEN_EXPIRED|AUTHORIZATION_REQUIRED|SCOPE_DENIED/.test(code||''),missing=s.state==='BOUND_FILE_UNAVAILABLE'||code==='BOUND_FILE_UNAVAILABLE';
          tx.set(ref,{...s,state:missing?'BOUND_FILE_UNAVAILABLE':auth?'AUTHORIZATION_REQUIRED':'SYNC_DEGRADED',lastSyncError:missing?'BOUND_FILE_UNAVAILABLE':auth?'AUTHORIZATION_REQUIRED':'BACKGROUND_SYNC_DEFERRED'});
        }
      }).catch(()=>{});
    }
  }
  return result;
}
