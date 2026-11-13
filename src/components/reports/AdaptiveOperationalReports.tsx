import React,{useEffect,useMemo,useState} from 'react';
import type {OperationalConfiguration} from '../../types/operationalProfile';
import type {TripEntity} from '../../types/entities';
import {tripRepository} from '../../repositories/trip.repository';
import {buildOperationalReport} from '../../services/operationalReporting';
import {profileTripColumns} from '../../services/operationalReportColumns';
import {useI18n} from '../../i18n';
import {clientWorkspaceService} from '../../services/workspace.service';
import {reportsEngineService} from '../../services/reportsEngine.service';
import {PrintableReportModal} from './PrintableReportModal';
import type {ReportDataset} from '../../types/reports';

/** Firestore snapshots are the source; workbook layout and current config never reinterpret historical facts. */
export function AdaptiveOperationalReports({projectId,configuration}:{projectId:string;configuration?:OperationalConfiguration}){
 const {t,locale}=useI18n(),[trips,setTrips]=useState<TripEntity[]>([]),[error,setError]=useState(false),[filters,setFilters]=useState<Record<string,string>>({}),[family,setFamily]=useState('DAILY');
 const [loading,setLoading]=useState(true),[readRevision,setReadRevision]=useState(0),[printOpen,setPrintOpen]=useState(false);
 const [refreshStatus, setRefreshStatus] = useState<'IDLE'|'REFRESHING'|'SUCCESS'|'FAILURE'>('IDLE');
 const [refreshError, setRefreshError] = useState<string | null>(null);
 const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);

 useEffect(()=>{
  setTrips([]);setFilters({});setError(false);setRefreshStatus('IDLE');setRefreshError(null);setLoading(true);setPrintOpen(false);
  let active = true;
  void tripRepository.listCompleteByProject(projectId)
   .then(list => { if (active) {setTrips(list);setLoading(false);} })
   .catch(() => { if (active) {setError(true);setLoading(false);} });
  return () => { active = false; };
 },[projectId,readRevision]);

 const onRefreshReports = async () => {
  if (refreshStatus === 'REFRESHING') return;
  setRefreshStatus('REFRESHING');
  setRefreshError(null);
  try {
   const status = await clientWorkspaceService.refreshOperationalReports(projectId);
   setLastRefreshAt(status.lastReportRefreshAt || new Date().toISOString());
   setRefreshStatus('SUCCESS');
  } catch (err: any) {
   console.error('Google report refresh failed:', err);
   setRefreshStatus('FAILURE');
   setRefreshError(err?.message === 'REPORT_REFRESH_COOLDOWN' ? 'COOLDOWN' : err?.message === 'GOOGLE_RATE_LIMITED' ? 'RATE_LIMITED' : 'GENERIC');
  }
 };

 const report=useMemo(()=>buildOperationalReport(trips,{projectId,...filters},new Date(),configuration),[trips,filters,projectId,configuration]),configured=trips.find(r=>r.operationalSnapshot),headers=configured?profileTripColumns(configured.operationalSnapshot!.configuration):configuration?profileTripColumns(configuration):[];
 const kpis=['tripsToday','completedToday','trips','completed','inProgress','inTransit','atLoading','atDestination','delayed','exceptions','averageCycle','averageTravel','averageLoading','averageWaiting','averageUnloading','onTimePercent',...(report.capabilities.measuredLoading?['measuredLoadedTonnes']:[]),...(report.capabilities.measuredUnloading?['measuredReceivedTonnes']:[]),...(report.capabilities.weightReconciliation?['varianceTonnes']:[]),...(report.capabilities.estimatedProduction?['estimatedTonnes']:[]),...(report.capabilities.measuredLoading&&!report.capabilities.measuredUnloading?['derivedFromLoadingTonnes']:[]),...(report.capabilities.measuredUnloading&&!report.capabilities.measuredLoading?['derivedFromUnloadingTonnes']:[])];
 const productivity=family==='CARRIER'?'carrier':family==='TRUCK'?'truck':family==='DRIVER'?'driver':family==='SHIFT'?'shift':family==='MATERIAL'?'material':null;
 const rows=family==='DELAY'?report.rows.filter(r=>r.exception||r.delayStatus==='DELAYED'):family==='LIVE'?report.liveMovement:report.rows;
 const semanticValue=(field:string,value:unknown)=>['status','delayStatus','loadingWeightBasis','unloadingWeightBasis'].includes(field)?t(`op.${String(value)}`):value==null?'—':String(value);
 const exportRows:Record<string,unknown>[] = family==='DAILY'||family==='WEEKLY'?(family==='DAILY'?report.periods.daily:report.periods.weekly):productivity?Object.entries(report.productivity[productivity]).map(([id,trips])=>({[productivity]:id,trips})):rows;
 const exportKeys=family==='DAILY'||family==='WEEKLY'?['period','trips','completed',...(report.capabilities.measuredLoading?['measuredLoadedTonnes']:[]),...(report.capabilities.measuredUnloading?['measuredReceivedTonnes']:[]),...(report.capabilities.estimatedProduction?['estimatedTonnes']:[])]:productivity?[productivity,'trips']:headers;
 const selectedIds=new Set(rows.map(row=>String(row.tripId)));
 // Export labels have a closed vocabulary; unknown fields never render raw translation keys.
 const exportLabels:Record<string,string>={
  tripId:t('op.tripId'),
  projectId:t('op.projectId'),
  tripDate:t('op.tripDate'),
  carrierId:t('op.carrierId'),
  carrier:t('op.carrier'),
  truckId:t('op.truckId'),
  truck:t('op.truck'),
  driverId:t('op.driverId'),
  driver:t('op.driver'),
  materialId:t('op.materialId'),
  material:t('op.material'),
  shift:t('op.shift'),
  loadingLocation:t('op.loadingLocation'),
  destination:t('op.destination'),
  loadingStartedAt:t('op.loadingStartedAt'),
  loadingCompletedAt:t('op.loadingCompletedAt'),
  departedAt:t('op.departedAt'),
  expectedArrivalAt:t('op.expectedArrivalAt'),
  arrivedAt:t('op.arrivedAt'),
  unloadingStartedAt:t('op.unloadingStartedAt'),
  unloadingCompletedAt:t('op.unloadingCompletedAt'),
  completedAt:t('op.completedAt'),
  loadingDuration:t('op.loadingDuration'),
  dispatchDelay:t('op.dispatchDelay'),
  travelDuration:t('op.travelDuration'),
  arrivalVariance:t('op.arrivalVariance'),
  waitingDuration:t('op.waitingDuration'),
  unloadingDuration:t('op.unloadingDuration'),
  totalCycleDuration:t('op.totalCycleDuration'),
  truckIdleDuration:t('op.truckIdleDuration'),
  distanceKm:t('op.distanceKm'),
  status:t('op.status'),
  delayStatus:t('op.delayStatus'),
  exception:t('op.exception'),
  lastEvent:t('op.lastEvent'),
  elapsedMinutes:t('op.elapsedMinutes'),
  loadingMeasuredWeight:t('op.loadingMeasuredWeight'),
  unloadingMeasuredWeight:t('op.unloadingMeasuredWeight'),
  loadingEffectiveWeight:t('op.loadingEffectiveWeight'),
  unloadingEffectiveWeight:t('op.unloadingEffectiveWeight'),
  loadingWeightBasis:t('op.loadingWeightBasis'),
  unloadingWeightBasis:t('op.unloadingWeightBasis'),
  weightVariance:t('op.weightVariance'),
  weightVariancePercent:t('op.weightVariancePercent'),
  DAILY:t('op.DAILY'),
  WEEKLY:t('op.WEEKLY'),
  CARRIER:t('op.CARRIER'),
  TRUCK:t('op.TRUCK'),
  DRIVER:t('op.DRIVER'),
  SHIFT:t('op.SHIFT'),
  MATERIAL:t('op.MATERIAL'),
  DELAY:t('op.DELAY'),
  LIVE:t('op.LIVE'),
  period:t('op.period'),
  trips:t('op.trips'),
  completed:t('op.completed'),
  measuredLoadedTonnes:t('op.measuredLoadedTonnes'),
  measuredReceivedTonnes:t('op.measuredReceivedTonnes'),
  estimatedTonnes:t('op.estimatedTonnes'),
 };
 const exportLabel=(key:string)=>Object.hasOwn(exportLabels,key)?exportLabels[key]:t('op.UNAVAILABLE');
 const dataset:ReportDataset={reportType:'DAILY_OPERATIONS',category:'OPERATIONAL',titleAr:exportLabel(family),titleEn:family,descriptionAr:t('op.reporting_help'),generatedAt:new Date().toISOString(),filtersApplied:{projectId},summary:reportsEngineService.calculateSummary(trips.filter(trip=>selectedIds.has(trip.tripId)).map(trip=>reportsEngineService.adaptTripEntityToRecord(trip))),columns:[...exportKeys.map(key=>({key,labelAr:exportLabel(key),labelEn:key})),...['sourceType','pricingSnapshotAt','destinationWeightSource','settlementStatus'].map(key=>({key,labelAr:key,labelEn:key}))],rows:exportRows.map(row=>{const trip=trips.find(trip=>trip.tripId===row.tripId);return {...Object.fromEntries(Object.entries(row).map(([key,value])=>[key,semanticValue(key,value)])),sourceType:trip?.sourceType??'—',pricingSnapshotAt:trip?.pricingSnapshot?.pricingSnapshotAt??'—',destinationWeightSource:trip?.unloadingDataSource??'—',settlementStatus:trip?(trip.financials.isFinalized?'FINALIZED':'PENDING'):'—'};})};
 if(loading)return <p role="status">{t('analytics.ui.loading_authorized_trip_data')}</p>;
 if(error)return <div role="alert"><p>{t('readiness.unavailable')}</p><button type="button" onClick={()=>setReadRevision(value=>value+1)}>{t('shared.error_boundary.retry')}</button></div>;
 const displayMetric=(value:unknown)=>typeof value==='number'?value.toLocaleString(locale,{maximumFractionDigits:3}):value==null?'—':String(value);
 return <section className="min-w-0 max-w-full space-y-4 border rounded-xl p-4">
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
    {refreshStatus === 'FAILURE' && <span className="text-xs text-red-500">{refreshError === 'COOLDOWN' ? t('op.google_reports_refresh_cooldown') : refreshError === 'RATE_LIMITED' ? t('op.google_reports_refresh_rate_limited') : t('op.google_reports_refresh_failed')}</span>}
    {lastRefreshAt && <span className="text-xs text-stone-500">{t('op.last_google_report_refresh', { at: new Date(lastRefreshAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) })}</span>}
   </div>
  </div>
  <div className="flex flex-wrap gap-3"><button id="btn-export-csv" onClick={()=>reportsEngineService.exportToCSV(dataset)}>{t('analytics.ui.export_csv')}</button><button id="btn-export-xlsx" onClick={()=>reportsEngineService.exportToXLSX(dataset)}>{t('analytics.ui.export_excel_xlsx')}</button><button id="btn-print-pdf" onClick={()=>setPrintOpen(true)}>{t('analytics.ui.preview_and_print_pdf')}</button></div>
  {printOpen&&<PrintableReportModal dataset={dataset} onClose={()=>setPrintOpen(false)}/>}
 <div className="flex flex-wrap gap-2"><label>{t('op.family')}<select className="bg-stone-900 block" value={family} onChange={e=>setFamily(e.target.value)}>{['DAILY','WEEKLY','CARRIER','TRUCK','DRIVER','SHIFT','MATERIAL','DELAY','LIVE',...(report.capabilities.weightReconciliation?['WEIGHT_RECONCILIATION']:[])].map(v=><option key={v} value={v}>{t(`op.${v}`)}</option>)}</select></label>
 {['dateFrom','dateTo','carrierId','truckId','driverId','shift','materialId','status'].map(k=><label key={k}>{t(`op.${k}`)}{k.startsWith('date')?<input className="bg-stone-900 block" type="date" value={filters[k]||''} onChange={e=>setFilters({...filters,[k]:e.target.value})}/>:<select className="bg-stone-900 block" value={filters[k]||''} onChange={e=>setFilters({...filters,[k]:e.target.value})}><option value="">{t('op.all')}</option>{[...new Set(trips.filter(r=>r.operationalSnapshot).flatMap(r=>buildOperationalReport([r],{projectId}).rows.map(v=>String(v[k]||''))))].filter(Boolean).map(v=><option key={v} value={v}>{semanticValue(k,v)}</option>)}</select>}</label>)}</div>
 {family==='WEEKLY'&&<p>{t('op.weekly_help')}</p>}
 <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">{kpis.map(k=><div key={k} className="border rounded p-2"><dt>{t(`op.${k}`)}</dt><dd className="break-words">{displayMetric((report.metrics as any)[k])}</dd></div>)}</dl>
 {report.legacyTripsExcluded>0&&<p>{t('op.legacy_excluded',{count:report.legacyTripsExcluded})}</p>}
 {family==='DAILY'||family==='WEEKLY'?<div className="overflow-auto"><table className="text-stone-100"><thead><tr>{['period','trips','completed',...(report.capabilities.measuredLoading?['measuredLoadedTonnes']:[]),...(report.capabilities.measuredUnloading?['measuredReceivedTonnes']:[]),...(report.capabilities.estimatedProduction?['estimatedTonnes']:[])].map(k=><th className="p-2" key={k}>{t(`op.${k}`)}</th>)}</tr></thead><tbody>{(family==='DAILY'?report.periods.daily:report.periods.weekly).map(row=><tr key={row.period}>{['period','trips','completed',...(report.capabilities.measuredLoading?['measuredLoadedTonnes']:[]),...(report.capabilities.measuredUnloading?['measuredReceivedTonnes']:[]),...(report.capabilities.estimatedProduction?['estimatedTonnes']:[])].map(k=><td className="p-2" key={k}>{String(row[k])}</td>)}</tr>)}</tbody></table></div>:productivity?<table className="w-full text-stone-100"><thead><tr><th>{t(`op.${productivity}`)}</th><th>{t('op.trips')}</th></tr></thead><tbody>{Object.entries(report.productivity[productivity]).map(([id,count])=><tr key={id}><td>{id||t('op.driver_unknown')}</td><td>{count}</td></tr>)}</tbody></table>:<div className="overflow-auto"><table className="text-xs text-stone-100"><thead><tr>{headers.map(k=><th className="p-2" key={k}>{t(`op.${k}`)}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={String(r.tripId)}>{headers.map(k=><td className="p-2 whitespace-nowrap" key={k}>{semanticValue(k,r[k])}</td>)}</tr>)}</tbody></table></div>}</section>;
}
