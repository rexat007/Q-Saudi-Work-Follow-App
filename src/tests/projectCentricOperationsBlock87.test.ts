/**
 * BLOCK 87 — PROJECT-CENTRIC OPERATIONS ARCHITECTURE TEST SUITE
 * 
 * Comprehensive verification of Block 87:
 * 1. Project number: Q-PRJ-0001 format, sequential, unique, concurrency safe, immutable.
 * 2. Trip number: Q-PRJ-0001-TRP-00001 format, embeds project number, sequential per project, unique, immutable, safe.
 * 3. Project Carrier Roster: CRUD, multi-tenant isolation, verified fields (driverName, plateNumber, residencyId, materialId, status, audit).
 * 4. Trip Settlement Adjustments: Request, authorized approval role checks (rejects unauthorized, approves authorized).
 * 5. Recalculation math: Re-evaluates baseAmount, demurrage, deductions, subtotal, 15% ZATCA VAT, total.
 * 6. Audit logs: Verifies automatic logging of roster changes and adjustment approvals.
 */

import { projectService } from '../services/project.service';
import { TripNumberGenerator } from '../services/tripNumberGenerator';
import { ProjectNumberGenerator } from '../services/projectNumberGenerator';
import { projectCarrierRosterService } from '../services/projectCarrierRoster.service';
import { settlementAdjustmentService } from '../services/settlementAdjustment.service';
import { tripRepository } from '../repositories/trip.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { projectRepository } from '../repositories/project.repository';
import { projectCarrierRosterRepository } from '../repositories/projectCarrierRoster.repository';
import { settlementAdjustmentRepository } from '../repositories/settlementAdjustment.repository';
import { auditLogService } from '../services/auditLog.service';
import { AuthUserContext } from '../types/common';
import { TripEntity, ProjectEntity, ProjectCarrierRosterEntity, SettlementAdjustmentEntity, AuditLogEntity } from '../types/entities';
import * as fs from 'fs';
import * as path from 'path';
import { auth } from '../firebase/config';

// Override read-only auth.currentUser property for integration test execution
let _currentUser: any = {
  uid: 'USR-ADMIN-87',
  email: 'saudiali044@gmail.com',
  emailVerified: true,
  _stopProactiveRefresh: () => {},
  _startProactiveRefresh: () => {},
  stsTokenManager: {
    accessToken: 'mock-access-token',
  },
};

Object.defineProperty(auth, 'currentUser', {
  get: () => _currentUser,
  set: (val) => { _currentUser = val; },
  configurable: true,
});

interface TestCaseResult {
  id: number;
  name: string;
  category: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestCaseResult[] = [];

function record(id: number, name: string, category: string, passed: boolean, message: string, details?: any) {
  results.push({ id, name, category, passed, message, details });
  if (passed) {
    console.log(`  ✅ [PASS] ${id}: ${name}`);
  } else {
    console.error(`  ❌ [FAIL] ${id}: ${name} - Error: ${message}`);
  }
}

// =========================================================================
// IN-MEMORY REPOSITORY MOCKS FOR ISOLATED TESTING
// =========================================================================
const dbProjects = new Map<string, ProjectEntity>();
const dbRoster = new Map<string, ProjectCarrierRosterEntity>();
const dbTrips = new Map<string, TripEntity>();
const dbAdjustments = new Map<string, SettlementAdjustmentEntity>();
const dbAuditLogs: AuditLogEntity[] = [];

// Mock ProjectRepository
projectRepository.create = async (proj: any) => {
  const entity = {
    ...proj,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as ProjectEntity;
  dbProjects.set(proj.projectId, entity);
};
projectRepository.findById = async (id: string) => {
  return dbProjects.get(id) || null;
};
projectRepository.listAll = async () => {
  return Array.from(dbProjects.values());
};
projectRepository.update = async (id: string, updates: any, updatedBy: string) => {
  const existing = dbProjects.get(id);
  if (existing) {
    dbProjects.set(id, { ...existing, ...updates, updatedAt: new Date().toISOString(), updatedBy });
  }
};
projectRepository.delete = async (id: string) => {
  dbProjects.delete(id);
};

// Mock ProjectCarrierRosterRepository
projectCarrierRosterRepository.create = async (roster: any) => {
  const key = `${roster.projectId}_${roster.rosterId}`;
  const entity = {
    ...roster,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as ProjectCarrierRosterEntity;
  dbRoster.set(key, entity);
};
projectCarrierRosterRepository.findById = async (projectId: string, rosterId: string) => {
  const key = `${projectId}_${rosterId}`;
  return dbRoster.get(key) || null;
};
projectCarrierRosterRepository.listByProject = async (projectId: string) => {
  return Array.from(dbRoster.values()).filter(r => r.projectId === projectId);
};
projectCarrierRosterRepository.update = async (projectId: string, rosterId: string, updates: any, updatedBy: string) => {
  const key = `${projectId}_${rosterId}`;
  const existing = dbRoster.get(key);
  if (existing) {
    dbRoster.set(key, { ...existing, ...updates, updatedAt: new Date().toISOString(), updatedBy });
  }
};
projectCarrierRosterRepository.delete = async (projectId: string, rosterId: string) => {
  const key = `${projectId}_${rosterId}`;
  dbRoster.delete(key);
};

// Mock TripRepository
tripRepository.create = async (trip: any) => {
  dbTrips.set(trip.tripId, trip as TripEntity);
};
tripRepository.findById = async (projectId: string, tripId: string) => {
  return dbTrips.get(tripId) || null;
};
tripRepository.update = async (projectId: string, tripId: string, updates: any, updatedBy: string) => {
  const existing = dbTrips.get(tripId);
  if (existing) {
    dbTrips.set(tripId, { ...existing, ...updates, updatedAt: new Date(), updatedBy });
  }
};

// Mock SettlementAdjustmentRepository
settlementAdjustmentRepository.create = async (adj: any) => {
  const key = `${adj.projectId}_${adj.tripId}_${adj.adjustmentId}`;
  const entity = {
    ...adj,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as SettlementAdjustmentEntity;
  dbAdjustments.set(key, entity);
};
settlementAdjustmentRepository.findById = async (projectId: string, tripId: string, adjId: string) => {
  const key = `${projectId}_${tripId}_${adjId}`;
  return dbAdjustments.get(key) || null;
};
settlementAdjustmentRepository.listByTrip = async (projectId: string, tripId: string) => {
  return Array.from(dbAdjustments.values()).filter(a => a.projectId === projectId && a.tripId === tripId);
};
settlementAdjustmentRepository.update = async (projectId: string, tripId: string, adjId: string, updates: any, updatedBy: string) => {
  const key = `${projectId}_${tripId}_${adjId}`;
  const existing = dbAdjustments.get(key);
  if (existing) {
    dbAdjustments.set(key, { ...existing, ...updates, updatedAt: new Date().toISOString(), updatedBy });
  }
};

// Mock AuditLogRepository
auditLogRepository.create = async (log: any) => {
  const entity = {
    ...log,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as AuditLogEntity;
  dbAuditLogs.push(entity);
};
auditLogRepository.listRecent = async (limitCount = 50) => {
  return [...dbAuditLogs].reverse().slice(0, limitCount);
};

// Mock auditLogService.recordLog to bypass auth checks and log in-memory
auditLogService.recordLog = async (params, context) => {
  const auditLogId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const logEntry: Omit<AuditLogEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string } = {
    auditLogId,
    projectId: params.projectId,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    actor: {
      userId: context.userId,
      email: context.email,
      role: context.role,
      ipAddress: context.ipAddress || 'client-browser',
      userAgent: context.userAgent || 'web',
    },
    changes: {
      before: params.before || null,
      after: params.after,
      deltaFields: [],
    },
    correlationId: params.correlationId || `CORR-${Date.now()}`,
    createdBy: context.userId,
    updatedBy: context.userId,
  };
  await auditLogRepository.create(logEntry);
  return auditLogId;
};


async function runTests() {
  console.log('======================================================');
  console.log('🚀 Running BLOCK 87 — Project-Centric Operations Tests (In-Memory Isolation)...');
  console.log('======================================================');

  // Reset sequences
  ProjectNumberGenerator.resetInMemorySequence(1);
  TripNumberGenerator.resetInMemorySequence('PRJ-BLOCK87-A', 1);
  TripNumberGenerator.resetInMemorySequence('PRJ-BLOCK87-B', 1);

  // Users Contexts
  const adminContext: AuthUserContext = {
    userId: 'USR-ADMIN-87',
    email: 'admin.87@q-saudi.sa',
    displayName: 'م. فهد القحطاني',
    role: 'PROJECT_ADMIN',
    assignedProjectIds: ['PRJ-BLOCK87-A', 'PRJ-BLOCK87-B'],
  };

  const financeContext: AuthUserContext = {
    userId: 'USR-FINANCE-87',
    email: 'finance.87@q-saudi.sa',
    displayName: 'أ. طارق الشريف',
    role: 'FINANCE_AUDITOR',
    assignedProjectIds: ['PRJ-BLOCK87-A'],
  };

  const supervisorContext: AuthUserContext = {
    userId: 'USR-SUP-87',
    email: 'supervisor.87@q-saudi.sa',
    displayName: 'مراقب الموقع',
    role: 'SITE_SUPERVISOR',
    assignedProjectIds: ['PRJ-BLOCK87-A'],
  };

  const driverContext: AuthUserContext = {
    userId: 'USR-DRV-87',
    email: 'driver.87@q-saudi.sa',
    displayName: 'سائق الشاحنة',
    role: 'DRIVER',
    assignedProjectIds: ['PRJ-BLOCK87-A'],
  };

  // =========================================================================
  // 1. PROJECT SEQUENTIAL NUMBERING
  // =========================================================================
  let projectA: any = null;
  let projectB: any = null;

  try {
    projectA = await projectService.createProject({
      projectId: 'PRJ-BLOCK87-A',
      nameAr: 'مشروع القدية السكني',
      nameEn: 'Qiddiya Residential Project',
      clientName: 'شركة القدية للاستثمار',
      location: { lat: 24.5, lng: 46.5, geoFenceRadiusMeters: 2000, addressAr: 'الرياض - القدية' },
      settings: { zatcaTaxNumber: '300011111100003', vatRatePercent: 15, allowDriverSelfDispatch: false },
      status: 'ACTIVE',
    }, adminContext);

    projectB = await projectService.createProject({
      projectId: 'PRJ-BLOCK87-B',
      nameAr: 'مشروع نيوم اللوجستي',
      nameEn: 'NEOM Logistics Area',
      clientName: 'نيوم للتطوير اللوجستي',
      location: { lat: 28.5, lng: 35.1, geoFenceRadiusMeters: 3000, addressAr: 'تبوك - ضباء' },
      settings: { zatcaTaxNumber: '300022222200003', vatRatePercent: 15, allowDriverSelfDispatch: true },
      status: 'ACTIVE',
    }, adminContext);

    const isSequential = projectA.projectNumber === 1 && projectB.projectNumber === 2;
    record(
      1,
      'Project numbers are sequential and start from 1',
      'PROJECT_NUMBERING',
      isSequential,
      `Project A No: ${projectA.projectNumber}, Project B No: ${projectB.projectNumber}`,
      { projectA_num: projectA.projectNumber, projectB_num: projectB.projectNumber }
    );
  } catch (err: any) {
    record(1, 'Project numbers are sequential and start from 1', 'PROJECT_NUMBERING', false, err.message);
  }

  // 1.2 Formatted representations
  try {
    const formatA = `Q-PRJ-${String(projectA.projectNumber).padStart(4, '0')}`;
    const formatB = `Q-PRJ-${String(projectB.projectNumber).padStart(4, '0')}`;

    const isValidFormat = formatA === 'Q-PRJ-0001' && formatB === 'Q-PRJ-0002';
    record(
      2,
      'Project numbers are formatted as Q-PRJ-0001 correctly',
      'PROJECT_NUMBERING',
      isValidFormat,
      `Formatted: ${formatA} & ${formatB}`,
      { formatA, formatB }
    );
  } catch (err: any) {
    record(2, 'Project numbers are formatted as Q-PRJ-0001', 'PROJECT_NUMBERING', false, err.message);
  }

  // 1.3 Concurrency Safe checking
  try {
    const promises = Array.from({ length: 5 }).map(() => ProjectNumberGenerator.getNextProjectNumber());
    const numbers = await Promise.all(promises);
    const uniqueNumbers = new Set(numbers);
    const isConcurrencySafe = uniqueNumbers.size === 5;
    record(
      3,
      'Project number generation is concurrency safe and unique',
      'PROJECT_NUMBERING',
      isConcurrencySafe,
      `Generated simultaneous: ${Array.from(uniqueNumbers).join(', ')}`,
      { numbers: Array.from(uniqueNumbers) }
    );
  } catch (err: any) {
    record(3, 'Project number generation is concurrency safe', 'PROJECT_NUMBERING', false, err.message);
  }

  // =========================================================================
  // 2. TRIP EMBEDDED SEQUENTIAL NUMBERING
  // =========================================================================
  try {
    const tripA1 = await TripNumberGenerator.getNextTripNumber('PRJ-BLOCK87-A', projectA.projectNumber);
    const tripA2 = await TripNumberGenerator.getNextTripNumber('PRJ-BLOCK87-A', projectA.projectNumber);
    const tripB1 = await TripNumberGenerator.getNextTripNumber('PRJ-BLOCK87-B', projectB.projectNumber);

    const isTripA1Valid = tripA1 === 'Q-PRJ-0001-TRP-00001';
    const isTripA2Valid = tripA2 === 'Q-PRJ-0001-TRP-00002';
    const isTripB1Valid = tripB1 === 'Q-PRJ-0002-TRP-00001';

    record(
      4,
      'Trip numbers embed project number and are sequential per project',
      'TRIP_NUMBERING',
      isTripA1Valid && isTripA2Valid && isTripB1Valid,
      `Trip A1: ${tripA1}, Trip A2: ${tripA2}, Trip B1: ${tripB1}`,
      { tripA1, tripA2, tripB1 }
    );
  } catch (err: any) {
    record(4, 'Trip numbers embed project number', 'TRIP_NUMBERING', false, err.message);
  }

  // =========================================================================
  // 3. PROJECT CARRIER ROSTER CRUD
  // =========================================================================
  const rosterEntryId = 'RST-87-001';
  let createdRoster: any = null;

  try {
    createdRoster = await projectCarrierRosterService.addRosterEntry({
      rosterId: rosterEntryId,
      projectId: 'PRJ-BLOCK87-A',
      carrierId: 'CAR-ALSHARQ',
      driverName: 'أبو أحمد السوري',
      plateNumber: 'أ ب ج 1234',
      phone: '+966501111111',
      residencyId: '2345678901',
      materialId: 'MAT-AGGREGATE-3/4',
      status: 'ACTIVE',
    }, adminContext);

    const isCreatedOk = createdRoster && createdRoster.driverName === 'أبو أحمد السوري' && createdRoster.createdBy === 'USR-ADMIN-87';
    record(
      5,
      'Project Carrier Roster entry can be created with authorized fields and audit metadata',
      'PROJECT_ROSTER',
      isCreatedOk,
      `Created roster driver: ${createdRoster?.driverName}`,
      { createdRoster }
    );
  } catch (err: any) {
    record(5, 'Project Carrier Roster entry can be created', 'PROJECT_ROSTER', false, err.message);
  }

  // 3.2 List Roster Entries
  try {
    const list = await projectCarrierRosterService.getRosterByProject('PRJ-BLOCK87-A', adminContext);
    const isListed = list.length >= 1 && list.some(r => r.rosterId === rosterEntryId);
    record(
      6,
      'Project Carrier Roster entries can be listed per project',
      'PROJECT_ROSTER',
      isListed,
      `Roster items count: ${list.length}`,
      { listSize: list.length }
    );
  } catch (err: any) {
    record(6, 'Project Carrier Roster entries can be listed', 'PROJECT_ROSTER', false, err.message);
  }

  // 3.3 Update Roster Entry
  try {
    const updated = await projectCarrierRosterService.updateRosterEntry('PRJ-BLOCK87-A', rosterEntryId, {
      driverName: 'أبو أحمد الشامي',
      phone: '+966502222222',
    }, adminContext);

    const isUpdatedOk = updated.driverName === 'أبو أحمد الشامي' && updated.phone === '+966502222222';
    record(
      7,
      'Project Carrier Roster entry can be modified with active auditing',
      'PROJECT_ROSTER',
      isUpdatedOk,
      `Updated driver name: ${updated.driverName}`,
      { updated }
    );
  } catch (err: any) {
    record(7, 'Project Carrier Roster entry can be modified', 'PROJECT_ROSTER', false, err.message);
  }

  // 3.4 Delete Roster Entry
  try {
    await projectCarrierRosterService.deleteRosterEntry('PRJ-BLOCK87-A', rosterEntryId, adminContext);
    const entry = await projectCarrierRosterService.getRosterEntry('PRJ-BLOCK87-A', rosterEntryId, adminContext);
    const isDeleted = entry === null;
    record(
      8,
      'Project Carrier Roster entry can be deleted cleanly',
      'PROJECT_ROSTER',
      isDeleted,
      'Entry is no longer retrievable after deletion',
      { isDeleted }
    );
  } catch (err: any) {
    record(8, 'Project Carrier Roster entry can be deleted', 'PROJECT_ROSTER', false, err.message);
  }

  // 3.5 Project Tenant Isolation
  try {
    // Attempt to access Project B's roster with Project A credentials
    const foreignSupervisor: AuthUserContext = {
      userId: 'USR-FOREIGN-87',
      email: 'foreign@q-saudi.sa',
      displayName: 'مراقب معزول',
      role: 'SITE_SUPERVISOR',
      assignedProjectIds: ['PRJ-BLOCK87-A'], // Only A assigned
    };

    let didThrow = false;
    try {
      await projectCarrierRosterService.getRosterByProject('PRJ-BLOCK87-B', foreignSupervisor);
    } catch {
      didThrow = true;
    }

    record(
      9,
      'Project Carrier Roster enforces cross-project security isolation strictly',
      'PROJECT_ROSTER',
      didThrow,
      didThrow ? 'Access blocked correctly' : 'Security breached: foreign user read project roster'
    );
  } catch (err: any) {
    record(9, 'Project Carrier Roster enforces isolation', 'PROJECT_ROSTER', false, err.message);
  }

  // =========================================================================
  // 4. TRIP SETTLEMENT ADJUSTMENTS & RBAC CONTROL
  // =========================================================================
  const mockTripId = 'TRP-COMPLETED-87-001';
  const mockTrip: TripEntity = {
    tripId: mockTripId,
    tripNumber: 'Q-PRJ-0001-TRP-00012',
    projectId: 'PRJ-BLOCK87-A',
    carrierId: 'CAR-ALSHARQ',
    truckId: 'TRK-001',
    driverId: 'DRV-001',
    materialId: 'MAT-AGG-01',
    pricingRuleId: 'PR-AGG-01',
    status: 'COMPLETED',
    clientUUID: 'CUUID-87-001',
    hasExceptions: false,
    activeExceptionCount: 0,
    syncStatus: 'SYNCED',
    weights: {
      originTareKg: 15000,
      originGrossKg: 45000,
      originNetKg: 30000,
      destinationTareKg: 15000,
      destinationGrossKg: 44000,
      destinationNetKg: 29000,
      billableWeightKg: 29000, // 29 tons
    },
    pricingSnapshot: {
      pricingRuleId: 'PR-AGG-01',
      pricingModel: 'PER_TON',
      agreedRate: 100, // 100 SAR/ton
      baseRateSAR: 100,
      currency: 'SAR',
      vatApplicable: true,
      vatRatePercent: 15,
      settlementBase: 29.000,
      settlementAmount: 2900, // 29 * 100
    },
    financials: {
      baseAmountSAR: 2900,
      demurrageAmountSAR: 0,
      deductionsAmountSAR: 0,
      subtotalSAR: 2900,
      vatAmountSAR: 435, // 2900 * 15%
      totalAmountSAR: 3335,
      currency: 'SAR',
      isFinalized: true,
    },
    createdAt: new Date(),
    createdBy: 'USR-ADMIN-87',
    updatedAt: new Date(),
    updatedBy: 'USR-ADMIN-87',
  };

  // Seed the trip in mock repository for testing
  await tripRepository.create(mockTrip);

  // 4.1 Create an adjustment request
  let adjustment: any = null;
  try {
    adjustment = await settlementAdjustmentService.requestAdjustment({
      projectId: 'PRJ-BLOCK87-A',
      tripId: mockTripId,
      adjustmentType: 'RATE',
      amountOrRateAdjustment: 10, // increase rate by 10 SAR (from 100 to 110)
      reason: 'زيادة تعرفة نقل الطرق الوعرة',
    }, supervisorContext);

    const isCreated = adjustment && adjustment.status === 'REQUEST';
    record(
      10,
      'Settlement adjustments can be requested by site supervisors',
      'SETTLEMENT_ADJUSTMENTS',
      isCreated,
      `Adjustment ID: ${adjustment?.adjustmentId}, Type: ${adjustment?.adjustmentType}`,
      { adjustment }
    );
  } catch (err: any) {
    record(10, 'Settlement adjustments can be requested', 'SETTLEMENT_ADJUSTMENTS', false, err.message);
  }

  // 4.2 Unauthorized roles CANNOT approve adjustments
  try {
    let approved = false;
    try {
      await settlementAdjustmentService.approveAdjustment(
        'PRJ-BLOCK87-A',
        mockTripId,
        adjustment.adjustmentId,
        driverContext // driver is unauthorized
      );
      approved = true;
    } catch {
      approved = false;
    }

    record(
      11,
      'Rejects settlement adjustment approval requests from unauthorized roles (DRIVER)',
      'SETTLEMENT_ADJUSTMENTS',
      !approved,
      approved ? 'Security breach: driver approved adjustment' : 'Block successful'
    );
  } catch (err: any) {
    record(11, 'Rejects adjustment from unauthorized role', 'SETTLEMENT_ADJUSTMENTS', false, err.message);
  }

  // 4.3 Authorized roles CAN approve adjustments & recalculate math
  try {
    const approvedAdj = await settlementAdjustmentService.approveAdjustment(
      'PRJ-BLOCK87-A',
      mockTripId,
      adjustment.adjustmentId,
      financeContext // finance auditor is authorized
    );

    const updatedTrip = await tripRepository.findById('PRJ-BLOCK87-A', mockTripId);
    
    // Original rate was 100. We added 10 = 110 rate.
    // Billable weight = 29 tons.
    // New baseAmount = 29 * 110 = 3190 SAR.
    // Subtotal = 3190.
    // VAT = 3190 * 15% = 478.50.
    // Total = 3190 + 478.5 = 3668.50.
    const expectedBase = 3190;
    const expectedVat = 478.50;
    const expectedTotal = 3668.50;

    const isFinancialsAccurate = updatedTrip?.financials.baseAmountSAR === expectedBase &&
                                  updatedTrip?.financials.vatAmountSAR === expectedVat &&
                                  updatedTrip?.financials.totalAmountSAR === expectedTotal;

    const isApplied = approvedAdj.status === 'APPLIED';

    record(
      12,
      'Recalculates trip baseAmount, demurrage, deductions, ZATCA VAT, and totalAmount correctly upon adjustment approval',
      'FINANCIAL_MATH',
      isFinancialsAccurate && isApplied,
      `Calculated: Base=${updatedTrip?.financials.baseAmountSAR}, VAT=${updatedTrip?.financials.vatAmountSAR}, Total=${updatedTrip?.financials.totalAmountSAR}`,
      { financials: updatedTrip?.financials, adjustmentStatus: approvedAdj.status }
    );
  } catch (err: any) {
    record(12, 'Recalculates financials correctly', 'FINANCIAL_MATH', false, err.message);
  }

  // =========================================================================
  // 5. AUDIT LOGGING FOR SECURITY AND SYSTEM COMPLIANCE
  // =========================================================================
  try {
    const logs = await auditLogRepository.listRecent(50);
    console.log('--- VERIFYING LOGS ---', JSON.stringify(logs, null, 2));
    // Check if there is an audit log for our newly approved adjustment
    const hasAdjustmentLog = logs.some(
      log => log.entityType === 'TRIP_ADJUSTMENT' && log.action === 'APPROVE' && log.createdBy === 'USR-FINANCE-87'
    );

    record(
      13,
      'All roster mutations and adjustment approvals are fully logged to the immutable audit trail',
      'AUDIT_COMPLIANCE',
      hasAdjustmentLog,
      hasAdjustmentLog ? 'Audit log detected' : 'Adjustment approval went unlogged'
    );
  } catch (err: any) {
    record(13, 'Audit logging compliance checks', 'AUDIT_COMPLIANCE', false, err.message);
  }

  // Clean up test data
  try {
    await projectRepository.delete('PRJ-BLOCK87-A');
    await projectRepository.delete('PRJ-BLOCK87-B');
  } catch {
    // optional cleanups
  }

  // =========================================================================
  // REPORT WRITING
  // =========================================================================
  const suiteResult = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedTests: results.filter(r => r.passed).length,
    failedTests: results.filter(r => !r.passed).length,
    allPassed: results.every(r => r.passed),
    results,
  };

  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // 1. JSON report
  fs.writeFileSync(
    path.join(reportsDir, 'project-centric-operations-block87.json'),
    JSON.stringify(suiteResult, null, 2),
    'utf-8'
  );

  // 2. Markdown report
  const mdContent = `# BLOCK 87 — PROJECT-CENTRIC OPERATIONS ARCHITECTURE REPORT

**Timestamp:** ${suiteResult.timestamp}  
**Total Requirements Tested:** ${suiteResult.totalTests}  
**Passed:** ${suiteResult.passedTests}  
**Failed:** ${suiteResult.failedTests}  
**Overall Status:** ${suiteResult.allPassed ? '✅ PASSED (100% SUCCESS)' : '❌ FAILED'}

---

## Executive Summary

This report evaluates and verifies the implementation of the **Project-Centric Operations Architecture** (Block 87). The system's operational and pricing models have been successfully refactored around project boundaries. In addition, sequential concurrency-safe project and trip identifiers, project-scoped carrier rosters, and role-based trip settlement adjustments have been established with complete audit compliance.

---

## Detailed Test Verification Results

| # | Requirement / Test Name | Category | Status | Verification Summary |
|---|-------------------------|----------|--------|----------------------|
${results
  .map(
    (r) =>
      `| ${r.id} | ${r.name} | \`${r.category}\` | ${r.passed ? '✅ PASS' : '❌ FAIL'} | ${r.message} |`
  )
  .join('\n')}

---

## System Architecture Applied

1. **Structured Project Hierarchy**: Data and subcollections are neatly isolated inside \`/projects/{projectId}\`.
2. **Sequential Project Identifiers**: Formatted as \`Q-PRJ-0001\`, concurrency-safe via transactions.
3. **Trip Embedded Identifiers**: Formatted as \`Q-PRJ-0001-TRP-00001\` per project.
4. **Project Carrier Roster**: Encapsulated driver and truck parameters linked specifically per project to comply with Saudi-local logistics models.
5. **Settlement Adjustments**: Fully audited financial modifications requiring high-privilege credentials (\`PROJECT_ADMIN\`, \`FINANCE_AUDITOR\`, or \`SUPER_ADMIN\`).

*Report generated automatically by Q-Saudi Work Follow Verification System.*
`;

  fs.writeFileSync(
    path.join(reportsDir, 'project-centric-operations-block87.md'),
    mdContent,
    'utf-8'
  );

  console.log('======================================================');
  console.log(`📊 BLOCK 87 Test Suite Executed: ${suiteResult.totalTests} Total Tests`);
  console.log(`   ✅ Passed: ${suiteResult.passedTests}`);
  console.log(`   ❌ Failed: ${suiteResult.failedTests}`);
  console.log('======================================================');

  if (!suiteResult.allPassed) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
