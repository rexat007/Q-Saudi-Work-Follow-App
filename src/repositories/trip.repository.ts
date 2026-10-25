import { sanitizeUndefined } from '../utils/sanitize';
import { decodeTrip } from '../utils/persistenceBoundary';
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
      return decodeTrip<TripEntity>(snap.data(), tripId, projectId);
    } catch (error) {
      if ((error as any)?.code === 'PERSISTENCE_BOUNDARY_INVALID') throw error;
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
      return snap.docs.map(d => decodeTrip<TripEntity>(d.data(), d.id, projectId));
    } catch (error) {
      if ((error as any)?.code === 'PERSISTENCE_BOUNDARY_INVALID') throw error;
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
      return snap.docs.map(d => decodeTrip<TripEntity>(d.data(), d.id, projectId));
    } catch (error) {
      if ((error as any)?.code === 'PERSISTENCE_BOUNDARY_INVALID') throw error;
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async create(
    trip: Omit<TripEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string },
    transaction?: Transaction
  ): Promise<void> {
    throw new Error('TRIP_COMMAND_REQUIRED');
  }

  async update(
    projectId: string, 
    tripId: string, 
    updates: Partial<TripEntity>, 
    updatedBy: string,
    transaction?: Transaction
  ): Promise<void> {
    throw new Error('TRIP_COMMAND_REQUIRED');
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
      return decodeTrip<TripEntity>(snap.docs[0].data(), snap.docs[0].id, projectId);
    } catch (error) {
      if ((error as any)?.code === 'PERSISTENCE_BOUNDARY_INVALID') throw error;
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
        onData(snapshot.docs.map(d => decodeTrip<TripEntity>(d.data(), d.id, projectId)));
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
