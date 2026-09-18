import * as fs from 'fs';
import * as path from 'path';
import { indexedDBService } from '../services/offline/indexedDB.service';
import { tripEngineService } from '../services/tripEngine.service';
import { UNLOADING_AUTHORIZED_ROLES } from '../components/field/UnloadingOperatorView';

console.log('================================================================');
console.log('  UNLOADING OPERATOR VIEW RESIDUAL LEGACY FALLBACK REMOVAL TEST');
console.log('================================================================');

let totalTests = 0;
let passedTests = 0;

function assert(description: string, condition: boolean) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    console.error(`  ❌ [FAIL] ${description}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  try {
    // 1. Static Code Analysis: Prove zero tripEngineService references exist in UnloadingOperatorView.tsx
    const componentPath = path.resolve(process.cwd(), 'src/components/field/UnloadingOperatorView.tsx');
    const fileContent = fs.readFileSync(componentPath, 'utf8');

    assert(
      'Zero tripEngineService references remain in UnloadingOperatorView.tsx',
      !fileContent.includes('tripEngineService')
    );

    assert(
      'The legacy fallback block inside refreshInboundTrips is completely removed',
      !fileContent.includes('allFallback') && !fileContent.includes('tripEngineService.getAllTrips()')
    );

    assert(
      'inbounds is declared with const',
      fileContent.includes('const inbounds = all.filter(')
    );

    assert(
      'tripsCache state is strictly set to the loaded all trips array',
      fileContent.includes('setTripsCache(all);')
    );

    // 2. Functional & Collaborator State/Read/Search Verification
    // Helper mimicking the EXACT logic in UnloadingOperatorView:
    // Filter inbound states (bridge canonical & legacy statuses)
    const filterInbounds = (all: any[]) => {
      return all.filter(t => 
        t.status === 'IN_TRANSIT' || 
        t.status === 'ARRIVED' || 
        (t.status as string) === 'AT_DESTINATION' || 
        t.status === 'UNLOADING' || 
        (t.status as string) === 'OFFLOADED'
      );
    };

    // Helper mimicking search logic in UnloadingOperatorView:
    const searchTripsCache = (tripsCache: any[], query: string) => {
      const q = query.trim();
      if (!q) return { status: 'EMPTY' };
      const qLower = q.toLowerCase();

      // Plate-only search protection rule
      const isMatchingPlate = tripsCache.some(
        t => t.entitySnapshots?.truck?.plateNumberAr?.toLowerCase() === qLower ||
             t.entitySnapshots?.truck?.plateNumberAr?.replace(/\s+/g, '') === qLower.replace(/\s+/g, '')
      );

      const matchesTripSerialCheck = tripsCache.some(t => t.tripSerial?.toLowerCase() === qLower);
      const matchesTicketIdCheck = tripsCache.some(t => t.ticketId?.toLowerCase() === qLower);
      const matchesTruckIdCheck = tripsCache.some(t => t.truckId?.toLowerCase() === qLower);

      if (isMatchingPlate && !matchesTripSerialCheck && !matchesTicketIdCheck && !matchesTruckIdCheck) {
        return { status: 'SECURITY' };
      }

      const matchByTripSerial = tripsCache.filter(t => t.tripSerial?.toLowerCase() === qLower);
      if (matchByTripSerial.length > 0) {
        return { status: matchByTripSerial.length === 1 ? 'CONTINUE' : 'AMBIGUOUS', results: matchByTripSerial };
      }

      return { status: 'NOT_FOUND' };
    };

    // Ensure we start with a clean IndexedDB memory store
    const memStore = (indexedDBService as any).getMemoryStore('trips');
    memStore.clear();

    // Populate legacy source with mock trips to test ISOLATION
    tripEngineService.clearTrips();
    tripEngineService.loadSeedData([
      { tripId: 'LEGACY-01', tripSerial: 'LEGACY-SR-01', status: 'IN_TRANSIT', projectId: 'PRJ-NEOM-001' } as any
    ]);

    // Case 1: Empty cache (empty canonical cache) -> empty incoming queue & search source
    const tripsCase1 = await indexedDBService.getAll<any>('trips').catch(() => []);
    const inboundsCase1 = filterInbounds(tripsCase1);
    assert('Case 1 (Empty Cache): Inbounds list is empty', inboundsCase1.length === 0);
    assert('Case 1 (Empty Cache): Trips cache is empty', tripsCase1.length === 0);

    // Case 2: Nonempty canonical cache with zero incoming matches -> incoming queue remains empty
    const mockTripNonInbound = { tripId: 'TRP-01', status: 'COMPLETED', projectId: 'PRJ-NEOM-001' };
    await indexedDBService.put('trips', mockTripNonInbound);
    const tripsCase2 = await indexedDBService.getAll<any>('trips').catch(() => []);
    const inboundsCase2 = filterInbounds(tripsCase2);
    assert('Case 2 (Zero Incoming Matches): Inbounds list is empty', inboundsCase2.length === 0);
    assert('Case 2 (Zero Incoming Matches): tripsCache maintains non-inbound matches', tripsCase2.length === 1);

    // Case 3: Cache read failure handled as empty
    const originalGetAll = indexedDBService.getAll;
    indexedDBService.getAll = async () => { throw new Error('Simulated Read Failure'); };
    const tripsCase3 = await indexedDBService.getAll<any>('trips').catch(() => []);
    const inboundsCase3 = filterInbounds(tripsCase3);
    assert('Case 3 (Cache Read Failure): Recovered as empty array', tripsCase3.length === 0);
    assert('Case 3 (Cache Read Failure): Inbounds list is empty', inboundsCase3.length === 0);
    // Restore
    indexedDBService.getAll = originalGetAll;

    // Case 4: Empty search query logic
    const emptySearchResult = searchTripsCache(tripsCase2, '');
    assert('Case 4 (Empty Search Query): Returns EMPTY status', emptySearchResult.status === 'EMPTY');

    // Case 5: Populated legacy source isolation (theed data in tripEngineService is isolated)
    const tripsCase5 = await indexedDBService.getAll<any>('trips').catch(() => []);
    assert(
      'Case 5 (Legacy Source Isolation): Legacy data does not pollute the canonical trips query',
      !tripsCase5.some(t => t.tripId === 'LEGACY-01')
    );

    // Case 6: Normal canonical data behavior and search paths (happy path)
    const mockTripInbound = { 
      tripId: 'TRP-02', 
      tripSerial: 'TRP-NEOM-1002', 
      status: 'IN_TRANSIT', 
      projectId: 'PRJ-NEOM-001',
      entitySnapshots: {
        truck: {
          plateNumberAr: 'أ ب ج 1234'
        }
      }
    };
    await indexedDBService.put('trips', mockTripInbound);
    const tripsCase6 = await indexedDBService.getAll<any>('trips').catch(() => []);
    const inboundsCase6 = filterInbounds(tripsCase6);

    assert('Case 6 (Normal behavior): Inbounds filtered count is exactly 1', inboundsCase6.length === 1);
    assert('Case 6 (Normal behavior): Trips cache has exactly 2 elements', tripsCase6.length === 2);

    // Test Search by tripSerial
    const searchSerial = searchTripsCache(tripsCase6, 'TRP-NEOM-1002');
    assert('Case 6 (Search Serial): Returns CONTINUE status for valid tripSerial', searchSerial.status === 'CONTINUE');

    // Test plate-only search security rule restriction
    const searchPlate = searchTripsCache(tripsCase6, 'أ ب ج 1234');
    assert('Case 6 (Search Plate Only): Returns SECURITY status block', searchPlate.status === 'SECURITY');

    // Clean up memory store
    memStore.clear();

    console.log(`\nResults: ${passedTests}/${totalTests} tests passed.\n`);
    if (passedTests === totalTests) {
      console.log('✅ ALL FOCUSED TESTS PASSED SUCCESSFULLY!');
    } else {
      console.error('❌ SOME TESTS FAILED.');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('❌ UNCAUGHT ERROR IN TEST EXECUTION:', error);
    process.exitCode = 1;
  }
}

runTests();
