import express,{type Express,type Request,type Response} from 'express';
import type {SqlTripAuthority} from '../src/db/tripAuthority.js';
/** Route registration only; trusted runtime composition owns activation. */
export function registerSqlTripRoutes(app:Express,service:SqlTripAuthority,companyForToken:(token:string)=>Promise<string>){
 const router=express.Router();router.use(express.json({limit:'64kb'}));
 const handle=(work:(req:Request,token:string,scope:{companyId:string;projectId:string})=>Promise<any>)=>async(req:Request,res:Response)=>{
  try{const auth=req.headers.authorization;if(!auth?.startsWith('Bearer '))return res.status(401).json({code:'AUTH_REQUIRED'});const token=auth.slice(7),scope={companyId:await companyForToken(token),projectId:String(req.params.projectExternalId)};res.json(await work(req,token,scope));}
  catch(e:any){res.status(Number.isInteger(e.status)?e.status:e.name==='AuthenticationError'?401:e.name==='AuthorizationError'?403:503).json({code:typeof e.code==='string'&&/^[A-Z_]+$/.test(e.code)?e.code:'TRIP_AUTHORITY_UNAVAILABLE'});}
 };
 router.post('/:projectExternalId/trips/commands',handle((req,token,scope)=>service.execute(token,scope,req.body)));
 router.post('/:projectExternalId/pricing/commands',handle((req,token,scope)=>service.savePricing(token,scope,req.body)));
 router.get('/:projectExternalId/trips/operations/:operationId',handle((req,token,scope)=>service.receipt(token,scope,String(req.params.operationId))));
 router.get('/:projectExternalId/trips/:tripId/weights',handle((req,token,scope)=>service.measurements(token,scope,String(req.params.tripId),req.query.after?String(req.query.after):null,Number(req.query.limit||50))));
 router.get('/:projectExternalId/trips/:tripId',handle((req,token,scope)=>service.read(token,scope,String(req.params.tripId),Number(req.query.after||0),Number(req.query.limit||50))));
 router.use((error:any,_req:Request,res:Response,_next:any)=>{res.status(error?.type==='entity.too.large'?413:400).json({code:error?.type==='entity.too.large'?'PAYLOAD_TOO_LARGE':'INVALID_JSON'});});
 app.use('/api/v2/projects',router);
}

/** Backward-compatible isolated verification entry point. */
export function mountIsolatedSqlTripRoutes(app:Express,service:SqlTripAuthority,companyForToken:(token:string)=>Promise<string>){
 if(process.env.NODE_ENV!=='test'||process.env.QSA_TEST_DATABASE_ISOLATED!=='1')throw Error('ISOLATED_TRIP_ROUTE_REQUIRED');
 registerSqlTripRoutes(app,service,companyForToken);
}
