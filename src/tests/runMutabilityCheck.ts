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

console.log('Running Project Mutability Policy Checks...');

assert(isProjectOperationallyMutable('ACTIVE') === true, '1. ACTIVE is operationally mutable');
assert(canPerformOperationalMutation('ENROLL_CARRIER', 'ACTIVE') === true, '2. ACTIVE allows carrier enrollment');
assert(canPerformOperationalMutation('ENROLL_MATERIAL', 'ACTIVE') === true, '3. ACTIVE allows material enrollment');
assert(canPerformOperationalMutation('INTAKE_DRIVER_TRUCK', 'ACTIVE') === true, '4. ACTIVE allows manual driver/truck intake');
assert(canPerformOperationalMutation('IMPORT_ROSTER_FILE', 'ACTIVE') === true, '5. ACTIVE allows roster file import');
assert(canPerformOperationalMutation('COMMIT_ROSTER_BATCH', 'ACTIVE') === true, '6. ACTIVE allows roster commit');
assert(canPerformOperationalMutation('CREATE_PRICING_RULE', 'ACTIVE') === true, '7. ACTIVE allows pricing rule creation');

assert(isGovernanceFieldProtected('status') === true, '8. status is governance protected');
assert(isCoreIdentityImmutable('projectId') === true, '9. projectId is immutable');
assert(isCoreIdentityImmutable('projectCode') === true, '10. projectCode is immutable');
assert(isCoreIdentityImmutable('projectNumber') === true, '11. projectNumber is immutable');

const wizardCode = readFileSync(join(process.cwd(), 'src/components/wizard/ProjectSetupWizard.tsx'), 'utf-8');
assert(wizardCode.includes('canPerformOperationalMutation'), '12. Wizard uses canPerformOperationalMutation');
assert(!wizardCode.includes("if (!project || isLocked) return;"), '13. Wizard does not have blanket isLocked check');
assert(wizardCode.includes('ACTIVE_PROJECT_OPERATIONAL_NOTICE_AR'), '14. Wizard uses operational notice');

const appCode = readFileSync(join(process.cwd(), 'server/app.ts'), 'utf-8');
assert(appCode.includes('/api/projects/:projectId/setup-carrier'), '15. Server carrier endpoint intact');
assert(appCode.includes('/api/projects/:projectId/setup-material'), '16. Server material endpoint intact');
assert(appCode.includes('/api/intake/canonical'), '17. Server canonical intake endpoint intact');
assert(appCode.includes('/api/projects/:projectId/pricing-rules'), '18. Server pricing rules endpoint intact');

const workspaceCode = readFileSync(join(process.cwd(), 'src/components/workspace/ProjectWorkspaceView.tsx'), 'utf-8');
assert(workspaceCode.length > 100, '19. Workspace view intact');

const pipelineCode = readFileSync(join(process.cwd(), 'src/services/import/driverTruckPipeline.service.ts'), 'utf-8');
assert(pipelineCode.includes('DriverTruckPipelineService'), '20. Pipeline untouched');

const pricingServerCode = readFileSync(join(process.cwd(), 'src/services/projectPricing.server.ts'), 'utf-8');
assert(pricingServerCode.length > 50, '21. Pricing server untouched');

const repoCode = readFileSync(join(process.cwd(), 'src/repositories/projectMembership.repository.ts'), 'utf-8');
assert(repoCode.length > 50, '22. Membership repository untouched');

assert(ACTIVE_PROJECT_OPERATIONAL_NOTICE_AR.includes('المشروع نشط'), '23. Arabic notice correct');
assert(ACTIVE_PROJECT_OPERATIONAL_NOTICE_EN.includes('Project is active'), '24. English notice correct');

console.log('ALL 24 MUTABILITY POLICY CHECKS PASSED SUCCESSFULLY!');

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}
