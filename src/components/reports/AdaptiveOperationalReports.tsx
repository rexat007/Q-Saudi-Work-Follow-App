import React,{useEffect,useMemo,useState} from 'react';
import type {OperationalConfiguration} from '../../types/operationalProfile';
import type {TripEntity} from '../../types/entities';
import {tripRepository} from '../../repositories/trip.repository';
import {buildOperationalReport} from '../../services/operationalReporting';
import {profileTripColumns} from '../../services/operationalReportColumns';
import {useI18n} from '../../i18n';
import {clientWorkspaceService} from '../../services/workspace.service';

/** Firestore snapshots are the source; workbook layout and current config never reinterpret historical facts. */
export function AdaptiveOperationalReports({projectId,configuration}:{projectId:string;configuration?:OperationalConfiguration}){
 const {t}=useI18n(),[trips,setTrips]=useState<TripEntity[]>([]),[error,setError]=useState(false),[filters,setFilters]=useState<Record<string,string>>({}),[family,setFamily]=useState('DAILY');
 const [refreshStatus, setRefreshStatus] = useState<'IDLE'|'REFRESHING'|'SUCCESS'|'FAILURE'>('IDLE');
 const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);

 useEffect(()=>{
  setTrips([]);setFilters({});setError(false);setRefreshStatus('IDLE');
  let active = true;
  void tripRepository.listByProject(projectId, 500)
   .then(list => { if (active) setTrips(list); })
   .catch(() => { if (active) setError(true); });
  return () => { active = false; };
 },[projectId]);

 const onRefreshReports = async () => {
  if (refreshStatus === 'REFRESHING') return;
  setRefreshStatus('REFRESHING');
  try {
   const status = await clientWorkspaceService.refreshOperationalReports(projectId);
   setLastRefreshAt(status.lastReportRefreshAt || new Date().toISOString());
   setRefreshStatus('SUCCESS');
  } catch (err) {
   console.error('Google report refresh failed:', err);
   setRefreshStatus('FAILURE');
  }
 };

 const report=useMemo(()=>buildOperationalReport(trips,{projectId,...filters},new Date(),configuration),[trips,filters,projectId,configuration]),configured=trips.find(r=>r.operationalSnapshot),headers=configured?profileTripColumns(configured.operationalSnapshot!.configuration):configuration?profileTripColumns(configuration):[];
 const kpis=['tripsToday','completedToday','trips','completed','inProgress','inTransit','atLoading','atDestination','delayed','exceptions','averageCycle','averageTravel','averageLoading','averageWaiting','averageUnloading','onTimePercent',...(report.capabilities.measuredLoading?['measuredLoadedTonnes']:[]),...(report.capabilities.measuredUnloading?['measuredReceivedTonnes']:[]),...(report.capabilities.weightReconciliation?['varianceTonnes']:[]),...(report.capabilities.estimatedProduction?['estimatedTonnes']:[]),...(report.capabilities.measuredLoading&&!report.capabilities.measuredUnloading?['derivedFromLoadingTonnes']:[]),...(report.capabilities.measuredUnloading&&!report.capabilities.measuredLoading?['derivedFromUnloadingTonnes']:[])];
 const productivity=family==='CARRIER'?'carrier':family==='TRUCK'?'truck':family==='DRIVER'?'driver':family==='SHIFT'?'shift':family==='MATERIAL'?'material':null;
 const rows=family==='DELAY'?report.rows.filter(r=>r.exception||r.delayStatus==='DELAYED'):family==='LIVE'?report.liveMovement:report.rows;
 const semanticValue=(field:string,value:unknown)=>['status','delayStatus','loadingWeightBasis','unloadingWeightBasis'].includes(field)?t(`op.${String(value)}`):value==null?'—':String(value);
 return <section className="space-y-4 border rounded-xl p-4">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
   <div>
    <h2>{t('op.reporting')}</h2>
    <p>{t('op.reporting_help')}</p>
   </div>
   <div className="flex flex-col items-end gap-2">
    <button 
     disabled={refreshStatus === 'REFRESHING'}
     onClick={onRefreshReports}
     className="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 rounded-lg text-sm transition-colors border border-stone-700"
    >
     {refreshStatus === 'REFRESHING' ? t('op.refreshing_google_reports') : t('op.refresh_google_reports')}
    </button>
    {refreshStatus === 'SUCCESS' && <span className="text-xs text-green-500">{t('op.google_reports_refreshed')}</span>}
    {refreshStatus === 'FAILURE' && <span className="text-xs text-red-500">{t('op.google_reports_refresh_failed')}</span>}
    {lastRefreshAt && <span className="text-xs text-stone-500">{t('op.last_google_report_refresh', { at: new Date(lastRefreshAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) })}</span>}
   </div>
  </div>
  {error&&<p role="alert">{t('op.operation_failed')}</p>}
 <div className="flex flex-wrap gap-2"><label>{t('op.family')}<select className="bg-stone-900 block" value={family} onChange={e=>setFamily(e.target.value)}>{['DAILY','WEEKLY','CARRIER','TRUCK','DRIVER','SHIFT','MATERIAL','DELAY','LIVE',...(report.capabilities.weightReconciliation?['WEIGHT_RECONCILIATION']:[])].map(v=><option key={v} value={v}>{t(`op.${v}`)}</option>)}</select></label>
 {['dateFrom','dateTo','carrierId','truckId','driverId','shift','materialId','status'].map(k=><label key={k}>{t(`op.${k}`)}{k.startsWith('date')?<input className="bg-stone-900 block" type="date" value={filters[k]||''} onChange={e=>setFilters({...filters,[k]:e.target.value})}/>:<select className="bg-stone-900 block" value={filters[k]||''} onChange={e=>setFilters({...filters,[k]:e.target.value})}><option value="">{t('op.all')}</option>{[...new Set(trips.filter(r=>r.operationalSnapshot).flatMap(r=>buildOperationalReport([r],{projectId}).rows.map(v=>String(v[k]||''))))].filter(Boolean).map(v=><option key={v} value={v}>{semanticValue(k,v)}</option>)}</select>}</label>)}</div>
 {family==='WEEKLY'&&<p>{t('op.weekly_help')}</p>}
 <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">{kpis.map(k=><div key={k} className="border rounded p-2"><dt>{t(`op.${k}`)}</dt><dd>{(report.metrics as any)[k]??'—'}</dd></div>)}</dl>
 {report.legacyTripsExcluded>0&&<p>{t('op.legacy_excluded',{count:report.legacyTripsExcluded})}</p>}
 {family==='DAILY'||family==='WEEKLY'?<div className="overflow-auto"><table><thead><tr>{['period','trips','completed',...(report.capabilities.measuredLoading?['measuredLoadedTonnes']:[]),...(report.capabilities.measuredUnloading?['measuredReceivedTonnes']:[]),...(report.capabilities.estimatedProduction?['estimatedTonnes']:[])].map(k=><th className="p-2" key={k}>{t(`op.${k}`)}</th>)}</tr></thead><tbody>{(family==='DAILY'?report.periods.daily:report.periods.weekly).map(row=><tr key={row.period}>{['period','trips','completed',...(report.capabilities.measuredLoading?['measuredLoadedTonnes']:[]),...(report.capabilities.measuredUnloading?['measuredReceivedTonnes']:[]),...(report.capabilities.estimatedProduction?['estimatedTonnes']:[])].map(k=><td className="p-2" key={k}>{String(row[k])}</td>)}</tr>)}</tbody></table></div>:productivity?<table className="w-full"><thead><tr><th>{t(`op.${productivity}`)}</th><th>{t('op.trips')}</th></tr></thead><tbody>{Object.entries(report.productivity[productivity]).map(([id,count])=><tr key={id}><td>{id||t('op.driver_unknown')}</td><td>{count}</td></tr>)}</tbody></table>:<div className="overflow-auto"><table className="text-xs"><thead><tr>{headers.map(k=><th className="p-2" key={k}>{t(`op.${k}`)}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={String(r.tripId)}>{headers.map(k=><td className="p-2 whitespace-nowrap" key={k}>{semanticValue(k,r[k])}</td>)}</tr>)}</tbody></table></div>}</section>;
}
