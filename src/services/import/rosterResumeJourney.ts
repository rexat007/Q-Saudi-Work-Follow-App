import type {UnifiedImportBatch} from '../../types/unifiedImport';
import type {RosterCanonicalIntent} from '../../types/rosterCanonicalIntent';
import {canonicalCarrierRowsReady, RosterBatchReviewService} from './rosterBatchReview.service';
import {materialRowsReady} from './rosterMaterialBinding';
import {RosterSmartImportWorkflowService, type RosterSmartImportStage} from './rosterSmartImportWorkflow.service';
import type { ImportExecutionStatus } from '../../types/importExecution';
import { reconstructSmartImportResumeState, sourceFingerprint, type SourceRevision } from './durableSessionContract';

/** Presentation of persisted truth only. No parsing, intent construction or execution authority. */
export function rosterResumeJourney(record: any, projectId: string, execution?: ImportExecutionStatus | null) {
  if (record?.projectId !== projectId || record?.domain !== 'ROSTER') throw Error('PROJECT_MISMATCH');
  if (execution) {
    const op = execution.operation;
    if (op.projectId !== projectId || op.importSessionId !== record.importSessionId || op.operationId !== record.operationId || op.importBatchId !== record.importBatchId || op.sourceRevisionId !== record.source?.sourceRevisionId || op.mappingRevisionId !== record.mapping?.mappingRevisionId) throw Error('EXECUTION_BINDING_MISMATCH');
    return { stage: 'COMMIT_RESULT', requiresSourceReattach: false, execution, facts: null };
  }
  if (record.executionOperationId) throw Error('EXECUTION_STATUS_REQUIRED');
  if (record.lifecycleState === 'COMMITTED' || record.lifecycleState === 'CANCELLED') {
    if (record.schemaVersion !== 2) throw Error('LEGACY_IMPORT_SESSION_RESTART_REQUIRED');
    if (record.lifecycleState === 'COMMITTED' && !record.commitReceipt) throw Error('COMMIT_RECEIPT_REQUIRED');
    return { stage: 'COMMIT_RESULT', requiresSourceReattach: false, execution: null, facts: null };
  }
  const facts = reconstructSmartImportResumeState(record, projectId);
  // Reviewed and resolution snapshots are self-contained; bytes are needed only before analysis.
  return { stage: facts.durableStage, requiresSourceReattach: facts.requiresSourceReattach && !facts.reviewSnapshot, execution: null, facts };
}

/** One lifetime for a project + import session, including A→B→A and same-project replacement. */
export class RosterJourneyLifetime {
  private generation = 0;
  enter() { return ++this.generation; }
  current(token: number) { return token === this.generation; }
  invalidate() { ++this.generation; }
}

/** Adapter snapshot identity; changed remote values never silently reuse an approved revision. */
export async function verifyRosterRemoteSource(spreadsheetId: string, sheetTitle: string, remote: {spreadsheetId:string;sheetTitle:string;values:any[][]}, previous?: SourceRevision) {
  if (remote.spreadsheetId !== spreadsheetId || remote.sheetTitle !== sheetTitle || !Array.isArray(remote.values)) throw Error('SOURCE_REVISION_REQUIRED');
  const fingerprint = await sourceFingerprint(new TextEncoder().encode(JSON.stringify(remote.values)).buffer as ArrayBuffer);
  if (previous && (previous.sourceType !== 'GOOGLE_SHEETS' || previous.remote?.spreadsheetId !== spreadsheetId || previous.remote?.sheetTitle !== sheetTitle || previous.fingerprint !== fingerprint)) throw Error('IMMUTABLE_SOURCE_REVISION');
  return fingerprint;
}

/** Route presentation from fresh gate results, never change persisted facts or execute corrections. */
export function reconcileRosterResumeStage(saved: RosterSmartImportStage, batch: UnifiedImportBatch,
  intent: RosterCanonicalIntent | undefined = batch.metadata?.canonicalIntent): RosterSmartImportStage {
  const index = RosterSmartImportWorkflowService.getStageIndex.bind(RosterSmartImportWorkflowService);
  if (index(saved) < index('CARRIER_RESOLUTION') || saved === 'COMMIT_RESULT') return saved;
  const earlier = (required: RosterSmartImportStage) => index(required) < index(saved) ? required : saved;
  if (!canonicalCarrierRowsReady(batch)) return earlier('CARRIER_RESOLUTION');
  if (!materialRowsReady(batch) || intent?.blockers.some(b => b.code === 'UNRESOLVED_MATERIAL')) return earlier('MATERIAL_RESOLUTION');
  // These codes/fields are presentation ownership, not new eligibility/business rules.
  if (intent?.blockers.some(b => b.code === 'CROSS_ROW_TRUCK_MATERIAL_CONFLICT')) return earlier('MATERIAL_RESOLUTION');
  const blockedRows = new Set(intent?.blockers.flatMap(b => b.rowNumbers) || []);
  for (const key of ['carrier', 'material'] as const) {
    if (batch.rows.some(r => blockedRows.has(r.rowNumber) && r.entityResolutions?.[key]?.resolutionReason))
      return earlier(key === 'carrier' ? 'CARRIER_RESOLUTION' : 'MATERIAL_RESOLUTION');
  }
  const groups = RosterBatchReviewService.getBatchReviewGroups(batch);
  if ([...groups.driver, ...groups.truck].some(g => ['REVIEW_REQUIRED', 'UNRESOLVED', 'CONFLICT'].includes(g.status)) ||
      !intent || intent.blockers.some(b => b.code !== 'DISPLACEMENT_APPROVAL_REQUIRED'))
    return earlier('DRIVER_TRUCK_RESOLUTION');
  return saved;
}
