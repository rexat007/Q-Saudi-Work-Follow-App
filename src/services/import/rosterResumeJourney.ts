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
