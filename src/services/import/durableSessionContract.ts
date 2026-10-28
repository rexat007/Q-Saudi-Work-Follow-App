import type { ReviewedCanonicalIntent } from '../../types/rosterCanonicalIntent';

export const IMPORT_SESSION_SCHEMA_VERSION = 2;
export type DurableLifecycle = 'SOURCE' | 'DISCOVERED' | 'MAPPING' | 'RESOLUTION' | 'REVIEW' | 'INTENT_REVIEWED' | 'COMMITTING' | 'COMMITTED' | 'FAILED_RECOVERABLE' | 'FAILED_TERMINAL' | 'CANCELLED';
export interface SourceRevision {
  sourceRevisionId: string; sourceType: string; requiresReattach: boolean;
  fileName?: string; fileSize?: number; mimeType?: string; fingerprint?: string;
  discovery?: Record<string, unknown>;
  remote?: { spreadsheetId: string; sheetTitle: string; modifiedTime?: string };
}
export interface MappingRevision {
  mappingRevisionId: string; sourceRevisionId: string; mappings: Record<string, string>;
  approved: boolean; approvedAt?: string; approvedBy?: string;
}
export interface DurableReviewedIntent extends ReviewedCanonicalIntent {
  projectId: string; importSessionId: string; operationId: string; importBatchId: string;
  sourceRevisionId: string; mappingRevisionId: string; acceptedAt?: string; acceptedBy?: string;
}
export function sessionError(code: string): never { throw Object.assign(new Error(code), { code }); }
const forbidden = new Set(['token','accesstoken','refreshtoken','apikey','secret','password','authorization','credential','credentials','privatekey','file']);
/** Run before JSON serialization on BOTH sides. Cycles/non-JSON values fail closed. */
export function assertSessionPayload(value: unknown, ancestors = new Set<object>()): void {
  if (value === undefined || value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') { if (!Number.isFinite(value)) sessionError('INVALID_PAYLOAD_FORBIDDEN_FIELDS'); return; }
  if (typeof value !== 'object' || ancestors.has(value)) sessionError('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
  const tag = Object.prototype.toString.call(value);
  if (tag !== '[object Object]' && tag !== '[object Array]') sessionError('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) sessionError('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
  ancestors.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (forbidden.has(key.replace(/[_-]/g, '').toLowerCase())) sessionError('INVALID_PAYLOAD_FORBIDDEN_FIELDS');
    assertSessionPayload(child, ancestors);
  }
  ancestors.delete(value);
}
export const SESSION_TRANSITIONS: Record<DurableLifecycle, readonly DurableLifecycle[]> = {
  SOURCE: ['DISCOVERED','CANCELLED'], DISCOVERED: ['MAPPING','CANCELLED'],
  MAPPING: ['RESOLUTION','CANCELLED'], RESOLUTION: ['REVIEW','CANCELLED'],
  REVIEW: ['INTENT_REVIEWED','CANCELLED'], INTENT_REVIEWED: ['CANCELLED'],
  COMMITTING: [], COMMITTED: [], FAILED_RECOVERABLE: ['CANCELLED'], FAILED_TERMINAL: [], CANCELLED: [],
};
export const terminalSession = (state: string) => ['COMMITTED','CANCELLED','FAILED_TERMINAL','REJECTED'].includes(state);
const stages: Record<string, readonly string[]> = {
  SOURCE: ['SOURCE_DISCOVERY'], DISCOVERED: ['SOURCE_DISCOVERY','MAPPING_APPROVAL'], MAPPING: ['MAPPING_APPROVAL'],
  RESOLUTION: ['CARRIER_RESOLUTION','MATERIAL_RESOLUTION','DRIVER_TRUCK_RESOLUTION'], REVIEW: ['FINAL_REVIEW'], INTENT_REVIEWED: ['FINAL_REVIEW'],
  CANCELLED: ['SOURCE_DISCOVERY'],
};
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
export function validateDurableCheckpoint(previous: any | null, next: any, actor: string, now: string): void {
  if (previous && previous.schemaVersion !== 2) {
    if (previous.schemaVersion !== undefined && previous.schemaVersion !== 1) sessionError('UNSUPPORTED_IMPORT_SESSION_SCHEMA');
    if (terminalSession(previous.lifecycleState) || next.lifecycleState !== 'CANCELLED') sessionError('LEGACY_IMPORT_SESSION_RESTART_REQUIRED');
    const cancellationFields = new Set(['lifecycleState','currentStage','rosterStage','version','updatedAt','updatedBy']);
    if (Object.keys(next).some(key => !cancellationFields.has(key) && JSON.stringify(next[key]) !== JSON.stringify(previous[key]))) sessionError('IMMUTABLE_IDENTITY_VIOLATION');
    return; // A terminal cancel preserves all old facts and schema; it does not manufacture v2 review authority.
  }
  if (next.schemaVersion !== 2) sessionError('UNSUPPORTED_IMPORT_SESSION_SCHEMA');
  if (!Object.hasOwn(SESSION_TRANSITIONS, next.lifecycleState)) sessionError('INVALID_IMPORT_SESSION_TRANSITION');
  if (!Number.isSafeInteger(next.version) || next.version < 1) sessionError('INVALID_IMPORT_SESSION_VERSION');
  const state = next.lifecycleState as DurableLifecycle;
  if (next.domain === 'TRIP' && state === 'INTENT_REVIEWED') sessionError('INVALID_IMPORT_SESSION_TRANSITION');
  if (next.domain === 'ROSTER' && ['COMMITTING','COMMITTED','FAILED_RECOVERABLE','FAILED_TERMINAL'].includes(state)) sessionError('PHASE8_REVIEWED_INTENT_HANDOFF_REQUIRED');
  if (!previous && state !== 'SOURCE') sessionError('INVALID_IMPORT_SESSION_TRANSITION');
  if (previous) {
    if (previous.schemaVersion !== 2) sessionError('LEGACY_IMPORT_SESSION_RESTART_REQUIRED');
    if (terminalSession(previous.lifecycleState)) sessionError('INVALID_IMPORT_SESSION_TRANSITION');
    for (const key of ['importSessionId','projectId','operationId','importBatchId','createdAt','createdBy','domain']) {
      if (next[key] !== previous[key]) sessionError('IMMUTABLE_IDENTITY_VIOLATION');
    }
    const invalidating = next.invalidateReview === true;
    const tripReview = next.domain === 'TRIP' && ['DISCOVERED','MAPPING'].includes(previous.lifecycleState) && state === 'REVIEW';
    const tripRetry = next.domain === 'TRIP' && previous.lifecycleState === 'FAILED_RECOVERABLE' && state === 'REVIEW';
    const tripCompletion = next.domain === 'TRIP' && previous.lifecycleState === 'REVIEW' && ['COMMITTING','COMMITTED','FAILED_RECOVERABLE'].includes(state);
    if (!tripReview && !tripRetry && !tripCompletion && state !== previous.lifecycleState && !(SESSION_TRANSITIONS[previous.lifecycleState as DurableLifecycle] || []).includes(state)) {
      // Explicit review invalidation is the only backward command; never an execution recovery.
      if (!(next.replaceSource === true && state === 'DISCOVERED' && ['DISCOVERED','MAPPING','RESOLUTION','REVIEW','INTENT_REVIEWED'].includes(previous.lifecycleState)) && (!invalidating || !['MAPPING','RESOLUTION','REVIEW','INTENT_REVIEWED'].includes(previous.lifecycleState) || !['MAPPING','RESOLUTION','REVIEW'].includes(state))) sessionError('INVALID_IMPORT_SESSION_TRANSITION');
    }
    if (next.domain === 'ROSTER' && previous.lifecycleState === 'RESOLUTION' && state === 'RESOLUTION') {
      const order = ['CARRIER_RESOLUTION','MATERIAL_RESOLUTION','DRIVER_TRUCK_RESOLUTION'];
      const delta = order.indexOf(next.rosterStage) - order.indexOf(previous.rosterStage);
      if (delta > 1 || (delta < 0 && !invalidating)) sessionError('INVALID_IMPORT_SESSION_TRANSITION');
    }
    if (previous.source && JSON.stringify(previous.source) !== JSON.stringify(next.source)) {
      if (!next.replaceSource || !next.source || next.source.sourceRevisionId === previous.source.sourceRevisionId || !previous.source.fingerprint || ['sourceType','fingerprint','fileName','fileSize','mimeType'].some(key => previous.source[key] !== next.source[key])) sessionError('IMMUTABLE_SOURCE_REVISION');
    }
    const mappingChanged = JSON.stringify(previous.mapping?.mappings) !== JSON.stringify(next.mapping?.mappings);
    if (!next.replaceSource && previous.mapping && mappingChanged && (!invalidating || previous.mapping.mappingRevisionId === next.mapping?.mappingRevisionId)) sessionError('MAPPING_REVISION_REQUIRED');
    if (invalidating || mappingChanged) delete next.reviewedCanonicalIntent;
  }
  if (next.domain !== 'ROSTER' && next.domain !== 'TRIP') sessionError('INVALID_IMPORT_SESSION_DOMAIN');
  if (next.domain === 'ROSTER') {
    if (next.currentStage !== next.rosterStage || !(stages[state] || []).includes(next.rosterStage)) sessionError('INVALID_IMPORT_SESSION_STAGE');
    if (['COMMITTING','COMMITTED','FAILED_RECOVERABLE','FAILED_TERMINAL'].includes(state)) sessionError('PHASE8_REVIEWED_INTENT_HANDOFF_REQUIRED');
  }
  if (next.domain === 'TRIP') {
    const tripStages: Record<string, string[]> = { SOURCE: ['PARSING','INTAKE','SOURCE'], DISCOVERED: ['DISCOVERY','MAPPING_APPROVAL'], MAPPING: ['MAPPING_APPROVAL'], RESOLUTION: ['RESOLUTION'], REVIEW: ['REVIEW'], COMMITTING: ['COMMITTING'], COMMITTED: ['COMMITTED','COMMIT_RESULT'], FAILED_RECOVERABLE: ['REVIEW','COMMIT_RESULT'], FAILED_TERMINAL: ['COMMIT_RESULT'], CANCELLED: ['SOURCE_DISCOVERY','CANCELLED'] };
    if (!(tripStages[state] || []).includes(next.currentStage)) sessionError('INVALID_IMPORT_SESSION_STAGE');
    if (next.reviewedCanonicalIntent) sessionError('INVALID_REVIEWED_IMPORT_INTENT');
  }
  if (next.source || state !== 'SOURCE' && state !== 'CANCELLED') {
    if (!next.source || !text(next.source.sourceRevisionId) || !text(next.source.sourceType) || next.source.sourceType !== next.sourceType || typeof next.source.requiresReattach !== 'boolean') sessionError('SOURCE_REVISION_REQUIRED');
    if (['CSV','EXCEL','EXCEL_CSV','GOOGLE_DRIVE'].includes(next.source.sourceType) && next.source.requiresReattach !== true) sessionError('SOURCE_REVISION_REQUIRED');
    if (next.source.sourceType === 'GOOGLE_SHEETS' && (!text(next.source.remote?.spreadsheetId) || !text(next.source.remote?.sheetTitle) || !text(next.source.fingerprint))) sessionError('SOURCE_REVISION_REQUIRED');
  }
  if (next.domain === 'ROSTER' && ['MAPPING','RESOLUTION','REVIEW','INTENT_REVIEWED'].includes(state)) {
    const m = next.mapping;
    if (!m || !text(m.mappingRevisionId) || m.sourceRevisionId !== next.source?.sourceRevisionId || !m.mappings || !Object.keys(m.mappings).length || typeof m.mappings !== 'object' || Array.isArray(m.mappings) || !Object.values(m.mappings).every(text) || m.approved !== true) sessionError('APPROVED_MAPPING_REQUIRED');
    if (!previous?.mapping || m.mappingRevisionId !== previous.mapping.mappingRevisionId) { m.approvedBy = actor; m.approvedAt = now; }
    else { m.approvedBy = previous.mapping.approvedBy; m.approvedAt = previous.mapping.approvedAt; }
  }
  if (next.domain === 'ROSTER' && ['RESOLUTION','REVIEW','INTENT_REVIEWED'].includes(state) && !Array.isArray(next.importBatch?.rows)) sessionError('INVALID_IMPORT_SESSION_REVIEW');
  if (next.domain === 'TRIP' && state === 'REVIEW' && (!next.importBatch && !Array.isArray(next.reviewSnapshot?.rows))) sessionError('INVALID_IMPORT_SESSION_REVIEW');
  if (next.importBatch && (next.importBatch.projectId !== next.projectId || next.importBatch.importBatchId !== next.importBatchId || next.importBatch.operationId !== next.operationId || !Array.isArray(next.importBatch.rows) || next.importBatch.rows.length > 10000)) sessionError('INVALID_IMPORT_SESSION_BATCH');
  if (state === 'INTENT_REVIEWED') {
    if (next.domain !== 'ROSTER') sessionError('INVALID_IMPORT_SESSION_TRANSITION');
    const r = next.reviewedCanonicalIntent;
    if (!r || !r.intent || !text(r.intent.signature) || r.acceptedSignature !== r.intent.signature || r.intent.projectId !== next.projectId || !Array.isArray(r.intent.blockers) || r.intent.blockers.length || !Array.isArray(r.intent.rowDecisions) || !r.intent.rowDecisions.some((row: any) => row.status === 'CONTRIBUTING') || !Array.isArray(r.intent.entities) || !Array.isArray(r.intent.assignmentIntents) || !Array.isArray(r.intent.allocationIntents) || typeof r.intent.requiresDisplacementApproval !== 'boolean') sessionError('INVALID_REVIEWED_IMPORT_INTENT');
    for (const key of ['projectId','importSessionId','operationId','importBatchId']) if (r[key] !== next[key]) sessionError('INVALID_REVIEWED_INTENT_BINDING');
    if (r.sourceRevisionId !== next.source?.sourceRevisionId || r.mappingRevisionId !== next.mapping?.mappingRevisionId) sessionError('INVALID_REVIEWED_INTENT_BINDING');
    if (r.intent.requiresDisplacementApproval && r.displacementApprovedSignature !== r.intent.signature) sessionError('DISPLACEMENT_APPROVAL_REQUIRED');
    if (r.intent.warnings?.length && next.warningConfirmation !== true) sessionError('WARNING_APPROVAL_REQUIRED');
    r.acceptedAt = now; r.acceptedBy = actor;
  } else delete next.reviewedCanonicalIntent;
  // Only the first-class artifact owns persisted approval. Working compatibility is rebuilt at restore.
  if (next.importBatch?.metadata) { next.importBatch.metadata = { ...next.importBatch.metadata }; delete next.importBatch.metadata.reviewedCanonicalIntent; }
  delete next.invalidateReview;
  delete next.replaceSource;
}

/** Legacy records never acquire missing discovery/review facts by inference. */
export function reconstructSmartImportResumeState(record: any, projectId: string) {
  if (!record || record.projectId !== projectId) sessionError('PROJECT_MISMATCH');
  if (terminalSession(record.lifecycleState)) sessionError('IMPORT_SESSION_TERMINAL');
  if (record.schemaVersion !== undefined && record.schemaVersion !== 1 && record.schemaVersion !== 2) sessionError('UNSUPPORTED_IMPORT_SESSION_SCHEMA');
  if (!Number.isSafeInteger(record.version) || record.version < 1) sessionError('INVALID_IMPORT_SESSION_VERSION');
  if (record.schemaVersion !== 2) return { durableStage: 'SOURCE_DISCOVERY', requiresSourceReattach: true, legacy: true, sourceRevision: null, mappingRevision: null, reviewSnapshot: record.importBatch || record.reviewSnapshot || null, reviewedIntent: null, legacyClassification: (record.importBatch?.rows || record.reviewSnapshot?.rows) ? 'LEGACY_REVIEW_REQUIRED' : record.sourceMetadata ? 'LEGACY_REATTACH_REQUIRED' : 'LEGACY_UNSUPPORTED' };
  return { durableStage: record.domain === 'TRIP' ? record.currentStage : record.rosterStage, requiresSourceReattach: ['CSV','EXCEL','EXCEL_CSV','GOOGLE_DRIVE'].includes(record.sourceType) || record.source?.requiresReattach === true, legacy: false, legacyClassification: undefined, sourceRevision: record.source || null, mappingRevision: record.mapping || null, reviewSnapshot: record.importBatch || (Array.isArray(record.reviewSnapshot?.rows) ? record.reviewSnapshot : null), reviewedIntent: record.reviewedCanonicalIntent || null };
}
export async function sourceFingerprint(buffer: ArrayBuffer): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer))).map(v => v.toString(16).padStart(2, '0')).join('');
}
export async function verifySourceReattach(source: SourceRevision, file: File, verifiedBuffer?: ArrayBuffer): Promise<boolean> {
  return source.fileName === file.name && source.fileSize === file.size && (!source.mimeType || source.mimeType === file.type) && Boolean(source.fingerprint) && source.fingerprint === await sourceFingerprint(verifiedBuffer ?? await file.arrayBuffer());
}

/** Preserve source-row evidence and choices, discard runtime input and cached canonical authority. */
export function prepareDurableBatch(batch: any): any {
  if (!batch) return batch;
  const { rawInput: _input, ...source } = batch.source || {};
  const rows = batch.rows?.map((row: any) => {
    const { rawInput: _rowInput, ...rest } = row;
    const entityResolutions = row.entityResolutions ? Object.fromEntries(Object.entries(row.entityResolutions).map(([key, value]: [string, any]) => { const { canonicalState: _state, ...resolution } = value || {}; return [key, resolution]; })) : undefined;
    return { ...rest, ...(entityResolutions ? { entityResolutions } : {}) };
  });
  const { reviewedCanonicalIntent: _review, canonicalIntent: _intent, ...metadata } = batch.metadata || {};
  return { ...batch, source, rows, metadata };
}

/** Construct only accepted provider facts. Called at source acceptance, never by restore. */
export function acceptedSourceRevision(sourceType: string, metadata: Record<string, any>): SourceRevision {
  if (!text(sourceType)) sessionError('SOURCE_REVISION_REQUIRED');
  return {
    sourceRevisionId: crypto.randomUUID(), sourceType, requiresReattach: sourceType !== 'GOOGLE_SHEETS',
    fileName: metadata.sourceFileName ?? metadata.fileName,
    fileSize: metadata.fileSize, mimeType: metadata.sourceMimeType ?? metadata.mimeType,
    fingerprint: metadata.fingerprint, discovery: metadata.discovery,
    ...(metadata.spreadsheetId ? { remote:{spreadsheetId:metadata.spreadsheetId, sheetTitle:metadata.sheetTitle, ...(metadata.modifiedTime ? {modifiedTime:metadata.modifiedTime} : {})} } : {}),
  };
}
