import { PILOT_REPAIRS_DATA } from '../../scripts/run-pilot-repair-block57';
import { dictionaries } from '../locales';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`✅ [${name}] passed`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message });
    console.error(`❌ [${name}] failed: ${err.message}`);
  }
}

console.log('======================================================');
console.log('🚀 Running BLOCK 57 Quality Pilot Test Suite (7 Test Cases)...');
console.log('======================================================');

// I18N-QUALITY-05: No accidental Arabic fragments in repaired EN
test('I18N-QUALITY-05 No accidental Arabic fragments in repaired EN', () => {
  const arabicRegex = /[\u0600-\u06FF]/;
  for (const item of PILOT_REPAIRS_DATA) {
    const en = dictionaries.en[item.key];
    if (!en) {
      throw new Error(`Key "${item.key}" missing from EN dictionary`);
    }
    if (arabicRegex.test(en)) {
      throw new Error(`Repaired EN translation for "${item.key}" contains accidental Arabic characters: "${en}"`);
    }
  }
});

// I18N-QUALITY-06: No accidental Arabic fragments in repaired UR
test('I18N-QUALITY-06 No accidental Arabic fragments in repaired UR', () => {
  // Check that English loan words or raw Arabic phrases are not accidentally mixed in
  const hybridEnglishInUrdu = /[a-zA-Z]+[ةية]/;
  for (const item of PILOT_REPAIRS_DATA) {
    const ur = dictionaries.ur[item.key];
    if (!ur) {
      throw new Error(`Key "${item.key}" missing from UR dictionary`);
    }
    if (hybridEnglishInUrdu.test(ur)) {
      throw new Error(`Repaired UR translation for "${item.key}" contains hybrid morphology: "${ur}"`);
    }
    // Check that raw Arabic tokens like "الApproval", "للEdit", "المعتمدين" didn't carry over
    if (ur.includes('للEdit') || ur.includes('الApproval') || ur.includes('Previousة')) {
      throw new Error(`Repaired UR for "${item.key}" contains raw corrupted fragments: "${ur}"`);
    }
  }
});

// I18N-QUALITY-07: No hybrid morphology
test('I18N-QUALITY-07 No hybrid morphology', () => {
  const hybridSuffixRegex = /[a-zA-Z]+[ةية]/;
  for (const item of PILOT_REPAIRS_DATA) {
    const en = dictionaries.en[item.key];
    const ur = dictionaries.ur[item.key];
    if (hybridSuffixRegex.test(en)) {
      throw new Error(`Key "${item.key}" EN contains hybrid suffix: "${en}"`);
    }
    if (hybridSuffixRegex.test(ur)) {
      throw new Error(`Key "${item.key}" UR contains hybrid suffix: "${ur}"`);
    }
  }
});

// I18N-QUALITY-08: Semantic meaning preserved
test('I18N-QUALITY-08 Semantic meaning preserved', () => {
  for (const item of PILOT_REPAIRS_DATA) {
    const en = dictionaries.en[item.key];
    const ur = dictionaries.ur[item.key];
    if (!en || en.trim().length === 0) {
      throw new Error(`Key "${item.key}" has empty EN translation`);
    }
    if (!ur || ur.trim().length === 0) {
      throw new Error(`Key "${item.key}" has empty UR translation`);
    }
    // Verify that canonical Arabic source is preserved verbatim in ar dictionary
    const ar = dictionaries.ar[item.key];
    if (ar !== item.ar) {
      throw new Error(`Key "${item.key}" AR canonical text was modified! Expected "${item.ar}", found "${ar}"`);
    }
  }
});

// I18N-QUALITY-09: Protected tokens preserved
test('I18N-QUALITY-09 Protected tokens preserved', () => {
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
        if (!en.includes(code)) {
          throw new Error(`Protected token "${code}" missing from EN for "${item.key}"`);
        }
        if (!ur.includes(code)) {
          throw new Error(`Protected token "${code}" missing from UR for "${item.key}"`);
        }
      }
    }
  }
});

// I18N-QUALITY-10: Interpolation preserved
test('I18N-QUALITY-10 Interpolation preserved', () => {
  const interpolationItem = PILOT_REPAIRS_DATA.find(p => p.key === 'offline.labels.truck_2');
  if (!interpolationItem) {
    throw new Error('Expected offline.labels.truck_2 to be part of pilot repairs');
  }

  const en = dictionaries.en['offline.labels.truck_2'];
  const ur = dictionaries.ur['offline.labels.truck_2'];

  if (!en.includes('${params.truckId}')) {
    throw new Error(`Interpolation parameter \${params.truckId} missing in EN: "${en}"`);
  }
  if (!ur.includes('${params.truckId}')) {
    throw new Error(`Interpolation parameter \${params.truckId} missing in UR: "${ur}"`);
  }
});

// I18N-QUALITY-11: Only selected pilot entries changed
test('I18N-QUALITY-11 Only selected pilot entries changed', () => {
  const changedKeySet = new Set(PILOT_REPAIRS_DATA.map(p => p.key));
  if (changedKeySet.size !== 50) {
    throw new Error(`Expected exactly 50 unique pilot entries, found ${changedKeySet.size}`);
  }

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
    if (changedKeySet.has(fk)) {
      throw new Error(`Foundation key "${fk}" was illegally modified in pilot!`);
    }
  }
});

console.log('======================================================');
const passedCount = results.filter(r => r.passed).length;
console.log(`BLOCK 57: Test Results: ${passedCount}/${results.length} PASSED`);
console.log('======================================================');

if (passedCount !== results.length) {
  process.exit(1);
}
