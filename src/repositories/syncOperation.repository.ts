import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  Transaction 
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

  async create(
    op: Omit<SyncOperationEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string },
    transaction?: Transaction
  ): Promise<void> {
    const path = this.getPath(op.projectId, op.operationId);
    const docRef = doc(db, 'projects', op.projectId, 'sync_operations', op.operationId);
    const payload = {
      ...op,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (transaction) {
      transaction.set(docRef, payload);
      return;
    }
    if (!auth.currentUser) {
      console.warn(`[SyncOperationRepository] User unauthenticated. Skipping live Firestore create for ${path}`);
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
    operationId: string,
    updates: Partial<SyncOperationEntity>,
    updatedBy: string,
    transaction?: Transaction
  ): Promise<void> {
    const path = this.getPath(projectId, operationId);
    const docRef = doc(db, 'projects', projectId, 'sync_operations', operationId);
    const payload = {
      ...updates,
      operationId,
      projectId,
      updatedAt: serverTimestamp(),
      updatedBy,
    };
    if (transaction) {
      transaction.update(docRef, payload);
      return;
    }
    if (!auth.currentUser) {
      console.warn(`[SyncOperationRepository] User unauthenticated. Skipping live Firestore update for ${path}`);
      return;
    }
    try {
      await updateDoc(docRef, payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
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
