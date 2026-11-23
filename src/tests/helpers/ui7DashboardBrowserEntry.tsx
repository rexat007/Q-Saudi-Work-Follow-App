import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {OperationsDashboardView} from '../../components/dashboard/OperationsDashboardView';
import {I18nProvider,type Locale} from '../../i18n';
import {indexedDBService} from '../../services/offline/indexedDB.service';
import {auth} from '../../firebase/config';
const f:any=(window as any).ui7={failTrips:false};
indexedDBService.setPrincipalProvider(()=>auth.currentUser?.uid||null);
const original=indexedDBService.getAll.bind(indexedDBService);indexedDBService.getAll=async<T,>(store:string):Promise<T[]>=>{if(store==='trips'&&f.failTrips)throw Error('owned-trip-read');return await original(store) as T[]};
f.clearProjects=()=>indexedDBService.clear('projects');
function Harness(){const[available,setAvailable]=useState(true);f.profile=(value:boolean)=>setAvailable(value);return <I18nProvider initialLocale={new URLSearchParams(location.search).get('locale') as Locale}><OperationsDashboardView authContext={{userId:'A',role:'PROJECT_ADMIN',assignedProjectIds:['P1','P2'],email:'owned@example.invalid',displayName:'Owned operator'}} profileAvailable={available}/></I18nProvider>}
async function start(){for(const id of ['P1','P2'])await indexedDBService.put('projects',{projectId:id,nameAr:'Owned '+id,status:'ACTIVE'},'A');await indexedDBService.put('trips',{tripId:'T1',projectId:'P1',tripSerial:'OWNED-TRIP',ticketId:'WB-1',truckId:'TK-1',driverId:'D-1',carrierId:'C-1',materialId:'M-1',shiftDate:'2026-11-23',netWeight:20000,destNetWeight:null,settlementAmount:200,pricingType:'PER_TON',currency:'SAR',status:'IN_TRANSIT',loadTime:'2026-11-23T00:00:00Z'},'A');createRoot(document.getElementById('root')!).render(<Harness/>)}
void start();
