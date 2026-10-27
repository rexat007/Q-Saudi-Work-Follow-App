import { validateSessionChunk } from './import/sessionArtifactCodec';
import { assertSessionPayload, sessionError, validateDurableCheckpoint, prepareDurableBatch } from './import/durableSessionContract';
import { packSessionArtifact, readSessionArtifact, validateManifest, SESSION_CHUNK_BYTES } from './importSessionArtifacts.server';
import { decodePersistence } from '../utils/persistenceBoundary';
import { sanitizeUndefined } from '../utils/sanitize';
import { adminDb } from '../firebase/admin';
import { AuthUserContext } from '../types/common';

const FORBIDDEN_KEYS = new Set([
  'token',
  'accesstoken',
  'refreshtoken',
  'apikey',
  'secret',
  'password',
  'authorization',
  'credential',
  'credentials',
  'privatekey',
  'file',
]);

function isForbiddenRuntimeType(val: any): boolean {
  if (val === null || val === undefined) return false;

  // 1. ArrayBuffer & ArrayBufferView (TypedArrays: Uint8Array, Int32Array, Float64Array, DataView, etc.)
  if (typeof ArrayBuffer !== 'undefined' && val instanceof ArrayBuffer) return true;
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' && ArrayBuffer.isView(val)) return true;

  // 2. Node.js Buffer
  if (typeof Buffer !== 'undefined' && typeof Buffer.isBuffer === 'function' && Buffer.isBuffer(val)) return true;

  // 3. File & Blob (browser or Node runtime globals)
  if (typeof File !== 'undefined' && val instanceof File) return true;
  if (typeof Blob !== 'undefined' && val instanceof Blob) return true;

  // 4. Fallback prototype tag / constructor name inspection (for mocked or cross-realm objects)
  if (typeof val === 'object') {
    const protoTag = Object.prototype.toString.call(val);
    if (
      protoTag === '[object File]' ||
      protoTag === '[object Blob]' ||
      protoTag === '[object ArrayBuffer]' ||
      protoTag === '[object Uint8Array]' ||
      protoTag === '[object Int8Array]' ||
      protoTag === '[object Uint8ClampedArray]' ||
      protoTag === '[object Int16Array]' ||
      protoTag === '[object Uint16Array]' ||
      protoTag === '[object Int32Array]' ||
      protoTag === '[object Uint32Array]' ||
      protoTag === '[object Float32Array]' ||
      protoTag === '[object Float64Array]' ||
      protoTag === '[object BigInt64Array]' ||
      protoTag === '[object BigUint64Array]' ||
      protoTag === '[object DataView]'
    ) {
      return true;
    }

    const ctorName = val.constructor?.name;
    if (
      ctorName === 'File' ||
      ctorName === 'Blob' ||
      ctorName === 'ArrayBuffer' ||
      ctorName === 'Buffer'
    ) {
      return true;
    }
  }

  return false;
}

function hasForbiddenFields(obj: any, visited = new WeakSet()): boolean {
  if (obj === null || obj === undefined) return false;
  if (isForbiddenRuntimeType(obj)) return true;
  if (typeof obj !== 'object') return false;
  if (visited.has(obj)) return false;
  visited.add(obj);

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (hasForbiddenFields(item, visited)) return true;
    }
    return false;
  }

  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_KEYS.has(lowerKey)) {
      return true;
    }
    const val = obj[key];
    if (val !== undefined && val !== null) {
      if (isForbiddenRuntimeType(val)) return true;
      if (typeof val === 'object') {
        if (hasForbiddenFields(val, visited)) return true;
      }
    }
  }

  return false;
}

export class ImportSessionServerService {
  private db: any;

  constructor(db: any = adminDb) {
    this.db = db;
  }

  private snapshotFields(value: any) {
    const result: any = {};
    for (const key of ['importBatch','reviewSnapshot','reviewedCanonicalIntent','entityResolutions','validationIssues']) if (value[key] !== undefined) result[key] = value[key];
    if (result.importBatch) result.importBatch = prepareDurableBatch(result.importBatch);
    if (result.importBatch?.metadata) { result.importBatch.metadata = { ...result.importBatch.metadata }; delete result.importBatch.metadata.reviewedCanonicalIntent; }
    return result;
  }

  private async hydrateSnapshots(reader: (ref:any)=>Promise<any>, docRef:any, header:any) {
    const keys = ['importBatch','reviewSnapshot','reviewedCanonicalIntent','entityResolutions','validationIssues'];
    const references = header.artifactFields || (header.checkpointArtifact ? Object.fromEntries(keys.map(key=>[key,header.checkpointArtifact])) : {});
    const cache = new Map<string,any>(); const result:any = {};
    for (const key of keys) {
      const manifest=references[key]; if(!manifest) continue;
      const id=JSON.stringify(manifest);
      if(!cache.has(id)) cache.set(id,await readSessionArtifact(reader,docRef,manifest));
      const artifact=cache.get(id); if(Object.hasOwn(artifact,key)) result[key]=artifact[key];
    }
    return this.snapshotFields(result);
  }

  private writePacked(transaction: any, docRef: any, record: any, staged?: any, stagedUpdates?: any) {
    const { importBatch, reviewSnapshot, reviewedCanonicalIntent, entityResolutions, validationIssues, checkpointArtifact: oldArtifact, artifactFields: oldFields, ...header } = record;
    const keys=['importBatch','reviewSnapshot','reviewedCanonicalIntent','entityResolutions','validationIssues'];
    const allSnapshots:any={importBatch,reviewSnapshot,reviewedCanonicalIntent,entityResolutions,validationIssues};
    const fields={...(oldFields || (oldArtifact ? Object.fromEntries(keys.map(key=>[key,oldArtifact])) : {}))};
    const changed=stagedUpdates ? keys.filter(key=>Object.hasOwn(stagedUpdates,key) || stagedUpdates.replaceSource === true) : keys;
    const snapshots=sanitizeUndefined(Object.fromEntries(changed.filter(key=>record[key]!==undefined).map(key=>[key,allSnapshots[key]])));
    for(const key of keys) if(record[key]===undefined || (stagedUpdates?.replaceSource && record[key]===null)) delete fields[key];
    header.reviewAcceptance=reviewedCanonicalIntent ? {acceptedAt:reviewedCanonicalIntent.acceptedAt,acceptedBy:reviewedCanonicalIntent.acceptedBy} : null;
    header.hasReviewedIntent=Boolean(reviewedCanonicalIntent);
    if(staged) {
      for(const key of changed) if(record[key]!==undefined && !(stagedUpdates?.replaceSource && record[key]===null)) fields[key]=staged;
      transaction.set(docRef,sanitizeUndefined({...header,checkpointArtifact:staged,artifactFields:fields}));return;
    }
    if(!Object.keys(snapshots).length) {
      transaction.set(docRef,sanitizeUndefined({...header,checkpointArtifact:oldArtifact,artifactFields:fields}));return;
    }
    const packed=packSessionArtifact(snapshots);
    if(packed.chunks.length>32) sessionError('IMPORT_SESSION_REQUIRES_STAGED_ARTIFACT');
    packed.chunks.forEach((text,index)=>transaction.set(docRef.collection('checkpointChunks').doc(`${packed.manifest.artifactId}_${index}`),{...packed.manifest,index,text}));
    for(const key of Object.keys(snapshots)) fields[key]=packed.manifest;
    transaction.set(docRef,sanitizeUndefined({...header,checkpointArtifact:packed.manifest,artifactFields:fields}));
  }

  private async stageChunk(projectId: string, id: string, chunk: any, expectedVersion: number, context: AuthUserContext) {
    validateManifest(chunk); assertSessionPayload(chunk);
    validateSessionChunk(chunk.text);
    if (!Number.isSafeInteger(chunk.index) || chunk.index < 0 || chunk.index >= chunk.count || typeof chunk.text !== 'string' || Buffer.byteLength(chunk.text) > SESSION_CHUNK_BYTES) sessionError('INVALID_IMPORT_SESSION_ARTIFACT');
    const ref = this.db.collection('projects').doc(projectId).collection('importSessions').doc(id);
    await this.db.runTransaction(async (transaction: any) => {
      const snap = await transaction.get(ref); const existing = snap.exists ? snap.data() : null;
      if (!existing || existing.projectId !== projectId) sessionError('IMPORT_SESSION_NOT_FOUND');
      if (existing.version !== expectedVersion) throw Object.assign(new Error('VERSION_CONFLICT'), { code: 'VERSION_CONFLICT', serverVersion: existing.version });
      if (['COMMITTED','CANCELLED','FAILED_TERMINAL','COMMITTING'].includes(existing.lifecycleState)) sessionError('INVALID_IMPORT_SESSION_TRANSITION');
      const chunkRef = ref.collection('checkpointChunks').doc(`${chunk.artifactId}_${chunk.index}`);
      const old = await transaction.get(chunkRef);
      const stagedChunk = { ...chunk, stagedVersion: expectedVersion };
      if (old.exists && JSON.stringify(old.data()) !== JSON.stringify(stagedChunk)) sessionError('IMMUTABLE_IMPORT_SESSION_ARTIFACT');
      transaction.set(chunkRef, stagedChunk);
    });
    return { staged: true, version: expectedVersion };
  }

  async createSession(projectId: string, payload: any, context: AuthUserContext) {
    if (!context || !['PROJECT_ADMIN', 'SUPER_ADMIN', 'DISPATCHER', 'SUPERVISOR', 'SITE_SUPERVISOR'].includes(context.role)) {
      const err: any = new Error('غير مصرح لك بإنشاء جلسات الاستيراد');
      err.code = 'AUTHORIZATION_ERROR';
      throw err;
    }

    if (!projectId || !projectId.trim()) {
      const err: any = new Error('معرّف المشروع مطلوب');
      err.code = 'INVALID_PROJECT_ID';
      throw err;
    }

    if (payload.projectId && payload.projectId !== projectId) {
      const err: any = new Error('عدم تطابق معرّف المشروع بين المسار والبيانات');
      err.code = 'PROJECT_MISMATCH';
      throw err;
    }

    assertSessionPayload(payload);
    if (payload.schemaVersion !== undefined && payload.schemaVersion !== 2) sessionError('UNSUPPORTED_IMPORT_SESSION_SCHEMA');
    if (payload.mapping !== undefined || payload.reviewedCanonicalIntent !== undefined) sessionError('INVALID_IMPORT_SESSION_TRANSITION');
    if (hasForbiddenFields(payload)) {
      const err: any = new Error('يُحظر تضمين كائنات الملفات (File objects) أو الرموز السرية/الحساسة في جلسة الاستيراد بجميع المستويات');
      err.code = 'INVALID_PAYLOAD_FORBIDDEN_FIELDS';
      throw err;
    }

    const importSessionId = payload.importSessionId || `isess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const operationId = payload.operationId || `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const importBatchId = payload.importBatchId || `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const now = new Date().toISOString();

    const sessionRecord: any = {
      schemaVersion: 2,
      domain: payload.domain,
      source: payload.source,
      mapping: payload.mapping,
      importSessionId,
      projectId,
      operationId,
      importBatchId,
      sourceType: payload.sourceType,
      lifecycleState: payload.lifecycleState || 'SOURCE',
      currentStage: payload.currentStage || (payload.domain === 'ROSTER' ? 'SOURCE_DISCOVERY' : 'PARSING'),
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: context.userId,
      updatedBy: context.userId,
      sourceMetadata: payload.sourceMetadata || {},
      reviewSnapshot: payload.reviewSnapshot ?? null,
      entityResolutions: payload.entityResolutions || {},
      reviewAction: payload.reviewAction || null,
      validationIssues: payload.validationIssues || [],
      warningConfirmation: payload.warningConfirmation || false,
      ...(payload.domain === 'ROSTER' ? { rosterStage: payload.rosterStage || 'SOURCE_DISCOVERY' } : {}),
      importBatch: payload.importBatch || null,
      smartImportCommitResult: payload.smartImportCommitResult || null,
      isRosterMappingApproved: payload.isRosterMappingApproved ?? false,
      rosterDiscoveryResult: payload.rosterDiscoveryResult || null,
    };

    const docRef = this.db.collection('projects').doc(projectId).collection('importSessions').doc(importSessionId);

    validateDurableCheckpoint(null, sessionRecord, context.userId, now);
    await this.db.runTransaction(async (transaction: any) => {
      const docSnap = await transaction.get(docRef);
      if (docSnap.exists) {
        const err: any = new Error('جلسة الاستيراد موجودة مسبقاً بنفس المعرّف');
        err.code = 'SESSION_ALREADY_EXISTS';
        throw err;
      }
      this.writePacked(transaction, docRef, sessionRecord);
    });

    return sessionRecord;
  }

  async getSession(projectId: string, importSessionId: string, context: AuthUserContext) {
    if (!context) {
      const err: any = new Error('المستخدم غير مصادق عليه');
      err.code = 'UNAUTHENTICATED';
      throw err;
    }

    const docRef = this.db.collection('projects').doc(projectId).collection('importSessions').doc(importSessionId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      const err: any = new Error('جلسة الاستيراد غير موجودة');
      err.code = 'IMPORT_SESSION_NOT_FOUND';
      throw err;
    }

    const data = decodePersistence<Record<string, any>>(docSnap.data(), { times: {} });

    if (data.projectId !== projectId) {
      const err: any = new Error('عزل أمني: عدم تطابق معرف المشروع لجلسة الاستيراد');
      err.code = 'PROJECT_MISMATCH';
      throw err;
    }

    if (data.schemaVersion !== undefined && ![1,2].includes(data.schemaVersion)) sessionError('UNSUPPORTED_IMPORT_SESSION_SCHEMA');
    const hydrated = data.checkpointArtifact ? { ...data, ...await this.hydrateSnapshots(ref => ref.get(), docRef, data) } : data;
    if (data.hasReviewedIntent === false) delete hydrated.reviewedCanonicalIntent;
    if (hydrated.reviewedCanonicalIntent && data.reviewAcceptance) Object.assign(hydrated.reviewedCanonicalIntent, data.reviewAcceptance);
    // The header is current warning consent; an older row artifact cannot revive revoked consent.
    if (data.schemaVersion === 2 && data.warningConfirmation === false && hydrated.importBatch) { hydrated.importBatch = {...hydrated.importBatch}; delete hydrated.importBatch.warningConfirmation; }
    return decodePersistence<Record<string, any>>(hydrated, { id: ['importSessionId', importSessionId], projectId, times: { createdAt: 'iso', updatedAt: 'iso' } });
  }

  async updateCheckpoint(
    projectId: string,
    importSessionId: string,
    updates: any,
    concurrency: { expectedVersion: number },
    context: AuthUserContext
  ) {
    if (!context || !['PROJECT_ADMIN', 'SUPER_ADMIN', 'DISPATCHER', 'SUPERVISOR', 'SITE_SUPERVISOR'].includes(context.role)) {
      const err: any = new Error('غير مصرح لك بتعديل جلسات الاستيراد');
      err.code = 'AUTHORIZATION_ERROR';
      throw err;
    }

    if (!concurrency || concurrency.expectedVersion === undefined) {
      const err: any = new Error('رقم الإصدار المتوقع (expectedVersion) مطلوب للتحكم بالتزامن المتفائل');
      err.code = 'MISSING_EXPECTED_VERSION';
      throw err;
    }

    if (updates.artifactChunk) return this.stageChunk(projectId, importSessionId, updates.artifactChunk, concurrency.expectedVersion, context);
    assertSessionPayload(updates);
    if (hasForbiddenFields(updates)) {
      const err: any = new Error('يُحظر تضمين كائنات الملفات (File objects) أو الرموز السرية/الحساسة في تحديث جلسة الاستيراد');
      err.code = 'INVALID_PAYLOAD_FORBIDDEN_FIELDS';
      throw err;
    }

    const docRef = this.db.collection('projects').doc(projectId).collection('importSessions').doc(importSessionId);

    let updatedRecord: any = null;
    const staged = updates.checkpointArtifact;

    await this.db.runTransaction(async (transaction: any) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists) {
        const err: any = new Error('جلسة الاستيراد غير موجودة');
        err.code = 'IMPORT_SESSION_NOT_FOUND';
        throw err;
      }

      let existing = decodePersistence<Record<string, any>>(docSnap.data(), { times: {} });

      if (existing.projectId !== projectId) {
        const err: any = new Error('عزل أمني: عدم تطابق معرف المشروع');
        err.code = 'PROJECT_MISMATCH';
        throw err;
      }

      existing = decodePersistence(existing, { id: ['importSessionId', importSessionId], projectId, times: { createdAt: 'iso', updatedAt: 'iso' } });

      if (existing.version !== concurrency.expectedVersion) {
        const err: any = new Error(`تعارض إصدار (VERSION_CONFLICT): المتوقع ${concurrency.expectedVersion}، الحالي ${existing.version}`);
        err.code = 'VERSION_CONFLICT';
        err.serverVersion = existing.version;
        throw err;
      }

      if (existing.checkpointArtifact) existing = { ...existing, ...await this.hydrateSnapshots(ref => transaction.get(ref), docRef, existing) };
      if (existing.hasReviewedIntent === false) delete existing.reviewedCanonicalIntent;
      if (existing.reviewedCanonicalIntent && existing.reviewAcceptance) Object.assign(existing.reviewedCanonicalIntent,existing.reviewAcceptance);
      if (updates.checkpointArtifact) {
        updates = await readSessionArtifact(ref => transaction.get(ref), docRef, updates.checkpointArtifact, concurrency.expectedVersion);
        assertSessionPayload(updates);
      }
      if (updates.importSessionId !== undefined && updates.importSessionId !== existing.importSessionId) {
        const err: any = new Error('تغيير معرف جلسة الاستيراد (importSessionId) محظور');
        err.code = 'IMMUTABLE_IDENTITY_VIOLATION';
        throw err;
      }
      if (updates.projectId !== undefined && updates.projectId !== existing.projectId) {
        const err: any = new Error('تغيير معرف المشروع (projectId) محظور');
        err.code = 'IMMUTABLE_IDENTITY_VIOLATION';
        throw err;
      }
      if (updates.operationId !== undefined && updates.operationId !== existing.operationId) {
        const err: any = new Error('تغيير معرف العملية (operationId) محظور');
        err.code = 'IMMUTABLE_IDENTITY_VIOLATION';
        throw err;
      }
      if (updates.importBatchId !== undefined && updates.importBatchId !== existing.importBatchId) {
        const err: any = new Error('تغيير معرف دفعة الاستيراد (importBatchId) محظور');
        err.code = 'IMMUTABLE_IDENTITY_VIOLATION';
        throw err;
      }
      if (updates.createdAt !== undefined && updates.createdAt !== existing.createdAt) {
        const err: any = new Error('تغيير تاريخ الإنشاء (createdAt) محظور');
        err.code = 'IMMUTABLE_IDENTITY_VIOLATION';
        throw err;
      }
      if (updates.createdBy !== undefined && updates.createdBy !== existing.createdBy) {
        const err: any = new Error('تغيير مكوّن الإنشاء (createdBy) محظور');
        err.code = 'IMMUTABLE_IDENTITY_VIOLATION';
        throw err;
      }
      if (updates.version !== undefined && updates.version !== existing.version) {
        const err: any = new Error('تجاوز رقم الإصدار بدلاً من التسلسل السيرفري محظور');
        err.code = 'IMMUTABLE_IDENTITY_VIOLATION';
        throw err;
      }

      const allowed = new Set(['targetLifecycleState','lifecycleState','currentStage','rosterStage','importBatch','reviewSnapshot','reviewedCanonicalIntent','source','mapping','sourceMetadata','rosterDiscoveryResult','smartImportCommitResult','isRosterMappingApproved','warningConfirmation','validationIssues','entityResolutions','reviewAction','invalidateReview','replaceSource','importSessionId','projectId','operationId','importBatchId','createdAt','createdBy','version']);
      if (Object.keys(updates).some(key => !allowed.has(key))) sessionError('INVALID_IMPORT_SESSION_CHECKPOINT');
      if (updates.targetLifecycleState) { updates.lifecycleState = updates.targetLifecycleState; delete updates.targetLifecycleState; }
      if (existing.domain === 'TRIP') {
        if (updates.lifecycleState === 'REVIEW_REQUIRED') updates.lifecycleState = 'REVIEW';
        if (updates.lifecycleState === 'FAILED') updates.lifecycleState = 'FAILED_RECOVERABLE';
        delete updates.rosterStage;
      }
      const targetState = updates.lifecycleState || existing.lifecycleState;
      if (existing.domain === 'ROSTER') {
        const stageByState: Record<string,string> = { SOURCE:'SOURCE_DISCOVERY', DISCOVERED:'MAPPING_APPROVAL', MAPPING:'MAPPING_APPROVAL', RESOLUTION:'CARRIER_RESOLUTION', REVIEW:'FINAL_REVIEW', INTENT_REVIEWED:'FINAL_REVIEW', CANCELLED:'SOURCE_DISCOVERY' };
        if (updates.lifecycleState && updates.lifecycleState !== existing.lifecycleState && !updates.rosterStage) updates.rosterStage = stageByState[targetState];
        if (updates.rosterStage && !updates.currentStage) updates.currentStage = updates.rosterStage;
      } else if (updates.lifecycleState && updates.lifecycleState !== existing.lifecycleState && !updates.currentStage) {
        updates.currentStage = ({ SOURCE:'PARSING', DISCOVERED:'DISCOVERY', MAPPING:'MAPPING_APPROVAL', RESOLUTION:'RESOLUTION', REVIEW:'REVIEW', COMMITTING:'COMMITTING', COMMITTED:'COMMITTED', CANCELLED:'CANCELLED', FAILED_RECOVERABLE:'REVIEW' } as Record<string,string>)[targetState];
      }
      const now = new Date().toISOString();

      updatedRecord = {
        ...existing,
        ...updates,
        importSessionId: existing.importSessionId,
        projectId: existing.projectId,
        operationId: existing.operationId,
        importBatchId: existing.importBatchId,
        createdAt: existing.createdAt,
        createdBy: existing.createdBy,
        version: existing.version + 1,
        updatedAt: now,
        updatedBy: context.userId,
      };

      if (updates.replaceSource === true) {
        if (updatedRecord.lifecycleState !== 'DISCOVERED') sessionError('INVALID_IMPORT_SESSION_TRANSITION');
        updatedRecord.mapping = null; updatedRecord.importBatch = null; updatedRecord.reviewSnapshot = null;
        updatedRecord.reviewedCanonicalIntent = null; updatedRecord.isRosterMappingApproved = false;
      }
      if (existing.reviewedCanonicalIntent && !updates.reviewedCanonicalIntent && (['importBatch','reviewSnapshot','mapping'].some(key => updates[key] !== undefined && JSON.stringify(updates[key]) !== JSON.stringify(existing[key])) || updates.warningConfirmation !== undefined && updates.warningConfirmation !== existing.warningConfirmation)) {
        updatedRecord.invalidateReview = true;
        if (updatedRecord.lifecycleState === 'INTENT_REVIEWED') { updatedRecord.lifecycleState = 'REVIEW'; updatedRecord.currentStage = 'FINAL_REVIEW'; updatedRecord.rosterStage = 'FINAL_REVIEW'; }
      }
      if (existing.schemaVersion === 2 && updatedRecord.importBatch) updatedRecord.importBatch = prepareDurableBatch(updatedRecord.importBatch);
      if (existing.schemaVersion === 2 && updatedRecord.warningConfirmation === false && updatedRecord.importBatch) { updatedRecord.importBatch={...updatedRecord.importBatch}; delete updatedRecord.importBatch.warningConfirmation; }
      validateDurableCheckpoint(existing, updatedRecord, context.userId, now);
      this.writePacked(transaction, docRef, updatedRecord, staged, updates);
    });

    return updatedRecord;
  }

  async listResumableSessions(projectId: string, context: AuthUserContext) {
    if (!context || !['PROJECT_ADMIN', 'SUPER_ADMIN', 'DISPATCHER', 'SUPERVISOR', 'SITE_SUPERVISOR'].includes(context.role)) {
      const err: any = new Error('غير مصرح لك باستعراض جلسات الاستيراد');
      err.code = 'AUTHORIZATION_ERROR';
      throw err;
    }

    if (!projectId || !projectId.trim()) {
      const err: any = new Error('معرّف المشروع مطلوب');
      err.code = 'INVALID_PROJECT_ID';
      throw err;
    }

    const colRef = this.db.collection('projects').doc(projectId).collection('importSessions');
    const snapshot = await colRef.get();

    const documents: any[] = [];
    const append = (doc: any) => { if (doc.data()?.projectId === projectId && doc.data()?.createdBy === context.userId) documents.push(doc); };
    if (Array.isArray(snapshot.docs)) snapshot.docs.forEach(append); else snapshot.forEach(append);
    const allSessions: any[] = documents.map(doc => decodePersistence<Record<string,any>>(doc.data(), {id:['importSessionId',doc.id],projectId,times:{createdAt:'iso',updatedAt:'iso'}}));

    const resumable = allSessions.filter((s) => {
      if (s.schemaVersion !== undefined && ![1,2].includes(s.schemaVersion)) return false;
      if (s.lifecycleState === 'COMMITTED' || s.lifecycleState === 'CANCELLED' || s.lifecycleState === 'REJECTED' || s.lifecycleState === 'FAILED_TERMINAL' || s.lifecycleState === 'COMMITTING') {
        return false;
      }
      if (s.importBatch?.commitStatus === 'COMMITTED') {
        return false;
      }
      if (s.lifecycleState === 'FAILED') {
        const isRetryablePartial = Boolean(
          s.smartImportCommitResult &&
          s.smartImportCommitResult.success === false &&
          ((s.smartImportCommitResult.committedRows && s.smartImportCommitResult.committedRows > 0) ||
           (s.importBatch?.committedRows && s.importBatch.committedRows > 0))
        );
        return isRetryablePartial;
      }
      return true;
    });

    return resumable.sort((a,b) => String(b.updatedAt).localeCompare(String(a.updatedAt)) || String(a.importSessionId).localeCompare(String(b.importSessionId))).map(({importBatch:_batch,reviewSnapshot:_snapshot,reviewedCanonicalIntent:_intent,entityResolutions:_resolutions,validationIssues:_issues,...header})=>header);
  }
}

export const importSessionServerService = new ImportSessionServerService();
