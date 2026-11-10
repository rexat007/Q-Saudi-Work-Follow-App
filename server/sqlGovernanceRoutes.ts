import express,{type Express,type Request,type Response} from 'express';
import type {SqlGovernanceAuthority} from '../src/db/governanceAuthority';
/** Production-capable registration; app.ts does not activate the SQL composition. */
export function registerSqlGovernanceRoutes(app:Express,authority:SqlGovernanceAuthority){
 const router=express.Router();router.use(express.json({limit:'64kb'}));
 const handle=(work:(req:Request,token:string,company:string|undefined)=>Promise<unknown>)=>async(req:Request,res:Response)=>{res.set({'Cache-Control':'private, no-store','Vary':'Authorization, X-Company-Id'});try{const token=req.header('Authorization')?.match(/^Bearer (\S+)$/)?.[1];if(!token)return res.status(401).json({error:{code:'UNAUTHENTICATED'}});res.json(await work(req,token,req.header('X-Company-Id')));}catch(e:any){res.status(Number.isInteger(e.status)?e.status:503).json({error:{code:/^[A-Z_]{3,100}$/.test(e.code||'')?e.code:'GOVERNANCE_UNAVAILABLE'}});}};
 const company=(c:string|undefined)=>{if(!c)throw Object.assign(Error(),{code:'COMPANY_SCOPE_REQUIRED',status:422});return c;};
 const page=(req:Request)=>{if(Object.keys(req.query).some(k=>!['cursor','limit'].includes(k))||Object.values(req.query).some(v=>typeof v!=='string')||req.query.limit!==undefined&&!/^(?:[1-9]|[1-4][0-9]|50)$/.test(String(req.query.limit)))throw Object.assign(Error(),{code:'INVALID_GOVERNANCE_PAGE',status:422});return [req.query.cursor as string|undefined,Number(req.query.limit||50)] as const;};
 router.get('/account',handle((q,t,c)=>{if(Object.keys(q.query).length)throw Object.assign(Error(),{code:'INVALID_GOVERNANCE_REQUEST',status:422});return authority.account(t,c);}));
 router.get('/account/companies',handle((q,t)=>authority.companies(t,...page(q))));
 router.post('/account/commands',handle((q,t,c)=>authority.register(t,company(c),q.body)));
 router.get('/governance/accounts',handle((q,t,c)=>authority.accounts(t,company(c),...page(q))));
 router.post('/governance/accounts/:principal/commands',handle((q,t,c)=>authority.accountCommand(t,company(c),String(q.params.principal),q.body)));
 router.get('/governance/projects',handle((q,t,c)=>authority.projects(t,company(c),...page(q))));
 router.post('/governance/projects/commands',handle((q,t,c)=>authority.projectCommand(t,company(c),undefined,q.body)));
 router.get('/governance/projects/:projectId',handle((q,t,c)=>authority.project(t,company(c),String(q.params.projectId))));
 router.get('/governance/projects/:projectId/readiness',handle((q,t,c)=>authority.readiness(t,company(c),String(q.params.projectId))));
 router.post('/governance/projects/:projectId/assessment',handle((q,t,c)=>authority.assess(t,company(c),String(q.params.projectId),q.body)));
 router.post('/governance/projects/:projectId/commands',handle((q,t,c)=>authority.projectCommand(t,company(c),String(q.params.projectId),q.body)));
 router.get('/governance/operations/:operationId/result',handle((q,t,c)=>authority.projectOperationResult(t,company(c),String(q.params.operationId))));
 router.get('/governance/operations/:operationId',handle((q,t,c)=>authority.receiptReference(t,company(c),String(q.params.operationId))));
 router.use((error:any,_req:Request,res:Response,_next:any)=>res.status(error?.type==='entity.too.large'?413:400).json({error:{code:'INVALID_GOVERNANCE_BODY'}}));
 app.use('/api/v2',router);
}
