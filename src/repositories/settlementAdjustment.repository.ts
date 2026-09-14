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
import { SettlementAdjustmentEntity } from '../types/entities';

export class SettlementAdjustmentRepository {
  private getPath(projectId: string, tripId: string, adjustmentId?: string): string {
    return adjustmentId 
      ? `projects/${projectId}/trips/${tripId}/adjustments/${adjustmentId}` 
      : `projects/${projectId}/trips/${tripId}/adjustments`;
  }

  async findById(projectId: string, tripId: string, adjustmentId: string): Promise<SettlementAdjustmentEntity | null> {
    const path = this.getPath(projectId, tripId, adjustmentId);
    if (!auth.currentUser) return null;
    try {
      const snap = await getDoc(doc(db, 'projects', projectId, 'trips', tripId, 'adjustments', adjustmentId));
      if (!snap.exists()) return null;
      return snap.data() as SettlementAdjustmentEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  async listByTrip(projectId: string, tripId: string): Promise<SettlementAdjustmentEntity[]> {
    const path = this.getPath(projectId, tripId);
    if (!auth.currentUser) return [];
    try {
      const q = query(collection(db, 'projects', projectId, 'trips', tripId, 'adjustments'));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as SettlementAdjustmentEntity);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async create(adj: Omit<SettlementAdjustmentEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }): Promise<void> {
    const path = this.getPath(adj.projectId, adj.tripId, adj.adjustmentId);
    if (!auth.currentUser) {
      console.warn(`[SettlementAdjustmentRepository] Skipping live create for ${path}`);
      return;
    }
    try {
      const payload = {
        ...adj,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'projects', adj.projectId, 'trips', adj.tripId, 'adjustments', adj.adjustmentId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async update(projectId: string, tripId: string, adjustmentId: string, updates: Partial<SettlementAdjustmentEntity>, updatedBy: string): Promise<void> {
    const path = this.getPath(projectId, tripId, adjustmentId);
    if (!auth.currentUser) {
      console.warn(`[SettlementAdjustmentRepository] Skipping live update for ${path}`);
      return;
    }
    try {
      const payload = {
        ...updates,
        adjustmentId,
        tripId,
        projectId,
        updatedAt: serverTimestamp(),
        updatedBy,
      };
      await updateDoc(doc(db, 'projects', projectId, 'trips', tripId, 'adjustments', adjustmentId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async delete(projectId: string, tripId: string, adjustmentId: string): Promise<void> {
    const path = this.getPath(projectId, tripId, adjustmentId);
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'trips', tripId, 'adjustments', adjustmentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeByTrip(projectId: string, tripId: string, onData: (adjustments: SettlementAdjustmentEntity[]) => void) {
    if (!auth.currentUser) return () => {};
    const path = this.getPath(projectId, tripId);
    return onSnapshot(
      collection(db, 'projects', projectId, 'trips', tripId, 'adjustments'),
      (snapshot) => {
        onData(snapshot.docs.map(d => d.data() as SettlementAdjustmentEntity));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  }
}

export const settlementAdjustmentRepository = new SettlementAdjustmentRepository();
