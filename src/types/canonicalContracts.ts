/**
 * BLOCK 114 — Canonical Shared Entity Contracts, Security Foundations, and Service Boundaries
 * Strict adherence to Blocks 105–111 architectural specifications.
 */

import { Timestamp } from 'firebase/firestore';

// ==========================================
// 1. CANONICAL ROLES & ACCOUNT STATUS
// ==========================================

export type CanonicalRole = 
  | 'SUPER_ADMIN'
  | 'PROJECT_ADMIN'
  | 'SUPERVISOR'
  | 'SITE_SUPERVISOR'
  | 'FINANCE_AUDITOR'
  | 'VIEWER';

export type AccountStatus = 
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REJECTED';

export type MembershipState = 
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REMOVED';

export type ProjectScopeType = 
  | 'GLOBAL'
  | 'PROJECT_SCOPED'
  | 'RECORD_SCOPED'
  | 'DERIVED_READ_ONLY';

// ==========================================
// 2. AUTHORIZATION & SCOPE CONTRACTS
// ==========================================

export interface ProjectMembershipRef {
  projectId: string;
  role: CanonicalRole;
  membershipState: MembershipState;
  assignedAt: Timestamp | Date;
}

export interface AuthorizationContext {
  userId: string;
  email: string;
  displayName: string;
  accountStatus: AccountStatus;
  globalRole?: CanonicalRole;
  memberships: Record<string, ProjectMembershipRef>; // projectId -> membership
  ipAddress?: string;
  userAgent?: string;
}

export interface PermissionDecision {
  allowed: boolean;
  reasonCode: string;
  requiredRole?: CanonicalRole;
  requiredScope?: ProjectScopeType;
  requiredState?: string;
  auditRequired: boolean;
}

// ==========================================
// 3. LIFECYCLE STATES
// ==========================================

export type ProjectState = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type ProjectRosterState = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type PricingRuleState = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type TripState = 
  | 'CREATED' 
  | 'LOADING' 
  | 'LOADED' 
  | 'IN_TRANSIT' 
  | 'UNLOADING' 
  | 'UNLOADED' 
  | 'WEIGHBRIDGE' 
  | 'COMPLETED' 
  | 'CANCELLED';
export type ExceptionState = 'OPEN' | 'IN_REVIEW' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
export type ImportOperationState = 
  | 'SOURCE' 
  | 'PARSE' 
  | 'NORMALIZE' 
  | 'MAP' 
  | 'ENTITY_RESOLUTION' 
  | 'VALIDATE' 
  | 'DUPLICATE_CHECK' 
  | 'REVIEW' 
  | 'COMMIT' 
  | 'AUDIT';

// ==========================================
// 4. CANONICAL OPERATION VOCABULARY
// ==========================================

export type DomainOperation = 
  | 'CREATE'
  | 'UPDATE'
  | 'ASSIGN'
  | 'IMPORT'
  | 'NORMALIZE'
  | 'MAP'
  | 'RESOLVE'
  | 'VALIDATE'
  | 'REVIEW'
  | 'COMMIT'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'ARCHIVE'
  | 'APPROVE'
  | 'REJECT'
  | 'ESCALATE'
  | 'CANCEL'
  | 'COMPLETE'
  | 'SNAPSHOT'
  | 'RECONCILE';

// ==========================================
// 5. VERSION & CONCURRENCY CONTRACTS
// ==========================================

export interface VersionedEntity {
  version: number;
  updatedAt: Timestamp | Date;
  updatedBy: string;
}

export interface ConcurrencyContext {
  expectedVersion: number;
}

// ==========================================
// 6. IDEMPOTENCY CONTRACTS
// ==========================================

export interface IdempotencyContext {
  operationId: string;
  idempotencyKey: string;
  clientTimestamp: number;
}

// ==========================================
// 7. CANONICAL SHARED ERROR CONTRACT
// ==========================================

export type DomainErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'PROJECT_SCOPE_ERROR'
  | 'CONFLICT'
  | 'VERSION_CONFLICT'
  | 'DUPLICATE_OPERATION'
  | 'INVALID_STATE_TRANSITION'
  | 'IMMUTABLE_RECORD'
  | 'IMPORT_REVIEW_REQUIRED'
  | 'STALE_DATA'
  | 'OFFLINE_REPLAY_REJECTED'
  | 'DEPENDENCY_FAILURE'
  | 'PERSISTENCE_FAILURE'
  | 'AUTHENTICATION_REQUIRED'
  | 'ACCOUNT_NOT_ACTIVE'
  | 'ROLE_NOT_PERMITTED'
  | 'PROJECT_MEMBERSHIP_REQUIRED'
  | 'RECORD_SCOPE_DENIED'
  | 'CROSS_PROJECT_ACCESS_DENIED';

export interface DomainError extends Error {
  code: DomainErrorCode;
  details?: Record<string, unknown>;
  retryable: boolean;
}

// ==========================================
// 8. 17 CANONICAL ENTITY CONTRACTS
// ==========================================

export interface CanonicalProject extends VersionedEntity {
  id: string;
  name: string;
  code: string;
  state: ProjectState;
  clientName: string;
}

export interface CanonicalCarrier extends VersionedEntity {
  id: string;
  name: string;
  commercialRecord: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CanonicalDriver extends VersionedEntity {
  id: string;
  fullName: string;
  iqamaNumber: string; // Identity attribute, NOT canonical ID
  licenseNumber: string;
  phone: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface CanonicalTruck extends VersionedEntity {
  id: string;
  plateNumber: string;
  truckType: string;
  capacityTon: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

export interface CanonicalMaterial extends VersionedEntity {
  id: string;
  name: string;
  code: string;
  unit: string;
}

export interface CanonicalProjectRoster extends VersionedEntity {
  id: string;
  projectId: string;
  carrierId: string;
  driverId: string;
  truckId: string;
  materialId: string;
  state: ProjectRosterState;
}

export interface CanonicalPricingRule extends VersionedEntity {
  id: string;
  projectId: string;
  materialId: string;
  ratePerUnit: number;
  effectiveFrom: Timestamp | Date;
  effectiveTo: Timestamp | Date;
  state: PricingRuleState;
}

export interface CanonicalPricingSnapshot {
  id: string;
  pricingRuleId: string;
  projectId: string;
  materialId: string;
  ratePerUnit: number;
  capturedAt: Timestamp | Date;
  immutabilityHash: string;
}

export interface CanonicalTrip extends VersionedEntity {
  id: string;
  projectId: string;
  tripNumber: string;
  rosterId: string;
  pricingSnapshotId: string;
  state: TripState;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
}

export interface CanonicalTripSnapshot {
  id: string;
  tripId: string;
  projectId: string;
  payloadSnapshot: string; // JSON stringified snapshot
  capturedAt: Timestamp | Date;
  immutabilityHash: string;
}

export interface CanonicalException extends VersionedEntity {
  id: string;
  projectId: string;
  tripId?: string;
  type: string;
  description: string;
  state: ExceptionState;
  raisedBy: string;
}

export interface CanonicalUser extends VersionedEntity {
  id: string;
  email: string;
  displayName: string;
  accountStatus: AccountStatus;
  globalRole?: CanonicalRole;
}

export interface CanonicalRoleEntity {
  id: CanonicalRole;
  name: string;
  description: string;
  allowedDomains: string[];
}

export interface CanonicalProjectMembership {
  id: string;
  userId: string;
  projectId: string;
  role: CanonicalRole;
  state: MembershipState;
}

export interface CanonicalImportOperation extends VersionedEntity {
  id: string;
  sourceType: string;
  state: ImportOperationState;
  totalRows: number;
  validRows: number;
  errorRows: number;
  committed: boolean;
}

export interface CanonicalStorageProfile {
  id: string;
  userId: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'CONFLICT';
  lastSyncedAt: Timestamp | Date;
}

export interface CanonicalAuditLog {
  id: string;
  timestamp: Timestamp | Date;
  actorId: string;
  action: string;
  targetEntity: string;
  targetId: string;
  projectId?: string;
  changesSummary: string;
  immutabilityHash: string;
}

// ==========================================
// 9. SERVICE BOUNDARY INTERFACES
// ==========================================

export interface IProjectService {
  getProject(projectId: string, auth: AuthorizationContext): Promise<CanonicalProject>;
  listProjects(auth: AuthorizationContext): Promise<CanonicalProject[]>;
}

export interface IProjectRosterService {
  getRoster(rosterId: string, auth: AuthorizationContext): Promise<CanonicalProjectRoster>;
  assignToRoster(data: Partial<CanonicalProjectRoster>, auth: AuthorizationContext, idempotency: IdempotencyContext): Promise<CanonicalProjectRoster>;
}

export interface IDriverTruckIntakeService {
  intakeProjectDriver(driverData: Partial<CanonicalDriver>, projectId: string, auth: AuthorizationContext): Promise<CanonicalDriver>;
  intakeProjectTruck(truckData: Partial<CanonicalTruck>, projectId: string, auth: AuthorizationContext): Promise<CanonicalTruck>;
}

export interface IPricingService {
  resolveApplicablePricing(projectId: string, materialId: string, timestamp: Date, auth: AuthorizationContext): Promise<CanonicalPricingRule>;
}

export interface ITripService {
  getTrip(tripId: string, auth: AuthorizationContext): Promise<CanonicalTrip>;
  transitionTripState(tripId: string, targetState: TripState, auth: AuthorizationContext, concurrency: ConcurrencyContext): Promise<CanonicalTrip>;
  // Field Operations owned by tripService
  recordLoading(tripId: string, data: { grossWeight: number }, auth: AuthorizationContext): Promise<CanonicalTrip>;
  recordWeighbridge(tripId: string, data: { tareWeight: number; netWeight: number }, auth: AuthorizationContext): Promise<CanonicalTrip>;
  recordUnloading(tripId: string, auth: AuthorizationContext): Promise<CanonicalTrip>;
}

export interface IExceptionService {
  raiseException(data: Partial<CanonicalException>, auth: AuthorizationContext): Promise<CanonicalException>;
  resolveException(exceptionId: string, resolutionNotes: string, auth: AuthorizationContext): Promise<CanonicalException>;
}

export interface IImportService {
  processImportStage(importId: string, targetState: ImportOperationState, auth: AuthorizationContext): Promise<CanonicalImportOperation>;
}

export interface IStorageService {
  syncOfflineOutbox(auth: AuthorizationContext): Promise<void>;
  reconcileCache(projectId: string): Promise<void>;
}

export interface IAuditService {
  logAuditEvent(event: Omit<CanonicalAuditLog, 'id' | 'timestamp' | 'immutabilityHash'>): Promise<void>;
}

export interface ISecurityService {
  evaluatePermission(auth: AuthorizationContext, operation: DomainOperation, entity: string, projectId?: string, entityState?: string): PermissionDecision;
}
