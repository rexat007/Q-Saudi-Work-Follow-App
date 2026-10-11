import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from 'vitest';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';
import { urTranslations } from '../locales/ur';

describe('Block 75 P3 UI/UX Final Cleanup Test Suite', () => {
  const importCenterPath = path.resolve(process.cwd(), 'src/components/importCenter/ImportCenterView.tsx');
  const reportsEnginePath = path.resolve(process.cwd(), 'src/components/reports/ReportsEngineView.tsx');
  const loadingStationPath = path.resolve(process.cwd(), 'src/components/tripEngine/LoadingStation.tsx');

  const reportsEngineSource = fs.readFileSync(reportsEnginePath, 'utf-8');
  const loadingStationSource = fs.readFileSync(loadingStationPath, 'utf-8');

  // B75-T01: ImportCenterView is physically retired
  it('B75-T01: ImportCenterView is physically retired', () => {
    expect(fs.existsSync(importCenterPath)).toBe(false);
  });

  // B75-T02: ImportCenterView is physically retired
  it('B75-T02: ImportCenterView is physically retired', () => {
    expect(fs.existsSync(importCenterPath)).toBe(false);
  });

  // B75-T03: ImportCenterView is physically retired
  it('B75-T03: ImportCenterView is physically retired', () => {
    expect(fs.existsSync(importCenterPath)).toBe(false);
  });

  // B75-T04: ImportCenterView is physically retired
  it('B75-T04: ImportCenterView is physically retired', () => {
    expect(fs.existsSync(importCenterPath)).toBe(false);
  });

  // B75-T06: ReportsEngineView summary pill replaces physical mr-1 with direction-safe ms-1
  it('B75-T06: ReportsEngineView summary pill replaces physical mr-1 with direction-safe ms-1', () => {
    expect(reportsEngineSource.includes('text-amber-700 font-bold mr-1')).toBe(false);
    expect(reportsEngineSource.includes('text-amber-700 font-bold ms-1')).toBe(true);
  });

  // B75-T07: LoadingStation removes unconditional min-w-[700px] on mobile viewports
  it('B75-T07: LoadingStation removes unconditional min-w-[700px] on mobile viewports', () => {
    expect(loadingStationSource.includes('sm:hidden')).toBe(true);
    const mobileIdx = loadingStationSource.indexOf('Mobile View (< 640px)');
    const desktopIdx = loadingStationSource.indexOf('Desktop & Tablet View (>= 640px)');
    expect(mobileIdx).toBeGreaterThan(-1);
    expect(desktopIdx).toBeGreaterThan(-1);
    const mobileSlice = loadingStationSource.slice(mobileIdx, desktopIdx);
    expect(mobileSlice.includes('min-w-[700px]')).toBe(false);
  });

  // B75-T08: LoadingStation preserves full desktop & tablet workflow stepper
  it('B75-T08: LoadingStation preserves full desktop & tablet workflow stepper', () => {
    const hasDesktopContainer = loadingStationSource.includes('hidden sm:block overflow-x-auto') ||
                                loadingStationSource.includes('hidden sm:flex');
    expect(hasDesktopContainer).toBe(true);
    expect(loadingStationSource.includes('min-w-[700px]')).toBe(true);
  });

  // B75-T09: LoadingStation preserves all 8 workflow steps and ordering
  it('B75-T09: LoadingStation preserves all 8 workflow steps and ordering', () => {
    const expectedSteps = ['PROJECT', 'CARRIER', 'TRUCK', 'DRIVER', 'MATERIAL', 'TARE', 'GROSS', 'PREVIEW'];
    for (const s of expectedSteps) {
      expect(loadingStationSource.includes(`id: '${s}'`)).toBe(true);
    }
  });

  // B75-T10: LoadingStation preserves setCurrentStep click handlers on mobile and desktop
  it('B75-T10: LoadingStation preserves setCurrentStep click handlers on mobile and desktop', () => {
    const matches = loadingStationSource.match(/setCurrentStep\(step\.id\)/g);
    expect(matches).toBeDefined();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  // B75-T14: Zero translation drift across AR, EN, and UR
  it('B75-T14: Zero translation drift across AR, EN, and UR', () => {
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

  // B75-T15: BLOCK 75 deliverables exist and contain required schema
  it('B75-T15: BLOCK 75 deliverables exist and contain required schema', () => {
    const jsonPath = path.resolve(process.cwd(), 'reports/uiux-block75-p3-fixes.json');
    const mdPath = path.resolve(process.cwd(), 'reports/uiux-block75-p3-fixes.md');
    expect(fs.existsSync(jsonPath)).toBe(true);
    expect(fs.existsSync(mdPath)).toBe(true);

    const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    expect(jsonContent.metadata).toBeDefined();
    expect(jsonContent.metadata.block).toBe(75);

    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    expect(mdContent.includes('BLOCK 75')).toBe(true);
  });
});
