import { 
  collection, 
  collectionGroup,
  query,
  where,
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { TripExceptionEntity } from '../types/entities';

export class ExceptionRepository {
  private getPath(projectId: string, tripId: string | null, exceptionId?: string): string {
    const safeTrip = tripId || '_general';
    return exceptionId 
      ? `projects/${projectId}/trips/${safeTrip}/exceptions/${exceptionId}` 
      : `projects/${projectId}/trips/${safeTrip}/exceptions`;
  }

  async listByTrip(projectId: string, tripId: string): Promise<TripExceptionEntity[]> {
    const path = this.getPath(projectId, tripId);
    if (!auth.currentUser) {
      return [];
    }
    try {
      const snap = await getDocs(collection(db, 'projects', projectId, 'trips', tripId, 'exceptions'));
      return snap.docs.map(d => d.data() as TripExceptionEntity);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async create(exception: Omit<TripExceptionEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }): Promise<void> {
    const path = this.getPath(exception.projectId, exception.tripId, exception.exceptionId);
    if (!auth.currentUser) {
      console.warn(`[ExceptionRepository] User unauthenticated. Skipping live Firestore create for ${path}`);
      return;
    }
    try {
      const safeTrip = exception.tripId || '_general';
      const payload = {
        ...exception,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'projects', exception.projectId, 'trips', safeTrip, 'exceptions', exception.exceptionId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async update(projectId: string, tripId: string | null, exceptionId: string, updates: Partial<TripExceptionEntity>, updatedBy: string): Promise<void> {
    const path = this.getPath(projectId, tripId, exceptionId);
    if (!auth.currentUser) {
      console.warn(`[ExceptionRepository] User unauthenticated. Skipping live Firestore update for ${path}`);
      return;
    }
    try {
      const safeTrip = tripId || '_general';
      const payload = {
        ...updates,
        exceptionId,
        tripId,
        projectId,
        updatedAt: serverTimestamp(),
        updatedBy,
      };
      await updateDoc(doc(db, 'projects', projectId, 'trips', safeTrip, 'exceptions', exceptionId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  subscribeByTrip(projectId: string, tripId: string, onData: (exceptions: TripExceptionEntity[]) => void) {
    if (!auth.currentUser) {
      return () => {};
    }
    const path = this.getPath(projectId, tripId);
    return onSnapshot(
      collection(db, 'projects', projectId, 'trips', tripId, 'exceptions'),
      (snapshot) => {
        onData(snapshot.docs.map(d => d.data() as TripExceptionEntity));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  }

  subscribeByProject(
    projectId: string, 
    onData: (exceptions: TripExceptionEntity[]) => void,
    onError?: (error: Error) => void
  ) {
    if (!auth.currentUser) {
      return () => {};
    }
    const path = `projects/${projectId}/exceptions`;
    const q = query(
      collectionGroup(db, 'exceptions'),
      where('projectId', '==', projectId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        onData(snapshot.docs.map(d => d.data() as TripExceptionEntity));
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

export const exceptionRepository = new ExceptionRepository();
