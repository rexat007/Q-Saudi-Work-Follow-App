import React,{useEffect,useState} from 'react';
import type {ProjectEntity} from '../../types/entities';
import type {OperationalConfiguration,OperationalCheckpoint,OperationalImpactAssessment} from '../../types/operationalProfile';
import {validateOperationalConfiguration} from '../../services/operationalProfileResolver';
import {projectService} from '../../services/project.service';
import {useI18n} from '../../i18n';
const empty:OperationalConfiguration={schemaVersion:1,loadingMeasurementMode:'WEIGHBRIDGE',unloadingMeasurementMode:'WEIGHBRIDGE',driverIntakeMode:'MIXED',routeConfiguration:{loadingLocation:'',unloadingLocation:''},capacityEstimationPolicy:{mode:'NONE'},shiftConfiguration:{mode:'NONE'},requiredCheckpoints:[]};
export function OperationalConfigurationForm({project,canEdit,onSaved}:{project:ProjectEntity;canEdit:boolean;onSaved?:(project:ProjectEntity)=>void}){
 const {t}=useI18n(),[config,setConfig]=useState<OperationalConfiguration>(()=>structuredClone(project.operationalConfiguration||empty)),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[errorNotice,setErrorNotice]=useState(''),[ack,setAck]=useState(false),[assessment,setAssessment]=useState<OperationalImpactAssessment|null>(null);
 useEffect(()=>{setConfig(structuredClone(project.operationalConfiguration||empty));setNotice('');setErrorNotice('');setAck(false);setAssessment(null);},[project.projectId,project.version]);
 const select=(label:string,value:string,values:string[],change:(value:string)=>void)=><label className="block space-y-1">{t(`op.${label}`)}<select disabled={!canEdit||busy} className="block bg-stone-900 border rounded p-2 w-full" value={value} onChange={e=>change(e.target.value)}>{values.map(v=><option key={v} value={v}>{t(`op.${v}`)}</option>)}</select></label>;
 const route=config.routeConfiguration;
 async function save(){
   setBusy(true);setNotice('');setErrorNotice('');setAssessment(null);
   try{
     const valid=validateOperationalConfiguration(config);
     if(project.operationalConfiguration&&JSON.stringify(project.operationalConfiguration)===JSON.stringify(valid)){
       setNotice('op.no_change');return;
     }
     if(typeof projectService.assessOperationalImpact==='function'){
       const res=await projectService.assessOperationalImpact(project.projectId,valid,project.version||0);
       if(res.decision==='NO_CHANGE'){setNotice('op.no_change');return;}
       if(res.decision==='BLOCKED'){
         const code=res.reasons[0]||'save_failed';
         setErrorNotice(`op.${code}`);return;
       }
       if(res.decision==='REVIEW_REQUIRED'){
         setAssessment(res);return;
       }
       const saved=await projectService.configureOperations(project.projectId,valid,project.version||0,ack,res.assessmentSignature);
       if(saved)onSaved?.(saved);setNotice('op.saved');return;
     }
     const saved=await projectService.configureOperations(project.projectId,valid,project.version||0,ack);
     if(saved)onSaved?.(saved);setNotice('op.saved');
   }catch(err:any){
     const code=err?.code||err?.message;
     if(code&&typeof code==='string'&&(code.startsWith('OPERATIONAL_')||code.startsWith('PROJECT_')||code.includes('MIGRATION')||code.includes('WORKSPACE'))){
       setErrorNotice(`op.${code}`);
     }else{
       setNotice('op.save_failed');
     }
   }finally{setBusy(false);}
 }
 async function applyReviewed(){
   if(!assessment)return;
   setBusy(true);setNotice('');setErrorNotice('');
   try{
     const valid=validateOperationalConfiguration(config);
     const saved=await projectService.configureOperations(project.projectId,valid,project.version||0,ack,assessment.assessmentSignature);
     if(saved)onSaved?.(saved);
     setNotice(assessment.workspaceState==='CONNECTED'?'op.saved_maintenance_required':'op.saved');
     setAssessment(null);
   }catch(err:any){
     const code=err?.code||err?.message;
     if(code&&typeof code==='string'){
       setErrorNotice(`op.${code}`);
     }else{
       setNotice('op.save_failed');
     }
   }finally{setBusy(false);}
 }
 return <section className="bg-stone-950 border border-stone-800 rounded-2xl p-5 space-y-4"><h3 className="font-bold">{t('op.configuration')}</h3><p>{t('op.configuration_help')}</p>
 <div className="grid sm:grid-cols-2 gap-4">{select('loading_question',config.loadingMeasurementMode,['WEIGHBRIDGE','NONE'],v=>setConfig({...config,loadingMeasurementMode:v as any}))}{select('unloading_question',config.unloadingMeasurementMode,['WEIGHBRIDGE','NONE'],v=>setConfig({...config,unloadingMeasurementMode:v as any}))}
 {select('intake_question',config.driverIntakeMode,['PRELOADED_ROSTER','ON_FIRST_OPERATION','MIXED'],v=>setConfig({...config,driverIntakeMode:v as any}))}
 {(['loadingLocation','unloadingLocation','distanceKm','expectedTravelMinutes','toleranceMinutes'] as const).map(k=><label key={k}>{t(`op.${k}`)}<input disabled={!canEdit||busy} className="block bg-stone-900 border rounded p-2 w-full" type={k.endsWith('Location')?'text':'number'} min="0" value={route[k]??''} onChange={e=>{const next={...route};if(k.endsWith('Location'))(next as any)[k]=e.target.value;else if(e.target.value==='')delete next[k];else (next as any)[k]=Number(e.target.value);setConfig({...config,routeConfiguration:next});}}/></label>)}
 {select('capacity_question',config.capacityEstimationPolicy.mode,['NONE','TRUCK_CAPACITY','PROJECT_STANDARD','MATERIAL_TRUCK_MATRIX'],v=>setConfig({...config,capacityEstimationPolicy:v==='PROJECT_STANDARD'?{mode:v,tonnes:0}:v==='MATERIAL_TRUCK_MATRIX'?{mode:v,entries:[]}:{mode:v as 'NONE'|'TRUCK_CAPACITY'}}))}
 {config.capacityEstimationPolicy.mode==='PROJECT_STANDARD'&&<label>{t('op.tonnes')}<input type="number" min="0.001" step="any" disabled={!canEdit||busy} value={config.capacityEstimationPolicy.tonnes} onChange={e=>setConfig({...config,capacityEstimationPolicy:{mode:'PROJECT_STANDARD',tonnes:Number(e.target.value)}})}/></label>}
 </div>
 {config.capacityEstimationPolicy.mode==='MATERIAL_TRUCK_MATRIX'&&<fieldset><legend>{t('op.capacity_matrix')}</legend><datalist id="op-truck-types">{['TIPPER_32M3','TRAILER_24M','FLATBED','DUMPER'].map(type=><option key={type} value={type}>{t(`rb2.truckType.${type}`)}</option>)}</datalist>{config.capacityEstimationPolicy.entries.map((entry,index)=><div key={index} className="flex flex-wrap gap-2">{(['truckType','materialId','tonnes'] as const).map(k=><label key={k}>{t(`op.${k}`)}<input disabled={!canEdit||busy} list={k==='truckType'?'op-truck-types':undefined} type={k==='tonnes'?'number':'text'} value={entry[k]} onChange={e=>{if(config.capacityEstimationPolicy.mode!=='MATERIAL_TRUCK_MATRIX')return;const entries=config.capacityEstimationPolicy.entries.map((v,i)=>i===index?{...v,[k]:k==='tonnes'?Number(e.target.value):e.target.value}:v);setConfig({...config,capacityEstimationPolicy:{mode:'MATERIAL_TRUCK_MATRIX',entries}});}}/></label>)}<button type="button" disabled={!canEdit||busy} onClick={()=>{if(config.capacityEstimationPolicy.mode==='MATERIAL_TRUCK_MATRIX')setConfig({...config,capacityEstimationPolicy:{...config.capacityEstimationPolicy,entries:config.capacityEstimationPolicy.entries.filter((_,i)=>i!==index)}});}}>{t('op.remove')}</button></div>)}<button type="button" disabled={!canEdit||busy} onClick={()=>{if(config.capacityEstimationPolicy.mode==='MATERIAL_TRUCK_MATRIX')setConfig({...config,capacityEstimationPolicy:{...config.capacityEstimationPolicy,entries:[...config.capacityEstimationPolicy.entries,{truckType:'DUMPER',materialId:'',tonnes:0}]}});}}>{t('op.add')}</button></fieldset>}
 {select('shift_question',config.shiftConfiguration.mode,['NONE','DAY_NIGHT','CUSTOM'],v=>setConfig({...config,shiftConfiguration:v==='NONE'?{mode:v}:{mode:v as 'DAY_NIGHT'|'CUSTOM',shifts:[]}}))}
 {config.shiftConfiguration.mode!=='NONE'&&<fieldset><legend>{t('op.shift_windows')}</legend>{(config.shiftConfiguration.shifts||[]).map((shift,i)=><div key={i} className="flex flex-wrap gap-2">{(['id','nameAr','nameEn','startMinute','endMinute'] as const).map(k=><label key={k}>{t(`op.${k}`)}<input disabled={!canEdit||busy} type={k.endsWith('Minute')?'time':'text'} value={k.endsWith('Minute')?String(Math.floor(Number(shift[k])/60)).padStart(2,'0')+':'+String(Number(shift[k])%60).padStart(2,'0'):String(shift[k])} onChange={e=>{const value=k.endsWith('Minute')?e.target.value.split(':').reduce((a,n,index)=>a+Number(n)*(index===0?60:1),0):e.target.value;setConfig({...config,shiftConfiguration:{...config.shiftConfiguration,shifts:config.shiftConfiguration.shifts!.map((v,index)=>index===i?{...v,[k]:value}:v)}});}}/></label>)}<button type="button" disabled={!canEdit||busy} onClick={()=>setConfig({...config,shiftConfiguration:{...config.shiftConfiguration,shifts:config.shiftConfiguration.shifts!.filter((_,index)=>index!==i)}})}>{t('op.remove')}</button></div>)}<button type="button" disabled={!canEdit||busy} onClick={()=>setConfig({...config,shiftConfiguration:{...config.shiftConfiguration,shifts:[...(config.shiftConfiguration.shifts||[]),{id:'',nameAr:'',nameEn:'',startMinute:0,endMinute:0}]}})}>{t('op.add')}</button></fieldset>}
 <details><summary>{t('op.checkpoints')}</summary>{(['loadingStartedAt','loadingCompletedAt','departedAt','arrivedAt','unloadingStartedAt','unloadingCompletedAt'] as OperationalCheckpoint[]).map(k=><label key={k} className="block"><input disabled={!canEdit||busy} type="checkbox" checked={config.requiredCheckpoints?.includes(k)||false} onChange={e=>setConfig({...config,requiredCheckpoints:e.target.checked?[...(config.requiredCheckpoints||[]),k]:(config.requiredCheckpoints||[]).filter(v=>v!==k)})}/>{t(`op.${k}`)}</label>)}</details>
 {!project.operationalConfiguration&&project.settings?.googleSpreadsheetId&&<label className="block"><input disabled={!canEdit||busy} type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/>{t('op.adopt_dual')}</label>}
 
 {assessment&&(
   <div className="bg-stone-900 border border-amber-600/40 rounded-xl p-4 space-y-3" role="region" aria-label={t('op.review_title')}>
     <h4 className="font-bold text-amber-400">{t('op.review_title')}</h4>
     <p className="text-sm text-stone-300">{t('op.review_help')}</p>
     <div className="flex flex-wrap items-center gap-3 text-sm bg-stone-950 p-3 rounded border border-stone-800">
       <span>{t('op.current_profile')}: <strong>{assessment.currentProfile?t(`op.profile.${assessment.currentProfile}`):t('op.NONE')}</strong></span>
       <span>→</span>
       <span>{t('op.proposed_profile')}: <strong>{t(`op.profile.${assessment.proposedProfile}`)}</strong></span>
     </div>
     {assessment.changedDomains.length>0&&(
       <div className="space-y-1">
         <span className="text-xs text-stone-400 font-medium">{t('op.checkpoints')}:</span>
         <div className="flex flex-wrap gap-1">
           {assessment.changedDomains.map(d=><span key={d} className="bg-stone-800 text-stone-200 text-xs px-2 py-0.5 rounded">{t(`op.domain.${d}`)}</span>)}
         </div>
       </div>
     )}
     {assessment.hasTrips&&<div className="text-sm bg-blue-950/40 border border-blue-800/60 p-3 rounded text-blue-200">{t('op.historical_snapshot_safe')}</div>}
     {assessment.workspaceState==='CONNECTED'&&<div className="text-sm bg-emerald-950/40 border border-emerald-800/60 p-3 rounded text-emerald-200">{assessment.workspaceImpact==='IN_PLACE_MAINTENANCE_REQUIRED'?t('op.workspace_preserved_maintenance_needed'):t('op.workspace_refresh_needed')}</div>}
     <div className="flex items-center gap-3 pt-2">
       <button type="button" disabled={!canEdit||busy} className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded p-2 px-4 disabled:opacity-40" onClick={applyReviewed}>{t('op.apply_reviewed')}</button>
       <button type="button" disabled={busy} className="bg-stone-800 text-stone-300 rounded p-2 px-4" onClick={()=>setAssessment(null)}>{t('op.cancel_review')}</button>
     </div>
   </div>
 )}

 {!assessment&&<button type="button" disabled={!canEdit||busy} className="bg-amber-700 rounded p-2 disabled:opacity-40" onClick={save}>{t('op.save')}</button>}
 {errorNotice&&<p role="alert" className="text-red-400 font-medium">{t(errorNotice)}</p>}
 {notice&&<p role="status" className="text-emerald-400 font-medium">{t(notice)}</p>}
 </section>;
}
