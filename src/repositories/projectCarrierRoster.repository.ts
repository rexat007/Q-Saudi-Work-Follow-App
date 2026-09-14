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
  where
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { ProjectCarrierRosterEntity } from '../types/entities';

export class ProjectCarrierRosterRepository {
  private getPath(projectId: string, rosterId?: string): string {
    return rosterId ? `projects/${projectId}/roster/${rosterId}` : `projects/${projectId}/roster`;
  }

  async findById(projectId: string, rosterId: string): Promise<ProjectCarrierRosterEntity | null> {
    const path = this.getPath(projectId, rosterId);
    if (!auth.currentUser) return null;
    try {
      const snap = await getDoc(doc(db, 'projects', projectId, 'roster', rosterId));
      if (!snap.exists()) return null;
      return snap.data() as ProjectCarrierRosterEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  async listByProject(projectId: string): Promise<ProjectCarrierRosterEntity[]> {
    const path = this.getPath(projectId);
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'projects', projectId, 'roster'));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as ProjectCarrierRosterEntity);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async create(roster: Omit<ProjectCarrierRosterEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }): Promise<void> {
    const path = this.getPath(roster.projectId, roster.rosterId);
    if (!auth.currentUser) {
      console.warn(`[ProjectCarrierRosterRepository] Skipping live create for ${path}`);
      return;
    }
    try {
      const payload = {
        ...roster,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'projects', roster.projectId, 'roster', roster.rosterId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async update(projectId: string, rosterId: string, updates: Partial<ProjectCarrierRosterEntity>, updatedBy: string): Promise<void> {
    const path = this.getPath(projectId, rosterId);
    if (!auth.currentUser) {
      console.warn(`[ProjectCarrierRosterRepository] Skipping live update for ${path}`);
      return;
    }
    try {
      const payload = {
        ...updates,
        rosterId,
        projectId,
        updatedAt: serverTimestamp(),
        updatedBy,
      };
      await updateDoc(doc(db, 'projects', projectId, 'roster', rosterId), payload);
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
