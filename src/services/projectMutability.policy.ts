import { ProjectEntity } from '../types/entities';

// Foundation is intentionally separate from operational additions and Workspace linkage.
export const FOUNDATION_FIELDS = ['nameAr', 'nameEn', 'clientName', 'description', 'startDate', 'endDate', 'location', 'settings'] as const;
export const FOUNDATION_SETTINGS = ['zatcaTaxNumber', 'vatRatePercent', 'currency'] as const;
export function canEditProjectFoundation(status: ProjectEntity['status']): boolean {
  return status === 'SETUP' || status === 'READY_FOR_REVIEW' || status === 'APPROVED';
}
export function canEvaluateProjectActivation(status: ProjectEntity['status']): boolean {
  return status === 'APPROVED';
}

export type OperationalMutationType =
  | 'ENROLL_CARRIER'
  | 'ENROLL_MATERIAL'
  | 'INTAKE_DRIVER_TRUCK'
  | 'IMPORT_ROSTER_FILE'
  | 'COMMIT_ROSTER_BATCH'
  | 'CREATE_PRICING_RULE'
  | 'MANAGE_ACCESS';

export type ProtectedProjectField =
  | 'projectId'
  | 'projectCode'
  | 'projectNumber'
  | 'status'
  | 'createdAt'
  | 'createdBy';

/**
 * Pure policy governing whether operational additions and updates (carriers, materials, fleet roster, pricing rules)
 * are permitted for a given project lifecycle status.
 *
 * Canonical rule: ACTIVE projects are NOT globally read-only; legitimate day-to-day operational mutations
 * remain allowed subject to RBAC, validation, audit, and historical preservation.
 */
export function isProjectOperationallyMutable(status: ProjectEntity['status'] | undefined | null): boolean {
  if (!status) return false;
  switch (status) {
    case 'SETUP':
    case 'READY_FOR_REVIEW':
    case 'APPROVED':
    case 'ACTIVE':
      return true;
    case 'ARCHIVED':
    default:
      return false;
  }
}

/**
 * Validates whether a specific operational mutation is allowed for the project's current status.
 */
export function canPerformOperationalMutation(
  operation: OperationalMutationType,
  status: ProjectEntity['status'] | undefined | null
): boolean {
  if (!isProjectOperationallyMutable(status)) {
    return false;
  }
  // All listed operational mutations are permitted for mutable statuses (SETUP, READY_FOR_REVIEW, APPROVED, ACTIVE)
  return true;
}

/**
 * Pure policy governing core project identity fields.
 * Direct modification of primary identifiers is strictly prohibited across all lifecycles.
 */
export function isCoreIdentityImmutable(field: string): boolean {
  const immutableFields: ProtectedProjectField[] = [
    'projectId',
    'projectCode',
    'projectNumber',
  ];
  return immutableFields.includes(field as ProtectedProjectField);
}

/**
 * Pure policy determining whether a project field is protected by lifecycle governance.
 * Lifecycle status and creation metadata cannot be mutated via direct field updates.
 */
export function isGovernanceFieldProtected(field: string): boolean {
  const protectedFields: ProtectedProjectField[] = [
    'projectId',
    'projectCode',
    'projectNumber',
    'status',
    'createdAt',
    'createdBy',
  ];
  return protectedFields.includes(field as ProtectedProjectField);
}

/**
 * Authoritative message for active projects clarifying operational mutability under governance.
 */
export const ACTIVE_PROJECT_OPERATIONAL_NOTICE_AR =
  'المشروع نشط. التعديلات التشغيلية المصرح بها متاحة وتخضع للصلاحيات والتدقيق وحفظ التاريخ.';

export const ACTIVE_PROJECT_OPERATIONAL_NOTICE_EN =
  'Project is active. Authorized operational modifications are enabled subject to RBAC, auditing, and history preservation.';


/** One lifecycle decision for Project-scoped canonical foundation commands. */
export type FoundationMutationClass = 'NEW_OPERATION' | 'MAINTENANCE' | 'CONSISTENCY_CLEANUP';
export function canPerformFoundationMutation(status: unknown, kind: FoundationMutationClass): boolean {
  if(!['NEW_OPERATION','MAINTENANCE','CONSISTENCY_CLEANUP'].includes(kind))return false;
  if(['SETUP','READY_FOR_REVIEW','APPROVED','ACTIVE'].includes(status as string))return true;
  return ['SUSPENDED','ARCHIVED'].includes(status as string) && kind==='CONSISTENCY_CLEANUP';
}
export function assertFoundationMutation(status: unknown, kind: FoundationMutationClass): void {
  if(!canPerformFoundationMutation(status,kind))throw Object.assign(new Error('PROJECT_LIFECYCLE_MUTATION_DENIED'),{code:'PROJECT_LIFECYCLE_MUTATION_DENIED',status:409,mutationClass:kind});
}

/** Historical-sensitive fields remain locked after activation; identity/provenance never enter patches. */
export const ACTIVE_PROJECT_PROFILE_FIELDS=['nameAr','nameEn','clientName','description'] as const;
export function canMaintainProjectProfile(status:unknown){return ['SETUP','READY_FOR_REVIEW','APPROVED','ACTIVE'].includes(status as string);}
