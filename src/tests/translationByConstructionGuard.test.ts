/**
 * BLOCK — Translation-by-Construction Regression Guard Test Suite
 * Purpose: TRANSLATION_BY_CONSTRUCTION_REGRESSION_GUARD
 * 
 * Inspects active production UI source across operational areas and validates
 * that unmanaged hardcoded user-facing strings and known defect strings
 * are strictly routed through canonical i18n dictionaries (AR, EN, UR).
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Translation-by-Construction Regression Guard', () => {
  const rootDir = process.cwd();

  const readSource = (relativePath: string): string => {
    const fullPath = path.resolve(rootDir, relativePath);
    if (!fs.existsSync(fullPath)) return '';
    return fs.readFileSync(fullPath, 'utf8');
  };

  const stripCommentsAndImports = (content: string): string => {
    return content
      // Remove multiline comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove singleline comments
      .replace(/\/\/.*$/gm, '')
      // Remove import statements
      .replace(/^import\s+[\s\S]*?from\s+['"].*?['"];?/gm, '');
  };

  const defectStrings = [
    'FIELD OPERATIONS SUITE',
    'Loading Operator',
    'CAPTURE & VALIDATE',
    'IDENTIFY',
    'Tare Weight',
    'Gross Weight',
    'Net Weight',
  ];

  const operationalUiFiles = [
    'src/components/field/LoadingOperatorView.tsx',
    'src/components/field/UnloadingOperatorView.tsx',
    'src/components/field/FieldOperationsView.tsx',
    'src/components/tripEngine/WeightEngineView.tsx',
    'src/components/tripEngine/LoadingStation.tsx',
    'src/components/tripEngine/UnloadingStation.tsx',
    'src/components/dashboard/OperationsDashboardView.tsx',
  ];

  it('TBC-01: Operational UI components exist and use managed translation keys', () => {
    for (const file of operationalUiFiles) {
      const content = readSource(file);
      expect(content.length, `Expected ${file} to exist and not be empty`).toBeGreaterThan(0);
      expect(content, `Expected ${file} to consume i18n translation hooks`).toMatch(/t\(|useI18n|useTranslation/);
    }
  });

  it('TBC-02: Known defect strings are not hardcoded in active operational UI JSX code', () => {
    for (const file of operationalUiFiles) {
      const rawContent = readSource(file);
      const codeOnly = stripCommentsAndImports(rawContent);

      for (const defect of defectStrings) {
        // Must not contain raw JSX text or template literals with the defect strings
        const defectRegex = new RegExp(`>\\s*[^<]*${defect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*<|'[^']*${defect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^']*'|"[^"]*${defect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"]*"`, 'i');
        
        // Exclude allowed translation keys or identifiers
        const matches = codeOnly.match(defectRegex);
        if (matches) {
          // Verify match is not an i18n key lookup or benign prop
          const isBenign = matches[0].includes('t(') || matches[0].includes('i18n') || matches[0].includes('field_operations.') || matches[0].includes('weighbridge.');
          expect(isBenign, `Found unmanaged hardcoded defect string "${defect}" in ${file}: ${matches[0]}`).toBe(true);
        }
      }
    }
  });

  it('TBC-03: Field Operations views adhere to i18n direction and translation contracts', () => {
    const fieldOps = readSource('src/components/field/FieldOperationsView.tsx');
    expect(fieldOps).not.toMatch(/dir="rtl"/);
    expect(fieldOps).toMatch(/dir=\{isRTL \? 'rtl' : 'ltr'\}/);

    const loadingOp = readSource('src/components/field/LoadingOperatorView.tsx');
    expect(loadingOp).toMatch(/field_operations\.loading_operator/);
    expect(loadingOp).toMatch(/field_operations\.identify/);
    expect(loadingOp).toMatch(/field_operations\.capture_validate/);

    const unloadingOp = readSource('src/components/field/UnloadingOperatorView.tsx');
    expect(unloadingOp).toMatch(/field_operations\.unloading_operator/);
    expect(unloadingOp).toMatch(/field_operations\.identify_unloading/);
    expect(unloadingOp).toMatch(/field_operations\.capture_validate_dest/);
  });

  it('TBC-04: Trip & Weight Engines use managed weight translation keys', () => {
    const weightEngine = readSource('src/components/tripEngine/WeightEngineView.tsx');
    expect(weightEngine).toMatch(/field_operations\.step6_tare_kg/);
    expect(weightEngine).toMatch(/field_operations\.step7_gross_kg/);

    const loadingStation = readSource('src/components/tripEngine/LoadingStation.tsx');
    expect(loadingStation).toMatch(/field_operations\.step6_tare/);
    expect(loadingStation).toMatch(/field_operations\.step7_gross/);
    expect(loadingStation).toMatch(/field_operations\.net_weight_label/);
  });

  it('TBC-05: Navigation & Sidebar UI elements use managed translation keys', () => {
    const sidebar = readSource('src/components/navigation/Sidebar.tsx');
    expect(sidebar).toMatch(/navigation\.labels\.provision_new_project/);
    expect(sidebar).toMatch(/navigation\.labels\.system_tools/);
  });

  it('TBC-06: Operations Dashboard enforces dynamic direction and auth i18n', () => {
    const dashboard = readSource('src/components/dashboard/OperationsDashboardView.tsx');
    expect(dashboard).not.toMatch(/dir="rtl"/);
    expect(dashboard).toMatch(/dir=\{isRTL \? 'rtl' : 'ltr'\}/);
  });

  it('TBC-07: Smart Import components adhere to translation contracts', () => {
    const smartImportFiles = [
      'src/components/smartImport/SmartImportModal.tsx',
      'src/components/smartImport/ImportCenter.tsx'
    ];
    for (const sif of smartImportFiles) {
      const content = readSource(sif);
      if (content) {
        expect(content).toMatch(/t\(|useTranslation|useI18n/);
      }
    }
  });

  it('TBC-08: Full locale dictionary structural parity for AR, EN, UR', () => {
    const arPath = path.resolve(rootDir, 'src/locales/ar/index.ts');
    const enPath = path.resolve(rootDir, 'src/locales/en/index.ts');
    const urPath = path.resolve(rootDir, 'src/locales/ur/index.ts');

    expect(fs.existsSync(arPath)).toBe(true);
    expect(fs.existsSync(enPath)).toBe(true);
    expect(fs.existsSync(urPath)).toBe(true);

    const arContent = fs.readFileSync(arPath, 'utf8');
    const enContent = fs.readFileSync(enPath, 'utf8');
    const urContent = fs.readFileSync(urPath, 'utf8');

    const requiredKeys = [
      'field_operations.suite_title',
      'field_operations.subtitle',
      'field_operations.loading_operator',
      'field_operations.unloading_operator',
      'field_operations.supervision',
      'field_operations.driver',
      'field_operations.identify',
      'field_operations.identify_unloading',
      'field_operations.capture_validate',
      'field_operations.capture_validate_dest',
      'field_operations.tare_weight',
      'field_operations.gross_weight',
      'field_operations.net_weight',
      'field_operations.calculated_net_weight',
      'field_operations.dest_net_weight',
      'field_operations.loading_station_tab',
      'field_operations.unloading_station_tab',
      'field_operations.active_project',
      'field_operations.step6_tare',
      'field_operations.step6_tare_kg',
      'field_operations.step7_gross',
      'field_operations.step7_gross_kg',
      'field_operations.net_weight_label',
      'field_operations.calculate_net_formula',
      'navigation.labels.provision_new_project',
      'navigation.labels.system_tools',
    ];

    for (const key of requiredKeys) {
      expect(arContent, `Key "${key}" must exist in Arabic locale dictionary`).toContain(`"${key}"`);
      expect(enContent, `Key "${key}" must exist in English locale dictionary`).toContain(`"${key}"`);
      expect(urContent, `Key "${key}" must exist in Urdu locale dictionary`).toContain(`"${key}"`);
    }
  });
});
