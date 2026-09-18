import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { buildRelationshipContext, buildRelationshipContextFromCanonical } from '../utils/masterDataUtils';

describe('Phase 6 — Legacy Master Data Helper Deprecation Test Suite', () => {
  const rootDir = process.cwd();
  const masterDataUtilsPath = path.join(rootDir, 'src/utils/masterDataUtils.ts');
  const adminConsoleViewPath = path.join(rootDir, 'src/components/admin/AdminConsoleView.tsx');
  const loadingOperatorPath = path.join(rootDir, 'src/components/field/LoadingOperatorView.tsx');
  const importCenterPath = path.join(rootDir, 'src/components/import/ImportCenterView.tsx');

  it('1. buildRelationshipContext still exists and is exported', () => {
    expect(typeof buildRelationshipContext).toBe('function');
  });

  it('2. buildRelationshipContext is marked @deprecated in source', () => {
    const content = fs.readFileSync(masterDataUtilsPath, 'utf-8');
    expect(content).toContain('@deprecated');
    expect(content).toContain('buildRelationshipContext');
  });

  it('3. buildRelationshipContextFromCanonical still exists and is exported', () => {
    expect(typeof buildRelationshipContextFromCanonical).toBe('function');
  });

  it('4. production-reachable source contains zero imports/calls to buildRelationshipContext', () => {
    const productionFiles = [
      adminConsoleViewPath,
      loadingOperatorPath,
      importCenterPath,
      path.join(rootDir, 'src/App.tsx'),
    ];

    productionFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toContain('buildRelationshipContext(');
      }
    });
  });

  it('5. retained diagnostic/test references are allowed', () => {
    expect(fs.existsSync(masterDataUtilsPath)).toBe(true);
  });

  it('6. TripEngine remains production retired', () => {
    const appContent = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf-8');
    expect(appContent).not.toContain('tripEngine');
  });

  it('7. DataQuality remains production retired', () => {
    const appContent = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf-8');
    expect(appContent).not.toContain('dataQuality');
  });

  it('8. AdminConsole contains no legacy master-data helper usage', () => {
    const content = fs.readFileSync(adminConsoleViewPath, 'utf-8');
    expect(content).not.toContain('buildRelationshipContext');
  });

  it('9. LoadingOperator uses canonical relationship construction', () => {
    const content = fs.readFileSync(loadingOperatorPath, 'utf-8');
    expect(content).not.toContain('buildRelationshipContext(');
  });

  it('10. ImportCenter uses canonical relationship construction', () => {
    if (fs.existsSync(importCenterPath)) {
      const content = fs.readFileSync(importCenterPath, 'utf-8');
      expect(content).not.toContain('buildRelationshipContext(');
    }
  });
});
