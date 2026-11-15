import React,{useEffect,useMemo,useRef,useState} from 'react';
import type {OperationalConfiguration} from '../../types/operationalProfile';
import type {TripEntity} from '../../types/entities';
import {tripRepository} from '../../repositories/trip.repository';
import {useI18n} from '../../i18n';
import {clientWorkspaceService} from '../../services/workspace.service';
import {reportsEngineService} from '../../services/reportsEngine.service';
import {PrintableReportModal} from './PrintableReportModal';
import {useReportScope} from './useReportScope';
import {operationalReportPresentation,type ReportFilters} from './operationalReportPresentation';
type ReadState={phase:'LOADING'|'READY'|'ERROR';trips:TripEntity[];completedAt?:string};
type RefreshState='IDLE'|'REFRESHING'|'SUCCESS'|'UNKNOWN_TIME'|'FAILURE';
const button='min-h-11 rounded-lg border border-stone-600 px-3 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-50';
/** A keyed child retires all result, print and request state on authorization changes. */
export function AdaptiveOperationalReports({projectId,configuration}:{projectId:string;configuration?:OperationalConfiguration}){
 const scope=useReportScope(projectId),{t}=useI18n();
 if(!scope.allowed)return <section role={scope.verifying?'status':'alert'} className="rounded-xl border border-stone-700 p-4">{t(scope.verifying?'ui4.verifying':scope.unavailable?'ui4.authority_unavailable':'ui4.denied')}</section>;
 return <OperationalReportSurface key={scope.key} scope={scope} projectId={projectId} configuration={configuration}/>;
}
function OperationalReportSurface({scope,projectId,configuration}:{scope:ReturnType<typeof useReportScope>;projectId:string;configuration?:OperationalConfiguration}){
 const {t,locale}=useI18n(),[read,setRead]=useState<ReadState>({phase:'LOADING',trips:[]});
 const [revision,setRevision]=useState(0),[filters,setFilters]=useState<ReportFilters>({}),[family,setFamily]=useState('DAILY'),[printOpen,setPrintOpen]=useState(false);
 const [refreshStatus,setRefreshStatus]=useState<RefreshState>('IDLE'),[refreshError,setRefreshError]=useState(''),[lastRefreshAt,setLastRefreshAt]=useState<string|null>(null);
 const generation=useRef(0),reading=useRef(true),refreshing=useRef(false),refreshGeneration=useRef(0),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;refreshGeneration.current++;};},[]);
 useEffect(()=>{
  let active=true;const request=++generation.current;reading.current=true;setRead({phase:'LOADING',trips:[]});setPrintOpen(false);
  void tripRepository.listCompleteByProject(projectId).then(trips=>{if(!active||request!==generation.current||!scope.isCurrent())return;reading.current=false;setRead({phase:'READY',trips,completedAt:new Date().toISOString()});})
   .catch(()=>{if(!active||request!==generation.current||!scope.isCurrent())return;reading.current=false;setRead({phase:'ERROR',trips:[]});});
  return()=>{active=false;generation.current++;};
 },[projectId,revision,scope.key]);
 const reload=()=>{if(reading.current||!scope.isCurrent())return;reading.current=true;generation.current++;setPrintOpen(false);setRead({phase:'LOADING',trips:[]});setRevision(v=>v+1);};
 const onRefreshReports=async()=>{
  if(!scope.canRefresh||!scope.isCurrent()||refreshing.current||read.phase!=='READY')return;
  refreshing.current=true;const request=++refreshGeneration.current;setRefreshStatus('REFRESHING');setRefreshError('');
  const current=()=>alive.current&&request===refreshGeneration.current&&scope.isCurrent();
  try{const status=await clientWorkspaceService.refreshOperationalReports(projectId);if(!current())return;const at=status?.lastReportRefreshAt;
   if(typeof at==='string'&&Number.isFinite(Date.parse(at))){setLastRefreshAt(at);setRefreshStatus('SUCCESS');}else{setLastRefreshAt(null);setRefreshStatus('UNKNOWN_TIME');}
  }catch(error:unknown){if(!current())return;const code=error instanceof Error?error.message:'';setRefreshError(code==='REPORT_REFRESH_COOLDOWN'?'COOLDOWN':code==='GOOGLE_RATE_LIMITED'?'RATE_LIMITED':'GENERIC');setRefreshStatus('FAILURE');}
  finally{if(current())refreshing.current=false;}
 };
 const generatedAt=useMemo(()=>new Date().toISOString(),[read,filters,family,configuration]);
 const view=useMemo(()=>read.phase==='READY'?operationalReportPresentation(read.trips,projectId,configuration,filters,family,generatedAt,t):null,[read,projectId,configuration,filters,family,generatedAt,t]);
 const invalidDates=Boolean(filters.dateFrom&&filters.dateTo&&filters.dateFrom>filters.dateTo);
 const display=(value:unknown)=>typeof value==='number'?value.toLocaleString(locale,{maximumFractionDigits:3}):value==null?'—':String(value);
 const time=(value:string)=>new Date(value).toLocaleString(locale);
 const groups:Array<[string,string[]]>=[['ui4.movement_metrics',['tripsToday','completedToday','trips','completed','inProgress','inTransit','atLoading','atDestination','delayed','exceptions']],['ui4.duration_metrics',['averageCycle','averageTravel','averageLoading','averageWaiting','averageUnloading','onTimePercent']],['ui4.measurement_metrics',view?[...(view.report.capabilities.measuredLoading?['measuredLoadedTonnes']:[]),...(view.report.capabilities.measuredUnloading?['measuredReceivedTonnes']:[]),...(view.report.capabilities.weightReconciliation?['varianceTonnes']:[]),...(view.report.capabilities.estimatedProduction?['estimatedTonnes']:[]),...(view.report.capabilities.measuredLoading&&!view.report.capabilities.measuredUnloading?['derivedFromLoadingTonnes']:[]),...(view.report.capabilities.measuredUnloading&&!view.report.capabilities.measuredLoading?['derivedFromUnloadingTonnes']:[])]:[]]];
 return <section className="min-w-0 max-w-full space-y-4 rounded-xl border border-stone-700 bg-stone-950 p-3 text-sm leading-relaxed text-stone-100 sm:p-5" data-testid="ui4-report" aria-busy={read.phase==='LOADING'}>
  <header className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 space-y-2"><h2 className="text-xl font-bold">{t('op.reporting')}</h2><p>{t('op.reporting_help')}</p><p>{t('ui4.project')}: <bdi dir="ltr" className="break-all">{projectId}</bdi></p><p className="text-stone-300">{t('ui4.snapshot_help')}</p>
   <dl className="space-y-1 text-xs text-stone-300"><div><dt className="inline">{t('ui4.source_read_at')}: </dt><dd className="inline"><bdi dir="ltr">{read.completedAt?time(read.completedAt):t('op.UNAVAILABLE')}</bdi></dd></div>{view&&<div><dt className="inline">{t('ui4.generated_at')}: </dt><dd className="inline"><bdi dir="ltr">{time(view.dataset.generatedAt)}</bdi></dd></div>}<div><dt className="inline">{t('ui4.google_refresh_at')}: </dt><dd className="inline"><bdi dir="ltr">{lastRefreshAt?time(lastRefreshAt):t('op.UNAVAILABLE')}</bdi></dd></div></dl></div>
   <div className="flex flex-col items-start gap-2"><button type="button" className={`${button} bg-emerald-700 text-white`} disabled={read.phase==='LOADING'} onClick={reload}>{t('ui4.reload_source')}</button>
    {scope.canRefresh?<button type="button" className={button} disabled={refreshStatus==='REFRESHING'||read.phase!=='READY'} onClick={()=>void onRefreshReports()}>{t(refreshStatus==='REFRESHING'?'op.refreshing_google_reports':'op.refresh_google_reports')}</button>:<p className="max-w-xs text-xs text-stone-300">{t('ui4.refresh_admin_only')}</p>}
    {refreshStatus==='SUCCESS'&&<p role="status" className="text-emerald-300">{t('op.google_reports_refreshed')}</p>}{refreshStatus==='UNKNOWN_TIME'&&<p role="status" className="text-amber-200">{t('ui4.refresh_time_unknown')}</p>}{refreshStatus==='FAILURE'&&<p role="alert" className="text-rose-300">{t(refreshError==='COOLDOWN'?'op.google_reports_refresh_cooldown':refreshError==='RATE_LIMITED'?'op.google_reports_refresh_rate_limited':'op.google_reports_refresh_failed')}</p>}{lastRefreshAt&&<span className="text-xs text-stone-300">{t('op.last_google_report_refresh',{at:time(lastRefreshAt)})}</span>}
   </div></header>
  {read.phase==='LOADING'&&<p role="status">{t('analytics.ui.loading_authorized_trip_data')}</p>}{read.phase==='ERROR'&&<p role="alert">{t('readiness.unavailable')} {t('ui4.read_failed')}</p>}
  {view&&<><div className="flex flex-wrap items-end gap-3"><label>{t('op.family')}<select aria-label={t('op.family')} className="min-h-11 max-w-full rounded border border-stone-600 bg-stone-900 px-3" value={view.family} onChange={e=>setFamily(e.target.value)}>{view.families.map(v=><option key={v} value={v}>{t(`op.${v}`)}</option>)}</select></label>
   {['dateFrom','dateTo','carrierId','truckId','driverId','shift','materialId','status'].map(k=><label key={k} className="min-w-0">{t(`op.${k}`)}{k.startsWith('date')?<input className="block min-h-11 max-w-full rounded border border-stone-600 bg-stone-900 px-2" type="date" value={filters[k]||''} onChange={e=>setFilters({...filters,[k]:e.target.value})}/>:<select className="block min-h-11 max-w-full rounded border border-stone-600 bg-stone-900 px-2" value={filters[k]||''} onChange={e=>setFilters({...filters,[k]:e.target.value})}><option value="">{t('op.all')}</option>{[...new Set(view.optionRows.map(row=>String(row[k]||'')))].filter(Boolean).map(v=>{const nameKey=({carrierId:'carrier',truckId:'truck',driverId:'driver',materialId:'material'} as Record<string,string>)[k],names=new Set(view.optionRows.filter(row=>row[k]===v).map(row=>row[nameKey]).filter(Boolean));return <option key={v} value={v}>{names.size===1?`${[...names][0]} (${v})`:k==='status'?t(`op.${v}`):v}</option>;})}</select>}</label>)}<button type="button" className={button} onClick={()=>setFilters({})}>{t('ui4.reset_filters')}</button></div>
   {view.family==='WEEKLY'&&<p>{t('op.weekly_help')}</p>}{invalidDates?<p role="alert">{t('ui4.invalid_dates')}</p>:<>
    <div className="flex flex-wrap gap-2"><button id="btn-export-csv" className={button} onClick={()=>{if(scope.isCurrent())reportsEngineService.exportToCSV(view.dataset);}}>{t('analytics.ui.export_csv')}</button><button id="btn-export-xlsx" className={button} onClick={()=>{if(scope.isCurrent())reportsEngineService.exportToXLSX(view.dataset);}}>{t('analytics.ui.export_excel_xlsx')}</button><button id="btn-print-pdf" className={button} onClick={()=>{if(scope.isCurrent())setPrintOpen(true);}}>{t('analytics.ui.preview_and_print_pdf')}</button></div><p className="text-stone-300">{t('ui4.export_scope')} · {t('ui4.result_count',{count:view.dataset.rows.length})}</p>
    {read.trips.length===0?<p role="status">{t('ui4.source_empty')}</p>:view.dataset.rows.length===0&&<p role="status">{t('ui4.filtered_empty')}</p>}
    {groups.filter(([,keys])=>keys.length).map(([label,keys])=><section key={label} aria-label={t(label)} className="space-y-2"><h3 className="font-semibold">{t(label)}</h3><dl className="grid grid-cols-2 gap-3 md:grid-cols-4">{keys.map(k=><div key={k} className="min-w-0 rounded-lg border border-stone-700 p-3"><dt className="text-xs text-stone-300">{t(`op.${k}`)}</dt><dd className="mt-1 break-words text-lg font-semibold">{display((view.report.metrics as unknown as Record<string,unknown>)[k])}</dd></div>)}</dl></section>)}
    {view.legacyTripsExcluded>0&&<p>{t('op.legacy_excluded',{count:view.legacyTripsExcluded})}</p>}
    <div className="max-w-full overflow-auto rounded-lg border border-stone-700 focus-visible:ring-2 focus-visible:ring-emerald-400" tabIndex={0} role="region" aria-label={t('ui4.results_table')}><table className="w-full text-start text-xs text-stone-100"><thead><tr>{view.dataset.columns.map(c=><th scope="col" className="p-3 text-start" key={c.key}>{c.labelAr}</th>)}</tr></thead><tbody>{view.dataset.rows.map((row,i)=><tr key={String(row.tripId??row.period??i)} className="border-t border-stone-800">{view.dataset.columns.map(c=><td className="whitespace-nowrap p-3" key={c.key}><bdi>{display(row[c.key])}</bdi></td>)}</tr>)}</tbody></table></div>
    {printOpen&&<PrintableReportModal dataset={view.dataset} sourceReadAt={read.completedAt} onClose={()=>setPrintOpen(false)}/>}</>}
  </>}
 </section>;
}
