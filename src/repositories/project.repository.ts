import { decodeProject } from '../utils/persistenceBoundary';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  Transaction,
  onSnapshot,
  query,
  where,
  documentId
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { ProjectEntity } from '../types/entities';

export class ProjectRepository {
  private readonly collectionName = 'projects';

  async findById(projectId: string): Promise<ProjectEntity | null> {
    const path = `${this.collectionName}/${projectId}`;
    if (!auth.currentUser) {
      return null;
    }
    try {
      const snap = await getDoc(doc(db, this.collectionName, projectId));
      if (!snap.exists()) return null;
      return decodeProject<ProjectEntity>(snap.data(), projectId);
    } catch (error) {
      if ((error as any)?.code === 'PERSISTENCE_BOUNDARY_INVALID') throw error;
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  async findByIdInTransaction(projectId: string, transaction: Transaction): Promise<ProjectEntity | null> {
    const docRef = doc(db, this.collectionName, projectId);
    const snap = await transaction.get(docRef);
    return snap.exists() ? (decodeProject<ProjectEntity>(snap.data(), projectId)) : null;
  }

  async listAll(assignedProjectIds: string[] = [], isSuperAdmin = false): Promise<ProjectEntity[]> {
    if (!auth.currentUser) {
      return [];
    }
    try {
      // Omitted authority is an empty scope, never a global read.
      if (isSuperAdmin !== true) {
        const ids = [...new Set(assignedProjectIds || [])].sort();
        if (!ids.length) return [];
        const results: ProjectEntity[] = [];
        for (let i = 0; i < ids.length; i += 30) {
          const q = query(collection(db, this.collectionName), where(documentId(), 'in', ids.slice(i, i + 30)));
          const snap = await getDocs(q);
          results.push(...snap.docs.map(d => decodeProject<ProjectEntity>(d.data(), d.id)));
        }
        return [...new Map(results.map(project => [project.projectId, project])).values()];
      }

      const snap = await getDocs(collection(db, this.collectionName));
      return snap.docs.map(d => decodeProject<ProjectEntity>(d.data(), d.id));
    } catch (error) {
      if ((error as any)?.code === 'PERSISTENCE_BOUNDARY_INVALID') throw error;
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
    }
  }

  // Compatibility signatures remain for unreachable legacy callers; no browser write authority.
  async create(_project: Omit<ProjectEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }): Promise<void> {
    throw new Error('PROJECT_SERVER_COMMAND_REQUIRED');
  }
  async update(_projectId: string, _updates: Partial<ProjectEntity>, _updatedBy: string): Promise<void> {
    throw new Error('PROJECT_SERVER_COMMAND_REQUIRED');
  }
  async delete(_projectId: string): Promise<void> {
    throw new Error('PROJECT_DELETE_NOT_SUPPORTED');
  }
  async updateInTransaction(_projectId: string, _updates: Partial<ProjectEntity>, _updatedBy: string, _transaction: Transaction): Promise<void> {
    throw new Error('PROJECT_SERVER_COMMAND_REQUIRED');
  }

  subscribeToProjects(
    onData: (projects: ProjectEntity[]) => void, 
    onError?: (err: Error) => void,
    assignedProjectIds: string[] = [],
    isSuperAdmin = false
  ) {
    let active = true;
    let failed = false;
    const emit = (projects: ProjectEntity[]) => { if (active && !failed) onData(projects); };
    const fail = (error: Error) => {
      if (!active || failed) return;
      failed = true;
      onData([]);
      if (onError) onError(error);
      else console.error('Project subscription failed', error);
    };
    if (!auth.currentUser) { emit([]); return () => { active = false; }; }

    if (isSuperAdmin !== true) {
      assignedProjectIds = [...new Set(assignedProjectIds || [])].sort();
      if (assignedProjectIds.length === 0) {
        onData([]);
        return () => {};
      }

      const chunkSize = 30;
      const chunks: string[][] = [];
      for (let i = 0; i < assignedProjectIds.length; i += chunkSize) {
        chunks.push(assignedProjectIds.slice(i, i + chunkSize));
      }

      const chunkResults: ProjectEntity[][] = new Array(chunks.length).fill(null).map(() => []);
      const chunkInitialEmitted: boolean[] = new Array(chunks.length).fill(false);
      const unsubscribes: (() => void)[] = [];

      const notifyCombinedIfReady = () => {
        if (!chunkInitialEmitted.every(Boolean)) {
          return;
        }
        const map = new Map<string, ProjectEntity>();
        for (const chunkList of chunkResults) {
          for (const proj of chunkList) {
            if (proj && proj.projectId) {
              map.set(proj.projectId, proj);
            }
          }
        }
        const mergedList = Array.from(map.values());
        emit(mergedList);
      };

      chunks.forEach((chunk, index) => {
        const q = query(collection(db, this.collectionName), where(documentId(), 'in', chunk));
        const unsub = onSnapshot(
          q,
          (snapshot) => {
            try {
              chunkResults[index] = snapshot.docs.map(d => decodeProject<ProjectEntity>(d.data(), d.id));
              chunkInitialEmitted[index] = true;
              notifyCombinedIfReady();
            } catch (error) { fail(error as Error); }
          },
          (error) => {
            fail(error);
          }
        );
        unsubscribes.push(unsub);
      });

      return () => {
        active = false;
        unsubscribes.forEach(unsub => unsub());
      };
    }

    const q = collection(db, this.collectionName);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try { emit(snapshot.docs.map(d => decodeProject<ProjectEntity>(d.data(), d.id))); }
        catch (error) { fail(error as Error); }
      },
      (error) => {
        fail(error);
      }
    );
    return () => { active = false; unsubscribe(); };
  }
}

export const projectRepository = new ProjectRepository();
