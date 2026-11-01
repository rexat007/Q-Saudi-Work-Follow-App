import type {AuthUserContext} from '../src/types/common';
import {gwsFail} from '../src/services/projectGoogleWorkspace.server';
interface Dependencies {
 status:(projectId:string,user:AuthUserContext)=>Promise<{backgroundAuthorization?:string}>;
 access:(projectId:string,user:AuthUserContext)=>Promise<{accessToken:string;authorizationId:string}>;
}
/** Fresh principal/grant checks in status/access remain authoritative; failures never fall back. */
export async function resolveWorkspaceExecutionToken(projectId:string,user:AuthUserContext,request:{headers:Record<string,unknown>},dependencies:Dependencies):Promise<{accessToken:string;authorizationId?:string}>{
 const status=await dependencies.status(projectId,user);
 if(status.backgroundAuthorization==='CONNECTED'){
  const grant=await dependencies.access(projectId,user);if(!grant.accessToken?.trim()||!grant.authorizationId)return gwsFail('AUTHORIZATION_REQUIRED',401);return {accessToken:grant.accessToken,authorizationId:grant.authorizationId};
 }
 if(status.backgroundAuthorization==='AUTHORIZATION_REQUIRED')return gwsFail('AUTHORIZATION_REQUIRED',401);
 const value=request.headers['x-google-access-token'];const token=typeof value==='string'?value:Array.isArray(value)&&typeof value[0]==='string'?value[0]:undefined;
 if(!token?.trim())return gwsFail('AUTHORIZATION_REQUIRED',401);
 // Browser fallback is ephemeral. The Google port still proves subject, scope and binding.
 return {accessToken:token.trim()};
}
