import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  Transaction,
  serverTimestamp, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { ProjectEntity } from '../types/entities';
import { sanitizeUndefined } from '../utils/sanitize';

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
      return snap.data() as ProjectEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  async findByIdInTransaction(projectId: string, transaction: Transaction): Promise<ProjectEntity | null> {
    const docRef = doc(db, this.collectionName, projectId);
    const snap = await transaction.get(docRef);
    return snap.exists() ? (snap.data() as ProjectEntity) : null;
  }

  async listAll(assignedProjectIds?: string[], isSuperAdmin?: boolean): Promise<ProjectEntity[]> {
    if (!auth.currentUser) {
      return [];
    }
    try {
      // If user is not super admin and assignedProjectIds is provided, restrict to assigned projects
      if (!isSuperAdmin && assignedProjectIds !== undefined) {
        if (assignedProjectIds.length === 0) {
          return [];
        }
        const q = query(
          collection(db, this.collectionName),
          where('projectId', 'in', assignedProjectIds.slice(0, 30))
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as ProjectEntity);
      }

      const snap = await getDocs(collection(db, this.collectionName));
      return snap.docs.map(d => d.data() as ProjectEntity);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
    }
  }

  async create(project: Omit<ProjectEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }): Promise<void> {
    const path = `${this.collectionName}/${project.projectId}`;
    if (!auth.currentUser) {
      console.warn(`[ProjectRepository] User unauthenticated. Skipping live Firestore create for ${path}`);
      return;
    }
    try {
      const payload = sanitizeUndefined({
        ...project,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, this.collectionName, project.projectId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async update(projectId: string, updates: Partial<ProjectEntity>, updatedBy: string): Promise<void> {
    const path = `${this.collectionName}/${projectId}`;
    if (!auth.currentUser) {
      console.warn(`[ProjectRepository] User unauthenticated. Skipping live Firestore update for ${path}`);
      return;
    }
    try {
      const payload = sanitizeUndefined({
        ...updates,
        projectId, // immutable ID invariant
        updatedAt: serverTimestamp(),
        updatedBy,
      });
      await updateDoc(doc(db, this.collectionName, projectId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async delete(projectId: string): Promise<void> {
    const path = `${this.collectionName}/${projectId}`;
    if (!auth.currentUser) {
      return;
    }
    try {
      await deleteDoc(doc(db, this.collectionName, projectId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  async updateInTransaction(projectId: string, updates: Partial<ProjectEntity>, updatedBy: string, transaction: Transaction): Promise<void> {
    const docRef = doc(db, this.collectionName, projectId);
    transaction.update(docRef, sanitizeUndefined({
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy
    }));
  }

  subscribeToProjects(
    onData: (projects: ProjectEntity[]) => void, 
    onError?: (err: Error) => void,
    assignedProjectIds?: string[],
    isSuperAdmin?: boolean
  ) {
    if (!auth.currentUser) {
      return () => {};
    }

    if (!isSuperAdmin && assignedProjectIds !== undefined) {
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
        onData(mergedList);
      };

      chunks.forEach((chunk, index) => {
        const q = query(collection(db, this.collectionName), where('projectId', 'in', chunk));
        const unsub = onSnapshot(
          q,
          (snapshot) => {
            chunkResults[index] = snapshot.docs.map(d => d.data() as ProjectEntity);
            chunkInitialEmitted[index] = true;
            notifyCombinedIfReady();
          },
          (error) => {
            if (onError) onError(error);
            handleFirestoreError(error, OperationType.LIST, this.collectionName);
          }
        );
        unsubscribes.push(unsub);
      });

      return () => {
        unsubscribes.forEach(unsub => unsub());
      };
    }

    const q = collection(db, this.collectionName);

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(d => d.data() as ProjectEntity);
        onData(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, this.collectionName);
      }
    );
  }
}

export const projectRepository = new ProjectRepository();
