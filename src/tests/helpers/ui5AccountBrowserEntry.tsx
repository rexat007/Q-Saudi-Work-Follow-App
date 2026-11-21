import React from 'react';
import {createRoot} from 'react-dom/client';
import {I18nProvider,type Locale} from '../../i18n';
import {AdminConsoleView} from '../../components/admin/AdminConsoleView';
const w=window as any;
w.ui5={listeners:new Set(),reads:{users:0,projects:0,audit:0,server:0},commands:[],failUsers:false,failProjects:false,failAudit:false,failReadback:false,commandMode:'OK',identity:{user:{uid:'actor'},userProfile:{userId:'actor',role:'SUPER_ADMIN',status:'ACTIVE',isActive:true,assignedProjectIds:['P1','P2']},isAuthReady:true,isProfileLoading:false,profileAuthority:'AVAILABLE'},users:[{userId:'TARGET',fullName:'مستخدم اختباري — Synthetic pending account — آزمائشی اکاؤنٹ',email:'synthetic.long.account.review@example.invalid',role:'VIEWER',requestedRole:'DRIVER',assignedProjectIds:['P1'],status:'PENDING_APPROVAL',isActive:false},{userId:'SECOND',fullName:'Second synthetic account',email:'second@example.invalid',role:'VIEWER',assignedProjectIds:['P1'],status:'ACTIVE',isActive:true}]};
w.ui5.changeRole=(role:string)=>{w.ui5.identity={...w.ui5.identity,userProfile:{...w.ui5.identity.userProfile,role}};w.ui5.listeners.forEach((cb:()=>void)=>cb());};
const locale=(new URLSearchParams(location.search).get('locale')||'ar') as Locale;
createRoot(document.getElementById('root')!).render(<I18nProvider initialLocale={locale}><main className="min-h-screen min-w-0 bg-stone-950 p-3 text-stone-100"><AdminConsoleView/></main></I18nProvider>);
