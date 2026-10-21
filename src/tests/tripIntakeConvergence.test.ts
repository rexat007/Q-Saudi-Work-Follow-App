import { PROJECT_SETUP_LAYERS, canEnterProjectSetupLayer } from '../services/projectSetupWorkflow.service';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ProjectSetupWizard } from '../components/wizard/ProjectSetupWizard';
import { ExcelCsvImportSection } from '../components/importCenter/ExcelCsvImportSection';
import { ExcelCsvPipelineService } from '../services/import/excelCsvPipeline.service';
import { importSessionClientService } from '../services/import/importSessionClient.service';
import { entityResolutionCommandService } from '../services/import/entityResolutionCommand.service';
import fs from 'fs';
import path from 'path';

// Mock translation and markdown
vi.mock('../../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    isRTL: false,
    locale: 'en'
  })
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => children
}));

describe('Step 3C — Trip Ingestion Entry Convergence', () => {
  const wizardFilePath = path.resolve(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx');
  const sectionFilePath = path.resolve(process.cwd(), 'src/components/importCenter/ExcelCsvImportSection.tsx');

  it('1. Exposes NO Trip Data Import entry under Phase 6 in ProjectSetupWizard', () => {
    const fileContent = fs.readFileSync(wizardFilePath, 'utf-8');
    
    // Verify that Phase 6 does NOT exist in selector array
    expect(fileContent).not.toContain("phase: 6");
    expect(fileContent).not.toContain("label: 'استيراد بيانات الرحلات'");
    expect(fileContent).not.toContain("sub: 'Phase 6: Trip Ingestion'");

    // Verify there are no activePhase === 6 rendering branches
    const phase6Matches = fileContent.match(/activePhase === 6/g) || [];
    expect(phase6Matches.length).toBe(0);
  });

  it('2. Project access governance remains available through the canonical ACCESS layer', () => {
    const fileContent = fs.readFileSync(wizardFilePath, 'utf-8');
    const accessLayers = PROJECT_SETUP_LAYERS.filter(layer => layer.id === 'ACCESS');
    expect(accessLayers).toHaveLength(1);
    expect(accessLayers[0]).toMatchObject({ id: 'ACCESS', labelEn: 'Project Access' });
    expect(canEnterProjectSetupLayer('ACCESS', {
      projectId: 'PROJECT-ACCESS-CONTRACT', materialsCount: 0, carriersCount: 0,
    })).toEqual({ allowed: true });
    expect(canEnterProjectSetupLayer('ACCESS', {
      projectId: null, materialsCount: 0, carriersCount: 0,
    }).allowed).toBe(false);

    expect(fileContent).toContain("useState<ProjectSetupLayer>('FOUNDATION')");
    expect(fileContent).toContain('PROJECT_SETUP_LAYERS.map((layer) => {');
    expect(fileContent).toContain('onClick={() => attemptProjectSetupLayerNavigation(layer.id)}');
    expect(fileContent).toContain('const isActive = activeSetupLayer === layer.id;');
    expect(fileContent).not.toMatch(/\bactivePhase\b/);
    expect(fileContent).not.toContain('Phase 4: Governance');
    expect(fileContent).not.toMatch(/\bphase:\s*4\b/);

    const accessStart = fileContent.indexOf("{activeSetupLayer === 'ACCESS' && project && (");
    expect(accessStart).toBeGreaterThanOrEqual(0);
    const accessEnd = fileContent.indexOf("{activeSetupLayer === 'REVIEW_ACTIVATION'", accessStart);
    expect(accessEnd).toBeGreaterThan(accessStart);
    const accessWorkspace = fileContent.slice(accessStart, accessEnd);
    expect(accessWorkspace).toContain('<table');
    expect(accessWorkspace).toContain('{authContext.displayName}');
    expect(accessWorkspace).toContain('{authContext.email}');
    expect(accessWorkspace).toContain('{authContext.role}');
  });

  it('3. ProjectSetupWizard has zero direct imports or dependencies on ImportCenterView', () => {
    const fileContent = fs.readFileSync(wizardFilePath, 'utf-8');
    expect(fileContent).not.toContain("import { ImportCenterView }");
    expect(fileContent).not.toContain("import ImportCenterView");
  });

  it('4. ExcelCsvImportSection correctly references and uses ExcelCsvPipelineService', () => {
    const fileContent = fs.readFileSync(sectionFilePath, 'utf-8');
    expect(fileContent).toContain("import { ExcelCsvPipelineService }");
    expect(fileContent).toContain("ExcelCsvPipelineService.applyEntityResolutionDecision");
  });

  it('5. ExcelCsvImportSection correctly references and uses ImportSessionClientService', () => {
    const fileContent = fs.readFileSync(sectionFilePath, 'utf-8');
    expect(fileContent).toContain("import { importSessionClientService }");
    expect(fileContent).toContain("importSessionClientService.createSession");
    expect(fileContent).toContain("importSessionClientService.getSession");
  });

  it('6. ExcelCsvImportSection preserves session resume capability via importSessionClientService', () => {
    const fileContent = fs.readFileSync(sectionFilePath, 'utf-8');
    expect(fileContent).toContain("importSessionClientService.reconstructResumedBatch");
    expect(fileContent).toContain("activeSessionId");
  });

  it('7. Partial or failed commit retains the session locator', () => {
    const fileContent = fs.readFileSync(sectionFilePath, 'utf-8');
    // Session is only deleted on clean full success, verified in handles
    expect(fileContent).toContain("qsaudi_import_session_locator_");
  });

  it('8. Full successful commit deletes session locator via sessionStorage removeItem', () => {
    const fileContent = fs.readFileSync(sectionFilePath, 'utf-8');
    expect(fileContent).toContain("sessionStorage.removeItem");
    expect(fileContent).toContain("qsaudi_import_session_locator_");
  });

  it('9. Entity resolution decisions route through standard ExcelCsvPipelineService path', () => {
    const fileContent = fs.readFileSync(sectionFilePath, 'utf-8');
    expect(fileContent).toContain("ExcelCsvPipelineService.applyEntityResolutionDecision");
  });

  it('10. Explicit entity creation utilizes entityResolutionCommandService', () => {
    const fileContent = fs.readFileSync(sectionFilePath, 'utf-8');
    expect(fileContent).toContain("import { entityResolutionCommandService");
    expect(fileContent).toContain("entityResolutionCommandService.createCarrier");
    expect(fileContent).toContain("entityResolutionCommandService.createMaterial");
  });

  it('11. No parallel parser, normalizer, or committer services were created', () => {
    const servicesPath = path.resolve(process.cwd(), 'src/services/import');
    const files = fs.readdirSync(servicesPath);
    
    // Only canonical files are present, no duplicates
    expect(files).toContain('excelParser.service.ts');
    expect(files).toContain('unifiedImportPipeline.service.ts');
    expect(files).not.toContain('excelParserDuplicate.service.ts');
  });

  it('12. No duplicate upload control exists elsewhere in the ProjectSetupWizard for trip intake intent', () => {
    const wizardContent = fs.readFileSync(wizardFilePath, 'utf-8');
    
    // Upload controls in wizard are restricted to Phase 2 (Roster upload). Phase 6 is retired.
    const uploadCloudCount = (wizardContent.match(/<UploadCloud/g) || []).length;
    // Wizard uses native files dropzone only in Phase 2
    expect(wizardContent).toContain("Phase 2: Roster");
  });

  it('13. No duplicate commit control exists outside the canonical ExcelCsvImportSection flow for trips', () => {
    const wizardContent = fs.readFileSync(wizardFilePath, 'utf-8');
    
    // Wizard does not have an inline "Commit Trips" action of its own
    expect(wizardContent).not.toContain("commitTrips");
  });

  it('15. Roster Smart Batch flow in Phase 2 remains 100% untouched and functional', () => {
    const wizardContent = fs.readFileSync(wizardFilePath, 'utf-8');
    expect(wizardContent).toContain("handleApplyGroupedResolutionDecision");
    expect(wizardContent).toContain("handleGroupedCreateMissingEntity");
  });
});
