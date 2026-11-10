import {SqlImmutableImportSourceStore} from '../src/db/sqlImportSourceStore';
import {SqlGovernanceAuthority} from '../src/db/governanceAuthority';
import {registerSqlGovernanceRoutes} from './sqlGovernanceRoutes';
import {readFirestoreAuthority} from '../src/runtime/firestoreAuthority.server';
import {SqlRuntimeReadinessAuthority} from '../src/db/runtimeReadinessAuthority';
import type {ReadinessSource} from '../src/db/runtimeReconciliation';
import express,{type Express} from 'express';
import type {Pool} from 'pg';
import {SqlTemporalAuthority} from '../src/db/temporalAuthority';
import {SqlTripAuthority} from '../src/db/tripAuthority';
import {SqlImportAuthority} from '../src/db/importAuthority';
import {SqlTripImportAuthority} from '../src/db/tripImportAuthority';
import {SqlOfflineRecoveryAuthority} from '../src/db/offlineRecoveryAuthority';
import {SqlProjectReadAuthority} from '../src/db/projectReadAuthority';
import type {SqlAuthorityDependencies} from '../src/db/canonicalAuthority';
import type {ImportSourceStore} from '../src/db/importArtifacts';
import {registerSqlOfflineRoutes} from './sqlOfflineRoutes';
import {registerSqlProjectReadRoutes} from './sqlProjectReadRoutes';
import {SQL_WORKSPACE_GATE} from './sqlWorkspaceComposition';
/** Registration is deliberately separate from activation. app.ts never calls this.
 * Caller must provide explicit least-privilege pools and an operator-established DB epoch.
 * No request/header/environment variable selects the canonical backend. */
export async function registerSqlRuntime(app:Express,options:{authorityDatabase:unknown;runtimePool:Pool;authPool:Pool;verifyToken:NonNullable<SqlAuthorityDependencies['verifyToken']>;sourceStore?:ImportSourceStore;cursorKey:Buffer;readinessSource?:ReadinessSource;epoch:Readonly<{backendEpoch:string;epochRevision:number}>;companyForToken:(token:string)=>Promise<string>}){
 const epoch=Object.freeze({...options.epoch});
 // Startup witness from the SAME operator-owned Firestore control used by legacy
 // HTTP/Rules/Admin transactions. DB arming alone cannot register a dual writer.
 // SQL requests then use the DB epoch; no new Google polling/dependency per request.
 const shared=await readFirestoreAuthority(options.authorityDatabase);
 if(shared.canonicalStore!=='postgres'||shared.phase!=='ACTIVE'||shared.backendEpoch!==epoch.backendEpoch||shared.epochRevision!==epoch.epochRevision)throw Error('CENTRAL_AUTHORITY_MISMATCH');
 const check=async()=>{const client=await options.runtimePool.connect();try{
  // One constant-size check preserves U04's composed 12-statement read budget.
  let state:any;try{state=(await client.query('SELECT session_user,current_user,s.*,qsa_governance_version() AS governance_version FROM qsa_read_runtime_state() s')).rows[0];}catch(e:any){if(e.code==='42883')throw Error('SQL_GOVERNANCE_AUTHORITY_REQUIRED');throw e;}if(state?.governance_version!==1)throw Error('SQL_GOVERNANCE_AUTHORITY_REQUIRED');if(state.session_user!=='qsa_runtime'||state.current_user!=='qsa_runtime')throw Error('DIRECT_RUNTIME_IDENTITY_REQUIRED');
  if(!state?.enforced||state.canonical_store!=='postgres'||state.backend_epoch!==epoch.backendEpoch||Number(state.epoch_revision)!==epoch.epochRevision)throw Error('SQL_RUNTIME_NOT_ARMED');
 }finally{client.release();}};
 await check();
 const deps={runtimePool:options.runtimePool,authPool:options.authPool,verifyToken:options.verifyToken,backendFence:epoch};
 const governance=new SqlGovernanceAuthority({...deps,cursorKey:options.cursorKey});
 const sourceStore=options.sourceStore??new SqlImmutableImportSourceStore();
 const canonical=new SqlTemporalAuthority(deps),trips=new SqlTripAuthority(deps),imports=new SqlImportAuthority({...deps,sourceStore}),tripImports=new SqlTripImportAuthority({...deps,sourceStore}),recovery=new SqlOfflineRecoveryAuthority(deps);
 const readiness=options.readinessSource?new SqlRuntimeReadinessAuthority(deps,options.readinessSource):null;
 const reads=new SqlProjectReadAuthority({...deps,backendEpoch:epoch.backendEpoch,cursorKey:options.cursorKey});
 app.use('/api/v2',async(req,res,next)=>{res.set('Cache-Control','private, no-store');
  // Compatibility proof only: headers never select the authoritative backend.
  if(!['GET','HEAD','OPTIONS'].includes(req.method)&&(req.header('X-Backend-Epoch')!==epoch.backendEpoch||req.header('X-Backend-Epoch-Revision')!==String(epoch.epochRevision)))return res.status(409).json({code:'BACKEND_EPOCH_MISMATCH'});
  try{await check();next();}catch{res.status(503).json({code:'SQL_RUNTIME_UNAVAILABLE'});}});
 // Existing methods reauthenticate and authorize scope inside each unit of work.
 registerSqlGovernanceRoutes(app,governance);
 registerSqlOfflineRoutes(app,{trips,imports,recovery,epoch,companyForToken:options.companyForToken});
 registerSqlProjectReadRoutes(app,reads);
 const router=express.Router();router.use(express.json({limit:'64kb'}));
 const command=(method:'create'|'setStatus'|'membership'|'affiliation'|'assignment'|'allocation')=>async(req:any,res:any)=>{try{
  const token=req.header('Authorization')?.match(/^Bearer (\S+)$/)?.[1];if(!token)return res.status(401).json({code:'AUTH_REQUIRED'});
  const companyId=await options.companyForToken(token);if(companyId!==req.header('X-Company-Id'))return res.status(403).json({code:'SCOPE_MISMATCH'});
  const value=await (canonical[method] as Function).call(canonical,token,{...req.body,companyId,projectId:String(req.params.projectId)});res.json(value);
 }catch(e:any){res.status(e.status||503).json({code:/^[A-Z_]+$/.test(e.code||'')?e.code:'SQL_AUTHORITY_UNAVAILABLE'});}};
 for(const [path,method] of [['identities','create'],['identity-status','setStatus'],['memberships','membership'],['affiliations','affiliation'],['assignments','assignment'],['allocations','allocation']] as const)router.post('/:projectId/'+path+'/commands',command(method));
 const readinessCommand=(advance:boolean)=>async(req:any,res:any)=>{try{if(!readiness)return res.status(503).json({code:'APPROVED_SOURCE_ADAPTER_REQUIRED'});const token=req.header('Authorization')?.match(/^Bearer (\S+)$/)?.[1];if(!token)return res.status(401).json({code:'AUTH_REQUIRED'});const scope={companyId:req.header('X-Company-Id')||'',projectId:String(req.params.projectId)};if(Object.keys(req.body||{}).some(k=>!['requestId','expectedVersion'].includes(k)))return res.status(400).json({code:'INVALID_READINESS_REQUEST'});res.json(advance?await readiness.advance(token,scope,String(req.params.runId),req.body.requestId,req.body.expectedVersion):await readiness.start(token,scope));}catch(e:any){res.status(e.status||503).json({code:/^[A-Z_]+$/.test(e.code||'')?e.code:'READINESS_UNAVAILABLE'});}};
 router.post('/:projectId/runtime-readiness/runs',readinessCommand(false));
 router.post('/:projectId/runtime-readiness/runs/:runId/advance',readinessCommand(true));
 router.get('/:projectId/workspace/runtime',async(req,res)=>{try{const token=req.header('Authorization')?.match(/^Bearer (\S+)$/)?.[1];if(!token)return res.status(401).json({code:'AUTH_REQUIRED'});await recovery.context(token,{companyId:req.header('X-Company-Id')||'',projectId:String(req.params.projectId)});res.status(503).json(SQL_WORKSPACE_GATE);}catch{res.status(403).json({code:'WORKSPACE_ACCESS_UNVERIFIED'});}});
 router.use((error:any,_req:any,res:any,_next:any)=>res.status(error?.type==='entity.too.large'?413:400).json({code:'INVALID_SQL_COMMAND_BODY'}));
 app.use('/api/v2/projects',router);
 // Trip imports retain the full U05 internal service, not a generic client receipt rewrite.
 return Object.freeze({governance,canonical,trips,imports,tripImports,recovery,reads,readiness,epoch,workspace:SQL_WORKSPACE_GATE,capabilities:Object.freeze({canonicalCommands:'COMPOSED',temporalCommands:'COMPOSED',tripCommands:'COMPOSED',rosterImports:'COMPOSED',tripImports:'SERVER_SERVICE_ONLY',boundedProjectReads:'COMPOSED',offlineRecovery:'COMPOSED',projectGovernance:'COMPOSED_RB1',accountProfilePresentation:'COMPOSED_RB1_PAGED_PORTS',workspace:'BLOCKED_U08_ADAPTER'})});
}
