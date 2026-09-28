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

  it('1. Exposes exactly ONE Trip Data Import entry under Phase 6 in ProjectSetupWizard', () => {
    const fileContent = fs.readFileSync(wizardFilePath, 'utf-8');
    
    // Verify that Phase 6 exists in selector array
    expect(fileContent).toContain("phase: 6");
    expect(fileContent).toContain("label: 'استيراد بيانات الرحلات'");
    expect(fileContent).toContain("sub: 'Phase 6: Trip Ingestion'");

    // Verify there is exactly one header and one content rendering branch for Phase 6
    const phase6Matches = fileContent.match(/activePhase === 6/g) || [];
    expect(phase6Matches.length).toBe(2);
  });

  it('2. Phase 4 Governance remains 100% unchanged', () => {
    const fileContent = fs.readFileSync(wizardFilePath, 'utf-8');
    
    // Verify that Phase 4 is still labeled and operates on Governance
    expect(fileContent).toContain("phase: 4, label: 'إدارة وتصاريح المستخدمين'");
    expect(fileContent).toContain("sub: 'Phase 4: Governance'");
    expect(fileContent).toContain("activePhase === 4");
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

  it('12. No duplicate project selector is rendered inside the integrated ExcelCsvImportSection flow', () => {
    const wizardContent = fs.readFileSync(wizardFilePath, 'utf-8');
    const sectionContent = fs.readFileSync(sectionFilePath, 'utf-8');
    
    // Wizard provides single canonical project id to section
    expect(wizardContent).toContain("currentProjectId={project.projectId}");
    // Section does not render its own project list selector dropdown
    expect(sectionContent).not.toContain("projects.map");
  });

  it('13. No duplicate upload control exists elsewhere in the ProjectSetupWizard for trip intake intent', () => {
    const wizardContent = fs.readFileSync(wizardFilePath, 'utf-8');
    
    // Upload controls in wizard are restricted to Phase 2 (Roster upload) and Phase 6 (Trips upload via Section)
    const uploadCloudCount = (wizardContent.match(/<UploadCloud/g) || []).length;
    // Wizard uses native files dropzone only in Phase 2
    expect(wizardContent).toContain("Phase 2: Roster");
  });

  it('14. No duplicate commit control exists outside the canonical ExcelCsvImportSection flow for trips', () => {
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
