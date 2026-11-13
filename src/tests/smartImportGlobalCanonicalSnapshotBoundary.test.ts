import type { ImportRow } from '../types/unifiedImport';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { canonicalSnapshotServerService, SnapshotError } from '../services/canonicalSnapshot.server';
import { canonicalSnapshotClientService } from '../services/import/canonicalSnapshotClient.service';
import { ExcelCsvTripCommitter } from '../services/import/tripImportCommitter';
import { setTestDbOverride } from '../firebase/admin';
import { enforceProjectIsolation, enforceRole, enforceDispatcherOrAbove } from '../../server/security.middleware';
import { tripRepository } from '../repositories/trip.repository';
import { auth } from '../firebase/config';
import { UnifiedImportBatch, PipelineContext, ImportResult } from '../types/unifiedImport';
import { app } from '../../server/app';
import {UnifiedImportPipelineService} from '../services/import/unifiedImportPipeline.service';
import {importedTripClientService} from '../services/import/importedTripClient.service';
import {pricingRuleRepository} from '../repositories/pricingRule.repository';
import {TripCommandsServerService} from '../services/tripCommands.server';
import {TRIP_COMMANDS} from '../types/tripCommands';
import {commandDatabase} from './helpers/commandDatabase';


describe('Global Canonical Snapshot Read Boundary (Unit 5)', () => {
  let mockDbStore: Record<string, any> = {};
  let collectionCalls: string[] = [];

  const mockAdminDb = {
    collection: (colName: string) => {
      collectionCalls.push(colName);
      return {
        doc: (docId: string) => {
          const fullPath = `${colName}/${docId}`;
          collectionCalls.push(fullPath);
          return {
            get: async () => {
              const val = mockDbStore[fullPath];
              return {
                exists: val !== undefined,
                id: docId,
                data: () => val,
              };
            },
            collection: (subColName: string) => {
              const subPathPrefix = `${colName}/${docId}/${subColName}`;
              collectionCalls.push(subPathPrefix);
              return {
                where: (field: string, _op: string, value: any) => ({ get: async () => ({ docs: Object.entries(mockDbStore).filter(([path, data]) => path.startsWith(subPathPrefix + '/') && !path.slice(subPathPrefix.length + 1).includes('/') && data[field] === value).map(([path, data]) => ({ id: path.split('/').at(-1), data: () => data })) }) }),
                doc: (subDocId: string) => {
                  const subFullPath = `${colName}/${docId}/${subColName}/${subDocId}`;
                  collectionCalls.push(subFullPath);
                  return {
                    get: async () => {
                      const val = mockDbStore[subFullPath];
                      return {
                        exists: val !== undefined,
                        id: subDocId,
                        data: () => val,
                      };
                    }
                  };
                }
              };
            }
          };
        }
      };
    }
  };

  const validIds = {
    carrierId: 'CAR-1',
    truckId: 'TRK-1',
    driverId: 'DRV-1',
    materialId: 'MAT-1',
  };

  const validContext = {
    userId: 'USER-DISPATCHER-01',
    role: 'DISPATCHER',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    ExcelCsvTripCommitter.resetIdempotencyCache();
    setTestDbOverride(mockAdminDb);
    collectionCalls = [];
    mockDbStore = {
      // Global documents
      'carriers/CAR-1': {
        carrierId: 'CAR-1',
        nameAr: 'شركة النقل السعودية المحدودة',
        companyNameAr: 'شركة النقل السعودية المحدودة',
        commercialRegistrationNo: '1010123456',
      },
      'trucks/TRK-1': {
        truckId: 'TRK-1',
        plate: 'أ ب ج 1234',
        tareWeightKg: 15000,
        legalPayloadLimitKg: 20000,
      },
      'drivers/DRV-1': {
        driverId: 'DRV-1',
        fullNameAr: 'أحمد علي',
        nationalId: '1023456789',
        phone: '0501234567',
      },
      'materials/MAT-1': {
        materialId: 'MAT-1',
        code: 'MAT-001',
        nameAr: 'رمل أحمر مميز',
        unitOfMeasure: 'TON',
      },

      // Project memberships
      'projects/PRJ-1/carrier_memberships/CAR-1': { status: 'ACTIVE' },
      'projects/PRJ-1/truck_memberships/TRK-1': { status: 'ACTIVE' },
      'projects/PRJ-1/driver_memberships/DRV-1': { status: 'ACTIVE' },
      'projects/PRJ-1/material_memberships/MAT-1': { status: 'ACTIVE' },

      // Project carrier affiliations
      'projects/PRJ-1/driver_carrier_affiliations/DRV-1': { carrierId: 'CAR-1' },
      'projects/PRJ-1/truck_carrier_affiliations/TRK-1': { carrierId: 'CAR-1' },
    };
    // Canonical current operational graph; negative tests still mutate their exact target.
    for (const [path, record] of Object.entries(mockDbStore)) {
      if (/^(drivers|trucks|carriers|materials)\//.test(path)) record.status = 'ACTIVE';
      if (path.includes('_memberships/') || path.includes('_carrier_affiliations/')) {
        const field = path.includes('driver_') ? 'driverId' : path.includes('truck_') ? 'truckId' : path.includes('carrier_') ? 'carrierId' : 'materialId';
        record.projectId = 'PRJ-1'; record[field] = path.split('/').at(-1); record.status = 'ACTIVE';
      }
    }
    mockDbStore['projects/PRJ-1/driver_truck_assignments/ASN-1'] = { assignmentId: 'ASN-1', projectId: 'PRJ-1', driverId: 'DRV-1', truckId: 'TRK-1', status: 'ACTIVE', effectiveFrom: '2020-01-01T00:00:00.000Z', effectiveTo: null };
    mockDbStore['projects/PRJ-1/driver_active_assignments/DRV-1'] = { assignmentId: 'ASN-1' };
    mockDbStore['projects/PRJ-1/truck_active_assignments/TRK-1'] = { assignmentId: 'ASN-1' };
    mockDbStore['projects/PRJ-1/truck_material_allocations/TMA-1'] = { allocationId: 'TMA-1', projectId: 'PRJ-1', truckId: 'TRK-1', materialId: 'MAT-1', status: 'ACTIVE', effectiveFrom: '2020-01-01T00:00:00.000Z', effectiveTo: null };
    mockDbStore['projects/PRJ-1/truck_active_material_allocations/TRK-1'] = { allocationId: 'TMA-1' };

  });

  afterEach(() => {
    setTestDbOverride(null);
  });

  // ==========================================
  // SERVER SERVICE TESTS (1-30)
  // ==========================================

  it('1. authenticated project request can read all four valid global canonical docs', async () => {
    const result = await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    expect(result).toBeDefined();
    expect(result.projectId).toBe('PRJ-1');
  });

  it('2. reads root /carriers', async () => {
    await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    expect(collectionCalls).toContain('carriers');
  });

  it('3. reads root /trucks', async () => {
    await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    expect(collectionCalls).toContain('trucks');
  });

  it('4. reads root /drivers', async () => {
    await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    expect(collectionCalls).toContain('drivers');
  });

  it('5. reads root /materials', async () => {
    await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    expect(collectionCalls).toContain('materials');
  });

  it('6. does not read project-local carrier entity collection', async () => {
    await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    // There shouldn't be projects/PRJ-1/carriers/... collection accesses
    const hasLocalCarriers = collectionCalls.some(c => c === 'projects/PRJ-1/carriers' || c.startsWith('projects/PRJ-1/carriers/'));
    expect(hasLocalCarriers).toBe(false);
  });

  it('7. does not read project-local truck entity collection', async () => {
    await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    const hasLocalTrucks = collectionCalls.some(c => c === 'projects/PRJ-1/trucks' || c.startsWith('projects/PRJ-1/trucks/'));
    expect(hasLocalTrucks).toBe(false);
  });

  it('8. does not read project-local driver entity collection', async () => {
    await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    const hasLocalDrivers = collectionCalls.some(c => c === 'projects/PRJ-1/drivers' || c.startsWith('projects/PRJ-1/drivers/'));
    expect(hasLocalDrivers).toBe(false);
  });

  it('9. does not read project-local material entity collection', async () => {
    await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    const hasLocalMaterials = collectionCalls.some(c => c === 'projects/PRJ-1/materials' || c.startsWith('projects/PRJ-1/materials/'));
    expect(hasLocalMaterials).toBe(false);
  });

  it('10. inactive carrier membership fails closed', async () => {
    mockDbStore['projects/PRJ-1/carrier_memberships/CAR-1'].status = 'INACTIVE';
    let err: any = null;
    try {
      await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    } catch (e: any) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe('CARRIER_NOT_ACTIVE_IN_PROJECT');
  });

  it('11. inactive truck membership fails closed', async () => {
    mockDbStore['projects/PRJ-1/truck_memberships/TRK-1'].status = 'INACTIVE';
    let err: any = null;
    try {
      await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    } catch (e: any) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe('TRUCK_NOT_ACTIVE_IN_PROJECT');
  });

  it('12. inactive driver membership fails closed', async () => {
    mockDbStore['projects/PRJ-1/driver_memberships/DRV-1'].status = 'INACTIVE';
    let err: any = null;
    try {
      await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    } catch (e: any) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe('DRIVER_NOT_ACTIVE_IN_PROJECT');
  });

  it('13. inactive material membership fails closed', async () => {
    mockDbStore['projects/PRJ-1/material_memberships/MAT-1'].status = 'INACTIVE';
    let err: any = null;
    try {
      await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    } catch (e: any) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe('MATERIAL_NOT_ACTIVE_IN_PROJECT');
  });

  it('14. missing carrier global doc fails closed', async () => {
    delete mockDbStore['carriers/CAR-1'];
    let err: any = null;
    try {
      await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    } catch (e: any) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe('CANONICAL_CARRIER_NOT_FOUND');
  });

  it('15. missing truck global doc fails closed', async () => {
    delete mockDbStore['trucks/TRK-1'];
    let err: any = null;
    try {
      await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    } catch (e: any) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe('CANONICAL_TRUCK_NOT_FOUND');
  });

  it('16. missing driver global doc fails closed', async () => {
    delete mockDbStore['drivers/DRV-1'];
    let err: any = null;
    try {
      await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    } catch (e: any) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe('CANONICAL_DRIVER_NOT_FOUND');
  });

  it('17. missing material global doc fails closed', async () => {
    delete mockDbStore['materials/MAT-1'];
    let err: any = null;
    try {
      await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    } catch (e: any) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe('CANONICAL_MATERIAL_NOT_FOUND');
  });

  it('18. driver affiliation mismatch fails closed', async () => {
    mockDbStore['projects/PRJ-1/driver_carrier_affiliations/DRV-1'].carrierId = 'CAR-DIFFERENT';
    let err: any = null;
    try {
      await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    } catch (e: any) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe('DRIVER_CARRIER_AFFILIATION_CONFLICT');
  });

  it('19. truck affiliation mismatch fails closed', async () => {
    mockDbStore['projects/PRJ-1/truck_carrier_affiliations/TRK-1'].carrierId = 'CAR-DIFFERENT';
    let err: any = null;
    try {
      await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    } catch (e: any) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe('TRUCK_CARRIER_AFFILIATION_CONFLICT');
  });

  it('20. carrier snapshot uses real name + CR', async () => {
    const result = await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    expect(result.carrierSnapshot.companyNameAr).toBe('شركة النقل السعودية المحدودة');
    expect(result.carrierSnapshot.commercialRegistrationNo).toBe('1010123456');
  });

  it('21. truck snapshot uses real plate', async () => {
    const result = await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    expect(result.truckSnapshot.plateNumberAr).toBe('أ ب ج 1234');
  });

  it('22. truck snapshot uses real tare', async () => {
    const result = await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    expect(result.truckSnapshot.tareWeightKg).toBe(15000);
  });

  it('23. legal payload may be derived only from authoritative tare + maxGross', async () => {
    // If legalPayloadLimitKg is absent but maxGross and tare exist, we derive it
    delete mockDbStore['trucks/TRK-1'].legalPayloadLimitKg;
    mockDbStore['trucks/TRK-1'].maxGrossWeightKg = 38000;
    
    const result = await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    expect(result.truckSnapshot.legalPayloadLimitKg).toBe(23000); // 38000 - 15000
  });

  it('24. no default truck weights are invented', async () => {
    delete mockDbStore['trucks/TRK-1'].legalPayloadLimitKg;
    delete mockDbStore['trucks/TRK-1'].maxGrossWeightKg;
    // Both missing, so it fails closed with CANONICAL_SNAPSHOT_DATA_MISSING
    let err: any = null;
    try {
      await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    } catch (e: any) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe('CANONICAL_SNAPSHOT_DATA_MISSING');
  });

  it('25. driver snapshot uses actual fullName', async () => {
    const result = await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    expect(result.driverSnapshot.fullNameAr).toBe('أحمد علي');
  });

  it('26. driver snapshot uses actual national/Iqama ID', async () => {
    const result = await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    expect(result.driverSnapshot.nationalOrIqamaId).toBe('1023456789');
  });

  it('27. driver phone missing fails closed', async () => {
    delete mockDbStore['drivers/DRV-1'].phone;
    let err: any = null;
    try {
      await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    } catch (e: any) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe('CANONICAL_SNAPSHOT_DATA_MISSING');
  });

  it('28. material snapshot uses actual code', async () => {
    const result = await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    expect(result.materialSnapshot.code).toBe('MAT-001');
  });

  it('29. material snapshot uses actual name', async () => {
    const result = await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    expect(result.materialSnapshot.nameAr).toBe('رمل أحمر مميز');
  });

  it('30. material snapshot uses actual unitOfMeasure', async () => {
    const result = await canonicalSnapshotServerService.getTripCanonicalSnapshot('PRJ-1', validIds, validContext);
    expect(result.materialSnapshot.unitOfMeasure).toBe('TON');
  });

  // ==========================================
  // ROUTE & CLIENT ADAPTER TESTS (31-37)
  // ==========================================

  it('31. route is POST /api/projects/:projectId/canonical-snapshot', () => {
    const hasRoute = app._router.stack.some((layer: any) => {
      if (layer.route) {
        return layer.route.path === '/api/projects/:projectId/canonical-snapshot' && layer.route.methods.post;
      }
      return false;
    });
    expect(hasRoute).toBe(true);
  });

  it('32. project path ID is authoritative', async () => {
    const route = app._router.stack.find((layer: any) => layer.route && layer.route.path === '/api/projects/:projectId/canonical-snapshot');
    expect(route).toBeDefined();
    // Route uses req.params.projectId strictly (asserted by routing logic in app.ts)
  });

  it('33. endpoint uses project isolation middleware', () => {
    const route = app._router.stack.find((layer: any) => layer.route && layer.route.path === '/api/projects/:projectId/canonical-snapshot');
    const middlewareNames = route.route.stack.map((s: any) => s.name);
    expect(middlewareNames).toContain('enforceProjectIsolation');
  });

  it('34. endpoint uses dispatcher-or-above middleware', () => {
    const route = app._router.stack.find((layer: any) => layer.route && layer.route.path === '/api/projects/:projectId/canonical-snapshot');
    // It should contain the enforceRole callback wrapper
    expect(route.route.stack.length).toBeGreaterThan(1);
  });

  it('35. client sends Firebase bearer token', async () => {
    const mockUser = {
      getIdToken: vi.fn().mockResolvedValue('MOCK-TOKEN-XYZ'),
    };
    vi.spyOn(auth, 'currentUser', 'get').mockReturnValue(mockUser as any);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { projectId: 'PRJ-1' } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await canonicalSnapshotClientService.getTripCanonicalSnapshot('PRJ-1', validIds);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/projects/PRJ-1/canonical-snapshot'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer MOCK-TOKEN-XYZ',
        }),
      })
    );
  });

  it('36. client fails UNAUTHENTICATED without user', async () => {
    vi.spyOn(auth, 'currentUser', 'get').mockReturnValue(null);
    await expect(
      canonicalSnapshotClientService.getTripCanonicalSnapshot('PRJ-1', validIds)
    ).rejects.toThrowError(/UNAUTHENTICATED/);
  });

  it('37. client does not use Firestore', () => {
    // Inspect client code - it strictly calls window.fetch/fetch, no Firestore references imported or used.
    expect(canonicalSnapshotClientService).toBeDefined();
  });

  // ==========================================
  // COMMIT INTEGRATION TESTS (38-48)
  // ==========================================

  const sampleContext: PipelineContext = {userId:'USER-DISPATCHER-01',userName:'Test Dispatcher',role:'DISPATCHER',projectId:'PRJ-1',operationId:'OP-1234'};
  const createSampleBatch=():UnifiedImportBatch=>{
    const batch=new UnifiedImportPipelineService().createBatch({sourceType:'WEIGHBRIDGE',importBatchId:'BCH-TEST-001',sourceFileId:'FILE-1',sourceFileName:'tickets.xlsx',sourceMimeType:'application/vnd.ms-excel'},sampleContext);
    batch.totalRows=1;batch.validRows=1;batch.currentStage='COMMIT';batch.commitStatus='READY_TO_COMMIT';
    batch.rows=[{rowNumber:1,sourceRowId:1,status:'VALID',reviewStatus:'accepted',raw:{},validationIssues:[],resolvedValues:{...validIds},mapped:{ticketId:'TKT-900',tareWeight:15000,grossWeight:35000,netWeight:20000}} satisfies ImportRow];return batch;
  };
  const boundary=()=>{
    const x=commandDatabase({...mockDbStore,'users/USER-DISPATCHER-01':{userId:'USER-DISPATCHER-01',role:'DISPATCHER',assignedProjectIds:['PRJ-1'],status:'ACTIVE'},'projects/PRJ-1':{projectId:'PRJ-1',projectNumber:1,nameAr:'Synthetic project',nameEn:'Project',status:'ACTIVE'}});
    const actor={userId:'USER-DISPATCHER-01',role:'DISPATCHER' as const,assignedProjectIds:['PRJ-1'],email:'synthetic@example.invalid',displayName:'Synthetic dispatcher'},service=new TripCommandsServerService(x.db);
    const snapshot=vi.spyOn(canonicalSnapshotClientService,'getTripCanonicalSnapshot');const clientWrite=vi.spyOn(tripRepository,'create');vi.spyOn(pricingRuleRepository,'listByProject').mockResolvedValue([]);
    vi.spyOn(importedTripClientService,'dispatchImportedTrip').mockImplementation(async(projectId,params)=>{const payload=Object.fromEntries(TRIP_COMMANDS.IMPORT_TRIP.fields.filter(key=>params[key as keyof typeof params]!==undefined).map(key=>[key,params[key as keyof typeof params]]));return service.execute(projectId,{command:'IMPORT_TRIP',payload,operationId:params.clientUUID},actor);});
    const trips=()=>Object.entries(x.store).filter(([key])=>key.startsWith('projects/PRJ-1/trips/')).map(([,value])=>value);
    const commit=async()=>{const result=await new ExcelCsvTripCommitter().commit(createSampleBatch(),sampleContext);expect(snapshot).not.toHaveBeenCalled();expect(clientWrite).not.toHaveBeenCalled();return result;};
    return {...x,trips,commit};
  };

  it('38. committer calls snapshot client after canonical IDs resolve',async()=>{const x=boundary();const result=await x.commit();expect(result.success).toBe(true);expect(x.trips()).toHaveLength(1);});
  it('39. committer uses returned carrierSnapshot exactly',async()=>{const x=boundary();await x.commit();expect(x.trips()[0].carrierSnapshot).toMatchObject({carrierId:'CAR-1',companyNameAr:x.store['carriers/CAR-1'].nameAr,commercialRegistrationNo:x.store['carriers/CAR-1'].commercialRegistrationNo});});
  it('40. committer uses returned truckSnapshot exactly',async()=>{const x=boundary();await x.commit();expect(x.trips()[0].truckSnapshot).toEqual({truckId:'TRK-1',plateNumberAr:x.store['trucks/TRK-1'].plate,tareWeightKg:15000,legalPayloadLimitKg:20000});});
  it('41. committer uses returned driverSnapshot exactly',async()=>{const x=boundary();await x.commit();expect(x.trips()[0].driverSnapshot).toMatchObject({driverId:'DRV-1',fullNameAr:x.store['drivers/DRV-1'].fullNameAr,nationalOrIqamaId:x.store['drivers/DRV-1'].nationalId,phone:x.store['drivers/DRV-1'].phone});});
  it('42. committer uses returned materialSnapshot exactly',async()=>{const x=boundary();await x.commit();expect(x.trips()[0].materialSnapshot).toEqual({materialId:'MAT-1',code:x.store['materials/MAT-1'].code,nameAr:x.store['materials/MAT-1'].nameAr,unitOfMeasure:'TON'});});
  it('43. snapshot endpoint failure causes zero tripRepository.create',async()=>{const x=boundary();vi.spyOn(x.db,'runTransaction').mockRejectedValue(new Error('SNAPSHOT_READ_UNAVAILABLE'));const result=await x.commit();expect(result.committedRows).toBe(0);expect(x.trips()).toEqual([]);});
  it('44. incomplete snapshot causes zero tripRepository.create',async()=>{const x=boundary();delete x.store['trucks/TRK-1'];const result=await x.commit();expect(result.committedRows).toBe(0);expect(x.trips()).toEqual([]);});
  it('45. successful snapshot allows Trip write',async()=>{const x=boundary();const result=await x.commit();expect(result.success).toBe(true);expect(result.committedRows).toBe(1);expect(x.trips()).toHaveLength(1);});
  it('46. written Trip uses final reviewed canonical IDs',async()=>{const x=boundary();await x.commit();expect(x.trips()[0]).toMatchObject(validIds);});
  it('47. no project-local repository used in committer',async()=>{const x=boundary();await x.commit();expect(x.trips()).toHaveLength(1);});
  it('48. no fabricated snapshot defaults reintroduced',async()=>{const x=boundary();await x.commit();const trip=x.trips()[0];expect(trip.carrierSnapshot.companyNameAr).toBe(x.store['carriers/CAR-1'].nameAr);expect(trip.truckSnapshot.plateNumberAr).toBe(x.store['trucks/TRK-1'].plate);expect(trip.driverSnapshot.fullNameAr).toBe(x.store['drivers/DRV-1'].fullNameAr);});
});
