import type {Request,Response,NextFunction} from 'express';
import {readRuntimeVersion} from '../tooling/runtimeBuild';
const version=readRuntimeVersion();
export function runtimeVersionHandler(_req:Request,res:Response){res.setHeader('Cache-Control','no-store');res.status(version.buildId==='UNAVAILABLE'?503:200).json(version);}
export function workspaceGenerationFence(req:Request,res:Response,next:NextFunction){
  if(version.buildId==='UNAVAILABLE'||req.get('X-App-Build')!==version.buildId)return res.status(409).set('Cache-Control','no-store').json({success:false,code:'APP_UPDATE_REQUIRED'});
  next();
}
export function shellCacheHeaders(res:Response,file:string){
  if(file.endsWith('.html')||/\/(sw\.js|registerSW\.js|runtime-build\.json)$/.test(file)||/pwa-generation-/.test(file))res.setHeader('Cache-Control','no-cache, max-age=0, must-revalidate');
  else if(/\/assets\/.+-[\w-]+\.(js|css)$/.test(file))res.setHeader('Cache-Control','public, max-age=31536000, immutable');
}
