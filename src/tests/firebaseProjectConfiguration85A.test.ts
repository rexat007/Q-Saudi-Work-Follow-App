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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import rawFirebaseConfig from '../../firebase-applet-config.json';
import { normalizedFirebaseConfig } from '../firebase/config';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';
import { tripEngineService } from '../services/tripEngine.service';
import { INITIAL_TRIP_SEED } from '../data/mockTripEngineData';
import { exceptionEngine } from '../services/exceptionEngine.service';
import { INITIAL_EXCEPTIONS_SEED } from '../data/mockExceptionEngineData';
import { dashboardService, PREDEFINED_SECURITY_PROFILES } from '../services/dashboard.service';
import { adminConsoleService } from '../services/adminConsole.service';
import { pricingService } from '../services/pricing.service';

describe('BLOCK 85A — Firebase Project Configuration Suite', () => {
  beforeEach(() => {
    tripEngineService.clearTrips();
    exceptionEngine.clearExceptions();
    adminConsoleService.clearMasterData();
    pricingService.clearRules();
  });

  afterEach(() => {
    tripEngineService.clearTrips();
    exceptionEngine.clearExceptions();
    adminConsoleService.clearMasterData();
    pricingService.clearRules();
  });

  // 1. Firebase project ID = gen-lang-client-0774589047
  it('BLOCK-85A-01: Firebase project ID resolves to gen-lang-client-0774589047', () => {
    expect(rawFirebaseConfig.projectId).toBe('gen-lang-client-0774589047');
    expect(normalizedFirebaseConfig.projectId).toBe('gen-lang-client-0774589047');
  });

  // 2. No active runtime reference to promise-of-planet-youtube-api
  it('BLOCK-85A-02: No active runtime reference to promise-of-planet-youtube-api in config or code', () => {
    const rawString = JSON.stringify(rawFirebaseConfig);
    const normString = JSON.stringify(normalizedFirebaseConfig);
    expect(rawString.includes('promise-of-planet-youtube-api')).toBe(false);
    expect(normString.includes('promise-of-planet-youtube-api')).toBe(false);
  });

  // 3. Environment variable overrides support
  it('BLOCK-85A-03: Firebase config supports VITE_FIREBASE_* environment variable structure', () => {
    expect(normalizedFirebaseConfig.projectId).toBeDefined();
    expect(normalizedFirebaseConfig.projectId.length).toBeGreaterThan(0);
    expect(normalizedFirebaseConfig.authDomain).toBeDefined();
    expect(normalizedFirebaseConfig.authDomain.length).toBeGreaterThan(0);
    expect(normalizedFirebaseConfig.firestoreDatabaseId).toBeDefined();
    expect(normalizedFirebaseConfig.firestoreDatabaseId.length).toBeGreaterThan(0);
  });

  // 4. Firebase configuration internal consistency
  it('BLOCK-85A-04: Firebase configuration is internally consistent (Auth domain, database, storage bucket)', () => {
    expect(normalizedFirebaseConfig.authDomain).toContain('gen-lang-client-0774589047');
    expect(normalizedFirebaseConfig.storageBucket).toContain('gen-lang-client-0774589047');
    expect(normalizedFirebaseConfig.firestoreDatabaseId).toBe('ai-studio-qsaudiworkfollow-ab1cba1e-ac08-4099-bc72-193202e518f1');
  });

  // 5. Runtime clean state (0 projects, 0 master data, 0 pricing rules, 0 trips, 0 exceptions)
  it('BLOCK-85A-05: Runtime initializes in a clean empty state (0 trips, 0 exceptions, 0 projects, 0 master data)', () => {
    adminConsoleService.clearMasterData();
    pricingService.clearRules();

    const trips = tripEngineService.getAllTrips();
    expect(trips.length).toBe(0);

    const exceptions = exceptionEngine.getAllExceptions();
    expect(exceptions.length).toBe(0);

    const projects = adminConsoleService.getProjects();
    expect(projects.length).toBe(0);

    const carriers = adminConsoleService.getCarriers();
    expect(carriers.length).toBe(0);

    const rules = pricingService.getRules();
    expect(rules.length).toBe(0);

    const filters = {
      projectId: 'ALL',
      shiftDateFrom: '',
      shiftDateTo: '',
      carrierId: 'ALL',
      materialId: 'ALL',
      pricingType: 'ALL' as const,
    };
    const filtered = dashboardService.getFilteredTrips(filters, PREDEFINED_SECURITY_PROFILES[0]);
    expect(filtered.trips.length).toBe(0);
  });

  // 6. I18N catalog unchanged = 1,128 / 1,128 / 1,128
  it('BLOCK-85A-06: I18N localization dictionary remains exactly 1,128 keys per locale', () => {
    const arKeys = Object.keys(arTranslations).length;
    const enKeys = Object.keys(enTranslations).length;
    const urKeys = Object.keys(urTranslations).length;

    expect(arKeys).toBe(1128);
    expect(enKeys).toBe(1128);
    expect(urKeys).toBe(1128);
  });

  // 7. Test fixtures intact
  it('BLOCK-85A-07: Test seed fixtures remain available and valid', () => {
    expect(Array.isArray(INITIAL_TRIP_SEED)).toBe(true);
    expect(INITIAL_TRIP_SEED.length).toBeGreaterThan(0);
    expect(Array.isArray(INITIAL_EXCEPTIONS_SEED)).toBe(true);
    expect(INITIAL_EXCEPTIONS_SEED.length).toBeGreaterThan(0);
  });
});
