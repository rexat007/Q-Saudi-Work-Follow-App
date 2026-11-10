import React,{useEffect,useState} from 'react';
import {ShieldCheck,Users} from 'lucide-react';
import type {SqlUiSession} from '../../runtime/sqlUiSession';
import {sqlCode} from '../../runtime/sqlUiSession';
import {GOVERNANCE_ROLES,type SqlAccountDto} from '../../types/sqlGovernance';
import {useSqlText} from '../../i18n/sqlRuntime';
/** Existing console's SQL account consumer. Partial account DTOs never become legacy UserEntities. */
export function SqlAccountAdministration({session}:{session:SqlUiSession}){
 const text=useSqlText(),[accounts,setAccounts]=useState<SqlAccountDto[]>([]),[next,setNext]=useState<string|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[readRequired,setReadRequired]=useState(false);
 const load=async(cursor?:string)=>{const p=await session.accounts(cursor);setAccounts(p.items);setNext(p.nextCursor);setReadRequired(false);};
 useEffect(()=>{let current=true;void session.accounts().then(p=>{if(current){setAccounts(p.items);setNext(p.nextCursor);}},e=>{if(current)setError(sqlCode(e));});return()=>{current=false;};},[session]);
 const run=async(work:()=>Promise<unknown>)=>{if(busy)return;setBusy(true);setError('');try{await work();}catch(e){setError(sqlCode(e));setReadRequired(true);}finally{setBusy(false);}};
 const action=(account:SqlAccountDto,command:string,payload:Record<string,unknown>)=>run(async()=>{const next=await session.accountCommand(account,command,payload);setAccounts(rows=>rows.map(row=>row.principal===next.principal?next:row));});
 if(!session.snapshot().account?.capabilities.administerAccounts)return <p role="alert">FORBIDDEN_GOVERNANCE_COMMAND</p>;
 return <section className="space-y-6" data-testid="sql-account-admin"><h1 className="text-xl font-bold flex items-center gap-2"><ShieldCheck/>{text('accounts')}</h1><button data-testid="sql-accounts-refresh" disabled={busy} onClick={()=>void run(()=>load())}>{text('refresh')}</button>{error&&<p role="alert">{error}</p>}{readRequired&&<p role="status">{text('readRequired')}</p>}
  <div className="space-y-4">{accounts.map(account=><AccountRow key={account.principal} account={account} self={account.principal===session.snapshot().principal} disabled={busy||readRequired} onCommand={(command,payload)=>action(account,command,payload)}/>)}</div>{next&&<button disabled={busy} onClick={()=>void run(()=>load(next))}>{text('more')}</button>}
 </section>;
}
function AccountRow({account,self,disabled,onCommand}:{account:SqlAccountDto;self:boolean;disabled:boolean;onCommand:(command:string,payload:Record<string,unknown>)=>Promise<void>}){
 const text=useSqlText(),[role,setRole]=useState('VIEWER'),[reason,setReason]=useState(''),[projects,setProjects]=useState(''),[replace,setReplace]=useState(false),[driver,setDriver]=useState(''),m=account.membership,ids=projects.split(',').map(v=>v.trim()).filter(Boolean),status=m?.status;
 return <section className="rounded-xl border border-stone-800 bg-stone-950 p-4 space-y-3" data-account-principal={account.principal}><h2 className="font-bold flex items-center gap-2"><Users/>{account.displayName||account.principal}</h2><p>{account.email}</p><p>{account.status} · {status} · {m?.roles.join(', ')||'—'} · {m?.assignedProjectCount??0}</p><code>{account.principal}</code>
  {!self&&<fieldset disabled={disabled} className="flex flex-wrap gap-3"><label>{text('role')}<select data-testid="sql-admin-role" value={role} onChange={e=>setRole(e.target.value)}>{GOVERNANCE_ROLES.map(role=><option key={role}>{role}</option>)}</select></label><label>{text('assignments')}<input value={projects} onChange={e=>setProjects(e.target.value)}/></label>
   {status==='PENDING_APPROVAL'&&<><button data-testid="sql-admin-approve" onClick={()=>void onCommand('approveAccount',{approvedRole:role,assignedProjectIds:ids})}>{text('approve')}</button><label>{text('reason')}<input data-testid="sql-admin-reason" value={reason} onChange={e=>setReason(e.target.value)}/></label><button data-testid="sql-admin-reject" disabled={!reason.trim()} onClick={()=>void onCommand('rejectAccount',{rejectionReason:reason.trim()})}>{text('reject')}</button></>}
   {status==='ACTIVE'&&<button onClick={()=>void onCommand('suspendAccount',{})}>{text('suspend')}</button>}{['SUSPENDED','REJECTED'].includes(status||'')&&<button onClick={()=>void onCommand('reactivateAccount',{})}>{text('reactivate')}</button>}
   {status!=='PENDING_APPROVAL'&&<button onClick={()=>void onCommand('changeUserRole',{newRole:role})}>{text('changeRole')}</button>}
   {status==='ACTIVE'&&<><label><input type="checkbox" checked={replace} onChange={e=>setReplace(e.target.checked)}/>{text('replaceAssignments')}</label><button disabled={!replace} onClick={()=>void onCommand('replaceAssignedProjects',{assignedProjectIds:ids})}>{text('replaceAssignments')}</button></>}
   {m?.roles.length===1&&m.roles[0]==='DRIVER'&&<><label>{text('driverIdentity')}<input value={driver} onChange={e=>setDriver(e.target.value)}/></label><button disabled={!driver} onClick={()=>void onCommand('linkDriverIdentity',{linkedDriverId:driver})}>{text('linkDriver')}</button>{m.linkedDriverId&&<button onClick={()=>void onCommand('unlinkDriverIdentity',{})}>{text('unlinkDriver')}</button>}</>}
  </fieldset>}
 </section>;
}
