import {AdminConsoleView} from '../components/admin/AdminConsoleView';
import React,{useEffect,useMemo,useState,useSyncExternalStore} from 'react';
import {Sidebar} from '../components/navigation/Sidebar';
import {AccountStatusGate} from '../components/auth/AccountStatusGate';
import {ProjectSetupWizard} from '../components/wizard/ProjectSetupWizard';
import {FieldOperationsView} from '../components/field/FieldOperationsView';
import {SqlJournalPanel} from '../components/offline/SqlJournalPanel';
import {useAuth} from '../firebase/authContext';
import {NAV_ITEMS_REGISTRY,type NavTabId} from '../services/navigation.service';
import type {SqlCommercialRole} from '../types/sqlGovernance';
import type {RuntimeClientComposition} from '../services/runtimeClient.service';
import {SqlUiSession,sqlActive} from './sqlUiSession';
import {useSqlText} from '../i18n/sqlRuntime';
export function sqlNavigation(roles:SqlCommercialRole[],administerAccounts=false){return NAV_ITEMS_REGISTRY.filter(tab=>(tab.isPrimary||tab.id==='ADMIN_CONSOLE'&&administerAccounts)&&(roles.some(role=>tab.allowedRoles.includes(role as any))||tab.id==='WIZARD'&&roles.includes('COMPANY_ADMIN')));}
/** The same App mounts existing consumer components with SQL ports, never the legacy effect tree. */
export function SqlApplicationSession({runtime}:{runtime:RuntimeClientComposition}){
 const ui=runtime.ui!,text=useSqlText(),{user,signOutUser}=useAuth(),session=useMemo(()=>new SqlUiSession({ui,coordinator:runtime.coordinator,companyId:runtime.companyId}),[runtime,ui]);
 const state=useSyncExternalStore(session.subscribe,session.snapshot),[tab,setTab]=useState<NavTabId>('WIZARD'),[collapsed,setCollapsed]=useState(false),[journal,setJournal]=useState(false);
 useEffect(()=>{session.start();const stop=ui.identity.subscribe(session.identityChanged),online=()=>{void session.refresh();};window.addEventListener('online',online);return()=>{stop();window.removeEventListener('online',online);session.dispose();};},[session,ui]);
 useEffect(()=>{setJournal(false);setTab('WIZARD');},[state.generation]);
 const roles=sqlActive(state.account)?state.account!.membership!.roles:[],tabs=sqlNavigation(roles,Boolean(state.account?.capabilities.administerAccounts)),activeTab=tabs.some(t=>t.id===tab)?tab:tabs[0]?.id;
 const navigate=async(next:NavTabId)=>{if(!tabs.some(t=>t.id===next))return;const id=state.project?.projectId;if(id&&next!=='ADMIN_CONSOLE')await session.selectProject(id);setTab(next);};
 const select=(id:string)=>{setTab('WIZARD');void session.selectProject(id);};
 const current=state.principal===ui.identity.current()?.uid&&state.principal===user?.uid;
 const account=state.account,membership=account?.membership?.status,status=account?.status==='SUSPENDED'||membership==='SUSPENDED'||membership==='ACCESS_REVOKED'?'SUSPENDED':account?.status==='REJECTED'||membership==='REJECTED'?'REJECTED':account?.status==='PENDING_APPROVAL'||membership==='PENDING_APPROVAL'?'PENDING_APPROVAL':sqlActive(account)?'ACTIVE':'NO_PROFILE';
 return <div className="h-screen overflow-hidden flex flex-col bg-[#0f1115] text-stone-200 font-sans" data-testid="sql-application">
  <header className="bg-[#0f1115] border-b-2 border-white/10 p-4 flex flex-wrap items-center gap-3"><strong>Q-Saudi Core</strong><label>{text('company')}<select data-testid="sql-company" value={state.company} onChange={e=>void session.refresh(e.target.value)}><option value={state.company}>{state.companies.find(c=>c.companyId===state.company)?.name||state.company}</option>{state.companies.filter(c=>c.companyId!==state.company).map(c=><option key={c.companyId} value={c.companyId}>{c.name||c.companyId} · {c.status}</option>)}</select></label>{state.companyCursor&&<button onClick={()=>void session.more('companies').catch(()=>{})}>{text('more')}</button>}
   <button data-testid="sql-refresh" onClick={()=>void session.refresh()}>{text('refresh')}</button><button onClick={()=>void signOutUser()}>{text('logout')}</button>
  </header>
  {!user?<AccountStatusGate key="signed-out" status="UNAUTHENTICATED"/>:!current||state.busy?<p role="status">{text('loading')}</p>:state.error&&!account?<section role="alert"><p>{text('unavailable')}</p><code>{state.error}</code></section>:state.missing||!sqlActive(account)?<div className="overflow-auto"><p role="status">{status==='SUSPENDED'&&account?.membership?.status==='ACCESS_REVOKED'?text('accessRevoked'):status}</p><AccountStatusGate key={state.principal+'/'+status} status={state.missing?'NO_PROFILE':status||'NO_PROFILE'} userName={account?.displayName||user.displayName||undefined} userEmail={account?.email||user.email||undefined} registration={p=>session.register(p)} rejectionReason={account?.membership?.rejectionReason} onRefresh={()=>void session.refresh()}/></div>:<div className="flex flex-1 overflow-hidden">
   <Sidebar activeTab={activeTab||'WIZARD'} onSelectTab={next=>void navigate(next)} sqlPresentation={{roles,tabs,canCreate:account!.capabilities.createProject,displayName:account!.displayName||account!.principal}} projects={state.projects.map(p=>({projectId:p.projectId,nameAr:p.displayName,status:p.status}))} selectedProjectId={state.project?.projectId||''} setSelectedProjectId={select} onOpenSystemTools={()=>{}} isCollapsed={collapsed} setIsCollapsed={setCollapsed}/>
   <main className="flex-1 overflow-auto p-4 sm:p-6 industrial-dot-matrix space-y-4"><p data-testid="sql-current-roles">{text('scope')}: {roles.join(', ')}</p><nav className="flex flex-wrap gap-2">{tabs.map(item=><button key={item.id} data-testid={'sql-nav-'+item.id} onClick={()=>void navigate(item.id)}>{item.titleEn}</button>)}</nav>
    <label>{text('projects')}<select data-testid="sql-project" value={state.project?.projectId||''} onChange={e=>select(e.target.value)}><option value="">{text('noProject')}</option>{state.projects.map(p=><option key={p.projectId} value={p.projectId}>{p.displayName} · {p.status}</option>)}</select></label>{state.projectCursor&&<button onClick={()=>void session.more('projects').catch(()=>{})}>{text('more')}</button>}
    {account!.capabilities.createProject&&<button data-testid="sql-new-project" onClick={()=>select('')}>{text('newProject')}</button>}
    {state.error&&<p role="alert"><code>{state.error}</code></p>}{state.pendingOperation&&<div role="status"><code>{state.pendingOperation}</code><button data-testid="sql-governance-receipt" onClick={()=>void session.recoverCommand().catch(()=>{})}>{text('status')}</button></div>}
    {activeTab==='WIZARD'?<ProjectSetupWizard key={state.generation} sql={session}/>:activeTab==='ADMIN_CONSOLE'?<AdminConsoleView key={state.generation} sql={session}/>:!state.project?<p>{text('noProject')}</p>:activeTab==='FIELD_OPERATIONS'?<FieldOperationsView key={state.generation} sql={session}/>:<section role="status">{text('blockedReports')}</section>}
    {state.project&&state.offlineReady&&<button data-testid="sql-journal" onClick={()=>setJournal(true)}>{text('journal')}</button>}
   </main>{journal&&state.offlineReady&&<SqlJournalPanel key={state.generation} runtime={runtime} onClose={()=>setJournal(false)}/>}
  </div>}
 </div>;
}
