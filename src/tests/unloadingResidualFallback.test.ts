import * as fs from 'fs';
import * as path from 'path';
import { indexedDBService } from '../services/offline/indexedDB.service';
import { tripEngineService } from '../services/tripEngine.service';
import { UNLOADING_AUTHORIZED_ROLES } from '../components/field/UnloadingOperatorView';

console.log('================================================================');
console.log('  UNLOADING OPERATOR VIEW RESIDUAL LEGACY FALLBACK REMOVAL TEST');
console.log('================================================================');
console.log('ACTUAL TEST EXECUTION METHOD: Executed extracted refreshInboundTrips and handleSearchTrip function bodies from UnloadingOperatorView.tsx using controlled collaborators in a dynamic function runtime.');
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

function extractFunctionBody(source: string, searchStr: string): string {
  const startIdx = source.indexOf(searchStr);
  if (startIdx === -1) throw new Error(`Could not find search string: ${searchStr}`);
  
  const braceStart = source.indexOf('{', startIdx);
  if (braceStart === -1) throw new Error(`Could not find opening brace after: ${searchStr}`);
  
  let braceCount = 1;
  let i = braceStart + 1;
  while (braceCount > 0 && i < source.length) {
    const char = source[i];
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
    }
    i++;
  }
  
  return source.substring(braceStart + 1, i - 1);
}

function stripTypeScriptTypes(body: string): string {
  return body
    .replace(/:\s*any\s*\[\s*\]/g, '') // strip ": any[]"
    .replace(/:\s*any/g, '')           // strip ": any"
    .replace(/:\s*string/g, '')        // strip ": string"
    .replace(/as\s+string/g, '');      // strip "as string"
}

async function runTests() {
  const originalGetAllTrips = tripEngineService.getAllTrips;
  const originalGetTrips = (tripEngineService as any).getTrips;

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

    // 2. Extract function bodies from the production component
    const refreshInboundTripsBodyRaw = extractFunctionBody(fileContent, 'const refreshInboundTrips = async () => {');
    const handleSearchTripBodyRaw = extractFunctionBody(fileContent, 'const handleSearchTrip = (query?: string) => {');

    const refreshInboundTripsBody = stripTypeScriptTypes(refreshInboundTripsBodyRaw);
    const handleSearchTripBody = stripTypeScriptTypes(handleSearchTripBodyRaw);

    assert('Successfully extracted refreshInboundTrips function body', refreshInboundTripsBody.trim().length > 0);
    assert('Successfully extracted handleSearchTrip function body', handleSearchTripBody.trim().length > 0);

    // Wrappers to run the extracted code
    const runExtractedRefreshInboundTrips = async (collaborators: {
      isOnline: boolean;
      authContext: any;
      tripRepository: any;
      indexedDBService: any;
      setInboundTrips: (val: any[]) => void;
      setTripsCache: (val: any[]) => void;
    }) => {
      const fn = new Function(
        'isOnline',
        'authContext',
        'tripRepository',
        'indexedDBService',
        'setInboundTrips',
        'setTripsCache',
        `return (async () => {
          try {
            ${refreshInboundTripsBody}
          } catch (err) {
            throw err;
          }
        })();`
      );
      await fn(
        collaborators.isOnline,
        collaborators.authContext,
        collaborators.tripRepository,
        collaborators.indexedDBService,
        collaborators.setInboundTrips,
        collaborators.setTripsCache
      );
    };

    const runExtractedHandleSearchTrip = (
      query: string | undefined,
      collaborators: {
        searchQuery: string;
        tripsCache: any[];
        setActiveTrip: (val: any) => void;
        setSearchFeedback: (val: any) => void;
        selectTrip: (trip: any, matchedBy: string) => void;
      }
    ) => {
      const fn = new Function(
        'query',
        'searchQuery',
        'tripsCache',
        'setActiveTrip',
        'setSearchFeedback',
        'selectTrip',
        `
          ${handleSearchTripBody}
        `
      );
      fn(
        query,
        collaborators.searchQuery,
        collaborators.tripsCache,
        collaborators.setActiveTrip,
        collaborators.setSearchFeedback,
        collaborators.selectTrip
      );
    };

    // Setup legacy spy/mocks to verify they are never called
    let legacyGetAllTripsCalled = false;
    let legacyGetTripsCalled = false;
    tripEngineService.getAllTrips = () => {
      legacyGetAllTripsCalled = true;
      return [];
    };
    if (originalGetTrips) {
      (tripEngineService as any).getTrips = () => {
        legacyGetTripsCalled = true;
        return [];
      };
    }

    const memStore = (indexedDBService as any).getMemoryStore('trips');
    memStore.clear();

    const mockTripRepository = {
      listByProject: async (projectId: string) => []
    };

    // Case 1: Empty canonical cache produces empty incoming/search state.
    let inboundTripsState: any[] = [];
    let tripsCacheState: any[] = [];

    await runExtractedRefreshInboundTrips({
      isOnline: false,
      authContext: null,
      tripRepository: mockTripRepository,
      indexedDBService,
      setInboundTrips: (val) => { inboundTripsState = val; },
      setTripsCache: (val) => { tripsCacheState = val; }
    });

    assert('Case 1: Empty canonical cache sets inboundTrips to empty array', inboundTripsState.length === 0);
    assert('Case 1: Empty canonical cache sets tripsCache to empty array', tripsCacheState.length === 0);

    // Case 2: Nonempty cache with zero inbound matches leaves inbound state empty.
    const completedTrip = { tripId: 'TRP-01', status: 'COMPLETED', projectId: 'PRJ-NEOM-001' };
    await indexedDBService.put('trips', completedTrip);

    await runExtractedRefreshInboundTrips({
      isOnline: false,
      authContext: null,
      tripRepository: mockTripRepository,
      indexedDBService,
      setInboundTrips: (val) => { inboundTripsState = val; },
      setTripsCache: (val) => { tripsCacheState = val; }
    });

    assert('Case 2: Nonempty cache with zero inbound matches leaves inboundTrips empty', inboundTripsState.length === 0);
    assert('Case 2: tripsCache holds the loaded non-matching trip', tripsCacheState.length === 1 && tripsCacheState[0].tripId === 'TRP-01');

    // Case 3: Cache read rejection produces no legacy substitution.
    const originalIndexedDBGetAll = indexedDBService.getAll;
    indexedDBService.getAll = async () => {
      throw new Error('Simulated Cache Read Failure');
    };

    inboundTripsState = ['initial-noise'];
    tripsCacheState = ['initial-noise'];

    try {
      await runExtractedRefreshInboundTrips({
        isOnline: false,
        authContext: null,
        tripRepository: mockTripRepository,
        indexedDBService,
        setInboundTrips: (val) => { inboundTripsState = val; },
        setTripsCache: (val) => { tripsCacheState = val; }
      });
    } catch (e) {
      // Caught internally or ignored
    } finally {
      indexedDBService.getAll = originalIndexedDBGetAll;
    }

    assert('Case 3: Cache read rejection does not invoke legacy tripEngineService.getAllTrips', !legacyGetAllTripsCalled);
    assert('Case 3: Inbound state remains empty or unchanged without fallback values', !inboundTripsState.some(t => t.tripId === 'LEGACY-01'));

    // Case 4: Empty SEARCH SOURCE with a NONEMPTY query produces NOT_FOUND.
    let activeTripResult: any = 'initial';
    let searchFeedbackResult: any = null;
    let selectTripCalled = false;

    runExtractedHandleSearchTrip('TRP-NEOM-1002', {
      searchQuery: '',
      tripsCache: [], // empty search source
      setActiveTrip: (val) => { activeTripResult = val; },
      setSearchFeedback: (val) => { searchFeedbackResult = val; },
      selectTrip: (trip, matchedBy) => { selectTripCalled = true; }
    });

    assert('Case 4: Empty search source sets activeTrip to null', activeTripResult === null);
    assert('Case 4: Empty search source returns NOT_FOUND status', searchFeedbackResult?.status === 'NOT_FOUND');
    assert('Case 4: selectTrip was not called', !selectTripCalled);

    // Case 5: Populated legacy data does not appear in component state, and neither legacy read method is called.
    tripEngineService.clearTrips();
    tripEngineService.loadSeedData([
      { tripId: 'LEGACY-01', tripSerial: 'LEGACY-SR-01', status: 'IN_TRANSIT', projectId: 'PRJ-NEOM-001' } as any
    ]);

    memStore.clear();
    legacyGetAllTripsCalled = false;
    legacyGetTripsCalled = false;

    await runExtractedRefreshInboundTrips({
      isOnline: false,
      authContext: null,
      tripRepository: mockTripRepository,
      indexedDBService,
      setInboundTrips: (val) => { inboundTripsState = val; },
      setTripsCache: (val) => { tripsCacheState = val; }
    });

    assert('Case 5: Legacy trip is not loaded into inboundTrips', !inboundTripsState.some(t => t.tripId === 'LEGACY-01'));
    assert('Case 5: Legacy trip is not loaded into tripsCache', !tripsCacheState.some(t => t.tripId === 'LEGACY-01'));
    assert('Case 5: Legacy read methods were not called', !legacyGetAllTripsCalled && !legacyGetTripsCalled);

    // Case 6: Normal canonical incoming data and actual search still work.
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

    await runExtractedRefreshInboundTrips({
      isOnline: false,
      authContext: null,
      tripRepository: mockTripRepository,
      indexedDBService,
      setInboundTrips: (val) => { inboundTripsState = val; },
      setTripsCache: (val) => { tripsCacheState = val; }
    });

    assert('Case 6: Inbound trip is parsed successfully', inboundTripsState.length === 1 && inboundTripsState[0].tripId === 'TRP-02');

    let selectedTrip: any = null;
    let selectedMatchedBy: string = '';
    const mockSelectTrip = (trip: any, matchedBy: string) => {
      selectedTrip = trip;
      selectedMatchedBy = matchedBy;
    };

    runExtractedHandleSearchTrip('TRP-NEOM-1002', {
      searchQuery: '',
      tripsCache: tripsCacheState,
      setActiveTrip: (val) => { activeTripResult = val; },
      setSearchFeedback: (val) => { searchFeedbackResult = val; },
      selectTrip: mockSelectTrip
    });

    assert('Case 6: Search with valid tripSerial invokes selectTrip with correct trip', selectedTrip !== null && selectedTrip.tripId === 'TRP-02');
    assert('Case 6: matchedBy parameter is "tripSerial"', selectedMatchedBy === 'tripSerial');

    // Test plate-only search security rule restriction
    let searchFeedbackPlate: any = null;
    let activeTripPlate: any = 'not-null';
    let selectTripCalledPlate = false;

    runExtractedHandleSearchTrip('أ ب ج 1234', {
      searchQuery: '',
      tripsCache: tripsCacheState,
      setActiveTrip: (val) => { activeTripPlate = val; },
      setSearchFeedback: (val) => { searchFeedbackPlate = val; },
      selectTrip: () => { selectTripCalledPlate = true; }
    });

    assert('Case 6 (Plate only): activeTrip is set to null', activeTripPlate === null);
    assert('Case 6 (Plate only): Returns SECURITY status block', searchFeedbackPlate?.status === 'SECURITY');
    assert('Case 6 (Plate only): selectTrip is not invoked', !selectTripCalledPlate);

    // Case 7: Existing project-scoped repository calls remain intact.
    let syncedProjects: string[] = [];
    const onlineTripRepository = {
      listByProject: async (projectId: string) => {
        syncedProjects.push(projectId);
        return [
          { tripId: `ONLINE-${projectId}-01`, tripSerial: `ONLINE-SR-${projectId}`, status: 'IN_TRANSIT', projectId }
        ];
      }
    };

    const mockAuthContext = {
      assignedProjectIds: ['PRJ-A', 'PRJ-B']
    };

    await runExtractedRefreshInboundTrips({
      isOnline: true,
      authContext: mockAuthContext,
      tripRepository: onlineTripRepository,
      indexedDBService,
      setInboundTrips: (val) => { inboundTripsState = val; },
      setTripsCache: (val) => { tripsCacheState = val; }
    });

    assert('Case 7: listByProject is called for project PRJ-A', syncedProjects.includes('PRJ-A'));
    assert('Case 7: listByProject is called for project PRJ-B', syncedProjects.includes('PRJ-B'));
    assert('Case 7: Online trips are populated in local states', inboundTripsState.some(t => t.tripId === 'ONLINE-PRJ-A-01') && inboundTripsState.some(t => t.tripId === 'ONLINE-PRJ-B-01'));

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
  } finally {
    // Restore patched collaborators
    tripEngineService.getAllTrips = originalGetAllTrips;
    if (originalGetTrips) {
      (tripEngineService as any).getTrips = originalGetTrips;
    }
  }
}

runTests();
