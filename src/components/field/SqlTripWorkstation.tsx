import React,{useState} from 'react';
import {OperationalTripActions} from './AdaptiveOperationsView';
import type {SqlUiSession} from '../../runtime/sqlUiSession';
import {sqlCode} from '../../runtime/sqlUiSession';
import {canExecuteTripCommand,type TripCommandName} from '../../types/tripCommands';
import {useI18n} from '../../i18n';
import {useSqlText} from '../../i18n/sqlRuntime';
export function SqlTripWorkstation({session}:{session:SqlUiSession}){
 const text=useSqlText(),{t}=useI18n(),[id,setId]=useState(''),[trip,setTrip]=useState<any>(null),[dispatch,setDispatch]=useState(false),[payload,setPayload]=useState<Record<string,string>>({}),[error,setError]=useState(''),[busy,setBusy]=useState(false),[operation,setOperation]=useState('');
 const roles=session.snapshot().account!.membership!.roles,canDispatch=roles.some(r=>canExecuteTripCommand(r as any,'DISPATCH_TRIP'));
 const run=async(work:()=>Promise<unknown>)=>{if(busy)return;setBusy(true);setError('');try{await work();}catch(e){setError(sqlCode(e));}finally{setBusy(false);}};
 const accept=(value:any)=>{if(value?.projectId!==session.snapshot().project?.projectId||!Number.isSafeInteger(value?.revision))throw Error('AUTHORITATIVE_TRIP_UNVERIFIED');setTrip(value);setId(value.tripId);};
 const read=async()=>accept((await session.request('/trips/'+encodeURIComponent(id)+'?limit=50')).trip);
 const command=(name:TripCommandName,data:Record<string,unknown>)=>run(async()=>{const op=await session.queue(name,{...data,tripId:trip.tripId},trip.revision);setOperation(op.operationId);await read();});
 return <section className="space-y-4 rounded-xl border border-stone-700 p-4" data-testid="sql-field"><h1>{t('op.operations')}</h1><p>{t('op.canonical_intake_help')}</p><label>{text('trip')}<input data-testid="sql-trip-id" value={id} onChange={e=>{setId(e.target.value);setTrip(null);}}/></label><button data-testid="sql-read-trip" disabled={busy||!id} onClick={()=>void run(read)}>{text('readTrip')}</button>{error&&<p role="alert">{error}</p>}
  {canDispatch&&<button data-testid="sql-dispatch-start" onClick={()=>setDispatch(!dispatch)}>{t('op.DISPATCH_TRIP')}</button>}
  {dispatch&&canDispatch&&<div className="flex flex-wrap gap-3">{(['carrierId','truckId','driverId','materialId','pricingRuleId'] as const).map(field=><label key={field}>{field==='pricingRuleId'?t('readiness.action.OPEN_PRICING'):t('op.'+field.replace('Id','').toLowerCase())}<input aria-label={field} className="bg-stone-900 block" value={payload[field]||''} onChange={e=>setPayload({...payload,[field]:e.target.value})}/></label>)}<button data-testid="sql-trip-submit" disabled={busy||!session.snapshot().offlineReady} onClick={()=>void run(async()=>{const op=await session.queue('DISPATCH_TRIP',{...payload,driverId:payload.driverId||null},0);setOperation(op.operationId);})}>{t('op.DISPATCH_TRIP')}</button></div>}
  {trip&&<div data-testid="sql-trip-current" data-status={trip.status}><p>{trip.tripNumber} · {t('op.'+trip.status)} · r{trip.revision}</p><dl>{Object.entries(trip.pricingSnapshot||{}).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{String(value??'')}</dd></div>)}</dl><OperationalTripActions key={trip.tripId+':'+trip.revision} trip={trip} roles={roles} busy={busy||!session.snapshot().offlineReady} onCommand={command}/>{!trip.operationalSnapshot&&<p>{text('unsupportedStage')}</p>}</div>}
  {operation&&<div><p data-testid="sql-trip-operation">{operation}</p><button data-testid="sql-trip-receipt" disabled={busy} onClick={()=>void run(async()=>{const value=await session.request('/trips/operations/'+operation);if(value.committed!==true)throw Error('TRIP_RECEIPT_UNVERIFIED');accept(value.trip);})}>{text('status')}</button></div>}
 </section>;
}
