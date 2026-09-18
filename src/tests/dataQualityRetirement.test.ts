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
  const importCenterContent = fs.readFileSync(importCenterPath, 'utf8');
  const navServiceContent = fs.readFileSync(navServicePath, 'utf8');

  it('1. App.tsx does not mount DataQualityView through activeTab DATA_QUALITY', () => {
    expect(appContent).not.toMatch(/activeTab\s*===\s*['"]DATA_QUALITY['"]/);
    expect(appContent).not.toContain('<DataQualityView');
  });

  it('2. App.tsx has no production DataQualityView import', () => {
    expect(appContent).not.toMatch(/import\s+.*DataQualityView.*from/);
  });

  it('3. ImportCenterView does not render DataQualityView', () => {
    expect(importCenterContent).not.toContain('<DataQualityView');
    expect(importCenterContent).not.toMatch(/import\s+.*DataQualityView.*from/);
  });

  it('4. ImportCenterView has no DATA_QUALITY production sub-tab trigger', () => {
    expect(importCenterContent).not.toMatch(/setCenterSubTab\(\s*['"]DATA_QUALITY['"]\s*\)/);
    expect(importCenterContent).not.toContain('محرك جودة البيانات (Data Quality Engine)');
    expect(importCenterContent).not.toMatch(/centerSubTab\s*===\s*['"]DATA_QUALITY['"]/);
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

  it('6. IMPORT_CENTER remains present and authorized exactly as before', () => {
    expect(navigationService.isTabAuthorizedForRole('IMPORT_CENTER', 'SUPER_ADMIN')).toBe(true);
    expect(navigationService.isTabAuthorizedForRole('IMPORT_CENTER', 'PROJECT_ADMIN')).toBe(true);
    expect(navigationService.isTabAuthorizedForRole('IMPORT_CENTER', 'SCALE_OPERATOR')).toBe(false);
    expect(navigationService.isTabAuthorizedForRole('IMPORT_CENTER', 'DRIVER')).toBe(false);

    const superAdminSystemTools = navigationService.getAuthorizedSystemTools('SUPER_ADMIN');
    expect(superAdminSystemTools.map(t => t.id)).toContain('IMPORT_CENTER');
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

  it('10. ImportCenter canonical project binding remains intact', () => {
    expect(importCenterContent).toContain('selectedProjectId?: string');
    expect(importCenterContent).toContain('carrierRepository.subscribeByProject');
    expect(importCenterContent).toContain('driverRepository.subscribeByProject');
    expect(importCenterContent).toContain('truckRepository.subscribeByProject');
    expect(importCenterContent).toContain('materialRepository.subscribeByProject');
  });

  it('11. ImportCenter still uses buildRelationshipContextFromCanonical', () => {
    expect(importCenterContent).toContain('buildRelationshipContextFromCanonical');
  });

  it('12. ImportCenter contains zero legacy buildRelationshipContext calls', () => {
    expect(importCenterContent).not.toMatch(/[^FromCanonical]\s*buildRelationshipContext\(/);
    expect(importCenterContent).not.toContain('buildRelationshipContext("ALL")');
    expect(importCenterContent).not.toContain("buildRelationshipContext('ALL')");
  });

  it('13. DataQuality legacy builder reference is isolated in retained diagnostic component', () => {
    const dqContent = fs.readFileSync(dataQualityViewPath, 'utf8');
    expect(dqContent).toContain("buildRelationshipContext('PRJ-NEOM-001')");
    // Ensure no production app entry references DataQualityView
    expect(appContent).not.toContain('DataQualityView');
    expect(importCenterContent).not.toContain('DataQualityView');
  });

  it('14. No replacement developer/test control added to production UI', () => {
    expect(importCenterContent).not.toContain('Quality Engine');
    expect(appContent).not.toContain('data-quality-sandbox');
  });
});
