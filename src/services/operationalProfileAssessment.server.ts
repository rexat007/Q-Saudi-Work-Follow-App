import { createHash } from 'node:crypto';
import type { ProjectEntity } from '../types/entities';
import type {
  OperationalConfiguration,
  OperationalProfile,
  OperationalChangeDomain,
  AssessmentDecision,
  WorkspaceImpactClass,
  HistoricalImpactClass,
  OperationalImpactAssessment,
} from '../types/operationalProfile';
import { resolveOperationalProfile } from './operationalProfileResolver';
import { configurationHash, ordered } from './workspaceProvisioning.server';

export interface EvaluateOperationalImpactInput {
  projectId: string;
  expectedVersion: number;
  currentProject: ProjectEntity;
  proposedConfiguration: OperationalConfiguration;
  hasTrips: boolean;
  continuityData: any | null;
}

export function computeAssessmentSignature(facts: {
  projectId: string;
  expectedVersion: number;
  currentConfigurationHash: string;
  proposedConfigurationHash: string;
  hasTrips: boolean;
  bindingRevision: number;
  spreadsheetId: string | null;
  workspaceBlueprintVersion: string | null;
  decision: string;
}): string {
  return createHash('sha256')
    .update(
      JSON.stringify([
        facts.projectId,
        facts.expectedVersion,
        facts.currentConfigurationHash,
        facts.proposedConfigurationHash,
        facts.hasTrips,
        facts.bindingRevision,
        facts.spreadsheetId,
        facts.workspaceBlueprintVersion,
        facts.decision,
        'QSAUDI_OPERATIONAL_ASSESSMENT_V1',
      ])
    )
    .digest('hex');
}

export function evaluateOperationalImpact(
  input: EvaluateOperationalImpactInput
): OperationalImpactAssessment {
  const {
    projectId,
    expectedVersion,
    currentProject,
    proposedConfiguration,
    hasTrips,
    continuityData,
  } = input;

  const currentConfig = currentProject.operationalConfiguration || null;
  const currentProfile: OperationalProfile | null = currentConfig
    ? resolveOperationalProfile(currentConfig)
    : null;
  const proposedProfile: OperationalProfile = resolveOperationalProfile(proposedConfiguration);

  const changedDomains: OperationalChangeDomain[] = [];
  if (
    !currentConfig ||
    currentConfig.loadingMeasurementMode !== proposedConfiguration.loadingMeasurementMode ||
    currentConfig.unloadingMeasurementMode !== proposedConfiguration.unloadingMeasurementMode
  ) {
    changedDomains.push('MEASUREMENT_PROFILE');
  }
  if (!currentConfig || currentConfig.driverIntakeMode !== proposedConfiguration.driverIntakeMode) {
    changedDomains.push('DRIVER_INTAKE');
  }
  if (
    !currentConfig ||
    JSON.stringify(ordered(currentConfig.routeConfiguration)) !==
      JSON.stringify(ordered(proposedConfiguration.routeConfiguration))
  ) {
    changedDomains.push('ROUTE');
  }
  if (
    !currentConfig ||
    JSON.stringify(ordered(currentConfig.shiftConfiguration)) !==
      JSON.stringify(ordered(proposedConfiguration.shiftConfiguration))
  ) {
    changedDomains.push('SHIFT_WINDOWS');
  }
  if (
    !currentConfig ||
    JSON.stringify(ordered(currentConfig.capacityEstimationPolicy)) !==
      JSON.stringify(ordered(proposedConfiguration.capacityEstimationPolicy))
  ) {
    changedDomains.push('CAPACITY_ESTIMATION');
  }
  if (
    !currentConfig ||
    JSON.stringify(ordered(currentConfig.requiredCheckpoints || [])) !==
      JSON.stringify(ordered(proposedConfiguration.requiredCheckpoints || []))
  ) {
    changedDomains.push('REQUIRED_CHECKPOINTS');
  }

  const isIdentical =
    currentConfig !== null &&
    JSON.stringify(ordered(currentConfig)) === JSON.stringify(ordered(proposedConfiguration));

  const binding = continuityData?.binding || null;
  const hasBinding = Boolean(binding);
  const hasPartial =
    !hasBinding &&
    Boolean(
      continuityData?.fileId ||
        continuityData?.folderId ||
        continuityData?.destinationRootFolderId ||
        continuityData?.stage
    );

  const now = Date.now();
  const ensureOp = continuityData?.ensureOperation;
  const isBusy = Boolean(
    (ensureOp?.leaseOwner && ensureOp.leaseExpiresAt > now) ||
      (continuityData?.syncOwner && continuityData.syncLeaseExpiresAt > now) ||
      (continuityData?.owner && continuityData.leaseUntil > now)
  );

  const workspaceState: 'NONE' | 'CONNECTED' | 'PARTIAL' | 'BUSY' = isBusy
    ? 'BUSY'
    : hasBinding
    ? 'CONNECTED'
    : hasPartial
    ? 'PARTIAL'
    : 'NONE';

  let decision: AssessmentDecision = 'SAFE_APPLY';
  let workspaceImpact: WorkspaceImpactClass = 'NONE';
  let historicalImpact: HistoricalImpactClass = 'NONE';
  const reasons: string[] = [];

  const isLegacyDualCandidate =
    !currentConfig &&
    continuityData?.binding?.workspaceBlueprintVersion === 'SABIL-HAIL-V1' &&
    proposedProfile === 'DUAL_WEIGHBRIDGE';

  if (isIdentical) {
    decision = 'NO_CHANGE';
    workspaceImpact = 'NONE';
    historicalImpact = 'NONE';
    reasons.push('CONFIGURATION_IDENTICAL');
  } else if (isBusy) {
    decision = 'BLOCKED';
    workspaceImpact = 'NONE';
    reasons.push('WORKSPACE_BUSY');
  } else if (hasPartial) {
    decision = 'BLOCKED';
    workspaceImpact = 'PARTIAL_WORKSPACE_RECOVERY_REQUIRED';
    reasons.push('PARTIAL_WORKSPACE_RECOVERY_REQUIRED');
  } else if (isLegacyDualCandidate) {
    decision = 'REVIEW_REQUIRED';
    workspaceImpact = 'IN_PLACE_MAINTENANCE_REQUIRED';
    historicalImpact = hasTrips ? 'FUTURE_ONLY_SNAPSHOT_SAFE' : 'NONE';
    reasons.push('LEGACY_DUAL_COMPATIBILITY_AVAILABLE');
  } else if (currentProfile !== null && currentProfile !== proposedProfile) {
    // Cross-profile change
    if (hasTrips) {
      decision = 'BLOCKED';
      historicalImpact = 'HISTORICAL_PROFILE_MIGRATION_REQUIRED';
      reasons.push('HISTORICAL_PROFILE_MIGRATION_REQUIRED');
    }
    if (hasBinding) {
      decision = 'BLOCKED';
      workspaceImpact = 'CROSS_PROFILE_MIGRATION_REQUIRED';
      reasons.push('CROSS_PROFILE_MIGRATION_REQUIRED');
    }
    if (!hasTrips && !hasBinding) {
      decision = 'SAFE_APPLY';
      workspaceImpact = 'NONE';
      historicalImpact = 'NONE';
      reasons.push('CROSS_PROFILE_SAFE_WITHOUT_RESOURCES_OR_TRIPS');
    }
  } else {
    // Same profile (or initial setup from null without legacy dual)
    if (hasTrips) {
      historicalImpact = 'FUTURE_ONLY_SNAPSHOT_SAFE';
    }
    if (hasBinding) {
      if (changedDomains.includes('CAPACITY_ESTIMATION')) {
        workspaceImpact = 'IN_PLACE_MAINTENANCE_REQUIRED';
      } else {
        workspaceImpact = 'REFRESH_REQUIRED';
      }
    }
    if (hasTrips || hasBinding) {
      decision = 'REVIEW_REQUIRED';
      reasons.push('SAME_PROFILE_REVIEW_REQUIRED');
    } else {
      decision = 'SAFE_APPLY';
      reasons.push('NO_TRIPS_NO_WORKSPACE_SAFE_APPLY');
    }
  }

  const currentConfigurationHash = configurationHash(currentConfig);
  const proposedConfigurationHash = configurationHash(proposedConfiguration);
  const bindingRevision = binding?.revision || 0;
  const spreadsheetId = binding?.spreadsheetId || null;
  const workspaceBlueprintVersion = binding?.workspaceBlueprintVersion || null;

  const assessmentSignature = computeAssessmentSignature({
    projectId,
    expectedVersion,
    currentConfigurationHash,
    proposedConfigurationHash,
    hasTrips,
    bindingRevision,
    spreadsheetId,
    workspaceBlueprintVersion,
    decision,
  });

  return {
    projectId,
    projectVersion: expectedVersion,
    currentProfile,
    proposedProfile,
    changedDomains,
    hasTrips,
    workspaceState,
    workspaceImpact,
    historicalImpact,
    decision,
    reasons,
    assessmentSignature,
  };
}
