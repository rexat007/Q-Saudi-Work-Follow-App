import { decodePersistence, PersistenceBoundaryError } from '../utils/persistenceBoundary';
import { sanitizeUndefined } from '../utils/sanitize';
import { adminDb } from '../firebase/admin';
import {isMasterTab} from './projectWorkspaceMasterContract';
import {
  WorkspaceSheetTab,
  ProjectWorkspaceProjectionState,
  normalizeWorkspaceDirtyTabs,
} from '../types/workspace';

export const PROJECTION_STATE_SUBCOLLECTION = 'workspace_projection_state';
export const PROJECTION_STATE_DOC_ID = 'current';

function decodeProjection(raw: unknown, projectId: string): any {
  const data = decodePersistence<any>(raw, {
    projectId,
    times: { updatedAt: 'iso', dirtySince: 'iso', lastMutationAt: 'iso', lastSuccessfulProjectionAt: 'iso' },
  });
  if (typeof data.updatedAt !== 'string') throw new PersistenceBoundaryError('updatedAt');
  for (const field of ['dirtyTabs', 'lastSuccessfulProjectionTabs']) {
    if (data[field] !== undefined && !Array.isArray(data[field])) throw new PersistenceBoundaryError(field);
  }
  if (data.mutationRevision !== undefined && (!Number.isSafeInteger(data.mutationRevision) || data.mutationRevision < 0)) throw new PersistenceBoundaryError('mutationRevision');
  return data;
}

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
    mutationRevision: 0,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Returns the document reference for the project's projection state document:
 * projects/{projectId}/workspace_projection_state/current
 */
export function getProjectionStateDocRef(projectId: string,database:any=adminDb): any {
  if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
    throw new Error('projectId is required and must be a non-empty string');
  }
  return database
    .collection('projects')
    .doc(projectId.trim())
    .collection(PROJECTION_STATE_SUBCOLLECTION)
    .doc(PROJECTION_STATE_DOC_ID);
}

/**
 * Retrieves the current projection freshness state for a project.
 * If no state document exists, returns a deterministic clean default state.
 */
export async function getState(projectId: string,database:any=adminDb,transaction?:any): Promise<ProjectWorkspaceProjectionState> {
  const docRef = getProjectionStateDocRef(projectId,database);
  const cleanProjectId = projectId.trim();
  const snap = transaction ? await transaction.get(docRef) : await docRef.get();

  if (!snap.exists) {
    return createCleanProjectionState(cleanProjectId);
  }

  const data = decodeProjection(snap.data(), cleanProjectId);

  return {
    projectId: cleanProjectId,
    dirtyTabs: normalizeWorkspaceDirtyTabs(data.dirtyTabs || []),
    dirtySince: data.dirtySince || null,
    lastMutationAt: data.lastMutationAt || null,
    lastMutationReason: data.lastMutationReason || null,
    lastSuccessfulProjectionAt: data.lastSuccessfulProjectionAt || null,
    lastSuccessfulProjectionTabs: normalizeWorkspaceDirtyTabs(data.lastSuccessfulProjectionTabs || []),
    mutationRevision:
      typeof data.mutationRevision === 'number' && Number.isFinite(data.mutationRevision)
        ? data.mutationRevision
        : 0,
    updatedAt: data.updatedAt,
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
  const currentRevision =
    typeof rawData?.mutationRevision === 'number' && Number.isFinite(rawData.mutationRevision)
      ? rawData.mutationRevision
      : 0;

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
    mutationRevision: currentRevision + 1,
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
  timestamp?: string,
  database: any = adminDb
): Promise<ProjectWorkspaceProjectionState> {
  if (!transaction || typeof transaction.get !== 'function' || typeof transaction.set !== 'function') {
    throw new Error('A valid Firestore transaction is required for markDirtyInTransaction');
  }
  const cleanProjectId = projectId?.trim();
  if (!cleanProjectId) {
    throw new Error('projectId is required and must be a non-empty string');
  }

  const docRef = database.collection('projects').doc(cleanProjectId).collection(PROJECTION_STATE_SUBCOLLECTION).doc(PROJECTION_STATE_DOC_ID);
  const snap = await transaction.get(docRef);
  const exists = snap.exists;
  const rawData = exists ? decodeProjection(snap.data(), cleanProjectId) : null;

  const nextState = computeNextDirtyState(cleanProjectId, rawData, tabs, reason, timestamp);
  transaction.set(docRef, sanitizeUndefined(nextState));
  const masterTabs=nextState.dirtyTabs.filter(isMasterTab);
  if(masterTabs.length)transaction.set(database.collection('projects').doc(cleanProjectId).collection('workspace_sync_outbox').doc('MASTER_DATA'),{
    projectId:cleanProjectId,kind:'MASTER_DATA',revision:nextState.mutationRevision,dirtyTabs:masterTabs,status:'PENDING',updatedAt:nextState.updatedAt,
  });
  return nextState;
}

/**
 * Atomically marks one or more Workspace sheet tabs as dirty in Firestore.
 * - Unions new dirty tabs with existing dirty tabs in deterministic canonical order.
 * - Sets dirtySince only when transitioning from clean to dirty.
 * - Preserves the existing dirtySince if the state was already dirty.
 * - Updates lastMutationAt and optionally lastMutationReason.
 * - Preserves lastSuccessfulProjectionAt and lastSuccessfulProjectionTabs.
 * - Increments mutationRevision by 1.
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
 * - When expectedMutationRevision is provided, validates that current revision matches expected revision.
 * - If revision mismatch is detected, throws a 409 conflict error and makes NO state changes.
 * - Removes ONLY the successfully projected tabs from dirtyTabs.
 * - Preserves dirty tabs not included in the successful projection.
 * - Updates lastSuccessfulProjectionAt and lastSuccessfulProjectionTabs.
 * - Preserves mutationRevision unchanged.
 * - If dirtyTabs becomes empty, dirtySince becomes null.
 * - If dirty tabs remain, preserves original dirtySince.
 */
export async function markProjectionSuccessful(
  projectId: string,
  projectedTabs: (string | WorkspaceSheetTab)[],
  projectedAt?: string,
  expectedMutationRevision?: number,
  database:any=adminDb,
  leaseGuard?:{owner:string;authorize?:(transaction:any)=>Promise<unknown>}
): Promise<ProjectWorkspaceProjectionState> {
  const docRef = getProjectionStateDocRef(projectId,database);
  const cleanProjectId = projectId.trim();
  const normalizedProjected = normalizeWorkspaceDirtyTabs(projectedTabs);

  return await database.runTransaction(async (transaction: any) => {
    if(leaseGuard?.authorize)await leaseGuard.authorize(transaction);
    const snap = await transaction.get(docRef);
    if(leaseGuard){
      const lease=await transaction.get(database.collection('projects').doc(cleanProjectId).collection('workspace_continuity').doc('current'));
      const current=lease.data();
      if(current?.syncOwner!==leaseGuard.owner||current?.syncLeaseExpiresAt<=Date.now()||current?.syncLeaseRevision!==(current?.binding?.revision??0)||current?.syncLeaseSpreadsheetId!==current?.binding?.spreadsheetId)throw Object.assign(new Error('WORKSPACE_EXECUTION_FENCED'),{code:'WORKSPACE_EXECUTION_FENCED'});
    }
    const exists = snap.exists;
    const rawData = exists ? decodeProjection(snap.data(), cleanProjectId) : null;

    const currentRevision =
      typeof rawData?.mutationRevision === 'number' && Number.isFinite(rawData.mutationRevision)
        ? rawData.mutationRevision
        : 0;

    if (typeof expectedMutationRevision === 'number' && currentRevision !== expectedMutationRevision) {
      const conflictError: any = new Error(
        `Workspace projection revision conflict: current revision is ${currentRevision} but expected ${expectedMutationRevision}`
      );
      conflictError.code = 'WORKSPACE_PROJECTION_REVISION_CONFLICT';
      conflictError.statusCode = 409;
      throw conflictError;
    }

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
      mutationRevision: currentRevision,
      updatedAt: now,
    };

    transaction.set(docRef, sanitizeUndefined(nextState));
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
