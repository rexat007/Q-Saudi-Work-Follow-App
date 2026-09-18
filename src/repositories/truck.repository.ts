import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot,
  Transaction 
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { TruckEntity } from '../types/entities';

export class TruckRepository {
  private inMemoryCache: Map<string, TruckEntity> = new Map();

  private getPath(projectId: string, truckId?: string): string {
    return truckId ? `projects/${projectId}/trucks/${truckId}` : `projects/${projectId}/trucks`;
  }

  async findById(projectId: string, truckId: string): Promise<TruckEntity | null> {
    const path = this.getPath(projectId, truckId);
    if (!auth.currentUser) {
      return this.inMemoryCache.get(truckId) || null;
    }
    try {
      const snap = await getDoc(doc(db, 'projects', projectId, 'trucks', truckId));
      if (!snap.exists()) return this.inMemoryCache.get(truckId) || null;
      return snap.data() as TruckEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return this.inMemoryCache.get(truckId) || null;
    }
  }

  async listByProject(projectId: string): Promise<TruckEntity[]> {
    const path = this.getPath(projectId);
    if (!auth.currentUser) {
      return Array.from(this.inMemoryCache.values()).filter(t => t.projectId === projectId);
    }
    try {
      const snap = await getDocs(collection(db, 'projects', projectId, 'trucks'));
      const liveDocs = snap.docs.map(d => d.data() as TruckEntity);
      if (liveDocs.length === 0) {
        return Array.from(this.inMemoryCache.values()).filter(t => t.projectId === projectId);
      }
      return liveDocs;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return Array.from(this.inMemoryCache.values()).filter(t => t.projectId === projectId);
    }
  }

  async create(
    truck: Omit<TruckEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string },
    transaction?: Transaction
  ): Promise<void> {
    this.inMemoryCache.set(truck.truckId, truck as TruckEntity);
    const path = this.getPath(truck.projectId, truck.truckId);
    const docRef = doc(db, 'projects', truck.projectId, 'trucks', truck.truckId);
    const payload = {
      ...truck,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (transaction) {
      transaction.set(docRef, payload);
      return;
    }
    if (!auth.currentUser) {
      console.warn(`[TruckRepository] User unauthenticated. Skipping live Firestore create for ${path}`);
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
    truckId: string, 
    updates: Partial<TruckEntity>, 
    updatedBy: string,
    transaction?: Transaction
  ): Promise<void> {
    const existing = this.inMemoryCache.get(truckId);
    if (existing) {
      this.inMemoryCache.set(truckId, { ...existing, ...updates, updatedBy });
    }
    const path = this.getPath(projectId, truckId);
    const docRef = doc(db, 'projects', projectId, 'trucks', truckId);
    const payload = {
      ...updates,
      truckId,
      projectId,
      updatedAt: serverTimestamp(),
      updatedBy,
    };
    if (transaction) {
      transaction.update(docRef, payload);
      return;
    }
    if (!auth.currentUser) {
      console.warn(`[TruckRepository] User unauthenticated. Skipping live Firestore update for ${path}`);
      return;
    }
    try {
      await updateDoc(docRef, payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  subscribeByProject(
    projectId: string, 
    onData: (trucks: TruckEntity[]) => void,
    onError?: (err: Error) => void
  ) {
    if (!auth.currentUser) {
      return () => {};
    }
    const path = this.getPath(projectId);
    return onSnapshot(
      collection(db, 'projects', projectId, 'trucks'),
      (snapshot) => {
        onData(snapshot.docs.map(d => d.data() as TruckEntity));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) {
          onError(error);
        }
      }
    );
  }
}

export const truckRepository = new TruckRepository();
