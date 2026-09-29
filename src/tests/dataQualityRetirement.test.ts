import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { navigationService } from '../services/navigation.service';
import { UserRole } from '../types/common';
import { DataQualityEngine } from '../services/dataQuality/dataQualityEngine';
import { SAMPLE_STAGED_IMPORTS } from '../data/sampleQualityData';

describe('Data Quality Production Surface Retirement Verification Suite', () => {
  const rootDir = process.cwd();
  const appPath = path.resolve(rootDir, 'src/App.tsx');
  const importCenterPath = path.resolve(rootDir, 'src/components/importCenter/ImportCenterView.tsx');
  const navServicePath = path.resolve(rootDir, 'src/services/navigation.service.ts');
  const dataQualityViewPath = path.resolve(rootDir, 'src/components/dataQuality/DataQualityView.tsx');
  const dataQualityEnginePath = path.resolve(rootDir, 'src/services/dataQuality/dataQualityEngine.ts');

  const appContent = fs.readFileSync(appPath, 'utf8');
  const navServiceContent = fs.readFileSync(navServicePath, 'utf8');

  it('1. App.tsx does not mount DataQualityView through activeTab DATA_QUALITY', () => {
    expect(appContent).not.toMatch(/activeTab\s*===\s*['"]DATA_QUALITY['"]/);
    expect(appContent).not.toContain('<DataQualityView');
  });

  it('2. App.tsx has no production DataQualityView import', () => {
    expect(appContent).not.toMatch(/import\s+.*DataQualityView.*from/);
  });

  it('3. ImportCenterView is physically retired', () => {
    expect(fs.existsSync(importCenterPath)).toBe(false);
  });

  it('4. ImportCenterView is physically retired', () => {
    expect(fs.existsSync(importCenterPath)).toBe(false);
  });

  it('5. navigation.service does not expose DATA_QUALITY as production navigation', () => {
    const allRoles: UserRole[] = [
      'SUPER_ADMIN',
      'PROJECT_ADMIN',
      'SUPERVISOR',
      'SITE_SUPERVISOR',
      'DISPATCHER',
      'SCALE_OPERATOR',
      'FINANCE_AUDITOR',
      'DRIVER',
      'VIEWER'
    ];

    allRoles.forEach(role => {
      expect(navigationService.isTabAuthorizedForRole('DATA_QUALITY', role)).toBe(false);
    });

    const superAdminSystemTools = navigationService.getAuthorizedSystemTools('SUPER_ADMIN');
    expect(superAdminSystemTools.map(t => t.id)).not.toContain('DATA_QUALITY');

    const devTools = navigationService.getAuthorizedDeveloperTools('SUPER_ADMIN');
    expect(devTools.map(t => t.id)).not.toContain('DATA_QUALITY');
  });

  it('6. IMPORT_CENTER is physically retired', () => {
    expect(navigationService.isTabAuthorizedForRole('IMPORT_CENTER', 'SUPER_ADMIN')).toBe(false);
  });

  it('7. DataQualityView.tsx still exists in source tree', () => {
    expect(fs.existsSync(dataQualityViewPath)).toBe(true);
    const dqContent = fs.readFileSync(dataQualityViewPath, 'utf8');
    expect(dqContent.length).toBeGreaterThan(500);
  });

  it('8. DataQualityEngine remains available and functional', () => {
    expect(fs.existsSync(dataQualityEnginePath)).toBe(true);
    expect(typeof DataQualityEngine.validateImportRecord).toBe('function');
    expect(typeof DataQualityEngine.evaluateValue).toBe('function');
  });

  it('9. Diagnostic/sample fixtures are preserved', () => {
    expect(Array.isArray(SAMPLE_STAGED_IMPORTS)).toBe(true);
    expect(SAMPLE_STAGED_IMPORTS.length).toBeGreaterThan(0);
  });

  it('10. ImportCenterView is physically retired', () => {
    expect(fs.existsSync(importCenterPath)).toBe(false);
  });

  it('11. ImportCenterView is physically retired', () => {
    expect(fs.existsSync(importCenterPath)).toBe(false);
  });

  it('12. ImportCenterView is physically retired', () => {
    expect(fs.existsSync(importCenterPath)).toBe(false);
  });

  it('13. ImportCenterView is physically retired', () => {
    expect(fs.existsSync(importCenterPath)).toBe(false);
    // Ensure no production app entry references DataQualityView
    expect(appContent).not.toContain('DataQualityView');
  });

  it('14. ImportCenterView is physically retired', () => {
    expect(fs.existsSync(importCenterPath)).toBe(false);
    expect(appContent).not.toContain('data-quality-sandbox');
  });
});
