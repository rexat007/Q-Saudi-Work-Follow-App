import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp, 
  onSnapshot,
  query,
  where,
  Transaction
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { ProjectCarrierRosterEntity } from '../types/entities';
import { sanitizeUndefined } from '../utils/sanitize';

export class ProjectCarrierRosterRepository {
  private inMemoryCache: Map<string, ProjectCarrierRosterEntity> = new Map();

  private getPath(projectId: string, rosterId?: string): string {
    return rosterId ? `projects/${projectId}/roster/${rosterId}` : `projects/${projectId}/roster`;
  }

  async findById(projectId: string, rosterId: string): Promise<ProjectCarrierRosterEntity | null> {
    const path = this.getPath(projectId, rosterId);
    if (!auth.currentUser) return this.inMemoryCache.get(rosterId) || null;
    try {
      const snap = await getDoc(doc(db, 'projects', projectId, 'roster', rosterId));
      if (!snap.exists()) return this.inMemoryCache.get(rosterId) || null;
      return snap.data() as ProjectCarrierRosterEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return this.inMemoryCache.get(rosterId) || null;
    }
  }

  async listByProject(projectId: string): Promise<ProjectCarrierRosterEntity[]> {
    const path = this.getPath(projectId);
    if (!auth.currentUser) return Array.from(this.inMemoryCache.values()).filter(r => r.projectId === projectId);
    try {
      const q = query(collection(db, 'projects', projectId, 'roster'));
      const snap = await getDocs(q);
      const liveDocs = snap.docs.map(d => d.data() as ProjectCarrierRosterEntity);
      if (liveDocs.length === 0) {
        return Array.from(this.inMemoryCache.values()).filter(r => r.projectId === projectId);
      }
      return liveDocs;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return Array.from(this.inMemoryCache.values()).filter(r => r.projectId === projectId);
    }
  }

  async create(
    roster: Omit<ProjectCarrierRosterEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string },
    transaction?: Transaction
  ): Promise<void> {
    this.inMemoryCache.set(roster.rosterId, roster as ProjectCarrierRosterEntity);
    const path = this.getPath(roster.projectId, roster.rosterId);
    const docRef = doc(db, 'projects', roster.projectId, 'roster', roster.rosterId);
    const payload = sanitizeUndefined({
      ...roster,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (transaction) {
      transaction.set(docRef, payload);
      return;
    }
    if (!auth.currentUser) {
      console.warn(`[ProjectCarrierRosterRepository] Skipping live create for ${path}`);
      return;
    }
    try {
      await setDoc(docRef, payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async update(
    projectId: string, 
    rosterId: string, 
    updates: Partial<ProjectCarrierRosterEntity>, 
    updatedBy: string,
    transaction?: Transaction
  ): Promise<void> {
    const existing = this.inMemoryCache.get(rosterId);
    if (existing) {
      this.inMemoryCache.set(rosterId, { ...existing, ...updates, updatedBy });
    }
    const path = this.getPath(projectId, rosterId);
    const docRef = doc(db, 'projects', projectId, 'roster', rosterId);
    const payload = sanitizeUndefined({
      ...updates,
      rosterId,
      projectId,
      updatedAt: serverTimestamp(),
      updatedBy,
    });
    if (transaction) {
      transaction.update(docRef, payload);
      return;
    }
    if (!auth.currentUser) {
      console.warn(`[ProjectCarrierRosterRepository] Skipping live update for ${path}`);
      return;
    }
    try {
      await updateDoc(docRef, payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async delete(projectId: string, rosterId: string): Promise<void> {
    const path = this.getPath(projectId, rosterId);
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'roster', rosterId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeByProject(projectId: string, onData: (rosters: ProjectCarrierRosterEntity[]) => void) {
    if (!auth.currentUser) return () => {};
    const path = this.getPath(projectId);
    return onSnapshot(
      collection(db, 'projects', projectId, 'roster'),
      (snapshot) => {
        onData(snapshot.docs.map(d => d.data() as ProjectCarrierRosterEntity));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  }
}

export const projectCarrierRosterRepository = new ProjectCarrierRosterRepository();
