import { normalizeNaturalKey } from '../../utils/globalIdentityPolicy';
import type { ImportRow, PipelineContext, UnifiedImportBatch } from '../../types/unifiedImport';
import type { ImportResolutionEntity } from '../../types/importResolution';
import type { AllocationIntent, AssignmentIntent, IntentEntity, RosterCanonicalIntent, ReviewedCanonicalIntent } from '../../types/rosterCanonicalIntent';
import { normalizeIdNumber, normalizeName, normalizePhone, normalizePlate } from '../../utils/normalization';

const keys = ['carrier', 'driver', 'truck', 'material'] as const;
const sortedNumbers = (values: number[]) => [...new Set(values)].sort((a, b) => a - b);
/** Stable semantic encoding, not a security hash. No clock or request generation enters it. */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`;
  return JSON.stringify(value);
}
function supplied(row: ImportRow, key: typeof keys[number]): boolean {
  const c = row.canonical || row.raw || {};
  return Boolean(key === 'carrier' ? c.carrierName || c.carrierId : key === 'driver' ? c.driverName || c.driverIdentity : key === 'truck' ? c.truckPlate : c.materialName || c.materialCode || c.materialId);
}
const blockingResolution = (r: NonNullable<ImportRow['entityResolutions']>[string]) => Boolean(r.resolutionReason || r.isAuthorized === false || r.ambiguous || r.recommendation === 'REJECT' || r.recommendation === 'REVIEW' || r.creationDisposition === 'CONFLICT' || r.riskLevel === 'CRITICAL');

/** One pure authority for selected-ID coherence and consequences. Never performs commands. */
export function buildRosterCanonicalIntent(batch: UnifiedImportBatch, context: PipelineContext): RosterCanonicalIntent {
  const intent: RosterCanonicalIntent = { projectId: batch.projectId, sourceRows: batch.rows.map(row => row.sourceLocation ? {...row.sourceLocation} : {sourceType:batch.source.sourceType, sourceSheetName:batch.source.sourceSheetName, internalRowNumber:row.rowNumber}), rowDecisions: [], entities: [], assignmentIntents: [], allocationIntents: [], entityConsequences: [], blockers: [], warnings: [], requiresDisplacementApproval: false, signature: '' };
  const block = (code: string, rows: number[]) => { const existing = intent.blockers.find(i => i.code === code && stable(i.rowNumbers) === stable(sortedNumbers(rows))); if (!existing) intent.blockers.push({ code, rowNumbers: sortedNumbers(rows) }); };
  const ctx = context.resolutionContext;
  const available = ctx && ctx.projectId === batch.projectId && context.projectId === batch.projectId;
  if (!available) block('RELATIONSHIP_CONTEXT_UNAVAILABLE', batch.rows.filter(r => r.status !== 'REJECTED').map(r => r.rowNumber));
  const entities = new Map<string, IntentEntity>();
  const conflictingPrepared = new Set<string>();
  const canonical = new Map<string, ImportResolutionEntity>();
  for (const e of ctx?.entities || []) {
    const key = `${e.kind}:${e.id}`;
    if (canonical.has(key)) block('CANONICAL_INTEGRITY_ERROR', batch.rows.map(r => r.rowNumber));
    canonical.set(key, e);
  }
  const assignments = new Map<string, AssignmentIntent>();
  const allocations = new Map<string, AllocationIntent>();
  for (const row of batch.rows) {
    const decision: RosterCanonicalIntent['rowDecisions'][number] = { rowNumber: row.rowNumber, status: row.status === 'REJECTED' || row.status === 'COMMITTED' ? 'EXCLUDED' : 'CONTRIBUTING', entities: {} };
    intent.rowDecisions.push(decision);
    if (decision.status === 'EXCLUDED') continue;
    const ids: Partial<Record<typeof keys[number], string>> = {};
    let invalid = !available;
    if ((row.validationIssues || []).some(i => i.blocking || i.severity === 'BLOCKING') || row.status === 'ERROR' || row.reviewStatus === 'error') { block('ROW_VALIDATION_BLOCKED', [row.rowNumber]); invalid = true; }
    if ((row.validationIssues || []).some(i => i.severity === 'WARNING')) {
      intent.warnings.push({ code: 'ROW_WARNING', rowNumbers: [row.rowNumber] });
      if (!batch.warningConfirmation?.confirmed) block('WARNING_APPROVAL_REQUIRED', [row.rowNumber]);
    }
    for (const key of keys) {
      const r = row.entityResolutions?.[key];
      if (!supplied(row, key) && !r?.matchedId && r?.creationDisposition !== 'PREPARED_NEW') continue;
      if (!r || blockingResolution(r)) { block(r?.resolutionReason || 'UNRESOLVED_CANONICAL_ENTITY', [row.rowNumber]); invalid = true; continue; }
      let entity: IntentEntity;
      if (r.creationDisposition === 'PREPARED_NEW' && (key === 'driver' || key === 'truck')) {
        const plan = key === 'driver' ? r.preparedDriverPlan : r.preparedTruckPlan;
        const natural = key === 'driver' ? normalizeIdNumber(r.preparedDriverPlan?.residencyId || '') : normalizePlate(r.preparedTruckPlan?.plateNumber || '');
        if (!plan || !natural || !plan.carrierId || key === 'driver' && !r.preparedDriverPlan?.driverName.trim()) { block('PREPARED_ENTITY_CONFLICT', [row.rowNumber]); invalid = true; continue; }
        try {
          normalizeNaturalKey(key === 'driver' ? 'DRIVER' : 'TRUCK', natural);
          if (ctx?.entities.some(e => e.kind === key.toUpperCase() && e.naturalKey && normalizeNaturalKey(e.kind, e.naturalKey) === natural)) { block('PREPARED_ENTITY_CONFLICT', [row.rowNumber]); invalid = true; continue; }
        } catch { block('PREPARED_ENTITY_CONFLICT', [row.rowNumber]); invalid = true; continue; }
        const normalized = key === 'driver' ? { ...plan, driverName: normalizeName(r.preparedDriverPlan!.driverName), residencyId: natural, phone: normalizePhone(r.preparedDriverPlan!.phone || '') } : { ...plan, plateNumber: natural };
        entity = { key: `prepared:${key}:${natural}`, kind: key.toUpperCase() as IntentEntity['kind'], label: key === 'driver' ? r.preparedDriverPlan!.driverName : r.preparedTruckPlan!.plateNumber, prepared: true, carrierId: plan.carrierId, plan: normalized, rowNumbers: [row.rowNumber] };
      } else {
        const e = r.matchedId ? canonical.get(`${key.toUpperCase()}:${r.matchedId}`) : undefined;
        if (!e || e.issue || e.globalStatus !== 'ACTIVE' || e.membershipStatus !== 'ACTIVE' || !e.eligible) { block(e?.issue ? 'CANONICAL_INTEGRITY_ERROR' : 'UNRESOLVED_CANONICAL_ENTITY', [row.rowNumber]); invalid = true; continue; }
        if ((key === 'driver' || key === 'truck') && (!e.affiliation || e.affiliation.status !== 'ACTIVE')) { block('AFFILIATION_CONFLICT', [row.rowNumber]); invalid = true; continue; }
        // ReadProjection deliberately supplies null when no current relation exists. Absence is not proof.
        if ((key === 'driver' || key === 'truck') && e.assignment === undefined || key === 'truck' && e?.allocation === undefined) { block('RELATIONSHIP_CONTEXT_UNAVAILABLE', [row.rowNumber]); invalid = true; continue; }
        entity = { key: e.id, kind: e.kind, label: e.name, prepared: false, carrierId: e.affiliation?.carrierId, rowNumbers: [row.rowNumber] };
      }
      ids[key] = entity.key;
      const mapKey = `${entity.kind}:${entity.key}`, existing = entities.get(mapKey);
      if (existing) {
        if (stable(existing.plan) !== stable(entity.plan) || existing.carrierId !== entity.carrierId) conflictingPrepared.add(mapKey);
        existing.rowNumbers = sortedNumbers([...existing.rowNumbers, row.rowNumber]);
      } else entities.set(mapKey, entity);
    }
    decision.entities = ids;
    const driver = ids.driver && entities.get(`DRIVER:${ids.driver}`), truck = ids.truck && entities.get(`TRUCK:${ids.truck}`);
    if ((driver && (!ids.carrier || driver.carrierId !== ids.carrier)) || (truck && (!ids.carrier || truck.carrierId !== ids.carrier))) { block('AFFILIATION_CONFLICT', [row.rowNumber]); invalid = true; }
    if (invalid) { decision.status = 'BLOCKED'; continue; }
    if (ids.driver && ids.truck) {
      const pair = stable([ids.driver, ids.truck]);
      const old = assignments.get(pair);
      if (old) old.rowNumbers.push(row.rowNumber);
      else assignments.set(pair, { driverId: ids.driver, truckId: ids.truck, action: 'ASSIGN', displaced: [], rowNumbers: [row.rowNumber] });
    }
    if (ids.truck && ids.material) {
      const pair = stable([ids.truck, ids.material]);
      const old = allocations.get(pair);
      if (old) old.rowNumbers.push(row.rowNumber);
      else allocations.set(pair, { truckId: ids.truck, materialId: ids.material, action: 'ALLOCATE', displaced: null, rowNumbers: [row.rowNumber] });
    }
  }
  for (const key of conflictingPrepared) block('PREPARED_ENTITY_CONFLICT', entities.get(key)!.rowNumbers);
  const conflict = <T extends { rowNumbers: number[] }>(items: T[], source: (item: T) => string, target: (item: T) => string, code: string) => {
    const groups = new Map<string, T[]>();
    for (const item of items) groups.set(source(item), [...(groups.get(source(item)) || []), item]);
    for (const group of groups.values()) if (new Set(group.map(target)).size > 1) block(code, group.flatMap(item => item.rowNumbers));
  };
  conflict([...assignments.values()], a => a.driverId, a => a.truckId, 'CROSS_ROW_DRIVER_TRUCK_CONFLICT');
  conflict([...assignments.values()], a => a.truckId, a => a.driverId, 'CROSS_ROW_TRUCK_DRIVER_CONFLICT');
  conflict([...allocations.values()], a => a.truckId, a => a.materialId, 'CROSS_ROW_TRUCK_MATERIAL_CONFLICT');
  for (const a of assignments.values()) {
    const d = canonical.get(`DRIVER:${a.driverId}`)?.assignment, tr = canonical.get(`TRUCK:${a.truckId}`)?.assignment;
    if (d && d.driverId !== a.driverId || tr && tr.truckId !== a.truckId) block('CANONICAL_INTEGRITY_ERROR', a.rowNumbers);
    const current = [...new Map([d, tr].filter((v): v is NonNullable<typeof v> => Boolean(v)).map(v => [v.assignmentId, v])).values()];
    if (current.some(v => v.driverId === a.driverId && v.truckId === a.truckId)) {
      // Both existing sides must agree; otherwise the representation cannot be trusted.
      if (!d || !tr || d.assignmentId !== tr.assignmentId || current.length !== 1) block('CANONICAL_INTEGRITY_ERROR', a.rowNumbers);
      a.action = 'NO_CHANGE';
    } else if (current.length) { a.action = 'REASSIGN'; a.displaced = current.sort((x, y) => x.assignmentId.localeCompare(y.assignmentId)); }
  }
  for (const a of allocations.values()) {
    const current = canonical.get(`TRUCK:${a.truckId}`)?.allocation;
    if (current && current.truckId !== a.truckId) block('CANONICAL_INTEGRITY_ERROR', a.rowNumbers);
    if (current?.materialId === a.materialId) a.action = 'NO_CHANGE';
    else if (current) { a.action = 'REALLOCATE'; a.displaced = current; }
  }
  // Every implicated row is blocked; no conflict produces a partial temporal plan.
  const blocked = new Set(intent.blockers.flatMap(b => b.rowNumbers));
  for (const row of intent.rowDecisions) if (row.status !== 'EXCLUDED' && blocked.has(row.rowNumber)) row.status = 'BLOCKED';
  intent.assignmentIntents = [...assignments.values()].filter(a => !a.rowNumbers.some(n => blocked.has(n))).sort((a, b) => stable([a.driverId, a.truckId]).localeCompare(stable([b.driverId, b.truckId])));
  intent.allocationIntents = [...allocations.values()].filter(a => !a.rowNumbers.some(n => blocked.has(n))).sort((a, b) => stable([a.truckId, a.materialId]).localeCompare(stable([b.truckId, b.materialId])));
  intent.entities = [...entities.values()].sort((a, b) => `${a.kind}:${a.key}`.localeCompare(`${b.kind}:${b.key}`));
  intent.entityConsequences = intent.entities.map(e => ({ key: `${e.kind}:${e.key}`, action: e.prepared ? 'PREPARE_NEW' : 'REUSE', completed: !e.prepared, rowNumbers: e.rowNumbers }));
  // Optional receipts only describe commands B2 actually completed; never infer them from membership state.
  for (const receipt of batch.metadata?.canonicalPrerequisites || []) {
    if (receipt.projectId === batch.projectId && ['ENROLL', 'REACTIVATE', 'AFFILIATE', 'REACTIVATE_AFFILIATION'].includes(receipt.action) && receipt.completed === true && intent.entities.some(e => `${e.kind}:${e.key}` === receipt.key) && !intent.entityConsequences.some(c => c.key === receipt.key && c.action === receipt.action)) intent.entityConsequences.push({ key: receipt.key, action: receipt.action, completed: true, rowNumbers: intent.entities.find(e => `${e.kind}:${e.key}` === receipt.key)!.rowNumbers });
  }
  for (const e of ctx?.entities || []) {
    if (!intent.entities.some(i => i.kind === e.kind && i.key === e.id) && (intent.assignmentIntents.some(a => a.displaced.some(d => e.kind === 'DRIVER' && d.driverId === e.id || e.kind === 'TRUCK' && d.truckId === e.id)) || intent.allocationIntents.some(a => e.kind === 'MATERIAL' && a.displaced?.materialId === e.id))) intent.entities.push({ key: e.id, kind: e.kind, label: e.name, prepared: false, rowNumbers: [] });
  }
  intent.requiresDisplacementApproval = intent.assignmentIntents.some(a => a.action === 'REASSIGN') || intent.allocationIntents.some(a => a.action === 'REALLOCATE');
  intent.blockers.sort((a, b) => stable(a).localeCompare(stable(b)));
  // Include labels/plans, row decisions, and current relation IDs: a changed review never retains approval.
  intent.signature = stable({ ...intent, signature: undefined, sourceEvidence: batch.rows.map(r => ({ rowNumber: r.rowNumber, status: r.status === 'REJECTED' ? 'EXCLUDED' : 'INCLUDED', canonical: r.canonical, raw: r.raw })), current: (ctx?.entities || []).filter(e => intent.entities.some(i => i.kind === e.kind && i.key === e.id)).map(e => ({ kind: e.kind, id: e.id, assignment: e.assignment, allocation: e.allocation, affiliation: e.affiliation, issue: e.issue })).sort((a, b) => stable(a).localeCompare(stable(b))) });
  return intent;
}
export function canAcceptRosterIntent(intent: RosterCanonicalIntent, displacementSignature?: string): boolean {
  return intent.rowDecisions.some(r => r.status === 'CONTRIBUTING') && intent.blockers.length === 0 && (!intent.requiresDisplacementApproval || displacementSignature === intent.signature);
}
/** Optional serializable handoff only; no durable session lifecycle changes. */
export function attachReviewedRosterIntent(batch: UnifiedImportBatch, intent: RosterCanonicalIntent, displacementSignature?: string): UnifiedImportBatch {
  if (batch.projectId !== intent.projectId || !canAcceptRosterIntent(intent, displacementSignature)) throw Error('DISPLACEMENT_APPROVAL_REQUIRED');
  const reviewed: ReviewedCanonicalIntent = { intent, acceptedSignature: intent.signature, displacementApprovedSignature: displacementSignature };
  return { ...batch, commitStatus: 'READY_TO_COMMIT', metadata: { ...batch.metadata, reviewedCanonicalIntent: reviewed } };
}
