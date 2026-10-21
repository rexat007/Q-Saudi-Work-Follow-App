import { presentBatch4Message } from '../../i18n/batch4Messages';
import { useI18n } from '../../i18n';
import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  AlertCircle,
  FileText,
  Users,
  Truck,
  Box,
  Building2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { UnifiedImportBatch } from '../../types/unifiedImport';
import { RosterBatchReviewService } from '../../services/import/rosterBatchReview.service';

export interface RosterFinalReviewLayerProps {
  importBatch: UnifiedImportBatch;
  onCommit: () => Promise<void>;
  isCommitting?: boolean;
  commitError?: string | null;
  onClose?: () => void;
  embeddedInWorkflowHost?: boolean;
}

export const classifyFinalReviewBlocker = (batch: UnifiedImportBatch): 'CARRIER' | 'MATERIAL' | 'DRIVER_TRUCK' => {
  const batchGroups = RosterBatchReviewService.getBatchReviewGroups(batch);
  const issues = batch.issues || [];
  const rows = batch.rows || [];
  const activeRows = rows.filter((r) => r.status !== 'REJECTED');

  // Check Carrier
  const unresolvedCarriers = (batchGroups.carrier || []).some(
    (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
  );
  const carrierIssues = issues.some(
    (iss) => (iss.severity === 'BLOCKING' || iss.blocking) &&
      iss.code !== 'DRIVER_CARRIER_CONFLICT' &&
      (iss.field === 'carrierId' || iss.code === 'UNRESOLVED_CARRIER' || String(iss.code).startsWith('CARRIER_'))
  );
  const carrierRowBlock = activeRows.some((r) => {
    const res = r.entityResolutions?.carrier;
    return !res?.matchedId ||
      res.creationDisposition === 'CONFLICT' ||
      res.recommendation === 'REJECT' ||
      res.recommendation === 'REVIEW' ||
      res.relationshipStatus === 'RELATIONSHIP_CONFLICT' ||
      res.relationshipStatus === 'CROSS_PROJECT_BLOCKED' ||
      res.riskLevel === 'CRITICAL';
  });

  if (unresolvedCarriers || carrierIssues || carrierRowBlock) {
    return 'CARRIER';
  }

  // Check Material
  const unresolvedMaterials = (batchGroups.material || []).some(
    (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
  );
  const materialIssues = issues.some(
    (iss) => (iss.severity === 'BLOCKING' || iss.blocking) &&
      (iss.field === 'materialId' || String(iss.code).includes('MATERIAL'))
  );
  const materialRowBlock = activeRows.some((r) => {
    const res = r.entityResolutions?.material;
    return !res?.matchedId ||
      res.creationDisposition === 'CONFLICT' ||
      res.recommendation === 'REJECT' ||
      res.recommendation === 'REVIEW' ||
      res.relationshipStatus === 'MATERIAL_PROJECT_CONFLICT' ||
      res.relationshipStatus === 'CROSS_PROJECT_BLOCKED' ||
      res.riskLevel === 'CRITICAL';
  });

  if (unresolvedMaterials || materialIssues || materialRowBlock) {
    return 'MATERIAL';
  }

  return 'DRIVER_TRUCK';
};

export const RosterFinalReviewLayer: React.FC<RosterFinalReviewLayerProps> = ({
  importBatch,
  onCommit,
  isCommitting = false,
  commitError = null,
  onClose,
  embeddedInWorkflowHost = false,
}) => {
  const { t } = useI18n();
  const rows = importBatch.rows || [];
  const activeRows = rows.filter((r) => r.status !== 'REJECTED');
  const totalRows = rows.length;

  const batchGroups = RosterBatchReviewService.getBatchReviewGroups(importBatch);
  const issues = importBatch.issues || [];

  const blockerType = classifyFinalReviewBlocker(importBatch);

  // Group stats
  const carrierGroups = batchGroups.carrier || [];
  const materialGroups = batchGroups.material || [];
  const driverGroups = batchGroups.driver || [];
  const truckGroups = batchGroups.truck || [];

  const unresolvedCarrierCount = carrierGroups.filter(
    (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
  ).length;
  const unresolvedMaterialCount = materialGroups.filter(
    (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
  ).length;
  const unresolvedDriverCount = driverGroups.filter(
    (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
  ).length;
  const unresolvedTruckCount = truckGroups.filter(
    (g) => g.status === 'REVIEW_REQUIRED' || g.status === 'UNRESOLVED' || g.status === 'CONFLICT'
  ).length;

  const unresolvedGroupCount =
    unresolvedCarrierCount + unresolvedMaterialCount + unresolvedDriverCount + unresolvedTruckCount;

  const [confirmWarnings, setConfirmWarnings] = useState<boolean>(
    Boolean(importBatch?.warningConfirmation?.confirmed)
  );

  const blockedRows = activeRows.filter((r) => {
    const isErrorStatus = r.status === 'ERROR' || r.reviewStatus === 'requires_review' || r.reviewStatus === 'error';
    const missingCarrier = !r.entityResolutions?.carrier?.matchedId;
    const missingMaterial = !r.entityResolutions?.material?.matchedId;
    
    const isDriverResolved = Boolean(
      r.entityResolutions?.driver?.matchedId ||
      (r.entityResolutions?.driver?.creationDisposition === 'PREPARED_NEW' && r.entityResolutions?.driver?.preparedDriverPlan)
    );
    const missingDriver = Boolean(r.raw?.driverName || r.canonical?.driverName) && !isDriverResolved;

    const isTruckResolved = Boolean(
      r.entityResolutions?.truck?.matchedId ||
      (r.entityResolutions?.truck?.creationDisposition === 'PREPARED_NEW' && r.entityResolutions?.truck?.preparedTruckPlan)
    );
    const missingTruck = Boolean(r.raw?.truckPlate || r.canonical?.truckPlate) && !isTruckResolved;

    return isErrorStatus || missingCarrier || missingMaterial || missingDriver || missingTruck;
  });

  const blockingIssues = issues.filter((iss) => iss.severity === 'BLOCKING' || iss.blocking);
  const warningRows = activeRows.filter((r) => r.status === 'WARNING');
  const rejectedRows = rows.filter((r) => r.status === 'REJECTED');
  const alreadyCommittedRows = rows.filter((r) => r.status === 'COMMITTED');

  const readyRowsCount = activeRows.length - blockedRows.length;
  const isReadyToCommit =
    activeRows.length > 0 &&
    blockedRows.length === 0 &&
    unresolvedGroupCount === 0 &&
    blockingIssues.length === 0;

  const canCommit = isReadyToCommit && (warningRows.length === 0 || confirmWarnings);

  const panelContent = (
    <div className={`bg-stone-900 border border-stone-800 rounded-2xl w-full overflow-hidden flex flex-col ${embeddedInWorkflowHost ? 'flex-1 min-h-0' : 'max-w-5xl shadow-2xl max-h-[90vh]'}`}>
      {/* Header */}
      <div className="p-5 border-b border-stone-800 bg-stone-950 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <ShieldCheck className="w-4 h-4" />
          </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>{t('entityResolution.labels.final_review_title')}</span>
                <span className="text-[10px] font-mono bg-stone-800 px-2 py-0.5 rounded-full text-amber-400">
                  {t('entityResolution.labels.stage_progress', { stage: 6, total: 7 })}
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                {t('entityResolution.labels.final_review_description')}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs text-stone-300">
          {/* Readiness Banner */}
          {isReadyToCommit ? (
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-xl flex items-center justify-between gap-3 text-emerald-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold block text-sm text-emerald-300">
                    {t('entityResolution.messages.batch_ready_count', { ready: readyRowsCount, total: totalRows })}</span>
                  <span className="text-xs text-emerald-300/80">
                    {t('entityResolution.messages.entities_resolved_ready')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-rose-950/40 border border-rose-800/60 p-4 rounded-xl flex items-center justify-between gap-3 text-rose-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold block text-sm text-rose-300">
                    {t('entityResolution.messages.batch_not_ready_counts', { blocked: blockedRows.length, unresolved: unresolvedGroupCount })}</span>
                  <span className="text-xs text-rose-300/80">
                    {blockerType === 'CARRIER'
                      ? t('entityResolution.messages.carrier_changed_reanalysis_required')
                      : t('entityResolution.messages.resolve_before_commit')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {commitError && (
            <div className="bg-rose-950/60 border border-rose-800 p-3.5 rounded-xl text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{presentBatch4Message(commitError, t)}</span>
            </div>
          )}

          {/* Overall Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 bg-stone-950 p-3.5 rounded-xl border border-stone-850 text-center font-bold">
            <div>
              <span className="block text-stone-500 text-[10px]">{t('entityResolution.labels.total_records')}</span>
              <span className="text-sm font-mono text-white">{totalRows}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">{t('entityResolution.labels.ready_for_approval')}</span>
              <span className="text-sm font-mono text-emerald-400">{readyRowsCount}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">{t('entityResolution.labels.rows_with_warnings')}</span>
              <span className="text-sm font-mono text-amber-400">{warningRows.length}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">{t('entityResolution.labels.blocked_error_rows')}</span>
              <span className="text-sm font-mono text-rose-400">{blockedRows.length}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">{t('entityResolution.labels.excluded_rows')}</span>
              <span className="text-sm font-mono text-stone-400">{rejectedRows.length}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">{t('entityResolution.labels.previously_committed')}</span>
              <span className="text-sm font-mono text-cyan-400">{alreadyCommittedRows.length}</span>
            </div>
            <div>
              <span className="block text-stone-500 text-[10px]">{t('entityResolution.labels.unresolved_items')}</span>
              <span className={`text-sm font-mono ${unresolvedGroupCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {unresolvedGroupCount}
              </span>
            </div>
          </div>

          {/* Resolutions Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Carrier Summary */}
            <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-850 space-y-1">
              <div className="flex justify-between items-center text-stone-400 font-bold text-[11px]">
                <span className="flex items-center gap-1.5 text-white">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('entityResolution.labels.carriers')}</span>
                </span>
                <span className="font-mono text-[10px]">{t('entityResolution.labels.group_count', { count: carrierGroups.length })}</span>
              </div>
              <p className="text-[11px] font-mono text-stone-300">
                {t('entityResolution.labels.group_resolution_progress', { resolved: carrierGroups.length - unresolvedCarrierCount, total: carrierGroups.length })}</p>
              {unresolvedCarrierCount > 0 ? (
                <p className="text-[10px] text-rose-400 font-bold">{t('entityResolution.labels.unresolved_groups_remaining', { count: unresolvedCarrierCount })}</p>
              ) : (
                <p className="text-[10px] text-emerald-400 font-semibold">{t('entityResolution.labels.complete_stable')}</p>
              )}
            </div>

            {/* Material Summary */}
            <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-850 space-y-1">
              <div className="flex justify-between items-center text-stone-400 font-bold text-[11px]">
                <span className="flex items-center gap-1.5 text-white">
                  <Box className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('other.labels.materials_5')}</span>
                </span>
                <span className="font-mono text-[10px]">{t('entityResolution.labels.group_count', { count: materialGroups.length })}</span>
              </div>
              <p className="text-[11px] font-mono text-stone-300">
                {t('entityResolution.labels.group_resolution_progress', { resolved: materialGroups.length - unresolvedMaterialCount, total: materialGroups.length })}</p>
              {unresolvedMaterialCount > 0 ? (
                <p className="text-[10px] text-rose-400 font-bold">{t('entityResolution.labels.unresolved_groups_remaining', { count: unresolvedMaterialCount })}</p>
              ) : (
                <p className="text-[10px] text-emerald-400 font-semibold">{t('entityResolution.labels.complete_stable')}</p>
              )}
            </div>

            {/* Driver Summary */}
            <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-850 space-y-1">
              <div className="flex justify-between items-center text-stone-400 font-bold text-[11px]">
                <span className="flex items-center gap-1.5 text-white">
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('other.labels.drivers_5')}</span>
                </span>
                <span className="font-mono text-[10px]">{t('entityResolution.labels.group_count', { count: driverGroups.length })}</span>
              </div>
              <p className="text-[11px] font-mono text-stone-300">
                {t('entityResolution.labels.group_resolution_progress', { resolved: driverGroups.length - unresolvedDriverCount, total: driverGroups.length })}</p>
              {unresolvedDriverCount > 0 ? (
                <p className="text-[10px] text-rose-400 font-bold">{t('entityResolution.labels.unresolved_groups_remaining', { count: unresolvedDriverCount })}</p>
              ) : (
                <p className="text-[10px] text-emerald-400 font-semibold">{t('entityResolution.labels.complete_stable')}</p>
              )}
            </div>

            {/* Truck Summary */}
            <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-850 space-y-1">
              <div className="flex justify-between items-center text-stone-400 font-bold text-[11px]">
                <span className="flex items-center gap-1.5 text-white">
                  <Truck className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('entityResolution.labels.trucks')}</span>
                </span>
                <span className="font-mono text-[10px]">{t('entityResolution.labels.group_count', { count: truckGroups.length })}</span>
              </div>
              <p className="text-[11px] font-mono text-stone-300">
                {t('entityResolution.labels.group_resolution_progress', { resolved: truckGroups.length - unresolvedTruckCount, total: truckGroups.length })}</p>
              {unresolvedTruckCount > 0 ? (
                <p className="text-[10px] text-rose-400 font-bold">{t('entityResolution.labels.unresolved_groups_remaining', { count: unresolvedTruckCount })}</p>
              ) : (
                <p className="text-[10px] text-emerald-400 font-semibold">{t('entityResolution.labels.complete_stable')}</p>
              )}
            </div>
          </div>

          {/* Warning Confirmation Banner if warnings exist */}
          {warningRows.length > 0 && isReadyToCommit && (
            <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t('entityResolution.messages.warning_acceptance_required', { count: warningRows.length })}</span>
              </div>
              <label htmlFor="confirm-warnings" className="flex items-center gap-2 cursor-pointer text-amber-200 font-bold hover:text-white shrink-0">
                <input
                  id="confirm-warnings"
                  type="checkbox"
                  checked={confirmWarnings}
                  onChange={(e) => {
                    setConfirmWarnings(e.target.checked);
                    if (importBatch) {
                      importBatch.warningConfirmation = e.target.checked
                        ? {
                            confirmed: true,
                            confirmedAt: new Date().toISOString(),
                            confirmedBy: 'OPERATIONAL_SUPERVISOR',
                          }
                        : undefined;
                    }
                  }}
                  className="w-4 h-4 rounded-sm border-amber-600 bg-stone-900 text-amber-600 focus:ring-amber-500"
                />
                <span>{t('entityResolution.labels.accept_warning_records')}</span>
              </label>
            </div>
          )}

          {/* Row Preview Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-stone-400 font-bold border-b border-stone-800 pb-2">
              <span className="text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>{t('entityResolution.labels.canonical_preview_count', { count: rows.length })}</span>
              </span>
            </div>

            <div className="overflow-x-auto max-h-[260px] overflow-y-auto border border-stone-850 rounded-xl bg-stone-950">
              <table className="w-full text-right text-xs">
                <thead className="sticky top-0 bg-stone-900 border-b border-stone-800 text-stone-400 font-bold text-[11px]">
                  <tr>
                    <th className="p-2.5">{t('entityResolution.labels.row_label')}</th>
                    <th className="p-2.5">{t('field_operations.authorized_carrier')}</th>
                    <th className="p-2.5">{t('entityResolution.labels.approved_material')}</th>
                    <th className="p-2.5">{t('entityResolution.labels.driver_name')}</th>
                    <th className="p-2.5">{t('analytics.column.plate_number')}</th>
                    <th className="p-2.5 text-center">{t('entityResolution.labels.readiness_status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-850">
                  {rows.map((row) => {
                    const carrierName =
                      row.entityResolutions?.carrier?.matchedName ||
                      row.canonical?.carrierName ||
                      row.raw?.carrierName ||
                      '—';
                    const materialName =
                      row.entityResolutions?.material?.matchedName ||
                      row.canonical?.materialName ||
                      row.raw?.materialName ||
                      '—';
                    const driverName =
                      row.entityResolutions?.driver?.matchedName ||
                      row.canonical?.driverName ||
                      row.raw?.driverName ||
                      '—';
                    const plateNumber =
                      row.entityResolutions?.truck?.matchedName ||
                      row.canonical?.truckPlate ||
                      row.raw?.truckPlate ||
                      '—';

                    const isRejected = row.status === 'REJECTED';
                    const isCommitted = row.status === 'COMMITTED';
                    const isWarning = row.status === 'WARNING';
                    const isBlocked =
                      row.status === 'ERROR' ||
                      row.reviewStatus === 'requires_review' ||
                      row.reviewStatus === 'error' ||
                      !row.entityResolutions?.carrier?.matchedId ||
                      !row.entityResolutions?.material?.matchedId;

                    return (
                      <tr key={row.rowNumber} className="hover:bg-stone-900/50 font-medium">
                        <td className="p-2.5 font-mono text-stone-400">#{row.rowNumber}</td>
                        <td className="p-2.5 text-stone-200">{carrierName}</td>
                        <td className="p-2.5 text-stone-200">{materialName}</td>
                        <td className="p-2.5 text-stone-200">{driverName}</td>
                        <td className="p-2.5 font-mono text-stone-200">{plateNumber}</td>
                        <td className="p-2.5 text-center">
                          {isRejected ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-800 text-stone-500 font-bold">
                              {t('entityResolution.labels.row_excluded')}
                            </span>
                          ) : isCommitted ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/40 font-bold">
                              {t('entityResolution.labels.previously_committed')}
                            </span>
                          ) : isBlocked ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-950 text-rose-300 border border-rose-800/40 font-bold">
                              {t('entityResolution.labels.row_blocked_incomplete')}
                            </span>
                          ) : isWarning ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-950 text-amber-300 border border-amber-800/40 font-bold">
                              {t('entityResolution.labels.row_ready_with_warning')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-bold">
                              {t('entityResolution.labels.ready_for_approval')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex justify-between items-center shrink-0">
          <div className="text-[11px] font-bold">
            {canCommit ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('entityResolution.messages.unified_gateway_ready')}</span>
              </span>
            ) : isReadyToCommit ? (
              <span className="text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{t('entityResolution.messages.awaiting_warning_acceptance')}</span>
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>{t('entityResolution.messages.commit_blocked_unresolved')}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isCommitting}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition-colors"
              >
                {blockerType === 'CARRIER' ? t('entityResolution.labels.restart_import') : t('entityResolution.labels.return_to_correction')}
              </button>
            )}

            <button
              type="button"
              onClick={onCommit}
              disabled={!canCommit || isCommitting}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-950/50 transition-colors"
            >
              {isCommitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('entityResolution.labels.committing_import')}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('entityResolution.labels.approve_commit_import')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );

  if (embeddedInWorkflowHost) {
    return panelContent;
  }

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      {panelContent}
    </div>
  );
};
