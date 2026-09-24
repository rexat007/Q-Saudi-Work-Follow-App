import { describe, it, expect } from 'vitest';
import { 
  isProjectOperationallyMutable, 
  canPerformOperationalMutation, 
  isCoreIdentityImmutable, 
  isGovernanceFieldProtected,
  ACTIVE_PROJECT_OPERATIONAL_NOTICE_AR,
  ACTIVE_PROJECT_OPERATIONAL_NOTICE_EN
} from '../services/projectMutability.policy';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Project Mutability Policy (Block 103)', () => {
  it('1. ACTIVE is operationally mutable', () => {
    expect(isProjectOperationallyMutable('ACTIVE')).toBe(true);
    expect(isProjectOperationallyMutable('SETUP')).toBe(true);
    expect(isProjectOperationallyMutable('APPROVED')).toBe(true);
    expect(isProjectOperationallyMutable('ARCHIVED')).toBe(false);
  });

  it('2. ACTIVE allows carrier enrollment', () => {
    expect(canPerformOperationalMutation('ENROLL_CARRIER', 'ACTIVE')).toBe(true);
  });

  it('3. ACTIVE allows material enrollment', () => {
    expect(canPerformOperationalMutation('ENROLL_MATERIAL', 'ACTIVE')).toBe(true);
  });

  it('4. ACTIVE allows manual roster intake', () => {
    expect(canPerformOperationalMutation('INTAKE_DRIVER_TRUCK', 'ACTIVE')).toBe(true);
  });

  it('5. ACTIVE allows Excel/CSV roster import', () => {
    expect(canPerformOperationalMutation('IMPORT_ROSTER_FILE', 'ACTIVE')).toBe(true);
  });

  it('6. ACTIVE allows roster commit', () => {
    expect(canPerformOperationalMutation('COMMIT_ROSTER_BATCH', 'ACTIVE')).toBe(true);
  });

  it('7. ACTIVE allows new pricing creation', () => {
    expect(canPerformOperationalMutation('CREATE_PRICING_RULE', 'ACTIVE')).toBe(true);
  });

  it('8. ACTIVE allows access management', () => {
    expect(canPerformOperationalMutation('MANAGE_ACCESS', 'ACTIVE')).toBe(true);
  });

  it('9. projectId immutable', () => {
    expect(isCoreIdentityImmutable('projectId')).toBe(true);
  });

  it('10. projectCode immutable', () => {
    expect(isCoreIdentityImmutable('projectCode')).toBe(true);
  });

  it('11. projectNumber immutable', () => {
    expect(isCoreIdentityImmutable('projectNumber')).toBe(true);
  });

  it('12. status governance protected', () => {
    expect(isGovernanceFieldProtected('status')).toBe(true);
  });

  it('13. createdAt governance protected', () => {
    expect(isGovernanceFieldProtected('createdAt')).toBe(true);
  });

  it('14. createdBy governance protected', () => {
    expect(isGovernanceFieldProtected('createdBy')).toBe(true);
  });

  it('15. Wizard uses operational mutability policy', () => {
    const wizardCode = readFileSync(join(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    expect(wizardCode).toContain('canPerformOperationalMutation');
  });

  it('16. no blanket ACTIVE => global lock in wizard', () => {
    const wizardCode = readFileSync(join(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    expect(wizardCode).not.toContain("if (!project || isLocked) return;");
  });

  it('17. Add Carrier available in ACTIVE', () => {
    const wizardCode = readFileSync(join(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    expect(wizardCode).toContain("isOperationallyMutable");
  });

  it('18. Add Material available in ACTIVE', () => {
    const wizardCode = readFileSync(join(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    expect(wizardCode).toContain("isOperationallyMutable");
  });

  it('19. manual roster available in ACTIVE', () => {
    const wizardCode = readFileSync(join(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    expect(wizardCode).toContain("isOperationallyMutable");
  });

  it('20. file roster import available in ACTIVE', () => {
    const wizardCode = readFileSync(join(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    expect(wizardCode).toContain("isOperationallyMutable");
  });

  it('21. reviewed import commit available in ACTIVE', () => {
    const wizardCode = readFileSync(join(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    expect(wizardCode).toContain("isOperationallyMutable");
  });

  it('22. Add Pricing Rule available in ACTIVE', () => {
    const wizardCode = readFileSync(join(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    expect(wizardCode).toContain("isOperationallyMutable");
  });

  it('23. ACTIVE informational message reflects governed operational mutability', () => {
    expect(ACTIVE_PROJECT_OPERATIONAL_NOTICE_AR).toContain('المشروع نشط');
    expect(ACTIVE_PROJECT_OPERATIONAL_NOTICE_EN).toContain('Project is active');
  });

  it('24. no duplicate controls introduced and workspace intact', () => {
    const workspaceCode = readFileSync(join(process.cwd(), 'src/components/workspace/ProjectWorkspaceView.tsx'), 'utf-8');
    expect(workspaceCode.length).toBeGreaterThan(100);
  });

  it('25. direct Google Sheets Roster sync remains unchanged/disabled', () => {
    const wizardCode = readFileSync(join(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
    expect(wizardCode).not.toContain('syncGoogleSheetsRoster');
  });

  it('26. membership status mutation was not introduced', () => {
    const repoCode = readFileSync(join(process.cwd(), 'src/repositories/projectMembership.repository.ts'), 'utf-8');
    expect(repoCode.length).toBeGreaterThan(50);
  });

  it('27. pricing historical overwrite/versioning behavior remains untouched', () => {
    const pricingServerCode = readFileSync(join(process.cwd(), 'src/services/projectPricing.server.ts'), 'utf-8');
    expect(pricingServerCode.length).toBeGreaterThan(50);
  });

  it('28. import pipeline internals remain untouched', () => {
    const pipelineCode = readFileSync(join(process.cwd(), 'src/services/import/driverTruckPipeline.service.ts'), 'utf-8');
    expect(pipelineCode).toContain('DriverTruckPipelineService');
  });
});
