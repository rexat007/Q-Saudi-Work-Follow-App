import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {I18nProvider,type Locale} from '../../i18n';
import {ReportsEngineView} from '../../components/reports/ReportsEngineView';
import {reportsEngineService} from '../../services/reportsEngine.service';
import {reportTrips} from './ui4ReportFixture';
const w=window as any;
w.ui4={listeners:new Set(),reads:[],projectReads:0,refreshes:[],refreshMode:'SUCCESS',data:reportTrips(),identity:{user:{uid:'A'},userProfile:{userId:'A',role:'SUPER_ADMIN',status:'ACTIVE',isActive:true,assignedProjectIds:['P1']},isAuthReady:true,isProfileLoading:false,profileAuthority:'AVAILABLE'}};
w.ui4.changeRole=(role:string,uid='A',assigned=['P1'])=>{w.ui4.identity={...w.ui4.identity,user:{uid},userProfile:{...w.ui4.identity.userProfile,userId:uid,role,assignedProjectIds:assigned}};w.ui4.listeners.forEach((fn:()=>void)=>fn());};
const csv=reportsEngineService.exportToCSV.bind(reportsEngineService),excel=reportsEngineService.exportToXLSX.bind(reportsEngineService);
reportsEngineService.exportToCSV=dataset=>{w.ui4.csvDataset=structuredClone(dataset);csv(dataset);};reportsEngineService.exportToXLSX=dataset=>{w.ui4.excelDataset=structuredClone(dataset);excel(dataset);};
function Fixture(){const [project,setProject]=useState('P1'),[config,setConfig]=useState(w.ui4.data[0].operationalSnapshot.configuration);w.ui4.setProject=setProject;w.ui4.setProfile=(profile:string)=>{w.ui4.data=reportTrips(['DUAL_WEIGHBRIDGE','LOADING_SCALE_ONLY'].includes(profile)?'WEIGHBRIDGE':'NONE',['DUAL_WEIGHBRIDGE','UNLOADING_SCALE_ONLY'].includes(profile)?'WEIGHBRIDGE':'NONE');setConfig(w.ui4.data[0].operationalSnapshot.configuration);};return <main className="min-h-screen min-w-0 bg-stone-950 p-3 text-stone-100"><ReportsEngineView operationalProjectId={project} operationalConfiguration={config}/></main>;}
const locale=(new URLSearchParams(location.search).get('locale')||'ar') as Locale;
createRoot(document.getElementById('root')!).render(<I18nProvider initialLocale={locale}><Fixture/></I18nProvider>);
