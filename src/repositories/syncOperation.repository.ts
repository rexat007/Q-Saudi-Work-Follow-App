import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { SyncOperationEntity } from '../types/entities';

export class SyncOperationRepository {
  private getPath(projectId: string, operationId?: string): string {
    return operationId 
      ? `projects/${projectId}/sync_operations/${operationId}` 
      : `projects/${projectId}/sync_operations`;
  }

  async findById(projectId: string, operationId: string): Promise<SyncOperationEntity | null> {
    const path = this.getPath(projectId, operationId);
    if (!auth.currentUser) {
      return null;
    }
    try {
      const snap = await getDoc(doc(db, 'projects', projectId, 'sync_operations', operationId));
      if (!snap.exists()) return null;
      return snap.data() as SyncOperationEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  async create(op: Omit<SyncOperationEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }): Promise<void> {
    const path = this.getPath(op.projectId, op.operationId);
    if (!auth.currentUser) {
      console.warn(`[SyncOperationRepository] User unauthenticated. Skipping live Firestore create for ${path}`);
      return;
    }
    try {
      const payload = {
        ...op,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'projects', op.projectId, 'sync_operations', op.operationId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async listByProject(projectId: string): Promise<SyncOperationEntity[]> {
    const path = this.getPath(projectId);
    if (!auth.currentUser) {
      return [];
    }
    try {
      const snap = await getDocs(collection(db, 'projects', projectId, 'sync_operations'));
      return snap.docs.map(d => d.data() as SyncOperationEntity);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }
}

export const syncOperationRepository = new SyncOperationRepository();
