import {WORKSPACE_OAUTH_CHANNEL,WORKSPACE_OAUTH_MESSAGE,isWorkspaceOAuthCorrelation,type WorkspaceOAuthCompletion} from '../src/utils/workspaceOAuthCompletion';
import {boundedWorkspaceHttpCode} from '../src/utils/workspaceHttp';
import {isWorkspaceAuthReason} from '../src/utils/workspaceAuthorization';
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
    let result:WorkspaceOAuthCompletion={type:WORKSPACE_OAUTH_MESSAGE,projectId:null,correlationId:null,result:'AUTHORIZATION_FAILED'};
    let origin:string;
    try{
      const c=workspaceOfflineConfig(),uri=new URL(c.redirectUri);origin=uri.origin;
      const cookieName=uri.protocol==='https:'?'__Host-qws':'qws-dev';
      const cookie=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';
      if(typeof req.query.state==='string'){
        const failure=req.query.error!==undefined||typeof req.query.code!=='string';
        const context=await workspaceOfflineAuthorization.callbackCompletion(req.query.state,cookie,failure);
        if(!isWorkspaceOAuthCorrelation(context.correlationId)||!(/^[A-Za-z0-9_-]{1,128}$/).test(context.projectId))throw Error('invalid completion context');
        // An invalid/stale callback must not clear a newer attempt's shared browser cookie.
        res.cookie(cookieName,'',{secure:uri.protocol==='https:',httpOnly:true,sameSite:'lax',path:'/',maxAge:0});
        result={...result,projectId:context.projectId,correlationId:context.correlationId};
        if(failure)result.code='AUTHORIZATION_DENIED';
        else {
          const accepted=await workspaceOfflineAuthorization.callback(req.query.state,req.query.code as string,cookie);
          if(accepted.result==='CONNECTED'&&accepted.projectId===context.projectId)result.result='CONNECTED';
        }
      }
    }catch(error){const e=error as {code?:unknown;authorizationReason?:unknown},code=boundedWorkspaceHttpCode(e?.code);result={...result,result:'AUTHORIZATION_FAILED',...(code?{code}:{}),...(isWorkspaceAuthReason(e?.authorizationReason)?{authorizationReason:e.authorizationReason}:{})};try{origin=new URL(workspaceOfflineConfig().redirectUri).origin;}catch{origin='';res.status(503);result.code='GOOGLE_OFFLINE_CONFIGURATION_REQUIRED';}}
    const nonce=randomBytes(18).toString('base64');
    res.setHeader('Content-Security-Policy',`default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'none'; base-uri 'none'`);
    // Dedicated terminal HTML even on invalid/error callbacks: never a SPA redirect.
    const message=result.result==='CONNECTED'?'تم إكمال تفويض Google. يمكنك إغلاق هذه النافذة والعودة إلى التطبيق.':'لم يكتمل تفويض Google. يمكنك إغلاق هذه النافذة والعودة إلى التطبيق.';
    const payload=JSON.stringify(result).replace(/</g,'\\u003c');
    return res.type('html').send(`<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>Google Workspace</title><p role="status">${message}</p><script nonce="${nonce}">try{history.replaceState(null,'','/workspace/google/callback');}catch(_){}var completion=${payload};try{var channel=new BroadcastChannel(${JSON.stringify(WORKSPACE_OAUTH_CHANNEL)});try{channel.postMessage(completion);}finally{channel.close();}}catch(_){}try{if(window.opener)window.opener.postMessage(completion,${JSON.stringify(origin!)});}catch(_){}try{window.close();}catch(_){}</script></html>`);

  });
}
export function registerWorkspaceOAuthCommands(app:Express,guards:any[]) {
  app.get('/api/projects/:projectId/workspace/authorization/diagnosis',...guards,async(req:any,res)=>{
    res.setHeader('Cache-Control','no-store');
    try{return res.json({success:true,data:await workspaceOfflineAuthorization.diagnoseWorkspaceAuthorization(req.params.projectId,req.user)});}
    catch{return res.status(503).json({success:false,code:'GOOGLE_AUTHORIZATION_DIAGNOSIS_UNAVAILABLE'});}
  });
  app.post('/api/projects/:projectId/workspace/authorization',...guards,async(req:any,res)=>{
    res.setHeader('Cache-Control','no-store');
    try{
      if(Object.keys(req.body||{}).some(key=>!['automation','operationId'].includes(key))||typeof req.body?.automation!=='boolean'||req.body?.operationId!==undefined&&(typeof req.body.operationId!=='string'||!(/^[a-f0-9]{64}$/).test(req.body.operationId)))return res.status(400).json({success:false,code:'INVALID_WORKSPACE_COMMAND'});
      const c=workspaceOfflineConfig(),uri=new URL(c.redirectUri),started=await workspaceOfflineAuthorization.begin(req.params.projectId,req.user,req.body.automation,req.body.operationId);
      res.cookie(uri.protocol==='https:'?'__Host-qws':'qws-dev',started.browser,{secure:uri.protocol==='https:',httpOnly:true,sameSite:'lax',path:'/',maxAge:started.expiresIn*1000});
      return res.json({success:true,url:started.url,correlationId:started.correlationId});
    }catch(error){return res.status(error instanceof GoogleWorkspaceCommandError?error.status:503).json({success:false,code:error instanceof GoogleWorkspaceCommandError?error.code:'GOOGLE_OFFLINE_AUTHORIZATION_FAILED'});}
  });
  app.delete('/api/projects/:projectId/workspace/authorization',...guards,async(req:any,res)=>{
    res.setHeader('Cache-Control','no-store');
    try{return res.json({success:true,...await workspaceOfflineAuthorization.revoke(req.params.projectId,req.user)});}
    catch{return res.status(403).json({success:false,code:'GOOGLE_AUTHORIZATION_REVOCATION_FAILED'});}
  });
}
