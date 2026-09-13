import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
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
      return snap.data() as UserEntity;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  async listAll(): Promise<UserEntity[]> {
    if (!auth.currentUser) {
      return [];
    }
    try {
      const snap = await getDocs(collection(db, this.collectionName));
      return snap.docs.map(d => d.data() as UserEntity);
    } catch (error) {
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
      const payload = {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, this.collectionName, user.userId), payload);
    } catch (error) {
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
      const payload = {
        ...updates,
        userId,
        updatedAt: serverTimestamp(),
        updatedBy,
      };
      await updateDoc(doc(db, this.collectionName, userId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  subscribeToUsers(onData: (users: UserEntity[]) => void) {
    if (!auth.currentUser) {
      return () => {};
    }
    return onSnapshot(
      collection(db, this.collectionName),
      (snapshot) => {
        onData(snapshot.docs.map(d => d.data() as UserEntity));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, this.collectionName);
      }
    );
  }
}

export const userRepository = new UserRepository();
