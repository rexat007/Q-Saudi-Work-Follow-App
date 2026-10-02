import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  ProjectCanonicalRefreshService,
  projectCanonicalRefreshService,
  ProjectCanonicalRefreshSnapshot,
} from '../services/projectCanonicalRefresh.service';
import { canonicalRelationshipContextService } from '../services/canonicalRelationshipContext.service';

describe('FOUNDATION A1.1 — Immediate Canonical Refresh Barrier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const serviceFilePath = path.resolve(__dirname, '../services/projectCanonicalRefresh.service.ts');
  const serviceFileContent = fs.readFileSync(serviceFilePath, 'utf-8');

  const wizardFilePath = path.resolve(__dirname, '../components/wizard/ProjectSetupWizard.tsx');
  const wizardFileContent = fs.readFileSync(wizardFilePath, 'utf-8');

  const modalFilePath = path.resolve(__dirname, '../components/masterData/CarrierEditorModal.tsx');
  const modalFileContent = fs.readFileSync(modalFilePath, 'utf-8');

  const serverAppPath = path.resolve(__dirname, '../../server/app.ts');
  const serverAppContent = fs.readFileSync(serverAppPath, 'utf-8');

  // Helper mock factory
  const createMockFetch = (overrides?: {
    matOk?: boolean;
    carOk?: boolean;
    fleetOk?: boolean;
    materials?: any[];
    carriers?: any[];
    fleetRows?: any[];
  }) => {
    const matOk = overrides?.matOk ?? true;
    const carOk = overrides?.carOk ?? true;
    const fleetOk = overrides?.fleetOk ?? true;
    const materials = overrides?.materials ?? [{ materialId: 'MAT-01', name: 'دفان' }];
    const carriers = overrides?.carriers ?? [{ carrierId: 'CAR-01', name: 'شركة النقل' }];
    const fleetRows = overrides?.fleetRows ?? [{ truckId: 'TRK-01', plateNumber: '1234 ABC' }];

    return vi.fn().mockImplementation((url: string) => {
      if (url.includes('/materials')) {
        return Promise.resolve({
          ok: matOk,
          status: matOk ? 200 : 500,
          json: () => Promise.resolve({ success: matOk, data: materials }),
        });
      }
      if (url.includes('/carriers')) {
        return Promise.resolve({
          ok: carOk,
          status: carOk ? 200 : 500,
          json: () => Promise.resolve({ success: carOk, data: carriers }),
        });
      }
      if (url.includes('/fleet-read-model')) {
        return Promise.resolve({
          ok: fleetOk,
          status: fleetOk ? 200 : 500,
          json: () => Promise.resolve({ success: fleetOk, data: { rows: fleetRows } }),
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  };

  const mockRelContext = (overrides?: any) => ({
    projectId: 'PRJ-01',
    authorizedCarrierIds: ['CAR-01'],
    authorizedMaterialIds: ['MAT-01'],
    knownCarriers: [{ carrierId: 'CAR-01', name: 'شركة النقل', status: 'ACTIVE' }],
    knownMaterials: [{ materialId: 'MAT-01', name: 'دفان', code: 'DEF-01', status: 'ACTIVE' }],
    knownDrivers: [],
    knownTrucks: [],
    activeDriverByTruck: {},
    activeMaterialByTruck: {},
    ...overrides,
  });

  // 1. Reusable refresh service exists
  it('1. Reusable refresh service exists', () => {
    expect(ProjectCanonicalRefreshService).toBeDefined();
    expect(projectCanonicalRefreshService).toBeDefined();
    expect(typeof projectCanonicalRefreshService.refresh).toBe('function');
  });

  // 2. Refresh requires valid projectId
  it('2. Refresh requires valid projectId', async () => {
    await expect(projectCanonicalRefreshService.refresh('')).rejects.toThrow(/INVALID_ARGUMENT/);
    await expect(projectCanonicalRefreshService.refresh('   ')).rejects.toThrow(/INVALID_ARGUMENT/);
    await expect(projectCanonicalRefreshService.refresh('ALL')).rejects.toThrow(/INVALID_ARGUMENT/);
  });

  // 3. Refresh uses authenticated token
  it('3. Refresh uses authenticated token', async () => {
    const fetchMock = createMockFetch();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(mockRelContext() as any);

    const service = new ProjectCanonicalRefreshService();
    await service.refresh('PRJ-01', { overrideToken: 'test-auth-token-123' });

    expect(fetchMock).toHaveBeenCalled();
    const calls = fetchMock.mock.calls;
    for (const call of calls) {
      expect(call[1].headers.Authorization).toBe('Bearer test-auth-token-123');
    }
    vi.unstubAllGlobals();
  });

  // 4. Refresh fetches project materials
  it('4. Refresh fetches project materials', async () => {
    const fetchMock = createMockFetch();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(mockRelContext() as any);

    const service = new ProjectCanonicalRefreshService();
    await service.refresh('PRJ-01', { overrideToken: 'token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/PRJ-01/materials',
      expect.anything()
    );
    vi.unstubAllGlobals();
  });

  // 5. Refresh fetches project carriers
  it('5. Refresh fetches project carriers', async () => {
    const fetchMock = createMockFetch();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(mockRelContext() as any);

    const service = new ProjectCanonicalRefreshService();
    await service.refresh('PRJ-01', { overrideToken: 'token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/PRJ-01/carriers',
      expect.anything()
    );
    vi.unstubAllGlobals();
  });

  // 6. Refresh fetches fleet-read-model
  it('6. Refresh fetches fleet-read-model', async () => {
    const fetchMock = createMockFetch();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(mockRelContext() as any);

    const service = new ProjectCanonicalRefreshService();
    await service.refresh('PRJ-01', { overrideToken: 'token' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/PRJ-01/fleet-read-model',
      expect.anything()
    );
    vi.unstubAllGlobals();
  });

  // 7. Non-OK materials response fails closed
  it('7. Non-OK materials response fails closed', async () => {
    const fetchMock = createMockFetch({ matOk: false });
    vi.stubGlobal('fetch', fetchMock);

    const service = new ProjectCanonicalRefreshService();
    await expect(service.refresh('PRJ-01', { overrideToken: 'token', maxAttempts: 1 })).rejects.toThrow(
      /CANONICAL_REFRESH_MATERIALS_FAILED/
    );
    vi.unstubAllGlobals();
  });

  // 8. Non-OK carriers response fails closed
  it('8. Non-OK carriers response fails closed', async () => {
    const fetchMock = createMockFetch({ carOk: false });
    vi.stubGlobal('fetch', fetchMock);

    const service = new ProjectCanonicalRefreshService();
    await expect(service.refresh('PRJ-01', { overrideToken: 'token', maxAttempts: 1 })).rejects.toThrow(
      /CANONICAL_REFRESH_CARRIERS_FAILED/
    );
    vi.unstubAllGlobals();
  });

  // 9. Non-OK fleet response fails closed
  it('9. Non-OK fleet response fails closed', async () => {
    const fetchMock = createMockFetch({ fleetOk: false });
    vi.stubGlobal('fetch', fetchMock);

    const service = new ProjectCanonicalRefreshService();
    await expect(service.refresh('PRJ-01', { overrideToken: 'token', maxAttempts: 1 })).rejects.toThrow(
      /CANONICAL_REFRESH_FLEET_FAILED/
    );
    vi.unstubAllGlobals();
  });

  // 10. Refresh rebuilds RelationshipContext
  it('10. Refresh rebuilds RelationshipContext', async () => {
    const fetchMock = createMockFetch();
    vi.stubGlobal('fetch', fetchMock);
    const relSpy = vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(mockRelContext() as any);

    const service = new ProjectCanonicalRefreshService();
    await service.refresh('PRJ-01', { overrideToken: 'token' });

    expect(relSpy).toHaveBeenCalledWith('PRJ-01');
    vi.unstubAllGlobals();
  });

  // 11. Refresh returns materials
  it('11. Refresh returns materials', async () => {
    const fetchMock = createMockFetch({ materials: [{ materialId: 'MAT-99', name: 'رمل' }] });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(mockRelContext() as any);

    const service = new ProjectCanonicalRefreshService();
    const result = await service.refresh('PRJ-01', { overrideToken: 'token' });

    expect(result.materials).toEqual([{ materialId: 'MAT-99', name: 'رمل' }]);
    vi.unstubAllGlobals();
  });

  // 12. Refresh returns carriers
  it('12. Refresh returns carriers', async () => {
    const fetchMock = createMockFetch({ carriers: [{ carrierId: 'CAR-88', name: 'أساطيل الشرق' }] });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(mockRelContext() as any);

    const service = new ProjectCanonicalRefreshService();
    const result = await service.refresh('PRJ-01', { overrideToken: 'token' });

    expect(result.carriers).toEqual([{ carrierId: 'CAR-88', name: 'أساطيل الشرق' }]);
    vi.unstubAllGlobals();
  });

  // 13. Refresh returns fleetRows
  it('13. Refresh returns fleetRows', async () => {
    const fetchMock = createMockFetch({ fleetRows: [{ truckId: 'TRK-55', plateNumber: '9999 XYZ' }] });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(mockRelContext() as any);

    const service = new ProjectCanonicalRefreshService();
    const result = await service.refresh('PRJ-01', { overrideToken: 'token' });

    expect(result.fleetRows).toEqual([{ truckId: 'TRK-55', plateNumber: '9999 XYZ' }]);
    vi.unstubAllGlobals();
  });

  // 14. Refresh returns relationshipContext
  it('14. Refresh returns relationshipContext', async () => {
    const fetchMock = createMockFetch();
    vi.stubGlobal('fetch', fetchMock);
    const expectedContext = mockRelContext({ projectId: 'PRJ-SPECIFIC' });
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(expectedContext as any);

    const service = new ProjectCanonicalRefreshService();
    const result = await service.refresh('PRJ-SPECIFIC', { overrideToken: 'token' });

    expect(result.relationshipContext).toEqual(expectedContext);
    vi.unstubAllGlobals();
  });

  // 15. Expected carrier must appear in carriers list
  it('15. Expected carrier must appear in carriers list', async () => {
    const fetchMock = createMockFetch({
      carriers: [], // Empty carriers list (not visible)
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(
      mockRelContext({ authorizedCarrierIds: ['CAR-NEW'], knownCarriers: [{ carrierId: 'CAR-NEW' }] }) as any
    );

    const service = new ProjectCanonicalRefreshService();
    await expect(
      service.refresh('PRJ-01', {
        overrideToken: 'token',
        expect: { carrierId: 'CAR-NEW' },
        maxAttempts: 1,
      })
    ).rejects.toThrow(/CANONICAL_REFRESH_NOT_CONVERGED/);
    vi.unstubAllGlobals();
  });

  // 16. Expected carrier must appear in authorizedCarrierIds
  it('16. Expected carrier must appear in authorizedCarrierIds', async () => {
    const fetchMock = createMockFetch({
      carriers: [{ carrierId: 'CAR-NEW', name: 'الناقل الجديد' }],
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(
      mockRelContext({ authorizedCarrierIds: [], knownCarriers: [{ carrierId: 'CAR-NEW' }] }) as any
    );

    const service = new ProjectCanonicalRefreshService();
    await expect(
      service.refresh('PRJ-01', {
        overrideToken: 'token',
        expect: { carrierId: 'CAR-NEW' },
        maxAttempts: 1,
      })
    ).rejects.toThrow(/CANONICAL_REFRESH_NOT_CONVERGED/);
    vi.unstubAllGlobals();
  });

  // 17. Expected carrier must appear in knownCarriers
  it('17. Expected carrier must appear in knownCarriers', async () => {
    const fetchMock = createMockFetch({
      carriers: [{ carrierId: 'CAR-NEW', name: 'الناقل الجديد' }],
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(
      mockRelContext({ authorizedCarrierIds: ['CAR-NEW'], knownCarriers: [] }) as any
    );

    const service = new ProjectCanonicalRefreshService();
    await expect(
      service.refresh('PRJ-01', {
        overrideToken: 'token',
        expect: { carrierId: 'CAR-NEW' },
        maxAttempts: 1,
      })
    ).rejects.toThrow(/CANONICAL_REFRESH_NOT_CONVERGED/);
    vi.unstubAllGlobals();
  });

  // 18. Expected material must appear in materials list
  it('18. Expected material must appear in materials list', async () => {
    const fetchMock = createMockFetch({
      materials: [], // Not visible in list
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(
      mockRelContext({ authorizedMaterialIds: ['MAT-NEW'], knownMaterials: [{ materialId: 'MAT-NEW' }] }) as any
    );

    const service = new ProjectCanonicalRefreshService();
    await expect(
      service.refresh('PRJ-01', {
        overrideToken: 'token',
        expect: { materialId: 'MAT-NEW' },
        maxAttempts: 1,
      })
    ).rejects.toThrow(/CANONICAL_REFRESH_NOT_CONVERGED/);
    vi.unstubAllGlobals();
  });

  // 19. Expected material must appear in authorizedMaterialIds
  it('19. Expected material must appear in authorizedMaterialIds', async () => {
    const fetchMock = createMockFetch({
      materials: [{ materialId: 'MAT-NEW', name: 'أسمنت' }],
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(
      mockRelContext({ authorizedMaterialIds: [], knownMaterials: [{ materialId: 'MAT-NEW' }] }) as any
    );

    const service = new ProjectCanonicalRefreshService();
    await expect(
      service.refresh('PRJ-01', {
        overrideToken: 'token',
        expect: { materialId: 'MAT-NEW' },
        maxAttempts: 1,
      })
    ).rejects.toThrow(/CANONICAL_REFRESH_NOT_CONVERGED/);
    vi.unstubAllGlobals();
  });

  // 20. Expected material must appear in knownMaterials
  it('20. Expected material must appear in knownMaterials', async () => {
    const fetchMock = createMockFetch({
      materials: [{ materialId: 'MAT-NEW', name: 'أسمنت' }],
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(
      mockRelContext({ authorizedMaterialIds: ['MAT-NEW'], knownMaterials: [] }) as any
    );

    const service = new ProjectCanonicalRefreshService();
    await expect(
      service.refresh('PRJ-01', {
        overrideToken: 'token',
        expect: { materialId: 'MAT-NEW' },
        maxAttempts: 1,
      })
    ).rejects.toThrow(/CANONICAL_REFRESH_NOT_CONVERGED/);
    vi.unstubAllGlobals();
  });

  // 21. Missing expected carrier does not count as success
  it('21. Missing expected carrier does not count as success', async () => {
    const fetchMock = createMockFetch({ carriers: [] });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(mockRelContext() as any);

    const service = new ProjectCanonicalRefreshService();
    await expect(
      service.refresh('PRJ-01', { overrideToken: 'token', expect: { carrierId: 'MISSING-CAR' }, maxAttempts: 1 })
    ).rejects.toThrow();
    vi.unstubAllGlobals();
  });

  // 22. Missing expected material does not count as success
  it('22. Missing expected material does not count as success', async () => {
    const fetchMock = createMockFetch({ materials: [] });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(mockRelContext() as any);

    const service = new ProjectCanonicalRefreshService();
    await expect(
      service.refresh('PRJ-01', { overrideToken: 'token', expect: { materialId: 'MISSING-MAT' }, maxAttempts: 1 })
    ).rejects.toThrow();
    vi.unstubAllGlobals();
  });

  // 23. Retry is bounded
  it('23. Retry is bounded (default 3 attempts)', async () => {
    const fetchMock = createMockFetch({ carriers: [] });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(mockRelContext() as any);

    const service = new ProjectCanonicalRefreshService();
    await expect(
      service.refresh('PRJ-01', { overrideToken: 'token', expect: { carrierId: 'CAR-NONEXIST' }, delayMs: 1 })
    ).rejects.toThrow();

    // 3 calls to each of materials, carriers, fleet = 9 calls total
    expect(fetchMock).toHaveBeenCalledTimes(9);
    vi.unstubAllGlobals();
  });

  // 24. Retry has no permanent/background polling
  it('24. Retry has no permanent/background polling', () => {
    expect(serviceFileContent).not.toContain('setInterval');
    expect(serviceFileContent).not.toContain('while (true)');
  });

  // 25. Failure after retry returns CANONICAL_REFRESH_NOT_CONVERGED
  it('25. Failure after retry returns CANONICAL_REFRESH_NOT_CONVERGED', async () => {
    const fetchMock = createMockFetch({ carriers: [] });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(canonicalRelationshipContextService, 'getProjectRelationshipContext').mockResolvedValue(mockRelContext() as any);

    const service = new ProjectCanonicalRefreshService();
    await expect(
      service.refresh('PRJ-01', { overrideToken: 'token', expect: { carrierId: 'CAR-FAILED' }, maxAttempts: 2, delayMs: 1 })
    ).rejects.toThrow(/CANONICAL_REFRESH_NOT_CONVERGED/);
    vi.unstubAllGlobals();
  });

  // 26. ProjectSetupWizard uses one atomic snapshot application helper
  it('26. ProjectSetupWizard uses one atomic snapshot application helper', () => {
    expect(wizardFileContent).toContain('applyCanonicalSnapshot');
    expect(wizardFileContent).toContain('setMaterials(snapshot.materials');
    expect(wizardFileContent).toContain('setCarriers(snapshot.carriers');
    expect(wizardFileContent).toContain('setFleetRows(snapshot.fleetRows');
  });

  // 27. Carrier onCreated uses refresh service
  it('27. Carrier onCreated uses refresh service', () => {
    expect(wizardFileContent).toContain('projectCanonicalRefreshService.refresh(');
  });

  // 28. Carrier onCreated passes returned carrierId as expectation
  it('28. Carrier onCreated passes returned carrierId as expectation', () => {
    expect(wizardFileContent).toContain('expect: { carrierId: result.carrierId }');
  });

  // 29. Carrier modal does not close before refresh resolves
  it('29. Carrier modal does not close before refresh resolves', () => {
    // In CarrierEditorModal.tsx, onClose() is called strictly after await onCreated(result)
    const submitSection = modalFileContent.slice(
      modalFileContent.indexOf('const handleSubmit ='),
      modalFileContent.indexOf('const handleRetryRefresh')
    );
    expect(submitSection).toContain('await onCreated(result);');
    expect(submitSection).toContain('onClose();');
    expect(submitSection.indexOf('await onCreated(result);')).toBeLessThan(submitSection.indexOf('onClose();'));
  });

  // 30. Carrier refresh retry does not call setup-carrier again
  it('30. Carrier refresh retry does not call setup-carrier again', () => {
    const retrySection = modalFileContent.slice(
      modalFileContent.indexOf('const handleRetryRefresh ='),
      modalFileContent.indexOf('return (', modalFileContent.indexOf('const handleRetryRefresh ='))
    );
    expect(retrySection).not.toContain('clientService.createProjectCarrier');
    expect(retrySection).toContain('await onCreated(createdCarrierResult);');
  });

  // 31. Refresh-failed-after-create state distinguishes mutation from refresh
  it('31. Refresh-failed-after-create state distinguishes mutation from refresh', () => {
    expect(modalFileContent).toContain('refreshFailed');
    expect(modalFileContent).toContain('createdCarrierResult');
    expect(modalFileContent).toContain('إعادة تحديث البيانات');
  });

  // 32. Material creation uses refresh service
  it('32. Material creation uses refresh service', () => {
    const handleMatSection = wizardFileContent.slice(
      wizardFileContent.indexOf('<MaterialEditorModal'),
      wizardFileContent.indexOf('/>', wizardFileContent.indexOf('<MaterialEditorModal')) + 2
    );
    expect(handleMatSection).toContain('projectCanonicalRefreshService.refresh(');
  });

  // 33. Material creation passes returned materialId
  it('33. Material creation passes returned materialId', () => {
    const handleMatSection = wizardFileContent.slice(
      wizardFileContent.indexOf('<MaterialEditorModal'),
      wizardFileContent.indexOf('/>', wizardFileContent.indexOf('<MaterialEditorModal')) + 2
    );
    expect(handleMatSection).toContain('expect: { materialId: result.materialId }');
  });

  // 34. Material form closes only after successful refresh
  it('34. Material form closes only after successful refresh', () => {
    const matModalPath = path.resolve(__dirname, '../components/masterData/MaterialEditorModal.tsx');
    const matModalFileContent = fs.readFileSync(matModalPath, 'utf-8');
    const submitSection = matModalFileContent.slice(
      matModalFileContent.indexOf('const handleSubmit ='),
      matModalFileContent.indexOf('const handleRetryRefresh')
    );
    expect(submitSection).toContain('await onCreated(result);');
    expect(submitSection).toContain('onClose();');
    expect(submitSection.indexOf('await onCreated(result);')).toBeLessThan(submitSection.indexOf('onClose();'));
  });

  // 35. No page reload is used
  it('35. No page reload is used', () => {
    expect(wizardFileContent).not.toContain('window.location.reload()');
    expect(modalFileContent).not.toContain('window.location.reload()');
  });

  // 36. No navigation away/re-entry is required
  it('36. No navigation away/re-entry is required', () => {
    const handleMatSection = wizardFileContent.slice(
      wizardFileContent.indexOf('<MaterialEditorModal'),
      wizardFileContent.indexOf('/>', wizardFileContent.indexOf('<MaterialEditorModal')) + 2
    );
    expect(handleMatSection).not.toContain('setActivePhase');
  });

  // 37. Existing reloadProjectCanonicalData delegates to shared service
  it('37. Existing reloadProjectCanonicalData delegates to shared service', () => {
    const reloadSection = wizardFileContent.slice(
      wizardFileContent.indexOf('const reloadProjectCanonicalData ='),
      wizardFileContent.indexOf('const handleCreateMissingEntity')
    );
    expect(reloadSection).toContain('projectCanonicalRefreshService.refresh(project.projectId)');
    expect(reloadSection).toContain('applyCanonicalSnapshot(snapshot)');
  });

  // 38. Smart Import pipeline remains untouched
  it('38. Smart Import pipeline remains untouched', () => {
    expect(wizardFileContent).toContain('DriverTruckPipelineService');
    expect(wizardFileContent).toContain('handleApproveRosterMappingAndStartPipeline');
  });

  // 39. Server endpoints remain untouched
  it('39. Server endpoints remain untouched', () => {
    expect(serverAppContent).toContain("app.post('/api/projects/:projectId/setup-carrier'");
    expect(serverAppContent).toContain("app.post('/api/projects/:projectId/setup-material'");
    expect(serverAppContent).toContain("app.get('/api/projects/:projectId/materials'");
    expect(serverAppContent).toContain("app.get('/api/projects/:projectId/carriers'");
  });

  // 40. Carrier edit authority remains deferred
  it('40. Carrier edit authority remains deferred', () => {
    expect(modalFileContent).not.toContain('carrierService.updateCarrier');
    expect(modalFileContent).not.toContain('carrierRepository.update');
  });
});
