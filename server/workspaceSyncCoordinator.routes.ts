import type {Express} from 'express';
import type {AuthUserContext} from '../src/types/common';
import type {WorkspaceSyncPass} from './workspaceSyncCoordinator';
/** Registered behind Firebase authentication, before any Project-specific Workspace boundary. */
export function registerUserActiveWorkspaceSync(app:Express,coordinator:{runForActor:(user:AuthUserContext)=>Promise<WorkspaceSyncPass>}){
 app.post('/api/workspace/user-active-sync',async(req:any,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(!req.user?.userId)return res.status(401).json({success:false,code:'UNAUTHENTICATED'});
  if(!req.body||typeof req.body!=='object'||Array.isArray(req.body)||Object.keys(req.body).length||req.headers['x-google-access-token']!==undefined)return res.status(400).json({success:false,code:'INVALID_WORKSPACE_COMMAND'});
  try{
   const pass=await coordinator.runForActor(req.user);
   return res.json({success:true,examined:pass.examined,eligible:pass.eligible,attempted:pass.attempted,delivered:pass.delivered,skipped:pass.skipped,deferred:pass.deferred});
  }catch{return res.status(503).json({success:false,code:'WORKSPACE_COORDINATOR_UNAVAILABLE'});}
 });
}
