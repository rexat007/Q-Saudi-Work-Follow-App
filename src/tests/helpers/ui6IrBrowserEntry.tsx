import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {OutboxDrawer} from '../../components/offline/OutboxDrawer';
import {I18nProvider,type Locale} from '../../i18n';
import {outboxService} from '../../services/offline/outbox.service';
const fixture=(window as any).ui6;
function Harness(){const[open,setOpen]=useState(false);return <I18nProvider initialLocale={new URLSearchParams(location.search).get('locale') as Locale}><button id="open" onClick={()=>setOpen(true)}>Open owned test drawer</button><OutboxDrawer isOpen={open} onClose={()=>setOpen(false)} onNotification={n=>fixture.notices.push(n)}/></I18nProvider>}
async function start(){await outboxService.queueOperation({operationId:'owned-arrival',projectId:'P1',userId:'actor',operationType:'UPDATE_TRIP_STATUS',payload:{tripId:'T1',status:'AT_DESTINATION'}});await outboxService.queueOperation({operationId:'owned-exception',projectId:'P1',userId:'actor',operationType:'REPORT_EXCEPTION',payload:{tripId:'T2',exceptionId:'EX-1',type:'ROUTE_DEVIATION',severity:'MEDIUM',descriptionAr:'استثناء اختباري مملوك',descriptionEn:'Owned synthetic exception'}});fixture.operations=()=>outboxService.getOperations();createRoot(document.getElementById('root')!).render(<Harness/>)}
void start();
