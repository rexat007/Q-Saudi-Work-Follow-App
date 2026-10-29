import React,{useRef,useState} from 'react';
import {useI18n} from '../../i18n';
import {SetupMutationSession,setupCommand} from '../../services/setupOrchestration.service';
import {setupErrorKey} from '../../i18n/setupErrors';
import {useProjectEditorLifetime} from '../wizard/useProjectEditorLifetime';
import type {SetupParticipant} from '../../types/setupFleet';
import type {ProjectCanonicalRefreshSnapshot} from '../../services/projectCanonicalRefresh.service';
const fields={DRIVER:['fullNameAr','phone','licenseNumber','licenseValidUntil','nationality'],TRUCK:['truckType','tareWeightKg','maxGrossWeightKg','mvpiValidUntil','insuranceValidUntil']};
export function FleetProfileEditor({projectId,entity,isCurrent,onClose,refresh}:{projectId:string;entity:SetupParticipant;isCurrent:()=>boolean;onClose:()=>void;refresh:(verify?:(snapshot:ProjectCanonicalRefreshSnapshot)=>void)=>Promise<ProjectCanonicalRefreshSnapshot>}){
 const {t,direction}=useI18n(),life=useProjectEditorLifetime(projectId,true,isCurrent),session=useRef(new SetupMutationSession()).current;
 const keys=fields[entity.kind as 'DRIVER'|'TRUCK'];
 const initial=(key:string)=>{const v=entity.profile?.[key];if(key.endsWith('Until')&&v){const d=v.toDate?.()||new Date(v.seconds?v.seconds*1000:v);return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):'';}return v??'';};
 const [values,setValues]=useState<Record<string,string|number>>(()=>Object.fromEntries(keys.map(k=>[k,initial(k)]))),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
 const receipt=useRef<any>(null);
 return <div dir={direction} role="dialog" aria-modal="true" aria-label={t('rb2.profile')} className="fixed inset-0 z-60 overflow-auto bg-stone-950/90 p-6"><form className="mx-auto max-w-lg space-y-3 rounded border border-stone-700 bg-stone-900 p-5" onSubmit={async e=>{
 e.preventDefault();const request=life.capture(),current=()=>life.isCurrent(request);if(!current())return;setBusy(true);setError(null);
 try{const ok=await session.run(projectId,async()=>{const updates=Object.fromEntries(keys.filter(k=>String(values[k])!==String(initial(k))).map(k=>[k,values[k]===''?null:['tareWeightKg','maxGrossWeightKg'].includes(k)?Number(values[k]):values[k]]));receipt.current=await setupCommand(projectId,`fleet-profile/${entity.kind}/${entity.id}`,{updates,expectedVersion:entity.profile?.version||0});return receipt.current;},current,()=>{},async()=>{
 return refresh(snapshot=>{const profile=snapshot.setup?.participants.find(p=>p.id===entity.id&&p.kind===entity.kind)?.profile;
 if(!profile||profile.version!==receipt.current?.version)throw Object.assign(Error('REFRESH_INCOHERENT'),{code:'REFRESH_INCOHERENT'});});
 });if(ok&&current())onClose();}catch(err:any){if(current())setError(session.committed?'rb2.refresh_pending':setupErrorKey(err));}finally{if(current())setBusy(false);}
 }}>
 <h3>{t('rb2.profile')} · {entity.name}</h3><p>{t('rb2.identity_migration')}: {entity.naturalKey}</p>
 {keys.map(key=><label key={key} className="block">{t(`rb2.field.${key}`)}{key==='truckType'?<select className="block w-full bg-stone-950 p-2" value={values[key]} disabled={busy||session.committed} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}><option value="">—</option>{['TIPPER_32M3','TRAILER_24M','FLATBED','DUMPER'].map(v=><option key={v} value={v}>{t(`rb2.truckType.${v}`)}</option>)}</select>:<input className="block w-full bg-stone-950 p-2" type={key.endsWith('Until')?'date':['tareWeightKg','maxGrossWeightKg'].includes(key)?'number':'text'} value={values[key]} disabled={busy||session.committed} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}/>}</label>)}
 {error&&<p role="alert">{t(error)}</p>}<div className="flex gap-4"><button type="button" disabled={busy} onClick={onClose}>{t('shared.actions.cancel')}</button><button disabled={busy}>{t(session.committed?'setup.retry':'shared.actions.confirm')}</button></div>
 </form></div>;
}
