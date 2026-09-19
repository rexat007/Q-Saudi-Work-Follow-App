import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('ProjectWorkspaceView Material & Carrier Canonical Convergence Static Verifier', () => {
  const workspacePath = path.resolve(__dirname, '../../src/components/workspace/ProjectWorkspaceView.tsx');
  const fileContent = fs.readFileSync(workspacePath, 'utf-8');

  it('1. Workspace does not import carrierRepository', () => {
    expect(fileContent).not.toContain("carrierRepository } from '../../repositories/carrier.repository'");
    expect(fileContent).not.toContain("carrierRepository } from \"../../repositories/carrier.repository\"");
  });

  it('2. Workspace does not import materialRepository', () => {
    expect(fileContent).not.toContain("materialRepository } from '../../repositories/material.repository'");
    expect(fileContent).not.toContain("materialRepository } from \"../../repositories/material.repository\"");
  });

  it('3. Workspace Carrier creation uses canonical setup-carrier capability', () => {
    expect(fileContent).toContain('/setup-carrier');
  });

  it('4. Workspace Material creation uses canonical setup-material capability', () => {
    expect(fileContent).toContain('/setup-material');
  });

  it('5. Workspace Carrier reads use canonical Project Carrier endpoint', () => {
    expect(fileContent).toContain('/carriers');
  });

  it('6. Workspace Material reads use canonical Project Material endpoint', () => {
    expect(fileContent).toContain('/materials');
  });

  it('7. No Workspace-generated Carrier ID using Date.now() in handleAddCarrier', () => {
    const carrierCreationBlock = fileContent.substring(
      fileContent.indexOf('const handleAddCarrier'),
      fileContent.indexOf('const handleAddMaterial')
    );
    expect(carrierCreationBlock).not.toContain('CAR-');
  });

  it('8. No Workspace-generated Material ID using Date.now() in handleAddMaterial', () => {
    const materialCreationBlock = fileContent.substring(
      fileContent.indexOf('const handleAddMaterial'),
      fileContent.indexOf('const handleAddPricingRule')
    );
    expect(materialCreationBlock).not.toContain('MAT-');
  });

  it('9. No legacy Carrier/Material dual write', () => {
    expect(fileContent).not.toContain('carrierRepository.create');
    expect(fileContent).not.toContain('materialRepository.create');
  });

  it('10. Pricing code remains untouched in the codebase', () => {
    expect(fileContent).toContain('pricingRuleRepository');
  });

  it('11. Roster code remains untouched', () => {
    expect(fileContent).toContain('projectCarrierRosterRepository');
  });

  it('12. Project Activation/Readiness code remains untouched', () => {
    expect(fileContent).not.toContain('ProjectReadinessService');
    expect(fileContent).not.toContain('ProjectActivationService');
  });
});
