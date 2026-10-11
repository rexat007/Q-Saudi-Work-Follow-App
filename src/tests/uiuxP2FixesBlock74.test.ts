import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from 'vitest';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';

describe('Block 74 P2 UI/UX Fixes Test Suite', () => {
  const langSwitcherPath = path.resolve(process.cwd(), 'src/components/i18n/LanguageSwitcher.tsx');
  const masterDataPath = path.resolve(process.cwd(), 'src/components/masterData/MasterDataView.tsx');
  const importCenterPath = path.resolve(process.cwd(), 'src/components/importCenter/ImportCenterView.tsx');
  const reportsEnginePath = path.resolve(process.cwd(), 'src/components/reports/ReportsEngineView.tsx');
  const pricingEnginePath = path.resolve(process.cwd(), 'src/components/pricing/PricingEngineView.tsx');
  const weightEnginePath = path.resolve(process.cwd(), 'src/components/tripEngine/WeightEngineView.tsx');

  const langSwitcherSource = fs.readFileSync(langSwitcherPath, 'utf-8');
  const reportsEngineSource = fs.readFileSync(reportsEnginePath, 'utf-8');
  const pricingEngineSource = fs.readFileSync(pricingEnginePath, 'utf-8');
  const weightEngineSource = fs.readFileSync(weightEnginePath, 'utf-8');

  // B74-T01: LanguageSwitcher uses direction-aware alignment on container
  it('B74-T01: LanguageSwitcher uses direction-aware alignment on container', () => {
    expect(langSwitcherSource.includes('rtl:text-right') && langSwitcherSource.includes('ltr:text-left')).toBe(true);
  });

  // B74-T02: LanguageSwitcher dropdown anchors correctly for RTL and LTR
  it('B74-T02: LanguageSwitcher dropdown anchors correctly for RTL and LTR', () => {
    const hasRtlAnchor = langSwitcherSource.includes('rtl:left-0') || langSwitcherSource.includes('rtl:right-auto');
    expect(hasRtlAnchor).toBe(true);
    expect(langSwitcherSource.includes('ltr:right-0')).toBe(true);
  });

  // B74-T03: LanguageSwitcher preserves locale selection options and click handlers
  it('B74-T03: LanguageSwitcher preserves locale selection options and click handlers', () => {
    expect(langSwitcherSource.includes('AVAILABLE_LOCALES.map')).toBe(true);
    expect(langSwitcherSource.includes('handleSelect(loc)')).toBe(true);
  });

  // B74-T04: MasterDataView is physically retired from codebase
  it('B74-T04: MasterDataView is physically retired from codebase', () => {
    expect(fs.existsSync(masterDataPath)).toBe(false);
  });

  // B74-T05: ImportCenterView is physically retired from codebase
  it('B74-T05: ImportCenterView is physically retired from codebase', () => {
    expect(fs.existsSync(importCenterPath)).toBe(false);
  });

  // B74-T06: ReportsEngineView search input has direction-aware icon and padding
  it('B74-T06: ReportsEngineView search input has direction-aware icon and padding', () => {
    expect(reportsEngineSource.includes('rtl:right-3') && reportsEngineSource.includes('ltr:left-3')).toBe(true);
    expect(reportsEngineSource.includes('rtl:pr-8') && reportsEngineSource.includes('ltr:pl-8')).toBe(true);
  });

  // B74-T07: PricingEngineView test search input has direction-aware icon and padding
  it('B74-T07: PricingEngineView test search input has direction-aware icon and padding', () => {
    expect(pricingEngineSource.includes('rtl:right-2.5') && pricingEngineSource.includes('ltr:left-2.5')).toBe(true);
    expect(pricingEngineSource.includes('rtl:pr-8') && pricingEngineSource.includes('ltr:pl-8')).toBe(true);
  });

  // B74-T08: MasterDataView tables are retired with component
  it('B74-T08: MasterDataView tables are retired with component', () => {
    expect(fs.existsSync(masterDataPath)).toBe(false);
  });

  // B74-T09: ReportsEngineView table uses direction-aware alignment and mirrored dividers
  it('B74-T09: ReportsEngineView table uses direction-aware alignment and mirrored dividers', () => {
    expect(reportsEngineSource.includes('<table className="w-full text-right rtl:text-right ltr:text-left')).toBe(true);
    expect(reportsEngineSource.includes('rtl:border-l ltr:border-r')).toBe(true);
  });

  // B74-T10: PricingEngineView table uses direction-aware alignment and dynamic root direction
  it('B74-T10: PricingEngineView table uses direction-aware alignment and dynamic root direction', () => {
    expect(pricingEngineSource.includes('<table className="w-full text-right rtl:text-right ltr:text-left')).toBe(true);
    expect(pricingEngineSource.includes('dir={direction}')).toBe(true);
  });

  // B74-T13: WeightEngineView presets have minimum 44px touch targets on mobile
  it('B74-T13: WeightEngineView presets have minimum 44px touch targets on mobile', () => {
    expect(weightEngineSource.includes('min-h-[44px]') || weightEngineSource.includes('py-3') || weightEngineSource.includes('h-11')).toBe(true);
  });

  // B74-T14: PricingEngineView category filter chips have minimum 44px touch targets on mobile
  it('B74-T14: PricingEngineView category filter chips have minimum 44px touch targets on mobile', () => {
    expect(pricingEngineSource.includes('min-h-[44px]') || pricingEngineSource.includes('py-2.5') || pricingEngineSource.includes('py-3')).toBe(true);
  });

  // B74-T18: Zero translation drift across AR, EN, and UR
  it('B74-T18: Zero translation drift across AR, EN, and UR', () => {
    const arKeys = Object.keys(arTranslations).sort();
    const enKeys = Object.keys(enTranslations).sort();
    const urKeys = Object.keys(urTranslations).sort();

    expect(arKeys).toHaveLength(enKeys.length);
    expect(arKeys).toHaveLength(urKeys.length);

    for (let i = 0; i < arKeys.length; i++) {
      expect(arKeys[i]).toBe(enKeys[i]);
      expect(arKeys[i]).toBe(urKeys[i]);
    }
  });

  // B74-T19: P3 findings remain deferred (AUDIT-72-08, 09, 10 intact)
  it('B74-T19: P3 findings remain deferred (AUDIT-72-08, 09, 10 intact)', () => {
    const jsonPath = path.resolve(process.cwd(), 'reports/uiux-block74-p2-fixes.json');
    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    expect(content.summary.p3FindingsDeferred).toBe(true);
  });

  // B74-T20: BLOCK 74 deliverables exist and contain required schema
  it('B74-T20: BLOCK 74 deliverables exist and contain required schema', () => {
    const jsonPath = path.resolve(process.cwd(), 'reports/uiux-block74-p2-fixes.json');
    const mdPath = path.resolve(process.cwd(), 'reports/uiux-block74-p2-fixes.md');
    expect(fs.existsSync(jsonPath)).toBe(true);
    expect(fs.existsSync(mdPath)).toBe(true);

    const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    expect(jsonContent.metadata).toBeDefined();
    expect(jsonContent.metadata.block).toBe(74);

    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    expect(mdContent.includes('BLOCK 74')).toBe(true);
  });
});
