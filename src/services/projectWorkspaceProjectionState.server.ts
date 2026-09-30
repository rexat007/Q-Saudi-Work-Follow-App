import { adminDb } from '../firebase/admin';
import {
  WorkspaceSheetTab,
  ProjectWorkspaceProjectionState,
  normalizeWorkspaceDirtyTabs,
} from '../types/workspace';

export const PROJECTION_STATE_SUBCOLLECTION = 'workspace_projection_state';
export const PROJECTION_STATE_DOC_ID = 'current';

/**
 * Generates a deterministic clean default projection state for a project.
 */
export function createCleanProjectionState(projectId: string): ProjectWorkspaceProjectionState {
  return {
    projectId,
    dirtyTabs: [],
    dirtySince: null,
    lastMutationAt: null,
    lastMutationReason: null,
    lastSuccessfulProjectionAt: null,
    lastSuccessfulProjectionTabs: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Returns the document reference for the project's projection state document:
 * projects/{projectId}/workspace_projection_state/current
 */
export function getProjectionStateDocRef(projectId: string): any {
  if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
    throw new Error('projectId is required and must be a non-empty string');
  }
  return adminDb
    .collection('projects')
    .doc(projectId.trim())
    .collection(PROJECTION_STATE_SUBCOLLECTION)
    .doc(PROJECTION_STATE_DOC_ID);
}

/**
 * Retrieves the current projection freshness state for a project.
 * If no state document exists, returns a deterministic clean default state.
 */
export async function getState(projectId: string): Promise<ProjectWorkspaceProjectionState> {
  const docRef = getProjectionStateDocRef(projectId);
  const cleanProjectId = projectId.trim();
  const snap = await docRef.get();

  if (!snap.exists) {
    return createCleanProjectionState(cleanProjectId);
  }

  const data = snap.data();
  if (!data) {
    return createCleanProjectionState(cleanProjectId);
  }

  return {
    projectId: cleanProjectId,
    dirtyTabs: normalizeWorkspaceDirtyTabs(data.dirtyTabs || []),
    dirtySince: data.dirtySince || null,
    lastMutationAt: data.lastMutationAt || null,
    lastMutationReason: data.lastMutationReason || null,
    lastSuccessfulProjectionAt: data.lastSuccessfulProjectionAt || null,
    lastSuccessfulProjectionTabs: normalizeWorkspaceDirtyTabs(data.lastSuccessfulProjectionTabs || []),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

/**
 * Pure transition helper to compute next ProjectWorkspaceProjectionState from existing raw data.
 */
export function computeNextDirtyState(
  cleanProjectId: string,
  rawData: any,
  tabs: (string | WorkspaceSheetTab)[],
  reason?: string | null,
  timestamp?: string
): ProjectWorkspaceProjectionState {
  const normalizedIncomingTabs = normalizeWorkspaceDirtyTabs(tabs);
  const existingDirtyTabs = rawData?.dirtyTabs
    ? normalizeWorkspaceDirtyTabs(rawData.dirtyTabs)
    : [];
  const existingDirtySince = rawData?.dirtySince || null;
  const existingLastSuccessfulProjectionAt = rawData?.lastSuccessfulProjectionAt || null;
  const existingLastSuccessfulProjectionTabs = rawData?.lastSuccessfulProjectionTabs
    ? normalizeWorkspaceDirtyTabs(rawData.lastSuccessfulProjectionTabs)
    : [];

  // UNION new dirty tabs with existing dirty tabs in canonical order
  const newDirtyTabs = normalizeWorkspaceDirtyTabs([
    ...existingDirtyTabs,
    ...normalizedIncomingTabs,
  ]);

  const now = timestamp || new Date().toISOString();

  // dirtySince semantics:
  // - set dirtySince only when transitioning from clean -> dirty
  // - preserve original dirtySince while already dirty
  let newDirtySince: string | null = existingDirtySince;
  if (existingDirtyTabs.length === 0 && newDirtyTabs.length > 0) {
    newDirtySince = now;
  } else if (newDirtyTabs.length === 0) {
    newDirtySince = null;
  }

  return {
    projectId: cleanProjectId,
    dirtyTabs: newDirtyTabs,
    dirtySince: newDirtySince,
    lastMutationAt: now,
    lastMutationReason: reason !== undefined ? (reason || null) : (rawData?.lastMutationReason || null),
    lastSuccessfulProjectionAt: existingLastSuccessfulProjectionAt,
    lastSuccessfulProjectionTabs: existingLastSuccessfulProjectionTabs,
    updatedAt: now,
  };
}

/**
 * Atomically marks one or more Workspace sheet tabs as dirty using an existing Firestore transaction.
 * MUST be called AFTER canonical reads/decisions and BEFORE canonical transaction writes.
 * 1. Reads projects/{projectId}/workspace_projection_state/current via transaction.get()
 * 2. Computes next dirty state
 * 3. Schedules write via transaction.set()
 * Returns the computed next state.
 */
export async function markDirtyInTransaction(
  transaction: any,
  projectId: string,
  tabs: (string | WorkspaceSheetTab)[],
  reason?: string | null,
  timestamp?: string
): Promise<ProjectWorkspaceProjectionState> {
  if (!transaction || typeof transaction.get !== 'function' || typeof transaction.set !== 'function') {
    throw new Error('A valid Firestore transaction is required for markDirtyInTransaction');
  }
  const cleanProjectId = projectId?.trim();
  if (!cleanProjectId) {
    throw new Error('projectId is required and must be a non-empty string');
  }

  const docRef = getProjectionStateDocRef(cleanProjectId);
  const snap = await transaction.get(docRef);
  const exists = snap.exists;
  const rawData = exists ? snap.data() : null;

  const nextState = computeNextDirtyState(cleanProjectId, rawData, tabs, reason, timestamp);
  transaction.set(docRef, nextState);
  return nextState;
}

/**
 * Atomically marks one or more Workspace sheet tabs as dirty in Firestore.
 * - Unions new dirty tabs with existing dirty tabs in deterministic canonical order.
 * - Sets dirtySince only when transitioning from clean to dirty.
 * - Preserves the existing dirtySince if the state was already dirty.
 * - Updates lastMutationAt and optionally lastMutationReason.
 * - Preserves lastSuccessfulProjectionAt and lastSuccessfulProjectionTabs.
 */
export async function markDirty(
  projectId: string,
  tabs: (string | WorkspaceSheetTab)[],
  reason?: string | null
): Promise<ProjectWorkspaceProjectionState> {
  const cleanProjectId = projectId?.trim();
  if (!cleanProjectId) {
    throw new Error('projectId is required and must be a non-empty string');
  }

  return await adminDb.runTransaction(async (transaction: any) => {
    return await markDirtyInTransaction(transaction, cleanProjectId, tabs, reason);
  });
}

/**
 * Atomically marks specific Workspace domains as successfully projected.
 * - Removes ONLY the successfully projected tabs from dirtyTabs.
 * - Preserves dirty tabs not included in the successful projection.
 * - Updates lastSuccessfulProjectionAt and lastSuccessfulProjectionTabs.
 * - If dirtyTabs becomes empty, dirtySince becomes null.
 * - If dirty tabs remain, preserves original dirtySince.
 */
export async function markProjectionSuccessful(
  projectId: string,
  projectedTabs: (string | WorkspaceSheetTab)[],
  projectedAt?: string
): Promise<ProjectWorkspaceProjectionState> {
  const docRef = getProjectionStateDocRef(projectId);
  const cleanProjectId = projectId.trim();
  const normalizedProjected = normalizeWorkspaceDirtyTabs(projectedTabs);

  return await adminDb.runTransaction(async (transaction: any) => {
    const snap = await transaction.get(docRef);
    const exists = snap.exists;
    const rawData = exists ? snap.data() : null;

    const existingDirtyTabs = rawData?.dirtyTabs
      ? normalizeWorkspaceDirtyTabs(rawData.dirtyTabs)
      : [];
    const existingDirtySince = rawData?.dirtySince || null;

    // Remove ONLY successfully projected tabs from dirtyTabs
    const projectedSet = new Set(normalizedProjected);
    const remainingDirty = existingDirtyTabs.filter((tab) => !projectedSet.has(tab));
    const newDirtyTabs = normalizeWorkspaceDirtyTabs(remainingDirty);

    const now = new Date().toISOString();
    const successTimestamp = projectedAt || now;

    // If dirtyTabs becomes empty: dirtySince = null
    // If dirty tabs remain: preserve the existing dirtySince
    let newDirtySince: string | null = null;
    if (newDirtyTabs.length > 0) {
      newDirtySince = existingDirtySince || now;
    } else {
      newDirtySince = null;
    }

    const nextState: ProjectWorkspaceProjectionState = {
      projectId: cleanProjectId,
      dirtyTabs: newDirtyTabs,
      dirtySince: newDirtySince,
      lastMutationAt: rawData?.lastMutationAt || null,
      lastMutationReason: rawData?.lastMutationReason || null,
      lastSuccessfulProjectionAt: successTimestamp,
      lastSuccessfulProjectionTabs: normalizedProjected,
      updatedAt: now,
    };

    transaction.set(docRef, nextState);
    return nextState;
  });
}

export const projectWorkspaceProjectionStateServer = {
  createCleanProjectionState,
  getProjectionStateDocRef,
  getState,
  computeNextDirtyState,
  markDirtyInTransaction,
  markDirty,
  markProjectionSuccessful,
};
