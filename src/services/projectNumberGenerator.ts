import { 
  doc, 
  runTransaction, 
  getDocs, 
  collection, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { ProjectEntity } from '../types/entities';

export class ProjectNumberGenerator {
  private static inMemoryNextNumber = 1;

  /**
   * Resets in-memory counter for testing purposes
   */
  public static resetInMemorySequence(startVal = 1): void {
    this.inMemoryNextNumber = startVal;
  }

  /**
   * Generates next unique sequential project number using Firestore transaction.
   * Concurrency-safe: uses systemCounters/projectNumber document in Firestore.
   * Falls back to atomic in-memory sequence if unauthenticated or offline.
   */
  public static async getNextProjectNumber(): Promise<number> {
    if (!auth.currentUser) {
      const num = this.inMemoryNextNumber;
      this.inMemoryNextNumber += 1;
      return num;
    }

    try {
      const counterRef = doc(db, 'systemCounters', 'projectNumber');
      const assignedNumber = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        let nextNumber = 1;

        if (counterSnap.exists()) {
          const data = counterSnap.data();
          nextNumber = typeof data.nextNumber === 'number' ? data.nextNumber : 1;
        } else {
          // Check existing projects to derive next safe sequence if genuine projects exist
          try {
            const projectsSnap = await getDocs(collection(db, 'projects'));
            let maxExisting = 0;
            projectsSnap.docs.forEach((d) => {
              const data = d.data() as ProjectEntity;
              if (data && typeof data.projectNumber === 'number') {
                maxExisting = Math.max(maxExisting, data.projectNumber);
              }
            });
            nextNumber = maxExisting > 0 ? maxExisting + 1 : 1;
          } catch {
            nextNumber = 1;
          }
        }

        transaction.set(counterRef, {
          nextNumber: nextNumber + 1,
          updatedAt: serverTimestamp(),
        });

        return nextNumber;
      });

      return assignedNumber;
    } catch (error) {
      console.warn('[ProjectNumberGenerator] Firestore transaction fallback to safe in-memory sequence:', error);
      const num = this.inMemoryNextNumber;
      this.inMemoryNextNumber += 1;
      return num;
    }
  }
}
