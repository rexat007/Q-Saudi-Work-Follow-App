import {Router,json,type Express,type Request,type Response} from 'express';
import type {SqlImportAuthority} from '../src/db/importAuthority.js';
import {GlobalIdentityError} from '../src/utils/globalIdentityPolicy';
/** Not imported by server/app.ts. No production activation switch exists. */
export function mountIsolatedSqlImportRoutes(app:Express,imports:SqlImportAuthority){
  if(process.env.NODE_ENV!=='test'||process.env.QSA_TEST_DATABASE_ISOLATED!=='1')throw Error('SQL_IMPORT_ROUTES_INACTIVE');
  const router=Router({mergeParams:true});router.use(json({limit:'3mb'}));
  const handle=(work:(req:Request,token:string,scope:{companyId:string;projectId:string})=>Promise<unknown>)=>async(req:Request,res:Response)=>{
    res.set({'Cache-Control':'private, no-store','Vary':'Authorization, X-Company-Id'});delete req.headers['if-none-match'];
    try{
      const token=req.header('Authorization')?.match(/^Bearer (\S+)$/)?.[1];
      if(!token){res.status(401).json({error:{code:'UNAUTHENTICATED'}});return;}
      const value=await work(req,token,{companyId:req.header('X-Company-Id')||'',projectId:String(req.params.projectId)});res.json(value);
    }catch(error:any){
      const safe=typeof error?.code==='string'&&/^[A-Z_]+$/.test(error.code)
        &&(error instanceof GlobalIdentityError||['AuthenticationError','AuthorizationError'].includes(error?.name)||error.code===error.message);
      res.status(error?.status||(error?.name==='AuthenticationError'?401:error?.name==='AuthorizationError'?403:safe?409:503))
        .json({error:{code:safe?error.code:'IMPORT_AUTHORITY_UNAVAILABLE',...(error?.code==='U06_TRIP_AUTHORITY_REQUIRED'?{reviewRequired:true,dependency:'AR2_U06'}:{})}});
    }
  };
  const command=(req:Request)=>({...req.body,sessionId:String(req.params.sessionId)});
  router.post('/',handle((req,t,s)=>imports.createSession(t,s,command(req))));
  router.post('/source',handle((req,t,s)=>{
    const {base64,...rest}=req.body||{};if(typeof base64!=='string'||base64.length>2_700_000||Buffer.from(base64,'base64').toString('base64')!==base64)throw Object.assign(Error(),{code:'INVALID_SOURCE_BYTES',status:400});
    return imports.attachSource(t,s,{...rest,sessionId:String(req.params.sessionId)},Buffer.from(base64,'base64'));
  }));
  router.post('/checkpoint',handle((req,t,s)=>imports.checkpoint(t,s,command(req))));
  router.get('/checkpoint',handle((req,t,s)=>imports.readCheckpoint(t,s,String(req.params.sessionId))));
  router.get('/intent',handle((req,t,s)=>imports.preview(t,s,String(req.params.sessionId))));
  router.post('/review',handle((req,t,s)=>imports.review(t,s,command(req))));
  router.post('/executions',handle((req,t,s)=>imports.start(t,s,command(req))));
  router.post('/executions/:operationId/advance',handle((req,t,s)=>imports.advance(t,s,{...command(req),operationId:String(req.params.operationId)})));
  router.post('/executions/:operationId/cancel',handle((req,t,s)=>imports.cancel(t,s,{...command(req),operationId:String(req.params.operationId)})));
  router.get('/executions/:operationId',handle((req,t,s)=>{
    if(Object.keys(req.query).some(k=>!['limit','cursor'].includes(k))||Object.values(req.query).some(v=>typeof v!=='string'))throw Object.assign(Error(),{code:'INVALID_IMPORT_COMMAND',status:400});
    const raw=req.query.limit;if(raw!==undefined&&!/^(?:[1-9]|[1-4][0-9]|50)$/.test(String(raw)))throw Object.assign(Error(),{code:'INVALID_IMPORT_COMMAND',status:400});
    return imports.status(t,s,String(req.params.sessionId),String(req.params.operationId),raw?Number(raw):50,req.query.cursor as string|undefined);
  }));
  router.use((error:any,_req:Request,res:Response,_next:unknown)=>{res.status(error?.status===413?413:400).json({error:{code:'INVALID_IMPORT_BODY'}});});
  app.use('/api/v2/projects/:projectId/imports/:sessionId',router);
}
