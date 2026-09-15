import { PricingRule } from '../types/pricing';

export type MasterPricingRule = PricingRule;

export const MASTER_PRICING_RULES: MasterPricingRule[] = [
  {
    pricingRuleId: 'PRC-NEOM-HAUL-TON-8.5',
    projectId: 'PRJ-NEOM-001',
    name: 'تسعيرة توريد ركام بازلتي - نيوم (8.5 ر.س / طن)',
    pricingType: 'PER_TON',
    rate: 8.5,
    agreedRate: 8.5,
    currency: 'SAR',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    carrierId: 'CAR-ALMAJDOUIE',
    materialId: 'MAT-AGG-01',
    status: 'ACTIVE'
  },
  {
    pricingRuleId: 'PRC-NEOM-SHORT-TRIP-120',
    projectId: 'PRJ-NEOM-001',
    name: 'مقطوعية نقل وتفريغ موقعية (120 ر.س / رد)',
    pricingType: 'PER_TRIP',
    rate: 120.0,
    agreedRate: 120.0,
    currency: 'SAR',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    carrierId: 'CAR-ALMAJDOUIE',
    materialId: 'MAT-AGG-01',
    status: 'ACTIVE'
  },
  {
    pricingRuleId: 'PRC-NEOM-AGG-TON',
    projectId: 'PRJ-NEOM-001',
    name: 'تسعيرة ركام بازلتي - نيوم بالطن',
    pricingType: 'PER_TON',
    rate: 48.5,
    agreedRate: 48.5,
    currency: 'SAR',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    carrierId: 'CAR-ALMAJDOUIE',
    materialId: 'MAT-AGG-01',
    status: 'ACTIVE'
  },
  {
    pricingRuleId: 'PRC-NEOM-SND-TRIP',
    projectId: 'PRJ-NEOM-001',
    name: 'مقطوعية نقل رمل ردميات بالرد',
    pricingType: 'PER_TRIP',
    rate: 1400.0,
    agreedRate: 1400.0,
    currency: 'SAR',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    carrierId: 'CAR-BINLADIN',
    materialId: 'MAT-SND-01',
    status: 'ACTIVE'
  },
  {
    pricingRuleId: 'PRC-NEOM-EXPIRED',
    projectId: 'PRJ-NEOM-001',
    name: 'تسعيرة منتهية الصلاحية (للاختبار الرقابي)',
    pricingType: 'PER_TON',
    rate: 35.0,
    agreedRate: 35.0,
    currency: 'SAR',
    effectiveFrom: '2025-01-01',
    effectiveTo: '2025-12-31', // Expired!
    status: 'ACTIVE'
  },
  {
    pricingRuleId: 'PRC-NEOM-INACTIVE',
    projectId: 'PRJ-NEOM-001',
    name: 'تسعيرة معطلة غير نشطة (INACTIVE)',
    pricingType: 'PER_TON',
    rate: 40.0,
    agreedRate: 40.0,
    currency: 'SAR',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    status: 'INACTIVE'
  }
];
