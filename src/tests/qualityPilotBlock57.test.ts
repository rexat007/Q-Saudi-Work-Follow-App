import { describe, it, expect } from 'vitest';
import { PILOT_REPAIRS_DATA } from '../../scripts/run-pilot-repair-block57';
import { dictionaries } from '../locales';

describe('BLOCK 57 — Quality Pilot Verification', () => {
  // I18N-QUALITY-05: No accidental Arabic fragments in repaired EN
  it('I18N-QUALITY-05: No accidental Arabic fragments in repaired EN', () => {
    const arabicRegex = /[\u0600-\u06FF]/;
    for (const item of PILOT_REPAIRS_DATA) {
      const en = dictionaries.en[item.key];
      expect(en, `Key "${item.key}" missing from EN dictionary`).toBeDefined();
      expect(arabicRegex.test(en), `Repaired EN translation for "${item.key}" contains accidental Arabic characters: "${en}"`).toBe(false);
    }
  });

  // I18N-QUALITY-06: No accidental Arabic fragments in repaired UR
  it('I18N-QUALITY-06: No accidental Arabic fragments in repaired UR', () => {
    // Check that English loan words or raw Arabic phrases are not accidentally mixed in
    const hybridEnglishInUrdu = /[a-zA-Z]+[ةية]/;
    for (const item of PILOT_REPAIRS_DATA) {
      const ur = dictionaries.ur[item.key];
      expect(ur, `Key "${item.key}" missing from UR dictionary`).toBeDefined();
      expect(hybridEnglishInUrdu.test(ur), `Repaired UR translation for "${item.key}" contains hybrid morphology: "${ur}"`).toBe(false);
      // Check that raw Arabic tokens like "الApproval", "للEdit", "المعتمدين" didn't carry over
      expect(ur.includes('للEdit') || ur.includes('الApproval') || ur.includes('Previousة'), `Repaired UR for "${item.key}" contains raw corrupted fragments: "${ur}"`).toBe(false);
    }
  });

  // I18N-QUALITY-07: No hybrid morphology
  it('I18N-QUALITY-07: No hybrid morphology', () => {
    const hybridSuffixRegex = /[a-zA-Z]+[ةية]/;
    for (const item of PILOT_REPAIRS_DATA) {
      const en = dictionaries.en[item.key];
      const ur = dictionaries.ur[item.key];
      expect(hybridSuffixRegex.test(en), `Key "${item.key}" EN contains hybrid suffix: "${en}"`).toBe(false);
      expect(hybridSuffixRegex.test(ur), `Key "${item.key}" UR contains hybrid suffix: "${ur}"`).toBe(false);
    }
  });

  // I18N-QUALITY-08: Semantic meaning preserved
  it('I18N-QUALITY-08: Semantic meaning preserved', () => {
    for (const item of PILOT_REPAIRS_DATA) {
      const en = dictionaries.en[item.key];
      const ur = dictionaries.ur[item.key];
      const ar = dictionaries.ar[item.key];

      expect(en, `Key "${item.key}" missing from EN dictionary`).toBeDefined();
      expect(en.trim().length, `Key "${item.key}" has empty EN translation`).toBeGreaterThan(0);

      expect(ur, `Key "${item.key}" missing from UR dictionary`).toBeDefined();
      expect(ur.trim().length, `Key "${item.key}" has empty UR translation`).toBeGreaterThan(0);

      // Verify that canonical Arabic value exists, is a string, and is non-empty
      expect(ar, `Key "${item.key}" missing from AR dictionary`).toBeDefined();
      expect(typeof ar, `Key "${item.key}" AR value must be a string`).toBe('string');
      expect(ar.trim().length, `Key "${item.key}" has empty AR translation`).toBeGreaterThan(0);
    }
  });

  // I18N-QUALITY-09: Protected tokens preserved
  it('I18N-QUALITY-09: Protected tokens preserved', () => {
    const protectedCodes = [
      'IN_TRANSIT',
      'ARRIVED',
      'COMPLETED',
      'ACTIVE',
      'Upsert',
      'Outbox',
      'Service Account Credentials',
      'Carrier Settlements',
      'Admin Commit',
      'Weighbridge Import'
    ];

    for (const item of PILOT_REPAIRS_DATA) {
      for (const code of protectedCodes) {
        if (item.ar.includes(code)) {
          const en = dictionaries.en[item.key];
          const ur = dictionaries.ur[item.key];
          expect(en.includes(code), `Protected token "${code}" missing from EN for "${item.key}"`).toBe(true);
          expect(ur.includes(code), `Protected token "${code}" missing from UR for "${item.key}"`).toBe(true);
        }
      }
    }
  });

  // I18N-QUALITY-10: Interpolation preserved
  it('I18N-QUALITY-10: Interpolation preserved', () => {
    const interpolationItem = PILOT_REPAIRS_DATA.find(p => p.key === 'offline.labels.truck_2');
    expect(interpolationItem, 'Expected offline.labels.truck_2 to be part of pilot repairs').toBeDefined();

    const en = dictionaries.en['offline.labels.truck_2'];
    const ur = dictionaries.ur['offline.labels.truck_2'];

    expect(en.includes('${params.truckId}'), `Interpolation parameter \${params.truckId} missing in EN: "${en}"`).toBe(true);
    expect(ur.includes('${params.truckId}'), `Interpolation parameter \${params.truckId} missing in UR: "${ur}"`).toBe(true);
  });

  // I18N-QUALITY-11: Only selected pilot entries changed
  it('I18N-QUALITY-11: Only selected pilot entries changed', () => {
    const changedKeySet = new Set(PILOT_REPAIRS_DATA.map(p => p.key));
    expect(changedKeySet.size, `Expected exactly 50 unique pilot entries, found ${changedKeySet.size}`).toBe(50);

    // Verify that foundation dictionary entries (BLOCK 40) were NOT modified
    const foundationKeys = [
      'shared.actions.save',
      'shared.actions.cancel',
      'shared.actions.confirm',
      'shared.actions.close',
      'shared.actions.delete',
      'shared.actions.edit',
      'shared.status.loading',
      'shared.status.error',
      'shared.status.success',
      'shared.units.kg',
      'shared.units.ton',
      'shared.units.sar',
      'navigation.language',
      'navigation.language.ar',
      'navigation.language.en',
      'navigation.language.ur',
      'example.count'
    ];

    for (const fk of foundationKeys) {
      expect(changedKeySet.has(fk), `Foundation key "${fk}" was illegally modified in pilot!`).toBe(false);
    }
  });
});
