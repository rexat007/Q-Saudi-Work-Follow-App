import express,{type Express,type Request,type Response} from 'express';
import {createHash} from 'node:crypto';
import type {SqlTripAuthority} from '../src/db/tripAuthority';
import type {SqlImportAuthority} from '../src/db/importAuthority';
import type {SqlOfflineRecoveryAuthority} from '../src/db/offlineRecoveryAuthority';
import {commandIdentity,stableJson,validateOfflineEnvelope,uuid} from '../src/types/sqlOffline';
import {GlobalIdentityError} from '../src/utils/globalIdentityPolicy';
import {mountIsolatedSqlTripRoutes} from './sqlTripRoutes';
import {mountIsolatedSqlImportRoutes} from './sqlImportRoutes';
/** Explicit test/future composition only; never imported by production app.ts. */
export function mountIsolatedSqlOfflineRoutes(app:Express,options:{trips:SqlTripAuthority;imports?:SqlImportAuthority;recovery:SqlOfflineRecoveryAuthority;companyForToken:(token:string)=>Promise<string>;epoch:Readonly<{backendEpoch:string;epochRevision:number}>}){
 if(process.env.NODE_ENV!=='test'||process.env.QSA_TEST_DATABASE_ISOLATED!=='1')throw Error('SQL_OFFLINE_ROUTES_INACTIVE');const policy=Object.freeze({...options.epoch});
 if(!Number.isSafeInteger(policy.epochRevision)||policy.epochRevision<1||[options.trips,...(options.imports?[options.imports]:[])].some(s=>JSON.stringify(s.backendFence())!==JSON.stringify(policy)))throw Error('TRANSACTIONAL_EPOCH_FENCE_REQUIRED');
 const fail=(code:string,status=409):never=>{throw new GlobalIdentityError(code,'',status);};
 const fence=(req:Request)=>{if(req.header('X-Backend-Epoch')!==policy.backendEpoch||req.header('X-Backend-Epoch-Revision')!==String(policy.epochRevision))fail('BACKEND_EPOCH_MISMATCH');};
 const route=(work:(req:Request,token:string,scope:{companyId:string;projectId:string})=>Promise<any>)=>async(req:Request,res:Response)=>{
  res.set({'Cache-Control':'private, no-store','Vary':'Authorization, X-Company-Id'});
  try{const token=req.header('Authorization')?.match(/^Bearer (\S+)$/)?.[1];if(!token)fail('AUTH_REQUIRED',401);const company=await options.companyForToken(token!);if(req.header('X-Company-Id')!==company)fail('OFFLINE_SCOPE_CHANGED',403);if(req.method==='POST')fence(req);res.json(await work(req,token!,{companyId:company,projectId:String(req.params.projectId)}));}
  catch(error:any){res.status(error.status||(error.name==='AuthenticationError'?401:error.name==='AuthorizationError'?403:503)).json({error:{code:/^[A-Z_]+$/.test(error.code||'')?error.code:'OFFLINE_AUTHORITY_UNAVAILABLE'}});}
 };
 const router=express.Router();router.use(express.json({limit:'80kb'}));
 router.get('/:projectId/offline/context',route((req,t,s)=>options.recovery.context(t,s)));
 router.post('/:projectId/offline/receipt',route(async(req,t,s)=>{
  const body=req.body;if(!body||Object.keys(body).some(k=>!['identity','operationId','authority','envelope'].includes(k))||!body.identity||Object.keys(body.identity).some(k=>!['principal','companyId','projectId','deviceId','backendEpoch','epochRevision'].includes(k))||body.operationId!==body.envelope?.operationId||!uuid(body.identity.deviceId))fail('INVALID_OFFLINE_COMMAND',422);
  if(body.identity.backendEpoch!==policy.backendEpoch||body.identity.epochRevision!==policy.epochRevision)fail('BACKEND_EPOCH_MISMATCH');validateOfflineEnvelope(body.authority,body.envelope);
  if(body.authority==='TRIP')return options.recovery.recoverTrip(t,s,body);
  if(body.authority!=='IMPORT_ADVANCE'||!options.imports)fail('UNSUPPORTED_OFFLINE_AUTHORITY',422);
  const current=await options.recovery.context(t,s);if(current.principal!==body.identity.principal||current.companyId!==body.identity.companyId||current.projectId!==body.identity.projectId)fail('OFFLINE_SCOPE_CHANGED',403);
  const p=body.envelope.payload,result=await options.imports!.recoverAdvance(t,s,{sessionId:p.sessionId,operationId:p.operationId,expectedVersion:p.expectedVersion,requestId:body.operationId},{reviewedSignature:p.reviewedSignature,sourceRevisionId:p.sourceRevisionId,mappingRevisionId:p.mappingRevisionId});
  return {...body.identity,operationId:body.operationId,requestDigest:createHash('sha256').update(stableJson(commandIdentity(body))).digest('hex'),...result};
 }));
 router.post('/:projectId/offline/canonical-receipt',route((req,t,s)=>options.recovery.canonicalReceipt(t,s,req.body,policy)));
 router.use((error:any,_req:Request,res:Response,_next:any)=>{res.status(error?.type==='entity.too.large'?413:400).json({error:{code:'INVALID_OFFLINE_BODY'}});});
 app.use('/api/v2/projects',router);
 // Header compatibility is checked here; the database fence remains held through COMMIT.
 app.use('/api/v2/projects/:projectId/trips',(req,res,next)=>{if(req.method!=='POST')return next();try{fence(req);next();}catch(error:any){res.status(409).json({code:error.code});}});
 app.use('/api/v2/projects/:projectId/imports/:sessionId/executions',(req,res,next)=>{if(req.method!=='POST')return next();try{fence(req);next();}catch(error:any){res.status(409).json({error:{code:error.code}});}});
 mountIsolatedSqlTripRoutes(app,options.trips,options.companyForToken);if(options.imports)mountIsolatedSqlImportRoutes(app,options.imports);
}
