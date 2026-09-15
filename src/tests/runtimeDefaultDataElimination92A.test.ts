/**
 * Test suite for BLOCK 92A: Runtime Default Data Elimination
 *
 * Verifies that:
 * 1. Hardcoded persona names are removed from navigation role profiles.
 * 2. Master data services start in a genuinely clean runtime state (0 default projects, carriers, materials, trucks, drivers, pricing rules).
 * 3. Exception engine, Pricing service, and Trip engine start clean.
 * 4. I18N key count strictly remains AR = 1128, EN = 1128, UR = 1128.
 */

import { ROLE_PROFILES } from '../services/navigation.service';
import { adminConsoleService } from '../services/adminConsole.service';
import { exceptionEngineService } from '../services/exceptionEngine.service';
import { pricingService } from '../services/pricing.service';
import { tripEngineService } from '../services/tripEngine.service';
import { arTranslations, enTranslations, urTranslations } from '../locales';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
}

console.log('--- RUNNING BLOCK 92A VERIFICATION TESTS ---');

// 1. Navigation Role Profiles Sanitization
console.log('1. Testing Navigation Role Profiles Sanitization...');
const personaNames = ['عبد الرحمن السعدون', 'فهد الشمري', 'خالد القحطاني', 'تركي الدوسري'];
Object.values(ROLE_PROFILES).forEach(profile => {
  personaNames.forEach(persona => {
    assert(
      !profile.userNameAr.includes(persona),
      `ROLE_PROFILE [${profile.userId}] still contains hardcoded persona name: ${persona}`
    );
  });
});
console.log('  ✅ Navigation Role Profiles are completely sanitized.');

// 2. Fresh Master Data Clean State
console.log('2. Testing Fresh AdminConsoleService Clean State...');
assert(
  adminConsoleService.getProjects().length === 0,
  `adminConsoleService should have 0 projects by default, found ${adminConsoleService.getProjects().length}`
);
assert(
  adminConsoleService.getCarriers().length === 0,
  `adminConsoleService should have 0 carriers by default, found ${adminConsoleService.getCarriers().length}`
);
assert(
  adminConsoleService.getMaterials().length === 0,
  `adminConsoleService should have 0 materials by default, found ${adminConsoleService.getMaterials().length}`
);
assert(
  adminConsoleService.getTrucks().length === 0,
  `adminConsoleService should have 0 trucks by default, found ${adminConsoleService.getTrucks().length}`
);
assert(
  adminConsoleService.getDrivers().length === 0,
  `adminConsoleService should have 0 drivers by default, found ${adminConsoleService.getDrivers().length}`
);
assert(
  adminConsoleService.getPricingRules().length === 0,
  `adminConsoleService should have 0 pricing rules by default, found ${adminConsoleService.getPricingRules().length}`
);
console.log('  ✅ AdminConsoleService starts in a clean zero state.');

// 3. Fresh Engine Clean State
console.log('3. Testing Exception, Pricing, and Trip Engines Fresh Clean State...');
assert(
  exceptionEngineService.getAllExceptions().length === 0,
  `exceptionEngineService should have 0 exceptions by default, found ${exceptionEngineService.getAllExceptions().length}`
);
assert(
  pricingService.getRules().length === 0,
  `pricingService should have 0 rules by default, found ${pricingService.getRules().length}`
);
assert(
  tripEngineService.getTrips().length === 0,
  `tripEngineService should have 0 trips by default, found ${tripEngineService.getTrips().length}`
);
console.log('  ✅ All runtime engines start in a clean zero state.');

// 4. I18N Count Audit
console.log('4. Auditing I18N Catalog Counts...');
const arCount = Object.keys(arTranslations).length;
const enCount = Object.keys(enTranslations).length;
const urCount = Object.keys(urTranslations).length;

console.log(`  AR translation count: ${arCount}`);
console.log(`  EN translation count: ${enCount}`);
console.log(`  UR translation count: ${urCount}`);

assert(arCount === 1128, `Expected AR = 1128, got ${arCount}`);
assert(enCount === 1128, `Expected EN = 1128, got ${enCount}`);
assert(urCount === 1128, `Expected UR = 1128, got ${urCount}`);
console.log('  ✅ I18N counts remain strictly AR = 1,128, EN = 1,128, UR = 1,128.');

console.log('--- ALL BLOCK 92A TESTS PASSED SUCCESSFULLY ---');
