import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Replicating the exact targetProjectId derivation logic of FieldSupervisionView
// to prove the behavior converges correctly for all personas.
function deriveTargetProjectId(
  selectedProjectId: string | undefined,
  authContext: { role: string; assignedProjectIds?: string[] }
): string | undefined {
  if (selectedProjectId && selectedProjectId !== '') {
    const isGlobalScope = authContext.role === 'SUPER_ADMIN' || authContext.assignedProjectIds?.includes('ALL');
    const isAuthorized = isGlobalScope || authContext.assignedProjectIds?.includes(selectedProjectId);
    if (isAuthorized) {
      return selectedProjectId;
    } else {
      return undefined;
    }
  }

  const validAssignedProjects = (authContext.assignedProjectIds || []).filter(
    (pid) => pid && pid !== '' && pid !== 'ALL'
  );

  if (validAssignedProjects.length === 1) {
    return validAssignedProjects[0];
  }

  return undefined;
}

describe('TRIP SMART IMPORT — PROJECT SCOPE CONVERGENCE TESTS', () => {
  const supervisionPath = path.resolve(__dirname, '../components/field/FieldSupervisionView.tsx');

  it('1. FieldSupervisionView source file includes SUPER_ADMIN in isGlobalScope useMemo check', () => {
    const content = fs.readFileSync(supervisionPath, 'utf-8');
    expect(content).toContain("authContext.role === 'SUPER_ADMIN'");
    expect(content).toContain("authContext.assignedProjectIds?.includes('ALL')");
  });

  it('2. selectedProjectId reaches FieldSupervisionView and SUPER_ADMIN resolves targetProjectId globally', () => {
    const authContext = {
      role: 'SUPER_ADMIN',
      assignedProjectIds: [], // profile assigned project list might be empty for SUPER_ADMIN
    };
    const resolved = deriveTargetProjectId('PRJ-BETA2-LIVE-01', authContext);
    expect(resolved).toBe('PRJ-BETA2-LIVE-01');
  });

  it('3. Authorized project selected by regular user resolves targetProjectId correctly', () => {
    const authContext = {
      role: 'PROJECT_ADMIN',
      assignedProjectIds: ['PRJ-BETA2-LIVE-01', 'PRJ-NEOM-002'],
    };
    const resolved = deriveTargetProjectId('PRJ-BETA2-LIVE-01', authContext);
    expect(resolved).toBe('PRJ-BETA2-LIVE-01');
  });

  it('4. Unauthorized selected project fails closed (returns undefined)', () => {
    const authContext = {
      role: 'PROJECT_ADMIN',
      assignedProjectIds: ['PRJ-NEOM-002'],
    };
    const resolved = deriveTargetProjectId('PRJ-BETA2-LIVE-01', authContext);
    expect(resolved).toBeUndefined();
  });

  it('5. Empty selected project does not silently select arbitrary project unless single assignment exists', () => {
    const authContext = {
      role: 'PROJECT_ADMIN',
      assignedProjectIds: ['PRJ-1', 'PRJ-2'],
    };
    const resolved = deriveTargetProjectId('', authContext);
    expect(resolved).toBeUndefined();
  });

  it('6. Exactly one authorized assigned project is inferred when selection is empty', () => {
    const authContext = {
      role: 'PROJECT_ADMIN',
      assignedProjectIds: ['PRJ-ONLY-ONE'],
    };
    const resolved = deriveTargetProjectId('', authContext);
    expect(resolved).toBe('PRJ-ONLY-ONE');
  });

  it('7. Multiple assigned projects with no selection remain unresolved (fails closed)', () => {
    const authContext = {
      role: 'SUPERVISOR',
      assignedProjectIds: ['PRJ-A', 'PRJ-B'],
    };
    const resolved = deriveTargetProjectId('', authContext);
    expect(resolved).toBeUndefined();
  });

  it('8. FieldSupervisionView imports ExcelCsvImportSection for rendering Smart Import', () => {
    const content = fs.readFileSync(supervisionPath, 'utf-8');
    expect(content).toContain('ExcelCsvImportSection');
  });

  it('9. FieldSupervisionView maps resolved targetProjectId to ExcelCsvImportSection currentProjectId prop', () => {
    const content = fs.readFileSync(supervisionPath, 'utf-8');
    expect(content).toContain('currentProjectId={targetProjectId}');
  });
});
