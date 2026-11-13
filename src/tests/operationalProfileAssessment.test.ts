import { describe, it, expect, vi, afterEach } from 'vitest';
import { operationConfig, operationGraph, operationActor } from './helpers/operationalProfileFixture';
import { ProjectCommandsServerService } from '../services/projectCommands.server';
import { snapshotOperationalConfiguration } from '../services/operationalProfileResolver';
import { configurationHash } from '../services/workspaceProvisioning.server';
import type { OperationalConfiguration } from '../types/operationalProfile';

afterEach(() => vi.restoreAllMocks());

describe('Operational Profile Impact Assessment & Reviewed Apply', () => {
  it('1. unchanged configuration → NO_CHANGE', async () => {
    const initialConfig = operationConfig('NONE', 'NONE');
    const x = operationGraph(initialConfig);
    const service = new ProjectCommandsServerService(x.db);

    const assessment = await service.assessOperationalImpact(
      'P1',
      { configuration: initialConfig, expectedVersion: 1 },
      operationActor
    );

    expect(assessment.decision).toBe('NO_CHANGE');
    expect(assessment.workspaceImpact).toBe('NONE');
    expect(assessment.historicalImpact).toBe('NONE');
    expect(assessment.changedDomains).toEqual([]);
    expect(assessment.reasons).toContain('CONFIGURATION_IDENTICAL');

    // Attempting reviewed apply with NO_CHANGE is a no-op
    const result = await service.configureOperations(
      'P1',
      {
        configuration: initialConfig,
        expectedVersion: 1,
        assessmentSignature: assessment.assessmentSignature,
      },
      operationActor
    );
    expect(result.version).toBe(1);
  });

  it('2. no Trips + no Workspace → SAFE_APPLY', async () => {
    const initialConfig = operationConfig('NONE', 'NONE');
    const x = operationGraph(initialConfig);
    const service = new ProjectCommandsServerService(x.db);

    const proposed = operationConfig('WEIGHBRIDGE', 'WEIGHBRIDGE');
    const assessment = await service.assessOperationalImpact(
      'P1',
      { configuration: proposed, expectedVersion: 1 },
      operationActor
    );

    expect(assessment.decision).toBe('SAFE_APPLY');
    expect(assessment.hasTrips).toBe(false);
    expect(assessment.workspaceState).toBe('NONE');
    expect(assessment.workspaceImpact).toBe('NONE');
    expect(assessment.historicalImpact).toBe('NONE');

    // Direct apply succeeds with assessmentSignature
    const after = await service.configureOperations(
      'P1',
      {
        configuration: proposed,
        expectedVersion: 1,
        assessmentSignature: assessment.assessmentSignature,
      },
      operationActor
    );
    expect(after.version).toBe(2);
    expect(after.operationalConfiguration.loadingMeasurementMode).toBe('WEIGHBRIDGE');
  });

  it('3. same-profile route change + Trips → REVIEW_REQUIRED / snapshot safe', async () => {
    const initialConfig = operationConfig('WEIGHBRIDGE', 'WEIGHBRIDGE');
    const x = operationGraph(initialConfig);
    x.store['projects/P1/trips/T1'] = {
      tripId: 'T1',
      operationalSnapshot: snapshotOperationalConfiguration(initialConfig, 1, null, {}),
    };
    const service = new ProjectCommandsServerService(x.db);

    const proposed: OperationalConfiguration = {
      ...initialConfig,
      routeConfiguration: {
        ...initialConfig.routeConfiguration,
        distanceKm: 42,
        expectedTravelMinutes: 75,
      },
    };

    const assessment = await service.assessOperationalImpact(
      'P1',
      { configuration: proposed, expectedVersion: 1 },
      operationActor
    );

    expect(assessment.decision).toBe('REVIEW_REQUIRED');
    expect(assessment.hasTrips).toBe(true);
    expect(assessment.historicalImpact).toBe('FUTURE_ONLY_SNAPSHOT_SAFE');
    expect(assessment.changedDomains).toContain('ROUTE');
    expect(assessment.currentProfile).toBe('DUAL_WEIGHBRIDGE');
    expect(assessment.proposedProfile).toBe('DUAL_WEIGHBRIDGE');
  });

  it('4. same-profile shift/checkpoint change + Trips → REVIEW_REQUIRED', async () => {
    const initialConfig = operationConfig('NONE', 'NONE');
    const x = operationGraph(initialConfig);
    x.store['projects/P1/trips/T1'] = { tripId: 'T1' };
    const service = new ProjectCommandsServerService(x.db);

    const proposed: OperationalConfiguration = {
      ...initialConfig,
      requiredCheckpoints: ['loadingStartedAt', 'loadingCompletedAt', 'departedAt'],
      shiftConfiguration: {
        mode: 'DAY_NIGHT',
        shifts: [
          { id: 'S1', nameAr: 'صباحي', nameEn: 'Morning', startMinute: 360, endMinute: 1080 },
          { id: 'S2', nameAr: 'مسائي', nameEn: 'Evening', startMinute: 1080, endMinute: 360 },
        ],
      },
    };

    const assessment = await service.assessOperationalImpact(
      'P1',
      { configuration: proposed, expectedVersion: 1 },
      operationActor
    );

    expect(assessment.decision).toBe('REVIEW_REQUIRED');
    expect(assessment.historicalImpact).toBe('FUTURE_ONLY_SNAPSHOT_SAFE');
    expect(assessment.changedDomains).toContain('SHIFT_WINDOWS');
    expect(assessment.changedDomains).toContain('REQUIRED_CHECKPOINTS');
  });

  it('5. same-profile capacity capability change + bound Workspace → IN_PLACE_MAINTENANCE_REQUIRED', async () => {
    const initialConfig = operationConfig('WEIGHBRIDGE', 'WEIGHBRIDGE');
    const x = operationGraph(initialConfig);
    x.store['projects/P1/workspace_continuity/current'] = {
      binding: {
        spreadsheetId: 'sheet-123',
        projectFolderId: 'folder-123',
        destinationRootFolderId: 'root-123',
        scriptProjectId: 'script-123',
        workspaceBlueprintVersion: 'DUAL_WEIGHBRIDGE_V1',
        revision: 1,
      },
    };
    const service = new ProjectCommandsServerService(x.db);

    const proposed: OperationalConfiguration = {
      ...initialConfig,
      capacityEstimationPolicy: {
        mode: 'PROJECT_STANDARD',
        tonnes: 32,
      },
    };

    const assessment = await service.assessOperationalImpact(
      'P1',
      { configuration: proposed, expectedVersion: 1 },
      operationActor
    );

    expect(assessment.decision).toBe('REVIEW_REQUIRED');
    expect(assessment.workspaceState).toBe('CONNECTED');
    expect(assessment.workspaceImpact).toBe('IN_PLACE_MAINTENANCE_REQUIRED');
    expect(assessment.changedDomains).toContain('CAPACITY_ESTIMATION');
  });

  it('6. bound Workspace same-profile apply → IDs preserved and ensure reconciled', async () => {
    const initialConfig = operationConfig('WEIGHBRIDGE', 'WEIGHBRIDGE');
    const x = operationGraph(initialConfig);
    const initialEnsureOp = {
      operationId: 'op-1',
      projectId: 'P1',
      actorId: 'actor',
      configurationHash: configurationHash(initialConfig),
      bindingRevision: 1,
      spreadsheetId: 'sheet-123',
      profile: 'DUAL_WEIGHBRIDGE',
      profileVersion: 'DUAL_WEIGHBRIDGE_V1',
      phase: 'READY' as const,
      completed: ['PREFLIGHT', 'AUTHORIZATION', 'DESTINATION', 'FOLDER', 'SPREADSHEET', 'BINDING', 'WORKBOOK', 'MASTER_DATA', 'SCRIPT', 'SCRIPT_VERIFY', 'FINAL_SYNC', 'FINAL_VERIFY', 'READY'],
      status: 'READY' as const,
      actionRequired: null,
      revision: 1,
      attempt: 1,
      createdAt: 1000,
      updatedAt: 1000,
      lastProgressAt: 1000,
      leaseOwner: null,
      leaseExpiresAt: 0,
      lastBoundedError: null,
      retryable: false,
      timeline: [],
    };
    x.store['projects/P1/workspace_continuity/current'] = {
      destinationRootFolderId: 'root-123',
      projectFolderId: 'folder-123',
      spreadsheetId: 'sheet-123',
      scriptProjectId: 'script-123',
      provisioningAuthorization: { googleSubject: 'admin@example.invalid' },
      binding: {
        destinationRootFolderId: 'root-123',
        projectFolderId: 'folder-123',
        spreadsheetId: 'sheet-123',
        scriptProjectId: 'script-123',
        workspaceBlueprintVersion: 'DUAL_WEIGHBRIDGE_V1',
        revision: 1,
      },
      ensureOperation: initialEnsureOp,
    };
    const service = new ProjectCommandsServerService(x.db);

    const proposed: OperationalConfiguration = {
      ...initialConfig,
      capacityEstimationPolicy: { mode: 'PROJECT_STANDARD', tonnes: 30 },
    };

    const assessment = await service.assessOperationalImpact(
      'P1',
      { configuration: proposed, expectedVersion: 1 },
      operationActor
    );

    const after = await service.configureOperations(
      'P1',
      {
        configuration: proposed,
        expectedVersion: 1,
        assessmentSignature: assessment.assessmentSignature,
      },
      operationActor
    );

    expect(after.version).toBe(2);

    // Verify Workspace continuity resources are 100% PRESERVED
    const continuity = x.store['projects/P1/workspace_continuity/current'];
    expect(continuity.binding.spreadsheetId).toBe('sheet-123');
    expect(continuity.binding.destinationRootFolderId).toBe('root-123');
    expect(continuity.binding.projectFolderId).toBe('folder-123');
    expect(continuity.binding.scriptProjectId).toBe('script-123');
    expect(continuity.provisioningAuthorization.googleSubject).toBe('admin@example.invalid');

    // Verify ensureOperation configurationHash was updated to new configuration hash
    expect(continuity.ensureOperation.configurationHash).toBe(configurationHash(proposed));
    expect(continuity.ensureOperation.phase).toBe('WORKBOOK');
    expect(continuity.ensureOperation.status).toBe('PREPARING');

    // Verify resource creation phases are preserved, downstream phases re-opened
    expect(continuity.ensureOperation.completed).toEqual([
      'PREFLIGHT',
      'AUTHORIZATION',
      'DESTINATION',
      'FOLDER',
      'SPREADSHEET',
      'BINDING',
    ]);
    expect(continuity.workbookHealth).toBe('REPAIR_REQUIRED');
  });

  it('7. cross-profile + bound Workspace → BLOCKED', async () => {
    const initialConfig = operationConfig('WEIGHBRIDGE', 'WEIGHBRIDGE');
    const x = operationGraph(initialConfig);
    x.store['projects/P1/workspace_continuity/current'] = {
      binding: {
        spreadsheetId: 'sheet-123',
        workspaceBlueprintVersion: 'DUAL_WEIGHBRIDGE_V1',
        revision: 1,
      },
    };
    const service = new ProjectCommandsServerService(x.db);

    const proposed = operationConfig('NONE', 'NONE');
    const assessment = await service.assessOperationalImpact(
      'P1',
      { configuration: proposed, expectedVersion: 1 },
      operationActor
    );

    expect(assessment.decision).toBe('BLOCKED');
    expect(assessment.workspaceImpact).toBe('CROSS_PROFILE_MIGRATION_REQUIRED');
    expect(assessment.reasons).toContain('CROSS_PROFILE_MIGRATION_REQUIRED');

    // Attempting reviewed apply throws error
    await expect(
      service.configureOperations(
        'P1',
        {
          configuration: proposed,
          expectedVersion: 1,
          assessmentSignature: assessment.assessmentSignature,
        },
        operationActor
      )
    ).rejects.toThrow('CROSS_PROFILE_MIGRATION_REQUIRED');
  });

  it('8. cross-profile + historical Trips → BLOCKED', async () => {
    const initialConfig = operationConfig('WEIGHBRIDGE', 'NONE');
    const x = operationGraph(initialConfig);
    x.store['projects/P1/trips/T1'] = { tripId: 'T1' };
    const service = new ProjectCommandsServerService(x.db);

    const proposed = operationConfig('NONE', 'WEIGHBRIDGE');
    const assessment = await service.assessOperationalImpact(
      'P1',
      { configuration: proposed, expectedVersion: 1 },
      operationActor
    );

    expect(assessment.decision).toBe('BLOCKED');
    expect(assessment.historicalImpact).toBe('HISTORICAL_PROFILE_MIGRATION_REQUIRED');
    expect(assessment.reasons).toContain('HISTORICAL_PROFILE_MIGRATION_REQUIRED');

    await expect(
      service.configureOperations(
        'P1',
        {
          configuration: proposed,
          expectedVersion: 1,
          assessmentSignature: assessment.assessmentSignature,
        },
        operationActor
      )
    ).rejects.toThrow('HISTORICAL_PROFILE_MIGRATION_REQUIRED');
  });

  it('9. partial Workspace state → BLOCKED', async () => {
    const initialConfig = operationConfig('NONE', 'NONE');
    const x = operationGraph(initialConfig);
    x.store['projects/P1/workspace_continuity/current'] = {
      fileId: 'partial-file-id',
    };
    const service = new ProjectCommandsServerService(x.db);

    const proposed = operationConfig('WEIGHBRIDGE', 'NONE');
    const assessment = await service.assessOperationalImpact(
      'P1',
      { configuration: proposed, expectedVersion: 1 },
      operationActor
    );

    expect(assessment.decision).toBe('BLOCKED');
    expect(assessment.workspaceImpact).toBe('PARTIAL_WORKSPACE_RECOVERY_REQUIRED');
    expect(assessment.workspaceState).toBe('PARTIAL');
  });

  it('10. active Workspace lease → blocked/busy', async () => {
    const initialConfig = operationConfig('WEIGHBRIDGE', 'WEIGHBRIDGE');
    const x = operationGraph(initialConfig);
    x.store['projects/P1/workspace_continuity/current'] = {
      binding: { spreadsheetId: 'sheet-123', revision: 1 },
      syncOwner: 'sync-worker-1',
      syncLeaseExpiresAt: Date.now() + 60000,
    };
    const service = new ProjectCommandsServerService(x.db);

    const proposed: OperationalConfiguration = {
      ...initialConfig,
      routeConfiguration: { ...initialConfig.routeConfiguration, distanceKm: 99 },
    };

    const assessment = await service.assessOperationalImpact(
      'P1',
      { configuration: proposed, expectedVersion: 1 },
      operationActor
    );

    expect(assessment.decision).toBe('BLOCKED');
    expect(assessment.workspaceState).toBe('BUSY');
    expect(assessment.reasons).toContain('WORKSPACE_BUSY');
  });

  it('11. Project version changes after assessment → stale/rejected', async () => {
    const initialConfig = operationConfig('NONE', 'NONE');
    const x = operationGraph(initialConfig);
    x.store['projects/P1/trips/T1'] = { tripId: 'T1' };
    const service = new ProjectCommandsServerService(x.db);

    const proposed: OperationalConfiguration = {
      ...initialConfig,
      routeConfiguration: { ...initialConfig.routeConfiguration, distanceKm: 50 },
    };

    const assessment = await service.assessOperationalImpact(
      'P1',
      { configuration: proposed, expectedVersion: 1 },
      operationActor
    );

    // Simulate concurrent modification incrementing project version
    x.store['projects/P1'].version = 2;

    await expect(
      service.configureOperations(
        'P1',
        {
          configuration: proposed,
          expectedVersion: 1,
          assessmentSignature: assessment.assessmentSignature,
        },
        operationActor
      )
    ).rejects.toThrow('PROJECT_VERSION_CONFLICT');
  });

  it('12. binding revision changes after assessment → stale/rejected', async () => {
    const initialConfig = operationConfig('WEIGHBRIDGE', 'WEIGHBRIDGE');
    const x = operationGraph(initialConfig);
    x.store['projects/P1/workspace_continuity/current'] = {
      binding: {
        spreadsheetId: 'sheet-123',
        revision: 1,
        workspaceBlueprintVersion: 'DUAL_WEIGHBRIDGE_V1',
      },
    };
    const service = new ProjectCommandsServerService(x.db);

    const proposed: OperationalConfiguration = {
      ...initialConfig,
      routeConfiguration: { ...initialConfig.routeConfiguration, distanceKm: 50 },
    };

    const assessment = await service.assessOperationalImpact(
      'P1',
      { configuration: proposed, expectedVersion: 1 },
      operationActor
    );

    // Simulate binding revision increment before apply
    x.store['projects/P1/workspace_continuity/current'].binding.revision = 2;

    await expect(
      service.configureOperations(
        'P1',
        {
          configuration: proposed,
          expectedVersion: 1,
          assessmentSignature: assessment.assessmentSignature,
        },
        operationActor
      )
    ).rejects.toThrow('OPERATIONAL_PROFILE_ASSESSMENT_STALE');
  });
});

describe('Historical Safety Verification', () => {
  it('freezes previous trip snapshots, profiles, and weights without reinterpretation', async () => {
    const initialConfig = operationConfig('WEIGHBRIDGE', 'WEIGHBRIDGE');
    const x = operationGraph(initialConfig);
    const oldSnapshot = snapshotOperationalConfiguration(initialConfig, 1, 'D1', {});
    const oldTrip = {
      tripId: 'TRIP-OLD',
      projectId: 'P1',
      truckId: 'T',
      driverId: 'D',
      weights: { originNetKg: 24000, destinationNetKg: 23800 },
      operationalSnapshot: oldSnapshot,
      pricingSnapshot: { baseRateSAR: 15, calculatedAmountSAR: 360 },
    };
    x.store['projects/P1/trips/TRIP-OLD'] = structuredClone(oldTrip);
    const service = new ProjectCommandsServerService(x.db);

    const proposed: OperationalConfiguration = {
      ...initialConfig,
      routeConfiguration: { loadingLocation: 'New Origin', unloadingLocation: 'New Dest' },
      capacityEstimationPolicy: { mode: 'PROJECT_STANDARD', tonnes: 35 },
    };

    const assessment = await service.assessOperationalImpact(
      'P1',
      { configuration: proposed, expectedVersion: 1 },
      operationActor
    );

    await service.configureOperations(
      'P1',
      {
        configuration: proposed,
        expectedVersion: 1,
        assessmentSignature: assessment.assessmentSignature,
      },
      operationActor
    );

    // Verify trip is 100% UNTOUCHED
    const persistedTrip = x.store['projects/P1/trips/TRIP-OLD'];
    expect(persistedTrip.operationalSnapshot).toEqual(oldSnapshot);
    expect(persistedTrip.operationalSnapshot.profile).toBe('DUAL_WEIGHBRIDGE');
    expect(persistedTrip.operationalSnapshot.configurationVersion).toBe(1);
    expect(persistedTrip.weights).toEqual({ originNetKg: 24000, destinationNetKg: 23800 });
    expect(persistedTrip.pricingSnapshot).toEqual({ baseRateSAR: 15, calculatedAmountSAR: 360 });
  });
});
