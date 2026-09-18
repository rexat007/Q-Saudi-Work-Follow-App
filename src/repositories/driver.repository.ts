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
import { DriverEntity } from '../types/entities';

export class DriverRepository {
  private inMemoryCache: Map<string, DriverEntity> = new Map();

  private getPath(projectId: string, driverId?: string): string {
    return driverId ? `projects/${projectId}/drivers/${driverId}` : `projects/${projectId}/drivers`;
  }

  async findById(projectId: string, driverId: string): Promise<DriverEntity | null> {
    const path = this.getPath(projectId, driverId);
    if (!auth.currentUser) {
      return this.inMemoryCache.get(driverId) || null;
    }
    try {
      const snap = await getDoc(doc(db, 'projects', projectId, 'drivers', driverId));
      if (!snap.exists()) return this.inMemoryCache.get(driverId) || null;
      return snap.data() as DriverEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return this.inMemoryCache.get(driverId) || null;
    }
  }

  async listByProject(projectId: string): Promise<DriverEntity[]> {
    const path = this.getPath(projectId);
    if (!auth.currentUser) {
      return Array.from(this.inMemoryCache.values()).filter(d => d.projectId === projectId);
    }
    try {
      const snap = await getDocs(collection(db, 'projects', projectId, 'drivers'));
      const liveDocs = snap.docs.map(d => d.data() as DriverEntity);
      if (liveDocs.length === 0) {
        return Array.from(this.inMemoryCache.values()).filter(d => d.projectId === projectId);
      }
      return liveDocs;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return Array.from(this.inMemoryCache.values()).filter(d => d.projectId === projectId);
    }
  }

  async create(
    driver: Omit<DriverEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string },
    transaction?: Transaction
  ): Promise<void> {
    this.inMemoryCache.set(driver.driverId, driver as DriverEntity);
    const path = this.getPath(driver.projectId, driver.driverId);
    const docRef = doc(db, 'projects', driver.projectId, 'drivers', driver.driverId);
    const payload = {
      ...driver,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (transaction) {
      transaction.set(docRef, payload);
      return;
    }
    if (!auth.currentUser) {
      console.warn(`[DriverRepository] User unauthenticated. Skipping live Firestore create for ${path}`);
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
    driverId: string, 
    updates: Partial<DriverEntity>, 
    updatedBy: string,
    transaction?: Transaction
  ): Promise<void> {
    const existing = this.inMemoryCache.get(driverId);
    if (existing) {
      this.inMemoryCache.set(driverId, { ...existing, ...updates, updatedBy });
    }
    const path = this.getPath(projectId, driverId);
    const docRef = doc(db, 'projects', projectId, 'drivers', driverId);
    const payload = {
      ...updates,
      driverId,
      projectId,
      updatedAt: serverTimestamp(),
      updatedBy,
    };
    if (transaction) {
      transaction.update(docRef, payload);
      return;
    }
    if (!auth.currentUser) {
      console.warn(`[DriverRepository] User unauthenticated. Skipping live Firestore update for ${path}`);
      return;
    }
    try {
      await updateDoc(docRef, payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  subscribeByProject(projectId: string, onData: (drivers: DriverEntity[]) => void) {
    if (!auth.currentUser) {
      return () => {};
    }
    const path = this.getPath(projectId);
    return onSnapshot(
      collection(db, 'projects', projectId, 'drivers'),
      (snapshot) => {
        onData(snapshot.docs.map(d => d.data() as DriverEntity));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  }
}

export const driverRepository = new DriverRepository();
