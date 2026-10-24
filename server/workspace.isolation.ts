import type { Request, Response, NextFunction } from 'express';
import { adminDb } from '../src/firebase/admin';
import type { MigrationJob } from '../src/types/workspace';

export function workspaceError(code: string, statusCode = 409): Error & { code: string; statusCode: number } {
  return Object.assign(new Error(code), { code, statusCode });
}

export function normalizeStorageId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,256}$/.test(value.trim())) {
    throw workspaceError('INVALID_STORAGE_RESOURCE_ID', 400);
  }
  return value.trim();
}

export function strictWorkspaceProject(req: Request, res: Response, next: NextFunction) {
  const values = [req.params?.projectId, req.body?.projectId, req.body?.project?.projectId, req.query?.projectId]
    .filter(value => value !== undefined);
  if (!values.length) return res.status(400).json({ success: false, code: 'PROJECT_ID_REQUIRED' });
  if (values.some(value => typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value))) {
    return res.status(400).json({ success: false, code: 'INVALID_PROJECT_ID' });
  }
  if (values.some(value => value !== values[0])) {
    return res.status(400).json({ success: false, code: 'CONFLICTING_PROJECT_ID' });
  }
  const user = (req as any).user;
  if (!user) return res.status(401).json({ success: false, code: 'UNAUTHORIZED_ACCESS' });
  if (user.role !== 'SUPER_ADMIN' && (!Array.isArray(user.assignedProjectIds) || !user.assignedProjectIds.includes(values[0]))) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN_PROJECT_ACCESS' });
  }
  res.locals.workspaceProjectId = values[0];
  next();
}

export function projectStorage(project: any) {
  const settings = project.settings || {};
  const profile = settings.storageProfile || {};
  return {
    folderId: profile.currentStorageFolderId || settings.googleDriveFolderId || project.googleDriveFolderId,
    spreadsheetId: profile.currentSpreadsheetId || settings.googleSpreadsheetId || project.googleSpreadsheetId,
    folderIds: [profile.currentStorageFolderId, profile.previousStorageFolderId, settings.googleDriveFolderId, project.googleDriveFolderId].filter(Boolean) as string[],
    spreadsheetIds: [profile.currentSpreadsheetId, profile.previousSpreadsheetId, settings.googleSpreadsheetId, project.googleSpreadsheetId].filter(Boolean) as string[],
  };
}

export class WorkspaceStorageBoundary {
  constructor(private db: any = adminDb) {}

  async project(projectId: string): Promise<any> {
    const snapshot = await this.db.collection('projects').doc(projectId).get();
    if (!snapshot.exists) throw workspaceError('PROJECT_NOT_FOUND', 404);
    const project = snapshot.data();
    if (!project || (project.projectId !== undefined && project.projectId !== projectId)) throw workspaceError('PROJECT_REGISTRY_MISMATCH');
    return { ...project, projectId };
  }

  private checkProjects(snapshot: any, projectId: string, folderId: string) {
    for (const doc of snapshot.docs) {
      const other = doc.data();
      if (doc.id === projectId) continue;
      if (projectStorage(other).folderIds.includes(folderId)) throw workspaceError('STORAGE_TARGET_CONFLICT');
    }
  }

  async assertCanonicalStorage(project: any): Promise<void> {
    const storage = projectStorage(project);
    const projects = await this.db.collection('projects').get();
    for (const other of projects.docs) {
      if (other.id === project.projectId) continue;
      const registered = projectStorage(other.data());
      if (storage.folderIds.some(id => registered.folderIds.includes(id)) || storage.spreadsheetIds.some(id => registered.spreadsheetIds.includes(id))) {
        throw workspaceError('STORAGE_REGISTRY_CONFLICT');
      }
    }
    for (const folder of storage.folderIds) {
      const reservation = await this.db.collection('workspace_migration_jobs').doc(normalizeStorageId(folder)).get();
      if (reservation.exists && reservation.data()?.projectId !== project.projectId) throw workspaceError('STORAGE_TARGET_CONFLICT');
    }
  }

  async foreignFolderIds(projectId: string): Promise<string[]> {
    const projects = await this.db.collection('projects').get();
    const jobs = await this.db.collection('workspace_migration_jobs').get();
    return [
      ...projects.docs.filter((doc: any) => doc.id !== projectId).flatMap((doc: any) => projectStorage(doc.data()).folderIds),
      ...jobs.docs.filter((doc: any) => doc.data()?.projectId !== projectId).map((doc: any) => doc.id),
    ];
  }

  async eligibleDestination(projectId: string, target: unknown): Promise<string> {
    const folderId = normalizeStorageId(target);
    const project = await this.project(projectId);
    if (projectStorage(project).folderId === folderId) throw workspaceError('CURRENT_STORAGE_DESTINATION', 400);
    const projects = await this.db.collection('projects').get();
    this.checkProjects(projects, projectId, folderId);
    const existing = await this.db.collection('workspace_migration_jobs').doc(folderId).get();
    if (existing.exists) {
      const job = existing.data();
      if (!job || job.targetFolderId !== folderId || job.projectId !== projectId) throw workspaceError('STORAGE_TARGET_CONFLICT');
    }
    return folderId;
  }

  async reserve(job: MigrationJob): Promise<{ job: MigrationJob; created: boolean }> {
    const target = normalizeStorageId(job.targetFolderId);
    const ref = this.db.collection('workspace_migration_jobs').doc(target);
    return this.db.runTransaction(async (transaction: any) => {
      const snapshot = await transaction.get(ref);
      const projects = await transaction.get(this.db.collection('projects'));
      this.checkProjects(projects, job.projectId, target);
      const own = projects.docs.find((doc: any) => doc.id === job.projectId);
      if (!own) throw workspaceError('PROJECT_NOT_FOUND', 404);
      if (projectStorage(own.data()).folderId === target) throw workspaceError('CURRENT_STORAGE_DESTINATION', 400);
      if (snapshot.exists) {
        const previous = snapshot.data() as MigrationJob;
        if (!previous || previous.projectId !== job.projectId || previous.targetFolderId !== target) throw workspaceError('STORAGE_TARGET_CONFLICT');
        if (previous.migrationJobId === job.migrationJobId && previous.targetProvider === job.targetProvider) return { job: previous, created: false };
        const active = ['REQUESTED', 'VALIDATING', 'COPYING', 'VERIFYING', 'READY_TO_SWITCH'].includes(previous.status);
        throw workspaceError(active ? 'MIGRATION_ALREADY_ACTIVE' : 'MIGRATION_HISTORY_PROTECTED');
      }
      transaction.set(ref, { ...job, targetFolderId: target });
      return { job: { ...job, targetFolderId: target }, created: true };
    });
  }

  async save(job: MigrationJob): Promise<void> {
    const ref = this.db.collection('workspace_migration_jobs').doc(normalizeStorageId(job.targetFolderId));
    await this.db.runTransaction(async (transaction: any) => {
      const snapshot = await transaction.get(ref);
      const previous = snapshot.exists ? snapshot.data() : null;
      if (!previous || previous.targetFolderId !== job.targetFolderId || previous.projectId !== job.projectId || previous.migrationJobId !== job.migrationJobId || previous.targetProvider !== job.targetProvider) {
        throw workspaceError('MIGRATION_RESERVATION_MISMATCH');
      }
      transaction.update(ref, job);
    });
  }

  async jobs(projectId: string): Promise<MigrationJob[]> {
    const snapshot = await this.db.collection('workspace_migration_jobs').where('projectId', '==', projectId).get();
    return snapshot.docs.map((doc: any) => {
      const job = doc.data() as MigrationJob;
      if (job.projectId !== projectId || job.targetFolderId !== doc.id) throw workspaceError('MIGRATION_REGISTRY_MISMATCH');
      return job;
    });
  }
}
