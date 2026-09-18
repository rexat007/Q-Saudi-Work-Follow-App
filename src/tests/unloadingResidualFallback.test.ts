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
  if (condition) {
    console.log(`  ✅ [PASS] ${description}`);
    return true;
  } else {
    console.error(`  ❌ [FAIL] ${description}`);
    process.exitCode = 1;
    return false;
  }
}

function runTestBlock(name: string, fn: () => void) {
  totalTests++;
  try {
    console.log(`\nRunning Test Block ${totalTests}: ${name}`);
    fn();
    passedTests++;
    console.log(`  🎉 Test Block ${totalTests} PASSED`);
  } catch (err) {
    console.error(`  💥 Test Block ${totalTests} FAILED:`, err);
    process.exitCode = 1;
    throw err;
  }
}

async function runTestBlockAsync(name: string, fn: () => Promise<void>) {
  totalTests++;
  try {
    console.log(`\nRunning Test Block ${totalTests}: ${name}`);
    await fn();
    passedTests++;
    console.log(`  🎉 Test Block ${totalTests} PASSED`);
  } catch (err) {
    console.error(`  💥 Test Block ${totalTests} FAILED:`, err);
    process.exitCode = 1;
    throw err;
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

// Prepare component extraction
const componentPath = path.resolve(process.cwd(), 'src/components/field/UnloadingOperatorView.tsx');
const fileContent = fs.readFileSync(componentPath, 'utf8');

const refreshInboundTripsBodyRaw = extractFunctionBody(fileContent, 'const refreshInboundTrips = async () => {');
const handleSearchTripBodyRaw = extractFunctionBody(fileContent, 'const handleSearchTrip = (query?: string) => {');

const refreshInboundTripsBody = stripTypeScriptTypes(refreshInboundTripsBodyRaw);
const handleSearchTripBody = stripTypeScriptTypes(handleSearchTripBodyRaw);

// Wrappers to run the extracted code
const runExtractedRefreshInboundTrips = async (collaborators: {
  isOnline: boolean;
  authContext: any;
  tripRepository: any;
  indexedDBService: any;
  setInboundTrips: (val: any[]) => void;
  setTripsCache: (val: any[]) => void;
  tripEngineService?: any;
}) => {
  const fn = new Function(
    'isOnline',
    'authContext',
    'tripRepository',
    'indexedDBService',
    'setInboundTrips',
    'setTripsCache',
    'tripEngineService',
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
    collaborators.setTripsCache,
    collaborators.tripEngineService
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

async function main() {
  const originalGetAllTrips = tripEngineService.getAllTrips;
  const originalGetTrips = (tripEngineService as any).getTrips;

  try {
    // Test Block 1: Static Code Analysis & Zero-Reference Check
    runTestBlock('Static Code Analysis & Zero-Reference Check', () => {
      const zeroRefs = !fileContent.includes('tripEngineService');
      const zeroFallbackBlock = !fileContent.includes('allFallback') && !fileContent.includes('tripEngineService.getAllTrips()');
      const inboundsConst = fileContent.includes('const inbounds = all.filter(');
      const cacheStrict = fileContent.includes('setTripsCache(all);');
      
      assert('Zero references to tripEngineService exist in production view', zeroRefs);
      assert('No legacy fallback block exists', zeroFallbackBlock);
      assert('inbounds is declared with const', inboundsConst);
      assert('tripsCache is set strictly to local cache array', cacheStrict);

      if (!zeroRefs || !zeroFallbackBlock || !inboundsConst || !cacheStrict) {
        throw new Error('Static analysis failed');
      }
    });

    // Test Block 2: Connected Legacy Collaborator & Empty Cache Read
    await runTestBlockAsync('Connected Legacy Collaborator & Empty Cache Read', async () => {
      // Instrument legacy spies returning populated legacy fixture data
      let legacyGetAllTripsCalls = 0;
      let legacyGetTripsCalls = 0;
      let searchTripForUnloadingCalls = 0;

      const mockLegacyService = {
        getAllTrips: () => {
          legacyGetAllTripsCalls++;
          return [
            { tripId: 'LEGACY-TRP-01', status: 'IN_TRANSIT' },
            { tripId: 'LEGACY-TRP-02', status: 'ARRIVED' }
          ];
        },
        getTrips: () => {
          legacyGetTripsCalls++;
          return [{ tripId: 'LEGACY-TRP-02', status: 'ARRIVED' }];
        },
        searchTripForUnloading: () => {
          searchTripForUnloadingCalls++;
          return null;
        }
      };

      const memStore = (indexedDBService as any).getMemoryStore('trips');
      memStore.clear();

      const mockTripRepository = {
        listByProject: async (projectId: string) => []
      };

      let inboundTripsState: any[] = ['initial-state-noise'];
      let tripsCacheState: any[] = ['initial-state-noise'];

      let setInboundTripsCalled = false;
      let setTripsCacheCalled = false;

      // Injected tripEngineService explicitly
      await runExtractedRefreshInboundTrips({
        isOnline: false,
        authContext: null,
        tripRepository: mockTripRepository,
        indexedDBService,
        setInboundTrips: (val) => {
          setInboundTripsCalled = true;
          inboundTripsState = val;
        },
        setTripsCache: (val) => {
          setTripsCacheCalled = true;
          tripsCacheState = val;
        },
        tripEngineService: mockLegacyService
      });

      assert('setInboundTrips was called', setInboundTripsCalled);
      assert('setTripsCache was called', setTripsCacheCalled);
      assert('Incoming state is exactly empty []', inboundTripsState.length === 0);
      assert('Search state is exactly empty []', tripsCacheState.length === 0);
      assert('Zero legacy getAllTrips calls made', legacyGetAllTripsCalls === 0);
      assert('Zero legacy getTrips calls made', legacyGetTripsCalls === 0);
      assert('Zero legacy searchTripForUnloading calls made', searchTripForUnloadingCalls === 0);

      if (
        inboundTripsState.length !== 0 ||
        tripsCacheState.length !== 0 ||
        legacyGetAllTripsCalls !== 0 ||
        legacyGetTripsCalls !== 0 ||
        searchTripForUnloadingCalls !== 0
      ) {
        throw new Error('Legacy collaborator invocation check failed');
      }
    });

    // Test Block 3: Nonempty Cache with Zero Inbound Matches
    await runTestBlockAsync('Nonempty Cache with Zero Inbound Matches', async () => {
      const completedTrip = { tripId: 'TRP-COMPLETED-01', status: 'COMPLETED', projectId: 'PRJ-NEOM-001' };
      await indexedDBService.put('trips', completedTrip);

      let inboundTripsState: any[] = ['initial-state-noise'];
      let tripsCacheState: any[] = ['initial-state-noise'];

      await runExtractedRefreshInboundTrips({
        isOnline: false,
        authContext: null,
        tripRepository: { listByProject: async () => [] },
        indexedDBService,
        setInboundTrips: (val) => { inboundTripsState = val; },
        setTripsCache: (val) => { tripsCacheState = val; }
      });

      assert('Inbound queue remains empty', inboundTripsState.length === 0);
      assert('tripsCache matches cache record', tripsCacheState.length === 1 && tripsCacheState[0].tripId === 'TRP-COMPLETED-01');

      if (inboundTripsState.length !== 0 || tripsCacheState.length !== 1) {
        throw new Error('Nonempty cache with zero inbound matches failed');
      }
    });

    // Test Block 4: Hardened Cache-Failure Assertions
    await runTestBlockAsync('Hardened Cache-Failure Assertions', async () => {
      // Initialize state with recognizable, nonempty sentinel data
      let inboundTripsState: any[] = [{ tripId: 'SENTINEL-INBOUND-01' }];
      let tripsCacheState: any[] = [{ tripId: 'SENTINEL-CACHE-01' }];

      let legacyGetAllTripsCalls = 0;
      const mockLegacyService = {
        getAllTrips: () => {
          legacyGetAllTripsCalls++;
          return [{ tripId: 'LEGACY-TRP-01', status: 'IN_TRANSIT' }];
        }
      };

      // Cause canonical cache read to reject
      const originalIndexedDBGetAll = indexedDBService.getAll;
      indexedDBService.getAll = async () => {
        throw new Error('Simulated Cache Read Failure');
      };

      try {
        // Execute the extracted function without test-level catches silently ignoring errors
        await runExtractedRefreshInboundTrips({
          isOnline: false,
          authContext: null,
          tripRepository: { listByProject: async () => [] },
          indexedDBService,
          setInboundTrips: (val) => { inboundTripsState = val; },
          setTripsCache: (val) => { tripsCacheState = val; },
          tripEngineService: mockLegacyService
        });
      } finally {
        // Test cleanup and state restoration in finally
        indexedDBService.getAll = originalIndexedDBGetAll;
      }

      assert('Inbound trips state is reset to length-0 empty array []', inboundTripsState.length === 0);
      assert('Trips cache state is reset to length-0 empty array []', tripsCacheState.length === 0);
      assert('Legacy read counts remain at zero', legacyGetAllTripsCalls === 0);

      if (inboundTripsState.length !== 0 || tripsCacheState.length !== 0 || legacyGetAllTripsCalls !== 0) {
        throw new Error('Hardened cache-failure assertions failed');
      }
    });

    // Test Block 5: Canonical Search and Input Security Rules
    runTestBlock('Canonical Search and Input Security Rules', () => {
      let activeTripResult: any = 'initial';
      let searchFeedbackResult: any = null;
      let selectTripCalled = false;

      // Rule A: Empty search source produces NOT_FOUND
      runExtractedHandleSearchTrip('TRP-1002', {
        searchQuery: '',
        tripsCache: [],
        setActiveTrip: (val) => { activeTripResult = val; },
        setSearchFeedback: (val) => { searchFeedbackResult = val; },
        selectTrip: () => { selectTripCalled = true; }
      });

      assert('Empty search source sets activeTrip to null', activeTripResult === null);
      assert('Empty search source returns NOT_FOUND status', searchFeedbackResult?.status === 'NOT_FOUND');
      assert('selectTrip was not called', !selectTripCalled);

      // Rule B: Plate-only search returns SECURITY
      const dummyCache = [
        {
          tripId: 'TRP-02',
          tripSerial: 'TRP-1002',
          entitySnapshots: { truck: { plateNumberAr: 'أ ب ج 1234' } }
        }
      ];

      let searchFeedbackPlate: any = null;
      let activeTripPlate: any = 'not-null';
      let selectTripCalledPlate = false;

      runExtractedHandleSearchTrip('أ ب ج 1234', {
        searchQuery: '',
        tripsCache: dummyCache,
        setActiveTrip: (val) => { activeTripPlate = val; },
        setSearchFeedback: (val) => { searchFeedbackPlate = val; },
        selectTrip: () => { selectTripCalledPlate = true; }
      });

      assert('Plate-only search sets activeTrip to null', activeTripPlate === null);
      assert('Plate-only search returns SECURITY status', searchFeedbackPlate?.status === 'SECURITY');
      assert('Plate-only search does not invoke selectTrip', !selectTripCalledPlate);

      if (
        activeTripResult !== null ||
        searchFeedbackResult?.status !== 'NOT_FOUND' ||
        activeTripPlate !== null ||
        searchFeedbackPlate?.status !== 'SECURITY' ||
        selectTripCalledPlate
      ) {
        throw new Error('Canonical search and security rules failed');
      }
    });

    // Test Block 6: Existing Project-Scoped Repository Integration
    await runTestBlockAsync('Existing Project-Scoped Repository Integration', async () => {
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

      let inboundTripsState: any[] = [];
      let tripsCacheState: any[] = [];

      await runExtractedRefreshInboundTrips({
        isOnline: true,
        authContext: mockAuthContext,
        tripRepository: onlineTripRepository,
        indexedDBService,
        setInboundTrips: (val) => { inboundTripsState = val; },
        setTripsCache: (val) => { tripsCacheState = val; }
      });

      assert('listByProject was called for all authorized projects', syncedProjects.includes('PRJ-A') && syncedProjects.includes('PRJ-B'));
      assert('Online trips successfully loaded into states', inboundTripsState.length >= 2);

      if (syncedProjects.length < 2 || inboundTripsState.length < 2) {
        throw new Error('Project-scoped repository integration failed');
      }
    });

    console.log(`\n================================================================`);
    console.log(`Focused Test Suite Result: ${passedTests}/${totalTests} Passed (100%)`);
    console.log(`================================================================`);

  } finally {
    // Restore original state and handlers
    tripEngineService.getAllTrips = originalGetAllTrips;
    if (originalGetTrips) {
      (tripEngineService as any).getTrips = originalGetTrips;
    }
    const memStore = (indexedDBService as any).getMemoryStore('trips');
    memStore.clear();
  }
}

main();
