import {adminDb} from '../src/firebase/admin';
import {WorkspaceGoogleOfflineAuthorization,workspaceOfflineConfig} from '../src/services/workspaceGoogleOfflineAuthorization.server';
import {googleOfflineProvider} from './workspaceGoogleOffline.adapter';
import {projectGoogleBlueprintPort} from './projectGoogleBlueprint.adapter';
import {WorkspaceSyncCoordinator} from './workspaceSyncCoordinator';
export const workspaceOfflineAuthorization=new WorkspaceGoogleOfflineAuthorization(googleOfflineProvider);
export const workspaceSyncCoordinator=new WorkspaceSyncCoordinator(workspaceOfflineAuthorization);
/** Dormant scheduling entry: shares grant discovery, fencing and delivery with actor passes. */
export async function runWorkspaceSyncWorker(database:any=adminDb,offline=workspaceOfflineAuthorization,port=projectGoogleBlueprintPort,configure=workspaceOfflineConfig){
 configure();const result=await new WorkspaceSyncCoordinator(offline,database,port).runScheduled();
 return {examined:result.examined,delivered:result.delivered,deferred:result.deferred};
}
