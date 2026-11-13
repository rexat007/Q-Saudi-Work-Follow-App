import React from 'react';
import {createRoot} from 'react-dom/client';
import {I18nProvider} from '../../i18n';
import type {Locale} from '../../i18n';
import {AdaptiveOperationsView} from '../../components/field/AdaptiveOperationsView';
import {OpenProjectOperations} from '../../components/wizard/OpenProjectOperations';
const w=window as any;
const configuration={schemaVersion:1,loadingMeasurementMode:'NONE',unloadingMeasurementMode:'NONE',driverIntakeMode:'PRELOADED_ROSTER',routeConfiguration:{loadingLocation:'A',unloadingLocation:'B'},capacityEstimationPolicy:{mode:'NONE'},shiftConfiguration:{mode:'NONE'}};
const project:any={projectId:'SYNTHETIC-PROJECT',nameAr:'مشروع اختبار الواجهة',status:'ACTIVE',operationalConfiguration:configuration};
const actor:any={userId:'SYNTHETIC-OWNER',role:'PROJECT_ADMIN',assignedProjectIds:[project.projectId],displayName:'',email:''};
const row={projectId:project.projectId,truckId:'TRUCK',plateNumber:'ABC123',carrierId:'CARRIER',carrierName:'ناقل اختباري',materialId:'MATERIAL',materialName:'مادة اختبارية',driverId:'DRIVER',driverName:'سائق اختباري',classification:'OPERATIONAL',integrityIssues:[]};
const trip={projectId:project.projectId,tripId:'CANONICAL-TRIP',driverId:'DRIVER',tripNumber:'SERVER-123',status:'DISPATCHED',version:1,weights:{},financials:{isFinalized:false},truckSnapshot:{plateNumberAr:'ABC123'},driverSnapshot:{fullNameAr:'سائق اختباري'},operationalSnapshot:{configuration,configurationVersion:1,profile:'NO_WEIGHBRIDGE'},operationalTimeline:{}};
w.ui1={project,row,trip,operations:[],listener:()=>{},sendCalls:0,recoverCalls:0,opened:null,
 fleet:async()=>({projectId:project.projectId,rows:[row,{...row,truckId:'NO-DRIVER',plateNumber:'DEF456',driverId:null,driverName:null}]}),
 pricing:async()=>[{projectId:project.projectId,pricingRuleId:'RULE',carrierId:'CARRIER',materialId:'MATERIAL',status:'ACTIVE',pricingModel:'PER_TRIP',baseRateSAR:10,effectiveFrom:'2020-01-01',effectiveTo:'2099-01-01'}],
 send:async()=>{w.ui1.sendCalls++;w.ui1.operations=[{operationId:'ORIGINAL-OPERATION',userId:actor.userId,projectId:project.projectId,operationType:'TRIP_COMMAND',status:'AWAITING_RECEIPT',payload:{command:'DISPATCH_TRIP',payload:{truckId:'TRUCK'}}}];w.ui1.listener();throw Object.assign(Error('RECEIPT_REQUIRED'),{code:'RECEIPT_REQUIRED'});},
 recover:async(op:any)=>{if(op.operationId!=='ORIGINAL-OPERATION')throw Error('REPLACEMENT_FORBIDDEN');w.ui1.recoverCalls++;w.ui1.operations=[];w.ui1.listener();return {trip,operationId:op.operationId};}};
const locale=(new URLSearchParams(location.search).get('locale')||'ar') as Locale;
createRoot(document.getElementById('root')!).render(<I18nProvider initialLocale={locale}><main className="min-h-screen min-w-0 bg-[#0f1115] p-4 text-stone-100 font-sans"><OpenProjectOperations project={project} actor={actor} ready onOpen={id=>{w.ui1.opened=id;}}/><AdaptiveOperationsView project={project} authContext={actor}/></main></I18nProvider>);
