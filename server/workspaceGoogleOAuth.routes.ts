import {randomBytes} from 'node:crypto';
import type {Express} from 'express';
import {workspaceOfflineAuthorization} from './workspaceSyncWorker';
import {workspaceOfflineConfig} from '../src/services/workspaceGoogleOfflineAuthorization.server';
import {GoogleWorkspaceCommandError} from '../src/services/projectGoogleWorkspace.server';

/** Public callback authenticates a short-lived browser-bound transaction, not an app
 * login. It must be registered before API authentication and the SPA fallback. */
export function registerWorkspaceOAuthCallback(app:Express) {
  app.get('/workspace/google/callback',async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
    let result:{projectId:string|null;result:string}={projectId:null,result:'AUTHORIZATION_FAILED'};
    let origin:string;
    try{
      const c=workspaceOfflineConfig(),uri=new URL(c.redirectUri);origin=uri.origin;
      const cookieName=uri.protocol==='https:'?'__Host-qws':'qws-dev';
      const cookie=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';
      res.cookie(cookieName,'',{secure:uri.protocol==='https:',httpOnly:true,sameSite:'lax',path:'/',maxAge:0});
      if(typeof req.query.state==='string'&&typeof req.query.code==='string'&&!req.query.error)result=await workspaceOfflineAuthorization.callback(req.query.state,req.query.code,cookie);
    }catch{try{origin=new URL(workspaceOfflineConfig().redirectUri).origin;}catch{return res.status(503).type('text/plain').send('GOOGLE_OFFLINE_CONFIGURATION_REQUIRED');}}
    const nonce=randomBytes(18).toString('base64');
    res.setHeader('Content-Security-Policy',`default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'none'; base-uri 'none'`);
    // No code, state, provider error, Google identity or credential is reflected.
    return res.type('html').send(`<!doctype html><meta charset="utf-8"><title>Google Workspace</title><script nonce="${nonce}">history.replaceState(null,'','/workspace/google/callback');if(window.opener){window.opener.postMessage(${JSON.stringify({type:'QSAUDI_WORKSPACE_OAUTH',...result})},${JSON.stringify(origin!)});window.close();}</script>`);
  });
}
export function registerWorkspaceOAuthCommands(app:Express,guards:any[]) {
  app.post('/api/projects/:projectId/workspace/authorization',...guards,async(req:any,res)=>{
    res.setHeader('Cache-Control','no-store');
    try{
      if(Object.keys(req.body||{}).some(key=>key!=='automation')||typeof req.body?.automation!=='boolean')return res.status(400).json({success:false,code:'INVALID_WORKSPACE_COMMAND'});
      const c=workspaceOfflineConfig(),uri=new URL(c.redirectUri),started=await workspaceOfflineAuthorization.begin(req.params.projectId,req.user,req.body.automation);
      res.cookie(uri.protocol==='https:'?'__Host-qws':'qws-dev',started.browser,{secure:uri.protocol==='https:',httpOnly:true,sameSite:'lax',path:'/',maxAge:started.expiresIn*1000});
      return res.json({success:true,url:started.url});
    }catch(error){return res.status(error instanceof GoogleWorkspaceCommandError?error.status:503).json({success:false,code:error instanceof GoogleWorkspaceCommandError?error.code:'GOOGLE_OFFLINE_AUTHORIZATION_FAILED'});}
  });
  app.delete('/api/projects/:projectId/workspace/authorization',...guards,async(req:any,res)=>{
    res.setHeader('Cache-Control','no-store');
    try{return res.json({success:true,...await workspaceOfflineAuthorization.revoke(req.params.projectId,req.user)});}
    catch{return res.status(403).json({success:false,code:'GOOGLE_AUTHORIZATION_REVOCATION_FAILED'});}
  });
}
