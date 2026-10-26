import type { ProjectFleetRowDTO, ProjectFleetReadModelResponse, FleetIntegrityIssue } from '../types/projectFleetReadModel';
import { ProjectFleetReadModelReadContext, DefaultProjectFleetReadModelReadContext } from './projectFleetReadModel.context';
import { evaluateGlobalEligibility, GLOBAL_IDENTITIES, validGlobalId, type GlobalKind } from '../utils/globalIdentityPolicy';
import { decodeGlobal, decodeScopedProjection, PersistenceBoundaryError } from '../utils/persistenceBoundary';
import { canonicalProjectRead } from './projectReadTransport';
/** Known row defects may be displayed; network/access/systemic failures must propagate. */
export const isFleetRowDefect = (e: any) => ['PERSISTENCE_BOUNDARY_INVALID', 'IDENTITY_LOOKUP_INTEGRITY_ERROR', 'ASSIGNMENT_POINTER_INTEGRITY_ERROR', 'ALLOCATION_POINTER_CORRUPTION'].includes(e?.code);
/** Decode identity/state/time plus the scalar profile fields that a projection can expose. */
export function decodeFleetGlobal(kind: GlobalKind, raw: unknown, id: string): any {
  const record = decodeGlobal<any>(raw, GLOBAL_IDENTITIES[kind].kind, id);
  if (!evaluateGlobalEligibility(kind, record).MEMBERSHIP_RECORD_MAY_REMAIN) throw new PersistenceBoundaryError('status');
  const fields = { TRUCK: ['plate', 'normalizedPlate', 'truckType'], DRIVER: ['fullNameAr', 'phone', 'nationalId', 'name', 'idNumber', 'nationalOrIqamaId', 'licenseType', 'licenseNumber'], CARRIER: ['nameAr', 'name', 'commercialRegistrationNo', 'transportLicenseNo', 'contactPersonName', 'contactPhone', 'contactEmail'], MATERIAL: ['nameAr', 'nameEn', 'name', 'code', 'unitOfMeasure'] }[kind];
  for (const field of fields) if (record[field] !== undefined && typeof record[field] !== 'string') throw new PersistenceBoundaryError(field);
  if (kind === 'MATERIAL' && record.standardDensityTonPerM3 !== undefined && (typeof record.standardDensityTonPerM3 !== 'number' || !Number.isFinite(record.standardDensityTonPerM3))) throw new PersistenceBoundaryError('standardDensityTonPerM3');
  if (kind === 'CARRIER' && record.contactPerson != null) {
    if (typeof record.contactPerson !== 'object' || Array.isArray(record.contactPerson)) throw new PersistenceBoundaryError('contactPerson');
    for (const field of ['name', 'phone', 'email']) if (record.contactPerson[field] !== undefined && typeof record.contactPerson[field] !== 'string') throw new PersistenceBoundaryError('contactPerson.' + field);
  }
  return record;
}
export class ProjectFleetReadModelService {
  async getProjectFleetReadModel(projectId: string, context?: ProjectFleetReadModelReadContext): Promise<ProjectFleetReadModelResponse> {
    if (!validGlobalId(projectId)) throw new Error('INVALID_ARGUMENT: projectId is required');
    if (!context && process.env.NODE_ENV !== 'test') return canonicalProjectRead(projectId, 'fleet-read-model');
    const ctx = context || new DefaultProjectFleetReadModelReadContext(), at = new Date();
    if (!ctx.getCurrentAssignment || !ctx.getMembership) throw new Error('CANONICAL_FLEET_CONTEXT_REQUIRED');
    const memberships = await ctx.listActiveTruckMemberships(projectId);
    const globals = new Map<string, Promise<any>>();
    const participantReads = new Map<string, Promise<any>>();
    const hydrate = (kind: GlobalKind, id: string) => {
      const key = `${kind}/${id}`;
      if (!globals.has(key)) globals.set(key, (async () => {
        const value = await ({ TRUCK: () => ctx.getGlobalTruck(id), DRIVER: () => ctx.getGlobalDriver(id), CARRIER: () => ctx.getGlobalCarrier(id), MATERIAL: () => ctx.getGlobalMaterial(id) }[kind])();
        if (!value) return null;
        const record = decodeFleetGlobal(kind, value, id);
        return record;
      })());
      return globals.get(key)!;
    };
    const rows = await Promise.all(memberships.map(async membership => {
      const truckId = membership.truckId;
      // A malformed membership is a Project-wide participation boundary failure.
      decodeScopedProjection(membership, 'truckId', truckId, projectId, ['ACTIVE']);
      const issues: FleetIntegrityIssue[] = [];
      const issue = (code: FleetIntegrityIssue['code'], category: NonNullable<FleetIntegrityIssue['category']>, entityType?: GlobalKind) => issues.push({ code, category, entityType, message: code });
      const safe = async <T>(read: () => Promise<T>, code: FleetIntegrityIssue['code']): Promise<T | null> => {
        try { return await read(); } catch (e) { if (!isFleetRowDefect(e)) throw e; issue(code, 'INTEGRITY'); return null; }
      };
      const global = async (kind: GlobalKind, id: string) => {
        const count = issues.length, result = await safe(() => hydrate(kind, id), 'GLOBAL_ENTITY_INVALID');
        if (!result && count < issues.length) issues[issues.length - 1].entityType = kind;
        if (!result && count === issues.length) issue('GLOBAL_ENTITY_MISSING', 'INTEGRITY', kind);
        else if (result && !evaluateGlobalEligibility(kind, result).CAN_USE_OPERATIONALLY) issue('GLOBAL_ENTITY_INELIGIBLE', 'ELIGIBILITY', kind);
        return result;
      };
      const participant = async (kind: GlobalKind, id: string) => {
        const key = `${kind}/${id}`;
        if (!participantReads.has(key)) participantReads.set(key, (async () => { const raw = await ctx.getMembership!(kind, projectId, id); if (!raw) return null; const value = decodeScopedProjection<any>(raw, GLOBAL_IDENTITIES[kind].id, id, projectId, ['ACTIVE', 'SUSPENDED', 'REMOVED']); if (!['ACTIVE', 'SUSPENDED', 'REMOVED'].includes(value.status)) throw new PersistenceBoundaryError('status'); return value; })());
        const record = await safe(() => participantReads.get(key)!, 'MEMBERSHIP_INTEGRITY_ERROR');
        if (!record || record.status !== 'ACTIVE') { issue('MEMBERSHIP_INACTIVE', 'ELIGIBILITY', kind); return false; }
        return true;
      };
      const truckGlobal = await global('TRUCK', truckId);
      const truckAffiliation = await safe(async () => { const raw = await ctx.getTruckCarrierAffiliation(projectId, truckId); if (!raw) return null; const value = decodeScopedProjection<any>(raw, 'truckId', truckId, projectId, ['ACTIVE', 'INACTIVE']); if (!validGlobalId(value.carrierId)) throw new PersistenceBoundaryError('carrierId'); if (!['ACTIVE', 'INACTIVE'].includes(value.status)) throw new PersistenceBoundaryError('status'); return value; }, 'AFFILIATION_INTEGRITY_ERROR');
      let carrierId = '', carrierGlobal: any = null, carrierMember = false;
      if (!truckAffiliation) issue('MISSING_CARRIER_AFFILIATION', 'PARTIAL');
      else if (truckAffiliation.status !== 'ACTIVE') issue('AFFILIATION_INACTIVE', 'ELIGIBILITY', 'TRUCK');
      else { carrierId = truckAffiliation.carrierId; carrierGlobal = await global('CARRIER', carrierId); carrierMember = await participant('CARRIER', carrierId); }
      const assignment = await safe(() => ctx.getCurrentAssignment!(projectId, truckId, at), 'INVALID_DRIVER_ASSIGNMENT_POINTER');
      const allocation = await safe(() => ctx.getActiveAllocationByTruck(projectId, truckId), 'INVALID_MATERIAL_ALLOCATION_POINTER');
      let driverGlobal: any = null, materialGlobal: any = null, driverMember = false, materialMember = false, driverAffiliated = false;
      if (!assignment) { if (!issues.some(i => i.code === 'INVALID_DRIVER_ASSIGNMENT_POINTER')) issue('UNASSIGNED_DRIVER', 'PARTIAL'); }
      else {
        driverGlobal = await global('DRIVER', assignment.driverId); driverMember = await participant('DRIVER', assignment.driverId);
        const affiliation = await safe(async () => { const raw = await ctx.getDriverCarrierAffiliation(projectId, assignment.driverId); return raw ? decodeScopedProjection<any>(raw, 'driverId', assignment.driverId, projectId, ['ACTIVE', 'INACTIVE']) : null; }, 'AFFILIATION_INTEGRITY_ERROR');
        if (!affiliation || affiliation.status !== 'ACTIVE') issue('AFFILIATION_INACTIVE', 'ELIGIBILITY', 'DRIVER');
        else if (affiliation.carrierId !== carrierId) issue('CARRIER_MISMATCH', 'INTEGRITY');
        else driverAffiliated = true;
      }
      if (!allocation) { if (!issues.some(i => i.code === 'INVALID_MATERIAL_ALLOCATION_POINTER')) issue('UNALLOCATED_MATERIAL', 'PARTIAL'); }
      else { materialGlobal = await global('MATERIAL', allocation.materialId); materialMember = await participant('MATERIAL', allocation.materialId); }
      const common = Boolean(evaluateGlobalEligibility('TRUCK', truckGlobal).CAN_USE_OPERATIONALLY && carrierId && evaluateGlobalEligibility('CARRIER', carrierGlobal).CAN_USE_OPERATIONALLY && carrierMember);
      const row: ProjectFleetRowDTO = {
        projectId, truckId, plateNumber: truckGlobal?.plate || truckGlobal?.normalizedPlate || truckId, truckType: truckGlobal?.truckType || 'STANDARD', carrierId, carrierName: carrierGlobal?.nameAr || carrierId || 'غير محدد',
        driverId: assignment?.driverId || null, driverName: assignment ? driverGlobal?.fullNameAr || assignment.driverId : null,
        materialId: allocation?.materialId || null, materialName: allocation ? materialGlobal?.nameAr || materialGlobal?.nameEn || allocation.materialId : null,
        assignmentId: assignment?.assignmentId || null, allocationId: allocation?.allocationId || null,
        assignmentStatus: assignment ? 'ASSIGNMENT_ACTIVE' : 'UNASSIGNED_DRIVER', allocationStatus: allocation ? 'ALLOCATION_ACTIVE' : 'UNALLOCATED_MATERIAL', integrityIssues: issues,
        classification: issues.some(i => i.category === 'INTEGRITY') ? 'INTEGRITY_ERROR' : issues.some(i => i.category === 'ELIGIBILITY') ? 'INELIGIBLE' : issues.length ? 'PARTIAL' : 'OPERATIONAL',
        assignmentEligible: Boolean(common && assignment && driverMember && driverAffiliated && evaluateGlobalEligibility('DRIVER', driverGlobal).CAN_USE_OPERATIONALLY),
        allocationEligible: Boolean(common && allocation && materialMember && evaluateGlobalEligibility('MATERIAL', materialGlobal).CAN_USE_OPERATIONALLY),
      };
      return row;
    }));
    rows.sort((a, b) => a.plateNumber < b.plateNumber ? -1 : a.plateNumber > b.plateNumber ? 1 : a.truckId < b.truckId ? -1 : a.truckId > b.truckId ? 1 : 0);
    return { projectId, truckCount: rows.length, rows, generatedAt: new Date().toISOString() };
  }
}
export const projectFleetReadModelService = new ProjectFleetReadModelService();
