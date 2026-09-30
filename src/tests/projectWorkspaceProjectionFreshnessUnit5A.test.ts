import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { inMemoryAdminStore } from '../firebase/admin';
import {
  WorkspaceSheetTab,
  WORKSPACE_TABS,
  CANONICAL_WORKSPACE_SHEET_TABS,
  normalizeWorkspaceDirtyTabs,
  ProjectWorkspaceProjectionState,
} from '../types/workspace';
import {
  getState,
  markDirty,
  markProjectionSuccessful,
  getProjectionStateDocRef,
  PROJECTION_STATE_SUBCOLLECTION,
  PROJECTION_STATE_DOC_ID,
  createCleanProjectionState,
} from '../services/projectWorkspaceProjectionState.server';

describe('Unit 5A: Workspace Projection Freshness / Invalidation Foundation Tests', () => {
  const TEST_PROJECT_ID = 'PRJ-TEST-FRESHNESS-001';

  beforeEach(() => {
    // Clear in-memory admin store before each test to ensure hermetic state
    for (const key in inMemoryAdminStore) {
      delete inMemoryAdminStore[key];
    }
  });

  // 1. clean default state when state document is absent
  it('1. clean default state when state document is absent', async () => {
    const state = await getState(TEST_PROJECT_ID);

    expect(state).toBeDefined();
    expect(state.projectId).toBe(TEST_PROJECT_ID);
    expect(state.dirtyTabs).toEqual([]);
    expect(state.dirtySince).toBeNull();
    expect(state.lastMutationAt).toBeNull();
    expect(state.lastMutationReason).toBeNull();
    expect(state.lastSuccessfulProjectionAt).toBeNull();
    expect(state.lastSuccessfulProjectionTabs).toEqual([]);
    expect(state.updatedAt).toBeDefined();
  });

  // 2. markDirty adds one domain
  it('2. markDirty adds one domain', async () => {
    const state = await markDirty(TEST_PROJECT_ID, ['MATERIALS'], 'Enrolled aggregate material');

    expect(state.dirtyTabs).toEqual(['MATERIALS']);
    expect(state.dirtySince).not.toBeNull();
    expect(state.lastMutationAt).not.toBeNull();
    expect(state.lastMutationReason).toBe('Enrolled aggregate material');
  });

  // 3. markDirty unions domains
  it('3. markDirty unions domains', async () => {
    await markDirty(TEST_PROJECT_ID, ['DRIVERS'], 'Driver registered');
    const state = await markDirty(TEST_PROJECT_ID, ['CARRIERS'], 'Carrier approved');

    expect(state.dirtyTabs).toEqual(['DRIVERS', 'CARRIERS']);
  });

  // 4. duplicate dirty domains collapse
  it('4. duplicate dirty domains collapse', () => {
    const normalized = normalizeWorkspaceDirtyTabs([
      'FLEET_ROSTER',
      'MATERIALS',
      'FLEET_ROSTER',
      'DRIVERS',
      'MATERIALS',
      'DRIVERS',
    ]);

    expect(normalized).toEqual(['DRIVERS', 'MATERIALS', 'FLEET_ROSTER']);
    expect(new Set(normalized).size).toBe(normalized.length);
  });

  // 5. canonical ordering is deterministic
  it('5. canonical ordering is deterministic', () => {
    const scrambledInput: (string | WorkspaceSheetTab)[] = [
      'REPORTS',
      'FLEET_ROSTER',
      'CARRIERS',
      'OPERATIONS',
      'EXCEPTIONS',
      'MATERIALS',
      'DRIVERS',
      'INVALID_TAB',
    ];

    const normalized = normalizeWorkspaceDirtyTabs(scrambledInput);

    expect(normalized).toEqual([
      'OPERATIONS',
      'DRIVERS',
      'CARRIERS',
      'MATERIALS',
      'FLEET_ROSTER',
      'EXCEPTIONS',
      'REPORTS',
    ]);
  });

  // 6. existing dirty domain is never lost
  it('6. existing dirty domain is never lost', async () => {
    await markDirty(TEST_PROJECT_ID, ['DRIVERS']);
    const state2 = await markDirty(TEST_PROJECT_ID, ['FLEET_ROSTER']);

    expect(state2.dirtyTabs).toContain('DRIVERS');
    expect(state2.dirtyTabs).toContain('FLEET_ROSTER');

    const state3 = await getState(TEST_PROJECT_ID);
    expect(state3.dirtyTabs).toEqual(['DRIVERS', 'FLEET_ROSTER']);
  });

  // 7. clean->dirty sets dirtySince
  it('7. clean->dirty sets dirtySince', async () => {
    const initial = await getState(TEST_PROJECT_ID);
    expect(initial.dirtySince).toBeNull();

    const dirtyState = await markDirty(TEST_PROJECT_ID, ['CARRIERS']);
    expect(dirtyState.dirtySince).not.toBeNull();
    expect(typeof dirtyState.dirtySince).toBe('string');
  });

  // 8. second dirty mutation preserves original dirtySince
  it('8. second dirty mutation preserves original dirtySince', async () => {
    const firstState = await markDirty(TEST_PROJECT_ID, ['MATERIALS'], 'First mutation');
    const firstDirtySince = firstState.dirtySince;
    expect(firstDirtySince).not.toBeNull();

    // Small delay to ensure timestamp separation if clock advances
    const secondState = await markDirty(TEST_PROJECT_ID, ['FLEET_ROSTER'], 'Second mutation');

    expect(secondState.dirtySince).toBe(firstDirtySince);
  });

  // 9. lastMutationAt updates
  it('9. lastMutationAt updates', async () => {
    const state1 = await markDirty(TEST_PROJECT_ID, ['MATERIALS'], 'Mutation 1');
    const firstMutationAt = state1.lastMutationAt;
    expect(firstMutationAt).not.toBeNull();

    const state2 = await markDirty(TEST_PROJECT_ID, ['DRIVERS'], 'Mutation 2');
    expect(state2.lastMutationAt).toBeDefined();
    expect(new Date(state2.lastMutationAt!).getTime()).toBeGreaterThanOrEqual(
      new Date(firstMutationAt!).getTime()
    );
  });

  // 10. lastMutationReason is recorded when supplied
  it('10. lastMutationReason is recorded when supplied', async () => {
    const reasonText = 'Driver license renewed via administrative console';
    const state = await markDirty(TEST_PROJECT_ID, ['DRIVERS'], reasonText);

    expect(state.lastMutationReason).toBe(reasonText);

    // When reason is omitted in subsequent call, existing reason or null is preserved
    const stateNoReason = await markDirty(TEST_PROJECT_ID, ['CARRIERS']);
    expect(stateNoReason.lastMutationReason).toBe(reasonText);
  });

  // 11. markProjectionSuccessful removes only successful tab
  it('11. markProjectionSuccessful removes only successful tab', async () => {
    await markDirty(TEST_PROJECT_ID, ['DRIVERS', 'FLEET_ROSTER', 'MATERIALS']);

    const afterSuccess = await markProjectionSuccessful(TEST_PROJECT_ID, ['DRIVERS']);

    expect(afterSuccess.dirtyTabs).not.toContain('DRIVERS');
    expect(afterSuccess.dirtyTabs).toContain('MATERIALS');
    expect(afterSuccess.dirtyTabs).toContain('FLEET_ROSTER');
  });

  // 12. unrelated dirty tabs remain
  it('12. unrelated dirty tabs remain', async () => {
    await markDirty(TEST_PROJECT_ID, ['CARRIERS', 'MATERIALS', 'FLEET_ROSTER']);

    const afterSuccess = await markProjectionSuccessful(TEST_PROJECT_ID, ['FLEET_ROSTER']);

    expect(afterSuccess.dirtyTabs).toEqual(['CARRIERS', 'MATERIALS']);
  });

  // 13. all successful dirty tabs -> dirtyTabs becomes []
  it('13. all successful dirty tabs -> dirtyTabs becomes []', async () => {
    await markDirty(TEST_PROJECT_ID, ['DRIVERS', 'CARRIERS']);

    const afterSuccess = await markProjectionSuccessful(TEST_PROJECT_ID, ['DRIVERS', 'CARRIERS']);

    expect(afterSuccess.dirtyTabs).toEqual([]);
  });

  // 14. all clean -> dirtySince becomes null
  it('14. all clean -> dirtySince becomes null', async () => {
    await markDirty(TEST_PROJECT_ID, ['MATERIALS']);
    const dirtyState = await getState(TEST_PROJECT_ID);
    expect(dirtyState.dirtySince).not.toBeNull();

    const cleanState = await markProjectionSuccessful(TEST_PROJECT_ID, ['MATERIALS']);
    expect(cleanState.dirtyTabs).toEqual([]);
    expect(cleanState.dirtySince).toBeNull();
  });

  // 15. partial successful projection preserves dirtySince
  it('15. partial successful projection preserves dirtySince', async () => {
    const dirtyState = await markDirty(TEST_PROJECT_ID, ['DRIVERS', 'FLEET_ROSTER']);
    const originalDirtySince = dirtyState.dirtySince;
    expect(originalDirtySince).not.toBeNull();

    const partialSuccessState = await markProjectionSuccessful(TEST_PROJECT_ID, ['DRIVERS']);

    expect(partialSuccessState.dirtyTabs).toEqual(['FLEET_ROSTER']);
    expect(partialSuccessState.dirtySince).toBe(originalDirtySince);
  });

  // 16. lastSuccessfulProjectionAt updates
  it('16. lastSuccessfulProjectionAt updates', async () => {
    await markDirty(TEST_PROJECT_ID, ['CARRIERS']);

    const customTime = '2026-09-30T10:00:00.000Z';
    const state = await markProjectionSuccessful(TEST_PROJECT_ID, ['CARRIERS'], customTime);

    expect(state.lastSuccessfulProjectionAt).toBe(customTime);
  });

  // 17. lastSuccessfulProjectionTabs contains exact projected tabs
  it('17. lastSuccessfulProjectionTabs contains exact projected tabs', async () => {
    await markDirty(TEST_PROJECT_ID, ['MATERIALS', 'FLEET_ROSTER']);

    const state = await markProjectionSuccessful(TEST_PROJECT_ID, ['MATERIALS', 'FLEET_ROSTER']);

    expect(state.lastSuccessfulProjectionTabs).toEqual(['MATERIALS', 'FLEET_ROSTER']);
  });

  // 18. failed/no success operation cannot clear dirty state
  it('18. failed/no success operation cannot clear dirty state', async () => {
    const state = await markDirty(TEST_PROJECT_ID, ['DRIVERS', 'FLEET_ROSTER']);
    expect(state.dirtyTabs).toEqual(['DRIVERS', 'FLEET_ROSTER']);

    // There is intentionally NO markProjectionFailed method that alters dirtyTabs
    // Verifying service module export surface
    const serverModule = await import('../services/projectWorkspaceProjectionState.server');
    expect((serverModule as any).markProjectionFailed).toBeUndefined();

    // State remains dirty in Firestore
    const persistedState = await getState(TEST_PROJECT_ID);
    expect(persistedState.dirtyTabs).toEqual(['DRIVERS', 'FLEET_ROSTER']);
    expect(persistedState.dirtySince).toBe(state.dirtySince);
  });

  // 19. invalid/empty projectId fails closed
  it('19. invalid/empty projectId fails closed', async () => {
    await expect(getState('')).rejects.toThrow('projectId is required');
    await expect(getState('   ')).rejects.toThrow('projectId is required');
    await expect(markDirty('', ['DRIVERS'])).rejects.toThrow('projectId is required');
    await expect(markProjectionSuccessful('', ['DRIVERS'])).rejects.toThrow('projectId is required');
  });

  // 20. no Google API dependency exists
  it('20. no Google API dependency exists', () => {
    const serviceFilePath = path.resolve(__dirname, '../services/projectWorkspaceProjectionState.server.ts');
    const content = fs.readFileSync(serviceFilePath, 'utf-8');

    expect(content).not.toContain('googleapis');
    expect(content).not.toContain('clientWorkspaceService');
    expect(content).not.toContain('serverWorkspaceService');
    expect(content).not.toContain('google.sheets');
    expect(content).not.toContain('google.drive');
    expect(content).not.toContain('googleToken');
    expect(content).not.toContain('requestGoogleScopes');
  });

  // 21. deterministic document path ends in: workspace_projection_state/current
  it('21. deterministic document path ends in: workspace_projection_state/current', () => {
    expect(PROJECTION_STATE_SUBCOLLECTION).toBe('workspace_projection_state');
    expect(PROJECTION_STATE_DOC_ID).toBe('current');

    const docRef = getProjectionStateDocRef('SAMPLE-PROJECT-123');
    expect(docRef).toBeDefined();

    const serviceFilePath = path.resolve(__dirname, '../services/projectWorkspaceProjectionState.server.ts');
    const content = fs.readFileSync(serviceFilePath, 'utf-8');
    expect(content).toContain('collection(PROJECTION_STATE_SUBCOLLECTION)');
    expect(content).toContain('doc(PROJECTION_STATE_DOC_ID)');
  });

  // 22. WorkspaceSheetTab is reused rather than duplicated
  it('22. WorkspaceSheetTab is reused rather than duplicated', () => {
    const serviceFilePath = path.resolve(__dirname, '../services/projectWorkspaceProjectionState.server.ts');
    const content = fs.readFileSync(serviceFilePath, 'utf-8');

    expect(content).toContain("import {\n  WorkspaceSheetTab,");
    expect(content).toContain("from '../types/workspace'");

    // Confirm WORKSPACE_TABS keys match CANONICAL_WORKSPACE_SHEET_TABS
    const configuredKeys = Object.keys(WORKSPACE_TABS);
    expect(configuredKeys).toEqual(expect.arrayContaining(CANONICAL_WORKSPACE_SHEET_TABS));
  });

  // 23. no canonical mutation wiring introduced
  it('23. no canonical mutation wiring introduced: server/app.ts mutations are untouched', () => {
    const appTsPath = path.resolve(__dirname, '../../server/app.ts');
    const appTsContent = fs.readFileSync(appTsPath, 'utf-8');

    // Confirm markDirty is NOT yet wired in server/app.ts
    expect(appTsContent).not.toContain('markDirty');
    expect(appTsContent).not.toContain('projectWorkspaceProjectionStateServer');
  });

  // 24. no activation/Wizard wiring introduced
  it('24. no activation/Wizard wiring introduced', () => {
    const activationPath = path.resolve(__dirname, '../services/projectActivation.service.ts');
    const activationContent = fs.readFileSync(activationPath, 'utf-8');
    expect(activationContent).not.toContain('markDirty');
    expect(activationContent).not.toContain('workspace_projection_state');

    const wizardPath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
    const wizardContent = fs.readFileSync(wizardPath, 'utf-8');
    expect(wizardContent).not.toContain('markDirty');
    expect(wizardContent).not.toContain('markProjectionSuccessful');
  });

  // 25. no ID/code generation change
  it('25. no canonical ID or code generation contracts changed', () => {
    const entitiesPath = path.resolve(__dirname, '../types/entities.ts');
    const entitiesContent = fs.readFileSync(entitiesPath, 'utf-8');

    // Canonical ID prefixes must remain unmodified
    expect(entitiesContent).toContain('projectId: string');
    expect(entitiesContent).toContain('projectCode?: string');
  });
});
