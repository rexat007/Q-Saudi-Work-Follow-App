import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import type { RosterEntityReviewGroup } from '../../services/import/rosterBatchReview.service';
export function CanonicalCreationForm({group,onSubmit,onClose,busy,committed,error}:{group:RosterEntityReviewGroup;onSubmit:(data:any)=>Promise<void>;onClose:()=>void;busy:boolean;committed:boolean;error:string|null}){
  const {t}=useI18n(); const [data,setData]=useState<Record<string,string>>({nameAr:group.sourceValue,driverName:/^[0-9٠-٩]+$/.test(group.sourceValue)?'':group.sourceValue,plateNumber:group.sourceValue});
  const fields=group.entityType==='carrier'?['nameAr','commercialRegistrationNo']:group.entityType==='material'?['nameAr','code']:group.entityType==='driver'?['driverName','residencyId']:['plateNumber'];
  const labels:Record<string,string>={nameAr:'setup.name',commercialRegistrationNo:'import.resolution.registration',code:'analytics.column.material_code',driverName:'setup.name',residencyId:'setup.nationalId',plateNumber:'setup.plate'};
  return <form className="space-y-3 rounded border border-stone-500 p-3" onSubmit={e=>{e.preventDefault();void onSubmit(data)}}><fieldset disabled={busy||committed} className="space-y-2">{fields.map(field=><label className="block" key={field}>{t(labels[field])}<input required value={data[field]||''} onChange={e=>setData({...data,[field]:e.target.value})} className="block w-full rounded border p-2"/></label>)}</fieldset>{error&&<p role="alert">{error}</p>}<div className="flex gap-3"><button type="button" disabled={busy} onClick={onClose}>{t('shared.actions.cancel')}</button><button disabled={busy}>{t(committed?'setup.retry':'shared.actions.confirm')}</button></div></form>;
}
