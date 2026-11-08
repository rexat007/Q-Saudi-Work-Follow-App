import type { Express,Request,Response } from 'express';
import { SqlProjectReadAuthority,ProjectReadError } from '../src/db/projectReadAuthority.js';
import { SQL_SETUP_STAGES } from '../src/types/boundedProjectReads';

/** Deliberately NOT imported by server/app.ts. U09 must explicitly replace this
 * isolated-only composition after single-authority cutover approval. */
export function mountIsolatedSqlProjectReadRoutes(app:Express,reads:SqlProjectReadAuthority){
  if(process.env.NODE_ENV!=='test'||process.env.QSA_TEST_DATABASE_ISOLATED!=='1')throw Error('SQL_READ_ROUTES_INACTIVE');
  const handler=(action:(req:Request,res:Response,token:string,company:string,project:string)=>Promise<void>)=>async(req:Request,res:Response)=>{
    res.set({'Cache-Control':'private, no-store','Vary':'Authorization, X-Company-Id','X-Content-Type-Options':'nosniff'});
    try{
      const bearer=req.header('Authorization')?.match(/^Bearer (\S+)$/)?.[1];
      if(!bearer)throw new ProjectReadError('UNAUTHENTICATED',401);
      // Company is a requested scope, never authorization; SQL checks exact membership.
      await action(req,res,bearer,req.header('X-Company-Id')||'',String(req.params.projectExternalId));
    }catch(error){
      const e=error instanceof ProjectReadError?error:new ProjectReadError('CANONICAL_READ_UNAVAILABLE',503);
      res.status(e.status).json({error:{code:e.code}});
    }
  };
  const strictQuery=(req:Request,keys:string[])=>{if(Object.keys(req.query).some(k=>!keys.includes(k)))throw new ProjectReadError('INVALID_READ_REQUEST',400);};
  app.get('/api/v2/projects/:projectExternalId/foundation-summary',handler(async(req,res,token,companyId,projectExternalId)=>{
    strictQuery(req,[]);
    const result=await reads.summary(token,{companyId,projectExternalId},req.header('If-None-Match'));
    res.set('ETag',result.etag);
    // Express's automatic freshness handling could issue 304 even for a stale
    // summary. Remove the conditional header after our authorized comparison.
    delete req.headers['if-none-match'];
    if(result.status===304){res.status(304).end();return;}
    res.status(200).json(result.body);
  }));
  const page=handler(async(req,res,token,companyId,projectExternalId)=>{
    strictQuery(req,['kind','limit','cursor']);
    const stage=String(req.params.stage||'ROSTER');
    if(!SQL_SETUP_STAGES.includes(stage as any))throw new ProjectReadError('INVALID_PAGE_REQUEST',400);
    const defaults:Record<string,string>={ROSTER:'TRUCK',CARRIERS:'CARRIER',MATERIALS:'MATERIAL'};
    if(!Object.hasOwn(defaults,stage)){
      strictQuery(req,[]);
      const summary=await reads.summary(token,{companyId,projectExternalId});
      res.json({data:{projectExternalId,stage,sourceRevision:summary.body.data.sourceRevision,stale:summary.body.data.stale,
        summary:summary.body.data.setupStages.find(s=>s.stage===stage),
        ...(stage==='WORKSPACE'?{workspaceStatus:summary.body.data.workspaceStatus}:{})},meta:summary.body.meta});return;
    }
    if(Object.values(req.query).some(v=>typeof v!=='string'))throw new ProjectReadError('INVALID_PAGE_REQUEST',400);
    const raw=req.query.limit;
    if(raw!==undefined&&!/^(?:[1-9]|[1-4][0-9]|50)$/.test(String(raw)))throw new ProjectReadError('INVALID_PAGE_REQUEST',400);
    res.json(await reads.page(token,{companyId,projectExternalId},{stage,kind:String(req.query.kind||defaults[stage]),
      limit:raw===undefined?50:Number(raw),cursor:req.query.cursor as string|undefined}));
  });
  app.get('/api/v2/projects/:projectExternalId/fleet',page);
  app.get('/api/v2/projects/:projectExternalId/setup/:stage',page);
}
