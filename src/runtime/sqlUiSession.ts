import type {SqlUiState,SqlUiDependencies} from '../types/sqlUi';
import type {SqlProjectDto,SqlAccountDto,GovernancePage} from '../types/sqlGovernance';
export const sqlActive=(a:SqlAccountDto|null)=>a?.status==='ACTIVE'&&a.membership?.status==='ACTIVE'&&a.membership.roles.length>0;
export const sqlCode=(e:any)=>e?.code||e?.message||'SQL_AUTHORITY_UNAVAILABLE';
/** One mounted consumer lifetime. Company, principal, epoch and project switches cancel acknowledgements. */
export class SqlUiSession {
 private generation=0;private abort=new AbortController();private listeners=new Set<()=>void>();private stopped=false;private paging=false;private pending:{principal:string;company:string;project:string|undefined;binding:string;envelope:import('../types/sqlGovernance').GovernanceEnvelope}|null=null;
 private state:SqlUiState;
 constructor(readonly deps:SqlUiDependencies){if((deps.ui.client.epoch.backendEpoch!==deps.ui.epoch.backendEpoch||deps.ui.client.epoch.epochRevision!==deps.ui.epoch.epochRevision)||deps.ui.client.identity!==deps.ui.identity)throw Error('TRUSTED_SQL_UI_DEPENDENCIES_REQUIRED');this.state={...this.empty(deps.companyId),busy:Boolean(deps.ui.identity.current())};}
 private empty(company:string):SqlUiState{return {generation:this.generation,principal:this.deps.ui.identity.current()?.uid||null,company,account:null,missing:false,busy:false,error:'',companies:[],companyCursor:null,projects:[],projectCursor:null,project:null,offlineReady:false,pendingOperation:this.pending?.envelope.operationId};}
 snapshot=()=>this.state;
 subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
 private emit(patch:Partial<SqlUiState>){this.state={...this.state,...patch,generation:this.generation};for(const fn of this.listeners)fn();}
 private reset(company=this.state.company){if(this.state.principal!==this.deps.ui.identity.current()?.uid||company!==this.state.company)this.pending=null;this.generation++;this.deps.ui.client.invalidate();this.abort.abort();this.abort=new AbortController();void this.deps.coordinator.exit();this.state=this.empty(company);this.emit({});return this.generation;}
 current(generation:number){return !this.stopped&&generation===this.generation&&this.state.principal===this.deps.ui.identity.current()?.uid;}
 private assertCurrent(){if(!this.current(this.generation))throw Error('SQL_CONTEXT_CHANGED');}
 private async guard<T>(work:Promise<T>,generation=this.generation){try{const value=await work;if(!this.current(generation))throw Error('SQL_CONTEXT_CHANGED');return value;}catch(e){if(this.current(generation))this.denied(e);throw e;}}
 private page<T>(p:GovernancePage<T>){const e=this.deps.ui.epoch;if(p.backendEpoch!==e.backendEpoch||p.epochRevision!==e.epochRevision||p.items.length>50)throw Error('SQL_PAGE_UNVERIFIED');return p;}
 private account(a:SqlAccountDto){if(a.principal!==this.state.principal)throw Error('SQL_PRINCIPAL_MISMATCH');return a;}
 private denied(e:any){if(([401,403].includes(e?.status)||e?.status===404&&e?.code==='PROJECT_NOT_FOUND')){this.pending=null;this.reset();this.emit({error:sqlCode(e)});}}
 async refresh(company=this.state.company){const g=this.reset(company);if(!this.state.principal)return;this.emit({busy:true});
  try{const a=this.account(await this.guard(this.deps.ui.client.governance.account(company),g));this.emit({account:a});
   if(['ACTIVE','PENDING_APPROVAL'].includes(a.status)){const companies=this.page(await this.guard(this.deps.ui.client.governance.companies(undefined,50),g));this.emit({companies:companies.items,companyCursor:companies.nextCursor});}
   if(sqlActive(a)){const projects=this.page(await this.guard(this.deps.ui.client.governance.projects(company,undefined,50),g));this.emit({projects:projects.items,projectCursor:projects.nextCursor});}
  }catch(e:any){if(this.current(g))this.emit(e.code==='USER_NOT_REGISTERED'?{missing:true}:{account:null,projects:[],project:null,error:sqlCode(e)});}
  finally{if(this.current(g))this.emit({busy:false});}
 }
 async more(kind:'companies'|'projects'){if(this.paging)return;this.paging=true;const g=this.generation,s=this.state,cursor=kind==='companies'?s.companyCursor:s.projectCursor;if(!cursor){this.paging=false;return;}
  try{if(kind==='companies'){const p=this.page(await this.guard(this.deps.ui.client.governance.companies(cursor,50),g));this.emit({companies:p.items,companyCursor:p.nextCursor});}else{const p=this.page(await this.guard(this.deps.ui.client.governance.projects(s.company,cursor,50),g));this.emit({projects:p.items,projectCursor:p.nextCursor});}}
  catch(e){this.denied(e);this.emit({error:sqlCode(e)});throw e;}finally{this.paging=false;}
 }
 async accounts(cursor?:string){this.assertCurrent();if(!this.state.account?.capabilities.administerAccounts)throw Error('FORBIDDEN_GOVERNANCE_COMMAND');return this.page(await this.guard(this.deps.ui.client.governance.accounts(this.state.company,cursor,50)));}
 async accountCommand(target:SqlAccountDto,command:string,payload:Record<string,unknown>){this.assertCurrent();if(!this.state.account?.capabilities.administerAccounts)throw Error('FORBIDDEN_GOVERNANCE_COMMAND');const revision=Number(target.membership?.revision||0);if(!Number.isSafeInteger(revision))throw Error('AUTHORITATIVE_REVISION_REQUIRED');return this.guard(this.deps.ui.client.governance.accountCommand(this.state.company,target.principal,{operationId:crypto.randomUUID(),expectedRevision:revision,...this.deps.ui.epoch,command,payload}));}
 async register(payload:Record<string,unknown>){this.assertCurrent();const g=this.generation;await this.guard(this.deps.ui.client.governance.register(this.state.company,{operationId:crypto.randomUUID(),expectedRevision:0,...this.deps.ui.epoch,command:'REGISTER',payload}),g);await this.refresh();}
 async selectProject(id:string){const previous=this.state,g=this.reset(previous.company);this.emit({account:previous.account,companies:previous.companies,companyCursor:previous.companyCursor,projects:previous.projects,projectCursor:previous.projectCursor,busy:true});
  if(!id){this.emit({busy:false});return;}
  try{const a=this.account(await this.guard(this.deps.ui.client.governance.account(previous.company),g));if(!sqlActive(a))throw Object.assign(Error('ACCOUNT_NOT_ACTIVE'),{code:'ACCOUNT_NOT_ACTIVE',status:403});
   const p=await this.guard(this.deps.ui.client.governance.project(previous.company,id),g);if(p.projectId!==id)throw Error('SQL_PROJECT_UNVERIFIED');this.emit({account:a,project:p});
   try{const context=await this.deps.coordinator.enter(previous.company,id);if(!this.current(g))throw Error('SQL_CONTEXT_CHANGED');void context;const scope=this.deps.coordinator.currentScope();if(scope.backendEpoch!==this.deps.ui.epoch.backendEpoch||scope.epochRevision!==this.deps.ui.epoch.epochRevision)throw Error('BACKEND_EPOCH_MISMATCH');this.emit({offlineReady:true});}catch(e){if(this.current(g))this.emit({offlineReady:false,error:sqlCode(e)});}
  }catch(e){if(this.current(g)){this.reset(previous.company);this.emit({error:sqlCode(e)});}}
  finally{if(this.current(g))this.emit({busy:false});}
 }
 async command(command:string,payload:Record<string,unknown>,create=false){this.assertCurrent();const s=this.state,g=this.generation,p=s.project;if(!sqlActive(s.account)||!create&&!p)throw Error('SQL_CONTEXT_REQUIRED');
  const revision=create?0:Number(p!.revision);if(!Number.isSafeInteger(revision))throw Error('AUTHORITATIVE_REVISION_REQUIRED');
  const binding=JSON.stringify([s.principal,s.company,create?null:p!.projectId,command,payload]);
  if(this.pending){if(this.pending.binding!==binding)throw Error('GOVERNANCE_RESULT_REVIEW_REQUIRED');return this.recoverCommand();}
  this.pending={principal:s.principal!,company:s.company,project:create?undefined:p!.projectId,binding,envelope:{operationId:crypto.randomUUID(),expectedRevision:revision,...this.deps.ui.epoch,command,payload:structuredClone(payload)}};
  try{const result=await this.guard(this.deps.ui.client.governance.projectCommand(s.company,this.pending.project,this.pending.envelope),g);this.pending=null;this.emit({pendingOperation:undefined});await this.selectProject(result.projectId);return result;}catch(e:any){if(this.current(g)&&e.status>=400&&e.status<500)this.pending=null;if(this.current(g))this.emit({pendingOperation:this.pending?.envelope.operationId});this.denied(e);throw e;}
 }
 async recoverCommand(){this.assertCurrent();const pending=this.pending,g=this.generation;if(!pending||pending.principal!==this.state.principal||pending.company!==this.state.company)throw Error('GOVERNANCE_RESULT_REVIEW_REQUIRED');
  try{const result=await this.guard(this.deps.ui.client.governance.projectOperationResult(pending.company,pending.envelope.operationId),g);if(result.state!=='COMMITTED'||result.resendAuthorized!==false)throw Error('GOVERNANCE_RECEIPT_UNVERIFIED');this.pending=null;this.emit({pendingOperation:undefined});await this.selectProject(result.project.projectId);return result.project;}catch(e:any){if(this.current(g))this.emit({error:e.code==='GOVERNANCE_RECEIPT_NOT_FOUND'?'UNKNOWN_RECEIPT_REVIEW_REQUIRED':sqlCode(e)});throw e;}

 }
 async assess(configuration:unknown,expectedRevision:number){this.assertCurrent();const s=this.state;if(!s.project)throw Error('SQL_CONTEXT_REQUIRED');return this.guard(this.deps.ui.client.governance.assess(s.company,s.project.projectId,{configuration,expectedRevision}));}
 async request<T=any>(path:string,body?:unknown):Promise<T>{this.assertCurrent();const s=this.state,g=this.generation;if(!sqlActive(s.account)||!s.project)throw Error('SQL_CONTEXT_REQUIRED');
  try{return await this.guard(this.deps.ui.client.request<T>(s.company,'/api/v2/projects/'+encodeURIComponent(s.project.projectId)+path,this.abort.signal,body),g);}catch(e){this.denied(e);throw e;}
 }
 async readiness(){this.assertCurrent();const s=this.state;if(!s.project)throw Error('SQL_CONTEXT_REQUIRED');return this.guard(this.deps.ui.client.governance.readiness(s.company,s.project.projectId));}
 async queue(command:string,payload:Record<string,unknown>,revision:number){this.assertCurrent();if(!this.state.offlineReady)throw Error('OFFLINE_CONTEXT_UNAVAILABLE');const g=this.generation,op=await this.guard(this.deps.coordinator.enqueue('TRIP',command,payload,revision),g);await this.guard(this.deps.coordinator.wake(),g);return op;}
 start(){this.stopped=false;void this.refresh();}
 identityChanged=()=>{void this.refresh();};
 dispose(){this.pending=null;this.stopped=true;this.reset();this.listeners.clear();}
}
