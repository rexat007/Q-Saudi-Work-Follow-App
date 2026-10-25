import { decodeUser } from '../utils/persistenceBoundary';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot, query, where
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { sanitizeUndefined } from '../utils/sanitize';
import { UserEntity } from '../types/entities';

export class UserRepository {
  private readonly collectionName = 'users';

  async findById(userId: string): Promise<UserEntity | null> {
    const path = `${this.collectionName}/${userId}`;
    if (!auth.currentUser) {
      return null;
    }
    try {
      const snap = await getDoc(doc(db, this.collectionName, userId));
      if (!snap.exists()) return null;
      return decodeUser<UserEntity>(snap.data(), userId);
    } catch (error) {
      if ((error as any)?.code === 'PERSISTENCE_BOUNDARY_INVALID') throw error;
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  async listAll(): Promise<UserEntity[]> {
    if (!auth.currentUser) {
      return [];
    }
    try {
      const snap = await getDocs(collection(db, this.collectionName));
      return snap.docs.map(d => decodeUser<UserEntity>(d.data(), d.id));
    } catch (error) {
      if ((error as any)?.code === 'PERSISTENCE_BOUNDARY_INVALID') throw error;
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
    }
  }

  async create(user: Omit<UserEntity, 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }): Promise<void> {
    const path = `${this.collectionName}/${user.userId}`;
    if (!auth.currentUser) {
      console.warn(`[UserRepository] User unauthenticated. Skipping live Firestore create for ${path}`);
      return;
    }
    try {
      const payload = sanitizeUndefined({
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, this.collectionName, user.userId), payload);
    } catch (error) {
      if ((error as any)?.code === 'PERSISTENCE_BOUNDARY_INVALID') throw error;
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async update(userId: string, updates: Partial<UserEntity>, updatedBy: string): Promise<void> {
    const path = `${this.collectionName}/${userId}`;
    if (!auth.currentUser) {
      console.warn(`[UserRepository] User unauthenticated. Skipping live Firestore update for ${path}`);
      return;
    }
    try {
      const payload = sanitizeUndefined({
        ...updates,
        userId,
        updatedAt: serverTimestamp(),
        updatedBy,
      });
      await updateDoc(doc(db, this.collectionName, userId), payload);
    } catch (error) {
      if ((error as any)?.code === 'PERSISTENCE_BOUNDARY_INVALID') throw error;
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  // Inverse view of the canonical profile field, never a second membership list.
  subscribeToProjectUsers(projectId: string, onData: (users: UserEntity[]) => void, onError: (error: Error) => void, includeUnassigned = false) {
    let active = true;
    onData([]);
    if (!auth.currentUser || !projectId) return () => { active = false; };
    const users = collection(db, this.collectionName);
    const source = includeUnassigned ? users : query(users, where('assignedProjectIds', 'array-contains', projectId));
    const unsubscribe = onSnapshot(source, snapshot => {
      if (!active) return;
      try { onData(snapshot.docs.map(d => decodeUser<UserEntity>(d.data(), d.id))); }
      catch (error) { onData([]); onError(error as Error); }
    }, error => { if (active) { onData([]); onError(error); } });
    return () => { active = false; unsubscribe(); };
  }

  subscribeToUsers(onData: (users: UserEntity[]) => void) {
    if (!auth.currentUser) {
      return () => {};
    }
    return onSnapshot(
      collection(db, this.collectionName),
      (snapshot) => {
        onData(snapshot.docs.map(d => decodeUser<UserEntity>(d.data(), d.id)));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, this.collectionName);
      }
    );
  }
}

export const userRepository = new UserRepository();
