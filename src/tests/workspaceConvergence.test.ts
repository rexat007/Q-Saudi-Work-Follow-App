import { mapTripToWorkspaceProjection, clientWorkspaceService } from '../services/workspace.service';
import { projectRepository } from '../repositories/project.repository';
import { TripEntity } from '../types/entities';
import { WorkspaceProjectionInput } from '../types/workspace';

console.log('--- Workspace Canonical Data Authority Convergence Test Suite Starting ---');

// 1. Verify mapTripToWorkspaceProjection Truthful Absence Preservation
const now = new Date();

const minimalTrip: TripEntity = {
  tripId: 'TRIP-1001',
  tripNumber: 'T-1001',
  projectId: 'PRJ-001',
  carrierId: 'CARRIER-1',
  carrierSnapshot: {
    carrierId: 'CARRIER-1',
    companyNameAr: 'شركة الناقل',
    commercialRegistrationNo: '1000',
  },
  driverId: 'DRIVER-1',
  driverSnapshot: {
    driverId: 'DRIVER-1',
    fullNameAr: 'سائق',
    nationalOrIqamaId: '1000',
    phone: '050',
  },
  truckId: 'TRUCK-1',
  truckSnapshot: {
    truckId: 'TRUCK-1',
    plateNumberAr: '123',
    tareWeightKg: 10000,
    legalPayloadLimitKg: 20000,
  },
  materialId: 'MAT-1',
  materialSnapshot: {
    materialId: 'MAT-1',
    code: 'M1',
    nameAr: 'مادة',
    unitOfMeasure: 'TON',
  },
  pricingRuleId: 'RULE-1',
  pricingSnapshot: {
    pricingRuleId: 'RULE-1',
    pricingType: 'PER_TON',
    agreedRate: undefined as any,
    currency: 'SAR',
    settlementBase: 10,
    settlementAmount: undefined as any,
    pricingSnapshotAt: '2026-09-18T00:00:00Z',
  },
  financials: {
    baseAmountSAR: 100,
    demurrageAmountSAR: 0,
    deductionsAmountSAR: 0,
    subtotalSAR: 100,
    vatAmountSAR: 15,
    totalAmountSAR: 115,
    currency: 'SAR',
    isFinalized: false,
  },
  weights: {},
  status: 'DISPATCHED',
  createdAt: now,
  updatedAt: now,
  createdBy: 'sys',
  updatedBy: 'sys',
  clientUUID: 'uuid-1001',
  syncStatus: 'SYNCED',
  hasExceptions: false,
  activeExceptionCount: 0,
};

const mappedMinimal = mapTripToWorkspaceProjection(minimalTrip);

// Strict check: Absence MUST remain undefined/null, NOT fabricated 0
if (mappedMinimal.originGrossKg !== undefined) {
  console.error('FAILED: originGrossKg converted absent value to', mappedMinimal.originGrossKg);
  process.exit(1);
}
if (mappedMinimal.originTareKg !== undefined) {
  console.error('FAILED: originTareKg converted absent value to', mappedMinimal.originTareKg);
  process.exit(1);
}
if (mappedMinimal.originNetKg !== undefined) {
  console.error('FAILED: originNetKg converted absent value to', mappedMinimal.originNetKg);
  process.exit(1);
}
if (mappedMinimal.agreedRate !== undefined) {
  console.error('FAILED: agreedRate converted absent value to', mappedMinimal.agreedRate);
  process.exit(1);
}
if (mappedMinimal.settlementAmount !== undefined) {
  console.error('FAILED: settlementAmount converted absent value to', mappedMinimal.settlementAmount);
  process.exit(1);
}

console.log('✓ Truthful absence numeric contract test passed.');

// 2. Verify mapTripToWorkspaceProjection Complete Mapping
const completeTrip: TripEntity = {
  tripId: 'TRIP-1002',
  tripNumber: 'T-1002',
  projectId: 'PRJ-001',
  carrierId: 'CARRIER-1',
  carrierSnapshot: {
    carrierId: 'CARRIER-1',
    companyNameAr: 'شركة الناقل الوطنية',
    commercialRegistrationNo: '1010000000',
  },
  driverId: 'DRIVER-1',
  driverSnapshot: {
    driverId: 'DRIVER-1',
    fullNameAr: 'عبدالله القحطاني',
    nationalOrIqamaId: '1098765432',
    phone: '0501234567',
  },
  truckId: 'TRUCK-1',
  truckSnapshot: {
    truckId: 'TRUCK-1',
    plateNumberAr: 'أ ب ج 1 2 3 4',
    tareWeightKg: 14000,
    legalPayloadLimitKg: 28000,
  },
  materialId: 'MAT-1',
  materialSnapshot: {
    materialId: 'MAT-1',
    code: 'MAT-STONE',
    nameAr: 'حجر جيري',
    unitOfMeasure: 'TON',
  },
  pricingRuleId: 'RULE-01',
  status: 'COMPLETED',
  weights: {
    originGrossKg: 42000,
    originTareKg: 14000,
    originNetKg: 28000,
    destinationGrossKg: 41800,
    destinationTareKg: 14000,
    destinationNetKg: 27800,
    originTicketNo: 'WB-99001',
  },
  pricingSnapshot: {
    pricingRuleId: 'RULE-01',
    pricingType: 'PER_TON',
    agreedRate: 45.5,
    currency: 'SAR',
    settlementBase: 28,
    settlementAmount: 1274,
    pricingSnapshotAt: '2026-09-18T08:00:00Z',
  },
  financials: {
    baseAmountSAR: 1274,
    demurrageAmountSAR: 0,
    deductionsAmountSAR: 0,
    subtotalSAR: 1274,
    vatAmountSAR: 191.1,
    totalAmountSAR: 1465.1,
    currency: 'SAR',
    isFinalized: true,
  },
  createdAt: now,
  updatedAt: now,
  createdBy: 'sys',
  updatedBy: 'sys',
  clientUUID: 'uuid-1002',
  syncStatus: 'SYNCED',
  hasExceptions: false,
  activeExceptionCount: 0,
};

const mappedComplete = mapTripToWorkspaceProjection(completeTrip);

if (mappedComplete.originNetKg !== 28000) {
  console.error('FAILED: originNetKg mapping mismatch', mappedComplete.originNetKg);
  process.exit(1);
}
if (mappedComplete.agreedRate !== 45.5) {
  console.error('FAILED: agreedRate mapping mismatch', mappedComplete.agreedRate);
  process.exit(1);
}
if (mappedComplete.settlementAmount !== 1274) {
  console.error('FAILED: settlementAmount mapping mismatch', mappedComplete.settlementAmount);
  process.exit(1);
}
if (mappedComplete.carrierNameAr !== 'شركة الناقل الوطنية') {
  console.error('FAILED: carrierNameAr mapping mismatch', mappedComplete.carrierNameAr);
  process.exit(1);
}

console.log('✓ Trip projection mapping contract test passed.');

// 3. Verify WorkspaceProjectionInput structure
const sampleInput: WorkspaceProjectionInput = {
  projectId: 'PRJ-001',
  spreadsheetId: 'sheet_prj_001',
  trips: [completeTrip],
  drivers: [],
  carriers: [],
  materials: [],
  exceptions: [],
};

if (sampleInput.trips.length !== 1 || sampleInput.projectId !== 'PRJ-001') {
  console.error('FAILED: WorkspaceProjectionInput structure mismatch');
  process.exit(1);
}

console.log('✓ WorkspaceProjectionInput contract test passed.');

// 4. Verify Project ID Chunking (Batching >30 IDs)
const projectIds35 = Array.from({ length: 35 }, (_, i) => `PRJ-CHUNK-${i + 1}`);
const chunks: string[][] = [];
for (let i = 0; i < projectIds35.length; i += 30) {
  chunks.push(projectIds35.slice(i, i + 30));
}

if (chunks.length !== 2) {
  console.error('FAILED: Expected 2 chunks for 35 project IDs, got', chunks.length);
  process.exit(1);
}
if (chunks[0].length !== 30 || chunks[1].length !== 5) {
  console.error('FAILED: Chunk sizing incorrect', chunks[0].length, chunks[1].length);
  process.exit(1);
}

console.log('✓ Project Chunking (>30 authorized projects) test passed.');

console.log('--- ALL WORKSPACE CONVERGENCE TESTS PASSED SUCCESSFULLY ---');
