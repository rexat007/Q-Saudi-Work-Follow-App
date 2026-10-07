/**
 * Test suite for BLOCK 92A: Runtime Default Data Elimination
 *
 * Verifies that:
 * 1. Hardcoded persona names are removed from navigation role profiles.
 * 2. Master data services start in a genuinely clean runtime state (0 default projects, carriers, materials, trucks, drivers, pricing rules).
 * 3. Exception engine, Pricing service, and Trip engine start clean.
 * 4. I18N key count strictly remains AR = 1128, EN = 1128, UR = 1128.
 */

import { describe, it, expect } from 'vitest';
import { ROLE_PROFILES } from '../services/navigation.service';
import { adminConsoleService } from '../services/adminConsole.service';
import { exceptionEngineService } from '../services/exceptionEngine.service';
import { pricingService } from '../services/pricing.service';
import { tripEngineService } from '../services/tripEngine.service';
import { arTranslations, enTranslations, urTranslations } from '../locales';

describe('BLOCK 92A — Runtime Default Data Elimination', () => {
  it('Navigation role profiles contain no prohibited hardcoded persona names', () => {
    const personaNames = ['عبد الرحمن السعدون', 'فهد الشمري', 'خالد القحطاني', 'تركي الدوسري'];
    Object.values(ROLE_PROFILES).forEach(profile => {
      personaNames.forEach(persona => {
        expect(profile.userNameAr).not.toContain(persona);
      });
    });
  });

  it('Master data services start in a genuinely clean runtime state (0 default projects, carriers, materials, trucks, drivers, pricing rules)', () => {
    expect(adminConsoleService.getProjects()).toHaveLength(0);
    expect(adminConsoleService.getCarriers()).toHaveLength(0);
    expect(adminConsoleService.getMaterials()).toHaveLength(0);
    expect(adminConsoleService.getTrucks()).toHaveLength(0);
    expect(adminConsoleService.getDrivers()).toHaveLength(0);
    expect(adminConsoleService.getPricingRules()).toHaveLength(0);
  });

  it('Exception engine clean-state assertions', () => {
    expect(exceptionEngineService.getAllExceptions()).toHaveLength(0);
  });

  it('Pricing service clean-state assertions', () => {
    expect(pricingService.getRules()).toHaveLength(0);
  });

  it('Trip engine clean-state assertions', () => {
    expect(tripEngineService.getTrips()).toHaveLength(0);
  });

  it('I18N key counts strictly remain AR = 1128, EN = 1128, UR = 1128', () => {
    const arCount = Object.keys(arTranslations).length;
    const enCount = Object.keys(enTranslations).length;
    const urCount = Object.keys(urTranslations).length;

    expect(arCount).toBe(1128);
    expect(enCount).toBe(1128);
    expect(urCount).toBe(1128);
  });
});
