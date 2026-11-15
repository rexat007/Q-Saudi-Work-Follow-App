import {ImportOverlay} from '../import/ImportOverlay';
import { presentAnalyticsText, presentReportCell } from '../../i18n/analyticsPresentation';
import { useI18n } from '../../i18n';
import React from 'react';
import { X, Printer, ShieldCheck, Building2, Calendar, FileText } from 'lucide-react';
import { ReportDataset } from '../../types/reports';

interface PrintableReportModalProps {
  dataset: ReportDataset;
  onClose: () => void;
  sourceReadAt?: string;
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({ dataset, onClose, sourceReadAt }) => {
  const { t: translate, isRTL, locale } = useI18n();
  const projectId = dataset.filtersApplied.projectId || dataset.historicalProjectInfo?.projectId || 'ALL';
  const projectInfo=dataset.historicalProjectInfo;
  const projectName = projectInfo?.nameAr || projectInfo?.nameEn || (projectId === 'ALL' ? translate("analytics.ui.all_construction_projects") : projectId);
  const zatcaTaxNo = projectInfo?.zatcaTaxNumber || '—';
  const formatTime=(value:string)=>Number.isFinite(Date.parse(value))?new Date(value).toLocaleString(locale):translate('op.UNAVAILABLE');

  const handlePrint = () => {
    window.print();
  };

  // Wide operational reports print in bounded column bands, retaining every row
  // and repeating the existing Trip identity for cross-band reading.
  const identityColumn=dataset.columns.find(c=>c.key==='tripId');
  const columnBands=dataset.columns.length>8?Array.from({length:Math.ceil(dataset.columns.length/6)},(_,index)=>{const columns=dataset.columns.slice(index*6,index*6+6);return identityColumn&&!columns.includes(identityColumn)?[identityColumn,...columns]:columns;}):[dataset.columns];

  const document = (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="w-full min-w-0 flex items-center justify-center print:p-0 print:bg-white print:static print:overflow-visible">
      <style>{`@page { margin: 12mm; } @media print { body { overflow: visible !important; } body > [aria-hidden="true"] { display: none !important; } [data-import-overlay="WORKFLOW"]:has(#printable-report-document) { position: static !important; overflow: visible !important; background: white !important; padding: 0 !important; } #printable-report-document table { table-layout: fixed; width: 100%; } #printable-report-document th, #printable-report-document td { overflow-wrap: anywhere; word-break: break-word; font-size: 10px; padding: 4px; } #printable-report-document tr { break-inside: avoid; } #printable-report-document [data-report-print-band] { overflow: visible; break-inside: avoid; } }`}</style>
      {/* Container */}
      <div 
        id="printable-report-document"
        className="bg-white min-w-0 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] print:max-h-none print:shadow-none print:rounded-none border border-stone-200"
      >
        {/* Modal Top Action Bar (Hidden during print) */}
        <div className="flex flex-wrap gap-2 items-center justify-between px-3 sm:px-6 py-3.5 bg-stone-900 text-white print:hidden">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">{translate('ui4.print_preview')}</span>
            <span className="text-xs bg-stone-800 text-stone-300 px-2 py-0.5 rounded font-mono">
              {translate('ui4.print_unregistered')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex min-h-11 items-center gap-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{translate("analytics.ui.print_save_as_pdf")}</span>
            </button>
            <button
              onClick={onClose}
              className="min-h-11 min-w-11 p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label={translate("shared.actions.close")}
              title={translate("shared.actions.close")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="p-3 sm:p-10 overflow-y-auto print:overflow-visible space-y-6 text-stone-900 font-sans">
          
          {/* 1. Official Header */}
          <div className="border-b-2 border-stone-800 pb-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-stone-600 uppercase">
                  <span>{translate("analytics.ui.kingdom_of_saudi_arabia")}</span>
                  <span>•</span>
                  <span>{translate("analytics.ui.logistics_transport_tracking_and_management_for_major_projects")}</span>
                </div>
                <h1 className="text-2xl font-black text-stone-950 mt-1">
                  {presentAnalyticsText(dataset.titleAr, translate)}
                </h1>
                <p className="text-xs text-stone-500 font-mono tracking-tight mt-0.5">
                  {translate('ui4.print_unregistered')}
                </p>
              </div>

              <div className="text-left sm:text-right border-r sm:border-r-0 sm:border-l border-stone-300 pr-3 sm:pr-0 sm:pl-4">
                <div className="text-xs font-bold text-stone-800">{projectName}</div>
                <div className="text-[11px] text-stone-600 font-mono">{translate("analytics.ui.zatca_tax_number")}{" "}{zatcaTaxNo}</div>
                <div className="text-[11px] text-stone-500">
                  {translate('ui4.generated_at')}{" "}<bdi dir="ltr">{formatTime(dataset.generatedAt)}</bdi>
                  {sourceReadAt&&<p>{translate('ui4.source_read_at')}: <bdi dir="ltr">{formatTime(sourceReadAt)}</bdi></p>}
                </div>
              </div>
            </div>

            {/* Applied Filters Strip */}
            <div className="mt-4 bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-xs flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="font-bold text-stone-700">{translate("analytics.ui.applied_filter_criteria")}</span>
              <span className="text-stone-600">{translate("operations.project")}{" "}<strong>{projectName}</strong></span>
              <span className="text-stone-600">
                {translate("analytics.ui.period")}{" "}<strong>{dataset.filtersApplied.dateFrom || dataset.filtersApplied.shiftDateFrom || translate("analytics.ui.start")} {" "}{translate("operations.to")}{" "}{dataset.filtersApplied.dateTo || dataset.filtersApplied.shiftDateTo || translate("analytics.ui.end")}</strong>
              </span>
              {dataset.filtersApplied.carrierId && dataset.filtersApplied.carrierId !== 'ALL' && (
                <span className="text-stone-600">{translate("operations.carrier")}{" "}<strong>{dataset.filtersApplied.carrierId}</strong></span>
              )}
              {dataset.filtersApplied.materialId && dataset.filtersApplied.materialId !== 'ALL' && (
                <span className="text-stone-600">{translate("loading.labels.material_2")}{" "}<strong>{dataset.filtersApplied.materialId}</strong></span>
              )}
              {dataset.filtersApplied.pricingType && dataset.filtersApplied.pricingType !== 'ALL' && (
                <span className="text-stone-600">{translate("analytics.ui.pricing_model")}{" "}<strong>{dataset.filtersApplied.pricingType}</strong></span>
              )}
              {dataset.filtersApplied.status && dataset.filtersApplied.status !== 'ALL' && (
                <span className="text-stone-600">{translate("analytics.ui.trip_status_151")}{" "}<strong>{dataset.filtersApplied.status}</strong></span>
              )}
            </div>
          </div>

          {/* 2. Executive 4 Financial Totals & Operations Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
              <div className="text-[11px] font-bold text-stone-500">{translate("analytics.ui.contractual_gross_amount")}</div>
              <div className="text-lg font-black text-stone-900 mt-1 font-mono">
                {dataset.summary.grossAmountSAR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">SAR</span>
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">{translate("analytics.ui.based_on_the_trip_settlementamount")}</div>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
              <div className="text-[11px] font-bold text-emerald-800">{translate("analytics.ui.approved_adjustments")}</div>
              <div className="text-lg font-black text-emerald-900 mt-1 font-mono">
                +{dataset.summary.adjustmentsSAR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">SAR</span>
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5">{translate("analytics.ui.waiting_allowances_and_weighbridge_tolerance")}</div>
            </div>

            <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200">
              <div className="text-[11px] font-bold text-rose-800">{translate("analytics.ui.exceptions_and_deductions")}</div>
              <div className="text-lg font-black text-rose-900 mt-1 font-mono">
                -{dataset.summary.exceptionsSAR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">SAR</span>
              </div>
              <div className="text-[10px] text-rose-700 mt-0.5">{translate("analytics.ui.weighbridge_shortages_and_returned_trip_deductions")}</div>
            </div>

            <div className="bg-amber-500/10 p-3.5 rounded-xl border-2 border-amber-500">
              <div className="text-[11px] font-bold text-amber-900">{translate("analytics.ui.final_net_amount_payable")}</div>
              <div className="text-xl font-black text-amber-950 mt-1 font-mono">
                {dataset.summary.netAmountSAR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">SAR</span>
              </div>
              <div className="text-[10px] text-amber-800 font-bold mt-0.5">{translate("analytics.ui.final_net_financial_obligation")}</div>
            </div>
          </div>

          {/* Operational Secondary Badges */}
          <div className="flex flex-wrap items-center justify-between text-xs bg-stone-100/70 px-4 py-2 rounded-lg text-stone-700 font-semibold">
            <span>{translate("op.trips")}{" "}<strong>{dataset.summary.totalTrips} {" "}{translate("operations.trip")}</strong></span>
            <span>{translate("analytics.ui.net_transported_weight")}{" "}<strong>{dataset.summary.totalNetWeightTons.toLocaleString()} {" "}{translate("dashboard.labels.metric_ton")}</strong></span>
            <span>{translate("analytics.ui.completed_trips")}{" "}<strong>{dataset.summary.completedTripsCount}</strong></span>
            <span>{translate("analytics.ui.returned_trips")}{" "}<strong>{dataset.summary.returnedTripsCount}</strong></span>
            <span>{translate("analytics.ui.active_exceptions")}{" "}<strong>{dataset.summary.exceptionsCount}</strong></span>
          </div>

          {/* 3. Detailed Data Table */}
          {columnBands.map((columns,bandIndex)=><div key={bandIndex} data-report-print-band={bandIndex} tabIndex={0} role="region" aria-label={`${presentAnalyticsText(dataset.titleAr,translate)} ${bandIndex+1}/${columnBands.length}`} className="overflow-x-auto border border-stone-200 rounded-xl">
            {columnBands.length>1&&<p className="p-2 text-xs font-semibold">{presentAnalyticsText(dataset.titleAr,translate)} · {bandIndex+1}/{columnBands.length}</p>}
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-stone-800 text-stone-100 font-bold">
                  <th className="p-2.5 text-center w-10">#</th>
                  {columns.map((c) => (
                    <th 
                      key={c.key} data-report-column={c.key}
                      className={`p-2.5 border-r border-stone-700/50 ${
                        c.align === 'center' ? 'text-center' : c.align === 'left' ? 'text-left' : 'text-right'
                      }`}
                    >
                      {presentAnalyticsText(c.labelAr, translate)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-normal">
                {dataset.rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="p-6 text-center text-stone-500">
                      {translate("analytics.ui.no_data_matches_the_selected_filter_criteria")}</td>
                  </tr>
                ) : (
                  dataset.rows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}>
                      <td className="p-2 text-center text-stone-400 font-mono text-[11px] border-l border-stone-200">
                        {idx + 1}
                      </td>
                      {columns.map((col) => {
                        const val = row[col.key];
                        return (
                          <td 
                            key={col.key} 
                            className={`p-2 border-l border-stone-200 ${
                              col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left font-mono' : 'text-right'
                            }`}
                          >
                            {col.format === 'currency' && typeof val === 'number'
                              ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : col.format === 'number' && typeof val === 'number'
                              ? val.toLocaleString()
                              : val !== undefined && val !== null ? presentReportCell(col.key, val, translate) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>)}

          {/* 4. Contractual Notes & Rules Compliance */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>{translate("analytics.ui.contractual_compliance_declaration")}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900">
              {translate("analytics.ui.amounts_rely_exclusively_on_contractual_pricing_snapshots_settlementamount_stored_when")}</p>
          </div>

          <p className="text-xs text-stone-600">{translate('ui4.signatures_unrecorded')}</p>
          {/* 5. Formal Certification & Signature Blocks */}
          <div className="pt-6 border-t-2 border-stone-300 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-6">
              <div className="font-bold text-stone-700">{translate("analytics.ui.prepared_by_transport_and_weighbridge_operator")}</div>
              <div className="h-12 border-b border-dashed border-stone-400 mx-6"></div>
              <div className="text-[11px] text-stone-500">{translate("analytics.ui.signature_and_date")}</div>
            </div>

            <div className="space-y-6">
              <div className="font-bold text-stone-700">{translate("analytics.ui.reviewed_by_contracts_and_financial_control")}</div>
              <div className="h-12 border-b border-dashed border-stone-400 mx-6"></div>
              <div className="text-[11px] text-stone-500">{translate("analytics.ui.signature_and_stamp")}</div>
            </div>

            <div className="space-y-6">
              <div className="font-bold text-stone-700">{translate("analytics.ui.approved_by_executive_project_manager")}</div>
              <div className="h-12 border-b border-dashed border-stone-400 mx-6"></div>
              <div className="text-[11px] text-stone-500">{translate("analytics.ui.signature_and_approval")}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
  if(typeof globalThis.document==='undefined')return document;
  return <ImportOverlay level="WORKFLOW" label={translate('ui4.print_preview')} onDismiss={onClose} className="print:static print:p-0 print:bg-white print:overflow-visible">{document}</ImportOverlay>;
};
