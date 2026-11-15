import type {TripEntity} from '../../types/entities';
import type {OperationalConfiguration} from '../../types/operationalProfile';
import type {ReportDataset} from '../../types/reports';
import {buildOperationalReport, profileTripRow} from '../../services/operationalReporting';
import {profileTripColumns} from '../../services/operationalReportColumns';
import {reportsEngineService} from '../../services/reportsEngine.service';

export type ReportFilters = Record<string, string>;
export const REPORT_FAMILIES = ['DAILY', 'WEEKLY', 'CARRIER', 'TRUCK', 'DRIVER', 'SHIFT', 'MATERIAL', 'DELAY', 'LIVE'] as const;
type Translate = (key: string, params?: Record<string, string | number>) => string;
export function reportValue(field: string, value: unknown, t: Translate): string | number {
  if (value == null) return '—';
  if (['status', 'delayStatus', 'loadingWeightBasis', 'unloadingWeightBasis'].includes(field)) return t(`op.${String(value)}`);
  return typeof value === 'number' ? value : String(value);
}

/** Compose existing calculations into one family/filter dataset. No new calculation authority. */
export function operationalReportPresentation(trips: TripEntity[], projectId: string,
  configuration: OperationalConfiguration | undefined, filters: ReportFilters, requestedFamily: string,
  generatedAt: string, t: Translate) {
  const now = new Date(generatedAt);
  const base = buildOperationalReport(trips, {projectId, ...filters}, now, configuration);
  const families: readonly string[] = [...REPORT_FAMILIES, ...(base.capabilities.weightReconciliation ? ['WEIGHT_RECONCILIATION'] : [])];
  const family = families.includes(requestedFamily) ? requestedFamily : 'DAILY';
  const selectedRows = family === 'DELAY' ? base.rows.filter(row => row.exception || row.delayStatus === 'DELAYED')
    : family === 'LIVE' ? base.liveMovement : base.rows;
  const ids = new Set(selectedRows.map(row => String(row.tripId)));
  const selectedTrips = trips.filter(trip => trip.projectId === projectId && ids.has(trip.tripId));
  const calculated = family === 'DELAY' || family === 'LIVE'
    ? buildOperationalReport(selectedTrips, {projectId, ...filters}, now, configuration) : base;
  // Keep history-dependent row facts (notably prior-trip idle time) from the full canonical read.
  const report = {...calculated, rows: selectedRows, liveMovement: selectedRows.filter(row =>
    !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(String(row.status)))};
  const productivityKinds = {CARRIER: 'carrier', TRUCK: 'truck', DRIVER: 'driver', SHIFT: 'shift', MATERIAL: 'material'} as const;
  const productivity = productivityKinds[family as keyof typeof productivityKinds];
  const period = family === 'DAILY' || family === 'WEEKLY';
  const headers = [...new Set(selectedTrips.flatMap(trip => trip.operationalSnapshot ? profileTripColumns(trip.operationalSnapshot.configuration) : []))];
  if (!headers.length && configuration) headers.push(...profileTripColumns(configuration));
  const rows: Record<string, unknown>[] = period ? (family === 'DAILY' ? report.periods.daily : report.periods.weekly)
    : productivity ? Object.entries(report.productivity[productivity]).map(([id, count]) => ({[productivity]: id, trips: count})) : selectedRows;
  const keys = period ? ['period', 'trips', 'completed', ...(report.capabilities.measuredLoading ? ['measuredLoadedTonnes'] : []),
    ...(report.capabilities.measuredUnloading ? ['measuredReceivedTonnes'] : []), ...(report.capabilities.estimatedProduction ? ['estimatedTonnes'] : [])]
    : productivity ? [productivity, 'trips'] : headers;
  // The existing exporter always emits these audit columns. Supply truthful unavailable
  // aggregate values so it cannot synthesize a source type or today's snapshot date.
  const audit = ['sourceType', 'pricingSnapshotAt', 'destinationWeightSource', 'settlementStatus'];
  const label = (key: string) => t(audit.includes(key) ? `ui4.${key}` : `op.${key}`);
  const tripsById = new Map(selectedTrips.map(trip => [trip.tripId, trip]));
  const dataset: ReportDataset = {
    reportType: 'DAILY_OPERATIONS', category: 'OPERATIONAL', titleAr: t(`op.${family}`), titleEn: family,
    descriptionAr: t('op.reporting_help'), generatedAt,
    filtersApplied: {projectId, ...filters, shiftDateFrom: filters.dateFrom, shiftDateTo: filters.dateTo},
    summary: reportsEngineService.calculateSummary(selectedTrips.map(trip => reportsEngineService.adaptTripEntityToRecord(trip))),
    columns: [...keys, ...audit].map(key => ({key, labelAr: label(key), labelEn: label(key)})),
    rows: rows.map(row => {
      const trip = tripsById.get(String(row.tripId));
      const values = Object.fromEntries(Object.entries(row).map(([key, value]) => [key, reportValue(key, value, t)]));
      for (const key of keys) if (!Object.hasOwn(values, key)) values[key] = '—';
      return {...values,
        ...(audit.length ? {sourceType: trip?.sourceType ?? '—', pricingSnapshotAt: trip?.pricingSnapshot?.pricingSnapshotAt ?? '—',
          destinationWeightSource: trip?.unloadingDataSource ?? '—', settlementStatus: trip ? t(trip.financials.isFinalized ? 'ui4.finalized' : 'ui4.pending') : '—'} : {})};
    })
  };
  return {report, dataset, family, families, optionRows: trips.filter(trip => trip.projectId === projectId && trip.operationalSnapshot).map(trip => profileTripRow(trip, now)), legacyTripsExcluded: base.legacyTripsExcluded};
}

/** Make legacy export audit columns explicit in the same rendered/printed dataset.
 * Missing historical evidence remains unavailable; never invoke export fallbacks. */
export function completeReportExportColumns(dataset:ReportDataset,t:Translate):ReportDataset {
 const aliases:Record<string,string[]>={sourceType:['sourceType','sourceTypeLabelAr'],pricingSnapshotAt:['pricingSnapshotAt','snapshotDate'],destinationWeightSource:['destinationWeightSource','destinationWeightSourceLabelAr'],settlementStatus:['settlementStatus','pricingStatusLabelAr']};
 const columns=[...dataset.columns];
 for(const [key,names] of Object.entries(aliases))if(!columns.some(c=>names.includes(c.key)))columns.push({key,labelAr:t('ui4.'+key),labelEn:t('ui4.'+key)});
 return {...dataset,columns,rows:dataset.rows.map(row=>{const copy={...row};for(const [key,names] of Object.entries(aliases))if(columns.some(c=>c.key===key)&&copy[key]==null)copy[key]=names.map(n=>row[n]).find(v=>v!=null)??'—';return copy;})};
}
