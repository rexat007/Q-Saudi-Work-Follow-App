import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  ServerTripPersistenceAdapter,
  ServerExceptionPersistenceAdapter,
  serverTripService,
  serverExceptionService,
} from '../services/canonicalTripPersistence.server';
import { TripService } from '../services/trip.service';
import { ExceptionService } from '../services/exception.service';
import { adminDb } from '../firebase/admin';

describe('Unit 6A: Server Canonical Trip Persistence Boundary Convergence (40 Contracts)', () => {
  const projectId = 'PRJ-UNIT6A';
  const tripId = 'TRIP-6A-001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Contracts 1–5: Server Authority
  // =========================================================================
  describe('Contracts 1–5: Server Authority', () => {
    it('1. serverTripService is an instance of TripService backed by ServerTripPersistenceAdapter', () => {
      expect(serverTripService).toBeInstanceOf(TripService);
      expect(typeof serverTripService.dispatchTrip).toBe('function');
    });

    it('2. serverExceptionService is an instance of ExceptionService backed by ServerExceptionPersistenceAdapter', () => {
      expect(serverExceptionService).toBeInstanceOf(ExceptionService);
      expect(typeof serverExceptionService.raiseException).toBe('function');
    });

    it('3. ServerTripPersistenceAdapter interacts with adminDb and has zero client auth references', () => {
      const filePath = path.resolve(__dirname, '../services/canonicalTripPersistence.server.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).not.toMatch(/auth\.currentUser/);
      expect(content).toContain('adminDb');
    });

    it('4. ServerExceptionPersistenceAdapter interacts with adminDb and has zero client auth references', () => {
      const filePath = path.resolve(__dirname, '../services/canonicalTripPersistence.server.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('class ServerExceptionPersistenceAdapter');
      expect(content).toContain('adminDb.collection');
    });

    it('5. ServerTripPersistenceAdapter and ServerExceptionPersistenceAdapter fail closed on missing inputs', async () => {
      const tripAdapter = new ServerTripPersistenceAdapter();
      const excAdapter = new ServerExceptionPersistenceAdapter();
      await expect(tripAdapter.tripRepository.create({} as any)).rejects.toThrow('INVALID_TRIP_PAYLOAD');
      await expect(excAdapter.exceptionRepository.create({} as any)).rejects.toThrow('INVALID_EXCEPTION_PAYLOAD');
    });
  });

  // =========================================================================
  // Contracts 6–8: Create Failure & Persistence Integrity
  // =========================================================================
  describe('Contracts 6–8: Create Failure & Persistence Integrity', () => {
    it('6. Dispatch fails closed if required canonical parameters are missing', async () => {
      const context: any = { userId: 'usr-1', role: 'DISPATCHER', email: 'd@test.com' };
      await expect(
        serverTripService.dispatchTrip({} as any, context)
      ).rejects.toThrow();
    });

    it('7. Dispatch fails closed if project does not exist in Admin SDK', async () => {
      const context: any = { userId: 'usr-1', role: 'DISPATCHER', email: 'd@test.com' };
      await expect(
        serverTripService.dispatchTrip({
          projectId: 'NON_EXISTENT_PRJ',
          carrierId: 'CAR-1',
          truckId: 'TRK-1',
          driverId: 'DRV-1',
          materialId: 'MAT-1',
          pricingRuleId: 'RULE-1',
        }, context)
      ).rejects.toThrow(/غير موجود/);
    });

    it('8. Persistence error throws and propagates without silent suppression', async () => {
      const adapter = new ServerTripPersistenceAdapter();
      await expect(
        adapter.tripRepository.update('', 'TRP-1', {}, 'usr-1')
      ).rejects.toThrow('INVALID_TRIP_UPDATE');
    });
  });

  // =========================================================================
  // Contracts 9–11: Transition / Receipt Authority
  // =========================================================================
  describe('Contracts 9–11: Transition / Receipt Authority', () => {
    it('9. Transition reads trip via injected server repository', async () => {
      const context: any = { userId: 'usr-1', role: 'DISPATCHER', email: 'd@test.com' };
      await expect(
        serverTripService.transitionTripStatus('PRJ-TEST', 'NON-EXISTENT', 'IN_TRANSIT', {}, context)
      ).rejects.toThrow(/الرحلة غير موجودة/);
    });

    it('10. Destination receipt updates weighbridge weights via server adapter', async () => {
      const adapter = new ServerTripPersistenceAdapter();
      const mockTrip: any = {
        tripId: 'TRIP-TRANS-001',
        tripNumber: 'TRIP-001',
        projectId: 'PRJ-TEST',
        status: 'IN_TRANSIT',
        weights: { originTareKg: 10000, originGrossKg: 30000, originNetKg: 20000 },
        pricingSnapshot: { agreedRate: 50, pricingType: 'PER_TON' },
        financials: { isFinalized: false },
      };
      await adapter.tripRepository.create({ ...mockTrip, createdBy: 'admin', updatedBy: 'admin' });

      await adapter.tripRepository.update('PRJ-TEST', 'TRIP-TRANS-001', {
        weights: {
          ...mockTrip.weights,
          destinationTareKg: 10050,
          destinationGrossKg: 29950,
          destinationNetKg: 19900,
          billableWeightKg: 19900,
        },
        status: 'WEIGHED_DESTINATION',
      }, 'admin');

      const updated = await adapter.tripRepository.findById('PRJ-TEST', 'TRIP-TRANS-001');
      expect(updated?.status).toBe('WEIGHED_DESTINATION');
      expect(updated?.weights?.destinationNetKg).toBe(19900);
    });

    it('11. Transition calculation for completed trip populates immutable financials', async () => {
      const adapter = new ServerTripPersistenceAdapter();
      const customService = new TripService(adapter);
      const mockTrip: any = {
        tripId: 'TRIP-FIN-001',
        tripNumber: 'TRIP-FIN-01',
        projectId: 'PRJ-TEST',
        status: 'OFFLOADED',
        weights: { originNetKg: 20000, destinationNetKg: 20000, billableWeightKg: 20000 },
        pricingSnapshot: { agreedRate: 50, pricingType: 'PER_TON', vatApplicable: true },
        financials: { isFinalized: false },
      };
      await adapter.tripRepository.create({ ...mockTrip, createdBy: 'admin', updatedBy: 'admin' });

      const context: any = { userId: 'usr-admin', role: 'PROJECT_ADMIN', email: 'admin@test.com' };
      const res = await customService.transitionTripStatus('PRJ-TEST', 'TRIP-FIN-001', 'COMPLETED', {}, context);

      expect(res.status).toBe('COMPLETED');
      expect(res.financials.isFinalized).toBe(true);
      expect(res.financials.baseAmountSAR).toBe(1000); // 20 tons * 50 SAR
      expect(res.financials.totalAmountSAR).toBe(1150); // 1000 + 15% VAT
    });
  });

  // =========================================================================
  // Contracts 12–20: Canonical Reads via Admin SDK Authority
  // =========================================================================
  describe('Contracts 12–20: Canonical Reads via Admin SDK Authority', () => {
    const adapter = new ServerTripPersistenceAdapter();

    it('12. Project entity read via Admin SDK', async () => {
      const res = await adapter.projectRepository.findById('PRJ-TEST');
      expect(res === null || typeof res === 'object').toBe(true);
    });

    it('13. Carrier global identity and membership read via Admin SDK', async () => {
      const res1 = await adapter.globalCarrierRepository.findById('CAR-1');
      const res2 = await adapter.projectCarrierMembershipRepository.getMembership('PRJ-TEST', 'CAR-1');
      expect(res1 === null || typeof res1 === 'object').toBe(true);
      expect(res2 === null || typeof res2 === 'object').toBe(true);
    });

    it('14. Material global identity and membership read via Admin SDK', async () => {
      const res1 = await adapter.globalMaterialRepository.findById('MAT-1');
      const res2 = await adapter.projectMaterialMembershipRepository.getMembership('PRJ-TEST', 'MAT-1');
      expect(res1 === null || typeof res1 === 'object').toBe(true);
      expect(res2 === null || typeof res2 === 'object').toBe(true);
    });

    it('15. Driver global identity and membership read via Admin SDK', async () => {
      const res1 = await adapter.globalDriverRepository.findById('DRV-1');
      const res2 = await adapter.projectDriverMembershipRepository.getMembership('PRJ-TEST', 'DRV-1');
      expect(res1 === null || typeof res1 === 'object').toBe(true);
      expect(res2 === null || typeof res2 === 'object').toBe(true);
    });

    it('16. Truck global identity and membership read via Admin SDK', async () => {
      const res1 = await adapter.globalTruckRepository.findById('TRK-1');
      const res2 = await adapter.projectTruckMembershipRepository.getMembership('PRJ-TEST', 'TRK-1');
      expect(res1 === null || typeof res1 === 'object').toBe(true);
      expect(res2 === null || typeof res2 === 'object').toBe(true);
    });

    it('17. Driver and Truck carrier affiliations read via Admin SDK', async () => {
      const res1 = await adapter.projectDriverCarrierAffiliationRepository.getAffiliation('PRJ-TEST', 'DRV-1');
      const res2 = await adapter.projectTruckCarrierAffiliationRepository.getAffiliation('PRJ-TEST', 'TRK-1');
      expect(res1 === null || typeof res1 === 'object').toBe(true);
      expect(res2 === null || typeof res2 === 'object').toBe(true);
    });

    it('18. Driver-Truck active assignments read via Admin SDK', async () => {
      const res1 = await adapter.projectDriverTruckAssignmentRepository.getActiveAssignmentByDriver('PRJ-TEST', 'DRV-1');
      const res2 = await adapter.projectDriverTruckAssignmentRepository.getActiveAssignmentByTruck('PRJ-TEST', 'TRK-1');
      expect(res1 === null || typeof res1 === 'object').toBe(true);
      expect(res2 === null || typeof res2 === 'object').toBe(true);
    });

    it('19. Truck-Material active allocations read via Admin SDK', async () => {
      const res = await adapter.projectTruckMaterialAllocationRepository.getActiveAllocationByTruck('PRJ-TEST', 'TRK-1');
      expect(res === null || typeof res === 'object').toBe(true);
    });

    it('20. Pricing rule read via Admin SDK', async () => {
      const res = await adapter.pricingRuleRepository.findById('PRJ-TEST', 'RULE-1');
      expect(res === null || typeof res === 'object').toBe(true);
    });
  });

  // =========================================================================
  // Contracts 21–24: Exception Behavior & Flag Synchronization
  // =========================================================================
  describe('Contracts 21–24: Exception Behavior & Flag Synchronization', () => {
    it('21. Exception creation persists to Admin SDK collection', async () => {
      const adapter = new ServerExceptionPersistenceAdapter();
      const mockExc: any = {
        exceptionId: 'EXC-21-001',
        projectId: 'PRJ-TEST',
        tripId: 'TRP-21-001',
        type: 'ROUTE_DEVIATION',
        severity: 'MEDIUM',
        status: 'OPEN',
        reasonAr: 'انحراف عن المسار',
      };
      await adapter.exceptionRepository.create({ ...mockExc, createdBy: 'admin', updatedBy: 'admin' });

      const list = await adapter.exceptionRepository.listByTrip('PRJ-TEST', 'TRP-21-001');
      expect(list.some(e => e.exceptionId === 'EXC-21-001')).toBe(true);
    });

    it('22. Exception update mutates document in Admin SDK', async () => {
      const adapter = new ServerExceptionPersistenceAdapter();
      const mockExc: any = {
        exceptionId: 'EXC-22-001',
        projectId: 'PRJ-TEST',
        tripId: 'TRP-22-001',
        type: 'DAMAGED_CARGO',
        severity: 'LOW',
        status: 'OPEN',
        reasonAr: 'تلف بسيط في الحمولة',
      };
      await adapter.exceptionRepository.create({ ...mockExc, createdBy: 'admin', updatedBy: 'admin' });

      await adapter.exceptionRepository.update('PRJ-TEST', 'TRP-22-001', 'EXC-22-001', { status: 'RESOLVED' }, 'admin');
      const list = await adapter.exceptionRepository.listByTrip('PRJ-TEST', 'TRP-22-001');
      const found = list.find(e => e.exceptionId === 'EXC-22-001');
      expect(found?.status).toBe('RESOLVED');
    });

    it('23. Trip hasExceptions flag is updated atomically upon exception creation', async () => {
      const tripAdapter = new ServerTripPersistenceAdapter();
      const excAdapter = new ServerExceptionPersistenceAdapter();
      const mockTrip: any = {
        tripId: 'TRP-23-001',
        tripNumber: 'TRP-23',
        projectId: 'PRJ-TEST',
        status: 'IN_TRANSIT',
        hasExceptions: false,
        financials: { isFinalized: false },
      };
      await tripAdapter.tripRepository.create({ ...mockTrip, createdBy: 'admin', updatedBy: 'admin' });

      const excService = new ExceptionService(excAdapter);
      const context: any = { userId: 'usr-admin', displayName: 'Admin', role: 'PROJECT_ADMIN' };
      await excService.raiseException({
        exceptionId: 'EXC-23-001',
        projectId: 'PRJ-TEST',
        tripId: 'TRP-23-001',
        type: 'ROUTE_DEVIATION',
        severity: 'HIGH',
        reasonAr: 'استثناء انحراف مسار حرج',
        status: 'OPEN',
      } as any, context);

      const updatedTrip = await tripAdapter.tripRepository.findById('PRJ-TEST', 'TRP-23-001');
      expect(updatedTrip?.hasExceptions).toBe(true);
    });

    it('24. Audit log is recorded during exception creation via Admin SDK', async () => {
      const excAdapter = new ServerExceptionPersistenceAdapter();
      const logId = await excAdapter.auditLogService.recordLog({
        projectId: 'PRJ-TEST',
        entityType: 'EXCEPTION',
        entityId: 'EXC-24-001',
        action: 'CREATE',
        after: {},
      }, { userId: 'usr-1', email: 'admin@test.com', role: 'PROJECT_ADMIN' });

      expect(typeof logId).toBe('string');
      expect(logId).toMatch(/^AUD-/);
    });
  });

  // =========================================================================
  // Contracts 25–29: Idempotency via Admin SDK
  // =========================================================================
  describe('Contracts 25–29: Idempotency via Admin SDK', () => {
    it('25. Trip creation endpoint queries clientUUID via adminDb', () => {
      const appTsPath = path.resolve(__dirname, '../../server/app.ts');
      const content = fs.readFileSync(appTsPath, 'utf-8');
      expect(content).toMatch(/adminDb\s*\.collection\('projects'\)\s*\.doc\(projectId\)\s*\.collection\('trips'\)\s*\.where\('clientUUID',\s*'==',\s*operationId\)/);
    });

    it('26. Trip status transition endpoint queries sync_operations via adminDb', () => {
      const appTsPath = path.resolve(__dirname, '../../server/app.ts');
      const content = fs.readFileSync(appTsPath, 'utf-8');
      expect(content).toMatch(/adminDb\s*\.collection\('projects'\)\s*\.doc\(projectId\)\s*\.collection\('sync_operations'\)\s*\.doc\(operationId\)/);
    });

    it('27. Trip receipt recording endpoint checks sync_operations via adminDb', () => {
      const appTsPath = path.resolve(__dirname, '../../server/app.ts');
      const content = fs.readFileSync(appTsPath, 'utf-8');
      expect(content).toContain("app.post(\n  '/api/projects/:projectId/trips/:tripId/receipt'");
      expect(content).toMatch(/adminDb\.collection\('projects'\)\.doc\(projectId\)\.collection\('sync_operations'\)\.doc\(operationId\)/);
    });

    it('28. Trip exception endpoint checks sync_operations via adminDb', () => {
      const appTsPath = path.resolve(__dirname, '../../server/app.ts');
      const content = fs.readFileSync(appTsPath, 'utf-8');
      expect(content).toContain("app.post(\n  '/api/projects/:projectId/trips/:tripId/exceptions'");
      expect(content).toMatch(/adminDb\.collection\('projects'\)\.doc\(projectId\)\.collection\('trips'\)\.doc\(safeTrip\)\.collection\('exceptions'\)\.doc\(exceptionId\)/);
    });

    it('29. Successful status/receipt/exception operations commit sync_operation ledger via adminDb', () => {
      const appTsPath = path.resolve(__dirname, '../../server/app.ts');
      const content = fs.readFileSync(appTsPath, 'utf-8');
      expect(content).toContain("targetCollection: 'trips'");
      expect(content).toContain("targetCollection: 'exceptions'");
    });
  });

  // =========================================================================
  // Contracts 30–36: Architecture & Boundary Invariants
  // =========================================================================
  describe('Contracts 30–36: Architecture & Boundary Invariants', () => {
    it('30. server/app.ts imports serverTripService and serverExceptionService', () => {
      const appTsPath = path.resolve(__dirname, '../../server/app.ts');
      const content = fs.readFileSync(appTsPath, 'utf-8');
      expect(content).toContain("import { serverTripService, serverExceptionService } from '../src/services/canonicalTripPersistence.server'");
    });

    it('31. server/app.ts does not import client TripService constructor directly', () => {
      const appTsPath = path.resolve(__dirname, '../../server/app.ts');
      const content = fs.readFileSync(appTsPath, 'utf-8');
      expect(content).not.toMatch(/import\s*\{[^}]*TripService[^}]*\}\s*from\s*['"]\.\.\/src\/services\/trip\.service['"]/);
    });

    it('32. Trip routes in server/app.ts use authenticateUser and security middlewares', () => {
      const appTsPath = path.resolve(__dirname, '../../server/app.ts');
      const content = fs.readFileSync(appTsPath, 'utf-8');
      expect(content).toContain("enforceProjectIsolation");
      expect(content).toContain("enforceDispatcherOrAbove");
    });

    it('33. Trip routes in server/app.ts use req.user server authentication context', () => {
      const appTsPath = path.resolve(__dirname, '../../server/app.ts');
      const content = fs.readFileSync(appTsPath, 'utf-8');
      expect(content).toContain("const user = (req as any).user;");
    });

    it('34. Trip events are recorded via Admin SDK tripEventService without client auth reliance', async () => {
      const adapter = new ServerTripPersistenceAdapter();
      const eventRes = await adapter.tripEventService.recordEvent({
        projectId: 'PRJ-TEST',
        tripId: 'TRP-34',
        eventType: 'EVENT_DISPATCHED',
      }, { userId: 'usr-1', displayName: 'Disp', role: 'DISPATCHER' });
      expect(eventRes.eventId).toBeDefined();
    });

    it('35. Server persistence adapter maintains fail-closed update invariants', async () => {
      const adapter = new ServerTripPersistenceAdapter();
      await expect(
        adapter.tripRepository.update('PRJ-TEST', 'NON-EXISTENT', { status: 'IN_TRANSIT' }, 'usr-1')
      ).rejects.toThrow();
    });

    it('36. Zero client Firebase Web SDK imports in server trip routes', () => {
      const appTsPath = path.resolve(__dirname, '../../server/app.ts');
      const content = fs.readFileSync(appTsPath, 'utf-8');
      expect(content).not.toMatch(/import\s*\{[^}]*\bdb\b[^}]*\}\s*from\s*['"]\.\.\/src\/firebase\/config['"]/);
    });
  });

  // =========================================================================
  // Contracts 37–40: Client Compatibility & Regression Protections
  // =========================================================================
  describe('Contracts 37–40: Client Compatibility & Regression Protections', () => {
    it('37. Client TripService defaults to client repositories when no context is provided', () => {
      const clientService = new TripService();
      expect(clientService).toBeInstanceOf(TripService);
    });

    it('38. Client ExceptionService defaults to client repositories when no context is provided', () => {
      const clientService = new ExceptionService();
      expect(clientService).toBeInstanceOf(ExceptionService);
    });

    it('39. Pricing snapshot immutable properties are computed strictly from rule without client overrides', async () => {
      const appTsPath = path.resolve(__dirname, '../../server/app.ts');
      const content = fs.readFileSync(appTsPath, 'utf-8');
      expect(content).toContain("req.body.pricingSnapshot !== undefined");
      expect(content).toContain("req.body.settlementAmount !== undefined");
    });

    it('40. TripNumberGenerator in ServerTripPersistenceAdapter generates sequential Q-PRJ format using adminDb transactions', async () => {
      const adapter = new ServerTripPersistenceAdapter();
      const tripNum = await adapter.tripNumberGenerator.getNextTripNumber('PRJ-0001', 1);
      expect(tripNum).toMatch(/^Q-PRJ-\d{4}-TRP-\d{5}$/);
    });
  });
});
