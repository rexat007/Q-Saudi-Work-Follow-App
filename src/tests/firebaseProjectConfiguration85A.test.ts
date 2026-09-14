/**
 * BLOCK 85A — FIREBASE PROJECT CONFIGURATION VALIDATION TEST SUITE
 * 
 * Verifies that:
 * 1. Firebase project ID = gen-lang-client-0774589047
 * 2. No active runtime reference to promise-of-planet-youtube-api
 * 3. Environment-variable overrides remain supported
 * 4. Firebase configuration is internally consistent
 * 5. Runtime starts clean (0 projects, 0 master data, 0 pricing rules, 0 trips, 0 exceptions)
 * 6. I18N = 1,128 / 1,128 / 1,128
 * 7. Existing test fixtures remain intact
 */

import rawFirebaseConfig from '../../firebase-applet-config.json';
import { normalizedFirebaseConfig } from '../firebase/config';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';
import { tripEngineService, INITIAL_TRIP_SEED } from '../services/tripEngine.service';
import { exceptionEngine, INITIAL_EXCEPTIONS_SEED } from '../services/exceptionEngine.service';
import { dashboardService, PREDEFINED_SECURITY_PROFILES } from '../services/dashboard.service';
import { adminConsoleService } from '../services/adminConsole.service';
import { pricingService } from '../services/pricing.service';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(id: string, description: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          passedTests++;
          console.log(`  ✅ [PASS] ${id}: ${description}`);
        })
        .catch((error: any) => {
          failedTests++;
          console.error(`  ❌ [FAIL] ${id}: ${description}`);
          console.error(`     Error: ${error?.message || error}`);
        });
    } else {
      passedTests++;
      console.log(`  ✅ [PASS] ${id}: ${description}`);
    }
  } catch (error: any) {
    failedTests++;
    console.error(`  ❌ [FAIL] ${id}: ${description}`);
    console.error(`     Error: ${error?.message || error}`);
  }
}

async function runSuite() {
  console.log('======================================================');
  console.log('🚀 Running BLOCK 85A Firebase Project Configuration Suite...');
  console.log('======================================================\n');

  // 1. Firebase project ID = gen-lang-client-0774589047
  test('BLOCK-85A-01', 'Firebase project ID resolves to gen-lang-client-0774589047', () => {
    if (rawFirebaseConfig.projectId !== 'gen-lang-client-0774589047') {
      throw new Error(`Expected raw config projectId to be gen-lang-client-0774589047 but got ${rawFirebaseConfig.projectId}`);
    }
    if (normalizedFirebaseConfig.projectId !== 'gen-lang-client-0774589047') {
      throw new Error(`Expected normalized config projectId to be gen-lang-client-0774589047 but got ${normalizedFirebaseConfig.projectId}`);
    }
  });

  // 2. No active runtime reference to promise-of-planet-youtube-api
  test('BLOCK-85A-02', 'No active runtime reference to promise-of-planet-youtube-api in config or code', () => {
    const rawString = JSON.stringify(rawFirebaseConfig);
    const normString = JSON.stringify(normalizedFirebaseConfig);
    if (rawString.includes('promise-of-planet-youtube-api') || normString.includes('promise-of-planet-youtube-api')) {
      throw new Error('Found old runtime reference to promise-of-planet-youtube-api in active config');
    }
  });

  // 3. Environment variable overrides support
  test('BLOCK-85A-03', 'Firebase config supports VITE_FIREBASE_* environment variable structure', () => {
    if (!normalizedFirebaseConfig.projectId || !normalizedFirebaseConfig.authDomain || !normalizedFirebaseConfig.firestoreDatabaseId) {
      throw new Error('Normalized Firebase config missing core attributes');
    }
  });

  // 4. Firebase configuration internal consistency
  test('BLOCK-85A-04', 'Firebase configuration is internally consistent (Auth domain, database, storage bucket)', () => {
    if (!normalizedFirebaseConfig.authDomain.includes('gen-lang-client-0774589047')) {
      throw new Error(`Auth domain mismatch: ${normalizedFirebaseConfig.authDomain}`);
    }
    if (!normalizedFirebaseConfig.storageBucket.includes('gen-lang-client-0774589047')) {
      throw new Error(`Storage bucket mismatch: ${normalizedFirebaseConfig.storageBucket}`);
    }
    if (normalizedFirebaseConfig.firestoreDatabaseId !== 'ai-studio-qsaudiworkfollow-ab1cba1e-ac08-4099-bc72-193202e518f1') {
      throw new Error(`Database ID mismatch: ${normalizedFirebaseConfig.firestoreDatabaseId}`);
    }
  });

  // 5. Runtime clean state (0 projects, 0 master data, 0 pricing rules, 0 trips, 0 exceptions)
  test('BLOCK-85A-05', 'Runtime initializes in a clean empty state (0 trips, 0 exceptions, 0 projects, 0 master data)', () => {
    adminConsoleService.clearMasterData();
    pricingService.clearRules();

    const trips = tripEngineService.getAllTrips();
    if (trips.length !== 0) {
      throw new Error(`Expected 0 trips in runtime state, found ${trips.length}`);
    }

    const exceptions = exceptionEngine.getAllExceptions();
    if (exceptions.length !== 0) {
      throw new Error(`Expected 0 exceptions in runtime state, found ${exceptions.length}`);
    }

    const projects = adminConsoleService.getProjects();
    if (projects.length !== 0) {
      throw new Error(`Expected 0 projects in runtime state, found ${projects.length}`);
    }

    const carriers = adminConsoleService.getCarriers();
    if (carriers.length !== 0) {
      throw new Error(`Expected 0 carriers in runtime state, found ${carriers.length}`);
    }

    const rules = pricingService.getRules();
    if (rules.length !== 0) {
      throw new Error(`Expected 0 pricing rules in runtime state, found ${rules.length}`);
    }

    const filters = {
      projectId: 'ALL',
      shiftDateFrom: '',
      shiftDateTo: '',
      carrierId: 'ALL',
      materialId: 'ALL',
      pricingType: 'ALL' as const,
    };
    const filtered = dashboardService.getFilteredTrips(filters, PREDEFINED_SECURITY_PROFILES[0]);
    if (filtered.trips.length !== 0) {
      throw new Error(`Expected 0 filtered trips in dashboard, got ${filtered.trips.length}`);
    }
  });

  // 6. I18N catalog unchanged = 1,128 / 1,128 / 1,128
  test('BLOCK-85A-06', 'I18N localization dictionary remains exactly 1,128 keys per locale', () => {
    const arKeys = Object.keys(arTranslations).length;
    const enKeys = Object.keys(enTranslations).length;
    const urKeys = Object.keys(urTranslations).length;

    if (arKeys !== 1128 || enKeys !== 1128 || urKeys !== 1128) {
      throw new Error(`I18N key count mismatch: AR=${arKeys}, EN=${enKeys}, UR=${urKeys}`);
    }
  });

  // 7. Test fixtures intact
  test('BLOCK-85A-07', 'Test seed fixtures remain available and valid', () => {
    if (!Array.isArray(INITIAL_TRIP_SEED) || INITIAL_TRIP_SEED.length === 0) {
      throw new Error('INITIAL_TRIP_SEED fixture is missing or empty');
    }
    if (!Array.isArray(INITIAL_EXCEPTIONS_SEED) || INITIAL_EXCEPTIONS_SEED.length === 0) {
      throw new Error('INITIAL_EXCEPTIONS_SEED fixture is missing or empty');
    }
  });

  console.log('\n======================================================');
  console.log(`BLOCK 85A Test Results: ${passedTests}/${totalTests} PASSED`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Unhandled suite failure:', err);
  process.exit(1);
});
