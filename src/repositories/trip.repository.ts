import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Transaction
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { TripEntity, TripStatus } from '../types/entities';

export class TripRepository {
  private getPath(projectId: string, tripId?: string): string {
    return tripId ? `projects/${projectId}/trips/${tripId}` : `projects/${projectId}/trips`;
  }

  async findById(projectId: string, tripId: string): Promise<TripEntity | null> {
    const path = this.getPath(projectId, tripId);
    if (!auth.currentUser) {
      return null;
    }
    try {
      const snap = await getDoc(doc(db, 'projects', projectId, 'trips', tripId));
      if (!snap.exists()) return null;
      return snap.data() as TripEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  async listByProject(projectId: string, maxLimit = 100): Promise<TripEntity[]> {
    const path = this.getPath(projectId);
    if (!auth.currentUser) {
      return [];
    }
    try {
      const q = query(
        collection(db, 'projects', projectId, 'trips'),
        orderBy('createdAt', 'desc'),
        limit(maxLimit)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as TripEntity);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async listByStatus(projectId: string, status: TripStatus): Promise<TripEntity[]> {
    const path = this.getPath(projectId);
    if (!auth.currentUser) {
      return [];
    }
    try {
      const q = query(
        collection(db, 'projects', projectId, 'trips'),
        where('status', '==', status)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as TripEntity);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async create(
    trip: Omit<TripEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string },
    transaction?: Transaction
  ): Promise<void> {
    const path = this.getPath(trip.projectId, trip.tripId);
    const docRef = doc(db, 'projects', trip.projectId, 'trips', trip.tripId);
    const payload = {
      ...trip,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (transaction) {
      transaction.set(docRef, payload);
      return;
    }
    if (!auth.currentUser) {
      console.warn(`[TripRepository] User unauthenticated. Skipping live Firestore create for ${path}`);
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
    tripId: string, 
    updates: Partial<TripEntity>, 
    updatedBy: string,
    transaction?: Transaction
  ): Promise<void> {
    const path = this.getPath(projectId, tripId);
    const docRef = doc(db, 'projects', projectId, 'trips', tripId);
    const payload = {
      ...updates,
      tripId,
      projectId,
      updatedAt: serverTimestamp(),
      updatedBy,
    };
    if (transaction) {
      transaction.update(docRef, payload);
      return;
    }
    if (!auth.currentUser) {
      console.warn(`[TripRepository] User unauthenticated. Skipping live Firestore update for ${path}`);
      return;
    }
    try {
      await updateDoc(docRef, payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async findByTripNumber(projectId: string, tripNumber: string): Promise<TripEntity | null> {
    const path = this.getPath(projectId);
    if (!auth.currentUser) return null;
    try {
      const q = query(
        collection(db, 'projects', projectId, 'trips'),
        where('tripNumber', '==', tripNumber),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data() as TripEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  subscribeByProject(
    projectId: string, 
    onData: (trips: TripEntity[]) => void,
    onError?: (error: Error) => void
  ) {
    if (!auth.currentUser) {
      return () => {};
    }
    const path = this.getPath(projectId);
    return onSnapshot(
      collection(db, 'projects', projectId, 'trips'),
      (snapshot) => {
        onData(snapshot.docs.map(d => d.data() as TripEntity));
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

export const tripRepository = new TripRepository();
