import { createHash } from 'node:crypto';
import type { RosterCanonicalIntent } from '../../types/rosterCanonicalIntent';
import type { ImportExecutionGroup, ExecutionConsequence } from '../../types/importExecution';
import { ImportProjectContextAdapter } from './importProjectContext.adapter';
import { buildRosterCanonicalIntent } from './rosterCanonicalIntent.service';
import { GlobalIdentityError } from '../../utils/globalIdentityPolicy';
export const stableExecution = (v: any): string => Array.isArray(v) ? `[${v.map(stableExecution).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + stableExecution(v[k])).join(',')}}` : JSON.stringify(v);
export const executionDigest = (value: any) => createHash('sha256').update(typeof value === 'string' ? value : stableExecution(value)).digest('hex');
const withoutRows = ({ rowNumbers: _rows, ...value }: any) => value;
/** Sealed semantic plan, not a source-row command list. Original review remains immutable. */
export function executionPlan(intent: RosterCanonicalIntent) {
  return { projectId: intent.projectId, entities: intent.entities.map(e => ({ ...withoutRows(e), rowNumbers: [] })), assignmentIntents: intent.assignmentIntents.map(e => ({ ...withoutRows(e), rowNumbers: [] })), allocationIntents: intent.allocationIntents.map(e => ({ ...withoutRows(e), rowNumbers: [] })), entityConsequences: intent.entityConsequences.map(e => ({ ...withoutRows(e), rowNumbers: [] })), requiresDisplacementApproval: intent.requiresDisplacementApproval };
}
function consequences(intent: RosterCanonicalIntent, binding: string): ExecutionConsequence[] {
  const found = new Map<string, ExecutionConsequence>();
  const add = (kind: string, action: string, subject: string, target?: string) => { const effect = { kind, action, subject, ...(target ? { target } : {}) }; const id = executionDigest({ binding, effect }); found.set(id, { id, ...effect }); };
  for (const e of intent.entities.filter(e => e.prepared)) {
    add(e.kind, 'MATERIALIZE', e.key, executionDigest(e.plan));
    add(e.kind, 'ENROLL', e.key, intent.projectId);
    add(e.kind, 'AFFILIATE', e.key, e.carrierId);
  }
  for (const a of intent.assignmentIntents) {
    add('ASSIGNMENT', a.action, a.driverId, a.truckId);
    if (a.action === 'REASSIGN')
      for (const d of a.displaced)
        add('ASSIGNMENT', 'CLOSE', d.assignmentId, executionDigest(d));
  }
  for (const a of intent.allocationIntents) {
    add('ALLOCATION', a.action, a.truckId, a.materialId);
    if (a.action === 'REALLOCATE' && a.displaced)
      add('ALLOCATION', 'CLOSE', a.displaced.allocationId, executionDigest(a.displaced));
  }
  return [...found.values()].sort((a, b) => a.id.localeCompare(b.id));
}
export function scopedExecutionBatch(batch: any, rows: number[]) {
  const selected = new Set(rows), values = batch.rows.filter((r: any) => selected.has(r.rowNumber));
  const keys = new Set(values.flatMap((r: any) => Object.values(r.entityResolutions || {}).filter((e: any) => e?.matchedId).map((e: any) => `${e.entityType}:${e.matchedId}`)));
  return { ...batch, rows: values, metadata: { ...batch.metadata, canonicalPrerequisites: (batch.metadata?.canonicalPrerequisites || []).filter((r: any) => keys.has(r.key)) } };
}
export function provenanceDigest(intent: RosterCanonicalIntent) {
  const signed = JSON.parse(intent.signature);
  return executionDigest({ projectId: signed.projectId, sourceEvidence: signed.sourceEvidence, sourceRows: signed.sourceRows, rowDecisions: signed.rowDecisions, warnings: signed.warnings, blockers: signed.blockers });
}
/** Current satisfaction may remove work; it cannot authorize a different relationship or affiliation. */
export function validateRecoveryScope(scope: ImportExecutionGroup, rebuilt: RosterCanonicalIntent, context: any) {
  if (rebuilt.blockers.length || provenanceDigest(rebuilt) !== scope.provenanceDigest)
    throw new GlobalIdentityError('REVIEWED_INTENT_STALE');
  const plan = executionPlan(rebuilt), affectedAssignments = new Set<string>(), affectedAllocations = new Set<string>();
  for (const expected of scope.plan.assignmentIntents) {
    const current = plan.assignmentIntents.find((a: any) => a.driverId === expected.driverId && a.truckId === expected.truckId);
    if (current?.action === 'NO_CHANGE' && expected.action !== 'NO_CHANGE') {
      affectedAssignments.add(`DRIVER:${expected.driverId}`);
      affectedAssignments.add(`TRUCK:${expected.truckId}`);
      for (const displaced of expected.displaced) {
        affectedAssignments.add(`DRIVER:${displaced.driverId}`);
        affectedAssignments.add(`TRUCK:${displaced.truckId}`);
      }
      Object.assign(current, { action: expected.action, displaced: expected.displaced });
    }
  }
  for (const expected of scope.plan.allocationIntents) {
    const current = plan.allocationIntents.find((a: any) => a.truckId === expected.truckId && a.materialId === expected.materialId);
    if (current?.action === 'NO_CHANGE' && expected.action !== 'NO_CHANGE') {
      affectedAllocations.add(`TRUCK:${expected.truckId}`);
      Object.assign(current, { action: expected.action, displaced: expected.displaced });
    }
  }
  for (const expected of scope.plan.entities)
    if (!plan.entities.some((e: any) => e.kind === expected.kind && e.key === expected.key)) {
      const key = `${expected.kind}:${expected.key}`, current = context.importResolution?.entities.find((e: any) => e.kind === expected.kind && e.id === expected.key);
      if (!affectedAssignments.has(key) && !scope.plan.allocationIntents.some((a: any) => a.displaced?.materialId === expected.key && affectedAllocations.has(`TRUCK:${a.truckId}`)) || !current?.eligible || current.name !== expected.label)
        throw new GlobalIdentityError('REVIEWED_INTENT_STALE');
      plan.entities.push(expected);
    }
  if (affectedAssignments.size || affectedAllocations.size)
    plan.requiresDisplacementApproval = scope.plan.requiresDisplacementApproval;
  plan.entities.sort((a: any, b: any) => `${a.kind}:${a.key}`.localeCompare(`${b.kind}:${b.key}`));
  if (stableExecution(plan) !== stableExecution(scope.plan))
    throw new GlobalIdentityError('REVIEWED_INTENT_STALE');
  const live = JSON.parse(rebuilt.signature).current;
  const reconstructed = scope.currentProof.map(old => {
    const key = `${old.kind}:${old.id}`;
    let now = live.find((v: any) => v.kind === old.kind && v.id === old.id);
    if (!now) {
      const e = context.importResolution?.entities.find((e: any) => e.kind === old.kind && e.id === old.id);
      if (!e?.eligible)
        throw new GlobalIdentityError('REVIEWED_INTENT_STALE');
      now = { kind: e.kind, id: e.id, assignment: e.assignment, allocation: e.allocation, affiliation: e.affiliation, issue: e.issue };
    }
    return { ...now, ...(affectedAssignments.has(key) ? { assignment: old.assignment } : {}), ...(affectedAllocations.has(key) ? { allocation: old.allocation } : {}) };
  });
  if (stableExecution(reconstructed) !== stableExecution(scope.currentProof))
    throw new GlobalIdentityError('REVIEWED_INTENT_STALE');
}
/** Partition only independent Driver/Truck dependency components; shared displaced slots join components. */
export function prepareExecutionGroups(facts: any, binding: string): ImportExecutionGroup[] {
  const { reviewed, batch, current, actor } = facts;
  const approved: RosterCanonicalIntent = reviewed.intent;
  const parent = new Map<string, string>();
  const find = (key: string): string => { if (!parent.has(key))
    parent.set(key, key); const p = parent.get(key)!; if (p !== key)
    parent.set(key, find(p)); return parent.get(key)!; };
  const union = (keys: string[]) => { if (!keys.length)
    return; const first = find(keys[0]); for (const key of keys)
    parent.set(find(key), first); };
  const keysFor = (r: any) => ['driver', 'truck'].filter(k => r.entities[k]).map(k => `${k}:${r.entities[k]}`);
  for (const r of approved.rowDecisions.filter(r => r.status === 'CONTRIBUTING'))
    union(keysFor(r));
  for (const a of approved.assignmentIntents)
    union([`driver:${a.driverId}`, `truck:${a.truckId}`, ...a.displaced.flatMap(d => [`driver:${d.driverId}`, `truck:${d.truckId}`])]);
  const groups = new Map<string, number[]>();
  for (const row of approved.rowDecisions.filter(r => r.status === 'CONTRIBUTING')) {
    const key = keysFor(row)[0];
    const component = key ? find(key) : 'no-temporal-effects';
    groups.set(component, [...(groups.get(component) || []), row.rowNumber]);
  }
  const context = ImportProjectContextAdapter.createPipelineContext({ relContext: current, projectId: batch.projectId, userId: actor.userId, role: actor.role, operationId: batch.operationId });
  return [...groups.values()].map(rows => {
    const selected = new Set(rows);
    const intent = buildRosterCanonicalIntent(scopedExecutionBatch(batch, rows), context);
    if (intent.blockers.length)
      throw new GlobalIdentityError('REVIEWED_INTENT_STALE');
    for (const family of ['entities', 'assignmentIntents', 'allocationIntents', 'entityConsequences'] as const)
      for (const item of intent[family]) {
        if (!approved[family].some(original => stableExecution(withoutRows(original)) === stableExecution(withoutRows(item))))
          throw new GlobalIdentityError('EXECUTION_SCOPE_EXCEEDS_REVIEW');
      }
    const plan = executionPlan(intent), effects = consequences(intent, binding);
    return { id: executionDigest({ binding, plan }), rows: rows.sort((a, b) => a - b), signatureDigest: executionDigest(intent.signature), provenanceDigest: provenanceDigest(intent), currentProof: JSON.parse(intent.signature).current, plan, consequences: effects };
  }).sort((a, b) => a.id.localeCompare(b.id));
}
