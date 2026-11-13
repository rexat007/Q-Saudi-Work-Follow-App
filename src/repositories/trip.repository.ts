import { sanitizeUndefined } from '../utils/sanitize';
import { decodeTrip } from '../utils/persistenceBoundary';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  getDocsFromServer,
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Transaction,
  documentId,
  startAfter
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { TripEntity, TripStatus } from '../types/entities';

export class TripRepository {
  /** Complete bounded report read; reaching the safety bound is an error, never
   * an apparently complete truncated export. Each page remains Rules-authorized. */
  async listCompleteByProject(projectId: string, maxRows = 50000): Promise<TripEntity[]> {
    const principal = auth.currentUser?.uid;
    if (!principal) throw new Error('UNAUTHENTICATED');
    if (!Number.isSafeInteger(maxRows) || maxRows < 1 || maxRows > 50000) throw new Error('INVALID_REPORT_BOUND');
    const rows: TripEntity[] = []; let cursor: any;
    for (;;) {
      if (auth.currentUser?.uid !== principal) throw new Error('AUTH_CONTEXT_CHANGED');
      const constraints = [orderBy(documentId()), limit(500), ...(cursor ? [startAfter(cursor)] : [])];
      const snapshot = await getDocsFromServer(query(collection(db, 'projects', projectId, 'trips'), ...constraints));
      if (auth.currentUser?.uid !== principal) throw new Error('AUTH_CONTEXT_CHANGED');
      if (rows.length + snapshot.docs.length > maxRows) throw new Error('REPORT_DATASET_LIMIT');
      rows.push(...snapshot.docs.map(d => decodeTrip<TripEntity>(d.data(), d.id, projectId)));
      if (snapshot.docs.length < 500) return rows;
      cursor = snapshot.docs.at(-1);
    }
  }
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
    const principal=auth.currentUser?.uid;
    if (!principal) {
      onError?.(new Error('UNAUTHENTICATED'));
      return () => {};
    }
    const path = this.getPath(projectId);
    return onSnapshot(
      collection(db, 'projects', projectId, 'trips'),
      (snapshot) => {
        if(auth.currentUser?.uid!==principal)return;
        onData(snapshot.docs.map(d => decodeTrip<TripEntity>(d.data(), d.id, projectId)));
      },
      (error) => {
        if(auth.currentUser?.uid!==principal)return;
        if (onError) {
          onError(error);
        } else handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  }
}

export const tripRepository = new TripRepository();
