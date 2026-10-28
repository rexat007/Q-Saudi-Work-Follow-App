import { adminDb } from '../../firebase/admin';
import { authorizeGlobalCommand } from '../globalIdentityAuthority.server';
import { GlobalIdentityError, validGlobalId } from '../../utils/globalIdentityPolicy';
import { decodePersistence } from '../../utils/persistenceBoundary';
import { sanitizeUndefined } from '../../utils/sanitize';
import { readSessionArtifact, packSessionArtifact } from '../importSessionArtifacts.server';
import { ImportSessionServerService } from '../importSession.server';
import { ReviewedRosterCommitServer } from './reviewedRosterCommit.server';
import { executionDigest, prepareExecutionGroups } from './rosterExecutionPlan.server';
import type { ImportExecutionOperation, ImportExecutionGroup, ImportExecutionReceipt, ImportExecutionStatus } from '../../types/importExecution';
import type { ReviewedRosterCommitReceipt } from '../../types/importSession';
const fail = (code: string, status = 409): never => { throw new GlobalIdentityError(code, '', status); };
const version = (value: any) => { if (!Number.isSafeInteger(value) || value < 1)
  fail('INVALID_EXECUTION_VERSION', 400); };
const terminal = (state: string) => state === 'COMPLETED' || state === 'CANCELLED';
const retryable = (code: string) => ['EXECUTION_INTERRUPTED', 'unavailable', 'deadline-exceeded', 'aborted', 'resource-exhausted', 'UNAVAILABLE', 'ECONNRESET', 'ETIMEDOUT', '4', '8', '10', '13', '14'].includes(code);
/** Recovery coordinates the existing B2 executor; it never calls independent public mutation services. */
export class RosterExecutionServer {
  private commit: ReviewedRosterCommitServer;
  constructor(private db: any = adminDb, private groupsPerRequest = 4) { this.commit = new ReviewedRosterCommitServer(db); }
  private session(p: string, s: string) { if (!validGlobalId(p) || !validGlobalId(s))
    fail('INVALID_EXECUTION_SCOPE', 400); return this.db.collection('projects').doc(p).collection('importSessions').doc(s); }
  private operation(p: string, operationId: string) { return this.db.collection('projects').doc(p).collection('importExecutions').doc(executionDigest({ projectId: p, operationId })); }
  private binding(h: any, reviewedSignature: string) { return executionDigest({ projectId: h.projectId, importSessionId: h.importSessionId, operationId: h.operationId, importBatchId: h.importBatchId, sourceRevisionId: h.source?.sourceRevisionId, mappingRevisionId: h.mapping?.mappingRevisionId, reviewedSignature }); }
  private async load(tx: any, p: string, s: string, actor: any) {
    const principal = await authorizeGlobalCommand(tx, this.db, actor, p), sessionRef = this.session(p, s), snap = await tx.get(sessionRef);
    if (!snap.exists)
      fail('IMPORT_SESSION_NOT_FOUND', 404);
    const header = decodePersistence<any>(snap.data(), { id: ['importSessionId', s], projectId: p, times: { createdAt: 'iso', updatedAt: 'iso' } });
    if (header.schemaVersion !== 2 || header.domain !== 'ROSTER')
      fail('INVALID_REVIEWED_COMMIT_SESSION');
    const ref = this.operation(p, header.operationId), saved = await tx.get(ref);
    const operation: ImportExecutionOperation | undefined = saved.exists ? saved.data() : undefined;
    if (operation) {
      if (operation.projectId !== p || operation.importSessionId !== s || operation.operationId !== header.operationId || operation.importBatchId !== header.importBatchId || operation.bindingHash !== this.binding(header, operation.reviewedSignature) || operation.executionKey !== ref.id || header.executionOperationId !== ref.id || header.executionBindingHash !== operation.bindingHash || header.source?.sourceRevisionId !== operation.sourceRevisionId || header.mapping?.mappingRevisionId !== operation.mappingRevisionId)
        fail('EXECUTION_BINDING_MISMATCH');
      if (header.hasReviewedIntent === false || operation.reviewArtifactDigest && operation.reviewArtifactDigest !== (header.artifactFields?.reviewedCanonicalIntent?.digest || header.checkpointArtifact?.digest))
        fail('EXECUTION_BINDING_MISMATCH');
      if (header.reviewedCanonicalIntent && (header.reviewedCanonicalIntent.acceptedSignature !== header.reviewedCanonicalIntent.intent?.signature || executionDigest(header.reviewedCanonicalIntent.intent?.signature) !== operation.reviewedSignature))
        fail('EXECUTION_BINDING_MISMATCH');
      if (header.lifecycleState !== (operation.state === 'COMPLETED' ? 'COMMITTED' : operation.state === 'CANCELLED' ? 'CANCELLED' : 'INTENT_REVIEWED'))
        fail('EXECUTION_SESSION_STATE_CONFLICT');
      if (operation.sessionVersion !== header.version)
        fail('EXECUTION_SESSION_VERSION_CONFLICT');
    }
    else if (header.executionOperationId)
      fail('EXECUTION_BINDING_MISMATCH');
    return { principal, header, sessionRef, ref, operation };
  }
  private async plans(reader: (ref: any) => Promise<any>, ref: any, op: ImportExecutionOperation): Promise<ImportExecutionGroup[]> {
    const payload = await readSessionArtifact(reader, ref, op.planManifest);
    if (payload.bindingHash !== op.bindingHash || !Array.isArray(payload.groups) || payload.groups.length !== op.groupCount)
      fail('EXECUTION_PLAN_INVALID');
    return payload.groups;
  }
  /** Plan staging is immutable and does not advance an operation or mutate canonical entities. */
  async start(p: string, s: string, expectedVersion: number, actor: any): Promise<ImportExecutionStatus> {
    version(expectedVersion);
    const first = await this.db.runTransaction((tx: any) => this.load(tx, p, s, actor));
    if (first.operation) {
      if (expectedVersion !== first.operation.requestVersion)
        fail('EXECUTION_BINDING_MISMATCH');
      return this.status(p, s, actor);
    }
    if (first.header.lifecycleState === 'COMMITTED')
      fail('LEGACY_ATOMIC_COMMIT_ALREADY_COMPLETED');
    const facts = await this.db.runTransaction((tx: any) => this.commit.executeWithinTransaction(tx, p, s, { expectedVersion }, actor, { prepare: (facts: any) => facts }));
    const signature = executionDigest(facts.reviewed.intent.signature), bindingHash = this.binding(facts.header, signature);
    const groups = prepareExecutionGroups(facts, bindingHash), ref = this.operation(p, facts.header.operationId);
    const packed = packSessionArtifact({ bindingHash, groups });
    // Bounded artifact writes reuse the B1 codec. An interruption before publication leaves only unreferenced chunks.
    for (let offset = 0; offset < packed.chunks.length; offset += 16)
      await this.db.runTransaction(async (tx: any) => {
        const current = await this.load(tx, p, s, actor);
        if (current.operation) {
          if (current.operation.bindingHash !== bindingHash)
            fail('EXECUTION_BINDING_MISMATCH');
          return;
        }
        if (current.header.version !== expectedVersion)
          fail('VERSION_CONFLICT');
        for (let i = offset; i < Math.min(offset + 16, packed.chunks.length); i++)
          tx.set(ref.collection('checkpointChunks').doc(`${packed.manifest.artifactId}_${i}`), { ...packed.manifest, index: i, text: packed.chunks[i] });
      });
    await this.db.runTransaction(async (tx: any) => {
      const current = await this.load(tx, p, s, actor);
      if (current.operation) {
        if (current.operation.bindingHash !== bindingHash)
          fail('EXECUTION_BINDING_MISMATCH');
        return;
      }
      if (current.header.version !== expectedVersion || current.header.lifecycleState !== 'INTENT_REVIEWED')
        fail('VERSION_CONFLICT');
      await readSessionArtifact((r: any) => tx.get(r), ref, packed.manifest);
      const now = new Date().toISOString();
      const reviewArtifactDigest = current.header.artifactFields?.reviewedCanonicalIntent?.digest || current.header.checkpointArtifact?.digest;
      const operation: ImportExecutionOperation = { ...(reviewArtifactDigest ? { reviewArtifactDigest } : {}), projectId: p, importSessionId: s, operationId: facts.header.operationId, importBatchId: facts.header.importBatchId, executionKey: ref.id, bindingHash, reviewedSignature: signature, sourceRevisionId: facts.reviewed.sourceRevisionId, mappingRevisionId: facts.reviewed.mappingRevisionId, requestVersion: expectedVersion, sessionVersion: expectedVersion, version: 1, fence: 0, state: 'READY', groupCount: groups.length, completedGroups: 0, consequenceCount: groups.reduce((n, g) => n + g.consequences.length, 0), completedConsequences: 0, planManifest: packed.manifest, createdAt: now, updatedAt: now, createdBy: current.principal.userId, updatedBy: current.principal.userId };
      tx.set(ref, operation);
      tx.update(current.sessionRef, { executionOperationId: ref.id, executionBindingHash: bindingHash });
    });
    return this.status(p, s, actor);
  }
  async status(p: string, s: string, actor: any): Promise<ImportExecutionStatus> {
    return this.db.runTransaction(async (tx: any) => {
      const ctx = await this.load(tx, p, s, actor), op = ctx.operation;
      if (!op)
        fail('IMPORT_EXECUTION_NOT_FOUND', 404);
      const groups = await this.plans((r: any) => tx.get(r), ctx.ref, op!);
      const docs = await tx.get(ctx.ref.collection('receipts'));
      const completed: ImportExecutionReceipt[] = docs.docs.map((d: any) => d.data()).sort((a: any, b: any) => a.groupId.localeCompare(b.groupId));
      if (completed.length !== op!.completedGroups || completed.some(r => r.bindingHash !== op!.bindingHash))
        fail('EXECUTION_RECEIPT_INTEGRITY_ERROR');
      const byId = new Map(groups.map(g => [g.id, g]));
      if (completed.reduce((n, r) => n + r.consequences.length, 0) !== op!.completedConsequences || completed.some(r => !byId.has(r.groupId) || r.result.operationId !== op!.operationId || r.result.reviewedSignature !== op!.reviewedSignature || r.result.projectId !== p || r.result.importSessionId !== s || r.consequences.map(c => c.id).sort().join(',') !== byId.get(r.groupId)!.consequences.map(c => c.id).sort().join(',')))
        fail('EXECUTION_RECEIPT_INTEGRITY_ERROR');
      const done = new Set(completed.map(r => r.groupId));
      return { operation: op!, retryAllowed: !terminal(op!.state) && op!.state !== 'REVIEW_REQUIRED', reviewRequired: op!.state === 'REVIEW_REQUIRED', completed, remaining: groups.filter(g => !done.has(g.id)).map(g => ({ groupId: g.id, consequences: g.consequences })) };
    });
  }
  /** Explicit retry replaces the fence; no lease expiry or process memory grants authority. */
  async advance(p: string, s: string, expectedOperationVersion: number, actor: any): Promise<ImportExecutionStatus> {
    version(expectedOperationVersion);
    const fence = await this.db.runTransaction(async (tx: any) => {
      const ctx = await this.load(tx, p, s, actor), op = ctx.operation;
      if (!op)
        fail('IMPORT_EXECUTION_NOT_FOUND', 404);
      if (op!.version !== expectedOperationVersion)
        fail('EXECUTION_VERSION_CONFLICT');
      if (terminal(op!.state) || op!.state === 'REVIEW_REQUIRED')
        fail('EXECUTION_NOT_RETRYABLE');
      const fence = op!.fence + 1;
      tx.update(ctx.ref, { state: 'EXECUTING', fence, version: op!.version + 1, updatedAt: new Date().toISOString(), updatedBy: ctx.principal.userId });
      return fence;
    });
    let groupId = '';
    try {
      for (let n = 0; n < this.groupsPerRequest; n++) {
        const done = await this.db.runTransaction(async (tx: any) => {
          const ctx = await this.load(tx, p, s, actor), op = ctx.operation!;
          if (op.fence !== fence || op.state !== 'EXECUTING')
            fail('EXECUTION_FENCE_STALE');
          const groups = await this.plans((r: any) => tx.get(r), ctx.ref, op), group = groups[op.completedGroups];
          if (!group)
            return true;
          groupId = group.id;
          const old = await tx.get(ctx.ref.collection('receipts').doc(group.id));
          if (old.exists)
            fail('EXECUTION_RECEIPT_INTEGRITY_ERROR');
          await this.commit.executeWithinTransaction(tx, p, s, { expectedVersion: ctx.header.version }, actor, { scope: group, publish: async (w: any, facts: any) => {
              const result: ReviewedRosterCommitReceipt = facts.receipt;
              const receipt: ImportExecutionReceipt = { groupId: group.id, bindingHash: op.bindingHash, fence, completedAt: result.committedAt, completedBy: ctx.principal.userId, result, consequences: group.consequences.map(c => {
                  const canonicalId = result.preparedIdentityMap[c.subject] || c.subject;
                  const targetId = c.target ? result.preparedIdentityMap[c.target] || c.target : undefined;
                  const changed = c.action === 'MATERIALIZE'
                    ? facts.identities.some((i: any) => i.kind === c.kind && i.id === canonicalId && i.newRecord)
                    : c.action === 'ENROLL'
                      ? facts.membershipPlans.some((p: any) => p.kind === c.kind && p.entityId === canonicalId && p.changed)
                      : c.action === 'AFFILIATE'
                        ? facts.affiliationPlans.some((p: any) => p.kind === c.kind && p.entityId === canonicalId && p.after.carrierId === targetId && p.changed)
                        : c.action === 'NO_CHANGE' ? false
                          : facts.temporalPlans.some((p: any) => p.changed && p.kind === c.kind && (c.action === 'CLOSE'
                            ? p.before.some((old: any) => (c.kind === 'ASSIGNMENT' ? old.assignmentId : old.allocationId) === c.subject)
                            : c.kind === 'ASSIGNMENT' ? p.record.driverId === canonicalId && p.record.truckId === targetId
                              : p.record.truckId === canonicalId && p.record.materialId === targetId));
                  return { ...c, outcome: changed ? 'MUTATED' as const : 'SATISFIED' as const, proof: { groupId: group.id, canonicalId } };
                }) };
              const complete = op.completedGroups + 1 === op.groupCount, now = result.committedAt;
              const accumulated = this.aggregate(op, [...(op.accumulated ? [op.accumulated] : []), result], result);
              const terminalReceipt = complete ? accumulated : undefined;
              w.set(ctx.ref.collection('receipts').doc(group.id), sanitizeUndefined(receipt));
              w.update(ctx.ref, sanitizeUndefined({ ...op, accumulated, failure: null, state: complete ? 'COMPLETED' : 'EXECUTING', completedGroups: op.completedGroups + 1, completedConsequences: op.completedConsequences + group.consequences.length, sessionVersion: result.committedVersion, version: op.version + 1, updatedAt: now, updatedBy: ctx.principal.userId, ...(terminalReceipt ? { receipt: terminalReceipt } : {}) }));
              w.update(ctx.sessionRef, sanitizeUndefined({ lifecycleState: complete ? 'COMMITTED' : 'INTENT_REVIEWED', version: result.committedVersion, updatedAt: now, updatedBy: ctx.principal.userId, ...(terminalReceipt ? { commitReceipt: terminalReceipt, currentStage: 'COMMIT_RESULT', rosterStage: 'COMMIT_RESULT' } : {}) }));
            } });
          return op.completedGroups + 1 === op.groupCount;
        });
        if (done)
          return this.status(p, s, actor);
      }
      await this.finishAttempt(p, s, fence, actor, 'PARTIAL');
    }
    catch (error: any) {
      if (error.code === 'EXECUTION_FENCE_STALE')
        return this.status(p, s, actor);
      const code = String(error.code || 'EXECUTION_INTERRUPTED');
      await this.finishAttempt(p, s, fence, actor, retryable(code) ? 'PARTIAL' : 'REVIEW_REQUIRED', { groupId, code, retryable: retryable(code), reviewRequired: !retryable(code) });
    }
    return this.status(p, s, actor);
  }
  private aggregate(op: ImportExecutionOperation, receipts: ReviewedRosterCommitReceipt[], last: ReviewedRosterCommitReceipt): ReviewedRosterCommitReceipt {
    const unique = (values: any[], key: (v: any) => string) => [...new Map(values.map(v => [key(v), v])).values()];
    const aggregate: ReviewedRosterCommitReceipt = { ...last, requestVersion: op.requestVersion, preparedIdentityMap: Object.assign({}, ...receipts.map(r => r.preparedIdentityMap)), resultSummary: { contributingRows: receipts.reduce((n, r) => n + r.resultSummary.contributingRows, 0), createdIdentities: receipts.reduce((n, r) => n + r.resultSummary.createdIdentities, 0), reusedConcurrentIdentities: receipts.reduce((n, r) => n + r.resultSummary.reusedConcurrentIdentities, 0), canonicalEntities: unique(receipts.flatMap(r => r.resultSummary.canonicalEntities), e => `${e.kind}:${e.id}`), assignments: unique(receipts.flatMap(r => r.resultSummary.assignments), e => e.assignmentId), allocations: unique(receipts.flatMap(r => r.resultSummary.allocations), e => e.allocationId) } };
    if (receipts.some(r => r.receiptDetails?.truncated) || Buffer.byteLength(JSON.stringify(aggregate)) > 180000) {
      aggregate.receiptDetails = { executionKey: op.executionKey, source: 'EXECUTION_JOURNAL', truncated: true };
      aggregate.preparedIdentityMap = Object.fromEntries(Object.entries(aggregate.preparedIdentityMap).slice(0, 64));
      aggregate.resultSummary.canonicalEntities = aggregate.resultSummary.canonicalEntities.slice(0, 64);
      aggregate.resultSummary.assignments = aggregate.resultSummary.assignments.slice(0, 64);
      aggregate.resultSummary.allocations = aggregate.resultSummary.allocations.slice(0, 64);
    }
    return aggregate;
  }
  private async finishAttempt(p: string, s: string, fence: number, actor: any, state: 'PARTIAL' | 'REVIEW_REQUIRED', failure?: ImportExecutionOperation['failure']) {
    await this.db.runTransaction(async (tx: any) => {
      const ctx = await this.load(tx, p, s, actor), op = ctx.operation!;
      if (op.fence !== fence || op.state !== 'EXECUTING') return;
      // A transaction can commit even when its acknowledgment is lost. Receipt truth wins over the transport error.
      const receipt = failure?.groupId ? await tx.get(ctx.ref.collection('receipts').doc(failure.groupId)) : null;
      const alreadyCompleted = receipt?.exists && receipt.data().bindingHash === op.bindingHash;
      tx.update(ctx.ref, {state: alreadyCompleted ? 'PARTIAL' : state, version: op.version + 1,
        updatedAt: new Date().toISOString(), updatedBy: ctx.principal.userId, failure: alreadyCompleted ? null : failure || null});
    });
  }
  async cancel(p: string, s: string, expectedOperationVersion: number, actor: any): Promise<ImportExecutionStatus> {
    version(expectedOperationVersion);
    await this.db.runTransaction(async (tx: any) => {
      const ctx = await this.load(tx, p, s, actor), op = ctx.operation;
      if (!op)
        fail('IMPORT_EXECUTION_NOT_FOUND', 404);
      if (op!.version !== expectedOperationVersion)
        fail('EXECUTION_VERSION_CONFLICT');
      if (op!.state === 'COMPLETED')
        fail('EXECUTION_ALREADY_COMPLETED');
      if (op!.state === 'CANCELLED')
        return;
      const now = new Date().toISOString();
      // Linearizes between atomic groups. A concurrent group either commits with its receipt first, or its fence fails.
      tx.update(ctx.ref, { state: 'CANCELLED', fence: op!.fence + 1, version: op!.version + 1, sessionVersion: ctx.header.version + 1, cancellation: { requestedAt: now, requestedBy: ctx.principal.userId, acknowledgedAt: now }, updatedAt: now, updatedBy: ctx.principal.userId });
      tx.update(ctx.sessionRef, { lifecycleState: 'CANCELLED', version: ctx.header.version + 1, updatedAt: now, updatedBy: ctx.principal.userId });
    });
    return this.status(p, s, actor);
  }
  /** Existing commit UI contract is retained only when the durable operation actually completes. */
  async requestCommit(p: string, s: string, request: any, actor: any): Promise<any> {
    if (!request || Object.keys(request).some(k => !['expectedVersion', 'operationId', 'reviewedSignature'].includes(k)))
      fail('INVALID_REVIEWED_COMMIT_COMMAND', 400);
    const before = await this.db.runTransaction((tx: any) => this.load(tx, p, s, actor));
    if (request.operationId !== undefined && request.operationId !== before.header.operationId)
      fail('INVALID_REVIEWED_INTENT_BINDING');
    if (request.reviewedSignature !== undefined) {
      const signature = before.operation?.reviewedSignature || executionDigest((await new ImportSessionServerService(this.db).getSession(p, s, before.principal)).reviewedCanonicalIntent?.intent?.signature);
      if (signature !== request.reviewedSignature)
        fail('INVALID_REVIEWED_INTENT_BINDING');
    }
    if (!before.operation && before.header.lifecycleState === 'COMMITTED')
      return this.commit.commit(p, s, request, actor);
    let status = await this.start(p, s, request.expectedVersion, actor);
    if (status.operation.state === 'READY') {
      try {
        status = await this.advance(p, s, status.operation.version, actor);
      }
      catch (error: any) {
        if (error.code !== 'EXECUTION_VERSION_CONFLICT')
          throw error;
        status = await this.status(p, s, actor);
      }
    }
    if (status.operation.state === 'COMPLETED')
      return { ...await this.commit.proveCanonical(status.operation.receipt!, actor), execution: status };
    return { lifecycleState: status.operation.state, execution: status };
  }
}
