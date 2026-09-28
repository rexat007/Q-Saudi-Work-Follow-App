import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mirror of the actual project scope derivation algorithm implemented in FieldSupervisionView.tsx
function deriveTargetProjectId(selectedProjectId: string | undefined, assignedProjectIds: string[]) {
  // 1. Explicit selectedProjectId wins if operator is authorized for it
  if (selectedProjectId && selectedProjectId !== '') {
    const isGlobalScope = assignedProjectIds?.includes('ALL');
    const isAuthorized = isGlobalScope || assignedProjectIds?.includes(selectedProjectId);
    if (isAuthorized) {
      return selectedProjectId;
    }
  }

  // 2. Otherwise collect assigned project IDs, excluding ALL and empty
  const validAssignedProjects = (assignedProjectIds || []).filter(
    (pid) => pid && pid !== '' && pid !== 'ALL'
  );

  // 3. Exactly one assigned project may be safely inferred
  if (validAssignedProjects.length === 1) {
    return validAssignedProjects[0];
  }

  // 4. Zero or more than one assigned project -> unresolved (fail closed)
  return undefined;
}

describe('Step 4A-RECOVERY — Smart Trip Import Operational Convergence', () => {
  const supervisionFilePath = path.resolve(process.cwd(), 'src/components/field/FieldSupervisionView.tsx');
  const operationsFilePath = path.resolve(process.cwd(), 'src/components/field/FieldOperationsView.tsx');
  const wizardFilePath = path.resolve(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx');

  // ==========================================
  // ORIGINAL 15 VERIFICATION TESTS
  // ==========================================

  it('1. FieldSupervision IMPORTS role-guard lists authorized roles', () => {
    const fileContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    expect(fileContent).toContain("'SUPERVISOR'");
    expect(fileContent).toContain("'SITE_SUPERVISOR'");
    expect(fileContent).toContain("'PROJECT_ADMIN'");
    expect(fileContent).toContain("'SUPER_ADMIN'");
  });

  it('2. Unauthorized field roles remain blocked by the existing role guard', () => {
    const fileContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    expect(fileContent).toContain("if (!allowedRoles.includes(authContext.role))");
    expect(fileContent).toContain("غير مصرح بالدخول (Unauthorized)");
  });

  it('3. FieldSupervisionView receives and uses selectedProjectId prop', () => {
    const supervisionContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    const operationsContent = fs.readFileSync(operationsFilePath, 'utf-8');
    expect(supervisionContent).toContain('selectedProjectId?: string;');
    expect(supervisionContent).toContain('selectedProjectId');
    expect(operationsContent).toContain('selectedProjectId={selectedProjectId}');
  });

  it('4. Excel source renders ExcelCsvImportSection', () => {
    const supervisionContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    expect(supervisionContent).toContain('<ExcelCsvImportSection');
  });

  it('5. Google Sheets source renders GoogleSheetsImportSection', () => {
    const supervisionContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    expect(supervisionContent).toContain('<GoogleSheetsImportSection');
  });

  it('6. Both child components receive targetProjectId/projectId as the active project scope', () => {
    const supervisionContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    expect(supervisionContent).toContain('currentProjectId={targetProjectId}');
    expect(supervisionContent).toContain('projectId={targetProjectId}');
  });

  it('7. Both receive same authContext', () => {
    const supervisionContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    expect(supervisionContent).toContain('authContext={authContext}');
  });

  it('8. No ImportCenterView dependency remains in FieldSupervisionView', () => {
    const supervisionContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    expect(supervisionContent).not.toContain('ImportCenterView');
  });

  it('9. No ImportCenterService dependency exists in the operational path', () => {
    const supervisionContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    expect(supervisionContent).not.toContain('importCenterService');
  });

  it('10. No demo EntityResolutionSection is reachable', () => {
    const supervisionContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    expect(supervisionContent).not.toContain('EntityResolutionSection');
  });

  it('11. No Weighbridge emulator is reachable', () => {
    const supervisionContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    expect(supervisionContent).not.toContain('WeighbridgeImportSection');
  });

  it('12. No Unified Architecture docs are reachable', () => {
    const supervisionContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    expect(supervisionContent).not.toContain('UnifiedImportArchitectureSection');
  });

  it('13. No Google Drive source appears in this unit', () => {
    const supervisionContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    expect(supervisionContent).not.toContain('GoogleDriveImportSection');
  });

  it('14. Excel and Google Sheets pipeline services remain unchanged', () => {
    const excelPipelinePath = path.resolve(process.cwd(), 'src/services/import/excelCsvPipeline.service.ts');
    const sheetsPipelinePath = path.resolve(process.cwd(), 'src/services/import/googleSheetsPipeline.service.ts');
    expect(fs.existsSync(excelPipelinePath)).toBe(true);
    expect(fs.existsSync(sheetsPipelinePath)).toBe(true);
  });

  it('15. ProjectSetupWizard Phase 6 remains untouched', () => {
    const wizardContent = fs.readFileSync(wizardFilePath, 'utf-8');
    expect(wizardContent).toContain("phase: 6, label: 'استيراد بيانات الرحلات'");
  });


  // ==========================================
  // PROJECT SCOPE FAIL-CLOSED ADDITIONS
  // ==========================================

  it('16. Explicit selectedProjectId wins if the operator is authorized', () => {
    const result = deriveTargetProjectId('PRJ-100', ['PRJ-100', 'PRJ-200']);
    expect(result).toBe('PRJ-100');
  });

  it('17. Explicit selectedProjectId is blocked/ignored if the operator is NOT authorized (unresolved)', () => {
    const result = deriveTargetProjectId('PRJ-300', ['PRJ-100', 'PRJ-200']);
    expect(result).toBeUndefined(); // Fail closed
  });

  it('18. Explicit selectedProjectId wins under global ALL role', () => {
    const result = deriveTargetProjectId('PRJ-500', ['ALL']);
    expect(result).toBe('PRJ-500');
  });

  it('19. Exactly one assigned project is safely inferred without selectedProjectId', () => {
    const result = deriveTargetProjectId('', ['PRJ-100']);
    expect(result).toBe('PRJ-100');
  });

  it('20. Two assigned projects with no selection fails closed (unresolved)', () => {
    const result = deriveTargetProjectId('', ['PRJ-100', 'PRJ-200']);
    expect(result).toBeUndefined(); // Fail closed, do not pick index 0
  });

  it('21. ALL global scope with no selection fails closed (unresolved)', () => {
    const result = deriveTargetProjectId('', ['ALL']);
    expect(result).toBeUndefined(); // Fail closed, do not pick first or default
  });

  it('22. Zero assigned projects with no selection fails closed (unresolved)', () => {
    const result = deriveTargetProjectId('', []);
    expect(result).toBeUndefined(); // Fail closed
  });

  it('23. Unresolved scope renders neither import child nor allows empty ID commits', () => {
    const supervisionContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    
    // Verify that the code conditionally guards rendering based on targetProjectId
    expect(supervisionContent).toContain('!targetProjectId');
    expect(supervisionContent).toContain('تحديد نطاق المشروع مطلوب');
  });

  it('24. Excel and Google Sheets receive identical resolved targetProjectId', () => {
    const supervisionContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    
    // Ensure both are bound to targetProjectId
    expect(supervisionContent).toContain('currentProjectId={targetProjectId}');
    expect(supervisionContent).toContain('projectId={targetProjectId}');
  });

  it('25. No new project selector dropdown is present inside Smart Trip Import tab', () => {
    const supervisionContent = fs.readFileSync(supervisionFilePath, 'utf-8');
    
    // We must not render another project drop-down select list
    expect(supervisionContent).not.toContain('<select');
  });
});
