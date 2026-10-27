import {batch4ConflictFieldLabel} from '../../i18n/batch4Presentation';
import {createPortal} from 'react-dom';
import React, {useRef,useState} from 'react';
import {useI18n} from '../../i18n';
import {useProjectEditorLifetime} from '../wizard/useProjectEditorLifetime';
import {normalizeNaturalKey} from '../../utils/globalIdentityPolicy';
import {resolutionErrorKey} from '../../i18n/importResolution';
export interface FleetIdentityInput {driverName:string;residencyId:string;plateNumber:string;carrierId:string;phone?:string;truckType?:string;tareWeightKg?:number;maxGrossWeightKg?:number}
export function CanonicalFleetIdentityEditor({projectId,kind,initialValues,carriers,isCurrent,onClose,onSubmit,planned=false,committed=false,conflicts={},lockCarrier=false,readAvailable=true}:{
  projectId:string;kind:'DRIVER'|'TRUCK';initialValues?:Partial<FleetIdentityInput>;carriers:{id:string;name:string}[];isCurrent:()=>boolean;onClose:()=>void;onSubmit:(data:FleetIdentityInput)=>Promise<void|boolean>;planned?:boolean;readAvailable?:boolean;committed?:boolean;lockCarrier?:boolean;conflicts?:Record<string,string[]>;
}){
 const {t,direction}=useI18n(),life=useProjectEditorLifetime(projectId,true,isCurrent),lock=useRef(false);
 const [data,setData]=useState<FleetIdentityInput>({driverName:'',residencyId:'',plateNumber:'',carrierId:'',...initialValues});
 const [unresolved,setUnresolved]=useState(Object.keys(conflicts));const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 const change=(key:keyof FleetIdentityInput,value:string|number|undefined)=>{setData(old=>({...old,[key]:value}));};
 const submit=async(e:React.FormEvent)=>{e.preventDefault();if(lock.current)return;const request=life.capture();if(!life.isCurrent(request))return;setError(null);
  try{if(!committed&&readAvailable){if(unresolved.length)throw Error('IDENTITY_AMBIGUITY');normalizeNaturalKey(kind,kind==='DRIVER'?data.residencyId:data.plateNumber);if(kind==='DRIVER'&&!data.driverName.trim())throw Error('INVALID_NATURAL_KEY');if(!carriers.some(c=>c.id===data.carrierId))throw Error('AFFILIATION_CONFLICT');}
   lock.current=true;setBusy(true);const accepted=await onSubmit(data);if(accepted!==false&&life.isCurrent(request))onClose();
  }catch(e){if(life.isCurrent(request))setError(resolutionErrorKey(e));}finally{lock.current=false;if(life.isCurrent(request))setBusy(false);}};
 const input=(key:keyof FleetIdentityInput,label:string,type='text')=><label className="block space-y-1" key={key}>{t(label)}<input className="w-full min-w-0 rounded border border-stone-700 bg-stone-950 p-2" name={key} type={type} value={data[key]??''} disabled={busy||committed||!readAvailable} onChange={e=>change(key,type==='number'?(e.target.value===''?undefined:Number(e.target.value)):e.target.value)}/></label>;
 const content=<div dir={direction} role="dialog" aria-modal="true" aria-label={t(`setup.editor.${kind}`)} className="fixed inset-0 z-60 flex items-center justify-center bg-stone-950/80 p-4"><form onSubmit={submit} className="w-full min-w-0 max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-stone-700 bg-stone-900 p-4 space-y-3 text-stone-100">
 <h3>{t(`setup.editor.${kind}`)}</h3><p>{t(planned?'import.context.planned':'import.context.immediateFleet')}</p>
 {Object.entries(conflicts).map(([field,values])=><label key={field} className="block break-words">{batch4ConflictFieldLabel(t,field)}: {values.join(' / ')}<input type="checkbox" checked={!unresolved.includes(field)} disabled={busy||committed||!readAvailable} onChange={e=>setUnresolved(old=>e.target.checked?old.filter(f=>f!==field):[...old,field])}/>{t('shared.actions.confirm')}</label>)}
 {kind==='DRIVER'?<>{input('driverName','setup.name')}{input('residencyId','setup.nationalId')}{input('phone','entityResolution.labels.mobile_optional')}</>:<>{input('plateNumber','setup.plate')}{input('truckType','entityResolution.labels.truck_body_optional')}{input('tareWeightKg','entityResolution.labels.tare_kg_optional','number')}{input('maxGrossWeightKg','entityResolution.labels.max_weight_kg_optional','number')}</>}
 <label className="block">{t('setup.carrier')}<select className="w-full min-w-0 bg-stone-950 p-2" value={data.carrierId} disabled={busy||committed||lockCarrier||!readAvailable} onChange={e=>change('carrierId',e.target.value)}><option value="">{t('setup.choose')}</option>{carriers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 {error&&<p role="alert">{t(error)}</p>}<div className="flex flex-wrap justify-end gap-3"><button type="button" disabled={busy} onClick={onClose}>{t('shared.actions.cancel')}</button><button disabled={busy}>{t(busy?'shared.status.loading':committed||!readAvailable?'setup.retry':'shared.actions.confirm')}</button></div>
 </form></div>;
 return typeof document!=='undefined'?createPortal(content,document.body):content;
}
